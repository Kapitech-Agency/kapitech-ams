import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kapitech-ams-hardening-'));
process.env.NODE_ENV = 'test';
process.env.KAPITECH_DATA_DIR = testDataDir;
process.env.KAPITECH_DB_BACKUP_DIR = path.join(testDataDir, 'backups');
process.env.KAPITECH_DATA_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

const { createMfaTrustToken, verifyMfaTrustToken, isMasterAdministrator } = await import('../server/auth.ts');
const { isProductionRuntime } = await import('../server/runtime.ts');
const { validateProductionEnvironment } = await import('../scripts/validate-production-env.ts');

const user = {
  id: 'security-user',
  name: 'Security Test User',
  username: 'security',
  email: 'security@example.test',
  passwordHash: 'password-hash-v1',
  salt: 'salt',
  passwordAlgorithm: 'scrypt-v1',
  role: 'Operations',
  stakeholderType: 'Operations',
  permissions: {},
  mfaEnabled: true,
  mfaSecret: 'JBSWY3DPEHPK3PXP',
  division: 'Operations',
  status: 'active',
  lastLogin: '',
  createdAt: new Date().toISOString()
} as any;

test('Master access is not granted by a mutable role or username field', () => {
  assert.equal(isMasterAdministrator({ ...user, role: 'Master Administrator' }), false);
  assert.equal(isMasterAdministrator({ ...user, username: 'admin' }), false);
  assert.equal(isMasterAdministrator({ ...user, id: 'usr_root_admin' }), true);
  assert.equal(isMasterAdministrator({ ...user, stakeholderType: 'Master' }), true);
});

test('Trusted MFA device token is invalidated when password hash changes', () => {
  const token = createMfaTrustToken(user, 'security-test-agent', 1_900_000_000_000);
  assert.ok(token);
  assert.equal(verifyMfaTrustToken(token, user, 'security-test-agent', 1_900_000_000_001), true);
  assert.equal(
    verifyMfaTrustToken(
      token,
      { ...user, passwordHash: 'new-password-hash' },
      'security-test-agent',
      1_900_000_000_001
    ),
    false
  );
});

test('Production runtime is recognized from the bundled Hostinger entry point', () => {
  const originalArgv1 = process.argv[1];
  const originalNodeEnv = process.env.NODE_ENV;
  try {
    process.argv[1] = path.join('/tmp', 'server.cjs');
    process.env.NODE_ENV = '';
    assert.equal(isProductionRuntime(), true);
  } finally {
    process.argv[1] = originalArgv1;
    process.env.NODE_ENV = originalNodeEnv;
  }
});

test('Production environment rejects disabled PostgreSQL certificate verification', () => {
  const sha = 'a'.repeat(64);
  const env: Record<string, string> = {
    NODE_ENV: 'production',
    KAPITECH_DATA_SOURCE: 'postgres',
    KAPITECH_POSTGRES_URL: 'postgresql://user:pass@example.com:5432/kapitech',
    KAPITECH_POSTGRES_SSL: 'require',
    KAPITECH_POSTGRES_SSL_REJECT_UNAUTHORIZED: 'false',
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
    KAPITECH_RELATIONAL_RECONCILIATION_SOURCE_SHA256: sha
  };
  const result = validateProductionEnvironment(env);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('KAPITECH_POSTGRES_SSL_REJECT_UNAUTHORIZED')));
});

test('Runtime hardening stays in place', async () => {
  const [server, auth, routes] = await Promise.all([
    fsPromises.readFile(path.resolve(process.cwd(), 'server.ts'), 'utf8'),
    fsPromises.readFile(path.resolve(process.cwd(), 'server/auth.ts'), 'utf8'),
    fsPromises.readFile(path.resolve(process.cwd(), 'server/routes.ts'), 'utf8')
  ]);
  assert.match(server, /server\.requestTimeout = 120_000/);
  assert.match(server, /server\.headersTimeout = 20_000/);
  assert.match(auth, /isProductionRuntime\(\) \? ' Secure;'/);
  assert.match(routes, /detectResumeMimeType/);
});

test.after(() => fs.rmSync(testDataDir, { recursive: true, force: true }));
