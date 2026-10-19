import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Production startup validates the encryption key before listening', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
  const keyGuard = source.indexOf("process.env.KAPITECH_DATA_ENCRYPTION_KEY?.trim()");
  const validation = source.indexOf('isDataEncryptionEnabled();');
  const listen = source.indexOf('app.listen(');

  assert.ok(keyGuard >= 0);
  assert.ok(validation > keyGuard);
  assert.ok(listen > validation);
});
