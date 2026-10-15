import { canAccessAmsRoute, type AmsRole } from './amsNavigationAccess';

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
    { key: 'pipeline', label: 'Pipeline', to: '/admin/crm' },
    { key: 'clients', label: 'Clients', to: '/admin/clients/all-clients' },
    { key: 'onboarding', label: 'Onboarding', to: '/admin/clients/all-clients#client-onboarding-readiness' },
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
    { key: 'retainers', label: 'Retainers', to: '/admin/clients/retainers' },
    { key: 'team', label: 'Team', to: '/admin/team' },
    { key: 'capacity', label: 'Capacity', to: '/admin/team?view=capacity-allocation' },
    { key: 'time', label: 'Time', to: '/admin/time-logs' },
  ],
  finance: [
    { key: 'overview', label: 'Overview', to: '/admin/finance?tab=executive-summary', slug: 'finance-tab-overview-control' },
    { key: 'transactions', label: 'Transactions', to: '/admin/finance?tab=cash-bank', slug: 'finance-tab-transactions-cash' },
    { key: 'receivables', label: 'Invoices', to: '/admin/finance?tab=accounts-receivable', slug: 'finance-tab-receivables-payables' },
    { key: 'expenses', label: 'Expenses', to: '/admin/finance?tab=accounts-payable' },
    { key: 'projects', label: 'Profit', to: '/admin/finance?tab=project-finance', slug: 'finance-tab-project-finance' },
    { key: 'accounting', label: 'Accounting', to: '/admin/finance?tab=journal', slug: 'finance-tab-accounting-reports' },
    { key: 'quotes', label: 'Quotes', to: '/admin/proposals' },
    { key: 'vendors', label: 'Vendors', to: '/admin/vendors' },
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
    { key: 'backup', label: 'Backup', to: '/admin/settings?tab=overview' },
    { key: 'access', label: 'Access', to: '/admin/settings?tab=security' },
    { key: 'audit', label: 'Audit', to: '/admin/settings?tab=audit' },
    { key: 'integrations', label: 'Integrations', to: '/admin/settings?tab=integrations' },
    { key: 'readiness', label: 'Readiness', to: '/admin/navigation/release-readiness' },
  ],
  tasks: [],
};

/**
 * Returns module-specific navigation links after applying the same route access
 * rules used by the client-side route guard. This keeps menus role-aware instead
 * of merely hiding unauthorized destinations in the page content.
 */
export function getAmsModuleSubnavigation(
  moduleKey: AmsSidebarModuleKey,
  role: AmsRole
): AmsSidebarSubnavigationItem[] {
  let items = MODULE_SUBNAVIGATION[moduleKey];

  if (moduleKey === 'projects') {
    if (role === 'Freelancer') return [];
    if (role === 'Finance' || role === 'Creative') {
      items = items.filter((item) => ['sprint', 'tasks'].includes(item.key));
    }
  }

  if (moduleKey === 'projects') {
    items = items.map((item) => {
      if (item.key === 'tasks') {
        return {
          ...item,
          label: role === 'Freelancer' ? 'My Task' : 'Tasks',
          to: ['Finance', 'Creative', 'Freelancer'].includes(role)
            ? '/admin/tasks?taskscope=my&workspace=project'
            : '/admin/tasks',
        };
      }
      return item;
    });
  }

  return items.filter((item) => {
    const target = new URL(item.to, 'https://ams.kapitech.local');
    return canAccessAmsRoute(role, target.pathname, target.search);
  });
}

/**
 * Query-aware active state for sidebar submenu links. Navigation tabs often
 * share the same pathname, so comparing pathname alone incorrectly highlights
 * several links at once.
 */
export function isAmsModuleSubnavigationItemActive(
  item: Pick<AmsSidebarSubnavigationItem, 'key' | 'to'>,
  pathname: string,
  search = '',
  hash = ''
): boolean {
  const path = pathname.replace(/\\/+$/, '') || '/';
  const params = new URLSearchParams(search);
  const target = new URL(item.to, 'https://ams.kapitech.local');
  const targetPath = target.pathname.replace(/\\/+$/, '') || '/';
  if (path !== targetPath) return false;

  if (item.key === 'overview' && path === '/admin/dashboard') {
    return !params.get('view') || params.get('view') === 'overview';
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
