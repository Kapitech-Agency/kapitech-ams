import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Dashboard preserves finance context and canonical responsive KPI breakpoints', async () => {
  const dashboard = await read('src/components/admin/GlobalExecutiveDashboard.tsx');
  assert.match(dashboard, /featureSlug="dashboard-module"/);
  const canonicalKpiGrid = 'className="grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1100px]:grid-cols-4"';
  assert.ok(dashboard.includes(canonicalKpiGrid), 'Dashboard KPI strips should use canonical breakpoints');
  assert.equal(dashboard.split(canonicalKpiGrid).length - 1, 1, 'the four-metric Overview strip uses canonical grid thresholds; the two-metric support strip adapts through the shared primitive');
  assert.match(dashboard, /<DashboardTrendRangePicker range=\{range\} onChange=\{setRange\} \/>/);
  assert.equal(dashboard.includes('data-ams-slug="dashboard-finance-chart-legend"'), false);
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

test('Client Directory makes the register primary and includes recorded service context instead of a KPI strip', async () => {
  const clients = await read('src/pages/admin/AdminClients.tsx');
  const header = clients.indexOf('<AdminModuleHeader slug="clients-header"');
  const metrics = clients.indexOf('data-ams-feature-slug="clients-metrics"');
  const filters = clients.indexOf('<AdminFilterBar slug="client-directory-filters"');
  const directory = clients.indexOf('data-ams-feature-slug="clients-directory-table"');
  const directoryEnd = clients.indexOf('</section>', directory);
  assert.ok(header >= 0 && filters > header && directory > filters && directoryEnd > directory);
  assert.equal(metrics, -1, 'Directory should not render a default KPI strip.');
  assert.match(clients, /const getClientServiceContext = \(client: AgencyClient, language: string\) =>/);
  assert.match(clients, /getClientServiceContext\(client, language\)/);
  assert.match(clients, /No retainer service context recorded/);
  const filterBar = clients.slice(filters, directory);
  assert.match(filterBar, /slug="clients-status-filter"/);
  assert.match(filterBar, /value=\{statusFilter\}/);
  assert.match(filterBar, /slug="clients-industry-filter"/);
  assert.match(filterBar, /value=\{industryFilter\}/);
  assert.match(filterBar, /slug="clients-location-filter"/);
  assert.match(filterBar, /value=\{locationFilter\}/);
  assert.match(filterBar, /statusScope !== 'lead' && \([\s\S]{0,450}slug="clients-status-filter"/);
  assert.match(filterBar, /statusScope !== 'lead' && \([\s\S]{0,1200}slug="clients-spend-cap-filter"/);
});


test('Client exports use one scope-aware CSV handler and preserve missing billed values', async () => {
  const clients = await read('src/pages/admin/AdminClients.tsx');
  const handlerStart = clients.indexOf('const handleExport = () => {');
  const handlerEnd = clients.indexOf('const openInteractionDrawer = () => {', handlerStart);
  assert.ok(handlerStart >= 0 && handlerEnd > handlerStart, 'The canonical client export handler must be identifiable.');
  const exportHandler = clients.slice(handlerStart, handlerEnd);

  assert.match(clients, /onClick=\{handleExport\}[\s\S]{0,120}Export Onboarding Accounts/);
  assert.match(exportHandler, /const headers = statusScope === 'lead'/);
  assert.ok(exportHandler.includes("['Client ID', 'Slug', 'Contact', 'Company', 'Email', 'Phone', 'Industry', 'Status', 'Location', 'Website']"));
  assert.ok(exportHandler.includes("'kapitech-client-onboarding-accounts.csv'"));
  assert.ok(exportHandler.includes("'kapitech-client-directory.csv'"));

  const valuesStart = exportHandler.indexOf('const values = statusScope ===');
  const rowsEnd = exportHandler.indexOf('const csv =', valuesStart);
  assert.ok(valuesStart >= 0 && rowsEnd > valuesStart);
  const valuesBlock = exportHandler.slice(valuesStart, rowsEnd);
  const onboardingValuesEnd = valuesBlock.indexOf(': [');
  assert.ok(onboardingValuesEnd > 0, 'Onboarding and Directory columns should be separate.');
  const onboardingValues = valuesBlock.slice(0, onboardingValuesEnd);
  assert.match(onboardingValues, /client\.email, client\.phone, client\.industry, client\.status, client\.location, client\.website/);
  assert.doesNotMatch(onboardingValues, /totalSpend|slaDailyAdSpendBudget|currentDailyAdSpend/);
  assert.match(valuesBlock, /typeof client\.totalSpend === 'number' && Number\.isFinite\(client\.totalSpend\) \? client\.totalSpend : ''/);
  assert.ok(exportHandler.includes('Cumulative billed value (IDR)'));
  assert.ok(exportHandler.includes("'SLA budget', 'Current daily spend'"));
  assert.ok(exportHandler.includes("client.slaDailyAdSpendBudget ?? ''"));
  assert.ok(exportHandler.includes("client.currentDailyAdSpend ?? ''"));
  assert.doesNotMatch(exportHandler, /client\.totalSpend \|\| 0/);
  assert.match(exportHandler, /\.join\('\\n'\)/);
  assert.match(exportHandler, /new Blob\(\['\\ufeff' \+ csv\]/);
  assert.match(exportHandler, /showToast\(statusScope === 'lead'/);
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
  assert.ok(dashboard.indexOf("id: 'outstanding'", primaryKpis) > primaryKpis && dashboard.indexOf("id: 'outstanding'", primaryKpis) < chart);
  assert.ok(dashboard.indexOf("id: 'utilization'", primaryKpis) > primaryKpis && dashboard.indexOf("id: 'utilization'", primaryKpis) < chart);
  for (const id of ["avg-project-value", "net-operating-profit"]) {
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

test('Inbox table labels and empty state reflect the inquiry-only workspace', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  const tableStart = inbox.indexOf('/* DENSE SPREADSHEET TABLE VIEW */');
  const tableEnd = inbox.indexOf('/* SPLIT MASTER-DETAIL VIEW', tableStart);
  assert.ok(tableStart >= 0 && tableEnd > tableStart, 'missing Inbox register view boundary');
  const table = inbox.slice(tableStart, tableEnd);

  assert.ok(table.includes("{language === 'id' ? 'Layanan Diminta' : 'Requested Services'}"));
  assert.ok(table.includes("{language === 'id' ? 'Anggaran' : 'Budget'}"));
  assert.doesNotMatch(table, /Services \/ Specialty|Layanan \/ Spesialisasi|Budget \/ Experience|Anggaran \/ Pengalaman|Value \/ Experience/);
  assert.ok(inbox.includes("'New inquiries will appear here as they arrive.'"));
  assert.equal(inbox.includes("'New inquiries and applications will appear here as they arrive.'"), false);

  // Applicant records remain excluded at the source boundary and managed in CMS Careers.
  assert.match(inbox, /\.filter\(\(item\) => item\.type !== 'career'\)/);
});

test('Inbox keeps Careers applicant presentation in the canonical CMS workspace', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  const app = await read('src/App.tsx');
  const careers = await read('src/pages/admin/AdminCmsCareers.tsx');

  assert.equal((inbox.match(/\.filter\(\(item\) => item\.type !== 'career'\)/g) || []).length, 1);
  assert.doesNotMatch(inbox, /(?:item|selectedSubmission)\.type\s*===\s*'career'|case 'career':|Job Application|resumeUrl|portfolioUrl|linkedinUrl|experienceYears|case 'screening':|case 'shortlisted':|case 'interview':|case 'hired':|case 'rejected':|case 'withdrawn':|value: 'screening'|People & Operations/);
  assert.match(inbox, /to="\/admin\/cms\/careers\?tab=applicants"/);
  assert.match(app, /pathname: '\/admin\/cms\/careers', search: '\?tab=applicants'/);
  assert.match(careers, /pagedApplicants\.map\(applicant/);
  assert.ok(inbox.includes("{ value: 'in-review', label: 'In Review' }"));
  assert.ok(inbox.includes("{ value: 'contacted', label: 'Contacted' }"));
});

test('Inbox remains an inquiry workspace and star state remains accessible', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  const app = await read('src/App.tsx');
  assert.match(inbox, /featureSlug="inbox-module"/);
  assert.match(inbox, /aria-pressed=\{Boolean\(item\.starred\)\}/);
  assert.match(inbox, /aria-pressed=\{triageScope === scope\.key\}/);
  assert.match(inbox, /loading \? 'border-info\/20 bg-info\/10 text-info' : loadError \? 'border-warning\/20 bg-warning\/10 text-warning' : 'border-success\/20 bg-success\/10 text-success'/);
  assert.match(inbox, /language === 'id' \? 'Memperbarui' : 'Refreshing'/);
  assert.match(inbox, /language === 'id' \? 'Memuat' : 'Loading'/);
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
  assert.ok(header >= 0 && filters > header && directory > filters && directoryEnd > directory);
  assert.equal(metrics, -1, 'Directory health context should come from canonical account rows, not a default KPI strip.');
  assert.match(clients, /Client directory unavailable/);
  assert.match(clients, /Cumulative billed value/);
  assert.match(clients, /visible to users with client-management access/);
  assert.doesNotMatch(clients, /Client or CRM access/);
  assert.match(clients, /clients-onboarding-source-boundary/);
  assert.match(clients, /Profile completeness does not mean onboarding has been approved/);
  assert.match(clients, /statusScope !== 'lead' && \(/);
  assert.match(clients, /aria-pressed=\{statusScope === item\.id\}/);
  assert.doesNotMatch(clients, /id: 'lead', label: 'Onboarding'/, 'Onboarding is reached through the module workspace navigation, not a duplicate Directory scope control.');
  assert.match(clients, /label: 'Onboarding accounts'/);
});

test('Client Retainers keeps the source-backed register primary and distinguishes missing usage data from zero', async () => {
  const retainers = await read('src/pages/admin/AdminClientRetainers.tsx');
  const header = retainers.indexOf('<AdminModuleHeader');
  const sourceBoundary = retainers.indexOf('data-ams-slug="retainer-time-log-reconciliation-state"');
  const filters = retainers.indexOf('slug="client-retainers-filters"');
  const directory = retainers.indexOf('data-ams-feature-slug="retainers-directory"');
  const directoryEnd = retainers.indexOf('</section>', directory);
  const metrics = retainers.indexOf('data-ams-feature-slug="retainers-kpis"');
  const secondarySummary = retainers.indexOf('data-ams-feature-slug="retainers-summary"');
  assert.ok(header >= 0 && sourceBoundary > header && filters > sourceBoundary && directory > filters && directoryEnd > directory && metrics > directoryEnd);
  assert.equal(secondarySummary, -1, 'Do not duplicate burn/health summary cards below the source-backed register.');
  assert.match(retainers, /monthlyValueRecorded: boolean/);
  assert.match(retainers, /committedHoursRecorded: boolean/);
  assert.match(retainers, /usedHoursRecorded: boolean/);
  assert.match(retainers, /const getRetainerUsage = \(item: Retainer\): number \| null =>/);
  assert.match(retainers, /usage === null/);
  assert.match(retainers, /Usage unavailable/);
  assert.match(retainers, /Remaining .* hrs/);
  assert.match(retainers, /Not recorded/);
  assert.match(retainers, /At least one active retainer has no recorded monthly value/);
  assert.match(retainers, /of .*active retainers have valid renewal dates/);
  assert.match(retainers, /Hours used currently reflect the saved Client Directory field/);
  assert.match(retainers, /api\.clients\.update\(targetClient\.id/);
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
  assert.doesNotMatch(documents, /useReportingPeriod\(\)/, 'The canonical library must not inherit an invisible global date filter.');
  assert.doesNotMatch(documents, /matchesDate\(doc\.updatedAt/, 'Document dates are shown as metadata, not an unlabelled filter.');
  assert.match(documents, /matchesTab\(doc, activeTab\)\s*&&\s*\(!q \|\| searchTextOf\(doc\)\.includes\(q\)\)/);
});

test('Careers jobs/applicants tabs follow compact AMS geometry and retain tab semantics', async () => {
  const careers = await read('src/pages/admin/AdminCmsCareers.tsx');
  assert.match(careers, /ams-workspace-tabs inline-flex max-w-full flex-wrap/);
  assert.match(careers, /inline-flex min-h-8 items-center gap-2 rounded-chip border px-3 text-\[11px\] font-medium/);
  assert.match(careers, /role="tablist"/);
  assert.match(careers, /aria-selected=\{activeTab === tab\.key\}/);
  assert.match(careers, /aria-controls=/);
});

test('Case Study publish feedback confirms saved CMS state, not unverified live visibility', async () => {
  const projects = await read('src/pages/admin/AdminCmsProjects.tsx');
  assert.match(projects, /CMS status saved as Published\. Verify the public \/work page to confirm visibility\./);
  assert.match(projects, /CMS status saved as Draft\. Verify the public \/work page to confirm visibility changes\./);
  assert.doesNotMatch(projects, /Case study published successfully to live site!|Case study published successfully\.|Case study unpublished from the public site\./,
    'A successful CMS write is not an independent check that public output is visible or hidden.');
  assert.match(projects, /api\.cms\.updateProject\(project\.id, \{ isPublished: nextPublished \}\)/);
  assert.match(projects, /payload\.isPublished/);
});

test('Testimonial publish feedback confirms saved CMS state, not unverified public visibility', async () => {
  const testimonials = await read('src/pages/admin/AdminCmsTestimonials.tsx');
  assert.match(testimonials, /CMS status saved as Published\. Verify the public Testimonials page to confirm visibility\./);
  assert.match(testimonials, /CMS status saved as Draft\. Verify the public Testimonials page to confirm visibility changes\./);
  assert.doesNotMatch(testimonials, /Testimonial published successfully to the website|Testimonial published successfully\.|Testimonial unpublished from the public site\./,
    'A successful CMS write is not an independent check that public output is visible or hidden.');
  assert.match(testimonials, /api\.cms\.updateTestimonial\(item\.id, \{ isPublished: nextPublished \}\)/);
  assert.match(testimonials, /await loadData\(\)/);
});

test('Careers publish feedback confirms saved CMS state, not unverified public visibility', async () => {
  const careers = await read('src/pages/admin/AdminCmsCareers.tsx');
  assert.match(careers, /CMS status saved as Published\. Verify the public Careers page to confirm visibility\./);
  assert.match(careers, /CMS status saved as Draft\. Verify the public Careers page to confirm visibility changes\./);
  assert.match(careers, /This job record will be deleted from the CMS\. Existing applications will be retained\. Verify the public Careers page after deletion to confirm visibility changes\./);
  assert.doesNotMatch(careers, /Job is now live on the public site\.|This opening will be removed from the public site\.|Lowongan sekarang tampil di public site\.|Lowongan akan dihapus dari public site\./,
    'A saved CMS flag or deleted CMS record is not independent verification of deployed public output.');
  assert.match(careers, /api\.cms\.updateCareer\(position\.id, \{ isPublished: !position\.isPublished \}\)/);
  assert.match(careers, /api\.cms\.deleteCareer\(target\.id\)/);
  assert.match(careers, /Existing applications will be retained/);
});

test('Insights save feedback confirms CMS publication state and keeps public visibility unverified', async () => {
  const insights = await read('src/pages/admin/AdminCmsInsights.tsx');
  assert.match(insights, /const wasPreviouslyPublished = Boolean\(editing\.id && items\.some\(item => item\.id === editing\.id && item\.status === 'published'\)\)/);
  assert.match(insights, /CMS status saved as Published\. Verify the public Insights page to confirm visibility\./);
  assert.match(insights, /CMS status saved as Draft\. Verify the public Insights page to confirm visibility changes\./);
  assert.match(insights, /Insight updated in the CMS as a draft\./);
  assert.match(insights, /Insight created as a draft in the CMS\./);
  assert.doesNotMatch(insights, /Insight published successfully to the public site|Insight is now live on the public site/,
    'A saved status is not independent verification that a public page/cache has updated.');
  assert.match(insights, /api\.cms\.updateInsight\(editing\.id, body\)/);
  assert.match(insights, /await load\(\)/);
  assert.match(insights, /https:\/\/kapitech\.id\/insights\//);
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
  assert.match(finance, /ariaLabel="Finance worksheets" activeKey=\{activeTab\.key\} items=\{sheetItems\} className="w-full min-w-0 min-\[1100px\]:flex-1" variant="primary"/);
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


test('Team Directory prioritizes the roster and separates department, project, and tracked-time context', async () => {
  const team = await read('src/pages/admin/AdminTeams.tsx');
  assert.match(team, /title=\{currentView === 'team-directory' \? 'Team Directory' : pageCopy\[currentView\]\.title\}/);
  assert.doesNotMatch(team, /Team Directory <span className="inline-flex items-center rounded-badge border border-line bg-bg px-2 py-0\.5 text-\[10px\] font-medium text-muted">\{members\.length\} Internal Members<\/span>/);

  const directoryStart = team.indexOf('data-ams-feature-slug="team-directory"');
  const directoryEnd = team.indexOf(") : currentView === 'roles-departments' ?", directoryStart);
  assert.ok(directoryStart >= 0 && directoryEnd > directoryStart, 'Team Directory should have a bounded primary workspace');
  const directory = team.slice(directoryStart, directoryEnd);
  const filters = directory.indexOf('data-ams-feature-slug="team-directory-filters"');
  const register = directory.indexOf('Scrollable team directory table');
  assert.ok(filters >= 0 && register > filters, 'Directory filters should precede the primary roster');
  assert.match(directory, /Department \/ role/);
  assert.match(directory, /Time logged this week/);
  assert.match(directory, /Role focus \/ project technologies/);
  assert.match(directory, /Project: All/);
  assert.match(directory, /of 40h baseline/);
  assert.doesNotMatch(directory, /team-directory-kpi-headcount|Engineering & tech|Product & design|Operations & delivery/,
    'Team Directory should not append heuristic category KPIs below its primary roster.');
  assert.doesNotMatch(directory, /Allocation status|Pod \/ Focus|Time tracking status/,
    'Recorded time, actual project links, and department/role must not share ambiguous labels.');
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

test('Client Renewal Schedule prioritizes a searchable deadline register and reports source gaps', async () => {
  const contracts = await read('src/pages/admin/AdminContracts.tsx');
  const start = contracts.indexOf('data-ams-feature-slug="client-renewal-schedule"');
  const end = contracts.indexOf(') : (', start);
  assert.ok(start >= 0 && end > start, 'renewal schedule branch must be identifiable');
  const renewal = contracts.slice(start, end);
  const search = renewal.indexOf('aria-label="Search renewal agreements"');
  const timingFilter = renewal.indexOf('slug="renewal-timing-filter"');
  const register = renewal.indexOf('aria-label="Renewal schedule records"');
  assert.ok(search >= 0 && timingFilter > search && register > timingFilter, 'search and timing filters must precede the primary register');
  assert.doesNotMatch(renewal, /client-renewal-schedule-kpis/, 'remove KPI cards that duplicate queue timing filters');
  assert.match(renewal, /No matching renewal records/);
  assert.match(renewal, /Refresh sources/);
  assert.match(contracts, /The current contract and retainer sources do not expose an accountable owner or next-action field/);
  assert.match(contracts, /getRenewalTimingKey/);
});

test('Client Onboarding has a distinct header when the onboarding scope is selected', async () => {
  const clients = await read('src/pages/admin/AdminClients.tsx');
  assert.match(clients, /eyebrow=\{statusScope === 'lead' \? 'Onboarding workspace' : 'Client directory'\}/);
  assert.match(clients, /title=\{statusScope === 'lead' \? 'Client Onboarding' : 'Clients & Key Accounts'\}/);
  assert.match(clients, /Review prospective client accounts and recorded profile details/);
  assert.match(clients, /Profile completeness does not mean onboarding has been approved/);
  assert.match(clients, /scope === 'onboarding'/);
});


test('Contracts action feedback follows the primary register and avoids duplicate status KPIs', async () => {
  const contracts = await read('src/pages/admin/AdminContracts.tsx');
  const header = contracts.indexOf("title={isRenewalSchedule ? 'Renewal Schedule' : 'Contracts & SOW'}");
  const pagination = contracts.indexOf('slug="contracts-pagination"');
  const notice = contracts.indexOf('{notice && <div role="status"');
  assert.ok(header >= 0 && pagination > header && notice > pagination);
  assert.equal(contracts.includes('contracts-overview-kpis'), false,
    'The register already exposes agreement status; a duplicate KPI strip is not required.');
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


test('Inbox inquiry status cards follow canonical responsive breakpoints', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  const pipeline = inbox.indexOf('data-ams-feature-slug="inbox-client-pipeline"');
  const statusGrid = inbox.indexOf('className="grid grid-cols-2 gap-2 min-[1100px]:grid-cols-4"', pipeline);
  assert.ok(pipeline >= 0 && statusGrid > pipeline,
    'The inquiry status summary should remain two columns until the canonical 1100px breakpoint.');
  assert.equal(inbox.includes('className="grid grid-cols-2 gap-2 sm:grid-cols-4"'), false,
    'The status summary must not switch to four columns at the generic 640px breakpoint.');
});


test('Projects Overview summary follows canonical responsive breakpoints', async () => {
  const projects = await read('src/pages/admin/AdminProjects.tsx');
  const overviewStart = projects.indexOf('data-ams-feature-slug="projects-overview-workspace"');
  const overviewEnd = projects.indexOf("{view === 'planning-delivery' && (", overviewStart);
  assert.ok(overviewStart >= 0 && overviewEnd > overviewStart, 'The Project Overview workspace should be identifiable');
  const overview = projects.slice(overviewStart, overviewEnd);
  assert.ok(overview.includes('className="grid gap-3 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3" data-ams-feature-slug="projects-overview-supporting-metrics" aria-label="Project delivery summary"'),
    'Three supporting project KPIs should use two columns from 600px and three from 900px.');
  assert.equal(overview.includes('sm:grid-cols-2 xl:grid-cols-4'), false,
    'Project overview KPI geometry must not depend on generic 640px and 1280px breakpoints.');
  assert.equal(overview.includes('min-[1100px]:grid-cols-4'), false,
    'The duplicate Delivery exceptions KPI is removed, so the supporting summary must not keep a four-column contract.');
});


test('Shared metric strips use canonical breakpoints and match their metric count', async () => {
  const primitives = await read('src/components/admin/AdminModulePrimitives.tsx');
  const clients = await read('src/pages/admin/AdminClients.tsx');
  const retainers = await read('src/pages/admin/AdminClientRetainers.tsx');
  assert.ok(primitives.includes("if (metricCount <= 1) return 'grid-cols-1';"));
  assert.ok(primitives.includes("if (metricCount === 2) return 'grid-cols-1 min-[600px]:grid-cols-2';"));
  assert.ok(primitives.includes("if (metricCount === 3) return 'grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3';"));
  assert.ok(primitives.includes("return 'grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1100px]:grid-cols-4';"));
  assert.ok(primitives.includes("getAdminMetricStripGridClassName(metrics.length)"));
  assert.doesNotMatch(primitives, /sm:grid-cols-2 lg:grid-cols-4/);

  assert.equal(clients.indexOf('<AdminMetricStrip slug="clients-kpis"'), -1,
    'Clients Directory must remain a register-first workspace rather than a default metric dashboard.');
  assert.match(clients, /getClientServiceContext\(client, language\)/);

  const retainerMetricStart = retainers.indexOf('<AdminMetricStrip');
  const retainerMetricEnd = retainers.indexOf('metrics={[', retainerMetricStart);
  assert.ok(retainerMetricStart >= 0 && retainerMetricEnd > retainerMetricStart);
  assert.equal(retainers.slice(retainerMetricStart, retainerMetricEnd).includes('md:grid-cols-3 lg:grid-cols-3'), false);
  const retainerMetricPropsEnd = retainers.indexOf('\n        />', retainerMetricStart);
  assert.ok(retainerMetricPropsEnd > retainerMetricEnd);
  const retainerMetrics = retainers.slice(retainerMetricStart, retainerMetricPropsEnd);
  assert.equal((retainerMetrics.match(/\{ id: '/g) || []).length, 3,
    'Retainers should expose its three meaningful metrics through the shared metric strip.');
  assert.doesNotMatch(retainers, /className="grid grid-cols-1 gap-3 text-\[11px\] text-muted min-\[600px\]:grid-cols-2 min-\[1100px\]:grid-cols-4"/,
    'Retainers must not reintroduce the removed duplicate lower summary grid.');

});

test('Vendor & Freelancers keeps the canonical directory primary and independent of the global reporting period', async () => {
  const vendors = await read('src/pages/admin/AdminVendors.tsx');
  const filters = vendors.indexOf('data-ams-feature-slug="vendor-directory-filters"');
  const registerHeader = vendors.indexOf('data-ams-feature-slug="vendor-directory-register-header"');
  const register = vendors.indexOf('data-ams-feature-slug="vendor-directory-list"');
  const pagination = vendors.indexOf('slug="vendor-directory-pagination"');

  assert.ok(filters >= 0 && registerHeader > filters && register > registerHeader && pagination > register,
    'Vendor directory should flow from filters to a named primary register and its pagination.');
  assert.match(vendors, /aria-labelledby="vendor-directory-list-title"/);
  assert.match(vendors, /aria-live="polite"/);
  assert.doesNotMatch(vendors, /vendor-kpis|vendor-snapshot|AdminMetricStrip/,
    'The supplier master directory must not put a KPI snapshot ahead of its primary work surface.');
  assert.doesNotMatch(vendors, /useReportingPeriod|matchesDate|reportPeriodValue|reportPeriodEnabled/,
    'A global reporting-period selection must not silently remove canonical vendor records.');
});


test('Inbox Overview prioritizes triage and selected-record review without duplicate monitor KPIs', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  const overviewStart = inbox.indexOf('data-ams-feature-slug="inbox-overview-workspace"');
  const overviewEnd = inbox.indexOf(") : viewMode === 'queue' ?", overviewStart);
  assert.ok(overviewStart >= 0 && overviewEnd > overviewStart, 'Inbox Overview should have a bounded workspace');
  const overview = inbox.slice(overviewStart, overviewEnd);
  const triage = overview.indexOf('Triage queue');
  const review = overview.indexOf('Record review');
  assert.ok(triage >= 0 && review > triage, 'Triage queue should lead the selected-record review panel');
  assert.doesNotMatch(overview, /Live intake monitor/);
  assert.doesNotMatch(overview, /label: 'New', value: filteredItems\.filter/);
  assert.doesNotMatch(overview, /label: 'Priority', value: filteredItems\.filter/);
  assert.doesNotMatch(overview, /label: 'Saved', value: filteredItems\.filter/);
  assert.match(overview, /No selection/);
  assert.match(overview, /Select an inbound record/);
  assert.match(inbox, /min-\[1100px\]:grid-cols-\[minmax\(0,1\.15fr\)_minmax\(360px,0\.85fr\)\]/);
  assert.doesNotMatch(overview, /lg:grid-cols-\[minmax\(0,1\.15fr\)_minmax\(360px,0\.85fr\)\]/);
});


test('Inbox All Messages exposes source-backed status and priority filters before the register', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  const controls = inbox.indexOf('slug="inbox-overview-controls"');
  const messageFilterGate = inbox.indexOf("{activeInboxTab === 'messages' && (", controls);
  const statusFilter = inbox.indexOf('slug="inbox-message-status-filter"', controls);
  const priorityFilter = inbox.indexOf('slug="inbox-message-priority-filter"', controls);
  const register = inbox.indexOf('data-ams-feature-slug="inbox-leads-directory"', controls);
  assert.ok(controls >= 0 && messageFilterGate > controls && statusFilter > messageFilterGate && priorityFilter > statusFilter && register > priorityFilter,
    'Status and priority filters belong to All Messages controls before the register.');
  assert.match(inbox, /value=\{filterStatus\}[\s\S]{0,180}options=\{inboxStatusOptions\}/);
  assert.match(inbox, /value=\{filterPriority\}[\s\S]{0,450}value: 'urgent'[\s\S]{0,120}value: 'high'/);
  assert.match(inbox, /\[activeTabItems, filterStatus, filterPriority, searchQuery, matchesDate\]/);
  assert.doesNotMatch(inbox, /activeInboxTab === 'overview' && \([\s\S]{0,180}inbox-message-status-filter/);
});


test('Inbox Overview exposes a source-backed Unassigned triage scope', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  assert.match(inbox, /type TriageScope = 'action' \| 'unassigned' \| 'priority' \| 'saved'/);
  assert.match(inbox, /key: 'unassigned' as TriageScope, label: 'Unassigned', count: filteredItems\.filter\(\(item\) => !String\(item\.assignedTo \|\| ''\)\.trim\(\)\)\.length/);
  assert.match(inbox, /triageScope === 'unassigned'[\s\S]{0,90}!String\(item\.assignedTo \|\| ''\)\.trim\(\)/);
  assert.match(inbox, /No unassigned records/);
  assert.match(inbox, /Every current record in this queue has an assigned owner/);
  assert.match(inbox, /aria-pressed=\{triageScope === scope\.key\}/);
});


test('Inbox triage reports the full matching count and avoids an inferred follow-up action', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  assert.match(inbox, /const visibleTriageItems = triageItems\.slice\(0, 8\)/);
  assert.match(inbox, /Showing \${visibleTriageItems\.length} of \${triageItems\.length} matching records/);
  assert.match(inbox, /visibleTriageItems\.map\(\(item\) =>/);
  assert.doesNotMatch(inbox, /Showing the next 8 records/);
  assert.doesNotMatch(inbox, /Next follow-up/);
  assert.match(inbox, /triageItems\.length > visibleTriageItems\.length/);
});


test('Client Onboarding keeps account scope controls separate from spend-cap filters', async () => {
  const clients = await read('src/pages/admin/AdminClients.tsx');
  const onboardingNote = clients.indexOf('data-ams-feature-slug="clients-onboarding-source-boundary"');
  const filters = clients.indexOf('<AdminFilterBar slug="client-directory-filters"');
  assert.ok(onboardingNote >= 0 && filters > onboardingNote, 'Onboarding source limits must be clear before record filters.');
  const filterBarEnd = clients.indexOf('data-ams-feature-slug="clients-directory-table"', filters);
  assert.ok(filterBarEnd > filters);
  const filterBar = clients.slice(filters, filterBarEnd);
  assert.match(filterBar, /statusScope !== 'lead' && \(/);
  assert.match(filterBar, /aria-label=\{statusScope === 'lead' \? 'Client onboarding scopes' : 'Client scopes'\}/);
  assert.match(filterBar, /id: 'lead', label: 'Onboarding accounts'/);
  assert.match(clients, /setStatusFilter\('all'\);\s*setSlaFilter\('all'\);\s*setPage\(1\);/);
  assert.match(clients, /if \(requestedScope !== statusScope\) \{[\s\S]{0,160}setSlaFilter\('all'\)/);
});


test('Client Directory exposes canonical status, industry and location filters', async () => {
  const clients = await read('src/pages/admin/AdminClients.tsx');
  const filters = clients.indexOf('<AdminFilterBar slug="client-directory-filters"');
  const directory = clients.indexOf('data-ams-feature-slug="clients-directory-table"', filters);
  const filterBar = clients.slice(filters, directory);
  assert.ok(filters >= 0 && directory > filters);
  for (const [slug, value] of [
    ['clients-status-filter', 'statusFilter'],
    ['clients-industry-filter', 'industryFilter'],
    ['clients-location-filter', 'locationFilter'],
  ]) {
    assert.ok(filterBar.includes('slug="' + slug + '"'), 'Missing directory filter ' + slug);
    assert.ok(filterBar.includes('value={' + value + '}'), 'Filter does not use existing state ' + value);
  }
  assert.match(filterBar, /industryOptions\.map\(\(industry\) => \(\{ value: industry, label: industry \}\)\)/);
  assert.match(filterBar, /locationOptions\.map\(\(location\) => \(\{ value: location, label: location \}\)\)/);
  assert.match(filterBar, /statusScope !== 'lead' && \([\s\S]{0,450}slug="clients-status-filter"/);
  assert.match(filterBar, /statusScope !== 'lead' && \([\s\S]{0,1200}slug="clients-spend-cap-filter"/);
  assert.match(clients, /\[searchQuery, statusFilter, industryFilter, locationFilter, slaFilter, statusScope, sortKey, sortDirection\]/);
});


test('Client Onboarding actions and new-record defaults follow the Lead scope', async () => {
  const clients = await read('src/pages/admin/AdminClients.tsx');
  assert.match(clients, /setClientStatus\(statusScope === 'lead' \? 'lead' : 'active'\)/);
  assert.match(clients, /anchor\.download = statusScope === 'lead' \? 'kapitech-client-onboarding-accounts\.csv' : 'kapitech-client-directory\.csv'/);
  assert.match(clients, /statusScope === 'lead' \? 'Export Onboarding Accounts' : 'Export Directory'/);
  assert.match(clients, /statusScope === 'lead' \? 'New Lead' : 'New Client'/);
  assert.match(clients, /title=\{editingClient \? 'Edit client' : statusScope === 'lead' \? 'Add lead' : 'Add client'\}/);
  assert.match(clients, /statusScope === 'lead'[\s\S]{0,120}'Add a prospective client to the Lead queue for onboarding review\.'/);
  assert.match(clients, /\{editingClient \? 'Save changes' : statusScope === 'lead' \? 'Create lead' : 'Create client'\}/);
});

test('Client profile relationship action is not duplicated inside the timeline header', async () => {
  const clients = await read('src/pages/admin/AdminClients.tsx');
  const timelineStart = clients.indexOf('data-ams-feature-slug="client-interaction-timeline"');
  const timelineEnd = clients.indexOf("{selectedClient.status === 'lead' && (", timelineStart);
  assert.ok(timelineStart >= 0 && timelineEnd > timelineStart);
  const timeline = clients.slice(timelineStart, timelineEnd);
  assert.doesNotMatch(timeline, /Log interaction<\/Button>/);
  assert.ok(clients.includes('onClick={openInteractionDrawer} icon={<Plus size={13} aria-hidden="true" />}>Log interaction</Button>'),
    'The persistent drawer footer remains the single main relationship action.');
});



test('Clients Service & Health keeps unsupported telemetry metrics and worksheets unavailable', async () => {
  const serviceHealth = await read('src/pages/admin/AdminClientSlaMonitoring.tsx');
  assert.match(serviceHealth, /title="SLA Monitoring"/);
  assert.match(serviceHealth, /Telemetry not configured/);
  assert.match(serviceHealth, /No verified SLA telemetry source/);
  assert.match(serviceHealth, /uptime, MTTR, compliance, incident history, and snapshots are unavailable/i);
  assert.match(serviceHealth, /No sample accounts or simulated performance values are shown/);
  assert.match(serviceHealth, /data-ams-slug="sla-telemetry-not-configured"/);
  assert.match(serviceHealth, /data-ams-slug="sla-monitoring-setup"/);
  assert.match(serviceHealth, /Define each service commitment/);
  assert.match(serviceHealth, /Connect a telemetry source/);
  assert.match(serviceHealth, /Verify incident and recovery timestamps/);
  assert.match(serviceHealth, /to="\/admin\/contracts"/);
  for (const worksheet of [
    /label: 'Service Issues & Feedback'.*available: false/,
    /label: 'Client Health'.*available: false/,
    /label: 'Service History'.*available: false/,
  ]) {
    assert.match(serviceHealth, worksheet, 'unsupported Service & Health worksheets must remain target-only');
  }
  assert.doesNotMatch(serviceHealth, /\b(?:99\.9|99\.|MTTR:\s*\d|\d+% uptime)\b/,
    'telemetry-dependent SLA performance must not be fabricated');
});

test('Client 360 exposes only canonically linked records behind existing permissions', async () => {
  const clients = await read('src/pages/admin/AdminClients.tsx');
  const linked = clients.indexOf('data-ams-slug="client-360-linked-records"');
  const details = clients.indexOf('<p className="text-xs text-muted">Email</p>', linked);
  assert.ok(linked >= 0 && details > linked, 'Client 360 linked records should sit before contact details.');
  const section = clients.slice(linked, details);
  assert.match(section, /data-ams-slug="client-360-projects"/);
  assert.match(section, /data-ams-slug="client-360-inbox"/);
  assert.match(section, /data-ams-slug="client-360-finance"/);
  assert.match(section, /data-ams-slug="client-360-documents"/);
  assert.match(section, /Only explicit client ID relationships are shown/);
  assert.match(section, /\/admin\/projects\?project=/);
  assert.match(section, /\/admin\/inbox\?view=client/);
  assert.match(section, /\/admin\/finance\?tab=accounts-receivable/);
  assert.match(section, /\/admin\/documents\?documents=project-client/);
  assert.match(clients, /String\(project\.clientId \|\| ''\)\.trim\(\) === clientId/);
  assert.match(clients, /String\(invoice\.clientId \|\| ''\)\.trim\(\) === clientId/);
  assert.match(clients, /String\(document\.relatedEntity \|\| ''\)\.toLowerCase\(\) === 'client'/);
  assert.match(clients, /String\(document\.relatedId \|\| ''\)\.trim\(\) === clientId/);
  assert.match(clients, /String\(lead\.convertedClientId \|\| ''\)\.trim\(\) === clientId/);
  assert.match(clients, /if \(canViewClientProjects\)/);
  assert.match(clients, /if \(canViewClientFinance\)/);
  assert.match(clients, /const canViewClientProjects = hasAdminPermission\('canManageProjects'\) \|\| hasAdminPermission\('canManageKanbanTasks'\)/);
  assert.match(clients, /const canViewClientInbox = hasAdminPermission\('canManageCrm'\)/);
  assert.match(clients, /const canViewClientDocuments = hasAdminPermission\('canManageProjects'\) \|\| hasAdminPermission\('canManageCrm'\) \|\| hasAdminPermission\('canAccessServerAndApi'\)/);
  assert.match(clients, /if \(canViewClientInbox\)/);
  assert.match(clients, /if \(canViewClientDocuments\)/);
  assert.match(clients, /state\.status === 'restricted'/);
  assert.match(clients, /state\.status === 'error'/);
  assert.match(clients, /No invoice is explicitly linked to this client\./);
  assert.doesNotMatch(section, /internalNotes|userAgent|password|sessionToken/,
    'Client 360 must not disclose Inbox internal notes or browser/session data.');
});


test('Client Onboarding uses an onboarding-specific primary register', async () => {
  const clients = await read('src/pages/admin/AdminClients.tsx');
  const filters = clients.indexOf('<AdminFilterBar slug="client-directory-filters"');
  const register = clients.indexOf("statusScope === 'lead' ? 'clients-onboarding-register' : 'clients-directory-table'");
  assert.ok(filters >= 0 && register > filters, 'The onboarding queue should follow its scope-aware filters.');
  assert.match(clients, /Search lead company, contact, email, phone or client ID/);
  assert.match(clients, /Search onboarding accounts/);
  assert.match(clients, /Onboarding Checklist'.*available: false/);
  assert.match(clients, /Required Documents'.*available: false/);
  assert.match(clients, /Kickoff Readiness'.*available: false/);
  assert.match(clients, /Profile completeness does not mean onboarding has been approved/);
  assert.match(clients, /data-ams-slug="client-onboarding-contact-context"/);
  assert.match(clients, /client\.email \|\| 'Not recorded'/);
  assert.match(clients, /client\.phone \|\| 'Not recorded'/);
  assert.match(clients, /Added \{formatDate\(client\.createdAt, language\)\}/);
  assert.match(clients, /Last updated/);
  assert.match(clients, /statusScope === 'lead' \? 'Lead account' : 'Client account'/);
  assert.match(clients, /Contact channels/);
  assert.match(clients, /Industry \/ location/);
  const rowStart = clients.indexOf("{statusScope === 'lead' ? (", clients.indexOf('<tbody'));
  const directoryRowBranch = clients.slice(rowStart, clients.indexOf("                ) : (", rowStart));
  assert.doesNotMatch(directoryRowBranch, /Billed value|Spend cap health|client\.totalSpend/,
    'The onboarding register must focus on lead contactability, not established-client financial indicators.');
  assert.match(clients, /No lead accounts yet\. Create a lead to begin onboarding review\./);
});


test('Contracts & SOWs exposes saved agreement details without simulating Contract History', async () => {
  const contracts = await read('src/pages/admin/AdminContracts.tsx');
  const register = contracts.indexOf('data-ams-feature-slug="contracts-compact-cards"');
  const desktopRegister = contracts.indexOf('<table className="w-full min-w-[980px] border-collapse text-left">');
  const detailDrawer = contracts.indexOf('slug="client-contract-detail-drawer"');
  assert.ok(register >= 0 && desktopRegister > register && detailDrawer > desktopRegister,
    'Selected agreement details should follow the canonical card and desktop registers.');
  assert.match(contracts, /onClick=\{\(\) => setSelectedContract\(contract\)\}>View details<\/Button>/);
  assert.match(contracts, /data-ams-slug="contract-current-detail"/);
  assert.equal(contracts.includes('contracts-overview-kpis'), false, 'The canonical agreement register must not be followed by duplicated status KPIs.');
  assert.match(contracts, /size="3xl"/);
  assert.match(contracts, /canManage \? \([\s\S]*Agreement scope and obligations/);
  assert.match(contracts, /Detailed scope, deliverables and payment terms are restricted to the existing contract-management permission scope/);
  assert.match(contracts, /Current agreement summary/);
  for (const field of [
    'selectedContract.clientName',
    'selectedContract.projectName',
    'selectedContract.contractValue',
    'selectedContract.startDate',
    'selectedContract.endDate',
    'selectedContract.renewalDate',
    'selectedContract.scope',
    'selectedContract.deliverables',
    'selectedContract.paymentTerms',
  ]) assert.ok(contracts.includes(field), 'Missing source-backed agreement detail field: ' + field);
  assert.match(contracts, /Open saved agreement file/);
  assert.match(contracts, /No scope text is recorded on this agreement/);
  assert.match(contracts, /No deliverable list is recorded on this agreement/);
  assert.match(contracts, /No payment terms are recorded on this agreement/);
  assert.match(contracts, /Contract History worksheet remains unavailable/);
  assert.match(contracts, /prior terms are not reconstructed from the update timestamp/);
  assert.match(contracts, /setSelectedContract\(null\)/);
  assert.doesNotMatch(contracts.slice(detailDrawer), /api\.contracts\.(create|update|transition|delete)\(/,
    'The detail drawer must not introduce a new agreement mutation path.');
});
