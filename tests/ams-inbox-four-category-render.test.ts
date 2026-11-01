import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
export { getInboxResponseTemplates } from './src/components/admin/inbox/responseTemplates';
export { LanguageProvider } from './src/lib/LanguageContext';
export { ReportingPeriodProvider } from './src/lib/ReportingPeriodContext';
export { AdminSectionTabs, AdminTopbarTabs } from './src/components/admin/AdminModulePrimitives';`;
const output = buildSync({ stdin: { contents: entry, resolveDir: root, loader: 'ts' }, write: false, bundle: true, packages: 'external', platform: 'node', format: 'cjs', loader: { '.css': 'empty' }, alias: { 'lucide-react': path.join(root, 'src/lib/untitled-ui-icon-bridge.tsx') }, define: { 'import.meta.env.PROD': 'true' } });
new Function('require', 'module', 'exports', output.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
const { AdminInbox, MessageWorkspace, CannedResponsesModal, getInboxResponseTemplates, LanguageProvider, ReportingPeriodProvider, AdminSectionTabs, AdminTopbarTabs } = compiled.exports;
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

test('Follow-ups renders four distinct navigable views with Overview states and no fictional records', () => {
  for (const [scope, label] of [['today', 'Due Today'], ['upcoming', 'Upcoming'], ['overdue', 'Overdue'], ['completed', 'Completed']]) {
    const html = renderPage('/admin/inbox?view=follow-ups&followup=' + scope);
    const tabs = navigation(html, 'Follow-up views');
    assert.equal((tabs.match(/<a\b/g) || []).length, 4);
    assert.equal((tabs.match(/aria-current="page"/g) || []).length, 1);
    assert.match(html, new RegExp('id="inbox-follow-ups-register-title">' + label));
    assert.match(html, /data-source-status="unavailable"/);
    assert.match(html, /ams-dashboard-empty ams-dashboard-empty--compact/);
    assert.match(html, /Follow-ups are not available yet/);
    assert.match(html, /href="\/admin\/inbox\?view=messages"/);
    for (const column of ['Follow-up', 'Conversation', 'Client / contact', 'Owner / PIC', 'Due date', 'Status', 'Next action']) assert.ok(html.includes(column));
    assert.doesNotMatch(html, /Message categories|Search inbound messages|data-message-id=|ams-message-count|Design preview|No follow-ups due|Mark complete|Snooze/);
  }
});

test('Follow-ups defaults to Due Today without treating an unknown scope as real records', () => {
  for (const query of ['', '&followup=not-a-view']) {
    const html = renderPage('/admin/inbox?view=follow-ups' + query);
    assert.match(html, /id="inbox-follow-ups-register-title">Due Today/);
    assert.match(html, /Follow-ups are not available yet/);
    assert.equal((navigation(html, 'Follow-up views').match(/aria-current="page"/g) || []).length, 1);
    assert.doesNotMatch(html, /Design preview|data-message-id=/);
  }
});

test('Routing Rules is a navigable source-unavailable workspace, not a fabricated automation engine', () => {
  const html = renderPage('/admin/inbox?view=routing-templates');
  assert.equal((navigation(html, 'Routing and template sections').match(/aria-current="page"/g) || []).length, 1);
  assert.match(html, /Automatic routing is not available yet/);
  assert.match(html, /ams-dashboard-empty ams-dashboard-empty--compact/);
  assert.match(html, /section=templates/);
  assert.doesNotMatch(html, /Message categories|Search inbound messages|Enable rule|Run rule|Design preview|No active rules/);
});

test('Response Templates renders existing built-in responses and real source counts without live send actions', () => {
  const html = renderPage('/admin/inbox?view=routing-templates&section=templates&template=discovery_call');
  assert.match(html, /Existing built-in responses used in Messages/);
  assert.match(html, /4 of 4/);
  assert.match(html, /Discovery Call Invitation/);
  assert.match(html, /Built-in · Read-only/);
  assert.match(html, /\[Contact name\]/);
  assert.match(html, /Copy response/);
  assert.match(html, /Use from Messages/);
  assert.match(html, /aria-label="Search response templates"/);
  assert.match(html, /Filter templates by category/);
  assert.doesNotMatch(html, /href="mailto:|href="https:\/\/wa.me|Design preview|Save template|Updated today/);
});

test('Routing template sections and unknown template keys resolve without imaginary records', () => {
  const rules = renderPage('/admin/inbox?view=routing-templates&section=unknown');
  assert.match(rules, /Automatic routing is not available yet/);
  const library = renderPage('/admin/inbox?view=routing-templates&section=templates&template=unknown');
  assert.match(library, /Select a response template/);
  assert.doesNotMatch(library, /Response content|Copy response/);
});

test('shared built-in response content preserves the pre-extraction English and Indonesian output', () => {
  // Baselines captured from the preceding main commit's actual CannedResponsesModal generator.
  const hashes = { en: 'b86de7f6d6f883402086124b55bd3799ac60c3990039af2cfbefd5d52dbd8d74', id: '6e3e6734344a14f12a812fb23e28ecb604d05252e47babaad0ff29841e31a6e2' };
  const context = { fullName: 'Test recipient', company: 'Test company', services: ['Design', 'Engineering'] };
  for (const language of ['en', 'id'] as const) {
    const rows = getInboxResponseTemplates(language, context).map(({ icon, ...item }: any) => item);
    assert.equal(createHash('sha256').update(JSON.stringify(rows)).digest('hex'), hashes[language]);
    assert.equal(rows.length, 4);
  }
});
