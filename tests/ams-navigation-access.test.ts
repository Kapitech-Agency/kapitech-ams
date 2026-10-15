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

const flatten = (role: Parameters<typeof getNavigationGroupsForRole>[0]) =>
  getNavigationGroupsForRole(role).flatMap((group) => group.items);

const keys = (role: Parameters<typeof getNavigationGroupsForRole>[0]) =>
  new Set(flatten(role).map((item) => item.key));

test('role normalization reads the explicit role string and defaults unknown values to least privilege', () => {
  assert.equal(normalizeAmsRole('Admin'), 'Admin');
  assert.equal(normalizeAmsRole('Finance'), 'Finance');
  assert.equal(normalizeAmsRole('PM'), 'PM');
  assert.equal(normalizeAmsRole('Creative'), 'Creative');
  assert.equal(normalizeAmsRole('Freelancer'), 'Freelancer');
  assert.equal(normalizeAmsRole('Tier 1: Top Management / Sponsor'), 'Freelancer');
  assert.equal(normalizeAmsRole(''), 'Freelancer');
});

test('flat navigation declares the five role-aware functional groups in a stable order', () => {
  assert.deepEqual(AMS_NAVIGATION_GROUPS.map((group) => group.label), [
    'OPERATIONAL OVERVIEW',
    'CLIENT & PIPELINE',
    'DELIVERY & OPERATIONS',
    'FINANCE & LEDGER',
    'MARKETING CMS',
  ]);
  assert.equal(AMS_SYSTEM_SETTINGS_ITEMS.length, 3);
  assert.ok(AMS_SYSTEM_SETTINGS_ITEMS.every((item) => item.allowedRoles.length === 1 && item.allowedRoles[0] === 'Admin'));
  assert.ok(AMS_SYSTEM_SETTINGS_ITEMS.some((item) => item.key === 'release-readiness'));
});

test('Admin receives every functional group while System Center remains a separate direct entry', () => {
  const groups = getNavigationGroupsForRole('Admin');
  assert.equal(groups.length, 5);
  assert.equal(groups.at(-1)?.key, 'cms-content');
  assert.equal(keys('Admin').has('release-readiness'), false);
  assert.equal(AMS_SYSTEM_SETTINGS_ITEMS.some((item) => item.key === 'release-readiness'), true);
  assert.equal(canAccessAmsRoute('Admin', '/admin/settings', '?tab=security'), true);
  assert.equal(canAccessAmsRoute('Admin', '/admin/navigation/release-readiness'), true);
  assert.equal(flatten('Admin').find((item) => item.key === 'dashboard-hub')?.to, '/admin/dashboard');
});

test('Finance sees permitted CRM and Finance destinations but never retainer setup or System Center', () => {
  const menu = keys('Finance');
  assert.ok(menu.has('sales-pipeline'));
  assert.ok(menu.has('client-directory'));
  assert.ok(menu.has('crm-inbox'));
  assert.ok(menu.has('crm-contracts'));
  assert.ok(menu.has('crm-sla'));
  assert.ok(menu.has('quotations'));
  assert.ok(menu.has('invoicing-receivables'));
  assert.ok(menu.has('expense-vendor-ledger'));
  assert.ok(menu.has('project-profitability'));
  assert.ok(menu.has('project-hub'));
  assert.equal(menu.has('retainer-manager'), false);
  assert.equal(menu.has('release-readiness'), false);
  assert.equal(canAccessAmsRoute('Finance', '/admin/crm'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/finance', '?tab=accounts-receivable'), true);
  assert.equal(canAccessAmsRoute('Finance', '/admin/settings', '?tab=overview'), false);
  assert.equal(canAccessAmsRoute('Finance', '/admin/tasks', '?taskscope=all'), false);
  assert.equal(flatten('Finance').find((item) => item.key === 'project-hub')?.to, '/admin/projects?projects=sprint');
});

test('PM sees delivery operations, CRM, and aggregate project profitability only', () => {
  const pipeline = flatten('PM').find((item) => item.key === 'sales-pipeline');
  assert.equal(pipeline?.accessNote?.PM, 'Read only');
  assert.equal(canAccessAmsRoute('PM', '/admin/crm'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/projects', '?projects=budget'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance', '?tab=project-finance'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance', '?tab=accounts-receivable'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/settings', '?tab=security'), false);
  assert.ok(keys('PM').has('retainer-manager'));
  assert.ok(keys('PM').has('project-time'));
  assert.equal(keys('PM').has('quotations'), false);
});

test('Creative sees personal task hub, filtered project delivery, and editorial registry without CRM or Finance', () => {
  const menu = keys('Creative');
  assert.ok(menu.has('dashboard-hub'));
  assert.ok(menu.has('project-hub'));
  assert.ok(menu.has('live-activity'));
  assert.ok(menu.has('insight-editorial'));
  assert.ok(menu.has('portfolio-testimonial-registry'));
  assert.ok(menu.has('cms-testimonials'));
  assert.equal(menu.has('sales-pipeline'), false);
  assert.equal(menu.has('client-directory'), false);
  assert.equal(menu.has('project-profitability'), false);
  assert.equal(menu.has('release-readiness'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/dashboard'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/projects', '?projects=sprint'), true);
  assert.equal(canAccessAmsRoute('Creative', '/admin/projects', '?projects=budget'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/cms/insights'), true);
  assert.equal(canAccessAmsRoute('Creative', '/admin/finance', '?tab=project-finance'), false);
  assert.equal(getAmsHomePath('Creative'), '/admin/tasks?taskscope=my');
  assert.equal(flatten('Creative').find((item) => item.key === 'dashboard-hub')?.to, '/admin/tasks?taskscope=my');
});

test('Freelancer sees the role-routed task hub and task-scoped delivery only', () => {
  const menu = flatten('Freelancer');
  const projectHub = menu.find((item) => item.key === 'project-hub');
  assert.equal(projectHub?.label, 'Assigned Tasks');
  assert.equal(projectHub?.to, '/admin/tasks?taskscope=my&workspace=project');
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/tasks', '?taskscope=my'), true);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/tasks', '?taskscope=my&workspace=project'), true);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/tasks', '?taskscope=all'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/projects', '?projects=sprint'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/crm'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/finance', '?tab=project-finance'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/navigation/live-activity'), true);
  assert.equal(getAmsHomePath('Freelancer'), '/admin/tasks?taskscope=my');
  assert.equal(menu.some((item) => item.key.startsWith('cms-')), false);
});

test('direct URL navigation remains blocked by the canonical role route policy', () => {
  assert.equal(canAccessAmsRoute('Creative', '/admin/finance', '?tab=accounts-receivable'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/crm'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/settings', '?tab=overview'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance', '?tab=journal'), false);
});

test('flat navigation active states distinguish onboarding, project query tabs, and a role-routed personal hub', () => {
  const directory = AMS_NAVIGATION_GROUPS.flatMap((group) => group.items).find((item) => item.key === 'client-directory')!;
  const onboarding = AMS_NAVIGATION_GROUPS.flatMap((group) => group.items).find((item) => item.key === 'client-onboarding')!;
  const projectHub = flatten('Admin').find((item) => item.key === 'project-hub')!;
  const creativeHub = flatten('Creative').find((item) => item.key === 'dashboard-hub')!;

  assert.equal(isNavigationItemActive(directory, '/admin/clients/all-clients', '', ''), true);
  assert.equal(isNavigationItemActive(onboarding, '/admin/clients/all-clients', '', '#client-onboarding-readiness'), true);
  assert.equal(isNavigationItemActive(projectHub, '/admin/projects', '?projects=budget', ''), false);
  assert.equal(isNavigationItemActive(projectHub, '/admin/projects', '?projects=sprint', ''), true);
  assert.equal(isNavigationItemActive(creativeHub, '/admin/tasks', '?taskscope=my', ''), true);
});
