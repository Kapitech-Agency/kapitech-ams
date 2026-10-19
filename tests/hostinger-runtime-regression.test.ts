import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Hostinger runtime keeps the HTTP shell bootable while PostgreSQL recovers', async () => {
  const source = await fs.readFile(path.join(root, 'server.ts'), 'utf8');

  assert.match(source, /validateProductionDataSource/);
  assert.match(source, /postgresStartupError/);
  assert.match(source, /PostgreSQL runtime is ready/);
  assert.match(source, /Web runtime remains online and will retry/);
  assert.match(source, /setInterval\(\(\) =>/);
  assert.match(source, /retryTimer\.unref\(\)/);
  assert.match(source, /DATABASE_STARTING/);
  assert.match(source, /Retry-After.*10/);
  assert.match(source, /app\.listen\(PORT, '0\.0\.0\.0'/);
});

test('Production configuration failure does not call process.exit during startup', async () => {
  const source = await fs.readFile(path.join(root, 'server.ts'), 'utf8');
  const startupSection = source.slice(source.indexOf('async function startServer()'));
  const validationSection = source.slice(source.indexOf('function validateProductionDataSource'), source.indexOf('async function startServer()'));

  assert.doesNotMatch(validationSection, /process\.exit/);
  assert.match(startupSection, /productionConfigError/);
  assert.match(startupSection, /app\.listen/);
});
