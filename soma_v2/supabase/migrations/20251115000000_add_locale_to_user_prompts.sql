-- Add locale/geography column to user_prompts table
-- This enables targeting specific geographic regions for each prompt

-- Add locale column (foreign key to countries table)
ALTER TABLE user_prompts
ADD COLUMN IF NOT EXISTS locale_id UUID REFERENCES countries(id) ON DELETE SET NULL;

-- Add index for efficient querying by locale
CREATE INDEX IF NOT EXISTS idx_user_prompts_locale ON user_prompts(locale_id);

-- Add index for combined account + locale queries
CREATE INDEX IF NOT EXISTS idx_user_prompts_account_locale ON user_prompts(account_id, locale_id);

-- Add comment for documentation
COMMENT ON COLUMN user_prompts.locale_id IS 'Geographic locale/country for targeting this prompt. References countries table. NULL = global/no specific targeting.';
