import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { buildSync } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getInboxDesignPreview, type InboxCategory } from '../src/components/admin/inbox/inboxPresentation';

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

test('all four Inbox category routes render navigable distinct design views and exclusive active states', () => {
  const cases: Array<[InboxCategory, string, string]> = [
    ['messages', 'All Messages', 'Brand identity &amp; digital launch'],
    ['client', 'Sales Inquiries', 'Customer portal &amp; API integration'],
    ['client-requests', 'Client Requests', 'Feedback on campaign key visuals'],
    ['project-support', 'Project &amp; Support', 'Checkout issue on a narrow viewport'],
  ];
  for (const [view, label, subject] of cases) {
    const html = renderPage('/admin/inbox?view=' + view + '&preview=1');
    const tabs = navigation(html, 'Message categories');
    assert.equal((tabs.match(/<a\b/g) || []).length, 4);
    assert.equal((tabs.match(/aria-current="page"/g) || []).length, 1);
    assert.ok(tabs.includes(label));
    assert.ok(html.includes(subject));
    assert.match(html, /data-ams-slug="inbox-design-preview-notice"/);
    assert.match(html, /Sample messages for reviewing the layout. No changes are saved./);
    if (view === 'client-requests' || view === 'project-support') assert.doesNotMatch(html, /Brand identity &amp; digital launch/);
  }
});

test('unsupported data sources show a preview entry rather than fictional production counts or records', () => {
  for (const view of ['client-requests', 'project-support']) {
    const html = renderPage('/admin/inbox?view=' + view);
    assert.match(html, /Preview this workspace/);
    assert.doesNotMatch(html, /data-message-id="ams-ui-preview-/);
    assert.doesNotMatch(html, /class="ams-message-count"/);
    assert.doesNotMatch(html, /No changes are saved./);
  }
});

test('saved views compose with their category instead of selecting every same-path navigation link', () => {
  const html = renderPage('/admin/inbox?view=client-requests&saved=starred&preview=1&layout=table');
  assert.equal((navigation(html, 'Message categories').match(/aria-current="page"/g) || []).length, 1);
  assert.equal((navigation(html, 'Message saved views').match(/aria-current="page"/g) || []).length, 1);
  assert.match(html, /layout=table/);
  assert.match(html, /Scrollable message table/);
  assert.match(html, /Feedback on campaign key visuals/);
  assert.doesNotMatch(html, /Review the next content batch/);
});

test('design previews cannot expose live mutations even when passed management permissions', () => {
  const record = getInboxDesignPreview('client-requests')[0];
  const noop = () => {};
  const props = { items: [record], selected: record, language: 'en', category: 'client-requests', preview: true, loading: false, unavailable: false, sourceEmpty: false, table: false, page: 1, pageSize: 10, onPage: noop, onPageSize: noop, onSelect: noop, onBack: noop, onReset: noop, onRetry: noop, onStar: noop, canManage: true, canConvert: true, converting: false, onConvert: noop, onDelete: noop, onTemplates: noop, note: '', onNote: noop, savingNote: false, onSaveNote: noop, statusControl: 'New', priorityControl: 'High', ownerControl: 'Sample owner' };
  const html = renderToStaticMarkup(element(MemoryRouter, null, element(MessageWorkspace, props)));
  assert.doesNotMatch(html, /Convert to client|Delete message|href="mailto:|href="tel:/);
  assert.match(html, /<textarea[^>]*disabled/);
  assert.match(html, /class="ams-message-star is-saved" disabled/);
  assert.match(html, /Sample content · No changes saved/);
  assert.match(html, /Preview a response/);
  const templates = renderWithStorage(element(LanguageProvider, null, element(CannedResponsesModal, { isOpen: true, onClose: noop, submission: record, preview: true })));
  assert.doesNotMatch(templates, /href="mailto:|href="https:\/\/wa.me/);
  assert.match(templates, /Sending is disabled/);
  assert.match(templates, /disabled[^>]*[^]*?Email/);
});
