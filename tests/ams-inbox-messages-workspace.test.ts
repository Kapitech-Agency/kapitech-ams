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


test('Inbox opens on a source-backed Messages master-detail workspace without an Overview tab', async () => {
  const source = await read('src/pages/admin/AdminInbox.tsx');
  assert.ok(source.includes("type InboxTab = 'messages' | 'client' | 'unread' | 'starred'"));
  assert.ok(source.includes(": 'messages';"), 'An unqualified Inbox route should land on All Messages.');
  assert.ok(source.includes("canonicalParams.delete('view')"), 'Legacy and unsupported views normalize to Messages.');
  assert.doesNotMatch(source, /Inbox Overview|activeInboxTab === 'overview'|viewMode === 'overview'|inbox-overview-(workspace|summary|controls)/);
  assert.ok(source.includes('data-ams-feature-slug="inbox-message-list"'));
  assert.ok(source.includes('aria-label="Inbound messages"'));
  assert.ok(source.includes('aria-pressed={isSelected}'));
  assert.ok(source.includes('const inboxListItems = useMemo('));
  assert.ok(source.includes('data-ams-feature-slug="inbox-leads-directory"'), 'The canonical table view remains available.');
  assert.ok(source.includes('min-[1100px]:col-span-5') && source.includes('min-[1100px]:col-span-7'));
  assert.ok(source.includes('No matching messages'));
  assert.ok(source.includes('Inbox unavailable'));
  assert.doesNotMatch(source, /Follow-ups due/i, 'Do not invent due-date or SLA data.');
});

test('Inbox keeps bulk actions and export in one shared toolbar without Overview duplicates', async () => {
  const source = await read('src/pages/admin/AdminInbox.tsx');
  assert.ok(source.includes("'inbox-message-controls'"));
  assert.ok(source.includes('data-ams-feature-slug="inbox-message-actions"'));
  assert.ok(source.includes('ams-inbox-filter-bar'));
  assert.doesNotMatch(source, /inbox-overview-controls|inbox-overview-workspace|activeInboxTab === 'overview'|viewMode === 'overview'/);
  const headerStart = source.indexOf('<AdminModuleHeader slug="inbox-header"');
  const headerEnd = source.indexOf('\n      />', headerStart);
  const header = source.slice(headerStart, headerEnd);
  assert.doesNotMatch(header, /handleMarkAllRead|handleExportCSV/);
  const toolbarStart = source.indexOf('data-ams-feature-slug="inbox-message-actions"');
  const toolbarEnd = source.indexOf('      {/* 4. MAIN CONTENT VIEW', toolbarStart);
  const toolbar = source.slice(toolbarStart, toolbarEnd);
  assert.equal((toolbar.match(/onClick=\{handleExportCSV\}/g) || []).length, 1);
  assert.ok(source.includes("activeInboxTab === 'messages' || activeInboxTab === 'unread'"));
});
