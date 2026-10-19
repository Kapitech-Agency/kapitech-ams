-- AMS PostgreSQL migration 035
-- Complete validation of the expense lifecycle constraints introduced in migration 005.
-- The constraints already protect new/updated rows; validation now closes the legacy-data gap.
BEGIN;

ALTER TABLE expenses VALIDATE CONSTRAINT expenses_amount_v2_check;
ALTER TABLE expenses VALIDATE CONSTRAINT expenses_currency_v2_check;
ALTER TABLE expenses VALIDATE CONSTRAINT expenses_status_v2_check;
ALTER TABLE expenses VALIDATE CONSTRAINT expenses_version_v2_check;
ALTER TABLE expenses VALIDATE CONSTRAINT expenses_project_id_fkey;

COMMIT;
