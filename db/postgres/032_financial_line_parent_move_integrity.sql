-- AMS PostgreSQL migration 032
-- Harden financial line-item reconciliation for parent-key moves.
-- An UPDATE that moves a line item between proposals/invoices must validate
-- both the old parent and the new parent before the transaction can commit.

BEGIN;

CREATE OR REPLACE FUNCTION enforce_proposal_line_totals_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  proposal_id_value TEXT;
  expected_subtotal NUMERIC(20,2);
  actual_subtotal NUMERIC(20,2);
BEGIN
  IF TG_TABLE_NAME <> 'proposal_items' THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN
    proposal_id_value := OLD.proposal_id;
  ELSE
    proposal_id_value := NEW.proposal_id;
  END IF;

  SELECT subtotal INTO expected_subtotal
  FROM proposals
  WHERE id = proposal_id_value
  FOR SHARE;

  IF FOUND THEN
    SELECT COALESCE(ROUND(SUM(quantity * unit_price), 2), 0)
      INTO actual_subtotal
    FROM proposal_items
    WHERE proposal_id = proposal_id_value;

    IF expected_subtotal <> actual_subtotal THEN
      RAISE EXCEPTION 'PROPOSAL_LINE_TOTAL_MISMATCH: proposal % subtotal % does not match line items %',
        proposal_id_value, expected_subtotal, actual_subtotal;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.proposal_id IS DISTINCT FROM NEW.proposal_id THEN
    proposal_id_value := OLD.proposal_id;

    SELECT subtotal INTO expected_subtotal
    FROM proposals
    WHERE id = proposal_id_value
    FOR SHARE;

    IF FOUND THEN
      SELECT COALESCE(ROUND(SUM(quantity * unit_price), 2), 0)
        INTO actual_subtotal
      FROM proposal_items
      WHERE proposal_id = proposal_id_value;

      IF expected_subtotal <> actual_subtotal THEN
        RAISE EXCEPTION 'PROPOSAL_LINE_TOTAL_MISMATCH: proposal % subtotal % does not match line items %',
          proposal_id_value, expected_subtotal, actual_subtotal;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION enforce_invoice_line_totals_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  invoice_id_value TEXT;
  expected_subtotal NUMERIC(20,2);
  actual_subtotal NUMERIC(20,2);
BEGIN
  IF TG_TABLE_NAME <> 'invoice_items' THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN
    invoice_id_value := OLD.invoice_id;
  ELSE
    invoice_id_value := NEW.invoice_id;
  END IF;

  SELECT subtotal INTO expected_subtotal
  FROM invoices
  WHERE id = invoice_id_value
  FOR SHARE;

  IF FOUND THEN
    SELECT COALESCE(ROUND(SUM(amount), 2), 0)
      INTO actual_subtotal
    FROM invoice_items
    WHERE invoice_id = invoice_id_value;

    IF expected_subtotal <> actual_subtotal THEN
      RAISE EXCEPTION 'INVOICE_LINE_TOTAL_MISMATCH: invoice % subtotal % does not match line items %',
        invoice_id_value, expected_subtotal, actual_subtotal;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD.invoice_id IS DISTINCT FROM NEW.invoice_id THEN
    invoice_id_value := OLD.invoice_id;

    SELECT subtotal INTO expected_subtotal
    FROM invoices
    WHERE id = invoice_id_value
    FOR SHARE;

    IF FOUND THEN
      SELECT COALESCE(ROUND(SUM(amount), 2), 0)
        INTO actual_subtotal
      FROM invoice_items
      WHERE invoice_id = invoice_id_value;

      IF expected_subtotal <> actual_subtotal THEN
        RAISE EXCEPTION 'INVOICE_LINE_TOTAL_MISMATCH: invoice % subtotal % does not match line items %',
          invoice_id_value, expected_subtotal, actual_subtotal;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

COMMIT;
