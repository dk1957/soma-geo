-- Fix metrics table type mismatch
-- Migration: 20250912600000_fix_metrics_table_types.sql

-- Change response_time_avg to numeric to handle decimal values
DO $$
BEGIN
    -- Change response_time_avg column from integer to numeric
    ALTER TABLE metrics
    ALTER COLUMN response_time_avg TYPE numeric(10,2);
    
    -- Ensure other potentially problematic integer columns can accept decimals
    ALTER TABLE metrics
    ALTER COLUMN citation_count TYPE numeric(10,2);
    
    ALTER TABLE metrics
    ALTER COLUMN brand_mentions_count TYPE numeric(10,2);
    
    ALTER TABLE metrics
    ALTER COLUMN competitor_mentions_count TYPE numeric(10,2);
    
    ALTER TABLE metrics
    ALTER COLUMN total_responses TYPE numeric(10,2);
    
    ALTER TABLE metrics
    ALTER COLUMN successful_responses TYPE numeric(10,2);
    
    COMMENT ON COLUMN metrics.response_time_avg IS 'Average response time in milliseconds (can include decimal precision)';
END
$$;