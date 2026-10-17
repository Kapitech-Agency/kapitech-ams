import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('retired CRM, proposals, and Approval routes redirect to active workspaces', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
  assert.ok(source.includes('<Route path="crm" element={<Navigate to="/admin/clients/all-clients" replace />} />'));
  assert.ok(source.includes('<Route path="finance/quotations" element={<ModuleRoute moduleKey="invoicing" moduleLabel="quotations"><AdminInvoicing embeddedView="quotations" /></ModuleRoute>} />'));
  assert.ok(source.includes('<Route path="clients/lead-accounts" element={<Navigate to="/admin/clients/all-clients" replace />} />'));
  assert.equal(source.includes('<Route path="crm" element={<ModuleRoute moduleKey="crm"'), false);
  assert.ok(source.includes('<Route path="proposals" element={<LegacyQuotationRedirect />} />'));
  assert.ok(source.includes("pathname: '/admin/finance/quotations', search: location.search, hash: location.hash"));
  assert.ok(source.includes('<Route path="approvals" element={<Navigate to="/admin/dashboard" replace />} />'));
  assert.ok(!source.includes("import('./pages/admin/AdminApprovals')"));
  assert.ok(source.includes('<Route path="time-logs" element={<ModuleRoute moduleKey="timelogs" moduleLabel="Time"><AdminTimeLogs /></ModuleRoute>} />'));
  assert.ok(!source.includes("default: m.AdminApprovals"));
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
  assert.ok(source.includes("return retainerInvoices.filter((invoice) => matchesDate(invoice.issueDate || invoice.createdAt))"));
  assert.ok(!source.includes('usingDemoRetainerLedger'));
  assert.ok(!source.includes('STITCH_FINANCE_RETAINER_INVOICES'));
  assert.ok(source.includes('openPayment(invoice)'));
  assert.ok(source.includes('finance-revenue-tax-retainer'));
  assert.ok(source.includes('Contract-linked vendor payments'));
  assert.ok(source.includes('onClick={exportInvoicesCsv}'));
  assert.ok(source.includes('onClick={exportExpensesCsv}'));
  assert.ok(source.includes('onClick={exportVendorPaymentsCsv}'));
  assert.ok(source.includes("isProposalWorkspace && <AdminModuleHeader className=\"mb-0\" title=\"Quotations\""));
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

test('Finance worksheets stay inside the Finance workspace and retired routes stay hidden', () => {
  const layout = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminLayout.tsx'), 'utf8');
  const sidebar = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/DynamicAdminSidebar.tsx'), 'utf8');
  const navigation = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/amsNavigationAccess.ts'), 'utf8');
  const subnavigation = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/amsModuleSubnavigation.ts'), 'utf8');
  const workspace = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminFinanceWorkspace.tsx'), 'utf8');
  assert.equal(layout.includes("location.pathname === '/admin/invoicing'"), false);
  assert.equal(layout.includes('<AdminTopbarTabs'), false);
  assert.ok(sidebar.includes('data-ams-navigation-layout="flat"'));
  assert.ok(sidebar.includes('getNavigationGroupsForRole(role)'));
  assert.equal(sidebar.includes('aria-expanded='), false);
  assert.equal(sidebar.includes('ChevronDown'), false);
  assert.ok(navigation.includes("key: 'finance', label: 'Finance', to: '/admin/finance?tab=executive-summary'"));
  assert.equal(subnavigation.includes("to: '/admin/finance?tab=accounts-receivable'"), false);
  assert.equal(subnavigation.includes("to: '/admin/finance?tab=accounts-payable'"), false);
  assert.equal(subnavigation.includes("to: '/admin/finance?tab=project-finance'"), false);
  const workbook = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/financeWorkbook.ts'), 'utf8');
  for (const area of ['Overview & Control', 'Transactions & Cash', 'Receivables & Payables', 'Project Finance', 'Accounting & Reports']) {
    assert.ok(workbook.includes("label: '" + area + "'"), 'Missing Finance area ' + area);
  }
  assert.ok(workspace.includes('FINANCE_WORKBOOK_GROUPS'));
  assert.ok(workspace.includes('AdminSectionTabs ariaLabel="Finance worksheets"'));
  assert.equal(navigation.includes("to: '/admin/invoicing?finance="), false);
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
test('Flat sidebar keeps direct links while existing tabs stay in their page workspaces', () => {
  const layout = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminLayout.tsx'), 'utf8');
  const sidebar = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/DynamicAdminSidebar.tsx'), 'utf8');
  const navigation = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/amsNavigationAccess.ts'), 'utf8');
  const subnavigation = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/amsModuleSubnavigation.ts'), 'utf8');
  const primitives = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/AdminModulePrimitives.tsx'), 'utf8');
  const dashboard = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/GlobalExecutiveDashboard.tsx'), 'utf8');
  const inbox = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminInbox.tsx'), 'utf8');
  const finance = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminFinanceWorkspace.tsx'), 'utf8');
  const clients = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClients.tsx'), 'utf8');
  const retainers = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClientRetainers.tsx'), 'utf8');
  const sla = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClientSlaMonitoring.tsx'), 'utf8');

  assert.equal((layout.match(/<AdminTopbarTabs\b/g) || []).length, 0);
  assert.ok(sidebar.includes('data-ams-navigation-layout="flat"'));
  assert.ok(sidebar.includes('getNavigationGroupsForRole(role)'));
  assert.equal(sidebar.includes('data-ams-nav-submenu='), false);
  assert.equal(sidebar.includes('aria-expanded='), false);
  assert.equal(sidebar.includes('ChevronDown'), false);
  for (const group of ["label: 'Workspace'", "label: 'Delivery'", "label: 'Operations'", "label: 'Publishing'"]) {
    assert.ok(navigation.includes(group), 'Missing primary navigation group ' + group);
  }
  assert.ok(subnavigation.includes("label: 'Retainers'"));
  assert.ok(primitives.includes("'inline-flex h-8 shrink-0 items-center rounded-chip border px-3 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'"));
  assert.ok(!/className="inline-flex h-9 shrink-0 items-center rounded-chip/.test(layout));
  assert.ok(!/<nav aria-label="(?:Clients|CMS|Dashboard|Projects|Tasks|Inbox|Finance|Team|Settings|Documents) sections"/.test(layout));
  assert.equal(dashboard.includes('<AdminSectionTabs'), false, 'Dashboard workspace tabs come from the shared layout.');
  assert.ok(sidebar.includes('aria-label="Primary navigation"'));
  assert.ok(sidebar.includes('data-ams-navigation-layout="flat"'));
  assert.ok(dashboard.includes('api.finance.getExpenses()') && dashboard.includes('api.tasks.getAll()'));
  assert.ok(dashboard.includes('<PerformanceView snapshot={operationalSnapshot} />') && dashboard.includes('<AnalyticsView snapshot={operationalSnapshot} range={range} />'));
  assert.ok(dashboard.includes('className="mb-0"'));
  assert.equal(dashboard.includes('ariaLabel="Dashboard view"'), false);
  assert.ok(!dashboard.includes('-mt-2'));
  assert.ok(inbox.includes('<AdminSectionTabs') && inbox.includes('inboxTabs.map((tab)'));
  assert.ok(finance.includes('<AdminModuleHeader') && finance.includes('<AdminSectionTabs'));
  assert.ok(finance.indexOf('<AdminModuleHeader') < finance.indexOf('<AdminSectionTabs'));
  assert.ok(sidebar.includes('aria-label="Primary navigation"'), 'Primary navigation stays accessible while CRM and retainer tabs remain contextual.');
  assert.ok(subnavigation.includes("label: 'Client directory'"));
  assert.ok(subnavigation.includes("label: 'Onboarding'"));
  assert.ok(subnavigation.includes("label: 'Retainers'"));
  assert.equal(clients.includes('clients-mobile-tabs'), false);
  assert.equal(retainers.includes('Clients sections'), false);
  assert.equal(sla.includes('Clients sections'), false);
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


test('Tasks workspace shows an assignee workload and risk overview linked to the existing task queue', () => {
  const tasks = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/TasksWorkspace.tsx'), 'utf8');

  assert.ok(tasks.includes('data-ams-feature-slug="tasks-workload-distribution"'));
  assert.ok(tasks.includes('const workloadByAssignee = useMemo<WorkloadItem[]>'));
  assert.ok(tasks.includes('bucket.overdue += 1'));
  assert.ok(tasks.includes('bucket.blocked += 1'));
  assert.ok(tasks.includes('setAssigneeFilter(owner.filterValue)'));
  assert.ok(tasks.includes("nextParams.delete('taskscope')"));
  assert.ok(tasks.includes("value: '__unassigned__'"));
  assert.ok(tasks.includes('They do not represent available hours or individual capacity.'));
});


test('CRM pipeline opportunity edits use the existing persistent API and canonical open stages', () => {
  const crm = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClientLeadAccounts.tsx'), 'utf8');

  assert.ok(crm.includes("const canManageCrm = fixtureMode || hasAdminPermission('canManageCrm')"));
  assert.ok(crm.includes('api.crm.updateDeal(editingLead.id'));
  assert.ok(crm.includes("stage: editForm.stage"));
  assert.ok(crm.includes("value: 'new', label: 'New'"));
  assert.ok(crm.includes("value: 'contacted', label: 'Contacted'"));
  assert.ok(crm.includes("value: 'proposal', label: 'Proposal'"));
  assert.ok(crm.includes("value: 'negotiation', label: 'Negotiation'"));
  assert.ok(crm.includes('slug="lead-account-edit-drawer"'));
  assert.ok(crm.includes('loading={savingEditLead}') && crm.includes('disabled={savingEditLead}'));
  assert.ok(crm.includes('No server record was changed.'));
  assert.ok(crm.includes("!['won', 'lost', 'closed_won', 'closed_lost'].includes(String(deal.stage || '').toLowerCase())"));
});


test('Client onboarding readiness reflects persisted profile fields and opens the existing editor', () => {
  const clients = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClients.tsx'), 'utf8');

  assert.ok(clients.includes('const getClientProfileReadiness = (client: AgencyClient)'));
  assert.ok(clients.includes('label: \'Company name\''));
  assert.ok(clients.includes('label: \'Primary contact\''));
  assert.ok(clients.includes('label: \'Business email\''));
  assert.ok(clients.includes('label: \'Phone / WhatsApp\''));
  assert.ok(clients.includes('data-ams-feature-slug="client-onboarding-readiness"'));
  assert.ok(clients.includes("selectedClient.status === 'lead'"));
  assert.ok(clients.includes('selectedClientReadinessCount / selectedClientReadiness.length'));
  assert.ok(clients.includes('openEdit(client)'));
  assert.ok(clients.includes('Contract approval, project kickoff, and billing readiness must be verified in their existing AMS modules.'));
  assert.ok(clients.includes('api.clients.update(clientData.id, clientData)'));
  assert.equal(clients.includes('const [onboardingChecklist'), false, 'Do not imply an unpersisted local checklist is authoritative.');
});


test('Client profile detail loads persisted contracts by client ID or exact company name', () => {
  const clients = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClients.tsx'), 'utf8');

  assert.ok(clients.includes('api.contracts.getAll()'));
  assert.ok(clients.includes('const contractClientId = String(contract.clientId || \'\').trim()'));
  assert.ok(clients.includes('contractClientId === selectedClient.id'));
  assert.ok(clients.includes('normalizeClientRelationName(contract.clientName) === normalizeClientRelationName(selectedClient.company)'));
  assert.ok(clients.includes('const canViewClientContracts = canManageClients || hasAdminPermission(\'canManageCrm\') || hasAdminPermission(\'canManageProjects\')'));
  assert.ok(clients.includes('data-ams-feature-slug="client-contract-history"'));
  assert.ok(clients.includes('No linked contracts yet'));
  assert.ok(clients.includes('isSecureContractDocumentUrl(contract.documentUrl)'));
  assert.ok(clients.includes("return new URL(value).protocol === 'https:'"));
  assert.ok(clients.includes('to="/admin/contracts"'));
  assert.ok(clients.includes('Contract register unavailable'));
});


test('Client interaction timeline reads and writes persistent relationship history through the existing AMS API', () => {
  const clients = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClients.tsx'), 'utf8');
  const api = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/apiClient.ts'), 'utf8');
  const routes = fs.readFileSync(path.resolve(process.cwd(), 'server/routes.ts'), 'utf8');
  const migration = fs.readFileSync(path.resolve(process.cwd(), 'db/postgres/053_client_interactions.sql'), 'utf8');
  const repository = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-client-interaction-repository.ts'), 'utf8');
  const database = fs.readFileSync(path.resolve(process.cwd(), 'server/db.ts'), 'utf8');
  const postgresDatabase = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-database-repository.ts'), 'utf8');

  assert.ok(postgresDatabase.includes("'client_interactions'"));
  assert.ok(postgresDatabase.includes('const clientInteractions=(m.get(\'client_interactions\')??[])'));
  assert.ok(postgresDatabase.includes('clients,clientInteractions,projects'));
  assert.ok(clients.includes('data-ams-feature-slug="client-interaction-timeline"'));
  assert.ok(clients.includes('slug="client-interaction-create-drawer"'));
  assert.ok(clients.includes('api.clients.getInteractions(selectedClient.id)'));
  assert.ok(clients.includes('api.clients.createInteraction(interactionClient.id'));
  assert.ok(clients.includes('setInteractionSaving(true)'));
  assert.ok(clients.includes('response.data?.interaction'));
  assert.ok(api.includes('getInteractions: (id: string)'));
  assert.ok(api.includes('createInteraction: (id: string'));
  assert.ok(routes.includes("apiRouter.get('/clients/:id/interactions', requireAuth, requireAnyPermission('canManageClients', 'canManageCrm'"));
  assert.ok(routes.includes("apiRouter.post('/clients/:id/interactions', requireAuth, requireAnyPermission('canManageClients', 'canManageCrm'"));
  assert.ok(routes.includes("const CLIENT_INTERACTION_TYPES: readonly ClientInteractionType[] = ['call', 'email', 'meeting', 'message', 'note']"));
  assert.ok(routes.includes("makeAuditEntry(req, 'CLIENT_INTERACTION_CREATED'"));
  assert.ok(repository.includes('postgresAuditLogRepository.appendWithinTransaction(client, audit)'));
  assert.ok(repository.includes('async listByClientId(clientId: string'));
  assert.ok(repository.includes('async create(input: ClientInteractionInput'));
  assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS client_interactions'));
  assert.ok(migration.includes('REFERENCES clients(id) ON DELETE RESTRICT'));
  assert.ok(migration.includes('ON client_interactions (client_id, occurred_at DESC, created_at DESC)'));
  assert.ok(database.includes('clientInteractions: any[]'));
  assert.ok(database.includes('clientInteractions: []'));
  assert.ok(routes.includes('Client has interaction history and cannot be deleted.'));
});

test('Client interaction timeline is separate from global security audit records', () => {
  const clients = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClients.tsx'), 'utf8');
  const routes = fs.readFileSync(path.resolve(process.cwd(), 'server/routes.ts'), 'utf8');

  assert.ok(clients.includes('Saved client calls, meetings, emails, messages, and internal notes.'));
  assert.ok(clients.includes('api.clients.getInteractions(selectedClient.id)'));
  assert.ok(routes.includes("const interactions = (getDatabase().clientInteractions || [])"));
  assert.ok(!clients.includes("api.auditLogs.getAll()"));
});


test('Client timeline distinguishes system-generated CRM, contract, and onboarding events from manual notes', () => {
  const clients = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClients.tsx'), 'utf8');
  const routes = fs.readFileSync(path.resolve(process.cwd(), 'server/routes.ts'), 'utf8');
  const dealRepository = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-crm-deal-repository.ts'), 'utf8');
  const clientRepository = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-client-repository.ts'), 'utf8');
  const contractRepository = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-contract-repository.ts'), 'utf8');
  const interactionRepository = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-client-interaction-repository.ts'), 'utf8');
  const migration = fs.readFileSync(path.resolve(process.cwd(), 'db/postgres/054_system_client_timeline_events.sql'), 'utf8');
  const databaseSnapshot = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-database-repository.ts'), 'utf8');

  assert.ok(clients.includes("interaction.sourceType === 'system' ? 'System activity' : clientInteractionLabel(interaction.type)"));
  assert.ok(routes.includes("systemAction: 'crm_deal_stage_changed'"));
  assert.ok(routes.includes("systemAction: 'client_contract_created'"));
  assert.ok(routes.includes("systemAction: 'client_contract_status_changed'"));
  assert.ok(routes.includes("systemAction: 'client_status_changed'"));
  assert.ok(dealRepository.includes("systemAction: 'crm_deal_stage_changed'"));
  assert.ok(dealRepository.includes("systemAction: 'crm_deal_converted'"));
  assert.ok(dealRepository.includes("'crm-deal-converted:' + String(deal.id)"));
  assert.ok(clientRepository.includes("systemAction: 'client_status_changed'"));
  assert.ok(contractRepository.includes("'client_contract_created'"));
  assert.ok(contractRepository.includes("'client_contract_status_changed'"));
  assert.ok(interactionRepository.includes('ON CONFLICT DO NOTHING'));
  assert.ok(interactionRepository.includes('sourceType: row.source_type === \'system\' ? \'system\' : \'manual\''));
  assert.ok(migration.includes('ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT \'manual\''));
  assert.ok(migration.includes('idx_client_interactions_system_event_once'));
  assert.ok(migration.includes('WHERE source_type = \'system\''));
  assert.ok(databaseSnapshot.includes("sourceType:r.source_type==='system'?'system':'manual'"));
});

test('CRM stage timeline events are only emitted when the stage changes and conversion events are idempotent', () => {
  const dealRepository = fs.readFileSync(path.resolve(process.cwd(), 'server/postgres-crm-deal-repository.ts'), 'utf8');
  const routes = fs.readFileSync(path.resolve(process.cwd(), 'server/routes.ts'), 'utf8');

  assert.ok(dealRepository.includes('if (previousStage === nextStage) return;'));
  assert.ok(dealRepository.includes("if (updatedDeal && String(existing.stage || 'new') !== String(updatedDeal.stage || 'new'))"));
  assert.ok(dealRepository.includes("'crm-deal-converted:' + String(deal.id)"));
  assert.ok(routes.includes("if (String(previousDeal.stage || 'new') !== String(updatedDeal.stage || 'new'))"));
  assert.ok(routes.includes("if (duplicated) return null;"));
});


test('Flat sidebar visibility follows the nine-module role policy and keeps Settings separate', () => {
  const layout = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminLayout.tsx'), 'utf8');
  const routes = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
  const navigation = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/amsNavigationAccess.ts'), 'utf8');
  const subnavigation = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/amsModuleSubnavigation.ts'), 'utf8');
  const sidebar = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/DynamicAdminSidebar.tsx'), 'utf8');
  const primitives = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/AdminModulePrimitives.tsx'), 'utf8');

  for (const key of [
    "key: 'dashboard-hub'", "key: 'inbox'", "key: 'project-hub'", "key: 'clients'",
    "key: 'finance'", "key: 'team-resources'", "key: 'documents'", "key: 'website-cms'",
  ]) assert.ok(navigation.includes(key), 'Missing primary module ' + key);
  assert.ok(navigation.includes("key: 'user-access'"));
  assert.ok(navigation.includes("key: 'data-persistence-backup'"));
  assert.equal(navigation.includes("key: 'release-readiness'"), false);
  assert.ok(navigation.includes("path === '/admin/contracts'"));
  assert.ok(routes.includes('<Route path="contracts" element={<ModuleRoute moduleKey="clients" moduleLabel="contracts"><AdminContracts /></ModuleRoute>} />'));

  assert.ok(layout.includes('<DynamicAdminSidebarNavigation role={amsRole}'));
  assert.equal(layout.split('<DynamicAdminSidebarNavigation').length - 1, 2);
  assert.equal(layout.split('<AdminSystemSettingsNavigation').length - 1, 2);
  assert.ok(sidebar.includes("if (role !== 'Admin') return null;"));
  assert.ok(sidebar.includes('getNavigationGroupsForRole(role)'));
  assert.ok(sidebar.includes('data-ams-navigation-layout="flat"'));
  assert.equal(sidebar.includes('data-ams-nav-expand='), false);
  assert.ok(primitives.includes('items.filter(canRenderNavigationTab).map((item) => {'));
  assert.ok(navigation.includes('export function canAccessAmsRoute'));
  assert.ok(navigation.includes('export function isNavigationItemActive'));

  for (const label of ["Dashboard", "Inbox", "Projects", "Clients", "Finance", "Team & Resources", "Documents", "Website CMS"]) {
    assert.ok(navigation.includes("label: '" + label + "'"), 'Missing primary module ' + label);
  }
  for (const label of ["label: 'Retainers'", "label: 'Capacity'", "label: 'Time tracking'", "label: 'Vendors & freelancers'"]) {
    assert.ok(subnavigation.includes(label), 'Missing contextual destination ' + label);
  }
  for (const removed of ["label: 'Sales & Pipeline'", "label: 'Proposals'", "label: 'Approvals'", "label: 'Vendor Ledger'", "label: 'Timesheet Control'"]) {
    assert.equal(navigation.includes(removed), false, 'Retired primary entry remains: ' + removed);
  }
  assert.ok(sidebar.includes('AMS_PRIMARY_SETTINGS_ITEM'));
  assert.ok(layout.includes('GlobalTimerControl'));
  assert.ok(layout.includes('Search Everything'));
  assert.ok(layout.includes('onLogout={handleLogout}'));
});
