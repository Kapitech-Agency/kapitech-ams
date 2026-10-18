import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canAccessAmsRoute,
  getNavigationGroupsForRole,
  type AmsRole,
} from '../src/lib/amsNavigationAccess';
import {
  getAmsModuleSubnavigation,
  getAmsWorkspaceNavigationModule,
  isAmsModuleSubnavigationItemActive,
} from '../src/lib/amsModuleSubnavigation';
import { FINANCE_WORKBOOK_GROUPS } from '../src/lib/financeWorkbook.ts';

const roles: AmsRole[] = ['Admin', 'Finance', 'PM', 'Creative', 'Freelancer'];
const modules = ['dashboard', 'inbox', 'projects', 'clients', 'finance', 'team', 'documents', 'cms', 'settings', 'crm', 'tasks'] as const;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => fs.readFile(path.join(root, file), 'utf8');

test('each module root tab follows the approved Master Structure Guide', () => {
  assert.deepEqual(getAmsModuleSubnavigation('dashboard', 'Admin').map((item) => item.label), [
    'Overview', 'Performance', 'Analytics',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('inbox', 'Admin').map((item) => item.label), [
    'Overview', 'Messages', 'Follow-ups', 'Routing & Templates',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('projects', 'Admin').map((item) => item.label), [
    'Overview', 'Project Registry', 'Tasks & Execution', 'Planning & Delivery',
    'Content & Campaigns', 'Project Resources', 'Project Controls',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('clients', 'Admin').map((item) => item.label), [
    'Directory', 'Onboarding', 'Agreements', 'Service & Health',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('finance', 'Admin').map((item) => item.label), [
    'Overview & Control', 'Transactions & Cash', 'Receivables & Payables',
    'Project Finance', 'Accounting & Reports',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('team', 'Admin').map((item) => item.label), [
    'Team & Capacity', 'People Operations', 'Vendors & Freelancers', 'Time Tracking',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('documents', 'Admin').map((item) => item.label), [
    'Document Library',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('cms', 'Admin').map((item) => item.label), [
    'Case Studies', 'Services', 'Insights', 'Testimonials', 'Careers',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'Admin').map((item) => item.label), [
    'System Overview', 'Users & Access', 'Audit Log', 'Integrations',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('crm', 'Admin'), []);
});


test('Inbox exposes only approved workspaces and keeps unavailable destinations non-interactive', async () => {
  const inbox = getAmsModuleSubnavigation('inbox', 'Admin');
  assert.deepEqual(inbox.map((item) => item.label), ['Overview', 'Messages', 'Follow-ups', 'Routing & Templates']);
  for (const key of ['follow-ups', 'routing-templates']) {
    assert.equal(inbox.find((item) => item.key === key)?.available, false, key + ' must remain target-only until implemented');
  }
  assert.equal(inbox.find((item) => item.key === 'messages')?.available, undefined);
  assert.equal(inbox.some((item) => ['sales-inquiries', 'client-requests', 'project-support'].includes(item.key)), false,
    'message categories must not become persistent global navigation items');

  const projects = getAmsModuleSubnavigation('projects', 'Admin');
  assert.equal(projects.find((item) => item.key === 'overview')?.available, undefined);
  assert.equal(projects.find((item) => item.key === 'overview')?.to, '/admin/projects?projects=overview');
  assert.equal(projects.find((item) => item.key === 'registry')?.to, '/admin/projects?projects=all');
  assert.equal(projects.find((item) => item.key === 'planning-delivery')?.available, undefined);
  assert.equal(projects.find((item) => item.key === 'planning-delivery')?.to, '/admin/projects?projects=planning-delivery');
  assert.equal(projects.find((item) => item.key === 'resources')?.available, undefined);
  assert.equal(projects.find((item) => item.key === 'resources')?.to, '/admin/projects?projects=resources');
  assert.equal(projects.find((item) => item.key === 'content-campaigns')?.available, false, 'content-campaigns must not imply a live workspace');
  assert.equal(projects.find((item) => item.key === 'controls')?.to, '/admin/projects?projects=budget');
  const layout = await read('src/pages/admin/AdminLayout.tsx');
  assert.doesNotMatch(layout, /workspaceChildTabItems|Workspace subnavigation/,
    'global shell must not render a third navigation layer for worksheet categories');

  const primitives = await read('src/components/admin/AdminModulePrimitives.tsx');
  assert.match(primitives, /data-ams-navigation-status="target-only"/);
  assert.match(primitives, /aria-disabled="true"/);
  assert.match(primitives, /item\.available === false/);
});


test('Inbox routes activate their owning workspace and unsupported target views fall back to Overview', async () => {
  const inbox = getAmsModuleSubnavigation('inbox', 'Admin');
  const overview = inbox.find((item) => item.key === 'overview')!;
  const messages = inbox.find((item) => item.key === 'messages')!;
  assert.equal(isAmsModuleSubnavigationItemActive(overview, '/admin/inbox'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(overview, '/admin/inbox', '?view=overview'), true);
  for (const supportedView of ['messages', 'client', 'unread', 'starred']) {
    assert.equal(isAmsModuleSubnavigationItemActive(messages, '/admin/inbox', '?view=' + supportedView), true,
      supportedView + ' must remain owned by Messages');
    assert.equal(isAmsModuleSubnavigationItemActive(overview, '/admin/inbox', '?view=' + supportedView), false);
  }
  for (const unsupportedView of ['client-requests', 'project-support', 'resolved', 'archived', 'unsupported']) {
    assert.equal(isAmsModuleSubnavigationItemActive(overview, '/admin/inbox', '?view=' + unsupportedView), true,
      unsupportedView + ' is not implemented and must follow the Inbox page fallback to Overview');
    assert.equal(isAmsModuleSubnavigationItemActive(messages, '/admin/inbox', '?view=' + unsupportedView), false,
      unsupportedView + ' must not falsely activate Messages');
  }
  assert.equal(isAmsModuleSubnavigationItemActive(inbox.find((item) => item.key === 'follow-ups')!, '/admin/inbox', '?view=follow-ups'), false,
    'target-only workspaces never appear as active functional workspaces');

  const inboxSource = await read('src/pages/admin/AdminInbox.tsx');
  assert.match(inboxSource, /type InboxTab = 'overview' \| 'messages' \| 'client' \| 'unread' \| 'starred'/);
  assert.match(inboxSource, /const \[searchParams, setSearchParams\] = useSearchParams\(\)/);
  assert.match(inboxSource, /const supportedInboxViews: readonly string\[\] = \['overview', 'messages', 'client', 'unread', 'starred'\]/);
  assert.match(inboxSource, /if \(!hasViewParameter \|\| isSupportedInboxView\) return;/);
  assert.match(inboxSource, /new URLSearchParams\(searchParams\)/);
  assert.match(inboxSource, /canonicalParams\.set\('view', 'overview'\)/);
  assert.match(inboxSource, /setSearchParams\(canonicalParams, \{ replace: true \}\)/);
  assert.match(inboxSource, /ariaLabel="Message categories"/);
  assert.match(inboxSource, /ariaLabel="Message saved views"/);
  assert.match(inboxSource, /label: 'Resolved', to: '\/admin\/inbox\?view=resolved', available: false/);
  assert.match(inboxSource, /label: 'Archived', to: '\/admin\/inbox\?view=archived', available: false/);
  assert.match(inboxSource, /\['messages', 'client', 'unread', 'starred'\] as InboxTab\[\]/);
  assert.match(inboxSource, /label: 'Project & Support'.*available: false/);
  const messageCategoriesStart = inboxSource.indexOf('ariaLabel="Message categories"');
  const messageSavedViewsStart = inboxSource.indexOf('ariaLabel="Message saved views"');
  assert.ok(messageCategoriesStart >= 0 && messageSavedViewsStart > messageCategoriesStart);
  const messageCategoryNavigation = inboxSource.slice(messageCategoriesStart, messageSavedViewsStart);
  assert.doesNotMatch(messageCategoryNavigation, /key: 'starred', label: 'Starred'/,
    'Starred belongs to saved views and must not be part of message categories.');
  assert.doesNotMatch(inboxSource, /key: 'resolved-archived'/,
    'Resolved and Archived belong to status filters, not a combined worksheet tab.');
  assert.ok(inboxSource.includes('to="/admin/inbox?view=starred"'),
    'The existing Starred view remains reachable from Messages controls.');
  assert.ok(inboxSource.includes('to="/admin/inbox?view=unread"'),
    'Unread is a saved view on canonical New-status records.');
  assert.match(inboxSource, /case 'unread': return submissions\.filter\(\(item\) => item\.status === 'new'\)/);
  assert.ok(inboxSource.includes("unread: 'unread_messages'"));
  assert.match(inboxSource, /\['messages', 'client', 'unread', 'starred'\] as InboxTab\[\]/);
  assert.match(inboxSource, /case 'messages': return submissions/);
  assert.match(inboxSource, /\.filter\(\(item\) => item\.type !== 'career'\)/);
  const app = await read('src/App.tsx');
  assert.match(app, /pathname: '\/admin\/cms\/careers', search: '\?tab=applicants'/);
});


test('Project Registry filters keep the Project Registry workspace active without global worksheet navigation', async () => {
  const projects = getAmsModuleSubnavigation('projects', 'Admin');
  const registry = projects.find((item) => item.key === 'registry')!;
  const tasks = projects.find((item) => item.key === 'tasks')!;
  const controls = projects.find((item) => item.key === 'controls')!;
  const overview = projects.find((item) => item.key === 'overview')!;
  const planning = projects.find((item) => item.key === 'planning-delivery')!;
  const resources = projects.find((item) => item.key === 'resources')!;
  assert.equal(isAmsModuleSubnavigationItemActive(planning, '/admin/projects', '?projects=planning-delivery'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(resources, '/admin/projects', '?projects=resources'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(registry, '/admin/projects', '?projects=planning-delivery'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(registry, '/admin/projects', '?projects=resources'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(registry, '/admin/projects'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(registry, '/admin/projects', '?projects=all'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(overview, '/admin/projects', '?projects=overview'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(registry, '/admin/projects', '?projects=overview'), false);
  for (const status of ['planning', 'active', 'on-hold', 'completed', 'archived']) {
    assert.equal(isAmsModuleSubnavigationItemActive(registry, '/admin/projects', '?projects=' + status), true,
      'status filter ' + status + ' stays within Project Registry');
  }
  assert.equal(isAmsModuleSubnavigationItemActive(tasks, '/admin/projects', '?projects=sprint'), true);
  assert.equal(controls.available, false, 'Project Controls stays target-only until its complete workspace is implemented');
  assert.equal(controls.slug, undefined, 'Budget vs Actual must not advertise itself as the complete Project Controls workspace');
  assert.equal(isAmsModuleSubnavigationItemActive(controls, '/admin/projects', '?projects=budget'), false,
    'Budget vs Actual remains a legacy/internal view rather than an active Project Controls workspace');

  const projectSource = await read('src/pages/admin/AdminProjects.tsx');
  assert.match(projectSource, /registryStatusView/);
  assert.ok(projectSource.includes('projects-overview-workspace'));
  assert.ok(projectSource.includes('projects-planning-delivery-workspace'));
  assert.ok(projectSource.includes('projects-resources-workspace'));
  assert.ok(projectSource.includes("requestedView === 'overview'"));
  assert.ok(projectSource.includes("requestedView === 'planning-delivery'"));
  assert.ok(projectSource.includes("requestedView === 'resources'"));
  assert.match(projectSource, /searchParams\.get\('projects'\)/);
  assert.match(projectSource, /matchesRegistryStatus/);
  assert.match(projectSource, /ariaLabel="Planning & Delivery worksheets"/);
  const planningWorksheetLabels = [
    'Project Brief', 'Scope & Deliverables', 'Milestones', 'Timeline',
    'Deliverable Tracking', 'Internal Quality Review', 'Client Review', 'Revision History',
  ];
  for (const label of planningWorksheetLabels) {
    assert.ok(projectSource.includes("label: '" + label + "'"), 'Planning & Delivery worksheet missing: ' + label);
  }
  assert.match(projectSource, /activeKey=\{planningView\}/);
  assert.match(projectSource, /planningView === 'brief'/);
  assert.match(projectSource, /planningView === 'milestones'/);
  assert.match(projectSource, /planningView === 'timeline'/);
  assert.match(projectSource, /searchParams\.get\('planningView'\)/);
  assert.match(projectSource, /next\.set\('planningView', 'brief'\)/);
  assert.match(projectSource, /next\.delete\('planningView'\)/);
  assert.ok(projectSource.includes("planningView=brief"));
  assert.ok(projectSource.includes("planningView=milestones"));
  assert.ok(projectSource.includes("planningView=timeline"));
  for (const key of [
    'scope-deliverables', 'deliverable-tracking',
    'internal-quality-review', 'client-review', 'revision-history',
  ]) {
    assert.match(projectSource, new RegExp("key: '" + key + "',[^\\n]*available: false"));
  }
});

test('Document Library categories remain in the library and normalize unsupported category URLs', async () => {
  const documentsNavigation = getAmsModuleSubnavigation('documents', 'Admin');
  assert.deepEqual(documentsNavigation.map((item) => item.label), ['Document Library']);

  const source = await read('src/pages/admin/AdminDocuments.tsx');
  assert.match(source, /type TabKey = 'all' \| 'project-client' \| 'sops' \| 'legal' \| 'finance' \| 'hr' \| 'infra'/);
  for (const label of [
    'All files', 'Project & Client Files', 'SOPs & Policies', 'Legal & Corporate',
    'Finance & Tax', 'HR & People', 'Security & Infrastructure',
  ]) {
    assert.ok(source.includes("label: '" + label + "'"), 'Missing Document Library category: ' + label);
  }
  assert.match(source, /const hasDocumentCategoryParam = searchParams\.has\('documents'\)/);
  assert.match(source, /const isSupportedDocumentCategory = DOCUMENT_TABS\.some\(\(tab\) => tab\.key === requestedTab\)/);
  assert.match(source, /if \(!hasDocumentCategoryParam \|\| isSupportedDocumentCategory\) return;/);
  assert.match(source, /canonicalParams\.delete\('documents'\)/);
  assert.match(source, /setSearchParams\(canonicalParams, \{ replace: true \}\)/);
  assert.match(source, /if \(value === 'all'\) next\.delete\('documents'\);/);
  assert.match(source, /else next\.set\('documents', value\);/);
});

test('Clients and Team & Resources use persistent workspaces while internal views remain inside their pages', async () => {
  const clients = getAmsModuleSubnavigation('clients', 'Admin');
  assert.deepEqual(clients.map((item) => item.key), ['directory', 'onboarding', 'agreements', 'service-health']);
  assert.equal(isAmsModuleSubnavigationItemActive(clients.find((item) => item.key === 'onboarding')!, '/admin/clients/all-clients', '?scope=onboarding'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(clients.find((item) => item.key === 'agreements')!, '/admin/contracts'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(clients.find((item) => item.key === 'service-health')!, '/admin/clients/sla-monitoring'), true);

  const clientSource = await read('src/pages/admin/AdminClients.tsx');
  assert.match(clientSource, /ariaLabel="Client Directory worksheets"/);
  assert.match(clientSource, /key: 'companies', label: 'Companies'/);
  assert.match(clientSource, /key: 'contacts', label: 'Contacts'.*available: false/);
  assert.match(clientSource, /ariaLabel="Client Onboarding worksheets"/);
  assert.match(clientSource, /label: 'Onboarding Checklist'.*available: false/);
  assert.match(clientSource, /label: 'Required Documents'.*available: false/);
  assert.match(clientSource, /label: 'Kickoff Readiness'.*available: false/);
  assert.doesNotMatch(clientSource, /id: 'lead', label: 'Onboarding'/,
    'Onboarding is a distinct contextual workspace, not a duplicate Directory filter.');

  const team = getAmsModuleSubnavigation('team', 'Admin');
  assert.deepEqual(team.map((item) => item.key), ['team', 'people-ops', 'vendors', 'time']);
  assert.equal(team.find((item) => item.key === 'people-ops')?.available, false);
  assert.equal(isAmsModuleSubnavigationItemActive(team.find((item) => item.key === 'team')!, '/admin/team'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(team.find((item) => item.key === 'vendors')!, '/admin/vendors', '?view=skill-matrix'), true);

  const teamSource = await read('src/pages/admin/AdminTeams.tsx');
  assert.match(teamSource, /ariaLabel="Team and capacity views"/);
  assert.match(teamSource, /label: 'Availability & Workload'.*available: false/);
  assert.match(teamSource, /ariaLabel="Vendors and freelancers worksheets"/);
  assert.match(teamSource, /key: 'directory', label: 'Directory'/);
  assert.match(teamSource, /label: 'Skills & Service Matrix'/);
  assert.ok(teamSource.includes("canAccessAmsRoute(navigationRole, '/admin/vendors', '?view=skill-matrix')"));
  assert.match(teamSource, /label: 'Contracts & Rates'.*available: false/);
  assert.match(teamSource, /label: 'Engagement Status'.*available: false/);
  assert.match(teamSource, /currentView === 'vendor-directory' \|\| currentView === 'skill-matrix'/);

  const layout = await fs.readFile(path.join(root, 'src/pages/admin/AdminLayout.tsx'), 'utf8');
  assert.doesNotMatch(layout, /workspaceChildTabItems|Workspace subnavigation/);
});

test('Finance keeps its five canonical areas and every existing worksheet activates its owning area', () => {
  const finance = getAmsModuleSubnavigation('finance', 'Admin');
  assert.deepEqual(finance.map((item) => item.key), ['overview', 'transactions', 'receivables', 'projects', 'accounting']);
  assert.deepEqual(getAmsModuleSubnavigation('finance', 'Finance').map((item) => item.key), ['overview', 'transactions', 'receivables', 'projects', 'accounting']);
  assert.deepEqual(getAmsModuleSubnavigation('finance', 'PM').map((item) => item.key), ['projects']);

  const groupForWorksheet: Record<string, string> = {
    overview: 'overview',
    transactions: 'transactions',
    receivables: 'receivables',
    projects: 'projects',
    accounting: 'accounting',
  };
  for (const group of FINANCE_WORKBOOK_GROUPS) {
    const tab = finance.find((item) => item.key === groupForWorksheet[group.key]);
    assert.ok(tab, 'Missing Finance group: ' + group.key);
    for (const sheet of group.items) {
      assert.equal(
        isAmsModuleSubnavigationItemActive(tab!, '/admin/finance', '?tab=' + sheet.key),
        true,
        'Finance worksheet must activate its owning root tab: ' + sheet.key,
      );
    }
  }
  const receivables = finance.find((item) => item.key === 'receivables')!;
  assert.equal(receivables.to, '/admin/finance?tab=quotations', 'Receivables & Payables should open on its first approved worksheet.');
  assert.equal(isAmsModuleSubnavigationItemActive(receivables, '/admin/finance', '?tab=quotations'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(receivables, '/admin/finance/quotations'), true);
});


test('role-specific workspace destinations remain permitted and primary links activate one owning workspace', () => {
  for (const role of roles) {
    for (const moduleKey of modules) {
      for (const item of getAmsModuleSubnavigation(moduleKey, role)) {
        const target = new URL(item.to, 'https://ams.kapitech.local');
        assert.equal(
          canAccessAmsRoute(role, target.pathname, target.search),
          true,
          role + '/' + moduleKey + '/' + item.key + ' must remain allowed by current route policy',
        );
        if (item.available === false) {
          assert.equal(isAmsModuleSubnavigationItemActive(item, target.pathname, target.search), false,
            role + '/' + moduleKey + '/' + item.key + ' must never appear as an active functional workspace');
        }
      }
    }
  }

  const cases: Array<[AmsRole, string, string, string]> = [
    ['Admin', 'dashboard-hub', 'dashboard', 'overview'],
    ['Admin', 'inbox', 'inbox', 'overview'],
    ['Admin', 'project-hub', 'projects', 'registry'],
    ['Finance', 'project-hub', 'projects', 'tasks'],
    ['Creative', 'project-hub', 'projects', 'tasks'],
    ['Admin', 'clients', 'clients', 'directory'],
    ['Admin', 'finance', 'finance', 'overview'],
    ['Admin', 'team-resources', 'team', 'team'],
    ['Finance', 'team-resources', 'team', 'vendors'],
    ['Admin', 'documents', 'documents', 'library'],
    ['Admin', 'website-cms', 'cms', 'projects'],
    ['PM', 'website-cms', 'cms', 'insights'],
    ['Creative', 'website-cms', 'cms', 'insights'],
  ];
  for (const [role, primaryKey, moduleKey, expectedTab] of cases) {
    const primary = getNavigationGroupsForRole(role).flatMap((group) => group.items).find((item) => item.key === primaryKey);
    assert.ok(primary, 'Missing primary destination: ' + role + '/' + primaryKey);
    const destination = new URL(primary.to, 'https://ams.kapitech.local');
    const tabs = getAmsModuleSubnavigation(moduleKey as typeof modules[number], role);
    const active = tabs.filter((tab) =>
      isAmsModuleSubnavigationItemActive(tab, destination.pathname, destination.search, destination.hash)
    );
    assert.equal(active.length, 1, role + '/' + primaryKey + ' should activate exactly one tab');
    assert.equal(active[0].key, expectedTab, role + '/' + primaryKey + ' should activate ' + expectedTab);
  }

  assert.equal(getAmsModuleSubnavigation('projects', 'Freelancer')[0]?.key, 'tasks');
  assert.equal(
    isAmsModuleSubnavigationItemActive(
      getAmsModuleSubnavigation('projects', 'PM').find((item) => item.key === 'tasks')!,
      '/admin/tasks', '?taskscope=my', '', 'PM'
    ),
    true,
    'PM My Tasks activates Tasks & Execution without changing route permissions.'
  );
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'PM'), []);
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'Freelancer', true).map((item) => item.key), ['access']);
});

test('Website CMS Careers normalizes unsupported worksheet queries without changing access policy', async () => {
  const careers = await read('src/pages/admin/AdminCmsCareers.tsx');
  assert.ok(careers.includes("const hasCanonicalQuery = canManageJobs"));
  assert.ok(careers.includes("? requestedTab === null || requestedTab === 'applicants'"));
  assert.ok(careers.includes(": requestedTab === 'applicants';"));
  assert.ok(careers.includes("if (nextTab === 'applicants') next.set('tab', 'applicants');"));
  assert.ok(careers.includes("else next.delete('tab');"));
  assert.ok(careers.includes("}, { replace: true });"));
  assert.ok(careers.includes("const canManageJobs = canAccessAmsRoute(role, '/admin/cms/careers')"));
  assert.ok(careers.includes("if (tab === 'jobs' && !canManageJobs) return;"));
  assert.ok(careers.includes("key: 'recruitment-history'"));
  assert.ok(careers.includes("label: isId ? 'Riwayat Rekrutmen' : 'Recruitment History'"));
  assert.ok(careers.includes("available: false"));
  assert.ok(careers.includes('data-ams-navigation-status="target-only"'));

  const cms = getAmsModuleSubnavigation('cms', 'Admin');
  assert.deepEqual(cms.map((item) => item.label), [
    'Case Studies', 'Services', 'Insights', 'Testimonials', 'Careers',
  ]);
  const applicantOnlyCms = getAmsModuleSubnavigation('cms', 'PM');
  assert.ok(applicantOnlyCms.some((item) => item.label === 'Applicants' && item.to === '/admin/cms/careers?tab=applicants'));
});

test('Settings worksheets have canonical route ownership and normalize unknown query values', async () => {
  const settings = getAmsModuleSubnavigation('settings', 'Admin');
  assert.deepEqual(settings.map((item) => item.key), ['overview', 'access', 'audit', 'integrations']);
  assert.deepEqual(settings.map((item) => item.label), ['System Overview', 'Users & Access', 'Audit Log', 'Integrations']);

  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'overview')!, '/admin/settings'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'overview')!, '/admin/settings', '?tab=overview'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'access')!, '/admin/settings', '?tab=security'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'audit')!, '/admin/settings', '?tab=audit'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'integrations')!, '/admin/settings', '?tab=integrations'), true);

  const source = await read('src/pages/admin/AdminSettings.tsx');
  assert.ok(source.includes("const normalizeTab = (value: string | null): SettingsTab =>"));
  assert.ok(source.includes("if (value === 'audit') return 'audit';"));
  assert.ok(source.includes("if (value === 'security' || value === 'profile' || value === 'rbac') return 'security';"));
  assert.ok(source.includes("if (value === 'integrations' || value === 'branding' || value === 'api') return 'integrations';"));
  assert.ok(source.includes('setSearchParams({ tab: allowed }, { replace: true });'));
});

test('Dashboard invalid view parameters fall back to the sole Overview workspace', () => {
  const views = getAmsModuleSubnavigation('dashboard', 'Admin');
  const overview = views.find((item) => item.key === 'overview')!;
  const performance = views.find((item) => item.key === 'performance')!;
  const analytics = views.find((item) => item.key === 'analytics')!;
  assert.equal(isAmsModuleSubnavigationItemActive(overview, '/admin/dashboard', '?view=unknown'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(performance, '/admin/dashboard', '?view=unknown'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(analytics, '/admin/dashboard', '?view=unknown'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(overview, '/admin/dashboard', '?view='), true);
  assert.equal(isAmsModuleSubnavigationItemActive(overview, '/admin/dashboard', '?view=performance'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(performance, '/admin/dashboard', '?view=performance'), true);
});

test('primary navigation modules and nested views preserve their owning workspace', () => {
  assert.equal(getAmsWorkspaceNavigationModule('/admin/dashboard'), 'dashboard');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/inbox', '?view=messages'), 'inbox');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/finance', '?tab=accounts-receivable'), 'finance');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/tasks'), 'projects');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/tasks', '?taskscope=my'), null);
  assert.equal(getAmsWorkspaceNavigationModule('/admin/tasks', '?taskscope=my', 'PM'), 'projects',
    'PM personal tasks remain inside the Projects workspace while preserving the existing route policy.');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/tasks', '?taskscope=my&workspace=project'), 'projects');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/cms/careers', '?tab=applicants'), 'cms');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/team'), 'team');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/team', '?view=capacity-allocation'), 'team');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/vendors', '?view=skill-matrix'), 'team');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/time-logs'), 'team');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/navigation/release-readiness'), null,
    'Release Readiness remains a protected placeholder, not a Settings workspace.');
  assert.equal(canAccessAmsRoute('Admin', '/admin/navigation/release-readiness'), true,
    'Removing contextual tabs must not remove the existing protected route.');
});

test('shared navigation and topbar icon controls use the Untitled UI icon bridge', async () => {
  const shellFiles = [
    'src/components/admin/DynamicAdminSidebar.tsx',
    'src/pages/admin/AdminLayout.tsx',
    'src/components/admin/AdminModulePrimitives.tsx',
    'src/components/admin/AdminNotificationCenter.tsx',
    'src/components/admin/GlobalTimerControl.tsx',
    'src/components/admin/CommandPalette.tsx',
    'src/components/admin/ProfileIdentity.tsx',
  ];

  for (const file of shellFiles) {
    const source = await read(file);
    assert.ok(source.includes("untitled-ui-icon-bridge"), file + ' must use the approved icon bridge');
    assert.equal(/from ['"]lucide-react['"]/.test(source), false, file + ' must not import icons directly from lucide-react');
  }
});

test('Time Tracking activates billing and project worksheets backed by canonical time entries', async () => {
  const source = await read('src/pages/admin/AdminTimeLogs.tsx');

  assert.match(source, /activeKey=\{timeView\}/);
  assert.ok(source.includes("timeView=billable-time"));
  assert.ok(source.includes("timeView=time-by-project"));
  assert.match(source, /projectTimeSummary = useMemo/);
  assert.match(source, /log\.billable === true/);
  assert.match(source, /log\.billable === false/);
  assert.match(source, /typeof log\.billable !== 'boolean'/);
  assert.ok(source.includes('Recorded time by project'));
  assert.ok(source.includes('time-billing-classification-summary'));
  assert.ok(source.includes("key: 'my-timesheet', label: 'My Timesheet', to: '/admin/time-logs', available: false"));
  assert.ok(source.includes("key: 'timesheet-control', label: 'Timesheet Control', to: '/admin/time-logs', available: false"));
});
