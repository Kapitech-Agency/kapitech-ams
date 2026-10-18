import { canAccessAmsRoute, type AmsRole } from './amsNavigationAccess';

export type AmsSidebarModuleKey = 'dashboard' | 'inbox' | 'projects' | 'clients' | 'finance' | 'team' | 'documents' | 'cms' | 'settings' | 'crm' | 'tasks';

export interface AmsSidebarSubnavigationItem {
  key: string;
  label: string;
  to: string;
  slug?: string;
}

export function getAmsWorkspaceNavigationModule(pathname: string, search = ''): AmsSidebarModuleKey | null {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (path === '/admin/dashboard') return 'dashboard';
  if (path === '/admin/inbox') return 'inbox';
  if (path === '/admin/documents') return 'documents';
  if (path === '/admin/finance' || path.startsWith('/admin/finance/')) return 'finance';
  if (path === '/admin/projects') return 'projects';
  if (path === '/admin/tasks') {
    const params = new URLSearchParams(search);
    // Role-specific My Hub is a personal task destination, not the Projects workspace.
    if (params.get('taskscope') === 'my' && params.get('workspace') !== 'project') return null;
    return 'projects';
  }
  if (path === '/admin/clients' || path.startsWith('/admin/clients/') || path === '/admin/contracts') return 'clients';
  if (path === '/admin/team' || path === '/admin/time-logs' || path === '/admin/vendors') return 'team';
  if (path.startsWith('/admin/cms/')) return 'cms';
  if (path === '/admin/settings' || path === '/admin/navigation/release-readiness') return 'settings';
  return null;
}

const MODULE_SUBNAVIGATION: Record<AmsSidebarModuleKey, AmsSidebarSubnavigationItem[]> = {
  dashboard: [
    { key: 'overview', label: 'Overview', to: '/admin/dashboard' },
    { key: 'performance', label: 'Performance', to: '/admin/dashboard?view=performance' },
    { key: 'analytics', label: 'Analytics', to: '/admin/dashboard?view=analytics' },
  ],
  inbox: [
    { key: 'overview', label: 'Overview', to: '/admin/inbox?view=overview', slug: 'inbox-tab-overview' },
    { key: 'client', label: 'Client Requests', to: '/admin/inbox?view=client', slug: 'inbox-tab-client' },
    { key: 'starred', label: 'Starred', to: '/admin/inbox?view=starred', slug: 'inbox-tab-starred' },
  ],
  // The old CRM route is a compatibility redirect and owns no new local navigation.
  crm: [],
  projects: [
    { key: 'all', label: 'Projects', to: '/admin/projects' },
    { key: 'sprint', label: 'Delivery', to: '/admin/projects?projects=sprint' },
    { key: 'budget', label: 'Budget', to: '/admin/projects?projects=budget' },
    { key: 'archived', label: 'Archived', to: '/admin/projects?projects=archived' },
    { key: 'tasks', label: 'Tasks', to: '/admin/tasks' },
  ],
  // Finance area navigation sits above the page header. Worksheets remain a secondary row inside Finance.
  // Quotations stay within Receivables & Payables; they are not a primary navigation module.
  finance: [
    { key: 'overview', label: 'Overview & Control', to: '/admin/finance?tab=executive-summary', slug: 'finance-tab-overview-control' },
    { key: 'transactions', label: 'Transactions & Cash', to: '/admin/finance?tab=cash-bank', slug: 'finance-tab-transactions-cash' },
    { key: 'receivables', label: 'Receivables & Payables', to: '/admin/finance?tab=accounts-receivable', slug: 'finance-tab-receivables-payables' },
    { key: 'projects', label: 'Project Finance', to: '/admin/finance?tab=project-finance', slug: 'finance-tab-project-finance' },
    { key: 'accounting', label: 'Accounting & Reports', to: '/admin/finance?tab=journal', slug: 'finance-tab-accounting-reports' },
  ],
  clients: [
    { key: 'directory', label: 'Client directory', to: '/admin/clients/all-clients' },
    { key: 'onboarding', label: 'Onboarding', to: '/admin/clients/all-clients?scope=onboarding' },
    { key: 'contracts', label: 'Contracts', to: '/admin/contracts' },
    { key: 'retainers', label: 'Retainers', to: '/admin/clients/retainers' },
    { key: 'sla', label: 'SLA monitoring', to: '/admin/clients/sla-monitoring' },
  ],
  team: [
    { key: 'team', label: 'Team directory', to: '/admin/team' },
    { key: 'capacity', label: 'Capacity', to: '/admin/team?view=capacity-allocation' },
    { key: 'skills', label: 'Skill matrix', to: '/admin/vendors?view=skill-matrix' },
    { key: 'vendors', label: 'Vendors & freelancers', to: '/admin/vendors' },
    { key: 'time', label: 'Time tracking', to: '/admin/time-logs' },
  ],
  documents: [
    { key: 'all', label: 'All Documents', to: '/admin/documents', slug: 'documents-tab-all' },
    { key: 'sops', label: 'SOP & Guides', to: '/admin/documents?documents=sops', slug: 'documents-tab-sops' },
    { key: 'legal', label: 'Legal & Corporate', to: '/admin/documents?documents=legal', slug: 'documents-tab-legal' },
    { key: 'finance', label: 'Finance & Tax', to: '/admin/documents?documents=finance', slug: 'documents-tab-finance' },
    { key: 'hr', label: 'HR & People', to: '/admin/documents?documents=hr', slug: 'documents-tab-hr' },
    { key: 'infra', label: 'Security & Keys', to: '/admin/documents?documents=infra', slug: 'documents-tab-infra' },
  ],
  cms: [
    { key: 'projects', label: 'Case studies', to: '/admin/cms/projects', slug: 'cms-tab-projects' },
    { key: 'insights', label: 'Insights', to: '/admin/cms/insights', slug: 'cms-tab-insights' },
    { key: 'testimonials', label: 'Testimonials', to: '/admin/cms/testimonials', slug: 'cms-tab-testimonials' },
    { key: 'services', label: 'Services', to: '/admin/cms/services', slug: 'cms-tab-services' },
    { key: 'careers', label: 'Careers', to: '/admin/cms/careers', slug: 'cms-tab-careers' },
  ],
  settings: [
    { key: 'backup', label: 'System overview', to: '/admin/settings?tab=overview' },
    { key: 'access', label: 'Access & security', to: '/admin/settings?tab=security' },
    { key: 'audit', label: 'Audit log', to: '/admin/settings?tab=audit' },
    { key: 'integrations', label: 'Integrations', to: '/admin/settings?tab=integrations' },
  ],
  tasks: [],
};

/**
 * Contextual navigation lists the views owned by the current module.
 * A module's default view must remain visible here even when its URL matches
 * the sidebar destination: sidebar navigation and in-module navigation serve
 * different purposes. Route access is still enforced by the existing policy.
 */
export function getAmsModuleSubnavigation(
  moduleKey: AmsSidebarModuleKey,
  role: AmsRole,
  allowMfaSetup = false
): AmsSidebarSubnavigationItem[] {
  let items = MODULE_SUBNAVIGATION[moduleKey];
  const mfaAccessOnly = moduleKey === 'settings' && allowMfaSetup && role !== 'Admin';

  if (mfaAccessOnly) {
    items = [{ key: 'access', label: 'Access', to: '/admin/settings?tab=security' }];
  } else if (moduleKey === 'projects') {
    if (role === 'Freelancer') {
      items = [{ key: 'tasks', label: 'Assigned Tasks', to: '/admin/tasks?taskscope=my&workspace=project' }];
    } else {
      if (role === 'Finance' || role === 'Creative') {
        items = items.filter((item) => ['sprint', 'tasks'].includes(item.key));
      }
      items = items.map((item) => item.key !== 'tasks' ? item : ({
        ...item,
        label: 'Tasks',
        to: role === 'Finance' || role === 'Creative'
          ? '/admin/tasks?taskscope=my&workspace=project'
          : '/admin/tasks',
      }));
    }
  } else if (moduleKey === 'team' && role === 'Finance') {
    // Skill coverage is an operational capability view, not part of Finance's vendor workspace.
    items = items.filter((item) => item.key !== 'skills');
  } else if (moduleKey === 'cms') {
    // CMS entry points are role-specific: Admin opens Case Studies, while PM
    // and Creative enter through Insights. Keep the default destination first.
    if (role !== 'Admin') {
      items = [
        ...items.filter((item) => item.key === 'insights'),
        ...items.filter((item) => item.key !== 'insights'),
      ];
    }

    // Finance and PM can review applicants but cannot manage job openings.
    // Give them a destination that matches their permitted Careers workspace.
    if (
      role !== 'Admin'
      && canAccessAmsRoute(role, '/admin/cms/careers', '?tab=applicants')
      && !canAccessAmsRoute(role, '/admin/cms/careers')
    ) {
      items = items.map((item) => item.key === 'careers'
        ? { ...item, label: 'Applicants', to: '/admin/cms/careers?tab=applicants' }
        : item);
    }
  }

  return items.filter((item) => {
    if (mfaAccessOnly) return true;
    const target = new URL(item.to, 'https://ams.kapitech.local');
    return canAccessAmsRoute(role, target.pathname, target.search);
  });
}

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

  if (path === '/admin/finance/quotations') return item.key === 'receivables';

  if (path === '/admin/inbox') {
    const requestedView = params.get('view');
    const selectedView = requestedView && ['overview', 'client', 'starred'].includes(requestedView)
      ? requestedView
      : 'overview';
    return item.key === selectedView;
  }
  if (path === '/admin/documents') return item.key === (params.get('documents') || 'all');

  if (path === '/admin/finance') {
    const financeGroups: Record<string, string[]> = {
      overview: ['executive-summary', 'dashboard'],
      transactions: ['cash-bank', 'revenue', 'expenses', 'petty-cash'],
      receivables: ['accounts-receivable', 'accounts-payable', 'vendors', 'quotations'],
      projects: ['project-finance', 'operational-budget', 'project-allocation', 'team-fee'],
      accounting: ['journal', 'chart-of-accounts', 'monthly-pnl', 'cash-flow', 'balance-sheet', 'monthly-closing', 'annual-summary'],
    };
    const validTabs = Object.values(financeGroups).flat();
    const selectedTab = params.get('tab') || 'executive-summary';
    const normalizedTab = validTabs.includes(selectedTab) ? selectedTab : 'executive-summary';
    if (item.key in financeGroups) return financeGroups[item.key].includes(normalizedTab);
  }

  if (item.key === 'overview' && path === '/admin/dashboard') {
    return !params.get('view') || params.get('view') === 'overview';
  }
  if (item.key === 'performance' && path === '/admin/dashboard') return params.get('view') === 'performance';
  if (item.key === 'analytics' && path === '/admin/dashboard') return params.get('view') === 'analytics';

  if (path === '/admin/projects') {
    const requestedView = params.get('projects');
    const selectedView = requestedView && ['sprint', 'budget', 'archived'].includes(requestedView)
      ? requestedView
      : 'all';
    return item.key === selectedView;
  }
  if (item.key === 'tasks' && path === '/admin/tasks') {
    return params.get('taskscope') !== 'my' || params.get('workspace') === 'project';
  }

  if (item.key === 'directory' && path === '/admin/clients/all-clients') {
    return params.get('scope') !== 'onboarding' && hash !== '#client-onboarding-readiness';
  }
  if (item.key === 'onboarding' && path === '/admin/clients/all-clients') {
    return params.get('scope') === 'onboarding' || hash === '#client-onboarding-readiness';
  }
  if (item.key === 'contracts') return path === '/admin/contracts';
  if (item.key === 'retainers') return path === '/admin/clients/retainers';
  if (item.key === 'sla') return path === '/admin/clients/sla-monitoring';

  if (item.key === 'team' && path === '/admin/team') return params.get('view') !== 'capacity-allocation';
  if (item.key === 'capacity' && path === '/admin/team') return params.get('view') === 'capacity-allocation';
  if (item.key === 'vendors') return path === '/admin/vendors' && params.get('view') !== 'skill-matrix';
  if (item.key === 'skills') return path === '/admin/vendors' && params.get('view') === 'skill-matrix';
  if (item.key === 'time') return path === '/admin/time-logs';

  if (item.key === 'backup' && path === '/admin/settings') return !params.get('tab') || params.get('tab') === 'overview';
  if (item.key === 'access' && path === '/admin/settings') return ['profile', 'rbac', 'security'].includes(params.get('tab') || '');
  if (item.key === 'audit' && path === '/admin/settings') return params.get('tab') === 'audit';
  if (item.key === 'integrations' && path === '/admin/settings') return ['branding', 'api', 'integrations'].includes(params.get('tab') || '');

  if (path !== targetPath) return false;
  const targetParams = target.searchParams;
  // Extra page-local query state (for example Careers' ?tab=applicants)
  // must not clear the active module tab. Only compare parameters that define
  // the navigation destination itself.
  for (const key of targetParams.keys()) {
    if (targetParams.get(key) !== params.get(key)) return false;
  }
  if (target.hash) return hash === target.hash;
  return true;
}
