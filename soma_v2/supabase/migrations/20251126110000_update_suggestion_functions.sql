-- ============================================================================
-- UPDATE: Suggestion Functions to Delete After Processing
-- ============================================================================
-- This migration updates the accept_prompt_suggestion function to delete 
-- the suggestion after creating the prompt, and updates reject to delete.
-- ============================================================================

-- Function to accept a suggestion, create a prompt, and delete the suggestion
CREATE OR REPLACE FUNCTION accept_prompt_suggestion(
    p_suggestion_id UUID,
    p_topic_id UUID DEFAULT NULL,
    p_locale_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_suggestion suggested_prompts%ROWTYPE;
    v_new_prompt_id UUID;
BEGIN
    -- Get the suggestion
    SELECT * INTO v_suggestion FROM suggested_prompts WHERE id = p_suggestion_id;
    
    IF v_suggestion IS NULL THEN
        RAISE EXCEPTION 'Suggestion not found';
    END IF;
    
    IF v_suggestion.status != 'pending' THEN
        RAISE EXCEPTION 'Suggestion already processed';
    END IF;
    
    -- Create the prompt
    INSERT INTO user_prompts (
        account_id, brand_id, topic_id, prompt_text, prompt_type,
        intent, context, source, is_selected, locale
    ) VALUES (
        v_suggestion.account_id,
        v_suggestion.brand_id,
        COALESCE(p_topic_id, v_suggestion.topic_id),
        v_suggestion.prompt_text,
        v_suggestion.prompt_type,
        v_suggestion.intent,
        v_suggestion.context,
        'suggestion',
        true,
        p_locale_id
    )
    RETURNING id INTO v_new_prompt_id;
    
    -- Delete the suggestion after successfully creating the prompt
    DELETE FROM suggested_prompts WHERE id = p_suggestion_id;
    
    RETURN v_new_prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a suggestion (just delete it)
CREATE OR REPLACE FUNCTION reject_prompt_suggestion(p_suggestion_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM suggested_prompts 
    WHERE id = p_suggestion_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION accept_prompt_suggestion(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_prompt_suggestion(UUID) TO authenticated;
