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

test('compatibility module list is derived from the flat, grouped sidebar configuration', () => {
  assert.deepEqual(labels('Admin'), ['Dashboard & Hub', 'CRM', 'Project Hub', 'Finance', 'CMS']);
  assert.deepEqual(keys('Admin'), ['dashboard', 'crm', 'projects', 'finance', 'cms']);
  assert.equal(AMS_PRIMARY_SETTINGS_ITEM.label, 'Settings');
  assert.equal(AMS_PRIMARY_SETTINGS_ITEM.allowedRoles.includes('Admin'), true);
  assert.equal(AMS_PRIMARY_SETTINGS_ITEM.allowedRoles.includes('PM'), false);
});

test('role-aware module destinations remain concise and follow the allowed workspace', () => {
  assert.deepEqual(labels('Finance'), ['Dashboard & Hub', 'CRM', 'Project Hub', 'Finance']);
  assert.deepEqual(labels('PM'), ['Dashboard & Hub', 'CRM', 'Project Hub', 'Project Profitability', 'CMS']);
  assert.deepEqual(labels('Creative'), ['My Hub', 'Project Hub', 'CMS']);
  assert.deepEqual(labels('Freelancer'), ['My Hub', 'Assigned Tasks']);

  assert.deepEqual(keys('Creative'), ['dashboard', 'projects', 'cms']);
  assert.deepEqual(keys('Freelancer'), ['dashboard', 'tasks']);
  assert.equal(getPrimaryNavigationForRole('Creative').find((item) => item.key === 'dashboard')?.to, '/admin/tasks?taskscope=my');
  assert.equal(getPrimaryNavigationForRole('Freelancer').find((item) => item.key === 'tasks')?.to, '/admin/tasks?taskscope=my&workspace=project');
});

test('query-aware active state follows the owning workspace and never marks sibling items active', () => {
  const adminItems = getPrimaryNavigationForRole(getAmsRole({
    id: 'usr_root_admin',
    role: 'Tier 1: Top Management / Sponsor',
    stakeholderType: 'Master',
  }));
  const findItem = (key: string) => adminItems.find((item) => item.key === key)!;

  assert.equal(isNavigationItemActive(findItem('crm'), '/admin/clients/all-clients', '', ''), true);
  assert.equal(isNavigationItemActive(findItem('projects'), '/admin/tasks', '?taskscope=due', ''), true);
  assert.equal(isNavigationItemActive(findItem('finance'), '/admin/proposals', '', ''), true);
  assert.equal(isNavigationItemActive(findItem('cms'), '/admin/cms/testimonials', '', ''), true);
  assert.equal(isNavigationItemActive(findItem('projects'), '/admin/documents', '', ''), true);
  assert.equal(isNavigationItemActive(findItem('dashboard'), '/admin/dashboard', '?view=tasks', ''), false);
  assert.equal(isNavigationItemActive(AMS_PRIMARY_SETTINGS_ITEM, '/admin/navigation/release-readiness', '', ''), true);
});
