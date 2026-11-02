import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('Desktop Clients Directory aligns company identity and header cells for every normal client row', async () => {
  const source = await read('src/components/admin/clients/ClientDirectoryRegister.tsx');
  const table = source.slice(source.indexOf('<table'), source.indexOf('</table>'));
  assert.ok(table.includes('Client account'));
  assert.ok(table.includes('scope="row"'));
  assert.ok(table.includes('{identity(client)}'));
  assert.ok(table.includes('Service / renewal'));
  assert.ok(table.includes('{context(client)}'));
  assert.ok(source.includes('p.serviceContext(client)'));
  assert.ok(table.includes('min-w-[900px]'));
  assert.ok(source.includes('p.loading ?'));
  assert.ok(source.includes('p.unavailable || !p.records.length ? <DashboardEmptyState'));
  assert.ok(source.includes('tabIndex={0} role="region"'));

});

test('Desktop Clients Directory does not invent relationship owners absent from the canonical client model', async () => {
  const store = await read('src/lib/clientStore.ts');
  const source = await read('src/pages/admin/AdminClients.tsx');
  assert.match(store, /export interface AgencyClient/);
  assert.doesNotMatch(store, /relationshipOwner|accountManager|relationshipOwnerId/);
  assert.doesNotMatch(source, /fakeOwner|demoOwner|relationshipOwner/);
  assert.match(source, /getClientServiceContext\(client, language\)/);
});
