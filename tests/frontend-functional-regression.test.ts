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
  assert.match(projects, /if \(!isSlugFixtureMode\(\)\) \{[\s\S]{0,200}writeStatusOverrides\(PROJECT_STATUS_OVERRIDES_KEY, \{\}\)[\s\S]{0,160}return source/);
});

test('Team workspace preview records are only injected in development or explicit fixture mode', async () => {
  const teams = await read('src/pages/admin/AdminTeams.tsx');
  assert.match(teams, /if \(isSlugFixtureMode\(\)\) \{[\s\S]{0,120}if \(nextMembers\.length === 0\)/);
  assert.match(teams, /currentViewResults[\s\S]{0,600}filter\(\(item\) => !item\.result\.success\)/);
});


test('MFA enrolment route is accessible before module permissions are evaluated', async () => {
  const gate = await read('src/components/admin/RequireModuleAccess.tsx');
  const settings = await read('src/pages/admin/AdminSettings.tsx');

  assert.match(gate, /const isRequiredMfaEnrollmentRoute =[\s\S]*moduleKey === 'settings'[\s\S]*session\?\.user\?\.mfaEnabled !== true[\s\S]*location\.pathname === '\/admin\/settings'[\s\S]*get\('tab'\) === 'security'/);
  assert.match(gate, /if \(isRequiredMfaEnrollmentRoute\) return <>{children}<\/>;/);
  assert.match(settings, /\{canManageAdminAccounts && \(/);
  assert.match(settings, /requestedTab === 'security' && !mfaSetupRequired && !canManageAdminAccounts && !canAccessServer/);
});


test('Client Lead Accounts use live CRM data in production and require CRM permission', async () => {
  const page = await read('src/pages/admin/AdminClientLeadAccounts.tsx');
  const app = await read('src/App.tsx');
  const layout = await read('src/pages/admin/AdminLayout.tsx');

  assert.match(page, /const \[records, setRecords\] = useState<Lead\[]>\(\(\) => fixtureMode \? seed : \[\]\)/);
  assert.match(page, /api\.crm\.getDeals\(\)/);
  assert.match(page, /api\.crm\.createDeal\(/);
  assert.match(page, /return 'Not scheduled'/);
  assert.match(app, /path="clients\/lead-accounts" element=\{<ModuleRoute moduleKey="crm"/);
  assert.match(layout, /isAllowed\('crm'\)/);
});

test('Client Retainers are server-persisted and sample agreements are fixture-only', async () => {
  const model = await read('src/lib/clientStore.ts');
  const page = await read('src/pages/admin/AdminClientRetainers.tsx');
  const routes = await read('server/routes.ts');

  assert.match(model, /activeRetainer\?: boolean/);
  assert.match(model, /retainerMonthlyValue\?: number/);
  assert.match(page, /const \[records, setRecords\] = useState<Retainer\[]>\(\(\) => fixtureMode \? seed : \[\]\)/);
  assert.match(page, /api\.clients\.getAll\(\)/);
  assert.match(page, /api\.clients\.update\(targetClient\.id/);
  assert.match(page, /api\.clients\.addRetainerHours\(clientId, amount\)/);
  assert.match(routes, /retainerMonthlyValue/);
  assert.match(routes, /Invalid retainer cycle/);
  assert.match(routes, /key === 'retainerCommittedHours' && numeric < 1/);
});

test('SLA Monitoring never presents mock uptime or incident metrics as production data', async () => {
  const page = await read('src/pages/admin/AdminClientSlaMonitoring.tsx');

  assert.match(page, /const \[records\] = useState<SlaAccount\[]>\(\(\) => fixtureMode \? seed : \[\]\)/);
  assert.match(page, /Sample values are hidden in production/);
  assert.match(page, /avgUptime === null \? 'Not available'/);
  assert.match(page, /avgMttr === null \? 'Not available'/);
  assert.match(page, /No production snapshot was exported/);
  assert.match(page, /exportSnapshot\(selectedTelemetry \? \[selectedTelemetry\] : \[\]\)/);
  assert.match(page, /not a live telemetry feed/);
});

test('unexpected async API failures are forwarded and returned as safe JSON', async () => {
  const routes = await read('server/routes.ts');
  const server = await read('server.ts');
  const helper = await read('server/async-route-errors.ts');

  assert.match(routes, /installRouterErrorForwarding\(apiRouter\)/);
  assert.ok(routes.indexOf('installRouterErrorForwarding(apiRouter)') < routes.indexOf('apiRouter.use(authenticate)'));
  assert.match(helper, /Promise\.resolve\(result\)\.catch/);
  assert.match(server, /const apiErrorHandler: ErrorRequestHandler/);
  assert.match(server, /app\.use\('\/api', apiErrorHandler\)/);
});


test('retainer usage increments atomically and keeps its audit event in the same database transaction', async () => {
  const repository = await read('server/postgres-client-repository.ts');
  const routes = await read('server/routes.ts');
  const client = await read('src/lib/apiClient.ts');
  const page = await read('src/pages/admin/AdminClientRetainers.tsx');

  const start = repository.indexOf('async addRetainerHours(');
  const end = repository.indexOf('async delete(', start);
  const method = repository.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(method, /SELECT \* FROM clients WHERE id = \$1 FOR UPDATE/);
  assert.match(method, /const nextHours = currentHours \+ hours/);
  assert.match(method, /appendWithinTransaction\(client, audit\)/);
  assert.match(routes, /apiRouter\.post\('\/clients\/:id\/retainer-hours', requireAuth, requirePermission\('canManageClients'\)/);
  assert.match(client, /addRetainerHours: \(id: string, hours: number\)/);
  assert.match(page, /api\.clients\.addRetainerHours\(clientId, amount\)/);
});


test('retainer mutations are only offered to accounts with client-management permission', async () => {
  const page = await read('src/pages/admin/AdminClientRetainers.tsx');
  const routes = await read('server/routes.ts');

  assert.match(page, /const canManageRetainers = fixtureMode \|\| hasAdminPermission\('canManageClients'\)/);
  assert.match(page, /\{canManageRetainers && <Button[^>]*onClick=\{openRetainerForm\}/);
  assert.match(page, /\{canManageRetainers && <>[\s\S]{0,600}onClick=\{\(\) => openRetainerForm\(item\)\}[\s\S]{0,500}onClick=\{\(\) => \{ setHoursTarget\(item\)/);
  assert.match(routes, /apiRouter\.put\('\/clients\/:id', requireAuth, requirePermission\('canManageClients'\)/);
  assert.match(routes, /apiRouter\.post\('\/clients\/:id\/retainer-hours', requireAuth, requirePermission\('canManageClients'\)/);
});


test('retainer usage can only be changed through the atomic hours endpoint', async () => {
  const routes = await read('server/routes.ts');
  const page = await read('src/pages/admin/AdminClientRetainers.tsx');
  const updateStart = routes.indexOf("apiRouter.put('/clients/:id'");
  const deleteStart = routes.indexOf("apiRouter.delete('/clients/:id'", updateStart);
  const updateRoute = routes.slice(updateStart, deleteStart);
  const termsStart = page.indexOf('const response = await api.clients.update(targetClient.id');
  const termsEnd = page.indexOf('});', termsStart);
  const termsPayload = page.slice(termsStart, termsEnd);

  assert.ok(updateStart >= 0 && deleteStart > updateStart);
  assert.doesNotMatch(updateRoute, /retainerUsedHours/);
  assert.doesNotMatch(termsPayload, /retainerUsedHours/);
  assert.match(routes, /apiRouter\.post\('\/clients\/:id\/retainer-hours', requireAuth, requirePermission\('canManageClients'\)/);
  assert.match(routes, /postgresClientRepository\.addRetainerHours\(id, hours,/);
});


test('team directory assignee lookup allows project managers without task-mutation permission', async () => {
  const routes = await read('server/routes.ts');
  const app = await read('src/App.tsx');
  const start = routes.indexOf("apiRouter.get('/auth/task-assignees'");
  const end = routes.indexOf('\n});', start);
  const handler = routes.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(handler, /requireAnyPermission\('canManageProjects', 'canManageKanbanTasks'\)/);
  assert.match(handler, /username: user\.username/);
  assert.match(handler, /division: user\.division/);
  assert.match(app, /const moduleKey = isVendorWorkspace \? 'vendors' : 'timelogs'/);
});


test('JSON client updates accept the same core profile fields as PostgreSQL updates', async () => {
  const routes = await read('server/routes.ts');
  const start = routes.indexOf("apiRouter.put('/clients/:id'");
  const jsonStart = routes.indexOf("const db = getDataSourceMode() === 'json'", start);
  const jsonEnd = routes.indexOf("const updatedAt = new Date().toISOString()", jsonStart);
  const jsonUpdate = routes.slice(jsonStart, jsonEnd);

  assert.ok(start >= 0 && jsonStart > start && jsonEnd > jsonStart);
  for (const field of ['company', 'contactPersonRole', 'avatarUrl']) {
    assert.match(jsonUpdate, new RegExp("'" + field + "'"));
  }
  assert.match(jsonUpdate, /if \(patch\.avatarUrl !== undefined\) patch\.avatarUrl = cleanOptionalUrl\(patch\.avatarUrl\)/);
  const postgresUpdate = routes.slice(start, jsonStart);
  assert.match(postgresUpdate, /if \(patch\.avatarUrl !== undefined\) patch\.avatarUrl = cleanOptionalUrl\(patch\.avatarUrl\)/);
});


test('binary uploads clear cached admin identity and notify auth guards on 401', async () => {
  const client = await read('src/lib/apiClient.ts');
  const start = client.indexOf('async function apiBinaryRequest');
  const end = client.indexOf('export const api =', start);
  const binaryClient = client.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(binaryClient, /res\.status === 401[\s\S]{0,350}clearSessionToken\(\)/);
  assert.match(binaryClient, /sessionStorage\.removeItem\('kapitech_admin_profile_v2'\)/);
  assert.match(binaryClient, /localStorage\.removeItem\('kapitech_admin_profile_v2'\)/);
  assert.match(binaryClient, /dispatchEvent\(new Event\('kapitech_auth_state_changed'\)\)/);
});


test('PostgreSQL client updates accept all canonical client statuses exposed by the UI', async () => {
  const routes = await read('server/routes.ts');
  const clients = await read('src/pages/admin/AdminClients.tsx');
  const start = routes.indexOf("apiRouter.put('/clients/:id'");
  const jsonStart = routes.indexOf("const db = getDataSourceMode() === 'json'", start);
  const postgresUpdate = routes.slice(start, jsonStart);
  const jsonEnd = routes.indexOf("const updatedAt = new Date().toISOString()", jsonStart);
  const jsonUpdate = routes.slice(jsonStart, jsonEnd);

  assert.match(clients, /const STATUS_OPTIONS:[\s\S]{0,250}value: 'lead'[\s\S]{0,150}value: 'completed'/);
  for (const status of ['active', 'inactive', 'prospect', 'on_hold', 'completed', 'lead']) {
    assert.ok(postgresUpdate.includes("'" + status + "'"), 'PostgreSQL update must accept ' + status);
  }
  for (const status of ['completed', 'lead']) {
    assert.ok(jsonUpdate.includes("'" + status + "'"), 'JSON update must accept ' + status);
  }
});
