import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresVendorRepository } from '../server/postgres-vendor-repository.ts';

test('PostgresVendorRepository exposes vendor CRUD contract', () => {
  const repository = new PostgresVendorRepository();
  assert.equal(typeof repository.list, 'function');
  assert.equal(typeof repository.findById, 'function');
  assert.equal(typeof repository.create, 'function');
  assert.equal(typeof repository.update, 'function');
  assert.equal(typeof repository.delete, 'function');
});

test('PostgreSQL vendor repository is opt-in', async (t) => {
  if (!process.env.KAPITECH_POSTGRES_URL) {
    t.skip('KAPITECH_POSTGRES_URL is not configured in this test environment');
    return;
  }
  const repository = new PostgresVendorRepository();
  assert.equal(await repository.findById('integration-test-missing-vendor'), null);
});
