import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('production data-source misconfiguration fails the API closed', () => {
  const source = fs.readFileSync('server.ts', 'utf8');
  const health = source.indexOf("app.get('/api/health'");
  const apiGate = source.indexOf("app.use('/api', (req, res, next) =>");
  assert.ok(health >= 0);
  assert.ok(apiGate > health);
  const healthBlock = source.slice(health, apiGate);
  const gateBlock = source.slice(apiGate, apiGate + 1800);
  assert.match(healthBlock, /if \(productionConfigError\)/);
  assert.match(healthBlock, /status\(503\)/);
  assert.match(gateBlock, /PRODUCTION_DATA_SOURCE_MISCONFIGURED/);
  assert.match(gateBlock, /Production API is disabled until the PostgreSQL configuration is corrected/);
});

test('production validation requires PostgreSQL before runtime initialization', () => {
  const source = fs.readFileSync('server.ts', 'utf8');
  const start = source.indexOf('function validateProductionDataSource()');
  assert.ok(start >= 0);
  const block = source.slice(start, start + 1800);
  assert.match(block, /mode !== 'postgres'/);
  assert.match(block, /KAPITECH_POSTGRES_URL/);
  assert.match(block, /KAPITECH_DATA_ENCRYPTION_KEY/);
});
