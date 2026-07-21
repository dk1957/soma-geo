-- Test insert into mentions table with different prominence values
-- Test script: 20250913300000_test_prominence_inserts.sql

-- Try to insert a record with 'first_paragraph' as prominence value
INSERT INTO mentions (
  brand_id, 
  mention_text, 
  prominence
) VALUES (
  'f1b0123b-ff18-4807-b337-37b92ab5f300', -- Valid brand ID from the database
  'Test mention 1',
  'first_paragraph'
) RETURNING id;

-- Try with a numeric value that should be converted to text
INSERT INTO mentions (
  brand_id, 
  mention_text, 
  prominence
) VALUES (
  'f1b0123b-ff18-4807-b337-37b92ab5f300',  -- Valid brand ID from the database
  'Test mention 2',
  5
) RETURNING id;

-- Try with explicit text cast
INSERT INTO mentions (
  brand_id, 
  mention_text, 
  prominence
) VALUES (
  'f1b0123b-ff18-4807-b337-37b92ab5f300',  -- Valid brand ID from the database
  'Test mention 3',
  'first_paragraph'::text
) RETURNING id;