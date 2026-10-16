import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AMS_NAVIGATION_GROUPS,
  AMS_SYSTEM_SETTINGS_ITEMS,
  canAccessAmsRoute,
  getAmsHomePath,
  getNavigationGroupsForRole,
  isNavigationItemActive,
  normalizeAmsRole,
} from '../src/lib/amsNavigationAccess';
import { getAmsModuleSubnavigation, isAmsModuleSubnavigationItemActive } from '../src/lib/amsModuleSubnavigation';

const flatten = (role: Parameters<typeof getNavigationGroupsForRole>[0]) =>
  getNavigationGroupsForRole(role).flatMap((group) => group.items);
const keys = (role: Parameters<typeof getNavigationGroupsForRole>[0]) => new Set(flatten(role).map((item) => item.key));
const tabKeys = (moduleKey: Parameters<typeof getAmsModuleSubnavigation>[0], role: Parameters<typeof getAmsModuleSubnavigation>[1]) =>
  new Set(getAmsModuleSubnavigation(moduleKey, role).map((item) => item.key));

test('role normalization defaults unknown values to the least-privileged navigation profile', () => {
  assert.equal(normalizeAmsRole('Admin'), 'Admin');
  assert.equal(normalizeAmsRole('Finance'), 'Finance');
  assert.equal(normalizeAmsRole('PM'), 'PM');
  assert.equal(normalizeAmsRole('Creative'), 'Creative');
  assert.equal(normalizeAmsRole('Freelancer'), 'Freelancer');
  assert.equal(normalizeAmsRole('Tier 1: Top Management / Sponsor'), 'Freelancer');
  assert.equal(normalizeAmsRole(''), 'Freelancer');
});

test('flat sidebar has five ordered groups and System Center is separate and Admin-only', () => {
  assert.deepEqual(AMS_NAVIGATION_GROUPS.map((group) => group.label), [
    'OPERATIONAL OVERVIEW',
    'CLIENT & PIPELINE',
    'DELIVERY & OPERATIONS',
    'FINANCE & LEDGER',
    'MARKETING CMS',
  ]);
  assert.equal(AMS_SYSTEM_SETTINGS_ITEMS.length, 3);
  assert.ok(AMS_SYSTEM_SETTINGS_ITEMS.every((item) => item.allowedRoles.length === 1 && item.allowedRoles[0] === 'Admin'));
  assert.deepEqual(AMS_SYSTEM_SETTINGS_ITEMS.map((item) => item.key), ['user-access', 'data-persistence-backup', 'release-readiness']);
});

test('Admin receives one direct link per workspace group; Settings remains separate', () => {
  assert.equal(getNavigationGroupsForRole('Admin').length, 5);
  assert.deepEqual([...keys('Admin')], ['dashboard-hub', 'crm', 'project-hub', 'finance', 'cms']);
  assert.equal(getAmsHomePath('Admin'), '/admin/dashboard');
  assert.equal(canAccessAmsRoute('Admin', '/admin/settings', '?tab=security'), true);
  assert.equal(canAccessAmsRoute('Admin', '/admin/navigation/release-readiness'), true);
});

test('Finance sees only permitted workspaces while CRM and Finance child tabs stay contextual', () => {
  const menu = keys('Finance');
  assert.ok(menu.has('dashboard-hub'));
  assert.ok(menu.has('crm'));
  assert.ok(menu.has('project-hub'));
  assert.ok(menu.has('finance'));
  assert.equal(menu.has('cms'), false);
  assert.equal(menu.has('project-time'), false);
  assert.equal(menu.has('project-profitability'), false);
  assert.deepEqual([...tabKeys('crm', 'Finance')], ['pipeline', 'clients', 'onboarding', 'inbox', 'contracts', 'sla']);
  assert.deepEqual([...tabKeys('finance', 'Finance')], ['invoicing-revenues', 'profitability-expenses', 'project-profitability', 'quotes', 'vendors', 'approvals']);
  assert.equal(canAccessAmsRoute('Finance', '/admin/crm'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/finance', '?tab=accounts-receivable'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/settings', '?tab=overview'), false);
  assert.equal(canAccessAmsRoute('Finance', '/admin/tasks', '?taskscope=all'), false);
  assert.equal(flatten('Finance').find((item) => item.key === 'project-hub')?.to, '/admin/projects?projects=sprint');
});

test('PM sees delivery tools, editorial CMS, and an aggregated Project Profitability destination', () => {
  assert.deepEqual([...keys('PM')], ['dashboard-hub', 'crm', 'project-hub', 'finance', 'cms']);
  assert.deepEqual([...tabKeys('finance', 'PM')], ['project-profitability']);
  assert.ok(tabKeys('projects', 'PM').has('retainers'));
  assert.ok(tabKeys('projects', 'PM').has('capacity'));
  assert.ok(tabKeys('projects', 'PM').has('time'));
  assert.equal(canAccessAmsRoute('PM', '/admin/projects', '?projects=budget'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance', '?tab=project-finance'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance', '?tab=accounts-receivable'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/settings', '?tab=security'), false);
  assert.equal(flatten('PM').find((item) => item.key === 'finance')?.to, '/admin/finance?tab=project-finance');
});

test('Creative has a personal hub, filtered delivery workspace, and editorial CMS access', () => {
  assert.deepEqual([...keys('Creative')], ['dashboard-hub', 'project-hub', 'cms']);
  assert.equal(getAmsHomePath('Creative'), '/admin/tasks?taskscope=my');
  assert.equal(flatten('Creative').find((item) => item.key === 'dashboard-hub')?.label, 'My Hub');
  assert.equal(flatten('Creative').find((item) => item.key === 'dashboard-hub')?.to, '/admin/tasks?taskscope=my');
  assert.equal(flatten('Creative').find((item) => item.key === 'project-hub')?.to, '/admin/projects?projects=sprint');
  assert.deepEqual([...tabKeys('projects', 'Creative')], ['sprint', 'tasks']);
  assert.deepEqual([...tabKeys('cms', 'Creative')], ['insights', 'projects', 'testimonials']);
  assert.equal(canAccessAmsRoute('Creative', '/admin/dashboard'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/projects', '?projects=sprint'), true);
  assert.equal(canAccessAmsRoute('Creative', '/admin/projects', '?projects=budget'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/cms/insights'), true);
  assert.equal(canAccessAmsRoute('Creative', '/admin/finance', '?tab=project-finance'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/crm'), false);
});

test('Freelancer navigation separates My Hub from directly assigned work', () => {
  const menu = flatten('Freelancer');
  assert.deepEqual([...keys('Freelancer')], ['dashboard-hub', 'tasks']);
  assert.equal(getAmsHomePath('Freelancer'), '/admin/tasks?taskscope=my');
  assert.equal(menu.find((item) => item.key === 'dashboard-hub')?.label, 'My Hub');
  assert.equal(menu.find((item) => item.key === 'dashboard-hub')?.to, '/admin/tasks?taskscope=my');
  assert.equal(menu.find((item) => item.key === 'tasks')?.label, 'Assigned Tasks');
  assert.equal(menu.find((item) => item.key === 'tasks')?.to, '/admin/tasks?taskscope=my&workspace=project');
  assert.deepEqual([...tabKeys('projects', 'Freelancer')], ['tasks']);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/tasks', '?taskscope=my&workspace=project'), true);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/tasks', '?taskscope=all'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/projects', '?projects=sprint'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/crm'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/finance', '?tab=project-finance'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/navigation/live-activity'), true);
  assert.equal(keys('Freelancer').has('cms'), false);
});

test('sidebar links keep workspace active state across contextual tabs', () => {
  const admin = flatten('Admin');
  const find = (key: string) => admin.find((item) => item.key === key)!;

  assert.equal(isNavigationItemActive(find('crm'), '/admin/clients/all-clients', '', ''), true);
  assert.equal(isNavigationItemActive(find('project-hub'), '/admin/time-logs', '', ''), true);
  assert.equal(isNavigationItemActive(find('project-hub'), '/admin/documents', '', ''), true);
  assert.equal(isNavigationItemActive(find('finance'), '/admin/finance', '?tab=accounts-payable', ''), true);
  assert.equal(isNavigationItemActive(find('finance'), '/admin/proposals', '', ''), true);
  assert.equal(isNavigationItemActive(find('cms'), '/admin/cms/testimonials', '', ''), true);
});

test('direct URL navigation remains subject to the canonical route policy', () => {
  assert.equal(canAccessAmsRoute('Creative', '/admin/finance', '?tab=accounts-receivable'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/crm'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/settings', '?tab=overview'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance', '?tab=journal'), false);
});

test('query and hash state activate only the corresponding workspace tab', () => {
  const directory = getAmsModuleSubnavigation('crm', 'Admin').find((item) => item.key === 'clients')!;
  const onboarding = getAmsModuleSubnavigation('crm', 'Admin').find((item) => item.key === 'onboarding')!;
  const delivery = getAmsModuleSubnavigation('projects', 'Admin').find((item) => item.key === 'sprint')!;
  const budget = getAmsModuleSubnavigation('projects', 'Admin').find((item) => item.key === 'budget')!;
  const dashboard = flatten('Creative').find((item) => item.key === 'dashboard-hub')!;
  assert.equal(isAmsModuleSubnavigationItemActive(directory, '/admin/clients/all-clients', '', ''), true);
  assert.equal(isAmsModuleSubnavigationItemActive(onboarding, '/admin/clients/all-clients', '', '#client-onboarding-readiness'), true);
  assert.equal(isAmsModuleSubnavigationItemActive(delivery, '/admin/projects', '?projects=sprint', ''), true);
  assert.equal(isAmsModuleSubnavigationItemActive(budget, '/admin/projects', '?projects=budget', ''), true);
  assert.equal(isNavigationItemActive(dashboard, '/admin/tasks', '?taskscope=my', ''), true);
});
