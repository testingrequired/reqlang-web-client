-- Add up migration script here
CREATE TABLE Transactions (
    id INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    is_draft BOOLEAN NOT NULL,
    bill_id INTEGER
);
