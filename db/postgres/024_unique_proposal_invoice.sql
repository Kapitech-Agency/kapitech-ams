-- AMS PostgreSQL migration 024
-- Enforce one authoritative invoice per proposal.
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_proposal_id_v1
  ON invoices(proposal_id)
  WHERE proposal_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'invoices'::regclass
      AND conname = 'invoices_proposal_id_fkey_v1'
  ) THEN
    RAISE EXCEPTION 'Required invoices_proposal_id_fkey_v1 constraint is missing.';
  END IF;
END $$;

ALTER TABLE invoices
  VALIDATE CONSTRAINT invoices_proposal_id_fkey_v1;

COMMIT;
