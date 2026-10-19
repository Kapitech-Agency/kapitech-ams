-- AMS PostgreSQL migration 054
-- Seed a dedicated temporary offset account for posted opening balances.
BEGIN;

INSERT INTO finance_workbook_records
  (id, record_type, record_key, status, payload, created_at, updated_at)
VALUES
  ('coa-3200', 'chart-of-accounts', '3200', 'active', '{"code":"3200","name":"Opening Balance Equity","accountType":"Equity","normalBalance":"Credit","description":"Temporary offset for validated opening balances","active":true}'::jsonb, NOW(), NOW())
ON CONFLICT (record_type, record_key) DO NOTHING;

COMMIT;
