-- Add down migration script here
DELETE FROM Bills WHERE name = 'House Payment';
DELETE FROM Bills WHERE name = 'Power';
DELETE FROM Bills WHERE name = 'Water';
DELETE FROM Bills WHERE name = 'Car 1';
DELETE FROM Bills WHERE name = 'Car 2';
DELETE FROM Bills WHERE name = 'Cellphones';
DELETE FROM Bills WHERE name = 'Netflix';
DELETE FROM Bills WHERE name = 'Hulu';