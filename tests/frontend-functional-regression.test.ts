import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { isMasterAdministrator } from '../src/lib/adminAuth.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');


test('Finance hydration only replaces caches after valid server collection envelopes', async () => {
  const store = await read('src/lib/financeStore.ts');

  assert.match(store, /invoiceRes\.success && invoiceRes\.data\?\.success !== false && Array\.isArray\(invoiceRes\.data\?\.invoices\)/);
  assert.match(store, /expenseRes\.success && expenseRes\.data\?\.success !== false && Array\.isArray\(expenseRes\.data\?\.expenses\)/);
  assert.ok(store.includes('if (invoices !== null) invoiceCache = invoices;'));
  assert.ok(store.includes('if (expenses !== null) expenseCache = expenses;'));
  assert.ok(store.includes('if (invoices !== null && expenses !== null) {'));
  assert.ok(store.includes('financeServerHydrationStarted = false;\n    scheduleFinanceHydrationRetry();'));
  assert.ok(!store.includes('if (invoiceRes.success) invoiceCache = invoices;'));
  assert.ok(!store.includes('if (expenseRes.success) expenseCache = expenses;'));
});

test('API client does not encourage blind retry when a mutation outcome is unknown', async () => {
  const client = await read('src/lib/apiClient.ts');

  assert.ok(client.includes('const mutationOutcomeUnknown = MUTATING_METHODS.has(String(options.method || \'GET\').toUpperCase());'));
  assert.ok(client.includes('? MUTATING_METHODS.has(method)'));
  assert.ok(client.includes('The change may still have completed. Check the record before retrying to avoid creating a duplicate.'));
  assert.ok(client.includes('The request timed out. Its result is unknown. Check the record before retrying to avoid creating a duplicate.'));
  assert.ok(client.includes('The request result could not be confirmed. Check the record before retrying to avoid creating a duplicate.'));
  assert.ok(client.includes('Upload timed out. Its result is unknown; inspect the document in the private vault before retrying.'));
  assert.ok(client.includes('The upload result could not be confirmed. Inspect the document in the private vault before retrying.'));
  assert.ok(!client.includes("error: err?.name === 'AbortError' ? 'Request timed out. Please try again.'"));
  assert.ok(!client.includes("error: err?.name === 'AbortError' ? 'Upload timed out. Please try again.'"));
});

test('Document upload does not delete a record when the storage outcome is ambiguous', async () => {
  const documents = await read('src/pages/admin/AdminDocuments.tsx');
  const unknownOutcome = documents.indexOf('const uploadOutcomeUnknown = uploaded.status === undefined || uploaded.status >= 500;');
  const cleanup = documents.indexOf('const cleanup = await cleanupIncompleteDocument(createdId);', unknownOutcome);

  assert.ok(unknownOutcome >= 0);
  assert.ok(cleanup > unknownOutcome);
  assert.ok(documents.slice(unknownOutcome, cleanup).includes('if (uploadOutcomeUnknown) {'));
  assert.ok(documents.slice(unknownOutcome, cleanup).includes('await loadDocuments();'));
  assert.ok(documents.includes('do not upload it again until its status is clear.'));
});

test('Document upload reports failed compensation instead of silently hiding an orphan record', async () => {
  const documents = await read('src/pages/admin/AdminDocuments.tsx');

  assert.ok(documents.includes('const cleanupIncompleteDocument = async (id: string): Promise<{ confirmed: boolean; error?: string }> => {'));
  assert.ok(documents.includes('const cleanup = await cleanupIncompleteDocument(createdId);'));
  assert.ok(documents.includes('if (!cleanup.confirmed) {'));
  assert.ok(documents.includes('await loadDocuments();'));
  assert.ok(documents.includes('Temporary record cleanup could not be confirmed. The vault was refreshed; inspect the document list before retrying.'));
  assert.ok(!documents.includes('await api.documents.delete(createdId).catch(() => {})'));
});

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
  assert.match(projects, /setProjects\(serverProjects\);/);
  assert.doesNotMatch(projects, /demoProjects|INITIAL_DEFAULT_PROJECTS|isSlugFixtureMode|A\/B dataset|demo_task_|'demo_'/);
  assert.doesNotMatch(projects, /sessionStorage|PROJECT_STATUS_OVERRIDES_KEY|TASK_STATUS_OVERRIDES_KEY|applyKanbanStatusOverrides/);
  assert.match(projects, /if \(savedToData\) setProjectDrawerOpen\(false\)/);
  assert.match(projects, /if \(savedToData\) setTaskDrawerOpen\(false\)/);
  const runtime = await read('src/lib/runtimeMode.ts');
  assert.match(runtime, /isSlugFixtureMode = \(\): boolean => false/);
});

test('Project editor can link an existing canonical client without guessing by display name', async () => {
  const projects = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(projects.includes("const canReadClients = hasAdminPermission('canManageClients') || hasAdminPermission('canManageCrm');"));
  assert.match(projects, /const loadProjectClients = React\.useCallback\(async \(\) => \{/);
  assert.match(projects, /setClientOptionsLoaded\(true\)/);
  assert.match(projects, /\[canReadClients\]\);/);
  assert.ok(projects.includes("clientId: project.clientId || ''"));
  assert.ok(projects.includes('clientId: projectForm.clientId || undefined'));
  assert.ok(projects.includes('slug="projects-client-link"'));
  assert.ok(projects.includes("No linked client / enter manually"));
  assert.ok(projects.includes('...clientOptions.map((client) => ({'));
  assert.ok(projects.includes('clientId: projectForm.clientId && event.target.value !=='));
});

test('Project save requires the canonical persisted record before showing success', async () => {
  const projects = await read('src/pages/admin/AdminProjects.tsx');

  assert.ok(projects.includes('const persistedProject = response.data?.project ? normalizeProject(response.data.project) : null;'));
  assert.ok(projects.includes('if (!persistedProject) {\n          await syncProjects(false);'));
  assert.ok(projects.includes('Review the refreshed project list before retrying.'));
  assert.ok(!projects.includes('else if (editingProject) {\n          setProjects(current => current.map(item => item.id === editingProject.id ? localProject : item));'));
});

test('Team workspace preview records are only injected in development or explicit fixture mode', async () => {
  const teams = await read('src/pages/admin/AdminTeams.tsx');
  assert.doesNotMatch(teams, /isSlugFixtureMode|previewMembers|previewVendors|previewProjects|previewLogs|previewTabs|A\/B workspace/);
  assert.match(teams, /api\.auth\.getTaskAssignees\(\)/);
  assert.match(teams, /api\.vendors\.getAll\(\)/);
  assert.match(teams, /api\.projects\.getAll\(\)/);
  assert.match(teams, /api\.timeLogs\.getAll\(\)/);
  assert.match(teams, /let nextMembers: TeamMember\[] = \[\]/);
  assert.match(teams, /const availableSources: TeamSourceAvailability = \{[\s\S]*members: memberRes\.success && Array\.isArray\(memberRes\.data\?\.assignees\)[\s\S]*timeLogs: timeRes\.success && Array\.isArray\(timeRes\.data\?\.timeLogs\)/);
  assert.match(teams, /currentViewResults[\s\S]{0,2500}filter\(\(item\) => !item\.available\)/);
  assert.match(teams, /'skill-matrix': \['members', 'vendors'\]/);
  assert.match(teams, /currentViewDataUnavailable = TEAM_VIEW_DATA_SOURCES\[currentView\]/);
});


test('MFA enrolment route is accessible before module permissions are evaluated', async () => {
  const gate = await read('src/components/admin/RequireModuleAccess.tsx');
  const settings = await read('src/pages/admin/AdminSettings.tsx');

  assert.match(gate, /const isRequiredMfaEnrollmentRoute =[\s\S]*moduleKey === 'settings'[\s\S]*session\?\.user\?\.mfaEnabled !== true[\s\S]*location\.pathname === '\/admin\/settings'[\s\S]*get\('tab'\) === 'security'/);
  assert.match(gate, /if \(isRequiredMfaEnrollmentRoute\) return <>{children}<\/>;/);
  assert.match(settings, /\{canManageAdminAccounts && \(/);
  assert.match(settings, /requestedTab === 'security' && !mfaSetupRequired && !canManageAdminAccounts && !canAccessServer/);
});


test('AMS navigation follows the nine-module structure and keeps actions in their owning workspaces', async () => {
  const layout = await read('src/pages/admin/AdminLayout.tsx');
  const app = await read('src/App.tsx');
  const primitives = await read('src/components/admin/AdminModulePrimitives.tsx');
  const navigation = await read('src/lib/amsNavigationAccess.ts');
  const subnavigation = await read('src/lib/amsModuleSubnavigation.ts');
  const sidebar = await read('src/components/admin/DynamicAdminSidebar.tsx');
  const teams = await read('src/pages/admin/AdminTeams.tsx');
  const vendors = await read('src/pages/admin/AdminVendors.tsx');
  const clients = await read('src/pages/admin/AdminClients.tsx');
  const workbook = await read('src/lib/financeWorkbook.ts');

  for (const group of ["'Workspace'", "'Delivery'", "'Operations'", "'Publishing'"]) {
    assert.ok(navigation.includes(group), 'Expected navigation group ' + group);
  }
  for (const label of ["Dashboard", "Inbox", "Projects", "Clients", "Finance", "Team & Resources", "Documents", "Website CMS"]) {
    assert.ok(navigation.includes("label: '" + label + "'"), 'Missing primary module ' + label);
  }
  assert.ok(navigation.includes("label: 'Settings'"));
  assert.ok(navigation.includes("key: 'user-access'"));
  assert.ok(navigation.includes("key: 'data-persistence-backup'"));
  assert.equal(navigation.includes("key: 'release-readiness'"), false);
  for (const label of ["Overview & Control", "Transactions & Cash", "Receivables & Payables", "Project Finance", "Accounting & Reports"]) {
    assert.ok(workbook.includes("label: '" + label + "'"), 'Missing Finance area ' + label);
  }
  for (const label of ["label: 'Agreements'", "label: 'Time Tracking'", "label: 'Vendors & Freelancers'"]) {
    assert.ok(subnavigation.includes(label), 'Missing contextual subarea ' + label);
  }
  for (const removed of ["label: 'Sales & Pipeline'", "label: 'Proposals'", "label: 'Approvals'", "label: 'Vendor Ledger'", "label: 'Timesheet Control'"]) {
    assert.equal(navigation.includes(removed), false, 'Standalone/legacy navigation remains: ' + removed);
  }
  assert.ok(navigation.includes("return 'Freelancer';"), 'Unknown legacy role must fail closed.');

  assert.equal(layout.split('<DynamicAdminSidebarNavigation').length - 1, 2, 'Desktop and mobile use the same sidebar.');
  assert.equal(layout.split('<AdminSystemSettingsNavigation').length - 1, 2, 'Desktop and mobile pin the single Settings entry.');
  assert.ok(sidebar.includes("if (role !== 'Admin') return null;"));
  assert.ok(sidebar.includes('data-ams-feature-slug="role-based-sidebar"'));
  assert.ok(sidebar.includes('data-ams-navigation-layout="flat"'));
  assert.ok(sidebar.includes("aria-current={active ? 'page' : undefined}"));
  assert.equal(sidebar.includes('data-ams-nav-submenu='), false);
  assert.equal(sidebar.includes('aria-expanded='), false);
  assert.equal(sidebar.includes('ChevronDown'), false);
  assert.equal(layout.includes('<AdminTopbarTabs'), true, 'Desktop workspace navigation uses the dedicated topbar tab primitive.');
  assert.ok(primitives.includes('items.filter(canRenderNavigationTab).map((item) => {'));
  assert.ok(navigation.includes('export function canAccessAmsRoute'));
  assert.ok(app.includes('<AmsRoleRouteGuard>'));
  assert.ok(app.includes('path="navigation/live-activity"'));
  assert.ok(app.includes('path="navigation/release-readiness"'));

  assert.equal(layout.includes('data-ams-slug="active-module-title"'), false);
  assert.ok(sidebar.includes('aria-label="Primary navigation"'));
  assert.ok(sidebar.includes('data-ams-navigation-layout="flat"'));
  assert.ok(layout.includes('Search Everything'));
  assert.ok(layout.includes('GlobalTimerControl'));
  assert.ok(layout.includes('AdminNotificationCenter'));
  assert.ok(layout.includes('onLogout={handleLogout}'));
  assert.ok(layout.includes('actionMenu'));
  assert.ok(subnavigation.includes("label: 'Vendors & Freelancers'"));
  assert.match(vendors, /ariaLabel="Vendors and freelancers worksheets"/);
  assert.ok(vendors.includes("canViewSkillMatrix = canAccessAmsRoute(navigationRole, '/admin/vendors', '?view=skill-matrix')"));
  assert.equal(vendors.split("to: '/admin/vendors?view=skill-matrix'").length - 1, 2);
  assert.equal(vendors.split("...(canViewSkillMatrix ? [{").length - 1, 2);
  assert.equal(vendors.includes('data-ams-slug="vendors-mobile-tabs"'), false);
  assert.equal(teams.includes("to: '/admin/team?view=vendor-directory'"), false);
  assert.equal(teams.includes("to: '/admin/team?view=skill-matrix'"), false);
  assert.equal(teams.includes("to: '/admin/team?view=time-logs'"), false);

  assert.ok(app.includes('<Route path="team" element={<TeamWorkspaceRoute />} />'));
  assert.ok(app.includes('<Route path="time-logs" element={<ModuleRoute moduleKey="timelogs" moduleLabel="Time"><AdminTimeLogs /></ModuleRoute>} />'));
  assert.ok(app.includes('<Route path="vendors" element={<VendorWorkspaceRoute />} />'));
  assert.ok(app.includes('<Route path="crm" element={<Navigate to="/admin/clients/all-clients" replace />} />'));
  assert.ok(app.includes('<Route path="proposals" element={<LegacyQuotationRedirect />} />'));
  assert.ok(app.includes('<Route path="finance/quotations" element={<ModuleRoute moduleKey="invoicing" moduleLabel="quotations"><AdminInvoicing embeddedView="quotations" /></ModuleRoute>} />'));
  assert.ok(app.includes('<Route path="approvals" element={<ModuleRoute moduleKey="approvals" moduleLabel="legacy approvals"><AmsNavigationPlaceholder kind="deprecated-approvals" /></ModuleRoute>} />'));
  assert.ok(app.includes("requestedView === 'vendor-directory'"));
  assert.ok(app.includes("requestedView === 'time-logs'"));
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

  assert.ok(dashboard.includes('<PerformanceView') && dashboard.includes('matchesDate={matchesDate}') && dashboard.includes('reportPeriodLabel={reportPeriodLabel}'));
  assert.ok(dashboard.includes('<AnalyticsView') && dashboard.includes('reportPeriodMode={reportPeriodMode}') && dashboard.includes('reportPeriodValue={reportPeriodValue}') && dashboard.includes('reportPeriodLabel={reportPeriodLabel}') && dashboard.includes('currency={financeCurrency}'));
  const analyticsView = dashboard.slice(dashboard.indexOf('const AnalyticsView:'), dashboard.indexOf('export const GlobalExecutiveDashboard'));
  assert.ok(analyticsView.includes('data-ams-feature-slug="dashboard-analytics-controls"'), 'Analytics report selection and scope controls must precede report content.');
  assert.ok(analyticsView.includes('aria-label="Analytics report"'), 'Analytics must expose accessible report selection controls.');
  assert.ok(analyticsView.includes('data-ams-feature-slug="dashboard-analytics-financial-report"'));
  assert.ok(analyticsView.includes('data-ams-feature-slug="dashboard-analytics-receivables-report"'));
  assert.ok(analyticsView.includes('data-ams-feature-slug="dashboard-analytics-project-status-report"'));
  assert.ok(analyticsView.includes('aria-label="Exact invoice and expense values by period"'), 'The chart must have an exact-value table alternative.');
  assert.doesNotMatch(analyticsView, /dashboard-analytics-kpis/, 'Mixed-scope KPI cards must not trail unrelated reports.');
  assert.ok(analyticsView.indexOf('dashboard-analytics-controls') < analyticsView.indexOf('dashboard-analytics-financial-report'));
  assert.ok(analyticsView.includes('Open Transactions & Cash') && analyticsView.includes('Open Accounts Receivable') && analyticsView.includes('Open Projects'), 'Each report must drill down to its owning module.');
  assert.doesNotMatch(dashboard, /Preview data only|sampleProjects|sampleTeam|sampleRevenueByRange|isSlugFixtureMode|fixtureMode/);
  assert.ok(dashboard.includes('Task queue unavailable'));
  assert.ok(dashboard.includes('Task queue unavailable for this role or source.'));
  assert.ok(dashboard.includes('Time-log source unavailable'));
  assert.ok(dashboard.includes('buildFinancialTrendForReportingPeriod(reportPeriodMode, reportPeriodValue'));
  assert.ok(dashboard.includes('buildRecentFinancialTrend(issuedInvoicesInSelectedCurrency, financeExpenseRows)'));
  assert.ok(dashboard.includes('The difference is an arithmetic comparison, not posted profit.'));
  const overviewStart = dashboard.indexOf("\n      {view === 'overview' ? (");
  const overviewEnd = dashboard.indexOf(") : view === 'performance' ? (", overviewStart);
  const overview = dashboard.slice(overviewStart, overviewEnd);
  const financeOverview = overview.indexOf('data-ams-feature-slug="dashboard-finance-overview"');
  const projectPortfolio = overview.indexOf('data-ams-feature-slug="dashboard-project-portfolio"');
  const projectProgress = overview.indexOf('data-ams-feature-slug="dashboard-project-progress"');
  const overviewAttention = overview.indexOf('data-ams-feature-slug="dashboard-attention-center"');
  const deliveryDesk = overview.indexOf('data-ams-feature-slug="dashboard-delivery-desk"');
  const deliveryCommitments = overview.indexOf('data-ams-feature-slug="dashboard-delivery-commitments"');
  assert.ok(projectProgress >= 0 && overviewAttention > projectProgress && deliveryDesk > overviewAttention && deliveryCommitments > deliveryDesk);
  assert.ok(financeOverview > deliveryCommitments && projectPortfolio > financeOverview);
  assert.equal(overview.includes('Priority 01'), false);
  assert.equal(overview.includes('data-ams-feature-slug="dashboard-agency-operating-indicators"'), false);
  assert.equal(overview.includes('title="Invoices vs expenses"'), false);
  assert.equal(overview.includes('title="Team capacity"'), false);
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

test('Legacy Approval route remains protected without loading a retired implementation', async () => {
  const app = await read('src/App.tsx');
  assert.ok(app.includes('<Route path="approvals" element={<ModuleRoute moduleKey="approvals" moduleLabel="legacy approvals"><AmsNavigationPlaceholder kind="deprecated-approvals" /></ModuleRoute>} />'));
  assert.doesNotMatch(app, /import\(['"]\.\/pages\/admin\/AdminApprovals['"]\)/);
  assert.doesNotMatch(app, /from ['"]\.\/pages\/admin\/AdminApprovals['"]/);
});

test('Client Retainers use persisted records and disclose missing time-log reconciliation', async () => {
  const model = await read('src/lib/clientStore.ts');
  const page = await read('src/pages/admin/AdminClientRetainers.tsx');
  const routes = await read('server/routes.ts');

  assert.match(model, /activeRetainer\?: boolean/);
  assert.match(model, /retainerMonthlyValue\?: number/);
  assert.match(page, /const \[records, setRecords\] = useState<Retainer\[]>\(\[\]\)/);
  assert.doesNotMatch(page, /const seed: Retainer|isSlugFixtureMode|hoursTarget|setHoursTarget|retainer-hours-drawer|api\.clients\.addRetainerHours/);
  assert.match(page, /api\.clients\.getAll\(\)/);
  assert.match(page, /api\.clients\.update\(targetClient\.id/);
  assert.doesNotMatch(page, /api\.clients\.addRetainerHours\(/);
  assert.doesNotMatch(page, /retainer-hours-drawer|setHoursTarget/);
  assert.ok(page.includes('data-ams-slug="retainer-time-log-reconciliation-state"'));
  assert.ok(page.includes('does not yet reconcile Time Logs with retainer billing cycles and eligible-entry rules'));
  assert.match(routes, /retainerMonthlyValue/);
  assert.match(routes, /Invalid retainer cycle/);
  assert.match(routes, /key === 'retainerCommittedHours' && numeric < 1/);
});

test('SLA Monitoring never presents mock uptime or incident metrics as production data', async () => {
  const page = await read('src/pages/admin/AdminClientSlaMonitoring.tsx');

  assert.match(page, /Telemetry not configured/);
  assert.match(page, /No sample accounts or simulated performance values are shown/);
  assert.match(page, /Uptime, MTTR, compliance, incident history, and snapshots are unavailable/);
  assert.match(page, /data-ams-slug="sla-monitoring-setup"/);
  assert.doesNotMatch(page, /SLA-001|PT Astra Digital Ventura|ShopeePay International|value:\s*['"]\d+/);
  assert.doesNotMatch(page, /const seed|const \[records\]|isSlugFixtureMode/);
  assert.match(page, /Open Contracts &amp; SOW/);
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


test('manual retainer increments are disabled until canonical time-entry rules exist', async () => {
  const repository = await read('server/postgres-client-repository.ts');
  const routes = await read('server/routes.ts');
  const client = await read('src/lib/apiClient.ts');
  const page = await read('src/pages/admin/AdminClientRetainers.tsx');

  assert.doesNotMatch(repository, /async addRetainerHours\(/);
  assert.doesNotMatch(client, /addRetainerHours/);
  assert.doesNotMatch(page, /api\.clients\.addRetainerHours\(|retainer-hours-drawer|setHoursTarget/);

  const start = routes.indexOf("apiRouter.post('/clients/:id/retainer-hours'");
  const end = routes.indexOf("apiRouter.put('/clients/:id'", start);
  const legacyRoute = routes.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(legacyRoute, /res\.status\(410\)/);
  assert.match(legacyRoute, /Manual retainer usage adjustments are disabled/);
  assert.doesNotMatch(legacyRoute, /retainerUsedHours|postgresClientRepository\.addRetainerHours|db\.clients\[index\]/);
  assert.ok(routes.includes("apiRouter.post('/projects/timelogs'"));
});


test('retainer mutations are only offered to accounts with client-management permission', async () => {
  const page = await read('src/pages/admin/AdminClientRetainers.tsx');
  const routes = await read('server/routes.ts');

  assert.match(page, /const canManageRetainers = hasAdminPermission\('canManageClients'\)/);
  assert.match(page, /\{canManageRetainers && <Button[^>]*onClick=\{openRetainerForm\}/);
  assert.doesNotMatch(page, /setHoursTarget|retainer-hours-drawer|Log hours/);
  assert.match(page, /onClick=\{\(\) => openRetainerForm\(item\)\}/);
  assert.match(routes, /apiRouter\.put\('\/clients\/:id', requireAuth, requirePermission\('canManageClients'\)/);
  assert.match(routes, /apiRouter\.post\('\/clients\/:id\/retainer-hours', requireAuth, requirePermission\('canManageClients'\)/);
});


test('retainer usage is not incremented outside a defined canonical time-entry rule', async () => {
  const routes = await read('server/routes.ts');
  const repository = await read('server/postgres-client-repository.ts');
  const client = await read('src/lib/apiClient.ts');
  const page = await read('src/pages/admin/AdminClientRetainers.tsx');
  const updateStart = routes.indexOf("apiRouter.put('/clients/:id'");
  const deleteStart = routes.indexOf("apiRouter.delete('/clients/:id'", updateStart);
  const updateRoute = routes.slice(updateStart, deleteStart);

  assert.ok(updateStart >= 0 && deleteStart > updateStart);
  assert.doesNotMatch(updateRoute, /retainerUsedHours/);
  assert.doesNotMatch(repository, /addRetainerHours/);
  assert.doesNotMatch(client, /addRetainerHours/);
  assert.doesNotMatch(page, /retainerUsedHours\s*:/);
  assert.match(routes, /apiRouter\.post\('\/clients\/:id\/retainer-hours'[\s\S]{0,300}status\(410\)/);
  assert.ok(routes.includes("apiRouter.post('/projects/timelogs'"));
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
test('runtime fixture mode is disabled and demo records are isolated from normal app paths', async () => {
  const runtimeMode = await read('src/lib/runtimeMode.ts');
  assert.match(runtimeMode, /isSlugFixtureMode = \(\): boolean => false/);
  assert.doesNotMatch(runtimeMode, /VITE_AB_TEST_DATA/);
});

test('fresh JSON database bootstrap starts operational collections empty', async () => {
  const database = await read('server/db.ts');
  const seedStart = database.indexOf('const seed: DatabaseSchema = {');
  const seedEnd = database.indexOf('\n  if (isProduction)', seedStart);
  assert.ok(seedStart >= 0 && seedEnd > seedStart, 'The JSON bootstrap seed must remain inspectable.');
  const seed = database.slice(seedStart, seedEnd);

  for (const collection of [
    'leads', 'crmDeals', 'proposals', 'clients', 'clientInteractions',
    'projects', 'tasks', 'timeLogs', 'invoices', 'expenses', 'approvals',
    'vendors', 'documents', 'notifications'
  ]) assert.ok(seed.includes('    ' + collection + ': [],'), 'Fresh JSON bootstrap must not seed ' + collection + '.');

  assert.ok(seed.includes("id: 'usr_root_admin'"), 'The initial administrator bootstrap is required.');
  assert.ok(seed.includes("action: 'SYSTEM_BOOTSTRAP'"), 'The database initialization audit event is retained.');
  assert.doesNotMatch(seed, /lead_inb_001|deal_101|prop_2026_001|cli_101|proj_101|task_101|KAPI-INV-2026-001|exp_201|appr_001|ven_001|doc_001|notif_001|Budi Santoso|Bambang Soediro/);
});

test('Finance invoices, expenses, vendors, and quotations use canonical persisted sources only', async () => {
  const page = await read('src/pages/admin/AdminInvoicing.tsx');
  const store = await read('src/lib/financeStore.ts');

  for (const token of [
    'const [vendors, setVendors] = useState<AgencyVendor[]>([]);',
    'const [quotations, setQuotations] = useState<FinanceQuotation[]>([]);',
    'api.finance.getInvoices()',
    'api.finance.getExpenses()',
    'api.vendors.getAll()',
    'api.proposals.getAll()',
    'setVendors(serverVendors);',
    'quotationError'
  ]) assert.ok(page.includes(token), 'Finance is missing canonical-source behavior: ' + token);

  assert.doesNotMatch(page, /STITCH_FINANCE_QUOTATIONS|STITCH_FINANCE_RETAINER_INVOICES|isSlugFixtureMode|usingDemo|slugDataMode|syncDemoFinanceMetrics|inv_slug_|exp_slug_|quote_slug_|retainer_demo_/);
  assert.ok(store.includes('INITIAL_DEFAULT_INVOICES: AgencyInvoice[] = [];'));
  assert.ok(store.includes('INITIAL_DEFAULT_EXPENSES: AgencyExpense[] = [];'));
  assert.doesNotMatch(store, /KAPI-INV-2026-001|KAPI-RET-2026-001|retainer_demo_001/);
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
  assert.match(cmsProjects, /CMS status saved as Published\. Verify the public \/work page to confirm visibility\./);
  assert.doesNotMatch(cmsProjects, /Case study published successfully to live site!|Case study unpublished from the public site\./);
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
  assert.match(testimonials, /CMS status saved as Published\. Verify the public Testimonials page to confirm visibility\./);
  assert.match(testimonials, /CMS status saved as Draft\. Verify the public Testimonials page to confirm visibility changes\./);
  assert.doesNotMatch(testimonials, /Testimonial published successfully to the website|Testimonial published successfully\.|Testimonial unpublished from the public site\.|Testimoni berhasil dipublikasikan ke website/);
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
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  const app = await read('src/App.tsx');
  assert.match(careers, /role="tablist"/);
  assert.match(careers, /role="tab"/);
  assert.match(careers, /aria-selected=\{activeTab === tab\.key\}/);
  assert.match(careers, /ArrowLeft[\s\S]{0,700}handleWorkspaceTabChange\(nextKey\)/);
  assert.match(careers, /setSearchParams\(\(current\) =>/);
  assert.match(careers, /canManageJobs && requestedTab !== 'applicants' \? 'jobs' : 'applicants'/);
  assert.match(careers, /canAccessAmsRoute\(role, '\/admin\/cms\/careers'\)/);
  assert.doesNotMatch(careers, /navigate\('\/admin\/inbox\?view=jobs'/);
  assert.match(inbox, /\.filter\(\(item\) => item\.type !== 'career'\)/);
  assert.match(inbox, /to="\/admin\/cms\/careers\?tab=applicants"/);
  assert.match(app, /if \(query\.get\('view'\) === 'jobs'\)/);
  assert.match(app, /pathname: '\/admin\/cms\/careers', search: '\?tab=applicants'/);
  assert.match(app, /<InboxWorkspaceRoute \/>/);
  assert.match(careers, /id="careers-jobs-panel"[\s\S]{0,180}aria-labelledby="careers-jobs-tab"/);
  assert.match(careers, /id="careers-applicants-panel"[\s\S]{0,180}aria-labelledby="careers-applicants-tab"/);
  // The applicant status selector is rendered in both compact-card and wide-table presentations.
  assert.equal((careers.match(/<CustomSelect\b/g) || []).length, 4);
  assert.doesNotMatch(careers, /<select\b/);
  assert.match(careers, /cms-career-language-panel/);
  assert.match(careers, /cms-career-position-form/);
  assert.equal((careers.match(/className="cms-career-editor-group space-y-3"/g) || []).length, 6);
  const styles = await read('src/index.css');
  assert.match(styles, /\.ams-shell \.cms-career-editor-group \+ \.cms-career-editor-group/);
});


test('Contracts & SOW keeps its persisted lifecycle route under the role navigation policy', async () => {
  const navigation = await read('src/lib/amsNavigationAccess.ts');
  const app = await read('src/App.tsx');
  const page = await read('src/pages/admin/AdminContracts.tsx');
  const api = await read('src/lib/apiClient.ts');
  const routes = await read('server/routes.ts');
  const repository = await read('server/postgres-contract-repository.ts');
  const migration = await read('db/postgres/055_client_contracts_and_sow.sql');

  assert.ok(navigation.includes("path === '/admin/contracts'"), 'Contract access must be enforced by the role-aware route policy.');
  assert.ok(app.includes('path="contracts"') && app.includes('<AdminContracts />'));
  assert.ok(api.includes("'/api/contracts'") && api.includes('/transition'));
  assert.ok(routes.includes("apiRouter.post('/contracts/:id/transition'"));
  assert.ok(routes.includes('CLIENT_CONTRACT_TRANSITIONS'));
  assert.ok(routes.includes('Only draft contracts can be deleted.'));
  assert.ok(repository.includes('class PostgresContractRepository'));
  assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS client_contracts'));
  assert.ok(page.includes('New contract or SOW'));
});

test('SLA Monitoring never presents fixture telemetry as real client performance', async () => {
  const sla = await read('src/pages/admin/AdminClientSlaMonitoring.tsx');

  assert.match(sla, /Telemetry not configured/);
  assert.match(sla, /No sample accounts or simulated performance values are shown/);
  assert.match(sla, /Uptime, MTTR, compliance, incident history, and snapshots are unavailable/);
  assert.match(sla, /data-ams-slug="sla-monitoring-setup"/);
  assert.doesNotMatch(sla, /SLA-001|PT Astra Digital Ventura|ShopeePay International|value:\s*['"]\d+/);
  assert.doesNotMatch(sla, /SLA-001|PT Astra Digital Ventura|ShopeePay International|const seed/);
  assert.doesNotMatch(sla, /isSlugFixtureMode/);
});

test('Resource Planning assignments persist and Capacity Allocation foregrounds saved plans over tracked-time history', async () => {
  const teams = await read('src/pages/admin/AdminTeams.tsx');
  const routes = await read('server/routes.ts');

  assert.match(teams, /const toggleProjectAssignment = async/);
  assert.match(teams, /api\.projects\.update\(project\.id, \{ teamMembers: nextMembers, resourceAllocations: nextPlans \}\)/);
  assert.match(teams, /planned weekly allocation and dates/);

  const capacityStart = teams.indexOf('data-ams-feature-slug="capacity-allocation"');
  const capacityEnd = teams.indexOf(") : currentView === 'skill-matrix' ?", capacityStart);
  assert.ok(capacityStart >= 0 && capacityEnd > capacityStart, 'Capacity Allocation must retain a bounded workspace');
  const capacity = teams.slice(capacityStart, capacityEnd);
  const register = capacity.indexOf('slug="capacity-allocation-register"');
  const history = capacity.indexOf('slug="capacity-allocation-table"');
  assert.ok(register >= 0 && history > register, 'The saved allocation register must precede historical time context.');
  assert.match(capacity, /title="Planned resource allocations"/);
  assert.match(capacity, /Allocation %/);
  assert.match(capacity, /Planned hours \/ week/);
  assert.match(capacity, /Planned date range/);
  assert.match(capacity, /title="Historical tracked time"/);
  assert.match(capacity, /40h\/week reference only/);
  assert.doesNotMatch(capacity, /Historical tracked utilization|Upcoming resource allocation|No plan means unplanned, not automatically available/);

  assert.match(teams, /key: 'capacity-allocation', label: 'Capacity Allocation', to: '\/admin\/team\?view=capacity-allocation'/);
  assert.match(routes, /pickFields\(updates, \['title','name','client','clientId','clientName','clientCompany','clientEmail','serviceCategory','status','health','budget','progressPercent','startDate','targetEndDate','teamLead','teamMembers'/);
});


test('Global timer uses scoped project options and enforces assigned-task ownership on the server', async () => {
  const routes = await read('server/routes.ts');
  const apiClient = await read('src/lib/apiClient.ts');
  const timer = await read('src/components/admin/GlobalTimerControl.tsx');

  assert.ok(routes.includes("apiRouter.get('/projects/timelog-options', requireAuth"));
  assert.ok(routes.includes('canManageTimeLogsAcrossProjects(req.user!)'));
  assert.ok(routes.includes('isTimeLogTaskAssignedToUser(task, req.user!)'));
  assert.ok(routes.includes('You can only log time against tasks assigned to your account.'));
  assert.ok(routes.includes("apiRouter.post('/projects/timelogs', requireAuth, async"));
  assert.ok(apiClient.includes("'/api/projects/timelog-options'"));
  assert.ok(timer.includes('api.timeLogs.getOptions()'));
  assert.ok(timer.includes('api.timeLogs.create({'));
  assert.ok(timer.includes('The timer remains active; retry Stop to try again.'));
});


test('PM project profitability is aggregate-only and confidential vendor rates are redacted server-side', async () => {
  const routes = await read('server/routes.ts');
  const workspace = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const aggregatePage = await read('src/pages/admin/AdminProjectProfitability.tsx');
  const apiClient = await read('src/lib/apiClient.ts');

  const start = routes.indexOf("apiRouter.get('/finance/project-profitability'");
  const end = routes.indexOf("apiRouter.get('/finance/metrics'", start);
  assert.ok(start >= 0 && end > start, 'Aggregate profitability API route must remain registered before general finance metrics.');
  const endpoint = routes.slice(start, end);
  assert.ok(endpoint.includes("isProjectManagerRole(user)"));
  assert.ok(endpoint.includes("user.permissions?.canManageProjects"));
  assert.ok(endpoint.includes('postgresInvoiceRepository.list()'));
  assert.ok(endpoint.includes('postgresExpenseRepository.list()'));
  assert.ok(endpoint.includes('recordedCosts'));
  assert.ok(endpoint.includes('res.json({ success: true, projects: result })'));
  assert.ok(endpoint.includes('Only project/currency-level aggregates are returned'));
  assert.ok(workspace.includes("if (role === 'PM' && requestedTab === 'project-finance')"));
  assert.ok(workspace.includes('return <AdminProjectProfitability />;'));
  assert.ok(apiClient.includes("'/api/finance/project-profitability'"));
  assert.ok(aggregatePage.includes('Aggregate formula: collected revenue minus recorded expenses.'));
  assert.ok(aggregatePage.includes('Individual vendor and employee rates are not shown'));

  const vendorStart = routes.indexOf("apiRouter.get('/vendors'");
  const vendorEnd = routes.indexOf("apiRouter.post('/vendors'", vendorStart);
  assert.ok(vendorStart >= 0 && vendorEnd > vendorStart);
  const vendorGet = routes.slice(vendorStart, vendorEnd);
  assert.ok(vendorGet.includes('canViewConfidentialVendorRates(req.user!)'));
  assert.ok(vendorGet.includes('redactConfidentialVendorRateFields(vendor)'));
  assert.ok(vendorGet.includes('rateMasked: true'));
  assert.ok(routes.includes('Project managers cannot modify confidential vendor rates or contracts.'));
});
