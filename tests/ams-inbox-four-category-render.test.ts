import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { buildSync } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { type InboxCategory } from '../src/components/admin/inbox/inboxPresentation';

const root = process.cwd();
const compiled = { exports: {} as any };
const entry = `export { AdminInbox } from './src/pages/admin/AdminInbox';
export { MessageWorkspace } from './src/components/admin/inbox/MessageWorkspace';
export { CannedResponsesModal } from './src/components/admin/inbox/CannedResponsesModal';
export { LanguageProvider } from './src/lib/LanguageContext';
export { ReportingPeriodProvider } from './src/lib/ReportingPeriodContext';
export { AdminSectionTabs, AdminTopbarTabs } from './src/components/admin/AdminModulePrimitives';`;
const output = buildSync({ stdin: { contents: entry, resolveDir: root, loader: 'ts' }, write: false, bundle: true, packages: 'external', platform: 'node', format: 'cjs', loader: { '.css': 'empty' }, alias: { 'lucide-react': path.join(root, 'src/lib/untitled-ui-icon-bridge.tsx') }, define: { 'import.meta.env.PROD': 'true' } });
new Function('require', 'module', 'exports', output.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
const { AdminInbox, MessageWorkspace, CannedResponsesModal, LanguageProvider, ReportingPeriodProvider, AdminSectionTabs, AdminTopbarTabs } = compiled.exports;
const { MemoryRouter } = createRequire(import.meta.url)('react-router-dom');
const element = React.createElement;
const renderWithStorage = (content: React.ReactElement) => {
  const storage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
  try {
    return renderToStaticMarkup(content);
  } finally {
    if (storage) Object.defineProperty(globalThis, 'localStorage', storage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
};
const renderPage = (url: string) => renderWithStorage(element(MemoryRouter, { initialEntries: [url] }, element(LanguageProvider, null, element(ReportingPeriodProvider, null, element(AdminInbox)))));
const navigation = (html: string, name: string) => html.match(new RegExp(`<nav\\b[^>]*aria-label="${name}"[^>]*>([\\s\\S]*?)<\\/nav>`))?.[1] || '';

test('same-path query tabs expose exactly one current link in section and topbar navigation', () => {
  const items = [{ key: 'first', label: 'First view', to: '/admin/inbox?view=messages' }, { key: 'second', label: 'Second view', to: '/admin/inbox?view=client' }];
  for (const Tabs of [AdminSectionTabs, AdminTopbarTabs]) {
    const html = renderToStaticMarkup(element(MemoryRouter, { initialEntries: ['/admin/inbox?view=client'] }, element(Tabs, { items, activeKey: 'second', ariaLabel: 'Query views' })));
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
    assert.match(html, /aria-current="page"[^>]*href="\/admin\/inbox\?view=client"|href="\/admin\/inbox\?view=client"[^>]*aria-current="page"/);
    assert.doesNotMatch(html, /class="[^"]*\bactive\b/);
  }
});

test('all four Inbox categories remain navigable without a design mode or sample records', () => {
  const cases: Array<[InboxCategory, string]> = [['messages', 'All Messages'], ['client', 'Sales Inquiries'], ['client-requests', 'Client Requests'], ['project-support', 'Project &amp; Support']];
  for (const [view, label] of cases) {
    const html = renderPage('/admin/inbox?view=' + view);
    const tabs = navigation(html, 'Message categories');
    assert.equal((tabs.match(/<a\b/g) || []).length, 4);
    assert.equal((tabs.match(/aria-current="page"/g) || []).length, 1);
    assert.ok(tabs.includes(label));
    assert.doesNotMatch(html, /Design preview|Exit preview|Sample messages|ams-ui-preview-|preview=1/);
  }
});

test('unconnected categories provide an honest state and a path to real messages', () => {
  for (const view of ['client-requests', 'project-support']) {
    const html = renderPage('/admin/inbox?view=' + view);
    assert.match(html, /messages are not available here yet/);
    assert.match(html, /href="\/admin\/inbox\?view=messages"[^>]*>.*?View all messages/);
    assert.doesNotMatch(html, /data-message-id=|class="ams-message-count"|Preview this workspace|Explore the design/);
  }
});

test('saved and table views compose with the category without introducing sample data', () => {
  const html = renderPage('/admin/inbox?view=client-requests&saved=starred&layout=table');
  assert.equal((navigation(html, 'Message categories').match(/aria-current="page"/g) || []).length, 1);
  assert.equal((navigation(html, 'Message saved views').match(/aria-current="page"/g) || []).length, 1);
  assert.match(html, /saved=starred/);
  assert.match(html, /layout=table/);
  assert.doesNotMatch(html, /preview=|Sample messages|data-message-id=/);
});

test('existing source records retain real reply actions and permission-gated editing', () => {
  const record = { id: 'test-only-record', fullName: 'Test sender', email: 'test@example.invalid', message: 'Creative and engineering brief.', status: 'new', createdAt: '2026-11-01T00:00:00Z', starred: true };
  const noop = () => {};
  const props = { items: [record], selected: record, language: 'en', category: 'messages', loading: false, unavailable: false, sourceEmpty: false, table: false, page: 1, pageSize: 10, onPage: noop, onPageSize: noop, onSelect: noop, onBack: noop, onReset: noop, onRetry: noop, onStar: noop, canManage: false, canConvert: false, converting: false, onConvert: noop, onDelete: noop, onTemplates: noop, note: '', onNote: noop, savingNote: false, onSaveNote: noop, statusControl: 'New', priorityControl: 'Normal', ownerControl: 'Unassigned' };
  const html = renderToStaticMarkup(element(MemoryRouter, null, element(MessageWorkspace, props)));
  assert.match(html, /href="mailto:test@example.invalid"/);
  assert.match(html, /Reply by email|Response templates/);
  assert.match(html, /<textarea[^>]*disabled/);
  assert.match(html, /class="ams-message-star is-saved" disabled/);
  assert.doesNotMatch(html, /Convert to client|Delete message|Sample content|Preview a response/);
  const table = renderToStaticMarkup(element(MemoryRouter, null, element(MessageWorkspace, { ...props, selected: null, table: true })));
  assert.match(table, /Scrollable message table/);
  assert.match(table, /Test sender/);
  assert.match(table, /Creative and engineering brief/);
});

test('retired preview query parameters cannot activate examples or disable real actions', () => {
  for (const view of ['messages', 'client', 'client-requests', 'project-support']) {
    const html = renderPage('/admin/inbox?view=' + view + '&preview=1');
    assert.doesNotMatch(html, /Design preview|Sample messages|ams-ui-preview-|Preview this workspace/);
    assert.doesNotMatch(navigation(html, 'Message categories'), /preview=/);
  }
});
