import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('All Messages owner and channel filters are applied to the canonical filtered collection', async () => {
  const source = await read('src/pages/admin/AdminInbox.tsx');
  assert.ok(source.includes("const matchesOwner = filterOwner === 'all'"));
  assert.ok(source.includes("const matchesChannel = filterChannel === 'all' || (item.type || 'inquiry') === filterChannel"));
  assert.ok(source.includes('matchesStatus && matchesPriority && matchesOwner && matchesChannel && matchesStarred && matchesSearch && matchesDate(item.createdAt)'));
  assert.ok(source.includes('slug="inbox-message-owner-filter"'));
  assert.ok(source.includes('slug="inbox-message-channel-filter"'));
  assert.ok(source.includes('options={inboxOwnerOptions}'));
  assert.ok(source.includes('options={inboxChannelOptions}'));
  assert.ok(source.includes("setFilterOwner('all'); setFilterChannel('all')"));
  assert.ok(source.includes('submissions.map((item) => String(item.assignedTo || \'\').trim())'));
});

test('All Messages table emphasizes source and owner while Sales Inquiries retains services and budget', async () => {
  const source = await read('src/pages/admin/AdminInbox.tsx');
  const tableStart = source.indexOf('/* DENSE SPREADSHEET TABLE VIEW */');
  const tableEnd = source.indexOf(") : loading ?", tableStart);
  assert.ok(tableStart >= 0 && tableEnd > tableStart, 'The Inbox register must have a bounded table workspace');
  const table = source.slice(tableStart, tableEnd);
  assert.ok(table.includes("activeInboxTab === 'client' ?"), 'The table should retain a separate commercial inquiry presentation');
  assert.ok(table.includes('Requested Services'));
  assert.ok(table.includes('Budget'));
  assert.ok(table.includes('Source'));
  assert.ok(table.includes('Owner / PIC'));
  assert.ok(table.includes('item.source ||'));
  assert.ok(table.includes('item.assignedTo'));
  assert.ok(table.includes("language === 'id' ? 'Belum ditugaskan' : 'Unassigned'"));
});

test('All Messages has explicit accessible Review and Table view controls', async () => {
  const source = await read('src/pages/admin/AdminInbox.tsx');
  assert.ok(source.includes('role="group" aria-label="Message register view"'));
  assert.ok(source.includes("aria-pressed={viewMode === 'split'} onClick={() => setViewMode('split')}"));
  assert.ok(source.includes("aria-pressed={viewMode === 'table'} onClick={() => setViewMode('table')}"));
  assert.ok(source.includes("activeInboxTab === 'messages' || activeInboxTab === 'unread'"));
});


test('Inbox Overview uses source-backed summary cards and a balanced triage/recent-record workspace', async () => {
  const source = await read('src/pages/admin/AdminInbox.tsx');
  const start = source.indexOf("{viewMode === 'overview' ? (");
  const end = source.indexOf(") : viewMode === 'queue' ?", start);
  assert.ok(start >= 0 && end > start, 'Inbox Overview should have a bounded primary workspace.');
  const overview = source.slice(start, end);

  assert.ok(overview.includes('data-ams-feature-slug="inbox-overview-summary"'));
  assert.ok(overview.includes('aria-label="Inbox operational summary"'));
  assert.ok(overview.includes('triageScopeCards.map((scope)'));
  assert.ok(overview.includes('aria-pressed={triageScope === scope.key}'));
  assert.ok(source.includes("count: filteredItems.filter(isInboxActionable).length"));
  assert.ok(source.includes("count: filteredItems.filter(isInboxUnassigned).length"));
  assert.ok(source.includes("count: filteredItems.filter(isInboxHighPriority).length"));
  assert.ok(source.includes("count: filteredItems.filter((item) => !!item.starred).length"));
  assert.ok(overview.includes("scope.count + ' of ' + scope.total + ' matching inbound records'"));
  assert.ok(overview.includes('min-[1100px]:grid-cols-12'));
  assert.ok(overview.includes('min-[1100px]:col-span-7'));
  assert.ok(overview.includes('min-[1100px]:col-span-5'));
  assert.ok(overview.includes('Recent inbound'));
  assert.ok(overview.includes('recentInboundItems.map((item)'));
  assert.ok(overview.includes('Loading Inbox triage'));
  assert.ok(overview.includes('No matching records'));
  assert.ok(overview.includes('Everything matching is in the triage queue'));
  assert.ok(overview.includes('Inbox unavailable'));
  assert.equal(overview.includes('Follow-ups due'), false, 'Overview must not invent due/SLA items without a canonical follow-up source.');
});

test('Inbox Overview removes redundant toolbar actions but keeps them in the Messages workspace', async () => {
  const source = await read('src/pages/admin/AdminInbox.tsx');
  assert.ok(source.includes("metrics.newCount > 0 && activeInboxTab !== 'overview' && ("));
  assert.ok(source.includes("activeInboxTab !== 'overview' && (\n                <button type=\"button\" onClick={handleExportCSV}"));
  assert.ok(source.includes(') : null}'));
});
