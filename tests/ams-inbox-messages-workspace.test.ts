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
