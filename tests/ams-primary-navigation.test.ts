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

test('sidebar lists primary modules only; child pages are not sidebar entries', () => {
  assert.deepEqual(labels('Admin'), ['Dashboard', 'CRM', 'Projects', 'Finance', 'CMS']);
  assert.deepEqual(keys('Admin'), ['dashboard', 'crm', 'projects', 'finance', 'cms']);
  assert.equal(AMS_PRIMARY_SETTINGS_ITEM.label, 'Settings');
  assert.equal(AMS_PRIMARY_SETTINGS_ITEM.allowedRoles.includes('Admin'), true);
  assert.equal(AMS_PRIMARY_SETTINGS_ITEM.allowedRoles.includes('PM'), false);
});

test('role-aware primary modules keep the navigation concise', () => {
  assert.deepEqual(labels('Finance'), ['Dashboard', 'CRM', 'Projects', 'Finance']);
  assert.deepEqual(labels('PM'), ['Dashboard', 'CRM', 'Projects', 'Finance', 'CMS']);
  assert.deepEqual(labels('Creative'), ['Dashboard', 'Projects', 'CMS']);
  assert.deepEqual(labels('Freelancer'), ['Dashboard', 'Tasks']);
  assert.equal(getPrimaryNavigationForRole('Creative').find((item) => item.key === 'dashboard')?.to, '/admin/tasks?taskscope=my');
  assert.equal(getPrimaryNavigationForRole('Freelancer').find((item) => item.key === 'tasks')?.to, '/admin/tasks?taskscope=my&workspace=project');
});

test('top-level active state remains on the owning module while navigating its tabs', () => {
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
  assert.equal(isNavigationItemActive(AMS_PRIMARY_SETTINGS_ITEM, '/admin/navigation/release-readiness', '', ''), true);
  assert.equal(isNavigationItemActive(AMS_PRIMARY_SETTINGS_ITEM, '/admin/documents', '', ''), true);
});
