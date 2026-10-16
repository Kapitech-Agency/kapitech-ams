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
    key: 'main-dashboard',
    label: 'OPERATIONAL OVERVIEW',
    items: [
      { key: 'dashboard-hub', label: 'Dashboard & Hub', to: '/admin/dashboard', icon: 'dashboard', allowedRoles: ALL_ROLES },
      { key: 'my-hub', label: 'My Hub', to: '/admin/tasks?taskscope=my', icon: 'user', allowedRoles: COMMERCIAL_ROLES },
    ],
  },
  {
    key: 'client-pipeline',
    label: 'CLIENT & PIPELINE',
    items: [
      { key: 'crm', label: 'Sales & Pipeline', to: '/admin/crm', icon: 'crm', allowedRoles: COMMERCIAL_ROLES },
      { key: 'client-directory', label: 'Client Directory', to: '/admin/clients/all-clients', icon: 'clients', allowedRoles: COMMERCIAL_ROLES },
      { key: 'client-onboarding', label: 'Client Onboarding', to: '/admin/clients/all-clients#client-onboarding-readiness', icon: 'onboarding', allowedRoles: COMMERCIAL_ROLES },
      { key: 'inbox', label: 'Inbox', to: '/admin/inbox', icon: 'activity', allowedRoles: COMMERCIAL_ROLES },
      { key: 'contracts', label: 'Contracts', to: '/admin/contracts', icon: 'quotes', allowedRoles: COMMERCIAL_ROLES },
      { key: 'sla-monitoring', label: 'SLA Monitoring', to: '/admin/clients/sla-monitoring', icon: 'clients', allowedRoles: COMMERCIAL_ROLES },
    ],
  },
  {
    key: 'projects-workspace',
    label: 'DELIVERY & OPERATIONS',
    items: [
      { key: 'project-hub', label: 'Project Hub', to: '/admin/projects', icon: 'projects', allowedRoles: ALL_ROLES },
      { key: 'tasks-engine', label: 'Tasks', to: '/admin/tasks', icon: 'tasks', allowedRoles: ['Admin', 'PM'] },
      { key: 'assigned-tasks', label: 'Assigned Tasks', to: '/admin/tasks?taskscope=my&workspace=project', icon: 'tasks', allowedRoles: ['Finance', 'Creative'] },
      { key: 'project-files', label: 'Project Files', to: '/admin/documents', icon: 'registry', allowedRoles: ['Admin'] },
      { key: 'team-capacity', label: 'Team & Capacity', to: '/admin/team?view=capacity-allocation', icon: 'user', allowedRoles: ['Admin', 'PM'] },
      { key: 'timesheet-control', label: 'Timesheet Control', to: '/admin/time-logs', icon: 'retainer', allowedRoles: ['Admin', 'PM'] },
      { key: 'retainer-manager', label: 'Retainer Hours Pool', to: '/admin/clients/retainers', icon: 'retainer', allowedRoles: ['Admin', 'PM'] },
    ],
  },
  {
    key: 'finance-ledger',
    label: 'FINANCE & LEDGER',
    items: [
      { key: 'finance', label: 'Finance Overview', to: '/admin/finance?tab=executive-summary', icon: 'profitability', allowedRoles: ['Admin', 'Finance'] },
      { key: 'finance-revenue', label: 'Invoicing & Revenues', to: '/admin/finance?tab=accounts-receivable', icon: 'invoice', allowedRoles: ['Admin', 'Finance'] },
      { key: 'finance-expenses', label: 'Profitability & Expenses', to: '/admin/finance?tab=accounts-payable', icon: 'ledger', allowedRoles: ['Admin', 'Finance'] },
      { key: 'project-profitability', label: 'Project Profitability', to: '/admin/finance?tab=project-finance', icon: 'profitability', allowedRoles: ['Admin', 'Finance', 'PM'], accessNote: { PM: 'Aggregated view' } },
      { key: 'quotations', label: 'Quotations', to: '/admin/proposals', icon: 'quotes', allowedRoles: ['Admin', 'Finance'] },
      { key: 'vendor-ledger', label: 'Vendor Ledger', to: '/admin/vendors', icon: 'ledger', allowedRoles: ['Admin', 'Finance'] },
      { key: 'approvals', label: 'Approvals', to: '/admin/approvals', icon: 'invoice', allowedRoles: ['Admin', 'Finance'] },
    ],
  },
  {
    key: 'cms-content',
    label: 'MARKETING CMS',
    items: [
      { key: 'cms', label: 'Insights', to: '/admin/cms/insights', icon: 'editorial', allowedRoles: ['Admin', 'PM', 'Creative'] },
      { key: 'portfolio', label: 'Portfolio', to: '/admin/cms/projects', icon: 'projects', allowedRoles: ['Admin', 'PM', 'Creative'] },
      { key: 'testimonials', label: 'Testimonials', to: '/admin/cms/testimonials', icon: 'registry', allowedRoles: ['Admin', 'PM', 'Creative'] },
      { key: 'services', label: 'Services', to: '/admin/cms/services', icon: 'editorial', allowedRoles: ['Admin'] },
      { key: 'careers', label: 'Careers', to: '/admin/cms/careers', icon: 'user', allowedRoles: ['Admin'] },
    ],
  },
];
export const AMS_SYSTEM_SETTINGS_ITEMS: AmsNavigationItem[] = [
  { key: 'user-access', label: 'User Access & Confidential Cost Rates', to: '/admin/settings?tab=security', icon: 'access', allowedRoles: ['Admin'] },
  { key: 'data-persistence-backup', label: 'Data Persistence & Backup Portal', to: '/admin/settings?tab=overview', icon: 'backup', allowedRoles: ['Admin'] },
  { key: 'release-readiness', label: 'Release Readiness Telemetry Gate', to: '/admin/navigation/release-readiness', icon: 'readiness', allowedRoles: ['Admin'] },
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
 * Compatibility helper for existing callers. It returns all direct sidebar
 * destinations visible to the role, including priority feature shortcuts.
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

  if (path === '/admin/clients' || path === '/admin/clients/all-clients' || path === '/admin/clients/sla-monitoring') {
    return ['Finance', 'PM'].includes(role);
  }
  if (path === '/admin/clients/retainers') return role === 'PM';
  if (path === '/admin/contracts') return ['Finance', 'PM'].includes(role);

  if (path === '/admin/proposals') return role === 'Finance';

  if (path === '/admin/finance') {
    if (role === 'Finance') return true;
    if (role === 'PM') return params.get('tab') === 'project-finance';
    return false;
  }

  if (path === '/admin/vendors') return role === 'Finance';
  if (path === '/admin/approvals') return role === 'Finance';

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

  switch (item.key) {
    case 'dashboard':
    case 'dashboard-hub':
      if (item.to.startsWith('/admin/tasks?taskscope=my')) {
        return path === '/admin/tasks' && params.get('taskscope') === 'my' && params.get('workspace') !== 'project';
      }
      return path === '/admin/dashboard' && params.get('view') !== 'tasks';
    case 'my-hub':
      return path === '/admin/tasks' && params.get('taskscope') === 'my' && params.get('workspace') !== 'project';
    case 'crm':
      return path === '/admin/crm';
    case 'client-directory':
      return path === '/admin/clients/all-clients' && hash !== '#client-onboarding-readiness';
    case 'client-onboarding':
      return path === '/admin/clients/all-clients' && hash === '#client-onboarding-readiness';
    case 'inbox':
      return path === '/admin/inbox';
    case 'contracts':
      return path === '/admin/contracts';
    case 'sla-monitoring':
      return path === '/admin/clients/sla-monitoring';
    case 'projects':
    case 'project-hub':
      return path === '/admin/projects';
    case 'tasks':
    case 'tasks-engine':
      return path === '/admin/tasks'
        && !(params.get('taskscope') === 'my' && params.get('workspace') !== 'project')
        && params.get('workspace') !== 'project';
    case 'assigned-tasks':
      return path === '/admin/tasks' && params.get('taskscope') === 'my' && params.get('workspace') === 'project';
    case 'project-files':
      return path === '/admin/documents' || path.startsWith('/admin/documents/');
    case 'team-capacity':
      return path === '/admin/team' && params.get('view') === 'capacity-allocation';
    case 'timesheet-control':
      return path === '/admin/time-logs';
    case 'retainer-manager':
      return path === '/admin/clients/retainers';
    case 'finance':
      return path === '/admin/finance'
        && ['executive-summary', 'dashboard'].includes(params.get('tab') || 'executive-summary');
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
      return path === '/admin/proposals';
    case 'vendor-ledger':
      return path === '/admin/vendors';
    case 'approvals':
      return path === '/admin/approvals';
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
    case 'content-workspace':
    case 'insight-editorial':
      return path === '/admin/cms/insights';
    case 'portfolio-testimonial-registry':
      return path === '/admin/cms/projects' || path === '/admin/cms/testimonials';
    case 'user-access':
      return path === '/admin/settings' && ['security', 'rbac'].includes(params.get('tab') || '');
    case 'data-persistence-backup':
      return path === '/admin/settings' && (!params.get('tab') || params.get('tab') === 'overview');
    case 'settings':
      return path === '/admin/settings' || path.startsWith('/admin/settings/') || path === '/admin/navigation/release-readiness';
    case 'release-readiness':
      return path === '/admin/navigation/release-readiness';
    default: {
      const target = new URL(item.to, 'https://ams.kapitech.local');
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
