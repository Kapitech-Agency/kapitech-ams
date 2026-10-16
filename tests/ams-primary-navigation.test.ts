import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AMS_PRIMARY_SETTINGS_ITEM,
  getPrimaryNavigationForRole,
  getAmsRole,
  isNavigationItemActive,
} from '../src/lib/amsNavigationAccess';

const labels = (role: Parameters<typeof getPrimaryNavigationForRole>[0]) =>
  getPrimaryNavigationForRole(role).map((item) => item.label);
const keys = (role: Parameters<typeof getPrimaryNavigationForRole>[0]) =>
  getPrimaryNavigationForRole(role).map((item) => item.key);

test('sidebar exposes important feature destinations directly and keeps Settings separate', () => {
  const adminLabels = labels('Admin');
  for (const label of [
    'Dashboard & Hub', 'My Hub', 'Sales & Pipeline', 'Client Directory', 'Client Onboarding',
    'Inbox', 'Contracts', 'SLA Monitoring', 'Project Hub', 'Tasks', 'Project Files', 'Team & Capacity',
    'Timesheet Control', 'Retainer Hours Pool', 'Finance Overview', 'Invoicing & Revenues',
    'Profitability & Expenses', 'Project Profitability', 'Quotations', 'Vendor Ledger', 'Approvals',
    'Insights', 'Portfolio', 'Testimonials', 'Services', 'Careers',
  ]) assert.ok(adminLabels.includes(label), 'Missing direct sidebar destination: ' + label);
  assert.equal(AMS_PRIMARY_SETTINGS_ITEM.label, 'Settings');
  assert.equal(AMS_PRIMARY_SETTINGS_ITEM.allowedRoles.includes('Admin'), true);
  assert.equal(AMS_PRIMARY_SETTINGS_ITEM.allowedRoles.includes('PM'), false);
});

test('role-specific sidebars remain relevant to each responsibility', () => {
  assert.deepEqual(labels('Freelancer'), ['My Hub', 'Assigned Tasks']);
  assert.ok(labels('Finance').includes('Invoicing & Revenues'));
  assert.ok(labels('Finance').includes('Vendor Ledger'));
  assert.ok(!labels('Finance').includes('Project Files'));
  assert.ok(labels('PM').includes('Project Profitability'));
  assert.ok(labels('PM').includes('Team & Capacity'));
  assert.ok(!labels('PM').includes('Invoicing & Revenues'));
  assert.deepEqual(labels('Creative'), ['My Hub', 'Project Hub', 'Assigned Tasks', 'Insights', 'Portfolio', 'Testimonials']);
  assert.equal(getPrimaryNavigationForRole('Creative').find((item) => item.key === 'dashboard')?.to, '/admin/tasks?taskscope=my');
  assert.equal(getPrimaryNavigationForRole('Freelancer').find((item) => item.key === 'tasks')?.to, '/admin/tasks?taskscope=my&workspace=project');
  assert.ok(keys('Finance').includes('client-directory'));
});

test('query-aware active state selects the specific destination', () => {
  const adminItems = getPrimaryNavigationForRole(getAmsRole({
    id: 'usr_root_admin',
    role: 'Tier 1: Top Management / Sponsor',
    stakeholderType: 'Master',
  }));
  const findItem = (key: string) => adminItems.find((item) => item.key === key)!;
  assert.equal(isNavigationItemActive(findItem('crm'), '/admin/crm', '', ''), true);
  assert.equal(isNavigationItemActive(findItem('client-directory'), '/admin/clients/all-clients', '', ''), true);
  assert.equal(isNavigationItemActive(findItem('tasks-engine'), '/admin/tasks', '?taskscope=due', ''), true);
  assert.equal(isNavigationItemActive(findItem('quotations'), '/admin/proposals', '', ''), true);
  assert.equal(isNavigationItemActive(findItem('testimonials'), '/admin/cms/testimonials', '', ''), true);
  assert.equal(isNavigationItemActive(AMS_PRIMARY_SETTINGS_ITEM, '/admin/navigation/release-readiness', '', ''), true);
});
