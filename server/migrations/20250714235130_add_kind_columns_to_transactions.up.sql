-- Add up migration script here

-- Create a new table with the additional column
CREATE TABLE Transactions_new (
    id INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    is_draft BOOLEAN NOT NULL,
    state INTEGER NOT NULL,
    bill_id INTEGER,
    kind INTEGER NOT NULL
);

-- Copy data from the old table to the new table
INSERT INTO Transactions_new (id, description, date, amount, is_draft, bill_id, state, kind)
SELECT
    id,
    description,
    date,
    amount,
    is_draft,
    bill_id,
    state,
    0
FROM Transactions;

-- Drop the old table
DROP TABLE Transactions;

-- Rename the new table to the original table name
ALTER TABLE Transactions_new RENAME TO Transactions;
