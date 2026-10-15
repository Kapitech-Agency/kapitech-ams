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

test('navigation declares the six required functional groups in a stable order', () => {
  assert.deepEqual(AMS_NAVIGATION_GROUPS.map((group) => group.label), [
    'MAIN DASHBOARD',
    'CLIENT & PIPELINE (CRM)',
    'PROJECTS & WORKSPACE',
    'FINANCE & LEDGER CONTROL',
    'CMS & CONTENT MANAGEMENT',
  ]);
  assert.equal(AMS_SYSTEM_SETTINGS_ITEMS.length, 3);
  assert.ok(AMS_SYSTEM_SETTINGS_ITEMS.every((item) => item.allowedRoles.length === 1 && item.allowedRoles[0] === 'Admin'));
});

test('Admin receives every menu group, including the visually separate System Settings group', () => {
  const groups = getNavigationGroupsForRole('Admin');
  assert.equal(groups.length, 6);
  assert.equal(groups.at(-1)?.key, 'system-settings');
  assert.ok(keys('Admin').has('release-readiness'));
  assert.equal(canAccessAmsRoute('Admin', '/admin/settings', '?tab=security'), true);
  assert.equal(canAccessAmsRoute('Admin', '/admin/navigation/release-readiness'), true);
});

test('Finance sees CRM and Finance Hub but never retainer setup or System Settings', () => {
  const menu = keys('Finance');
  assert.ok(menu.has('sales-pipeline'));
  assert.ok(menu.has('client-directory'));
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
});

test('PM sees the delivery workspace, read-only CRM indicator, and project profitability only', () => {
  const pipeline = flatten('PM').find((item) => item.key === 'sales-pipeline');
  assert.equal(pipeline?.accessNote?.PM, 'Read only');
  assert.equal(canAccessAmsRoute('PM', '/admin/crm'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/projects', '?projects=budget'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance', '?tab=project-finance'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance', '?tab=accounts-receivable'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/settings', '?tab=security'), false);
  assert.ok(keys('PM').has('retainer-manager'));
  assert.equal(keys('PM').has('quotations'), false);
});

test('Creative sees personal work, assigned project delivery, and editorial registry only', () => {
  const menu = keys('Creative');
  assert.ok(menu.has('my-hub'));
  assert.ok(menu.has('project-hub'));
  assert.ok(menu.has('live-activity'));
  assert.ok(menu.has('insight-editorial'));
  assert.ok(menu.has('portfolio-testimonial-registry'));
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
});

test('Freelancer is constrained to My Hub, live activity, and a task-scoped Project Hub', () => {
  const menu = flatten('Freelancer');
  const projectHub = menu.find((item) => item.key === 'project-hub');
  assert.equal(projectHub?.to, '/admin/tasks?taskscope=my&workspace=project');
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/tasks', '?taskscope=my'), true);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/tasks', '?taskscope=my&workspace=project'), true);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/tasks', '?taskscope=all'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/projects', '?projects=sprint'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/crm'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/finance', '?tab=project-finance'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/navigation/live-activity'), true);
  assert.equal(getAmsHomePath('Freelancer'), '/admin/tasks?taskscope=my');
});

test('direct URL navigation is blocked by route policy and returns users to their permitted workspace', () => {
  assert.equal(canAccessAmsRoute('Creative', '/admin/finance', '?tab=accounts-receivable'), false);
  assert.equal(canAccessAmsRoute('Creative', '/admin/crm'), false);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/settings', '?tab=overview'), false);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance', '?tab=journal'), false);
});

test('navigation active states distinguish the two client-directory entry points and Project Hub task scope', () => {
  const menuCreative = flatten('Creative');
  const directory = menuCreative.find((item) => item.key === 'client-directory') ?? {
    key: 'client-directory', to: '/admin/clients/all-clients',
  };
  const onboarding = AMS_NAVIGATION_GROUPS.flatMap((group) => group.items).find((item) => item.key === 'client-onboarding')!;
  const freelancerProject = flatten('Freelancer').find((item) => item.key === 'project-hub')!;

  assert.equal(isNavigationItemActive(directory, '/admin/clients/all-clients', '', ''), true);
  assert.equal(isNavigationItemActive(onboarding, '/admin/clients/all-clients', '', '#client-onboarding-readiness'), true);
  assert.equal(isNavigationItemActive(freelancerProject, '/admin/tasks', '?taskscope=my&workspace=project', ''), true);
});
