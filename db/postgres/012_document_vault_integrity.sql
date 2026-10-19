ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_sha256 TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_sha256 TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_provider TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS integrity_checked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS documents_storage_sha256_idx ON documents (storage_sha256);
CREATE INDEX IF NOT EXISTS documents_storage_provider_idx ON documents (storage_provider);
