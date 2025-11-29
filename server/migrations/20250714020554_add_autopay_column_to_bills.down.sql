-- Add down migration script here

-- Create the original table structure without the additional column
CREATE TABLE Bills_old (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    day_due INTEGER NOT NULL
);

-- Copy data from the modified table to the original table structure
INSERT INTO Bills_old (id, name, amount, day_due)
SELECT id, name, amount, day_due
FROM Bills;

-- Drop the modified table
DROP TABLE Bills;

-- Rename the old table to the original table name
ALTER TABLE Bills_old RENAME TO Bills;