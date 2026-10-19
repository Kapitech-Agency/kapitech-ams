import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Production HTTP smoke test prints socket and health diagnostics on readiness failure', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), '.github/workflows/ams-ci.yml'), 'utf8');
  const start = source.indexOf('      - name: Production HTTP smoke test');
  const end = source.indexOf('      - name:', start + 10);
  const block = source.slice(start, end > start ? end : undefined);

  assert.ok(block.includes("ss -ltnp | grep ':4173' || true"));
  assert.ok(block.includes('health-debug.json'));
  assert.ok(block.includes("curl -sS --max-time 5 -o /tmp/health-debug.json -w 'HTTP %{http_code}"));
  assert.ok(block.includes('cat /tmp/health.err'));
});
