-- Add down migration script here
INSERT INTO Bills (name, amount) VALUES ('House Payment', 200000);
INSERT INTO Bills (name, amount) VALUES ('Power', 15000);
INSERT INTO Bills (name, amount) VALUES ('Water', 12500);
INSERT INTO Bills (name, amount) VALUES ('Car 1', 30000);
INSERT INTO Bills (name, amount) VALUES ('Car 2', 30000);
INSERT INTO Bills (name, amount) VALUES ('Cellphones', 25000);
INSERT INTO Bills (name, amount) VALUES ('Netflix', 2500);
INSERT INTO Bills (name, amount) VALUES ('Hulu', 5000);

UPDATE Bills SET day_due = 1 WHERE name = 'Netflix';
UPDATE Bills SET day_due = 21 WHERE name = 'Car 2';
UPDATE Bills SET day_due = 16 WHERE name = 'Water';
UPDATE Bills SET day_due = 16 WHERE name = 'Power';
