import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('essential AMS tab and Kanban scrollers keep a visible scrollbar affordance', async () => {
  const css = await read('src/index.css');

  assert.match(css, /\.ams-shell \.ams-topnav-scroll\{[^}]*scrollbar-width:thin/s);
  assert.match(css, /\.ams-shell \.ams-kanban-scroll\{[^}]*scrollbar-width:thin/s);
  assert.match(css, /\.ams-shell \.ams-project-kanban-board,[\s\S]*?scrollbar-width:thin/);
  assert.doesNotMatch(css, /\.ams-shell \.ams-topnav-scroll\{[^}]*scrollbar-width:\s*none/s);
  assert.doesNotMatch(css, /\.ams-shell \.ams-kanban-scroll\{[^}]*scrollbar-width:\s*none/s);
  assert.doesNotMatch(css, /\.ams-shell \.ams-project-kanban-(?:board|task-board)[^{]*\{[^}]*scrollbar-width:\s*none/s);
  assert.match(css, /\.ams-shell \.ams-topnav-scroll::-webkit-scrollbar\{width:8px;height:8px\}/);
  assert.match(css, /\.ams-shell \.ams-kanban-scroll::-webkit-scrollbar\{width:8px;height:8px\}/);
});

test('document and workspace do not reserve duplicate vertical scrollbar gutters', async () => {
  const css = await read('src/index.css');
  assert.match(css, /html\s*\{[^}]*scrollbar-gutter:\s*auto;/s);
  assert.match(css, /\.ams-shell>main\{[^}]*scrollbar-gutter:stable/s);
});

test('scrollbar thumb policy is consistent for global and local horizontal scrollers', async () => {
  const css = await read('src/index.css');

  assert.match(css, /scrollbar-color:\s*var\(--muted\) transparent/);
  assert.match(css, /\.ams-shell \.overflow-x-auto\{[^}]*scrollbar-color:var\(--muted\) transparent/s);
  assert.match(css, /\.ams-shell \.custom-scrollbar::-webkit-scrollbar-thumb\{background:var\(--muted\);border-radius:999px\}/);
  assert.match(css, /\.ams-shell \.custom-scrollbar::-webkit-scrollbar-thumb:hover\{background:var\(--text\)\}/);
});

test('reduced-motion preference disables smooth document scrolling', async () => {
  const css = await read('src/index.css');

  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*html\s*\{\s*scroll-behavior:\s*auto;/);
});

test('table geometry variants use scoped selectors rather than important overrides', async () => {
  const css = await read('src/index.css');
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const collectRules = (selector: string) =>
    rules.filter((match) => match[1].includes(selector)).map((match) => match[0]).join('\n');

  const sharedActions = collectRules('.ams-table-actions>button') + collectRules('.ams-table-action');
  const projects = collectRules('.ams-projects-table');
  const teams = collectRules('.ams-teams-table');
  const settings = collectRules('.settings-system-table');

  for (const [name, source] of [
    ['shared table actions', sharedActions],
    ['Projects table variant', projects],
    ['Team table variant', teams],
    ['Settings table variant', settings]
  ]) {
    assert.ok(source.length > 0, 'missing scoped CSS rules for ' + name);
    assert.doesNotMatch(source, /!important/, name + ' must not rely on !important');
  }

  assert.match(projects, /height:\s*42px/);
  assert.match(teams, /height:\s*44px/);
  assert.match(teams, /height:\s*48px/);
  assert.match(settings, /height:\s*44px/);
  assert.match(settings, /height:\s*48px/);
});


test('Inbox star action is keyboard-accessible and announces its current state', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');

  assert.match(inbox, /onClick=\{\(event\) => void handleToggleStar\(event, item\.id, item\.starred\)\}/);
  assert.match(inbox, /aria-pressed=\{Boolean\(item\.starred\)\}/);
  assert.match(inbox, /aria-label=\{item\.starred[\s\S]{0,260}Remove star from/);
  assert.match(inbox, /disabled=\{!canManageCrm\}/);
  assert.match(inbox, /focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed/);
  assert.doesNotMatch(inbox, /<td className="p-3 text-center" onClick=\{\(e\) => handleToggleStar/);
});

test('Inbox leaves Careers applicant review in the canonical CMS workspace', async () => {
  const inbox = await read('src/pages/admin/AdminInbox.tsx');
  const app = await read('src/App.tsx');
  const careers = await read('src/pages/admin/AdminCmsCareers.tsx');

  assert.doesNotMatch(inbox, /inbox-jobs-board|Candidate pipeline|Starred candidate work/);
  assert.doesNotMatch(inbox, /type InboxTab =[^;]*\bjobs\b/);
  assert.doesNotMatch(inbox, /activeInboxTab === 'jobs'|case 'jobs':/);
  assert.match(inbox, /\.filter\(\(item\) => item\.type !== 'career'\)/);
  assert.match(inbox, /to="\/admin\/cms\/careers\?tab=applicants"/);
  assert.match(app, /if \(query\.get\('view'\) === 'jobs'\)/);
  assert.match(app, /pathname: '\/admin\/cms\/careers', search: '\?tab=applicants'/);
  assert.match(careers, /pagedApplicants\.map\(applicant/);
  assert.match(inbox, /className="ams-table-scroll overflow-x-auto custom-scrollbar" tabIndex=\{0\} role="region" aria-label="Scrollable inbox inquiry register">\s*<div data-ams-feature-slug="inbox-leads-directory" data-ams-slug="inbox-leads-directory" className="min-w-0"><table/);
  assert.doesNotMatch(inbox, /data-ams-feature-slug="inbox-leads-directory"[^>]*className="overflow-x-auto"/);
});


test('login carousel respects reduced-motion by default and has a pause/resume control', async () => {
  const login = await read('src/pages/admin/AdminLogin.tsx');

  assert.match(login, /window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(login, /isArtAutoplayPaused/);
  assert.match(login, /Pause automatic image rotation/);
  assert.match(login, /Resume automatic image rotation/);
  assert.match(login, /language === 'id' \? 'Lanjutkan' : 'Resume'/);
  assert.match(login, /language === 'id' \? 'Jeda' : 'Pause'/);
  assert.match(login, /motionPreference\.removeEventListener\('change', handleMotionPreferenceChange\)/);
});


test('shared workspace tabs use compact consistent geometry and a visible selected state', async () => {
  const primitives = await read('src/components/admin/AdminModulePrimitives.tsx');
  assert.match(primitives, /inline-flex min-h-8 shrink-0 items-center rounded-chip border px-3 text-\[11px\] font-medium/);
  assert.match(primitives, /border-accent\/20 bg-accent\/10 font-semibold text-fg/);
  assert.match(primitives, /inline-flex min-h-8 shrink-0 items-center rounded-control border px-3 text-\[11px\] font-medium/);
  assert.doesNotMatch(primitives, /items-center gap-1 overflow-x-auto border-b border-line ams-topnav-scroll/);
});

test('contextual navigation reveals a selected tab that is outside the visible strip', async () => {
  const primitives = await read('src/components/admin/AdminModulePrimitives.tsx');

  assert.match(primitives, /const navRef = React\.useRef/);
  assert.match(primitives, /const activeTabRef = React\.useRef/);
  assert.match(primitives, /ref=\{active \? activeTabRef : null\}/);
  assert.match(primitives, /tabBounds\.left < navBounds\.left \+ inset/);
  assert.match(primitives, /tabBounds\.right > navBounds\.right - inset/);
  assert.match(primitives, /nav\.scrollLeft \+= tabBounds\.right - \(navBounds\.right - inset\)/);
});

test('Documents mobile row actions use usable touch targets and visible focus', async () => {
  const documents = await read('src/pages/admin/AdminDocuments.tsx');
  const start = documents.indexOf('data-ams-feature-slug="documents-mobile-list"');
  const end = documents.indexOf('data-ams-feature-slug="documents-table"', start);
  assert.ok(start >= 0 && end > start, 'missing mobile document list or desktop table boundary');
  const mobileList = documents.slice(start, end);

  assert.equal((mobileList.match(/inline-flex h-10 w-10 items-center justify-center/g) || []).length, 3);
  assert.equal((mobileList.match(/focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/g) || []).length, 3);
  assert.match(mobileList, /aria-label=\{'Preview ' \+ titleOf\(doc\)\}/);
  assert.match(mobileList, /aria-label=\{'Download ' \+ titleOf\(doc\)\}[\s\S]{0,220}disabled=\{!canDownload\}/);
  assert.match(mobileList, /canManageDocuments && <button[^>]*aria-label=\{'Delete ' \+ titleOf\(doc\)\}/);
});

test('Documents keeps the card workspace across compact laptop widths', async () => {
  const documents = await read('src/pages/admin/AdminDocuments.tsx');
  assert.ok(documents.includes('className="min-[1280px]:hidden divide-y divide-line"'));
  assert.ok(documents.includes('className="hidden min-[1280px]:block overflow-x-auto custom-scrollbar"'));
  assert.ok(documents.includes('ams-data-table min-w-[1050px]'));
});

test('Documents distinguishes an unavailable vault from a genuinely empty vault and retains last good rows', async () => {
  const documents = await read('src/pages/admin/AdminDocuments.tsx');
  const loadStart = documents.indexOf('const loadDocuments = async () =>');
  const loadEnd = documents.indexOf('  useEffect(() => {\n    void loadDocuments();', loadStart);
  assert.ok(loadStart >= 0 && loadEnd > loadStart, 'missing document loader boundary');
  const loader = documents.slice(loadStart, loadEnd);

  assert.match(loader, /let hadAccessFailure = firstError\?\.status === 401 \|\| firstError\?\.status === 403/);
  assert.match(loader, /hadAccessFailure = hadAccessFailure \|\| retryError\?\.status === 401 \|\| retryError\?\.status === 403/);
  assert.match(loader, /if \(hadAccessFailure\) \{[\s\S]{0,160}setDocuments\(\[\]\);[\s\S]{0,160}setSelectedDocument\(null\);[\s\S]{0,120}setDeleteTarget\(null\);/);
  assert.match(loader, /Retain last-known-good rows for transient service failures/);
  assert.match(documents, /isLoading && documents\.length === 0/);
  assert.match(documents, /isLoading && documents\.length > 0/);
  assert.match(documents, /loadError && documents\.length === 0/);
  assert.match(documents, /data-ams-slug="documents-unavailable"/);
  assert.match(documents, /Documents unavailable/);
  assert.match(documents, /loadError && documents\.length > 0/);
  assert.match(documents, /Showing the last successfully loaded document list\./);
  assert.match(documents, /documents\.length \? 'No documents match the current filters' : 'No documents in the vault yet'/);
});

// Print-specific !important rules remain outside these screen-layout variants by design.


test('mobile topbar controls remain reachable when the viewport is narrower than the control group', async () => {
  const layout = await read('src/pages/admin/AdminLayout.tsx');
  const css = await read('src/index.css');
  assert.match(layout, /className="ams-mobile-topbar-actions flex min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain custom-scrollbar"/);
  assert.match(layout, /aria-label="Mobile workspace controls"/);
  assert.match(css, /\.ams-shell \.ams-mobile-topbar-actions\{[^}]*max-width:calc\(100vw - 176px\)[^}]*overscroll-behavior-x:contain/s);
  assert.match(css, /\.ams-shell \.ams-mobile-topbar-actions>\*\{flex-shrink:0\}/);
});

test('route navigation resets the actual AMS workspace scroller', async () => {
  const app = await read('src/App.tsx');
  assert.match(app, /document\.querySelector<HTMLElement>\('\.ams-shell > main'\)/);
  assert.match(app, /workspaceScroller\.scrollTo\(\{ top: 0, left: 0, behavior: 'auto' \}\)/);
  assert.match(app, /window\.scrollTo\(\{ top: 0, left: 0, behavior: 'auto' \}\)/);
});

test('workspace grids, feature regions, and module header actions cannot force page-level horizontal overflow', async () => {
  const css = await read('src/index.css');
  assert.match(css, /\.ams-shell \.ams-page-shell>:not\(\[hidden\]\):not\(\.fixed\)\{min-width:0;max-width:100%\}/);
  assert.match(css, /\.ams-shell \.ams-page-shell \.grid>:not\(\[hidden\]\)\{min-width:0\}/);
  assert.match(css, /\.ams-shell \.ams-page-shell \[data-ams-feature-slug\]\{min-width:0\}/);
  assert.match(css, /\.ams-shell \.ams-page-header>div:last-child\{flex:0 1 auto;max-width:100%\}/);
  assert.match(css, /\.ams-shell \.ams-workspace-navigation nav\{width:100%;min-width:0\}/);
});

test('AMS viewport has one intentional vertical scroll owner without body overflow side effects', async () => {
  const css = await read('src/index.css');
  assert.match(css, /body\s*\{[^}]*overflow-x:\s*clip;/s);
  assert.match(css, /\.ams-shell\s*\{[^}]*height:\s*100dvh;[^}]*min-height:\s*0;/s);
  assert.match(css, /\.ams-shell>main\{[^}]*min-height:0[^}]*scrollbar-gutter:stable/s);
});

test('main viewport scrollbar is stable and horizontal scroll regions show a visible focus ring', async () => {
  const css = await read('src/index.css');
  assert.match(css, /\.ams-shell>main\{[^}]*scrollbar-gutter:stable[^}]*scrollbar-width:auto/s);
  assert.match(css, /\.ams-shell \.overflow-x-auto:focus-visible\{outline:2px solid var\(--accent\);outline-offset:-2px\}/);
  assert.match(css, /\*::-webkit-scrollbar\s*\{\s*width:\s*8px;\s*height:\s*8px;/);
});

test('primary data surfaces remain named and keyboard-accessible across all nine AMS modules', async () => {
  const checks: Array<[string, RegExp, string]> = [
    ['src/components/admin/GlobalExecutiveDashboard.tsx', /data-ams-feature-slug="dashboard-delivery-desk"[\s\S]*ariaLabel="Task queue filters"[\s\S]*onChange=\{\(value\)=>setOverviewTaskFilter\(value as DashboardTaskFilter\)\}/, 'Dashboard'],
    ['src/components/admin/DashboardControls.tsx', /role="group" aria-label=\{ariaLabel\}/, 'Dashboard shared filter component'],
    ['src/pages/admin/AdminInbox.tsx', /aria-label="Scrollable inbox inquiry register"/, 'Inbox'],
    ['src/pages/admin/AdminProjects.tsx', /aria-label="Scrollable project register table"/, 'Projects'],
    ['src/components/admin/TasksWorkspace.tsx', /aria-label="Scrollable task register"/, 'Tasks'],
    ['src/pages/admin/AdminClients.tsx', /aria-label="Scrollable client directory"|aria-label=\{statusScope === 'lead' \? 'Scrollable onboarding account register' : 'Scrollable client directory'\}/, 'Clients'],
    ['src/pages/admin/AdminFinanceWorkspace.tsx', /aria-label=\{'Scrollable ' \+ title \+ ' table'\}/, 'Finance'],
    ['src/pages/admin/AdminTeams.tsx', /aria-label="Scrollable team directory table"/, 'Team & Resources'],
    ['src/pages/admin/AdminDocuments.tsx', /aria-label="Scrollable private document register"/, 'Documents'],
    ['src/pages/admin/AdminCmsProjects.tsx', /aria-label="Scrollable case study register"/, 'Website CMS'],
    ['src/pages/admin/AdminSettings.tsx', /aria-label="Scrollable system audit log"/, 'Settings']
  ];
  for (const [file, pattern, moduleName] of checks) {
    assert.match(await read(file), pattern, moduleName + ' needs a named keyboard-accessible data scroll region');
  }
});
