use reqlang::types::RequestParamsFromClient;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Clone, Debug, Serialize, Deserialize)]
#[ts(export)]
pub struct RunRequest {
    pub request_file_path: String,
    pub params: RequestParamsFromClient,
}
