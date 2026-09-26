import assert from 'node:assert/strict';
import test from 'node:test';
import { canViewNotification, getHiddenNotificationTypes } from '../server/notification-access.ts';

function user(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'user-a',
    stakeholderType: 'Operations',
    permissions: {
      canViewFinancials: false,
      canManageInvoices: false,
      canApproveBudgets: false,
      canManageCrm: false,
      canManageProjects: false,
      canManageKanbanTasks: false,
      canManageClients: false,
      canManageVendors: false,
      canManageCmsContent: false,
      canAccessServerAndApi: false,
      canRunDataMigration: false,
      canViewSecurityAuditLogs: false,
      canManageAdminAccounts: false
    },
    ...overrides
  };
}

test('Notification visibility matches module permissions and recipients', () => {
  assert.equal(canViewNotification(user({ permissions: { ...user().permissions, canManageCrm: true } }), { type: 'lead' }), true);
  assert.equal(canViewNotification(user(), { type: 'lead' }), false);
  assert.equal(canViewNotification(user({ permissions: { ...user().permissions, canViewFinancials: true } }), { type: 'finance' }), true);
  assert.equal(canViewNotification(user(), { type: 'finance' }), false);
  assert.equal(canViewNotification(user({ permissions: { ...user().permissions, canManageProjects: true } }), { type: 'approval' }), true);
  assert.equal(canViewNotification(user(), { type: 'approval' }), false);
  assert.equal(canViewNotification(user(), { type: 'system' }), true);

  assert.equal(canViewNotification(user(), { type: 'system', recipientUserId: 'user-b' }), false);
  assert.equal(canViewNotification(user(), { type: 'system', recipientUserId: 'user-a' }), true);
  assert.equal(canViewNotification(user({ stakeholderType: 'Master' }), { type: 'finance' }), true);
});

test('Hidden notification type list drives the bulk-read exclusion set', () => {
  assert.deepEqual(getHiddenNotificationTypes(user()).sort(), ['approval', 'finance', 'lead']);
  assert.deepEqual(
    getHiddenNotificationTypes(user({ permissions: { ...user().permissions, canManageCrm: true } })).sort(),
    ['approval', 'finance']
  );
  assert.deepEqual(
    getHiddenNotificationTypes(user({ permissions: { ...user().permissions, canViewFinancials: true } })).sort(),
    ['approval', 'lead']
  );
  assert.deepEqual(getHiddenNotificationTypes(user({ stakeholderType: 'Master' })), []);
});
