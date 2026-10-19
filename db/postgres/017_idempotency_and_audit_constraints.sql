BEGIN;

-- Prevent duplicate payment retries at the database boundary.
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoice_payments_idempotency_v1
  ON invoice_payments (invoice_id, ((metadata->>'idempotencyKey')))
  WHERE metadata ? 'idempotencyKey'
    AND NULLIF(BTRIM(metadata->>'idempotencyKey'), '') IS NOT NULL;

-- Prevent duplicate expense retries at the database boundary.
CREATE UNIQUE INDEX IF NOT EXISTS uq_expenses_idempotency_v1
  ON expenses (recorded_by_user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL
    AND NULLIF(BTRIM(idempotency_key), '') IS NOT NULL;

COMMIT;
