-- AMS PostgreSQL migration 021
-- Preserve non-relational time-log attributes used by the production repository.
BEGIN;

ALTER TABLE time_logs
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMIT;
