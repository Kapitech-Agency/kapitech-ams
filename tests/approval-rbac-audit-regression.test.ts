import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('CRM, Proposal, and Approval routes are retired while protected APIs remain compatible', async () => {
  const app = await fs.readFile(path.join(root, 'src/App.tsx'), 'utf8');
  assert.ok(app.includes('<Route path="crm" element={<Navigate to="/admin/clients/all-clients" replace />} />'));
  assert.ok(app.includes('<Route path="clients/lead-accounts" element={<Navigate to="/admin/clients/all-clients" replace />} />'));
  assert.ok(app.includes('<Route path="proposals" element={<LegacyQuotationRedirect />} />'));
  assert.ok(app.includes('<Route path="finance/quotations" element={<ModuleRoute moduleKey="invoicing" moduleLabel="quotations"><AdminInvoicing embeddedView="quotations" /></ModuleRoute>} />'));
  assert.ok(app.includes("pathname: '/admin/finance/quotations', search: location.search, hash: location.hash"));
  assert.ok(app.includes('<Route path="approvals" element={<ModuleRoute moduleKey="approvals" moduleLabel="legacy approvals"><AmsNavigationPlaceholder kind="deprecated-approvals" /></ModuleRoute>} />'));
  assert.ok(!app.includes("const AdminApprovals = lazyWithRetry("));
  assert.equal(app.includes('<Route path="crm" element={<ModuleRoute moduleKey="crm"'), false);
  assert.equal(app.includes('<Route path="proposals" element={<ModuleRoute moduleKey="proposals"'), false);
});
test('PostgreSQL proposal mutations and approval creation retain audit logging', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  for (const action of [
    'PROPOSAL_UPDATED',
    'PROPOSAL_APPROVED',
    'PROPOSAL_CONVERTED_TO_INVOICE',
    'PROPOSAL_DELETED',
    'APPROVAL_CREATED'
  ]) {
    assert.ok(source.includes(action), `Missing audit action: ${action}`);
  }
});

test('Proposal approval status guard allows only the server approval permission or Master', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  assert.ok(source.includes("['Approved', 'Rejected'].includes(String(patch.status))"));
  assert.ok(source.includes("!Boolean(req.user!.permissions?.canApproveBudgets)"));
  assert.ok(source.includes("req.user!.stakeholderType !== 'Master'"));
});


test('Mutation audit logging is consistent across JSON and PostgreSQL route paths', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  for (const action of [
    'CRM_DEAL_CREATED', 'CRM_DEAL_UPDATED', 'CRM_DEAL_DELETED',
    'CLIENT_CREATED', 'CLIENT_UPDATED', 'CLIENT_DELETED',
    'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED',
    'VENDOR_CREATED', 'VENDOR_UPDATED', 'VENDOR_DELETED',
    'CMS_SERVICE_CREATED', 'CMS_SERVICE_UPDATED', 'CMS_SERVICE_DELETED',
    'CMS_PROJECT_CREATED', 'CMS_PROJECT_UPDATED', 'CMS_PROJECT_DELETED',
    'CMS_TESTIMONIAL_CREATED', 'CMS_TESTIMONIAL_UPDATED', 'CMS_TESTIMONIAL_DELETED',
    'CMS_SETTINGS_UPDATED'
  ]) {
    assert.ok(source.includes(action), `Missing mutation audit action: ${action}`);
  }
});

test('Read-only admin states keep mutation UI controls behind the same permissions as the API', async () => {
  const invoicing = await fs.readFile(path.join(root, 'src/pages/admin/AdminInvoicing.tsx'), 'utf8');
  assert.ok(invoicing.includes('const canCreateInvoice = canManageInvoices;'));
  assert.ok(invoicing.includes("const canManageProposals = hasAdminPermission('canManageCrm') || canManageInvoices;"));
  assert.ok(invoicing.includes('if (!canManageInvoices || savingInvoice) return;'));
  assert.ok(invoicing.includes('if (!canManageInvoices || quotation.invoiceId || quotation.status !== \'approved\') return;'));
  assert.ok(invoicing.includes('canConvert = canManageInvoices && quotation.status === "approved" && !quotation.invoiceId'));
  assert.ok(invoicing.includes('const canCreateInvoice = canManageInvoices;'));
  assert.ok(invoicing.includes('canManageInvoices &&'));
  assert.ok(invoicing.includes('disabled={refreshing}'));

  const projects = await fs.readFile(path.join(root, 'src/pages/admin/AdminProjects.tsx'), 'utf8');
  assert.ok(projects.includes('canManageKanbanTasks'));
  assert.ok(projects.includes('draggable={canManageKanbanTasks && !movingTaskId && updatingSubtaskId === null}'));
  assert.ok(projects.includes('{canManageKanbanTasks && ('));

  const clients = await fs.readFile(path.join(root, 'src/pages/admin/AdminClients.tsx'), 'utf8');
  assert.ok(clients.includes('{canManageClients && ('));
  assert.ok(clients.includes('if (!canManageClients) return;'));

  const app = await fs.readFile(path.join(root, 'src/App.tsx'), 'utf8');
  assert.ok(app.includes('<Route path="crm" element={<Navigate to="/admin/clients/all-clients" replace />} />'));
  assert.ok(app.includes('<Route path="proposals" element={<LegacyQuotationRedirect />} />'));
  assert.ok(app.includes('<Route path="finance/quotations" element={<ModuleRoute moduleKey="invoicing" moduleLabel="quotations"><AdminInvoicing embeddedView="quotations" /></ModuleRoute>} />'));
});


test('PostgreSQL approval security failures use relational audit storage', async () => {
  const source = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');
  const start = source.indexOf("apiRouter.post('/approvals/:id/action'");
  const end = source.indexOf('  const db = getDatabase();', start);
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);
  assert.ok(block.includes("await writeAuditLog(makeAuditEntry(req, 'APPROVAL_SELF_ACTION_BLOCKED'"));
  assert.equal(block.includes("recordAuditLog({ action: 'APPROVAL_SELF_ACTION_BLOCKED'"), false);
  assert.ok(block.includes("await writeAuditLog(makeAuditEntry("));
});

test('Approval is absent from primary navigation while active approval notifications remain compatible', async () => {
  const app = await fs.readFile(path.join(root, 'src/App.tsx'), 'utf8');
  const navigation = await fs.readFile(path.join(root, 'src/lib/amsNavigationAccess.ts'), 'utf8');
  const contextualNavigation = await fs.readFile(path.join(root, 'src/lib/amsModuleSubnavigation.ts'), 'utf8');
  const server = await fs.readFile(path.join(root, 'server/routes.ts'), 'utf8');

  assert.ok(app.includes('<Route path="approvals" element={<ModuleRoute moduleKey="approvals" moduleLabel="legacy approvals"><AmsNavigationPlaceholder kind="deprecated-approvals" /></ModuleRoute>} />'));
  assert.doesNotMatch(navigation, /label:\s*['"]Approvals['"]/);
  assert.doesNotMatch(navigation, /key:\s*['"]approvals['"]/);
  assert.doesNotMatch(contextualNavigation, /label:\s*['"]Approvals['"]/);
  assert.ok(server.includes("apiRouter.get('/approvals'"));
  assert.ok(server.includes("apiRouter.post('/approvals'"));
  assert.ok(server.includes("apiRouter.post('/approvals/:id/action'"));
  assert.ok(server.includes("linkUrl: '/admin/approvals'"));
  assert.ok(server.includes('APPROVAL_SELF_ACTION_BLOCKED'));
});
