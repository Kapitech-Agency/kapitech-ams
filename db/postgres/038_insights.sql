-- Kapitech Insight editorial platform
-- No content is seeded by this migration.

CREATE TABLE IF NOT EXISTS cms_insight_categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name JSONB NOT NULL DEFAULT '{}'::jsonb,
  description JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo_title JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo_description JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_insight_tags (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_insight_authors (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT,
  bio TEXT,
  avatar TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_insights (
  id TEXT PRIMARY KEY,
  content_group_id TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('id','en')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_image TEXT,
  category_id TEXT REFERENCES cms_insight_categories(id) ON DELETE SET NULL,
  author_id TEXT REFERENCES cms_insight_authors(id) ON DELETE SET NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  reading_time INTEGER NOT NULL DEFAULT 1 CHECK (reading_time BETWEEN 1 AND 180),
  published_at TIMESTAMPTZ,
  key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb,
  faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_insight_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  canonical_url TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cms_insight_language_group_unique UNIQUE (content_group_id, language)
);

CREATE INDEX IF NOT EXISTS cms_insights_language_status_idx
  ON cms_insights (language, status, published_at DESC);

CREATE INDEX IF NOT EXISTS cms_insights_category_idx
  ON cms_insights (category_id);

CREATE INDEX IF NOT EXISTS cms_insights_author_idx
  ON cms_insights (author_id);

CREATE INDEX IF NOT EXISTS cms_insights_featured_idx
  ON cms_insights (is_featured, published_at DESC);

CREATE INDEX IF NOT EXISTS cms_insights_slug_idx
  ON cms_insights (slug);

CREATE INDEX IF NOT EXISTS cms_insight_tags_name_idx
  ON cms_insight_tags ((LOWER(COALESCE(name->>'en', name->>'id', ''))));

CREATE INDEX IF NOT EXISTS cms_insight_categories_name_idx
  ON cms_insight_categories ((LOWER(COALESCE(name->>'en', name->>'id', ''))));

CREATE INDEX IF NOT EXISTS cms_insight_authors_name_idx
  ON cms_insight_authors (LOWER(name));
