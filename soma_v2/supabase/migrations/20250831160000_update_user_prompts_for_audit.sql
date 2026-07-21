-- Add audit_id to user_prompts table to link prompts to specific audits
ALTER TABLE user_prompts 
ADD COLUMN audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_prompts_audit_id ON user_prompts(audit_id);

-- Update the trigger function to handle the new field
CREATE OR REPLACE FUNCTION store_audit_prompts(
    p_audit_id UUID,
    p_account_id UUID,
    p_prompts JSONB
) RETURNS VOID AS $$
DECLARE
    prompt_item JSONB;
BEGIN
    -- Delete existing prompts for this audit
    DELETE FROM user_prompts WHERE audit_id = p_audit_id;
    
    -- Insert new prompts
    FOR prompt_item IN SELECT * FROM jsonb_array_elements(p_prompts)
    LOOP
        INSERT INTO user_prompts (
            audit_id,
            account_id,
            prompt_id,
            prompt_text,
            category,
            priority,
            is_selected,
            created_at
        ) VALUES (
            p_audit_id,
            p_account_id,
            (prompt_item->>'id')::VARCHAR(255),
            prompt_item->>'text',
            COALESCE(prompt_item->>'category', 'general'),
            COALESCE((prompt_item->>'priority')::INTEGER, 1),
            true, -- All prompts stored here are selected by user
            NOW()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION store_audit_prompts(UUID, UUID, JSONB) TO authenticated;