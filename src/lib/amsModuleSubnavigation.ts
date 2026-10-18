import { canAccessAmsRoute, type AmsRole } from './amsNavigationAccess';

export type AmsSidebarModuleKey = 'dashboard' | 'inbox' | 'projects' | 'clients' | 'finance' | 'team' | 'documents' | 'cms' | 'settings' | 'crm' | 'tasks';

export interface AmsSidebarSubnavigationItem {
  key: string;
  label: string;
  to: string;
  slug?: string;
  /** False means the destination is a documented target, but not yet implemented. */
  available?: boolean;
}

export function getAmsWorkspaceNavigationModule(pathname: string, search = ''): AmsSidebarModuleKey | null {
  const path = pathname.replace(/\\/+$/, '') || '/';

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

/**
 * Module-level tabs follow the approved Master Structure Guide.
 * Unimplemented target views remain visible but non-interactive; they must not
 * point to empty placeholder routes and must not be represented as shipped.
 */
const MODULE_SUBNAVIGATION: Record<AmsSidebarModuleKey, AmsSidebarSubnavigationItem[]> = {
  dashboard: [
    { key: 'overview', label: 'Overview', to: '/admin/dashboard' },
    { key: 'performance', label: 'Performance', to: '/admin/dashboard?view=performance' },
    { key: 'analytics', label: 'Analytics', to: '/admin/dashboard?view=analytics' },
  ],
  inbox: [
    { key: 'overview', label: 'Inbox Overview', to: '/admin/inbox?view=overview', slug: 'inbox-tab-overview' },
    { key: 'messages', label: 'All Messages', to: '/admin/inbox?view=messages', slug: 'inbox-tab-all-messages' },
    { key: 'sales-inquiries', label: 'Sales Inquiries', to: '/admin/inbox?view=client', slug: 'inbox-tab-sales-inquiries' },
    { key: 'client-requests', label: 'Client Requests', to: '/admin/inbox', available: false },
    { key: 'project-support', label: 'Project & Support Requests', to: '/admin/inbox', available: false },
    { key: 'follow-ups', label: 'Follow-ups', to: '/admin/inbox', available: false },
    { key: 'starred', label: 'Starred', to: '/admin/inbox?view=starred', slug: 'inbox-tab-starred' },
    { key: 'resolved-archived', label: 'Resolved & Archived', to: '/admin/inbox', available: false },
    { key: 'routing-templates', label: 'Routing & Response Templates', to: '/admin/inbox', available: false },
  ],
  // The old CRM route is a compatibility redirect and owns no new local navigation.
  crm: [],
  projects: [
    { key: 'overview', label: 'Projects Overview', to: '/admin/projects', available: false },
    { key: 'registry', label: 'Project Registry', to: '/admin/projects', slug: 'projects-tab-registry' },
    { key: 'planning-scope', label: 'Planning & Scope', to: '/admin/projects', available: false },
    { key: 'tasks', label: 'Tasks & Execution', to: '/admin/tasks', slug: 'projects-tab-tasks' },
    { key: 'resources', label: 'Project Resources', to: '/admin/projects', available: false },
    { key: 'deliverables', label: 'Deliverables & Quality', to: '/admin/projects', available: false },
    { key: 'content-campaigns', label: 'Content & Campaign Operations', to: '/admin/projects', available: false },
    { key: 'changes-risks', label: 'Changes, Risks & Issues', to: '/admin/projects', available: false },
    { key: 'budget', label: 'Budget & Project Health', to: '/admin/projects?projects=budget', slug: 'projects-tab-budget-health' },
    { key: 'files', label: 'Project Files', to: '/admin/projects', available: false },
    { key: 'reports-closure', label: 'Project Reports & Closure', to: '/admin/projects', available: false },
  ],
  clients: [
    { key: 'overview', label: 'Client Overview', to: '/admin/clients/all-clients', available: false },
    { key: 'directory', label: 'Client Directory', to: '/admin/clients/all-clients' },
    { key: 'onboarding', label: 'Onboarding', to: '/admin/clients/all-clients?scope=onboarding' },
    { key: 'contracts', label: 'Contracts & Agreements', to: '/admin/contracts' },
    { key: 'retainers', label: 'Retainers', to: '/admin/clients/retainers' },
    { key: 'sla', label: 'SLA & Service Operations', to: '/admin/clients/sla-monitoring' },
    { key: 'growth-health', label: 'Client Growth & Health', to: '/admin/clients/all-clients', available: false },
  ],
  // Finance area navigation sits above the page header. Its existing worksheet row remains within Finance.
  finance: [
    { key: 'overview', label: 'Overview & Control', to: '/admin/finance?tab=executive-summary', slug: 'finance-tab-overview-control' },
    { key: 'transactions', label: 'Transactions & Cash', to: '/admin/finance?tab=cash-bank', slug: 'finance-tab-transactions-cash' },
    { key: 'receivables', label: 'Receivables & Payables', to: '/admin/finance?tab=accounts-receivable', slug: 'finance-tab-receivables-payables' },
    { key: 'projects', label: 'Project Finance', to: '/admin/finance?tab=project-finance', slug: 'finance-tab-project-finance' },
    { key: 'accounting', label: 'Accounting & Reports', to: '/admin/finance?tab=journal', slug: 'finance-tab-accounting-reports' },
  ],
  team: [
    { key: 'team', label: 'Team & Capacity', to: '/admin/team' },
    { key: 'people-ops', label: 'People Operations', to: '/admin/team', available: false },
    { key: 'vendors', label: 'Vendors & Freelancers', to: '/admin/vendors' },
    { key: 'time', label: 'Time Tracking', to: '/admin/time-logs' },
  ],
  documents: [
    { key: 'overview', label: 'Document Overview', to: '/admin/documents', available: false },
    { key: 'all', label: 'All Documents', to: '/admin/documents', slug: 'documents-tab-all' },
    { key: 'project-client', label: 'Project & Client Files', to: '/admin/documents', available: false },
    { key: 'sops', label: 'SOPs & Policies', to: '/admin/documents?documents=sops', slug: 'documents-tab-sops' },
    { key: 'legal', label: 'Legal & Corporate', to: '/admin/documents?documents=legal', slug: 'documents-tab-legal' },
    { key: 'finance', label: 'Finance & Tax', to: '/admin/documents?documents=finance', slug: 'documents-tab-finance' },
    { key: 'hr', label: 'HR & People', to: '/admin/documents?documents=hr', slug: 'documents-tab-hr' },
    { key: 'infra', label: 'Security & Infrastructure', to: '/admin/documents?documents=infra', slug: 'documents-tab-infra' },
  ],
  cms: [
    { key: 'overview', label: 'CMS Overview', to: '/admin/cms/projects', available: false },
    { key: 'projects', label: 'Case Studies', to: '/admin/cms/projects', slug: 'cms-tab-projects' },
    { key: 'services', label: 'Services', to: '/admin/cms/services', slug: 'cms-tab-services' },
    { key: 'insights', label: 'Insights', to: '/admin/cms/insights', slug: 'cms-tab-insights' },
    { key: 'testimonials', label: 'Testimonials', to: '/admin/cms/testimonials', slug: 'cms-tab-testimonials' },
    { key: 'careers', label: 'Careers', to: '/admin/cms/careers', slug: 'cms-tab-careers' },
  ],
  settings: [
    { key: 'backup', label: 'System Overview', to: '/admin/settings?tab=overview' },
    { key: 'access', label: 'Users & Access', to: '/admin/settings?tab=security' },
    { key: 'audit', label: 'Audit Log', to: '/admin/settings?tab=audit' },
    { key: 'integrations', label: 'Integrations', to: '/admin/settings?tab=integrations' },
    { key: 'preferences', label: 'Preferences', to: '/admin/settings?tab=overview', available: false },
  ],
  tasks: [],
};

const MODULE_CHILDREN: Partial<Record<AmsSidebarModuleKey, Record<string, AmsSidebarSubnavigationItem[]>>> = {
  projects: {
    registry: [
      { key: 'all', label: 'All Projects', to: '/admin/projects' },
      { key: 'planning', label: 'Planning', to: '/admin/projects?projects=planning' },
      { key: 'active', label: 'Active Projects', to: '/admin/projects?projects=active' },
      { key: 'on-hold', label: 'On Hold', to: '/admin/projects?projects=on-hold' },
      { key: 'completed', label: 'Completed', to: '/admin/projects?projects=completed' },
      { key: 'archived', label: 'Archived', to: '/admin/projects?projects=archived' },
    ],
    tasks: [
      { key: 'sprint', label: 'Sprint & Delivery', to: '/admin/projects?projects=sprint' },
      { key: 'task-board', label: 'Board / Kanban', to: '/admin/tasks', available: false },
      { key: 'task-list', label: 'List', to: '/admin/tasks', available: false },
      { key: 'my-tasks', label: 'My Tasks', to: '/admin/tasks?taskscope=my&workspace=project' },
      { key: 'task-lists', label: 'Task Lists', to: '/admin/tasks', available: false },
      { key: 'dependencies', label: 'Dependencies', to: '/admin/tasks', available: false },
    ],
    budget: [
      { key: 'budget-summary', label: 'Budget Summary', to: '/admin/projects?projects=budget' },
      { key: 'planned-actual', label: 'Planned vs Actual', to: '/admin/projects?projects=budget', available: false },
      { key: 'delivery-health', label: 'Delivery Health', to: '/admin/projects?projects=budget', available: false },
    ],
    'planning-scope': [
      { key: 'brief', label: 'Project Brief', to: '/admin/projects', available: false },
      { key: 'scope', label: 'Scope & Deliverables', to: '/admin/projects', available: false },
      { key: 'milestones', label: 'Milestones', to: '/admin/projects', available: false },
      { key: 'timeline', label: 'Timeline', to: '/admin/projects', available: false },
    ],
    resources: [
      { key: 'project-team', label: 'Project Team', to: '/admin/projects', available: false },
      { key: 'assignments', label: 'Assignments', to: '/admin/projects', available: false },
      { key: 'workload', label: 'Workload', to: '/admin/projects', available: false },
    ],
    deliverables: [
      { key: 'deliverable-tracking', label: 'Deliverable Tracking', to: '/admin/projects', available: false },
      { key: 'internal-qa', label: 'Internal Quality Review', to: '/admin/projects', available: false },
      { key: 'client-review', label: 'Client Review', to: '/admin/projects', available: false },
      { key: 'revision-history', label: 'Revision History', to: '/admin/projects', available: false },
    ],
    'content-campaigns': [
      { key: 'content-calendar', label: 'Content Calendar', to: '/admin/projects', available: false },
      { key: 'content-planning', label: 'Content Planning & Briefs', to: '/admin/projects', available: false },
      { key: 'content-production', label: 'Content Production Pipeline', to: '/admin/projects', available: false },
      { key: 'creative-assets', label: 'Creative Assets & Versions', to: '/admin/projects', available: false },
      { key: 'internal-review', label: 'Internal Review & Approval', to: '/admin/projects', available: false },
      { key: 'client-feedback', label: 'Client Review & Feedback', to: '/admin/projects', available: false },
      { key: 'revision-tracking', label: 'Revision Tracking', to: '/admin/projects', available: false },
      { key: 'publishing-schedule', label: 'Publishing Schedule', to: '/admin/projects', available: false },
      { key: 'publication-status', label: 'Publication Status & Links', to: '/admin/projects', available: false },
      { key: 'campaign-tracking', label: 'Campaign Tracking', to: '/admin/projects', available: false },
      { key: 'campaign-reports', label: 'Campaign Performance Reports', to: '/admin/projects', available: false },
    ],
    'changes-risks': [
      { key: 'change-requests', label: 'Change Requests', to: '/admin/projects', available: false },
      { key: 'risks', label: 'Risks', to: '/admin/projects', available: false },
      { key: 'issues', label: 'Issues', to: '/admin/projects', available: false },
      { key: 'blockers', label: 'Blockers', to: '/admin/projects', available: false },
    ],
  },
  clients: {
    directory: [
      { key: 'companies', label: 'Companies', to: '/admin/clients/all-clients', available: false },
      { key: 'contacts', label: 'Contacts', to: '/admin/clients/all-clients', available: false },
      { key: 'client-360', label: 'Client 360°', to: '/admin/clients/all-clients', available: false },
    ],
    onboarding: [
      { key: 'onboarding-checklist', label: 'Onboarding Checklist', to: '/admin/clients/all-clients?scope=onboarding' },
      { key: 'required-documents', label: 'Required Documents', to: '/admin/clients/all-clients?scope=onboarding', available: false },
      { key: 'kickoff-readiness', label: 'Kickoff Readiness', to: '/admin/clients/all-clients?scope=onboarding', available: false },
    ],
    contracts: [
      { key: 'contract-register', label: 'Contract Register', to: '/admin/contracts' },
      { key: 'active-contracts', label: 'Active Contracts', to: '/admin/contracts', available: false },
      { key: 'expiring-contracts', label: 'Expiring Contracts', to: '/admin/contracts', available: false },
      { key: 'contract-history', label: 'Contract History', to: '/admin/contracts', available: false },
    ],
    retainers: [
      { key: 'retainer-register', label: 'Retainer Register', to: '/admin/clients/retainers' },
      { key: 'included-hours', label: 'Included Hours', to: '/admin/clients/retainers', available: false },
      { key: 'used-remaining-hours', label: 'Used & Remaining Hours', to: '/admin/clients/retainers', available: false },
      { key: 'renewal-schedule', label: 'Renewal Schedule', to: '/admin/clients/retainers', available: false },
    ],
    sla: [
      { key: 'sla-monitoring', label: 'SLA Monitoring', to: '/admin/clients/sla-monitoring' },
      { key: 'client-requests', label: 'Client Requests', to: '/admin/clients/sla-monitoring', available: false },
      { key: 'service-issues', label: 'Service Issues', to: '/admin/clients/sla-monitoring', available: false },
      { key: 'sla-history', label: 'SLA History', to: '/admin/clients/sla-monitoring', available: false },
    ],
    'growth-health': [
      { key: 'client-health', label: 'Client Health', to: '/admin/clients/all-clients', available: false },
      { key: 'renewal-opportunities', label: 'Renewal Opportunities', to: '/admin/clients/all-clients', available: false },
      { key: 'upsell-cross-sell', label: 'Upsell & Cross-sell', to: '/admin/clients/all-clients', available: false },
      { key: 'feedback-reviews', label: 'Feedback & Reviews', to: '/admin/clients/all-clients', available: false },
    ],
  },
  team: {
    team: [
      { key: 'team-directory', label: 'Team Directory', to: '/admin/team' },
      { key: 'roles-departments', label: 'Roles & Departments', to: '/admin/team', available: false },
      { key: 'capacity-allocation', label: 'Capacity Allocation', to: '/admin/team?view=capacity-allocation' },
      { key: 'availability-workload', label: 'Availability & Workload', to: '/admin/team?view=capacity-allocation', available: false },
    ],
    'people-ops': [
      { key: 'people-directory', label: 'Employee Directory & Profiles', to: '/admin/team', available: false },
      { key: 'people-onboarding', label: 'Employee Onboarding', to: '/admin/team', available: false },
      { key: 'people-offboarding', label: 'Employee Offboarding', to: '/admin/team', available: false },
      { key: 'employment-contracts', label: 'Employment Contracts & Status', to: '/admin/team', available: false },
      { key: 'leave-management', label: 'Leave Management', to: '/admin/team', available: false },
      { key: 'absence-calendar', label: 'Availability & Absence Calendar', to: '/admin/team', available: false },
      { key: 'training-development', label: 'Training & Development', to: '/admin/team', available: false },
      { key: 'performance-reviews', label: 'Performance Reviews', to: '/admin/team', available: false },
      { key: 'performance-history', label: 'Performance History', to: '/admin/team', available: false },
      { key: 'people-reports', label: 'People Operations Reports', to: '/admin/team', available: false },
    ],
    vendors: [
      { key: 'vendor-directory', label: 'Directory', to: '/admin/vendors' },
      { key: 'vendor-skills', label: 'Skills & Service Matrix', to: '/admin/vendors?view=skill-matrix' },
      { key: 'vendor-contracts-rates', label: 'Contracts & Rates', to: '/admin/vendors', available: false },
      { key: 'vendor-engagement', label: 'Engagement Status', to: '/admin/vendors', available: false },
    ],
    time: [
      { key: 'time-logs', label: 'Time Logs', to: '/admin/time-logs' },
      { key: 'my-timesheet', label: 'My Timesheet', to: '/admin/time-logs', available: false },
      { key: 'timesheet-control', label: 'Timesheet Control', to: '/admin/time-logs', available: false },
      { key: 'billable-time', label: 'Billable / Non-billable', to: '/admin/time-logs', available: false },
      { key: 'time-by-project', label: 'Time by Project', to: '/admin/time-logs', available: false },
    ],
  },
};

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
    } else if (role === 'Finance' || role === 'Creative') {
      // The existing role-specific Project entry lands on the delivery workspace, not the full portfolio registry.
      items = items
        .filter((item) => item.key === 'tasks')
        .map((item) => ({ ...item, to: '/admin/projects?projects=sprint' }));
    }
  } else if (moduleKey === 'team' && role === 'Finance') {
    // Finance roles can access the vendor/freelancer workspace, but not the internal people directory.
    items = items.filter((item) => item.key === 'vendors');
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

export function getAmsModuleSubnavigationChildren(
  moduleKey: AmsSidebarModuleKey,
  parentKey: string,
  role: AmsRole,
  allowMfaSetup = false
): AmsSidebarSubnavigationItem[] {
  if (moduleKey === 'tasks' || moduleKey === 'crm') return [];
  const parents = getAmsModuleSubnavigation(moduleKey, role, allowMfaSetup);
  if (!parents.some((item) => item.key === parentKey)) return [];
  const children = MODULE_CHILDREN[moduleKey]?.[parentKey] || [];
  return children.filter((item) => {
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
  const path = pathname.replace(/\\/+$/, '') || '/';
  const params = new URLSearchParams(search);
  const target = new URL(item.to, 'https://ams.kapitech.local');
  const targetPath = target.pathname.replace(/\\/+$/, '') || '/';
  const itemKey = item.key;

  if (path === '/admin/finance/quotations') return itemKey === 'receivables';

  if (path === '/admin/inbox') {
    const selectedView = params.get('view') || 'overview';
    return (
      (itemKey === 'overview' && selectedView === 'overview') ||
      (itemKey === 'messages' && selectedView === 'messages') ||
      (itemKey === 'sales-inquiries' && selectedView === 'client') ||
      (itemKey === 'starred' && selectedView === 'starred')
    );
  }

  if (path === '/admin/documents') return itemKey === (params.get('documents') || 'all');

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
    if (itemKey in financeGroups) return financeGroups[itemKey].includes(normalizedTab);
  }

  if (path === '/admin/dashboard') {
    if (itemKey === 'overview') return !params.get('view') || params.get('view') === 'overview';
    if (itemKey === 'performance') return params.get('view') === 'performance';
    if (itemKey === 'analytics') return params.get('view') === 'analytics';
  }

  if (path === '/admin/projects') {
    const selectedView = params.get('projects') || 'all';
    if (['all', 'planning', 'active', 'on-hold', 'completed', 'archived'].includes(selectedView)) {
      // Registry status filters are nested views under the Project Registry tab.
      return itemKey === 'registry';
    }
    if (selectedView === 'budget') return itemKey === 'budget';
    if (selectedView === 'sprint') return itemKey === 'tasks';
    return itemKey === 'registry';
  }

  if (itemKey === 'tasks' && path === '/admin/tasks') {
    return params.get('taskscope') !== 'my' || params.get('workspace') === 'project';
  }
  if (path === '/admin/clients/all-clients') {
    if (itemKey === 'directory') return params.get('scope') !== 'onboarding' && hash !== '#client-onboarding-readiness';
    if (itemKey === 'onboarding') return params.get('scope') === 'onboarding' || hash === '#client-onboarding-readiness';
  }
  if (itemKey === 'contracts') return path === '/admin/contracts';
  if (itemKey === 'retainers') return path === '/admin/clients/retainers';
  if (itemKey === 'sla') return path === '/admin/clients/sla-monitoring';

  if (itemKey === 'team' && path === '/admin/team') return true;
  if (itemKey === 'vendors') return path === '/admin/vendors' && params.get('view') !== 'skill-matrix';
  if (itemKey === 'time') return path === '/admin/time-logs';
  if (path === '/admin/vendors' && itemKey === 'vendors') return true;

  if (itemKey === 'backup' && path === '/admin/settings') return !params.get('tab') || params.get('tab') === 'overview';
  if (itemKey === 'access' && path === '/admin/settings') return ['profile', 'rbac', 'security'].includes(params.get('tab') || '');
  if (itemKey === 'audit' && path === '/admin/settings') return params.get('tab') === 'audit';
  if (itemKey === 'integrations' && path === '/admin/settings') return ['branding', 'api', 'integrations'].includes(params.get('tab') || '');

  if (path !== targetPath) return false;
  const targetParams = target.searchParams;
  for (const key of targetParams.keys()) {
    if (targetParams.get(key) !== params.get(key)) return false;
  }
  if (target.hash) return hash === target.hash;
  return true;
}

export function isAmsModuleSubnavigationChildActive(
  item: Pick<AmsSidebarSubnavigationItem, 'key' | 'to' | 'available'>,
  pathname: string,
  search = '',
): boolean {
  if (item.available === false) return false;
  const path = pathname.replace(/\\/+$/, '') || '/';
  const params = new URLSearchParams(search);
  if (path === '/admin/projects') {
    const selectedView = params.get('projects') || 'all';
    if (['all', 'planning', 'active', 'on-hold', 'completed', 'archived'].includes(selectedView)) {
      return item.key === selectedView;
    }
    return item.key === selectedView;
  }
  if (path === '/admin/team') return item.key === (params.get('view') === 'capacity-allocation' ? 'capacity-allocation' : 'team-directory');
  if (path === '/admin/vendors') return item.key === (params.get('view') === 'skill-matrix' ? 'vendor-skills' : 'vendor-directory');
  if (path === '/admin/tasks') return item.key === (params.get('taskscope') === 'my' ? 'my-tasks' : 'task-list');
  if (path === '/admin/clients/all-clients' && params.get('scope') === 'onboarding') return item.key === 'onboarding-checklist';
  if (path === '/admin/contracts') return item.key === 'contract-register';
  if (path === '/admin/clients/retainers') return item.key === 'retainer-register';
  if (path === '/admin/clients/sla-monitoring') return item.key === 'sla-monitoring';
  return path === new URL(item.to, 'https://ams.kapitech.local').pathname
    && new URL(item.to, 'https://ams.kapitech.local').search === search;
}
