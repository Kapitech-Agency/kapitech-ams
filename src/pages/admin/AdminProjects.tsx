import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Clock,
  CheckCircle2,
  CircleDollarSign,
  CalendarDays,
  Code2,
  ExternalLink,
  Filter,
  GripVertical,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  INITIAL_DEFAULT_PROJECTS,
  AgencyProject,
  ProjectTask,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from '../../lib/projectStore';
import { useLanguage } from '../../lib/LanguageContext';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { AdminMetricStrip, AdminModuleHeader, AdminPanel } from '../../components/admin/AdminModulePrimitives';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';
import { api } from '../../lib/apiClient';
import { formatAmount, getActiveCurrency, CURRENCY_EVENT, CurrencyCode } from '../../lib/currency';
import { hasAdminPermission } from '../../lib/adminAuth';

type ProjectHealth = 'Good' | 'At Risk' | 'Delayed' | 'Blocked';
type ProjectRecord = AgencyProject & {
  health?: ProjectHealth;
  slug: string;
};

type ProjectsView = 'all' | 'sprint' | 'budget' | 'archived';
type ProjectLayout = 'board' | 'table';

const PROJECT_STATUSES: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
];

const TASK_COLUMNS: Array<{ id: TaskStatus; label: string; tone: string }> = [
  { id: 'todo', label: 'To Do', tone: 'bg-info' },
  { id: 'in_progress', label: 'In Progress', tone: 'bg-accent' },
  { id: 'review', label: 'Review', tone: 'bg-warning' },
  { id: 'done', label: 'Done', tone: 'bg-success' },
];

const TASK_PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatDate = (value: string) => {
  if (!value) return 'Not set';
  const parsed = new Date(value + (value.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysUntil = (value: string) => {
  if (!value) return null;
  const due = new Date(value + 'T23:59:59');
  return Math.ceil((due.getTime() - Date.now()) / 86400000);
};

const isOverdue = (value: string) => {
  const days = daysUntil(value);
  return days !== null && days < 0;
};

const inferHealth = (project: Partial<AgencyProject>): ProjectHealth => {
  if (project.status === 'completed') return 'Good';
  if (project.status === 'on_hold') return 'Blocked';
  if (isOverdue(project.targetEndDate || '') && Number(project.progressPercent || 0) < 90) return 'Delayed';
  if (Number(project.progressPercent || 0) < 35) return 'At Risk';
  return 'Good';
};

const normalizeTask = (task: any): ProjectTask => ({
  id: String(task?.id || ''),
  title: String(task?.title || 'Untitled task'),
  description: task?.description ? String(task.description) : undefined,
  status: (['todo', 'in_progress', 'review', 'done'].includes(String(task?.status)) ? task.status : 'todo') as TaskStatus,
  priority: (['low', 'medium', 'high', 'urgent'].includes(String(task?.priority)) ? task.priority : 'medium') as TaskPriority,
  assignedTo: String(task?.assignedTo ?? task?.assignee ?? ''),
  dueDate: String(task?.dueDate || ''),
  createdAt: String(task?.createdAt || new Date().toISOString()),
  subtasks: Array.isArray(task?.subtasks) ? task.subtasks : undefined,
  tags: Array.isArray(task?.tags) ? task.tags.map(String) : undefined,
});

const normalizeProject = (project: any): ProjectRecord => {
  const name = String(project?.name || project?.title || 'Untitled project');
  const status = (PROJECT_STATUSES.some(item => item.value === project?.status) ? project.status : 'planning') as ProjectStatus;
  const normalized: ProjectRecord = {
    ...project,
    id: String(project?.id || ''),
    name,
    clientName: String(project?.clientName || ''),
    clientCompany: String(project?.clientCompany || project?.client || ''),
    clientEmail: String(project?.clientEmail || ''),
    serviceCategory: String(project?.serviceCategory || ''),
    status,
    budget: Number(project?.budget || 0),
    progressPercent: Math.min(100, Math.max(0, Number(project?.progressPercent || 0))),
    startDate: String(project?.startDate || ''),
    targetEndDate: String(project?.targetEndDate || ''),
    teamLead: String(project?.teamLead || ''),
    teamMembers: Array.isArray(project?.teamMembers) ? project.teamMembers.map(String) : [],
    techStack: Array.isArray(project?.techStack) ? project.techStack.map(String) : [],
    milestones: Array.isArray(project?.milestones) ? project.milestones : [],
    tasks: Array.isArray(project?.tasks) ? project.tasks.map(normalizeTask) : [],
    createdAt: String(project?.createdAt || ''),
    updatedAt: String(project?.updatedAt || ''),
    health: (['Good', 'At Risk', 'Delayed', 'Blocked'].includes(String(project?.health))
      ? project.health
      : inferHealth({ ...project, status })) as ProjectHealth,
    slug: String(project?.slug || slugify(name)),
  };
  return normalized;
};

const demoProjects: ProjectRecord[] = INITIAL_DEFAULT_PROJECTS.map(item =>
  normalizeProject({
    ...item,
    slug: slugify(item.name),
    health: inferHealth(item),
  })
);

const PROJECT_STATUS_OVERRIDES_KEY = 'kapitech_ams_project_status_overrides_v1';
const TASK_STATUS_OVERRIDES_KEY = 'kapitech_ams_task_status_overrides_v1';

function readStatusOverrides<T extends string>(key: string): Record<string, T> {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(key) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, T>;
  } catch {
    return {};
  }
}

function writeStatusOverrides<T extends string>(key: string, overrides: Record<string, T>) {
  if (typeof window === 'undefined') return;
  try {
    if (Object.keys(overrides).length === 0) {
      window.sessionStorage.removeItem(key);
      return;
    }
    window.sessionStorage.setItem(key, JSON.stringify(overrides));
  } catch {
    // Session persistence is only a front-end enhancement for A/B testing.
  }
}

const applyKanbanStatusOverrides = (source: ProjectRecord[]) => {
  const projectOverrides = readStatusOverrides<ProjectStatus>(PROJECT_STATUS_OVERRIDES_KEY);
  const taskOverrides = readStatusOverrides<TaskStatus>(TASK_STATUS_OVERRIDES_KEY);
  const nextProjectOverrides = { ...projectOverrides };
  const nextTaskOverrides = { ...taskOverrides };

  const merged = source.map(project => {
    const projectOverride = projectOverrides[project.id];
    if (projectOverride === project.status) {
      delete nextProjectOverrides[project.id];
    }

    let tasksChanged = false;
    const nextTasks = project.tasks.map(task => {
      const taskOverride = taskOverrides[task.id];
      if (taskOverride === task.status) {
        delete nextTaskOverrides[task.id];
      }
      if (taskOverride && taskOverride !== task.status) {
        tasksChanged = true;
        return { ...task, status: taskOverride };
      }
      return task;
    });

    return projectOverride && projectOverride !== project.status
      ? normalizeProject({
          ...project,
          status: projectOverride,
          tasks: nextTasks,
          updatedAt: new Date().toISOString(),
        })
      : tasksChanged
        ? { ...project, tasks: nextTasks, updatedAt: new Date().toISOString() }
        : project;
  });

  writeStatusOverrides(PROJECT_STATUS_OVERRIDES_KEY, nextProjectOverrides);
  writeStatusOverrides(TASK_STATUS_OVERRIDES_KEY, nextTaskOverrides);
  return merged;
};

const projectStatusClass = (status: ProjectStatus) => {
  if (status === 'completed') return 'border-success/30 bg-success/10 text-success';
  if (status === 'on_hold') return 'border-warning/30 bg-warning/10 text-warning';
  if (status === 'review') return 'border-warning/30 bg-warning/10 text-warning';
  if (status === 'in_progress') return 'border-accent/30 bg-accent/10 text-accent';
  return 'border-info/30 bg-info/10 text-info';
};

const healthClass = (health?: ProjectHealth) => {
  if (health === 'Good') return 'border-success/30 bg-success/10 text-success';
  if (health === 'At Risk') return 'border-warning/30 bg-warning/10 text-warning';
  if (health === 'Delayed' || health === 'Blocked') return 'border-danger/30 bg-danger/10 text-danger';
  return 'border-line bg-bg text-muted';
};

const priorityClass = (priority: TaskPriority) => {
  if (priority === 'urgent') return 'border-danger/30 bg-danger/10 text-danger';
  if (priority === 'high') return 'border-warning/30 bg-warning/10 text-warning';
  if (priority === 'medium') return 'border-info/30 bg-info/10 text-info';
  return 'border-line bg-bg text-muted';
};

const statusLabel = (status: ProjectStatus) =>
  PROJECT_STATUSES.find(item => item.value === status)?.label || status;

const priorityLabel = (priority: TaskPriority) =>
  TASK_PRIORITIES.find(item => item.value === priority)?.label || priority;

const taskStatusLabel = (status: TaskStatus) =>
  TASK_COLUMNS.find(item => item.id === status)?.label || status;

const initials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '—';

const PROJECT_KANBAN_COLUMNS: Array<{
  id: ProjectStatus;
  label: string;
  dot: string;
  description: string;
}> = [
  { id: 'planning', label: 'Planning', dot: 'bg-info', description: 'Discovery, scope, and setup' },
  { id: 'in_progress', label: 'In Progress', dot: 'bg-accent', description: 'Active delivery work' },
  { id: 'review', label: 'Review', dot: 'bg-warning', description: 'QA, feedback, and approval' },
  { id: 'completed', label: 'Completed', dot: 'bg-success', description: 'Delivered and handed over' },
  { id: 'on_hold', label: 'On Hold', dot: 'bg-warning', description: 'Paused pending a decision' },
];

const fieldClass =
  'mt-1 h-9 min-h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none transition-colors placeholder:text-muted focus:border-accent';

export const AdminProjects: React.FC = () => {
  const { language } = useLanguage();
  const canManageProjects = hasAdminPermission('canManageProjects');
  const canManageKanbanTasks = hasAdminPermission('canManageKanbanTasks');
  const canManageTasks = canManageKanbanTasks;
  const [searchParams, setSearchParams] = useSearchParams();
  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [projects, setProjects] = useState<ProjectRecord[]>(demoProjects);
  const [loading, setLoading] = useState(false);
  const [serverMode, setServerMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('');
  const [projectHealthFilter, setProjectHealthFilter] = useState('');
  const [projectClientFilter, setProjectClientFilter] = useState('');
  const [projectOwnerFilter, setProjectOwnerFilter] = useState('');
  const [projectSort, setProjectSort] = useState('updated');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveHealthFilter, setArchiveHealthFilter] = useState('');
  const [projectLayout, setProjectLayout] = useState<ProjectLayout>(
    searchParams.get('layout') === 'table' ? 'table' : 'board'
  );
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);
  const [dragOverProjectStatus, setDragOverProjectStatus] = useState<ProjectStatus | null>(null);
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('');
  const [taskSort, setTaskSort] = useState('priority');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverTaskStatus, setDragOverTaskStatus] = useState<TaskStatus | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [deleteProject, setDeleteProject] = useState<ProjectRecord | null>(null);
  const [deleteTask, setDeleteTask] = useState<ProjectTask | null>(null);

  const view = (searchParams.get('projects') || 'all') as ProjectsView;
  const selectedProjectSlug = searchParams.get('project') || '';

  const [projectForm, setProjectForm] = useState({
    name: '',
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    serviceCategory: '',
    budget: '',
    progressPercent: '0',
    startDate: todayIso(),
    targetEndDate: todayIso(),
    teamLead: '',
    teamMembers: '',
    techStack: '',
    repositoryUrl: '',
    figmaUrl: '',
    liveStagingUrl: '',
    notes: '',
    status: 'planning' as ProjectStatus,
    health: 'Good' as ProjectHealth,
  });

  const [taskAssignees, setTaskAssignees] = useState<Array<{ id: string; name: string; username: string; role: string; division: string }>>([]);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    projectId: '',
    assignee: '',
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    dueDate: todayIso(),
    tags: '',
    subtasks: '',
  });

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const syncProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.projects.getAll();
      if (response.success && Array.isArray(response.data?.projects)) {
        const serverProjects = response.data.projects.length
          ? response.data.projects.map(normalizeProject)
          : demoProjects;
        setProjects(applyKanbanStatusOverrides(serverProjects));
        setServerMode(true);
        setLoading(false);
        return;
      }
      setServerMode(false);
      setProjects(applyKanbanStatusOverrides(demoProjects));
      setError(response.error || 'Using demo project data because the project service is unavailable.');
    } catch (requestError) {
      setServerMode(false);
      setProjects(applyKanbanStatusOverrides(demoProjects));
      setError(requestError instanceof Error ? requestError.message : 'Using demo project data.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void syncProjects();
    const handleCurrency = (event: Event) => {
      const detail = (event as CustomEvent<{ currency?: CurrencyCode }>).detail;
      setCurrency(detail?.currency || getActiveCurrency());
    };
    window.addEventListener(CURRENCY_EVENT, handleCurrency);
    return () => window.removeEventListener(CURRENCY_EVENT, handleCurrency);
  }, []);

  React.useEffect(() => {
    if (!canManageKanbanTasks) return;
    let mounted = true;
    void api.auth.getTaskAssignees().then(response => {
      if (!mounted) return;
      if (response.success && Array.isArray(response.data?.assignees)) {
        setTaskAssignees(response.data.assignees);
      }
    }).catch(() => {
      if (mounted) setTaskAssignees([]);
    });
    return () => {
      mounted = false;
    };
  }, [canManageKanbanTasks]);

  const activeProjects = useMemo(
    () => projects.filter(project => project.status !== 'completed'),
    [projects]
  );

  const archivedProjects = useMemo(
    () => projects.filter(project => project.status === 'completed'),
    [projects]
  );

  const filteredArchivedProjects = useMemo(() => {
    const query = archiveSearch.trim().toLowerCase();
    return archivedProjects.filter(project => {
      const matchesQuery =
        !query ||
        [project.name, project.clientCompany, project.teamLead, project.slug]
          .join(' ')
          .toLowerCase()
          .includes(query);
      const matchesHealth = !archiveHealthFilter || project.health === archiveHealthFilter;
      return matchesQuery && matchesHealth;
    });
  }, [archivedProjects, archiveSearch, archiveHealthFilter]);

  const archiveStats = useMemo(() => {
    const totalValue = archivedProjects.reduce((sum, project) => sum + project.budget, 0);
    const averageProgress = archivedProjects.length
      ? Math.round(archivedProjects.reduce((sum, project) => sum + project.progressPercent, 0) / archivedProjects.length)
      : 0;
    const clients = new Set(archivedProjects.map(project => project.clientCompany).filter(Boolean)).size;
    return { totalValue, averageProgress, clients };
  }, [archivedProjects]);

  const projectFilterOptions = useMemo(() => {
    const clients = Array.from(new Set<string>(projects.map(project => project.clientCompany).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b));
    const owners = Array.from(new Set<string>(projects.map(project => project.teamLead).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b));
    return { clients, owners };
  }, [projects]);

  const activeProjectFilters = [
    projectSearch,
    projectStatusFilter,
    projectHealthFilter,
    projectClientFilter,
    projectOwnerFilter,
  ].filter(Boolean).length;

  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    const result = projects.filter(project => {
      const matchesQuery =
        !query ||
        [
          project.name,
          project.clientCompany,
          project.clientName,
          project.teamLead,
          project.serviceCategory,
          project.slug,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      const matchesStatus = !projectStatusFilter || project.status === projectStatusFilter;
      const matchesHealth = !projectHealthFilter || project.health === projectHealthFilter;
      const matchesClient = !projectClientFilter || project.clientCompany === projectClientFilter;
      const matchesOwner = !projectOwnerFilter || project.teamLead === projectOwnerFilter;
      return matchesQuery && matchesStatus && matchesHealth && matchesClient && matchesOwner;
    });

    return [...result].sort((a, b) => {
      if (projectSort === 'name') return a.name.localeCompare(b.name);
      if (projectSort === 'progress') return b.progressPercent - a.progressPercent;
      if (projectSort === 'budget') return b.budget - a.budget;
      if (projectSort === 'deadline') return (a.targetEndDate || '9999-12-31').localeCompare(b.targetEndDate || '9999-12-31');
      return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
    });
  }, [
    projects,
    projectSearch,
    projectStatusFilter,
    projectHealthFilter,
    projectClientFilter,
    projectOwnerFilter,
    projectSort,
  ]);

  const clearProjectFilters = () => {
    setProjectSearch('');
    setProjectStatusFilter('');
    setProjectHealthFilter('');
    setProjectClientFilter('');
    setProjectOwnerFilter('');
    setProjectSort('updated');
  };

  const boardProjects = useMemo(
    () => filteredProjects.filter(project => project.status !== 'completed'),
    [filteredProjects]
  );

  const selectedSprintProject = useMemo(() => {
    return (
      projects.find(project => project.slug === selectedProjectSlug) ||
      activeProjects.find(project => project.slug === selectedProjectSlug) ||
      activeProjects[0] ||
      projects[0] ||
      null
    );
  }, [activeProjects, projects, selectedProjectSlug]);

  const taskAssigneeOptions = useMemo(() => {
    if (!selectedSprintProject) return [];
    return Array.from(
      new Set<string>(
        selectedSprintProject.tasks
          .map(task => task.assignedTo)
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [selectedSprintProject]);

  const visibleTasks = useMemo(() => {
    if (!selectedSprintProject) return [];
    const query = taskSearch.trim().toLowerCase();
    return selectedSprintProject.tasks
      .filter(task => {
        const matchesQuery =
          !query ||
          [task.title, task.description || '', task.assignedTo, ...(task.tags || [])]
            .join(' ')
            .toLowerCase()
            .includes(query);
        const matchesPriority = !taskPriorityFilter || task.priority === taskPriorityFilter;
        const matchesAssignee = !taskAssigneeFilter || task.assignedTo === taskAssigneeFilter;
        return matchesQuery && matchesPriority && matchesAssignee;
      })
      .sort((a, b) => {
        if (taskSort === 'due') return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
        if (taskSort === 'title') return a.title.localeCompare(b.title);
        if (taskSort === 'created') return (b.createdAt || '').localeCompare(a.createdAt || '');
        if (a.status !== b.status) return 0;
        return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      });
  }, [selectedSprintProject, taskSearch, taskPriorityFilter, taskAssigneeFilter, taskSort]);

  const activeTaskFilters = [taskSearch, taskPriorityFilter, taskAssigneeFilter].filter(Boolean).length;

  const sprintStats = useMemo(() => {
    const tasks = selectedSprintProject?.tasks || [];
    const done = tasks.filter(task => task.status === 'done').length;
    const open = tasks.length - done;
    const overdue = tasks.filter(task => task.status !== 'done' && isOverdue(task.dueDate)).length;
    const review = tasks.filter(task => task.status === 'review').length;
    return {
      total: tasks.length,
      done,
      open,
      overdue,
      review,
      completion: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  }, [selectedSprintProject]);

  const metrics = useMemo(() => {
    const value = activeProjects.reduce((sum, project) => sum + project.budget, 0);
    const totalProgress = activeProjects.reduce((sum, project) => sum + project.progressPercent, 0);
    const velocity = activeProjects.length ? Math.round(totalProgress / activeProjects.length) : 0;
    const risks = activeProjects.filter(project => project.health !== 'Good').length;
    const openTasks = activeProjects.reduce(
      (sum, project) => sum + project.tasks.filter(task => task.status !== 'done').length,
      0
    );
    const assignedPeople = new Set(
      activeProjects.flatMap(project => [project.teamLead, ...project.teamMembers]).filter(Boolean)
    );
    const milestonesAtRisk = activeProjects.reduce(
      (sum, project) =>
        sum +
        project.milestones.filter(
          milestone =>
            !milestone.completed &&
            isOverdue(milestone.dueDate)
        ).length,
      0
    );
    return {
      value,
      velocity,
      risks,
      openTasks,
      assignedPeople: assignedPeople.size,
      milestonesAtRisk,
    };
  }, [activeProjects]);

  const budgetRows = useMemo(
    () =>
      filteredProjects.map(project => {
        const burn = Math.round(project.budget * (project.progressPercent / 100));
        return {
          project,
          burn,
          remaining: Math.max(0, project.budget - burn),
          variance: project.budget - burn,
        };
      }),
    [filteredProjects]
  );

  const openProjectDetail = (project: ProjectRecord) => {
    setSelectedProject(project);
    const next = new URLSearchParams(searchParams);
    next.set('project', project.slug);
    setSearchParams(next, { replace: true });
  };

  const clearProjectSelection = () => {
    setSelectedProject(null);
    const next = new URLSearchParams(searchParams);
    next.delete('project');
    setSearchParams(next, { replace: true });
  };

  const openNewProject = (status: ProjectStatus = 'planning') => {
    setEditingProject(null);
    setProjectForm({
      name: '',
      clientName: '',
      clientCompany: '',
      clientEmail: '',
      serviceCategory: '',
      budget: '',
      progressPercent: '0',
      startDate: todayIso(),
      targetEndDate: todayIso(),
      teamLead: '',
      teamMembers: '',
      techStack: '',
      repositoryUrl: '',
      figmaUrl: '',
      liveStagingUrl: '',
      notes: '',
      status,
      health: 'Good',
    });
    setProjectDrawerOpen(true);
  };

  const openEditProject = (project: ProjectRecord) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      clientName: project.clientName,
      clientCompany: project.clientCompany,
      clientEmail: project.clientEmail,
      serviceCategory: project.serviceCategory,
      budget: String(project.budget || ''),
      progressPercent: String(project.progressPercent),
      startDate: project.startDate || todayIso(),
      targetEndDate: project.targetEndDate || todayIso(),
      teamLead: project.teamLead,
      teamMembers: project.teamMembers.join(', '),
      techStack: project.techStack.join(', '),
      repositoryUrl: project.repositoryUrl || '',
      figmaUrl: project.figmaUrl || '',
      liveStagingUrl: project.liveStagingUrl || '',
      notes: project.notes || '',
      status: project.status,
      health: project.health || 'Good',
    });
    setProjectDrawerOpen(true);
  };

  const saveProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectForm.name.trim() || !projectForm.clientCompany.trim()) {
      showToast('Project name and client company are required.');
      return;
    }

    const budget = Number(projectForm.budget || 0);
    const progress = Number(projectForm.progressPercent || 0);
    if (!Number.isFinite(budget) || budget < 0 || progress < 0 || progress > 100) {
      showToast('Enter valid budget and progress values.');
      return;
    }

    const now = new Date().toISOString();
    const slug = slugify(projectForm.name);
    const localProject: ProjectRecord = normalizeProject({
      ...(editingProject || {}),
      id: editingProject?.id || 'demo_' + slug + '_' + Date.now(),
      name: projectForm.name.trim(),
      clientName: projectForm.clientName.trim(),
      clientCompany: projectForm.clientCompany.trim(),
      clientEmail: projectForm.clientEmail.trim(),
      serviceCategory: projectForm.serviceCategory.trim(),
      budget,
      progressPercent: progress,
      startDate: projectForm.startDate,
      targetEndDate: projectForm.targetEndDate,
      teamLead: projectForm.teamLead.trim(),
      teamMembers: projectForm.teamMembers.split(',').map(item => item.trim()).filter(Boolean),
      techStack: projectForm.techStack.split(',').map(item => item.trim()).filter(Boolean),
      repositoryUrl: projectForm.repositoryUrl.trim() || undefined,
      figmaUrl: projectForm.figmaUrl.trim() || undefined,
      liveStagingUrl: projectForm.liveStagingUrl.trim() || undefined,
      notes: projectForm.notes.trim() || undefined,
      status: projectForm.status,
      health: projectForm.health,
      createdAt: editingProject?.createdAt || now,
      updatedAt: now,
      milestones: editingProject?.milestones || [],
      tasks: editingProject?.tasks || [],
      slug,
    });

    setSaving(true);
    try {
      const payload = { ...localProject, id: editingProject?.id || '' };
      const response = editingProject
        ? await api.projects.update(editingProject.id, payload)
        : await api.projects.create(payload);

      if (response.success) {
        setServerMode(true);
        await syncProjects();
        showToast(language === 'id' ? 'Proyek berhasil disimpan.' : 'Project saved.');
      } else {
        setProjects(current =>
          editingProject
            ? current.map(item => (item.id === editingProject.id ? localProject : item))
            : [localProject, ...current]
        );
        setServerMode(false);
        showToast('Saved in demo mode. Connect the project service to persist it.');
      }
    } catch {
      setProjects(current =>
        editingProject
          ? current.map(item => (item.id === editingProject.id ? localProject : item))
          : [localProject, ...current]
      );
      setServerMode(false);
      showToast('Saved in demo mode. Connect the project service to persist it.');
    } finally {
      setSaving(false);
      setProjectDrawerOpen(false);
    }
  };

  // Task creation entry point
  const handleAddTask = (status: TaskStatus = 'todo') => {
    if (!canManageKanbanTasks) return;
    if (!selectedSprintProject) {
      showToast('Select a project first.');
      return;
    }
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      projectId: selectedSprintProject.id,
      assignee: selectedSprintProject.teamLead || '',
      priority: 'medium',
      status,
      dueDate: todayIso(),
      tags: '',
      subtasks: '',
    });
    setTaskDrawerOpen(true);
  };

  const openEditTask = (task: ProjectTask) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      projectId: selectedSprintProject?.id || '',
      assignee: task.assignedTo,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      tags: (task.tags || []).join(', '),
      subtasks: (task.subtasks || []).map(item => item.title).join('\n'),
    });
    setTaskDrawerOpen(true);
  };

  const saveTask = async (event: React.FormEvent) => {
    event.preventDefault();
    const project = projects.find(item => item.id === taskForm.projectId);
    if (!project || !taskForm.title.trim()) {
      showToast('Task title and project are required.');
      return;
    }

    const subtasks = taskForm.subtasks
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean)
      .map((title, index) => ({
        id: editingTask?.subtasks?.[index]?.id || 'sub_' + Date.now() + '_' + index,
        title,
        completed: editingTask?.subtasks?.[index]?.completed || false,
      }));

    const localTask: ProjectTask = {
      id: editingTask?.id || 'demo_task_' + slugify(taskForm.title) + '_' + Date.now(),
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || undefined,
      status: taskForm.status,
      priority: taskForm.priority,
      assignedTo: taskForm.assignee.trim(),
      dueDate: taskForm.dueDate,
      createdAt: editingTask?.createdAt || new Date().toISOString(),
      subtasks,
      tags: taskForm.tags.split(',').map(item => item.trim()).filter(Boolean),
    };

    setSaving(true);
    try {
      const payload = {
        title: localTask.title,
        description: localTask.description || '',
        projectId: project.id,
        projectName: project.name,
        assignee: localTask.assignedTo,
        priority: localTask.priority,
        status: localTask.status,
        dueDate: localTask.dueDate,
        tags: localTask.tags || [],
        subtasks: localTask.subtasks || [],
      };
      const response = editingTask
        ? await api.tasks.update(editingTask.id, payload)
        : await api.tasks.create(payload);

      if (response.success) {
        await syncProjects();
        showToast(language === 'id' ? 'Tugas berhasil disimpan.' : 'Task saved.');
      } else {
        setProjects(current =>
          current.map(item => {
            if (item.id !== project.id) return item;
            const tasks = editingTask
              ? item.tasks.map(task => (task.id === editingTask.id ? localTask : task))
              : [localTask, ...item.tasks];
            return { ...item, tasks, updatedAt: new Date().toISOString() };
          })
        );
        showToast('Task saved in demo mode.');
      }
    } catch {
      setProjects(current =>
        current.map(item => {
          if (item.id !== project.id) return item;
          const tasks = editingTask
            ? item.tasks.map(task => (task.id === editingTask.id ? localTask : task))
            : [localTask, ...item.tasks];
          return { ...item, tasks, updatedAt: new Date().toISOString() };
        })
      );
      showToast('Task saved in demo mode.');
    } finally {
      setSaving(false);
      setTaskDrawerOpen(false);
    }
  };

  // Drag & Drop Handlers
  const updateTaskStatus = async (task: ProjectTask, status: TaskStatus) => {
    if (!selectedSprintProject || task.status === status) {
      setDraggingTaskId(null);
      setDragOverTaskStatus(null);
      return;
    }

    setDraggingTaskId(null);
    setDragOverTaskStatus(null);

    const taskOverrides = readStatusOverrides<TaskStatus>(TASK_STATUS_OVERRIDES_KEY);
    taskOverrides[task.id] = status;
    writeStatusOverrides(TASK_STATUS_OVERRIDES_KEY, taskOverrides);

    setProjects(current =>
      current.map(project =>
        project.id === selectedSprintProject.id
          ? {
              ...project,
              tasks: project.tasks.map(item => item.id === task.id ? { ...item, status } : item),
              updatedAt: new Date().toISOString(),
            }
          : project
      )
    );

    try {
      const response = await api.tasks.update(task.id, { status });
      if (response.success) {
        showToast(language === 'id' ? 'Status tugas diperbarui.' : 'Task status updated.');
        return;
      }

      // Keep the optimistic local state when the API is unavailable or rejects
      // the update so the board remains usable for A/B testing and demo flows.
      showToast(language === 'id' ? 'Status tugas diperbarui lokal.' : 'Task status updated locally for this session.');
    } catch {
      // Preserve the optimistic local state for demo / A-B testing mode.
      showToast(language === 'id' ? 'Status tugas diperbarui lokal.' : 'Task status updated locally for this session.');
    }
  };

  const updateProjectStatus = async (project: ProjectRecord, status: ProjectStatus) => {
    if (!canManageProjects || project.status === status || movingProjectId === project.id) {
      setDraggingProjectId(null);
      setDragOverProjectStatus(null);
      return;
    }

    const updatedProject = normalizeProject({ ...project, status, updatedAt: new Date().toISOString() });
    const projectOverrides = readStatusOverrides<ProjectStatus>(PROJECT_STATUS_OVERRIDES_KEY);
    projectOverrides[project.id] = status;
    writeStatusOverrides(PROJECT_STATUS_OVERRIDES_KEY, projectOverrides);

    setMovingProjectId(project.id);
    setProjects(current =>
      current.map(item => item.id === project.id ? updatedProject : item)
    );
    setSelectedProject(current => current?.id === project.id ? updatedProject : current);
    setDraggingProjectId(null);
    setDragOverProjectStatus(null);

    try {
      const response = await api.projects.update(project.id, { status });
      if (response.success) {
        showToast(language === 'id' ? 'Status proyek diperbarui.' : 'Project status updated.');
        return;
      }

      showToast(language === 'id' ? 'Status proyek diperbarui lokal.' : 'Project status updated locally for this session.');
    } catch {
      showToast(language === 'id' ? 'Status proyek diperbarui lokal.' : 'Project status updated locally for this session.');
    } finally {
      setMovingProjectId(null);
    }
  };

  const toggleSubtask = async (task: ProjectTask, subtaskId: string) => {
    if (!selectedSprintProject) return;
    const nextSubtasks = (task.subtasks || []).map(item =>
      item.id === subtaskId ? { ...item, completed: !item.completed } : item
    );
    try {
      const response = await api.tasks.update(task.id, { subtasks: nextSubtasks });
      if (response.success) {
        await syncProjects();
        return;
      }
    } catch {
      // Fall through to demo mode.
    }
    setProjects(current =>
      current.map(project =>
        project.id === selectedSprintProject.id
          ? {
              ...project,
              tasks: project.tasks.map(item => item.id === task.id ? { ...item, subtasks: nextSubtasks } : item),
              updatedAt: new Date().toISOString(),
            }
          : project
      )
    );
  };

  const confirmDeleteProject = async () => {
    if (!deleteProject) return;
    const target = deleteProject;
    try {
      const response = await api.projects.delete(target.id);
      if (response.success) {
        await syncProjects();
        showToast('Project deleted.');
        setDeleteProject(null);
        return;
      }
    } catch {
      // Fall through to demo mode.
    }
    setProjects(current => current.filter(project => project.id !== target.id));
    setDeleteProject(null);
    showToast('Project removed from demo mode.');
  };

  const confirmDeleteTask = async () => {
    if (!deleteTask || !selectedSprintProject) return;
    const target = deleteTask;
    try {
      const response = await api.tasks.delete(target.id);
      if (response.success) {
        await syncProjects();
        showToast('Task deleted.');
        setDeleteTask(null);
        setSelectedTask(null);
        return;
      }
    } catch {
      // Fall through to demo mode.
    }
    setProjects(current =>
      current.map(project =>
        project.id === selectedSprintProject.id
          ? { ...project, tasks: project.tasks.filter(task => task.id !== target.id) }
          : project
      )
    );
    setDeleteTask(null);
    setSelectedTask(null);
    showToast('Task removed from demo mode.');
  };

  const exportProjects = () => {
    const rows = filteredProjects.map(project => [
      project.slug,
      project.name,
      project.clientCompany,
      statusLabel(project.status),
      String(project.progressPercent),
      String(project.budget),
      String(Math.round(project.budget * (project.progressPercent / 100))),
      project.teamLead,
      project.targetEndDate,
    ]);
    const csv = [
      ['slug', 'project', 'client', 'status', 'progress_percent', 'budget', 'budget_burn', 'owner', 'deadline'],
      ...rows,
    ]
      .map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'kapitech-projects-kanban.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('Projects exported.');
  };

  const openView = (nextView: ProjectsView) => {
    const next = new URLSearchParams(searchParams);
    if (nextView === 'all') next.delete('projects');
    else next.set('projects', nextView);
    setSearchParams(next);
  };

  const openLayout = (layout: ProjectLayout) => {
    setProjectLayout(layout);
    const next = new URLSearchParams(searchParams);
    if (layout === 'board') next.delete('layout');
    else next.set('layout', layout);
    setSearchParams(next, { replace: true });
  };

  const goToSprint = (project?: ProjectRecord) => {
    const next = new URLSearchParams(searchParams);
    next.set('projects', 'sprint');
    if (project) next.set('project', project.slug);
    setSearchParams(next);
    setSelectedProject(null);
  };

  const selectedProjectDetail = view === 'sprint'
    ? null
    : (
      (selectedProject?.id ? projects.find(project => project.id === selectedProject.id) : null) ||
      (selectedProjectSlug ? projects.find(project => project.slug === selectedProjectSlug) || null : null)
    );

  return (
    <div className="space-y-5">
      <Modal
        open={Boolean(deleteProject)}
        onClose={() => setDeleteProject(null)}
        size="sm"
        title="Delete project?"
        description={deleteProject ? 'Project "' + deleteProject.name + '" will be removed.' : undefined}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setDeleteProject(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDeleteProject()}>Delete</Button>
          </>
        )}
      >
        <div className="text-xs text-muted">This removes the record from the current workspace. Demo mode keeps the change local.</div>
      </Modal>

      <Modal
        open={Boolean(deleteTask)}
        onClose={() => setDeleteTask(null)}
        size="sm"
        title="Delete task?"
        description={deleteTask ? 'Task "' + deleteTask.title + '" will be removed.' : undefined}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setDeleteTask(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDeleteTask()}>Delete</Button>
          </>
        )}
      >
        <div className="text-xs text-muted">This action can be tested with the seeded task data without changing the API contract.</div>
      </Modal>

      <Modal
        open={Boolean(selectedProjectDetail)}
        onClose={clearProjectSelection}
        size="lg"
        title={selectedProjectDetail?.name || 'Project details'}
        description={selectedProjectDetail ? selectedProjectDetail.clientCompany : undefined}
        footer={(
          <>
            <Button variant="secondary" onClick={clearProjectSelection}>Close</Button>
            {selectedProjectDetail && (
              <Button icon={<ArrowUpRight size={14} />} onClick={() => goToSprint(selectedProjectDetail)}>
                Open delivery
              </Button>
            )}
          </>
        )}
      >
        {selectedProjectDetail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={'rounded-badge border px-2 py-1 text-[10px] font-semibold ' + projectStatusClass(selectedProjectDetail.status)}>
                {statusLabel(selectedProjectDetail.status)}
              </span>
              <span className={'rounded-badge border px-2 py-1 text-[10px] font-semibold ' + healthClass(selectedProjectDetail.health)}>
                {selectedProjectDetail.health || 'Good'}
              </span>
              <span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] text-muted">
                {selectedProjectDetail.slug}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Progress', selectedProjectDetail.progressPercent + '%'],
                ['Budget', formatAmount(selectedProjectDetail.budget, currency)],
                ['Deadline', formatDate(selectedProjectDetail.targetEndDate)],
                ['Tasks', selectedProjectDetail.tasks.filter(task => task.status === 'done').length + '/' + selectedProjectDetail.tasks.length + ' done'],
                ['Service', selectedProjectDetail.serviceCategory || 'Delivery'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-control border border-line bg-bg p-3">
                  <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted">{label}</div>
                  <div className="mt-1.5 truncate text-xs font-semibold text-fg">{value}</div>
                </div>
              ))}
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted">Owner</div>
                <div className="mt-1.5">
                  {selectedProjectDetail.teamLead ? (
                    <ProfileIdentity profile={{ name: selectedProjectDetail.teamLead, contextLabel: 'Project owner' }} showRole={false} />
                  ) : (
                    <span className="text-xs font-semibold text-muted">Unassigned</span>
                  )}
                </div>
              </div>
            </div>

            {canManageProjects && (
              <div className="rounded-card border border-line bg-bg p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-fg">Move project</div>
                    <p className="mt-1 text-[10px] leading-4 text-muted">Drag is the primary workflow. These controls are the keyboard and touch fallback.</p>
                  </div>
                  {movingProjectId === selectedProjectDetail.id && (
                    <span className="rounded-badge border border-accent/20 bg-accent/10 px-2 py-1 text-[9px] font-semibold text-accent-text">Updating…</span>
                  )}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {PROJECT_KANBAN_COLUMNS.map(column => (
                    <button
                      key={column.id}
                      type="button"
                      disabled={movingProjectId === selectedProjectDetail.id}
                      onClick={() => { void updateProjectStatus(selectedProjectDetail, column.id); }}
                      className={[
                        'min-h-10 rounded-control border px-2.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                        selectedProjectDetail.status === column.id
                          ? 'border-accent/30 bg-accent/10 text-accent'
                          : 'border-line bg-panel text-muted hover:border-accent/30 hover:bg-panel-hover hover:text-fg',
                        movingProjectId === selectedProjectDetail.id ? 'cursor-wait opacity-60' : '',
                      ].join(' ')}
                    >
                      {column.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-card border border-line bg-bg p-4">
              <div className="flex items-center justify-between gap-3 text-[11px] text-muted">
                <span>Delivery progress</span>
                <span className="font-semibold tabular-nums text-fg">{selectedProjectDetail.progressPercent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-accent" style={{ width: selectedProjectDetail.progressPercent + '%' }} />
              </div>
            </div>

            {selectedProjectDetail.notes && (
              <div>
                <div className="text-[11px] font-semibold text-muted">Notes</div>
                <p className="mt-2 rounded-card border border-line bg-bg p-3 text-xs leading-5 text-fg">{selectedProjectDetail.notes}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {selectedProjectDetail.repositoryUrl && (
                <a href={selectedProjectDetail.repositoryUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-control border border-line bg-bg px-3 text-xs text-fg hover:bg-panel-hover">
                  <Code2 size={13} /> Repository
                </a>
              )}
              {selectedProjectDetail.figmaUrl && (
                <a href={selectedProjectDetail.figmaUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-control border border-line bg-bg px-3 text-xs text-fg hover:bg-panel-hover">
                  <ExternalLink size={13} /> Figma
                </a>
              )}
              {selectedProjectDetail.liveStagingUrl && (
                <a href={selectedProjectDetail.liveStagingUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-control border border-line bg-bg px-3 text-xs text-fg hover:bg-panel-hover">
                  <ExternalLink size={13} /> Staging
                </a>
              )}
              {canManageProjects && (
                <Button variant="secondary" onClick={() => { clearProjectSelection(); openEditProject(selectedProjectDetail); }}>
                  Edit project
                </Button>
              )}
              {canManageProjects && (
                <Button variant="destructive" icon={<Trash2 size={13} />} onClick={() => { clearProjectSelection(); setDeleteProject(selectedProjectDetail); }}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        size="md"
        title={selectedTask?.title || 'Task details'}
        description={selectedTask ? selectedSprintProject?.name : undefined}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setSelectedTask(null)}>Close</Button>
            {canManageKanbanTasks && <Button onClick={() => { setSelectedTask(null); openEditTask(selectedTask); }}>Edit task</Button>}
          </>
        )}
      >
        {selectedTask && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={'rounded-badge border px-2 py-1 text-[10px] font-semibold ' + priorityClass(selectedTask.priority)}>{priorityLabel(selectedTask.priority)}</span>
              <span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] text-muted">{formatDate(selectedTask.dueDate)}</span>
              {isOverdue(selectedTask.dueDate) && selectedTask.status !== 'done' && <span className="rounded-badge border border-danger/30 bg-danger/10 px-2 py-1 text-[10px] font-semibold text-danger">Overdue</span>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-control border border-line bg-bg p-3"><div className="text-[10px] text-muted">Status</div><div className="mt-1.5 text-xs font-semibold text-fg">{taskStatusLabel(selectedTask.status)}</div></div>
              <div className="rounded-control border border-line bg-bg p-3"><div className="text-[10px] text-muted">Assignee</div><div className="mt-1.5">{selectedTask.assignedTo ? <ProfileIdentity profile={{ name: selectedTask.assignedTo, role: taskAssignees.find(assignee => assignee.name === selectedTask.assignedTo)?.role, division: taskAssignees.find(assignee => assignee.name === selectedTask.assignedTo)?.division, username: taskAssignees.find(assignee => assignee.name === selectedTask.assignedTo)?.username }} showRole={false} /> : <span className="text-xs font-semibold text-muted">Unassigned</span>}</div></div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted">Move to</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {TASK_COLUMNS.map(column => (
                  <button
                    key={column.id}
                    type="button"
                    onClick={() => { void updateTaskStatus(selectedTask, column.id); setSelectedTask({ ...selectedTask, status: column.id }); }}
                    className={'min-h-10 rounded-control border px-3 text-xs font-medium transition-colors ' + (selectedTask.status === column.id ? 'border-accent/30 bg-accent/10 text-accent' : 'border-line bg-bg text-muted hover:text-fg')}
                  >
                    {column.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted">Description</div>
              <p className="mt-2 rounded-card border border-line bg-bg p-3 text-xs leading-5 text-fg">{selectedTask.description || 'No description provided.'}</p>
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted">
                <span>Checklist</span>
                <span className="font-normal">{(selectedTask.subtasks || []).filter(item => item.completed).length}/{(selectedTask.subtasks || []).length}</span>
              </div>
              <div className="mt-2 space-y-2">
                {(selectedTask.subtasks || []).length === 0 ? (
                  <div className="rounded-control border border-dashed border-line p-3 text-xs text-muted">No checklist items.</div>
                ) : (
                  (selectedTask.subtasks || []).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        void toggleSubtask(selectedTask, item.id);
                        setSelectedTask({
                          ...selectedTask,
                          subtasks: (selectedTask.subtasks || []).map(subtask => subtask.id === item.id ? { ...subtask, completed: !subtask.completed } : subtask),
                        });
                      }}
                      className="flex w-full items-center gap-2.5 rounded-control border border-line bg-bg p-3 text-left"
                    >
                      {item.completed ? <CheckCircle2 size={15} className="shrink-0 text-success" /> : <span className="h-4 w-4 shrink-0 rounded border border-muted" />}
                      <span className={'text-xs ' + (item.completed ? 'text-muted line-through' : 'text-fg')}>{item.title}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
            {canManageKanbanTasks && (
              <Button variant="destructive" icon={<Trash2 size={13} />} onClick={() => { setDeleteTask(selectedTask); setSelectedTask(null); }}>Delete task</Button>
            )}
          </div>
        )}
      </Modal>

      <AdminModuleHeader
        eyebrow={view === 'all' ? 'Workspace / Projects' : 'Projects'}
        title={(
          <span className="flex min-w-0 flex-wrap items-center gap-2.5">
            <span>{view === 'all' ? 'Projects & Delivery Kanban' : view === 'sprint' ? 'Sprint & Delivery' : view === 'budget' ? 'Budget vs Actual' : 'Archived Projects'}</span>
            <span className="rounded-badge border border-accent/25 bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent">
              {activeProjects.length} Active Projects
            </span>
          </span>
        )}
        description={
          view === 'all'
            ? 'Project portfolio, delivery stages, resource ownership, and live execution from one workspace.'
            : view === 'sprint'
              ? 'Move work through execution stages and keep delivery ownership visible.'
              : view === 'budget'
                ? 'Compare committed project value with progress-based budget burn. Financial actuals can replace the demo burn when the ledger is connected.'
                : 'Completed projects kept visible for reference, handover history, and future reuse.'
        }
        actions={(
          <>
            {view === 'all' && (
              <div className="flex h-9 items-center gap-1 rounded-control border border-line bg-panel p-1">
                <button type="button" onClick={() => openLayout('board')} className={'inline-flex h-7 items-center gap-1.5 rounded-chip px-3 text-xs font-medium transition-colors ' + (projectLayout === 'board' ? 'bg-accent/10 text-fg' : 'text-muted hover:bg-bg hover:text-fg')}>
                  <LayoutGrid size={13} /> Kanban
                </button>
                <button type="button" onClick={() => openLayout('table')} className={'inline-flex h-7 items-center gap-1.5 rounded-chip px-3 text-xs font-medium transition-colors ' + (projectLayout === 'table' ? 'bg-accent/10 text-fg' : 'text-muted hover:bg-bg hover:text-fg')}>
                  <List size={13} /> Table
                </button>
              </div>
            )}
            <Button variant="secondary" icon={<Download size={14} />} onClick={exportProjects}>Export</Button>
            {canManageProjects && <Button icon={<Plus size={14} />} onClick={openNewProject}>New Project</Button>}
          </>
        )}
      />

      {toast && (
        <div role="status" className="fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 rounded-control border border-line bg-panel px-4 py-3 text-xs text-fg">
          {toast}
        </div>
      )}

      {error && (
        <div className="rounded-card border border-warning/25 bg-warning/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-fg">Demo data mode</p>
              <p className="mt-1 text-[11px] leading-5 text-muted">{error}</p>
            </div>
            <span className="rounded-badge border border-warning/25 bg-warning/10 px-2 py-1 text-[10px] font-semibold text-warning">slug-ready</span>
          </div>
        </div>
      )}

      {view === 'all' && (
        <>
          <section aria-label="Projects key performance indicators">
            <AdminMetricStrip
              className="sm:grid-cols-2 lg:grid-cols-4"
              metrics={[
                {
                  id: 'active-value',
                  label: 'Total active value',
                  value: formatAmount(metrics.value, currency),
                  change: activeProjects.length + ' active',
                  changeToneClassName: 'text-success',
                  context: 'Across active contracts',
                  sparkline: activeProjects.slice(0, 5).map(project => project.budget),
                  icon: <CircleDollarSign size={15} />,
                  toneClassName: 'text-success',
                },
                {
                  id: 'velocity',
                  label: 'Avg delivery velocity',
                  value: metrics.velocity + '%',
                  change: metrics.openTasks + ' open tasks',
                  changeToneClassName: 'text-info',
                  context: 'Based on active project progress',
                  sparkline: activeProjects.slice(0, 5).map(project => project.progressPercent),
                  icon: <BarChart3 size={15} />,
                  toneClassName: 'text-info',
                },
                {
                  id: 'risk',
                  label: 'Milestones at risk',
                  value: String(metrics.milestonesAtRisk || metrics.risks),
                  change: metrics.risks ? 'Action required' : 'Healthy',
                  changeToneClassName: metrics.risks ? 'text-danger' : 'text-success',
                  context: metrics.risks + ' projects need attention',
                  sparkline: [metrics.risks, metrics.milestonesAtRisk, metrics.openTasks, activeProjects.length],
                  icon: <ShieldAlert size={15} />,
                  toneClassName: metrics.risks ? 'text-danger' : 'text-success',
                },
                {
                  id: 'allocation',
                  label: 'Resource allocation',
                  value: metrics.assignedPeople + ' assigned',
                  change: activeProjects.length + ' active projects',
                  changeToneClassName: 'text-muted',
                  context: 'Unique owners & contributors',
                  sparkline: [1, Math.max(1, metrics.assignedPeople - 2), metrics.assignedPeople],
                  icon: <Users size={15} />,
                  toneClassName: 'text-fg',
                },
              ]}
            />
          </section>

          <AdminPanel
            title="Project portfolio"
            description={serverMode ? 'Manage the active project portfolio, move delivery stages from Kanban, and keep the table as the structured reporting view.' : 'Seeded project data keeps the portfolio fully testable without a connected project service.'}
          >
            <div className="border-b border-line bg-bg/40 p-4 sm:p-5">
              <div className="grid items-center gap-2.5 xl:grid-cols-[minmax(260px,1fr)_150px_150px_190px_170px_170px_auto]">
                <div className="relative min-w-0">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={projectSearch}
                    onChange={event => setProjectSearch(event.target.value)}
                    placeholder="Search projects, clients, owners..."
                    className={fieldClass + ' mt-0 pl-9'}
                  />
                </div>
                <CustomSelect
                  value={projectStatusFilter}
                  onChange={setProjectStatusFilter}
                  options={[{ value: '', label: 'All statuses' }, ...PROJECT_STATUSES]}
                  className="w-full"
                  aria-label="Filter projects by status"
                />
                <CustomSelect
                  value={projectHealthFilter}
                  onChange={setProjectHealthFilter}
                  options={[{ value: '', label: 'All health' }, ...(['Good', 'At Risk', 'Delayed', 'Blocked'] as ProjectHealth[]).map(value => ({ value, label: value }))]}
                  className="w-full"
                  aria-label="Filter projects by health"
                />
                <CustomSelect
                  value={projectClientFilter}
                  onChange={setProjectClientFilter}
                  options={[{ value: '', label: 'All clients' }, ...projectFilterOptions.clients.map(value => ({ value, label: value }))]}
                  className="w-full"
                  aria-label="Filter projects by client"
                />
                <CustomSelect
                  value={projectOwnerFilter}
                  onChange={setProjectOwnerFilter}
                  options={[{ value: '', label: 'All owners' }, ...projectFilterOptions.owners.map(value => ({ value, label: value }))]}
                  className="w-full"
                  aria-label="Filter projects by owner"
                />
                <CustomSelect
                  value={projectSort}
                  onChange={setProjectSort}
                  options={[
                    { value: 'updated', label: 'Recently updated' },
                    { value: 'deadline', label: 'Nearest deadline' },
                    { value: 'progress', label: 'Highest progress' },
                    { value: 'budget', label: 'Highest budget' },
                    { value: 'name', label: 'Name A–Z' },
                  ]}
                  className="w-full"
                  aria-label="Sort projects"
                />
                <button
                  type="button"
                  onClick={clearProjectFilters}
                  disabled={!activeProjectFilters && projectSort === 'updated'}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:bg-panel-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X size={13} />
                  Reset
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted">
                  <span className="font-medium text-fg">{filteredProjects.length}</span>
                  <span>of {projects.length} projects</span>
                  {activeProjectFilters > 0 && (
                    <span className="rounded-badge border border-accent/20 bg-accent/10 px-2 py-1 font-medium text-accent-text">
                      {activeProjectFilters} filter{activeProjectFilters === 1 ? '' : 's'} active
                    </span>
                  )}
                </div>
                {projectLayout === 'board' && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-muted">
                    <GripVertical size={12} />
                    Drag the handle on a card to move it between stages.
                  </span>
                )}
              </div>
            </div>
            {loading ? (
              <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(item => <div key={item} className="h-40 animate-pulse rounded-card bg-bg" />)}
              </div>
            ) : projectLayout === 'board' ? (
              <div className="ams-project-kanban-board overflow-x-auto overflow-y-clip custom-scrollbar">
                <div className="flex min-w-max items-start gap-4 px-5 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-6 min-h-[920px]">
                  {PROJECT_KANBAN_COLUMNS.map(column => {
                    const items = filteredProjects.filter(project => project.status === column.id);
                    const isDropTarget = dragOverProjectStatus === column.id;

                    return (
                      <section
                        key={column.id}
                        aria-label={column.label + ' project column'}
                        className={[
                          'ams-project-kanban-lane flex w-[352px] shrink-0 self-start flex-col rounded-[16px] border transition-[border-color,background-color,box-shadow] duration-200 sm:w-[390px]',
                          isDropTarget
                            ? 'border-accent/50 bg-accent/5 shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_18%,transparent)]'
                            : 'border-line/80',
                        ].join(' ')}
                        data-drop-target={isDropTarget ? 'true' : 'false'}
                      >
                        <div className="shrink-0 border-b border-line/80 bg-panel px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={'h-2 w-2 shrink-0 rounded-full ' + column.dot} />
                                <span className="text-xs font-semibold text-fg">{column.label}</span>
                                <span className="rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[9px] font-semibold text-muted">{items.length}</span>
                              </div>
                              <p className="mt-1 text-[10px] leading-4 text-muted">{column.description}</p>
                            </div>
                            {canManageProjects && (
                              <button
                                type="button"
                                onClick={() => openNewProject(column.id)}
                                className="inline-flex h-7 shrink-0 items-center gap-1 rounded-control border border-line bg-bg px-2 text-[10px] font-medium text-muted transition-colors hover:border-accent/30 hover:bg-panel-hover hover:text-fg"
                                aria-label={'Add project to ' + column.label}
                              >
                                <Plus size={12} /> Add
                              </button>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[9px] text-muted">
                            <span>{items.reduce((sum, project) => sum + project.tasks.filter(task => task.status !== 'done').length, 0)} open tasks</span>
                            <span className="tabular-nums">{formatAmount(items.reduce((sum, project) => sum + project.budget, 0), currency)}</span>
                          </div>
                        </div>

                        <div
                          onDragEnter={event => {
                            if (!canManageProjects) return;
                            event.preventDefault();
                            setDragOverProjectStatus(column.id);
                          }}
                          onDragOver={event => {
                            if (!canManageProjects) return;
                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';
                            setDragOverProjectStatus(column.id);
                          }}
                          onDragLeave={event => {
                            const nextTarget = event.relatedTarget as Node | null;
                            if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
                              setDragOverProjectStatus(current => current === column.id ? null : current);
                            }
                          }}
                          onDrop={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (!canManageProjects) return;
                            const projectId =
                              event.dataTransfer.getData('text/project-id') ||
                              event.dataTransfer.getData('text/plain') ||
                              draggingProjectId;
                            const project = projects.find(item => item.id === projectId);
                            if (project && project.status !== column.id) {
                              void updateProjectStatus(project, column.id);
                            } else {
                              setDraggingProjectId(null);
                              setDragOverProjectStatus(null);
                            }
                          }}
                          className={'ams-project-kanban-stack min-h-[820px] flex flex-col gap-3.5 p-3 pb-4 transition-colors ' + (isDropTarget ? 'bg-accent/5' : '')}>
                          {draggingProjectId && canManageProjects && (
                            <div className={'rounded-control border px-2.5 py-2 text-[9px] font-medium transition-colors ' + (isDropTarget ? 'border-accent/35 bg-accent/10 text-accent-text' : 'border-dashed border-line bg-bg/50 text-muted')}>
                              {isDropTarget ? 'Release to move project into ' + column.label : 'Drop here to move project into ' + column.label}
                            </div>
                          )}
                          {items.length === 0 ? (
                            <div className={'flex min-h-[180px] items-center justify-center rounded-card border border-dashed p-5 text-center text-[11px] text-muted transition-colors ' + (isDropTarget ? 'border-accent/40 bg-accent/5 text-fg' : 'border-line')}>
                              <span className="max-w-[190px]">
                                <span className="block font-medium text-fg">{canManageProjects && isDropTarget ? 'Drop project here' : 'No projects here'}</span>
                                <span className="mt-1 block text-muted">{canManageProjects ? 'Drag a card into this lane.' : 'No projects in this stage.'}</span>
                              </span>
                            </div>
                          ) : (
                            items.map(project => {
                              const taskDone = project.tasks.filter(task => task.status === 'done').length;
                              const burn = Math.round(project.budget * (project.progressPercent / 100));
                              const milestoneDone = project.milestones.filter(milestone => milestone.completed).length;
                              const isDragging = draggingProjectId === project.id;

                              return (
                                <article
                                  key={project.id}
                                  aria-grabbed={isDragging}
                                  className={'ams-project-kanban-card group select-none rounded-[12px] border border-line/90 p-4 transition-[transform,opacity,border-color,background-color,box-shadow] duration-150 hover:-translate-y-px hover:border-accent/40 hover:shadow-[0_10px_28px_color-mix(in_srgb,var(--bg)_55%,transparent)] ' + (
                                    isDragging ? 'rotate-[1deg] scale-[0.98] border-accent/50 opacity-70' : movingProjectId === project.id ? 'border-accent/35 opacity-80' : ''
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-start gap-2">
                                      <span
                                        data-drag-handle="true"
                                        draggable={canManageProjects && movingProjectId !== project.id}
                                        role="button"
                                        tabIndex={canManageProjects ? 0 : -1}
                                        aria-label={canManageProjects ? 'Drag to move project' : 'Project status'}
                                        className={[
                                          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted shadow-sm transition-[background-color,border-color,color,transform] select-none',
                                          canManageProjects && movingProjectId !== project.id
                                            ? 'cursor-grab touch-none hover:border-accent/35 hover:bg-panel-hover hover:text-fg active:cursor-grabbing active:scale-95'
                                            : 'cursor-default opacity-70',
                                        ].join(' ')}
                                        title={canManageProjects ? 'Drag to move this project' : 'Project status'}
                                        onDragStart={event => {
                                          if (!canManageProjects || movingProjectId === project.id) {
                                            event.preventDefault();
                                            return;
                                          }
                                          setDraggingProjectId(project.id);
                                          setDragOverProjectStatus(project.status);
                                          event.dataTransfer.effectAllowed = 'move';
                                          event.dataTransfer.setData('text/project-id', project.id);
                                          event.dataTransfer.setData('text/plain', project.id);
                                          try {
                                            event.dataTransfer.setDragImage(event.currentTarget.parentElement?.parentElement || event.currentTarget, 24, 24);
                                          } catch {
                                            // Browser may reject custom drag previews.
                                          }
                                        }}
                                        onDragEnd={() => {
                                          setDraggingProjectId(null);
                                          setDragOverProjectStatus(null);
                                        }}
                                      >
                                        <GripVertical size={16} strokeWidth={2} />
                                      </span>
                                      <button type="button" onClick={() => openProjectDetail(project)} className="min-w-0 text-left">
                                        <div className="break-words whitespace-normal text-[10px] font-medium uppercase leading-4 tracking-[0.08em] text-muted">{project.clientCompany}</div>
                                        <h3 className="mt-0.5 break-words whitespace-normal text-sm font-semibold leading-5 text-fg">{project.name}</h3>
                                      </button>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                      {movingProjectId === project.id && (
                                        <span className="rounded-badge border border-accent/20 bg-accent/10 px-2 py-1 text-[9px] font-semibold text-accent-text">Updating…</span>
                                      )}
                                      <button type="button" aria-label={'Actions for ' + project.name} onClick={() => openProjectDetail(project)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg">
                                        <MoreHorizontal size={15} />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                    <span className={'rounded-badge border px-2 py-1 text-[10px] font-medium ' + healthClass(project.health)}>{project.health || 'Good'}</span>
                                    <span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] text-muted">{taskDone}/{project.tasks.length} tasks</span>
                                    <span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] text-muted">{milestoneDone}/{project.milestones.length || 0} milestones</span>
                                  </div>
                                  <div className="mt-2 space-y-1.5 text-[10px] text-muted">
                                    <div className="flex items-start gap-1.5">
                                      <Briefcase size={11} className="mt-0.5 shrink-0" />
                                      <span className="break-words whitespace-normal">{project.serviceCategory || 'Delivery'}</span>
                                    </div>
                                    <div className="flex items-start gap-1.5">
                                      <CalendarDays size={11} className="mt-0.5 shrink-0" />
                                      <span className="break-words whitespace-normal text-muted">
                                        {project.startDate ? formatDate(project.startDate) : 'No start date'}
                                        <span className="mx-1 text-muted/60">→</span>
                                        <span className={isOverdue(project.targetEndDate) && project.status !== 'completed' ? 'font-semibold text-danger' : 'text-muted'}>
                                          {project.targetEndDate ? formatDate(project.targetEndDate) : 'No deadline'}
                                        </span>
                                      </span>
                                    </div>
                                  </div>

                                  <div className="mt-3 space-y-1.5">
                                    <div className="flex items-center justify-between text-[10px] text-muted">
                                      <span>Progress</span>
                                      <span className="font-semibold tabular-nums text-fg">{project.progressPercent}%</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-bg">
                                      <div className="h-full rounded-full bg-accent" style={{ width: project.progressPercent + '%' }} />
                                    </div>
                                  </div>

                                  <div className="mt-3 border-t border-line pt-2.5">
                                    <div className="flex items-end justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="text-[10px] uppercase tracking-[0.06em] text-muted">Budget burn</div>
                                        <div className="mt-0.5 break-words whitespace-normal text-xs font-medium tabular-nums text-fg">
                                          {formatAmount(burn, currency)}
                                          <span className="text-muted"> / {formatAmount(project.budget, currency)}</span>
                                        </div>
                                        <div className="mt-1 text-[9px] text-muted">
                                          {project.budget > 0 ? Math.round((burn / project.budget) * 100) : 0}% budget burn
                                        </div>
                                      </div>
                                      {project.teamLead ? (
                                        <ProfileIdentity
                                          profile={{ name: project.teamLead, role: 'Project owner', division: 'Delivery' }}
                                          compact
                                          size="sm"
                                          showRole={false}
                                          className="h-8 w-8 shrink-0"
                                        />
                                      ) : (
                                        <span className="text-[10px] font-medium text-muted">Unassigned</span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[10px]">
                                    <span className="min-w-0 break-words whitespace-normal text-muted">{project.slug}</span>
                                    <div className="flex shrink-0 items-center gap-2">
                                      <button type="button" onClick={() => openProjectDetail(project)} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-line bg-bg px-3.5 text-[11px] font-semibold text-fg transition-[background-color,border-color,color] hover:border-accent/30 hover:bg-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                                        View project
                                      </button>
                                      <button type="button" onClick={() => goToSprint(project)} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-accent/25 bg-accent/10 px-3.5 text-[11px] font-semibold text-accent-text transition-[background-color,border-color,color] hover:border-accent/40 hover:bg-accent/15 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                                        Delivery <ArrowUpRight size={13} />
                                      </button>
                                    </div>
                                  </div>
                                </article>
                              );
                            })
                          )}
                          <div
                            aria-hidden="true"
                            className={[
                              'mt-auto min-h-[240px] rounded-card border border-dashed px-3 py-5 transition-colors',
                              isDropTarget ? 'border-accent/35 bg-accent/5' : 'border-line/45 bg-bg/20'
                            ].join(' ')}
                          >
                            {draggingProjectId && canManageProjects ? (
                              <div className="flex min-h-20 flex-col items-center justify-center gap-2 text-center text-[10px] text-muted">
                                <span className="flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted">
                                  <GripVertical size={14} />
                                </span>
                                <span className={isDropTarget ? 'font-semibold text-accent-text' : 'text-muted'}>
                                  {isDropTarget ? 'Release to place the project here' : 'Drop project here'}
                                </span>
                              </div>
                            ) : (
                              <div className="flex min-h-20 items-center justify-center text-center text-[10px] text-muted/55">
                                Drop area
                              </div>
                            )}
                          </div>
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="ams-data-table min-w-[980px] text-left">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Budget burn</th>
                      <th>Owner</th>
                      <th>Deadline</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map(project => {
                      const burn = Math.round(project.budget * (project.progressPercent / 100));
                      return (
                        <tr key={project.id}>
                          <td>
                            <button type="button" onClick={() => openProjectDetail(project)} className="min-w-0 text-left">
                              <div className="max-w-[260px] truncate text-xs font-semibold text-fg">{project.name}</div>
                              <div className="mt-0.5 max-w-[260px] truncate text-[11px] text-muted">{project.clientCompany}</div>
                            </button>
                          </td>
                          <td><span className={'inline-flex rounded-badge border px-2 py-1 text-[10px] font-semibold ' + projectStatusClass(project.status)}>{statusLabel(project.status)}</span></td>
                          <td>
                            <div className="min-w-[150px]">
                              <div className="flex items-center justify-between text-[10px] text-muted"><span>Delivery</span><span className="tabular-nums text-fg">{project.progressPercent}%</span></div>
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-accent" style={{ width: project.progressPercent + '%' }} /></div>
                            </div>
                          </td>
                          <td className="text-xs tabular-nums font-medium text-fg">{formatAmount(burn, currency)} <span className="text-muted">/ {formatAmount(project.budget, currency)}</span></td>
                          <td>
                            {project.teamLead ? (
                              <ProfileIdentity
                                profile={{ name: project.teamLead, contextLabel: 'Project owner' }}
                                showRole={false}
                              />
                            ) : (
                              <span className="text-xs text-muted">Unassigned</span>
                            )}
                          </td>
                          <td className={'text-xs ' + (isOverdue(project.targetEndDate) && project.status !== 'completed' ? 'text-danger' : 'text-fg')}>{formatDate(project.targetEndDate)}</td>
                          <td>
                            <div className="ams-table-actions">
                              <button type="button" className="ams-table-action" onClick={() => openProjectDetail(project)}>View</button>
                              {canManageProjects && <button type="button" className="ams-table-action" data-primary="true" onClick={() => openEditProject(project)}>Edit</button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </AdminPanel>
        </>
      )}

      {/* Task Execution Board */}
      {view === 'sprint' && (
        <div className="space-y-4">
          <AdminPanel
            title="Sprint & Delivery"
            description="Run one project from a single delivery board. Filter the workload, move tasks between stages, and open task detail without leaving the sprint."
            actions={(
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <CustomSelect
                  value={selectedSprintProject?.id || ''}
                  onChange={value => {
                    const project = projects.find(item => item.id === value);
                    const next = new URLSearchParams(searchParams);
                    if (project) next.set('project', project.slug);
                    setSearchParams(next, { replace: true });
                  }}
                  options={activeProjects.map(project => ({ value: project.id, label: project.name }))}
                  className="w-full sm:w-64"
                  aria-label="Select sprint project"
                />
                {canManageKanbanTasks && (
                  <Button icon={<Plus size={14} />} onClick={() => handleAddTask('todo')}>New task</Button>
                )}
              </div>
            )}
          >
            {selectedSprintProject ? (
              <>
                <div className="grid gap-3 border-b border-line bg-bg/35 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(100px,0.5fr))]">
                  <div className="min-w-0 rounded-card border border-line bg-panel p-4">
                    <div className="flex min-w-0 items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-badge border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent-text">Active sprint</span>
                          <span className={'rounded-badge border px-2 py-1 text-[10px] font-semibold ' + healthClass(selectedSprintProject.health)}>
                            {selectedSprintProject.health || 'Good'}
                          </span>
                        </div>
                        <h2 className="mt-2 truncate text-sm font-semibold text-fg">{selectedSprintProject.name}</h2>
                        <p className="mt-1 truncate text-[11px] text-muted">{selectedSprintProject.clientCompany} · {selectedSprintProject.serviceCategory || 'Delivery work'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openProjectDetail(selectedSprintProject)}
                        className="shrink-0 rounded-control border border-line bg-bg px-2.5 py-1.5 text-[10px] font-medium text-muted transition-colors hover:bg-panel-hover hover:text-fg"
                      >
                        Project detail
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 text-[10px]">
                      <div className="flex min-w-0 items-center gap-2 text-muted">
                        <span className="shrink-0">Project progress</span>
                        <span className="font-semibold tabular-nums text-fg">{selectedSprintProject.progressPercent}%</span>
                      </div>
                      <span className="shrink-0 text-muted">Deadline {formatDate(selectedSprintProject.targetEndDate)}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
                      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: selectedSprintProject.progressPercent + '%' }} />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-[10px]">
                      <span className="text-muted">Sprint completion</span>
                      <span className="font-semibold tabular-nums text-fg">{sprintStats.completion}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
                      <div className="h-full rounded-full bg-success transition-[width]" style={{ width: sprintStats.completion + '%' }} />
                    </div>
                  </div>

                  {[
                    ['Tasks', sprintStats.total, 'Current workload'],
                    ['Open', sprintStats.open, 'Needs movement'],
                    ['Review', sprintStats.review, 'Awaiting review'],
                    ['Overdue', sprintStats.overdue, 'Past due'],
                  ].map(([label, value, context]) => (
                    <div key={String(label)} className="rounded-card border border-line bg-panel p-4">
                      <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted">{label}</div>
                      <div className="mt-2 text-xl font-semibold tabular-nums text-fg">{value}</div>
                      <div className="mt-1 text-[10px] text-muted">{context}</div>
                    </div>
                  ))}
                </div>

                <div className="border-b border-line bg-bg/25 p-4 sm:p-5">
                  <div className="grid items-center gap-2.5 lg:grid-cols-[minmax(250px,1fr)_150px_180px_165px_auto]">
                    <div className="relative min-w-0">
                      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        value={taskSearch}
                        onChange={event => setTaskSearch(event.target.value)}
                        placeholder="Search title, owner, tags..."
                        className={fieldClass + ' mt-0 pl-9'}
                        aria-label="Search sprint tasks"
                      />
                    </div>
                    <CustomSelect
                      value={taskPriorityFilter}
                      onChange={setTaskPriorityFilter}
                      options={[{ value: '', label: 'All priorities' }, ...TASK_PRIORITIES]}
                      className="w-full"
                      aria-label="Filter tasks by priority"
                    />
                    <CustomSelect
                      value={taskAssigneeFilter}
                      onChange={setTaskAssigneeFilter}
                      options={[{ value: '', label: 'All assignees' }, ...taskAssigneeOptions.map(value => ({ value, label: value }))]}
                      className="w-full"
                      aria-label="Filter tasks by assignee"
                    />
                    <CustomSelect
                      value={taskSort}
                      onChange={setTaskSort}
                      options={[
                        { value: 'priority', label: 'Priority first' },
                        { value: 'due', label: 'Nearest due date' },
                        { value: 'created', label: 'Recently created' },
                        { value: 'title', label: 'Title A–Z' },
                      ]}
                      className="w-full"
                      aria-label="Sort sprint tasks"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setTaskSearch('');
                        setTaskPriorityFilter('');
                        setTaskAssigneeFilter('');
                        setTaskSort('priority');
                      }}
                      disabled={!activeTaskFilters && taskSort === 'priority'}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:bg-panel-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <X size={13} /> Reset
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                    <div className="flex flex-wrap items-center gap-2 text-muted">
                      <span><strong className="font-semibold text-fg">{visibleTasks.length}</strong> visible of {sprintStats.total} tasks</span>
                      {activeTaskFilters > 0 && (
                        <span className="rounded-badge border border-accent/20 bg-accent/10 px-2 py-1 font-medium text-accent-text">{activeTaskFilters} filter{activeTaskFilters === 1 ? '' : 's'} active</span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <SlidersHorizontal size={12} />
                      {canManageKanbanTasks ? 'Drag any task card to change stage' : 'Task movement is read-only'}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar bg-bg p-5 sm:p-6">
                  <div className="flex min-w-max items-stretch gap-3">
                    {TASK_COLUMNS.map(column => {
                      const tasks = visibleTasks.filter(task => task.status === column.id);
                      const isDropTarget = dragOverTaskStatus === column.id;
                      return (
                        <section
                          key={column.id}
                          aria-label={column.label + ' task column'}
                          onDragOver={event => {
                            if (!canManageKanbanTasks) return;
                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';
                            setDragOverTaskStatus(column.id);
                          }}
                          onDragEnter={event => {
                            if (!canManageKanbanTasks) return;
                            event.preventDefault();
                            setDragOverTaskStatus(column.id);
                          }}
                          onDragLeave={event => {
                            const nextTarget = event.relatedTarget as Node | null;
                            if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
                              setDragOverTaskStatus(current => current === column.id ? null : current);
                            }
                          }}
                          onDrop={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (!canManageKanbanTasks) return;
                            const id =
                              event.dataTransfer.getData('text/project-task-id') ||
                              event.dataTransfer.getData('text/plain') ||
                              draggingTaskId;
                            const task = selectedSprintProject.tasks.find(item => item.id === id);
                            if (task) {
                              void updateTaskStatus(task, column.id);
                            } else {
                              setDraggingTaskId(null);
                              setDragOverTaskStatus(null);
                            }
                          }}
                          className={[
                            'flex w-[320px] shrink-0 self-start flex-col rounded-[14px] border bg-panel/35 transition-[border-color,background-color,box-shadow] duration-150 sm:w-[340px]',
                            isDropTarget ? 'border-accent/45 bg-accent/5 shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_14%,transparent)]' : 'border-line/80',
                          ].join(' ')}
                        >
                          <div className="shrink-0 border-b border-line/80 bg-panel/80 px-4 py-4 backdrop-blur-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={'h-2 w-2 shrink-0 rounded-full ' + column.tone} />
                                  <span className="text-xs font-semibold text-fg">{column.label}</span>
                                  <span className="text-[10px] text-muted">{tasks.length}</span>
                                </div>
                                <p className="mt-1 text-[10px] leading-4 text-muted">
                                  {column.id === 'todo' ? 'Ready to pick up' : column.id === 'in_progress' ? 'Actively being worked' : column.id === 'review' ? 'Waiting for review' : 'Completed delivery'}
                                </p>
                              </div>
                              {canManageKanbanTasks && (
                                <button
                                  type="button"
                                  onClick={() => handleAddTask(column.id)}
                                  className="inline-flex h-7 shrink-0 items-center gap-1 rounded-control border border-line bg-bg px-2 text-[10px] font-medium text-muted transition-colors hover:border-accent/30 hover:bg-panel-hover hover:text-fg"
                                  aria-label={'Add task to ' + column.label}
                                >
                                  <Plus size={12} /> Add
                                </button>
                              )}
                            </div>
                          </div>

                          <div className={[
                            'min-h-[620px] flex flex-col gap-2.5 bg-bg/20 p-3 pb-4 transition-colors duration-150',
                            isDropTarget ? 'bg-accent/5' : '',
                          ].join(' ')}>
                            {draggingTaskId && canManageKanbanTasks && (
                              <div className={'rounded-control border px-2.5 py-2 text-[9px] font-medium transition-colors ' + (isDropTarget ? 'border-accent/35 bg-accent/10 text-accent-text' : 'border-dashed border-line bg-bg/50 text-muted')}>
                                {isDropTarget ? 'Release to move task into ' + column.label : 'Drop here to move task into ' + column.label}
                              </div>
                            )}
                            {tasks.length === 0 ? (
                              <div className={[
                                'flex min-h-[210px] items-center justify-center rounded-card border border-dashed p-6 text-center transition-colors',
                                isDropTarget ? 'border-accent/40 bg-accent/5' : 'border-line/80 bg-bg/35',
                              ].join(' ')}>
                                <div className="max-w-[180px]">
                                  <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted">
                                    <Plus size={14} />
                                  </span>
                                  <span className="mt-2 block text-[11px] font-medium text-fg">{isDropTarget ? 'Drop task here' : 'No tasks here'}</span>
                                  <span className="mt-1 block text-[10px] leading-4 text-muted">
                                    {isDropTarget ? 'Release to move this task into the stage.' : canManageKanbanTasks ? 'Add a task or drag one here.' : 'No tasks currently in this stage.'}
                                  </span>
                                  {canManageKanbanTasks && !isDropTarget && (
                                    <button type="button" onClick={() => handleAddTask(column.id)} className="mt-3 text-[10px] font-medium text-accent-text hover:text-accent">
                                      Add task
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              tasks.map(task => {
                                const doneSubtasks = (task.subtasks || []).filter(item => item.completed).length;
                                const checklistTotal = (task.subtasks || []).length;
                                const overdue = task.status !== 'done' && isOverdue(task.dueDate);
                                const dueDays = daysUntil(task.dueDate);
                                const isDragging = draggingTaskId === task.id;
                                return (
                                  <article
                                    key={task.id}
                                    aria-grabbed={isDragging}
                                    className={[
                                      'group cursor-grab select-none rounded-[12px] border bg-panel p-3.5 transition-[transform,opacity,border-color,background-color,box-shadow] duration-150 active:cursor-grabbing',
                                      canManageKanbanTasks ? '' : 'cursor-default',
                                      'border-line hover:border-accent/30 hover:bg-panel-hover',
                                      isDragging ? 'rotate-[0.6deg] scale-[0.98] opacity-50 shadow-lg' : '',
                                    ].join(' ')}
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <span
                                        draggable={canManageKanbanTasks}
                                        role="button"
                                        tabIndex={canManageKanbanTasks ? 0 : -1}
                                        aria-label={canManageKanbanTasks ? 'Drag to move task' : 'Task movement is read-only'}
                                        className={[
                                          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted shadow-sm transition-[background-color,border-color,color,transform] select-none',
                                          canManageKanbanTasks
                                            ? 'cursor-grab touch-none hover:border-accent/35 hover:bg-panel-hover hover:text-fg active:cursor-grabbing active:scale-95'
                                            : 'cursor-default opacity-70',
                                        ].join(' ')}
                                        title={canManageKanbanTasks ? 'Drag to move task' : 'Task movement is read-only'}
                                        onDragStart={event => {
                                          if (!canManageKanbanTasks) {
                                            event.preventDefault();
                                            return;
                                          }
                                          setDraggingTaskId(task.id);
                                          event.dataTransfer.effectAllowed = 'move';
                                          event.dataTransfer.setData('text/project-task-id', task.id);
                                          event.dataTransfer.setData('text/plain', task.id);
                                          try {
                                            event.dataTransfer.setDragImage(event.currentTarget.parentElement?.parentElement || event.currentTarget, 24, 24);
                                          } catch {
                                            // Browser may reject custom drag previews.
                                          }
                                        }}
                                        onDragEnd={() => {
                                          setDraggingTaskId(null);
                                          setDragOverTaskStatus(null);
                                        }}
                                      >
                                        <GripVertical size={16} strokeWidth={2} />
                                      </span>
                                      <button type="button" onClick={() => setSelectedTask(task)} className="min-w-0 flex-1 text-left">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className={'rounded-badge border px-2 py-1 text-[9px] font-semibold ' + priorityClass(task.priority)}>{priorityLabel(task.priority)}</span>
                                          {overdue && (
                                            <span className="inline-flex items-center gap-1 rounded-badge border border-danger/20 bg-danger/5 px-2 py-1 text-[9px] font-semibold text-danger">
                                              <Clock size={10} /> Overdue
                                            </span>
                                          )}
                                        </div>
                                        <h3 className="mt-2 text-xs font-semibold leading-5 text-fg">{task.title}</h3>
                                        {task.description && <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted">{task.description}</p>}
                                      </button>
                                      <button type="button" onClick={() => setSelectedTask(task)} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-bg hover:text-fg" aria-label={'Open ' + task.title}>
                                        <MoreHorizontal size={14} />
                                      </button>
                                    </div>

                                    {(task.tags || []).length > 0 && (
                                      <div className="mt-3 flex flex-wrap gap-1">
                                        {(task.tags || []).slice(0, 3).map(tag => (
                                          <span key={tag} className="rounded-badge border border-line bg-bg px-1.5 py-1 text-[9px] text-muted">{tag}</span>
                                        ))}
                                        {(task.tags || []).length > 3 && <span className="rounded-badge border border-line bg-bg px-1.5 py-1 text-[9px] text-muted">+{task.tags.length - 3}</span>}
                                      </div>
                                    )}

                                    {checklistTotal > 0 && (
                                      <div className="mt-3">
                                        <div className="flex items-center justify-between text-[9px] text-muted">
                                          <span>Checklist</span>
                                          <span className="tabular-nums text-fg">{doneSubtasks}/{checklistTotal}</span>
                                        </div>
                                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg">
                                          <div className="h-full rounded-full bg-success transition-[width]" style={{ width: ((doneSubtasks / checklistTotal) * 100) + '%' }} />
                                        </div>
                                      </div>
                                    )}

                                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                                      <div className="flex min-w-0 items-center gap-2">
                                        {task.assignedTo ? (
                                          <ProfileIdentity
                                            profile={{
                                              id: taskAssignees.find(assignee => assignee.name === task.assignedTo)?.id,
                                              name: task.assignedTo,
                                              role: taskAssignees.find(assignee => assignee.name === task.assignedTo)?.role,
                                              division: taskAssignees.find(assignee => assignee.name === task.assignedTo)?.division,
                                              username: taskAssignees.find(assignee => assignee.name === task.assignedTo)?.username
                                            }}
                                            size="sm"
                                            showRole={false}
                                          />
                                        ) : (
                                          <span className="text-[10px] font-medium text-muted">Unassigned</span>
                                        )}
                                        <div className="min-w-0">
                                          <div className="text-[9px] text-muted">{dueDays === null ? 'No due date' : overdue ? 'Past due' : dueDays === 0 ? 'Due today' : dueDays === 1 ? 'Due tomorrow' : 'Due ' + formatDate(task.dueDate)}</div>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedTask(task)}
                                        className="shrink-0 text-[10px] font-medium text-muted transition-colors hover:text-fg"
                                      >
                                        Details
                                      </button>
                                    </div>
                                  </article>
                                );
                              })
                            )}
                            <div
                              aria-hidden="true"
                              className={[
                                'mt-auto min-h-[160px] rounded-card border border-dashed px-3 py-5 transition-colors',
                                isDropTarget ? 'border-accent/35 bg-accent/5' : 'border-line/20 bg-bg/10'
                              ].join(' ')}
                            >
                              {draggingTaskId && canManageKanbanTasks ? (
                                <div className="flex min-h-16 flex-col items-center justify-center gap-2 text-center text-[10px] text-muted">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted">
                                    <GripVertical size={14} />
                                  </span>
                                  <span className={isDropTarget ? 'font-semibold text-accent-text' : 'text-muted'}>
                                    {isDropTarget ? 'Release to place the task here' : 'Drop task here'}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex min-h-16 items-center justify-center text-center text-[10px] text-muted/55">
                                  Drop space
                                </div>
                              )}
                            </div>
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[360px] items-center justify-center p-8 text-center">
                <div>
                  <div className="text-sm font-semibold text-fg">No active project available</div>
                  <div className="mt-1 text-xs text-muted">Create or activate a project to start a sprint.</div>
                </div>
              </div>
            )}
          </AdminPanel>
        </div>
      )}

      {/* CONTEXTUAL TASK DETAIL DRAWER */}
      {view === 'budget' && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Committed', formatAmount(activeProjects.reduce((sum, project) => sum + project.budget, 0), currency), 'Active portfolio'],
              ['Burn to date', formatAmount(budgetRows.filter(row => row.project.status !== 'completed').reduce((sum, row) => sum + row.burn, 0), currency), 'Derived from progress'],
              ['Remaining', formatAmount(budgetRows.filter(row => row.project.status !== 'completed').reduce((sum, row) => sum + row.remaining, 0), currency), 'Unburned commitment'],
              ['At risk', String(budgetRows.filter(row => row.project.health !== 'Good').length), 'Projects to review'],
            ].map(([label, value, context]) => (
              <article key={label} className="rounded-card border border-line bg-panel p-4">
                <div className="text-xs font-medium text-muted">{label}</div>
                <div className="mt-3 text-2xl font-semibold tabular-nums text-fg">{value}</div>
                <div className="mt-1 text-[11px] text-muted">{context}</div>
              </article>
            ))}
          </section>

          <AdminPanel title="Budget vs actual" description="Progress-based actuals keep this view useful before financial ledger integration.">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="ams-data-table min-w-[900px] text-left">
                <thead>
                  <tr><th>Project</th><th>Budget</th><th>Actual to date</th><th>Remaining</th><th>Progress</th><th>Variance</th></tr>
                </thead>
                <tbody>
                  {budgetRows.map(row => (
                    <tr key={row.project.id}>
                      <td>
                        <button type="button" onClick={() => openProjectDetail(row.project)} className="text-left">
                          <div className="text-xs font-semibold text-fg">{row.project.name}</div>
                          <div className="mt-0.5 text-[11px] text-muted">{row.project.clientCompany}</div>
                        </button>
                      </td>
                      <td className="text-xs tabular-nums text-fg">{formatAmount(row.project.budget, currency)}</td>
                      <td className="text-xs tabular-nums text-fg">{formatAmount(row.burn, currency)}</td>
                      <td className="text-xs tabular-nums text-fg">{formatAmount(row.remaining, currency)}</td>
                      <td>
                        <div className="min-w-[150px]"><div className="flex justify-between text-[10px] text-muted"><span>Delivery</span><span>{row.project.progressPercent}%</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-accent" style={{ width: row.project.progressPercent + '%' }} /></div></div>
                      </td>
                      <td className={'text-xs tabular-nums font-medium ' + (row.variance < 0 ? 'text-danger' : 'text-success')}>{formatAmount(row.variance, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminPanel>
        </>
      )}

      {view === 'archived' && (
        <div className="space-y-4">
          <section aria-label="Archived project summary">
            <AdminMetricStrip
              className="sm:grid-cols-2 lg:grid-cols-4"
              metrics={[
                {
                  id: 'archived-count',
                  label: 'Completed projects',
                  value: String(archivedProjects.length),
                  change: 'Historical delivery',
                  changeToneClassName: 'text-success',
                  context: 'Closed project records',
                  sparkline: archivedProjects.slice(0, 5).map(project => project.progressPercent),
                  icon: <CheckCircle2 size={15} />,
                  toneClassName: 'text-success',
                },
                {
                  id: 'archived-value',
                  label: 'Completed value',
                  value: formatAmount(archiveStats.totalValue, currency),
                  change: archiveStats.clients + ' clients',
                  changeToneClassName: 'text-info',
                  context: 'Historical portfolio value',
                  sparkline: archivedProjects.slice(0, 5).map(project => project.budget),
                  icon: <CircleDollarSign size={15} />,
                  toneClassName: 'text-info',
                },
                {
                  id: 'archived-progress',
                  label: 'Average final progress',
                  value: archiveStats.averageProgress + '%',
                  change: 'Delivery completion',
                  changeToneClassName: 'text-success',
                  context: 'Across archived projects',
                  sparkline: archivedProjects.slice(0, 5).map(project => project.progressPercent),
                  icon: <BarChart3 size={15} />,
                  toneClassName: 'text-fg',
                },
                {
                  id: 'archived-clients',
                  label: 'Historical clients',
                  value: String(archiveStats.clients),
                  change: filteredArchivedProjects.length + ' visible',
                  changeToneClassName: 'text-muted',
                  context: 'Distinct client companies',
                  sparkline: [archiveStats.clients, archivedProjects.length, filteredArchivedProjects.length],
                  icon: <Users size={15} />,
                  toneClassName: 'text-fg',
                },
              ]}
            />
          </section>

          <AdminPanel
            title="Archived projects"
            description="Completed delivery records remain queryable for reference, handover history, and future reuse."
          >
            <div className="border-b border-line bg-bg/40 p-4 sm:p-5">
              <div className="grid items-center gap-2.5 md:grid-cols-[minmax(260px,1fr)_170px_auto]">
                <div className="relative min-w-0">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={archiveSearch}
                    onChange={event => setArchiveSearch(event.target.value)}
                    placeholder="Search archived projects, clients, owners..."
                    className={fieldClass + ' mt-0 pl-9'}
                    aria-label="Search archived projects"
                  />
                </div>
                <CustomSelect
                  value={archiveHealthFilter}
                  onChange={setArchiveHealthFilter}
                  options={[{ value: '', label: 'All health' }, ...(['Good', 'At Risk', 'Delayed', 'Blocked'] as ProjectHealth[]).map(value => ({ value, label: value }))]}
                  className="w-full"
                  aria-label="Filter archived projects by health"
                />
                <button
                  type="button"
                  onClick={() => {
                    setArchiveSearch('');
                    setArchiveHealthFilter('');
                  }}
                  disabled={!archiveSearch && !archiveHealthFilter}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:bg-panel-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X size={13} />
                  Reset
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted">
                <span><strong className="font-semibold text-fg">{filteredArchivedProjects.length}</strong> of {archivedProjects.length} completed projects</span>
                <span className="hidden sm:inline">Historical records are read from the same canonical project model.</span>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="ams-data-table min-w-[1020px] text-left">
                <thead><tr><th>Project</th><th>Client</th><th>Completed</th><th>Budget</th><th>Final progress</th><th>Owner</th><th>Slug</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredArchivedProjects.map(project => (
                    <tr key={project.id}>
                      <td>
                        <button type="button" onClick={() => openProjectDetail(project)} className="min-w-0 text-left">
                          <div className="max-w-[250px] truncate text-xs font-semibold text-fg">{project.name}</div>
                          <div className="mt-0.5 max-w-[250px] truncate text-[11px] text-muted">{project.serviceCategory || 'Delivery'}</div>
                        </button>
                      </td>
                      <td className="text-xs text-muted">{project.clientCompany || '—'}</td>
                      <td className="text-xs text-fg">{formatDate(project.targetEndDate)}</td>
                      <td className="text-xs tabular-nums text-fg">{formatAmount(project.budget, currency)}</td>
                      <td>
                        <div className="min-w-[150px]">
                          <div className="flex items-center justify-between text-[10px] text-muted"><span>Final</span><span className="tabular-nums text-fg">{project.progressPercent}%</span></div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-success" style={{ width: project.progressPercent + '%' }} /></div>
                        </div>
                      </td>
                      <td>
                        {project.teamLead ? (
                          <ProfileIdentity profile={{ name: project.teamLead, contextLabel: 'Project owner' }} showRole={false} />
                        ) : (
                          <span className="text-xs text-muted">Unassigned</span>
                        )}
                      </td>
                      <td className="text-[11px] text-muted">{project.slug}</td>
                      <td>
                        <div className="ams-table-actions">
                          <button type="button" className="ams-table-action" onClick={() => openProjectDetail(project)}>View</button>
                          {canManageProjects && <button type="button" className="ams-table-action" data-primary="true" onClick={() => openEditProject(project)}>Edit</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredArchivedProjects.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-xs text-muted">
                      {archivedProjects.length ? 'No archived projects match the current filters.' : 'No archived projects yet.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </AdminPanel>
        </div>
      )}

      <Drawer
        open={projectDrawerOpen}
        onClose={() => !saving && setProjectDrawerOpen(false)}
        size="xl"
        title={editingProject ? 'Edit project' : 'New project'}
        description="Maintain one canonical project record for client, delivery, budget, and ownership."
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setProjectDrawerOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" form="projects-form" loading={saving}>{editingProject ? 'Save changes' : 'Create project'}</Button>
          </>
        )}
      >
        <form id="projects-form" onSubmit={saveProject} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-muted">Project name<input required value={projectForm.name} onChange={event => setProjectForm({ ...projectForm, name: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted">Client company<input required value={projectForm.clientCompany} onChange={event => setProjectForm({ ...projectForm, clientCompany: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted">Client contact<input value={projectForm.clientName} onChange={event => setProjectForm({ ...projectForm, clientName: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted">Client email<input type="email" value={projectForm.clientEmail} onChange={event => setProjectForm({ ...projectForm, clientEmail: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted">Service category<input value={projectForm.serviceCategory} onChange={event => setProjectForm({ ...projectForm, serviceCategory: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted">Owner<input value={projectForm.teamLead} onChange={event => setProjectForm({ ...projectForm, teamLead: event.target.value })} className={fieldClass} /></label>
            <div><label className="text-xs text-muted">Status</label><CustomSelect value={projectForm.status} onChange={value => setProjectForm({ ...projectForm, status: value as ProjectStatus })} options={PROJECT_STATUSES} className="mt-1 w-full" /></div>
            <div><label className="text-xs text-muted">Health</label><CustomSelect value={projectForm.health} onChange={value => setProjectForm({ ...projectForm, health: value as ProjectHealth })} options={['Good', 'At Risk', 'Delayed', 'Blocked'].map(value => ({ value, label: value }))} className="mt-1 w-full" /></div>
            <label className="text-xs text-muted">Budget<input type="number" min="0" value={projectForm.budget} onChange={event => setProjectForm({ ...projectForm, budget: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted">Progress %<input type="number" min="0" max="100" value={projectForm.progressPercent} onChange={event => setProjectForm({ ...projectForm, progressPercent: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted">Start date<input type="date" value={projectForm.startDate} onChange={event => setProjectForm({ ...projectForm, startDate: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted">Deadline<input type="date" value={projectForm.targetEndDate} onChange={event => setProjectForm({ ...projectForm, targetEndDate: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted sm:col-span-2">Team members, comma separated<input value={projectForm.teamMembers} onChange={event => setProjectForm({ ...projectForm, teamMembers: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted sm:col-span-2">Technology stack, comma separated<input value={projectForm.techStack} onChange={event => setProjectForm({ ...projectForm, techStack: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted">Repository URL<input type="url" value={projectForm.repositoryUrl} onChange={event => setProjectForm({ ...projectForm, repositoryUrl: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted">Figma URL<input type="url" value={projectForm.figmaUrl} onChange={event => setProjectForm({ ...projectForm, figmaUrl: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted sm:col-span-2">Staging URL<input type="url" value={projectForm.liveStagingUrl} onChange={event => setProjectForm({ ...projectForm, liveStagingUrl: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted sm:col-span-2">Notes<textarea value={projectForm.notes} onChange={event => setProjectForm({ ...projectForm, notes: event.target.value })} className={fieldClass + ' min-h-24 py-2'} /></label>
          </div>
        </form>
      </Drawer>

      <Drawer
        open={taskDrawerOpen}
        onClose={() => !saving && setTaskDrawerOpen(false)}
        size="lg"
        title={editingTask ? 'Edit task' : 'New task'}
        description="Keep task ownership, priority, timing, and checklist detail aligned to the delivery board."
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setTaskDrawerOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" form="projects-task-form" loading={saving}>{editingTask ? 'Save changes' : 'Create task'}</Button>
          </>
        )}
      >
        <form id="projects-task-form" onSubmit={saveTask} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-muted sm:col-span-2">Task title<input required value={taskForm.title} onChange={event => setTaskForm({ ...taskForm, title: event.target.value })} className={fieldClass} /></label>
            <div><label className="text-xs text-muted">Project</label><CustomSelect value={taskForm.projectId} onChange={value => setTaskForm({ ...taskForm, projectId: value })} options={activeProjects.map(project => ({ value: project.id, label: project.name }))} className="mt-1 w-full" /></div>
            <label className="text-xs text-muted">Assignee
              <input
                value={taskForm.assignee}
                onChange={event => setTaskForm({ ...taskForm, assignee: event.target.value })}
                className={fieldClass}
                list="project-task-assignees"
                placeholder="Select or enter an active user"
              />
              <datalist id="project-task-assignees">
                {taskAssignees.map(assignee => (
                  <option key={assignee.id} value={assignee.name}>
                    {assignee.username}
                  </option>
                ))}
              </datalist>
              <span className="mt-1 block text-[10px] leading-4 text-muted">
                Active AMS users are loaded from the server directory.
              </span>
            </label>
            <div><label className="text-xs text-muted">Status</label><CustomSelect value={taskForm.status} onChange={value => setTaskForm({ ...taskForm, status: value as TaskStatus })} options={TASK_COLUMNS.map(item => ({ value: item.id, label: item.label }))} className="mt-1 w-full" /></div>
            <div><label className="text-xs text-muted">Priority</label><CustomSelect value={taskForm.priority} onChange={value => setTaskForm({ ...taskForm, priority: value as TaskPriority })} options={TASK_PRIORITIES} className="mt-1 w-full" /></div>
            <label className="text-xs text-muted">Due date<input required type="date" value={taskForm.dueDate} onChange={event => setTaskForm({ ...taskForm, dueDate: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted sm:col-span-2">Tags, comma separated<input value={taskForm.tags} onChange={event => setTaskForm({ ...taskForm, tags: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted sm:col-span-2">Description<textarea value={taskForm.description} onChange={event => setTaskForm({ ...taskForm, description: event.target.value })} className={fieldClass + ' min-h-24 py-2'} /></label>
            <label className="text-xs text-muted sm:col-span-2">Checklist, one item per line<textarea value={taskForm.subtasks} onChange={event => setTaskForm({ ...taskForm, subtasks: event.target.value })} className={fieldClass + ' min-h-24 py-2'} /></label>
          </div>
        </form>
      </Drawer>
    </div>
  );
};

export default AdminProjects;
