-- Add selected_models column to brands table
ALTER TABLE "public"."brands" ADD COLUMN "selected_models" text[] DEFAULT '{}'::text[];

-- Add comment
COMMENT ON COLUMN "public"."brands"."selected_models" IS 'List of LLM models selected for monitoring this brand';
