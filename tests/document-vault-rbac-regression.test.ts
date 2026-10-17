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

test('Document association IDs are validated against canonical client and project records', async () => {
  const routes = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  const start = routes.indexOf("apiRouter.post('/documents', requireAuth, documentMutationMiddleware");
  const end = routes.indexOf("apiRouter.put('/documents/:id/content'", start);
  assert.ok(start >= 0 && end > start, 'The document create endpoint must remain discoverable.');
  const handler = routes.slice(start, end);

  assert.ok(handler.includes("const relatedEntity = cleanText(data.relatedEntity || 'General', 200);"));
  assert.ok(handler.includes("!['General', 'Client', 'Project'].includes(relatedEntity)"));
  assert.ok(handler.includes("You do not have permission to link documents to client records."));
  assert.ok(handler.includes("You do not have permission to link documents to project records."));
  assert.ok(handler.includes("const relatedId = cleanText(data.relatedId || '', 120);"));
  assert.ok(handler.includes('postgresClientRepository.findById(relatedId)'));
  assert.ok(handler.includes('postgresProjectRepository.list()'));
  assert.ok(handler.includes("const relatedRecords = relatedEntity === 'Client' ? db.clients : db.projects;"));
  assert.ok(handler.includes("relatedRecords.some((record: any) => String(record.id) === relatedId)"));
  assert.ok(handler.includes('related record was not found or is no longer available'));
});
