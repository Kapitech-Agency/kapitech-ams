import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.resolve('src/pages/admin/AdminSettings.tsx'), 'utf8');

test('admin settings remains safe when credential helper has no session', () => {
  assert.match(source, /const storedCreds = getStoredAdminCredentials\(\) \?\? \{/);
  assert.match(source, /username:\s*''/);
  assert.match(source, /email:\s*''/);
  assert.match(source, /division:\s*'Operations'/);
});
