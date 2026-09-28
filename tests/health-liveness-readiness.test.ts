import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('production health separates liveness from database readiness', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
  const live = source.indexOf("app.get('/api/health'");
  const ready = source.indexOf("app.get('/api/health/ready'");
  const apiRouter = source.indexOf("app.use('/api', apiRouter)");

  assert.ok(live >= 0);
  assert.ok(ready >= 0);
  assert.ok(live < ready);
  assert.ok(ready < apiRouter);

  const livenessSection = source.slice(live, ready);
  assert.match(livenessSection, /res.json({/);
  assert.doesNotMatch(livenessSection, /checkPostgresConnection/);
  assert.doesNotMatch(livenessSection, /res.status(503)/);
});

test('CI waits on readiness while keeping liveness available for platform health checks', () => {
  const workflow = fs.readFileSync(path.resolve(process.cwd(), '.github/workflows/ams-ci.yml'), 'utf8');
  assert.ok(workflow.includes('http://127.0.0.1:4173/api/health'));
  assert.ok(workflow.includes('http://127.0.0.1:4173/api/health/ready'));
  assert.ok(workflow.includes('/tmp/health-ready.json'));
});
