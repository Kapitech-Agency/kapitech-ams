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

test('unknown role values fall back to the least-privileged navigation profile', () => {
  assert.equal(normalizeAmsRole('Admin'), 'Admin');
  assert.equal(normalizeAmsRole('Finance'), 'Finance');
  assert.equal(normalizeAmsRole('PM'), 'PM');
  assert.equal(normalizeAmsRole('Creative'), 'Creative');
  assert.equal(normalizeAmsRole('Freelancer'), 'Freelancer');
  assert.equal(normalizeAmsRole('Tier 1: Top Management / Sponsor'), 'Freelancer');
  assert.equal(normalizeAmsRole(''), 'Freelancer');
});

test('flat sidebar has five grouped areas and a separate Admin-only Settings center', () => {
  assert.deepEqual(AMS_NAVIGATION_GROUPS.map((group) => group.label), [
    'OPERATIONAL OVERVIEW', 'CLIENT & PIPELINE', 'DELIVERY & OPERATIONS', 'FINANCE & LEDGER', 'MARKETING CMS',
  ]);
  assert.equal(AMS_SYSTEM_SETTINGS_ITEMS.length, 3);
  assert.ok(AMS_SYSTEM_SETTINGS_ITEMS.every((item) => item.allowedRoles.length === 1 && item.allowedRoles[0] === 'Admin'));
  assert.deepEqual(AMS_SYSTEM_SETTINGS_ITEMS.map((item) => item.key), ['user-access', 'data-persistence-backup', 'release-readiness']);
});

test('Admin sidebar includes direct links for priority features in every functional group', () => {
  assert.deepEqual([...keys('Admin')], [
    'dashboard-hub', 'my-hub',
    'crm', 'client-directory', 'client-onboarding', 'inbox', 'contracts', 'sla-monitoring',
    'project-hub', 'tasks-engine', 'project-files', 'team-capacity', 'timesheet-control', 'retainer-manager',
    'finance', 'finance-revenue', 'finance-expenses', 'project-profitability', 'quotations', 'vendor-ledger', 'approvals',
    'cms', 'portfolio', 'testimonials', 'services', 'careers',
  ]);
  assert.equal(getNavigationGroupsForRole('Admin').length, 5);
  assert.equal(getAmsHomePath('Admin'), '/admin/dashboard');
  assert.equal(canAccessAmsRoute('Admin', '/admin/settings', '?tab=security'), true);
  assert.equal(canAccessAmsRoute('Admin', '/admin/navigation/release-readiness'), true);
});

test('Finance sidebar exposes commercial and finance workflows but not Admin-only tools', () => {
  const menu = keys('Finance');
  for (const key of [
    'dashboard-hub', 'my-hub', 'crm', 'client-directory', 'client-onboarding', 'inbox', 'contracts', 'sla-monitoring',
    'project-hub', 'assigned-tasks', 'finance', 'finance-revenue', 'finance-expenses',
    'project-profitability', 'quotations', 'vendor-ledger', 'approvals',
  ]) assert.ok(menu.has(key), `Finance should see ${key}`);
  for (const key of ['project-files', 'team-capacity', 'timesheet-control', 'retainer-manager', 'cms', 'services', 'careers']) {
    assert.equal(menu.has(key), false, `Finance should not see ${key}`);
  }
  assert.deepEqual([...tabKeys('crm', 'Finance')], []);
  assert.deepEqual([...tabKeys('finance', 'Finance')], []);
  assert.equal(canAccessAmsRoute('Finance', '/admin/crm'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/finance', '?tab=accounts-receivable'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/settings', '?tab=overview'), false);
  assert.equal(canAccessAmsRoute('Finance', '/admin/tasks', '?taskscope=all'), false);
  assert.equal(flatten('Finance').find((item) => item.key === 'project-hub')?.to, '/admin/projects?projects=sprint');
  assert.equal(flatten('Finance').find((item) => item.key === 'assigned-tasks')?.to, '/admin/tasks?taskscope=my&workspace=project');
});

test('PM sidebar exposes operations and aggregate project profitability without revenue-detail shortcuts', () => {
  assert.deepEqual([...keys('PM')], [
    'dashboard-hub', 'my-hub',
    'crm', 'client-directory', 'client-onboarding', 'inbox', 'contracts', 'sla-monitoring',
    'project-hub', 'tasks-engine', 'team-capacity', 'timesheet-control', 'retainer-manager',
    'project-profitability', 'cms', 'portfolio', 'testimonials',
  ]);
  assert.deepEqual([...tabKeys('finance', 'PM')], []);
  assert.deepEqual([...tabKeys('projects', 'PM')], ['sprint', 'budget', 'archived', 'team']);
  assert.equal(canAccessAmsRoute('PM', '/admin/projects', '?projects=budget'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance', '?tab=project-finance'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance', '?tab=accounts-receivable'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/settings', '?tab=security'), false);
  assert.equal(flatten('PM').some((item) => item.key === 'finance-revenue'), false);
  assert.equal(flatten('PM').find((item) => item.key === 'project-profitability')?.accessNote?.PM, 'Aggregated view');
});

test('Creative sees personal work and only the editorial and project shortcuts allowed by route policy', () => {
  assert.deepEqual([...keys('Creative')], ['dashboard-hub', 'project-hub', 'assigned-tasks', 'cms', 'portfolio', 'testimonials']);
  assert.equal(getAmsHomePath('Creative'), '/admin/tasks?taskscope=my');
  assert.equal(flatten('Creative').find((item) => item.key === 'dashboard-hub')?.label, 'My Hub');
  assert.equal(flatten('Creative').find((item) => item.key === 'dashboard-hub')?.to, '/admin/tasks?taskscope=my');
  assert.equal(flatten('Creative').find((item) => item.key === 'project-hub')?.to, '/admin/projects?projects=sprint');
  assert.deepEqual([...tabKeys('projects', 'Creative')], []);
  assert.deepEqual([...tabKeys('cms', 'Creative')], []);
  assert.equal(canAccessAmsRoute('Creative', '/admin/dashboard'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/projects', '?projects=sprint'), true);
  assert.equal(canAccessAmsRoute('Creative', '/admin/projects', '?projects=budget'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/cms/insights'), true);
  assert.equal(canAccessAmsRoute('Creative', '/admin/finance', '?tab=project-finance'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/crm'), false);
  assert.equal(keys('Creative').has('services'), false);
});

test('Freelancer sees a focused My Hub and Assigned Tasks sidebar', () => {
  const menu = flatten('Freelancer');
  assert.deepEqual([...keys('Freelancer')], ['dashboard-hub', 'assigned-tasks']);
  assert.equal(getAmsHomePath('Freelancer'), '/admin/tasks?taskscope=my');
  assert.equal(menu.find((item) => item.key === 'dashboard-hub')?.label, 'My Hub');
  assert.equal(menu.find((item) => item.key === 'dashboard-hub')?.to, '/admin/tasks?taskscope=my');
  assert.equal(menu.find((item) => item.key === 'assigned-tasks')?.label, 'Assigned Tasks');
  assert.equal(menu.find((item) => item.key === 'assigned-tasks')?.to, '/admin/tasks?taskscope=my&workspace=project');
  assert.deepEqual([...tabKeys('projects', 'Freelancer')], []);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/tasks', '?taskscope=my&workspace=project'), true);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/tasks', '?taskscope=all'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/projects', '?projects=sprint'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/crm'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/finance', '?tab=project-finance'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/navigation/live-activity'), true);
  assert.equal(keys('Freelancer').has('cms'), false);
});

test('feature shortcuts have distinct active states and hash-aware client onboarding', () => {
  const admin = flatten('Admin');
  const find = (key: string) => admin.find((item) => item.key === key)!;
  const activeKeys = (pathname: string, search = '', hash = '') =>
    admin.filter((item) => isNavigationItemActive(item, pathname, search, hash)).map((item) => item.key);

  assert.equal(isNavigationItemActive(find('crm'), '/admin/crm', '', ''), true);
  assert.equal(isNavigationItemActive(find('client-directory'), '/admin/clients/all-clients', '', ''), true);
  assert.equal(isNavigationItemActive(find('client-onboarding'), '/admin/clients/all-clients', '', '#client-onboarding-readiness'), true);
  assert.equal(isNavigationItemActive(find('tasks-engine'), '/admin/tasks', '?taskscope=due', ''), true);
  assert.equal(isNavigationItemActive(find('project-files'), '/admin/documents', '', ''), true);
  assert.equal(isNavigationItemActive(find('team-capacity'), '/admin/team', '?view=capacity-allocation', ''), true);
  assert.equal(isNavigationItemActive(find('finance-revenue'), '/admin/finance', '?tab=accounts-receivable', ''), true);
  assert.equal(isNavigationItemActive(find('finance-expenses'), '/admin/finance', '?tab=accounts-payable', ''), true);
  assert.equal(isNavigationItemActive(find('project-profitability'), '/admin/finance', '?tab=project-finance', ''), true);
  assert.equal(isNavigationItemActive(find('quotations'), '/admin/proposals', '', ''), true);
  assert.equal(isNavigationItemActive(find('vendor-ledger'), '/admin/vendors', '', ''), true);
  assert.equal(isNavigationItemActive(find('testimonials'), '/admin/cms/testimonials', '', ''), true);
  assert.deepEqual(activeKeys('/admin/clients/all-clients'), ['client-directory']);
  assert.deepEqual(activeKeys('/admin/clients/all-clients', '', '#client-onboarding-readiness'), ['client-onboarding']);
  assert.deepEqual(activeKeys('/admin/finance', '?tab=accounts-receivable'), ['finance-revenue']);
  assert.deepEqual(activeKeys('/admin/finance', '?tab=accounts-payable'), ['finance-expenses']);
  assert.deepEqual(activeKeys('/admin/finance', '?tab=project-finance'), ['project-profitability']);
});

test('direct URL navigation remains subject to the canonical route policy', () => {
  assert.equal(canAccessAmsRoute('Creative', '/admin/finance', '?tab=accounts-receivable'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/crm'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/settings', '?tab=overview'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance', '?tab=journal'), false);
});

test('contextual workspace tabs continue to honour query and hash state', () => {
  const directory = flatten('Admin').find((item) => item.key === 'client-directory')!;
  const onboarding = flatten('Admin').find((item) => item.key === 'client-onboarding')!;
  const delivery = getAmsModuleSubnavigation('projects', 'Admin').find((item) => item.key === 'sprint')!;
  const budget = getAmsModuleSubnavigation('projects', 'Admin').find((item) => item.key === 'budget')!;
  const dashboard = flatten('Creative').find((item) => item.key === 'dashboard-hub')!;
  assert.equal(isNavigationItemActive(directory, '/admin/clients/all-clients', '', ''), true);
  assert.equal(isNavigationItemActive(onboarding, '/admin/clients/all-clients', '', '#client-onboarding-readiness'), true);
  assert.deepEqual([...tabKeys('crm', 'Admin')], []);
  assert.equal(isAmsModuleSubnavigationItemActive(delivery, '/admin/projects', '?projects=sprint', ''), true);
  assert.equal(isAmsModuleSubnavigationItemActive(budget, '/admin/projects', '?projects=budget', ''), true);
  assert.equal(isNavigationItemActive(dashboard, '/admin/tasks', '?taskscope=my', ''), true);
});
