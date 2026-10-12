import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Settings section navigation remains visible on desktop and mobile', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');

  assert.ok(source.includes('data-ams-slug="settings-tabs"'));
  assert.ok(!source.includes('min-[900px]:hidden'));
  for (const label of ['Overview & Backups', 'Audit Logs', 'Security & MFA', 'Integrations']) {
    assert.ok(source.includes("label: '" + label + "'"), 'Missing Settings tab: ' + label);
  }
});

test('Users can reopen their own Security & MFA settings even when MFA is already enabled', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');

  assert.ok(source.includes("const fallbackTab: SettingsTab = canAccessServer ? 'overview' : canViewAuditLogs ? 'audit' : 'security';"));
  assert.ok(source.includes("if ((tab === 'overview' || tab === 'integrations') && !canAccessServer) return;"));
  assert.ok(!source.includes('mfaSetupRequired'));
  assert.ok(source.includes("if (tab === 'audit' && !canViewAuditLogs) return;"));
});

test('System integrity and snapshot controls are hidden without server permissions', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');

  assert.ok(source.includes('actions={canAccessServer ? ('));
  assert.ok(source.includes('if (!canAccessServer || integrityLoading) return;'));
  assert.ok(source.includes('if (!canAccessServer || snapshotLoading) return;'));
});

test('Overview loads each server status independently and reports partial failures', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');

  assert.equal((source.match(/\.catch\(\(\) => null\)/g) || []).length, 4);
  assert.ok(source.includes('const failures: string[] = [];'));
  assert.ok(source.includes('setOverviewLoadError('));
  assert.ok(source.includes('onClick={() => void loadOverview()}'));
});

test('Audit log load failures do not erase cached entries or masquerade as an empty ledger', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');
  const start = source.indexOf('const loadAuditLogs = useCallback');
  const end = source.indexOf('const loadAccounts = useCallback', start);
  const loader = source.slice(start, end);

  assert.ok(loader.includes('api.auditLogs.getAll()'));
  assert.ok(loader.includes('setAuditError('));
  assert.ok(!loader.includes('setLogs([])'));
  assert.ok(source.includes('Audit logs could not be loaded'));
  assert.ok(source.includes('Showing the last successfully loaded entries.'));
});

test('Admin account loading failures remain distinct from a genuinely empty account list', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');
  const start = source.indexOf('const loadAccounts = useCallback');
  const end = source.indexOf('const loadMeta = useCallback', start);
  const loader = source.slice(start, end);

  assert.ok(loader.includes('api.auth.getUsers()'));
  assert.ok(loader.includes('setAccountsError('));
  assert.ok(!loader.includes('setAccounts([])'));
  assert.ok(source.includes('Admin accounts could not be loaded'));
});

test('Account create and delete failures stay visible inside their active dialogs', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');
  const drawerStart = source.indexOf('open={isAddAccountModalOpen}');
  const drawerEnd = source.indexOf('</Drawer>', drawerStart);
  const drawer = source.slice(drawerStart, drawerEnd);
  const modalStart = source.indexOf('open={Boolean(confirmDelete)}');
  const modalEnd = source.indexOf('</Modal>', modalStart);
  const modal = source.slice(modalStart, modalEnd);

  assert.ok(drawer.includes('accountFormMessage.text'));
  assert.ok(modal.includes('deleteAccountMessage'));
  assert.ok(source.includes('if (!canManageAdminAccounts || isCreatingAccount) return;'));
  assert.ok(source.includes('if (!canManageAdminAccounts || !confirmDelete || isDeletingAccount) return;'));
});

test('Integration settings distinguish load, save success, and save failure states', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');

  assert.ok(source.includes("useState<{ success: boolean; text: string } | null>(null);"));
  assert.ok(source.includes("metaMessage.success ? 'border-success/20 bg-success/10 text-success' : 'border-danger/20 bg-danger/10 text-danger'"));
  assert.ok(source.includes("setMetaMessage({ success: false, text: res.error || 'Brand and metadata settings could not be loaded. Try again.' })"));
  assert.ok(source.includes("setMetaMessage({ success: true, text: 'Brand and metadata settings saved.' })"));
});

test('Account password validation copy and saving state match the 12-character policy', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');

  assert.ok(source.includes('newPassword.length < 12 || newPassword.length > 128'));
  assert.ok(source.includes('placeholder="At least 12 characters"'));
  assert.ok(source.includes('finally {\n      setSecuritySaving(false);'));
  assert.ok(source.includes("Account password updated successfully."));
  assert.ok(!source.includes('Master password updated successfully.'));
});

test('MFA setup, verification, and disable cannot submit duplicate requests', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');

  assert.ok(source.includes('if (mfaLoading || mfaEnabled) return;'));
  assert.ok(source.includes('if (mfaLoading) return;'));
  assert.ok(source.includes('if (mfaLoading || !mfaEnabled) return;'));
  assert.ok(source.includes("setMfaDisablePassword('')"));
  assert.ok(source.includes("setMfaDisableCode('')"));
});

test('Audit and account pagination clamp after refreshed data is reduced', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');

  assert.ok(source.includes('const auditPageCount = Math.max(1, Math.ceil(filteredLogs.length / auditPageSize));'));
  assert.ok(source.includes('const accountPageCount = Math.max(1, Math.ceil(accounts.length / accountPageSize));'));
  assert.ok(source.includes('[auditPageCount]'));
  assert.ok(source.includes('[accountPageCount]'));
});

test('Settings keeps loading and mutation feedback accessible to assistive technology', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');

  assert.ok(source.includes('role="alert"'));
  assert.ok(source.includes('aria-live="polite"'));
  assert.ok(source.includes('overviewLoadError || accountMessage?.text || accountFormMessage?.text'));
});
