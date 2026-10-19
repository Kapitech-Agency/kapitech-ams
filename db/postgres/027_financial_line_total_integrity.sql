-- AMS PostgreSQL migration 027
-- Enforce financial aggregate integrity at transaction commit.
-- Proposal/invoice headers must reconcile to their line items.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM proposals p
    WHERE p.subtotal <> COALESCE((
      SELECT ROUND(SUM(pi.quantity * pi.unit_price), 2)
      FROM proposal_items pi
      WHERE pi.proposal_id = p.id
    ), 0)
  ) THEN
    RAISE EXCEPTION 'PROPOSAL_LINE_TOTAL_MISMATCH: existing proposal headers do not reconcile to line items.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM invoices i
    WHERE i.subtotal <> COALESCE((
      SELECT ROUND(SUM(ii.amount), 2)
      FROM invoice_items ii
      WHERE ii.invoice_id = i.id
    ), 0)
  ) THEN
    RAISE EXCEPTION 'INVOICE_LINE_TOTAL_MISMATCH: existing invoice headers do not reconcile to line items.';
  END IF;
END;
$$;

ALTER TABLE expenses VALIDATE CONSTRAINT expenses_amount_v2_check;
ALTER TABLE expenses VALIDATE CONSTRAINT expenses_currency_v2_check;
ALTER TABLE expenses VALIDATE CONSTRAINT expenses_status_v2_check;
ALTER TABLE expenses VALIDATE CONSTRAINT expenses_version_v2_check;
ALTER TABLE expenses VALIDATE CONSTRAINT expenses_project_id_fkey;

CREATE OR REPLACE FUNCTION enforce_proposal_line_totals_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  proposal_id_value TEXT;
  expected_subtotal NUMERIC(20,2);
  actual_subtotal NUMERIC(20,2);
BEGIN
  IF TG_TABLE_NAME = 'proposals' THEN
    proposal_id_value := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    proposal_id_value := OLD.proposal_id;
  ELSE
    proposal_id_value := NEW.proposal_id;
  END IF;
  SELECT subtotal INTO expected_subtotal FROM proposals WHERE id = proposal_id_value FOR SHARE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(ROUND(SUM(quantity * unit_price), 2), 0)
    INTO actual_subtotal
  FROM proposal_items
  WHERE proposal_id = proposal_id_value;

  IF expected_subtotal <> actual_subtotal THEN
    RAISE EXCEPTION 'PROPOSAL_LINE_TOTAL_MISMATCH: proposal % subtotal % does not match line items %',
      proposal_id_value, expected_subtotal, actual_subtotal;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS proposal_line_totals_integrity_v1 ON proposal_items;
CREATE CONSTRAINT TRIGGER proposal_line_totals_integrity_v1
AFTER INSERT OR UPDATE OR DELETE ON proposal_items
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_proposal_line_totals_v1();

DROP TRIGGER IF EXISTS proposal_header_totals_integrity_v1 ON proposals;
CREATE CONSTRAINT TRIGGER proposal_header_totals_integrity_v1
AFTER INSERT OR UPDATE OF subtotal ON proposals
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_proposal_line_totals_v1();

CREATE OR REPLACE FUNCTION enforce_invoice_line_totals_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  invoice_id_value TEXT;
  expected_subtotal NUMERIC(20,2);
  actual_subtotal NUMERIC(20,2);
BEGIN
  IF TG_TABLE_NAME = 'invoices' THEN
    invoice_id_value := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    invoice_id_value := OLD.invoice_id;
  ELSE
    invoice_id_value := NEW.invoice_id;
  END IF;
  SELECT subtotal INTO expected_subtotal FROM invoices WHERE id = invoice_id_value FOR SHARE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(ROUND(SUM(amount), 2), 0)
    INTO actual_subtotal
  FROM invoice_items
  WHERE invoice_id = invoice_id_value;

  IF expected_subtotal <> actual_subtotal THEN
    RAISE EXCEPTION 'INVOICE_LINE_TOTAL_MISMATCH: invoice % subtotal % does not match line items %',
      invoice_id_value, expected_subtotal, actual_subtotal;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS invoice_line_totals_integrity_v1 ON invoice_items;
CREATE CONSTRAINT TRIGGER invoice_line_totals_integrity_v1
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_invoice_line_totals_v1();

DROP TRIGGER IF EXISTS invoice_header_totals_integrity_v1 ON invoices;
CREATE CONSTRAINT TRIGGER invoice_header_totals_integrity_v1
AFTER INSERT OR UPDATE OF subtotal ON invoices
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_invoice_line_totals_v1();

COMMIT;
