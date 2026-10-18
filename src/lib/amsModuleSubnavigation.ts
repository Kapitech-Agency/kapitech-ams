import { canAccessAmsRoute, type AmsRole } from './amsNavigationAccess';

export type AmsSidebarModuleKey = 'dashboard' | 'inbox' | 'projects' | 'clients' | 'finance' | 'team' | 'documents' | 'cms' | 'settings' | 'crm' | 'tasks';

export interface AmsSidebarSubnavigationItem {
  key: string;
  label: string;
  to: string;
  slug?: string;
  /** False means the documented workspace exists in the target architecture but is not implemented yet. */
  available?: boolean;
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
    if (params.get('taskscope') === 'my' && params.get('workspace') !== 'project') return null;
    return 'projects';
  }
  if (path === '/admin/clients' || path.startsWith('/admin/clients/') || path === '/admin/contracts') return 'clients';
  if (path === '/admin/team' || path === '/admin/time-logs' || path === '/admin/vendors') return 'team';
  if (path.startsWith('/admin/cms/')) return 'cms';
  if (path === '/admin/settings') return 'settings';
  return null;
}

/** Persistent contextual navigation contains module workspaces only. Worksheet and filter controls stay in the owning page. */
const MODULE_SUBNAVIGATION: Record<AmsSidebarModuleKey, AmsSidebarSubnavigationItem[]> = {
  dashboard: [
    { key: 'overview', label: 'Overview', to: '/admin/dashboard' },
    { key: 'performance', label: 'Performance', to: '/admin/dashboard?view=performance' },
    { key: 'analytics', label: 'Analytics', to: '/admin/dashboard?view=analytics' },
  ],
  inbox: [
    { key: 'overview', label: 'Overview', to: '/admin/inbox?view=overview', slug: 'inbox-workspace-overview' },
    { key: 'messages', label: 'Messages', to: '/admin/inbox?view=messages', slug: 'inbox-workspace-messages' },
    { key: 'follow-ups', label: 'Follow-ups', to: '/admin/inbox', available: false },
    { key: 'routing-templates', label: 'Routing & Templates', to: '/admin/inbox', available: false },
  ],
  crm: [],
  projects: [
    { key: 'overview', label: 'Overview', to: '/admin/projects?projects=overview', slug: 'projects-workspace-overview' },
    { key: 'registry', label: 'Project Registry', to: '/admin/projects?projects=all', slug: 'projects-workspace-registry' },
    { key: 'tasks', label: 'Tasks & Execution', to: '/admin/tasks', slug: 'projects-workspace-tasks' },
    { key: 'planning-delivery', label: 'Planning & Delivery', to: '/admin/projects', available: false },
    { key: 'content-campaigns', label: 'Content & Campaigns', to: '/admin/projects', available: false },
    { key: 'resources', label: 'Project Resources', to: '/admin/projects', available: false },
    { key: 'controls', label: 'Project Controls', to: '/admin/projects?projects=budget', slug: 'projects-workspace-controls' },
  ],
  clients: [
    { key: 'directory', label: 'Directory', to: '/admin/clients/all-clients', slug: 'clients-workspace-directory' },
    { key: 'onboarding', label: 'Onboarding', to: '/admin/clients/all-clients?scope=onboarding', slug: 'clients-workspace-onboarding' },
    { key: 'agreements', label: 'Agreements', to: '/admin/contracts', slug: 'clients-workspace-agreements' },
    { key: 'service-health', label: 'Service & Health', to: '/admin/clients/sla-monitoring', slug: 'clients-workspace-service-health' },
  ],
  finance: [
    { key: 'overview', label: 'Overview & Control', to: '/admin/finance?tab=executive-summary', slug: 'finance-workspace-overview-control' },
    { key: 'transactions', label: 'Transactions & Cash', to: '/admin/finance?tab=cash-bank', slug: 'finance-workspace-transactions-cash' },
    { key: 'receivables', label: 'Receivables & Payables', to: '/admin/finance?tab=accounts-receivable', slug: 'finance-workspace-receivables-payables' },
    { key: 'projects', label: 'Project Finance', to: '/admin/finance?tab=project-finance', slug: 'finance-workspace-project-finance' },
    { key: 'accounting', label: 'Accounting & Reports', to: '/admin/finance?tab=journal', slug: 'finance-workspace-accounting-reports' },
  ],
  team: [
    { key: 'team', label: 'Team & Capacity', to: '/admin/team', slug: 'team-workspace-capacity' },
    { key: 'people-ops', label: 'People Operations', to: '/admin/team', available: false },
    { key: 'vendors', label: 'Vendors & Freelancers', to: '/admin/vendors', slug: 'team-workspace-vendors' },
    { key: 'time', label: 'Time Tracking', to: '/admin/time-logs', slug: 'team-workspace-time' },
  ],
  documents: [
    { key: 'library', label: 'Document Library', to: '/admin/documents', slug: 'documents-workspace-library' },
  ],
  cms: [
    { key: 'projects', label: 'Case Studies', to: '/admin/cms/projects', slug: 'cms-workspace-case-studies' },
    { key: 'services', label: 'Services', to: '/admin/cms/services', slug: 'cms-workspace-services' },
    { key: 'insights', label: 'Insights', to: '/admin/cms/insights', slug: 'cms-workspace-insights' },
    { key: 'testimonials', label: 'Testimonials', to: '/admin/cms/testimonials', slug: 'cms-workspace-testimonials' },
    { key: 'careers', label: 'Careers', to: '/admin/cms/careers', slug: 'cms-workspace-careers' },
  ],
  settings: [
    { key: 'overview', label: 'System Overview', to: '/admin/settings?tab=overview', slug: 'settings-workspace-overview' },
    { key: 'access', label: 'Users & Access', to: '/admin/settings?tab=security', slug: 'settings-workspace-access' },
    { key: 'audit', label: 'Audit Log', to: '/admin/settings?tab=audit', slug: 'settings-workspace-audit' },
    { key: 'integrations', label: 'Integrations', to: '/admin/settings?tab=integrations', slug: 'settings-workspace-integrations' },
  ],
  tasks: [],
};

export function getAmsModuleSubnavigation(
  moduleKey: AmsSidebarModuleKey,
  role: AmsRole,
  allowMfaSetup = false
): AmsSidebarSubnavigationItem[] {
  let items = MODULE_SUBNAVIGATION[moduleKey];
  const mfaAccessOnly = moduleKey === 'settings' && allowMfaSetup && role !== 'Admin';
  if (mfaAccessOnly) {
    items = [{ key: 'access', label: 'Users & Access', to: '/admin/settings?tab=security' }];
  } else if (moduleKey === 'projects') {
    if (role === 'Freelancer') {
      items = [{ key: 'tasks', label: 'Tasks & Execution', to: '/admin/tasks?taskscope=my&workspace=project' }];
    } else if (role === 'Finance' || role === 'Creative') {
      items = items.filter((item) => item.key === 'tasks').map((item) => ({ ...item, to: '/admin/projects?projects=sprint' }));
    }
  } else if (moduleKey === 'team' && role === 'Finance') {
    items = items.filter((item) => item.key === 'vendors');
  } else if (moduleKey === 'cms' && role !== 'Admin') {
    items = [...items.filter((item) => item.key === 'insights'), ...items.filter((item) => item.key !== 'insights')];
    if (canAccessAmsRoute(role, '/admin/cms/careers', '?tab=applicants') && !canAccessAmsRoute(role, '/admin/cms/careers')) {
      items = items.map((item) => item.key === 'careers' ? { ...item, label: 'Applicants', to: '/admin/cms/careers?tab=applicants' } : item);
    }
  }
  return items.filter((item) => {
    if (mfaAccessOnly) return true;
    const target = new URL(item.to, 'https://ams.kapitech.local');
    return canAccessAmsRoute(role, target.pathname, target.search);
  });
}

export function isAmsModuleSubnavigationItemActive(
  item: Pick<AmsSidebarSubnavigationItem, 'key' | 'to' | 'available'>,
  pathname: string,
  search = '',
  hash = ''
): boolean {
  if (item.available === false) return false;
  const path = pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(search);
  const target = new URL(item.to, 'https://ams.kapitech.local');
  const targetPath = target.pathname.replace(/\/+$/, '') || '/';
  const itemKey = item.key;

  if (path === '/admin/finance/quotations') return itemKey === 'receivables';
  if (path === '/admin/inbox') {
    const requestedView = params.get('view') || 'overview';
    const selectedView = ['overview', 'messages', 'client', 'starred'].includes(requestedView)
      ? requestedView
      : 'overview';
    return itemKey === (selectedView === 'overview' ? 'overview' : 'messages');
  }
  if (path === '/admin/documents') return itemKey === 'library';
  if (path === '/admin/finance') {
    const groups: Record<string, string[]> = {
      overview: ['executive-summary', 'dashboard'],
      transactions: ['cash-bank', 'revenue', 'expenses', 'petty-cash'],
      receivables: ['accounts-receivable', 'accounts-payable', 'vendors', 'quotations'],
      projects: ['project-finance', 'operational-budget', 'project-allocation', 'team-fee'],
      accounting: ['journal', 'chart-of-accounts', 'monthly-pnl', 'cash-flow', 'balance-sheet', 'monthly-closing', 'annual-summary'],
    };
    const tabs = Object.values(groups).flat();
    const selected = params.get('tab') || 'executive-summary';
    const normalized = tabs.includes(selected) ? selected : 'executive-summary';
    if (itemKey in groups) return groups[itemKey].includes(normalized);
  }
  if (path === '/admin/dashboard') {
    if (itemKey === 'overview') return !params.get('view') || params.get('view') === 'overview';
    if (itemKey === 'performance') return params.get('view') === 'performance';
    if (itemKey === 'analytics') return params.get('view') === 'analytics';
  }
  if (path === '/admin/projects') {
    const selected = params.get('projects') || 'all';
    if (selected === 'overview') return itemKey === 'overview';
    if (['all', 'planning', 'active', 'on-hold', 'completed', 'archived'].includes(selected)) return itemKey === 'registry';
    if (selected === 'budget') return itemKey === 'controls';
    if (selected === 'sprint') return itemKey === 'tasks';
    return itemKey === 'registry';
  }
  if (itemKey === 'tasks' && path === '/admin/tasks') return params.get('taskscope') !== 'my' || params.get('workspace') === 'project';
  if (path === '/admin/clients/all-clients') {
    if (itemKey === 'directory') return params.get('scope') !== 'onboarding' && hash !== '#client-onboarding-readiness';
    if (itemKey === 'onboarding') return params.get('scope') === 'onboarding' || hash === '#client-onboarding-readiness';
  }
  if (itemKey === 'agreements') return path === '/admin/contracts' || path === '/admin/clients/retainers';
  if (itemKey === 'service-health') return path === '/admin/clients/sla-monitoring';
  if (itemKey === 'team' && path === '/admin/team') return true;
  if (itemKey === 'vendors') return path === '/admin/vendors';
  if (itemKey === 'time') return path === '/admin/time-logs';
  if (itemKey === 'overview' && path === '/admin/settings') return !params.get('tab') || params.get('tab') === 'overview';
  if (itemKey === 'access' && path === '/admin/settings') return ['profile', 'rbac', 'security'].includes(params.get('tab') || '');
  if (itemKey === 'audit' && path === '/admin/settings') return params.get('tab') === 'audit';
  if (itemKey === 'integrations' && path === '/admin/settings') return ['branding', 'api', 'integrations'].includes(params.get('tab') || '');

  if (path !== targetPath) return false;
  for (const key of target.searchParams.keys()) if (target.searchParams.get(key) !== params.get(key)) return false;
  if (target.hash) return hash === target.hash;
  return true;
}
