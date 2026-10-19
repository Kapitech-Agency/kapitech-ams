-- Kapitech AMS PostgreSQL migration 002: migration run tracking
-- Versioned separately from migration 001 so applied migration checksums remain immutable.

CREATE TABLE IF NOT EXISTS migration_runs (
  id UUID PRIMARY KEY,
  source_kind TEXT NOT NULL,
  source_sha256 CHAR(64) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  report JSONB,
  CONSTRAINT migration_runs_status_check CHECK (status IN ('running','succeeded','failed'))
);

CREATE INDEX IF NOT EXISTS idx_migration_runs_started_at
  ON migration_runs(started_at DESC);
