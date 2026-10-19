-- Finalize constraints introduced as NOT VALID after existing-data reconciliation.
-- If any legacy row violates one of these rules, production migration must fail
-- until the data is corrected and reconciled.

ALTER TABLE expenses VALIDATE CONSTRAINT expenses_amount_v2_check;
ALTER TABLE expenses VALIDATE CONSTRAINT expenses_currency_v2_check;
ALTER TABLE expenses VALIDATE CONSTRAINT expenses_status_v2_check;
ALTER TABLE expenses VALIDATE CONSTRAINT expenses_version_v2_check;
ALTER TABLE expenses VALIDATE CONSTRAINT expenses_project_id_fkey;

ALTER TABLE time_logs VALIDATE CONSTRAINT time_logs_hours_positive_v1;
ALTER TABLE invoice_payments VALIDATE CONSTRAINT invoice_payments_amount_positive_v1;
ALTER TABLE invoice_items VALIDATE CONSTRAINT invoice_items_quantity_positive_v1;
ALTER TABLE invoice_items VALIDATE CONSTRAINT invoice_items_amount_nonnegative_v1;
ALTER TABLE proposal_items VALIDATE CONSTRAINT proposal_items_quantity_positive_v1;
ALTER TABLE invoices VALIDATE CONSTRAINT invoices_amounts_nonnegative_v1;
ALTER TABLE invoices VALIDATE CONSTRAINT invoices_status_v1;
ALTER TABLE approvals VALIDATE CONSTRAINT approvals_status_v1;
