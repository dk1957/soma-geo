-- Restore content_docs table with account_id field
-- Date: 2025-09-07

-- Create content_docs table with all necessary fields including account_id
CREATE TABLE IF NOT EXISTS public.content_docs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text,
  content_type text CHECK (content_type IN ('FAQ', 'HowTo', 'Product', 'Article', 'Guide', 'Landing')),
  locale locale_code NOT NULL DEFAULT 'en-GB',
  target_keywords text[] DEFAULT '{}',
  target_queries uuid[] DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
  aeo_score decimal,
  readability_score decimal,
  seo_score decimal,
  structured_data jsonb DEFAULT '{}',
  meta_title text,
  meta_description text,
  slug text,
  published_url text,
  published_at timestamp with time zone,
  performance_metrics jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Recreate feed_items table that references content_docs
CREATE TABLE IF NOT EXISTS public.feed_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_id uuid NOT NULL REFERENCES public.content_docs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  keywords text[] DEFAULT '{}',
  source_type text DEFAULT 'article' CHECK (source_type IN ('article', 'video', 'podcast', 'infographic', 'guide')),
  external_url text,
  engagement_score decimal DEFAULT 0,
  published_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_docs_account_id ON public.content_docs(account_id);
CREATE INDEX IF NOT EXISTS idx_content_docs_brand_id ON public.content_docs(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_docs_workspace_id ON public.content_docs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_docs_locale ON public.content_docs(locale);
CREATE INDEX IF NOT EXISTS idx_content_docs_status ON public.content_docs(status);
CREATE INDEX IF NOT EXISTS idx_content_docs_published_at ON public.content_docs(published_at);
CREATE INDEX IF NOT EXISTS idx_content_docs_created_by ON public.content_docs(created_by);

-- Create indexes for feed_items
CREATE INDEX IF NOT EXISTS idx_feed_items_doc_id ON public.feed_items(doc_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_source_type ON public.feed_items(source_type);
CREATE INDEX IF NOT EXISTS idx_feed_items_published_at ON public.feed_items(published_at);

-- Enable RLS
ALTER TABLE public.content_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for content_docs
CREATE POLICY "Users can access content docs for their brands" ON public.content_docs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.brands b
      JOIN public.account_users au ON b.account_id = au.account_id
      WHERE b.id = content_docs.brand_id 
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Create RLS policies for feed_items
CREATE POLICY "Users can access feed items for their content docs" ON public.feed_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.content_docs cd
      JOIN public.brands b ON cd.brand_id = b.id
      JOIN public.account_users au ON b.account_id = au.account_id
      WHERE cd.id = feed_items.doc_id
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Create update triggers
CREATE TRIGGER update_content_docs_updated_at BEFORE UPDATE ON public.content_docs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feed_items_updated_at BEFORE UPDATE ON public.feed_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.content_docs IS 'Content documents for AEO optimization and publishing';
COMMENT ON TABLE public.feed_items IS 'Feed items for LLM publishing and content distribution';

-- Grant necessary permissions
GRANT ALL ON public.content_docs TO authenticated;
GRANT ALL ON public.feed_items TO authenticated;