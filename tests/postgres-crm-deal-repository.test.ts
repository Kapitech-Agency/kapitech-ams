import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresCrmDealRepository } from '../server/postgres-crm-deal-repository.ts';

test('PostgresCrmDealRepository exposes CRUD contract', () => {
  const repository = new PostgresCrmDealRepository();
  for (const method of ['list', 'findById', 'create', 'update', 'delete', 'convertLead']) {
    assert.equal(typeof (repository as any)[method], 'function');
  }
});

test('PostgreSQL CRM deal repository is opt-in', async (t) => {
  if (!process.env.KAPITECH_POSTGRES_URL) {
    t.skip('KAPITECH_POSTGRES_URL is not configured in this test environment');
    return;
  }
  const repository = new PostgresCrmDealRepository();
  assert.equal(await repository.findById('integration-test-missing-deal'), null);
});
