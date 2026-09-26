-- Enforce core AMS lifecycle domains at the PostgreSQL boundary.
-- Existing invalid legacy rows intentionally block validation until reconciled.

ALTER TABLE projects
  ADD CONSTRAINT projects_status_v1_check
  CHECK (status IN ('planning','in_progress','review','completed','on_hold')) NOT VALID;
ALTER TABLE projects VALIDATE CONSTRAINT projects_status_v1_check;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_status_v1_check
  CHECK (status IN ('todo','in_progress','review','done')) NOT VALID;
ALTER TABLE tasks VALIDATE CONSTRAINT tasks_status_v1_check;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_priority_v1_check
  CHECK (priority IS NULL OR priority IN ('low','medium','high','urgent')) NOT VALID;
ALTER TABLE tasks VALIDATE CONSTRAINT tasks_priority_v1_check;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_status_v1_check
  CHECK (status IN ('Draft','Internal Review','Sent','Approved','Rejected','Accepted')) NOT VALID;
ALTER TABLE proposals VALIDATE CONSTRAINT proposals_status_v1_check;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_currency_v1_check
  CHECK (currency IN ('IDR','USD')) NOT VALID;
ALTER TABLE invoices VALIDATE CONSTRAINT invoices_currency_v1_check;

ALTER TABLE crm_deals
  ADD CONSTRAINT crm_deals_stage_v1_check
  CHECK (stage IN ('new','contacted','proposal','negotiation','won','lost')) NOT VALID;
ALTER TABLE crm_deals VALIDATE CONSTRAINT crm_deals_stage_v1_check;

ALTER TABLE crm_deals
  ADD CONSTRAINT crm_deals_priority_v1_check
  CHECK (priority IS NULL OR priority IN ('low','medium','high','urgent')) NOT VALID;
ALTER TABLE crm_deals VALIDATE CONSTRAINT crm_deals_priority_v1_check;

ALTER TABLE clients
  ADD CONSTRAINT clients_status_v1_check
  CHECK (status IN ('active','inactive','completed','lead')) NOT VALID;
ALTER TABLE clients VALIDATE CONSTRAINT clients_status_v1_check;

ALTER TABLE vendors
  ADD CONSTRAINT vendors_status_v1_check
  CHECK (status IN ('active','under_review','inactive','blacklisted')) NOT VALID;
ALTER TABLE vendors VALIDATE CONSTRAINT vendors_status_v1_check;
