BEGIN;

-- invoice_number is already UNIQUE in the authoritative invoices schema.
-- Add an explicit named constraint only when it does not already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'invoices'::regclass AND conname = 'invoices_invoice_number_unique_v1'
  ) THEN
    ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_number_unique_v1 UNIQUE (invoice_number);
  END IF;
END $$;

COMMIT;
