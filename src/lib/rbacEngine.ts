// src/lib/rbacEngine.ts
// RBAC Permission Engine for Kapitech Agency Management System (AMS)

import { useState, useEffect } from 'react';

export type StakeholderRole = 'executive' | 'pm' | 'finance' | 'account_manager' | 'it_technical' | 'operations' | 'client_viewer';

export interface RoleMetadata {
  id: StakeholderRole;
  title: string;
  badge: string;
  scopeDescription: string;
  accountProfile: {
    displayName: string;
    accountId: string;
    avatarLabel: string;
    department: string;
  };
  allowedModuleKeys: string[];
}

export const ROLE_DEFINITIONS: Record<StakeholderRole, RoleMetadata> = {
  executive: {
    id: 'executive',
    title: 'Stakeholder Executive',
    badge: 'C-Level / Partner',
    scopeDescription: 'Strategic oversight across commercial, financial, and delivery operations.',
    accountProfile: {
      displayName: 'Executive Partner',
      accountId: 'kapitech-exec-01',
      avatarLabel: 'EX',
      department: 'Top Management & Governance'
    },
    allowedModuleKeys: [
      'dashboard',
      'executive',
      'inbox',
      'crm',
      'proposals',
      'projects',
      'approvals',
      'invoicing',
      'clients',
      'vendors',
      'documents',
      'settings'
    ]
  },
  pm: {
    id: 'pm',
    title: 'Project Manager',
    badge: 'Operations & Sprints',
    scopeDescription: 'Operational Sprints, Capacity Balancing, Client Approvals & Delivery Milestones',
    accountProfile: {
      displayName: 'Project Operations Lead',
      accountId: 'kapitech-pm-02',
      avatarLabel: 'PM',
      department: 'Delivery & Agile Operations'
    },
    allowedModuleKeys: [
      'dashboard',
      'inbox',
      'crm',
      'proposals',
      'projects',
      'clients',
      'vendors',
      'documents'
    ]
  },
  finance: {
    id: 'finance',
    title: 'Financial Officer',
    badge: 'Finance & P&L',
    scopeDescription: 'Invoicing Workflow, A/R & A/P Management, P&L Reports, Taxes & Expenses',
    accountProfile: {
      displayName: 'Chief Financial Officer',
      accountId: 'kapitech-fin-03',
      avatarLabel: 'FO',
      department: 'Financial Operations & Treasury'
    },
    allowedModuleKeys: [
      'dashboard',
      'invoicing',
      'approvals',
      'documents',
      'clients',
      'vendors'
    ]
  },
  account_manager: {
    id: 'account_manager',
    title: 'Account Manager',
    badge: 'CRM & Accounts',
    scopeDescription: 'Client Directory, Sales Funnel, Deal Pipeline, Leads & Inbound Inquiries',
    accountProfile: {
      displayName: 'Senior Account Manager',
      accountId: 'kapitech-am-04',
      avatarLabel: 'AM',
      department: 'Client Partnerships & Growth'
    },
    allowedModuleKeys: [
      'dashboard',
      'inbox',
      'crm',
      'proposals',
      'clients',
      'documents'
    ]
  },
  it_technical: {
    id: 'it_technical',
    title: 'IT / Systems Engineer',
    badge: 'Platform & Security',
    scopeDescription: 'Infrastructure, integrations, system administration, security review, and technical operations.',
    accountProfile: {
      displayName: 'IT / Systems Engineer',
      accountId: 'kapitech-it-05',
      avatarLabel: 'IT',
      department: 'Engineering & Platform'
    },
    allowedModuleKeys: [
      'dashboard',
      'documents',
      'settings'
    ]
  },
  operations: {
    id: 'operations',
    title: 'Operations Staff',
    badge: 'Agency Operations',
    scopeDescription: 'Day-to-day project execution, task coordination, and operational administration.',
    accountProfile: {
      displayName: 'Operations Staff',
      accountId: 'kapitech-ops-06',
      avatarLabel: 'OP',
      department: 'Agency Operations'
    },
    allowedModuleKeys: [
      'dashboard',
      'projects',
      'documents'
    ]
  },
  client_viewer: {
    id: 'client_viewer',
    title: 'Client / Viewer',
    badge: 'Read-Only Portal',
    scopeDescription: 'Read-only view into Active Projects, Showcase, and Services',
    accountProfile: {
      displayName: 'Stakeholder Client Partner',
      accountId: 'kapitech-cli-05',
      avatarLabel: 'CL',
      department: 'Client Stakeholder'
    },
    allowedModuleKeys: [
      'dashboard',
      'projects',
      'cms_projects',
      'documents'
    ]
  }
};

const STORAGE_KEY = 'kapitech_simulated_role';
const ROLE_EVENT_NAME = 'kapitech_rbac_role_change';

export type StakeholderType = 'Executive' | 'IT_Technical' | 'Project_Manager' | 'Operations' | 'Master';

export function roleFromStakeholderType(
  stakeholderType?: StakeholderType | string,
  division?: string,
  userRole?: string
): StakeholderRole {
  if (stakeholderType === 'Master' || stakeholderType === 'Executive') return 'executive';
  if (stakeholderType === 'Project_Manager') return 'pm';
  if (stakeholderType === 'Operations' && (division === 'Finance' || userRole?.toLowerCase().includes('financial'))) return 'finance';
  if (stakeholderType === 'IT_Technical') return 'it_technical';
  if (stakeholderType === 'Operations' && division === 'Operations' && userRole?.toLowerCase().includes('operational')) return 'operations';
  return 'account_manager';
}

export function getStoredRole(): StakeholderRole {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return 'executive';
  const saved = localStorage.getItem(STORAGE_KEY) as StakeholderRole;
  if (saved && ROLE_DEFINITIONS[saved]) {
    return saved;
  }
  return 'executive';
}

export function setStoredRole(role: StakeholderRole): void {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return;
  localStorage.setItem(STORAGE_KEY, role);
  window.dispatchEvent(new CustomEvent(ROLE_EVENT_NAME, { detail: { role } }));
}

export function isModuleAllowed(role: StakeholderRole, moduleKey: string): boolean {
  const meta = ROLE_DEFINITIONS[role];
  if (!meta) return false;
  return meta.allowedModuleKeys.includes(moduleKey);
}

export interface ServerPermissions {
  canViewFinancials?: boolean;
  canManageInvoices?: boolean;
  canApproveBudgets?: boolean;
  canManageCrm?: boolean;
  canManageProjects?: boolean;
  canManageKanbanTasks?: boolean;
  canManageClients?: boolean;
  canManageVendors?: boolean;
  canManageCmsContent?: boolean;
  canAccessServerAndApi?: boolean;
  canRunDataMigration?: boolean;
  canViewSecurityAuditLogs?: boolean;
  canManageAdminAccounts?: boolean;
}

const MODULE_PERMISSION_MAP: Record<string, keyof ServerPermissions | 'authenticated'> = {
  dashboard: 'authenticated',
  inbox: 'canManageCrm',
  crm: 'canManageCrm',
  proposals: 'canManageCrm',
  projects: 'canManageProjects',
  approvals: 'canApproveBudgets',
  invoicing: 'canManageInvoices',
  clients: 'canManageClients',
  vendors: 'canManageVendors',
  services: 'canManageCmsContent',
  cms_projects: 'canManageCmsContent',
  testimonials: 'canManageCmsContent',
  settings: 'authenticated',
  timelogs: 'authenticated',
  rbac: 'canManageAdminAccounts'
};

const MODULE_ANY_PERMISSION_MAP: Record<string, Array<keyof ServerPermissions>> = {
  clients: ['canManageClients', 'canManageCrm'],
  documents: ['canManageProjects', 'canManageCrm', 'canViewFinancials', 'canViewSecurityAuditLogs'],
  timelogs: ['canManageProjects', 'canManageKanbanTasks'],
  projects: ['canManageProjects', 'canManageKanbanTasks'],
  approvals: ['canApproveBudgets', 'canManageProjects', 'canViewFinancials'],
  settings: ['canManageAdminAccounts', 'canAccessServerAndApi', 'canViewSecurityAuditLogs', 'canManageCrm', 'canManageProjects', 'canViewFinancials']
};

export function useRbacRole(
  actualStakeholderType?: StakeholderType | string,
  division?: string,
  userRole?: string,
  serverPermissions?: ServerPermissions
) {
  const actualRole = actualStakeholderType
    ? roleFromStakeholderType(actualStakeholderType, division, userRole)
    : null;
  const [currentRole, setCurrentRoleState] = useState<StakeholderRole>(actualRole || getStoredRole);

  useEffect(() => {
    if (actualRole) setCurrentRoleState(actualRole);
  }, [actualRole]);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ role: StakeholderRole }>;
      if (custom.detail?.role && ROLE_DEFINITIONS[custom.detail.role]) {
        if (!actualRole) setCurrentRoleState(custom.detail.role);
      }
    };
    window.addEventListener(ROLE_EVENT_NAME, handler);
    return () => window.removeEventListener(ROLE_EVENT_NAME, handler);
  }, []);

  const switchRole = (newRole: StakeholderRole) => {
    // Production/session-backed RBAC is authoritative. Role switching exists only
    // as a local development simulator when no authenticated stakeholder is present.
    if (actualRole || !import.meta.env.DEV) return;
    setStoredRole(newRole);
    setCurrentRoleState(newRole);
  };

  const meta = ROLE_DEFINITIONS[currentRole];

  return {
    role: currentRole,
    setRole: switchRole,
    roleMeta: meta,
    isAllowed: (key: string) => {
      if (actualStakeholderType === 'Master') return true;
      if (serverPermissions) {
        const anyPermissions = MODULE_ANY_PERMISSION_MAP[key];
        if (anyPermissions) return anyPermissions.some(permission => Boolean(serverPermissions[permission]));
        const permission = MODULE_PERMISSION_MAP[key];
        return permission === 'authenticated' ? true : Boolean(permission && serverPermissions[permission]);
      }
      return isModuleAllowed(currentRole, key);
    }
  };
}
