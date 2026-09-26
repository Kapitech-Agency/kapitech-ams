/**
 * Kapitech Agency Project & Task Execution Store
 * Tracks active development/design projects converted from CRM Won deals,
 * Kanban Task Boards (To Do, In Progress, Review, Done), Milestones, and Assigned Team members.
 */

export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string;
  dueDate: string;
  createdAt: string;
  subtasks?: TaskSubtask[];
  tags?: string[];
}

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  paymentTrigger?: number; // amount in IDR
}

export interface AgencyProject {
  id: string;
  name: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientId?: string;
  crmLeadId?: string;
  serviceCategory: string;
  status: ProjectStatus;
  budget: number; // in IDR
  progressPercent: number;
  startDate: string;
  targetEndDate: string;
  teamLead: string;
  teamMembers: string[];
  techStack: string[];
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  repositoryUrl?: string;
  figmaUrl?: string;
  liveStagingUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

let projectsCache: AgencyProject[] | null = null;
export const PROJECT_EVENT_NAME = 'kapitech_projects_updated';

import { api } from './apiClient';

let projectServerHydrationStarted = false;

let projectServerHydrationRetryCount = 0;
let projectServerHydrationRetryTimer: number | null = null;

function scheduleProjectHydrationRetry(): void {
  if (typeof window === 'undefined' || projectServerHydrationRetryTimer !== null || projectServerHydrationRetryCount >= 6) return;
  const delay = Math.min(30000, 3000 * 2 ** projectServerHydrationRetryCount);
  projectServerHydrationRetryCount += 1;
  projectServerHydrationRetryTimer = window.setTimeout(() => {
    projectServerHydrationRetryTimer = null;
    hydrateProjectsFromServer();
  }, delay);
}

function hydrateProjectsFromServer(): void {
  if (!import.meta.env.PROD || projectServerHydrationStarted) return;
  projectServerHydrationStarted = true;
  api.projects.getAll().then((res) => {
    if (!res.success || !Array.isArray(res.data?.projects)) {
      projectServerHydrationStarted = false;
      scheduleProjectHydrationRetry();
      return;
    }
    projectServerHydrationRetryCount = 0;
    projectsCache = res.data.projects;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PROJECT_EVENT_NAME, { detail: res.data.projects }));
    }
  }).catch(() => {
    projectServerHydrationStarted = false;
    scheduleProjectHydrationRetry();
  });
}

export const INITIAL_DEFAULT_PROJECTS: AgencyProject[] = [
  {
    id: 'proj_101',
    name: 'BCA Wealth Microservices Architecture',
    clientName: 'Reza Pratama',
    clientCompany: 'Bank Central Asia (BCA Digital)',
    clientEmail: 'reza.pratama@bcadigital.co.id',
    serviceCategory: 'AI & Cloud Solutions',
    status: 'in_progress',
    budget: 380000000,
    progressPercent: 65,
    startDate: '2026-08-15',
    targetEndDate: '2026-10-30',
    teamLead: 'Lead Full-Stack Tech',
    teamMembers: ['Senior Frontend Dev', 'Cloud DevOps Lead', 'Security Architect'],
    techStack: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'GCP'],
    milestones: [
      { id: 'm1', title: 'Architecture Blueprint & Threat Model', dueDate: '2026-08-30', completed: true, paymentTrigger: 100000000 },
      { id: 'm2', title: 'Core Transaction Engine Microservices', dueDate: '2026-09-30', completed: false, paymentTrigger: 180000000 },
      { id: 'm3', title: 'Security Audit & Enterprise Penetration Test', dueDate: '2026-10-20', completed: false, paymentTrigger: 100000000 }
    ],
    tasks: [
      {
        id: 'task_bca_1',
        title: 'Implement Multi-Factor Biometric JWT Vault',
        description: 'Server-side key rotation and PBKDF2 salt validation with encrypted session cookies.',
        status: 'done',
        priority: 'urgent',
        assignedTo: 'Security Architect',
        dueDate: '2026-09-10',
        createdAt: '2026-08-20T10:00:00Z',
        subtasks: [
          { id: 'sub_1', title: 'Audit token expiration strategy', completed: true },
          { id: 'sub_2', title: 'Enforce rate-limiting on auth endpoints', completed: true }
        ],
        tags: ['Security', 'Backend']
      },
      {
        id: 'task_bca_2',
        title: 'Build Distributed Transaction Ledger Cache',
        description: 'High-throughput Redis caching layer for instantaneous balance reconciliation.',
        status: 'in_progress',
        priority: 'high',
        assignedTo: 'Cloud DevOps Lead',
        dueDate: '2026-09-25',
        createdAt: '2026-08-28T09:00:00Z',
        subtasks: [
          { id: 'sub_3', title: 'Configure cluster failover', completed: true },
          { id: 'sub_4', title: 'Benchmark latency under 25ms SLA', completed: false }
        ],
        tags: ['Cloud', 'DevOps']
      },
      {
        id: 'task_bca_3',
        title: 'Executive Financial Dashboard UI Polish',
        description: 'Implement dark-mode glassmorphic charts with IDR/USD dual currency toggle.',
        status: 'review',
        priority: 'medium',
        assignedTo: 'Senior Frontend Dev',
        dueDate: '2026-09-28',
        createdAt: '2026-09-01T11:00:00Z',
        subtasks: [
          { id: 'sub_5', title: 'Verify WCAG AA contrast ratio', completed: true },
          { id: 'sub_6', title: 'Integrate touch drag-and-scroll for Kanban', completed: true }
        ],
        tags: ['Frontend', 'UI/UX']
      },
      {
        id: 'task_bca_4',
        title: 'Production Staging Deployment & Load Testing',
        description: 'Execute stress test on Cloud Run with 50,000 synthetic concurrent sessions.',
        status: 'todo',
        priority: 'high',
        assignedTo: 'Cloud DevOps Lead',
        dueDate: '2026-10-10',
        createdAt: '2026-09-05T14:00:00Z',
        subtasks: [
          { id: 'sub_7', title: 'Prepare Locust load testing scripts', completed: false },
          { id: 'sub_8', title: 'Review Cloud SQL read-replica scaling', completed: false }
        ],
        tags: ['QA', 'Deployment']
      }
    ],
    repositoryUrl: 'https://github.com/kapitech-agency/bca-wealth-core',
    figmaUrl: 'https://figma.com/file/bca-wealth-design-system',
    liveStagingUrl: 'https://staging.ams.kapitech.id/bca',
    notes: 'Enterprise Tier 1 client. Strict weekly milestone reporting required.',
    createdAt: '2026-08-15T08:00:00Z',
    updatedAt: '2026-09-15T14:00:00Z'
  },
  {
    id: 'proj_102',
    name: 'Alam Sutera 3D WebGL Virtual Tour',
    clientName: 'Dian Sastro',
    clientCompany: 'Alam Sutera Realty & Urban Space',
    clientEmail: 'dian.sastro@alamsutera.com',
    serviceCategory: 'UI/UX Design',
    status: 'in_progress',
    budget: 195000000,
    progressPercent: 45,
    startDate: '2026-09-01',
    targetEndDate: '2026-11-15',
    teamLead: 'Creative Director',
    teamMembers: ['3D WebGL Specialist', 'Senior Frontend Dev'],
    techStack: ['Three.js', 'React', 'Tailwind CSS', 'Vite'],
    milestones: [
      { id: 'm4', title: '3D CAD Model Optimization & Texturing', dueDate: '2026-09-20', completed: true, paymentTrigger: 80000000 },
      { id: 'm5', title: 'Interactive Lighting & Day/Night Toggle', dueDate: '2026-10-15', completed: false, paymentTrigger: 65000000 },
      { id: 'm6', title: 'Final Township Showcase Deployment', dueDate: '2026-11-15', completed: false, paymentTrigger: 50000000 }
    ],
    tasks: [
      {
        id: 'task_as_1',
        title: 'GLTF Mesh Compression & LOD Pipeline',
        description: 'Compress 3D township polygon assets under 15MB total bundle size using Draco compression.',
        status: 'done',
        priority: 'urgent',
        assignedTo: '3D WebGL Specialist',
        dueDate: '2026-09-15',
        createdAt: '2026-09-02T10:00:00Z',
        tags: ['3D', 'Performance']
      },
      {
        id: 'task_as_2',
        title: 'Interactive Unit Floorplan Configurator',
        description: 'Allow prospective buyers to switch wall finishes and balcony perspectives dynamically.',
        status: 'in_progress',
        priority: 'high',
        assignedTo: 'Senior Frontend Dev',
        dueDate: '2026-09-30',
        createdAt: '2026-09-05T09:30:00Z',
        tags: ['Frontend', 'Interactive']
      }
    ],
    repositoryUrl: 'https://github.com/kapitech-agency/alam-sutera-3d',
    figmaUrl: 'https://figma.com/file/alam-sutera-township-showcase',
    liveStagingUrl: 'https://staging.ams.kapitech.id/alam-sutera',
    notes: 'Premium luxury marketing showcase.',
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-15T10:00:00Z'
  },
  {
    id: 'proj_103',
    name: 'Astra Digital Ventura Microservices Sprint',
    clientName: 'Budi Santoso',
    clientCompany: 'PT Astra Digital Ventura',
    clientEmail: 'budi.santoso@astradigital.id',
    serviceCategory: 'Web Development',
    status: 'completed',
    budget: 183150000,
    progressPercent: 100,
    startDate: '2026-07-01',
    targetEndDate: '2026-08-30',
    teamLead: 'Lead Full-Stack Tech',
    teamMembers: ['Lead Full-Stack Tech', 'Senior Frontend Dev'],
    techStack: ['React', 'Express', 'Tailwind CSS', 'Vite'],
    milestones: [
      { id: 'm7', title: 'Phase 1 Core Architecture', dueDate: '2026-07-31', completed: true, paymentTrigger: 90000000 },
      { id: 'm8', title: 'Phase 2 Production Handover & UAT', dueDate: '2026-08-30', completed: true, paymentTrigger: 93150000 }
    ],
    tasks: [
      {
        id: 'task_astra_1',
        title: 'Production Handover & SLA Signoff',
        description: 'Final architectural documentation and maintenance handover meeting.',
        status: 'done',
        priority: 'medium',
        assignedTo: 'Lead Full-Stack Tech',
        dueDate: '2026-08-28',
        createdAt: '2026-08-10T08:00:00Z',
        tags: ['Handover', 'Client']
      }
    ],
    notes: 'Successfully delivered on time and fully settled.',
    createdAt: '2026-07-01T08:00:00Z',
    updatedAt: '2026-08-30T16:00:00Z'
  }
];

export const getAgencyProjects = (): AgencyProject[] => {
  hydrateProjectsFromServer();
  if (projectsCache) return projectsCache;
  projectsCache = import.meta.env.PROD ? [] : INITIAL_DEFAULT_PROJECTS;
  return projectsCache;
};

export const getActiveProjects = getAgencyProjects;

export const saveAgencyProject = async (project: AgencyProject): Promise<void> => {
  const current = getAgencyProjects();
  const previous = [...current];
  const idx = current.findIndex(p => p.id === project.id);
  const now = new Date().toISOString();

  let updated: AgencyProject[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = { ...project, updatedAt: now };
  } else {
    updated = [{ ...project, createdAt: project.createdAt || now, updatedAt: now }, ...current];
  }

  projectsCache = updated;
  window.dispatchEvent(new CustomEvent(PROJECT_EVENT_NAME, { detail: updated }));

  const request = idx >= 0 ? api.projects.update(project.id, project) : api.projects.create(project);
  const res = await request;
  if (res.success && res.data?.success !== false) return;

  projectsCache = previous;
  window.dispatchEvent(new CustomEvent(PROJECT_EVENT_NAME, { detail: previous }));
  throw new Error(res.error || 'Project could not be saved on the server.');
};

export const deleteAgencyProject = async (id: string): Promise<void> => {
  const current = getAgencyProjects();
  const previous = [...current];
  const updated = current.filter(p => p.id !== id);
  projectsCache = updated;
  window.dispatchEvent(new CustomEvent(PROJECT_EVENT_NAME, { detail: updated }));
  const res = await api.projects.delete(id);
  if (res.success && res.data?.success !== false) return;

  projectsCache = previous;
  window.dispatchEvent(new CustomEvent(PROJECT_EVENT_NAME, { detail: previous }));
  throw new Error(res.error || 'Project could not be deleted on the server.');
};

export const updateTaskStatus = async (projectId: string, taskId: string, newStatus: TaskStatus): Promise<void> => {
  const current = getAgencyProjects();
  const proj = current.find(p => p.id === projectId);
  if (!proj) return;

  const updatedTasks = proj.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
  const updated: AgencyProject = {
    ...proj,
    tasks: updatedTasks,
    updatedAt: new Date().toISOString()
  };

  await saveAgencyProject(updated);
};
