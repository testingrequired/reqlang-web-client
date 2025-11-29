use serde::{Deserialize, Serialize};
use ts_rs::TS;

pub mod achievement;
pub mod bill;
pub mod debt;
pub mod errors;
pub mod socket;
pub mod timeline;
pub mod transaction;
pub mod utils;

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct DebugInfo {
    pub db: String,
    pub cwd: String,
    pub commit: String,
}
