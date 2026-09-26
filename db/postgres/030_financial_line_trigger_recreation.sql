-- AMS PostgreSQL migration 030
-- Recreate financial line reconciliation triggers without redundant header triggers.

BEGIN;

DROP TRIGGER IF EXISTS proposal_header_totals_integrity_v1 ON proposals;
DROP TRIGGER IF EXISTS invoice_header_totals_integrity_v1 ON invoices;
DROP TRIGGER IF EXISTS proposal_line_totals_integrity_v1 ON proposal_items;
DROP TRIGGER IF EXISTS invoice_line_totals_integrity_v1 ON invoice_items;

CREATE CONSTRAINT TRIGGER proposal_line_totals_integrity_v1
AFTER INSERT OR UPDATE OR DELETE ON proposal_items
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_proposal_line_totals_v1();

CREATE CONSTRAINT TRIGGER invoice_line_totals_integrity_v1
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_invoice_line_totals_v1();

COMMIT;
