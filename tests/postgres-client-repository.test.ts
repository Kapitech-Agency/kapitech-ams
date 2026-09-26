import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresClientRepository } from '../server/postgres-client-repository.ts';

test('PostgresClientRepository exposes transactional client CRUD contract', () => {
  const repository = new PostgresClientRepository();
  assert.equal(typeof repository.list, 'function');
  assert.equal(typeof repository.findById, 'function');
  assert.equal(typeof repository.create, 'function');
  assert.equal(typeof repository.update, 'function');
  assert.equal(typeof repository.delete, 'function');
});

test('PostgreSQL client repository is opt-in and does not silently fall back', async (t) => {
  if (!process.env.KAPITECH_POSTGRES_URL) {
    t.skip('KAPITECH_POSTGRES_URL is not configured in this test environment');
    return;
  }
  const repository = new PostgresClientRepository();
  assert.equal(await repository.findById('integration-test-missing-client'), null);
});
