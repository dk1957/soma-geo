-- Add missing columns to onboarding_audits table
ALTER TABLE onboarding_audits 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_onboarding_audits_user_id ON onboarding_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_audits_account_id ON onboarding_audits(account_id);

-- Update RLS policies to use proper user/account filtering
DROP POLICY IF EXISTS "Users can view their own audit data" ON onboarding_audits;
DROP POLICY IF EXISTS "Users can insert audit data" ON onboarding_audits;

CREATE POLICY "Users can view their own audit data" ON onboarding_audits
  FOR SELECT USING (
    user_id = auth.uid() 
    OR account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own audit data" ON onboarding_audits
  FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    OR account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own audit data" ON onboarding_audits
  FOR UPDATE USING (
    user_id = auth.uid() 
    OR account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Update related table policies to check audit ownership
DROP POLICY IF EXISTS "Users can view competitors" ON competitors;
DROP POLICY IF EXISTS "Users can insert competitors" ON competitors;

CREATE POLICY "Users can view competitors" ON competitors
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM onboarding_audits 
      WHERE user_id = auth.uid() 
      OR account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert competitors" ON competitors
  FOR INSERT WITH CHECK (
    audit_id IN (
      SELECT id FROM onboarding_audits 
      WHERE user_id = auth.uid() 
      OR account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

-- Update mentions policies
DROP POLICY IF EXISTS "Users can view mentions" ON ai_mentions;
DROP POLICY IF EXISTS "Users can insert mentions" ON ai_mentions;

CREATE POLICY "Users can view mentions" ON ai_mentions
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM onboarding_audits 
      WHERE user_id = auth.uid() 
      OR account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert mentions" ON ai_mentions
  FOR INSERT WITH CHECK (
    audit_id IN (
      SELECT id FROM onboarding_audits 
      WHERE user_id = auth.uid() 
      OR account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

-- Update rankings policies
DROP POLICY IF EXISTS "Users can view rankings" ON ai_rankings;
DROP POLICY IF EXISTS "Users can insert rankings" ON ai_rankings;

CREATE POLICY "Users can view rankings" ON ai_rankings
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM onboarding_audits 
      WHERE user_id = auth.uid() 
      OR account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert rankings" ON ai_rankings
  FOR INSERT WITH CHECK (
    audit_id IN (
      SELECT id FROM onboarding_audits 
      WHERE user_id = auth.uid() 
      OR account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

-- Update sources policies
DROP POLICY IF EXISTS "Users can view sources" ON citation_sources;
DROP POLICY IF EXISTS "Users can insert sources" ON citation_sources;

CREATE POLICY "Users can view sources" ON citation_sources
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM onboarding_audits 
      WHERE user_id = auth.uid() 
      OR account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert sources" ON citation_sources
  FOR INSERT WITH CHECK (
    audit_id IN (
      SELECT id FROM onboarding_audits 
      WHERE user_id = auth.uid() 
      OR account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

-- Update opportunities policies
DROP POLICY IF EXISTS "Users can view opportunities" ON optimization_opportunities;
DROP POLICY IF EXISTS "Users can insert opportunities" ON optimization_opportunities;

CREATE POLICY "Users can view opportunities" ON optimization_opportunities
  FOR SELECT USING (
    audit_id IN (
      SELECT id FROM onboarding_audits 
      WHERE user_id = auth.uid() 
      OR account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert opportunities" ON optimization_opportunities
  FOR INSERT WITH CHECK (
    audit_id IN (
      SELECT id FROM onboarding_audits 
      WHERE user_id = auth.uid() 
      OR account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );