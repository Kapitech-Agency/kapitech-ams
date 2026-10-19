import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresProjectRepository, ProjectConcurrencyError } from '../server/postgres-project-repository.ts';

test('PostgresProjectRepository exposes project/task CRUD contract', () => {
  const repository = new PostgresProjectRepository();
  assert.equal(typeof repository.list, 'function');
  assert.equal(typeof repository.findById, 'function');
  assert.equal(typeof repository.create, 'function');
  assert.equal(typeof repository.update, 'function');
  assert.equal(typeof repository.delete, 'function');
});

test('ProjectConcurrencyError is explicit for stale project writes', () => {
  const error = new ProjectConcurrencyError();
  assert.equal(error.name, 'ProjectConcurrencyError');
  assert.match(error.message, /modified since it was loaded/i);
});

test('PostgreSQL project repository is opt-in', async (t) => {
  if (!process.env.KAPITECH_POSTGRES_URL) {
    t.skip('KAPITECH_POSTGRES_URL is not configured in this test environment');
    return;
  }
  const repository = new PostgresProjectRepository();
  assert.equal(await repository.findById('integration-test-missing-project'), null);
});
