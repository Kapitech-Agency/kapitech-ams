import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('Production readiness verifies private document objects, not only database metadata', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'server/routes.ts'), 'utf8');
  const storage = fs.readFileSync(path.resolve(process.cwd(), 'server/document-storage.ts'), 'utf8');

  assert.ok(source.includes('documentObjectsVerified'));
  assert.ok(source.includes('await storage.verify('));
  assert.ok(storage.includes('verify(storageKey: string, expectedSha256: string)'));
  assert.ok(storage.includes('x-amz-meta-storage-sha256'));
});


test('PostgreSQL document deletion removes metadata before external storage cleanup',()=>{
 const route=fs.readFileSync('server/routes.ts','utf8');
 const start=route.indexOf("apiRouter.delete('/documents/:id'");
 const end=route.indexOf("apiRouter.get('/system/document-vault/status",start);
 const block=route.slice(start,end);
 const dbDelete=block.indexOf('await postgresDocumentRepository.delete(');
 const storageDelete=block.indexOf('await getDocumentStorage().delete(storageKey)');
 assert.ok(dbDelete >= 0);
 assert.ok(storageDelete >= 0);
 assert.ok(dbDelete < storageDelete);
 assert.match(block,/cleanupPending/);
});
