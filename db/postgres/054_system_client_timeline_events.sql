-- Distinguish human-entered interactions from idempotent events created by AMS workflows.
BEGIN;

ALTER TABLE client_interactions
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS system_action TEXT,
  ADD COLUMN IF NOT EXISTS source_reference_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'client_interactions_source_type_check'
      AND conrelid = 'client_interactions'::regclass
  ) THEN
    ALTER TABLE client_interactions
      ADD CONSTRAINT client_interactions_source_type_check
      CHECK (source_type IN ('manual', 'system'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_interactions_system_event_once
  ON client_interactions (system_action, source_reference_id)
  WHERE source_type = 'system'
    AND system_action IS NOT NULL
    AND source_reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_interactions_source_type
  ON client_interactions (client_id, source_type, occurred_at DESC);

COMMENT ON COLUMN client_interactions.source_type IS
  'manual means a user-entered interaction; system means an event derived from an AMS business workflow.';
COMMENT ON COLUMN client_interactions.source_reference_id IS
  'Stable source-event reference used to prevent duplicate system entries on retries.';

COMMIT;
