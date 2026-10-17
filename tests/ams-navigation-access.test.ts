import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AMS_NAVIGATION_GROUPS,
  AMS_PRIMARY_SETTINGS_ITEM,
  AMS_SYSTEM_SETTINGS_ITEMS,
  canAccessAmsRoute,
  getAmsNavigationDestinationSignature,
  getAmsHomePath,
  getNavigationGroupsForRole,
  isNavigationItemActive,
  normalizeAmsRole,
} from '../src/lib/amsNavigationAccess';
import { getAmsModuleSubnavigation, isAmsModuleSubnavigationItemActive } from '../src/lib/amsModuleSubnavigation';

const flatten = (role: Parameters<typeof getNavigationGroupsForRole>[0]) =>
  getNavigationGroupsForRole(role).flatMap((group) => group.items);
const keys = (role: Parameters<typeof getNavigationGroupsForRole>[0]) => new Set(flatten(role).map((item) => item.key));
const roles = ['Admin', 'Finance', 'PM', 'Creative', 'Freelancer'] as const;
const contextualModules = ['dashboard', 'crm', 'projects', 'finance', 'clients', 'team', 'cms', 'settings', 'tasks'] as const;
const subnav = (
  moduleKey: Parameters<typeof getAmsModuleSubnavigation>[0],
  role: Parameters<typeof getAmsModuleSubnavigation>[1],
  allowMfaSetup = false,
) => getAmsModuleSubnavigation(moduleKey, role, allowMfaSetup);

test('Skill Matrix route is Admin-only even when the vendor directory is available to Finance', () => {
  assert.equal(canAccessAmsRoute('Admin', '/admin/vendors', '?view=skill-matrix'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/vendors'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/vendors', '?view=skill-matrix'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/vendors', '?view=skill-matrix'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/vendors', '?view=skill-matrix'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/vendors', '?view=skill-matrix'), false);
});

test('unknown role values fall back to the least-privileged navigation profile', () => {
  assert.equal(normalizeAmsRole('Admin'), 'Admin');
  assert.equal(normalizeAmsRole('Finance'), 'Finance');
  assert.equal(normalizeAmsRole('PM'), 'PM');
  assert.equal(normalizeAmsRole('Creative'), 'Creative');
  assert.equal(normalizeAmsRole('Freelancer'), 'Freelancer');
  assert.equal(normalizeAmsRole('Tier 1: Top Management / Sponsor'), 'Freelancer');
  assert.equal(normalizeAmsRole(''), 'Freelancer');
});

test('the navigation configuration defines nine primary modules in four grouped workspace sections', () => {
  assert.deepEqual(AMS_NAVIGATION_GROUPS.map((group) => group.label), ['Workspace', 'Delivery', 'Operations', 'Publishing']);
  assert.deepEqual(flatten('Admin').map((item) => item.label), [
    'Dashboard', 'Inbox', 'Projects', 'Clients', 'Finance', 'Team & Resources', 'Documents', 'Website CMS',
  ]);
  assert.equal(AMS_PRIMARY_SETTINGS_ITEM.label, 'Settings');
  assert.equal(flatten('Admin').length + 1, 9);
  assert.equal(AMS_SYSTEM_SETTINGS_ITEMS.length, 2);
  assert.ok(AMS_SYSTEM_SETTINGS_ITEMS.every((item) => item.allowedRoles.length === 1 && item.allowedRoles[0] === 'Admin'));
  assert.deepEqual(AMS_SYSTEM_SETTINGS_ITEMS.map((item) => item.key), ['user-access', 'data-persistence-backup']);
  for (const role of ['Admin', 'Finance', 'PM', 'Creative', 'Freelancer'] as const) {
    assert.equal(keys(role).has('crm'), false, role + ' must not have a CRM primary item');
    assert.equal(keys(role).has('quotations'), false, role + ' must not have a Quotations primary item');
    assert.equal(keys(role).has('approvals'), false, role + ' must not have an Approval primary item');
    assert.equal(keys(role).has('vendor-ledger'), false, role + ' must not have a vendor-ledger primary item');
  }
});

test('Admin access remains broad while protected module routes retain the existing route guard contract', () => {
  assert.equal(getNavigationGroupsForRole('Admin').length, 4);
  assert.equal(getAmsHomePath('Admin'), '/admin/dashboard');
  assert.equal(canAccessAmsRoute('Admin', '/admin/dashboard'), true);
  assert.equal(canAccessAmsRoute('Admin', '/admin/crm'), true);
  assert.equal(canAccessAmsRoute('Admin', '/admin/finance/quotations'), true);
  assert.equal(canAccessAmsRoute('Admin', '/admin/finance', '?tab=accounts-payable'), true);
  assert.equal(canAccessAmsRoute('Admin', '/admin/settings', '?tab=overview'), true);
  assert.equal(canAccessAmsRoute('Admin', '/admin/navigation/release-readiness'), true);
});

test('Finance receives the permitted financial and client workspaces but cannot access Settings or broad task scope', () => {
  assert.deepEqual(flatten('Finance').map((item) => item.label), [
    'Dashboard', 'Inbox', 'Projects', 'Clients', 'Finance', 'Team & Resources',
  ]);
  assert.equal(flatten('Finance').find((item) => item.key === 'team-resources')?.to, '/admin/vendors');
  assert.equal(getAmsHomePath('Finance'), '/admin/dashboard');
  assert.equal(canAccessAmsRoute('Finance', '/admin/crm'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/inbox'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/finance/quotations'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/proposals'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/approvals'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/finance', '?tab=accounts-receivable'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/clients/all-clients'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/clients/retainers'), false);
  assert.equal(canAccessAmsRoute('Finance', '/admin/vendors'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/settings', '?tab=overview'), false);
  assert.equal(canAccessAmsRoute('Finance', '/admin/tasks', '?taskscope=all'), false);
  assert.equal(canAccessAmsRoute('Finance', '/admin/documents'), false);
  assert.equal(canAccessAmsRoute('Finance', '/admin/finance/quotations'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/cms/careers', '?tab=applicants'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/cms/careers'), false);
  assert.equal(canAccessAmsRoute('Finance', '/admin/cms/careers', '?tab=jobs'), false);
});

test('PM can view assigned client, delivery, team and aggregate project finance destinations only', () => {
  assert.deepEqual(flatten('PM').map((item) => item.label), [
    'Dashboard', 'Inbox', 'Projects', 'Clients', 'Finance', 'Team & Resources', 'Website CMS',
  ]);
  assert.equal(flatten('PM').find((item) => item.key === 'finance')?.to, '/admin/finance?tab=project-finance');
  assert.equal(canAccessAmsRoute('PM', '/admin/projects', '?projects=budget'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance', '?tab=project-finance'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance', '?tab=accounts-receivable'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance/quotations'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/clients/retainers'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/time-logs'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/vendors'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/settings', '?tab=security'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/documents'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/cms/insights'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/cms/careers', '?tab=applicants'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/cms/careers'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/cms/services'), false);
});

test('Creative and Freelancer route restrictions remain intact while using the consolidated navigation', () => {
  assert.deepEqual(flatten('Creative').map((item) => item.label), ['My Hub', 'Projects', 'Website CMS']);
  assert.deepEqual(flatten('Freelancer').map((item) => item.label), ['My Hub', 'Assigned Tasks']);
  assert.equal(getAmsHomePath('Creative'), '/admin/tasks?taskscope=my');
  assert.equal(getAmsHomePath('Freelancer'), '/admin/tasks?taskscope=my');
  assert.equal(canAccessAmsRoute('Creative', '/admin/dashboard'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/tasks', '?taskscope=my'), true);
  assert.equal(canAccessAmsRoute('Creative', '/admin/projects', '?projects=sprint'), true);
  assert.equal(canAccessAmsRoute('Creative', '/admin/projects', '?projects=budget'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/cms/insights'), true);
  assert.equal(canAccessAmsRoute('Creative', '/admin/cms/careers', '?tab=applicants'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/finance', '?tab=project-finance'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/crm'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/tasks', '?taskscope=my&workspace=project'), true);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/tasks', '?taskscope=all'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/projects', '?projects=sprint'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/cms/insights'), false);
});

test('contextual navigation preserves the default view of each module', () => {
  const cases: Array<[typeof contextualModules[number], typeof roles[number], string]> = [
    ['dashboard', 'Admin', 'overview'],
    ['projects', 'Admin', 'all'],
    ['clients', 'Admin', 'directory'],
    ['team', 'Admin', 'team'],
    ['cms', 'Admin', 'projects'],
  ];
  for (const [moduleKey, role, key] of cases) {
    assert.ok(subnav(moduleKey, role).some((item) => item.key === key), role + '/' + moduleKey + ' is missing its default view');
  }
});

test('module subnavigation respects feature ownership and role-specific scope', () => {
  assert.deepEqual(subnav('dashboard', 'Admin').map((item) => item.key), ['overview', 'performance', 'analytics']);
  assert.deepEqual(subnav('crm', 'Admin'), []);
  assert.deepEqual(subnav('finance', 'Finance').map((item) => item.key), ['overview', 'transactions', 'receivables', 'projects', 'accounting']);
  assert.deepEqual(subnav('finance', 'PM').map((item) => item.key), ['projects']);
  assert.deepEqual(subnav('projects', 'Admin').map((item) => item.key), ['all', 'sprint', 'budget', 'archived', 'tasks']);
  assert.deepEqual(subnav('projects', 'Finance').map((item) => item.key), ['sprint', 'tasks']);
  assert.deepEqual(subnav('projects', 'Creative').map((item) => item.key), ['sprint', 'tasks']);
  assert.deepEqual(subnav('projects', 'Freelancer').map((item) => item.key), ['tasks']);
  assert.deepEqual(subnav('clients', 'Admin').map((item) => item.key), ['directory', 'onboarding', 'contracts', 'retainers', 'sla']);
  assert.deepEqual(subnav('clients', 'Finance').map((item) => item.key), ['directory', 'onboarding', 'contracts', 'sla']);
  assert.deepEqual(subnav('team', 'Admin').map((item) => item.key), ['team', 'capacity', 'skills', 'vendors', 'time']);
  assert.deepEqual(subnav('team', 'PM').map((item) => item.key), ['team', 'capacity', 'time']);
  assert.deepEqual(subnav('team', 'Finance').map((item) => item.key), ['vendors']);
  assert.deepEqual(subnav('cms', 'Admin').map((item) => item.key), ['projects', 'insights', 'testimonials', 'services', 'careers']);
  assert.deepEqual(subnav('cms', 'Creative').map((item) => item.key), ['insights', 'projects', 'testimonials']);
  assert.deepEqual(subnav('settings', 'Admin').map((item) => item.key), ['backup', 'access', 'audit', 'integrations']);
  assert.deepEqual(subnav('settings', 'PM'), []);
});

test('contextual active states follow URL query state for Dashboard, Projects, Clients, Team and Settings', () => {
  const dashboard = subnav('dashboard', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(dashboard.find((item) => item.key === 'performance')!, '/admin/dashboard', '?view=performance'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(dashboard.find((item) => item.key === 'performance')!, '/admin/dashboard', '?view=analytics'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(dashboard.find((item) => item.key === 'analytics')!, '/admin/dashboard', '?view=analytics'), true);

  const projects = subnav('projects', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(projects.find((item) => item.key === 'sprint')!, '/admin/projects', '?projects=sprint'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(projects.find((item) => item.key === 'sprint')!, '/admin/projects', '?projects=budget'), false);
  assert.equal(isAmsModuleSubnavigationItemActive(projects.find((item) => item.key === 'budget')!, '/admin/projects', '?projects=budget'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(projects.find((item) => item.key === 'archived')!, '/admin/projects', '?projects=archived'), true);

  const clients = subnav('clients', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(clients.find((item) => item.key === 'onboarding')!, '/admin/clients/all-clients', '?scope=onboarding'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(clients.find((item) => item.key === 'onboarding')!, '/admin/clients/all-clients'), false);

  const team = subnav('team', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(team.find((item) => item.key === 'capacity')!, '/admin/team', '?view=capacity-allocation'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(team.find((item) => item.key === 'capacity')!, '/admin/team', ''), false);

  const settings = subnav('settings', 'Admin');
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'access')!, '/admin/settings', '?tab=security'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'audit')!, '/admin/settings', '?tab=audit'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(settings.find((item) => item.key === 'integrations')!, '/admin/settings', '?tab=integrations'), true);
});

test('MFA setup may expose its exceptional Access route without granting Settings module access', () => {
  assert.deepEqual(subnav('settings', 'Freelancer', true).map((item) => item.key), ['access']);
  assert.deepEqual(subnav('settings', 'PM'), []);
});
