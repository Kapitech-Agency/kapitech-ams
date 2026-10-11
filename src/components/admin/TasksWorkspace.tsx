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
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
} from 'lucide-react';
import { AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminPanel, AdminSectionTabs, AdminTablePagination } from './AdminModulePrimitives';
import { CustomSelect } from '../ui/CustomSelect';
import { Modal } from '../ui/Modal';
import { ProfileIdentity } from './ProfileIdentity';
import Button from '../ui/Button';
import { api } from '../../lib/apiClient';
import { getAdminSession, hasAdminPermission } from '../../lib/adminAuth';
import { isSlugFixtureMode } from '../../lib/runtimeMode';

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskSortKey = 'title' | 'projectName' | 'assignee' | 'priority' | 'status' | 'dueDate' | 'createdAt';

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
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
};

const TASK_TABS = [
  { key: 'all', label: 'All Tasks', search: '' },
  { key: 'my', label: 'My Tasks', search: '&taskscope=my' },
  { key: 'due', label: 'Due & Overdue', search: '&taskscope=due' },
  { key: 'review', label: 'Review Queue', search: '&taskscope=review' },
  { key: 'blocked', label: 'Blocked', search: '&taskscope=blocked' },
  { key: 'completed', label: 'Completed', search: '&taskscope=completed' },
] as const;

const DEFAULT_PAGE_SIZE = 10;

const buildPreviewTask = (
  id: string,
  title: string,
  description: string,
  projectId: string,
  projectName: string,
  clientName: string,
  assignee: string,
  priority: TaskPriority,
  status: TaskStatus,
  dueOffset: number,
  tags: string[],
  blocked = false,
  subtasks: Array<{ id: string; title: string; completed: boolean }> = [],
): TaskRecord => {
  const dueDate = new Date(Date.now() + dueOffset * 86400000).toISOString().slice(0, 10);
  return {
    id,
    title,
    description,
    projectId,
    projectName,
    projectSlug: slugify(projectName),
    clientName,
    assigneeId: '',
    assignee,
    priority,
    status,
    dueDate,
    tags,
    blocked,
    slug: 'task-' + slugify(title) + '-' + slugify(id),
    createdAt: new Date(Date.now() - Math.max(1, Math.abs(dueOffset) + 2) * 86400000).toISOString(),
    subtasks,
  };
};

const fallbackTasks: TaskRecord[] = [
  buildPreviewTask('task-001', 'Approve homepage copy', 'Final content approval before client handoff.', 'proj-001', 'Atlas Brand System', 'Atlas Group', 'Fikri', 'high', 'todo', 0, ['content', 'client']),
  buildPreviewTask('task-002', 'Finalize checkout UI', 'Finish the checkout flow and responsive states.', 'proj-002', 'Meridian Commerce', 'Meridian Labs', 'Sarah', 'high', 'in_progress', 1, ['frontend', 'ui']),
  buildPreviewTask('task-003', 'QA campaign landing page', 'Run final QA against approved campaign layouts.', 'proj-003', 'Nova Growth Retainer', 'Nova Ventures', 'Dimas', 'medium', 'review', 2, ['qa', 'campaign']),
  buildPreviewTask('task-004', 'Resolve API handoff', 'Waiting for the final API contract confirmation.', 'proj-004', 'Orbit Product Launch', 'Orbit Health', 'Raka', 'urgent', 'in_progress', -1, ['blocked', 'api'], true),
  buildPreviewTask('task-005', 'Prepare client presentation', 'Prepare delivery deck for the next client checkpoint.', 'proj-005', 'Northstar Campaign', 'Northstar Capital', 'Nadia', 'medium', 'in_progress', 3, ['client', 'presentation']),
  buildPreviewTask('task-006', 'Review analytics dashboard', 'Review the latest dashboard metrics and document findings.', 'proj-001', 'Atlas Brand System', 'Atlas Group', 'Fikri', 'low', 'done', 0, ['analytics']),
  buildPreviewTask('task-007', 'Confirm sitemap structure', 'Confirm the final navigation and page hierarchy.', 'proj-001', 'Atlas Brand System', 'Atlas Group', 'Rey', 'medium', 'todo', 4, ['planning']),
  buildPreviewTask('task-008', 'Test mobile navigation', 'Validate mobile navigation states across target breakpoints.', 'proj-002', 'Meridian Commerce', 'Meridian Labs', 'Sarah', 'high', 'in_progress', 5, ['qa', 'mobile']),
  buildPreviewTask('task-009', 'Prepare ad creative variants', 'Prepare the approved creative variants for launch.', 'proj-003', 'Nova Growth Retainer', 'Nova Ventures', 'Tareq', 'medium', 'todo', 6, ['creative', 'ads']),
  buildPreviewTask('task-010', 'Review staging deployment', 'Check the latest staging release against the delivery checklist.', 'proj-004', 'Orbit Product Launch', 'Orbit Health', 'Jordan', 'urgent', 'review', 1, ['release', 'qa']),
  buildPreviewTask('task-011', 'Collect final brand assets', 'Collect final approved logos, imagery, and brand references.', 'proj-005', 'Northstar Campaign', 'Northstar Capital', 'Fikri', 'low', 'done', -2, ['assets']),
  buildPreviewTask('task-012', 'Send launch readiness notes', 'Send the final internal launch readiness summary.', 'proj-004', 'Orbit Product Launch', 'Orbit Health', 'Reynaldo', 'high', 'todo', 7, ['launch', 'internal']),
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

const taskPriorityWeight: Record<TaskPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
const taskStatusWeight: Record<TaskStatus, number> = { todo: 1, in_progress: 2, review: 3, done: 4 };

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}

function formatTaskDue(value: string) {
  if (!value) return 'No due date';
  const parsed = new Date(value + (value.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function taskDueState(task: TaskRecord) {
  if (task.status === 'done') return 'completed';
  if (!task.dueDate) return 'none';
  const due = new Date(task.dueDate + 'T23:59:59');
  const days = Math.ceil((due.getTime() - Date.now()) / 86400000);
  if (days < 0) return 'overdue';
  if (days <= 2) return 'due-soon';
  if (days <= 7) return 'this-week';
  return 'scheduled';
}

function taskDueLabel(task: TaskRecord) {
  const state = taskDueState(task);
  if (state === 'overdue') return 'Overdue';
  if (state === 'due-soon') return 'Due soon';
  if (state === 'this-week') return 'This week';
  if (state === 'completed') return 'Completed';
  return 'Scheduled';
}

function isTaskBlocked(task: any) {
  return Boolean(task?.blocked) ||
    (Array.isArray(task?.tags) && task.tags.some((tag: unknown) =>
      ['blocked', 'blocker', 'blocked-by', 'waiting'].includes(String(tag).trim().toLowerCase())
    ));
}

const scopeLabels: Record<string, string> = {
  all: 'All Tasks',
  my: 'My Tasks',
  due: 'Due & Overdue',
  review: 'Review Queue',
  blocked: 'Blocked',
  completed: 'Completed',
};

export const TasksWorkspace: React.FC = () => {
  const [searchParams] = useSearchParams();
  const taskScope = scopeLabels[searchParams.get('taskscope') || 'all'] ? (searchParams.get('taskscope') || 'all') : 'all';
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
  const [sortKey, setSortKey] = useState<TaskSortKey>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [savingEditTask, setSavingEditTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    projectId: '',
    assignee: '',
    priority: 'medium' as TaskPriority,
    dueDate: new Date().toISOString().slice(0, 10),
    tags: '',
    subtasks: '',
  });
  const [taskEditForm, setTaskEditForm] = useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'medium' as TaskPriority,
    dueDate: '',
    tags: '',
    subtasks: '',
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
                subtasks: Array.isArray(task?.subtasks)
                  ? task.subtasks.map((item: any, index: number) => ({
                      id: String(item?.id || id + '-subtask-' + index),
                      title: String(item?.title || ''),
                      completed: Boolean(item?.completed),
                    })).filter((item: { title: string }) => item.title)
                  : [],
              });
            });
          });

          if (mounted) {
            setRecords(normalized.length ? normalized : (isSlugFixtureMode() ? fallbackTasks : []));
            setNotice(normalized.length
              ? null
              : isSlugFixtureMode()
                ? 'No server tasks were returned. Frontend preview tasks are active for the workspace.'
                : null);
          }
        } else if (mounted) {
          setRecords(isSlugFixtureMode() ? fallbackTasks : []);
          setNotice(isSlugFixtureMode()
            ? 'Task service is unavailable. Frontend preview tasks are active for the workspace.'
            : 'Task service is unavailable. Live task data could not be loaded.');
        }
      } catch {
        if (mounted) {
          setRecords(isSlugFixtureMode() ? fallbackTasks : []);
          setNotice(isSlugFixtureMode()
            ? 'Task service is unavailable. Frontend preview tasks are active for the workspace.'
            : 'Task service is unavailable. Live task data could not be loaded.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadTasks();
    return () => { mounted = false; };
  }, []);

  const projectOptions = useMemo(
    () => Array.from(new Map<string, string>(records.map(task => [task.projectId, task.projectName])).entries()).sort((a, b) => a[1].localeCompare(b[1])),
    [records]
  );

  const updateTaskStatus = async (task: TaskRecord, nextStatus: TaskStatus) => {
    if (!canManageTasks || task.status === nextStatus || updatingTaskId === task.id) return;
    const previousTask = records.find(item => item.id === task.id) || task;
    setUpdatingTaskId(task.id);
    setRecords(current => current.map(item => item.id === task.id ? {
      ...item,
      status: nextStatus,
      blocked: nextStatus === 'done' ? false : item.blocked,
    } : item));

    const rollback = () => {
      setRecords(current => current.map(item => item.id === previousTask.id ? previousTask : item));
      setSelectedTask(current => current?.id === previousTask.id ? previousTask : current);
    };

    try {
      const response = await api.tasks.update(task.id, { status: nextStatus });
      if (!response.success) {
        rollback();
        setNotice(response.error || 'Task status could not be saved. The previous server state has been restored.');
        return;
      }

      const savedStatus = response.data?.task?.status;
      const committedStatus: TaskStatus = ['todo', 'in_progress', 'review', 'done'].includes(String(savedStatus))
        ? savedStatus as TaskStatus
        : nextStatus;
      const committedTask: TaskRecord = {
        ...previousTask,
        status: committedStatus,
        blocked: committedStatus === 'done' ? false : previousTask.blocked,
        updatedAt: String(response.data?.task?.updatedAt || previousTask.updatedAt),
      };
      setRecords(current => current.map(item => item.id === committedTask.id ? committedTask : item));
      setSelectedTask(current => current?.id === committedTask.id ? committedTask : current);
      setNotice('Task status saved to the server.');
    } catch (error) {
      rollback();
      setNotice(error instanceof Error
        ? error.message
        : 'Task status could not be saved. The previous server state has been restored.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const saveNewTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageTasks) return;
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
    const tags = taskForm.tags
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
      .slice(0, 6);
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
      tags,
      blocked: false,
      slug: 'task-' + slugify(taskForm.title) + '-' + slugify(id),
      createdAt: new Date().toISOString(),
      subtasks: taskForm.subtasks
        .split('\n')
        .map(value => value.trim())
        .filter(Boolean)
        .map((title, index) => ({ id: id + '-subtask-' + index, title, completed: false })),
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
        tags,
        subtasks: localTask.subtasks,
      });

      const persistedTask = response.data?.task;
      if (!response.success || !persistedTask || !String(persistedTask.id || '').trim()) {
        setNotice(response.error || 'Task could not be saved. No local task was added.');
        return;
      }

      const persistedId = String(persistedTask.id);
      const persistedAssigneeId = String(persistedTask.assigneeUserId || taskForm.assignee || '');
      const persistedAssignee = assignees.find(item =>
        item.id === persistedAssigneeId || item.username === String(persistedTask.assignee || '')
      );
      const savedTask: TaskRecord = {
        ...localTask,
        id: persistedId,
        title: String(persistedTask.title || localTask.title),
        description: String(persistedTask.description || ''),
        projectId: String(persistedTask.projectId || localTask.projectId),
        projectName: String(persistedTask.projectName || localTask.projectName),
        projectSlug: slugify(String(persistedTask.projectName || localTask.projectName)),
        assigneeId: persistedAssigneeId,
        assignee: persistedAssignee?.name || String(persistedTask.assignee || localTask.assignee),
        priority: ['low', 'medium', 'high', 'urgent'].includes(String(persistedTask.priority))
          ? persistedTask.priority as TaskPriority
          : localTask.priority,
        status: ['todo', 'in_progress', 'review', 'done'].includes(String(persistedTask.status))
          ? persistedTask.status as TaskStatus
          : localTask.status,
        dueDate: String(persistedTask.dueDate || localTask.dueDate),
        tags: Array.isArray(persistedTask.tags) ? persistedTask.tags.map(String) : tags,
        blocked: isTaskBlocked(persistedTask),
        slug: 'task-' + slugify(String(persistedTask.title || localTask.title)) + '-' + slugify(persistedId),
        createdAt: String(persistedTask.createdAt || localTask.createdAt),
        subtasks: Array.isArray(persistedTask.subtasks)
          ? persistedTask.subtasks.map((item: any, index: number) => ({
              id: String(item?.id || persistedId + '-subtask-' + index),
              title: String(item?.title || ''),
              completed: Boolean(item?.completed),
            })).filter((item: { title: string }) => item.title)
          : localTask.subtasks.map((item, index) => ({
              ...item,
              id: persistedId + '-subtask-' + index,
            })),
      };

      setRecords(current => [savedTask, ...current.filter(item => item.id !== persistedId)]);
      setNotice('Task created and saved to the server.');
      setTaskFormOpen(false);
      setPage(1);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Task could not be saved. No local task was added.');
    } finally {
      setSavingTask(false);
    }
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
    const filtered = scopedRecords.filter(task => {
      const searchable = [
        task.title,
        task.description,
        task.projectName,
        task.clientName,
        task.assignee,
        task.id,
        task.slug,
        ...task.tags,
      ].join(' ').toLowerCase();

      return (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (projectFilter === 'all' || task.projectId === projectFilter) &&
        (priorityFilter === 'all' || task.priority === priorityFilter) &&
        (statusFilter === 'all' || task.status === statusFilter) &&
        (assigneeFilter === 'all' || task.assigneeId === assigneeFilter || task.assignee === assigneeFilter);
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'title') comparison = a.title.localeCompare(b.title);
      if (sortKey === 'projectName') comparison = a.projectName.localeCompare(b.projectName);
      if (sortKey === 'assignee') comparison = a.assignee.localeCompare(b.assignee);
      if (sortKey === 'priority') comparison = taskPriorityWeight[a.priority] - taskPriorityWeight[b.priority];
      if (sortKey === 'status') comparison = taskStatusWeight[a.status] - taskStatusWeight[b.status];
      if (sortKey === 'dueDate') comparison = (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
      if (sortKey === 'createdAt') comparison = (a.createdAt || '').localeCompare(b.createdAt || '');
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [scopedRecords, query, projectFilter, priorityFilter, statusFilter, assigneeFilter, sortKey, sortDirection]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [taskScope, query, projectFilter, priorityFilter, statusFilter, assigneeFilter, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);
  const allVisibleSelected = pagedRecords.length > 0 && pagedRecords.every(task => selectedIds.includes(task.id));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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
    setPage(1);
  };

  const setSort = (key: TaskSortKey) => {
    if (sortKey === key) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection(key === 'dueDate' ? 'asc' : 'desc');
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const toggleVisibleSelection = () => {
    if (allVisibleSelected) {
      setSelectedIds(current => current.filter(id => !pagedRecords.some(task => task.id === id)));
      return;
    }
    setSelectedIds(current => Array.from(new Set([...current, ...pagedRecords.map(task => task.id)])));
  };

  const bulkUpdateStatus = async (nextStatus: TaskStatus) => {
    if (!canManageTasks || !selectedIds.length || bulkUpdating) return;
    setBulkUpdating(true);
    const selectedTasks = records.filter(task => selectedIds.includes(task.id));
    const previousRecords = records;
    setRecords(current => current.map(task => selectedIds.includes(task.id)
      ? { ...task, status: nextStatus, blocked: nextStatus === 'done' ? false : task.blocked }
      : task));

    const failedIds: string[] = [];
    let succeeded = 0;
    for (const task of selectedTasks) {
      try {
        const response = await api.tasks.update(task.id, { status: nextStatus });
        if (response.success) succeeded += 1;
        else failedIds.push(task.id);
      } catch {
        failedIds.push(task.id);
      }
    }

    if (failedIds.length) {
      setRecords(current => current.map(task => {
        if (!failedIds.includes(task.id)) return task;
        return previousRecords.find(previous => previous.id === task.id) || task;
      }));
    }

    setSelectedIds([]);
    setBulkUpdating(false);
    setNotice(
      failedIds.length === 0
        ? selectedTasks.length + ' tasks moved to ' + taskStatusLabel[nextStatus] + '.'
        : succeeded + ' tasks moved to ' + taskStatusLabel[nextStatus] + '; ' + failedIds.length + ' were reverted because the server rejected the update.'
    );
  };

  const openNewTask = () => {
    if (!canManageTasks) return;
    setTaskForm({
      title: '',
      description: '',
      projectId: projectOptions[0]?.[0] || '',
      assignee: '',
      priority: 'medium',
      dueDate: new Date().toISOString().slice(0, 10),
      tags: '',
      subtasks: '',
    });
    setTaskFormOpen(true);
  };

  const openEditTask = (task: TaskRecord) => {
    if (!canManageTasks) return;
    setSelectedTask(null);
    setEditingTask(task);
    setTaskEditForm({
      title: task.title,
      description: task.description,
      assignee: task.assigneeId,
      priority: task.priority,
      dueDate: task.dueDate,
      tags: task.tags.join(', '),
      subtasks: task.subtasks.map(item => item.title).join('\n'),
    });
  };

  const saveTaskEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageTasks || !editingTask || !taskEditForm.title.trim()) {
      setNotice('Task title is required.');
      return;
    }

    setSavingEditTask(true);
    const tags = taskEditForm.tags
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
      .slice(0, 6);
    const subtasks = taskEditForm.subtasks
      .split('\n')
      .map(value => value.trim())
      .filter(Boolean)
      .map((title, index) => ({
        id: editingTask.subtasks[index]?.id || editingTask.id + '-subtask-' + index,
        title,
        completed: editingTask.subtasks[index]?.completed || false,
      }));

    const nextTask: TaskRecord = {
      ...editingTask,
      title: taskEditForm.title.trim(),
      description: taskEditForm.description.trim(),
      assigneeId: taskEditForm.assignee,
      assignee: assignees.find(item => item.id === taskEditForm.assignee)?.name || taskEditForm.assignee || 'Unassigned',
      priority: taskEditForm.priority,
      dueDate: taskEditForm.dueDate,
      tags,
      subtasks,
      slug: 'task-' + slugify(taskEditForm.title) + '-' + slugify(editingTask.id),
    };

    const previousTask = editingTask;
    let saved = false;
    setRecords(current => current.map(item => item.id === editingTask.id ? nextTask : item));
    setSelectedTask(current => current?.id === editingTask.id ? nextTask : current);

    const rollback = () => {
      setRecords(current => current.map(item => item.id === previousTask.id ? previousTask : item));
      setSelectedTask(current => current?.id === previousTask.id ? previousTask : current);
    };

    try {
      const response = await api.tasks.update(editingTask.id, {
        title: nextTask.title,
        description: nextTask.description,
        projectId: nextTask.projectId,
        projectName: nextTask.projectName,
        assignee: nextTask.assigneeId,
        priority: nextTask.priority,
        status: nextTask.status,
        dueDate: nextTask.dueDate,
        tags: nextTask.tags,
        subtasks: nextTask.subtasks,
      });
      if (!response.success) {
        rollback();
        setNotice(response.error || 'Task could not be saved. The previous server state has been restored.');
        return;
      }

      const savedTask = response.data?.task;
      const committedTask: TaskRecord = {
        ...nextTask,
        id: previousTask.id,
        updatedAt: String(savedTask?.updatedAt || nextTask.updatedAt),
      };
      setRecords(current => current.map(item => item.id === committedTask.id ? committedTask : item));
      setSelectedTask(current => current?.id === committedTask.id ? committedTask : current);
      setNotice('Task updated and saved to the server.');
      saved = true;
    } catch (error) {
      rollback();
      setNotice(error instanceof Error
        ? error.message
        : 'Task could not be saved. The previous server state has been restored.');
    } finally {
      setSavingEditTask(false);
      if (saved) setEditingTask(null);
    }
  };

  const activeFilterCount = [query, projectFilter, priorityFilter, statusFilter, assigneeFilter]
    .filter(value => value && value !== 'all').length;

  const boardColumns: Array<{ status: TaskStatus; label: string }> = [
    { status: 'todo', label: 'To Do' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'review', label: 'Review' },
    { status: 'done', label: 'Done' },
  ];

  const scopeLabel = scopeLabels[taskScope] || 'All Tasks';

  const sortIcon = (key: TaskSortKey) => {
    if (sortKey !== key) return null;
    return <span aria-hidden="true" className="font-medium text-muted">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <AdminPageShell featureSlug="tasks-module" className="tasks-module">
      <div data-ams-slug="tasks-header">
        <AdminModuleHeader
          className="mb-0"
          title="Tasks"
          description="Manage daily delivery work, due tasks, reviews, blockers, and completed work from one task workspace."
          actions={
            canManageTasks ? (
              <span data-ams-slug="tasks-action-new">
                <Button type="button" variant="primary" icon={<Plus size={14} />} onClick={openNewTask}>
                  New Task
                </Button>
              </span>
            ) : undefined
          }
        />
      </div>

      <div className="min-[900px]:hidden min-w-0" data-ams-slug="tasks-mobile-tabs">
        <AdminSectionTabs
          ariaLabel="Tasks sections"
          activeKey={taskScope}
          items={TASK_TABS.map((tab) => ({
            key: tab.key,
            label: tab.label,
            to: '/admin/tasks' + (tab.search ? '?' + tab.search.replace(/^&/, '') : '')
          }))}
        />
      </div>

      <div data-ams-feature-slug="tasks-kpis">
        <AdminMetricStrip slug="tasks-kpis"
          className="sm:grid-cols-2 lg:grid-cols-4"
          metrics={[
            {
              id: 'tasks-scope',
              slug: 'tasks-kpi-scope',
              label: scopeLabel,
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
              value: taskScope === 'completed' ? metrics.total : metrics.blocked + metrics.dueSoon,
              context: taskScope === 'completed' ? 'Completed tasks in scope' : 'Blocked + due soon / overdue',
              sparkline: [metrics.blocked, metrics.dueSoon, metrics.total],
              toneClassName: taskScope === 'completed' ? 'text-success' : 'text-danger',
              icon: taskScope === 'completed' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />,
            },
          ]}
        />
      </div>

      <AdminPanel
        title={scopeLabel}
        description="Operational task queue linked to project delivery and team assignment."
        slug={'tasks-' + taskScope}
        bodyClassName="p-0"
      >
        <div className="border-b border-line px-4 py-3 sm:px-5" data-ams-feature-slug="tasks-filters">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1 sm:min-w-[260px]" data-ams-slug="tasks-filter-search">
                <span className="sr-only">Search tasks</span>
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search tasks, projects, clients, assignees..."
                  aria-label="Search tasks, projects, clients, assignees"
                  className="h-9 min-h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg outline-none placeholder:text-muted focus:border-accent"
                />
              </label>
              <span data-ams-slug="tasks-filter-project">
                <CustomSelect value={projectFilter} onChange={setProjectFilter} options={[{ value: 'all', label: 'All projects' }, ...projectOptions.map(([value, label]) => ({ value, label }))]} triggerClassName="h-9 min-h-9 w-full sm:w-[170px]" />
              </span>
              <span data-ams-slug="tasks-filter-priority">
                <CustomSelect value={priorityFilter} onChange={setPriorityFilter} options={[{ value: 'all', label: 'All priorities' }, ...Object.entries(taskPriorityLabel).map(([value, label]) => ({ value, label }))]} triggerClassName="h-9 min-h-9 w-full sm:w-[145px]" />
              </span>
              <span data-ams-slug="tasks-filter-status">
                <CustomSelect value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All statuses' }, ...Object.entries(taskStatusLabel).map(([value, label]) => ({ value, label }))]} triggerClassName="h-9 min-h-9 w-full sm:w-[145px]" />
              </span>
              <span data-ams-slug="tasks-filter-assignee">
                <CustomSelect value={assigneeFilter} onChange={setAssigneeFilter} options={[{ value: 'all', label: 'All assignees' }, ...assignees.map(item => ({ value: item.id, label: item.name }))]} triggerClassName="h-9 min-h-9 w-full sm:w-[155px]" />
              </span>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!activeFilterCount}
                title="Reset filters"
                aria-label="Reset task filters"
                data-ams-slug="tasks-filter-reset"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted transition-colors hover:bg-panel hover:text-fg disabled:opacity-40"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2 xl:justify-end" data-ams-feature-slug="tasks-view-controls">
              {selectedIds.length > 0 && canManageTasks && (
                <div className="flex items-center gap-1.5 rounded-control border border-line bg-bg p-0.5" data-ams-slug="tasks-bulk-actions">
                  <span className="px-2 text-[10px] font-semibold text-fg">{selectedIds.length} selected</span>
                  <button type="button" disabled={bulkUpdating} onClick={() => void bulkUpdateStatus('in_progress')} data-ams-slug="tasks-bulk-start" className="h-8 rounded-control px-2 text-[10px] font-medium text-muted hover:bg-panel hover:text-fg disabled:opacity-40">Start</button>
                  <button type="button" disabled={bulkUpdating} onClick={() => void bulkUpdateStatus('review')} data-ams-slug="tasks-bulk-review" className="h-8 rounded-control px-2 text-[10px] font-medium text-muted hover:bg-panel hover:text-fg disabled:opacity-40">Review</button>
                  <button type="button" disabled={bulkUpdating} onClick={() => void bulkUpdateStatus('done')} data-ams-slug="tasks-bulk-done" className="h-8 rounded-control px-2 text-[10px] font-medium text-success hover:bg-success/10 disabled:opacity-40">Done</button>
                </div>
              )}
              <div className="inline-flex h-9 shrink-0 items-center gap-0.5 rounded-control border border-line bg-bg p-0.5" aria-label="Task layout" data-ams-slug="tasks-layout-toggle">
                <button type="button" title="Table view" aria-label="Table view" aria-pressed={layout === 'table'} onClick={() => setLayout('table')} data-ams-slug="tasks-view-table" className={'inline-flex h-8 w-8 items-center justify-center rounded-control ' + (layout === 'table' ? 'bg-panel text-fg' : 'text-muted hover:text-fg')}>
                  <List size={14} />
                </button>
                <button type="button" title="Board view" aria-label="Board view" aria-pressed={layout === 'board'} onClick={() => setLayout('board')} data-ams-slug="tasks-view-board" className={'inline-flex h-8 w-8 items-center justify-center rounded-control ' + (layout === 'board' ? 'bg-panel text-fg' : 'text-muted hover:text-fg')}>
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-muted" data-ams-slug="tasks-filter-summary">
            <span>{filteredRecords.length} visible</span>
            <span aria-hidden="true">·</span>
            <span>{activeFilterCount ? activeFilterCount + ' filters active' : 'All filters clear'}</span>
            <span aria-hidden="true">·</span>
            <span>{scopeLabel}</span>
          </div>
        </div>

        {notice && (
          <div className="mx-4 mt-4 rounded-control border border-line bg-bg px-3 py-2 text-[11px] text-muted sm:mx-5" data-ams-slug="tasks-notice" aria-live="polite">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4" data-ams-slug="tasks-loading">
            {[1, 2, 3, 4].map(item => <div key={item} className="h-24 animate-pulse rounded-control border border-line bg-bg" data-ams-slug={'tasks-loading-' + item} />)}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="px-5 py-16 text-center" data-ams-slug="tasks-empty-state">
            <FolderKanban size={22} className="mx-auto text-muted" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-fg">{activeFilterCount ? 'No tasks match these filters' : 'No tasks in this queue'}</p>
            <p className="mt-1 text-xs text-muted">{activeFilterCount ? 'Reset filters or change the search to widen the queue.' : taskScope === 'all' ? 'No tasks are available from the live project data yet.' : 'Nothing needs attention in this task view right now.'}</p>
            {activeFilterCount && (
              <button type="button" onClick={clearFilters} data-ams-slug="tasks-empty-reset" className="mt-4 inline-flex min-h-9 items-center justify-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">
                Reset filters
              </button>
            )}
          </div>
        ) : layout === 'board' ? (
          <div className="overflow-x-auto custom-scrollbar" data-ams-feature-slug="tasks-board-view">
            <div className="grid min-w-[1040px] grid-cols-4 gap-3 p-4">
              {boardColumns.map(column => {
                const columnTasks = filteredRecords.filter(task => task.status === column.status);
                return (
                  <section key={column.status} className="min-w-0 rounded-card border border-line bg-bg p-3" data-ams-slug={'tasks-column-' + column.status}>
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
                          <button type="button" className="block w-full text-left" onClick={() => setSelectedTask(task)} data-ams-slug={task.slug + '-open'}>
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
                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2">
                            <span className="min-w-0 truncate font-mono text-[9px] text-muted/60">slug: {task.slug}</span>
                            {canManageTasks && (
                              <div className="flex shrink-0 items-center gap-1.5" data-ams-slug={task.slug + '-actions'}>
                                {task.status === 'todo' && (
                                  <button type="button" title="Start task" aria-label={'Start ' + task.title} disabled={updatingTaskId === task.id} onClick={() => void updateTaskStatus(task, 'in_progress')} data-ams-slug={task.slug + '-start'} className="inline-flex h-7 w-7 items-center justify-center rounded-control border border-line bg-bg text-muted hover:bg-panel-hover hover:text-fg disabled:opacity-40">
                                    <Clock3 size={13} />
                                  </button>
                                )}
                                {task.status === 'in_progress' && (
                                  <button type="button" title="Move to review" aria-label={'Move ' + task.title + ' to review'} disabled={updatingTaskId === task.id} onClick={() => void updateTaskStatus(task, 'review')} data-ams-slug={task.slug + '-review'} className="inline-flex h-7 w-7 items-center justify-center rounded-control border border-line bg-bg text-muted hover:bg-panel-hover hover:text-fg disabled:opacity-40">
                                    <ArrowUpRight size={13} />
                                  </button>
                                )}
                                {task.status !== 'done' && (
                                  <button type="button" title="Mark done" aria-label={'Mark ' + task.title + ' done'} disabled={updatingTaskId === task.id} onClick={() => void updateTaskStatus(task, 'done')} data-ams-slug={task.slug + '-done'} className="inline-flex h-7 w-7 items-center justify-center rounded-control border border-line bg-bg text-muted hover:border-success/30 hover:bg-success/10 hover:text-success disabled:opacity-40">
                                    <CheckCircle2 size={13} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </article>
                      ))}
                      {!columnTasks.length && <div className="rounded-control border border-dashed border-line px-3 py-8 text-center text-[10px] text-muted" data-ams-slug={'tasks-column-empty-' + column.status}>No tasks</div>}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar" data-ams-feature-slug="tasks-table-view">
            <table className="w-full min-w-[1120px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-panel">
                <tr className="border-b border-line">
                  {canManageTasks && (
                    <th className="h-11 w-10 px-3">
                      <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection} aria-label="Select visible tasks" data-ams-slug="tasks-select-visible" className="h-4 w-4 rounded border-line bg-bg accent-accent" />
                    </th>
                  )}
                  {[
                    ['title', 'Task'],
                    ['projectName', 'Project'],
                    ['assignee', 'Assignee'],
                    ['priority', 'Priority'],
                    ['status', 'Status'],
                    ['dueDate', 'Due'],
                  ].map(([key, label]) => (
                    <th key={key} className="h-11 px-3 text-[11px] font-semibold text-muted" data-ams-slug={'tasks-column-' + key}>
                      <button type="button" onClick={() => setSort(key as TaskSortKey)} data-ams-slug={'tasks-sort-' + key} className="inline-flex items-center gap-1 rounded-control px-1 py-1 text-left hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                        {label}
                        {sortIcon(key as TaskSortKey)}
                      </button>
                    </th>
                  ))}
                  <th className="h-11 w-32 px-4 text-right text-[11px] font-semibold text-muted" data-ams-slug="tasks-column-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.map(task => (
                  <tr key={task.id} data-ams-slug={task.slug} className="border-b border-line transition-colors last:border-b-0 hover:bg-panel-hover">
                    {canManageTasks && (
                      <td className="px-3 py-3 align-middle" data-ams-slug={task.slug + '-select'}>
                        <input type="checkbox" checked={selectedIds.includes(task.id)} onChange={() => toggleSelection(task.id)} aria-label={'Select ' + task.title} className="h-4 w-4 rounded border-line bg-bg accent-accent" />
                      </td>
                    )}
                    <td className="px-3 py-3 align-middle">
                      <button type="button" className="block min-w-0 text-left" onClick={() => setSelectedTask(task)} data-ams-slug={task.slug + '-open'}>
                        <div className="max-w-[320px] truncate text-xs font-medium text-fg">{task.title}</div>
                        <div className="mt-1 flex items-center gap-2 text-[9px] text-muted">
                          <span className="font-mono text-muted/70">slug: {task.slug}</span>
                          {task.tags.length > 0 && <span className="truncate">{task.tags.slice(0, 2).join(' · ')}</span>}
                        </div>
                      </button>
                    </td>
                    <td className="px-3 py-3 align-middle" data-ams-slug={task.slug + '-project'}>
                      <div className="max-w-[210px] truncate text-xs font-medium text-fg">{task.projectName}</div>
                      <div className="mt-1 truncate text-[10px] text-muted">{task.clientName || 'Internal'}</div>
                    </td>
                    <td className="px-3 py-3 align-middle" data-ams-slug={task.slug + '-assignee'}>
                      <ProfileIdentity profile={{ name: task.assignee || 'Unassigned', contextLabel: task.assignee ? 'Assignee' : 'Unassigned' }} showRole={false} />
                    </td>
                    <td className="px-3 py-3 align-middle" data-ams-slug={task.slug + '-priority'}>
                      <span className={'inline-flex rounded-badge border px-2 py-0.5 text-[10px] font-semibold ' + taskPriorityClass[task.priority]}>{taskPriorityLabel[task.priority]}</span>
                    </td>
                    <td className="px-3 py-3 align-middle" data-ams-slug={task.slug + '-status'}>
                      <span className={'inline-flex items-center gap-1.5 rounded-badge border px-2 py-0.5 text-[10px] font-semibold ' + taskStatusClass[task.status]}><span className="h-1.5 w-1.5 rounded-full bg-current" />{taskStatusLabel[task.status]}{task.blocked && <span className="text-danger">· Blocked</span>}</span>
                    </td>
                    <td className="px-3 py-3 align-middle" data-ams-slug={task.slug + '-due'}>
                      <div className={'text-xs font-medium tabular-nums ' + (taskDueState(task) === 'overdue' ? 'text-danger' : taskDueState(task) === 'due-soon' ? 'text-warning' : 'text-fg')}>{formatTaskDue(task.dueDate)}</div>
                      <div className="mt-1 text-[10px] text-muted">{taskDueLabel(task)}</div>
                    </td>
                    <td className="px-4 py-3 text-right align-middle" data-ams-slug={task.slug + '-actions'}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" title="View task" aria-label={'View ' + task.title} onClick={() => setSelectedTask(task)} data-ams-slug={task.slug + '-view'} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg hover:text-fg">
                          <Eye size={14} />
                        </button>
                        {canManageTasks && task.status !== 'done' && (
                          <button type="button" title={task.status === 'todo' ? 'Start task' : task.status === 'in_progress' ? 'Move to review' : 'Mark done'} aria-label={task.status === 'todo' ? 'Start ' + task.title : task.status === 'in_progress' ? 'Move ' + task.title + ' to review' : 'Mark ' + task.title + ' done'} disabled={updatingTaskId === task.id} onClick={() => void updateTaskStatus(task, task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'review' : 'done')} data-ams-slug={task.slug + '-quick-action'} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:border-accent/30 hover:bg-bg hover:text-fg disabled:opacity-40">
                            {task.status === 'todo' ? <Clock3 size={14} /> : task.status === 'in_progress' ? <ArrowUpRight size={14} /> : <CheckCircle2 size={14} />}
                          </button>
                        )}
                        <Link to={'/admin/projects?projects=sprint&project=' + encodeURIComponent(task.projectSlug)} title="Open project delivery" aria-label={'Open project delivery for ' + task.title} data-ams-slug={task.slug + '-project-link'} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg hover:text-fg">
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

        <AdminTablePagination total={filteredRecords.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="tasks" slug="tasks-pagination" />
      </AdminPanel>

      <Modal slug="task-create-modal"
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        size="md"
        title="Create task"
        description="Add a task to an existing project delivery queue."
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setTaskFormOpen(false)} disabled={savingTask} data-ams-slug="task-create-cancel">Cancel</Button>
            <Button type="submit" variant="primary" form="tasks-create-form" loading={savingTask} data-ams-slug="task-create-submit">Create Task</Button>
          </>
        )}
      >
        <form id="tasks-create-form" onSubmit={saveNewTask} className="space-y-4" data-ams-feature-slug="task-create-form">
          <div data-ams-slug="task-create-title">
            <label htmlFor="task-title" className="text-[11px] font-medium text-muted">Task title</label>
            <input id="task-title" required value={taskForm.title} onChange={event => setTaskForm(current => ({ ...current, title: event.target.value }))} className="mt-1 h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent" placeholder="e.g. Finalize homepage responsive states" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div data-ams-slug="task-create-project"><label className="text-[11px] font-medium text-muted">Project</label><CustomSelect value={taskForm.projectId} onChange={value => setTaskForm(current => ({ ...current, projectId: value }))} options={projectOptions.map(([value, label]) => ({ value, label }))} triggerClassName="mt-1 h-9 min-h-9 w-full" /></div>
            <div data-ams-slug="task-create-assignee"><label className="text-[11px] font-medium text-muted">Assignee</label><CustomSelect value={taskForm.assignee} onChange={value => setTaskForm(current => ({ ...current, assignee: value }))} options={[{ value: '', label: 'Unassigned' }, ...assignees.map(item => ({ value: item.id, label: item.name }))]} triggerClassName="mt-1 h-9 min-h-9 w-full" /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div data-ams-slug="task-create-priority"><label className="text-[11px] font-medium text-muted">Priority</label><CustomSelect value={taskForm.priority} onChange={value => setTaskForm(current => ({ ...current, priority: value as TaskPriority }))} options={Object.entries(taskPriorityLabel).map(([value, label]) => ({ value, label }))} triggerClassName="mt-1 h-9 min-h-9 w-full" /></div>
            <div data-ams-slug="task-create-due"><label htmlFor="task-due" className="text-[11px] font-medium text-muted">Due date</label><input id="task-due" type="date" required value={taskForm.dueDate} onChange={event => setTaskForm(current => ({ ...current, dueDate: event.target.value }))} className="mt-1 h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent" /></div>
          </div>
          <div data-ams-slug="task-create-tags">
            <label htmlFor="task-tags" className="text-[11px] font-medium text-muted">Tags</label>
            <div className="relative mt-1">
              <Tag size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input id="task-tags" value={taskForm.tags} onChange={event => setTaskForm(current => ({ ...current, tags: event.target.value }))} className="h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg outline-none focus:border-accent" placeholder="qa, client, launch" />
            </div>
            <p className="mt-1 text-[10px] text-muted">Use commas to add up to six tags.</p>
          </div>
          <div data-ams-slug="task-create-subtasks">
            <label htmlFor="task-subtasks" className="text-[11px] font-medium text-muted">Subtasks</label>
            <textarea id="task-subtasks" value={taskForm.subtasks} onChange={event => setTaskForm(current => ({ ...current, subtasks: event.target.value }))} rows={3} className="mt-1 w-full resize-none rounded-control border border-line bg-bg px-3 py-2 text-xs leading-5 text-fg outline-none focus:border-accent" placeholder="One subtask per line" />
          </div>
                    <div data-ams-slug="task-create-description">
            <label htmlFor="task-description" className="text-[11px] font-medium text-muted">Description</label>
            <textarea id="task-description" value={taskForm.description} onChange={event => setTaskForm(current => ({ ...current, description: event.target.value }))} rows={4} className="mt-1 w-full resize-none rounded-control border border-line bg-bg px-3 py-2 text-xs leading-5 text-fg outline-none focus:border-accent" placeholder="Task context, acceptance note, or handoff details." />
          </div>
        </form>
      </Modal>

      <Modal slug="task-detail-modal"
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        size="lg"
        title={selectedTask?.title || 'Task details'}
        description={selectedTask ? selectedTask.projectName : undefined}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setSelectedTask(null)} data-ams-slug="task-detail-close">Close</Button>
            {selectedTask && canManageTasks && (
              <Button type="button" variant="secondary" icon={<Pencil size={14} />} onClick={() => openEditTask(selectedTask)} data-ams-slug="task-detail-edit">
                Edit
              </Button>
            )}
            {selectedTask && canManageTasks && selectedTask.status !== 'done' && (
              <Button type="button" variant="primary" icon={<CheckCircle2 size={14} />} onClick={() => void updateTaskStatus(selectedTask, 'done')} data-ams-slug="task-detail-done">
                Mark done
              </Button>
            )}
          </>
        )}
      >
        {selectedTask && (
          <div className="space-y-4" data-ams-feature-slug={selectedTask.slug + '-detail'}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-control border border-line bg-bg p-3" data-ams-slug={selectedTask.slug + '-id'}>
                <div className="text-[10px] font-medium text-muted">Task ID</div>
                <div className="mt-1 font-mono text-xs font-semibold text-fg">{selectedTask.id}</div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3" data-ams-slug={selectedTask.slug + '-status-detail'}>
                <div className="text-[10px] font-medium text-muted">Status</div>
                <span className={'mt-1 inline-flex rounded-badge border px-2 py-1 text-[10px] font-semibold ' + taskStatusClass[selectedTask.status]}>{taskStatusLabel[selectedTask.status]}</span>
              </div>
              <div className="rounded-control border border-line bg-bg p-3" data-ams-slug={selectedTask.slug + '-priority-detail'}>
                <div className="text-[10px] font-medium text-muted">Priority</div>
                <span className={'mt-1 inline-flex rounded-badge border px-2 py-1 text-[10px] font-semibold ' + taskPriorityClass[selectedTask.priority]}>{taskPriorityLabel[selectedTask.priority]}</span>
              </div>
              <div className="rounded-control border border-line bg-bg p-3" data-ams-slug={selectedTask.slug + '-due-detail'}>
                <div className="text-[10px] font-medium text-muted">Due date</div>
                <div className="mt-1 text-xs font-semibold tabular-nums text-fg">{formatTaskDue(selectedTask.dueDate)}</div>
                <div className="mt-1 text-[10px] text-muted">{taskDueLabel(selectedTask)}</div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3" data-ams-slug={selectedTask.slug + '-assignee-detail'}>
                <div className="text-[10px] font-medium text-muted">Assignee</div>
                <div className="mt-1"><ProfileIdentity profile={{ name: selectedTask.assignee || 'Unassigned', contextLabel: 'Assignee' }} showRole={false} /></div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3" data-ams-slug={selectedTask.slug + '-client-detail'}>
                <div className="text-[10px] font-medium text-muted">Client</div>
                <div className="mt-1 text-xs font-semibold text-fg">{selectedTask.clientName || 'Internal'}</div>
              </div>
            </div>

            {selectedTask.description && (
              <div className="rounded-card border border-line bg-bg p-4" data-ams-slug={selectedTask.slug + '-description'}>
                <div className="text-[11px] font-semibold text-fg">Description</div>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted">{selectedTask.description}</p>
              </div>
            )}

            <div className="rounded-card border border-line bg-bg p-4" data-ams-slug={selectedTask.slug + '-flow'}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] font-semibold text-fg">Task flow</span>
                <span className="font-mono text-[9px] text-muted/70">slug: {selectedTask.slug}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(['todo', 'in_progress', 'review', 'done'] as TaskStatus[]).map(status => (
                  <button
                    key={status}
                    type="button"
                    disabled={!canManageTasks || updatingTaskId === selectedTask.id}
                    onClick={() => void updateTaskStatus(selectedTask, status)}
                    data-ams-slug={selectedTask.slug + '-flow-' + status}
                    className={'min-h-9 rounded-control border px-2 text-[10px] font-semibold transition-colors ' + (selectedTask.status === status ? taskStatusClass[status] : 'border-line bg-panel text-muted hover:text-fg') + ((!canManageTasks || updatingTaskId === selectedTask.id) ? ' opacity-50' : '')}
                  >
                    {taskStatusLabel[status]}
                  </button>
                ))}
              </div>
            </div>

            {selectedTask.subtasks.length > 0 && (
              <div className="rounded-card border border-line bg-bg p-4" data-ams-slug={selectedTask.slug + '-subtasks'}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-fg"><CheckCircle2 size={13} /> Subtasks</div>
                  <span className="text-[10px] tabular-nums text-muted">
                    {selectedTask.subtasks.filter(item => item.completed).length}/{selectedTask.subtasks.length} done
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {selectedTask.subtasks.map(item => (
                    <div key={item.id} data-ams-slug={selectedTask.slug + '-subtask-' + slugify(item.id)} className="flex items-start gap-2 rounded-control border border-line bg-panel px-3 py-2">
                      <span className={'mt-0.5 h-4 w-4 shrink-0 rounded-full border ' + (item.completed ? 'border-success bg-success/10 text-success' : 'border-line text-muted')}>
                        {item.completed ? <CheckCircle2 size={12} className="m-[1px]" /> : null}
                      </span>
                      <span className={'text-xs leading-5 ' + (item.completed ? 'text-muted line-through' : 'text-fg')}>{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTask.tags.length > 0 && (
              <div className="rounded-card border border-line bg-bg p-4" data-ams-slug={selectedTask.slug + '-tags'}>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-fg"><Tag size={13} /> Tags</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedTask.tags.map(tag => <span key={tag} data-ams-slug={selectedTask.slug + '-tag-' + slugify(tag)} className="rounded-badge border border-line bg-panel px-2 py-1 text-[10px] text-muted">{tag}</span>)}
                </div>
              </div>
            )}

            <Link
              to={'/admin/projects?projects=sprint&project=' + encodeURIComponent(selectedTask.projectSlug)}
              onClick={() => setSelectedTask(null)}
              data-ams-slug={selectedTask.slug + '-open-project'}
              className="inline-flex min-h-9 items-center gap-2 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover"
            >
              <FolderKanban size={14} />
              Open project delivery
              <ArrowUpRight size={13} className="text-muted" />
            </Link>

            {selectedTask.blocked && (
              <div className="rounded-card border border-danger/20 bg-danger/5 p-3 text-xs text-danger" data-ams-slug={selectedTask.slug + '-blocked-warning'}>
                This task is blocked and needs its dependency cleared before completion.
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal slug="task-edit-modal"
        open={Boolean(editingTask)}
        onClose={() => { if (!savingEditTask) setEditingTask(null); }}
        size="lg"
        title="Edit task"
        description={editingTask ? editingTask.projectName : undefined}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setEditingTask(null)} disabled={savingEditTask} data-ams-slug="task-edit-cancel">Cancel</Button>
            <Button type="submit" variant="primary" form="tasks-edit-form" loading={savingEditTask} data-ams-slug="task-edit-submit">Save changes</Button>
          </>
        )}
      >
        <form id="tasks-edit-form" onSubmit={saveTaskEdit} className="space-y-4" data-ams-feature-slug="task-edit-form">
          <div data-ams-slug="task-edit-title">
            <label htmlFor="task-edit-title-input" className="text-[11px] font-medium text-muted">Task title</label>
            <input id="task-edit-title-input" required value={taskEditForm.title} onChange={event => setTaskEditForm(current => ({ ...current, title: event.target.value }))} className="mt-1 h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div data-ams-slug="task-edit-assignee">
              <label className="text-[11px] font-medium text-muted">Assignee</label>
              <CustomSelect value={taskEditForm.assignee} onChange={value => setTaskEditForm(current => ({ ...current, assignee: value }))} options={[{ value: '', label: 'Unassigned' }, ...assignees.map(item => ({ value: item.id, label: item.name }))]} triggerClassName="mt-1 h-9 min-h-9 w-full" />
            </div>
            <div data-ams-slug="task-edit-priority">
              <label className="text-[11px] font-medium text-muted">Priority</label>
              <CustomSelect value={taskEditForm.priority} onChange={value => setTaskEditForm(current => ({ ...current, priority: value as TaskPriority }))} options={Object.entries(taskPriorityLabel).map(([value, label]) => ({ value, label }))} triggerClassName="mt-1 h-9 min-h-9 w-full" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div data-ams-slug="task-edit-due">
              <label htmlFor="task-edit-due-input" className="text-[11px] font-medium text-muted">Due date</label>
              <input id="task-edit-due-input" type="date" required value={taskEditForm.dueDate} onChange={event => setTaskEditForm(current => ({ ...current, dueDate: event.target.value }))} className="mt-1 h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent" />
            </div>
            <div data-ams-slug="task-edit-tags">
              <label htmlFor="task-edit-tags-input" className="text-[11px] font-medium text-muted">Tags</label>
              <input id="task-edit-tags-input" value={taskEditForm.tags} onChange={event => setTaskEditForm(current => ({ ...current, tags: event.target.value }))} className="mt-1 h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent" placeholder="qa, client, launch" />
            </div>
          </div>
          <div data-ams-slug="task-edit-subtasks">
            <label htmlFor="task-edit-subtasks-input" className="text-[11px] font-medium text-muted">Subtasks</label>
            <textarea id="task-edit-subtasks-input" value={taskEditForm.subtasks} onChange={event => setTaskEditForm(current => ({ ...current, subtasks: event.target.value }))} rows={4} className="mt-1 w-full resize-none rounded-control border border-line bg-bg px-3 py-2 text-xs leading-5 text-fg outline-none focus:border-accent" placeholder="One subtask per line" />
          </div>
          <div data-ams-slug="task-edit-description">
            <label htmlFor="task-edit-description-input" className="text-[11px] font-medium text-muted">Description</label>
            <textarea id="task-edit-description-input" value={taskEditForm.description} onChange={event => setTaskEditForm(current => ({ ...current, description: event.target.value }))} rows={5} className="mt-1 w-full resize-none rounded-control border border-line bg-bg px-3 py-2 text-xs leading-5 text-fg outline-none focus:border-accent" placeholder="Task context, acceptance note, or handoff details." />
          </div>
        </form>
      </Modal>
    </AdminPageShell>
  );
};

export default TasksWorkspace;
