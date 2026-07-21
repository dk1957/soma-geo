-- ============================================================================
-- OPTIONAL FEATURES: API Tokens and Billing Events
-- ============================================================================
-- This migration creates tables for optional features:
-- 1. account_api_tokens: For API token management
-- 2. enhanced_billing_events: For billing event history
-- These tables are referenced in the UI but are optional features.
-- ============================================================================

-- ============================================================================
-- TABLE: account_api_tokens
-- ============================================================================
-- Purpose: Store API tokens for programmatic access to the platform
-- Features: Token hashing, permissions, expiration, usage tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS account_api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    token_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the actual token
    prefix VARCHAR(20) NOT NULL, -- First few chars of token for identification (e.g., "soma_abc...")
    permissions TEXT[] NOT NULL DEFAULT ARRAY['api_read'], -- Array of permission strings
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_account_api_tokens_account ON account_api_tokens(account_id) WHERE is_active = TRUE;
CREATE INDEX idx_account_api_tokens_hash ON account_api_tokens(token_hash) WHERE is_active = TRUE;
CREATE INDEX idx_account_api_tokens_expires ON account_api_tokens(expires_at) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE account_api_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view tokens for their own account
CREATE POLICY "Users can view their account's API tokens"
    ON account_api_tokens
    FOR SELECT
    USING (
        account_id IN (
            SELECT account_id 
            FROM account_users 
            WHERE user_id = auth.uid() 
            AND is_active = TRUE
        )
    );

-- Only owners and admins can create tokens
CREATE POLICY "Owners and admins can create API tokens"
    ON account_api_tokens
    FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id 
            FROM account_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
            AND is_active = TRUE
        )
    );

-- Only owners and admins can deactivate tokens
CREATE POLICY "Owners and admins can deactivate API tokens"
    ON account_api_tokens
    FOR UPDATE
    USING (
        account_id IN (
            SELECT account_id 
            FROM account_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
            AND is_active = TRUE
        )
    );

-- Auto-update updated_at timestamp
CREATE TRIGGER update_account_api_tokens_updated_at
    BEFORE UPDATE ON account_api_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE account_api_tokens IS 'API tokens for programmatic access to the platform';
COMMENT ON COLUMN account_api_tokens.token_hash IS 'SHA-256 hash of the actual token for secure storage';
COMMENT ON COLUMN account_api_tokens.prefix IS 'First characters of token for UI display (e.g., soma_abc...)';
COMMENT ON COLUMN account_api_tokens.permissions IS 'Array of permission strings (e.g., api_read, api_write, admin)';

-- ============================================================================
-- TABLE: enhanced_billing_events
-- ============================================================================
-- Purpose: Track billing-related events for audit and history
-- Features: Event types, metadata, timestamps
-- ============================================================================

CREATE TABLE IF NOT EXISTS enhanced_billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- e.g., 'subscription_created', 'payment_succeeded', 'plan_upgraded'
    event_data JSONB NOT NULL DEFAULT '{}', -- Flexible metadata for event details
    amount_cents INTEGER, -- Optional: Amount in cents for payment-related events
    currency VARCHAR(3) DEFAULT 'USD', -- ISO currency code
    stripe_event_id VARCHAR(255), -- Reference to Stripe event if applicable
    created_by UUID REFERENCES auth.users(id), -- User who triggered the event (if applicable)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_billing_events_account ON enhanced_billing_events(account_id);
CREATE INDEX idx_billing_events_type ON enhanced_billing_events(event_type);
CREATE INDEX idx_billing_events_created ON enhanced_billing_events(created_at DESC);
CREATE INDEX idx_billing_events_stripe ON enhanced_billing_events(stripe_event_id) WHERE stripe_event_id IS NOT NULL;

-- RLS Policies
ALTER TABLE enhanced_billing_events ENABLE ROW LEVEL SECURITY;

-- Users can view billing events for their own account (owner/admin only)
CREATE POLICY "Owners and admins can view billing events"
    ON enhanced_billing_events
    FOR SELECT
    USING (
        account_id IN (
            SELECT account_id 
            FROM account_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
            AND is_active = TRUE
        )
    );

-- Only system or admins can insert billing events
CREATE POLICY "System and admins can create billing events"
    ON enhanced_billing_events
    FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id 
            FROM account_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
            AND is_active = TRUE
        )
        OR auth.uid() IS NULL -- Allow service role to insert
    );

COMMENT ON TABLE enhanced_billing_events IS 'Audit trail of billing-related events and transactions';
COMMENT ON COLUMN enhanced_billing_events.event_type IS 'Type of billing event (e.g., subscription_created, payment_succeeded)';
COMMENT ON COLUMN enhanced_billing_events.event_data IS 'Flexible JSONB field for event-specific metadata';
COMMENT ON COLUMN enhanced_billing_events.stripe_event_id IS 'Reference to Stripe event ID if event originated from Stripe webhook';

-- ============================================================================
-- HELPER FUNCTION: Log billing event
-- ============================================================================

CREATE OR REPLACE FUNCTION log_billing_event(
    p_account_id UUID,
    p_event_type VARCHAR,
    p_event_data JSONB DEFAULT '{}',
    p_amount_cents INTEGER DEFAULT NULL,
    p_currency VARCHAR DEFAULT 'USD',
    p_stripe_event_id VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO enhanced_billing_events (
        account_id,
        event_type,
        event_data,
        amount_cents,
        currency,
        stripe_event_id,
        created_by
    ) VALUES (
        p_account_id,
        p_event_type,
        p_event_data,
        p_amount_cents,
        p_currency,
        p_stripe_event_id,
        auth.uid()
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_billing_event IS 'Helper function to create billing event records';

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Note: No sample data inserted by default
-- These tables will be populated by actual usage

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Optional features tables created successfully:';
    RAISE NOTICE '  - account_api_tokens: API token management';
    RAISE NOTICE '  - enhanced_billing_events: Billing event history';
    RAISE NOTICE 'Tables are empty and will be populated by usage.';
END $$;
