import test from 'node:test';
import assert from 'node:assert/strict';
import { PostgresAuthRepository } from '../server/postgres-repository.ts';

test('PostgresAuthRepository exposes the authentication persistence contract', () => {
  const repository = new PostgresAuthRepository();
  assert.equal(typeof repository.findUserById, 'function');
  assert.equal(typeof repository.findUserByUsername, 'function');
  assert.equal(typeof repository.findSession, 'function');
  assert.equal(typeof repository.createSession, 'function');
  assert.equal(typeof repository.updateSessionActivity, 'function');
  assert.equal(typeof repository.updateMfaFailedAttempts, 'function');
  assert.equal(typeof repository.deleteSession, 'function');
  assert.equal(typeof repository.revokeUserSessions, 'function');
  assert.equal(typeof repository.touchUserLastLogin, 'function');
  assert.equal(typeof repository.updateUserMfa, 'function');
  assert.equal(typeof repository.createUser, 'function');
});

test('PostgreSQL auth integration is opt-in and never silently falls back', async (t) => {
  if (!process.env.KAPITECH_POSTGRES_URL) {
    t.skip('KAPITECH_POSTGRES_URL is not configured in this test environment');
    return;
  }
  const repository = new PostgresAuthRepository();
  const missing = await repository.findUserById('integration-test-missing-user');
  assert.equal(missing, null);
});
