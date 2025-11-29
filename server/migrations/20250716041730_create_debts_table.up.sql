-- Add up migration script here
CREATE TABLE Debts (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    bill_id INTEGER
);
