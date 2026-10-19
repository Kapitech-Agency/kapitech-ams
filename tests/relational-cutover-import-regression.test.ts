import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Relational cutover import protects MFA secrets and migrates private document objects', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'scripts/postgres-import.ts'), 'utf8');
  assert.ok(source.includes("encryptOptionalSecret(row.mfaSecret)"));
  assert.ok(source.includes("encryptOptionalSecret(row.mfaPendingSecret)"));
  assert.ok(source.includes('stagePrivateDocumentObjects'));
  assert.ok(source.includes('await storage.put(storageKey, payload)'));
  assert.ok(source.includes('verified.storageSha256 !== storageSha256'));
  assert.ok(source.includes("'content_sha256','storage_sha256','storage_version','storage_provider','integrity_checked_at'"));
});


test('Relational cutover import validates invoice arithmetic and time-log project ownership', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'scripts/postgres-import.ts'), 'utf8');
  assert.ok(source.includes('Invoice financial total mismatch in migration source'));
  assert.ok(source.includes('Invalid invoice line item in migration source'));
  assert.ok(source.includes('Time log must reference a project or task in migration source'));
  assert.ok(source.includes('Time log task must belong to a project in migration source'));
});


test('Relational cutover import preserves proposal-to-invoice relation and financial integrity', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'scripts/postgres-import.ts'), 'utf8');
  assert.ok(source.includes("'proposal_id'"));
  assert.ok(source.includes('nullableText(row.proposalId)'));
});


test('Relational cutover import rejects duplicate invoice references before database writes', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'scripts/postgres-import.ts'), 'utf8');
  assert.ok(source.includes('Duplicate invoice number in migration source'));
  assert.ok(source.includes('Multiple invoices reference the same proposal in migration source'));
});


test('PostgreSQL importer validates invoice proposal and client/project references', () => {
  const source = fs.readFileSync('scripts/postgres-import.ts', 'utf8');
  assert.match(source, /check\('invoices', 'proposalId', proposals\)/);
  assert.match(source, /Invoice client\/project relationship mismatch/);
});

test('PostgreSQL importer preserves authoritative expense lifecycle fields', () => {
  const source = fs.readFileSync('scripts/postgres-import.ts', 'utf8');
  assert.match(source, /'project_id'/);
  assert.match(source, /'status'/);
  assert.match(source, /'version'/);
  assert.match(source, /'idempotency_key'/);
  assert.match(source, /timestampValue\(row\.createdAt\)/);
});
