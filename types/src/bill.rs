use chrono::{DateTime, Datelike, Days, Local, Months};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct CreateBillDto {
    pub name: String,
    pub amount: i64,
    pub day_due: i8,
    pub autopay: bool,
}

impl CreateBillDto {
    pub fn amount(&self) -> i64 {
        self.amount
    }

    pub fn day_due(&self) -> i8 {
        self.day_due
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn autopay(&self) -> bool {
        self.autopay
    }
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct UpdateBillDto {
    pub id: i64,
    pub amount: i64,
    pub day_due: i8,
    pub autopay: bool,
}

impl UpdateBillDto {
    pub fn id(self) -> i64 {
        self.id
    }

    pub fn amount(&self) -> i64 {
        self.amount
    }

    pub fn day_due(&self) -> i8 {
        self.day_due
    }

    pub fn autopay(&self) -> bool {
        self.autopay
    }
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
#[ts(export)]
pub struct BillDto {
    pub id: i64,
    pub name: String,
    pub amount: i64,
    pub due_day: i8,
    pub autopay: bool,
}

impl BillDto {
    pub fn new(id: i64, name: &str, amount: &str, due_day: i8, autopay: bool) -> Self {
        Self {
            id,
            name: name.to_string(),
            amount: amount.parse().expect("should parse to i64"),
            due_day,
            autopay,
        }
    }

    pub fn id(&self) -> i64 {
        self.id
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn amount(&self) -> i64 {
        self.amount
    }

    pub fn autopay(&self) -> bool {
        self.autopay
    }

    // Detirmine the next due date based on the current date and the due day
    pub fn next_due(&self, now: &DateTime<Local>) -> String {
        // Today's day of the month
        let now_day = now.clone().day();
        // Which day of the month the bill is due
        let due_day = self.due_day.try_into().unwrap();

        // If we're already past this month's due day, find next month's due date
        if now_day > due_day {
            now.checked_add_months(Months::new(1))
                .unwrap()
                .with_day(due_day)
                .unwrap()
                .format("%Y-%m-%d")
                .to_string()

        // Else find this month's due date
        } else {
            let delta = due_day - now_day;

            now.checked_add_days(Days::new(delta as u64))
                .unwrap()
                .format("%Y-%m-%d")
                .to_string()
        }
    }
}

impl From<Bill> for BillDto {
    fn from(value: Bill) -> Self {
        Self {
            id: value.id,
            name: value.name().to_string(),
            amount: value.amount(),
            due_day: value.due_day,
            autopay: value.autopay,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Bill {
    pub id: i64,
    pub name: String,
    pub amount: BillAmount,
    pub due_day: i8,
    pub autopay: bool,
}

impl Bill {
    pub fn new(id: i64, name: &str, amount: &str, due_day: i8, autopay: bool) -> Self {
        Self {
            id,
            name: name.to_string(),
            amount: BillAmount::from(amount),
            due_day,
            autopay,
        }
    }

    pub fn id(&self) -> i64 {
        self.id
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn set_name(&mut self, name: &str) {
        self.name = name.to_string();
    }

    pub fn amount(&self) -> i64 {
        self.amount.value()
    }

    pub fn set_amount(&mut self, amount: i64) {
        self.amount = BillAmount::from(amount);
    }

    pub fn amount_str(&self) -> String {
        self.amount.value_str()
    }

    pub fn set_amount_str(&mut self, amount: &str) {
        self.amount = BillAmount::from(amount);
    }
}

#[derive(TS, Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct BillAmount(pub i64);

impl BillAmount {
    pub fn value(&self) -> i64 {
        self.0
    }

    pub fn value_str(&self) -> String {
        let mut str = self.0.to_string();
        let str_len = str.len();
        let decimal_index = str_len - 2;
        str.insert_str(decimal_index, ".");

        str
    }
}

impl From<i64> for BillAmount {
    fn from(value: i64) -> Self {
        BillAmount(value)
    }
}

impl From<&str> for BillAmount {
    fn from(input: &str) -> Self {
        let (integer_part, fractional_part) = if let Some(dot_index) = input.find('.') {
            (input[..dot_index].to_string(), &input[dot_index + 1..])
        } else {
            (input.to_string(), "")
        };

        let mut integer_value: i64 = integer_part.parse().expect("Invalid integer part");

        let fractional_value: i64 = match fractional_part.len() {
            0 => 0,
            1 => {
                fractional_part
                    .parse::<i64>()
                    .expect("Invalid fractional part")
                    * 10
            }
            _ => fractional_part[..2]
                .parse::<i64>()
                .expect("Invalid fractional part"),
        };

        integer_value = integer_value * 100 + fractional_value;

        Self(integer_value)
    }
}

#[cfg(test)]
mod bill_tests {
    use super::*;

    #[test]
    fn amount() {
        let bill = Bill::new(0, "test", "500", 1, false);
        assert_eq!(50000, bill.amount());
    }

    #[test]
    fn amount_str() {
        let bill = Bill::new(0, "test", "500", 1, false);
        assert_eq!("500.00", &bill.amount_str());
    }

    #[test]
    fn set_amount() {
        let mut bill = Bill::new(0, "test", "500", 1, false);
        bill.set_amount(1000000);
        assert_eq!("10000.00", &bill.amount_str());
    }

    #[test]
    fn set_amount_str() {
        let mut bill = Bill::new(0, "test", "500", 1, false);
        bill.set_amount_str("10000");
        assert_eq!("10000.00", &bill.amount_str());
    }
}

#[cfg(test)]
mod bill_amount_tests {
    use super::*;

    #[test]
    fn parse_from_i64() {
        let amount = BillAmount::from(1000);
        assert_eq!(1000, amount.value());
    }

    #[test]
    fn parse_from_string_without_decimal_place() {
        let amount = BillAmount::from("1000");
        assert_eq!(100000, amount.value());
    }

    #[test]
    fn get_value_1000() {
        let amount = BillAmount::from("1000");
        assert_eq!(100000, amount.value());
    }

    #[test]
    fn get_value_string_1000() {
        let amount = BillAmount::from("1000");
        assert_eq!("1000.00", amount.value_str());
    }

    #[test]
    fn get_value_10() {
        let amount = BillAmount::from("10");
        assert_eq!(1000, amount.value());
    }

    #[test]
    fn get_value_string_10() {
        let amount = BillAmount::from("10");
        assert_eq!("10.00", amount.value_str());
    }

    #[test]
    fn get_value_1() {
        let amount = BillAmount::from("1");
        assert_eq!(100, amount.value());
    }

    #[test]
    fn get_value_string_1() {
        let amount = BillAmount::from("1");
        assert_eq!("1.00", amount.value_str());
    }

    #[test]
    fn parse_from_string_with_decimal_place() {
        let amount = BillAmount::from("1000.00");
        assert_eq!(100000, amount.value());
    }
}

#[cfg(test)]
mod bill_dto_tests {
    use chrono::{Local, TimeZone};

    use crate::bill::BillDto;

    #[test]
    fn find_next_due_date_this_month() {
        let bill = BillDto {
            id: 1,
            name: "Test".to_string(),
            amount: 100000,
            due_day: 5,
            autopay: false,
        };

        let now = local_datetime_parse_from_str("2025-10-01", "%Y-%m-%d");

        let next_due_date = bill.next_due(&now);

        assert_eq!("2025-10-05", next_due_date);
    }

    #[test]
    fn find_next_due_date_next_month() {
        let bill = BillDto {
            id: 1,
            name: "Test".to_string(),
            amount: 100000,
            due_day: 5,
            autopay: false,
        };

        let now = local_datetime_parse_from_str("2025-10-06", "%Y-%m-%d");

        let next_due_date = bill.next_due(&now);

        assert_eq!("2025-11-05", next_due_date);
    }

    #[test]
    fn find_next_due_date_next_month_end_of_year() {
        let bill = BillDto {
            id: 1,
            name: "Test".to_string(),
            amount: 100000,
            due_day: 5,
            autopay: false,
        };

        let now = local_datetime_parse_from_str("2025-11-06", "%Y-%m-%d");

        let next_due_date = bill.next_due(&now);

        assert_eq!("2025-12-05", next_due_date);
    }

    #[test]
    fn find_next_due_date_next_month_year_year() {
        let bill = BillDto {
            id: 1,
            name: "Test".to_string(),
            amount: 100000,
            due_day: 5,
            autopay: false,
        };

        let now = local_datetime_parse_from_str("2025-12-06", "%Y-%m-%d");

        let next_due_date = bill.next_due(&now);

        assert_eq!("2026-01-05", next_due_date);
    }

    fn local_datetime_parse_from_str(date: &str, fmt: &str) -> chrono::DateTime<Local> {
        let naive_date = chrono::NaiveDate::parse_from_str(date, fmt).unwrap();
        let naive_datetime = naive_date.and_hms_opt(0, 0, 0).unwrap();
        let datetime_local = Local.from_local_datetime(&naive_datetime).unwrap();

        datetime_local
    }
}
