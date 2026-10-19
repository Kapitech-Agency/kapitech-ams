-- AMS PostgreSQL migration 053
-- Add settlement accounts required by Finance source-journal mapping without changing the historical 052 seed.
BEGIN;

INSERT INTO finance_workbook_records
  (id, record_type, record_key, status, payload, created_at, updated_at)
VALUES
  ('coa-1010', 'chart-of-accounts', '1010', 'active', '{"code":"1010","name":"Card Settlement Clearing","accountType":"Asset","normalBalance":"Debit","description":"Penerimaan kartu menunggu penyelesaian bank","active":true}'::jsonb, NOW(), NOW()),
  ('coa-2100', 'chart-of-accounts', '2100', 'active', '{"code":"2100","name":"Tax Payable","accountType":"Liability","normalBalance":"Credit","description":"Pajak keluaran yang harus disetor","active":true}'::jsonb, NOW(), NOW()),
  ('coa-2200', 'chart-of-accounts', '2200', 'active', '{"code":"2200","name":"Credit Card Payable","accountType":"Liability","normalBalance":"Credit","description":"Kewajiban kartu kredit perusahaan","active":true}'::jsonb, NOW(), NOW())
ON CONFLICT (record_type, record_key) DO NOTHING;

COMMIT;
