-- AMS PostgreSQL migration 025
-- Database-level invoice financial invariants.
-- These constraints make the authoritative PostgreSQL ledger reject states
-- that the application layer must never be able to persist.

BEGIN;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_amount_paid_not_over_total_v1
  CHECK (amount_paid <= total) NOT VALID;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_balance_matches_total_paid_v1
  CHECK (balance_due = total - amount_paid) NOT VALID;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_discount_amount_matches_rate_v1
  CHECK (
    discount_amount = ROUND(subtotal * discount_percent / 100, 2)
  ) NOT VALID;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_tax_amount_matches_rate_v1
  CHECK (
    tax_amount = ROUND(GREATEST(subtotal - discount_amount, 0) * tax_percent / 100, 2)
  ) NOT VALID;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_total_matches_components_v1
  CHECK (
    total = ROUND(GREATEST(subtotal - discount_amount, 0) + tax_amount, 2)
  ) NOT VALID;

ALTER TABLE invoice_items
  ADD CONSTRAINT invoice_items_amount_matches_quantity_price_v1
  CHECK (
    amount = ROUND(quantity * unit_price, 2)
  ) NOT VALID;

ALTER TABLE invoices VALIDATE CONSTRAINT invoices_amount_paid_not_over_total_v1;
ALTER TABLE invoices VALIDATE CONSTRAINT invoices_balance_matches_total_paid_v1;
ALTER TABLE invoices VALIDATE CONSTRAINT invoices_discount_amount_matches_rate_v1;
ALTER TABLE invoices VALIDATE CONSTRAINT invoices_tax_amount_matches_rate_v1;
ALTER TABLE invoices VALIDATE CONSTRAINT invoices_total_matches_components_v1;
ALTER TABLE invoice_items VALIDATE CONSTRAINT invoice_items_amount_matches_quantity_price_v1;

COMMIT;
