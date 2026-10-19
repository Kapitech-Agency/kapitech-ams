import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('PostgreSQL user deletion removes sessions only after protected-user guard succeeds', () => {
  const source = fs.readFileSync('server/postgres-repository.ts', 'utf8');
  const start = source.indexOf('async deleteUser(');
  const end = source.indexOf('async updateUserPolicy(', start);
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);
  assert.match(block, /DELETE FROM users WHERE id = \$1 AND stakeholder_type <> \$2 AND username <> \$3 RETURNING id/);
  assert.match(block, /if \(result\.rowCount !== 1\) return false;/);
  assert.ok(block.indexOf('DELETE FROM sessions WHERE user_id = \$1') > block.indexOf('RETURNING id'));
});
