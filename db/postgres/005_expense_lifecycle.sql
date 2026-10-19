-- AMS PostgreSQL migration 005
-- Expense lifecycle hardening. Financial expense history is voided/archived instead of physically deleted.
BEGIN;
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS project_id TEXT,
  ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'IDR',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'posted',
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_amount_v2_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_amount_v2_check CHECK (amount > 0) NOT VALID;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_currency_v2_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_currency_v2_check CHECK (currency ~ '^[A-Z]{3}$') NOT VALID;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_status_v2_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_status_v2_check CHECK (status IN ('draft','posted','voided')) NOT VALID;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_version_v2_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_version_v2_check CHECK (version >= 1) NOT VALID;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_project_id_fkey;
ALTER TABLE expenses ADD CONSTRAINT expenses_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL NOT VALID;
CREATE UNIQUE INDEX IF NOT EXISTS expenses_user_idempotency_unique
  ON expenses(recorded_by_user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS expenses_project_date_idx ON expenses(project_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS expenses_status_date_idx ON expenses(status, expense_date DESC);
CREATE INDEX IF NOT EXISTS expenses_active_date_idx ON expenses(expense_date DESC) WHERE archived_at IS NULL;
COMMIT;
