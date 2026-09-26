import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { validateProductionEnvironment } from '../scripts/validate-production-env.ts';

function validEnv(): Record<string, string> {
  const sha = 'a'.repeat(64);
  return {
    NODE_ENV: 'production',
    KAPITECH_DATA_SOURCE: 'postgres',
    KAPITECH_POSTGRES_URL: 'postgresql://user:pass@example.com:5432/kapitech',
    KAPITECH_POSTGRES_SSL: 'require',
    KAPITECH_DATA_ENCRYPTION_KEY: '1'.repeat(64),
    APP_URL: 'https://ams.kapitech.id',
    KAPITECH_DOCUMENT_STORAGE_PROVIDER: 's3-compatible',
    KAPITECH_DOCUMENT_STORAGE_BUCKET: 'kapitech-private',
    KAPITECH_DOCUMENT_STORAGE_ENDPOINT: 'https://s3.example.com',
    KAPITECH_DOCUMENT_STORAGE_ACCESS_KEY_ID: 'access',
    KAPITECH_DOCUMENT_STORAGE_SECRET_ACCESS_KEY: 'secret',
    KAPITECH_POSTGRES_BACKUP_PROVIDER: 'provider',
    KAPITECH_POSTGRES_BACKUP_LATEST_AT: '2026-09-21T10:00:00.000Z',
    KAPITECH_POSTGRES_BACKUP_LATEST_SHA256: sha,
    KAPITECH_POSTGRES_BACKUP_RESTORE_VERIFIED_AT: '2026-09-21T10:30:00.000Z',
    KAPITECH_POSTGRES_BACKUP_RESTORE_BACKUP_SHA256: sha,
    KAPITECH_RELATIONAL_RECONCILIATION_VERIFIED_AT: '2026-09-21T11:00:00.000Z',
    KAPITECH_RELATIONAL_RECONCILIATION_SOURCE_SHA256: sha,
    ADMIN_INITIAL_PASSWORD: 'temporary-but-strong'
  };
}

test('accepts a structurally valid production environment', () => {
  const result = validateProductionEnvironment(validEnv());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('accepts the runtime-supported base64 encryption key format', () => {
  const env = validEnv();
  env.KAPITECH_DATA_ENCRYPTION_KEY = Buffer.from('a'.repeat(32), 'utf8').toString('base64');
  const result = validateProductionEnvironment(env);
  assert.equal(result.valid, true);
});

test('rejects non-PostgreSQL, insecure URL, invalid encryption key, and invalid storage endpoint', () => {
  const env = validEnv();
  env.KAPITECH_DATA_SOURCE = 'json';
  env.KAPITECH_POSTGRES_SSL = 'disable';
  env.KAPITECH_DATA_ENCRYPTION_KEY = 'short';
  env.APP_URL = 'http://ams.kapitech.id';
  env.KAPITECH_DOCUMENT_STORAGE_ENDPOINT = 'http://s3.example.com';
  const result = validateProductionEnvironment(env);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('KAPITECH_DATA_SOURCE')));
  assert.ok(result.errors.some(error => error.includes('KAPITECH_POSTGRES_SSL')));
  assert.ok(result.errors.some(error => error.includes('KAPITECH_DATA_ENCRYPTION_KEY')));
  assert.ok(result.errors.some(error => error.includes('APP_URL')));
  assert.ok(result.errors.some(error => error.includes('KAPITECH_DOCUMENT_STORAGE_ENDPOINT')));
});

test('rejects backup hash mismatch and future evidence timestamps', () => {
  const env = validEnv();
  env.KAPITECH_POSTGRES_BACKUP_RESTORE_BACKUP_SHA256 = 'b'.repeat(64);
  env.KAPITECH_RELATIONAL_RECONCILIATION_VERIFIED_AT = '2999-01-01T00:00:00.000Z';
  const result = validateProductionEnvironment(env);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('must match')));
  assert.ok(result.errors.some(error => error.includes('must not be in the future')));
});

test('production preflight CLI executes successfully with a valid synthetic environment', () => {
  const now = new Date().toISOString();
  const env = {
    ...process.env,
    CI: 'true',
    NODE_ENV: 'production',
    KAPITECH_DATA_SOURCE: 'postgres',
    KAPITECH_POSTGRES_URL: 'postgresql://user:pass@example.com:5432/kapitech',
    KAPITECH_POSTGRES_SSL: 'require',
    KAPITECH_DATA_ENCRYPTION_KEY: '1'.repeat(64),
    APP_URL: 'https://ams.kapitech.id',
    KAPITECH_DOCUMENT_STORAGE_PROVIDER: 's3-compatible',
    KAPITECH_DOCUMENT_STORAGE_BUCKET: 'kapitech-smoke',
    KAPITECH_DOCUMENT_STORAGE_ENDPOINT: 'https://s3.example.com',
    KAPITECH_DOCUMENT_STORAGE_ACCESS_KEY_ID: 'access',
    KAPITECH_DOCUMENT_STORAGE_SECRET_ACCESS_KEY: 'secret',
    KAPITECH_POSTGRES_BACKUP_PROVIDER: 'provider',
    KAPITECH_POSTGRES_BACKUP_LATEST_AT: now,
    KAPITECH_POSTGRES_BACKUP_LATEST_SHA256: 'a'.repeat(64),
    KAPITECH_POSTGRES_BACKUP_RESTORE_VERIFIED_AT: now,
    KAPITECH_POSTGRES_BACKUP_RESTORE_BACKUP_SHA256: 'a'.repeat(64),
    KAPITECH_RELATIONAL_RECONCILIATION_VERIFIED_AT: now,
    KAPITECH_RELATIONAL_RECONCILIATION_SOURCE_SHA256: 'b'.repeat(64),
  };
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/validate-production-env.ts'], {
    cwd: process.cwd(),
    env,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Contract validation passed/);
});


test('rejects invalid PostgreSQL pool runtime settings', () => {
  const env = validEnv();
  env.KAPITECH_POSTGRES_POOL_MAX = '0';
  env.KAPITECH_POSTGRES_IDLE_TIMEOUT_MS = 'not-a-number';
  env.KAPITECH_POSTGRES_CONNECTION_TIMEOUT_MS = '1.5';
  env.KAPITECH_POSTGRES_STATEMENT_TIMEOUT_MS = '-1';
  const result = validateProductionEnvironment(env);
  assert.equal(result.valid, false);
  assert.equal(result.errors.filter(error => error.includes('KAPITECH_POSTGRES_') && error.includes('positive integer')).length, 4);
});

test('rejects malformed PostgreSQL connection URLs before runtime startup', () => {
  const env = validEnv();
  env.KAPITECH_POSTGRES_URL = 'not-a-postgresql-url';
  const result = validateProductionEnvironment(env);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('KAPITECH_POSTGRES_URL')));
  assert.ok(result.errors.some(error => error.includes('URL-encode')));
});


