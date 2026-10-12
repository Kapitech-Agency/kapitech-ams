-- AMS PostgreSQL migration 052
-- Persistent, validated supplementary registers for the Excel-aligned Finance workflow.
-- Live invoice, invoice-payment, expense, project and vendor masters remain in their existing tables.
BEGIN;

CREATE TABLE IF NOT EXISTS finance_workbook_records (
  id TEXT PRIMARY KEY,
  record_type TEXT NOT NULL CHECK (record_type IN (
    'chart-of-accounts',
    'cash-bank-opening',
    'cash-bank-transaction',
    'petty-cash-voucher',
    'vendor-bill',
    'vendor-bill-payment',
    'operational-budget',
    'project-finance',
    'team-fee',
    'project-allocation',
    'journal-entry',
    'monthly-closing',
    'balance-sheet-opening',
    'monthly-closing-lock'
  )),
  record_key TEXT NOT NULL,
  period_key TEXT,
  project_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  payload JSONB NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT finance_workbook_record_key_unique UNIQUE (record_type, record_key)
);

CREATE INDEX IF NOT EXISTS finance_workbook_records_type_updated_idx
  ON finance_workbook_records (record_type, updated_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS finance_workbook_records_type_period_idx
  ON finance_workbook_records (record_type, period_key)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS finance_workbook_records_project_idx
  ON finance_workbook_records (project_id, record_type)
  WHERE archived_at IS NULL AND project_id IS NOT NULL;

INSERT INTO finance_workbook_records
  (id, record_type, record_key, status, payload, created_at, updated_at)
VALUES
  ('coa-1000', 'chart-of-accounts', '1000', 'active', '{"code":"1000","name":"Cash & Bank","accountType":"Asset","normalBalance":"Debit","description":"Kas dan rekening bank","active":true}'::jsonb, NOW(), NOW()),
  ('coa-1100', 'chart-of-accounts', '1100', 'active', '{"code":"1100","name":"Petty Cash Reserve","accountType":"Asset","normalBalance":"Debit","description":"Kas kecil/reserve","active":true}'::jsonb, NOW(), NOW()),
  ('coa-1200', 'chart-of-accounts', '1200', 'active', '{"code":"1200","name":"Emergency Fund","accountType":"Asset","normalBalance":"Debit","description":"Dana darurat","active":true}'::jsonb, NOW(), NOW()),
  ('coa-1300', 'chart-of-accounts', '1300', 'active', '{"code":"1300","name":"Accounts Receivable","accountType":"Asset","normalBalance":"Debit","description":"Piutang pelanggan","active":true}'::jsonb, NOW(), NOW()),
  ('coa-1400', 'chart-of-accounts', '1400', 'active', '{"code":"1400","name":"Project Asset / Prepayment","accountType":"Asset","normalBalance":"Debit","description":"Prepayment/project asset","active":true}'::jsonb, NOW(), NOW()),
  ('coa-2000', 'chart-of-accounts', '2000', 'active', '{"code":"2000","name":"Accounts Payable","accountType":"Liability","normalBalance":"Credit","description":"Hutang vendor/freelancer","active":true}'::jsonb, NOW(), NOW()),
  ('coa-3000', 'chart-of-accounts', '3000', 'active', '{"code":"3000","name":"Owner / Capital","accountType":"Equity","normalBalance":"Credit","description":"Modal","active":true}'::jsonb, NOW(), NOW()),
  ('coa-3100', 'chart-of-accounts', '3100', 'active', '{"code":"3100","name":"Retained Earnings","accountType":"Equity","normalBalance":"Credit","description":"Laba ditahan","active":true}'::jsonb, NOW(), NOW()),
  ('coa-4000', 'chart-of-accounts', '4000', 'active', '{"code":"4000","name":"Project Revenue","accountType":"Revenue","normalBalance":"Credit","description":"Pendapatan project","active":true}'::jsonb, NOW(), NOW()),
  ('coa-5100', 'chart-of-accounts', '5100', 'active', '{"code":"5100","name":"Vendor / Direct Project Cost","accountType":"Expense","normalBalance":"Debit","description":"Fee vendor/freelancer","active":true}'::jsonb, NOW(), NOW()),
  ('coa-5200', 'chart-of-accounts', '5200', 'active', '{"code":"5200","name":"Other Project Obligations","accountType":"Expense","normalBalance":"Debit","description":"Kewajiban project lain","active":true}'::jsonb, NOW(), NOW()),
  ('coa-5300', 'chart-of-accounts', '5300', 'active', '{"code":"5300","name":"Team Reward - Sales","accountType":"Expense","normalBalance":"Debit","description":"Reward sales","active":true}'::jsonb, NOW(), NOW()),
  ('coa-5310', 'chart-of-accounts', '5310', 'active', '{"code":"5310","name":"Team Reward - Vendor/PIC","accountType":"Expense","normalBalance":"Debit","description":"Reward vendor/PIC","active":true}'::jsonb, NOW(), NOW()),
  ('coa-5320', 'chart-of-accounts', '5320', 'active', '{"code":"5320","name":"Team Reward - Management","accountType":"Expense","normalBalance":"Debit","description":"Reward management","active":true}'::jsonb, NOW(), NOW()),
  ('coa-5400', 'chart-of-accounts', '5400', 'active', '{"code":"5400","name":"Project Team Fee","accountType":"Expense","normalBalance":"Debit","description":"Fee tim project","active":true}'::jsonb, NOW(), NOW()),
  ('coa-5500', 'chart-of-accounts', '5500', 'active', '{"code":"5500","name":"Bank & Administration Fee","accountType":"Expense","normalBalance":"Debit","description":"Biaya bank/admin","active":true}'::jsonb, NOW(), NOW()),
  ('coa-5600', 'chart-of-accounts', '5600', 'active', '{"code":"5600","name":"Company Operational Expense","accountType":"Expense","normalBalance":"Debit","description":"Biaya operasional perusahaan","active":true}'::jsonb, NOW(), NOW())
ON CONFLICT (record_type, record_key) DO NOTHING;

COMMIT;
