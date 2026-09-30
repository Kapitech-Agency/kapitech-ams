import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Eye,
  FolderKanban,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
} from 'lucide-react';
import { AdminMetricStrip, AdminPanel } from './AdminModulePrimitives';
import { CustomSelect } from '../ui/CustomSelect';
import { Modal } from '../ui/Modal';
import { ProfileIdentity } from './ProfileIdentity';
import Button from '../ui/Button';
import { api } from '../../lib/apiClient';
import { getAdminSession, hasAdminPermission } from '../../lib/adminAuth';

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

type TaskRecord = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  projectSlug: string;
  clientName: string;
  assigneeId: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  tags: string[];
  blocked: boolean;
  slug: string;
  createdAt: string;
};

const fallbackTasks: TaskRecord[] = [
  {
    id: 'task-001',
    title: 'Approve homepage copy',
    description: 'Final content approval before client handoff.',
    projectId: 'proj-001',
    projectName: 'Atlas Brand System',
    projectSlug: 'atlas-brand-system',
    clientName: 'Atlas Group',
    assigneeId: '',
    assignee: 'Fikri',
    priority: 'high',
    status: 'todo',
    dueDate: new Date().toISOString().slice(0, 10),
    tags: ['content'],
    blocked: false,
    slug: 'task-approve-homepage-copy-task-001',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-002',
    title: 'Finalize checkout UI',
    description: 'Finish the checkout flow and responsive states.',
    projectId: 'proj-002',
    projectName: 'Meridian Commerce',
    projectSlug: 'meridian-commerce',
    clientName: 'Meridian Labs',
    assigneeId: '',
    assignee: 'Sarah',
    priority: 'high',
    status: 'in_progress',
    dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    tags: ['frontend'],
    blocked: false,
    slug: 'task-finalize-checkout-ui-task-002',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-003',
    title: 'QA campaign landing page',
    description: 'Run final QA against approved campaign layouts.',
    projectId: 'proj-003',
    projectName: 'Nova Growth Retainer',
    projectSlug: 'nova-growth-retainer',
    clientName: 'Nova Ventures',
    assigneeId: '',
    assignee: 'Dimas',
    priority: 'medium',
    status: 'review',
    dueDate: new Date(Date.now() + 172800000).toISOString().slice(0, 10),
    tags: ['qa'],
    blocked: false,
    slug: 'task-qa-campaign-landing-page-task-003',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-004',
    title: 'Resolve API handoff',
    description: 'Waiting for the final API contract confirmation.',
    projectId: 'proj-004',
    projectName: 'Orbit Product Launch',
    projectSlug: 'orbit-product-launch',
    clientName: 'Orbit Health',
    assigneeId: '',
    assignee: 'Raka',
    priority: 'urgent',
    status: 'in_progress',
    dueDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    tags: ['blocked', 'api'],
    blocked: true,
    slug: 'task-resolve-api-handoff-task-004',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-005',
    title: 'Prepare client presentation',
    description: 'Prepare delivery deck for the next client checkpoint.',
    projectId: 'proj-005',
    projectName: 'Northstar Campaign',
    projectSlug: 'northstar-campaign',
    clientName: 'Northstar Capital',
    assigneeId: '',
    assignee: 'Nadia',
    priority: 'medium',
    status: 'in_progress',
    dueDate: new Date(Date.now() + 259200000).toISOString().slice(0, 10),
    tags: ['client'],
    blocked: false,
    slug: 'task-prepare-client-presentation-task-005',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-006',
    title: 'Review analytics dashboard',
    description: 'Review the latest dashboard metrics and document findings.',
    projectId: 'proj-001',
    projectName: 'Atlas Brand System',
    projectSlug: 'atlas-brand-system',
    clientName: 'Atlas Group',
    assigneeId: '',
    assignee: 'Fikri',
    priority: 'low',
    status: 'done',
    dueDate: new Date().toISOString().slice(0, 10),
    tags: ['analytics'],
    blocked: false,
    slug: 'task-review-analytics-dashboard-task-006',
    createdAt: new Date().toISOString(),
  },
];

const taskStatusLabel: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const taskPriorityLabel: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const taskPriorityClass: Record<TaskPriority, string> = {
  low: 'border-line bg-bg text-muted',
  medium: 'border-info/25 bg-info/10 text-info',
  high: 'border-warning/25 bg-warning/10 text-warning',
  urgent: 'border-danger/25 bg-danger/10 text-danger',
};

const taskStatusClass: Record<TaskStatus, string> = {
  todo: 'border-info/25 bg-info/10 text-info',
  in_progress: 'border-accent/25 bg-accent/10 text-accent-text',
  review: 'border-warning/25 bg-warning/10 text-warning',
  done: 'border-success/25 bg-success/10 text-success',
};

const slugify = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';

const formatTaskDue = (value: string) => {
  if (!value) return 'No due date';
  const parsed = new Date(value + (value.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const taskDueState = (task: TaskRecord) => {
  if (task.status === 'done') return 'completed';
  if (!task.dueDate) return 'none';
  const due = new Date(task.dueDate + 'T23:59:59');
  const days = Math.ceil((due.getTime() - Date.now()) / 86400000);
  if (days < 0) return 'overdue';
  if (days <= 2) return 'due-soon';
  if (days <= 7) return 'this-week';
  return 'scheduled';
};

const isTaskBlocked = (task: any) =>
  Boolean(task?.blocked) ||
  (Array.isArray(task?.tags) && task.tags.some((tag: unknown) =>
    ['blocked', 'blocker', 'blocked-by', 'waiting'].includes(String(tag).trim().toLowerCase())
  ));

export const TasksWorkspace: React.FC = () => {
  const [searchParams] = useSearchParams();
  const taskScope = searchParams.get('taskscope') || 'all';
  const currentUser = getAdminSession()?.user;
  const canManageTasks = hasAdminPermission('canManageKanbanTasks');

  const [records, setRecords] = useState<TaskRecord[]>([]);
  const [assignees, setAssignees] = useState<Array<{ id: string; name: string; username: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [layout, setLayout] = useState<'table' | 'board'>('table');
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    projectId: '',
    assignee: '',
    priority: 'medium' as TaskPriority,
    dueDate: new Date().toISOString().slice(0, 10),
  });

  const currentUserNames = useMemo(() => new Set(
    [currentUser?.profileDisplayName, currentUser?.name, currentUser?.username]
      .filter(Boolean)
      .map(value => String(value).trim().toLowerCase())
  ), [currentUser]);

  useEffect(() => {
    let mounted = true;
    const loadTasks = async () => {
      setLoading(true);
      try {
        const [projectRes, assigneeRes] = await Promise.all([
          api.projects.getAll(),
          api.auth.getTaskAssignees(),
        ]);

        const assigneeMap = new Map<string, { id: string; name: string; username: string }>();
        if (assigneeRes.success && Array.isArray(assigneeRes.data?.assignees)) {
          const normalizedAssignees = assigneeRes.data.assignees.map((item: any) => ({
            id: String(item?.id || ''),
            name: String(item?.name || item?.username || ''),
            username: String(item?.username || ''),
          }));
          normalizedAssignees.forEach(item => {
            assigneeMap.set(item.id, item);
            assigneeMap.set(item.username, item);
            assigneeMap.set(item.name, item);
          });
          if (mounted) setAssignees(normalizedAssignees);
        }

        if (projectRes.success && Array.isArray(projectRes.data?.projects)) {
          const normalized: TaskRecord[] = [];
          projectRes.data.projects.forEach((project: any) => {
            const projectId = String(project?.id || '');
            const projectName = String(project?.name || project?.title || 'Untitled project');
            const clientName = String(project?.clientCompany || project?.clientName || '');
            const tasks = Array.isArray(project?.tasks) ? project.tasks : [];

            tasks.forEach((task: any) => {
              const id = String(task?.id || '');
              const assignedTo = String(task?.assignedTo ?? task?.assignee ?? '');
              const resolved = assigneeMap.get(assignedTo);
              const title = String(task?.title || 'Untitled task');
              normalized.push({
                id,
                title,
                description: String(task?.description || ''),
                projectId,
                projectName,
                projectSlug: slugify(projectName),
                clientName,
                assigneeId: resolved?.id || assignedTo,
                assignee: resolved?.name || assignedTo || 'Unassigned',
                priority: ['low', 'medium', 'high', 'urgent'].includes(String(task?.priority)) ? task.priority : 'medium',
                status: ['todo', 'in_progress', 'review', 'done'].includes(String(task?.status)) ? task.status : 'todo',
                dueDate: String(task?.dueDate || ''),
                tags: Array.isArray(task?.tags) ? task.tags.map(String) : [],
                blocked: isTaskBlocked(task),
                slug: 'task-' + slugify(title) + '-' + slugify(id),
                createdAt: String(task?.createdAt || ''),
              });
            });
          });

          if (mounted) {
            setRecords(normalized.length ? normalized : fallbackTasks);
            setNotice(normalized.length ? null : 'No server tasks were returned. Frontend preview tasks are active for the workspace.');
          }
        } else if (mounted) {
          setRecords(fallbackTasks);
          setNotice('Task service is unavailable. Frontend preview tasks are active for the workspace.');
        }
      } catch {
        if (mounted) {
          setRecords(fallbackTasks);
          setNotice('Task service is unavailable. Frontend preview tasks are active for the workspace.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadTasks();
    return () => { mounted = false; };
  }, []);

  const updateTaskStatus = async (task: TaskRecord, nextStatus: TaskStatus) => {
    if (task.status === nextStatus || updatingTaskId === task.id) return;
    setUpdatingTaskId(task.id);
    setRecords(current => current.map(item => item.id === task.id ? {
      ...item,
      status: nextStatus,
      blocked: nextStatus === 'done' ? false : item.blocked,
    } : item));

    try {
      const response = await api.tasks.update(task.id, { status: nextStatus });
      setNotice(response.success ? 'Task status updated.' : 'Task status updated locally for this session.');
    } catch {
      setNotice('Task status updated locally for this session.');
    } finally {
      setUpdatingTaskId(null);
      setSelectedTask(current => current?.id === task.id ? { ...current, status: nextStatus, blocked: nextStatus === 'done' ? false : current.blocked } : current);
    }
  };

  const projectOptions = useMemo(
    () => Array.from(new Map(records.map(task => [task.projectId, task.projectName])).entries()).sort((a, b) => a[1].localeCompare(b[1])),
    [records]
  );

  const openNewTask = () => {
    if (!canManageTasks) return;
    setTaskForm({
      title: '',
      description: '',
      projectId: projectOptions[0]?.[0] || '',
      assignee: '',
      priority: 'medium',
      dueDate: new Date().toISOString().slice(0, 10),
    });
    setTaskFormOpen(true);
  };

  const saveNewTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!taskForm.title.trim() || !taskForm.projectId) {
      setNotice('Task title and project are required.');
      return;
    }

    const project = projectOptions.find(([id]) => id === taskForm.projectId);
    if (!project) {
      setNotice('Selected project is not available.');
      return;
    }

    setSavingTask(true);
    const id = 'task-' + slugify(taskForm.title) + '-' + Date.now();
    const localTask: TaskRecord = {
      id,
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      projectId: project[0],
      projectName: project[1],
      projectSlug: slugify(project[1]),
      clientName: '',
      assigneeId: taskForm.assignee,
      assignee: assignees.find(item => item.id === taskForm.assignee)?.name || taskForm.assignee || 'Unassigned',
      priority: taskForm.priority,
      status: 'todo',
      dueDate: taskForm.dueDate,
      tags: [],
      blocked: false,
      slug: 'task-' + slugify(taskForm.title) + '-' + slugify(id),
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await api.tasks.create({
        title: localTask.title,
        description: localTask.description,
        projectId: localTask.projectId,
        projectName: localTask.projectName,
        assignee: localTask.assigneeId,
        priority: localTask.priority,
        status: localTask.status,
        dueDate: localTask.dueDate,
        tags: [],
        subtasks: [],
      });

      setRecords(current => [localTask, ...current]);
      setNotice(response.success ? 'Task created.' : 'Task created locally for this session.');
      setTaskFormOpen(false);
    } catch {
      setRecords(current => [localTask, ...current]);
      setNotice('Task created locally for this session.');
      setTaskFormOpen(false);
    } finally {
      setSavingTask(false);
    }
  };

  const currentScopeLabel: Record<string, string> = {
    all: 'All Tasks',
    my: 'My Tasks',
    due: 'Due & Overdue',
    review: 'Review Queue',
    blocked: 'Blocked',
    completed: 'Completed',
  };

  const scopedRecords = useMemo(() => records.filter(task => {
    if (taskScope === 'my') {
      return currentUserNames.has(task.assignee.trim().toLowerCase()) ||
        currentUserNames.has(task.assigneeId.trim().toLowerCase());
    }
    if (taskScope === 'due') return ['overdue', 'due-soon', 'this-week'].includes(taskDueState(task));
    if (taskScope === 'review') return task.status === 'review';
    if (taskScope === 'blocked') return task.blocked;
    if (taskScope === 'completed') return task.status === 'done';
    return true;
  }), [records, taskScope, currentUserNames]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return scopedRecords.filter(task => {
      const searchable = [task.title, task.description, task.projectName, task.clientName, task.assignee, task.id, task.slug, ...task.tags]
        .join(' ')
        .toLowerCase();

      return (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (projectFilter === 'all' || task.projectId === projectFilter) &&
        (priorityFilter === 'all' || task.priority === priorityFilter) &&
        (statusFilter === 'all' || task.status === statusFilter) &&
        (assigneeFilter === 'all' || task.assigneeId === assigneeFilter || task.assignee === assigneeFilter);
    }).sort((a, b) => {
      const weight: Record<TaskPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      if (taskScope === 'due' || taskScope === 'blocked') {
        return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31') || weight[b.priority] - weight[a.priority];
      }
      if (taskScope === 'completed') return (b.createdAt || '').localeCompare(a.createdAt || '');
      return weight[b.priority] - weight[a.priority] || a.title.localeCompare(b.title);
    });
  }, [scopedRecords, query, projectFilter, priorityFilter, statusFilter, assigneeFilter, taskScope]);

  const metrics = useMemo(() => ({
    total: scopedRecords.length,
    open: scopedRecords.filter(task => task.status !== 'done').length,
    dueSoon: scopedRecords.filter(task => ['overdue', 'due-soon'].includes(taskDueState(task))).length,
    review: scopedRecords.filter(task => task.status === 'review').length,
    blocked: scopedRecords.filter(task => task.blocked).length,
    highPriority: scopedRecords.filter(task => ['high', 'urgent'].includes(task.priority)).length,
  }), [scopedRecords]);

  const clearFilters = () => {
    setQuery('');
    setProjectFilter('all');
    setPriorityFilter('all');
    setStatusFilter('all');
    setAssigneeFilter('all');
  };

  const activeFilterCount = [query, projectFilter, priorityFilter, statusFilter, assigneeFilter].filter(value => value && value !== 'all').length;

  const boardColumns: Array<{ status: TaskStatus; label: string }> = [
    { status: 'todo', label: 'To Do' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'review', label: 'Review' },
    { status: 'done', label: 'Done' },
  ];

  return (
    <div className="space-y-4 pb-10" data-ams-feature-slug="tasks-workspace">
      <AdminMetricStrip
        className="sm:grid-cols-2 lg:grid-cols-4"
        metrics={[
          {
            id: 'tasks-scope',
            slug: 'tasks-kpi-scope',
            label: currentScopeLabel[taskScope] || 'All Tasks',
            value: metrics.total,
            context: taskScope === 'all' ? 'Across project delivery work' : 'Tasks currently in this queue',
            sparkline: [records.length, scopedRecords.length, metrics.total],
            icon: <FolderKanban size={15} />,
          },
          {
            id: 'tasks-open',
            slug: 'tasks-kpi-open',
            label: 'Open Work',
            value: metrics.open,
            context: metrics.highPriority + ' high / urgent',
            sparkline: [metrics.open, metrics.dueSoon, metrics.blocked],
            toneClassName: 'text-info',
            icon: <Clock3 size={15} />,
          },
          {
            id: 'tasks-review',
            slug: 'tasks-kpi-review',
            label: 'Review Queue',
            value: metrics.review,
            context: 'Awaiting review or QA',
            sparkline: [metrics.review, metrics.blocked, metrics.open],
            toneClassName: 'text-warning',
            icon: <AlertTriangle size={15} />,
          },
          {
            id: 'tasks-risk',
            slug: 'tasks-kpi-risk',
            label: taskScope === 'completed' ? 'Completed' : 'Risk Signals',
            value: taskScope === 'completed' ? scopedRecords.length : metrics.blocked + metrics.dueSoon,
            context: taskScope === 'completed' ? 'Completed tasks in scope' : 'Blocked + due soon / overdue',
            sparkline: [metrics.blocked, metrics.dueSoon, metrics.total],
            toneClassName: taskScope === 'completed' ? 'text-success' : 'text-danger',
            icon: taskScope === 'completed' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />,
          },
        ]}
      />

      <AdminPanel
        title={currentScopeLabel[taskScope] || 'All Tasks'}
        description="Operational task queue linked to project delivery and team assignment."
        slug={'tasks-' + (taskScope || 'all')}
        bodyClassName="p-0"
        actions={(
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            {canManageTasks && (
              <Button type="button" variant="primary" icon={<CheckCircle2 size={14} />} onClick={openNewTask}>
                New Task
              </Button>
            )}
            <label className="relative block min-w-0 sm:w-64">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search tasks, projects, assignees..."
                className="h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg outline-none placeholder:text-muted focus:border-accent"
              />
            </label>
            <CustomSelect value={projectFilter} onChange={setProjectFilter} options={[{ value: 'all', label: 'All projects' }, ...projectOptions.map(([value, label]) => ({ value, label }))]} triggerClassName="h-9 min-h-9 w-full sm:w-[170px]" />
            <CustomSelect value={priorityFilter} onChange={setPriorityFilter} options={[{ value: 'all', label: 'All priorities' }, ...Object.entries(taskPriorityLabel).map(([value, label]) => ({ value, label }))]} triggerClassName="h-9 min-h-9 w-full sm:w-[145px]" />
            <CustomSelect value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All statuses' }, ...Object.entries(taskStatusLabel).map(([value, label]) => ({ value, label }))]} triggerClassName="h-9 min-h-9 w-full sm:w-[145px]" />
            <CustomSelect value={assigneeFilter} onChange={setAssigneeFilter} options={[{ value: 'all', label: 'All assignees' }, ...assignees.map(item => ({ value: item.id, label: item.name }))]} triggerClassName="h-9 min-h-9 w-full sm:w-[155px]" />
            <button type="button" onClick={clearFilters} disabled={!activeFilterCount} title="Reset filters" aria-label="Reset filters" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted transition-colors hover:bg-panel hover:text-fg disabled:opacity-40">
              <RefreshCw size={14} />
            </button>
            <div className="inline-flex h-9 shrink-0 items-center gap-0.5 rounded-control border border-line bg-bg p-0.5" aria-label="Task layout">
              <button type="button" title="Table view" aria-label="Table view" onClick={() => setLayout('table')} className={'inline-flex h-8 w-8 items-center justify-center rounded-control ' + (layout === 'table' ? 'bg-panel text-fg' : 'text-muted hover:text-fg')}>
                <List size={14} />
              </button>
              <button type="button" title="Board view" aria-label="Board view" onClick={() => setLayout('board')} className={'inline-flex h-8 w-8 items-center justify-center rounded-control ' + (layout === 'board' ? 'bg-panel text-fg' : 'text-muted hover:text-fg')}>
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>
        )}
      >
        {notice && <div className="mx-4 mt-4 rounded-control border border-line bg-bg px-3 py-2 text-[11px] text-muted sm:mx-5">{notice}</div>}

        {loading ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(item => <div key={item} className="h-24 animate-pulse rounded-control border border-line bg-bg" />)}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <CheckCircle2 size={22} className="mx-auto text-success" />
            <p className="mt-3 text-sm font-semibold text-fg">No tasks in this queue</p>
            <p className="mt-1 text-xs text-muted">{activeFilterCount ? 'Reset the filters to see the full scope.' : 'Nothing needs attention in this task view right now.'}</p>
          </div>
        ) : layout === 'board' ? (
          <div className="overflow-x-auto custom-scrollbar">
            <div className="grid min-w-[1040px] grid-cols-4 gap-3 p-4">
              {boardColumns.map(column => {
                const columnTasks = filteredRecords.filter(task => task.status === column.status);
                return (
                  <section key={column.status} className="min-w-0 rounded-card border border-line bg-bg p-3">
                    <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-fg">
                        <span className={'h-1.5 w-1.5 rounded-full ' + (column.status === 'todo' ? 'bg-info' : column.status === 'in_progress' ? 'bg-accent' : column.status === 'review' ? 'bg-warning' : 'bg-success')} />
                        {column.label}
                      </div>
                      <span className="rounded-badge border border-line bg-panel px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted">{columnTasks.length}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {columnTasks.map(task => (
                        <article key={task.id} data-ams-slug={task.slug} className="rounded-control border border-line bg-panel p-3 transition-colors hover:bg-panel-hover">
                          <button type="button" className="block w-full text-left" onClick={() => setSelectedTask(task)}>
                            <div className="flex items-start justify-between gap-2">
                              <span className="min-w-0 text-xs font-semibold leading-5 text-fg">{task.title}</span>
                              <span className={'shrink-0 rounded-badge border px-1.5 py-0.5 text-[9px] font-semibold ' + taskPriorityClass[task.priority]}>{taskPriorityLabel[task.priority]}</span>
                            </div>
                            <div className="mt-2 truncate text-[10px] text-muted">{task.projectName}</div>
                            <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
                              <span className={taskDueState(task) === 'overdue' ? 'text-danger' : taskDueState(task) === 'due-soon' ? 'text-warning' : 'text-muted'}>{formatTaskDue(task.dueDate)}</span>
                              {task.blocked && <span className="text-danger">Blocked</span>}
                            </div>
                          </button>
                          <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-line pt-2">
                            <button type="button" title="Move to review" aria-label="Move to review" disabled={updatingTaskId === task.id} onClick={() => void updateTaskStatus(task, 'review')} className="inline-flex h-7 w-7 items-center justify-center rounded-control border border-line bg-bg text-muted hover:bg-panel-hover hover:text-fg disabled:opacity-40">
                              <ArrowUpRight size={13} />
                            </button>
                            <button type="button" title="Mark done" aria-label="Mark done" disabled={updatingTaskId === task.id || task.status === 'done'} onClick={() => void updateTaskStatus(task, 'done')} className="inline-flex h-7 w-7 items-center justify-center rounded-control border border-line bg-bg text-muted hover:border-success/30 hover:bg-success/10 hover:text-success disabled:opacity-40">
                              <CheckCircle2 size={13} />
                            </button>
                          </div>
                        </article>
                      ))}
                      {!columnTasks.length && <div className="rounded-control border border-dashed border-line px-3 py-8 text-center text-[10px] text-muted">No tasks</div>}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-panel">
                  <th className="h-11 px-4 text-[11px] font-semibold text-muted">Task</th>
                  <th className="h-11 px-3 text-[11px] font-semibold text-muted">Project</th>
                  <th className="h-11 px-3 text-[11px] font-semibold text-muted">Assignee</th>
                  <th className="h-11 px-3 text-[11px] font-semibold text-muted">Priority</th>
                  <th className="h-11 px-3 text-[11px] font-semibold text-muted">Status</th>
                  <th className="h-11 px-3 text-[11px] font-semibold text-muted">Due</th>
                  <th className="h-11 px-4 text-right text-[11px] font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(task => (
                  <tr key={task.id} data-ams-slug={task.slug} className="border-b border-line transition-colors last:border-b-0 hover:bg-panel-hover">
                    <td className="px-4 py-3 align-middle">
                      <button type="button" className="block min-w-0 text-left" onClick={() => setSelectedTask(task)}>
                        <div className="max-w-[340px] truncate text-xs font-medium text-fg">{task.title}</div>
                        <div className="mt-1 flex items-center gap-2 text-[9px] text-muted">
                          <span className="font-mono text-muted/70">slug: {task.slug}</span>
                          {task.tags.length > 0 && <span className="truncate">{task.tags.slice(0, 2).join(' · ')}</span>}
                        </div>
                      </button>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <div className="max-w-[210px] truncate text-xs font-medium text-fg">{task.projectName}</div>
                      <div className="mt-1 truncate text-[10px] text-muted">{task.clientName || 'Internal'}</div>
                    </td>
                    <td className="px-3 py-3 align-middle"><ProfileIdentity profile={{ name: task.assignee || 'Unassigned', contextLabel: task.assignee ? 'Assignee' : 'Unassigned' }} showRole={false} /></td>
                    <td className="px-3 py-3 align-middle"><span className={'inline-flex rounded-badge border px-2 py-0.5 text-[10px] font-semibold ' + taskPriorityClass[task.priority]}>{taskPriorityLabel[task.priority]}</span></td>
                    <td className="px-3 py-3 align-middle"><span className={'inline-flex items-center gap-1.5 rounded-badge border px-2 py-0.5 text-[10px] font-semibold ' + taskStatusClass[task.status]}><span className="h-1.5 w-1.5 rounded-full bg-current" />{taskStatusLabel[task.status]}{task.blocked && <span className="text-danger">· Blocked</span>}</span></td>
                    <td className="px-3 py-3 align-middle">
                      <div className={'text-xs font-medium tabular-nums ' + (taskDueState(task) === 'overdue' ? 'text-danger' : taskDueState(task) === 'due-soon' ? 'text-warning' : 'text-fg')}>{formatTaskDue(task.dueDate)}</div>
                      <div className="mt-1 text-[10px] text-muted">{taskDueState(task) === 'overdue' ? 'Overdue' : taskDueState(task) === 'due-soon' ? 'Due soon' : task.status === 'done' ? 'Completed' : 'Scheduled'}</div>
                    </td>
                    <td className="px-4 py-3 text-right align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" title="View task" aria-label={'View ' + task.title} onClick={() => setSelectedTask(task)} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg hover:text-fg">
                          <Eye size={14} />
                        </button>
                        <button type="button" title="Mark done" aria-label={'Mark ' + task.title + ' done'} disabled={updatingTaskId === task.id || task.status === 'done'} onClick={() => void updateTaskStatus(task, 'done')} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:border-success/30 hover:bg-success/10 hover:text-success disabled:opacity-40">
                          <CheckCircle2 size={14} />
                        </button>
                        <Link to={'/admin/projects?projects=sprint&project=' + encodeURIComponent(task.projectSlug)} title="Open project delivery" aria-label={'Open project delivery for ' + task.title} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg hover:text-fg">
                          <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-line bg-panel px-4 py-3 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>Showing <span className="font-semibold tabular-nums text-fg">{filteredRecords.length}</span> of <span className="font-semibold tabular-nums text-fg">{scopedRecords.length}</span> tasks in {(currentScopeLabel[taskScope] || 'All Tasks').toLowerCase()}</span>
          <span>{activeFilterCount ? activeFilterCount + ' filter' + (activeFilterCount > 1 ? 's' : '') + ' active' : 'No additional filters'}</span>
        </div>
      </AdminPanel>

      <Modal
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        size="md"
        title="Create task"
        description="Add a task to an existing project delivery queue."
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setTaskFormOpen(false)} disabled={savingTask}>Cancel</Button>
            <Button type="submit" variant="primary" form="tasks-create-form" loading={savingTask}>Create Task</Button>
          </>
        )}
      >
        <form id="tasks-create-form" onSubmit={saveNewTask} className="space-y-4">
          <div>
            <label className="text-[11px] font-medium text-muted">Task title</label>
            <input value={taskForm.title} onChange={event => setTaskForm(current => ({ ...current, title: event.target.value }))} className="mt-1 h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent" placeholder="e.g. Finalize homepage responsive states" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CustomSelect value={taskForm.projectId} onChange={value => setTaskForm(current => ({ ...current, projectId: value }))} options={projectOptions.map(([value, label]) => ({ value, label }))} triggerClassName="h-9 min-h-9 w-full" />
            <CustomSelect value={taskForm.assignee} onChange={value => setTaskForm(current => ({ ...current, assignee: value }))} options={[{ value: '', label: 'Unassigned' }, ...assignees.map(item => ({ value: item.id, label: item.name }))]} triggerClassName="h-9 min-h-9 w-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CustomSelect value={taskForm.priority} onChange={value => setTaskForm(current => ({ ...current, priority: value as TaskPriority }))} options={Object.entries(taskPriorityLabel).map(([value, label]) => ({ value, label }))} triggerClassName="h-9 min-h-9 w-full" />
            <input type="date" value={taskForm.dueDate} onChange={event => setTaskForm(current => ({ ...current, dueDate: event.target.value }))} className="h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted">Description</label>
            <textarea value={taskForm.description} onChange={event => setTaskForm(current => ({ ...current, description: event.target.value }))} rows={4} className="mt-1 w-full resize-none rounded-control border border-line bg-bg px-3 py-2 text-xs leading-5 text-fg outline-none focus:border-accent" placeholder="Task context, acceptance note, or handoff details." />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        size="lg"
        title={selectedTask?.title || 'Task details'}
        description={selectedTask?.projectName}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setSelectedTask(null)}>Close</Button>
            {selectedTask && selectedTask.status !== 'done' && (
              <Button type="button" variant="primary" icon={<CheckCircle2 size={14} />} onClick={() => void updateTaskStatus(selectedTask, 'done')}>
                Mark done
              </Button>
            )}
          </>
        )}
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-[10px] font-medium text-muted">Task ID</div>
                <div className="mt-1 font-mono text-xs font-semibold text-fg">{selectedTask.id}</div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-[10px] font-medium text-muted">Status</div>
                <span className={'mt-1 inline-flex rounded-badge border px-2 py-1 text-[10px] font-semibold ' + taskStatusClass[selectedTask.status]}>{taskStatusLabel[selectedTask.status]}</span>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-[10px] font-medium text-muted">Priority</div>
                <span className={'mt-1 inline-flex rounded-badge border px-2 py-1 text-[10px] font-semibold ' + taskPriorityClass[selectedTask.priority]}>{taskPriorityLabel[selectedTask.priority]}</span>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-[10px] font-medium text-muted">Due date</div>
                <div className="mt-1 text-xs font-semibold tabular-nums text-fg">{formatTaskDue(selectedTask.dueDate)}</div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-[10px] font-medium text-muted">Assignee</div>
                <div className="mt-1"><ProfileIdentity profile={{ name: selectedTask.assignee || 'Unassigned', contextLabel: 'Assignee' }} showRole={false} /></div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-[10px] font-medium text-muted">Client</div>
                <div className="mt-1 text-xs font-semibold text-fg">{selectedTask.clientName || 'Internal'}</div>
              </div>
            </div>

            {selectedTask.description && (
              <div className="rounded-card border border-line bg-bg p-4">
                <div className="text-[11px] font-semibold text-fg">Description</div>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted">{selectedTask.description}</p>
              </div>
            )}

            <div className="rounded-card border border-line bg-bg p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold text-fg">Task flow</span>
                <span className="font-mono text-[9px] text-muted/70">slug: {selectedTask.slug}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(['todo', 'in_progress', 'review', 'done'] as TaskStatus[]).map(status => (
                  <button
                    key={status}
                    type="button"
                    disabled={updatingTaskId === selectedTask.id}
                    onClick={() => { void updateTaskStatus(selectedTask, status); }}
                    className={'min-h-9 rounded-control border px-2 text-[10px] font-semibold transition-colors ' + (selectedTask.status === status ? taskStatusClass[status] : 'border-line bg-panel text-muted hover:text-fg')}
                  >
                    {taskStatusLabel[status]}
                  </button>
                ))}
              </div>
            </div>

            {selectedTask.blocked && (
              <div className="rounded-card border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
                This task is blocked and needs its dependency cleared before completion.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TasksWorkspace;
