import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('PostgreSQL schema contains the required relational AMS domains', async () => {
  const schema = await fs.readFile(path.join(root, 'db/postgres/001_initial_schema.sql'), 'utf8');

  for (const table of [
    'users',
    'sessions',
    'clients',
    'crm_deals',
    'projects',
    'tasks',
    'time_logs',
    'proposals',
    'proposal_items',
    'invoices',
    'invoice_items',
    'invoice_payments',
    'expenses',
    'approvals',
    'vendors',
    'documents',
    'document_access',
    'notifications',
    'audit_logs',
    'notification_settings'
  ]) {
    assert.match(schema, new RegExp('CREATE TABLE IF NOT EXISTS ' + table + '\\b'));
  }

  assert.match(schema, /REFERENCES clients\(id\)/);
  assert.match(schema, /REFERENCES projects\(id\)/);
  assert.match(schema, /REFERENCES users\(id\)/);
  assert.match(schema, /NUMERIC\(20,2\)/);
  assert.match(schema, /PRIMARY KEY/);
});

test('PostgreSQL configuration is opt-in and fails closed without a connection URL', async () => {
  const previousUrl = process.env.KAPITECH_POSTGRES_URL;
  delete process.env.KAPITECH_POSTGRES_URL;

  const { getPostgresPool } = await import('../server/postgres.ts');
  assert.throws(
    () => getPostgresPool(),
    /KAPITECH_POSTGRES_URL is not configured/
  );

  if (previousUrl === undefined) delete process.env.KAPITECH_POSTGRES_URL;
  else process.env.KAPITECH_POSTGRES_URL = previousUrl;
});
