import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresClientInteractionRepository } from '../server/postgres-client-interaction-repository.ts';

test('PostgresClientInteractionRepository exposes persistent list and create operations', () => {
  const repository = new PostgresClientInteractionRepository();
  assert.equal(typeof repository.listByClientId, 'function');
  assert.equal(typeof repository.create, 'function');
});

test('PostgreSQL client interaction history query is opt-in and returns no rows for a missing client ID', async (t) => {
  if (!process.env.KAPI_TECH_POSTGRES_URL && !process.env.KAPITECH_POSTGRES_URL) {
    t.skip('KAPITECH_POSTGRES_URL is not configured in this test environment');
    return;
  }

  const repository = new PostgresClientInteractionRepository();
  const rows = await repository.listByClientId('integration-test-missing-client');
  assert.deepEqual(rows, []);
});
