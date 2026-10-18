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
  for (const key of ['overview', 'planning-delivery', 'content-campaigns', 'resources']) {
    assert.equal(projects.find((item) => item.key === key)?.available, false, key + ' must not imply a live workspace');
  }
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
  for (const supportedView of ['messages', 'client', 'starred']) {
    assert.equal(isAmsModuleSubnavigationItemActive(messages, '/admin/inbox', '?view=' + supportedView), true,
      supportedView + ' must remain owned by Messages');
    assert.equal(isAmsModuleSubnavigationItemActive(overview, '/admin/inbox', '?view=' + supportedView), false);
  }
  for (const unsupportedView of ['client-requests', 'project-support', 'unread', 'resolved', 'archived', 'unsupported']) {
    assert.equal(isAmsModuleSubnavigationItemActive(overview, '/admin/inbox', '?view=' + unsupportedView), true,
      unsupportedView + ' is not implemented and must follow the Inbox page fallback to Overview');
    assert.equal(isAmsModuleSubnavigationItemActive(messages, '/admin/inbox', '?view=' + unsupportedView), false,
      unsupportedView + ' must not falsely activate Messages');
  }
  assert.equal(isAmsModuleSubnavigationItemActive(inbox.find((item) => item.key === 'follow-ups')!, '/admin/inbox', '?view=follow-ups'), false,
    'target-only workspaces never appear as active functional workspaces');

  const inboxSource = await read('src/pages/admin/AdminInbox.tsx');
  assert.match(inboxSource, /type InboxTab = 'overview' \| 'messages' \| 'client' \| 'starred'/);
  assert.match(inboxSource, /ariaLabel="Message categories"/);
  assert.match(inboxSource, /label: 'Project & Support'.*available: false/);
  assert.doesNotMatch(inboxSource, /key: 'starred', label: 'Starred'/,
    'Starred is a saved view inside Messages, not a message category worksheet.');
  assert.doesNotMatch(inboxSource, /key: 'resolved-archived'/,
    'Resolved and Archived belong to status filters, not a combined worksheet tab.');
  assert.ok(inboxSource.includes('to="/admin/inbox?view=starred"'),
    'The existing Starred view remains reachable from Messages controls.');
  assert.match(inboxSource, /activeInboxTab === 'messages' \|\| activeInboxTab === 'client'/);
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
  assert.equal(isAmsModuleSubnavigationItemActive(registry, '/admin/projects'), true);
  for (const status of ['planning', 'active', 'on-hold', 'completed', 'archived']) {
    assert.equal(isAmsModuleSubnavigationItemActive(registry, '/admin/projects', '?projects=' + status), true,
      'status filter ' + status + ' stays within Project Registry');
  }
  assert.equal(isAmsModuleSubnavigationItemActive(tasks, '/admin/projects', '?projects=sprint'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(controls, '/admin/projects', '?projects=budget'), true);

  const projectSource = await read('src/pages/admin/AdminProjects.tsx');
  assert.match(projectSource, /registryStatusView/);
  assert.match(projectSource, /searchParams\.get\('projects'\)/);
  assert.match(projectSource, /matchesRegistryStatus/);
});


test('Clients and Team & Resources use persistent workspaces while internal views remain inside their pages', async () => {
  const clients = getAmsModuleSubnavigation('clients', 'Admin');
  assert.deepEqual(clients.map((item) => item.key), ['directory', 'onboarding', 'agreements', 'service-health']);
  assert.equal(isAmsModuleSubnavigationItemActive(clients.find((item) => item.key === 'onboarding')!, '/admin/clients/all-clients', '?scope=onboarding'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(clients.find((item) => item.key === 'agreements')!, '/admin/contracts'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(clients.find((item) => item.key === 'service-health')!, '/admin/clients/sla-monitoring'), true);

  const team = getAmsModuleSubnavigation('team', 'Admin');
  assert.deepEqual(team.map((item) => item.key), ['team', 'people-ops', 'vendors', 'time']);
  assert.equal(team.find((item) => item.key === 'people-ops')?.available, false);
  assert.equal(isAmsModuleSubnavigationItemActive(team.find((item) => item.key === 'team')!, '/admin/team'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(team.find((item) => item.key === 'vendors')!, '/admin/vendors', '?view=skill-matrix'), true);

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
  assert.equal(isAmsModuleSubnavigationItemActive(finance.find((item) => item.key === 'receivables')!, '/admin/finance/quotations'), true);
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
