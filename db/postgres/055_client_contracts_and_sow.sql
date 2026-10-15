CREATE TABLE IF NOT EXISTS client_contracts (
  id TEXT PRIMARY KEY,
  contract_number TEXT NOT NULL UNIQUE,
  client_id TEXT,
  project_id TEXT,
  status TEXT NOT NULL,
  contract_type TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  contract_value NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (contract_value >= 0),
  start_date DATE,
  end_date DATE,
  renewal_date DATE,
  document_url TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_contracts_status_updated
  ON client_contracts (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_contracts_client
  ON client_contracts (client_id);

CREATE INDEX IF NOT EXISTS idx_client_contracts_project
  ON client_contracts (project_id);
