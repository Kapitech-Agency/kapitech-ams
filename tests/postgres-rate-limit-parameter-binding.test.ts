import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('PostgreSQL rate-limit query binds only the parameters it references', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-security-controls-repository.ts'), 'utf8');
  const start = source.indexOf('async consumeRateLimit(');
  const end = source.indexOf('  async checkLoginLockout(', start);
  assert.ok(start >= 0 && end > start);

  const block = source.slice(start, end);
  assert.ok(block.includes('$1'));
  assert.ok(block.includes('$2::double precision'));
  assert.ok(!block.includes('$3::double precision'));
  assert.ok(block.includes('[bucketKey, windowMs]'));
  assert.ok(!block.includes('[bucketKey, maxRequests, windowMs]'));
});
