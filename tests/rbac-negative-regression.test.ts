import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kapitech-ams-rbac-'));
process.env.NODE_ENV = 'test';
process.env.KAPITECH_DATA_DIR = testDataDir;
process.env.KAPITECH_DB_BACKUP_DIR = path.join(testDataDir, 'backups');
process.env.KAPITECH_DATA_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

const { requireAnyPermission, requireMaster, requirePermission } = await import('../server/auth.ts');

const permissionKeys = [
  'canViewFinancials','canManageInvoices','canApproveBudgets','canManageCrm','canManageProjects',
  'canManageKanbanTasks','canManageClients','canManageVendors','canManageCmsContent','canAccessServerAndApi',
  'canRunDataMigration','canViewSecurityAuditLogs','canManageAdminAccounts'
] as const;

function permissions(overrides: Partial<Record<(typeof permissionKeys)[number], boolean>> = {}) {
  return Object.fromEntries(permissionKeys.map(key => [key, Boolean(overrides[key])])) as Record<(typeof permissionKeys)[number], boolean>;
}

function request(overrides: Record<string, unknown> = {}) {
  const baseUser = {
    id: 'rbac-test-user', name: 'RBAC Test User', username: 'rbac', email: 'rbac@example.test',
    role: 'Test Role', stakeholderType: 'Operations', mfaEnabled: true, permissions: permissions()
  };
  const { user: userOverride, ...requestOverrides } = overrides as any;
  return {
    user: { ...baseUser, ...(userOverride || {}) },
    path: '/test', originalUrl: '/api/test', ip: '127.0.0.1',
    headers: { 'user-agent': 'rbac-test' }, ...requestOverrides
  } as any;
}

function response(): any {
  return {
    statusCode: 200, body: undefined as unknown, nextCalled: undefined as boolean | undefined,
    status(code: number) { this.statusCode = code; return this; },
    json(value: unknown) { this.body = value; return this; }
  };
}

test('Every server permission is denied when the permission bit is false', () => {
  for (const permission of permissionKeys) {
    const middleware = requirePermission(permission); const res = response(); let nextCalled = false;
    middleware(request(), res, () => { nextCalled = true; });
    assert.equal(nextCalled, false, permission); assert.equal(res.statusCode, 403, permission);
  }
});

test('A role with one permission cannot cross into another permission boundary', () => {
  const privilegedPermission = 'canManageProjects'; const forbiddenPermission = 'canManageInvoices';
  const allowed = response(); const userReq = request({ user: { permissions: permissions({ [privilegedPermission]: true }) } });
  requirePermission(privilegedPermission)(userReq, allowed, () => { allowed.nextCalled = true; });
  assert.equal(allowed.statusCode, 200); assert.equal(allowed.nextCalled, true);
  const denied = response();
  requirePermission(forbiddenPermission)(userReq, denied, () => { denied.nextCalled = true; });
  assert.equal(denied.statusCode, 403); assert.equal(denied.nextCalled, undefined);
});

test('requireAnyPermission allows exactly one matching permission and denies none', () => {
  const middleware = requireAnyPermission('canManageCrm', 'canManageClients');
  const denied = response(); middleware(request(), denied, () => { denied.nextCalled = true; }); assert.equal(denied.statusCode, 403);
  const allowed = response();
  middleware(request({ user: { permissions: permissions({ canManageClients: true }) } }), allowed, () => { allowed.nextCalled = true; });
  assert.equal(allowed.statusCode, 200); assert.equal(allowed.nextCalled, true);
});

test('Master accounts bypass permission bits but non-Master accounts cannot use master-only paths', () => {
  const masterRes = response();
  requirePermission('canManageAdminAccounts')(request({ user: { stakeholderType: 'Master', permissions: permissions() } }), masterRes, () => { masterRes.nextCalled = true; });
  assert.equal(masterRes.statusCode, 200); assert.equal(masterRes.nextCalled, true);
  const nonMasterRes = response();
  requireMaster(request({ user: { stakeholderType: 'Operations', permissions: permissions() } }), nonMasterRes, () => { nonMasterRes.nextCalled = true; });
  assert.equal(nonMasterRes.statusCode, 403); assert.equal(nonMasterRes.nextCalled, undefined);
});

test.after(() => { fs.rmSync(testDataDir, { recursive: true, force: true }); });
