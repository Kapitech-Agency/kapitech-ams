import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Document Vault mutation UI follows the server document mutation permission set', async () => {
  const ui = await fs.readFile(path.join(root, 'src/pages/admin/AdminDocuments.tsx'), 'utf8');
  const routes = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');

  assert.ok(ui.includes("hasAdminPermission('canManageProjects')"));
  assert.ok(ui.includes("hasAdminPermission('canManageCrm')"));
  assert.ok(ui.includes("hasAdminPermission('canAccessServerAndApi')"));
  assert.ok(ui.includes('const canManageDocuments ='));
  assert.ok(ui.includes('if (!canManageDocuments) return;'));

  assert.ok(routes.includes("const documentMutationMiddleware = requireAnyPermission("));
  assert.ok(routes.includes("apiRouter.post('/documents', requireAuth, documentMutationMiddleware"));
  assert.ok(routes.includes("apiRouter.put('/documents/:id/content', requireAuth, documentMutationMiddleware"));
  assert.ok(routes.includes("apiRouter.delete('/documents/:id', requireAuth, documentMutationMiddleware"));
});

test('Document upload keeps ambiguous storage writes for reconciliation instead of deleting them', async () => {
  const ui = await fs.readFile(path.join(root, 'src/pages/admin/AdminDocuments.tsx'), 'utf8');
  const start = ui.indexOf('const saveUpload = async');
  const end = ui.indexOf('const confirmDelete', start);
  assert.ok(start >= 0 && end > start, 'The document upload handler must remain discoverable.');
  const handler = ui.slice(start, end);

  assert.ok(handler.includes('let uploadAttempted = false;'));
  assert.ok(handler.indexOf('uploadAttempted = true;') < handler.indexOf('api.documents.uploadContent(createdId, uploadFile)'));
  assert.ok(handler.includes('if (uploadAttempted && createdId)'));
  assert.ok(handler.includes('The upload result could not be confirmed.'));
  assert.ok(handler.includes('const cleanup = createdId'));
  assert.ok(handler.includes('Never delete a possibly completed upload'));
});
