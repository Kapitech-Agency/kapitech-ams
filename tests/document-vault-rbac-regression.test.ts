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
