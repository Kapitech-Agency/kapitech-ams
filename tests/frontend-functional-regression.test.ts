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

test('Team legacy links redirect to distinct permission-checked workspaces', async () => {
  const app = await read('src/App.tsx');
  assert.match(app, /const TeamWorkspaceRoute:[\s\S]*?requestedView === 'vendor-directory'/);
  assert.match(app, /requestedView === 'skill-matrix'/);
  assert.match(app, /requestedView === 'time-logs'/);
  assert.ok(app.includes('<Route path="team" element={<TeamWorkspaceRoute />} />'));
  assert.ok(app.includes('<Route path="time-logs" element={<ModuleRoute moduleKey="timelogs" moduleLabel="Time"><AdminTimeLogs /></ModuleRoute>} />'));
  assert.ok(app.includes('<Route path="vendors" element={<VendorWorkspaceRoute />} />'));
  assert.ok(app.includes('<ModuleRoute moduleKey="vendors" moduleLabel="Vendors">'));
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


test('AMS sidebar groups real modules and keeps feature views inside their module', async () => {
  const layout = await read('src/pages/admin/AdminLayout.tsx');
  const app = await read('src/App.tsx');
  const teams = await read('src/pages/admin/AdminTeams.tsx');
  const clients = await read('src/pages/admin/AdminClients.tsx');

  for (const group of ["'Overview'", "'Sales'", "'Delivery'", "'Finance'", "'Content'", "'Operations'"]) {
    assert.ok(layout.includes(group), 'Expected sidebar group ' + group);
  }
  assert.ok(layout.includes("const NAV_GROUPS: AdminNavGroup[] = ['Overview', 'Sales', 'Delivery', 'Finance', 'Content', 'Operations']"));

  const menuStart = layout.indexOf('const STITCH_NAV_ITEMS: AdminNavItem[] = [');
  const menuEnd = layout.indexOf('];', menuStart);
  assert.ok(menuStart >= 0 && menuEnd > menuStart);
  const menu = layout.slice(menuStart, menuEnd);
  for (const [key, label, group] of [
    ['dashboard', 'Dashboard', 'Overview'],
    ['inbox', 'Inbox', 'Sales'],
    ['crm', 'CRM', 'Sales'],
    ['proposals', 'Proposals', 'Sales'],
    ['clients', 'Clients', 'Sales'],
    ['projects', 'Projects', 'Delivery'],
    ['tasks', 'Tasks', 'Delivery'],
    ['team', 'Team', 'Delivery'],
    ['time-logs', 'Time', 'Delivery'],
    ['finance', 'Finance', 'Finance'],
    ['vendors', 'Vendors', 'Finance'],
    ['cms', 'Website', 'Content'],
    ['documents', 'Documents', 'Operations'],
    ['approvals', 'Approvals', 'Operations']
  ]) {
    assert.ok(menu.includes("key: '" + key + "'") && menu.includes("label: '" + label + "'") && menu.includes("group: '" + group + "'"), 'Incorrect sidebar module mapping: ' + label);
  }
  assert.equal(menu.includes("label: 'Team Directory'"), false);
  assert.equal(menu.includes("label: 'Time Logs'"), false);
  assert.equal(menu.includes("label: 'Vendor Directory'"), false);
  assert.equal(menu.includes("label: 'Capacity'"), false);

  assert.ok(layout.includes('ariaLabel="Team sections"'));
  assert.ok(layout.includes("label: 'Team Directory'"));
  assert.ok(layout.includes("label: 'Capacity'"));
  assert.ok(layout.includes('ariaLabel="Vendors sections"'));
  assert.ok(layout.includes("label: 'Vendor Directory'"));
  assert.ok(layout.includes("label: 'Skills'"));
  assert.equal(teams.includes("to: '/admin/team?view=vendor-directory'"), false);
  assert.equal(teams.includes("to: '/admin/team?view=skill-matrix'"), false);
  assert.equal(teams.includes("to: '/admin/team?view=time-logs'"), false);

  assert.ok(app.includes('<Route path="team" element={<TeamWorkspaceRoute />} />'));
  assert.ok(app.includes('<Route path="time-logs" element={<ModuleRoute moduleKey="timelogs" moduleLabel="Time"><AdminTimeLogs /></ModuleRoute>} />'));
  assert.ok(app.includes('<Route path="vendors" element={<VendorWorkspaceRoute />} />'));
  assert.ok(app.includes('<Route path="crm" element={<ModuleRoute moduleKey="crm" moduleLabel="CRM"><AdminClientLeadAccounts /></ModuleRoute>} />'));
  assert.ok(app.includes('<Route path="proposals" element={<ModuleRoute moduleKey="proposals" moduleLabel="Proposals"><AdminInvoicing embeddedView="quotations" /></ModuleRoute>} />'));
  assert.ok(app.includes('<Route path="approvals" element={<ModuleRoute moduleKey="approvals" moduleLabel="Approvals"><AdminApprovals /></ModuleRoute>} />'));
  assert.ok(app.includes("requestedView === 'vendor-directory'"));
  assert.ok(app.includes("requestedView === 'time-logs'"));
  assert.equal(app.includes('<Route path="crm" element={<Navigate to="/admin/dashboard"'), false);
  assert.equal(app.includes('<Route path="proposals" element={<Navigate to="/admin/dashboard"'), false);
  assert.equal(app.includes('<Route path="approvals" element={<Navigate to="/admin/dashboard"'), false);
  assert.equal(clients.includes("to: '/admin/clients/lead-accounts'"), false);
});

test('Dashboard Performance and Analytics use AMS operational and finance records', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  for (const sourceCall of [
    'api.projects.getAll()',
    'api.tasks.getAll()',
    'api.timeLogs.getAll()',
    'api.finance.getInvoices()',
    'api.finance.getExpenses()'
  ]) assert.ok(dashboard.includes(sourceCall), 'Dashboard source missing: ' + sourceCall);

  assert.ok(dashboard.includes('<PerformanceView snapshot={operationalSnapshot} />'));
  assert.ok(dashboard.includes('<AnalyticsView snapshot={operationalSnapshot} range={range} />'));
  assert.ok(dashboard.includes('Preview data only'));
  assert.ok(dashboard.includes('not a posted profit figure'));
  assert.doesNotMatch(dashboard, /const deliveryBreakdown = \[/);
});

test('Project cost actuals come from linked Finance expenses, not delivery progress', async () => {
  const projects = await read('src/pages/admin/AdminProjects.tsx');
  assert.ok(projects.includes('api.finance.getExpenses()'));
  assert.ok(projects.includes("const projectId = String(expense.projectId || '')"));
  assert.ok(projects.includes('recordedExpenseTotals'));
  assert.ok(projects.includes('getRecordedExpense(project.id)'));
  assert.ok(projects.includes('recorded_finance_cost'));
  assert.ok(projects.includes("expenseError || 'Finance source unavailable'"));
  assert.doesNotMatch(projects, /project\.budget \* \(project\.progressPercent \/ 100\)/);
});

test('Approvals use protected API workflows, maker-checker rules, and canonical Drawers', async () => {
  const approvals = await read('src/pages/admin/AdminApprovals.tsx');
  const app = await read('src/App.tsx');
  assert.ok(app.includes('<Route path="approvals" element={<ModuleRoute moduleKey="approvals" moduleLabel="Approvals"><AdminApprovals /></ModuleRoute>} />'));
  assert.ok(approvals.includes('api.approvals.getAll()'));
  assert.ok(approvals.includes('api.approvals.create('));
  assert.ok(approvals.includes('api.approvals.action('));
  assert.ok(approvals.includes('const canResolve = hasAdminPermission(\'canApproveBudgets\')'));
  assert.ok(approvals.includes('isOwnRequest'));
  assert.ok(approvals.includes('<Drawer'));
  assert.doesNotMatch(approvals, /<Modal\b|<\/Modal>/);
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
  assert.ok(app.includes('<Route path="time-logs" element={<ModuleRoute moduleKey="timelogs" moduleLabel="Time"><AdminTimeLogs /></ModuleRoute>} />'));
  assert.ok(app.includes('<ModuleRoute moduleKey="vendors" moduleLabel="Vendors">'));
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
test('sample fixture data cannot be enabled in production by environment flags', async () => {
  const runtimeMode = await read('src/lib/runtimeMode.ts');
  assert.match(runtimeMode, /isSlugFixtureMode = \(\): boolean => !import\.meta\.env\.PROD/);
  assert.doesNotMatch(runtimeMode, /VITE_AB_TEST_DATA/);
});

test('Finance never initializes production state with demo vendors or retired quotation fixtures', async () => {
  const page = await read('src/pages/admin/AdminInvoicing.tsx');
  assert.match(page, /const \[vendors, setVendors\] = useState<AgencyVendor\[]>\(\(\) => \(isSlugFixtureMode\(\) \? getAgencyVendors\(\) : \[\]\)\)/);
  assert.match(page, /const \[quotations, setQuotations\] = useState<FinanceQuotation\[]>\(\(\) => \(isSlugFixtureMode\(\) \? STITCH_FINANCE_QUOTATIONS : \[\]\)\)/);
  assert.match(page, /const \[usingDemoQuotations, setUsingDemoQuotations\] = useState\(isSlugFixtureMode\(\)\)/);
});


test('Task creation uses the persisted server task ID and never reports a failed create as saved', async () => {
  const page = await read('src/components/admin/TasksWorkspace.tsx');
  const createStart = page.indexOf('const saveNewTask = async');
  const createEnd = page.indexOf('const scopedRecords =', createStart);
  const createHandler = page.slice(createStart, createEnd);
  const statusStart = page.indexOf('const updateTaskStatus = async');
  const statusEnd = page.indexOf('const saveNewTask = async', statusStart);
  const statusHandler = page.slice(statusStart, statusEnd);
  assert.ok(createStart >= 0 && createEnd > createStart);
  assert.match(createHandler, /const persistedTask = response\.data\?\.task/);
  assert.match(createHandler, /id: persistedId/);
  assert.match(createHandler, /if \(!response\.success \|\| !persistedTask/);
  assert.match(createHandler, /No local task was added/);
  assert.doesNotMatch(createHandler, /setRecords\(current => \[localTask, \.\.\.current\]\)/);
  assert.match(statusHandler, /if \(!response\.success\)/);
  assert.match(statusHandler, /const rollback = \(\) =>/);
  assert.match(statusHandler, /Task status could not be saved/);
});

test('CMS Insights ignores stale requests and clamps page after the result count changes', async () => {
  const page = await read('src/pages/admin/AdminCmsInsights.tsx');
  assert.match(page, /const loadRequestId = useRef\(0\)/);
  assert.match(page, /if \(requestId !== loadRequestId\.current\) return/);
  assert.match(page, /const lastPage = Math\.max\(1, Math\.ceil\(nextTotal \/ pageSize\)\)/);
  assert.match(page, /if \(page > lastPage\) \{\s*setPage\(lastPage\)/);
  assert.match(page, /loadRequestId\.current \+= 1/);
});

test('PostgreSQL notification read failure returns service unavailable instead of mixing JSON data', async () => {
  const routes = await read('server/routes.ts');
  const start = routes.indexOf("apiRouter.get('/notifications'");
  const end = routes.indexOf("apiRouter.post('/notifications/:id/read'", start);
  const handler = routes.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(handler, /Notification repository unavailable/);
  assert.match(handler, /res\.status\(503\)\.json/);
  assert.doesNotMatch(handler, /catch \(error\)[\s\S]{0,400}source = getDatabase\(\)\.notifications/);
});

test('Finance tables recompute visible rows when page size changes', async () => {
  const page = await read('src/pages/admin/AdminInvoicing.tsx');
  assert.match(page, /useMemo\(\(\) => \{[\s\S]{0,180}filteredInvoices\.slice\(start, start \+ invoicePageSize\)[\s\S]{0,80}\[filteredInvoices, invoicePage, invoicePageSize\]\)/);
  assert.match(page, /incomeRows\.slice\(start, start \+ incomePageSize\)[\s\S]{0,90}\[incomeRows, incomePage, incomePageSize\]/);
  assert.match(page, /filteredExpenses\.slice\(start, start \+ expensePageSize\)[\s\S]{0,90}\[filteredExpenses, expensePage, expensePageSize\]/);
});

test('CMS case studies preserve legacy publication and new records default to drafts', async () => {
  const cmsProjects = await read('src/pages/admin/AdminCmsProjects.tsx');
  const routes = await read('server/routes.ts');
  assert.match(cmsProjects, /isPublished: project\.isPublished !== false/);
  assert.match(cmsProjects, /isPublished: false/);
  assert.match(cmsProjects, /Case study saved as a draft/);
  assert.match(cmsProjects, /Case study published successfully to live site!/);
  assert.match(routes, /isPublished: item\.isPublished === true,[\s\S]{0,100}createdAt: now/);
  assert.equal((routes.match(/source\.filter\(\(item: any\) => item\.isPublished !== false\)/g) || []).length, 2);
});
test('CMS testimonials require explicit publication and can be published from the directory', async () => {
  const testimonials = await read('src/pages/admin/AdminCmsTestimonials.tsx');
  const routes = await read('server/routes.ts');
  assert.match(testimonials, /isPublished: item\?\.isPublished !== false/);
  assert.match(testimonials, /isPublished: false/);
  assert.match(testimonials, /handleTogglePublished/);
  assert.match(testimonials, /isPublished === true/);
  assert.match(routes, /isPublished: item\.isPublished === true,[\s\S]{0,100}createdAt: now/);
});


test('CMS uses canonical AMS table geometry without legacy scoped overrides', async () => {
  const styles = await read('src/index.css');
  assert.match(styles, /AMS CANONICAL DATA TABLE/);
  assert.match(styles, /\.ams-shell table thead th\{[^}]*height:40px/);
  assert.match(styles, /\.ams-shell table tbody td\{[^}]*height:40px/);
  assert.doesNotMatch(styles, /\.ams-shell \.ams-cms-module table thead th\s*\{/);
  assert.doesNotMatch(styles, /\.ams-shell \.ams-cms-module table tbody td\s*\{/);
  assert.doesNotMatch(styles, /@media\s*\(max-width:\s*599px\)\s*\{\s*\.ams-shell \.ams-cms-module table\s*\{\s*min-width:\s*720px/s);
});


test('CMS headers are text-only and directory tables share a unified pagination shell', async () => {
  const cmsPages = [
    'src/pages/admin/AdminCmsProjects.tsx',
    'src/pages/admin/AdminCmsServices.tsx',
    'src/pages/admin/AdminCmsTestimonials.tsx',
    'src/pages/admin/AdminCmsInsights.tsx',
    'src/pages/admin/AdminCmsCareers.tsx',
  ];

  for (const file of cmsPages) {
    const page = await read(file);
    const headerStart = page.indexOf('<AdminModuleHeader');
    const actionsStart = page.indexOf('actions=', headerStart);
    assert.ok(headerStart >= 0 && actionsStart > headerStart, file + ' has a module header');
    assert.doesNotMatch(page.slice(headerStart, actionsStart), /\bicon\s*=/, file + ' header must not include a decorative icon');
    assert.match(page, /<AdminDataTableShell\b/, file + ' uses the shared table surface');
    assert.match(page, /className="ams-data-table\b/, file + ' uses canonical table styling');
    assert.match(page, /<AdminDataTableShell\b[\s\S]*?<AdminTablePagination\b[\s\S]*?<\/AdminDataTableShell>/, file + ' keeps pagination inside the table surface');
    assert.doesNotMatch(page, /className="ams-table\s/, file + ' does not use the legacy table class');
  }

  const primitives = await read('src/components/admin/AdminModulePrimitives.tsx');
  assert.match(primitives, /className="ams-table-pagination border-t border-line bg-panel/);
  assert.match(primitives, /Rows per page/);
  assert.match(primitives, /role="group" aria-label="Page navigation"/);

  const careers = await read('src/pages/admin/AdminCmsCareers.tsx');
  assert.match(careers, /pagedPositions\.map\(position/);
  assert.match(careers, /pagedApplicants\.map\(applicant/);
  assert.match(careers, /cms-careers-jobs-pagination/);
  assert.match(careers, /cms-careers-applicants-pagination/);
});



test('AMS UI defaults no longer override component focus, form sizing, or compact pagination', async () => {
  const styles = await read('src/index.css');
  assert.match(styles, /:where\(\.ams-shell,\.ams-portal-root\)\s*:where\(a,button,\[role="button"\],input,select,textarea,\[tabindex\]\):focus-visible/);
  assert.doesNotMatch(styles, /\.ams-shell :where\(a,button,\[role=button\],input,select,textarea,\[tabindex\]\):focus-visible/);
  assert.match(styles, /:where\(\.ams-shell\) :where\(input:not\(\[type="checkbox"\]\)[\s\S]{0,220}min-height:36px/);
  assert.doesNotMatch(styles, /\.ams-shell input,\.ams-shell select,\.ams-shell textarea\{min-height:36px/);
  assert.doesNotMatch(styles, /ams-crm-kpi|ams-inbox-kpi|ams-leads-page/);

  const select = await read('src/components/ui/CustomSelect.tsx');
  assert.match(select, /xs: 'h-8 min-h-8/);
  const primitives = await read('src/components/admin/AdminModulePrimitives.tsx');
  assert.match(primitives, /pageSizeOptions\.map[\s\S]{0,160}size="xs"[\s\S]{0,100}aria-label=\{pageSizeAriaLabel\}/);
  assert.match(primitives, /pageSizeAriaLabel = 'Rows per page'/);
});

test('Careers tabs, filters, and modal fields use consistent AMS interactions', async () => {
  const careers = await read('src/pages/admin/AdminCmsCareers.tsx');
  assert.match(careers, /role="tablist"/);
  assert.match(careers, /role="tab"/);
  assert.match(careers, /aria-selected=\{activeTab === tab\.key\}/);
  assert.match(careers, /ArrowLeft[\s\S]{0,600}setActiveTab\(nextKey\)/);
  assert.match(careers, /id="careers-jobs-panel"[\s\S]{0,180}aria-labelledby="careers-jobs-tab"/);
  assert.match(careers, /id="careers-applicants-panel"[\s\S]{0,180}aria-labelledby="careers-applicants-tab"/);
  assert.equal((careers.match(/<CustomSelect\b/g) || []).length, 3);
  assert.doesNotMatch(careers, /<select\b/);
  assert.match(careers, /cms-career-language-panel/);
  assert.match(careers, /cms-career-position-form/);
  assert.equal((careers.match(/className="cms-career-editor-group space-y-3"/g) || []).length, 6);
  const styles = await read('src/index.css');
  assert.match(styles, /\.ams-shell \.cms-career-editor-group \+ \.cms-career-editor-group/);
});
