-- Fix missing columns in response_citations table
-- This migration ensures all columns from the Source Authority Network design exist

DO $$
BEGIN
    -- 1. domain
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'domain') THEN
        ALTER TABLE response_citations ADD COLUMN domain VARCHAR(255);
    END IF;

    -- 2. url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'url') THEN
        ALTER TABLE response_citations ADD COLUMN url TEXT;
    END IF;

    -- 3. title
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'title') THEN
        ALTER TABLE response_citations ADD COLUMN title TEXT;
    END IF;

    -- 4. snippet
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'snippet') THEN
        ALTER TABLE response_citations ADD COLUMN snippet TEXT;
    END IF;

    -- 5. citation_position
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'citation_position') THEN
        ALTER TABLE response_citations ADD COLUMN citation_position INTEGER;
    END IF;

    -- 6. inline_position
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'inline_position') THEN
        ALTER TABLE response_citations ADD COLUMN inline_position INTEGER;
    END IF;

    -- 7. citation_format
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'citation_format') THEN
        ALTER TABLE response_citations ADD COLUMN citation_format VARCHAR(50);
    END IF;

    -- 8. context_text
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'context_text') THEN
        ALTER TABLE response_citations ADD COLUMN context_text TEXT;
    END IF;

    -- 9. citation_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'citation_type') THEN
        ALTER TABLE response_citations ADD COLUMN citation_type VARCHAR(50);
    END IF;

    -- 10. source_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'source_type') THEN
        ALTER TABLE response_citations ADD COLUMN source_type VARCHAR(50);
    END IF;

    -- 11. is_brand_owned
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'is_brand_owned') THEN
        ALTER TABLE response_citations ADD COLUMN is_brand_owned BOOLEAN DEFAULT false;
    END IF;

    -- 12. is_competitor_owned
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'is_competitor_owned') THEN
        ALTER TABLE response_citations ADD COLUMN is_competitor_owned BOOLEAN DEFAULT false;
    END IF;

    -- 13. competitor_brand_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'competitor_brand_id') THEN
        ALTER TABLE response_citations ADD COLUMN competitor_brand_id UUID REFERENCES competitors(id) ON DELETE SET NULL;
    END IF;

    -- 14. prompt_text
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'prompt_text') THEN
        ALTER TABLE response_citations ADD COLUMN prompt_text TEXT;
    END IF;

    -- 15. prompt_category
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'prompt_category') THEN
        ALTER TABLE response_citations ADD COLUMN prompt_category VARCHAR(100);
    END IF;

    -- 16. prompt_intent
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'prompt_intent') THEN
        ALTER TABLE response_citations ADD COLUMN prompt_intent VARCHAR(50);
    END IF;

    -- 17. topics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'topics') THEN
        ALTER TABLE response_citations ADD COLUMN topics TEXT[] DEFAULT '{}';
    END IF;

    -- 18. geo_target
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'geo_target') THEN
        ALTER TABLE response_citations ADD COLUMN geo_target VARCHAR(50);
    END IF;

    -- 19. language
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'language') THEN
        ALTER TABLE response_citations ADD COLUMN language VARCHAR(10);
    END IF;

    -- 20. raw_citation_data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'raw_citation_data') THEN
        ALTER TABLE response_citations ADD COLUMN raw_citation_data JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- 21. cited_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'cited_at') THEN
        ALTER TABLE response_citations ADD COLUMN cited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- 22. domain_id (Foreign Key)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'domain_id') THEN
        ALTER TABLE response_citations ADD COLUMN domain_id UUID REFERENCES source_domains(id) ON DELETE SET NULL;
    END IF;

    -- 23. url_id (Foreign Key)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'response_citations' AND column_name = 'url_id') THEN
        ALTER TABLE response_citations ADD COLUMN url_id UUID REFERENCES source_urls(id) ON DELETE SET NULL;
    END IF;

END $$;

-- Re-create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_response_citations_domain ON response_citations(domain_id);
CREATE INDEX IF NOT EXISTS idx_response_citations_url ON response_citations(url_id);
CREATE INDEX IF NOT EXISTS idx_response_citations_cited_at ON response_citations(cited_at DESC);
CREATE INDEX IF NOT EXISTS idx_response_citations_brand_domain ON response_citations(brand_id, domain_id);
CREATE INDEX IF NOT EXISTS idx_response_citations_topics_gin ON response_citations USING gin(topics);
CREATE INDEX IF NOT EXISTS idx_response_citations_geo ON response_citations(geo_target);
