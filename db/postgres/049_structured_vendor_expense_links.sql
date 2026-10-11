-- AMS PostgreSQL migration 049
-- Keep vendor payment links as structured expense metadata and indexed relational keys.
BEGIN;

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS vendor_id TEXT REFERENCES vendors(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS vendor_contract_id TEXT;

-- Backfill links from the previous description-marker format without changing ledger values.
UPDATE expenses
SET vendor_id = split_part(description, '|', 2),
    vendor_contract_id = split_part(description, '|', 3),
    metadata = jsonb_set(
      jsonb_set(COALESCE(metadata, '{}'::jsonb), '{vendorPayment}',
        jsonb_build_object(
          'vendorId', split_part(description, '|', 2),
          'contractId', split_part(description, '|', 3),
          'contractTitle', split_part(description, '|', 4),
          'reference', CASE WHEN split_part(description, '|', 5) LIKE 'REF:%' THEN substring(split_part(description, '|', 5) FROM 5) ELSE '' END,
          'notes', CASE WHEN split_part(description, '|', 6) LIKE 'NOTE:%' THEN substring(split_part(description, '|', 6) FROM 6) ELSE '' END
        ), true),
      '{vendorPayment,legacyFormat}', 'true'::jsonb, true)
WHERE left(description, length('[VENDOR_PAYMENT]|')) = '[VENDOR_PAYMENT]|'
  AND vendor_id IS NULL
  AND EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = split_part(expenses.description, '|', 2)
  );

CREATE INDEX IF NOT EXISTS idx_expenses_vendor_contract
  ON expenses (vendor_id, vendor_contract_id)
  WHERE vendor_id IS NOT NULL;

COMMIT;
