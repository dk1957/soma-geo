-- RLS policies for brand_contexts table
ALTER TABLE brand_contexts ENABLE ROW LEVEL SECURITY;

-- Policy for select - users can only see their own brand contexts
CREATE POLICY brand_contexts_select ON brand_contexts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for insert - users can only insert their own brand contexts
CREATE POLICY brand_contexts_insert ON brand_contexts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
-- Policy for update - users can only update their own brand contexts
CREATE POLICY brand_contexts_update ON brand_contexts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for llm_simulations table
ALTER TABLE llm_simulations ENABLE ROW LEVEL SECURITY;

-- Policy for select - users can only see their own simulations
CREATE POLICY llm_simulations_select ON llm_simulations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for insert - users can only insert their own simulations
CREATE POLICY llm_simulations_insert ON llm_simulations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
-- Policy for update - users can only update their own simulations
CREATE POLICY llm_simulations_update ON llm_simulations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for llm_responses table
ALTER TABLE llm_responses ENABLE ROW LEVEL SECURITY;

-- Policy for select - users can only see their own responses
CREATE POLICY llm_responses_select ON llm_responses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for insert - users can only insert their own responses  
CREATE POLICY llm_responses_insert ON llm_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);