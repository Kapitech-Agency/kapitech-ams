import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.resolve('src/lib/adminAuth.ts'), 'utf8');

test('admin credential helper never fabricates a default production account', () => {
  assert.doesNotMatch(source, /username:\s*['"]admin['"]/);
  assert.doesNotMatch(source, /admin@ams\.kapitech\.id/);
  assert.match(
    source,
    /export function getStoredAdminCredentials\(\)[\s\S]*?if \(!session\) return null;/
  );
});
