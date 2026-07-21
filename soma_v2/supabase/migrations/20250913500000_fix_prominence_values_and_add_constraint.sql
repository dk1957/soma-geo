-- Fix invalid prominence values and add check constraint
-- Migration: 20250913500000_fix_prominence_values_and_add_constraint.sql

-- This migration updates invalid prominence values and then adds a check constraint

-- First, update any numeric or invalid prominence values to 'body'
UPDATE mentions
SET prominence = 'body'
WHERE prominence NOT IN ('title', 'first_paragraph', 'body', 'conclusion');

-- Now add the check constraint
ALTER TABLE mentions
ADD CONSTRAINT mentions_prominence_check
CHECK (prominence IN ('title', 'first_paragraph', 'body', 'conclusion'));

-- Add comment explaining valid values
COMMENT ON CONSTRAINT mentions_prominence_check ON mentions IS 
'Ensures prominence value is one of: title, first_paragraph, body, conclusion';