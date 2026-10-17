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
  const slice = (start: string, end: string) => {
    const startIndex = css.indexOf(start);
    const endIndex = css.indexOf(end, startIndex + start.length);
    assert.ok(startIndex >= 0, 'missing CSS section: ' + start);
    assert.ok(endIndex > startIndex, 'missing CSS section boundary: ' + end);
    return css.slice(startIndex, endIndex);
  };

  const sharedActions = slice('.ams-shell table .ams-table-actions>button', '.ams-shell .ams-finance-table{');
  const projects = slice('.ams-shell .ams-projects-table{', '.ams-shell .ams-finance-table{');
  const teams = slice('.ams-shell .ams-teams-table{', '/* Settings / System & Security table treatment */');
  const settings = slice('/* Settings / System & Security table treatment */', '/* AMS DRAWER SYSTEM: canonical geometry');

  for (const [name, source] of [
    ['shared table actions', sharedActions],
    ['Projects table variant', projects],
    ['Team table variant', teams],
    ['Settings table variant', settings]
  ]) {
    assert.doesNotMatch(source, /!important/, name + ' must not rely on !important');
  }

  assert.match(projects, /height:\s*42px/);
  assert.match(teams, /height:\s*44px/);
  assert.match(teams, /height:\s*48px/);
  assert.match(settings, /height:\s*44px/);
  assert.match(settings, /height:\s*48px/);
});

// Print-specific !important rules remain outside these screen-layout variants by design.
