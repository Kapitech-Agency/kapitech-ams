import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AMS_SYSTEM_SETTINGS_ITEMS,
  canAccessAmsRoute,
  getAmsRole,
  getNavigationGroupsForRole,
} from '../src/lib/amsNavigationAccess';

test('immutable Master identity receives every flat functional group and a separate Admin System Center link', () => {
  const master = {
    id: 'usr_root_admin',
    role: 'Tier 1: Top Management / Sponsor',
    stakeholderType: 'Master',
  };

  assert.equal(getAmsRole(master), 'Admin');
  const groups = getNavigationGroupsForRole(getAmsRole(master));
  assert.equal(groups.length, 5);
  assert.deepEqual(groups.map((group) => group.label), [
    'OPERATIONAL OVERVIEW',
    'CLIENT & PIPELINE',
    'DELIVERY & OPERATIONS',
    'FINANCE & LEDGER',
    'MARKETING CMS',
  ]);
  assert.equal(AMS_SYSTEM_SETTINGS_ITEMS.length, 3);
  assert.ok(AMS_SYSTEM_SETTINGS_ITEMS.every((item) => item.allowedRoles.length === 1 && item.allowedRoles[0] === 'Admin'));
});

test('Master Admin route guard allows direct access to all AMS workspaces and System Center', () => {
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
