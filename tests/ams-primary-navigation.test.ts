import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AMS_PRIMARY_SETTINGS_ITEM,
  canAccessAmsRoute,
  getPrimaryNavigationForRole,
  getAmsRole,
  isNavigationItemActive,
} from '../src/lib/amsNavigationAccess';

const items = (role: Parameters<typeof getPrimaryNavigationForRole>[0]) => getPrimaryNavigationForRole(role);
const labels = (role: Parameters<typeof getPrimaryNavigationForRole>[0]) => items(role).map((item) => item.label);
const key = (role: Parameters<typeof getPrimaryNavigationForRole>[0], target: string) => items(role).find((item) => item.key === target)!;

test('primary modules appear in the exact approved order, with Settings ninth', () => {
  assert.deepEqual(labels('Admin'), [
    'Dashboard', 'Inbox', 'Projects', 'Clients', 'Finance', 'Team & Resources', 'Documents', 'Website CMS',
  ]);
  assert.equal(AMS_PRIMARY_SETTINGS_ITEM.label, 'Settings');
  assert.deepEqual(AMS_PRIMARY_SETTINGS_ITEM.allowedRoles, ['Admin']);
  assert.deepEqual([...labels('Admin'), AMS_PRIMARY_SETTINGS_ITEM.label], [
    'Dashboard', 'Inbox', 'Projects', 'Clients', 'Finance', 'Team & Resources', 'Documents', 'Website CMS', 'Settings',
  ]);
  assert.equal(items('Admin').length + 1, 9);

  const forbiddenPrimaryLabels = ['CRM', 'Sales & Pipeline', 'Proposals', 'Approvals', 'Vendor Ledger', 'Time Tracking', 'Timesheet Control'];
  for (const label of forbiddenPrimaryLabels) assert.equal(labels('Admin').includes(label), false, label + ' must not be a primary item');
});

test('role-specific module visibility follows the existing route policy', () => {
  assert.deepEqual(labels('Finance'), ['Dashboard', 'Inbox', 'Projects', 'Clients', 'Finance', 'Team & Resources']);
  assert.deepEqual(labels('PM'), ['Dashboard', 'Inbox', 'Projects', 'Clients', 'Finance', 'Team & Resources', 'Website CMS']);
  assert.deepEqual(labels('Creative'), ['My Hub', 'Projects', 'Website CMS']);
  assert.deepEqual(labels('Freelancer'), ['My Hub', 'Assigned Tasks']);

  assert.equal(key('Finance', 'projects').to, '/admin/projects?projects=sprint');
  assert.equal(key('Finance', 'team-resources').to, '/admin/vendors');
  assert.equal(key('PM', 'finance').to, '/admin/finance?tab=project-finance');
  assert.equal(key('Creative', 'website-cms').to, '/admin/cms/insights');
  assert.equal(key('Freelancer', 'tasks').to, '/admin/tasks?taskscope=my&workspace=project');
  assert.equal(key('Creative', 'dashboard').to, '/admin/tasks?taskscope=my');
});

test('removed module paths are not offered as primary entries and legacy routes remain policy-guarded', () => {
  const primaryLabels = labels('Admin').join('|');
  assert.doesNotMatch(primaryLabels, /CRM|Proposal|Approval|Vendor Ledger|Time Tracking/i);
  assert.equal(canAccessAmsRoute('Finance', '/admin/finance/quotations'), true);
  assert.equal(canAccessAmsRoute('PM', '/admin/finance/quotations'), false);
  assert.equal(canAccessAmsRoute('Finance', '/admin/settings'), false);
  assert.equal(canAccessAmsRoute('Finance', '/admin/clients/lead-accounts'), true);
  assert.equal(canAccessAmsRoute('Freelancer', '/admin/clients/lead-accounts'), false);
});

test('primary active state remains stable across subviews and canonical Finance quotation path', () => {
  const masterRole = getAmsRole({
    id: 'usr_root_admin',
    role: 'Tier 1: Top Management / Sponsor',
    stakeholderType: 'Master',
  });
  assert.equal(masterRole, 'Admin');
  assert.equal(isNavigationItemActive(key('Admin', 'dashboard'), '/admin/dashboard', '?view=performance'), true);
  assert.equal(isNavigationItemActive(key('Admin', 'projects'), '/admin/projects', '?projects=archived'), true);
  assert.equal(isNavigationItemActive(key('Admin', 'clients'), '/admin/contracts'), true);
  assert.equal(isNavigationItemActive(key('Admin', 'finance'), '/admin/finance/quotations'), true);
  assert.equal(isNavigationItemActive(key('PM', 'finance'), '/admin/finance', '?tab=project-finance'), true);
  assert.equal(isNavigationItemActive(key('PM', 'finance'), '/admin/finance', '?tab=accounts-receivable'), false);
  assert.equal(isNavigationItemActive(AMS_PRIMARY_SETTINGS_ITEM, '/admin/settings', '?tab=audit'), true);
  assert.equal(isNavigationItemActive(AMS_PRIMARY_SETTINGS_ITEM, '/admin/navigation/release-readiness'), true);
});
