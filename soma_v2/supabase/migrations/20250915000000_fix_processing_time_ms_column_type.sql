-- Migration: Fix processing_time_ms column type
-- Date: 2025-09-15
-- Description: Fix processing_time_ms column from timestamp to integer
-- Issue: Column was incorrectly set as timestamp causing "date/time field value out of range: '0'" errors

BEGIN;

-- Fix the processing_time_ms column type from timestamp to integer
-- This was causing insertion errors when trying to insert integer values like 0
ALTER TABLE geo_analyses 
ALTER COLUMN processing_time_ms TYPE INTEGER 
USING COALESCE(EXTRACT(EPOCH FROM processing_time_ms)::INTEGER, 0);

-- Add comment to clarify the correct usage
COMMENT ON COLUMN geo_analyses.processing_time_ms IS 'Time taken to process the analysis in milliseconds (integer)';

COMMIT;