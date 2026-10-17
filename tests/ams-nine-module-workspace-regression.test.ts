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
});

test('Inbox remains an inquiry workspace and star state remains accessible', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  const app = await read('src/App.tsx');
  assert.match(inbox, /featureSlug="inbox-module"/);
  assert.match(inbox, /aria-pressed=\{Boolean\(item\.starred\)\}/);
  assert.doesNotMatch(inbox, /Candidate pipeline|Starred candidate work|inbox-jobs-board/);
  assert.match(app, /pathname: '\/admin\/cms\/careers', search: '\?tab=applicants'/);
});

test('Projects and Tasks keep registers ahead of supporting summaries', async () => {
  const projects = await read('src/pages/admin/AdminProjects.tsx');
  const tasks = await read('src/components/admin/TasksWorkspace.tsx');
  assert.match(projects, /featureSlug="projects-module"/);
  assert.ok(projects.indexOf('className="ams-projects-table') < projects.indexOf('data-ams-feature-slug="projects-kpis"'));
  assert.ok(tasks.indexOf('data-ams-feature-slug="tasks-filters"') < tasks.indexOf('data-ams-feature-slug="tasks-table-view"'));
  assert.ok(tasks.indexOf('data-ams-feature-slug="tasks-table-view"') < tasks.indexOf('data-ams-feature-slug="tasks-kpis"'));
  assert.ok(tasks.indexOf('data-ams-feature-slug="tasks-kpis"') < tasks.indexOf('slug="tasks-team-workload"'));
  assert.match(tasks, /data-ams-feature-slug="tasks-board-view"/);
});

test('Clients surface the directory before supporting metrics and keeps data gaps explicit', async () => {
  const clients = await read('src/pages/admin/AdminClients.tsx');
  assert.match(clients, /featureSlug="clients-module"/);
  assert.ok(clients.indexOf('data-ams-feature-slug="clients-directory-table"') < clients.indexOf('data-ams-feature-slug="clients-metrics"'));
  assert.match(clients, /Client directory unavailable/);
  assert.match(clients, /Cumulative billed value/);
});

test('Finance exposes one current worksheet and explicit unavailable source context', async () => {
  const finance = await read('src/pages/admin/AdminFinanceWorkspace.tsx');
  assert.match(finance, /data-ams-slug="finance-workspace-navigation"/);
  assert.match(finance, /data-ams-slug="finance-active-worksheet"/);
  assert.match(finance, /Core source errors/);
  assert.match(finance, /Values from unavailable records are not inferred/);
  assert.match(finance, /Previously loaded records remain visible where available/);
});

test('Team and Resources distinguish unavailable source data from a true zero', async () => {
  const teams = await read('src/pages/admin/AdminTeams.tsx');
  const vendors = await read('src/pages/admin/AdminVendors.tsx');
  const timeLogs = await read('src/pages/admin/AdminTimeLogs.tsx');
  assert.match(teams, /data-ams-feature-slug="team-directory-filters"/);
  assert.match(teams, /Team data unavailable/);
  assert.match(teams, /Vendor data unavailable/);
  assert.match(vendors, /Failed to load vendors/);
  assert.match(timeLogs, /Previously loaded records are kept/);
});

test('Documents puts the private register before upload and has a distinct failure state', async () => {
  const documents = await read('src/pages/admin/AdminDocuments.tsx');
  assert.match(documents, /featureSlug="documents-module"/);
  assert.ok(documents.indexOf('data-ams-slug="documents-directory"') < documents.indexOf('slug="documents-upload-dropzone"'));
  assert.match(documents, /Documents unavailable/);
  assert.match(documents, /No documents match the current filters/);
});

test('Website CMS editorial controls use accessible actions and the canonical Careers applicant workspace', async () => {
  const cmsProjects = await read('src/pages/admin/AdminCmsProjects.tsx');
  const insights = await read('src/pages/admin/AdminCmsInsights.tsx');
  const testimonials = await read('src/pages/admin/AdminCmsTestimonials.tsx');
  const careers = await read('src/pages/admin/AdminCmsCareers.tsx');
  assert.match(cmsProjects, /featureSlug="cms-projects-module"/);
  assert.match(insights, /ArrowUp/);
  assert.match(insights, /ArrowDown/);
  assert.match(insights, /Move block up/);
  assert.match(insights, /focus-visible:ring-2/);
  assert.match(testimonials, /<ConfirmDialog/);
  assert.doesNotMatch(testimonials, /<Modal slug="cms-testimonial-delete-modal"/);
  assert.match(careers, /cms-careers-applicants/);
  assert.match(careers, /pagedApplicants\.map\(applicant/);
});

test('Settings keeps backup and audit failure states distinct from empty history', async () => {
  const settings = await read('src/pages/admin/AdminSettings.tsx');
  assert.match(settings, /featureSlug="settings-module"/);
  assert.match(settings, /Backup status unavailable/);
  assert.match(settings, /Previously loaded entries remain visible/);
  assert.match(settings, /Retry/);
});

test('shared compact actions retain adequate touch targets and visible keyboard focus', async () => {
  const css = await read('src/index.css');
  assert.match(css, /\.ams-shell :is\(\.ams-data-table,\.ams-client-table,\.ams-teams-table,\.ams-projects-table,\.settings-system-table,\.ams-table\) td :is\(button,a\)\[class~="h-8"\]\[class~="w-8"\]/);
  assert.match(css, /min-width:40px;\s*min-height:40px/s);
  assert.match(css, /outline:2px solid var\(--accent\)/);
});
