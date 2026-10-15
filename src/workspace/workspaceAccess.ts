export type WorkspaceRole = 'Admin' | 'Finance' | 'PM' | 'Creative' | 'Freelancer';
export type WorkspaceRouteKey =
  | 'executive-overview'
  | 'personal-workspace'
  | 'activity-stream'
  | 'sales-pipeline'
  | 'client-directory'
  | 'client-onboarding'
  | 'project-hub'
  | 'task-engine'
  | 'retainer-manager'
  | 'quotation-builder'
  | 'invoice-ledger'
  | 'expense-ledger'
  | 'project-profitability'
  | 'cms-editorial'
  | 'system-settings';

export type WorkspaceAccessMode = 'full' | 'read-only' | 'aggregate' | 'member' | 'assigned' | 'editor' | 'denied';

export interface WorkspaceNavItem {
  key: WorkspaceRouteKey;
  label: string;
  path: string;
  description: string;
  roles: WorkspaceRole[];
}

export interface WorkspaceNavGroup {
  key: string;
  label: string;
  items: WorkspaceNavItem[];
}

export const WORKSPACE_ROLES: readonly WorkspaceRole[] = ['Admin', 'Finance', 'PM', 'Creative', 'Freelancer'];

const ALL_ROLES: WorkspaceRole[] = ['Admin', 'Finance', 'PM', 'Creative', 'Freelancer'];
const LEADERSHIP_ROLES: WorkspaceRole[] = ['Admin', 'Finance', 'PM'];
const CORE_ROLES: WorkspaceRole[] = ['Admin', 'PM', 'Creative', 'Freelancer'];
const ADMIN_FINANCE: WorkspaceRole[] = ['Admin', 'Finance'];
const ADMIN_PM: WorkspaceRole[] = ['Admin', 'PM'];

export const WORKSPACE_NAV_GROUPS: WorkspaceNavGroup[] = [
  {
    key: 'dashboard',
    label: 'Main Dashboard',
    items: [
      { key: 'executive-overview', label: 'Executive Agency Overview', path: '/workspace/dashboard/overview', description: 'Agency performance, utilization and commercial pipeline.', roles: LEADERSHIP_ROLES },
      { key: 'personal-workspace', label: 'Personal Workspace / My Hub', path: '/workspace/dashboard/my-hub', description: 'Your deadlines, current work and time tracker.', roles: ALL_ROLES },
      { key: 'activity-stream', label: 'Live Activity Stream', path: '/workspace/dashboard/activity', description: 'Chronological operational activity and audit events.', roles: ALL_ROLES },
    ],
  },
  {
    key: 'crm',
    label: 'Client & Pipeline',
    items: [
      { key: 'sales-pipeline', label: 'Sales & Deal Pipeline', path: '/workspace/crm/pipeline', description: 'Opportunity stages and weighted revenue forecasts.', roles: ['Admin', 'Finance', 'PM'] },
      { key: 'client-directory', label: 'Client Directory', path: '/workspace/crm/clients', description: 'Corporate profiles, tax records and primary contacts.', roles: LEADERSHIP_ROLES },
      { key: 'client-onboarding', label: 'Client Onboarding Framework', path: '/workspace/crm/onboarding', description: 'Closed-won handoff milestones and contract archive.', roles: LEADERSHIP_ROLES },
    ],
  },
  {
    key: 'projects',
    label: 'Projects & Workspace',
    items: [
      { key: 'project-hub', label: 'Project Hub', path: '/workspace/projects/hub', description: 'Delivery board, timeline and project matrix.', roles: CORE_ROLES },
      { key: 'task-engine', label: 'Task & Deliverables Engine', path: '/workspace/projects/tasks', description: 'Task hierarchy, proofing and review discussions.', roles: CORE_ROLES },
      { key: 'retainer-manager', label: 'Retainer Manager & Hours Pool', path: '/workspace/projects/retainers', description: 'Monthly hours allocation, consumption and alerts.', roles: ADMIN_PM },
    ],
  },
  {
    key: 'finance',
    label: 'Finance & Ledger Control',
    items: [
      { key: 'quotation-builder', label: 'Quotations & Proposals Builder', path: '/workspace/finance/quotes', description: 'Commercial models, line items and version history.', roles: ADMIN_FINANCE },
      { key: 'invoice-ledger', label: 'Invoicing & Accounts Receivable', path: '/workspace/finance/invoices', description: 'Milestone billing schedule and aging invoice tracker.', roles: ADMIN_FINANCE },
      { key: 'expense-ledger', label: 'Expense & Vendor Ledger', path: '/workspace/finance/ledger', description: 'Operational outflows with vendor and contract references.', roles: ADMIN_FINANCE },
      { key: 'project-profitability', label: 'Real-Time Project Profitability Hub', path: '/workspace/finance/profitability', description: 'Project-level contribution, cost burn and margin.', roles: ['Admin', 'Finance', 'PM'] },
    ],
  },
  {
    key: 'cms',
    label: 'CMS & Content Management',
    items: [
      { key: 'cms-editorial', label: 'Insight Editorial Packs & Portfolio Quarantine', path: '/workspace/cms/editorial', description: 'Editorial schedules, outcome validation and publishing gates.', roles: ['Admin', 'PM', 'Creative'] },
    ],
  },
  {
    key: 'settings',
    label: 'System Settings',
    items: [
      { key: 'system-settings', label: 'User Access, Backups & Release Telemetry', path: '/workspace/settings', description: 'Role access, backup retention and production readiness.', roles: ['Admin'] },
    ],
  },
];

export const WORKSPACE_ROUTE_POLICIES: Record<WorkspaceRouteKey, { label: string; roles: WorkspaceRole[] }> = {
  'executive-overview': { label: 'Executive Agency Overview', roles: LEADERSHIP_ROLES },
  'personal-workspace': { label: 'Personal Workspace / My Hub', roles: ALL_ROLES },
  'activity-stream': { label: 'Live Activity Stream', roles: ALL_ROLES },
  'sales-pipeline': { label: 'Sales & Deal Pipeline', roles: ['Admin', 'Finance', 'PM'] },
  'client-directory': { label: 'Client Directory', roles: LEADERSHIP_ROLES },
  'client-onboarding': { label: 'Client Onboarding Framework', roles: LEADERSHIP_ROLES },
  'project-hub': { label: 'Project Hub', roles: CORE_ROLES },
  'task-engine': { label: 'Task & Deliverables Engine', roles: CORE_ROLES },
  'retainer-manager': { label: 'Retainer Manager & Hours Pool', roles: ADMIN_PM },
  'quotation-builder': { label: 'Quotations & Proposals Builder', roles: ADMIN_FINANCE },
  'invoice-ledger': { label: 'Invoicing & Accounts Receivable', roles: ADMIN_FINANCE },
  'expense-ledger': { label: 'Expense & Vendor Ledger', roles: ADMIN_FINANCE },
  'project-profitability': { label: 'Real-Time Project Profitability Hub', roles: ['Admin', 'Finance', 'PM'] },
  'cms-editorial': { label: 'Insight Editorial Packs & Portfolio Quarantine', roles: ['Admin', 'PM', 'Creative'] },
  'system-settings': { label: 'System Settings', roles: ['Admin'] },
};

export function normalizeWorkspaceRole(role?: string | null): WorkspaceRole | null {
  if (!role || typeof role !== 'string') return null;
  const normalized = role.trim().toLowerCase().replace(/\\s+/g, ' ');
  if (['admin', 'administrator', 'master', 'master administrator', 'system administrator'].includes(normalized)) return 'Admin';
  if (['finance', 'financial officer', 'finance officer'].includes(normalized)) return 'Finance';
  if (['pm', 'project manager', 'tier 2: project manager (pm)'].includes(normalized)) return 'PM';
  if (['creative', 'creative staff', 'internal staff', 'internal creative'].includes(normalized)) return 'Creative';
  if (['freelancer', 'freelance', 'external freelancer'].includes(normalized)) return 'Freelancer';
  return null;
}

export function canAccessWorkspaceRoute(role: WorkspaceRole | null, routeKey: WorkspaceRouteKey): boolean {
  return Boolean(role && WORKSPACE_ROUTE_POLICIES[routeKey].roles.includes(role));
}

export function getWorkspaceAccessMode(role: WorkspaceRole | null, routeKey: WorkspaceRouteKey): WorkspaceAccessMode {
  if (!role || !canAccessWorkspaceRoute(role, routeKey)) return 'denied';
  if (routeKey === 'sales-pipeline' && role === 'PM') return 'read-only';
  if (routeKey === 'project-profitability' && role === 'PM') return 'aggregate';
  if (routeKey === 'project-hub' && role === 'Creative') return 'member';
  if (routeKey === 'project-hub' && role === 'Freelancer') return 'assigned';
  if (routeKey === 'task-engine' && role === 'Creative') return 'member';
  if (routeKey === 'task-engine' && role === 'Freelancer') return 'assigned';
  if (routeKey === 'cms-editorial' && role === 'Creative') return 'editor';
  return 'full';
}

export function workspaceLandingPath(role: WorkspaceRole | null): string {
  return role === 'Admin' || role === 'Finance' || role === 'PM'
    ? '/workspace/dashboard/overview'
    : '/workspace/dashboard/my-hub';
}
