import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AMS_PRIMARY_SETTINGS_ITEM,
  AMS_SYSTEM_SETTINGS_ITEMS,
  canAccessAmsRoute,
  getAmsRole,
  getNavigationGroupsForRole,
} from '../src/lib/amsNavigationAccess';

test('Master identity receives the approved nine-module navigation and separate Settings entry', () => {
  const master = { id: 'usr_root_admin', role: 'Tier 1: Top Management / Sponsor', stakeholderType: 'Master' };
  assert.equal(getAmsRole(master), 'Admin');

  const groups = getNavigationGroupsForRole(getAmsRole(master));
  assert.equal(groups.length, 4);
  assert.deepEqual(groups.map((group) => group.label), ['Workspace', 'Delivery', 'Operations', 'Publishing']);
  assert.deepEqual(groups.flatMap((group) => group.items).map((item) => item.label), [
    'Dashboard', 'Inbox', 'Projects', 'Clients', 'Finance', 'Team & Resources', 'Documents', 'Website CMS',
  ]);
  assert.equal(AMS_PRIMARY_SETTINGS_ITEM.label, 'Settings');
  assert.equal(AMS_SYSTEM_SETTINGS_ITEMS.length, 2);
  assert.ok(AMS_SYSTEM_SETTINGS_ITEMS.every((item) => item.allowedRoles.length === 1 && item.allowedRoles[0] === 'Admin'));
});

test('Master Admin route guards preserve Finance, Settings and compatibility destinations', () => {
  const role = getAmsRole({ id: 'usr_root_admin', role: 'Tier 1: Project Manager', stakeholderType: 'Master' });
  assert.equal(role, 'Admin');
  assert.equal(canAccessAmsRoute(role, '/admin/dashboard'), true);
  assert.equal(canAccessAmsRoute(role, '/admin/finance/quotations'), true);
  assert.equal(canAccessAmsRoute(role, '/admin/settings', '?tab=overview'), true);
  assert.equal(canAccessAmsRoute(role, '/admin/navigation/release-readiness'), true);
});

test('display labels cannot grant Master Admin navigation or route access', () => {
  assert.equal(getAmsRole({ id: 'usr_other_account', role: 'Tier 1: Top Management / Sponsor', stakeholderType: 'Executive' }), 'Freelancer');
});
