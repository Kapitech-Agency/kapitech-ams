import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('CRM, proposals, approvals, and Time routes use their functional workspaces', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
  assert.ok(source.includes('<Route path="crm" element={<ModuleRoute moduleKey="crm" moduleLabel="CRM"><AdminClientLeadAccounts /></ModuleRoute>} />'));
  assert.ok(source.includes('<Route path="proposals" element={<ModuleRoute moduleKey="proposals" moduleLabel="Proposals"><AdminInvoicing embeddedView="quotations" /></ModuleRoute>} />'));
  assert.ok(source.includes('<Route path="approvals" element={<ModuleRoute moduleKey="approvals" moduleLabel="Approvals"><AdminApprovals /></ModuleRoute>} />'));
  assert.ok(source.includes('<Route path="time-logs" element={<ModuleRoute moduleKey="timelogs" moduleLabel="Time"><AdminTimeLogs /></ModuleRoute>} />'));
  assert.ok(source.includes("default: m.AdminApprovals"));
});
test('Finance transaction worksheets keep mutations permission-gated and use embedded workbook workflows', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminInvoicing.tsx'), 'utf8');
  const workspace = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminFinanceWorkspace.tsx'), 'utf8');

  assert.ok(source.includes("const canManageInvoices = hasAdminPermission('canManageInvoices');"));
  assert.ok(source.includes('{canManageInvoices &&'));
  assert.ok(source.includes('const FinanceMetricCard'));
  assert.ok(source.includes('computeInvoiceTotals'));
  assert.ok(source.includes('api.finance.getMetrics(currency)'));
  assert.ok(!source.includes('123-00-998877-1'));
  assert.ok(source.includes('serverMetrics.totalInvoicesCount'));
  assert.ok(source.includes('paymentFilter'));
  assert.ok(source.includes('dueFilter'));
  assert.ok(source.includes('table-fixed'));
  assert.ok(source.includes('retainerLedgerInvoices'));
  assert.ok(source.includes('usingDemoRetainerLedger'));
  assert.ok(source.includes('openPayment(invoice)'));
  assert.ok(source.includes('finance-revenue-tax-retainer'));
  assert.ok(source.includes('Contract-linked vendor payments'));
  assert.ok(source.includes('onClick={exportInvoicesCsv}'));
  assert.ok(source.includes('onClick={exportExpensesCsv}'));
  assert.ok(source.includes('onClick={exportVendorPaymentsCsv}'));
  assert.ok(source.includes("isProposalWorkspace && <AdminModuleHeader className=\"mb-0\" title=\"Proposals\""));
  assert.ok(source.includes("const canManageProposals = hasAdminPermission('canManageCrm') || canManageInvoices;"));
  assert.ok(!source.includes('<AdminSectionTabs'));
  assert.ok(!source.includes('Finance sections'));
  assert.ok(!source.includes('finance=tax-retainers'));
  assert.ok(workspace.includes("case 'revenue':"));
  assert.ok(workspace.includes("case 'expenses':"));
  assert.ok(workspace.includes("case 'accounts-receivable':"));
  assert.ok(workspace.includes("case 'accounts-payable':"));
  assert.ok(workspace.includes('<AdminInvoicing embeddedView="vendor-payments" />'));
});

test('Admin projects mutation actions stay behind their permissions', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminProjects.tsx'), 'utf8');
  assert.ok(source.includes('{canManageKanbanTasks && <Button'));
  assert.ok(source.includes('{canManageProjects && <Button'));
  assert.ok(!source.includes('Legacy regression guard:'));
});

test('Admin topbar no longer exposes the retired standalone Finance tabs', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminLayout.tsx'), 'utf8');
  assert.equal(source.includes("location.pathname === '/admin/invoicing'"), false);
  assert.equal(source.includes('Finance sections'), false);
  assert.equal(source.includes("to: '/admin/invoicing?finance="), false);
  assert.ok(source.includes("location.pathname === '/admin/finance'"));
  assert.ok(source.includes("label: t('admin.finance.tab.transactionsCash')"));
  assert.ok(source.includes("label: t('admin.finance.tab.receivablesPayables')"));
});
test('Authenticated AMS pages use one canonical responsive page frame', () => {
  const primitives = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/AdminModulePrimitives.tsx'), 'utf8');
  const stylesheet = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
  const layout = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminLayout.tsx'), 'utf8');
  const dashboard = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/GlobalExecutiveDashboard.tsx'), 'utf8');

  assert.ok(primitives.includes("className={cn('ams-page-shell min-h-full min-w-0', className)}"));
  assert.ok(stylesheet.includes('.ams-shell>main>.ams-content{min-width:0;padding:0}'));
  assert.ok(stylesheet.includes('.ams-shell .ams-page-shell{display:flex;flex-direction:column;gap:24px;padding:24px 24px 32px}'));
  assert.ok(stylesheet.includes('.ams-shell .ams-page-shell{padding:24px 20px 32px}'));
  assert.ok(stylesheet.includes('.ams-shell .ams-page-shell{padding:16px 16px 24px}'));
  assert.ok(stylesheet.includes('.ams-shell .ams-page-shell{padding:16px 14px max(24px,env(safe-area-inset-bottom))}'));
  assert.ok(layout.includes('<div className="ams-content flex-1 min-h-0 w-full max-w-[1560px] mx-auto">'));
  assert.ok(dashboard.includes('<AdminPageShell featureSlug="dashboard-module" className="ams-dashboard">'));
});
test('All AMS record-entry forms use Drawer instead of Modal', () => {
  const srcRoot = path.resolve(process.cwd(), 'src');
  const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return entry.isFile() && entry.name.endsWith('.tsx') ? [fullPath] : [];
  });
  const inputPattern = /<(?:form|input|textarea|select|CustomSelect|DatePicker|Input|Textarea|Select|Combobox|MultiSelect)\b/i;
  const findings = [];
  const commandPalettePath = path.resolve(srcRoot, 'components/admin/CommandPalette.tsx');

  for (const file of walk(srcRoot)) {
    const source = fs.readFileSync(file, 'utf8');
    const modalBlocks = source.match(/<Modal\b[\s\S]*?<\/Modal>/g) || [];
    modalBlocks.forEach((block, index) => {
      // The command palette is a keyboard-first search overlay, not a record-entry form.
      if (file !== commandPalettePath && inputPattern.test(block)) {
        findings.push(path.relative(process.cwd(), file) + ' (Modal #' + (index + 1) + ')');
      }
    });
  }
  const commandPalette = fs.readFileSync(commandPalettePath, 'utf8');
  assert.ok(commandPalette.includes('<Modal') && commandPalette.includes('aria-label="Command results"') && commandPalette.includes('AMS search'), 'Command palette retains its dedicated searchable overlay.');

  assert.deepEqual(findings, [], 'Record-entry forms and interactive business inputs must be hosted by Drawer, not Modal. The keyboard-first command palette is the only exception.');

  const careers = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsCareers.tsx'), 'utf8');
  const tasks = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/TasksWorkspace.tsx'), 'utf8');
  const documents = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminDocuments.tsx'), 'utf8');
  const teams = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTeams.tsx'), 'utf8');
  const drawer = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Drawer.tsx'), 'utf8');
  const modal = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Modal.tsx'), 'utf8');

  assert.ok(careers.includes('cms-careers-editor') && careers.includes('cms-career-applicant-details'));
  assert.ok(!careers.includes("import { Modal } from '../../components/ui/Modal'"));
  assert.ok(tasks.includes('<Drawer slug="task-create-modal"') && tasks.includes('<Drawer slug="task-edit-modal"'));
  assert.ok(tasks.includes('aria-label="Project"') && tasks.includes('aria-label="Assignee"') && tasks.includes('aria-label="Priority"'));
  assert.ok(tasks.includes('form="tasks-create-form"') && tasks.includes('form="tasks-edit-form"'));
  assert.ok(documents.includes('<Drawer') && documents.includes('documents-upload-form'));
  assert.ok(documents.includes('aria-label="Category"') && documents.includes('aria-label="Related entity"'));
  assert.ok(teams.includes('<Drawer') && teams.includes('vendorFormOpen'));
  assert.ok(teams.includes('aria-label="Primary capability"') && teams.includes('aria-label="Status"'));
  assert.ok(drawer.includes("'3xl': 'max-w-4xl'") && drawer.includes("'4xl': 'max-w-5xl'"));
  assert.ok(modal.includes('data-ams-modal-root="true"') && modal.includes('z-[80]'));
  assert.ok(drawer.includes("document.querySelector('[data-ams-modal-root=\"true\"]')"), 'A modal above a drawer must own focus and keyboard handling.');
});
test('AMS module tabs share canonical desktop and mobile navigation primitives', () => {
  const layout = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminLayout.tsx'), 'utf8');
  const primitives = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/AdminModulePrimitives.tsx'), 'utf8');
  const dashboard = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/GlobalExecutiveDashboard.tsx'), 'utf8');
  const inbox = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminInbox.tsx'), 'utf8');
  const finance = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminFinanceWorkspace.tsx'), 'utf8');
  const clients = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClients.tsx'), 'utf8');
  const retainers = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClientRetainers.tsx'), 'utf8');
  const sla = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClientSlaMonitoring.tsx'), 'utf8');

  assert.equal((layout.match(/<AdminTopbarTabs\b/g) || []).length, 12);
  assert.ok(primitives.includes("'inline-flex h-8 shrink-0 items-center rounded-chip border px-3 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'"));
  assert.ok(!/className="inline-flex h-9 shrink-0 items-center rounded-chip/.test(layout));
  assert.ok(!/<nav aria-label="(?:Clients|CMS|Dashboard|Projects|Tasks|Inbox|Finance|Team|Settings|Documents) sections"/.test(layout));
  assert.ok(dashboard.includes('<AdminSectionTabs') && !dashboard.includes("{ key: 'tasks', label: 'Tasks', to: '/admin/dashboard?view=tasks' }"));
  assert.ok(dashboard.includes('api.finance.getExpenses()') && dashboard.includes('api.tasks.getAll()'));
  assert.ok(dashboard.includes('<PerformanceView snapshot={operationalSnapshot} />') && dashboard.includes('<AnalyticsView snapshot={operationalSnapshot} range={range} />'));
  assert.ok(dashboard.includes('className="mb-0"') && dashboard.includes('ariaLabel="Dashboard view"'));
  assert.ok(!dashboard.includes('-mt-2'));
  assert.ok(inbox.includes('<AdminSectionTabs') && inbox.includes('inboxTabs.map((tab)'));
  assert.ok(finance.includes('<AdminModuleHeader') && finance.includes('<AdminSectionTabs'));
  assert.ok(finance.indexOf('<AdminModuleHeader') < finance.indexOf('<AdminSectionTabs'));
  assert.ok(clients.includes('<AdminSectionTabs') && retainers.includes('<AdminSectionTabs') && sla.includes('<AdminSectionTabs'));
});

test('Lazy module navigation keeps the AMS shell mounted and recovers locally on module failure', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
  const routeStart = source.indexOf('const ModuleRoute: React.FC<');
  const routeEnd = source.indexOf('const TeamWorkspaceRoute:', routeStart);
  assert.ok(routeStart >= 0 && routeEnd > routeStart, 'ModuleRoute is defined in the expected application routing section.');

  const moduleRoute = source.slice(routeStart, routeEnd);
  assert.ok(source.includes('const ModuleLoadingFallback = () => ('));
  assert.ok(source.includes('role="status" aria-label="Loading module"'));
  assert.ok(source.includes('class ModuleRouteErrorBoundary extends React.Component'));
  assert.ok(moduleRoute.includes('<ModuleRouteErrorBoundary>'));
  assert.ok(moduleRoute.includes('<Suspense fallback={<ModuleLoadingFallback />}>'));
  assert.ok(moduleRoute.includes('<RequireModuleAccess'));
  assert.ok(moduleRoute.includes('{children}'));
  assert.ok(source.includes('The rest of AMS is still available.'));
  assert.ok(source.includes('Reload section'));
  assert.ok(source.includes('<Suspense fallback={<LoadingScreen />}>'), 'The full-screen fallback remains available for initial application loading.');
});

test('All drawers use canonical geometry, typography, and named width presets', () => {
  const drawer = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Drawer.tsx'), 'utf8');
  const stylesheet = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
  const guidelines = fs.readFileSync(path.resolve(process.cwd(), 'docs/AMS-DRAWER-GUIDELINES.md'), 'utf8');
  const cmsProjects = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsProjects.tsx'), 'utf8');
  const cmsServices = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsServices.tsx'), 'utf8');
  const cmsTestimonials = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsTestimonials.tsx'), 'utf8');
  const careers = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsCareers.tsx'), 'utf8');

  assert.ok(drawer.includes('ams-drawer-header'));
  assert.ok(drawer.includes('ams-drawer-body'));
  assert.ok(drawer.includes('ams-drawer-footer'));
  assert.equal(drawer.includes('dialogClassName'), false, 'Drawer widths must use named presets only.');
  assert.ok(stylesheet.includes('.ams-drawer-header{'));
  assert.ok(stylesheet.includes('.ams-drawer-body form{'));
  assert.ok(stylesheet.includes('.ams-drawer-body button[aria-haspopup="listbox"]'));
  assert.ok(stylesheet.includes('.ams-drawer-footer > button,'));
  assert.ok(stylesheet.includes('data-ams-drawer-size="large"'));
  assert.ok(guidelines.includes('Copy-paste template'));
  assert.ok(guidelines.includes('40px'));
  assert.ok(guidelines.includes('data-ams-drawer-layout="sections"'));

  assert.equal(cmsProjects.includes('dialogClassName'), false);
  assert.equal(cmsServices.includes('dialogClassName'), false);
  assert.equal(cmsTestimonials.includes('dialogClassName'), false);
  assert.ok(cmsProjects.includes('data-ams-drawer-preview'));
  assert.ok(cmsProjects.includes('size="xl"'));
  assert.ok(cmsServices.includes('size="lg"'));
  assert.ok(cmsTestimonials.includes('size="lg"'));
  assert.equal((careers.match(/data-ams-drawer-size="large"/g) || []).length, 2);
});

test('Shared modal visual contract and busy-state behavior stay consistent', () => {
  const modal = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/Modal.tsx'), 'utf8');
  const confirm = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/ConfirmDialog.tsx'), 'utf8');
  const stylesheet = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
  const designSystem = fs.readFileSync(path.resolve(process.cwd(), 'AMS-DESIGN-SYSTEM.md'), 'utf8');
  const inbox = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminInbox.tsx'), 'utf8');
  const careers = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsCareers.tsx'), 'utf8');
  const cmsProjects = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsProjects.tsx'), 'utf8');
  const cmsServices = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsServices.tsx'), 'utf8');
  const teams = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTeams.tsx'), 'utf8');
  const settings = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminSettings.tsx'), 'utf8');
  const clients = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClients.tsx'), 'utf8');
  const projects = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminProjects.tsx'), 'utf8');
  const invoicing = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminInvoicing.tsx'), 'utf8');

  assert.ok(modal.includes('busy?: boolean'));
  assert.ok(modal.includes('busyRef.current'));
  assert.ok(modal.includes('!closeOnEscape || busyRef.current'));
  assert.ok(modal.includes('!busyRef.current && event.target === event.currentTarget'));
  assert.ok(modal.includes('data-ams-modal-root="true"'));
  assert.ok(modal.includes('ams-modal-header'));
  assert.ok(modal.includes('ams-modal-body'));
  assert.ok(modal.includes('ams-modal-footer'));
  assert.ok(modal.includes('bg-black/45 backdrop-blur-[2px]'));
  assert.ok(!modal.includes('bg-bg/80'), 'The modal scrim must not inherit the page background in light theme.');
  assert.ok(modal.includes('disabled={busy}'));

  assert.ok(confirm.includes('busy={loading}'));
  assert.ok(confirm.includes('disabled={loading}'));
  assert.ok(confirm.includes('if (!loading) onClose()'));

  assert.ok(stylesheet.includes('.ams-modal-header h2{'));
  assert.ok(stylesheet.includes('.ams-modal-header p{'));
  assert.ok(stylesheet.includes('.ams-modal-footer button:not([data-ams-keep-size])'));
  assert.ok(stylesheet.includes('rgb(0 0 0 / 45%)'));
  assert.ok(stylesheet.includes('env(safe-area-inset-bottom)'));
  assert.ok(designSystem.includes('fixed translucent black scrim'));
  assert.ok(designSystem.includes('in-flight async confirmation must set busy'));
  assert.ok(inbox.includes('bg-danger hover:bg-danger/90') && inbox.includes('bg-accent hover:bg-accent/90'));
  assert.ok(inbox.includes('busy={confirmActionLoading}') && inbox.includes('disabled={confirmActionLoading}'));
  assert.ok(careers.includes('loading={deletingJob}') && careers.includes('loading={deletingApplicant}'));
  assert.ok(cmsProjects.includes('loading={deletingProject}') && cmsServices.includes('loading={deletingService}'));
  assert.ok(teams.includes('loading={vendorDeleteLoading}') && teams.includes('loading={timeDeleteLoading}'));
  assert.ok(settings.includes('busy={isDeletingAccount}') && settings.includes('loading={isDeletingAccount}'));
  assert.ok(clients.includes('busy={isDeleting}') && clients.includes('loading={isDeleting}'));
  assert.ok(projects.includes('busy={deletingProjectRecord}') && projects.includes('busy={deletingTaskRecord}'));
  assert.ok(invoicing.includes('busy={confirmingAction}'));
});


test('AMS keeps core workflows in the existing modules instead of a separate Agency Workspace', () => {
  const app = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
  const layout = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminLayout.tsx'), 'utf8');

  assert.equal(app.includes('<Route path="/workspace/*"'), false);
  assert.equal(layout.includes("label: 'Agency Workspace'"), false);
  assert.ok(app.includes('<Route path="dashboard"'));
  assert.ok(app.includes('<Route path="projects"'));
  assert.ok(app.includes('<Route path="tasks"'));
  assert.ok(app.includes('<Route path="crm"'));
});


test('Project management provides an in-place Gantt timeline using existing project records', () => {
  const projects = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminProjects.tsx'), 'utf8');

  assert.ok(projects.includes("type ProjectLayout = 'board' | 'table' | 'timeline';"));
  assert.ok(projects.includes("openLayout('timeline')"));
  assert.ok(projects.includes("aria-pressed={projectLayout === 'timeline'}"));
  assert.ok(projects.includes('data-ams-feature-slug="projects-gantt-timeline"'));
  assert.ok(projects.includes('projects={filteredProjects}'));
  assert.ok(projects.includes('onOpenProject={openProjectDetail}'));
});
