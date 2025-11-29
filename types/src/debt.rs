use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct CreateDebtDto {
    pub name: String,
    pub amount: i64,
    pub bill_id: Option<i64>,
}

impl CreateDebtDto {
    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn amount(&self) -> i64 {
        self.amount
    }

    pub fn bill_id(&self) -> &Option<i64> {
        &self.bill_id
    }
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct UpdateDebtDto {
    pub id: i64,
    pub name: String,
    pub amount: i64,
    pub bill_id: Option<i64>,
}

impl UpdateDebtDto {
    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn amount(&self) -> i64 {
        self.amount
    }
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct DebtDto {
    pub id: i64,
    pub name: String,
    pub amount: i64,
    pub bill_id: Option<i64>,
}

impl From<Debt> for DebtDto {
    fn from(value: Debt) -> Self {
        Self {
            id: value.id,
            name: value.name,
            amount: value.amount,
            bill_id: value.bill_id,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Debt {
    pub id: i64,
    pub name: String,
    pub amount: i64,
    pub bill_id: Option<i64>,
}
