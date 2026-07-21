-- Script to refresh schema cache
-- Sometimes after schema changes, the cache needs to be refreshed to recognize new columns

-- Force reload of schema cache
SELECT pg_catalog.pg_reload_conf();

-- Notify clients that schema has changed
NOTIFY pgmeta, 'reload schema';

-- Clear any cached query plans that might reference old schema
DO $$ 
BEGIN
  -- Discard all plans
  EXECUTE 'DISCARD ALL';
END 
$$;

-- Comment explaining usage
COMMENT ON SCHEMA public IS 'Schema cache refreshed on 2025-09-12. Run this script if you encounter "column does not exist" errors after migrations.';