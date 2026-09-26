import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresLeadRepository } from '../server/postgres-lead-repository.ts';

test('PostgresLeadRepository exposes CRUD contract', () => {
  const repository = new PostgresLeadRepository();
  for (const method of ['list', 'findById', 'create', 'update', 'delete']) {
    assert.equal(typeof (repository as any)[method], 'function');
  }
});

test('PostgreSQL lead repository is opt-in', async (t) => {
  if (!process.env.KAPITECH_POSTGRES_URL) {
    t.skip('KAPITECH_POSTGRES_URL is not configured in this test environment');
    return;
  }
  const repository = new PostgresLeadRepository();
  assert.equal(await repository.findById('integration-test-missing-lead'), null);
});
