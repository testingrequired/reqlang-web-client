-- Add down migration script here
UPDATE Bills SET day_due = 1 WHERE name = 'Netflix';
UPDATE Bills SET day_due = 1 WHERE name = 'Car 2';
UPDATE Bills SET day_due = 1 WHERE name = 'Water';
UPDATE Bills SET day_due = 1 WHERE name = 'Power';
