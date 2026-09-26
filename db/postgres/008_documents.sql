CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  type TEXT,
  mime_type TEXT,
  size TEXT,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  category TEXT,
  related_entity TEXT,
  related_id TEXT,
  owner TEXT,
  owner_user_id TEXT,
  source_type TEXT NOT NULL,
  status TEXT NOT NULL,
  uploaded_date DATE,
  uploaded_at TIMESTAMPTZ,
  external_url TEXT,
  storage_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS size_bytes BIGINT NOT NULL DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS related_entity TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS related_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner_user_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_key TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS document_access (
  document_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (document_id, user_id)
);

CREATE INDEX IF NOT EXISTS documents_owner_created_idx ON documents (owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS documents_related_idx ON documents (related_entity, related_id);
CREATE INDEX IF NOT EXISTS document_access_user_idx ON document_access (user_id, document_id);
