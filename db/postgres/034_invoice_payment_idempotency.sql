-- 034: enforce invoice payment idempotency at the PostgreSQL boundary
-- The application already serializes keyed payment retries with an advisory lock.
-- This partial unique index is the database-level backstop for the same invoice/key pair.
CREATE UNIQUE INDEX IF NOT EXISTS invoice_payments_invoice_idempotency_key_unique
  ON invoice_payments (invoice_id, ((metadata->>'idempotencyKey')))
  WHERE NULLIF(metadata->>'idempotencyKey', '') IS NOT NULL;
