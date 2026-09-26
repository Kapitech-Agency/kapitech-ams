-- AMS PostgreSQL migration 006
-- Relational system modules foundation: approvals, notifications, document metadata, CMS and audit log indexes.
BEGIN;
ALTER TABLE approvals
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS value NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS requester_user_id TEXT,
  ADD COLUMN IF NOT EXISTS requester_role TEXT,
  ADD COLUMN IF NOT EXISTS approval_date DATE,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE INDEX IF NOT EXISTS approvals_status_date_idx ON approvals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS approvals_requester_idx ON approvals(requester_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx ON notifications(recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_created_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS documents_owner_created_idx ON documents(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS documents_related_idx ON documents(related_entity, related_id);
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_user_id, timestamp DESC);
COMMIT;
