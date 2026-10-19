import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Dashboard preserves useful finance context and two-column mobile KPI layout', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.match(dashboard, /featureSlug="dashboard-module"/);
  assert.match(dashboard, /min-\[390px\]:grid-cols-2 min-\[760px\]:grid-cols-4/);
  assert.match(dashboard, /data-ams-slug="dashboard-finance-chart-legend"/);
  assert.doesNotMatch(dashboard, /className="hidden items-center gap-3 text-\[11px\] text-muted sm:flex"/);
  assert.match(dashboard, /Issued invoice value and recorded expenses/);
  assert.match(dashboard, /project\.progress == null \? '—' : project\.progress \+ '%'/, 'Unreported project progress must be shown as unavailable, not as null%.');
  assert.match(dashboard, /width: \(project\.progress \?\? 0\) \+ '%'/);
  assert.match(dashboard, /width: \(projectDetails\.progress \?\? 0\) \+ '%'/);
});

test('Time tracking ledger precedes the supporting summary', async () => {
  const timeLogs = await read('src/pages/admin/AdminTimeLogs.tsx');
  const header = timeLogs.indexOf('<AdminModuleHeader slug="time-tracking-header"');
  const metrics = timeLogs.indexOf('<AdminMetricStrip slug="time-tracking-kpis"');
  const ledger = timeLogs.indexOf('data-ams-feature-slug="time-tracking-ledger"');
  const ledgerEnd = timeLogs.indexOf('</section>', ledger);
  assert.ok(header >= 0 && ledger > header && ledgerEnd > ledger && metrics > ledgerEnd);
});

test('Client directory filters and register precede supporting metrics', async () => {
  const clients = await read('src/pages/admin/AdminClients.tsx');
  const header = clients.indexOf('<AdminModuleHeader slug="clients-header"');
  const metrics = clients.indexOf('data-ams-feature-slug="clients-metrics"');
  const filters = clients.indexOf('<AdminFilterBar slug="client-directory-filters"');
  const directory = clients.indexOf('data-ams-feature-slug="clients-directory-table"');
  const directoryEnd = clients.indexOf('</section>', directory);
  assert.ok(header >= 0 && filters > header && directory > filters && directoryEnd > directory && metrics > directoryEnd);
});

test('Dashboard prioritizes operational KPIs and the primary workspace before supporting metrics', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  const overview = dashboard.indexOf('data-ams-feature-slug="dashboard-overview"');
  const primaryKpis = dashboard.indexOf("id: 'active-projects'", overview);
  const fourthPrimaryKpi = dashboard.indexOf("id: 'revenue'", primaryKpis);
  const chart = dashboard.indexOf('title="Invoices vs expenses"', fourthPrimaryKpi);
  const supportingMetrics = dashboard.indexOf('data-ams-feature-slug="dashboard-supporting-metrics"', chart);
  const projects = dashboard.indexOf('title="Active projects"', chart);
  const teamCapacity = dashboard.indexOf('title="Team capacity"', projects);
  assert.ok(overview < primaryKpis && primaryKpis < fourthPrimaryKpi && fourthPrimaryKpi < chart);
  assert.ok(chart < projects && projects < teamCapacity && teamCapacity < supportingMetrics);
  for (const id of ["outstanding", "utilization", "avg-project-value", "net-operating-profit"]) {
    assert.ok(dashboard.indexOf("id: '" + id + "'", supportingMetrics) > supportingMetrics, 'missing supporting KPI ' + id);
  }
});

test('Inbox toast feedback follows the stable page header instead of shifting it', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  const header = inbox.indexOf('<AdminModuleHeader slug="inbox-header"');
  const toast = inbox.indexOf('{/* Toast Notification */}');
  assert.ok(header >= 0 && toast > header, 'toast feedback should render after the module header');
});

test('Inbox heading identifies the active topbar workspace', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  assert.match(inbox, /title=\{activeInboxTab === 'overview' \? 'Inbox Overview' : activeInboxTab === 'messages' \? 'All Messages' : activeInboxTab === 'client' \? 'Sales Inquiries' : activeInboxTab === 'unread' \? 'Unread Messages' : 'Starred'\}/);
});

test('Inbox remains an inquiry workspace and star state remains accessible', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  const app = await read('src/App.tsx');
  assert.match(inbox, /featureSlug="inbox-module"/);
  assert.match(inbox, /aria-pressed=\{Boolean\(item\.starred\)\}/);
  assert.match(inbox, /const \[loadError, setLoadError\] = useState<string \| null>\(null\)/);
  assert.match(inbox, /Inbox data unavailable/);
  assert.match(inbox, /The last successfully loaded records remain visible/);
  assert.match(inbox, /Inbox is unavailable/);
  assert.match(inbox, /case 'client':\s*\/\/ Keep Sales Inquiries scoped to actual inquiry records\.[\s\S]*?return submissions\.filter\(\(item\) => !item\.type \|\| item\.type === 'inquiry'\)/);
  assert.match(inbox, /case 'overview':\s*case 'messages': return submissions;/);
  assert.match(inbox, /case 'starred': return submissions\.filter\(\(item\) => !!item\.starred\)/);
  assert.doesNotMatch(inbox, /Candidate pipeline|Starred candidate work|inbox-jobs-board/);
  assert.match(app, /pathname: '\/admin\/cms\/careers', search: '\?tab=applicants'/);
});

test('Projects prioritize the portfolio register before supporting KPIs while Tasks remain task-led', async () => {
  const projects = await read('src/pages/admin/AdminProjects.tsx');
  const tasks = await read('src/components/admin/TasksWorkspace.tsx');
  const header = projects.indexOf('<AdminModuleHeader');
  const kpis = projects.indexOf('data-ams-feature-slug="projects-kpis"');
  const portfolio = projects.indexOf('title="Project portfolio"');
  const archiveKpis = projects.indexOf('data-ams-feature-slug="projects-archived-kpis"');
  const archive = projects.indexOf('title="Archived projects"');
  assert.match(projects, /featureSlug="projects-module"/);
  assert.ok(header >= 0 && portfolio > header && kpis > portfolio);
  assert.ok(archive >= 0 && archiveKpis > archive);
  assert.ok(tasks.indexOf('data-ams-feature-slug="tasks-filters"') < tasks.indexOf('data-ams-feature-slug="tasks-table-view"'));
  assert.ok(tasks.indexOf('data-ams-feature-slug="tasks-table-view"') < tasks.indexOf('data-ams-feature-slug="tasks-kpis"'));
  assert.ok(tasks.indexOf('data-ams-feature-slug="tasks-kpis"') < tasks.indexOf('slug="tasks-team-workload"'));
  assert.match(tasks, /data-ams-feature-slug="tasks-board-view"/);
});

test('Clients surface account health after the directory and keep data gaps explicit', async () => {
  const clients = await read('src/pages/admin/AdminClients.tsx');
  assert.match(clients, /featureSlug="clients-module"/);
  const header = clients.indexOf('<AdminModuleHeader slug="clients-header"');
  const metrics = clients.indexOf('data-ams-feature-slug="clients-metrics"');
  const filters = clients.indexOf('<AdminFilterBar slug="client-directory-filters"');
  const directory = clients.indexOf('data-ams-feature-slug="clients-directory-table"');
  const directoryEnd = clients.indexOf('</section>', directory);
  assert.ok(header >= 0 && filters > header && directory > filters && directoryEnd > directory && metrics > directoryEnd);
  assert.match(clients, /Client directory unavailable/);
  assert.match(clients, /Cumulative billed value/);
  assert.match(clients, /visible to users with client-management access/);
  assert.doesNotMatch(clients, /Client or CRM access/);
});

test('Client Retainers prioritizes the agreement register before supporting summaries', async () => {
  const retainers = await read('src/pages/admin/AdminClientRetainers.tsx');
  const header = retainers.indexOf('<AdminModuleHeader');
  const filters = retainers.indexOf('slug="client-retainers-filters"');
  const directory = retainers.indexOf('data-ams-feature-slug="retainers-directory"');
  const directoryEnd = retainers.indexOf('</section>', directory);
  const metrics = retainers.indexOf('data-ams-feature-slug="retainers-kpis"');
  const summary = retainers.indexOf('data-ams-feature-slug="retainers-summary"');
  assert.ok(header >= 0 && filters > header && directory > filters && directoryEnd > directory && metrics > directoryEnd && summary > metrics);
});

test('Finance exposes one current worksheet and explicit unavailable source context', async () => {
  const finance = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  const allocationStart = finance.indexOf("case 'project-allocation': {");
  const allocationEnd = finance.indexOf("case 'team-fee':", allocationStart);
  const allocationView = finance.slice(allocationStart, allocationEnd);
  assert.ok(allocationView.indexOf('title="Project Allocation"') < allocationView.indexOf('<AdminMetricStrip'), 'The allocation register must precede its default-policy summary.');
  const invoicing = await read('src/pages/admin/AdminInvoicing.tsx');
  assert.doesNotMatch(invoicing, /replaces the retired standalone tab/i);
  assert.match(invoicing, /Review invoice tax and retainer billing alongside the related revenue records/);
  assert.ok(
    invoicing.indexOf('<FinanceMetricCard label="Total quotations"') > invoicing.indexOf('data-ams-feature-slug="finance-records-section"'),
    'quotation register should be the primary workspace before supporting pipeline metrics'
  );
  assert.ok(
    invoicing.indexOf('data-ams-feature-slug="finance-income-expenses-ledger"') < invoicing.indexOf('<FinanceMetricCard label="Expenses YTD"'),
    'income and expense ledger should precede its supporting metrics'
  );
  assert.ok(
    invoicing.indexOf('data-ams-feature-slug="finance-vendor-payments-ledger"') < invoicing.indexOf('<FinanceMetricCard label="Scheduled"'),
    'vendor payment ledger should precede its supporting metrics'
  );
  assert.match(finance, /data-ams-slug="finance-workspace-navigation"/);
  assert.match(finance, /data-ams-slug="finance-active-worksheet"/);
  assert.match(finance, /className="ams-finance-table w-full min-w-\[760px\] border-collapse text-left text-xs"/);
  assert.match(finance, /Core source errors/);
  assert.match(finance, /Values from unavailable records are not inferred/);
  assert.match(finance, /Previously loaded records remain visible where available/);
});

test('Time tracking uses the shared drawer for multi-field entry while keeping the ledger as the primary workspace', async () => {
  const timeLogs = await read('src/pages/admin/AdminTimeLogs.tsx');
  const header = timeLogs.indexOf('<AdminModuleHeader slug="time-tracking-header"');
  const drawer = timeLogs.indexOf('<Drawer', header);
  const form = timeLogs.indexOf('data-ams-feature-slug="time-tracking-create-form"', drawer);
  const ledger = timeLogs.indexOf('data-ams-feature-slug="time-tracking-ledger"');
  assert.ok(header >= 0 && drawer > header && form > drawer);
  assert.ok(ledger > form, 'ledger remains after the header and the form uses the shared drawer');
  assert.match(timeLogs, /onClick=\{\(\) => setFormOpen\(true\)\}/);
  assert.match(timeLogs, /closeOnEscape=\{!saving\}/);
  assert.match(timeLogs, /setFormOpen\(false\);\s*showStatus\('Time entry saved\.'/);
});

test('Team and Resources distinguish unavailable source data from a true zero', async () => {
  const teams = await read('src/pages/admin/AdminTeams.tsx');
  const vendors = await read('src/pages/admin/AdminVendors.tsx');
  const timeLogs = await read('src/pages/admin/AdminTimeLogs.tsx');
  assert.match(teams, /data-ams-feature-slug="team-directory-filters"/);
  assert.match(teams, /Team data unavailable/);
  assert.match(teams, /Vendor data unavailable/);
  assert.match(teams, /Vendor source unavailable\. Previously loaded records remain visible/);
  assert.match(teams, /Time log source unavailable\. Previously loaded entries remain visible/);
  assert.match(vendors, /Failed to load vendors/);
  assert.doesNotMatch(vendors, /vendors-mobile-tabs/);
  assert.match(vendors, /ariaLabel="Vendors and freelancers worksheets"/);
  assert.match(timeLogs, /Previously loaded records are kept/);
});

test('Documents puts the private register before upload and has a distinct failure state', async () => {
  const documents = await read('src/pages/admin/AdminDocuments.tsx');
  assert.match(documents, /featureSlug="documents-module"/);
  assert.ok(documents.indexOf('data-ams-slug="documents-directory"') < documents.indexOf('slug="documents-upload-dropzone"'));
  assert.match(documents, /Documents unavailable/);
  assert.match(documents, /No documents match the current filters/);
});

test('Careers jobs/applicants tabs follow compact AMS geometry and retain tab semantics', async () => {
  const careers = await read('src/pages/admin/AdminCmsCareers.tsx');
  assert.match(careers, /ams-workspace-tabs inline-flex max-w-full flex-wrap/);
  assert.match(careers, /inline-flex min-h-8 items-center gap-2 rounded-chip border px-3 text-\[11px\] font-medium/);
  assert.match(careers, /role="tablist"/);
  assert.match(careers, /aria-selected=\{activeTab === tab\.key\}/);
  assert.match(careers, /aria-controls=/);
});

test('Website CMS editorial controls use accessible actions and the canonical Careers applicant workspace', async () => {
  const cmsProjects = await read('src/pages/admin/AdminCmsProjects.tsx');
  const insights = await read('src/pages/admin/AdminCmsInsights.tsx');
  const testimonials = await read('src/pages/admin/AdminCmsTestimonials.tsx');
  const services = await read('src/pages/admin/AdminCmsServices.tsx');
  const careers = await read('src/pages/admin/AdminCmsCareers.tsx');
  assert.match(cmsProjects, /featureSlug="cms-projects-module"/);
  assert.match(insights, /ArrowUp/);
  assert.match(insights, /ArrowDown/);
  assert.match(insights, /Move block up/);
  assert.match(insights, /focus-visible:ring-2/);
  assert.match(testimonials, /<ConfirmDialog/);
  assert.doesNotMatch(testimonials, /<Modal slug="cms-testimonial-delete-modal"/);
  assert.doesNotMatch(services, /\{servicesList\.length\} offerings/);
  assert.ok(services.indexOf('slug="cms-services-filters"') < services.indexOf('{filtered.length} of {servicesList.length} services'), 'Service count stays with the filtered register instead of duplicating the header action.');
  assert.match(careers, /cms-careers-applicants/);
  assert.match(careers, /Check applicant-management access/);
  assert.doesNotMatch(careers, /CRM \/ Inbox|Applicant inbox is not available/);
  assert.match(careers, /pagedApplicants\.map\(applicant/);
});

test('Settings keeps backup and audit failure states distinct from empty history', async () => {
  const settings = await read('src/pages/admin/AdminSettings.tsx');
  assert.match(settings, /featureSlug="settings-module"/);
  assert.match(settings, /Backup status unavailable/);
  assert.match(settings, /const backupValue = backupLoadError/);
  assert.match(settings, /Security status could not be verified/);
  assert.match(settings, /Previously loaded entries remain visible/);
  assert.match(settings, /Reference matrix for finance, client management, delivery, and system access/);
  assert.match(settings, /Client records & leads/);
  assert.doesNotMatch(settings, /CRM & client leads|financial, CRM, delivery/);
  assert.match(settings, /Retry/);
});

test('shared module headers wrap actions without forcing a full-width mobile action stack', async () => {
  const primitives = await read('src/components/admin/AdminModulePrimitives.tsx');
  assert.match(primitives, /className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end"/);
  assert.doesNotMatch(primitives, /className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end"/);
});

test('shared compact actions retain adequate touch targets and visible keyboard focus', async () => {
  const css = await read('src/index.css');
  assert.match(css, /\.ams-shell :is\(\.ams-data-table,\.ams-finance-table,\.ams-client-table,\.ams-teams-table,\.ams-projects-table,\.settings-system-table,\.ams-table\) td :is\(button,a\)\[class~="h-8"\]\[class~="w-8"\]/);
  assert.match(css, /min-width:40px;\s*min-height:40px/s);
  assert.match(css, /outline:2px solid var\(--accent\)/);
});


test('Finance worksheet header explains the active view and its owning workspace', async () => {
  const finance = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  assert.match(finance, /eyebrow=\{activeGroup\.label\}/);
  assert.match(finance, /description=\{activeTab\.description \|\| "Manage revenue, expenses, cash, receivables, payables, and financial reporting in one place\."\}/);
  assert.match(finance, /data-ams-slug="finance-workspace-navigation"/);
  assert.match(finance, /ariaLabel="Finance worksheets" activeKey=\{activeTab\.key\} items=\{sheetItems\} className="w-full min-w-0 lg:flex-1" variant="primary"/);
});


test('Careers action feedback does not shift the workspace tab row', async () => {
  const careers = await read('src/pages/admin/AdminCmsCareers.tsx');
  const header = careers.indexOf('<AdminModuleHeader');
  const tabs = careers.indexOf('<div role="tablist" aria-label={isId ? "Workspace Careers"');
  const notice = careers.indexOf('{statusMessage && (', header);
  const jobsPanel = careers.indexOf("{activeTab === 'jobs' ? (", tabs);
  assert.ok(header >= 0 && tabs > header && notice > tabs && jobsPanel > notice);
});


test('CMS feedback notices follow the stable register filter controls', async () => {
  const cases = [
    ['src/pages/admin/AdminCmsProjects.tsx', 'cms-projects-filters', 'cms-projects-directory'],
    ['src/pages/admin/AdminCmsInsights.tsx', 'cms-insights-filters', 'cms-insights-directory'],
    ['src/pages/admin/AdminCmsServices.tsx', 'cms-services-filters', 'cms-services-directory'],
    ['src/pages/admin/AdminCmsTestimonials.tsx', 'cms-testimonials-filters', 'cms-testimonials-directory'],
  ] as const;
  for (const [file, filterSlug, registerSlug] of cases) {
    const source = await read(file);
    const header = source.indexOf('<AdminModuleHeader');
    const filter = source.indexOf('slug="' + filterSlug + '"');
    const notice = source.indexOf('{statusMessage && (', header);
    const register = source.indexOf('slug="' + registerSlug + '"');
    assert.ok(header >= 0 && filter > header && notice > filter && register > notice, file + ' should keep header and filters stable before transient feedback and the register');
  }
});


test('Team Directory keeps the page title free of a duplicate inline member-count badge', async () => {
  const team = await read('src/pages/admin/AdminTeams.tsx');
  assert.match(team, /title=\{currentView === 'team-directory' \? 'Team Directory' : pageCopy\[currentView\]\.title\}/);
  assert.doesNotMatch(team, /Team Directory <span className="inline-flex items-center rounded-badge border border-line bg-bg px-2 py-0\.5 text-\[10px\] font-medium text-muted">\{members\.length\} Internal Members<\/span>/);
  assert.match(team, /slug: 'team-directory-kpi-headcount'/);
});


test('CMS editor headers share the same spacing ownership', async () => {
  for (const file of [
    'src/pages/admin/AdminCmsProjects.tsx',
    'src/pages/admin/AdminCmsInsights.tsx',
    'src/pages/admin/AdminCmsServices.tsx',
    'src/pages/admin/AdminCmsTestimonials.tsx',
    'src/pages/admin/AdminCmsCareers.tsx',
  ]) {
    const source = await read(file);
    const header = source.slice(source.indexOf('<AdminModuleHeader'), source.indexOf('/>', source.indexOf('<AdminModuleHeader')) + 2);
    assert.match(header, /className="mb-0"/, file + ' should delegate vertical spacing to the page shell');
  }
});


test('Dashboard header context follows the selected Overview, Performance, or Analytics workspace', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.match(dashboard, /eyebrow=\{view === 'overview' \? 'Overview' : view === 'performance' \? 'Performance' : 'Analytics'\}/);
  assert.match(dashboard, /Monitor agency delivery, financial movement, team capacity, and operational exceptions/);
  assert.match(dashboard, /Track project delivery, task completion, overdue work, and recorded team time/);
  assert.match(dashboard, /Review invoice and expense trends, outstanding receivables, and project status for the selected period/);
});


test('Dashboard invalid workspace query values normalize to Overview', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.ok(dashboard.includes("const DASHBOARD_WORKSPACE_VIEWS = ['overview', 'performance', 'analytics'] as const"));
  assert.ok(dashboard.includes("DASHBOARD_WORKSPACE_VIEWS.includes(requestedView as DashboardWorkspaceView)"));
  assert.ok(dashboard.includes("const hasViewParameter = searchParams.has('view')"));
  assert.ok(dashboard.includes("navigate('/admin/dashboard', { replace: true })"));
});

test('Client Agreements Renewal Schedule uses canonical active contract and retainer dates', async () => {
  const contracts = await read('src/pages/admin/AdminContracts.tsx');
  const retainers = await read('src/pages/admin/AdminClientRetainers.tsx');
  assert.ok(contracts.includes("const isRenewalSchedule = searchParams.get('view') === 'renewals'"));
  assert.ok(contracts.includes("activeKey={isRenewalSchedule ? 'renewals' : 'contracts'}"));
  assert.ok(contracts.includes("to: '/admin/contracts?view=renewals'"));
  assert.ok(contracts.includes("contract.status === 'active'"));
  assert.ok(contracts.includes("client.activeRetainer === true"));
  assert.ok(contracts.includes('data-ams-feature-slug="client-renewal-schedule"'));
  assert.ok(contracts.includes('Renewal data is incomplete'));
  assert.ok(contracts.includes('does not mark contracts as expired automatically'));
  assert.ok(retainers.includes("to: '/admin/contracts?view=renewals'"));
  assert.doesNotMatch(retainers, /label: 'Renewal Schedule'.*available: false/);
});

test('Client Onboarding has a distinct header when the onboarding scope is selected', async () => {
  const clients = await read('src/pages/admin/AdminClients.tsx');
  assert.match(clients, /eyebrow=\{statusScope === 'lead' \? 'Onboarding workspace' : 'Client directory'\}/);
  assert.match(clients, /title=\{statusScope === 'lead' \? 'Client Onboarding' : 'Clients & Key Accounts'\}/);
  assert.match(clients, /Review new client accounts, confirm onboarding readiness, and continue account setup/);
  assert.match(clients, /scope === 'onboarding'/);
});


test('Contracts action feedback follows the primary register and pagination', async () => {
  const contracts = await read('src/pages/admin/AdminContracts.tsx');
  const header = contracts.indexOf("title={isRenewalSchedule ? 'Renewal Schedule' : 'Contracts & SOW'}");
  const pagination = contracts.indexOf('slug="contracts-pagination"');
  const notice = contracts.indexOf('{notice && <div role="status"');
  const metrics = contracts.indexOf('data-ams-feature-slug="contracts-overview-kpis"');
  assert.ok(header >= 0 && pagination > header && notice > pagination && metrics > notice);
});


test('Projects keep the page title clean and expose data availability in the eyebrow', async () => {
  const projects = await read('src/pages/admin/AdminProjects.tsx');
  assert.match(projects, /AdminStatusBadge tone=\{serverMode \? 'success' : loading \? 'info' : 'warning'\}/);
  assert.match(projects, /serverMode \? 'Live project data' : loading \? 'Loading project records' : 'Project data unavailable'/);
  assert.match(projects, /title=\{view === 'overview' \? 'Project Overview' : view === 'planning-delivery' \? 'Planning & Delivery' : view === 'resources' \? 'Project Resources' : view === 'all'/);
  assert.match(projects, /registryStatusView === 'planning' \? 'Planning'/);
  assert.match(projects, /registryStatusView === 'completed' \? 'Completed Projects'/);
  assert.match(projects, /data-ams-feature-slug="projects-kpis"/);
});


test('Documents header explains the active document category', async () => {
  const documents = await read('src/pages/admin/AdminDocuments.tsx');
  assert.match(documents, /title=\{activeTab === 'all' \? 'Document Library' : tabLabel\}/);
  assert.match(documents, /activeTab === 'sops'[\s\S]*Operating procedures, process guides, and internal reference documents/);
  assert.match(documents, /activeTab === 'legal'[\s\S]*Corporate records, signed agreements, and legal documentation/);
  assert.match(documents, /activeTab === 'finance'[\s\S]*Finance, invoice, accounting, and tax documents/);
  assert.match(documents, /activeTab === 'hr'[\s\S]*HR policies, personnel records, and people-operations documents/);
  assert.match(documents, /Security, infrastructure, and access-control documentation/);
});

test('Time Tracking billing and project views keep summaries tied to the selected reporting period', async () => {
  const source = await read('src/pages/admin/AdminTimeLogs.tsx');

  assert.match(source, /periodLogs = useMemo/);
  assert.match(source, /projectTimeSummary = useMemo\(\(\) => \{/);
  assert.match(source, /filteredLogs = useMemo\(\(\) => periodLogs\.filter/);
  assert.match(source, /const totalPages = Math\.max\(1, Math\.ceil\(filteredLogs\.length \/ pageSize\)\)/);
  assert.match(source, /total=\{filteredLogs\.length\}/);
  assert.match(source, /value: String\(periodLogs\.length\)/);
  assert.match(source, /No entries match this billing filter in the selected period/);
  assert.match(source, /No entries match the selected project in this period/);
});

test('Vendor Skills & Service Matrix link reuses the existing Admin-only route policy', async () => {
  const vendors = await read('src/pages/admin/AdminVendors.tsx');
  const teams = await read('src/pages/admin/AdminTeams.tsx');
  const access = await read('src/lib/amsNavigationAccess.ts');

  assert.ok(vendors.includes("canViewSkillMatrix = canAccessAmsRoute(navigationRole, '/admin/vendors', '?view=skill-matrix')"));
  assert.equal(vendors.split("to: '/admin/vendors?view=skill-matrix'").length - 1, 2);
  assert.equal(vendors.split("...(canViewSkillMatrix ? [{").length - 1, 2);
  assert.match(teams, /canAccessAmsRoute\(navigationRole, '\/admin\/vendors', '\?view=skill-matrix'\)/);
  assert.match(access, /if \(path === '\/admin\/vendors' && params\.get\('view'\) === 'skill-matrix'\) return role === 'Admin'/);
});
