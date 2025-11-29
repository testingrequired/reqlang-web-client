-- Add up migration script here
UPDATE Bills SET day_due = 1 WHERE name = 'Netflix';
UPDATE Bills SET day_due = 21 WHERE name = 'Car 2';
UPDATE Bills SET day_due = 16 WHERE name = 'Water';
UPDATE Bills SET day_due = 16 WHERE name = 'Power';
