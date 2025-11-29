-- Add down migration script here

-- Create the original table structure without the additional column
CREATE TABLE Transactions_old (
    id INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    is_draft BOOLEAN NOT NULL,
    bill_id INTEGER
);

-- Copy data from the modified table to the original table structure
INSERT INTO Transactions_old (id, description, date, amount, is_draft, bill_id)
SELECT id, description, date, amount, is_draft, bill_id
FROM Transactions;

-- Drop the modified table
DROP TABLE Transactions;

-- Rename the old table to the original table name
ALTER TABLE Transactions_old RENAME TO Transactions;