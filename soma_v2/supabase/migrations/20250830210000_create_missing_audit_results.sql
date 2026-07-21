-- Create audit_results table that the frontend expects
CREATE TABLE IF NOT EXISTS audit_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  website TEXT,
  target_markets TEXT[],
  industry TEXT,
  audit_data JSONB NOT NULL,
  ldi_score DECIMAL(5,2),
  visibility_score DECIMAL(5,2),
  market_position_score DECIMAL(5,2),
  authority_index DECIMAL(5,2),
  audit_type TEXT DEFAULT 'free_tier',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_results_account_id ON audit_results(account_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_user_id ON audit_results(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_created_at ON audit_results(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_results_brand_name ON audit_results(brand_name);

-- Enable RLS
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own audit results" ON audit_results
  FOR SELECT USING (
    auth.uid() = user_id OR 
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert audit results" ON audit_results
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their audit results" ON audit_results
  FOR UPDATE USING (
    auth.uid() = user_id OR
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );