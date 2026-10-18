import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('retired CRM and Proposal routes redirect while Approval remains protected and deprecated', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
  assert.ok(source.includes('<Route path="crm" element={<Navigate to="/admin/clients/all-clients" replace />} />'));
  assert.ok(source.includes('<Route path="finance/quotations" element={<ModuleRoute moduleKey="invoicing" moduleLabel="quotations"><AdminInvoicing embeddedView="quotations" /></ModuleRoute>} />'));
  assert.ok(source.includes('<Route path="clients/lead-accounts" element={<Navigate to="/admin/clients/all-clients" replace />} />'));
  assert.equal(source.includes('<Route path="crm" element={<ModuleRoute moduleKey="crm"'), false);
  assert.ok(source.includes('<Route path="proposals" element={<LegacyQuotationRedirect />} />'));
  assert.ok(source.includes("pathname: '/admin/finance/quotations', search: location.search, hash: location.hash"));
  assert.ok(source.includes('<Route path="approvals" element={<ModuleRoute moduleKey="approvals" moduleLabel="legacy approvals"><AmsNavigationPlaceholder kind="deprecated-approvals" /></ModuleRoute>} />'));
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

test('Projects does not present unavailable project data as seeded/demo records or zero metrics', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminProjects.tsx'), 'utf8');
  assert.doesNotMatch(source, /Demo mode keeps the change local|seeded task data|Seeded project data/i);
  assert.ok(source.includes("serverMode ? String(archivedProjects.length) : '—'"));
  assert.ok(source.includes("{serverMode ? projects.length : '—'}"));
  assert.ok(source.includes('Live project records are unavailable. Refresh after the project service is restored.'));
  assert.ok(source.includes('Project data unavailable'));
});

test('Finance views stay inside the Finance workspace and retired routes stay hidden', () => {
  const layout = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminLayout.tsx'), 'utf8');
  const sidebar = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/DynamicAdminSidebar.tsx'), 'utf8');
  const navigation = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/amsNavigationAccess.ts'), 'utf8');
  const subnavigation = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/amsModuleSubnavigation.ts'), 'utf8');
  const workspace = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminFinanceWorkspace.tsx'), 'utf8');
  assert.equal(layout.includes("location.pathname === '/admin/invoicing'"), false);
  assert.equal(layout.includes('<AdminTopbarTabs'), true);
  assert.ok(sidebar.includes('data-ams-navigation-layout="flat"'));
  assert.ok(sidebar.includes('getNavigationGroupsForRole(role)'));
  assert.equal(sidebar.includes('aria-expanded='), false);
  assert.equal(sidebar.includes('ChevronDown'), false);
  assert.ok(navigation.includes("key: 'finance', label: 'Finance', to: '/admin/finance?tab=executive-summary'"));
  assert.equal(subnavigation.includes("to: '/admin/finance?tab=accounts-receivable'"), true);
  assert.equal(subnavigation.includes("to: '/admin/finance?tab=accounts-payable'"), false);
  assert.equal(subnavigation.includes("to: '/admin/finance?tab=project-finance'"), true);
  const workbook = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/financeWorkbook.ts'), 'utf8');
  for (const area of ['Overview & Control', 'Transactions & Cash', 'Receivables & Payables', 'Project Finance', 'Accounting & Reports']) {
    assert.ok(workbook.includes("label: '" + area + "'"), 'Missing Finance area ' + area);
  }
  assert.ok(workspace.includes('FINANCE_WORKBOOK_GROUPS'));
  assert.ok(workspace.includes('AdminSectionTabs ariaLabel="Finance views"'));
  assert.equal(navigation.includes("to: '/admin/invoicing?finance="), false);
});
test('Retainer workspace uses neutral counts and sentence-case table hierarchy', () => {
  const retainers = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClientRetainers.tsx'), 'utf8');

  assert.ok(retainers.includes('tone="neutral">{records.length} active contracts</AdminStatusBadge>'));
  assert.ok(retainers.includes('Monthly retainer value'));
  assert.ok(retainers.includes('Committed retainer hours'));
  assert.ok(retainers.includes('Renewals due in 30 days'));
  assert.ok(retainers.includes('text-[11px] font-medium text-muted'));
  assert.equal(retainers.includes('text-[10px] uppercase tracking-wider'), false);
  assert.ok(retainers.includes('inline-flex h-9 w-9 items-center justify-center rounded-control'));
});

test('Long-form client relationship detail uses the shared drawer surface', () => {
  const clients = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClients.tsx'), 'utf8');

  assert.ok(clients.includes('<Drawer slug="client-directory-detail-drawer"'));
  assert.ok(clients.includes('size="3xl"'));
  assert.equal(clients.includes('client-directory-detail-modal'), false);
  assert.ok(clients.includes('Relationship timeline'));
  assert.ok(clients.includes('Contracts &amp; Statements of Work'));
});

test('Operational UI avoids sub-10px text outside faithful CMS previews', () => {
  const paths = [
    'src/pages/admin/AdminProjects.tsx',
    'src/pages/admin/AdminInbox.tsx',
    'src/pages/admin/AdminTeams.tsx',
    'src/pages/admin/AdminCmsServices.tsx',
    'src/pages/admin/AdminSettings.tsx',
    'src/components/admin/GlobalExecutiveDashboard.tsx'
  ];
  for (const file of paths) {
    const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
    assert.doesNotMatch(source, /text-\[(?:8|9)px\]/, file + ' must keep operational text at 10px or above.');
  }
});

test('Operational labels use sentence case and shared AMS text sizing', () => {
  const readPage = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
  const projects = readPage('src/pages/admin/AdminProjects.tsx');
  const clients = readPage('src/pages/admin/AdminClients.tsx');
  const teams = readPage('src/pages/admin/AdminTeams.tsx');
  const sla = readPage('src/pages/admin/AdminClientSlaMonitoring.tsx');
  const dashboard = readPage('src/components/admin/GlobalExecutiveDashboard.tsx');

  assert.equal(projects.includes('uppercase tracking-[0.06em]'), false);
  assert.equal(projects.includes('uppercase tracking-[0.08em]'), false);
  assert.equal(clients.includes('uppercase tracking-wider'), false);
  assert.equal(clients.includes('uppercase tracking-wide'), false);
  assert.equal(teams.includes('uppercase tracking-[0.06em]'), false);
  assert.equal(sla.includes('uppercase tracking-[0.08em]'), false);
  assert.equal(dashboard.includes('uppercase tracking-[0.08em]'), false);
});

test('Authenticated AMS pages use one canonical responsive page frame', () => {
  const primitives = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/AdminModulePrimitives.tsx'), 'utf8');
  const stylesheet = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
  const layout = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminLayout.tsx'), 'utf8');
  const dashboard = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/GlobalExecutiveDashboard.tsx'), 'utf8');

  assert.ok(primitives.includes("className={cn('ams-page-shell min-h-full min-w-0', className)}"));
  assert.ok(primitives.includes('ams-workspace-navigation-group'), 'Page title and contextual tabs share one spacing group.');
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
test('Flat sidebar keeps direct links while the shared topbar owns contextual module tabs', () => {
  const layout = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminLayout.tsx'), 'utf8');
  const sidebar = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/DynamicAdminSidebar.tsx'), 'utf8');
  const navigation = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/amsNavigationAccess.ts'), 'utf8');
  const subnavigation = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/amsModuleSubnavigation.ts'), 'utf8');
  const primitives = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/AdminModulePrimitives.tsx'), 'utf8');
  const dashboard = fs.readFileSync(path.resolve(process.cwd(), 'src/components/admin/GlobalExecutiveDashboard.tsx'), 'utf8');
  const inbox = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminInbox.tsx'), 'utf8');
  const documents = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminDocuments.tsx'), 'utf8');
  const finance = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminFinanceWorkspace.tsx'), 'utf8');
  const clients = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClients.tsx'), 'utf8');
  const retainers = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClientRetainers.tsx'), 'utf8');
  const sla = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClientSlaMonitoring.tsx'), 'utf8');

  assert.equal(layout.includes('<AdminTopbarTabs'), true);
  assert.ok(sidebar.includes('data-ams-navigation-layout="flat"'));
  assert.ok(sidebar.includes('getNavigationGroupsForRole(role)'));
  assert.equal(sidebar.includes('data-ams-nav-submenu='), false);
  assert.equal(sidebar.includes('aria-expanded='), false);
  assert.equal(sidebar.includes('ChevronDown'), false);
  for (const group of ["label: 'Workspace'", "label: 'Delivery'", "label: 'Operations'", "label: 'Publishing'"]) {
    assert.ok(navigation.includes(group), 'Missing primary navigation group ' + group);
  }
  assert.ok(subnavigation.includes("label: 'Agreements'"));
  assert.equal(primitives.includes('export const AdminTopbarTabs'), true, 'Desktop workspace navigation uses the dedicated topbar tabs primitive.');
  assert.equal(primitives.includes('AdminCmsSectionTabs'), false, 'CMS uses the shared contextual navigation rather than a second legacy tab component.');
  assert.ok(primitives.includes("'inline-flex min-h-8 shrink-0 items-center rounded-chip border px-3 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'"));
  assert.ok(primitives.includes("'border-accent/20 bg-accent/10 font-semibold text-fg'"));
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
  assert.ok(layout.includes('workspace-topbar-navigation') && layout.includes('<AdminSectionTabs'));
  assert.equal(subnavigation.includes("label: 'Client Requests'"), false, 'Client Requests is a worksheet, not a persistent workspace.');
  assert.equal(subnavigation.includes("label: 'All Documents'"), false, 'Document categories stay inside Document Library.');
  assert.match(inbox, /ariaLabel="Message categories"/);
  assert.equal(documents.includes('<AdminSectionTabs'), false, 'Document categories stay within the Document Library page.');
  assert.equal(documents.includes('<AdminSectionTabs'), false, 'Documents tabs are owned by the shared topbar.');
  assert.ok(finance.includes('<AdminModuleHeader') && finance.includes('<AdminSectionTabs'));
  assert.ok(finance.indexOf('<AdminModuleHeader') < finance.indexOf('<AdminSectionTabs'));
  assert.ok(sidebar.includes('aria-label="Primary navigation"'), 'Primary navigation stays accessible while CRM and retainer tabs remain contextual.');
  assert.ok(subnavigation.includes("label: 'Directory'"));
  assert.ok(subnavigation.includes("label: 'Onboarding'"));
  assert.ok(subnavigation.includes("label: 'Agreements'"));
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
  assert.ok(drawer.includes('bg-black/45 backdrop-blur-[2px]'), 'Drawer scrim stays neutral in dark and light themes.');
  assert.equal(drawer.includes('bg-bg/80'), false, 'Page surface colors must not be reused as overlay scrims.');
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
  assert.ok(cmsServices.includes('<Drawer'));
  assert.ok(cmsServices.includes('<Drawer\n        slug="cms-service-detail-drawer"'));
  assert.ok(cmsServices.includes('size="3xl"'));
  assert.equal(cmsServices.includes('cms-service-detail-modal'), false);
  assert.ok(cmsProjects.includes('data-ams-drawer-preview'));
  assert.ok(cmsProjects.includes('size="4xl"'));
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
  for (const label of ["label: 'Agreements'", "label: 'Time Tracking'", "label: 'Vendors & Freelancers'"]) {
    assert.ok(subnavigation.includes(label), 'Missing contextual destination ' + label);
  }
  const teams = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTeams.tsx'), 'utf8');
  assert.match(teams, /key: 'capacity-allocation', label: 'Capacity Allocation', to: '\/admin\/team\?view=capacity-allocation'/,
    'Capacity Allocation stays an in-page Team worksheet rather than a global workspace tab');
  for (const removed of ["label: 'Sales & Pipeline'", "label: 'Proposals'", "label: 'Approvals'", "label: 'Vendor Ledger'", "label: 'Timesheet Control'"]) {
    assert.equal(navigation.includes(removed), false, 'Retired primary entry remains: ' + removed);
  }
  assert.ok(sidebar.includes('AMS_PRIMARY_SETTINGS_ITEM'));
  assert.ok(layout.includes('GlobalTimerControl'));
  assert.ok(layout.includes('Search Everything'));
  assert.ok(layout.includes('onLogout={handleLogout}'));
});


test('Content-first CMS registers use their working area instead of repeated KPI strips', () => {
  const pages = [
    'src/pages/admin/AdminCmsProjects.tsx',
    'src/pages/admin/AdminCmsServices.tsx',
    'src/pages/admin/AdminCmsInsights.tsx',
    'src/pages/admin/AdminCmsTestimonials.tsx',
    'src/pages/admin/AdminCmsCareers.tsx',
  ];

  for (const file of pages) {
    const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
    assert.match(source, /<AdminModuleHeader\b/, file + ' keeps its single module header');
    assert.doesNotMatch(source, /<AdminMetricStrip\b/, file + ' should not put a repeated KPI strip before its register/editor');
  }

  const caseStudies = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsProjects.tsx'), 'utf8');
  const services = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsServices.tsx'), 'utf8');
  const insights = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsInsights.tsx'), 'utf8');
  const testimonials = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsTestimonials.tsx'), 'utf8');
  const careers = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsCareers.tsx'), 'utf8');
  assert.match(caseStudies, /<AdminFilterBar\b/);
  assert.match(services, /<AdminFilterBar\b/);
  assert.match(insights, /<AdminFilterBar\b/);
  assert.match(testimonials, /<AdminFilterBar\b/);
  assert.ok(careers.indexOf('role="tablist"') < careers.indexOf('data-ams-feature-slug="cms-careers-list"'));
});

test('Inbox opens with contextual controls and its triage workspace, without a redundant KPI dashboard', () => {
  const inbox = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminInbox.tsx'), 'utf8');
  assert.match(inbox, /<AdminModuleHeader\b/);
  assert.match(inbox, /<AdminSectionTabs\b/);
  assert.match(inbox, /ariaLabel="Message categories"/);
  assert.match(inbox, /label: 'Client Requests'.*available: false/);
  assert.match(inbox, /label: 'Project & Support'.*available: false/);
  assert.doesNotMatch(inbox, /key: 'starred', label: 'Starred'/);
  assert.doesNotMatch(inbox, /key: 'resolved-archived'/);
  assert.ok(inbox.includes('to="/admin/inbox?view=starred"'), 'Starred stays reachable as a saved view from Messages.');
  assert.match(inbox, /<AdminFilterBar\b/);
  assert.match(inbox, /data-ams-slug="inbox-overview-workspace"/);
  assert.doesNotMatch(inbox, /<AdminMetricStrip\b/);
  assert.ok(inbox.includes('to="/admin/cms/careers?tab=applicants"'));
});


test('Document vault prioritizes search and the register while preserving the upload dropzone', () => {
  const documents = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminDocuments.tsx'), 'utf8');
  assert.doesNotMatch(documents, /<AdminMetricStrip\\b/);
  assert.ok(documents.indexOf('<AdminFilterBar') < documents.indexOf('data-ams-slug="documents-directory"'));
  assert.ok(documents.indexOf('data-ams-slug="documents-directory"') < documents.indexOf('<AdminPanel slug="documents-upload-dropzone"'));
  assert.ok(documents.includes('onDrop={(event) => {'));
  assert.ok(documents.includes('data-ams-slug="documents-upload-browse"'));
  assert.ok(documents.includes('<Drawer') && documents.includes('documents-upload-form'));
});


test('Retainers and SLA monitoring prioritize the actual operational workspace', () => {
  const retainers = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClientRetainers.tsx'), 'utf8');
  const sla = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClientSlaMonitoring.tsx'), 'utf8');
  assert.ok(retainers.includes('<AdminMetricStrip'));
  assert.ok(retainers.includes('data-ams-slug="retainer-time-log-reconciliation-state"'));
  assert.ok(retainers.includes('data-ams-slug="retainers-directory"'));
  assert.equal(retainers.includes('className="grid grid-cols-1 gap-3 md:grid-cols-3"'), false);
  assert.ok(sla.indexOf('data-ams-slug="sla-telemetry-not-configured"') < sla.indexOf('data-ams-slug="sla-monitoring-setup"'));
  assert.ok(sla.indexOf('data-ams-slug="sla-monitoring-setup"') < sla.indexOf('data-ams-slug="sla-monitoring-next-actions"'));
  assert.equal(sla.includes('aria-label="SLA metrics"'), false);
  assert.ok(sla.includes('No sample accounts or simulated performance values are shown.'));
});


test('Vendor directory omits SLA compliance metrics until the source model supports them', () => {
  const team = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTeams.tsx'), 'utf8');
  assert.ok(team.includes("slug: 'vendor-directory-kpi-active-contractors'"));
  assert.ok(team.includes("slug: 'vendor-directory-kpi-external-burn'"));
  assert.ok(team.includes("slug: 'vendor-directory-kpi-renewals'"));
  assert.equal(team.includes("slug: 'vendor-directory-kpi-sla'"), false);
  assert.equal(team.includes("label: 'Average SLA Compliance'"), false);
});


test('Project portfolio and archive registers lead their supporting KPI summaries', () => {
  const projects = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminProjects.tsx'), 'utf8');
  const portfolioTitle = projects.indexOf('title="Project portfolio"');
  const portfolioKpis = projects.indexOf('data-ams-feature-slug="projects-kpis"');
  const archiveTitle = projects.indexOf('title="Archived projects"');
  const archiveKpis = projects.indexOf('data-ams-feature-slug="projects-archived-kpis"');
  const moduleHeader = projects.indexOf('<AdminModuleHeader');
  assert.ok(moduleHeader >= 0 && portfolioTitle > moduleHeader && portfolioKpis > portfolioTitle);
  assert.ok(archiveTitle >= 0 && archiveTitle > moduleHeader && archiveKpis > archiveTitle);
  assert.ok(projects.includes('aria-label="Project status quick filters"'));
  assert.ok(projects.includes('slug="projects-directory-filters"'));
});


test('Client, team, vendor and time-log registers lead their supporting summaries', () => {
  const clients = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClients.tsx'), 'utf8');
  const teams = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTeams.tsx'), 'utf8');

  const clientDirectory = clients.indexOf('data-ams-feature-slug="clients-directory-table"');
  const clientDirectoryEnd = clients.indexOf('</section>', clientDirectory);
  const clientMetrics = clients.indexOf('data-ams-feature-slug="clients-metrics"');
  assert.ok(clientDirectory >= 0 && clientDirectoryEnd > clientDirectory && clientMetrics > clientDirectoryEnd);
  assert.ok(clients.indexOf('slug="client-directory-filters"') > 0 && clients.indexOf('slug="client-directory-filters"') < clientDirectory);

  const teamHeader = teams.indexOf('<AdminModuleHeader');
  const teamView = teams.indexOf('data-ams-feature-slug="team-directory"');
  const teamMetrics = teams.indexOf("slug: 'team-directory-kpi-headcount'");
  const teamFilters = teams.indexOf('data-ams-feature-slug="team-directory-filters"');
  const teamPagination = teams.indexOf('slug="team-directory-pagination"');
  const vendorViewStart = teams.indexOf(") : currentView === 'vendor-directory' ?");
  assert.ok(teamHeader >= 0 && teamView > teamHeader && teamFilters > teamView);
  assert.ok(teamPagination > teamFilters && teamMetrics > teamPagination && teamMetrics < vendorViewStart);

  const vendorView = teams.indexOf('data-ams-feature-slug="vendor-directory"');
  const vendorMetrics = teams.indexOf("slug: 'vendor-directory-kpi-active-contractors'");
  const vendorFilters = teams.indexOf('data-ams-feature-slug="vendor-directory-filters"');
  const vendorPagination = teams.indexOf('slug="vendor-directory-pagination"');
  const capacityViewStart = teams.indexOf(") : currentView === 'capacity-allocation' ?");
  assert.ok(vendorView >= 0 && vendorFilters > vendorView);
  assert.ok(vendorPagination > vendorFilters && vendorMetrics > vendorPagination && vendorMetrics < capacityViewStart);
  const vendors = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminVendors.tsx'), 'utf8');
  const vendorHeader = vendors.indexOf('<AdminModuleHeader');
  const vendorSnapshot = vendors.indexOf('data-ams-feature-slug="vendor-snapshot"');
  assert.ok(vendorHeader >= 0 && vendorSnapshot > vendorHeader && vendorSnapshot < vendors.indexOf('data-ams-feature-slug="vendor-directory-filters"'));
  assert.equal(teams.includes('SLA is not tracked by the current vendor data model'), false);
  assert.equal(teams.includes('className="w-[8%] text-center">SLA</th>'), false);

  const timeView = teams.indexOf('data-ams-feature-slug="time-logs"');
  const timeMetrics = teams.indexOf("slug: 'time-logs-kpi-tracked'");
  const timeFilters = teams.indexOf('data-ams-feature-slug="time-logs-filters"');
  const timeLedger = teams.indexOf('slug="time-logs-ledger"');
  const timePagination = teams.indexOf('slug="time-logs-pagination"');
  assert.ok(timeView >= 0 && timeFilters > timeView && timeLedger > timeFilters);
  assert.ok(timePagination > timeLedger && timeMetrics > timePagination);
  assert.ok(teams.includes('open={timeFormOpen && canManageTimeLogs}'));
  assert.ok(teams.includes('form="team-time-entry-form"'));
  assert.doesNotMatch(teams, /<AdminPanel title="New time entry"/);
  const timeTracking = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTimeLogs.tsx'), 'utf8');
  const standaloneLedger = timeTracking.indexOf('data-ams-feature-slug="time-tracking-ledger"');
  const standaloneLedgerEnd = timeTracking.indexOf('</section>', standaloneLedger);
  assert.ok(standaloneLedger >= 0 && standaloneLedgerEnd > standaloneLedger && timeTracking.indexOf('slug="time-tracking-kpis"') > standaloneLedgerEnd);
});


test('Lead pipeline uses one compact summary after the primary filtered directory', () => {
  const leads = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClientLeadAccounts.tsx'), 'utf8');
  const filters = leads.indexOf('slug="lead-accounts-filters"');
  const directory = leads.indexOf('data-ams-feature-slug="lead-accounts-directory"');
  const pagination = leads.indexOf('slug="lead-accounts-pagination"');
  const summary = leads.indexOf('data-ams-feature-slug="lead-accounts-summary"');
  assert.ok(filters >= 0 && directory > filters);
  assert.ok(pagination > directory && summary > pagination);
  assert.doesNotMatch(leads, /data-ams-feature-slug="lead-accounts-kpis"/);
  assert.doesNotMatch(leads, /const proposalCount\s*=/);
  assert.ok(leads.includes('Open deal value:'));
  assert.ok(leads.includes('Weighted probability:'));
  assert.ok(leads.includes('Contract review:'));
  assert.ok(leads.includes('Ready to sign:'));
});

test('Time tracking leads with the time-entry workflow and register before period summary metrics', () => {
  const time = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTimeLogs.tsx'), 'utf8');
  const form = time.indexOf('id="time-entry-form"');
  const ledger = time.indexOf('data-ams-slug="time-tracking-ledger"');
  const pagination = time.indexOf('slug="time-tracking-pagination"');
  const metrics = time.indexOf('time-tracking-kpis');
  assert.ok(form >= 0 && ledger > form);
  assert.ok(pagination > ledger && metrics > pagination, 'time summary follows the recent-entry register and its pagination.');
  assert.ok(time.includes('onClick={() => setFormOpen(true)'));
  assert.ok(time.includes('<Drawer'));
  assert.ok(time.includes('closeOnEscape={!saving}'));
  assert.ok(time.includes('const totalMinutes = useMemo'));
  assert.ok(time.includes('const billableMinutes = useMemo'));
});


test('Contracts and SOW leads with its searchable register before the shared summary metrics', () => {
  const contracts = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminContracts.tsx'), 'utf8');
  const search = contracts.indexOf('aria-label="Search contracts"');
  const table = contracts.indexOf('<table', search);
  const pagination = contracts.indexOf('slug="contracts-pagination"');
  const metrics = contracts.indexOf('data-ams-feature-slug="contracts-overview-kpis"');
  assert.ok(search >= 0 && table > search);
  assert.ok(pagination > table && metrics > pagination);
  assert.ok(contracts.includes('<AdminMetricStrip'));
  for (const label of ['Drafts', 'In workflow', 'Active agreements', 'Renewal / expiry watch']) {
    assert.ok(contracts.includes("label: '" + label + "'"), 'Missing contract metric: ' + label);
  }
  assert.ok(contracts.includes("value: loading ? '—' : expiringSoon"));
  assert.ok(contracts.includes('data-ams-slug={\'contract-\' + contract.id}'));
});


test('Contracts uses shared busy-state confirmations for lifecycle changes and draft deletion', () => {
  const contracts = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminContracts.tsx'), 'utf8');
  assert.ok(contracts.includes("import { ConfirmDialog } from '../../components/ui/ConfirmDialog';"));
  assert.equal(contracts.includes('window.confirm'), false);
  assert.ok(contracts.includes('open={Boolean(pendingStatusChange)}'));
  assert.ok(contracts.includes('loading={Boolean(pendingStatusChange && transitioningId === pendingStatusChange.contract.id)}'));
  assert.ok(contracts.includes('open={Boolean(deleteDraftTarget)}'));
  assert.ok(contracts.includes('loading={Boolean(deleteDraftTarget && transitioningId === deleteDraftTarget.id)}'));
  assert.ok(contracts.includes("setPendingStatusChange({ contract, status: 'expired' })"));
  assert.ok(contracts.includes("setPendingStatusChange({ contract, status: 'terminated' })"));
  assert.ok(contracts.includes('setDeleteDraftTarget(contract)'));
  assert.ok(contracts.includes('const confirmPendingStatusChange = async () => {'));
  assert.ok(contracts.includes('const confirmDeleteDraft = async () => {'));
  assert.ok(contracts.includes('setContracts((current) => current.map((item) => item.id === contract.id'));
  assert.ok(contracts.includes('setContracts((current) => current.filter((item) => item.id !== contract.id))'));
});


test('CustomSelect skips disabled options for pointer and keyboard selection', () => {
  const select = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/CustomSelect.tsx'), 'utf8');
  assert.ok(select.includes('disabled?: boolean;'));
  assert.ok(select.includes('disabled={option.disabled}'));
  assert.ok(select.includes('if (option.disabled) return;'));
  assert.ok(select.includes('!options[activeIndex].disabled'));
  assert.ok(select.includes('nextEnabledIndex(activeIndex, delta as 1 | -1)'));
  assert.ok(select.includes('const firstEnabledIndex = options.findIndex((option) => !option.disabled)'));
});

test('Contracts form and status filtering use CustomSelect without enabling unlinked change orders', () => {
  const contracts = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminContracts.tsx'), 'utf8');
  assert.doesNotMatch(contracts, /<select\\b/);
  assert.ok(contracts.includes('slug="contracts-status-filter"'));
  assert.ok(contracts.includes('slug="contract-type-select"'));
  assert.ok(contracts.includes('slug="contract-client-select"'));
  assert.ok(contracts.includes('slug="contract-project-select"'));
  assert.ok(contracts.includes('slug="contract-currency-select"'));
  assert.ok(contracts.includes("disabled: type === 'change_order' && form.contractType !== 'change_order'"));
  assert.ok(contracts.includes('handleClientChange}'));
  assert.ok(contracts.includes('handleProjectChange}'));
});


test('Project profitability prioritizes its searchable financial register before aggregate metrics', () => {
  const page = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminProjectProfitability.tsx'), 'utf8');
  const header = page.indexOf('slug="project-profitability-header"');
  const register = page.indexOf('data-ams-slug="project-profitability-table"');
  const search = page.indexOf('aria-label="Search project profitability"');
  const table = page.indexOf('<table', search);
  const metrics = page.indexOf('aria-label="Aggregate profitability metrics"');
  assert.ok(header >= 0 && register > header);
  assert.ok(search > register && table > search);
  assert.ok(metrics > table);
  assert.ok(page.includes('collected revenue minus recorded expenses'));
  assert.ok(page.includes('currencyFormatter(\'IDR\', idrCollected)'));
  assert.ok(page.includes('currencyFormatter(\'IDR\', idrOutstanding)'));
  assert.ok(page.includes('currencyFormatter(\'IDR\', idrContribution)'));
  assert.ok(page.includes('Figures remain separated by currency'));
});


test('Time Tracking uses shared CustomSelect for linked tasks while preserving empty and disabled behavior', () => {
  const time = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTimeLogs.tsx'), 'utf8');
  assert.doesNotMatch(time, /<select\\b/);
  assert.ok(time.includes('slug="time-entry-task-select"'));
  assert.ok(time.includes('aria-label="Linked task"'));
  assert.ok(time.includes('onChange={handleTaskChange}'));
  assert.ok(time.includes('disabled={!projectId || selectedProjectTasks.length === 0}'));
  assert.ok(time.includes('{ value: "", label: "No linked task" }'));
  assert.ok(time.includes('selectedProjectTasks.map(task => ({ value: task.id, label: task.title }))'));
});


test('Vendor directory prioritizes its register, then the snapshot, and uses the shared detail drawer', () => {
  const vendors = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminVendors.tsx'), 'utf8');
  const filters = vendors.indexOf('aria-label="Vendor directory controls"');
  const directory = vendors.indexOf('data-ams-feature-slug="vendor-directory-list"');
  const emptyState = vendors.indexOf('filteredVendors.length === 0 && (');
  const pagination = vendors.indexOf('slug="vendor-directory-pagination"');
  const snapshot = vendors.indexOf('data-ams-feature-slug="vendor-snapshot"');
  const detailDrawer = vendors.indexOf('slug="vendor-detail-drawer"');
  assert.ok(snapshot > 0 && snapshot < filters, 'vendor snapshot leads the directory controls');
  assert.ok(filters >= 0 && directory > filters);
  assert.ok(emptyState > directory && pagination > emptyState);
  assert.ok(detailDrawer > pagination);
  assert.equal(vendors.includes('<Modal'), false);
  assert.ok(vendors.includes('footer={('));
  assert.ok(vendors.includes("handleOpenEdit(selectedVendor)"));
  assert.ok(vendors.includes('{filteredVendors.length > 0 && ('));
  assert.ok(vendors.includes('Array.from({ length: 4 })'));
});


test('Team loading skeleton follows the selected directory/report hierarchy', () => {
  const teams = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTeams.tsx'), 'utf8');
  const loadingStart = teams.indexOf('{loading ? (');
  const loadingEnd = teams.indexOf(") : currentView === 'team-directory' ? (", loadingStart);
  assert.ok(loadingStart >= 0 && loadingEnd > loadingStart);
  const loading = teams.slice(loadingStart, loadingEnd);
  const contentFirstStart = loading.indexOf("['team-directory', 'vendor-directory', 'time-logs'].includes(currentView) ? (");
  const metricFirstStart = loading.indexOf(') : (', contentFirstStart);
  assert.ok(contentFirstStart >= 0 && metricFirstStart > contentFirstStart);
  const contentFirst = loading.slice(contentFirstStart, metricFirstStart);
  assert.ok(contentFirst.indexOf('h-[72px]') < contentFirst.indexOf('h-80'));
  assert.ok(contentFirst.indexOf('h-80') < contentFirst.indexOf('grid grid-cols-2 gap-3 xl:grid-cols-4'));
  assert.ok(contentFirst.includes('[1, 2, 3, 4].map'));
  const metricFirst = loading.slice(metricFirstStart);
  assert.ok(metricFirst.indexOf('grid grid-cols-2 gap-3 xl:grid-cols-4') < metricFirst.indexOf('h-80'));
});


test('Team and vendor directory filters have one search/category control in their owning workspace', () => {
  const teams = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTeams.tsx'), 'utf8');
  assert.doesNotMatch(teams, /teamHeaderSearch|vendorHeaderSearch|vendorHeaderCategory/);
  assert.ok(teams.includes('aria-label="Search by name, role, email"'));
  assert.ok(teams.includes('aria-label="Search by company or freelancer name"'));
  assert.equal((teams.match(/aria-label="Search team"/g) || []).length, 0);
  assert.equal((teams.match(/aria-label="Filter vendors"/g) || []).length, 0);
  const teamFilterStart = teams.indexOf('data-ams-feature-slug="team-directory-filters"');
  const departmentFilter = teams.indexOf('value={teamDepartment}', teamFilterStart);
  const teamSearch = teams.indexOf('value={teamSearch}', teamFilterStart);
  assert.ok(teamFilterStart >= 0 && departmentFilter > teamFilterStart && teamSearch > teamFilterStart);
  const vendorFilterStart = teams.indexOf('data-ams-feature-slug="vendor-directory-filters"');
  const vendorSearch = teams.indexOf('value={vendorSearch}', vendorFilterStart);
  const vendorCategory = teams.indexOf('value={vendorCategory}', vendorFilterStart);
  assert.ok(vendorFilterStart >= 0 && vendorSearch > vendorFilterStart && vendorCategory > vendorSearch);
  assert.ok(teams.includes("const matchesDepartment = teamDepartment === 'all' || member.division === teamDepartment;"));
  assert.ok(teams.includes("(vendorCategory === 'all' || vendor.primaryCategory === vendorCategory)"));
});


test('Team member and vendor profile details use shared drawers with fixed action footers', () => {
  const teams = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTeams.tsx'), 'utf8');
  assert.equal(teams.includes('<Modal'), false);
  assert.ok(teams.includes('slug="team-member-detail-drawer"'));
  assert.ok(teams.includes('slug="team-vendor-detail-drawer"'));
  const memberStart = teams.indexOf('slug="team-member-detail-drawer"');
  assert.ok(memberStart >= 0);
  assert.ok(teams.indexOf('footer={(', memberStart) < teams.indexOf('memberProjects(memberDetail).length', memberStart));
  assert.ok(teams.includes('Open Projects</Link>'));
  assert.ok(teams.includes('setAllocationTarget(member)'));
  assert.ok(teams.includes('vendorDetail?.portfolioUrl'));
  assert.ok(teams.includes('vendorDetail?.githubUrl'));
  assert.ok(teams.includes('Edit vendor</Button>'));
  assert.ok(teams.includes('setVendorDetail(null)'));
});


test('Client directory adapts its primary register for narrow screens without losing core account actions', () => {
  const clients = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClients.tsx'), 'utf8');
  assert.ok(clients.includes('data-ams-slug="clients-directory-cards"'));
  assert.ok(clients.includes('hidden min-[1280px]:block overflow-x-auto custom-scrollbar'));
  assert.ok(clients.includes('min-w-[980px]'));
  assert.ok(!clients.includes('min-w-[1240px]'));
  assert.ok(clients.includes('colSpan={7}'));
  assert.ok(clients.includes('Primary contact'));
  assert.ok(clients.includes('getClientStatusTone(client.status)'));
  assert.ok(clients.includes('getClientTierLabel(client)'));
  assert.ok(clients.includes("client.projectsCount >= 5 ? 'Tier 1 Strategic'"));
  assert.ok(clients.includes("aria-label={'View profile for ' + client.company}"));
  assert.ok(clients.includes("aria-label={'Manage ' + client.company}"));
});

test('Clients header avoids repeating the Active clients metric before the primary directory', () => {
  const clients = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClients.tsx'), 'utf8');
  const headerStart = clients.indexOf('<AdminModuleHeader slug="clients-header"');
  const headerEnd = clients.indexOf('{errorMessage && (', headerStart);
  const directory = clients.indexOf('data-ams-feature-slug="clients-directory-table"');
  const metrics = clients.indexOf('data-ams-feature-slug="clients-metrics"');
  assert.ok(headerStart >= 0 && headerEnd > headerStart);
  const header = clients.slice(headerStart, headerEnd);
  assert.doesNotMatch(header, /clientMetrics\\.active|active accounts|AdminStatusBadge/);
  const directoryEnd = clients.indexOf('</section>', directory);
  assert.ok(directory > headerEnd);
  assert.ok(directoryEnd > directory && metrics > directoryEnd);
  assert.ok(clients.includes("id: 'active-clients', label: 'Active clients'"));
});


test('Team Directory automatically uses cards on compact viewports and keeps the table preference for wide desktop', () => {
  const teams = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTeams.tsx'), 'utf8');
  assert.ok(teams.includes("window.matchMedia('(max-width: 1279px)')"));
  assert.ok(teams.includes("mediaQuery.addEventListener('change', syncViewport)"));
  assert.ok(teams.includes("teamDisplay === 'table' && !isCompactViewport"));
  assert.ok(teams.includes('hidden min-[1280px]:flex items-center gap-2'));
  assert.ok(teams.includes("onClick={() => setTeamDisplay('table')}"));
  assert.ok(teams.includes("onClick={() => setTeamDisplay('grid')}"));
});


test('Inbox Overview keeps queue actions with queue controls and avoids duplicate header actions', () => {
  const inbox = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminInbox.tsx'), 'utf8');
  const headerStart = inbox.indexOf('<AdminModuleHeader slug="inbox-header"');
  const overviewControls = inbox.indexOf('slug="inbox-overview-controls"');
  const header = inbox.slice(headerStart, overviewControls);
  assert.ok(header.includes("activeInboxTab !== 'overview'"));
  assert.ok(inbox.includes("activeTabItems.length + ' total inbound'"));
  assert.ok(inbox.includes("metrics.newCount > 0 && activeInboxTab !== 'overview'"));
  assert.ok(inbox.includes("metrics.newCount > 0 && (\n                <button type=\"button\" onClick={handleMarkAllRead}"));
  const exportButtons = [...inbox.matchAll(/onClick=\{handleExportCSV\}/g)];
  assert.ok(exportButtons.length >= 2, 'CSV export remains available in the header context and queue toolbar');
});


test('CMS case studies use a task-oriented card register before switching to the wide desktop table', () => {
  const cms = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsProjects.tsx'), 'utf8');
  assert.ok(cms.includes('data-ams-feature-slug="cms-projects-mobile-register"'));
  assert.ok(cms.includes('hidden min-[1280px]:block overflow-x-auto custom-scrollbar'));
  assert.ok(cms.includes('data-ams-slug={\'cms-project-card-\' + project.id}'));
  assert.ok(cms.includes('onClick={() => handleTogglePublished(project)}'));
  assert.ok(cms.includes('onClick={() => handleToggleFeatured(project)}'));
  assert.ok(cms.includes('onClick={() => handleOpenEdit(project)}'));
  assert.ok(cms.includes('onClick={() => handleDelete(project.id, project.title)}'));
});


test('CMS Services, Insights, and Testimonials use compact registers below the wide-table breakpoint', () => {
  const services = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsServices.tsx'), 'utf8');
  assert.ok(services.includes('data-ams-feature-slug="cms-services-mobile-register"'));
  assert.ok(services.includes('hidden min-[1280px]:block overflow-x-auto custom-scrollbar'));
  assert.ok(services.includes('onClick={() => void handleTogglePublished(item)}'));
  assert.ok(services.includes('onClick={() => setSelectedServiceForDetail(item)}'));

  const insights = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsInsights.tsx'), 'utf8');
  assert.ok(insights.includes('data-ams-feature-slug="cms-insights-mobile-register"'));
  assert.ok(insights.includes('hidden min-[1280px]:block overflow-x-auto custom-scrollbar'));
  assert.ok(insights.includes('onClick={() => handleOpenVariant(item)}'));
  assert.ok(insights.includes('onClick={() => setDeleteTarget(item)}'));

  const testimonials = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsTestimonials.tsx'), 'utf8');
  assert.ok(testimonials.includes('data-ams-feature-slug="cms-testimonials-mobile-register"'));
  assert.ok(testimonials.includes('hidden min-[1280px]:block overflow-x-auto custom-scrollbar'));
  assert.ok(testimonials.includes('onClick={() => void handleTogglePublished(item)}'));
  assert.ok(testimonials.includes('onClick={() => handleOpenEdit(item)}'));
});


test('Careers job and applicant registers adapt to compact screens without removing workflow actions', () => {
  const careers = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminCmsCareers.tsx'), 'utf8');
  assert.ok(careers.includes('data-ams-feature-slug="cms-careers-jobs-cards"'));
  assert.ok(careers.includes('data-ams-feature-slug="cms-careers-applicants-cards"'));
  assert.ok(careers.includes('hidden min-[1280px]:block overflow-x-auto custom-scrollbar'));
  assert.ok(careers.includes('onClick={() => void togglePublished(position)}'));
  assert.ok(careers.includes('onClick={() => openEditEditor(position)}'));
  assert.ok(careers.includes('onClick={() => setDeleteJobTarget(position)}'));
  assert.ok(careers.includes('onChange={(value) => void updateApplicantStatus(applicant, value)}'));
  assert.ok(careers.includes('onClick={() => openApplicantDetails(applicant)}'));
  assert.ok(careers.includes('onClick={() => setDeleteApplicantTarget(applicant)}'));
});


test('Project Table view switches to portfolio cards on compact widths without losing reporting fields or permissions', () => {
  const projects = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminProjects.tsx'), 'utf8');
  assert.ok(projects.includes('data-ams-feature-slug="projects-table-cards"'));
  assert.ok(projects.includes('hidden min-[1280px]:block overflow-x-auto custom-scrollbar'));
  assert.ok(projects.includes('data-ams-slug={\'project-portfolio-card-\' + project.id}'));
  assert.ok(projects.includes('Recorded cost / budget'));
  assert.ok(projects.includes('Delivery progress'));
  assert.ok(projects.includes('canManageProjects && <button type="button" data-primary="true" onClick={() => openEditProject(project)}'));
  assert.ok(projects.includes('onClick={() => openProjectDetail(project)}'));
});


test('Project Budget and Archived workspaces expose compact cards with the same financial and historical context', () => {
  const projects = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminProjects.tsx'), 'utf8');
  assert.ok(projects.includes('data-ams-feature-slug="projects-budget-cards"'));
  assert.ok(projects.includes('data-ams-feature-slug="projects-archived-cards"'));
  assert.ok(projects.includes('hidden min-[1280px]:block overflow-x-auto custom-scrollbar'));
  assert.ok(projects.includes('Actual to date'));
  assert.ok(projects.includes('Cost / budget'));
  assert.ok(projects.includes('Final progress'));
  assert.ok(projects.includes('data-ams-slug={\'archived-project-card-\' + project.id}'));
  assert.ok(projects.includes('row.remaining === null ?'));
  assert.ok(projects.includes('canManageProjects && <button type="button" className="inline-flex min-h-9 items-center rounded-control border border-accent/25 bg-accent/10 px-3 text-[11px] font-medium text-accent-text" data-primary="true" onClick={() => openEditProject(project)}>Edit</button>'));
});


test('Settings backup, audit, and account registers provide compact cards and keep desktop tables', () => {
  const settings = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminSettings.tsx'), 'utf8');
  assert.ok(settings.includes('data-ams-feature-slug="settings-backup-cards"'));
  assert.ok(settings.includes('data-ams-feature-slug="settings-audit-cards"'));
  assert.ok(settings.includes('data-ams-feature-slug="settings-account-cards"'));
  assert.ok(settings.includes('hidden min-[1280px]:block overflow-x-auto'));
  assert.ok(settings.includes('onClick={() => void triggerIntegrityCheck()}'));
  assert.ok(settings.includes("log.ip || 'Internal cluster'"));
  assert.ok(settings.includes('account.mfaEnabled ? \'success\' : \'warning\''));
  assert.ok(settings.includes('isCurrentMaster && !masterAccount'));
  assert.ok(settings.includes('setConfirmDelete({ id: account.id, name: account.name })'));
});


test('Time Logs provides compact cards and preserves owner-based delete permissions', () => {
  const time = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminTimeLogs.tsx'), 'utf8');
  assert.ok(time.includes('data-ams-feature-slug="time-log-mobile-cards"'));
  assert.ok(time.includes('hidden min-[1280px]:block overflow-x-auto'));
  assert.ok(time.includes('formatMinutes(Number(log.durationMinutes || 0))'));
  assert.ok(time.includes("log.billable ? 'Billable' : 'Non-billable'"));
  assert.ok(time.includes('(canDeleteAll || log.userId === getAdminSession()?.user?.id)'));
  assert.ok(time.includes('slug="time-tracking-pagination"'));
});


test('Contracts uses compact cards while preserving lifecycle transitions and manager permission gates', () => {
  const contracts = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminContracts.tsx'), 'utf8');
  assert.ok(contracts.includes('data-ams-feature-slug="contracts-compact-cards"'));
  assert.ok(contracts.includes('hidden min-[1280px]:block overflow-x-auto'));
  assert.ok(contracts.includes("const next = primaryNext(contract.status)"));
  assert.ok(contracts.includes("onClick={() => void transition(contract, next)}"));
  assert.ok(contracts.includes("setPendingStatusChange({ contract, status: 'expired' })"));
  assert.ok(contracts.includes("setPendingStatusChange({ contract, status: 'terminated' })"));
  assert.ok(contracts.includes("onClick={() => setDeleteDraftTarget(contract)}"));
  assert.ok(contracts.includes('disabled={!canManage}'));
});


test('Client Retainers uses responsive cards while keeping usage and renewal semantics intact', () => {
  const retainers = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/admin/AdminClientRetainers.tsx'), 'utf8');
  assert.ok(retainers.includes('data-ams-feature-slug="retainers-compact-cards"'));
  assert.ok(retainers.includes('hidden min-[1280px]:block overflow-x-auto custom-scrollbar'));
  assert.ok(retainers.includes('item.usedHours / Math.max(1, item.committedHours) * 100'));
  assert.ok(retainers.includes('renewalDays(item.renewal) <= 30'));
  assert.ok(retainers.includes('canManageRetainers && <button type="button" onClick={() => openRetainerForm(item)}'));
  assert.ok(retainers.includes('slug="retainers-pagination"'));
});
