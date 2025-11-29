-- Add up migration script here

-- Create a new table with the additional column
CREATE TABLE Bills_new (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    day_due INTEGER NOT NULL,
    autopay INTEGER NOT NULL
);

-- Copy data from the old table to the new table
INSERT INTO Bills_new (id, name, amount, day_due, autopay)
SELECT id, name, amount, day_due, 0
FROM Bills;

-- Drop the old table
DROP TABLE Bills;

-- Rename the new table to the original table name
ALTER TABLE Bills_new RENAME TO Bills;
