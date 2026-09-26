-- AMS PostgreSQL migration 015
-- Align repository-used metadata/version timestamps with the authoritative relational contract.
BEGIN;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE approvals
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE approvals
SET updated_at = created_at
WHERE updated_at IS NULL;

ALTER TABLE approvals
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_source_status ON leads(source, status);
CREATE INDEX IF NOT EXISTS idx_approvals_updated_at ON approvals(updated_at DESC);

COMMIT;
