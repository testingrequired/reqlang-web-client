pub mod broadcast_service {
    use std::sync::Arc;

    use tokio::sync::Mutex;
    use types::socket::ServerMessage;

    use crate::AppState;

    pub async fn broadcast(state: Arc<Mutex<AppState>>, msg: impl Into<ServerMessage>) {
        let state = state.lock().await;
        let msg: ServerMessage = msg.into();

        if let Some(tx) = state.tx.as_ref() {
            let tx = tx.lock().await;

            if let Ok(msg_json) = serde_json::to_string(&msg)
                && let Err(err) = tx.send(msg_json)
            {
                tracing::error!("Failed to broadcast socket message: {err}");
            }
        }
    }
}

pub mod achievements_service {
    use std::sync::Arc;

    use futures_util::TryStreamExt;
    use tokio::sync::Mutex;
    use tracing::info;
    use types::{
        achievement::{Achievement, AchievementDto, AchievementId},
        socket::ServerMessage,
    };

    use sqlx::Row;

    use crate::{AppState, services::broadcast_service};

    pub async fn complete_achievement(
        state: Arc<Mutex<AppState>>,
        id: AchievementId,
    ) -> Result<(), String> {
        info!("Completing achievement {:#?}", id.id());

        {
            let state = state.clone();

            let achievement = get_achievement(state.clone(), &id).await?;

            if achievement.is_earned && id != AchievementId::TESTING_ACHIEVEMENTS {
                return Ok(());
            }

            {
                let state = state.lock().await;
                let conn = state.db.as_ref().unwrap();

                if let Err(err) = sqlx::query(
                    r#"
            UPDATE achievements SET is_earned = true, earned_at = current_timestamp WHERE id = $1
        "#,
                )
                .bind(achievement.id)
                .execute(conn)
                .await
                {
                    return Err(format!("Error completing achievement: {}", err));
                };
            };

            broadcast_service::broadcast(state.clone(), ServerMessage::Achievement(achievement))
                .await;
        };

        Ok(())
    }

    pub async fn get_achievement(
        state: Arc<Mutex<AppState>>,
        id: &AchievementId,
    ) -> Result<AchievementDto, String> {
        let state = state.clone();
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        let row =
            sqlx::query("SELECT id, title, description, points, is_earned, earned_at  FROM Achievements WHERE id = $1")
                .bind(id.id())
                .fetch_one(conn)
                .await;

        match row {
            Ok(row) => {
                if row.is_empty() {
                    Err("achievement not found".into())
                } else {
                    Ok(AchievementDto {
                        id: id.id(),
                        title: row.try_get("title").unwrap(),
                        description: row.try_get("description").unwrap(),
                        points: row.try_get("points").unwrap(),
                        is_earned: row.try_get("is_earned").unwrap(),
                        earned_at: row.try_get("earned_at").unwrap(),
                    })
                }
            }
            Err(err) => Err(format!("Error getting achievement: {err:#?}")),
        }
    }

    pub async fn get_achievements(state: Arc<Mutex<AppState>>) -> Vec<AchievementDto> {
        let state = state.clone();
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        let mut rows = sqlx::query(
            "SELECT id, title, description, points, is_earned, earned_at FROM Achievements",
        )
        .fetch(conn);

        let mut achievements: Vec<Achievement> = vec![];

        while let Some(row) = rows.try_next().await.unwrap() {
            achievements.push(Achievement {
                id: row.try_get("id").unwrap(),
                title: row.try_get("title").unwrap(),
                description: row.try_get("description").unwrap(),
                points: row.try_get("points").unwrap(),
                is_earned: row.try_get("is_earned").unwrap(),
                earned_at: row.try_get("earned_at").unwrap(),
            });
        }

        achievements
            .clone()
            .iter()
            .map(|achievement| achievement.clone().into())
            .collect()
    }
}

pub mod request_service {
    use std::{collections::HashMap, error::Error, sync::Arc};

    use chrono::Local;
    use futures_util::TryStreamExt;
    use reqlang::{
        assert_response,
        export::ResponseFormat,
        fetch::{Fetch, HttpRequestFetcher},
        prelude::template,
    };
    use sqlx::Row;
    use tokio::sync::Mutex;
    use types::{
        RequestRunResponse, RequestRunResponseTestResult,
        request_run::{NewRequestRun, RequestRun},
        run_request::RunRequest,
    };

    use crate::AppState;

    pub async fn get_run_history(state: Arc<Mutex<AppState>>) -> Vec<RequestRun> {
        let state = state.clone();
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        let mut rows = sqlx::query("SELECT id, uuid, request_file_path, request_file_hash, params_from_client_json, response, pass, diff, request_at, response_at FROM RequestRunHistory").fetch(conn);

        let mut request_runs: Vec<RequestRun> = vec![];

        while let Some(row) = rows.try_next().await.unwrap() {
            request_runs.push(RequestRun {
                id: row.try_get("id").unwrap(),
                uuid: row.try_get("uuid").unwrap(),
                request_file_path: row.try_get("request_file_path").unwrap(),
                request_file_hash: row.try_get("request_file_hash").unwrap(),
                params_from_client_json: row.try_get("params_from_client_json").unwrap(),
                response: row.try_get("response").unwrap(),
                pass: row.try_get("pass").unwrap(),
                diff: row.try_get("diff").unwrap(),
                request_at: row.try_get("request_at").unwrap(),
                response_at: row.try_get("response_at").unwrap(),
            });
        }

        request_runs.clone().to_vec()
    }

    pub async fn delete_run_history(state: Arc<Mutex<AppState>>) {
        let state = state.clone();
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        sqlx::query("DELETE FROM RequestRunHistory")
            .execute(conn)
            .await
            .expect("should work");
    }

    async fn add_to_run_history(run: &NewRequestRun, state: Arc<Mutex<AppState>>) -> RequestRun {
        let state = state.clone();
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        let new_uuid = uuid::Uuid::new_v4().to_string();

        let id = sqlx::query(
            r#"
        INSERT INTO RequestRunHistory (
            uuid,
            request_file_path,
            request_file_hash,
            params_from_client_json,
            response,
            pass,
            diff,
            request_at,
            response_at
        ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9
        );
        "#,
        )
        .bind(&new_uuid)
        .bind(&run.request_file_path)
        .bind(&run.request_file_hash)
        .bind(&run.params_from_client_json)
        .bind(&run.response)
        .bind(run.pass)
        .bind(&run.diff)
        .bind(run.request_at)
        .bind(run.response_at)
        .execute(conn)
        .await
        .unwrap();

        let id = id.last_insert_rowid();

        RequestRun {
            id,
            uuid: new_uuid,
            request_file_path: run.request_file_path.clone(),
            request_file_hash: run.request_file_hash.clone(),
            params_from_client_json: run.params_from_client_json.clone(),
            response: run.response.clone(),
            pass: run.pass,
            diff: run.diff.clone(),
            request_at: run.request_at,
            response_at: run.response_at,
        }
    }

    pub async fn run_request_from_params(
        client_hostname: &str,
        run_request_from_client: &RunRequest,
        state: Arc<Mutex<AppState>>,
    ) -> Result<(RequestRunResponse, std::string::String), Box<dyn Error + Send>> {
        let mut from_client_params = run_request_from_client.params.clone();

        let mut provider_values: HashMap<String, String> = HashMap::new();

        let env = from_client_params.env.as_deref();

        if let Some(env) = env {
            provider_values.insert("env".to_string(), env.to_string());
        }

        provider_values.insert("clientUrl".to_string(), format!("http://{client_hostname}"));

        from_client_params.provider_values = provider_values;

        dbg!(&from_client_params);

        let request_run_start = Local::now().timestamp_millis() as u64;

        let response = Into::<HttpRequestFetcher>::into(from_client_params.clone())
            .fetch()
            .await;

        match response {
            Ok(response) => {
                let request_run_end = Local::now().timestamp_millis() as u64;

                let templated = template(
                    &from_client_params.reqfile,
                    env,
                    &from_client_params.prompts,
                    &from_client_params.secrets,
                    &from_client_params.provider_values,
                )
                .unwrap();

                let test_result = templated.response.and_then(|expected_response| {
                    assert_response::assert_response(&expected_response, &response)
                        .map_err(|err| err.to_string())
                        .err()
                });

                let response_exported =
                    reqlang::export::export_response(&response, ResponseFormat::HttpMessage);

                let run: NewRequestRun = NewRequestRun {
                    request_file_path: String::from(&run_request_from_client.request_file_path),
                    request_file_hash: String::from("value"),
                    params_from_client_json: serde_json::to_string_pretty(&from_client_params)
                        .expect("unable to serialize from_client_params to json"),
                    response: response_exported.clone(),
                    pass: test_result.is_none(),
                    diff: test_result.clone(),
                    request_at: request_run_start as i64,
                    response_at: request_run_end as i64,
                };

                let _ = add_to_run_history(&run, state).await;

                Ok((
                    RequestRunResponse {
                        response,
                        time_taken: request_run_end - request_run_start,
                        test_result: RequestRunResponseTestResult {
                            pass: test_result.is_none(),
                            diff: test_result,
                        },
                    },
                    response_exported,
                ))
            }
            Err(err) => Err(err),
        }
    }
}

pub mod db_service {
    use std::{path::PathBuf, str::FromStr};

    use sqlx::{
        SqlitePool,
        sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    };

    pub async fn verify_database_connection(pool: &SqlitePool) -> Result<(), String> {
        sqlx::query("SELECT count(*) FROM sqlite_master")
            .fetch_one(pool)
            .await
            .map(|_| ())
            .map_err(|err| err.to_string())
    }

    pub async fn is_database_encrypted(db_path: &PathBuf) -> Result<bool, String> {
        let db_uri = db_path.to_str().expect("db path should parse");

        let options = SqliteConnectOptions::from_str(db_uri)
            .expect("...")
            .create_if_missing(false);

        let pool_result = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(options)
            .await;

        match pool_result {
            Ok(pool) => {
                let query_result = verify_database_connection(&pool).await;

                match query_result {
                    Ok(_) => Ok(false),
                    Err(_) => Ok(true),
                }
            }
            Err(_) => Ok(true),
        }
    }
}
