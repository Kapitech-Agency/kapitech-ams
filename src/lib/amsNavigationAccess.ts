export type AmsRole = 'Admin' | 'Finance' | 'PM' | 'Creative' | 'Freelancer';

export type AmsNavigationIcon =
  | 'dashboard'
  | 'user'
  | 'activity'
  | 'crm'
  | 'clients'
  | 'onboarding'
  | 'projects'
  | 'tasks'
  | 'retainer'
  | 'quotes'
  | 'invoice'
  | 'ledger'
  | 'profitability'
  | 'editorial'
  | 'registry'
  | 'access'
  | 'backup'
  | 'readiness';

export interface AmsNavigationItem {
  key: string;
  label: string;
  to: string;
  icon: AmsNavigationIcon;
  allowedRoles: AmsRole[];
  accessNote?: Partial<Record<AmsRole, string>>;
}

export interface AmsNavigationGroup {
  key: string;
  label: string;
  items: AmsNavigationItem[];
}

const ALL_ROLES: AmsRole[] = ['Admin', 'Finance', 'PM', 'Creative', 'Freelancer'];
const COMMERCIAL_ROLES: AmsRole[] = ['Admin', 'Finance', 'PM'];

export const AMS_NAVIGATION_GROUPS: AmsNavigationGroup[] = [
  {
    key: 'workspace',
    label: 'Workspace',
    items: [
      { key: 'dashboard-hub', label: 'Dashboard', to: '/admin/dashboard', icon: 'dashboard', allowedRoles: ALL_ROLES },
      { key: 'inbox', label: 'Inbox', to: '/admin/inbox', icon: 'activity', allowedRoles: COMMERCIAL_ROLES },
    ],
  },
  {
    key: 'delivery',
    label: 'Delivery',
    items: [
      { key: 'project-hub', label: 'Projects', to: '/admin/projects', icon: 'projects', allowedRoles: ALL_ROLES },
      { key: 'clients', label: 'Clients', to: '/admin/clients/all-clients', icon: 'clients', allowedRoles: COMMERCIAL_ROLES },
    ],
  },
  {
    key: 'operations',
    label: 'Operations',
    items: [
      { key: 'finance', label: 'Finance', to: '/admin/finance?tab=executive-summary', icon: 'profitability', allowedRoles: ['Admin', 'Finance', 'PM'], accessNote: { PM: 'Project finance view' } },
      { key: 'team-resources', label: 'Team & Resources', to: '/admin/team', icon: 'user', allowedRoles: ['Admin', 'Finance', 'PM'] },
      { key: 'documents', label: 'Documents', to: '/admin/documents', icon: 'registry', allowedRoles: ['Admin'] },
    ],
  },
  {
    key: 'publishing',
    label: 'Publishing',
    items: [
      { key: 'website-cms', label: 'Website CMS', to: '/admin/cms/projects', icon: 'editorial', allowedRoles: ['Admin', 'PM', 'Creative'] },
    ],
  },
];
export const AMS_SYSTEM_SETTINGS_ITEMS: AmsNavigationItem[] = [
  { key: 'user-access', label: 'User Access & Confidential Cost Rates', to: '/admin/settings?tab=security', icon: 'access', allowedRoles: ['Admin'] },
  { key: 'data-persistence-backup', label: 'Data Persistence & Backup Portal', to: '/admin/settings?tab=overview', icon: 'backup', allowedRoles: ['Admin'] },
];

export const AMS_PRIMARY_SETTINGS_ITEM: AmsNavigationItem = {
  key: 'settings',
  label: 'Settings',
  to: '/admin/settings?tab=overview',
  icon: 'access',
  allowedRoles: ['Admin'],
};

/**
 * Reads the user.role string from the server-refreshed /api/auth/me profile.
 * Unknown legacy values fall back to the least-privileged navigation profile
 * and never inherit Admin privileges.
 */
export function normalizeAmsRole(roleValue: unknown): AmsRole {
  const role = String(roleValue ?? '').trim().toLowerCase();

  if (role === 'admin') return 'Admin';
  if (role === 'finance' || role === 'financial officer') return 'Finance';
  if (role === 'pm' || role === 'project manager' || role === 'tier 2: project manager (pm)') return 'PM';
  if (role === 'creative' || role === 'internal staff') return 'Creative';
  if (role === 'freelancer' || role === 'contract freelancer') return 'Freelancer';

  return 'Freelancer';
}

/**
 * Resolve the navigation role from the full authenticated profile when available.
 *
 * Master access is based on the same immutable identity fields used by adminAuth,
 * not on a display name or a self-reported role label. This keeps the UI menu,
 * top-level route guard, and existing Master Administrator policy in sync.
 */
export function getAmsRole(userOrRole: unknown): AmsRole {
  if (userOrRole && typeof userOrRole === 'object') {
    const user = userOrRole as {
      id?: unknown;
      role?: unknown;
      stakeholderType?: unknown;
    };

    if (user.stakeholderType === 'Master' || user.id === 'usr_root_admin') {
      return 'Admin';
    }

    return normalizeAmsRole(user.role);
  }

  // Role-only values remain supported for non-identity-aware callers.
  return normalizeAmsRole(userOrRole);
}

export function getAmsHomePath(role: AmsRole): string {
  return role === 'Admin' || role === 'Finance' || role === 'PM'
    ? '/admin/dashboard'
    : '/admin/tasks?taskscope=my';
}

export function getNavigationGroupsForRole(role: AmsRole): AmsNavigationGroup[] {
  return AMS_NAVIGATION_GROUPS.map((group) => {
    const items = group.items
      .filter((item) => item.allowedRoles.includes(role))
      .map((item) => {
        if (item.key === 'dashboard-hub' && (role === 'Creative' || role === 'Freelancer')) {
          return { ...item, label: 'My Hub', to: getAmsHomePath(role) };
        }
        if (item.key === 'project-hub' && role === 'Freelancer') {
          return {
            ...item,
            key: 'assigned-tasks',
            label: 'Assigned Tasks',
            to: '/admin/tasks?taskscope=my&workspace=project',
          };
        }
        if (item.key === 'project-hub' && (role === 'Finance' || role === 'Creative')) {
          return { ...item, to: '/admin/projects?projects=sprint' };
        }
        if (item.key === 'finance' && role === 'PM') {
          return { ...item, to: '/admin/finance?tab=project-finance' };
        }
        if (item.key === 'team-resources' && role === 'Finance') {
          return { ...item, to: '/admin/vendors' };
        }
        if (item.key === 'website-cms' && (role === 'PM' || role === 'Creative')) {
          return { ...item, to: '/admin/cms/insights' };
        }
        return item;
      })
      .filter((item) => {
        const target = new URL(item.to, 'https://ams.kapitech.local');
        return canAccessAmsRoute(role, target.pathname, target.search);
      });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);
}


/**
 * Canonical identity for a navigable destination. Query parameter order and
 * trailing slashes do not create a second owner for the same navigation item.
 */
export function getAmsNavigationDestinationSignature(to: string): string {
  const target = new URL(to, 'https://ams.kapitech.local');
  const pathname = target.pathname.replace(/\/+$/, '') || '/';
  const query = [...target.searchParams.entries()]
    .sort(([leftKey, leftValue], [rightKey, rightValue]) =>
      leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue)
    )
    .map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(value))
    .join('&');

  return pathname + (query ? '?' + query : '') + target.hash;
}

/** Return destinations owned by the role-visible flat sidebar, including its pinned Settings entry. */
export function getAmsSidebarDestinationSignatures(role: AmsRole): Set<string> {
  const items = getNavigationGroupsForRole(role).flatMap((group) => group.items);

  if (AMS_PRIMARY_SETTINGS_ITEM.allowedRoles.includes(role)) {
    const target = new URL(AMS_PRIMARY_SETTINGS_ITEM.to, 'https://ams.kapitech.local');
    if (canAccessAmsRoute(role, target.pathname, target.search)) items.push(AMS_PRIMARY_SETTINGS_ITEM);
  }

  return new Set(items.map((item) => getAmsNavigationDestinationSignature(item.to)));
}

/**
 * Compatibility helper for callers that still consume a flat navigation list.
 * Returns role-permitted primary modules, excluding the separately pinned Settings item.
 */
export function getPrimaryNavigationForRole(role: AmsRole): AmsNavigationItem[] {
  const keyAliases: Record<string, string> = {
    'dashboard-hub': 'dashboard',
    'project-hub': 'projects',
    'tasks-engine': 'tasks',
    'assigned-tasks': 'tasks',
  };
  return getNavigationGroupsForRole(role)
    .flatMap((group) => group.items)
    .map((item) => ({ ...item, key: keyAliases[item.key] || item.key }));
}
const pathOnly = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

export function canAccessAmsRoute(role: AmsRole, pathname: string, search = ''): boolean {
  const path = pathOnly(pathname);
  const params = new URLSearchParams(search);

  if (!path.startsWith('/admin')) return false;
  if (role === 'Admin') return true;

  if (path === '/admin/navigation/live-activity') return true;
  if (path === '/admin/navigation/release-readiness') return false;

  if (path === '/admin/dashboard') {
    if (!['Finance', 'PM'].includes(role)) return false;
    const view = params.get('view');
    return !view || ['overview', 'performance', 'analytics'].includes(view);
  }

  if (path === '/admin/tasks') {
    const scope = params.get('taskscope') || 'all';
    if (role === 'PM') return scope !== 'my' || params.get('workspace') !== 'project';
    if (scope !== 'my') return false;
    return role !== 'Freelancer' || !params.get('workspace') || params.get('workspace') === 'project';
  }

  if (path === '/admin/projects') {
    if (role === 'PM') return true;
    if (role === 'Creative' || role === 'Finance') return params.get('projects') === 'sprint';
    return false;
  }

  if (path === '/admin/crm' || path === '/admin/inbox') return ['Finance', 'PM'].includes(role);

  if (path === '/admin/clients' || path === '/admin/clients/all-clients' || path === '/admin/clients/sla-monitoring' || path === '/admin/clients/lead-accounts') {
    return ['Finance', 'PM'].includes(role);
  }
  if (path === '/admin/clients/retainers') return role === 'PM';
  if (path === '/admin/contracts') return ['Finance', 'PM'].includes(role);

  if (path === '/admin/proposals') return role === 'Finance';

  if (path === '/admin/finance/quotations') return role === 'Finance';

  if (path === '/admin/finance') {
    if (role === 'Finance') return true;
    if (role === 'PM') return params.get('tab') === 'project-finance';
    return false;
  }

  if (path === '/admin/vendors') return role === 'Finance';
  if (path === '/admin/approvals') return role === 'Finance';

  if (path === '/admin/cms/careers' && params.get('tab') === 'applicants') {
    // Applicants previously existed in Inbox for Finance and PM. Preserve that same data access
    // while keeping public job-opening editing restricted to roles already allowed into CMS Careers.
    return ['Finance', 'PM'].includes(role);
  }

  if (path.startsWith('/admin/cms/')) {
    if (role === 'PM' || role === 'Creative') {
      return ['/admin/cms/insights', '/admin/cms/projects', '/admin/cms/testimonials'].includes(path);
    }
    return false;
  }

  if (path === '/admin/settings' || path.startsWith('/admin/settings/')) return false;
  if (path === '/admin/documents' || path.startsWith('/admin/documents/')) return false;
  if (path === '/admin/team' || path === '/admin/time-logs') return role === 'PM';
  if (path === '/admin' || path === '/admin/executive') return false;

  return false;
}

export function getDeniedRouteRedirect(role: AmsRole, pathname: string, search = ''): string {
  const path = pathOnly(pathname);
  const params = new URLSearchParams(search);

  if (role === 'PM' && path === '/admin/finance') return '/admin/finance?tab=project-finance';
  if (path === '/admin/tasks' && role !== 'Admin' && role !== 'PM') return '/admin/tasks?taskscope=my';
  return getAmsHomePath(role);
}

export function isNavigationItemActive(
  item: Pick<AmsNavigationItem, 'key' | 'to'>,
  pathname: string,
  search = '',
  hash = ''
): boolean {
  const path = pathOnly(pathname);
  const params = new URLSearchParams(search);
  const target = new URL(item.to, 'https://ams.kapitech.local');

  switch (item.key) {
    case 'dashboard':
    case 'dashboard-hub':
      if (item.to.startsWith('/admin/tasks?taskscope=my')) {
        return path === '/admin/tasks' && params.get('taskscope') === 'my' && params.get('workspace') !== 'project';
      }
      return path === '/admin/dashboard' && params.get('view') !== 'tasks';
    case 'my-hub':
      return path === '/admin/tasks' && params.get('taskscope') === 'my' && params.get('workspace') !== 'project';
    case 'inbox':
      return path === '/admin/inbox';
    case 'projects':
    case 'project-hub':
      return path === '/admin/projects';
    case 'assigned-tasks':
      return path === '/admin/tasks' && params.get('taskscope') === 'my' && params.get('workspace') === 'project';
    case 'clients':
      return path === '/admin/clients'
        || path.startsWith('/admin/clients/')
        || path === '/admin/contracts';
    case 'finance': {
      const targetTab = target.searchParams.get('tab');
      if (targetTab === 'project-finance') {
        return path === '/admin/finance' && params.get('tab') === 'project-finance';
      }
      return path === '/admin/finance' || path.startsWith('/admin/finance/');
    }
    case 'team-resources':
      if (target.pathname === '/admin/vendors') return path === '/admin/vendors';
      return path === '/admin/team' || path === '/admin/time-logs' || path === '/admin/vendors';
    case 'documents':
    case 'project-files':
      return path === '/admin/documents' || path.startsWith('/admin/documents/');
    case 'website-cms':
      return path === '/admin/cms' || path.startsWith('/admin/cms/');
    case 'cms':
      return path === '/admin/cms/insights';
    case 'portfolio':
      return path === '/admin/cms/projects';
    case 'testimonials':
      return path === '/admin/cms/testimonials';
    case 'services':
      return path === '/admin/cms/services';
    case 'careers':
      return path === '/admin/cms/careers';
    case 'client-directory':
      return path === '/admin/clients/all-clients' && params.get('scope') !== 'onboarding' && hash !== '#client-onboarding-readiness';
    case 'client-onboarding':
      return path === '/admin/clients/all-clients' && (params.get('scope') === 'onboarding' || hash === '#client-onboarding-readiness');
    case 'contracts':
      return path === '/admin/contracts';
    case 'sla-monitoring':
      return path === '/admin/clients/sla-monitoring';
    case 'timesheet-control':
      return path === '/admin/time-logs';
    case 'retainer-manager':
      return path === '/admin/clients/retainers';
    case 'finance-revenue':
      return path === '/admin/finance'
        && ['cash-bank', 'revenue', 'petty-cash', 'accounts-receivable'].includes(params.get('tab') || '');
    case 'finance-expenses':
      return path === '/admin/finance'
        && ['accounts-payable', 'expenses', 'vendors', 'journal', 'chart-of-accounts', 'monthly-pnl', 'cash-flow', 'balance-sheet', 'monthly-closing', 'annual-summary'].includes(params.get('tab') || '');
    case 'project-profitability':
      return path === '/admin/finance'
        && ['project-finance', 'operational-budget', 'project-allocation', 'team-fee'].includes(params.get('tab') || '');
    case 'quotations':
      return path === '/admin/finance/quotations' || path === '/admin/proposals';
    case 'approvals':
      return path === '/admin/approvals';
    case 'team-capacity':
      return path === '/admin/team' && params.get('view') === 'capacity-allocation';
    case 'user-access':
      return path === '/admin/settings' && ['security', 'rbac'].includes(params.get('tab') || '');
    case 'data-persistence-backup':
    case 'backup':
      return path === '/admin/settings' && (!params.get('tab') || params.get('tab') === 'overview');
    case 'settings':
      return path === '/admin/settings' || path.startsWith('/admin/settings/') || path === '/admin/navigation/release-readiness';
    case 'release-readiness':
      return path === '/admin/navigation/release-readiness';
    default: {
      if (pathOnly(target.pathname) !== path) return false;
      const targetParams = target.searchParams;
      for (const key of new Set([...targetParams.keys(), ...params.keys()])) {
        if (targetParams.get(key) !== params.get(key)) return false;
      }
      if (target.hash && target.hash !== hash) return false;
      return true;
    }
  }
}
