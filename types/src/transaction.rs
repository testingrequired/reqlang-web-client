use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::errors::Error;

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct CreateTransactionDto {
    pub date: String,
    pub amount: i64,
    pub description: String,
    pub bill_id: Option<i64>,
    pub kind: TransactionKind,
}

impl CreateTransactionDto {
    pub fn amount(&self) -> i64 {
        self.amount
    }

    pub fn date(&self) -> &str {
        &self.date
    }

    pub fn description(&self) -> &str {
        &self.description
    }

    pub fn kind(&self) -> &TransactionKind {
        &self.kind
    }
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct UpdateTransactionDto {
    pub id: i64,
    pub date: String,
    pub amount: i64,
    pub bill_id: Option<i64>,
    pub state: TransactionState,
    pub kind: TransactionKind,
}

impl UpdateTransactionDto {
    pub fn id(self) -> i64 {
        self.id
    }

    pub fn amount(&self) -> i64 {
        self.amount
    }

    pub fn date(&self) -> &str {
        &self.date
    }

    pub fn state(&self) -> &TransactionState {
        &self.state
    }

    pub fn kind(&self) -> &TransactionKind {
        &self.kind
    }
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct TransactionDto {
    pub id: i64,
    pub description: String,
    pub date: String,
    pub amount: i64,
    pub is_draft: bool,
    pub state: TransactionState,
    pub bill_id: Option<i64>,
    pub kind: TransactionKind,
}

impl TransactionDto {
    pub fn id(&self) -> i64 {
        self.id
    }

    pub fn description(&self) -> &str {
        &self.description
    }

    pub fn date(&self) -> &str {
        &self.date
    }

    pub fn amount(&self) -> i64 {
        self.amount
    }

    pub fn is_draft(&self) -> bool {
        self.is_draft
    }

    pub fn bill_id(&self) -> Option<i64> {
        self.bill_id
    }
}

impl From<Transaction> for TransactionDto {
    fn from(value: Transaction) -> Self {
        Self {
            id: value.id,
            description: value.description().to_string(),
            date: value.date().to_string(),
            amount: value.amount(),
            is_draft: value.is_draft,
            state: value.state,
            bill_id: value.bill_id,
            kind: value.kind,
        }
    }
}

#[derive(sqlx::Type, TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
#[repr(i32)]
pub enum TransactionState {
    Draft = 0,
    Processing = 1,
    Complete = 2,
}

#[derive(sqlx::Type, TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
#[repr(i32)]
pub enum TransactionKind {
    Debit = 0,
    Credit = 1,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Transaction {
    pub id: i64,
    pub description: String,
    pub date: String,
    pub amount: i64,
    pub is_draft: bool,
    pub state: TransactionState,
    pub bill_id: Option<i64>,
    pub kind: TransactionKind,
}

impl Transaction {
    pub fn id(self) -> i64 {
        self.id
    }

    pub fn set_date(&mut self, date: &str) {
        self.date = date.to_string();
    }

    pub fn set_amount(&mut self, amount: i64) {
        self.amount = amount;
    }

    pub fn state(&self) -> &TransactionState {
        &self.state
    }

    pub fn kind(&self) -> &TransactionKind {
        &self.kind
    }
}

impl Transaction {
    pub fn from_create_transaction(id: i64, create: CreateTransactionDto) -> Result<Self, Error> {
        Ok(Transaction {
            id,
            description: create.description,
            date: create.date,
            amount: create.amount,
            is_draft: true,
            state: TransactionState::Draft,
            bill_id: create.bill_id,
            kind: create.kind,
        })
    }

    pub fn new(
        id: i64,
        description: &str,
        date: &str,
        amount: i64,
        kind: TransactionKind,
    ) -> Result<Self, Error> {
        let datee = chrono::NaiveDate::parse_from_str(&date, "%Y-%m-%d");

        if datee.is_err() {
            return Err(Error::InvalidTransactionDate);
        }

        Ok(Self {
            id: id,
            description: description.to_string(),
            date: date.to_string(),
            amount,
            is_draft: true,
            state: TransactionState::Draft,
            bill_id: None,
            kind,
        })
    }

    pub fn new_complete(
        id: i64,
        description: &str,
        date: &str,
        amount: i64,
        kind: TransactionKind,
    ) -> Result<Self, Error> {
        let transaction = Self::new(id, description, date, amount, kind).map(|mut transaction| {
            transaction.set_complete(None, None);

            transaction
        });

        transaction
    }

    pub fn description(&self) -> &str {
        &self.description
    }

    pub fn date(&self) -> &str {
        &self.date
    }

    pub fn amount(&self) -> i64 {
        self.amount
    }

    pub fn is_draft(&self) -> bool {
        self.is_draft
    }

    pub fn is_complete(&self) -> bool {
        !self.is_draft
    }

    pub fn set_complete(&mut self, date: Option<String>, amount: Option<i64>) {
        self.is_draft = false;
        self.state = TransactionState::Complete;
        self.date = date.unwrap_or(self.date().to_string());
        self.amount = amount.unwrap_or(self.amount());
    }
}

#[cfg(test)]
mod transaction_tests {
    use super::*;

    #[test]
    fn new_creates_draft_debit_transaction() {
        let description = "Test Draft";
        let date = "2023-10-05";
        let amount = 100i64;
        let transaction = Transaction::new(0, description, date, amount, TransactionKind::Debit);

        assert_eq!(
            Ok(Transaction {
                id: 0,
                description: "Test Draft".to_string(),
                date: "2023-10-05".to_string(),
                amount: 100i64,
                is_draft: true,
                state: TransactionState::Draft,
                bill_id: None,
                kind: TransactionKind::Debit
            }),
            transaction
        );
    }

    #[test]
    fn new_returns_error_with_invalid_date() {
        let description = "Test Draft";
        let date = "2023";
        let amount = 100i64;
        let transaction = Transaction::new(0, description, date, amount, TransactionKind::Debit);

        assert_eq!(Err(Error::InvalidTransactionDate), transaction);
    }

    #[test]
    fn draft_is_draft() {
        let description = "Test Draft";
        let date = "2023-10-05";
        let amount = 100i64;
        let transaction =
            Transaction::new(0, description, date, amount, TransactionKind::Debit).unwrap();

        assert_eq!(true, transaction.is_draft());
    }

    #[test]
    fn draft_is_not_complete() {
        let description = "Test Draft";
        let date = "2023-10-05";
        let amount = 100i64;
        let transaction =
            Transaction::new(0, description, date, amount, TransactionKind::Debit).unwrap();

        assert_eq!(false, transaction.is_complete());
    }

    #[test]
    fn get_draft_description() {
        let description = "Test Draft";
        let date = "2023-10-05";
        let amount = 100i64;
        let transaction =
            Transaction::new(0, description, date, amount, TransactionKind::Debit).unwrap();

        assert_eq!(description, transaction.description());
    }

    #[test]
    fn get_draft_amount() {
        let description = "Test Draft";
        let date = "2023-10-05";
        let amount = 100i64;
        let transaction =
            Transaction::new(0, description, date, amount, TransactionKind::Debit).unwrap();

        assert_eq!(amount, transaction.amount());
    }

    #[test]
    fn get_draft_date() {
        let description = "Test Draft";
        let date = "2023-10-05";
        let amount = 100i64;
        let transaction =
            Transaction::new(0, description, date, amount, TransactionKind::Debit).unwrap();

        assert_eq!(date, transaction.date());
    }

    #[test]
    fn set_draft_transaction_to_complete() {
        let description = "Test Draft";
        let date = "2023-10-05";
        let amount = 100i64;
        let mut transaction =
            Transaction::new(0, description, date, amount, TransactionKind::Debit).unwrap();
        transaction.set_complete(None, None);

        assert_eq!(
            Transaction {
                id: 0,
                description: "Test Draft".to_string(),
                date: "2023-10-05".to_string(),
                amount: 100i64,
                is_draft: false,
                state: TransactionState::Complete,
                bill_id: None,
                kind: TransactionKind::Debit
            },
            transaction
        );
    }

    #[test]
    fn complete_is_complete() {
        let description = "Test Draft";
        let date = "2023-10-05";
        let amount = 100i64;
        let mut transaction =
            Transaction::new(0, description, date, amount, TransactionKind::Debit).unwrap();
        transaction.set_complete(None, None);

        assert_eq!(true, transaction.is_complete());
    }

    #[test]
    fn complete_is_not_draft() {
        let description = "Test Draft";
        let date = "2023-10-05";
        let amount = 100i64;
        let mut transaction =
            Transaction::new(0, description, date, amount, TransactionKind::Debit).unwrap();
        transaction.set_complete(None, None);

        assert_eq!(false, transaction.is_draft());
    }

    #[test]
    fn get_completed_description() {
        let description = "Test Draft";
        let date = "2023-10-05";
        let amount = 100i64;
        let mut transaction =
            Transaction::new(0, description, date, amount, TransactionKind::Debit).unwrap();
        transaction.set_complete(None, None);

        assert_eq!(description, transaction.description());
    }

    #[test]
    fn get_completed_amount() {
        let description = "Test Draft";
        let date = "2023-10-05";
        let amount = 100i64;
        let mut transaction =
            Transaction::new(0, description, date, amount, TransactionKind::Debit).unwrap();
        transaction.set_complete(None, None);

        assert_eq!(amount, transaction.amount());
    }

    #[test]
    fn get_completed_date() {
        let description = "Test Draft";
        let date = "2023-10-05";
        let amount = 100i64;
        let mut transaction =
            Transaction::new(0, description, date, amount, TransactionKind::Debit).unwrap();
        transaction.set_complete(None, None);

        assert_eq!(date, transaction.date());
    }
}
