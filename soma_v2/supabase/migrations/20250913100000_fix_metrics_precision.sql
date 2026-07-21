-- Fix numeric precision in metrics table
-- Migration: 20250913100000_fix_metrics_precision.sql

-- This migration adjusts the precision of numeric fields in the metrics table
-- to prevent "numeric field overflow" errors

DO $$
BEGIN
    -- Update llm_visibility_index to handle larger values
    ALTER TABLE metrics
    ALTER COLUMN llm_visibility_index TYPE NUMERIC(10,2);
    
    -- Update content_quality_score to handle larger values
    ALTER TABLE metrics
    ALTER COLUMN content_quality_score TYPE NUMERIC(10,2);
    
    -- Update discoverability_score to handle larger values
    ALTER TABLE metrics
    ALTER COLUMN discoverability_score TYPE NUMERIC(10,2);
    
    -- Update overall_ldi_score to handle larger values
    ALTER TABLE metrics
    ALTER COLUMN overall_ldi_score TYPE NUMERIC(10,2);
    
    COMMENT ON TABLE metrics IS 'Table storing analytics metrics with adjusted precision to handle larger values';
END
$$;