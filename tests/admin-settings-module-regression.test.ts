import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('System Center is a single Admin-only direct link and Settings workspace tabs render in the content area', async () => {
  const layout = await read('src/pages/admin/AdminLayout.tsx');
  const sidebar = await read('src/components/admin/DynamicAdminSidebar.tsx');
  const navigation = await read('src/lib/amsNavigationAccess.ts');
  const workspace = await read('src/lib/amsModuleSubnavigation.ts');

  assert.ok(layout.includes('data-ams-slug="workspace-navigation"'));
  assert.ok(layout.includes('ariaLabel="Workspace navigation"'));
  assert.ok(layout.includes("if (path === '/admin/settings' || path === '/admin/navigation/release-readiness') return 'settings';"));
  assert.ok(layout.includes('getAmsModuleSubnavigation(workspaceNavigationModule, amsRole, mfaSetupRequired)'));
  assert.ok(workspace.includes("{ key: 'backup', label: 'DB Migrations & Backups', to: '/admin/settings?tab=overview' }"));
  assert.ok(workspace.includes("{ key: 'access', label: 'Access & Confidential Cost Rates', to: '/admin/settings?tab=security' }"));
  assert.ok(workspace.includes("{ key: 'audit', label: 'Audit', to: '/admin/settings?tab=audit' }"));
  assert.ok(workspace.includes("{ key: 'integrations', label: 'Integrations', to: '/admin/settings?tab=integrations' }"));
  assert.ok(workspace.includes("{ key: 'readiness', label: 'Telemetry Gate', to: '/admin/navigation/release-readiness' }"));
  assert.ok(sidebar.includes('data-ams-navigation-layout="flat"'));
  assert.equal(sidebar.includes('aria-expanded='), false);
  assert.equal(sidebar.includes('ChevronDown'), false);
  assert.ok(sidebar.includes('AMS_PRIMARY_SETTINGS_ITEM'));
  assert.ok(navigation.includes("label: 'Settings'"));
  assert.ok(navigation.includes("allowedRoles: ['Admin']"));
  assert.ok(navigation.includes("key: 'release-readiness'"));
});
test('MFA setup stays reachable without admin rights while routine security access remains permission-gated', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');

  assert.ok(source.includes("const mfaSetupRequired = searchParams.get('mfaRequired') === '1' || session?.user?.mfaEnabled !== true;"));
  assert.ok(source.includes("(requestedTab === 'security' && !mfaSetupRequired && !canManageAdminAccounts && !canAccessServer)"));
  assert.ok(source.includes("if (tab === 'security' && !mfaSetupRequired && !canManageAdminAccounts && !canAccessServer) return;"));
  const layout = await read('src/pages/admin/AdminLayout.tsx');
  const navigation = await read('src/lib/amsModuleSubnavigation.ts');
  assert.ok(layout.includes('mfaSetupRequired'));
  assert.ok(layout.includes('getAmsModuleSubnavigation(workspaceNavigationModule, amsRole, mfaSetupRequired)'));
  assert.ok(navigation.includes('const mfaAccessOnly = moduleKey === \'settings\' && allowMfaSetup && role !== \'Admin\';'));
  assert.ok(navigation.includes("key: 'access',"));
  assert.ok(navigation.includes("to: '/admin/settings?tab=security',"));
  assert.ok(source.includes("const fallbackTab: SettingsTab = canAccessServer ? 'overview' : canViewAuditLogs ? 'audit' : (mfaSetupRequired || canManageAdminAccounts) ? 'security' : 'overview';"));
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

test('Backup archive identifiers strip milliseconds and keep a consistent filename suffix', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');

  assert.ok(source.includes("String(index + 1).padStart(2, '0') + '.tar.zst'"));
  assert.ok(source.includes(String.raw`replace(/\.\d{3}Z$/, '')`));
});

test('Audit CSV uses real row separators and neutralizes spreadsheet formulas', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');

  assert.ok(source.includes('const safeAuditCsvCell = (cell: unknown) =>'));
  assert.ok(source.includes('[=+\\-@]/.test(raw) ?'));
  assert.ok(source.includes(".join('\\r\\n')"));
  assert.ok(source.includes('safeValue.replace('));
});


test('workspace context navigation is scoped to its owning pages and cannot follow users across unrelated modules', async () => {
  const layout = await read('src/pages/admin/AdminLayout.tsx');

  assert.ok(layout.includes("if (path === '/admin/dashboard' || path === '/admin/navigation/live-activity') return 'dashboard';"));
  assert.ok(layout.includes("if (path === '/admin/projects') return 'projects';"));
  assert.ok(layout.includes("if (path === '/admin/settings' || path === '/admin/navigation/release-readiness') return 'settings';"));
  assert.equal(layout.includes("'/admin/documents', '/admin/team', '/admin/time-logs'"), false);
  assert.equal(layout.includes("'/admin/crm', '/admin/clients/all-clients'"), false);
});

test('CMS pages do not duplicate their direct sidebar destinations as shared section tabs', async () => {
  const cmsPages = [
    'src/pages/admin/AdminCmsProjects.tsx',
    'src/pages/admin/AdminCmsServices.tsx',
    'src/pages/admin/AdminCmsInsights.tsx',
    'src/pages/admin/AdminCmsTestimonials.tsx',
    'src/pages/admin/AdminCmsCareers.tsx',
  ];

  for (const file of cmsPages) {
    const source = await read(file);
    assert.equal(source.includes('AdminCmsSectionTabs'), false, file + ' should use the global sidebar for CMS destinations');
  }
});

test('Client Onboarding deep-links to a URL-controlled lead scope, not a hidden client-profile section', async () => {
  const navigation = await read('src/lib/amsNavigationAccess.ts');
  const clients = await read('src/pages/admin/AdminClients.tsx');

  assert.ok(navigation.includes("to: '/admin/clients/all-clients?scope=onboarding'"));
  assert.ok(clients.includes('useSearchParams'));
  assert.ok(clients.includes("if (scope === 'onboarding') return 'lead';"));
  assert.ok(clients.includes("nextParams.set('scope', queryValue)"));
});
