import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { PostgresInvoiceRepository } from '../server/postgres-invoice-repository.ts';

test('PostgresInvoiceRepository exposes invoice and payment operations', () => {
  const repository = new PostgresInvoiceRepository();
  assert.equal(typeof repository.list, 'function');
  assert.equal(typeof repository.findById, 'function');
  assert.equal(typeof repository.create, 'function');
  assert.equal(typeof repository.update, 'function');
  assert.equal(typeof repository.recordPayment, 'function');
  assert.equal(typeof repository.cancel, 'function');
});

test('PostgreSQL invoice repository is opt-in', async (t) => {
  if (!process.env.KAPITECH_POSTGRES_URL) {
    t.skip('KAPITECH_POSTGRES_URL is not configured in this test environment');
    return;
  }
  const repository = new PostgresInvoiceRepository();
  assert.equal(await repository.findById('integration-test-missing-invoice'), null);
});


test('PostgreSQL invoice updates reject payment-derived statuses without ledger state', async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const repositorySource = await fs.readFile(path.join(root, 'server/postgres-invoice-repository.ts'), 'utf8');
  assert.match(repositorySource, /patch\.status==='paid'/);
  assert.match(repositorySource, /remaining balance is fully settled/);
  assert.match(repositorySource, /patch\.status==='partially_paid'/);
  assert.match(repositorySource, /payment has been recorded and a balance remains/);
});

test('JSON invoice updates reject payment-derived statuses without ledger state', async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const routesSource = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  assert.match(routesSource, /requestedStatus === 'paid'/);
  assert.match(routesSource, /requestedStatus === 'partially_paid'/);
});


test('PostgreSQL invoice payments target the authoritative invoice_payments schema', async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const repositorySource = await fs.readFile(path.join(root, 'server/postgres-invoice-repository.ts'), 'utf8');
  assert.match(repositorySource, /FROM invoice_payments/);
  assert.match(repositorySource, /INSERT INTO invoice_payments/);
  assert.doesNotMatch(repositorySource, /FROM payments/);
  assert.doesNotMatch(repositorySource, /INSERT INTO payments/);
  assert.match(repositorySource, /paid_at/);
});
