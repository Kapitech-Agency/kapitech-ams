import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { isMasterAdministrator } from '../src/lib/adminAuth.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('frontend Master bypass uses only server-owned identity attributes', async () => {
  assert.equal(isMasterAdministrator({
    id: 'usr_ops', username: 'admin', role: 'Tier 3: Operational Staff', stakeholderType: 'Operations'
  } as any), false);
  assert.equal(isMasterAdministrator({
    id: 'usr_exec', username: 'executive', role: 'Tier 1: Top Management / Sponsor', stakeholderType: 'Executive'
  } as any), false);
  assert.equal(isMasterAdministrator({
    id: 'usr_master', username: 'master-account', role: 'Tier 3: Operational Staff', stakeholderType: 'Master'
  } as any), true);
  assert.equal(isMasterAdministrator({
    id: 'usr_root_admin', username: 'legacy-root', role: 'Tier 3: Operational Staff', stakeholderType: 'Operations'
  } as any), true);

  const serverAuth = await read('server/auth.ts');
  assert.match(serverAuth, /return user\.stakeholderType === 'Master' \|\| user\.id === 'usr_root_admin'/);
});

test('finance read access and invoice mutation access match server permissions', async () => {
  const rbac = await read('src/lib/rbacEngine.ts');
  const routes = await read('server/routes.ts');
  assert.match(rbac, /invoicing: 'canViewFinancials'/);
  assert.match(routes, /apiRouter\.get\('\/finance\/invoices', requireAuth, requirePermission\('canViewFinancials'\)/);
  assert.match(routes, /apiRouter\.post\('\/finance\/invoices', requireAuth, requirePermission\('canManageInvoices'\)/);
});

test('combined Team workspace applies permission guard for selected view', async () => {
  const app = await read('src/App.tsx');
  assert.match(app, /const TeamWorkspaceRoute:[\s\S]*?new URLSearchParams\(location\.search\)\.get\('view'\)/);
  assert.match(app, /view === 'vendor-directory' \|\| view === 'skill-matrix'/);
  assert.match(app, /const moduleKey = isVendorWorkspace \? 'vendors' : 'timelogs'/);
  assert.match(app, /<Route path="team" element=\{<TeamWorkspaceRoute \/>\} \/>/);
});

test('Projects accepts valid empty server lists and never falls back to demo records in production', async () => {
  const projects = await read('src/pages/admin/AdminProjects.tsx');
  assert.match(projects, /response\.success && Array\.isArray\(response\.data\?\.projects\)/);
  assert.doesNotMatch(projects, /response\.data\.projects\.length > 0/);
  assert.match(projects, /isSlugFixtureMode\(\) \? applyKanbanStatusOverrides\(demoProjects\) : \[\]/);
  assert.match(projects, /if \(!serverModeRef\.current && !isSlugFixtureMode\(\)\)/);
  assert.match(projects, /if \(savedToData\) setProjectDrawerOpen\(false\)/);
  assert.match(projects, /if \(savedToData\) setTaskDrawerOpen\(false\)/);
  assert.match(projects, /delete taskOverrides\[task\.id\]/);
  assert.match(projects, /delete projectOverrides\[project\.id\]/);
});

test('Team workspace preview records are only injected in development or explicit fixture mode', async () => {
  const teams = await read('src/pages/admin/AdminTeams.tsx');
  assert.match(teams, /if \(isSlugFixtureMode\(\)\) \{[\s\S]{0,120}if \(nextMembers\.length === 0\)/);
  assert.match(teams, /currentViewResults[\s\S]{0,600}filter\(\(item\) => !item\.result\.success\)/);
});


test('MFA enrolment route is accessible before module permissions are evaluated', async () => {
  const gate = await read('src/components/admin/RequireModuleAccess.tsx');
  const settings = await read('src/pages/admin/AdminSettings.tsx');

  assert.match(gate, /const isRequiredMfaEnrollmentRoute =[\s\S]*moduleKey === 'settings'[\s\S]*session\?\.user\?\.mfaEnabled !== true[\s\S]*location\.pathname === '/admin/settings'[\s\S]*get\('tab'\) === 'security'/);
  assert.match(gate, /if \(isRequiredMfaEnrollmentRoute\) return <>{children}<\/>;/);
  assert.match(settings, /\{canManageAdminAccounts && \(/);
  assert.match(settings, /requestedTab === 'security' && !mfaSetupRequired && !canManageAdminAccounts && !canAccessServer/);
});
