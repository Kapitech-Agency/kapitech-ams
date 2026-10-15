import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AMS_SYSTEM_SETTINGS_ITEMS,
  canAccessAmsRoute,
  getAmsRole,
  getNavigationGroupsForRole,
} from '../src/lib/amsNavigationAccess';

test('immutable Master identity receives the full Admin navigation profile', () => {
  const master = {
    id: 'usr_root_admin',
    role: 'Tier 1: Top Management / Sponsor',
    stakeholderType: 'Master',
  };

  assert.equal(getAmsRole(master), 'Admin');
  assert.equal(getNavigationGroupsForRole(getAmsRole(master)).length, 6);
  assert.equal(getNavigationGroupsForRole(getAmsRole(master)).at(-1)?.key, 'system-settings');
  assert.equal(AMS_SYSTEM_SETTINGS_ITEMS.length, 3);
});

test('Master Admin route guard allows direct access to all AMS workspaces and System Settings', () => {
  const role = getAmsRole({
    id: 'usr_root_admin',
    role: 'Tier 1: Top Management / Sponsor',
    stakeholderType: 'Master',
  });

  assert.equal(canAccessAmsRoute(role, '/admin/dashboard'), true);
  assert.equal(canAccessAmsRoute(role, '/admin/crm'), true);
  assert.equal(canAccessAmsRoute(role, '/admin/finance', '?tab=accounts-payable'), true);
  assert.equal(canAccessAmsRoute(role, '/admin/settings', '?tab=overview'), true);
  assert.equal(canAccessAmsRoute(role, '/admin/navigation/release-readiness'), true);
});

test('role display labels alone do not grant Master Admin access', () => {
  assert.equal(
    getAmsRole({ id: 'usr_other_account', role: 'Tier 1: Top Management / Sponsor', stakeholderType: 'Executive' }),
    'Freelancer',
  );
});
