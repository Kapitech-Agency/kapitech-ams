import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('reconciliation includes audit-chain and private-document integrity gates', async () => {
  const source = await fs.readFile(path.join(root, 'scripts/postgres-reconcile.ts'), 'utf8');

  assert.match(source, /verifyAuditLogChain/);
  assert.match(source, /verifyPrivateDocuments/);
  assert.match(source, /auditChainIntegrity: auditChain\.valid/);
  assert.match(source, /privateDocumentIntegrity: privateDocuments\.valid/);
  assert.match(source, /KAPITECH_PRIVATE_DOCUMENT_DIR/);
  assert.match(source, /storageKey/);
});

test('audit-chain verification starts from GENESIS and validates stored hashes', async () => {
  const source = await fs.readFile(path.join(root, 'scripts/postgres-reconcile.ts'), 'utf8');

  assert.match(source, /let previousHash = 'GENESIS'/);
  assert.match(source, /log\.hash !== expectedHash/);
  assert.match(source, /brokenAt/);
});
