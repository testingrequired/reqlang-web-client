use std::{
    collections::HashMap,
    env::{current_dir, home_dir},
    path::PathBuf,
    sync::Arc,
};

use axum::{
    Json, Router,
    extract::{
        Path, Request, State,
        rejection::JsonRejection,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{any, delete, get, post},
};
use chrono::{Local, Utc};
use clap::Parser;
use futures_util::{SinkExt, StreamExt};
use hyper::{body::Incoming, service::service_fn};
use hyper_util::{
    rt::{TokioExecutor, TokioIo},
    server,
};
use reqlang::{
    ast::Ast,
    export::ResponseFormat,
    fetch::{Fetch, HttpRequestFetcher},
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
use tracing::{Level, error, event, info, info_span, instrument};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use types::{
    DebugInfo,
    achievement::{AchievementDto, AchievementId},
    bill::{BillDto, CreateBillDto, UpdateBillDto},
    debt::{CreateDebtDto, DebtDto, UpdateDebtDto},
    socket::ClientMessage,
    timeline::Timeline,
    transaction::{CreateTransactionDto, TransactionDto, UpdateTransactionDto},
};

mod utils;

#[cfg(not(feature = "development_mode"))]
use include_dir::include_dir;

#[cfg(feature = "development_mode")]
use tower_http::services::ServeDir;

#[cfg(not(feature = "development_mode"))]
use tower_serve_static::ServeDir as StaticServeDir;

use crate::services::{
    achievements_service, bills_service, debt_service, timeline_service, transactions_service,
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
    pub timeline_cache: Option<Timeline>,
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

    let app_home_path = home_dir().map(|home| home.join(".reqlang"));

    // Default path to database in order of priority
    //
    // 1. Enivornment variable `$DATABASE_URL`
    // 2. User home directory  `$HOME/reqlang.sqlite3`
    // 3. Current directory    `$CWD/reqlang.sqlite3`
    let default_db_path = {
        let db_path_env_var = std::env::var(DATABASE_URL_ENV_VAR);
        let current_dir_path = current_dir().expect("should have current directory");

        let default_db_path = db_path_env_var.unwrap_or(
            app_home_path
                .clone()
                .map(|home| home.join(DEFAULT_DB_FILENAME).to_string_lossy().to_string())
                .unwrap_or(
                    current_dir_path
                        .join(DEFAULT_DB_FILENAME)
                        .to_string_lossy()
                        .to_string(),
                ),
        );

        default_db_path
    };

    let db_pool = connect_to_db(db.unwrap_or(default_db_path)).await;

    let state = AppState {
        home_dir: app_home_path.expect("should have home directory"),
        db: Some(db_pool),
        timeline_cache: None,
        tx: None,
    };

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
        .route("/api/diff_responses", post(diff_response))
        .route("/api/export_response", post(export_response))
        .route("/api/calendar", post(view_calendar))
        .route("/api/timeline", get(get_timeline))
        .route("/api/debug/backup", post(backup_db))
        .route("/api/debug", get(get_debug_info))
        .route("/api/debug/achievement", post(trigger_test_achievement))
        .route("/api/state", delete(reset_app_state))
        .route(
            "/api/transactions",
            get(get_transactions).post(create_transaction),
        )
        .route(
            "/api/transactions/{id}",
            get(get_transaction)
                .put(update_transaction)
                .delete(delete_transaction),
        )
        .route("/api/bills", get(get_bills).post(create_bill))
        .route("/api/bills/next_dates", get(next_date_for_bills))
        .route(
            "/api/bills/{id}",
            get(get_bill).put(update_bill).delete(delete_bill),
        )
        .route("/api/bills/{id}/next_date", get(next_date_for_bill))
        .route("/api/debts", get(get_debts).post(create_debt))
        .route(
            "/api/debts/{id}",
            get(get_debt).put(update_debt).delete(delete_debt),
        )
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

async fn export_response(Json(body): Json<HttpResponse>) -> (StatusCode, Result<String, String>) {
    let r = reqlang::export::export_response(&body, ResponseFormat::HttpMessage);

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

async fn run_request(
    Json(from_client_params): Json<RequestParamsFromClient>,
) -> (StatusCode, Json<(HttpResponse, String)>) {
    let mut provider_values: HashMap<String, String> = HashMap::new();

    let env = from_client_params.env.as_deref();

    if let Some(env) = env {
        provider_values.insert("env".to_string(), env.to_string());
    }

    let response = Into::<HttpRequestFetcher>::into(from_client_params)
        .fetch()
        .await
        .expect("Request should have succeeded");

    let response_exported =
        reqlang::export::export_response(&response, ResponseFormat::HttpMessage);

    (StatusCode::OK, Json((response, response_exported)))
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
pub async fn backup_db(State(state): State<Arc<Mutex<AppState>>>) -> String {
    let state = state.clone();

    let backup_name = {
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        let datetime = Utc::now().format("%Y%m%d%H%M%S").to_string();

        let backup_name = state
            .home_dir
            .join(format!("backup.{datetime}.sqlite3"))
            .to_string_lossy()
            .to_string();

        let _ = sqlx::query(r#"VACUUM INTO $1"#)
            .bind(&backup_name)
            .execute(conn)
            .await;

        backup_name
    };

    let _ =
        achievements_service::complete_achievement(state.clone(), AchievementId::BACK_THAT_DB_UP)
            .await;

    backup_name
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

    // Get cwd
    let cwd = std::env::current_dir()
        .expect("should have current directory")
        .to_str()
        .unwrap_or_default()
        .to_string();

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

#[instrument(skip(state))]
#[axum::debug_handler]
pub async fn get_transactions(
    State(state): State<Arc<Mutex<AppState>>>,
) -> (StatusCode, Json<Vec<TransactionDto>>) {
    let transactions = transactions_service::get_transactions(state).await;

    (StatusCode::OK, Json(transactions))
}

#[instrument(skip(state))]
pub async fn get_transaction(
    State(state): State<Arc<Mutex<AppState>>>,
    Path(id): Path<i64>,
) -> Result<(StatusCode, Json<TransactionDto>), StatusCode> {
    match transactions_service::get_transaction(state, id).await {
        Some(result) => Ok((StatusCode::OK, Json(result))),
        None => Err(StatusCode::NOT_FOUND),
    }
}

#[instrument(skip(state))]
pub async fn create_transaction(
    State(state): State<Arc<Mutex<AppState>>>,
    payload: Result<Json<CreateTransactionDto>, JsonRejection>,
) -> (StatusCode, Result<Json<TransactionDto>, String>) {
    event!(Level::INFO, "Creating a transaction");
    match payload {
        Ok(Json(body)) => {
            let transaction = transactions_service::create_transaction(state, body)
                .await
                .expect("should be valid transaction");

            (StatusCode::CREATED, Ok(Json(transaction)))
        }
        Err(JsonRejection::JsonDataError(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(JsonRejection::JsonSyntaxError(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(JsonRejection::BytesRejection(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(_) => todo!(),
    }
}

pub async fn delete_transaction(
    State(state): State<Arc<Mutex<AppState>>>,
    Path(id): Path<i64>,
) -> StatusCode {
    match transactions_service::delete_transaction(state, id).await {
        Ok(_) => StatusCode::NO_CONTENT,
        Err(_) => StatusCode::NOT_FOUND,
    }
}

pub async fn update_transaction(
    State(state): State<Arc<Mutex<AppState>>>,
    Path(_): Path<u64>,
    payload: Result<Json<UpdateTransactionDto>, JsonRejection>,
) -> (StatusCode, Result<Json<TransactionDto>, String>) {
    match payload {
        Ok(Json(body)) => {
            let updated_transaction = transactions_service::update_transaction(state, body).await;

            match updated_transaction {
                Ok(updated_transaction) => (StatusCode::OK, Ok(Json(updated_transaction))),
                Err(err) => (StatusCode::NOT_FOUND, Err(err)),
            }
        }
        Err(JsonRejection::JsonDataError(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(JsonRejection::JsonSyntaxError(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(JsonRejection::BytesRejection(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(_) => todo!(),
    }
}

pub async fn get_bills(
    State(state): State<Arc<Mutex<AppState>>>,
) -> (StatusCode, Json<Vec<BillDto>>) {
    (StatusCode::OK, Json(bills_service::get_bills(state).await))
}

#[instrument(skip(state))]
#[axum::debug_handler]
pub async fn get_bill(
    State(state): State<Arc<Mutex<AppState>>>,
    Path(id): Path<i64>,
) -> Result<(StatusCode, Json<BillDto>), (StatusCode, String)> {
    info!("Getting bill with ID: {id}");
    match bills_service::get_bill(state, id).await {
        Ok(bill) => Ok((StatusCode::OK, Json(bill))),
        Err(err) => Err((StatusCode::INTERNAL_SERVER_ERROR, err)),
    }
}

pub async fn update_bill(
    State(state): State<Arc<Mutex<AppState>>>,
    Path(_): Path<u64>,
    payload: Result<Json<UpdateBillDto>, JsonRejection>,
) -> (StatusCode, Result<Json<BillDto>, String>) {
    match payload {
        Ok(Json(body)) => {
            let updated_bill = bills_service::update_bill(state, body).await;

            match updated_bill {
                Ok(updated_bill) => (StatusCode::OK, Ok(Json(updated_bill))),
                Err(err) => (StatusCode::NOT_FOUND, Err(err)),
            }
        }
        Err(JsonRejection::JsonDataError(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(JsonRejection::JsonSyntaxError(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(JsonRejection::BytesRejection(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(_) => todo!(),
    }
}

pub async fn delete_bill(
    State(state): State<Arc<Mutex<AppState>>>,
    Path(id): Path<i64>,
) -> StatusCode {
    match bills_service::delete_bill(state, id).await {
        Ok(_) => StatusCode::NO_CONTENT,
        Err(_) => StatusCode::NOT_FOUND,
    }
}

#[instrument(skip(state))]
pub async fn create_bill(
    State(state): State<Arc<Mutex<AppState>>>,
    payload: Result<Json<CreateBillDto>, JsonRejection>,
) -> (StatusCode, Result<Json<BillDto>, String>) {
    event!(Level::INFO, "Creating a bill");
    match payload {
        Ok(Json(body)) => {
            let bill = bills_service::create_bill(state, body)
                .await
                .expect("should be valid bill");

            (StatusCode::CREATED, Ok(Json(bill)))
        }
        Err(JsonRejection::JsonDataError(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(JsonRejection::JsonSyntaxError(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(JsonRejection::BytesRejection(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(_) => todo!(),
    }
}

pub async fn next_date_for_bill(
    State(state): State<Arc<Mutex<AppState>>>,
    Path(id): Path<i64>,
) -> (StatusCode, Result<Json<String>, String>) {
    match bills_service::get_bill_next_date(state, id).await {
        Ok(date) => (StatusCode::OK, Ok(Json(date))),
        Err(err) => (StatusCode::INTERNAL_SERVER_ERROR, Err(err)),
    }
}

pub async fn next_date_for_bills(
    State(state): State<Arc<Mutex<AppState>>>,
) -> (StatusCode, Result<Json<Vec<(i64, String)>>, String>) {
    match bills_service::get_next_date_for_bills(state).await {
        Ok(next_dates) => (StatusCode::OK, Ok(Json(next_dates))),
        Err(err) => (StatusCode::INTERNAL_SERVER_ERROR, Err(err)),
    }
}

pub async fn get_timeline(
    State(state): State<Arc<Mutex<AppState>>>,
) -> (StatusCode, Result<Json<Timeline>, String>) {
    let timeline = timeline_service::get_timeline(state, &Local::now()).await;

    (StatusCode::OK, Ok(Json(timeline)))
}

pub async fn get_timeline_on_date(
    State(state): State<Arc<Mutex<AppState>>>,
    Path(timeline_date): Path<String>,
) -> (StatusCode, Result<Json<Timeline>, String>) {
    let timeline = timeline_service::get_timeline(state, &Local::now()).await;

    timeline.get_rolling_balance_on_date(&timeline_date);

    (StatusCode::OK, Ok(Json(timeline)))
}

pub async fn get_debts(
    State(state): State<Arc<Mutex<AppState>>>,
) -> (StatusCode, Json<Vec<DebtDto>>) {
    (StatusCode::OK, Json(debt_service::get_debts(state).await))
}

#[instrument(skip(state))]
#[axum::debug_handler]
pub async fn get_debt(
    State(state): State<Arc<Mutex<AppState>>>,
    Path(id): Path<i64>,
) -> Result<(StatusCode, Json<DebtDto>), (StatusCode, String)> {
    match debt_service::get_debt(state, id).await {
        Ok(debt) => Ok((StatusCode::OK, Json(debt))),
        Err(err) => Err((StatusCode::INTERNAL_SERVER_ERROR, err)),
    }
}

pub async fn update_debt(
    State(state): State<Arc<Mutex<AppState>>>,
    Path(_): Path<u64>,
    payload: Result<Json<UpdateDebtDto>, JsonRejection>,
) -> (StatusCode, Result<Json<DebtDto>, String>) {
    match payload {
        Ok(Json(body)) => {
            let updated_debt = debt_service::update_debt(state, body).await;

            match updated_debt {
                Ok(updated_debt) => (StatusCode::OK, Ok(Json(updated_debt))),
                Err(err) => {
                    error!("{err}");

                    (StatusCode::NOT_FOUND, Err(err))
                }
            }
        }
        Err(JsonRejection::JsonDataError(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(JsonRejection::JsonSyntaxError(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(JsonRejection::BytesRejection(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(_) => todo!(),
    }
}

pub async fn delete_debt(
    State(state): State<Arc<Mutex<AppState>>>,
    Path(id): Path<i64>,
) -> StatusCode {
    match debt_service::delete_debt(state, id).await {
        Ok(_) => StatusCode::NO_CONTENT,
        Err(_) => StatusCode::NOT_FOUND,
    }
}

#[instrument(skip(state))]
pub async fn create_debt(
    State(state): State<Arc<Mutex<AppState>>>,
    payload: Result<Json<CreateDebtDto>, JsonRejection>,
) -> (StatusCode, Result<Json<DebtDto>, String>) {
    event!(Level::INFO, "Creating a Debt");
    match payload {
        Ok(Json(body)) => {
            let bill = debt_service::create_debt(state, body)
                .await
                .expect("should be valid debt");

            (StatusCode::CREATED, Ok(Json(bill)))
        }
        Err(JsonRejection::JsonDataError(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(JsonRejection::JsonSyntaxError(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(JsonRejection::BytesRejection(err)) => (StatusCode::BAD_REQUEST, Err(err.body_text())),
        Err(_) => todo!(),
    }
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

pub async fn view_calendar(State(state): State<Arc<Mutex<AppState>>>) -> StatusCode {
    let _ = achievements_service::complete_achievement(state, AchievementId::WISH_GRANTED).await;

    StatusCode::OK
}
