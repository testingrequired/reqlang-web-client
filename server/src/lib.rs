use std::{collections::HashMap, env::current_dir, fs, path::PathBuf, sync::Arc};

use axum::{
    Json, Router,
    extract::{
        Path, Request, State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{any, get, post},
};
use axum_extra::extract::Host;
use clap::Parser;
use futures_util::{SinkExt, StreamExt};
use glob::glob;
use hyper::{body::Incoming, service::service_fn};
use hyper_util::{
    rt::{TokioExecutor, TokioIo},
    server,
};
use reqlang::{
    ast::Ast,
    export::RequestFormat,
    parser::parse,
    prelude::assert_response,
    types::{ParseResult, RequestParamsFromClient, http::HttpResponse},
};
use serde::{Deserialize, Serialize};
use serde_json::from_str;
use sqlx::{Pool, Sqlite, SqlitePool, migrate::Migrator, sqlite::SqliteConnectOptions};
use tokio::{
    net::TcpListener,
    spawn,
    sync::{
        Mutex,
        mpsc::{UnboundedSender, unbounded_channel},
    },
};
use tower::Service;
use tower_http::{compression::CompressionLayer, trace::TraceLayer};
use tracing::{error, info, info_span, instrument};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use types::{
    DebugInfo, RequestRunResponse,
    achievement::{AchievementDto, AchievementId},
    request_run::RequestRun,
    run_request::RunRequest,
    socket::ClientMessage,
};

#[cfg(not(feature = "development_mode"))]
use include_dir::include_dir;

#[cfg(feature = "development_mode")]
use tower_http::services::ServeDir;

#[cfg(not(feature = "development_mode"))]
use tower_serve_static::ServeDir as StaticServeDir;

use crate::services::{
    achievements_service,
    request_service::{self, run_request_from_params},
};

pub mod services;

static MIGRATOR: Migrator = sqlx::migrate!();

const DATABASE_URL_ENV_VAR: &'static str = "DATABASE_URL";
const DEFAULT_DB_FILENAME: &'static str = "reqlang.sqlite3";

#[derive(Debug)]
pub enum Error {
    Io(String),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        let Error::Io(printable) = self;

        write!(f, "{}", printable)
    }
}

impl From<std::io::Error> for Error {
    fn from(err: std::io::Error) -> Self {
        Error::Io(err.to_string())
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let Error::Io(body) = self;
        error!(body);
        (StatusCode::INTERNAL_SERVER_ERROR, body).into_response()
    }
}

#[derive(Clone, Debug)]
pub struct AppState {
    pub home_dir: PathBuf,
    pub db: Option<Pool<Sqlite>>,
    pub tx: Option<Arc<Mutex<UnboundedSender<String>>>>,
}

impl AppState {
    pub fn reset(&mut self) {}

    pub fn set_db(&mut self, db: Option<Pool<Sqlite>>) {
        self.db = db;
    }
}

#[derive(Parser)]
pub struct Args {
    /// Set which port to use (default: random)
    #[arg(long)]
    pub port: Option<u16>,
    /// Open the URL in a browser after starting the server (default: true)
    #[arg(long)]
    pub open: Option<bool>,
    /// Path to sqlite3 database file
    #[arg(long)]
    pub db: Option<String>,
}

pub struct AppServer(TcpListener, Router);

impl AppServer {
    pub async fn start<F>(self, on_ready: &F) -> Result<(), Error>
    where
        F: Fn(),
    {
        let Self(listener, router) = self;

        // Call `on_ready` only once
        let mut called_ready = false;
        loop {
            if !called_ready {
                on_ready();
                called_ready = true;
            }

            let pending_accept = listener.accept();

            let (socket, _remote_addr) = pending_accept.await.unwrap();

            let tower_service = router.clone();

            spawn(async move {
                let socket = TokioIo::new(socket);

                let hyper_service = service_fn(move |request: Request<Incoming>| {
                    tower_service.clone().call(request)
                });

                if let Err(err) = server::conn::auto::Builder::new(TokioExecutor::new())
                    .serve_connection_with_upgrades(socket, hyper_service)
                    .await
                {
                    error!("failed to serve connection: {err:#}");
                }
            });
        }
    }

    pub fn url(&self) -> String {
        let Self(listener, _) = self;
        let url = format!("http://{}", listener.local_addr().expect("should get url"));

        url
    }
}

pub async fn init_server(
    port: Option<u16>,
    db: Option<String>,
    open: bool,
) -> Result<AppServer, Error> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                // axum logs rejections from built-in extractors with the `axum::rejection`
                // target, at `TRACE` level. `axum::rejection=trace` enables showing those events
                format!(
                    "{}=info,tower_http=debug,axum::rejection=trace",
                    env!("CARGO_CRATE_NAME")
                )
                .into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Get port or default to a random port
    let port = port.unwrap_or(0);

    // Dynamically serve the static directory for development
    #[cfg(feature = "development_mode")]
    let static_dir = {
        info!("App starting in development mode");
        ServeDir::new(format!("{}/static", env!("CARGO_MANIFEST_DIR")))
    };

    // Package the files in static inside built binary
    #[cfg(not(feature = "development_mode"))]
    let static_dir = {
        use include_dir::Dir;

        info!("App starting in production mode");
        static ASSETS_DIR: Dir<'static> = include_dir!("$CARGO_MANIFEST_DIR/static");
        StaticServeDir::new(&ASSETS_DIR)
    };

    let current_dir_path = current_dir().expect("should have current directory");

    #[cfg(feature = "development_mode")]
    let current_dir_path = {
        let current_dir_path = current_dir_path.parent().unwrap().to_path_buf();
        dbg!(&current_dir_path);

        current_dir_path
    };

    // Default path to database in order of priority
    //
    // 1. Enivornment variable `$DATABASE_URL`
    // 2. User home directory  `$HOME/reqlang.sqlite3`
    // 3. Current directory    `$CWD/reqlang.sqlite3`
    let default_db_path = {
        let db_path_env_var = std::env::var(DATABASE_URL_ENV_VAR);

        let default_db_path = db_path_env_var.unwrap_or(
            current_dir_path
                .join(DEFAULT_DB_FILENAME)
                .to_string_lossy()
                .to_string(),
        );

        default_db_path
    };

    let db_pool = connect_to_db(db.unwrap_or(default_db_path)).await;

    let state = AppState {
        home_dir: current_dir_path,
        db: Some(db_pool),
        tx: None,
    };

    dbg!(&state);

    let state = Arc::new(Mutex::new(state));

    let listener = tokio::net::TcpListener::bind(format!("localhost:{}", port)).await?;
    let addr = listener.local_addr()?;
    let url = format!("http://{addr}");

    tracing::info!("listening on {}", url);

    if open && webbrowser::Browser::is_available() {
        webbrowser::open(&url).map_err(crate::Error::from)?;
    }

    let compression_layer: CompressionLayer =
        CompressionLayer::new().br(true).deflate(true).gzip(true);

    let app = Router::new()
        .route("/api/parse", post(parse_request_file))
        .route("/api/run", post(run_request))
        .route("/api/files", get(list_files))
        .route("/api/files/{*file}", get(get_file))
        .route(
            "/api/history",
            get(get_run_history).delete(delete_run_history),
        )
        .route("/api/diff_responses", post(diff_response))
        .route("/api/export_request", post(export_request))
        .route("/api/debug", get(get_debug_info))
        .route("/api/debug/achievement", post(trigger_test_achievement))
        .route("/api/achievements", get(get_achievements))
        .route("/api/ws", any(ws_handler))
        .fallback_service(static_dir.clone())
        .with_state(state)
        .layer(compression_layer)
        .layer(
            TraceLayer::new_for_http().make_span_with(|request: &Request<_>| {
                let path = Some(request.uri().to_string());

                info_span!(
                    "http_request",
                    method = ?request.method(),
                    path,
                )
            }),
        );

    Ok(AppServer(listener, app))
}

#[axum::debug_handler]
async fn get_run_history(
    State(state): State<Arc<Mutex<AppState>>>,
) -> (StatusCode, Result<Json<Vec<RequestRun>>, String>) {
    let results = request_service::get_run_history(state).await;
    (StatusCode::OK, Ok(Json(results)))
}

#[axum::debug_handler]
async fn delete_run_history(
    State(state): State<Arc<Mutex<AppState>>>,
) -> (StatusCode, Result<(), String>) {
    request_service::delete_run_history(state).await;
    (StatusCode::OK, Ok(()))
}

#[axum::debug_handler]
async fn list_files(
    State(state): State<Arc<Mutex<AppState>>>,
) -> (StatusCode, Result<Json<Vec<String>>, String>) {
    let cwd = {
        let state = state.lock().await;

        let cwd = state.home_dir.clone();

        cwd
    };

    let mut files = vec![];
    let mut errs = vec![];

    for entry in glob(&format!(
        "{}/**/*.reqlang",
        cwd.to_str().unwrap_or_default().to_string()
    ))
    .expect("Failed to read glob pattern")
    {
        match entry {
            Ok(path) => {
                files.push(
                    path.strip_prefix(&cwd)
                        .unwrap()
                        .to_str()
                        .unwrap()
                        .to_string(),
                );
            }
            Err(e) => {
                errs.push(e.to_string());
            }
        }
    }

    if errs.is_empty() {
        (StatusCode::OK, Ok(Json(files)))
    } else {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Err(serde_json::to_string_pretty(&errs).unwrap()),
        )
    }
}

#[axum::debug_handler]
async fn get_file(
    State(state): State<Arc<Mutex<AppState>>>,
    Path(file): Path<String>,
) -> (StatusCode, Result<String, String>) {
    let cwd = {
        let state = state.lock().await;

        let cwd = state.home_dir.clone();

        cwd
    };

    let file_path = cwd.join(file);

    if !fs::exists(&file_path).expect("unable to tell if file exists") {
        return (StatusCode::NOT_FOUND, Ok("file does not exist".to_string()));
    }

    match fs::read_to_string(file_path) {
        Ok(file_content) => (StatusCode::OK, Ok(file_content)),
        Err(err) => (StatusCode::INTERNAL_SERVER_ERROR, Err(err.to_string())),
    }
}

#[axum::debug_handler]
async fn export_request(
    Host(hostname): Host,
    Json(from_client_params): Json<RequestParamsFromClient>,
) -> (StatusCode, Result<String, String>) {
    let mut provider_values: HashMap<String, String> = HashMap::new();

    let env = from_client_params.env.as_deref();

    if let Some(env) = env {
        provider_values.insert("env".to_string(), env.to_string());
    }

    provider_values.insert("clientUrl".to_string(), format!("http://{hostname}"));

    let result = reqlang::templater::template(
        &from_client_params.reqfile,
        env,
        &from_client_params.prompts,
        &from_client_params.secrets,
        &provider_values,
    )
    .unwrap();
    let r = reqlang::export::export(&result.request, RequestFormat::HttpMessage);

    (StatusCode::OK, Ok(r))
}

#[derive(Deserialize)]
struct ParseRequestFile {
    payload: String,
}

async fn parse_request_file(
    Json(body): Json<ParseRequestFile>,
) -> (StatusCode, Result<String, String>) {
    let ast = Ast::from(&body.payload);
    let result = parse(&ast);

    match &result {
        Ok(result) => {
            let result: ParseResult = result.clone().into();

            match serde_json::to_string_pretty(&result) {
                Ok(result) => (StatusCode::OK, Ok(result)),
                Err(err) => (StatusCode::INTERNAL_SERVER_ERROR, Err(err.to_string())),
            }
        }
        Err(err) => match serde_json::to_string_pretty(err) {
            Ok(result) => (StatusCode::BAD_REQUEST, Err(result)),
            Err(err) => (StatusCode::INTERNAL_SERVER_ERROR, Err(err.to_string())),
        },
    }
}

#[derive(Serialize)]
struct RunRequestError {
    error: String,
}

async fn run_request(
    State(state): State<Arc<Mutex<AppState>>>,
    Host(hostname): Host,
    Json(run_request_from_client): Json<RunRequest>,
) -> (
    StatusCode,
    Result<Json<(RequestRunResponse, String)>, Json<RunRequestError>>,
) {
    let result = run_request_from_params(&hostname, &run_request_from_client, state).await;

    match result {
        Ok(result) => (StatusCode::OK, Ok(Json(result))),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Err(Json(RunRequestError {
                error: err.to_string(),
            })),
        ),
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct ResponseDiffRequest {
    pub expected: HttpResponse,
    pub actual: HttpResponse,
}

async fn diff_response(
    Json(ResponseDiffRequest { expected, actual }): Json<ResponseDiffRequest>,
) -> (StatusCode, String) {
    let diff = assert_response(&expected, &actual)
        .map_err(|err| err.to_string())
        .err()
        .unwrap_or("".to_string());

    (StatusCode::OK, diff)
}

async fn connect_to_db(db_path: String) -> Pool<Sqlite> {
    let db_pool = {
        let pool_options = SqliteConnectOptions::new()
            .filename(db_path)
            .create_if_missing(true);

        let pool = SqlitePool::connect_with(pool_options)
            .await
            .expect("should connect to db");

        let _ = MIGRATOR.run(&pool).await;

        pool
    };
    db_pool
}

#[instrument(skip(state))]
#[axum::debug_handler]
pub async fn trigger_test_achievement(State(state): State<Arc<Mutex<AppState>>>) -> StatusCode {
    let _ = achievements_service::complete_achievement(
        state.clone(),
        AchievementId::TESTING_ACHIEVEMENTS,
    )
    .await;

    StatusCode::NO_CONTENT
}

#[instrument(skip(state))]
#[axum::debug_handler]
pub async fn get_debug_info(
    State(state): State<Arc<Mutex<AppState>>>,
) -> (StatusCode, Json<DebugInfo>) {
    let state = state.clone();

    let cwd = {
        let state = state.lock().await;

        let cwd = state.home_dir.clone();

        cwd.to_str().unwrap_or_default().to_string()
    };

    let db = {
        let state = state.lock().await;
        let db = state
            .db
            .as_ref()
            .unwrap()
            .connect_options()
            .get_filename()
            .to_str()
            .unwrap_or_default()
            .to_string();

        db
    };

    let commit = env!("GIT_HASH").to_string();

    let debug_info = DebugInfo { cwd, db, commit };

    let _ = achievements_service::complete_achievement(state.clone(), AchievementId::WHATS_IN_HERE)
        .await;

    (StatusCode::OK, Json(debug_info))
}

pub async fn reset_app_state(State(state): State<Arc<Mutex<AppState>>>) -> StatusCode {
    let state = state.clone();
    let mut state = state.lock().await;

    state.reset();

    StatusCode::NO_CONTENT
}

#[axum::debug_handler]
#[instrument(skip(ws, state))]
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<Mutex<AppState>>>,
) -> impl IntoResponse {
    // finalize the upgrade process by returning upgrade callback.
    // we can customize the callback by sending additional info such as address.
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

#[instrument(skip(socket, state))]
async fn handle_socket(socket: WebSocket, state: Arc<Mutex<AppState>>) {
    info!("WebSocket connection established");

    let (tx, mut rx) = unbounded_channel::<String>();

    let (mut sender, mut reciever) = socket.split();

    {
        let mut locked_state = state.lock().await;
        locked_state.tx = Some(Arc::new(tx.into()));
    }

    let send_task = spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });

    // Keep reading from the socket to detect disconnects
    while let Some(Ok(msg)) = reciever.next().await {
        match msg {
            Message::Text(utf8_bytes) => {
                match from_str::<ClientMessage>(utf8_bytes.as_str()).unwrap() {
                    ClientMessage::Log { level, message } => {
                        info!("client log: [{level}] {message}");
                    }
                    ClientMessage::Navigation { from, to } => match from {
                        None => info!("client navigation to '{to}'"),
                        Some(from) => info!("client navigation from '{from}' to '{to}'"),
                    },
                }
            }
            Message::Close(_) => {
                info!("Closing connection");
                break;
            }
            _ => {}
        }
    }

    // Remove client and clean up
    {
        info!("Cleaning tx");
        let mut state = state.lock().await;

        state.tx = None;
    }

    send_task.abort();
}

pub async fn get_achievements(
    State(state): State<Arc<Mutex<AppState>>>,
) -> (StatusCode, Json<Vec<AchievementDto>>) {
    (
        StatusCode::OK,
        Json(achievements_service::get_achievements(state).await),
    )
}
