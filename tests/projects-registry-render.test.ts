import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = buildSync({ entryPoints: [path.join(root, 'src/components/admin/projects/ProjectRegistryRecords.tsx')], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', alias: { 'lucide-react': path.join(root, 'src/lib/untitled-ui-icon-bridge.tsx') }, loader: { '.css': 'empty' } });
const compiled = { exports: {} as any };
const require = createRequire(import.meta.url);
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(require, compiled, compiled.exports);
const Records = compiled.exports.ProjectRegistryRecords;
const { MemoryRouter } = require('react-router-dom');
const noop = () => {};
const project = {
  id: 'qa-project', slug: 'qa-project', name: 'QA brand and storefront', clientName: 'QA contact', clientCompany: 'QA client',
  serviceCategory: 'Branding and web development', status: 'review', health: 'At Risk', teamLead: 'QA project lead',
  startDate: '2030-01-01', targetEndDate: '2030-03-01', progressPercent: 35, budget: 100,
  tasks: [{ id: 'qa-done', status: 'done' }, { id: 'qa-review', status: 'review' }],
  milestones: [{ id: 'qa-old', title: 'QA completed phase', dueDate: '2020-01-01', completed: true }, { id: 'qa-later', title: 'QA later milestone', dueDate: '2030-02-20', completed: false }, { id: 'qa-next', title: 'QA next milestone', dueDate: '2030-02-01', completed: false }],
};
const defaults = { rows: [project], available: true, loading: false, hasRecords: true, hasFilters: false, onReset: noop, getRecordedCost: () => null, formatDate: (value: string) => value, formatMoney: (value: number) => '$' + value, isOverdue: () => false, onOpen: noop, onDelivery: noop };
const render = (overrides = {}) => renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Records, { ...defaults, ...overrides })));

test('Registry exposes delivery identity, ownership, earliest open milestone and original recorded progress', () => {
  const html = render();
  for (const label of ['Project &amp; client', 'Status &amp; health', 'Owner / PIC', 'Target deadline &amp; milestone', 'Delivery &amp; budget', 'QA brand and storefront', 'QA client', 'QA project lead', 'Branding and web development']) assert.ok(html.includes(label), label);
  assert.match(html, /Next: QA next milestone/);
  assert.doesNotMatch(html, /Next: QA completed phase|Next: QA later milestone/);
  assert.match(html, /aria-valuenow="35"/);
  assert.match(html, /1\/2 tasks done/);
});

test('Unknown Finance cost is distinct from a verified zero and budget never becomes actual cost', () => {
  assert.match(render(), /Finance data unavailable/);
  const verified = render({ getRecordedCost: () => 0 });
  assert.doesNotMatch(verified, /Finance data unavailable/);
  assert.match(verified, /\$0.*\/.*\$100/);
});

test('Edit is absent in read-only presentation and only appears when the existing permission gate supplies it', () => {
  assert.doesNotMatch(render(), /aria-label="Edit project/);
  assert.match(render({ onEdit: noop }), /aria-label="Edit project QA brand and storefront"/);
  assert.match(render(), /aria-label="View project QA brand and storefront"/);
  assert.match(render(), /aria-label="Open delivery for QA brand and storefront"/);
});

test('Archived records preserve incomplete delivery evidence without inventing completion timestamps', () => {
  const html = render({ archived: true, rows: [{ ...project, status: 'completed', progressPercent: 60, figmaUrl: 'https://example.invalid/design', repositoryUrl: 'https://example.invalid/code', liveStagingUrl: 'https://example.invalid/staging' }] });
  assert.match(html, /aria-valuenow="60"/);
  assert.match(html, /Target deadlines are not completion timestamps/);
  assert.match(html, /Next: QA next milestone/);
  assert.match(html, /projects-archived-cards/);
  assert.match(html, /Saved references: Design \/ Repository \/ Staging/);
  assert.doesNotMatch(html, /<th[^>]*>Completed<\/th>|Final progress|Restore|Unarchive/);
});

test('Loading, unavailable, empty source and filtered-empty states remain distinct', () => {
  assert.match(render({ loading: true }), /Loading project registry/);
  const unavailable = render({ available: false });
  assert.match(unavailable, /Project records unavailable/);
  assert.doesNotMatch(unavailable, /QA brand and storefront|No projects have been created/);
  assert.match(render({ rows: [], hasRecords: false }), /No projects have been created yet/);
  assert.match(render({ rows: [], archived: true, hasRecords: false }), /No completed projects yet/);
  assert.match(render({ rows: [], hasFilters: true }), /No projects match this view/);
  assert.match(render({ rows: [], hasFilters: true }), /Reset filters/);
});
