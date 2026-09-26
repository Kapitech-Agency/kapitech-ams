-- AMS PostgreSQL migration 023
-- Establish an explicit relational link from invoices created from proposals.
BEGIN;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS proposal_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'invoices'::regclass
      AND conname = 'invoices_proposal_id_fkey_v1'
  ) THEN
    ALTER TABLE invoices
      ADD CONSTRAINT invoices_proposal_id_fkey_v1
      FOREIGN KEY (proposal_id) REFERENCES proposals(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

-- Backfill only unambiguous historical proposal-to-invoice matches.
WITH candidates AS (
  SELECT i.id AS invoice_id, p.id AS proposal_id,
         COUNT(*) OVER (PARTITION BY i.id) AS candidate_count
  FROM invoices i
  JOIN proposals p
    ON i.proposal_id IS NULL
   AND i.notes LIKE 'Generated from Proposal ' || p.proposal_number || '.%'
)
UPDATE invoices i
SET proposal_id = c.proposal_id
FROM candidates c
WHERE i.id = c.invoice_id
  AND c.candidate_count = 1;

CREATE INDEX IF NOT EXISTS invoices_proposal_id_idx
  ON invoices(proposal_id);

COMMIT;
