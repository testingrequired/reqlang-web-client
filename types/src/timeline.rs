use std::collections::{HashMap, HashSet};

use chrono::Local;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{bill::BillDto, transaction::TransactionDto, utils::local_datetime_parse_from_str};

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct Timeline {
    pub updated: String,
    pub items: Vec<TimelineItem>,
}

impl Timeline {
    pub fn get_rolling_balance_on_date(&self, timeline_date: &str) -> i64 {
        let items_on_date: Vec<_> = self
            .items
            .iter()
            .filter(|item| match &item.event {
                TimelineEvent::Transaction { date, .. } => timeline_date == date,
                TimelineEvent::BillDue { date, .. } => timeline_date == date,
                TimelineEvent::Today { .. } => false,
            })
            .collect();

        items_on_date.last().map(|item| item.balance).unwrap_or(0)
    }

    pub fn get_rolling_balance_on_dates(
        &self,
        start_date_str: &str,
        end_date_str: &str,
    ) -> HashMap<String, i64> {
        let start_date = local_datetime_parse_from_str(start_date_str, "%Y-%m-%d");
        let end_date = local_datetime_parse_from_str(end_date_str, "%Y-%m-%d");

        let filtered_items: Vec<_> = self
            .items
            .iter()
            .filter(|item| match &item.event {
                TimelineEvent::Transaction { date, .. } => {
                    let parsed_date = local_datetime_parse_from_str(date, "%Y-%m-%d");
                    parsed_date >= start_date && parsed_date <= end_date
                }
                TimelineEvent::BillDue { date, .. } => {
                    let parsed_date = local_datetime_parse_from_str(date, "%Y-%m-%d");
                    parsed_date >= start_date && parsed_date <= end_date
                }
                TimelineEvent::Today { .. } => false,
            })
            .collect();

        let mut dates: HashSet<String> = HashSet::new();

        for item in filtered_items.into_iter() {
            match &item.event {
                TimelineEvent::Transaction { date, .. } => {
                    dates.insert(date.clone());
                }
                TimelineEvent::BillDue { date, .. } => {
                    dates.insert(date.clone());
                }
                TimelineEvent::Today { date } => {
                    dates.insert(date.clone());
                }
            };
        }

        let mut result: HashMap<String, i64> = HashMap::new();

        for date in dates.into_iter() {
            let balance = self.get_rolling_balance_on_date(&date);
            result.insert(date, balance);
        }

        result
    }
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct TimelineItem {
    pub event: TimelineEvent,
    #[ts(type = "number")]
    /// Balance from all completed, pending, and planned transactions
    pub planning_balance: i64,
    #[ts(type = "number")]
    /// Balance from all completed and pending transactions
    pub pending_balance: i64,
    #[ts(type = "number")]
    /// Balance from all completed transactions
    pub balance: i64,
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "kind", content = "data")]
#[ts(export)]
pub enum TimelineEvent {
    Transaction {
        date: String,
        transaction: TransactionDto,
    },
    BillDue {
        date: String,
        bill: BillDto,
    },
    Today {
        date: String,
    },
}

impl TimelineEvent {
    pub fn is_transaction(&self) -> bool {
        matches!(self, TimelineEvent::Transaction { .. })
    }

    pub fn is_bill_due(&self) -> bool {
        matches!(self, TimelineEvent::BillDue { .. })
    }
}

impl<'a> From<&'a TransactionDto> for TimelineEvent {
    fn from(value: &'a TransactionDto) -> Self {
        Self::Transaction {
            date: value.date().into(),
            transaction: value.clone(),
        }
    }
}

impl<'a> From<&'a BillDto> for TimelineEvent {
    fn from(value: &'a BillDto) -> Self {
        Self::BillDue {
            date: value.next_due(&Local::now()),
            bill: value.clone(),
        }
    }
}

#[cfg(test)]
mod timeline_tests {
    use crate::transaction::{self, TransactionDto};

    use super::*;

    #[test]
    fn get_rolling_balance_for_date_with_empty_items() {
        let timeline = Timeline {
            updated: "".to_string(),
            items: vec![],
        };

        let rolling_balance = timeline.get_rolling_balance_on_date("2023-10-01");

        assert_eq!(0, rolling_balance);
    }

    #[test]
    fn get_rolling_balance_for_date_with_two_items_on_same_date() {
        let timeline = Timeline {
            updated: "".to_string(),
            items: vec![
                TimelineItem {
                    event: TimelineEvent::Transaction {
                        date: "2023-10-01".to_string(),
                        transaction: TransactionDto {
                            id: 1,
                            description: "Test Transaction".to_string(),
                            date: "2023-10-01".to_string(),
                            amount: 10000,
                            is_draft: true,
                            state: transaction::TransactionState::Draft,
                            bill_id: None,
                            kind: transaction::TransactionKind::Debit,
                        },
                    },
                    planning_balance: 0,
                    pending_balance: 0,
                    balance: -10000,
                },
                TimelineItem {
                    event: TimelineEvent::Transaction {
                        date: "2023-10-01".to_string(),
                        transaction: TransactionDto {
                            id: 1,
                            description: "Test Transaction 2".to_string(),
                            date: "2023-10-01".to_string(),
                            amount: 20000,
                            is_draft: true,
                            state: transaction::TransactionState::Draft,
                            bill_id: None,
                            kind: transaction::TransactionKind::Debit,
                        },
                    },
                    planning_balance: 0,
                    pending_balance: 0,
                    balance: -30000,
                },
            ],
        };

        let rolling_balance = timeline.get_rolling_balance_on_date("2023-10-01");

        assert_eq!(-30000, rolling_balance);
    }
}
