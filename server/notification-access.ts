import type { StoredUser } from './db.ts';

export type NotificationAccessRecord = {
  type?: unknown;
  recipientUserId?: unknown;
};

function hasPermission(user: StoredUser, permission: keyof StoredUser['permissions']): boolean {
  return user.stakeholderType === 'Master' || Boolean(user.permissions?.[permission]);
}

export function canViewNotification(user: StoredUser, notification: NotificationAccessRecord): boolean {
  const recipientUserId = notification.recipientUserId == null ? '' : String(notification.recipientUserId);
  if (recipientUserId && recipientUserId !== user.id) return false;

  const type = String(notification.type || '').toLowerCase();
  switch (type) {
    case 'finance':
      return hasPermission(user, 'canViewFinancials') || hasPermission(user, 'canManageInvoices');
    case 'lead':
      return hasPermission(user, 'canManageCrm');
    case 'approval':
      return hasPermission(user, 'canApproveBudgets') || hasPermission(user, 'canManageProjects');
    default:
      return true;
  }
}

export function getHiddenNotificationTypes(user: StoredUser): string[] {
  const hidden: string[] = [];
  if (!hasPermission(user, 'canViewFinancials') && !hasPermission(user, 'canManageInvoices')) hidden.push('finance');
  if (!hasPermission(user, 'canManageCrm')) hidden.push('lead');
  if (!hasPermission(user, 'canApproveBudgets') && !hasPermission(user, 'canManageProjects')) hidden.push('approval');
  return hidden;
}
