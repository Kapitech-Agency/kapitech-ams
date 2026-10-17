import { canAccessAmsRoute, type AmsRole } from './amsNavigationAccess';

export type AmsSidebarModuleKey = 'dashboard' | 'crm' | 'projects' | 'finance' | 'clients' | 'team' | 'cms' | 'settings' | 'tasks';

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
  // Finance owns its five workbook areas and the existing quotation workflow.
  // Quotations are linked from the Receivables & Payables workspace, not a second sidebar item.
  finance: [],
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
  cms: [
    { key: 'insights', label: 'Insights', to: '/admin/cms/insights', slug: 'cms-tab-insights' },
    { key: 'projects', label: 'Portfolio', to: '/admin/cms/projects', slug: 'cms-tab-projects' },
    { key: 'testimonials', label: 'Testimonials', to: '/admin/cms/testimonials', slug: 'cms-tab-testimonials' },
    { key: 'services', label: 'Services', to: '/admin/cms/services', slug: 'cms-tab-services' },
    { key: 'careers', label: 'Careers', to: '/admin/cms/careers', slug: 'cms-tab-careers' },
  ],
  settings: [
    { key: 'backup', label: 'DB migrations & backups', to: '/admin/settings?tab=overview' },
    { key: 'access', label: 'Access & confidential cost rates', to: '/admin/settings?tab=security' },
    { key: 'audit', label: 'Audit', to: '/admin/settings?tab=audit' },
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

  if (item.key === 'overview' && path === '/admin/dashboard') {
    return !params.get('view') || params.get('view') === 'overview';
  }
  if (item.key === 'performance' && path === '/admin/dashboard') return params.get('view') === 'performance';
  if (item.key === 'analytics' && path === '/admin/dashboard') return params.get('view') === 'analytics';

  if (item.key === 'all' && path === '/admin/projects') return !params.get('projects') || params.get('projects') === 'all';
  if (item.key === 'sprint' && path === '/admin/projects') return params.get('projects') === 'sprint';
  if (item.key === 'budget' && path === '/admin/projects') return params.get('projects') === 'budget';
  if (item.key === 'archived' && path === '/admin/projects') return params.get('projects') === 'archived';
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
  for (const key of new Set([...targetParams.keys(), ...params.keys()])) {
    if (targetParams.get(key) !== params.get(key)) return false;
  }
  if (target.hash) return hash === target.hash;
  return true;
}
