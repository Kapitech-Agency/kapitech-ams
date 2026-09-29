import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Code2,
  ExternalLink,
  GripVertical,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Users,
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
  const [projectLayout, setProjectLayout] = useState<ProjectLayout>(
    searchParams.get('layout') === 'table' ? 'table' : 'board'
  );
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);
  const [dragOverProjectStatus, setDragOverProjectStatus] = useState<ProjectStatus | null>(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('');
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
        setProjects(response.data.projects.length ? response.data.projects.map(normalizeProject) : demoProjects);
        setServerMode(true);
        setLoading(false);
        return;
      }
      setServerMode(false);
      setProjects(demoProjects);
      setError(response.error || 'Using demo project data because the project service is unavailable.');
    } catch (requestError) {
      setServerMode(false);
      setProjects(demoProjects);
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

  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    return projects.filter(project => {
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
      return matchesQuery && matchesStatus;
    });
  }, [projects, projectSearch, projectStatusFilter]);

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
        return matchesQuery && matchesPriority;
      })
      .sort((a, b) => {
        if (a.status !== b.status) return 0;
        return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      });
  }, [selectedSprintProject, taskSearch, taskPriorityFilter]);

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

  const openNewProject = () => {
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
      status: 'planning',
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
  const handleAddTask = () => {
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
      status: 'todo',
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

  const updateTaskStatus = async (task: ProjectTask, status: TaskStatus) => {
    if (!selectedSprintProject || task.status === status) return;
    try {
      const response = await api.tasks.update(task.id, { status });
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
              tasks: project.tasks.map(item => item.id === task.id ? { ...item, status } : item),
              updatedAt: new Date().toISOString(),
            }
          : project
      )
    );
  };

  const updateProjectStatus = async (project: ProjectRecord, status: ProjectStatus) => {
    if (!canManageProjects || project.status === status) return;

    const previousStatus = project.status;
    const updatedProject = { ...project, status, updatedAt: new Date().toISOString() };

    setProjects(current =>
      current.map(item => item.id === project.id ? normalizeProject(updatedProject) : item)
    );
    setDraggingProjectId(null);
    setDragOverProjectStatus(null);

    try {
      const response = await api.projects.update(project.id, { status });
      if (response.success) {
        await syncProjects();
        showToast(language === 'id' ? 'Status proyek diperbarui.' : 'Project status updated.');
        return;
      }
    } catch {
      // Fall through to demo mode.
    }

    setProjects(current =>
      current.map(item => item.id === project.id ? normalizeProject({ ...item, status: previousStatus }) : item)
    );
    showToast('Project status saved in demo mode.');
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
    : selectedProject || (selectedProjectSlug
      ? projects.find(project => project.slug === selectedProjectSlug) || null
      : null);

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
                ['Owner', selectedProjectDetail.teamLead || 'Unassigned'],
                ['Deadline', formatDate(selectedProjectDetail.targetEndDate)],
                ['Tasks', selectedProjectDetail.tasks.filter(task => task.status === 'done').length + '/' + selectedProjectDetail.tasks.length + ' done'],
                ['Service', selectedProjectDetail.serviceCategory || 'Delivery'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-control border border-line bg-bg p-3">
                  <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted">{label}</div>
                  <div className="mt-1.5 truncate text-xs font-semibold text-fg">{value}</div>
                </div>
              ))}
            </div>

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
              <div className="rounded-control border border-line bg-bg p-3"><div className="text-[10px] text-muted">Assignee</div><div className="mt-1.5 text-xs font-semibold text-fg">{selectedTask.assignedTo || 'Unassigned'}</div></div>
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
            description={serverMode ? 'Kanban project records with drag-and-drop status updates and slug-based navigation.' : 'Seeded slug data keeps the Kanban workspace fully testable without a connected project service.'}
            actions={(
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={projectSearch} onChange={event => setProjectSearch(event.target.value)} placeholder="Search projects or slug..." className={fieldClass + ' mt-0 pl-9'} />
                </div>
                <CustomSelect
                  value={projectStatusFilter}
                  onChange={setProjectStatusFilter}
                  options={[{ value: '', label: 'All statuses' }, ...PROJECT_STATUSES]}
                  className="w-40"
                />
              </div>
            )}
          >
            {loading ? (
              <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(item => <div key={item} className="h-40 animate-pulse rounded-card bg-bg" />)}
              </div>
            ) : projectLayout === 'board' ? (
              <div className="overflow-x-auto custom-scrollbar p-4 sm:p-5">
                <div className="grid min-w-[1380px] grid-cols-5 gap-3">
                  {PROJECT_KANBAN_COLUMNS.map(column => {
                    const items = filteredProjects.filter(project => project.status === column.id);
                    const isDropTarget = dragOverProjectStatus === column.id;

                    return (
                      <section
                        key={column.id}
                        aria-label={column.label + ' project column'}
                        onDragOver={event => {
                          if (!canManageProjects) return;
                          event.preventDefault();
                          event.dataTransfer.dropEffect = 'move';
                          setDragOverProjectStatus(column.id);
                        }}
                        onDragLeave={event => {
                          if (event.currentTarget === event.target) {
                            setDragOverProjectStatus(current => current === column.id ? null : current);
                          }
                        }}
                        onDrop={event => {
                          event.preventDefault();
                          if (!canManageProjects) return;
                          const projectId = event.dataTransfer.getData('text/project-id') || event.dataTransfer.getData('text/plain');
                          const project = projects.find(item => item.id === projectId);
                          if (project) void updateProjectStatus(project, column.id);
                        }}
                        className={'flex min-h-[560px] min-w-0 flex-col rounded-card border bg-bg p-3 transition-colors ' + (
                          isDropTarget ? 'border-accent/50 bg-accent/5' : 'border-line'
                        )}
                      >
                        <div className="mb-3 shrink-0 rounded-control border border-line bg-panel px-3 py-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={'h-2 w-2 shrink-0 rounded-full ' + column.dot} />
                                <span className="text-xs font-semibold text-fg">{column.label}</span>
                              </div>
                              <p className="mt-1 text-[10px] leading-4 text-muted">{column.description}</p>
                            </div>
                            <span className="rounded-control border border-line bg-bg px-2 py-1 text-[10px] font-medium tabular-nums text-muted">{items.length}</span>
                          </div>
                        </div>

                        <div className="min-h-0 flex-1 space-y-2.5">
                          {items.length === 0 ? (
                            <div className={'rounded-card border border-dashed p-5 text-center text-[11px] text-muted ' + (isDropTarget ? 'border-accent/40 bg-accent/5' : 'border-line')}>
                              {canManageProjects && isDropTarget ? 'Drop project here' : 'No projects in this stage.'}
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
                                  draggable={canManageProjects}
                                  onDragStart={event => {
                                    if (!canManageProjects) return;
                                    setDraggingProjectId(project.id);
                                    event.dataTransfer.effectAllowed = 'move';
                                    event.dataTransfer.setData('text/project-id', project.id);
                                    event.dataTransfer.setData('text/plain', project.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggingProjectId(null);
                                    setDragOverProjectStatus(null);
                                  }}
                                  className={'group cursor-grab rounded-card border border-line bg-panel p-4 shadow-sm transition-all hover:border-accent/40 active:cursor-grabbing ' + (
                                    isDragging ? 'scale-[0.98] opacity-50' : ''
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-start gap-2">
                                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted" title={canManageProjects ? 'Drag to change project status' : 'Project status'}>
                                        <GripVertical size={14} />
                                      </span>
                                      <button type="button" onClick={() => openProjectDetail(project)} className="min-w-0 text-left">
                                        <div className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-muted">{project.clientCompany}</div>
                                        <h3 className="mt-0.5 line-clamp-2 text-xs font-semibold leading-5 text-fg">{project.name}</h3>
                                      </button>
                                    </div>
                                    <button type="button" aria-label={'Actions for ' + project.name} onClick={() => openProjectDetail(project)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg">
                                      <MoreHorizontal size={15} />
                                    </button>
                                  </div>

                                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                    <span className={'rounded-badge border px-2 py-1 text-[10px] font-medium ' + healthClass(project.health)}>{project.health || 'Good'}</span>
                                    <span className="text-[10px] text-muted">{milestoneDone}/{project.milestones.length || 0} milestones</span>
                                    <span className="text-[10px] text-muted">•</span>
                                    <span className="text-[10px] text-muted">{taskDone}/{project.tasks.length} tasks</span>
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
                                        <div className="mt-0.5 truncate text-xs font-medium tabular-nums text-fg">
                                          {formatAmount(burn, currency)}
                                          <span className="text-muted"> / {formatAmount(project.budget, currency)}</span>
                                        </div>
                                      </div>
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-[10px] font-semibold text-fg" title={project.teamLead || 'Unassigned'}>
                                        {initials(project.teamLead || project.teamMembers[0] || 'NA')}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-3 flex items-center justify-between gap-2 text-[10px]">
                                    <span className="truncate text-muted">{project.slug}</span>
                                    <button type="button" onClick={() => goToSprint(project)} className="shrink-0 text-accent-text hover:text-accent">Delivery <ArrowUpRight size={11} className="inline" /></button>
                                  </div>
                                </article>
                              );
                            })
                          )}
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
                          <td className="text-xs text-fg">{project.teamLead || 'Unassigned'}</td>
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
            title="Sprint workspace"
            description="Select a project, filter tasks, then move work across the delivery stages."
            actions={(
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <CustomSelect
                  value={selectedSprintProject?.id || ''}
                  onChange={value => {
                    const project = projects.find(item => item.id === value);
                    const next = new URLSearchParams(searchParams);
                    if (project) next.set('project', project.slug);
                    setSearchParams(next, { replace: true });
                  }}
                  options={activeProjects.map(project => ({ value: project.id, label: project.name }))}
                  className="w-full sm:w-56"
                />
                {canManageKanbanTasks && (
                  <Button icon={<Plus size={14} />} onClick={handleAddTask}>New Task</Button>
                )}
              </div>
            )}
          >
            <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[1fr_180px_180px] sm:p-5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input value={taskSearch} onChange={event => setTaskSearch(event.target.value)} placeholder="Search tasks, owner, tags..." className={fieldClass + ' mt-0 pl-9'} />
              </div>
              <CustomSelect value={taskPriorityFilter} onChange={setTaskPriorityFilter} options={[{ value: '', label: 'All priorities' }, ...TASK_PRIORITIES]} className="w-full" />
              <span className="inline-flex min-h-9 items-center justify-center rounded-control border border-line bg-bg px-3 text-xs text-muted">{visibleTasks.length} tasks</span>
            </div>

            <div className="overflow-x-auto custom-scrollbar p-4 sm:p-5">
              <div className="grid min-w-[1080px] grid-cols-4 gap-3">
                {TASK_COLUMNS.map(column => {
                  const tasks = visibleTasks.filter(task => task.status === column.id);
                  return (
                    <div
                      key={column.id}
                      onDragOver={event => event.preventDefault()}
                      onDrop={event => {
                        const id = event.dataTransfer.getData('text/plain');
                        const task = selectedSprintProject?.tasks.find(item => item.id === id);
                        if (task) void updateTaskStatus(task, column.id);
                      }}
                      className="min-h-[460px] rounded-card border border-line bg-bg p-3"
                    >
                      <div className="mb-3 flex items-center justify-between rounded-control border border-line bg-panel px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={'h-2 w-2 rounded-full ' + column.tone} />
                          <span className="text-xs font-semibold text-fg">{column.label}</span>
                        </div>
                        <span className="rounded-control border border-line bg-bg px-2 py-1 text-[10px] tabular-nums text-muted">{tasks.length}</span>
                      </div>

                      <div className="space-y-2.5">
                        {tasks.length === 0 ? (
                          <div className="rounded-card border border-dashed border-line p-6 text-center text-[11px] text-muted">No tasks in this stage.</div>
                        ) : tasks.map(task => {
                          const doneSubtasks = (task.subtasks || []).filter(item => item.completed).length;
                          const overdue = task.status !== 'done' && isOverdue(task.dueDate);
                          return (
                            <article
                              key={task.id}
                              draggable={canManageKanbanTasks}
                              onDragStart={event => event.dataTransfer.setData('text/plain', task.id)}
                              className="group rounded-card border border-line bg-panel p-3 transition-colors hover:border-accent/40"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <GripVertical size={13} className="shrink-0 text-muted" />
                                  <span className={'rounded-badge border px-2 py-1 text-[10px] font-semibold ' + priorityClass(task.priority)}>{priorityLabel(task.priority)}</span>
                                </div>
                                <button type="button" onClick={() => { setSelectedTask(task); }} className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg" aria-label={'Task actions for ' + task.title}>
                                  <MoreHorizontal size={14} />
                                </button>
                              </div>
                              <button type="button" onClick={() => setSelectedTask(task)} className="mt-2 block w-full text-left">
                                <h3 className="text-xs font-semibold leading-5 text-fg">{task.title}</h3>
                                {task.description && <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">{task.description}</p>}
                              </button>

                              {(task.subtasks || []).length > 0 && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between text-[10px] text-muted"><span>Checklist</span><span>{doneSubtasks}/{(task.subtasks || []).length}</span></div>
                                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg">
                                    <div className="h-full rounded-full bg-success" style={{ width: ((doneSubtasks / (task.subtasks || []).length) * 100) + '%' }} />
                                  </div>
                                </div>
                              )}

                              <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[10px]">
                                <span className="flex min-w-0 items-center gap-1.5 text-muted">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-[9px] font-semibold text-fg">{initials(task.assignedTo)}</span>
                                  <span className="truncate">{task.assignedTo || 'Unassigned'}</span>
                                </span>
                                <span className={overdue ? 'text-danger font-semibold' : 'text-muted'}>{overdue ? 'Overdue' : formatDate(task.dueDate)}</span>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
        <AdminPanel title="Archived projects" description="Completed delivery records remain queryable and can still be opened from their slug.">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="ams-data-table min-w-[900px] text-left">
              <thead><tr><th>Project</th><th>Client</th><th>Completed</th><th>Budget</th><th>Owner</th><th>Slug</th><th>Actions</th></tr></thead>
              <tbody>
                {archivedProjects.map(project => (
                  <tr key={project.id}>
                    <td className="text-xs font-semibold text-fg">{project.name}</td>
                    <td className="text-xs text-muted">{project.clientCompany}</td>
                    <td className="text-xs text-fg">{formatDate(project.targetEndDate)}</td>
                    <td className="text-xs tabular-nums text-fg">{formatAmount(project.budget, currency)}</td>
                    <td className="text-xs text-fg">{project.teamLead || 'Unassigned'}</td>
                    <td className="text-[11px] text-muted">{project.slug}</td>
                    <td><div className="ams-table-actions"><button type="button" className="ams-table-action" onClick={() => openProjectDetail(project)}>View</button><button type="button" className="ams-table-action" data-primary="true" onClick={() => openEditProject(project)}>Edit</button></div></td>
                  </tr>
                ))}
                {archivedProjects.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-xs text-muted">No archived projects yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </AdminPanel>
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
