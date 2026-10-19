import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresTaskRepository } from '../server/postgres-task-repository.ts';

test('PostgresTaskRepository exposes task CRUD contract', () => {
  const repository = new PostgresTaskRepository();
  assert.equal(typeof repository.list, 'function');
  assert.equal(typeof repository.findById, 'function');
  assert.equal(typeof repository.create, 'function');
  assert.equal(typeof repository.update, 'function');
  assert.equal(typeof repository.delete, 'function');
});

test('PostgreSQL task repository is opt-in', async (t) => {
  if (!process.env.KAPITECH_POSTGRES_URL) {
    t.skip('KAPITECH_POSTGRES_URL is not configured in this test environment');
    return;
  }
  const repository = new PostgresTaskRepository();
  assert.equal(await repository.findById('integration-test-missing-task'), null);
});
