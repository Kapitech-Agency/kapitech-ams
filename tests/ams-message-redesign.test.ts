import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Render the actual UI component with the same icon alias as Vite, without requiring a CSS loader in Node.
const bundle = buildSync({ entryPoints: [path.join(root, 'src/components/admin/inbox/MessageWorkspace.tsx')], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', alias: { 'lucide-react': path.join(root, 'src/lib/untitled-ui-icon-bridge.tsx') }, loader: { '.css': 'empty' } });
const compiled = { exports: {} as any };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
const Workspace = compiled.exports.MessageWorkspace;
const { MemoryRouter } = createRequire(import.meta.url)('react-router-dom');
const noop = () => {};
const record = { id: 'qa-record', fullName: 'QA sender', email: 'qa@example.invalid', company: 'QA organization', message: 'Creative brief and API integration requirements.', services: ['Brand identity', 'Web development'], budget: 'Budget discussed at discovery', status: 'new', createdAt: '2026-10-31T09:00:00Z', priority: 'high' };
const defaults = { items: [record], selected: null, loading: false, unavailable: false, sourceEmpty: false, language: 'en', table: false, page: 1, pageSize: 10, onPage: noop, onPageSize: noop, onSelect: noop, onBack: noop, onReset: noop, onRetry: noop, onStar: noop, canManage: false, canConvert: false, converting: false, onConvert: noop, onDelete: noop, onTemplates: noop, note: '', onNote: noop, savingNote: false, onSaveNote: noop, statusControl: React.createElement('span', null, 'New'), priorityControl: React.createElement('span', null, 'High'), ownerControl: React.createElement('span', null, 'Unassigned') };
const render = (overrides = {}) => renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Workspace, { ...defaults, ...overrides })));

test('new Message reader keeps creative/IT brief first, followed by scope, ownership and notes', () => {
  const html = render({ selected: record });
  const order = ['message-brief-heading', 'Requested services', 'message-handling-heading', 'message-notes-heading'];
  for (let index = 1; index < order.length; index++) assert.ok(html.indexOf(order[index - 1]) < html.indexOf(order[index]));
  assert.match(html, /Brand identity/);
  assert.match(html, /Web development/);
  assert.match(html, /Budget discussed at discovery/);
  assert.match(html, /Back to messages/);
  assert.doesNotMatch(html, /Convert to client|aria-label="Delete message"|View linked client/);
});

test('source-empty, filtered-empty, unavailable and loading communicate different outcomes', () => {
  assert.match(render({ items: [], sourceEmpty: true }), /Your next conversation starts here/);
  assert.match(render({ items: [] }), /No matching messages/);
  const unavailable = render({ items: [], sourceEmpty: true, unavailable: true });
  assert.match(unavailable, /Inbox unavailable/);
  assert.doesNotMatch(unavailable, /Your next conversation starts here/);
  const loading = render({ items: [], loading: true });
  assert.match(loading, /Loading messages/);
  assert.doesNotMatch(loading, /Your next conversation starts here|No matching messages/);
});

test('selection and star controls are separate and the canonical message text is safely escaped', () => {
  const html = render({ items: [{ ...record, message: '<script>alert(1)</script>', starred: true }] });
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /aria-controls="message-workspace-reader"/);
  assert.match(html, /aria-label="Unstar QA sender"/);
  let buttonDepth = 0;
  for (const token of html.matchAll(/<\/?button\b[^>]*>/g)) {
    buttonDepth += token[0].startsWith('</') ? -1 : 1;
    assert.ok(buttonDepth >= 0 && buttonDepth <= 1, 'Selection and star buttons must never nest.');
  }
});

test('table and list show the same source record and pagination limits rendered rows', () => {
  const html = render({ table: true });
  assert.match(html, /Scrollable message table/);
  assert.match(html, /scope="col"/);
  assert.match(html, /QA sender/);
  const paged = render({ items: [record, { ...record, id: 'second', fullName: 'Second QA sender' }], pageSize: 1, page: 2 });
  assert.match(paged, /Second QA sender/);
  assert.doesNotMatch(paged, /<strong>QA sender<\/strong>/);
});

test('existing client navigation remains permission aware and pending notes cannot be submitted twice', () => {
  const selected = { ...record, convertedClientId: 'client/one' };
  assert.doesNotMatch(render({ selected }), /View linked client/);
  assert.match(render({ selected, canConvert: true }), /\/admin\/clients\?client=client%2Fone/);
  const html = render({ selected: record, canManage: true, savingNote: true, note: 'Discovery notes' });
  assert.match(html, /Saving…/);
  assert.match(html, /<textarea[^>]*disabled/);
  assert.doesNotMatch(html, /message-workspace-notes[^>]*>\s*<script>/);
});

test('desktop split and narrow-screen back flow remain scoped to the new Message UI', () => {
  const css = readFileSync(path.join(root, 'src/components/admin/inbox/MessageWorkspace.css'), 'utf8');
  assert.match(css, /@media \(min-width: 1100px\)/);
  assert.match(css, /grid-column: span 5/);
  assert.match(css, /grid-column: span 7/);
  assert.match(css, /has-selection > \.ams-message-register \{ display: none/);
  assert.match(css, /overflow-wrap: anywhere/);
  assert.doesNotMatch(css, /!important|#[\da-f]{3,8}\b/i);
});
