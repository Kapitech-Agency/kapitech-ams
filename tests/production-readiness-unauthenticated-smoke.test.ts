import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Production smoke expects 401 from the authenticated readiness endpoint when no session is provided', () => {
  const workflow = fs.readFileSync(path.resolve(process.cwd(), '.github/workflows/ams-ci.yml'), 'utf8');
  const routes = fs.readFileSync(path.resolve(process.cwd(), 'server/routes.ts'), 'utf8');

  assert.ok(routes.includes("apiRouter.get('/system/production-readiness', requireAuth"));
  assert.ok(workflow.includes('http://127.0.0.1:4173/api/system/production-readiness)" = "401"'));
  assert.ok(!workflow.includes('production-readiness)" = "403"'));
});
