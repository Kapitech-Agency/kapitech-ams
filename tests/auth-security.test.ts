import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kapitech-ams-security-'));
process.env.NODE_ENV = 'test';
process.env.KAPITECH_DATA_DIR = testDataDir;
process.env.KAPITECH_DB_BACKUP_DIR = path.join(testDataDir, 'backups');
process.env.KAPITECH_DATA_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

const {
  generateMfaSecret,
  verifyTotpCode,
  generateMfaRecoveryCodes,
  hashMfaRecoveryCode,
  verifyMfaRecoveryCode,
  validateCsrf,
  requirePermission
} = await import('../server/auth.ts');
const {
  hashPassword,
  verifyPassword,
  hashSessionToken
} = await import('../server/db.ts');
const { rmSync } = fs;

interface TestUser {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  passwordAlgorithm: 'scrypt-v1';
  role: string;
  stakeholderType: 'Operations';
  permissions: Record<string, boolean>;
  mfaEnabled: boolean;
  mfaRecoveryCodeHashes: string[];
  division: 'Operations';
  status: 'active';
  lastLogin: string;
  createdAt: string;
}

function makeUser(): TestUser {
  return {
    id: 'test-user',
    name: 'Test User',
    username: 'test',
    email: 'test@example.com',
    passwordHash: '',
    salt: '',
    passwordAlgorithm: 'scrypt-v1',
    role: 'Test',
    stakeholderType: 'Operations',
    permissions: {
      canViewFinancials: false,
      canManageInvoices: false,
      canApproveBudgets: false,
      canManageCrm: false,
      canManageProjects: false,
      canManageKanbanTasks: false,
      canManageClients: false,
      canManageVendors: false,
      canManageCmsContent: false,
      canAccessServerAndApi: false,
      canRunDataMigration: false,
      canViewSecurityAuditLogs: false,
      canManageAdminAccounts: false
    },
    mfaEnabled: true,
    mfaRecoveryCodeHashes: [],
    division: 'Operations',
    status: 'active',
    lastLogin: '',
    createdAt: new Date().toISOString()
  };
}

function decodeBase32(secret: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of secret) {
    value = (value << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function totpAt(secret: string, timestamp: number): string {
  const counter = Math.floor(timestamp / 1000 / 30);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter), 0);
  const digest = crypto.createHmac('sha1', decodeBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = (
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  ) % 1_000_000;
  return String(binary).padStart(6, '0');
}

function makeResponse() {
  const response: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) { this.statusCode = code; return this; },
    json(value: unknown) { this.body = value; return this; }
  };
  return response;
}

test('TOTP accepts the current time window and rejects malformed codes', () => {
  const secret = generateMfaSecret();
  const timestamp = 1_800_000_000_000;
  assert.equal(verifyTotpCode(secret, totpAt(secret, timestamp), timestamp), true);
  assert.equal(verifyTotpCode(secret, '12345', timestamp), false);
  assert.equal(verifyTotpCode(secret, 'abcdef', timestamp), false);
});

test('recovery codes are one-time use and are stored as hashes', () => {
  const user = makeUser();
  const [code, secondCode] = generateMfaRecoveryCodes(2);
  user.mfaRecoveryCodeHashes = [
    hashMfaRecoveryCode(code),
    hashMfaRecoveryCode(secondCode)
  ];

  assert.equal(user.mfaRecoveryCodeHashes.includes(code), false);
  assert.equal(verifyMfaRecoveryCode(user as any, code.toLowerCase()), true);
  assert.equal(verifyMfaRecoveryCode(user as any, code), false);
  assert.equal(user.mfaRecoveryCodeHashes.length, 1);
  assert.equal(verifyMfaRecoveryCode(user as any, secondCode), true);
  assert.equal(user.mfaRecoveryCodeHashes.length, 0);
});

test('password hashing verifies correctly and session tokens are never stored in plaintext', () => {
  const salt = 'unit-test-salt';
  const password = 'A-strong-test-password-2026!';
  const hash = hashPassword(password, salt, 'scrypt-v1');
  const user = { ...makeUser(), salt, passwordHash: hash };

  assert.equal(verifyPassword(password, user as any), true);
  assert.equal(verifyPassword('wrong-password', user as any), false);

  const rawToken = 'kapi_sec_test_token';
  const tokenHash = hashSessionToken(rawToken);
  assert.notEqual(tokenHash, rawToken);
  assert.match(tokenHash, /^[0-9a-f]{64}$/);
});

test('CSRF middleware blocks authenticated state changes without a matching token or origin', () => {
  const baseRequest: any = {
    method: 'POST',
    path: '/clients',
    originalUrl: '/api/clients',
    user: { username: 'test', role: 'Test' },
    ip: '127.0.0.1',
    headers: { 'user-agent': 'security-test' },
    get(name: string) {
      const values: Record<string, string> = {
        origin: 'https://ams.example.test',
        'x-csrf-token': 'token-a'
      };
      return values[name.toLowerCase()];
    }
  };

  const blockedResponse = makeResponse();
  validateCsrf(
    { ...baseRequest, headers: { ...baseRequest.headers, cookie: 'kapi_csrf=token-b' } },
    blockedResponse,
    () => assert.fail('CSRF middleware unexpectedly called next()')
  );
  assert.equal(blockedResponse.statusCode, 403);

  const originResponse = makeResponse();
  validateCsrf(
    { ...baseRequest, headers: { ...baseRequest.headers, cookie: 'kapi_csrf=token-a' } },
    originResponse,
    () => assert.fail('Origin validation unexpectedly called next()')
  );
  assert.equal(originResponse.statusCode, 403);

  const allowedResponse = makeResponse();
  validateCsrf(
    {
      ...baseRequest,
      get(name: string) {
        const values: Record<string, string> = {
          origin: 'https://ams.example.test',
          host: 'ams.example.test',
          'x-csrf-token': 'token-a'
        };
        return values[name.toLowerCase()];
      },
      protocol: 'https',
      secure: true,
      headers: { 'user-agent': 'security-test', cookie: 'kapi_csrf=token-a' }
    },
    allowedResponse,
    () => { allowedResponse.nextCalled = true; }
  );
  assert.equal(allowedResponse.statusCode, 200);
  assert.equal(allowedResponse.nextCalled, true);
});

test('permission middleware denies non-authorized users and allows authorized users', () => {
  const middleware = requirePermission('canManageProjects');

  const deniedResponse = makeResponse();
  middleware(
    {
      user: {
        id: 'user-a',
        username: 'ops',
        role: 'Operations',
        stakeholderType: 'Operations',
        mfaEnabled: true,
        permissions: { canManageProjects: false }
      },
      path: '/projects',
      originalUrl: '/api/projects',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'security-test' }
    } as any,
    deniedResponse,
    () => assert.fail('Unauthorized user unexpectedly called next()')
  );
  assert.equal(deniedResponse.statusCode, 403);

  const allowedResponse = makeResponse();
  middleware(
    {
      user: {
        id: 'user-b',
        username: 'pm',
        role: 'Project Manager',
        stakeholderType: 'Project_Manager',
        mfaEnabled: true,
        permissions: { canManageProjects: true }
      },
      path: '/projects',
      originalUrl: '/api/projects',
      ip: '127.0.0.1',
      headers: { 'user-agent': 'security-test' }
    } as any,
    allowedResponse,
    () => { allowedResponse.nextCalled = true; }
  );
  assert.equal(allowedResponse.statusCode, 200);
  assert.equal(allowedResponse.nextCalled, true);
});

test.after(() => {
  rmSync(testDataDir, { recursive: true, force: true });
});
