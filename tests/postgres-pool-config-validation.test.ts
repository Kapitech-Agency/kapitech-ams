import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('PostgreSQL pool runtime settings are validated before Pool construction', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres.ts'), 'utf8');

  assert.match(source, /function readPositiveIntegerEnv\(name: string, fallback: number\): number/);
  assert.match(source, /!Number\.isInteger\(value\) \|\| value <= 0/);
  assert.match(source, /KAPITECH_POSTGRES_POOL_MAX/);
  assert.match(source, /KAPITECH_POSTGRES_IDLE_TIMEOUT_MS/);
  assert.match(source, /KAPITECH_POSTGRES_CONNECTION_TIMEOUT_MS/);
  assert.match(source, /KAPITECH_POSTGRES_STATEMENT_TIMEOUT_MS/);
});

test('PostgreSQL pool settings cannot silently become NaN or zero', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres.ts'), 'utf8');

  assert.doesNotMatch(source, /Number\(process\.env\.KAPITECH_POSTGRES_POOL_MAX \|\| 10\)/);
  assert.doesNotMatch(source, /Number\(process\.env\.KAPITECH_POSTGRES_IDLE_TIMEOUT_MS \|\| 10_000\)/);
  assert.doesNotMatch(source, /Number\(process\.env\.KAPITECH_POSTGRES_CONNECTION_TIMEOUT_MS \|\| 5_000\)/);
  assert.doesNotMatch(source, /Number\(process\.env\.KAPITECH_POSTGRES_STATEMENT_TIMEOUT_MS \|\| 15_000\)/);
});
