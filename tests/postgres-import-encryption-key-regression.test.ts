import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('PostgreSQL import uses a single encryption key parser', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'scripts/postgres-import.ts'), 'utf8');
  const matches = source.match(/function encryptionKey\(\): Buffer/g) || [];
  assert.equal(matches.length, 1);
  assert.ok(source.includes('decryptPrivateDocument'));
  assert.ok(source.includes('encryptOptionalSecret'));
});
