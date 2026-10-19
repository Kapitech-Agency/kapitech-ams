-- AMS PostgreSQL migration 016
-- Database-level integrity constraints for financial and work-log records.
BEGIN;

ALTER TABLE time_logs
  DROP CONSTRAINT IF EXISTS time_logs_hours_positive_v1,
  ADD CONSTRAINT time_logs_hours_positive_v1 CHECK (hours > 0) NOT VALID;

ALTER TABLE invoice_payments
  DROP CONSTRAINT IF EXISTS invoice_payments_amount_positive_v1,
  ADD CONSTRAINT invoice_payments_amount_positive_v1 CHECK (amount > 0) NOT VALID;

ALTER TABLE invoice_items
  DROP CONSTRAINT IF EXISTS invoice_items_quantity_positive_v1,
  ADD CONSTRAINT invoice_items_quantity_positive_v1 CHECK (quantity > 0) NOT VALID,
  DROP CONSTRAINT IF EXISTS invoice_items_amount_nonnegative_v1,
  ADD CONSTRAINT invoice_items_amount_nonnegative_v1 CHECK (amount >= 0) NOT VALID;

ALTER TABLE proposal_items
  DROP CONSTRAINT IF EXISTS proposal_items_quantity_positive_v1,
  ADD CONSTRAINT proposal_items_quantity_positive_v1 CHECK (quantity > 0) NOT VALID;

ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_amounts_nonnegative_v1,
  ADD CONSTRAINT invoices_amounts_nonnegative_v1 CHECK (subtotal >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND total >= 0 AND amount_paid >= 0 AND balance_due >= 0) NOT VALID,
  DROP CONSTRAINT IF EXISTS invoices_status_v1,
  ADD CONSTRAINT invoices_status_v1 CHECK (status IN ('draft','sent','partially_paid','paid','overdue','cancelled')) NOT VALID;

ALTER TABLE approvals
  DROP CONSTRAINT IF EXISTS approvals_status_v1,
  ADD CONSTRAINT approvals_status_v1 CHECK (status IN ('Pending','Approved','Rejected','Changes Requested')) NOT VALID;

COMMIT;
