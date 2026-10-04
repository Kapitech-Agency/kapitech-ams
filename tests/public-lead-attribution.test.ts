import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('public lead submission preserves sanitized acquisition attribution', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');

  assert.ok(source.includes('attribution'));
  assert.ok(source.includes('sanitizeLeadAttribution(attribution)'));
  assert.ok(source.includes("'utm_source'"));
  assert.ok(source.includes("'utm_medium'"));
  assert.ok(source.includes("'utm_campaign'"));
  assert.ok(source.includes("'landing_path'"));
  assert.ok(source.includes("'referrer_host'"));
});
