import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Production HTTP smoke test validates Secure session cookies while replaying them explicitly over local HTTP', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), '.github/workflows/ams-ci.yml'), 'utf8');
  const start = source.indexOf('      - name: Production HTTP smoke test');
  const end = source.indexOf('      - name:', start + 10);
  const block = source.slice(start, end > start ? end : undefined);

  assert.ok(block.includes('/tmp/login.headers'));
  assert.ok(block.includes('HttpOnly'));
  assert.ok(block.includes('Secure'));
  assert.ok(block.includes('SameSite=Strict'));
  assert.ok(block.includes('split(/\\\\r?\\\\n/).find'));
  assert.ok(block.includes('Cookie: kapi_session=$SESSION_COOKIE'));
  assert.ok(!block.includes('-b /tmp/ams-cookies.txt http://127.0.0.1:4173/api/auth/me'));
});
