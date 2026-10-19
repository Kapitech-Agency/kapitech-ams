import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import path from 'node:path';

test('Health endpoint is registered before the API router catch-all', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
  const health = source.indexOf("app.get('/api/health'");
  const apiRouter = source.indexOf("app.use('/api', apiRouter)");
  assert.ok(health >= 0 && apiRouter >= 0);
  assert.ok(health < apiRouter);
});

test('CI boots the production bundle and checks protected API boundaries', () => {
  const workflow = fs.readFileSync(path.resolve(process.cwd(), '.github/workflows/ams-ci.yml'), 'utf8');
  assert.ok(workflow.includes('Production HTTP smoke test'));
  assert.ok(workflow.includes('node dist/server.cjs'));
  assert.ok(workflow.includes('http://127.0.0.1:4173/api/health'));
  assert.ok(workflow.includes('"401"'));
  assert.ok(workflow.includes('readiness_status=$(curl'));
  assert.ok(workflow.includes('test "$readiness_status" = "403"'));
  assert.ok(workflow.includes("x.code!=='MFA_REQUIRED'"));
});
