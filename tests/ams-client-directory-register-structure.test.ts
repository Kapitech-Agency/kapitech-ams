import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Desktop Clients Directory aligns company identity and header cells for every normal client row', async () => {
  const source = await read('src/pages/admin/AdminClients.tsx');
  const tableStart = source.indexOf('<table className="ams-client-table');
  const tableEnd = source.indexOf('</table>', tableStart);
  assert.ok(tableStart >= 0 && tableEnd > tableStart, 'Desktop client table should be a bounded register');
  const table = source.slice(tableStart, tableEnd);
  assert.ok(table.includes('Client account'), 'Desktop register must keep the company identity column');
  const rowStart = table.indexOf("<tr key={client.id} data-ams-slug={'client-account-' + clientSlug}");
  const rowEnd = table.indexOf('</tr>', rowStart);
  assert.ok(rowStart >= 0 && rowEnd > rowStart, 'Canonical client row should be identifiable');
  const row = table.slice(rowStart, rowEnd);
  const scopeBranch = row.indexOf("{statusScope === 'lead' ? (");
  const companyIdentity = row.indexOf("{client.company || client.name || 'Client account'}");
  assert.ok(companyIdentity >= 0 && companyIdentity < scopeBranch,
    'Company name and client identity must occupy the first shared data cell, before the lead-specific columns.');
  assert.ok(row.includes("data-ams-slug={'client-service-context-register-' + clientSlug}"));
  assert.ok(row.includes('getClientServiceContext(client, language)'));
  assert.ok(table.includes('Service / Retainer'), 'Desktop directory must expose recorded service and renewal context');
  assert.ok(table.includes("Array.from({ length: statusScope === 'lead' ? 7 : 8 })"), 'Loading rows must align with each scope’s columns');
  assert.ok(table.includes("colSpan={statusScope === 'lead' ? 7 : 8}"), 'Empty states must span the active table structure');
  assert.ok(table.includes('min-w-[1100px]'), 'The expanded register must preserve usable column widths within intentional horizontal scrolling');
});

test('Desktop Clients Directory does not invent relationship owners absent from the canonical client model', async () => {
  const store = await read('src/lib/clientStore.ts');
  const source = await read('src/pages/admin/AdminClients.tsx');
  assert.match(store, /export interface AgencyClient/);
  assert.doesNotMatch(store, /relationshipOwner|accountManager|relationshipOwnerId/);
  assert.doesNotMatch(source, /fakeOwner|demoOwner|relationshipOwner/);
  assert.match(source, /getClientServiceContext\(client, language\)/);
});
