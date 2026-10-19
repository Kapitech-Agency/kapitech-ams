-- ============================================================
-- IMPORTANT: NON-AUTHORITATIVE SCHEMA REFERENCE
-- ============================================================
-- Do NOT execute this file to provision production AMS PostgreSQL.
-- The production schema is defined by the versioned migrations in
-- db/postgres/*.sql and must be applied with:
--   npm run db:migrate
--
-- This file is retained only as an older Phase 1 relational design
-- reference. It may intentionally differ from the current runtime
-- schema and must not be used for production cutover/reconciliation.
-- ============================================================

-- Kapitech AMS relational target schema
-- Phase 1: normalized operational core.
-- Use this schema when the production relational backend is provisioned.
-- Secrets are never stored in plaintext. Password/MFA secrets remain encrypted or hashed.

CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  username VARCHAR(80) NOT NULL UNIQUE,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(256) NOT NULL,
  password_salt VARCHAR(128) NOT NULL,
  password_algorithm VARCHAR(32) NOT NULL,
  role VARCHAR(120) NOT NULL,
  stakeholder_type VARCHAR(32) NOT NULL,
  division VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret_encrypted TEXT NULL,
  mfa_pending_secret_encrypted TEXT NULL,
  mfa_pending_secret_created_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL,
  last_login_at TIMESTAMP NULL
);

CREATE TABLE sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  remember_me BOOLEAN NOT NULL DEFAULT FALSE,
  ip VARCHAR(128) NULL,
  user_agent VARCHAR(500) NULL,
  kind VARCHAR(16) NOT NULL DEFAULT 'session',
  mfa_failed_attempts INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE clients (
  id VARCHAR(64) PRIMARY KEY,
  company_name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NULL,
  phone VARCHAR(40) NULL,
  status VARCHAR(32) NOT NULL,
  tier VARCHAR(32) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE leads (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL,
  company VARCHAR(200) NULL,
  phone VARCHAR(40) NULL,
  message TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  source VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);

CREATE TABLE deals (
  id VARCHAR(64) PRIMARY KEY,
  client_id VARCHAR(64) NULL,
  title VARCHAR(240) NOT NULL,
  value DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL,
  stage VARCHAR(32) NOT NULL,
  priority VARCHAR(16) NOT NULL,
  probability DECIMAL(5,4) NOT NULL DEFAULT 0,
  owner_user_id VARCHAR(64) NULL,
  expected_close_date DATE NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE projects (
  id VARCHAR(64) PRIMARY KEY,
  client_id VARCHAR(64) NULL,
  name VARCHAR(240) NOT NULL,
  status VARCHAR(32) NOT NULL,
  health VARCHAR(32) NULL,
  budget DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL,
  progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  start_date DATE NULL,
  target_end_date DATE NULL,
  team_lead VARCHAR(160) NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

CREATE TABLE tasks (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  title VARCHAR(240) NOT NULL,
  assignee_user_id VARCHAR(64) NULL,
  priority VARCHAR(16) NOT NULL,
  status VARCHAR(32) NOT NULL,
  due_date DATE NULL,
  estimated_hours DECIMAL(10,2) NULL,
  actual_hours DECIMAL(10,2) NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE proposals (
  id VARCHAR(64) PRIMARY KEY,
  client_id VARCHAR(64) NULL,
  project_id VARCHAR(64) NULL,
  deal_id VARCHAR(64) NULL,
  proposal_number VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(240) NOT NULL,
  status VARCHAR(40) NOT NULL,
  subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
  discount DECIMAL(18,2) NOT NULL DEFAULT 0,
  tax DECIMAL(18,2) NOT NULL DEFAULT 0,
  total DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL,
  valid_until DATE NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
);

CREATE TABLE proposal_items (
  id VARCHAR(64) PRIMARY KEY,
  proposal_id VARCHAR(64) NOT NULL,
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  unit_price DECIMAL(18,2) NOT NULL,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

CREATE TABLE invoices (
  id VARCHAR(64) PRIMARY KEY,
  invoice_number VARCHAR(80) NOT NULL UNIQUE,
  client_id VARCHAR(64) NULL,
  project_id VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL,
  subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  total DECIMAL(18,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(18,2) NOT NULL DEFAULT 0,
  balance_due DECIMAL(18,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL,
  issue_date DATE NULL,
  due_date DATE NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE invoice_items (
  id VARCHAR(64) PRIMARY KEY,
  invoice_id VARCHAR(64) NOT NULL,
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  unit_price DECIMAL(18,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE payments (
  id VARCHAR(64) PRIMARY KEY,
  invoice_id VARCHAR(64) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  payment_date DATE NOT NULL,
  method VARCHAR(64) NOT NULL,
  reference VARCHAR(160) NULL,
  recorded_by_user_id VARCHAR(64) NULL,
  notes VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
  FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE expenses (
  id VARCHAR(64) PRIMARY KEY,
  category VARCHAR(120) NOT NULL,
  description VARCHAR(500) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  expense_date DATE NOT NULL,
  type VARCHAR(32) NOT NULL,
  recorded_by_user_id VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE approvals (
  id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(64) NOT NULL,
  reference_id VARCHAR(64) NULL,
  title VARCHAR(240) NOT NULL,
  requester_user_id VARCHAR(64) NULL,
  value DECIMAL(18,2) NULL,
  currency CHAR(3) NULL,
  status VARCHAR(32) NOT NULL,
  reason TEXT NULL,
  risk_level VARCHAR(32) NULL,
  created_at TIMESTAMP NOT NULL,
  decided_at TIMESTAMP NULL,
  FOREIGN KEY (requester_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE documents (
  id VARCHAR(64) PRIMARY KEY,
  client_id VARCHAR(64) NULL,
  project_id VARCHAR(64) NULL,
  owner_user_id VARCHAR(64) NULL,
  name VARCHAR(240) NOT NULL,
  category VARCHAR(100) NOT NULL,
  mime_type VARCHAR(160) NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  storage_key VARCHAR(128) NULL,
  source_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_status ON documents(status);

CREATE TABLE document_access (
  document_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  granted_at TIMESTAMP NOT NULL,
  PRIMARY KEY (document_id, user_id),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_document_access_user ON document_access(user_id);

CREATE TABLE vendors (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(254) NULL,
  phone VARCHAR(40) NULL,
  status VARCHAR(32) NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE notifications (
  id VARCHAR(64) PRIMARY KEY,
  recipient_user_id VARCHAR(64) NULL,
  title VARCHAR(180) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  type VARCHAR(32) NOT NULL,
  severity VARCHAR(16) NOT NULL,
  read_at TIMESTAMP NULL,
  link_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  action VARCHAR(120) NOT NULL,
  actor VARCHAR(160) NOT NULL,
  actor_role VARCHAR(120) NOT NULL,
  ip VARCHAR(128) NULL,
  user_agent VARCHAR(500) NULL,
  details TEXT NOT NULL,
  severity VARCHAR(16) NOT NULL,
  prev_hash CHAR(64) NULL,
  hash CHAR(64) NOT NULL
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
