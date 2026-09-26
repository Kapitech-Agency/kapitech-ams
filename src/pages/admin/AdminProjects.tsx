import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Edit3,
  ExternalLink,
  FolderKanban,
  GripVertical,
  ListTodo,
  Plus,
  Search,
  ShieldAlert,
  Tag,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { AgencyProject, ProjectTask, ProjectStatus, TaskPriority, TaskStatus, TaskSubtask } from '../../lib/projectStore';
import { useLanguage } from '../../lib/LanguageContext';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { api } from '../../lib/apiClient';
import { getAdminSession, hasAdminPermission } from '../../lib/adminAuth';
import { formatAmount, getActiveCurrency, CURRENCY_EVENT, CurrencyCode } from '../../lib/currency';

type ProjectHealth = 'Good' | 'At Risk' | 'Delayed' | 'Blocked';
type ProjectRecord = AgencyProject & { health?: ProjectHealth; title?: string; client?: string };
type SortKey = 'name' | 'deadline' | 'progress' | 'updated';
type TaskSortKey = 'dueDate' | 'priority' | 'updated' | 'title';

const PROJECT_STATUSES: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
];

const TASK_COLUMNS: Array<{ id: TaskStatus; label: string }> = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
];

const TASK_PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const PRIORITY_ORDER: Record<TaskPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

const normalizeTask = (task: any): ProjectTask => ({
  id: String(task?.id || ''),
  title: String(task?.title || ''),
  description: task?.description ? String(task.description) : undefined,
  status: (['todo', 'in_progress', 'review', 'done'].includes(String(task?.status)) ? task.status : 'todo') as TaskStatus,
  priority: (['low', 'medium', 'high', 'urgent'].includes(String(task?.priority)) ? task.priority : 'medium') as TaskPriority,
  assignedTo: String(task?.assignedTo ?? task?.assignee ?? ''),
  dueDate: String(task?.dueDate || ''),
  createdAt: String(task?.createdAt || new Date().toISOString()),
  subtasks: Array.isArray(task?.subtasks) ? task.subtasks : undefined,
  tags: Array.isArray(task?.tags) ? task.tags : undefined,
});

const normalizeProject = (project: any): ProjectRecord => ({
  ...project,
  id: String(project?.id || ''),
  name: String(project?.name || project?.title || 'Untitled project'),
  clientName: String(project?.clientName || ''),
  clientCompany: String(project?.clientCompany || project?.client || ''),
  clientEmail: String(project?.clientEmail || ''),
  serviceCategory: String(project?.serviceCategory || ''),
  status: (PROJECT_STATUSES.some(item => item.value === project?.status) ? project.status : 'planning') as ProjectStatus,
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
  health: ['Good', 'At Risk', 'Delayed', 'Blocked'].includes(String(project?.health)) ? project.health : undefined,
});

const todayIso = () => new Date().toISOString().slice(0, 10);

const daysUntil = (date: string) => {
  if (!date) return null;
  const due = new Date(date + 'T23:59:59');
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / 86400000);
};

const isOverdue = (date: string) => {
  const days = daysUntil(date);
  return days !== null && days < 0;
};

const formatDate = (value: string) => {
  if (!value) return 'Not set';
  const parsed = new Date(value + (value.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusLabel = (status: ProjectStatus) => PROJECT_STATUSES.find(item => item.value === status)?.label || status;

const taskStatusLabel = (status: TaskStatus) => TASK_COLUMNS.find(item => item.id === status)?.label || status;

const priorityLabel = (priority: TaskPriority) => TASK_PRIORITIES.find(item => item.value === priority)?.label || priority;

const fieldClass = 'mt-1 w-full min-h-10 rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none transition-colors placeholder:text-muted focus:border-accent';

const projectHealthClass = (health?: ProjectHealth) => {
  if (health === 'Good') return 'text-success border-success/30 bg-success/10';
  if (health === 'At Risk') return 'text-warning border-warning/30 bg-warning/10';
  if (health === 'Delayed' || health === 'Blocked') return 'text-danger border-danger/30 bg-danger/10';
  return 'text-muted border-line bg-bg';
};

const projectStatusClass = (status: ProjectStatus) => {
  if (status === 'completed') return 'text-success border-success/30 bg-success/10';
  if (status === 'on_hold') return 'text-warning border-warning/30 bg-warning/10';
  if (status === 'review') return 'text-info border-info/30 bg-info/10';
  if (status === 'in_progress') return 'text-accent-text border-accent/30 bg-accent/10';
  return 'text-muted border-line bg-bg';
};

const taskPriorityClass = (priority: TaskPriority) => {
  if (priority === 'urgent') return 'text-danger border-danger/30 bg-danger/10';
  if (priority === 'high') return 'text-warning border-warning/30 bg-warning/10';
  if (priority === 'medium') return 'text-info border-info/30 bg-info/10';
  return 'text-muted border-line bg-bg';
};

export const AdminProjects: React.FC = () => {
  const { language } = useLanguage();
  const session = getAdminSession();
  const canManageProjects = hasAdminPermission('canManageProjects');
  const canManageKanbanTasks = hasAdminPermission('canManageKanbanTasks');
  const canDeleteProjects = session?.user?.role?.startsWith('Tier 1') || session?.user?.stakeholderType === 'Master';

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('');
  const [projectSort, setProjectSort] = useState<SortKey>('updated');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('');
  const [taskSort, setTaskSort] = useState<TaskSortKey>('dueDate');
  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteProject, setDeleteProject] = useState<ProjectRecord | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<ProjectTask | null>(null);
  const [taskDrawer, setTaskDrawer] = useState<ProjectTask | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
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

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
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
    window.setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const res = await api.projects.getAll();
    if (!res.success || !Array.isArray(res.data?.projects)) {
      setError(res.error || 'Unable to load projects.');
      setLoading(false);
      return;
    }
    const list = res.data.projects.map(normalizeProject);
    setProjects(list);
    setSelectedProjectId(current => current && list.some(project => project.id === current) ? current : (list[0]?.id || ''));
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
    if (canManageKanbanTasks) {
      void api.auth.getTaskAssignees().then(res => {
        if (!res.success || !res.data?.assignees) return;
        setTaskAssignees(res.data.assignees);
      });
    } else {
      setTaskAssignees([]);
    }
    const handleCurrency = (event: Event) => {
      const detail = (event as CustomEvent<{ currency?: CurrencyCode }>).detail;
      setCurrency(detail?.currency || getActiveCurrency());
    };
    window.addEventListener(CURRENCY_EVENT, handleCurrency);
    return () => window.removeEventListener(CURRENCY_EVENT, handleCurrency);
  }, []);

  const selectedProject = useMemo(
    () => projects.find(project => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const projectMetrics = useMemo(() => {
    const active = projects.filter(project => project.status === 'in_progress' || project.status === 'review').length;
    const onHold = projects.filter(project => project.status === 'on_hold').length;
    const completed = projects.filter(project => project.status === 'completed').length;
    const atRisk = projects.filter(project => project.health === 'At Risk' || project.health === 'Delayed' || project.health === 'Blocked').length;
    const overdueTasks = projects.flatMap(project => project.tasks || []).filter(task => task.status !== 'done' && isOverdue(task.dueDate)).length;
    const dueToday = projects.flatMap(project => project.tasks || []).filter(task => task.status !== 'done' && task.dueDate === todayIso()).length;
    return { total: projects.length, active, onHold, completed, atRisk, overdueTasks, dueToday };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    const result = projects.filter(project => {
      const matchesQuery = !query || [
        project.name,
        project.clientName,
        project.clientCompany,
        project.teamLead,
        project.serviceCategory,
        project.id,
      ].join(' ').toLowerCase().includes(query);
      const matchesStatus = !projectStatusFilter || project.status === projectStatusFilter;
      return matchesQuery && matchesStatus;
    });
    return result.sort((a, b) => {
      if (projectSort === 'name') return a.name.localeCompare(b.name);
      if (projectSort === 'deadline') return (a.targetEndDate || '').localeCompare(b.targetEndDate || '');
      if (projectSort === 'progress') return b.progressPercent - a.progressPercent;
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });
  }, [projects, projectSearch, projectStatusFilter, projectSort]);

  const allAssignees = useMemo(() => {
    const values = new Set<string>();
    projects.forEach(project => project.tasks.forEach(task => task.assignedTo && values.add(task.assignedTo)));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const visibleTasks = useMemo(() => {
    if (!selectedProject) return [];
    const query = taskSearch.trim().toLowerCase();
    const result = selectedProject.tasks.filter(task => {
      const matchesQuery = !query || [
        task.title,
        task.description || '',
        task.assignedTo,
        ...(task.tags || []),
      ].join(' ').toLowerCase().includes(query);
      const matchesStatus = !taskStatusFilter || task.status === taskStatusFilter;
      const matchesPriority = !taskPriorityFilter || task.priority === taskPriorityFilter;
      const matchesAssignee = !taskAssigneeFilter || task.assignedTo === taskAssigneeFilter;
      return matchesQuery && matchesStatus && matchesPriority && matchesAssignee;
    });
    return result.sort((a, b) => {
      if (taskSort === 'title') return a.title.localeCompare(b.title);
      if (taskSort === 'priority') return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      if (taskSort === 'updated') return (b.createdAt || '').localeCompare(a.createdAt || '');
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    });
  }, [selectedProject, taskSearch, taskStatusFilter, taskPriorityFilter, taskAssigneeFilter, taskSort]);

  const selectedProjectTaskStats = useMemo(() => {
    if (!selectedProject) return { total: 0, done: 0, open: 0, overdue: 0 };
    const total = selectedProject.tasks.length;
    const done = selectedProject.tasks.filter(task => task.status === 'done').length;
    const overdue = selectedProject.tasks.filter(task => task.status !== 'done' && isOverdue(task.dueDate)).length;
    return { total, done, open: total - done, overdue };
  }, [selectedProject]);

  const resetProjectForm = (project?: ProjectRecord) => {
    setEditingProject(project || null);
    setProjectForm({
      name: project?.name || '',
      clientName: project?.clientName || '',
      clientCompany: project?.clientCompany || '',
      clientEmail: project?.clientEmail || '',
      serviceCategory: project?.serviceCategory || '',
      budget: project ? String(project.budget || '') : '',
      progressPercent: project ? String(project.progressPercent ?? 0) : '0',
      startDate: project?.startDate || todayIso(),
      targetEndDate: project?.targetEndDate || todayIso(),
      teamLead: project?.teamLead || '',
      teamMembers: project?.teamMembers.join(', ') || '',
      techStack: project?.techStack.join(', ') || '',
      repositoryUrl: project?.repositoryUrl || '',
      figmaUrl: project?.figmaUrl || '',
      liveStagingUrl: project?.liveStagingUrl || '',
      notes: project?.notes || '',
      status: project?.status || 'planning',
      health: project?.health || 'Good',
    });
    setProjectModalOpen(true);
  };

  const saveProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageProjects) return;
    if (!projectForm.name.trim() || !projectForm.clientCompany.trim()) {
      showToast('Project name and client company are required.');
      return;
    }
    const budget = Number(projectForm.budget || 0);
    const progress = Number(projectForm.progressPercent || 0);
    if (!Number.isFinite(budget) || budget < 0 || !Number.isFinite(progress) || progress < 0 || progress > 100) {
      showToast('Enter a valid budget and progress value.');
      return;
    }

    setSaving(true);
    const payload: ProjectRecord = {
      ...(editingProject || {
        id: '',
        createdAt: '',
        updatedAt: '',
        tasks: [],
        milestones: [],
      } as ProjectRecord),
      name: projectForm.name.trim(),
      title: projectForm.name.trim(),
      clientName: projectForm.clientName.trim(),
      clientCompany: projectForm.clientCompany.trim(),
      clientEmail: projectForm.clientEmail.trim(),
      serviceCategory: projectForm.serviceCategory.trim(),
      status: projectForm.status,
      health: projectForm.health,
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
      milestones: editingProject?.milestones || [],
      tasks: editingProject?.tasks || [],
    };

    const res = editingProject
      ? await api.projects.update(editingProject.id, payload)
      : await api.projects.create(payload);

    setSaving(false);
    if (!res.success) {
      showToast(res.error || 'Project could not be saved.');
      return;
    }
    setProjectModalOpen(false);
    await loadData();
    const saved = normalizeProject(res.data?.project || payload);
    if (saved.id) setSelectedProjectId(saved.id);
    showToast(language === 'id' ? 'Proyek berhasil disimpan.' : 'Project saved.');
  };

  const openNewTask = () => {
    if (!selectedProject) {
      showToast('Select a project first.');
      return;
    }
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      projectId: selectedProject.id,
      assignee: '',
      priority: 'medium',
      status: 'todo',
      dueDate: todayIso(),
      tags: '',
      subtasks: '',
    });
    setTaskModalOpen(true);
  };

  const openEditTask = (task: ProjectTask) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      projectId: selectedProject?.id || '',
      assignee: task.assignedTo,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      tags: task.tags?.join(', ') || '',
      subtasks: task.subtasks?.map(item => item.title).join('\n') || '',
    });
    setTaskModalOpen(true);
  };

  const handleAddTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageKanbanTasks || !taskForm.title.trim()) return;
    const project = projects.find(item => item.id === taskForm.projectId);
    if (!project) {
      showToast('Select a valid project.');
      return;
    }
    if (!taskForm.assignee.trim()) {
      showToast('Assignee is required.');
      return;
    }

    setSaving(true);
    const subtasks = taskForm.subtasks
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean)
      .map((title, index) => ({
        id: editingTask?.subtasks?.[index]?.id || 'sub_' + Date.now() + '_' + index,
        title,
        completed: editingTask?.subtasks?.[index]?.completed || false,
      }));

    const payload = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      projectId: project.id,
      projectName: project.name,
      assignee: taskForm.assignee.trim(),
      priority: taskForm.priority,
      status: taskForm.status,
      dueDate: taskForm.dueDate,
      tags: taskForm.tags.split(',').map(item => item.trim()).filter(Boolean),
      subtasks,
      ...(editingTask ? { updatedAt: (editingTask as any).updatedAt } : {}),
    };

    const res = editingTask
      ? await api.tasks.update(editingTask.id, payload)
      : await api.tasks.create(payload);

    setSaving(false);
    if (!res.success) {
      showToast(res.error || 'Task could not be saved.');
      return;
    }

    setTaskModalOpen(false);
    setTaskDrawer(null);
    await loadData();
    showToast(language === 'id' ? 'Tugas berhasil disimpan.' : 'Task saved.');
  };

  const changeTaskStatus = async (task: ProjectTask, status: TaskStatus) => {
    if (!canManageKanbanTasks || task.status === status) return;
    const res = await api.tasks.update(task.id, { status, updatedAt: (task as any).updatedAt });
    if (!res.success) {
      showToast(res.error || 'Task status could not be updated.');
      return;
    }
    await loadData();
    showToast('Task moved to ' + taskStatusLabel(status) + '.');
  };

  const toggleSubtask = async (task: ProjectTask, subtask: TaskSubtask) => {
    if (!canManageKanbanTasks) return;
    const subtasks = (task.subtasks || []).map(item => item.id === subtask.id ? { ...item, completed: !item.completed } : item);
    const res = await api.tasks.update(task.id, { subtasks, updatedAt: (task as any).updatedAt });
    if (!res.success) {
      showToast(res.error || 'Checklist could not be updated.');
      return;
    }
    await loadData();
  };

  const confirmDeleteTask = async () => {
    if (!deleteTaskTarget || !canManageKanbanTasks) return;
    const res = await api.tasks.delete(deleteTaskTarget.id);
    if (!res.success) {
      showToast(res.error || 'Task could not be deleted.');
      setDeleteTaskTarget(null);
      return;
    }
    setDeleteTaskTarget(null);
    setTaskDrawer(null);
    await loadData();
    showToast('Task deleted.');
  };

  const deleteProjectConfirmed = async () => {
    if (!deleteProject || !canDeleteProjects) return;
    const res = await api.projects.delete(deleteProject.id);
    if (!res.success) {
      showToast(res.error || 'Project could not be deleted.');
      setDeleteProject(null);
      return;
    }
    setDeleteProject(null);
    await loadData();
    showToast('Project deleted.');
  };

  const onDropTask = async (event: React.DragEvent, status: TaskStatus) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);
    if (!taskId || !canManageKanbanTasks) return;
    const task = selectedProject?.tasks.find(item => item.id === taskId);
    if (task) await changeTaskStatus(task, status);
  };

  return (
    <div className="space-y-6">
      <Modal
        open={!!deleteProject}
        onClose={() => setDeleteProject(null)}
        size="sm"
        title={language === 'id' ? 'Hapus proyek?' : 'Delete project?'}
        description={deleteProject ? (language === 'id' ? 'Proyek ' + deleteProject.name + ' akan dihapus.' : 'Project ' + deleteProject.name + ' will be removed.') : undefined}
      >
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteProject(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => void deleteProjectConfirmed()} disabled={!canDeleteProjects}>Delete</Button>
        </div>
      </Modal>

      <Modal
        open={!!deleteTaskTarget}
        onClose={() => setDeleteTaskTarget(null)}
        size="sm"
        title="Delete task?"
        description={deleteTaskTarget ? 'Task "' + deleteTaskTarget.title + '" will be permanently removed.' : undefined}
      >
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTaskTarget(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => void confirmDeleteTask()} disabled={!canManageKanbanTasks}>Delete</Button>
        </div>
      </Modal>

      <header className="ams-dashboard-header mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Kapitech AMS</span>
            <span aria-hidden="true">/</span>
            <span className="text-fg">Projects &amp; Tasks</span>
          </div>
          <h1 className="mt-2 text-xl font-semibold leading-7 tracking-[-0.01em] text-fg">Projects &amp; Tasks</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
            {language === 'id' ? 'Pantau delivery proyek, pekerjaan terbuka, deadline, dan tanggung jawab tim.' : 'Track delivery, outstanding work, deadlines, and team ownership from one workspace.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {canManageKanbanTasks && <Button variant="secondary" icon={<ListTodo size={14} />} onClick={openNewTask}>New Task</Button>}
          {canManageProjects && <Button icon={<Plus size={14} />} onClick={() => resetProjectForm()}>New Project</Button>}
        </div>
      </header>

      {toast && (
        <div role="status" className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-control border border-line bg-panel px-4 py-3 text-xs text-fg">
          {toast}
        </div>
      )}

      {error && (
        <div className="rounded-card border border-danger/30 bg-danger/5 p-4 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={17} />
            <div>
              <p className="text-xs font-semibold text-fg">Unable to load Projects & Tasks</p>
              <p className="mt-1 text-xs text-muted">{error}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => void loadData()}>Retry</Button>
        </div>
      )}

      <section aria-label="Project operations summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Projects', value: projectMetrics.total, icon: Briefcase },
          { label: 'Active', value: projectMetrics.active, icon: Clock },
          { label: 'At Risk', value: projectMetrics.atRisk, icon: ShieldAlert },
          { label: 'Overdue Tasks', value: projectMetrics.overdueTasks, icon: AlertCircle },
        ].map(item => (
          <div key={item.label} className="rounded-card border border-line bg-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted">{item.label}</span>
              <item.icon size={15} className="text-muted" />
            </div>
            <div className="mt-2 text-[24px] leading-8 font-medium tabular-nums text-fg">{item.value}</div>
          </div>
        ))}
      </section>

      {(projectMetrics.overdueTasks > 0 || projectMetrics.dueToday > 0) && (
        <section className="rounded-card border border-line bg-panel p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-fg">Action required</h2>
              <p className="mt-1 text-xs text-muted">Focus on delivery items that need attention today.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {projectMetrics.overdueTasks > 0 && <span className="inline-flex items-center gap-1.5 rounded-control border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-xs text-danger"><AlertCircle size={13} />{projectMetrics.overdueTasks} overdue</span>}
              {projectMetrics.dueToday > 0 && <span className="inline-flex items-center gap-1.5 rounded-control border border-warning/30 bg-warning/10 px-2.5 py-1.5 text-xs text-warning"><Clock size={13} />{projectMetrics.dueToday} due today</span>}
            </div>
          </div>
        </section>
      )}



      <section className="rounded-card border border-line bg-panel">
        <div className="border-b border-line p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-fg">Projects</h2>
              <p className="mt-1 text-xs text-muted">Select a project to inspect its delivery state and task board.</p>
            </div>
            <div className="projects-filter-bar grid w-full min-w-0 grid-cols-1 items-center gap-2.5 sm:grid-cols-[minmax(240px,1fr)_168px_190px] xl:w-auto xl:min-w-[630px]">
              <label className="relative block min-w-0">
                <span className="sr-only">Search projects</span>
                <Search size={14} strokeWidth={1.8} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  value={projectSearch}
                  onChange={event => setProjectSearch(event.target.value)}
                  placeholder="Search projects..."
                  aria-label="Search projects"
                  className={fieldClass + ' mt-0 h-10 min-h-10 min-w-0 pl-9 pr-3 leading-5 sm:h-9 sm:min-h-9'}
                />
              </label>
              <CustomSelect
                value={projectStatusFilter}
                onChange={setProjectStatusFilter}
                options={[{ value: '', label: 'All statuses' }, ...PROJECT_STATUSES]}
                className="w-full min-w-0 h-10 sm:h-9"
                triggerClassName="h-10 min-h-10 w-full sm:h-9 sm:min-h-9"
                aria-label="Project status"
              />
              <CustomSelect
                value={projectSort}
                onChange={value => setProjectSort(value as SortKey)}
                options={[
                  { value: 'updated', label: 'Recently updated' },
                  { value: 'deadline', label: 'Deadline' },
                  { value: 'progress', label: 'Progress' },
                  { value: 'name', label: 'Name' },
                ]}
                className="w-full min-w-0 h-10 sm:h-9"
                triggerClassName="h-10 min-h-10 w-full whitespace-nowrap sm:h-9 sm:min-h-9"
                aria-label="Project sort"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-line">
            {[1, 2, 3].map(item => <div key={item} className="h-20 animate-pulse bg-panel" />)}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-8 text-center">
            <Briefcase className="mx-auto text-muted" size={22} />
            <p className="mt-3 text-sm font-semibold text-fg">{projects.length ? 'No matching projects' : 'No projects yet'}</p>
            <p className="mt-1 text-xs text-muted">{projects.length ? 'Try a different search or clear the filters.' : 'Create a project when a delivery record is ready.'}</p>
            {projects.length === 0 && canManageProjects && <Button className="mt-4" icon={<Plus size={14} />} onClick={() => resetProjectForm()}>New Project</Button>}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="ams-table w-full min-w-[920px] border-collapse text-left">
                <thead className="border-b border-line bg-bg">
                  <tr>
                    {['Project', 'Status', 'Progress', 'Owner', 'Deadline', 'Tasks', ''].map(label => <th key={label} className="px-4 py-3 text-[11px] font-semibold text-muted">{label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredProjects.map(project => {
                    const isSelected = project.id === selectedProjectId;
                    const overdue = project.tasks.filter(task => task.status !== 'done' && isOverdue(task.dueDate)).length;
                    return (
                      <tr key={project.id} className={isSelected ? 'bg-accent/10' : 'hover:bg-bg'}>
                        <td className="px-4 py-3">
                          <button className="min-w-0 text-left" onClick={() => setSelectedProjectId(project.id)}>
                            <div className="max-w-[280px] truncate text-xs font-semibold text-fg">{project.name}</div>
                            <div className="mt-1 max-w-[280px] truncate text-[11px] text-muted">{project.clientCompany || project.clientName || 'No client'}</div>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className={'inline-flex rounded-control border px-2 py-1 text-[11px] font-semibold ' + projectStatusClass(project.status)}>{statusLabel(project.status)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-36">
                            <div className="flex items-center justify-between text-[10px] text-muted"><span>Progress</span><span className="tabular-nums text-fg">{project.progressPercent}%</span></div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-accent" style={{ width: project.progressPercent + '%' }} /></div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-fg">{project.teamLead || 'Unassigned'}</td>
                        <td className="px-4 py-3">
                          <span className={isOverdue(project.targetEndDate) && project.status !== 'completed' ? 'text-danger' : 'text-fg'}>{formatDate(project.targetEndDate)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-xs tabular-nums"><span className="text-fg">{project.tasks.filter(task => task.status === 'done').length}/{project.tasks.length}</span>{overdue > 0 && <span className="text-danger">{overdue} overdue</span>}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button aria-label={'Open ' + project.name} onClick={() => setSelectedProjectId(project.id)} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg"><ChevronRight size={15} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-line md:hidden">
              {filteredProjects.map(project => {
                const overdue = project.tasks.filter(task => task.status !== 'done' && isOverdue(task.dueDate)).length;
                return (
                  <button key={project.id} onClick={() => setSelectedProjectId(project.id)} className="block w-full p-4 text-left hover:bg-bg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-fg">{project.name}</div>
                        <div className="mt-1 truncate text-xs text-muted">{project.clientCompany || 'No client'}</div>
                      </div>
                      <ChevronRight size={16} className="mt-1 shrink-0 text-muted" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={'rounded-badge border px-2 py-1 text-[10px] font-semibold ' + projectStatusClass(project.status)}>{statusLabel(project.status)}</span>
                      {project.health && <span className={'rounded-badge border px-2 py-1 text-[10px] font-semibold ' + projectHealthClass(project.health)}>{project.health}</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-[11px] text-muted">
                      <span>{project.progressPercent}% complete</span>
                      <span>{project.tasks.filter(task => task.status === 'done').length}/{project.tasks.length} tasks</span>
                      {overdue > 0 && <span className="text-danger">{overdue} overdue</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      {selectedProject && (
        <>
          {/* Task Execution Board */}
          <section className="rounded-card border border-line bg-panel">
            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={'rounded-control border px-2 py-1 text-[11px] font-semibold ' + projectStatusClass(selectedProject.status)}>{statusLabel(selectedProject.status)}</span>
                    {selectedProject.health && <span className={'rounded-control border px-2 py-1 text-[11px] font-semibold ' + projectHealthClass(selectedProject.health)}>{selectedProject.health}</span>}
                    <span className="text-[11px] text-muted">{selectedProject.serviceCategory || 'Delivery project'}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold tracking-[-0.01em] text-fg">{selectedProject.name}</h2>
                  <p className="mt-1 text-xs text-muted">{selectedProject.clientCompany || selectedProject.clientName || 'No client'}{selectedProject.clientName ? ' · ' + selectedProject.clientName : ''}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.repositoryUrl && <a href={selectedProject.repositoryUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-control border border-line bg-panel px-3 text-xs text-fg hover:bg-bg"><Code2 size={14} />Repository</a>}
                  {selectedProject.liveStagingUrl && <a href={selectedProject.liveStagingUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-control border border-line bg-panel px-3 text-xs text-fg hover:bg-bg"><ExternalLink size={14} />Staging</a>}
                  {canManageProjects && <Button variant="secondary" icon={<Edit3 size={14} />} onClick={() => resetProjectForm(selectedProject)}>Edit</Button>}
                  {canDeleteProjects && <Button variant="destructive" icon={<Trash2 size={14} />} onClick={() => setDeleteProject(selectedProject)}>Delete</Button>}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  { label: 'Progress', value: selectedProject.progressPercent + '%', icon: TrendingIcon },
                  { label: 'Owner', value: selectedProject.teamLead || 'Unassigned', icon: User },
                  { label: 'Deadline', value: formatDate(selectedProject.targetEndDate), icon: Calendar },
                  { label: 'Tasks', value: selectedProjectTaskStats.done + '/' + selectedProjectTaskStats.total + ' done', icon: ListTodo },
                  { label: 'Budget', value: formatAmount(selectedProject.budget, currency), icon: Briefcase },
                ].map(item => (
                  <div key={item.label} className="rounded-control border border-line bg-bg p-3">
                    <div className="flex items-center gap-2 text-[11px] text-muted"><item.icon size={13} />{item.label}</div>
                    <div className="mt-2 truncate text-xs font-semibold text-fg tabular-nums">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px] text-muted"><span>Project progress</span><span className="tabular-nums text-fg">{selectedProject.progressPercent}%</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-accent" style={{ width: selectedProject.progressPercent + '%' }} /></div>
              </div>

              {(selectedProject.notes || selectedProject.techStack.length || selectedProject.teamMembers.length) && (
                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  {selectedProject.notes && <div className="lg:col-span-2"><div className="text-[11px] font-semibold text-muted">Project notes</div><p className="mt-2 text-xs leading-5 text-fg">{selectedProject.notes}</p></div>}
                  <div className="space-y-3">
                    {selectedProject.teamMembers.length > 0 && <div><div className="flex items-center gap-2 text-[11px] font-semibold text-muted"><Users size={13} />Team</div><div className="mt-2 flex flex-wrap gap-1.5">{selectedProject.teamMembers.map(member => <span key={member} className="rounded-control border border-line bg-bg px-2 py-1 text-[10px] text-fg">{member}</span>)}</div></div>}
                    {selectedProject.techStack.length > 0 && <div><div className="flex items-center gap-2 text-[11px] font-semibold text-muted"><Tag size={13} />Stack</div><div className="mt-2 flex flex-wrap gap-1.5">{selectedProject.techStack.map(item => <span key={item} className="rounded-control border border-line bg-bg px-2 py-1 text-[10px] text-muted">{item}</span>)}</div></div>}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-card border border-line bg-panel">
            <div className="border-b border-line p-4 sm:p-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-2"><ListTodo size={16} className="text-accent-text" /><h2 className="text-sm font-semibold text-fg">Tasks</h2></div>
                  <p className="mt-1 text-xs text-muted">{selectedProjectTaskStats.open} open · {selectedProjectTaskStats.done} done · {selectedProjectTaskStats.overdue} overdue</p>
                </div>
                <div className="flex flex-col gap-2 lg:flex-row">
                  <div className="relative min-w-0 lg:w-60">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input value={taskSearch} onChange={event => setTaskSearch(event.target.value)} placeholder="Search tasks..." aria-label="Search tasks" className={fieldClass + ' pl-8'} />
                  </div>
                  <CustomSelect value={taskStatusFilter} onChange={setTaskStatusFilter} options={[{ value: '', label: 'All statuses' }, ...TASK_COLUMNS.map(item => ({ value: item.id, label: item.label }))]} className="w-full lg:w-36" />
                  <CustomSelect value={taskPriorityFilter} onChange={setTaskPriorityFilter} options={[{ value: '', label: 'All priorities' }, ...TASK_PRIORITIES]} className="w-full lg:w-36" />
                  <CustomSelect value={taskAssigneeFilter} onChange={setTaskAssigneeFilter} options={[{ value: '', label: 'All assignees' }, ...allAssignees.map(value => ({ value, label: value }))]} className="w-full lg:w-40" />
                  <CustomSelect value={taskSort} onChange={value => setTaskSort(value as TaskSortKey)} options={[{ value: 'dueDate', label: 'Due date' }, { value: 'priority', label: 'Priority' }, { value: 'updated', label: 'Recent' }, { value: 'title', label: 'Title' }]} className="w-full lg:w-32" />
                  {canManageKanbanTasks && (
                    <Button icon={<Plus size={14} />} onClick={openNewTask}>New Task</Button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto p-4 sm:p-5">
              <div className="flex min-w-max gap-3 pb-1">
                {TASK_COLUMNS.map(column => {
                  const tasks = visibleTasks.filter(task => task.status === column.id);
                  return (
                    <div key={column.id} onDragOver={event => event.preventDefault()} onDrop={event => void onDropTask(event, column.id)} className="w-[280px] rounded-card border border-line bg-bg p-3 sm:w-[300px]">
                      <div className="flex items-center justify-between border-b border-line pb-3">
                        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-muted" /><span className="text-xs font-semibold text-fg">{column.label}</span></div>
                        <span className="rounded-control border border-line bg-panel px-2 py-1 text-[10px] tabular-nums text-muted">{tasks.length}</span>
                      </div>
                      <div className="mt-3 space-y-2.5">
                        {tasks.length === 0 ? (
                          <div className="flex min-h-28 items-center justify-center rounded-control border border-dashed border-line px-3 text-center text-[11px] text-muted">No tasks in this stage.</div>
                        ) : tasks.map(task => {
                          const subtasks = task.subtasks || [];
                          const doneSubtasks = subtasks.filter(item => item.completed).length;
                          const overdue = task.status !== 'done' && isOverdue(task.dueDate);
                          return (
                            <article key={task.id} draggable={canManageKanbanTasks} onDragStart={event => { event.dataTransfer.setData('text/plain', task.id); setDraggedTaskId(task.id); }} onClick={() => setTaskDrawer(task)} className={'group rounded-card border bg-panel p-3 transition-colors ' + (draggedTaskId === task.id ? 'border-accent opacity-50' : 'border-line hover:border-accent/50')}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  {canManageKanbanTasks && <GripVertical size={13} className="shrink-0 text-muted" aria-label="Draggable task" />}
                                  <span className={'rounded-badge border px-2 py-1 text-[10px] font-semibold ' + taskPriorityClass(task.priority)}>{priorityLabel(task.priority)}</span>
                                </div>
                                <button aria-label={'Task actions for ' + task.title} onClick={event => { event.stopPropagation(); openEditTask(task); }} className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-control text-muted opacity-0 transition-opacity hover:bg-bg hover:text-fg group-hover:opacity-100 focus:opacity-100"><Edit3 size={13} /></button>
                              </div>
                              <h3 className="mt-2 text-xs font-semibold leading-5 text-fg">{task.title}</h3>
                              {task.description && <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">{task.description}</p>}
                              {subtasks.length > 0 && <div className="mt-3"><div className="flex items-center justify-between text-[10px] text-muted"><span>Checklist</span><span className="tabular-nums">{doneSubtasks}/{subtasks.length}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-success" style={{ width: ((doneSubtasks / subtasks.length) * 100) + '%' }} /></div></div>}
                              <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[10px]">
                                <span className="flex min-w-0 items-center gap-1.5 text-muted"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-[9px] font-semibold text-fg">{task.assignedTo.charAt(0) || '?'}</span><span className="truncate">{task.assignedTo || 'Unassigned'}</span></span>
                                <span className={overdue ? 'shrink-0 font-semibold text-danger' : 'shrink-0 text-muted'}>{overdue ? 'Overdue' : formatDate(task.dueDate)}</span>
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
          </section>
        </>
      )}

      {!selectedProject && !loading && projects.length > 0 && (
        <div className="rounded-card border border-dashed border-line bg-panel p-8 text-center">
          <FolderKanban className="mx-auto text-muted" size={22} />
          <p className="mt-3 text-sm font-semibold text-fg">Select a project</p>
          <p className="mt-1 text-xs text-muted">Choose a project above to open its delivery workspace.</p>
        </div>
      )}

      {/* CONTEXTUAL TASK DETAIL DRAWER */}
      {taskDrawer && selectedProject && (
        <Modal
          open={!!taskDrawer}
          onClose={() => setTaskDrawer(null)}
          size="lg"
          title={taskDrawer.title}
          description="Task details"
        >

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="flex flex-wrap gap-2">
                <span className={'rounded-badge border px-2 py-1 text-[10px] font-semibold ' + taskPriorityClass(taskDrawer.priority)}>{priorityLabel(taskDrawer.priority)}</span>
                <span className="rounded-control border border-line bg-bg px-2 py-1 text-[10px] text-muted">{formatDate(taskDrawer.dueDate)}</span>
              </div>

              <div className="mt-5">
                <div className="text-[11px] font-semibold text-muted">Status</div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TASK_COLUMNS.map(column => <button key={column.id} disabled={!canManageKanbanTasks} onClick={() => void changeTaskStatus(taskDrawer, column.id)} className={'min-h-10 rounded-control border px-2 text-[11px] font-semibold transition-colors ' + (taskDrawer.status === column.id ? 'border-accent bg-accent text-white' : 'border-line bg-bg text-muted hover:text-fg')}>{column.label}</button>)}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-control border border-line bg-bg p-3"><div className="text-[10px] text-muted">Assignee</div><div className="mt-1 flex items-center gap-2 text-xs font-semibold text-fg"><User size={13} />{taskDrawer.assignedTo || 'Unassigned'}</div></div>
                <div className="rounded-control border border-line bg-bg p-3"><div className="text-[10px] text-muted">Due date</div><div className="mt-1 flex items-center gap-2 text-xs font-semibold text-fg"><Calendar size={13} />{formatDate(taskDrawer.dueDate)}</div></div>
              </div>

              <div className="mt-5">
                <div className="text-[11px] font-semibold text-muted">Description</div>
                <div className="mt-2 rounded-card border border-line bg-bg p-3 text-xs leading-5 text-fg">{taskDrawer.description || 'No description provided.'}</div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between"><div className="text-[11px] font-semibold text-muted">Checklist</div><span className="text-[10px] text-muted">{(taskDrawer.subtasks || []).filter(item => item.completed).length}/{(taskDrawer.subtasks || []).length}</span></div>
                <div className="mt-2 space-y-2">
                  {(taskDrawer.subtasks || []).length === 0 ? <div className="rounded-control border border-dashed border-line p-3 text-xs text-muted">No checklist items.</div> : (taskDrawer.subtasks || []).map(item => (
                    <button key={item.id} disabled={!canManageKanbanTasks} onClick={() => void toggleSubtask(taskDrawer, item)} className="flex w-full items-center gap-2.5 rounded-control border border-line bg-bg p-3 text-left">
                      {item.completed ? <CheckCircle2 size={16} className="shrink-0 text-success" /> : <span className="h-4 w-4 shrink-0 rounded border border-muted" />}
                      <span className={'text-xs ' + (item.completed ? 'text-muted line-through' : 'text-fg')}>{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(taskDrawer.tags || []).length > 0 && <div className="mt-5"><div className="text-[11px] font-semibold text-muted">Tags</div><div className="mt-2 flex flex-wrap gap-1.5">{taskDrawer.tags?.map(tag => <span key={tag} className="rounded-control border border-line bg-bg px-2 py-1 text-[10px] text-muted">{tag}</span>)}</div></div>}
            </div>
            <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-line bg-panel px-4 py-3 sm:px-5">
              <Button variant="destructive" icon={<Trash2 size={13} />} onClick={() => setDeleteTaskTarget(taskDrawer)} disabled={!canManageKanbanTasks}>Delete</Button>
              <div className="flex gap-2"><Button variant="secondary" onClick={() => setTaskDrawer(null)}>Close</Button>{canManageKanbanTasks && <Button icon={<Edit3 size={13} />} onClick={() => openEditTask(taskDrawer)}>Edit task</Button>}</div>
            </footer>
        </Modal>
      )}

      <Modal open={projectModalOpen} onClose={() => !saving && setProjectModalOpen(false)} size="xl" title={editingProject ? 'Edit project' : 'New project'} description="Keep project information aligned with the delivery record.">
        <form onSubmit={saveProject} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-muted">Project name<input value={projectForm.name} onChange={event => setProjectForm({ ...projectForm, name: event.target.value })} className={fieldClass} required /></label>
            <label className="text-xs text-muted">Client company<input value={projectForm.clientCompany} onChange={event => setProjectForm({ ...projectForm, clientCompany: event.target.value })} className={fieldClass} required /></label>
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
          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setProjectModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingProject ? 'Save changes' : 'Create project'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={taskModalOpen} onClose={() => !saving && setTaskModalOpen(false)} size="xl" title={editingTask ? 'Edit task' : 'New task'} description="Update the task record used by the project execution board.">
        <form onSubmit={handleAddTask} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-muted sm:col-span-2">Task title<input value={taskForm.title} onChange={event => setTaskForm({ ...taskForm, title: event.target.value })} className={fieldClass} required /></label>
            <div><label className="text-xs text-muted">Project</label><CustomSelect value={taskForm.projectId} onChange={value => setTaskForm({ ...taskForm, projectId: value })} options={projects.map(project => ({ value: project.id, label: project.name }))} className="mt-1 w-full" /></div>
            <div>
              <label className="text-xs text-muted">Assignee</label>
              <CustomSelect
                value={taskForm.assignee}
                onChange={value => setTaskForm({ ...taskForm, assignee: value })}
                options={taskAssignees.map(assignee => ({ value: assignee.username, label: assignee.name + ' · ' + assignee.username }))}
                className="mt-1 w-full"
              />
            </div>
            <div><label className="text-xs text-muted">Status</label><CustomSelect value={taskForm.status} onChange={value => setTaskForm({ ...taskForm, status: value as TaskStatus })} options={TASK_COLUMNS.map(item => ({ value: item.id, label: item.label }))} className="mt-1 w-full" /></div>
            <div><label className="text-xs text-muted">Priority</label><CustomSelect value={taskForm.priority} onChange={value => setTaskForm({ ...taskForm, priority: value as TaskPriority })} options={TASK_PRIORITIES} className="mt-1 w-full" /></div>
            <label className="text-xs text-muted">Due date<input type="date" value={taskForm.dueDate} onChange={event => setTaskForm({ ...taskForm, dueDate: event.target.value })} className={fieldClass} required /></label>
            <label className="text-xs text-muted">Tags, comma separated<input value={taskForm.tags} onChange={event => setTaskForm({ ...taskForm, tags: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted sm:col-span-2">Description<textarea value={taskForm.description} onChange={event => setTaskForm({ ...taskForm, description: event.target.value })} className={fieldClass + ' min-h-24 py-2'} /></label>
            <label className="text-xs text-muted sm:col-span-2">Checklist, one item per line<textarea value={taskForm.subtasks} onChange={event => setTaskForm({ ...taskForm, subtasks: event.target.value })} className={fieldClass + ' min-h-24 py-2'} /></label>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setTaskModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingTask ? 'Save changes' : 'Create task'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const TrendingIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </svg>
);

export default AdminProjects;
