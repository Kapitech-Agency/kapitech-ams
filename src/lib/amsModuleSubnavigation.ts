import {
  AMS_PRIMARY_SETTINGS_ITEM,
  canAccessAmsRoute,
  getNavigationGroupsForRole,
  type AmsRole,
} from './amsNavigationAccess';

export type AmsSidebarModuleKey = 'dashboard' | 'crm' | 'projects' | 'finance' | 'cms' | 'settings' | 'tasks';

export interface AmsSidebarSubnavigationItem {
  key: string;
  label: string;
  to: string;
  slug?: string;
}

const MODULE_SUBNAVIGATION: Record<AmsSidebarModuleKey, AmsSidebarSubnavigationItem[]> = {
  dashboard: [
    { key: 'overview', label: 'Overview', to: '/admin/dashboard' },
    { key: 'performance', label: 'Performance', to: '/admin/dashboard?view=performance' },
    { key: 'analytics', label: 'Analytics', to: '/admin/dashboard?view=analytics' },
    { key: 'my-hub', label: 'My Hub', to: '/admin/tasks?taskscope=my' },
    { key: 'activity', label: 'Activity', to: '/admin/navigation/live-activity' },
  ],
  crm: [
    { key: 'pipeline', label: 'Sales & Pipeline', to: '/admin/crm' },
    { key: 'clients', label: 'Client Directory', to: '/admin/clients/all-clients' },
    { key: 'onboarding', label: 'Onboarding', to: '/admin/clients/all-clients?scope=onboarding' },
    { key: 'inbox', label: 'Inbox', to: '/admin/inbox' },
    { key: 'contracts', label: 'Contracts', to: '/admin/contracts' },
    { key: 'sla', label: 'SLA', to: '/admin/clients/sla-monitoring' },
  ],
  projects: [
    { key: 'all', label: 'Projects', to: '/admin/projects' },
    { key: 'sprint', label: 'Delivery', to: '/admin/projects?projects=sprint' },
    { key: 'budget', label: 'Budget', to: '/admin/projects?projects=budget' },
    { key: 'archived', label: 'Archived', to: '/admin/projects?projects=archived' },
    { key: 'tasks', label: 'Tasks', to: '/admin/tasks' },
    { key: 'docs', label: 'Files', to: '/admin/documents' },
    { key: 'retainers', label: 'Retainer Hours Pool', to: '/admin/clients/retainers' },
    { key: 'capacity', label: 'Team & Capacity', to: '/admin/team?view=capacity-allocation' },
    { key: 'time', label: 'Timesheet Control', to: '/admin/time-logs' },
  ],
  finance: [
    { key: 'invoicing-revenues', label: 'Invoicing & Revenues', to: '/admin/finance?tab=accounts-receivable' },
    { key: 'profitability-expenses', label: 'Profitability & Expenses', to: '/admin/finance?tab=accounts-payable' },
    { key: 'project-profitability', label: 'Project Profitability', to: '/admin/finance?tab=project-finance' },
    { key: 'quotes', label: 'Quotations', to: '/admin/proposals' },
    { key: 'vendors', label: 'Vendor Ledger', to: '/admin/vendors' },
    { key: 'approvals', label: 'Approvals', to: '/admin/approvals' },
  ],
  cms: [
    { key: 'insights', label: 'Insights', to: '/admin/cms/insights', slug: 'cms-tab-insights' },
    { key: 'projects', label: 'Portfolio', to: '/admin/cms/projects', slug: 'cms-tab-projects' },
    { key: 'testimonials', label: 'Testimonials', to: '/admin/cms/testimonials', slug: 'cms-tab-testimonials' },
    { key: 'services', label: 'Services', to: '/admin/cms/services', slug: 'cms-tab-services' },
    { key: 'careers', label: 'Careers', to: '/admin/cms/careers', slug: 'cms-tab-careers' },
  ],
  settings: [
    { key: 'backup', label: 'DB Migrations & Backups', to: '/admin/settings?tab=overview' },
    { key: 'access', label: 'Access & Confidential Cost Rates', to: '/admin/settings?tab=security' },
    { key: 'audit', label: 'Audit', to: '/admin/settings?tab=audit' },
    { key: 'integrations', label: 'Integrations', to: '/admin/settings?tab=integrations' },
    { key: 'readiness', label: 'Telemetry Gate', to: '/admin/navigation/release-readiness' },
  ],
  tasks: [],
};

/**
 * Workspace navigation is contextual, not a second copy of global navigation.
 * It contains only role-permitted local views that do not already have a
 * direct destination in the flat sidebar. Exact sidebar destinations are
 * deliberately suppressed here; this is the single enforcement point used by
 * every module, including query-based feature shortcuts.
 */
export function getAmsModuleSubnavigation(
  moduleKey: AmsSidebarModuleKey,
  role: AmsRole,
  allowMfaSetup = false
): AmsSidebarSubnavigationItem[] {
  let items = MODULE_SUBNAVIGATION[moduleKey];
  const mfaAccessOnly = moduleKey === 'settings' && allowMfaSetup && role !== 'Admin';

  if (mfaAccessOnly) {
    items = [{
      key: 'access',
      label: 'Access',
      to: '/admin/settings?tab=security',
    }];
  } else if (moduleKey === 'projects') {
    if (role === 'Freelancer') {
      items = [{
        key: 'tasks',
        label: 'Assigned Tasks',
        to: '/admin/tasks?taskscope=my&workspace=project',
      }];
    } else {
      if (role === 'Finance' || role === 'Creative') {
        items = items.filter((item) => ['sprint', 'tasks'].includes(item.key));
      }

      items = items.map((item) => {
        if (item.key !== 'tasks') return item;
        return {
          ...item,
          label: 'Tasks',
          to: ['Finance', 'Creative'].includes(role)
            ? '/admin/tasks?taskscope=my&workspace=project'
            : '/admin/tasks',
        };
      });
    }
  }

  const globalDestinations = getAmsSidebarDestinationSignatures(role);

  return items.filter((item) => {
    if (!mfaAccessOnly) {
      const target = new URL(item.to, 'https://ams.kapitech.local');
      if (!canAccessAmsRoute(role, target.pathname, target.search)) return false;
    }

    return !globalDestinations.has(getAmsNavigationDestinationSignature(item.to));
  });
}

/**
 * Query-aware active state for contextual links. Global feature links are not
 * rendered here; their active state is resolved by the global sidebar.
 */
export function isAmsModuleSubnavigationItemActive(
  item: Pick<AmsSidebarSubnavigationItem, 'key' | 'to'>,
  pathname: string,
  search = '',
  hash = ''
): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(search);
  const target = new URL(item.to, 'https://ams.kapitech.local');
  const targetPath = target.pathname.replace(/\/+$/, '') || '/';

  if (item.key === 'tasks' && path === '/admin/dashboard') {
    return params.get('view') === 'tasks';
  }
  if (path !== targetPath) return false;

  if (item.key === 'overview' && path === '/admin/dashboard') {
    return !params.get('view') || params.get('view') === 'overview';
  }
  if (path === '/admin/finance' && item.key === 'invoicing-revenues') {
    return ['executive-summary', 'dashboard', 'cash-bank', 'revenue', 'petty-cash', 'accounts-receivable'].includes(params.get('tab') || 'executive-summary');
  }
  if (path === '/admin/finance' && item.key === 'profitability-expenses') {
    return ['accounts-payable', 'expenses', 'vendors', 'journal', 'chart-of-accounts', 'monthly-pnl', 'cash-flow', 'balance-sheet', 'monthly-closing', 'annual-summary'].includes(params.get('tab') || '');
  }
  if (path === '/admin/finance' && item.key === 'project-profitability') {
    return ['project-finance', 'operational-budget', 'project-allocation', 'team-fee'].includes(params.get('tab') || '');
  }
  if (item.key === 'all' && path === '/admin/projects') {
    return !params.get('projects') || params.get('projects') === 'all';
  }
  if (item.key === 'tasks' && path === '/admin/tasks') {
    return !(params.get('taskscope') === 'my' && params.get('workspace') !== 'project');
  }
  if (item.key === 'clients' && path === '/admin/clients/all-clients') {
    return hash !== '#client-onboarding-readiness';
  }
  if (item.key === 'onboarding' && path === '/admin/clients/all-clients') {
    return hash === '#client-onboarding-readiness';
  }
  if (item.key === 'team' && path === '/admin/team') {
    return params.get('view') !== 'capacity-allocation';
  }
  if (item.key === 'backup' && path === '/admin/settings') {
    return !params.get('tab') || params.get('tab') === 'overview';
  }
  if (item.key === 'access' && path === '/admin/settings') {
    return ['profile', 'rbac', 'security'].includes(params.get('tab') || '');
  }
  if (item.key === 'integrations' && path === '/admin/settings') {
    return ['branding', 'api', 'integrations'].includes(params.get('tab') || '');
  }

  const targetParams = target.searchParams;
  const keys = new Set([...targetParams.keys(), ...params.keys()]);
  for (const key of keys) {
    const expected = targetParams.get(key);
    const actual = params.get(key);
    if (key === 'tab' && path === '/admin/finance' && item.key === 'overview') {
      if ((actual || 'executive-summary') !== 'executive-summary') return false;
      continue;
    }
    if (expected !== actual) return false;
  }

  if (target.hash) return hash === target.hash;
  return true;
}
