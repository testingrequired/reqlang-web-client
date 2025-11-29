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

            if let Ok(msg_json) = serde_json::to_string(&msg) {
                if let Err(err) = tx.send(msg_json) {
                    tracing::error!("Failed to broadcast socket message: {err}");
                }
            }
        }
    }
}

pub mod bills_service {
    use std::{sync::Arc, vec};

    use chrono::{Datelike, Days, Months};
    use futures_util::TryStreamExt;
    use tokio::sync::Mutex;
    use types::{
        achievement::AchievementId,
        bill::{Bill, BillAmount, BillDto, CreateBillDto, UpdateBillDto},
    };

    use crate::{
        AppState,
        services::{achievements_service, bills_service},
    };

    use sqlx::Row;

    pub async fn get_bills(state: Arc<Mutex<AppState>>) -> Vec<BillDto> {
        let state = state.clone();
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        let mut rows =
            sqlx::query("SELECT id, name, amount, day_due, autopay FROM Bills").fetch(conn);

        let mut bills: Vec<BillDto> = vec![];

        while let Some(row) = rows.try_next().await.unwrap() {
            bills.push(BillDto {
                id: row.try_get("id").unwrap(),
                name: row.try_get("name").unwrap(),
                amount: row.try_get("amount").unwrap(),
                due_day: row.try_get("day_due").unwrap(),
                autopay: row.try_get("autopay").unwrap(),
            });
        }

        bills
    }

    pub async fn get_bill(state: Arc<Mutex<AppState>>, id: i64) -> Result<BillDto, String> {
        let state = state.clone();
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        let row = sqlx::query("SELECT id, name, amount, day_due, autopay FROM Bills WHERE id = $1")
            .bind(id)
            .fetch_one(conn)
            .await;

        match row {
            Ok(row) => {
                if row.is_empty() {
                    Err("Bill not found".into())
                } else {
                    Ok(BillDto {
                        id: row.try_get("id").unwrap(),
                        name: row.try_get("name").unwrap(),
                        amount: row.try_get("amount").unwrap(),
                        due_day: row.try_get("day_due").unwrap(),
                        autopay: row.try_get("autopay").unwrap(),
                    })
                }
            }
            Err(err) => Err(format!("Error getting bill: {err:#?}")),
        }
    }

    pub async fn get_bill_next_date(
        state: Arc<Mutex<AppState>>,
        id: i64,
    ) -> Result<String, String> {
        let state = state.clone();
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        let row = sqlx::query("SELECT id, name, amount, day_due, autopay FROM Bills WHERE id = $1")
            .bind(id)
            .fetch_one(conn)
            .await;

        match row {
            Ok(row) => {
                if row.is_empty() {
                    Err("Bill not found".into())
                } else {
                    let bill_dto = BillDto {
                        id: row.try_get("id").unwrap(),
                        name: row.try_get("name").unwrap(),
                        amount: row.try_get("amount").unwrap(),
                        due_day: row.try_get("day_due").unwrap(),
                        autopay: row.try_get("autopay").unwrap(),
                    };

                    let now = chrono::Local::now();
                    let now_day = now.clone().day();
                    let due_day = bill_dto.due_day.try_into().unwrap();

                    Ok(if now_day > due_day {
                        now.checked_add_months(Months::new(1))
                            .unwrap()
                            .with_day(due_day)
                            .unwrap()
                            .format("%Y-%m-%d")
                            .to_string()
                    } else {
                        let delta = due_day - now_day;

                        now.checked_add_days(Days::new(delta as u64))
                            .unwrap()
                            .format("%Y-%m-%d")
                            .to_string()
                    })
                }
            }
            Err(err) => Err(format!("Error getting bill: {err:#?}")),
        }
    }

    pub async fn get_next_date_for_bills(
        state: Arc<Mutex<AppState>>,
    ) -> Result<Vec<(i64, String)>, String> {
        let state = state.clone();

        let mut results = Vec::new();

        for bill in get_bills(state.clone()).await {
            let next_date = get_bill_next_date(state.clone(), bill.id()).await.unwrap();

            results.push((bill.id(), next_date))
        }

        Ok(results)
    }

    pub async fn update_bill(
        state: Arc<Mutex<AppState>>,
        payload: UpdateBillDto,
    ) -> Result<BillDto, String> {
        let mut errs: Vec<String> = vec![];

        if payload.amount() == 0 {
            errs.push("Amount can't be zero".to_string())
        }

        if !errs.is_empty() {
            return Err(serde_json::to_string(&errs).expect("should serialize errors"));
        }

        let id = payload.id.clone();

        let bill = get_bill(state.clone(), id).await;

        match bill {
            Ok(_) => {
                let result = {
                    let state = state.lock().await;
                    let conn = state.db.as_ref().unwrap();

                    sqlx::query(
                        r#"
            UPDATE bills SET amount = $1, day_due = $2, autopay = $3 WHERE id = $4
        "#,
                    )
                    .bind(payload.amount())
                    .bind(payload.day_due())
                    .bind(payload.autopay())
                    .bind(id)
                    .execute(conn)
                    .await
                };

                {
                    let mut state = state.lock().await;

                    state.timeline_cache = None;
                };

                match result {
                    Ok(_) => get_bill(state, id).await,
                    Err(err) => Err(format!("There was an error updating bill: {err:#?}")),
                }
            }
            Err(_) => todo!(),
        }
    }

    pub async fn delete_bill(state: Arc<Mutex<AppState>>, id: i64) -> Result<(), String> {
        let state = state.clone();

        let result = {
            let state = state.lock().await;
            let conn = state.db.as_ref().unwrap();

            let result = sqlx::query("DELETE FROM bills WHERE id = $1")
                .bind(id)
                .execute(conn)
                .await;

            result
        };

        match result {
            Ok(result) => {
                if result.rows_affected() == 0 {
                    Err("Bill not found".to_string())
                } else {
                    {
                        let mut state = state.lock().await;

                        state.timeline_cache = None;
                    };

                    Ok(())
                }
            }
            Err(_) => Err("Bill not found".to_string()),
        }
    }

    pub async fn create_bill(
        state: Arc<Mutex<AppState>>,
        payload: CreateBillDto,
    ) -> Result<BillDto, String> {
        let state = state.clone();

        let mut errs: Vec<String> = vec![];

        let name = payload.name();

        if name.is_empty() {
            errs.push("Name cannot be empty".to_string());
        }

        let amount = payload.amount();

        if amount == 0 {
            errs.push("Amount can't be zero".to_string())
        }

        let day_due = payload.day_due();

        if day_due < 1 || day_due > 31 {
            errs.push("Day due must be between 1 and 31".to_string());
        }

        if !errs.is_empty() {
            return Err(serde_json::to_string(&errs).expect("should serialize errors"));
        }

        let bill_id = {
            let state = state.lock().await;
            let conn = state.db.as_ref().unwrap();

            let bill_id = sqlx::query(
                r#"
               INSERT INTO bills (name, amount, day_due, autopay) VALUES ($1, $2, $3, $4);
            "#,
            )
            .bind(payload.name())
            .bind(payload.amount())
            .bind(payload.day_due())
            .bind(payload.autopay())
            .execute(conn)
            .await
            .expect("query should work")
            .last_insert_rowid();

            bill_id
        };

        {
            let bills = bills_service::get_bills(state.clone()).await;

            if bills.len() == 1 {
                let _ =
                    achievements_service::complete_achievement(state.clone(), AchievementId::BILLY)
                        .await;
            } else if bills.len() == 5 {
                let _ = achievements_service::complete_achievement(
                    state.clone(),
                    AchievementId::BILL_BILL_BILL,
                )
                .await;
            }
        };

        let bill = Bill {
            id: bill_id,
            name: name.to_string(),
            amount: BillAmount(payload.amount()),
            due_day: payload.day_due(),
            autopay: false,
        };

        {
            let mut state = state.lock().await;

            state.timeline_cache = None;
        };

        Ok(bill.into())
    }

    #[cfg(test)]
    mod bills_service_test {
        use crate::{
            AppState,
            services::bills_service::{get_bill, get_bills},
        };

        use sqlx::{SqlitePool, migrate::Migrator};
        use std::{path::PathBuf, sync::Arc};
        use tokio::sync::Mutex;

        static MIGRATOR: Migrator = sqlx::migrate!();

        #[tokio::test]
        async fn test_get_bills() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx: None,
            };
            let state = Arc::new(Mutex::new(state));
            let bills = get_bills(state).await;

            assert_eq!(bills.len(), 8);
        }

        #[tokio::test]
        async fn test_get_bills_gets_default_bills() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx: None,
            };
            let state = Arc::new(Mutex::new(state));
            let bills = get_bills(state).await;

            assert_eq!(bills.len(), 8);
        }

        #[tokio::test]
        async fn test_get_bill() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx: None,
            };
            let state = Arc::new(Mutex::new(state));
            let bill = get_bill(state, 1).await.unwrap();

            assert_eq!(bill.name(), "House Payment");
            assert_eq!(bill.amount(), 200000);
        }

        #[tokio::test]
        async fn test_get_bill_not_found() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx: None,
            };
            let state = Arc::new(Mutex::new(state));
            let result = get_bill(state, 9).await;

            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), "Error getting bill: RowNotFound");
        }
    }
}

pub mod transactions_service {
    use std::sync::Arc;

    use chrono::{Local, NaiveTime};
    use tokio::sync::Mutex;
    use tracing::{Level, span};
    use types::{
        achievement::AchievementId,
        transaction::{
            CreateTransactionDto, Transaction, TransactionDto, TransactionState,
            UpdateTransactionDto,
        },
        utils::local_datetime_parse_from_str,
    };

    use futures_util::TryStreamExt;
    use sqlx::Row;

    use crate::{
        AppState,
        services::{achievements_service, timeline_service::DATE_FORMAT, transactions_service},
    };

    pub async fn get_transactions(state: Arc<Mutex<AppState>>) -> Vec<TransactionDto> {
        let state = state.clone();
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        let mut rows = sqlx::query(
            "SELECT id, description, date, amount, is_draft, state, bill_id, kind FROM Transactions",
        )
        .fetch(conn);

        let mut transactions: Vec<Transaction> = vec![];

        while let Some(row) = rows.try_next().await.unwrap() {
            transactions.push(Transaction {
                id: row.try_get("id").unwrap(),
                description: row.try_get("description").unwrap(),
                date: row.try_get("date").unwrap(),
                amount: row.try_get("amount").unwrap(),
                is_draft: row.try_get("is_draft").unwrap(),
                state: row.try_get("state").unwrap(),
                bill_id: row.try_get("bill_id").unwrap(),
                kind: row.try_get("kind").unwrap(),
            });
        }

        transactions
            .clone()
            .iter()
            .map(|transaction| transaction.clone().into())
            .collect()
    }

    pub async fn get_transaction(
        state: Arc<Mutex<AppState>>,
        transaction_id: i64,
    ) -> Option<TransactionDto> {
        let state = state.clone();
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        let row = sqlx::query(
            "SELECT id, description, date, amount, is_draft, state, bill_id, kind FROM Transactions WHERE id = $1",
        )
        .bind(transaction_id)
        .fetch_one(conn).await;

        match row {
            Ok(row) => Some(
                Transaction {
                    id: row.try_get("id").unwrap(),
                    description: row.try_get("description").unwrap(),
                    date: row.try_get("date").unwrap(),
                    amount: row.try_get("amount").unwrap(),
                    is_draft: row.try_get("is_draft").unwrap(),
                    state: row.try_get("state").unwrap(),
                    bill_id: row.try_get("bill_id").unwrap(),
                    kind: row.try_get("kind").unwrap(),
                }
                .into(),
            ),
            Err(_) => {
                span!(Level::ERROR, "Failed to fetch transaction");
                None
            }
        }
    }

    pub async fn create_transaction(
        state: Arc<Mutex<AppState>>,
        payload: CreateTransactionDto,
    ) -> Result<TransactionDto, String> {
        let state = state.clone();

        let mut errs: Vec<String> = vec![];

        let description = payload.description();

        if description.is_empty() {
            errs.push("Description cannot be empty".to_string());
        }

        let amount = payload.amount();

        if amount == 0 {
            errs.push("Amount can't be zero".to_string())
        }

        if !errs.is_empty() {
            return Err(serde_json::to_string(&errs).expect("should serialize errors"));
        }

        let transaction_state = {
            let payload_date = local_datetime_parse_from_str(payload.date(), DATE_FORMAT);
            let now = Local::now().with_time(NaiveTime::MIN).earliest().unwrap();

            if payload_date >= now {
                TransactionState::Draft
            } else {
                TransactionState::Processing
            }
        };

        let transaction_id = {
            let state = state.lock().await;
            let conn = state.db.as_ref().unwrap();
            let transaction_id = sqlx::query(
            r#"
           INSERT INTO transactions (date, amount, description, bill_id, is_draft, state, kind) VALUES ($1, $2, $3, $4, $5, $6, $7);
        "#,
        )
            .bind(payload.date())
            .bind(payload.amount())
            .bind(payload.description())
            .bind(payload.bill_id)
            .bind(true)
            .bind(transaction_state)
            .bind(payload.kind())
            .execute(conn)
            .await
            .expect("query should work")
            .last_insert_rowid();

            transaction_id
        };

        {
            let transactions = transactions_service::get_transactions(state.clone()).await;

            if transactions.len() == 1 {
                let _ = achievements_service::complete_achievement(
                    state.clone(),
                    AchievementId::FIRST_TRANSACTION,
                )
                .await;
            } else if transactions.len() == 2 {
                let _ = achievements_service::complete_achievement(
                    state.clone(),
                    AchievementId::SECOND_TRANSACTION,
                )
                .await;
            } else if transactions.len() == 10 {
                let _ = achievements_service::complete_achievement(
                    state.clone(),
                    AchievementId::TEN_TRANSACTIONS,
                )
                .await;
            } else if transactions.len() == 50 {
                let _ = achievements_service::complete_achievement(
                    state.clone(),
                    AchievementId::FIFTY_TRANSACTIONS,
                )
                .await;
            } else if transactions.len() == 100 {
                let _ = achievements_service::complete_achievement(
                    state.clone(),
                    AchievementId::ONE_HUNDRED_TRANSACTIONS,
                )
                .await;
            }
        };

        let transaction = Transaction::from_create_transaction(transaction_id, payload)
            .expect("should be valid transaction");

        {
            let mut state = state.lock().await;

            state.timeline_cache = None;
        };

        Ok(transaction.into())
    }

    pub async fn delete_transaction(state: Arc<Mutex<AppState>>, id: i64) -> Result<(), String> {
        let state = state.clone();

        let result = {
            let state = state.lock().await;
            let conn = state.db.as_ref().unwrap();

            let result = sqlx::query("DELETE FROM transactions WHERE id = $1")
                .bind(id)
                .execute(conn)
                .await;

            result
        };

        match result {
            Ok(result) => {
                if result.rows_affected() == 0 {
                    Err("Transaction not found".to_string())
                } else {
                    {
                        let mut state = state.lock().await;

                        state.timeline_cache = None;
                    };

                    Ok(())
                }
            }
            Err(_) => Err("Transaction not found".to_string()),
        }
    }

    pub async fn update_transaction(
        state: Arc<Mutex<AppState>>,
        payload: UpdateTransactionDto,
    ) -> Result<TransactionDto, String> {
        let mut errs: Vec<String> = vec![];

        if payload.amount() == 0 {
            errs.push("Amount can't be zero".to_string())
        }

        if !errs.is_empty() {
            return Err(serde_json::to_string(&errs).expect("should serialize errors"));
        }

        let id = payload.id.clone();

        let transaction = get_transaction(state.clone(), id).await;

        match transaction {
            Some(transaction) => {
                let result = {
                    let state = state.lock().await;
                    let conn = state.db.as_ref().unwrap();

                    let bill_id: Option<i64> = match payload.bill_id {
                        Some(bill_id) => Some(bill_id),
                        None => transaction.bill_id(),
                    };

                    sqlx::query(
                        r#"
            UPDATE transactions SET date = $1, amount = $2, bill_id = $3, state = $4, kind = $5 WHERE id = $6
        "#,
                    )
                    .bind(payload.date())
                    .bind(payload.amount())
                    .bind(bill_id)
                    .bind(payload.state())
                    .bind(payload.kind())
                    .bind(id)
                    .execute(conn)
                    .await
                };

                match result {
                    Ok(_) => {
                        {
                            let mut state = state.lock().await;

                            state.timeline_cache = None;
                        };

                        get_transaction(state, id)
                            .await
                            .ok_or("Transaction not found".to_string())
                    }
                    Err(err) => Err(format!("There was an error updating transaction: {err:#?}")),
                }
            }
            None => todo!(),
        }
    }

    #[cfg(test)]
    mod transaction_service_tests {
        use crate::{
            AppState,
            services::transactions_service::{
                create_transaction, delete_transaction, get_transaction, get_transactions,
                update_transaction,
            },
        };

        use sqlx::{SqlitePool, migrate::Migrator};
        use std::{path::PathBuf, sync::Arc};
        use tokio::sync::Mutex;
        use types::transaction::{
            CreateTransactionDto, TransactionDto, TransactionKind, TransactionState,
            UpdateTransactionDto,
        };

        static MIGRATOR: Migrator = sqlx::migrate!();

        #[tokio::test]
        async fn test_get_transactions() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx: None,
            };
            let state = Arc::new(Mutex::new(state));

            let _ = create_transaction(
                state.clone(),
                CreateTransactionDto {
                    date: "2025-10-01".to_string(),
                    amount: 100,
                    description: "Test Description".to_string(),
                    bill_id: None,
                    kind: TransactionKind::Debit,
                },
            )
            .await;

            let _ = create_transaction(
                state.clone(),
                CreateTransactionDto {
                    date: "2025-10-02".to_string(),
                    amount: 200,
                    description: "Test Description 2".to_string(),
                    bill_id: Some(10),
                    kind: TransactionKind::Debit,
                },
            )
            .await;

            let transactions = get_transactions(state).await;

            assert_eq!(transactions.len(), 2);

            assert_eq!(transactions[0].id(), 1);
            assert_eq!(transactions[0].description(), "Test Description");
            assert_eq!(transactions[0].date(), "2025-10-01");
            assert_eq!(transactions[0].amount(), 100);
            assert_eq!(transactions[0].bill_id(), None);
            assert_eq!(transactions[0].is_draft(), true);

            assert_eq!(transactions[1].id(), 2);
            assert_eq!(transactions[1].description(), "Test Description 2");
            assert_eq!(transactions[1].date(), "2025-10-02");
            assert_eq!(transactions[1].amount(), 200);
            assert_eq!(transactions[1].bill_id(), Some(10));
            assert_eq!(transactions[1].is_draft(), true);
        }

        #[tokio::test]
        async fn test_get_transaction() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx: None,
            };
            let state = Arc::new(Mutex::new(state));

            let _ = create_transaction(
                state.clone(),
                CreateTransactionDto {
                    date: "2025-10-01".to_string(),
                    amount: 100,
                    description: "Test Description".to_string(),
                    bill_id: None,
                    kind: TransactionKind::Debit,
                },
            )
            .await;

            let _ = create_transaction(
                state.clone(),
                CreateTransactionDto {
                    date: "2025-10-02".to_string(),
                    amount: 200,
                    description: "Test Description 2".to_string(),
                    bill_id: Some(10),
                    kind: TransactionKind::Debit,
                },
            )
            .await;

            let transaction = get_transaction(state, 2).await;

            assert_eq!(
                Some(TransactionDto {
                    id: 2,
                    description: "Test Description 2".to_string(),
                    date: "2025-10-02".to_string(),
                    amount: 200,
                    is_draft: true,
                    state: TransactionState::Draft,
                    bill_id: Some(10),
                    kind: TransactionKind::Debit,
                }),
                transaction
            );
        }

        #[tokio::test]
        async fn test_get_transaction_not_found() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx: None,
            };
            let state = Arc::new(Mutex::new(state));
            let transaction = get_transaction(state, 1).await;

            assert!(transaction.is_none());
        }

        #[tokio::test]
        async fn test_create_transaction() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx: None,
            };
            let state = Arc::new(Mutex::new(state));

            let payload = CreateTransactionDto {
                date: "2025-10-01".to_string(),
                amount: 500,
                description: "New Transaction".to_string(),
                bill_id: None,
                kind: TransactionKind::Debit,
            };

            let result = create_transaction(state.clone(), payload).await;

            assert!(result.is_ok());
            let transactions = get_transactions(state).await;
            assert_eq!(transactions.len(), 1);
            assert_eq!(transactions[0].description(), "New Transaction");
            assert_eq!(transactions[0].amount(), 500);
        }

        #[tokio::test]
        async fn test_create_transaction_with_empty_description() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let tx = None;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx,
            };
            let state = Arc::new(Mutex::new(state));

            let payload = CreateTransactionDto {
                date: "2025-10-01".to_string(),
                amount: 500,
                description: "".to_string(),
                bill_id: None,
                kind: TransactionKind::Debit,
            };

            let result = create_transaction(state, payload).await;

            assert!(result.is_err());
            assert!(
                result
                    .err()
                    .unwrap()
                    .contains("Description cannot be empty")
            );
        }

        #[tokio::test]
        async fn test_create_transaction_with_zero_amount() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let tx = None;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx,
            };
            let state = Arc::new(Mutex::new(state));

            let payload = CreateTransactionDto {
                date: "2025-10-01".to_string(),
                amount: 0,
                description: "New Transaction".to_string(),
                bill_id: None,
                kind: TransactionKind::Debit,
            };

            let result = create_transaction(state, payload).await;

            assert!(result.is_err());
            assert!(result.err().unwrap().contains("Amount can't be zero"));
        }

        #[tokio::test]
        async fn test_delete_transaction() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let tx = None;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx,
            };
            let state = Arc::new(Mutex::new(state));

            let transactions = get_transactions(state.clone()).await;
            assert!(transactions.is_empty());

            let _ = create_transaction(
                state.clone(),
                CreateTransactionDto {
                    date: "2025-10-01".to_string(),
                    amount: 100,
                    description: "Test Description".to_string(),
                    bill_id: None,
                    kind: TransactionKind::Debit,
                },
            )
            .await;

            let transactions = get_transactions(state.clone()).await;
            assert_eq!(1, transactions.len());

            let result = delete_transaction(state.clone(), 1).await;

            assert!(result.is_ok());
            let transactions = get_transactions(state).await;
            assert!(transactions.is_empty());
        }

        #[tokio::test]
        async fn test_delete_transaction_not_found() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let tx = None;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx,
            };
            let state = Arc::new(Mutex::new(state));

            let result = delete_transaction(state, 1).await;

            assert_eq!(result.err().unwrap(), "Transaction not found");
        }

        #[tokio::test]
        async fn test_update_existing_transaction() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let tx = None;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx,
            };
            let state = Arc::new(Mutex::new(state));

            let _ = create_transaction(
                state.clone(),
                CreateTransactionDto {
                    date: "2025-10-01".to_string(),
                    amount: 100,
                    description: "Test Description".to_string(),
                    bill_id: None,
                    kind: TransactionKind::Debit,
                },
            )
            .await;

            assert!(get_transaction(state.clone(), 1).await.is_some());

            let payload = UpdateTransactionDto {
                date: "2025-10-01".to_string(),
                amount: 200,
                id: 1,
                bill_id: None,
                state: TransactionState::Draft,
                kind: TransactionKind::Debit,
            };

            let result = update_transaction(state.clone(), payload.clone()).await;

            assert!(result.is_ok());
            if let Some(updated_transaction) = get_transaction(state.clone(), 1).await {
                assert_eq!(updated_transaction.amount(), payload.amount());
                assert_eq!(updated_transaction.date(), payload.date());
            } else {
                panic!("Transaction should exist");
            }
        }
    }
}

pub mod timeline_service {
    use std::sync::Arc;

    use chrono::{DateTime, Local};
    use tokio::sync::Mutex;
    use tracing::instrument;
    use types::{
        bill::BillDto,
        timeline::{Timeline, TimelineEvent, TimelineItem},
        transaction::{
            TransactionDto,
            TransactionKind::{Credit, Debit},
            TransactionState,
        },
    };

    pub const DATE_FORMAT: &str = "%Y-%m-%d";

    use crate::{
        AppState,
        services::{bills_service, transactions_service},
        utils::local_datetime_parse_from_str,
    };

    #[derive(Clone)]
    enum Item<'a> {
        Transaction(&'a TransactionDto),
        Bill(&'a BillDto),
        Today(String),
    }

    impl<'a> From<&'a TransactionDto> for Item<'a> {
        fn from(value: &'a TransactionDto) -> Self {
            Self::Transaction(&value)
        }
    }

    impl<'a> From<&'a BillDto> for Item<'a> {
        fn from(value: &'a BillDto) -> Self {
            Self::Bill(&value)
        }
    }

    /// Returns a timeline of dated events
    ///
    /// - Today's date
    /// - Transactions (draft, processing, complete)
    /// - Next bill due dates
    ///
    /// # Arguments
    ///
    /// * `state`: A mutable reference to the application state
    /// * `now`: The "current" date used to generate the timeline
    ///
    /// # Returns
    ///
    /// A computed list of events, sorted by date in ASC order.
    ///
    /// ## Caching
    ///
    /// The timeline is cached in application state.
    #[instrument(skip(state))]
    pub async fn get_timeline(state: Arc<Mutex<AppState>>, now: &DateTime<Local>) -> Timeline {
        if let Some(timeline_cache) = get_cached_timeline(state.clone(), now).await {
            return timeline_cache;
        }

        let mut items: Vec<Item> = vec![];

        items.push(Item::Today(
            chrono::Local::now().format(DATE_FORMAT).to_string(),
        ));

        let transactions = transactions_service::get_transactions(state.clone()).await;
        for transaction in transactions.iter() {
            items.push(transaction.into());
        }

        let bills = bills_service::get_bills(state.clone()).await;
        for bill in bills.iter() {
            items.push(bill.into());
        }

        // Sort items by date in ascending order
        items.sort_by(|a, b| {
            let a = {
                let date = match a {
                    Item::Transaction(transaction_dto) => transaction_dto.date(),
                    Item::Bill(bill_dto) => &bill_dto.next_due(&now),
                    Item::Today(date) => date,
                };

                local_datetime_parse_from_str(date, DATE_FORMAT)
            };

            let b = {
                let date = match b {
                    Item::Transaction(transaction_dto) => transaction_dto.date(),
                    Item::Bill(bill_dto) => &bill_dto.next_due(&now),
                    Item::Today(date) => date,
                };

                local_datetime_parse_from_str(date, DATE_FORMAT)
            };

            a.cmp(&b)
        });

        let mut planning_balance = 0;
        let mut pending_balance = 0;
        let mut balance = 0;

        // Map items to timeline events
        let events: Vec<TimelineItem> = items
            .into_iter()
            .map(|item| {
                let event: TimelineEvent = match item {
                    Item::Transaction(transaction_dto) => {
                        match transaction_dto.kind {
                            Debit => match transaction_dto.state {
                                TransactionState::Draft => {
                                    planning_balance -= transaction_dto.amount;
                                }
                                TransactionState::Processing => {
                                    planning_balance -= transaction_dto.amount;
                                    pending_balance -= transaction_dto.amount;
                                }
                                TransactionState::Complete => {
                                    planning_balance -= transaction_dto.amount;
                                    pending_balance -= transaction_dto.amount;
                                    balance -= transaction_dto.amount;
                                }
                            },
                            Credit => match transaction_dto.state {
                                TransactionState::Draft => {
                                    planning_balance += transaction_dto.amount;
                                }
                                TransactionState::Processing => {
                                    planning_balance += transaction_dto.amount;
                                    pending_balance += transaction_dto.amount;
                                }
                                TransactionState::Complete => {
                                    planning_balance += transaction_dto.amount;
                                    pending_balance += transaction_dto.amount;
                                    balance += transaction_dto.amount;
                                }
                            },
                        }
                        transaction_dto.into()
                    }
                    Item::Bill(bill_dto) => {
                        planning_balance -= bill_dto.amount;

                        bill_dto.into()
                    }
                    Item::Today(date) => TimelineEvent::Today { date },
                };

                TimelineItem {
                    event,
                    planning_balance,
                    pending_balance,
                    balance,
                }
            })
            .collect();

        let timeline = Timeline {
            updated: now.to_rfc3339(),
            items: events,
        };

        {
            let mut state_locked = state.lock().await;
            state_locked.timeline_cache = Some(timeline.clone());
        };

        timeline
    }

    async fn get_cached_timeline(
        state: Arc<Mutex<AppState>>,
        now: &DateTime<Local>,
    ) -> Option<Timeline> {
        let state_locked = state.lock().await;

        match &state_locked.timeline_cache {
            Some(timeline_cache) => {
                let cached_date = DateTime::parse_from_rfc3339(&timeline_cache.updated)
                    .unwrap()
                    .with_timezone(&Local);

                if now.signed_duration_since(cached_date).as_seconds_f32() < 300f32 {
                    Some(timeline_cache.clone())
                } else {
                    None
                }
            }
            None => None,
        }
    }

    #[cfg(test)]
    mod timeline_tests {
        use std::{path::PathBuf, sync::Arc};

        use sqlx::{SqlitePool, migrate::Migrator};
        use tokio::sync::Mutex;
        use types::{
            bill::BillDto,
            timeline::{Timeline, TimelineEvent, TimelineItem},
            transaction::{
                CreateTransactionDto, TransactionDto, TransactionKind, TransactionState,
            },
        };

        use crate::{
            AppState,
            services::{
                timeline_service::{self, DATE_FORMAT},
                transactions_service,
            },
            utils::local_datetime_parse_from_str,
        };

        use pretty_assertions::assert_eq;

        static MIGRATOR: Migrator = sqlx::migrate!();

        #[tokio::test]
        async fn test_no_transactions_start_of_month() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let tx = None;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx,
            };
            let state = Arc::new(Mutex::new(state));

            let now = local_datetime_parse_from_str("2025-01-01", DATE_FORMAT);

            let timeline = timeline_service::get_timeline(state.clone(), &now).await;

            let expected: Timeline = Timeline {
                updated: "".to_string(),
                items: vec![
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-01".to_string(),
                            bill: BillDto {
                                id: 1,
                                name: "House Payment".to_string(),
                                amount: 200000,
                                due_day: 1,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -200000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-01".to_string(),
                            bill: BillDto {
                                id: 4,
                                name: "Car 1".to_string(),
                                amount: 30000,
                                due_day: 1,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-01".to_string(),
                            bill: BillDto {
                                id: 6,
                                name: "Cellphones".to_string(),
                                amount: 25000,
                                due_day: 1,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-01".to_string(),
                            bill: BillDto {
                                id: 7,
                                name: "Netflix".to_string(),
                                amount: 2500,
                                due_day: 1,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-01".to_string(),
                            bill: BillDto {
                                id: 8,
                                name: "Hulu".to_string(),
                                amount: 5000,
                                due_day: 1,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-16".to_string(),
                            bill: BillDto {
                                id: 2,
                                name: "Power".to_string(),
                                amount: 15000,
                                due_day: 16,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-16".to_string(),
                            bill: BillDto {
                                id: 3,
                                name: "Water".to_string(),
                                amount: 12500,
                                due_day: 16,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-21".to_string(),
                            bill: BillDto {
                                id: 5,
                                name: "Car 2".to_string(),
                                amount: 30000,
                                due_day: 21,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                ],
            };

            assert_eq!(expected, timeline);
        }

        #[tokio::test]
        async fn test_no_transactions_start_of_month_with_transactions_for_upcoming_bill_same_day()
        {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let tx = None;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx,
            };
            let state = Arc::new(Mutex::new(state));

            let _ = transactions_service::create_transaction(
                state.clone(),
                CreateTransactionDto {
                    date: "2025-01-01".to_string(),
                    amount: 200000,
                    description: "House Payment".to_string(),
                    bill_id: Some(1),
                    kind: TransactionKind::Debit,
                },
            );

            let now = local_datetime_parse_from_str("2025-01-01", DATE_FORMAT);

            let timeline = timeline_service::get_timeline(state.clone(), &now).await;

            let expected: Timeline = Timeline {
                updated: "".to_string(),
                items: vec![
                    TimelineItem {
                        event: TimelineEvent::Transaction {
                            date: "2025-01-01".to_string(),
                            transaction: TransactionDto {
                                id: 1,
                                description: "House Payment".to_string(),
                                date: "2025-01-01".to_string(),
                                amount: 200000,
                                is_draft: true,
                                state: TransactionState::Draft,
                                bill_id: Some(1),
                                kind: TransactionKind::Debit,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-01".to_string(),
                            bill: BillDto {
                                id: 4,
                                name: "Car 1".to_string(),
                                amount: 30000,
                                due_day: 1,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-01".to_string(),
                            bill: BillDto {
                                id: 6,
                                name: "Cellphones".to_string(),
                                amount: 25000,
                                due_day: 1,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-01".to_string(),
                            bill: BillDto {
                                id: 7,
                                name: "Netflix".to_string(),
                                amount: 2500,
                                due_day: 1,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-01".to_string(),
                            bill: BillDto {
                                id: 8,
                                name: "Hulu".to_string(),
                                amount: 5000,
                                due_day: 1,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-16".to_string(),
                            bill: BillDto {
                                id: 2,
                                name: "Power".to_string(),
                                amount: 15000,
                                due_day: 16,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-16".to_string(),
                            bill: BillDto {
                                id: 3,
                                name: "Water".to_string(),
                                amount: 12500,
                                due_day: 16,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-21".to_string(),
                            bill: BillDto {
                                id: 5,
                                name: "Car 2".to_string(),
                                amount: 30000,
                                due_day: 21,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                ],
            };

            assert_eq!(expected, timeline);
        }

        #[tokio::test]
        async fn test_no_transactions_mid_month() {
            let pool = SqlitePool::connect("sqlite::memory:")
                .await
                .expect("should connect to db");

            let _ = MIGRATOR.run(&pool).await;

            let tx = None;

            let state = AppState {
                home_dir: PathBuf::default(),
                db: Some(pool),
                timeline_cache: None,
                tx,
            };
            let state = Arc::new(Mutex::new(state));

            let now = local_datetime_parse_from_str("2025-01-17", DATE_FORMAT);

            let timeline = timeline_service::get_timeline(state.clone(), &now).await;

            let expected: Timeline = Timeline {
                updated: "".to_string(),
                items: vec![
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-01-21".to_string(),
                            bill: BillDto {
                                id: 5,
                                name: "Car 2".to_string(),
                                amount: 30000,
                                due_day: 21,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-02-01".to_string(),
                            bill: BillDto {
                                id: 1,
                                name: "House Payment".to_string(),
                                amount: 200000,
                                due_day: 1,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-02-01".to_string(),
                            bill: BillDto {
                                id: 4,
                                name: "Car 1".to_string(),
                                amount: 30000,
                                due_day: 1,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-02-01".to_string(),
                            bill: BillDto {
                                id: 6,
                                name: "Cellphones".to_string(),
                                amount: 25000,
                                due_day: 1,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-02-01".to_string(),
                            bill: BillDto {
                                id: 7,
                                name: "Netflix".to_string(),
                                amount: 2500,
                                due_day: 1,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-02-01".to_string(),
                            bill: BillDto {
                                id: 8,
                                name: "Hulu".to_string(),
                                amount: 5000,
                                due_day: 1,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-02-16".to_string(),
                            bill: BillDto {
                                id: 2,
                                name: "Power".to_string(),
                                amount: 15000,
                                due_day: 16,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                    TimelineItem {
                        event: TimelineEvent::BillDue {
                            date: "2025-02-16".to_string(),
                            bill: BillDto {
                                id: 3,
                                name: "Water".to_string(),
                                amount: 12500,
                                due_day: 16,
                                autopay: false,
                            },
                        },
                        planning_balance: 0,
                        pending_balance: 0,
                        balance: -230000,
                    },
                ],
            };

            assert_eq!(expected, timeline);
        }
    }
}

pub mod debt_service {
    use std::{sync::Arc, vec};

    use futures_util::TryStreamExt;
    use tokio::sync::Mutex;
    use types::debt::{CreateDebtDto, Debt, DebtDto, UpdateDebtDto};

    use crate::AppState;

    use sqlx::Row;

    pub async fn get_debts(state: Arc<Mutex<AppState>>) -> Vec<DebtDto> {
        let state = state.clone();
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        let mut rows = sqlx::query("SELECT id, name, amount, bill_id FROM Debts").fetch(conn);

        let mut debts: Vec<DebtDto> = vec![];

        while let Some(row) = rows.try_next().await.unwrap() {
            debts.push(DebtDto {
                id: row.try_get("id").unwrap(),
                name: row.try_get("name").unwrap(),
                amount: row.try_get("amount").unwrap(),
                bill_id: row.try_get("bill_id").unwrap(),
            });
        }

        debts
    }

    pub async fn get_debt(state: Arc<Mutex<AppState>>, id: i64) -> Result<DebtDto, String> {
        let state = state.clone();
        let state = state.lock().await;
        let conn = state.db.as_ref().unwrap();

        let row = sqlx::query("SELECT id, name, amount, bill_id FROM Debts WHERE id = $1")
            .bind(id)
            .fetch_one(conn)
            .await;

        match row {
            Ok(row) => {
                if row.is_empty() {
                    Err("Debt not found".into())
                } else {
                    Ok(DebtDto {
                        id,
                        name: row.try_get("name").unwrap(),
                        amount: row.try_get("amount").unwrap(),
                        bill_id: row.try_get("bill_id").unwrap(),
                    })
                }
            }
            Err(err) => Err(format!("Error getting debt: {err:#?}")),
        }
    }

    pub async fn update_debt(
        state: Arc<Mutex<AppState>>,
        payload: UpdateDebtDto,
    ) -> Result<DebtDto, String> {
        let mut errs: Vec<String> = vec![];

        if payload.amount() == 0 {
            errs.push("Amount can't be zero".to_string())
        }

        if !errs.is_empty() {
            return Err(serde_json::to_string(&errs).expect("should serialize errors"));
        }

        let id = payload.id.clone();

        let bill = get_debt(state.clone(), id).await;

        match bill {
            Ok(_) => {
                let result = {
                    let state = state.lock().await;
                    let conn = state.db.as_ref().unwrap();

                    sqlx::query(
                        r#"
            UPDATE debts SET name = $1, amount = $2, bill_id = $3 WHERE id = $4
        "#,
                    )
                    .bind(payload.name())
                    .bind(payload.amount())
                    .bind(payload.bill_id)
                    .bind(id)
                    .execute(conn)
                    .await
                };

                {
                    let mut state = state.lock().await;

                    state.timeline_cache = None;
                };

                match result {
                    Ok(_) => get_debt(state, id).await,
                    Err(err) => Err(format!("There was an error updating debt: {err:#?}")),
                }
            }
            Err(_) => todo!(),
        }
    }

    pub async fn delete_debt(state: Arc<Mutex<AppState>>, id: i64) -> Result<(), String> {
        let state = state.clone();

        let result = {
            let state = state.lock().await;
            let conn = state.db.as_ref().unwrap();

            let result = sqlx::query("DELETE FROM debts WHERE id = $1")
                .bind(id)
                .execute(conn)
                .await;

            result
        };

        match result {
            Ok(result) => {
                if result.rows_affected() == 0 {
                    Err("Debt not found".to_string())
                } else {
                    {
                        let mut state = state.lock().await;

                        state.timeline_cache = None;
                    };

                    Ok(())
                }
            }
            Err(_) => Err("Debt not found".to_string()),
        }
    }

    pub async fn create_debt(
        state: Arc<Mutex<AppState>>,
        payload: CreateDebtDto,
    ) -> Result<DebtDto, String> {
        let state = state.clone();

        let mut errs: Vec<String> = vec![];

        let name = payload.name();

        if name.is_empty() {
            errs.push("Name cannot be empty".to_string());
        }

        let amount = payload.amount();

        if amount == 0 {
            errs.push("Amount can't be zero".to_string())
        }

        if !errs.is_empty() {
            return Err(serde_json::to_string(&errs).expect("should serialize errors"));
        }

        let debt_id = {
            let state = state.lock().await;
            let conn = state.db.as_ref().unwrap();

            let debt_id = sqlx::query(
                r#"
               INSERT INTO debts (name, amount, bill_id) VALUES ($1, $2, $3);
            "#,
            )
            .bind(payload.name())
            .bind(payload.amount())
            .bind(payload.bill_id())
            .bind(true)
            .execute(conn)
            .await
            .expect("query should work")
            .last_insert_rowid();

            debt_id
        };

        let debt = Debt {
            id: debt_id,
            name: name.to_string(),
            amount: payload.amount(),
            bill_id: payload.bill_id().clone(),
        };

        {
            let mut state = state.lock().await;

            state.timeline_cache = None;
        };

        Ok(debt.into())
    }

    #[cfg(test)]
    mod bills_service_test {}
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

            {
                let mut state = state.lock().await;

                state.timeline_cache = None;
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
