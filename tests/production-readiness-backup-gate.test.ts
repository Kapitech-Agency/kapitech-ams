import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Production readiness requires usable disaster recovery state', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  assert.ok(source.includes('const backupDrReady = Boolean('));
  assert.ok(source.includes('backup.configured &&'));
  assert.ok(source.includes('backup.backupFresh &&'));
  assert.ok(source.includes('backup.integrity.valid &&'));
  assert.ok(source.includes('backup.integrity.restoreVerified'));
  assert.ok(source.includes('backupDr: backupDrReady'));
});
