-- Allow NULL prompt_text in responses table
-- Migration: 20250912000000_allow_null_prompt_text_in_responses.sql

-- Drop NOT NULL constraint from prompt_text in responses table
ALTER TABLE public.responses 
ALTER COLUMN prompt_text DROP NOT NULL;

-- Add default value for prompt_text to avoid future issues
ALTER TABLE public.responses
ALTER COLUMN prompt_text SET DEFAULT '';

-- Backfill NULL prompt_text values with empty string
UPDATE public.responses
SET prompt_text = ''
WHERE prompt_text IS NULL;

COMMENT ON COLUMN public.responses.prompt_text IS 'Original prompt text used to generate this response, can be empty for system-generated responses';