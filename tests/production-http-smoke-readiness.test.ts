import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Production HTTP smoke readiness tolerates transient connection failures', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), '.github/workflows/ams-ci.yml'), 'utf8');
  const start = source.indexOf('      - name: Production HTTP smoke test');
  const end = source.indexOf('      - name:', start + 10);
  const block = source.slice(start, end > start ? end : undefined);

  assert.ok(block.includes('ready=0'));
  assert.ok(block.includes('--retry-connrefused'));
  assert.ok(!block.includes('--retry-delay 0.2'));
  assert.ok(block.includes('ready=1'));
  assert.ok(block.includes('test "$ready" = "1"'));
});
