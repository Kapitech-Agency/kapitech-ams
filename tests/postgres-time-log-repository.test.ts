import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresTimeLogRepository } from '../server/postgres-time-log-repository.ts';

test('PostgresTimeLogRepository exposes time log CRUD contract', () => {
  const repository = new PostgresTimeLogRepository();
  assert.equal(typeof repository.list, 'function');
  assert.equal(typeof repository.findById, 'function');
  assert.equal(typeof repository.create, 'function');
  assert.equal(typeof repository.delete, 'function');
});

test('PostgreSQL time log repository is opt-in', async (t) => {
  if (!process.env.KAPITECH_POSTGRES_URL) {
    t.skip('KAPITECH_POSTGRES_URL is not configured in this test environment');
    return;
  }
  const repository = new PostgresTimeLogRepository();
  assert.equal(await repository.findById('integration-test-missing-time-log'), null);
});
