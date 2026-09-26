CREATE TABLE IF NOT EXISTS cms_services (
  id TEXT PRIMARY KEY,
  name TEXT,
  slug TEXT,
  description TEXT,
  company TEXT,
  quote TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS cms_projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  slug TEXT,
  description TEXT,
  company TEXT,
  quote TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS cms_testimonials (
  id TEXT PRIMARY KEY,
  name TEXT,
  company TEXT,
  quote TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS cms_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cms_services ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE cms_services ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE cms_services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE cms_services ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE cms_services ADD COLUMN IF NOT EXISTS quote TEXT;
ALTER TABLE cms_services ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE cms_services ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE cms_services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE cms_projects ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE cms_projects ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE cms_projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE cms_projects ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE cms_projects ADD COLUMN IF NOT EXISTS quote TEXT;
ALTER TABLE cms_projects ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE cms_projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE cms_projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE cms_testimonials ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE cms_testimonials ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE cms_testimonials ADD COLUMN IF NOT EXISTS quote TEXT;
ALTER TABLE cms_testimonials ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE cms_testimonials ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE cms_testimonials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS cms_services_slug_idx ON cms_services (slug);
CREATE INDEX IF NOT EXISTS cms_projects_slug_idx ON cms_projects (slug);
CREATE INDEX IF NOT EXISTS cms_services_updated_idx ON cms_services (updated_at DESC);
CREATE INDEX IF NOT EXISTS cms_projects_updated_idx ON cms_projects (updated_at DESC);
CREATE INDEX IF NOT EXISTS cms_testimonials_updated_idx ON cms_testimonials (updated_at DESC);
