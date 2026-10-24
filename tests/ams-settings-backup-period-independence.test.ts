import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Settings System Overview backup history is independent of the business reporting period', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');
  const start = source.indexOf('data-ams-feature-slug="settings-backup-history"');
  const end = source.indexOf('</section>', start);
  assert.ok(start >= 0 && end > start, 'Recent Production Backups should remain a bounded operational section');
  const backupSection = source.slice(start, end);

  assert.doesNotMatch(source, /const periodBackups = useMemo/);
  assert.ok(backupSection.includes('Recent Production Backups'));
  assert.ok(backupSection.includes('backups.length === 0'));
  assert.ok(backupSection.includes('backups.slice(0, 8).map((backup, index) =>'));
  assert.ok(backupSection.includes('No production backup snapshots are available.'));
  assert.ok(backupSection.includes('Previously loaded entries remain visible.'));
  assert.ok(backupSection.includes('Showing the last successfully loaded backup entries.'));
  assert.doesNotMatch(backupSection, /matchesDate|reportPeriodEnabled|selected reporting period/);
});

test('Settings Audit Log retains its explicit shared reporting-period scope', async () => {
  const source = await read('src/pages/admin/AdminSettings.tsx');
  const auditStart = source.indexOf('data-ams-feature-slug="settings-audit-register"');
  const auditEnd = source.indexOf("{activeTab === 'security'", auditStart);
  assert.ok(auditStart >= 0 && auditEnd > auditStart, 'Audit Log section should remain identifiable');
  const audit = source.slice(auditStart, auditEnd);
  assert.ok(source.includes('if (!matchesDate(log.timestamp)) return false;'));
  assert.ok(audit.includes('Time scope follows the shared reporting-period selection.'));
  assert.ok(audit.includes('Search covers recorded actor, event, details and origin/IP fields.'));
});
