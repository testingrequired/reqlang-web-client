use reqlang::types::http::HttpResponse;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

pub mod achievement;
pub mod errors;
pub mod request_run;
pub mod run_request;
pub mod socket;
pub mod utils;

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct DebugInfo {
    pub db: String,
    pub cwd: String,
    pub commit: String,
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct RequestRunResponse {
    pub response: HttpResponse,
    pub time_taken: u64,
    pub test_result: RequestRunResponseTestResult,
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct RequestRunResponseTestResult {
    pub pass: bool,
    pub diff: Option<String>,
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct UpdateRequestFileBody {
    pub updated_http_request: Option<String>,
}
