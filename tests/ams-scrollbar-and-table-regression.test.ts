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
  assert.match(css, /\.ams-shell \.ams-topnav-scroll::-webkit-scrollbar\{width:6px;height:6px\}/);
  assert.match(css, /\.ams-shell \.ams-kanban-scroll::-webkit-scrollbar\{width:6px;height:6px\}/);
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
  assert.match(inbox, /className="ams-table-scroll overflow-x-auto custom-scrollbar">\s*<div data-ams-feature-slug="inbox-leads-directory" data-ams-slug="inbox-leads-directory" className="min-w-0"><table/);
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


test('contextual navigation reveals a selected tab that is outside the visible strip', async () => {
  const primitives = await read('src/components/admin/AdminModulePrimitives.tsx');

  assert.match(primitives, /const navRef = React\.useRef/);
  assert.match(primitives, /const activeTabRef = React\.useRef/);
  assert.match(primitives, /ref=\{active \? activeTabRef : null\}/);
  assert.match(primitives, /tabBounds\.left < navBounds\.left \+ inset/);
  assert.match(primitives, /tabBounds\.right > navBounds\.right - inset/);
  assert.match(primitives, /nav\.scrollLeft \+= tabBounds\.right - \(navBounds\.right - inset\)/);
});

// Print-specific !important rules remain outside these screen-layout variants by design.
