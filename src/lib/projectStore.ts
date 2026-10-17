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
  slug?: string;
  title: string;
  completed: boolean;
}

export interface ProjectTask {
  id: string;
  slug?: string;
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
  slug?: string;
  title: string;
  dueDate: string;
  completed: boolean;
  paymentTrigger?: number; // amount in IDR
}

export interface ProjectResourceAllocation {
  memberId: string;
  memberName: string;
  allocationPercent: number;
  startDate: string;
  endDate: string;
}

export interface AgencyProject {
  id: string;
  slug?: string;
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
  resourceAllocations?: ProjectResourceAllocation[];
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

export const normalizeAgencyProject = (project: AgencyProject): AgencyProject => ({
  ...project,
  slug: toSlug(project.slug || project.name || project.id, 'project-record'),
  teamMembers: Array.isArray(project.teamMembers) ? project.teamMembers : [],
  techStack: Array.isArray(project.techStack) ? project.techStack : [],
  milestones: (Array.isArray(project.milestones) ? project.milestones : []).map((milestone) => ({
    ...milestone,
    slug: toSlug(milestone.slug || milestone.title || milestone.id, 'milestone-record')
  })),
  tasks: (Array.isArray(project.tasks) ? project.tasks : []).map((task) => ({
    ...task,
    slug: toSlug(task.slug || task.title || task.id, 'task-record'),
    subtasks: Array.isArray(task.subtasks)
      ? task.subtasks.map((subtask) => ({
          ...subtask,
          slug: toSlug(subtask.slug || subtask.title || subtask.id, 'subtask-record')
        }))
      : []
  }))
});


import { api } from './apiClient';
import { toSlug } from './slug';

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
  if (typeof window === 'undefined' || projectServerHydrationStarted) return;
  projectServerHydrationStarted = true;
  api.projects.getAll().then((res) => {
    if (!res.success || !Array.isArray(res.data?.projects)) {
      projectServerHydrationStarted = false;
      scheduleProjectHydrationRetry();
      return;
    }
    projectServerHydrationRetryCount = 0;
    projectsCache = res.data.projects.map(normalizeAgencyProject);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PROJECT_EVENT_NAME, { detail: res.data.projects }));
    }
  }).catch(() => {
    projectServerHydrationStarted = false;
    scheduleProjectHydrationRetry();
  });
}

export const getAgencyProjects = (): AgencyProject[] => {
  hydrateProjectsFromServer();
  if (projectsCache) return projectsCache;
  projectsCache = [];
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
    updated[idx] = normalizeAgencyProject({ ...project, updatedAt: now });
  } else {
    updated = [normalizeAgencyProject({ ...project, createdAt: project.createdAt || now, updatedAt: now }), ...current];
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
