import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('AI generation audit events use the PostgreSQL-aware audit writer', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  const start = source.indexOf("apiRouter.post('/ai/generate'");
  const end = source.indexOf("// ----------------------------------------------------\n// 12. DATA MIGRATION", start);
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);

  assert.ok(block.includes("action: 'AI_GENERATION_REQUESTED'"));
  assert.ok(block.includes('await writeAuditLog({'));
  assert.equal(
    block.includes("recordAuditLog({"),
    false,
    'AI generation must not write directly to the legacy JSON audit store'
  );
});
