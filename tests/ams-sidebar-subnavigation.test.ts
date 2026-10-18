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
  getAmsModuleSubnavigationChildren,
  getAmsWorkspaceNavigationModule,
  isAmsModuleSubnavigationChildActive,
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
    'Inbox Overview', 'All Messages', 'Sales Inquiries', 'Client Requests',
    'Project & Support Requests', 'Follow-ups', 'Starred', 'Resolved & Archived',
    'Routing & Response Templates',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('projects', 'Admin').map((item) => item.label), [
    'Projects Overview', 'Project Registry', 'Planning & Scope', 'Tasks & Execution',
    'Project Resources', 'Deliverables & Quality', 'Content & Campaign Operations',
    'Changes, Risks & Issues', 'Budget & Project Health', 'Project Files',
    'Project Reports & Closure',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('clients', 'Admin').map((item) => item.label), [
    'Client Overview', 'Client Directory', 'Onboarding', 'Contracts & Agreements',
    'Retainers', 'SLA & Service Operations', 'Client Growth & Health',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('finance', 'Admin').map((item) => item.label), [
    'Overview & Control', 'Transactions & Cash', 'Receivables & Payables',
    'Project Finance', 'Accounting & Reports',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('team', 'Admin').map((item) => item.label), [
    'Team & Capacity', 'People Operations', 'Vendors & Freelancers', 'Time Tracking',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('documents', 'Admin').map((item) => item.label), [
    'Document Overview', 'All Documents', 'Project & Client Files', 'SOPs & Policies',
    'Legal & Corporate', 'Finance & Tax', 'HR & People', 'Security & Infrastructure',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('cms', 'Admin').map((item) => item.label), [
    'CMS Overview', 'Case Studies', 'Services', 'Insights', 'Testimonials', 'Careers',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'Admin').map((item) => item.label), [
    'System Overview', 'Users & Access', 'Audit Log', 'Integrations', 'Preferences',
  ]);
  assert.deepEqual(getAmsModuleSubnavigation('crm', 'Admin'), []);
});

test('documented target-only workspaces are visible but never rendered as fake links', async () => {
  const inbox = getAmsModuleSubnavigation('inbox', 'Admin');
  for (const key of ['client-requests', 'project-support', 'follow-ups', 'resolved-archived', 'routing-templates']) {
    assert.equal(inbox.find((item) => item.key === key)?.available, false, key + ' must remain target-only until implemented');
  }
  assert.equal(inbox.find((item) => item.key === 'messages')?.available, undefined);
  assert.equal(inbox.find((item) => item.key === 'sales-inquiries')?.available, undefined);

  const projects = getAmsModuleSubnavigation('projects', 'Admin');
  for (const key of ['overview', 'planning-scope', 'resources', 'deliverables', 'content-campaigns', 'changes-risks', 'files', 'reports-closure']) {
    assert.equal(projects.find((item) => item.key === key)?.available, false, key + ' must not imply a live workspace');
  }

  const primitives = await read('src/components/admin/AdminModulePrimitives.tsx');
  assert.match(primitives, /data-ams-navigation-status="target-only"/);
  assert.match(primitives, /aria-disabled="true"/);
  assert.match(primitives, /item\.available === false/);
});

test('existing Inbox routes keep query-driven active state and Careers applicants stay in CMS', async () => {
  const inbox = getAmsModuleSubnavigation('inbox', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(inbox.find((item) => item.key === 'overview')!, '/admin/inbox'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(inbox.find((item) => item.key === 'messages')!, '/admin/inbox', '?view=messages'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(inbox.find((item) => item.key === 'sales-inquiries')!, '/admin/inbox', '?view=client'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(inbox.find((item) => item.key === 'starred')!, '/admin/inbox', '?view=starred'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(inbox.find((item) => item.key === 'overview')!, '/admin/inbox', '?view=unsupported'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(inbox.find((item) => item.key === 'client-requests')!, '/admin/inbox'), false);

  const inboxSource = await read('src/pages/admin/AdminInbox.tsx');
  assert.match(inboxSource, /type InboxTab = 'overview' \| 'messages' \| 'client' \| 'starred'/);
  assert.match(inboxSource, /case 'messages': return submissions/);
  assert.match(inboxSource, /\.filter\(\(item\) => item\.type !== 'career'\)/);
  const app = await read('src/App.tsx');
  assert.match(app, /pathname: '\/admin\/cms\/careers', search: '\?tab=applicants'/);
});

test('Project Registry parent and supported status filters activate the correct nested items', async () => {
  const projects = getAmsModuleSubnavigation('projects', 'Admin');
  const registry = projects.find((item) => item.key === 'registry')!;
  assert.equal(isAmsModuleSubnavigationItemActive(registry, '/admin/projects'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(registry, '/admin/projects', '?projects=planning'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(registry, '/admin/projects', '?projects=active'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(registry, '/admin/projects', '?projects=on-hold'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(registry, '/admin/projects', '?projects=completed'), true);

  const children = getAmsModuleSubnavigationChildren('projects', 'registry', 'Admin');
  assert.deepEqual(children.map((item) => item.label), [
    'All Projects', 'Planning', 'Active Projects', 'On Hold', 'Completed', 'Archived',
  ]);
  for (const [key, query] of [
    ['all', ''],
    ['planning', '?projects=planning'],
    ['active', '?projects=active'],
    ['on-hold', '?projects=on-hold'],
    ['completed', '?projects=completed'],
    ['archived', '?projects=archived'],
  ] as const) {
    assert.equal(
      isAmsModuleSubnavigationChildActive(children.find((item) => item.key === key)!, '/admin/projects', query),
      true,
      'Project Registry child must activate for ' + key,
    );
  }

  const projectSource = await read('src/pages/admin/AdminProjects.tsx');
  assert.match(projectSource, /registryStatusView/);
  assert.match(projectSource, /projects=planning/);
  assert.match(projectSource, /matchesRegistryStatus/);
});

test('Client, Team & Resources nested subnavigation mirrors existing routes and labels', () => {
  const clientCases: Array<[string, string, string]> = [
    ['onboarding', 'onboarding-checklist', '/admin/clients/all-clients?scope=onboarding'],
    ['contracts', 'contract-register', '/admin/contracts'],
    ['retainers', 'retainer-register', '/admin/clients/retainers'],
    ['sla', 'sla-monitoring', '/admin/clients/sla-monitoring'],
  ];
  for (const [parent, key, destination] of clientCases) {
    const children = getAmsModuleSubnavigationChildren('clients', parent, 'Admin');
    assert.ok(children.some((item) => item.key === key && item.to === destination));
  }
  const clientDirectory = getAmsModuleSubnavigationChildren('clients', 'directory', 'Admin');
  assert.deepEqual(clientDirectory.map((item) => item.label), ['Companies', 'Contacts', 'Client 360°']);
  assert.ok(clientDirectory.every((item) => item.available === false), 'the incomplete Client 360 structure must not be presented as functional');

  const team = getAmsModuleSubnavigationChildren('team', 'team', 'Admin');
  assert.deepEqual(team.map((item) => item.label), [
    'Team Directory', 'Roles & Departments', 'Capacity Allocation', 'Availability & Workload',
  ]);
  assert.equal(isAmsModuleSubnavigationChildActive(team.find((item) => item.key === 'capacity-allocation')!, '/admin/team', '?view=capacity-allocation'), true);

  const vendors = getAmsModuleSubnavigationChildren('team', 'vendors', 'Admin');
  assert.deepEqual(vendors.map((item) => item.label), [
    'Directory', 'Skills & Service Matrix', 'Contracts & Rates', 'Engagement Status',
  ]);
  assert.equal(isAmsModuleSubnavigationChildActive(vendors.find((item) => item.key === 'vendor-skills')!, '/admin/vendors', '?view=skill-matrix'), true);

  const teamRoot = getAmsModuleSubnavigation('team', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(teamRoot.find((item) => item.key === 'vendors')!, '/admin/vendors', '?view=skill-matrix'), true);
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
  assert.equal(isAmsModuleSubnavigationItemActive(finance.find((item) => item.key === 'receivables')!, '/admin/finance/quotations'), true);
});

test('role-specific subnavigation destinations remain permitted and primary clicks land on an owning tab', () => {
  for (const role of roles) {
    for (const moduleKey of modules) {
      for (const item of getAmsModuleSubnavigation(moduleKey, role)) {
        const target = new URL(item.to, 'https://ams.kapitech.local');
        assert.equal(
          canAccessAmsRoute(role, target.pathname, target.search),
          true,
          role + '/' + moduleKey + '/' + item.key + ' must remain allowed by current route policy',
        );
      }
      for (const parent of getAmsModuleSubnavigation(moduleKey, role)) {
        for (const child of getAmsModuleSubnavigationChildren(moduleKey, parent.key, role)) {
          const target = new URL(child.to, 'https://ams.kapitech.local');
          assert.equal(
            canAccessAmsRoute(role, target.pathname, target.search),
            true,
            role + '/' + moduleKey + '/' + parent.key + '/' + child.key + ' must remain allowed by current route policy',
          );
        }
      }
    }
  }

  const cases: Array<[AmsRole, string, string, string]> = [
    ['Admin', 'dashboard-hub', 'dashboard', 'overview'],
    ['Admin', 'project-hub', 'projects', 'registry'],
    ['Finance', 'project-hub', 'projects', 'tasks'],
    ['Creative', 'project-hub', 'projects', 'tasks'],
    ['Admin', 'clients', 'clients', 'directory'],
    ['Admin', 'team-resources', 'team', 'team'],
    ['Finance', 'team-resources', 'team', 'vendors'],
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
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'PM'), []);
  assert.deepEqual(getAmsModuleSubnavigation('settings', 'Freelancer', true).map((item) => item.key), ['access']);
});

test('primary navigation modules and nested views preserve their owning workspace', () => {
  assert.equal(getAmsWorkspaceNavigationModule('/admin/dashboard'), 'dashboard');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/inbox', '?view=messages'), 'inbox');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/finance', '?tab=accounts-receivable'), 'finance');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/tasks'), 'projects');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/tasks', '?taskscope=my'), null);
  assert.equal(getAmsWorkspaceNavigationModule('/admin/tasks', '?taskscope=my&workspace=project'), 'projects');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/cms/careers', '?tab=applicants'), 'cms');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/team'), 'team');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/team', '?view=capacity-allocation'), 'team');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/vendors', '?view=skill-matrix'), 'team');
  assert.equal(getAmsWorkspaceNavigationModule('/admin/time-logs'), 'team');
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
