use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Clone, Debug, Serialize, Deserialize)]
#[ts(export)]
pub struct RequestRun {
    pub id: i64,

    pub uuid: String,

    pub request_file_path: String,
    pub request_file_hash: String,

    pub params_from_client_json: String,

    pub response: String,

    pub request_at: i64,
    pub response_at: i64,
}

#[derive(TS, Clone, Debug, Serialize, Deserialize)]
#[ts(export)]
pub struct NewRequestRun {
    pub request_file_path: String,
    pub request_file_hash: String,

    pub params_from_client_json: String,

    pub response: String,

    pub request_at: i64,
    pub response_at: i64,
}
