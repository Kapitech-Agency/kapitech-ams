import { readInboxPresentation } from './helpers/inboxPresentation';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('All Messages owner and channel filters are applied to the canonical filtered collection', async () => {
  const source = readInboxPresentation();
  assert.ok(source.includes("const matchesOwner = filterOwner === 'all'"));
  assert.ok(source.includes("const matchesChannel = filterChannel === 'all' || (item.type || 'inquiry') === filterChannel"));
  assert.ok(source.includes('matchesStatus && matchesPriority && matchesOwner && matchesChannel && matchesStarred && matchesUnread && matchesSearch && (isDesignPreview || matchesDate(item.createdAt))'));
  assert.ok(source.includes('slug="inbox-message-owner-filter"'));
  assert.ok(source.includes('slug="inbox-message-channel-filter"'));
  assert.ok(source.includes('owners={inboxOwnerOptions}') && source.includes('options={p.owners}'));
  assert.ok(source.includes('channels={inboxChannelOptions}') && source.includes('options={p.channels}'));
  assert.ok(source.includes("setFilterOwner('all'); setFilterChannel('all')"));
  assert.ok(source.includes('submissions.map((item) => String(item.assignedTo || \'\').trim())'));
});

test('All Messages table emphasizes source and owner while Sales Inquiries retains services and budget', async () => {
  const source = readInboxPresentation();
  const table = await read('src/components/admin/inbox/MessageWorkspace.tsx');
  assert.ok(source.includes("commercial={activeInboxTab === 'client'}"));
  assert.ok(table.includes('p.commercial ?'));
  assert.ok(table.includes('Requested services'));
  assert.ok(table.includes('Budget'));
  assert.ok(table.includes('Source'));
  assert.ok(table.includes("t('Owner', 'PIC')"));
  assert.ok(table.includes('item.source ||'));
  assert.ok(table.includes('item.assignedTo'));
  assert.ok(table.includes("t('Unassigned', 'Belum ditugaskan')"));
});

test('All Messages has explicit accessible Review and Table view controls', async () => {
const source = readInboxPresentation();
  assert.match(source, /DashboardFilterGroup ariaLabel="Message register view"/);
  assert.match(source, /value=\{p.table \? 'table' : 'split'\}/);
  assert.match(source, /onChange=\{\(value\) => p.onView\(value === 'table'\)\}/);
  assert.match(source, /next.set\('layout', 'table'\)/);
  assert.match(source, /setSearchParams\(next\)/);
});


test('Inbox opens on a source-backed Messages master-detail workspace without an Overview tab', async () => {
  const source = readInboxPresentation();
  const workspace = await read('src/components/admin/inbox/MessageWorkspace.tsx');
  const css = await read('src/components/admin/inbox/MessageWorkspace.css');
  assert.ok(source.includes("type InboxTab = 'messages' | 'client' | 'unread' | 'starred'"));
  assert.ok(source.includes(": 'messages';"), 'An unqualified Inbox route should land on All Messages.');
  assert.ok(source.includes("canonicalParams.delete('view')"), 'Legacy and unsupported views normalize to Messages.');
  assert.doesNotMatch(source, /Inbox Overview|activeInboxTab === 'overview'|viewMode === 'overview'|inbox-overview-(workspace|summary|controls)/);
  assert.ok(workspace.includes('data-ams-feature-slug="inbox-message-list"'));
  assert.ok(workspace.includes("aria-label={t('Message register', 'Daftar pesan')}"));
  assert.ok(workspace.includes('aria-pressed={selected?.id === item.id}'));
  assert.ok(source.includes('const inboxListItems = useMemo('));
  assert.ok(workspace.includes('data-ams-feature-slug="inbox-leads-directory"'), 'The canonical table view remains available.');
  assert.ok(css.includes('grid-column: span 5') && css.includes('grid-column: span 7'));
  assert.ok(workspace.includes('No matching messages'));
  assert.ok(workspace.includes('Inbox unavailable'));
  assert.doesNotMatch(source, /Follow-ups due/i, 'Do not invent due-date or SLA data.');
});

test('Inbox keeps bulk actions and export in one shared toolbar without Overview duplicates', async () => {
const source = readInboxPresentation();
  assert.match(source, /data-ams-slug="inbox-message-controls"/);
  assert.match(source, /data-ams-feature-slug="inbox-message-actions"/);
  const header = source.slice(source.indexOf('<AdminModuleHeader slug="inbox-header"'), source.indexOf('<InboxMessageNavigation'));
  assert.doesNotMatch(header, /handleExportCSV|handleMarkAllRead/);
  assert.equal((source.match(/onExport=\{handleExportCSV\}/g) || []).length, 1);
  assert.equal((source.match(/onProcess=\{handleMarkAllRead\}/g) || []).length, 1);
  assert.match(source, /p.onExport\(\)/);
  assert.doesNotMatch(source, /activeInboxTab === 'overview'|viewMode === 'overview'/);
});
