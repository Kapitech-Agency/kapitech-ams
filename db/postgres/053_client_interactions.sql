-- Persistent client relationship interactions recorded by authorized CRM/Client users.
BEGIN;

CREATE TABLE IF NOT EXISTS client_interactions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('call', 'email', 'meeting', 'message', 'note')),
  subject TEXT NOT NULL CHECK (length(btrim(subject)) BETWEEN 1 AND 160),
  summary TEXT NOT NULL CHECK (length(btrim(summary)) BETWEEN 1 AND 4000),
  contact_name TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT '',
  next_step TEXT NOT NULL DEFAULT '',
  occurred_at TIMESTAMPTZ NOT NULL,
  created_by_user_id TEXT,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_interactions_client_occurred
  ON client_interactions (client_id, occurred_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_interactions_created_by
  ON client_interactions (created_by_user_id, created_at DESC);

COMMENT ON TABLE client_interactions IS
  'Persistent client communication and relationship notes; separate from security audit logs.';
COMMENT ON COLUMN client_interactions.summary IS
  'Human-entered summary of the interaction. Never store credentials or payment secrets here.';

COMMIT;
