import React, { useMemo, useState } from 'react';
import { useReportingPeriod } from '../../lib/ReportingPeriodContext';
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
  AgencyProject,
  ProjectTask,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from '../../lib/projectStore';
import { useLanguage } from '../../lib/LanguageContext';
import { AgencyClient } from '../../lib/clientStore';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { AdminFilterBar, AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminPanel, AdminStatusBadge, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';
import { api } from '../../lib/apiClient';
import { formatAmount, getActiveCurrency, CURRENCY_EVENT, CurrencyCode } from '../../lib/currency';
import { hasAdminPermission } from '../../lib/adminAuth';
import { useDragToScroll } from '../../lib/useDragToScroll';

type ProjectHealth = 'Good' | 'At Risk' | 'Delayed' | 'Blocked';
type ProjectRecord = AgencyProject & {
  health?: ProjectHealth;
  slug: string;
};

type ProjectsView = 'all' | 'sprint' | 'budget' | 'archived';
type ProjectLayout = 'board' | 'table' | 'timeline';

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

const todayIso = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toFiniteNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

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

const isUnknownMutationOutcome = (response: { success: boolean; status?: number }) =>
  !response.success && (response.status === undefined || response.status >= 500);

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
    budget: Math.max(0, toFiniteNumber(project?.budget)),
    progressPercent: Math.min(100, Math.max(0, toFiniteNumber(project?.progressPercent))),
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


const PROJECT_TIMELINE_TONES: Record<ProjectStatus, { bar: string; dot: string }> = {
  planning: { bar: 'border-info/35 bg-info/15 text-info', dot: 'bg-info' },
  in_progress: { bar: 'border-accent/40 bg-accent/15 text-accent-text', dot: 'bg-accent' },
  review: { bar: 'border-warning/35 bg-warning/15 text-warning', dot: 'bg-warning' },
  completed: { bar: 'border-success/35 bg-success/15 text-success', dot: 'bg-success' },
  on_hold: { bar: 'border-danger/35 bg-danger/15 text-danger', dot: 'bg-danger' },
};

const parseTimelineDate = (value?: string | null): number | null => {
  if (!value) return null;
  const parsed = Date.parse(String(value).slice(0, 10) + 'T00:00:00Z');
  return Number.isFinite(parsed) ? parsed : null;
};

interface ProjectTimelineProps {
  projects: ProjectRecord[];
  activeFilterCount: number;
  onClearFilters: () => void;
  onOpenProject: (project: ProjectRecord) => void;
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  projects,
  activeFilterCount,
  onClearFilters,
  onOpenProject,
}) => {
  const dayMs = 24 * 60 * 60 * 1000;
  const todayMs = parseTimelineDate(todayIso()) ?? Date.now();
  const rows = projects.map((project) => {
    const parsedStart = parseTimelineDate(project.startDate);
    const parsedCreated = parseTimelineDate(project.createdAt);
    const startMs = parsedStart ?? parsedCreated ?? todayMs;
    const parsedEnd = parseTimelineDate(project.targetEndDate);
    const endMs = parsedEnd !== null && parsedEnd >= startMs ? parsedEnd : startMs + 14 * dayMs;
    return {
      project,
      startMs,
      endMs,
      estimatedDates: parsedStart === null || parsedEnd === null || parsedEnd < startMs,
    };
  });

  if (!rows.length) {
    return (
      <div role="status" className="m-3 flex flex-col items-start gap-3 rounded-control border border-line bg-bg p-5 sm:m-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-fg">No projects to place on the timeline</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {activeFilterCount > 0
              ? 'Adjust the project filters or reset them to see the full portfolio.'
              : 'Create a project with start and target dates to plan its delivery.'}
          </p>
        </div>
        {activeFilterCount > 0 && (
          <Button type="button" variant="secondary" onClick={onClearFilters}>Reset filters</Button>
        )}
      </div>
    );
  }

  const rangeStart = Math.floor(Math.min(...rows.map((row) => row.startMs)) / dayMs) * dayMs - 7 * dayMs;
  const rangeEnd = Math.floor(Math.max(...rows.map((row) => row.endMs)) / dayMs) * dayMs + 8 * dayMs;
  const rangeDays = Math.max(1, Math.ceil((rangeEnd - rangeStart) / dayMs));
  const rangeWidth = Math.max(900, Math.min(2400, rangeDays * 16));
  const weekStep = Math.max(1, (rangeWidth / rangeDays) * 7);
  const todayPosition = ((todayMs - rangeStart) / (rangeEnd - rangeStart)) * 100;
  const monthTicks: Array<{ key: string; left: number; label: string }> = [];
  const monthCursor = new Date(rangeStart);
  monthCursor.setUTCDate(1);
  monthCursor.setUTCHours(0, 0, 0, 0);
  while (monthCursor.getTime() < rangeEnd) {
    const timestamp = monthCursor.getTime();
    monthTicks.push({
      key: monthCursor.toISOString().slice(0, 7),
      left: Math.max(0, ((timestamp - rangeStart) / (rangeEnd - rangeStart)) * 100),
      label: monthCursor.toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' }),
    });
    monthCursor.setUTCMonth(monthCursor.getUTCMonth() + 1);
  }

  return (
    <section className="min-w-0" aria-label="Project Gantt timeline" data-ams-feature-slug="projects-gantt-timeline" data-ams-slug="projects-gantt-timeline">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2.5 text-[11px] text-muted sm:px-4">
        <span>Schedule range: {new Date(rangeStart).toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' })} – {new Date(rangeEnd).toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' })}</span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-info" /> Planning</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-accent" /> In progress</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-warning" /> Review</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-success" /> Completed</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-danger" /> On hold</span>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar" tabIndex={0} role="region" aria-label="Scrollable project schedule">
        <div className="min-w-max">
          <div className="flex border-b border-line bg-panel">
            <div className="sticky left-0 z-30 flex h-11 w-[260px] shrink-0 items-center border-r border-line bg-panel px-3.5 text-[11px] font-medium text-muted">
              Project / owner
            </div>
            <div className="relative h-11 shrink-0" style={{ width: rangeWidth }}>
              {monthTicks.map((tick) => (
                <div key={tick.key} className="absolute inset-y-0 border-l border-line/80 pl-2 pt-3 text-[10px] font-medium text-muted" style={{ left: tick.left + '%' }}>
                  <span className="whitespace-nowrap">{tick.label}</span>
                </div>
              ))}
              {todayPosition >= 0 && todayPosition <= 100 && (
                <div className="absolute inset-y-0 z-10 border-l border-dashed border-warning" style={{ left: todayPosition + '%' }}>
                  <span className="absolute left-1 top-0.5 whitespace-nowrap rounded-badge border border-warning/30 bg-panel px-1 py-0.5 text-[10px] font-semibold text-warning">Today</span>
                </div>
              )}
            </div>
          </div>

          {rows.map((row) => {
            const tone = PROJECT_TIMELINE_TONES[row.project.status];
            const statusLabel = PROJECT_STATUSES.find((item) => item.value === row.project.status)?.label || row.project.status;
            const left = ((row.startMs - rangeStart) / (rangeEnd - rangeStart)) * 100;
            const width = ((row.endMs + dayMs - row.startMs) / (rangeEnd - rangeStart)) * 100;
            const overdue = row.project.status !== 'completed' && row.endMs < todayMs;
            const title = row.project.name + ': ' + formatDate(row.project.startDate || '') + ' to ' + formatDate(row.project.targetEndDate || '');
            return (
              <div key={row.project.id} className="group flex border-b border-line/70 hover:bg-panel-hover/40">
                <button
                  type="button"
                  onClick={() => onOpenProject(row.project)}
                  className="sticky left-0 z-20 flex min-h-[62px] w-[260px] shrink-0 items-center gap-2.5 border-r border-line bg-panel px-3.5 text-left transition-colors hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                  aria-label={'Open project ' + row.project.name}
                >
                  <span className={'h-2 w-2 shrink-0 rounded-full ' + tone.dot} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-fg">{row.project.name}</span>
                    <span className="mt-1 block truncate text-[10px] text-muted">
                      {row.project.teamLead || 'Owner unassigned'} · {statusLabel} · {row.project.progressPercent}%
                    </span>
                    <span className={'mt-0.5 block truncate text-[10px] ' + (overdue ? 'text-danger' : 'text-muted')}>
                      {row.project.startDate ? formatDate(row.project.startDate) : 'Start date not set'} → {row.project.targetEndDate ? formatDate(row.project.targetEndDate) : 'Deadline not set'}
                      {row.estimatedDates ? ' · estimated range' : ''}
                    </span>
                  </span>
                  <ArrowUpRight size={13} className="shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                </button>

                <div
                  className="relative min-h-[62px] shrink-0 border-b border-line/40"
                  style={{
                    width: rangeWidth,
                    backgroundImage: 'repeating-linear-gradient(to right, var(--line) 0, var(--line) 1px, transparent 1px, transparent ' + weekStep + 'px)',
                  }}
                >
                  {todayPosition >= 0 && todayPosition <= 100 && (
                    <div className="pointer-events-none absolute inset-y-0 z-10 border-l border-dashed border-warning/50" style={{ left: todayPosition + '%' }} aria-hidden="true" />
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenProject(row.project)}
                    title={title}
                    aria-label={'Open ' + title}
                    className={'absolute top-[17px] z-20 flex h-7 min-w-[30px] items-center gap-1.5 overflow-hidden rounded-control border px-2 text-[10px] font-semibold shadow-none transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' + tone.bar}
                    style={{ left: left + '%', width: Math.max(1.5, width) + '%' }}
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
                    <span className="truncate tabular-nums">{row.project.progressPercent}%</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="border-t border-line px-3 py-2.5 text-[10px] leading-4 text-muted sm:px-4">
        Select a project row or timeline bar to open its existing detail view. Drag-and-drop status changes remain available in Kanban.
      </p>
    </section>
  );
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
  const { matchesDate, matchesInterval, value: reportPeriodValue, enabled: reportPeriodEnabled } = useReportingPeriod();
  const { language } = useLanguage();
  const canManageProjects = hasAdminPermission('canManageProjects');
  const canReadClients = hasAdminPermission('canManageClients') || hasAdminPermission('canManageCrm');
  const canManageKanbanTasks = hasAdminPermission('canManageKanbanTasks');
  const canManageTasks = canManageKanbanTasks;
  const [searchParams, setSearchParams] = useSearchParams();
  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectExpenses, setProjectExpenses] = useState<any[] | null>(null);
  const [expenseLoading, setExpenseLoading] = useState(true);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverMode, setServerMode] = useState(false);
  const serverModeRef = React.useRef(false);
  const setServerConnected = (connected: boolean) => {
    serverModeRef.current = connected;
    setServerMode(connected);
  };
  const [saving, setSaving] = useState(false);
  const [clientOptions, setClientOptions] = useState<AgencyClient[]>([]);
  const [clientOptionsLoading, setClientOptionsLoading] = useState(false);
  const [clientOptionsError, setClientOptionsError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = React.useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('');
  const [projectHealthFilter, setProjectHealthFilter] = useState('');
  const [projectClientFilter, setProjectClientFilter] = useState('');
  const [projectOwnerFilter, setProjectOwnerFilter] = useState('');
  const [projectSort, setProjectSort] = useState('updated');
  const [projectTablePage, setProjectTablePage] = useState(1);
  const [projectTablePageSize, setProjectTablePageSize] = useState(10);
  const [budgetTablePage, setBudgetTablePage] = useState(1);
  const [budgetTablePageSize, setBudgetTablePageSize] = useState(10);
  const [archiveTablePage, setArchiveTablePage] = useState(1);
  const [archiveTablePageSize, setArchiveTablePageSize] = useState(10);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveHealthFilter, setArchiveHealthFilter] = useState('');
  const [projectLayout, setProjectLayout] = useState<ProjectLayout>(
    searchParams.get('layout') === 'table' ? 'table' : searchParams.get('layout') === 'timeline' ? 'timeline' : 'board'
  );
  const projectKanbanScrollRef = useDragToScroll<HTMLDivElement>();
  const taskKanbanScrollRef = useDragToScroll<HTMLDivElement>();

  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);
  const [dragOverProjectStatus, setDragOverProjectStatus] = useState<ProjectStatus | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [updatingSubtaskId, setUpdatingSubtaskId] = useState<string | null>(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('');
  const [taskSort, setTaskSort] = useState('priority');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverTaskStatus, setDragOverTaskStatus] = useState<TaskStatus | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [deleteProject, setDeleteProject] = useState<ProjectRecord | null>(null);
  const [deleteTask, setDeleteTask] = useState<ProjectTask | null>(null);
  const [deletingProjectRecord, setDeletingProjectRecord] = useState(false);
  const [deletingTaskRecord, setDeletingTaskRecord] = useState(false);

  const requestedView = searchParams.get('projects');
  const view: ProjectsView = requestedView === 'sprint' || requestedView === 'budget' || requestedView === 'archived'
    ? requestedView
    : 'all';
  const selectedProjectSlug = searchParams.get('project') || '';

  React.useEffect(() => {
    if (requestedView && !['sprint', 'budget', 'archived'].includes(requestedView)) {
      const next = new URLSearchParams(searchParams);
      next.delete('projects');
      setSearchParams(next, { replace: true });
    }
  }, [requestedView, searchParams, setSearchParams]);

  React.useEffect(() => {
    const requestedLayout = searchParams.get('layout');
    setProjectLayout(requestedLayout === 'table' ? 'table' : requestedLayout === 'timeline' ? 'timeline' : 'board');
  }, [searchParams]);

  const [projectForm, setProjectForm] = useState({
    name: '',
    clientId: '',
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

  const loadProjectClients = async () => {
    if (!canReadClients) return;
    setClientOptionsLoading(true);
    setClientOptionsError(null);
    try {
      const response = await api.clients.getAll();
      if (!response.success || !Array.isArray(response.data?.clients)) {
        setClientOptionsError(response.error || 'Client records could not be loaded.');
        return;
      }
      setClientOptions(response.data.clients as AgencyClient[]);
    } catch (error) {
      setClientOptionsError(error instanceof Error ? error.message : 'Client records could not be loaded.');
    } finally {
      setClientOptionsLoading(false);
    }
  };

  const showToast = (message: string) => {
    if (toastTimeoutRef.current !== null) window.clearTimeout(toastTimeoutRef.current);
    setToast(message);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 3200);
  };

  const syncProjects = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.projects.getAll();
      // An empty array is a valid server response. Never replace it with demo records.
      if (response.success && Array.isArray(response.data?.projects)) {
        const serverProjects = response.data.projects.map(normalizeProject);
        setProjects(serverProjects);
        setServerConnected(true);
        setError(null);
        return true;
      }

      setError(response.error || 'Project service is unavailable. Refresh after the connection is restored.');
      if (!serverModeRef.current) {
        setServerConnected(false);
        setProjects([]);
      }
      return false;
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Project service is unavailable. Refresh after the connection is restored.');
      if (!serverModeRef.current) {
        setServerConnected(false);
        setProjects([]);
      }
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  React.useEffect(() => {
    void syncProjects();
    const handleCurrency = (event: Event) => {
      const detail = (event as CustomEvent<{ currency?: CurrencyCode }>).detail;
      setCurrency(detail?.currency || getActiveCurrency());
    };
    window.addEventListener(CURRENCY_EVENT, handleCurrency);
    return () => {
      window.removeEventListener(CURRENCY_EVENT, handleCurrency);
      if (toastTimeoutRef.current !== null) window.clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    api.finance.getExpenses()
      .then((response) => {
        if (!mounted) return;
        if (response.success && Array.isArray(response.data?.expenses)) {
          setProjectExpenses(response.data.expenses);
          setExpenseError(null);
        } else {
          setProjectExpenses(null);
          setExpenseError(response.error || 'Finance expense records are unavailable for this role.');
        }
      })
      .catch((requestError) => {
        if (!mounted) return;
        setProjectExpenses(null);
        setExpenseError(requestError instanceof Error ? requestError.message : 'Finance expense records are unavailable.');
      })
      .finally(() => { if (mounted) setExpenseLoading(false); });
    return () => { mounted = false; };
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
    () => projects.filter(project => project.status !== 'completed' && matchesInterval(project.startDate, project.targetEndDate, project.createdAt)),
    [projects, matchesInterval]
  );

  const archivedProjects = useMemo(
    () => projects.filter(project => project.status === 'completed' && matchesInterval(project.startDate, project.targetEndDate, project.createdAt)),
    [projects, matchesInterval]
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
      const matchesPeriod = matchesInterval(project.startDate, project.targetEndDate, project.createdAt);
      return matchesQuery && matchesStatus && matchesHealth && matchesClient && matchesOwner && matchesPeriod;
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
    matchesInterval,
  ]);

  const projectTablePageCount = Math.max(1, Math.ceil(filteredProjects.length / projectTablePageSize));
  const pagedProjectTableRows = filteredProjects.slice((projectTablePage - 1) * projectTablePageSize, projectTablePage * projectTablePageSize);
  React.useEffect(() => { setProjectTablePage((page) => Math.min(page, projectTablePageCount)); }, [projectTablePageCount]);
  React.useEffect(() => { setProjectTablePage(1); }, [projectSearch, projectStatusFilter, projectHealthFilter, projectClientFilter, projectOwnerFilter, projectSort, reportPeriodValue, reportPeriodEnabled]);

  const clearProjectFilters = () => {
    setProjectSearch('');
    setProjectStatusFilter('');
    setProjectHealthFilter('');
    setProjectClientFilter('');
    setProjectOwnerFilter('');
    setProjectSort('updated');
  };

  const selectedSprintProject = useMemo(() => {
    return (
      projects.find(project => project.slug === selectedProjectSlug) ||
      activeProjects[0] ||
      projects[0] ||
      null
    );
  }, [activeProjects, projects, selectedProjectSlug]);

  React.useEffect(() => {
    if (!selectedTask) return;
    const latestTask = selectedSprintProject?.tasks.find(task => task.id === selectedTask.id);
    if (!latestTask) {
      setSelectedTask(null);
      return;
    }
    setSelectedTask(current => current && current.id === latestTask.id && current !== latestTask ? latestTask : current);
  }, [selectedSprintProject, selectedTask?.id]);

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
        return matchesQuery && matchesPriority && matchesAssignee && matchesDate(task.dueDate || task.createdAt);
      })
      .sort((a, b) => {
        if (taskSort === 'due') {
          return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31')
            || a.title.localeCompare(b.title);
        }
        if (taskSort === 'title') return a.title.localeCompare(b.title);
        if (taskSort === 'created') {
          return (b.createdAt || '').localeCompare(a.createdAt || '')
            || a.title.localeCompare(b.title);
        }

        // The board renders one lane per status. Keep the comparator transitive,
        // then sort each lane by priority and due date.
        const statusOrder = TASK_COLUMNS.findIndex(column => column.id === a.status)
          - TASK_COLUMNS.findIndex(column => column.id === b.status);
        if (statusOrder !== 0) return statusOrder;

        return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]
          || (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31')
          || a.title.localeCompare(b.title);
      });
  }, [selectedSprintProject, taskSearch, taskPriorityFilter, taskAssigneeFilter, taskSort, matchesDate]);

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
    const averageProgress = activeProjects.length ? Math.round(totalProgress / activeProjects.length) : 0;
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
      averageProgress,
      risks,
      openTasks,
      assignedPeople: assignedPeople.size,
      milestonesAtRisk,
    };
  }, [activeProjects]);

  const recordedExpenseTotals = useMemo(() => {
    if (projectExpenses === null) return null;
    const totals = new Map<string, { amount: number; count: number }>();
    projectExpenses.forEach((expense) => {
      const projectId = String(expense.projectId || '').trim();
      const status = String(expense.status || '').toLowerCase();
      const expenseCurrency = String(expense.currency || 'IDR').toUpperCase();
      if (!projectId || ['voided', 'cancelled', 'canceled', 'deleted'].includes(status) || expenseCurrency !== currency.toUpperCase()) return;
      const current = totals.get(projectId) || { amount: 0, count: 0 };
      current.amount += Math.max(0, toFiniteNumber(expense.amount));
      current.count += 1;
      totals.set(projectId, current);
    });
    return totals;
  }, [projectExpenses, currency]);

  const getRecordedExpense = (projectId: string) => {
    if (recordedExpenseTotals === null) return null;
    return recordedExpenseTotals.get(projectId)?.amount || 0;
  };

  const budgetRows = useMemo(
    () => filteredProjects.map((project) => {
      const actual = getRecordedExpense(project.id);
      return {
        project,
        actual,
        remaining: actual === null ? null : project.budget - actual,
        variance: actual === null ? null : project.budget - actual,
        expenseCount: recordedExpenseTotals?.get(project.id)?.count || 0,
      };
    }),
    [filteredProjects, recordedExpenseTotals]
  );

  const budgetTablePageCount = Math.max(1, Math.ceil(budgetRows.length / budgetTablePageSize));
  const pagedBudgetRows = budgetRows.slice((budgetTablePage - 1) * budgetTablePageSize, budgetTablePage * budgetTablePageSize);
  const archiveTablePageCount = Math.max(1, Math.ceil(filteredArchivedProjects.length / archiveTablePageSize));
  const pagedArchiveTableRows = filteredArchivedProjects.slice((archiveTablePage - 1) * archiveTablePageSize, archiveTablePage * archiveTablePageSize);
  React.useEffect(() => { setBudgetTablePage((page) => Math.min(page, budgetTablePageCount)); }, [budgetTablePageCount]);
  React.useEffect(() => { setBudgetTablePage(1); }, [currency, projectSearch, projectStatusFilter, projectHealthFilter, projectClientFilter, projectOwnerFilter, projectSort]);
  React.useEffect(() => { setArchiveTablePage((page) => Math.min(page, archiveTablePageCount)); }, [archiveTablePageCount]);
  React.useEffect(() => { setArchiveTablePage(1); }, [archiveSearch, archiveHealthFilter]);

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
    if (!canManageProjects || saving) return;
    setEditingProject(null);
    setProjectForm({
      name: '',
      clientId: '',
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
    void loadProjectClients();
  };

  const openEditProject = (project: ProjectRecord) => {
    if (!canManageProjects || saving) return;
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      clientId: project.clientId || '',
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
    void loadProjectClients();
  };

  const saveProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageProjects || saving) return;
    if (!projectForm.name.trim() || !projectForm.clientCompany.trim()) {
      showToast('Project name and client company are required.');
      return;
    }

    const budget = Number(projectForm.budget || 0);
    const progress = Number(projectForm.progressPercent || 0);
    if (!Number.isFinite(budget) || budget < 0 || budget > 100_000_000_000 || !Number.isFinite(progress) || progress < 0 || progress > 100) {
      showToast('Enter a valid budget and progress between 0 and 100%.');
      return;
    }
    if (projectForm.startDate && projectForm.targetEndDate && projectForm.targetEndDate < projectForm.startDate) {
      showToast('Project deadline must be on or after the start date.');
      return;
    }

    const now = new Date().toISOString();
    const slug = slugify(projectForm.name);
    const projectDraft: ProjectRecord = normalizeProject({
      ...(editingProject || {}),
      id: editingProject?.id || '',
      name: projectForm.name.trim(),
      clientId: projectForm.clientId || undefined,
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
      // Preserve the server timestamp as the optimistic-concurrency token on edits.
      // The server will issue the new updatedAt value after a successful write.
      updatedAt: editingProject?.updatedAt || now,
      milestones: editingProject?.milestones || [],
      tasks: editingProject?.tasks || [],
      slug,
    });

    setSaving(true);
    let savedToData = false;
    try {
      const payload = { ...projectDraft, id: editingProject?.id || '' };
      const response = editingProject
        ? await api.projects.update(editingProject.id, payload)
        : await api.projects.create(payload);

      if (response.success) {
        const persistedProject = response.data?.project ? normalizeProject(response.data.project) : null;
        if (!persistedProject) {
          await syncProjects(false);
          showToast(language === 'id'
            ? 'Server tidak mengembalikan data proyek yang tersimpan. Periksa daftar proyek sebelum mencoba lagi.'
            : 'The server did not return the saved project record. Review the refreshed project list before retrying.');
          return;
        }
        setServerConnected(true);
        setProjects(current => editingProject
          ? current.map(item => item.id === editingProject.id ? persistedProject : item)
          : [persistedProject, ...current.filter(item => item.id !== persistedProject.id)]);
        await syncProjects(false);
        showToast(language === 'id' ? 'Proyek berhasil disimpan.' : 'Project saved.');
        savedToData = true;
      } else {
        if (isUnknownMutationOutcome(response)) {
          await syncProjects(false);
          setProjectDrawerOpen(false);
        }
        showToast(response.error || (language === 'id' ? 'Proyek gagal disimpan.' : 'Project could not be saved.'));
        return;
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : (language === 'id' ? 'Proyek gagal disimpan.' : 'Project could not be saved.'));
      return;
    } finally {
      setSaving(false);
      if (savedToData) setProjectDrawerOpen(false);
    }
  };

  // Task creation entry point
  const handleAddTask = (status: TaskStatus = 'todo') => {
    if (!canManageKanbanTasks || saving || movingTaskId || updatingSubtaskId) return;
    if (!selectedSprintProject) {
      showToast('Select a project first.');
      return;
    }
    if (selectedSprintProject.status === 'completed') {
      showToast('Completed projects cannot receive new tasks.');
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
    if (!canManageKanbanTasks || saving || movingTaskId || updatingSubtaskId) return;
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
    if (!canManageKanbanTasks || saving || movingTaskId || updatingSubtaskId) return;
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

    const taskDraft: ProjectTask = {
      id: editingTask?.id || '',
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
    let savedToData = false;
    try {
      const payload = {
        title: taskDraft.title,
        description: taskDraft.description || '',
        projectId: project.id,
        projectName: project.name,
        assignee: taskDraft.assignedTo,
        priority: taskDraft.priority,
        status: taskDraft.status,
        dueDate: taskDraft.dueDate,
        tags: taskDraft.tags || [],
        subtasks: taskDraft.subtasks || [],
      };
      const response = editingTask
        ? await api.tasks.update(editingTask.id, payload)
        : await api.tasks.create(payload);

      if (!response.success) {
        if (isUnknownMutationOutcome(response)) {
          await syncProjects(false);
          setTaskDrawerOpen(false);
        }
        showToast(response.error || (language === 'id' ? 'Tugas gagal disimpan.' : 'Task could not be saved.'));
        return;
      }
      const persistedTask = response.data?.task ? normalizeTask(response.data.task) : null;
      if (!persistedTask) {
        await syncProjects(false);
        showToast(language === 'id'
          ? 'Server tidak mengembalikan data tugas yang tersimpan. Periksa daftar tugas sebelum mencoba lagi.'
          : 'The server did not return the saved task record. Review the refreshed task list before retrying.');
        return;
      }

      setServerConnected(true);
      setProjects(current => current.map(item => {
        if (item.id !== project.id) return item;
        const tasks = editingTask
          ? item.tasks.map(task => task.id === editingTask.id ? persistedTask : task)
          : [persistedTask, ...item.tasks.filter(task => task.id !== persistedTask.id)];
        return { ...item, tasks, updatedAt: new Date().toISOString() };
      }));
      await syncProjects(false);
      showToast(language === 'id' ? 'Tugas berhasil disimpan.' : 'Task saved.');
      savedToData = true;
    } catch (error) {
      showToast(error instanceof Error
        ? error.message
        : (language === 'id' ? 'Tugas gagal disimpan. Periksa koneksi lalu coba lagi.' : 'Task could not be saved. Check your connection and try again.'));
    } finally {
      setSaving(false);
      if (savedToData) setTaskDrawerOpen(false);
    }
  };

  // Drag & Drop Handlers
  const updateTaskStatus = async (task: ProjectTask, status: TaskStatus) => {
    if (!canManageKanbanTasks || movingTaskId || updatingSubtaskId) {
      setDraggingTaskId(null);
      setDragOverTaskStatus(null);
      setDragOverTaskId(null);
      return;
    }
    if (!serverModeRef.current) {
      setDraggingTaskId(null);
      setDragOverTaskStatus(null);
      setDragOverTaskId(null);
      showToast('Project service is unavailable. Refresh before changing task status.');
      return;
    }
    if (!selectedSprintProject || task.status === status) {
      setDraggingTaskId(null);
      setDragOverTaskStatus(null);
      setDragOverTaskId(null);
      return;
    }

    const projectId = selectedSprintProject.id;
    setDraggingTaskId(null);
    setDragOverTaskStatus(null);
    setDragOverTaskId(null);
    setMovingTaskId(task.id);
    setProjects(current => current.map(project => project.id === projectId
      ? { ...project, tasks: project.tasks.map(item => item.id === task.id ? { ...item, status } : item), updatedAt: new Date().toISOString() }
      : project));
    setSelectedTask(current => current?.id === task.id ? { ...current, status } : current);

    const rollback = () => {
      setProjects(current => current.map(project => project.id === projectId
        ? { ...project, tasks: project.tasks.map(item => item.id === task.id ? { ...item, status: task.status } : item) }
        : project));
      setSelectedTask(current => current?.id === task.id ? { ...current, status: task.status } : current);
    };
    try {
      const response = await api.tasks.update(task.id, { status });
      if (!response.success) {
        if (isUnknownMutationOutcome(response)) {
          const refreshed = await syncProjects(false);
          if (!refreshed) rollback();
          showToast(response.error || (language === 'id' ? 'Hasil perubahan status tugas belum dapat dipastikan. Data telah dimuat ulang.' : 'Task status outcome is unknown. Canonical records were refreshed.'));
          return;
        }
        rollback();
        showToast(response.error || (language === 'id' ? 'Status tugas gagal diperbarui. Perubahan dikembalikan.' : 'Task status could not be saved. Changes were reverted.'));
        return;
      }
      setServerConnected(true);
      await syncProjects(false);
      showToast(language === 'id' ? 'Status tugas diperbarui.' : 'Task status updated.');
    } catch (error) {
      rollback();
      showToast(error instanceof Error ? error.message : (language === 'id' ? 'Status tugas gagal diperbarui. Perubahan dikembalikan.' : 'Task status could not be saved. Changes were reverted.'));
    } finally {
      setMovingTaskId(null);
    }
  };

  const beginProjectDrag = (event: React.DragEvent<HTMLElement>, project: ProjectRecord) => {
    if (!canManageProjects || movingProjectId) {
      event.preventDefault();
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target?.closest('[data-drag-handle="true"]') && target?.closest('button,a,input,textarea,select,[data-no-drag="true"]')) {
      event.preventDefault();
      return;
    }

    setDraggingProjectId(project.id);
    setDragOverProjectStatus(project.status);
    setDragOverProjectId(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/project-id', project.id);
    event.dataTransfer.setData('text/plain', project.id);

    try {
      event.dataTransfer.setDragImage(event.currentTarget, 36, 36);
    } catch {
      // Browser may reject custom drag previews.
    }
  };

  const beginTaskDrag = (event: React.DragEvent<HTMLElement>, task: ProjectTask) => {
    if (!canManageKanbanTasks || movingTaskId || updatingSubtaskId) {
      event.preventDefault();
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target?.closest('[data-drag-handle="true"]') && target?.closest('button,a,input,textarea,select,[data-no-drag="true"]')) {
      event.preventDefault();
      return;
    }

    setDraggingTaskId(task.id);
    setDragOverTaskStatus(task.status);
    setDragOverTaskId(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/project-task-id', task.id);
    event.dataTransfer.setData('text/plain', task.id);

    try {
      event.dataTransfer.setDragImage(event.currentTarget, 32, 32);
    } catch {
      // Browser may reject custom drag previews.
    }
  };

  const updateProjectStatus = async (project: ProjectRecord, status: ProjectStatus) => {
    if (!canManageProjects || project.status === status || movingProjectId) {
      setDraggingProjectId(null);
      setDragOverProjectStatus(null);
      setDragOverProjectId(null);
      return;
    }
    if (!serverModeRef.current) {
      setDraggingProjectId(null);
      setDragOverProjectStatus(null);
      setDragOverProjectId(null);
      showToast('Project service is unavailable. Refresh before changing project status.');
      return;
    }
    const previousProject = project;
    const updatedProject = normalizeProject({ ...project, status, updatedAt: new Date().toISOString() });
    setMovingProjectId(project.id);
    setProjects(current => current.map(item => item.id === project.id ? updatedProject : item));
    setSelectedProject(current => current?.id === project.id ? updatedProject : current);
    setDraggingProjectId(null);
    setDragOverProjectStatus(null);
    setDragOverProjectId(null);

    const rollback = () => {
      setProjects(current => current.map(item => item.id === project.id ? previousProject : item));
      setSelectedProject(current => current?.id === project.id ? previousProject : current);
    };
    try {
      const response = await api.projects.update(project.id, { status });
      if (!response.success) {
        if (isUnknownMutationOutcome(response)) {
          const refreshed = await syncProjects(false);
          if (!refreshed) rollback();
          showToast(response.error || (language === 'id' ? 'Hasil perubahan status proyek belum dapat dipastikan. Data telah dimuat ulang.' : 'Project status outcome is unknown. Canonical records were refreshed.'));
          return;
        }
        rollback();
        showToast(response.error || (language === 'id' ? 'Status proyek gagal diperbarui dan dikembalikan.' : 'Project status could not be saved and was reverted.'));
        return;
      }
      setServerConnected(true);
      await syncProjects(false);
      showToast(language === 'id' ? 'Status proyek diperbarui.' : 'Project status updated.');
    } catch (error) {
      rollback();
      showToast(error instanceof Error ? error.message : (language === 'id' ? 'Status proyek gagal diperbarui dan dikembalikan.' : 'Project status could not be saved and was reverted.'));
    } finally {
      setMovingProjectId(null);
    }
  };

  const toggleSubtask = async (task: ProjectTask, subtaskId: string) => {
    if (!canManageKanbanTasks || updatingSubtaskId || movingTaskId || !selectedSprintProject) return;
    if (!serverModeRef.current) {
      showToast('Project service is unavailable. Refresh before changing subtasks.');
      return;
    }

    const projectId = selectedSprintProject.id;
    const currentProject = projects.find(project => project.id === projectId);
    const currentTask = currentProject?.tasks.find(item => item.id === task.id) || task;
    const previousSubtasks = currentTask.subtasks || [];
    if (!previousSubtasks.some(item => item.id === subtaskId)) return;

    const nextSubtasks = previousSubtasks.map(item =>
      item.id === subtaskId ? { ...item, completed: !item.completed } : item
    );
    const applySubtasks = (subtasks: ProjectTask['subtasks']) => {
      setProjects(current => current.map(project => project.id === projectId
        ? { ...project, tasks: project.tasks.map(item => item.id === task.id ? { ...item, subtasks } : item) }
        : project));
      setSelectedTask(current => current?.id === task.id ? { ...current, subtasks } : current);
    };

    setUpdatingSubtaskId(subtaskId);
    applySubtasks(nextSubtasks);
    try {
      const response = await api.tasks.update(task.id, { subtasks: nextSubtasks });
      if (!response.success) {
        if (isUnknownMutationOutcome(response)) {
          const refreshed = await syncProjects(false);
          if (!refreshed) applySubtasks(previousSubtasks);
          showToast(response.error || (language === 'id' ? 'Hasil pembaruan checklist belum dapat dipastikan. Data telah dimuat ulang.' : 'Checklist update outcome is unknown. Canonical records were refreshed.'));
          return;
        }
        applySubtasks(previousSubtasks);
        showToast(response.error || (language === 'id' ? 'Checklist gagal diperbarui. Perubahan dikembalikan.' : 'Checklist could not be updated. Changes were reverted.'));
        return;
      }
      setServerConnected(true);
      const savedSubtasks = Array.isArray(response.data?.task?.subtasks) ? response.data.task.subtasks : nextSubtasks;
      applySubtasks(savedSubtasks);
      await syncProjects(false);
      showToast(language === 'id' ? 'Checklist diperbarui.' : 'Checklist updated.');
    } catch (error) {
      applySubtasks(previousSubtasks);
      showToast(error instanceof Error ? error.message : (language === 'id' ? 'Checklist gagal diperbarui. Perubahan dikembalikan.' : 'Checklist could not be updated. Changes were reverted.'));
    } finally {
      setUpdatingSubtaskId(null);
    }
  };

  const confirmDeleteProject = async () => {
    if (!canManageProjects || !deleteProject || deletingProjectRecord) return;
    if (!serverModeRef.current) {
      showToast('Project service is unavailable. Refresh before deleting projects.');
      return;
    }
    const target = deleteProject;
    setDeletingProjectRecord(true);
    try {
      const response = await api.projects.delete(target.id);
      if (!response.success) {
        if (isUnknownMutationOutcome(response)) {
          await syncProjects(false);
          setDeleteProject(null);
          showToast(response.error || 'Project deletion outcome is unknown. The project list was refreshed; inspect it before retrying.');
          return;
        }
        showToast(response.error || 'Project could not be deleted.');
        return;
      }
      setProjects(current => current.filter(project => project.id !== target.id));
      setServerConnected(true);
      await syncProjects(false);
      showToast('Project deleted.');
      setDeleteProject(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Project could not be deleted.');
    } finally {
      setDeletingProjectRecord(false);
    }
  };

  const confirmDeleteTask = async () => {
    if (!canManageKanbanTasks || !deleteTask || !selectedSprintProject || deletingTaskRecord) return;
    if (!serverModeRef.current) {
      showToast('Project service is unavailable. Refresh before deleting tasks.');
      return;
    }
    const target = deleteTask;
    const projectId = selectedSprintProject.id;
    setDeletingTaskRecord(true);
    try {
      const response = await api.tasks.delete(target.id);
      if (!response.success) {
        if (isUnknownMutationOutcome(response)) {
          await syncProjects(false);
          setDeleteTask(null);
          showToast(response.error || 'Task deletion outcome is unknown. The project list was refreshed; inspect it before retrying.');
          return;
        }
        showToast(response.error || 'Task could not be deleted.');
        return;
      }
      setProjects(current => current.map(project => project.id === projectId
        ? { ...project, tasks: project.tasks.filter(task => task.id !== target.id) }
        : project));
      setServerConnected(true);
      await syncProjects(false);
      showToast('Task deleted.');
      setDeleteTask(null);
      setSelectedTask(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Task could not be deleted.');
    } finally {
      setDeletingTaskRecord(false);
    }
  };

  const exportProjects = () => {
    const rows = filteredProjects.map(project => [
      project.slug,
      project.name,
      project.clientCompany,
      statusLabel(project.status),
      String(project.progressPercent),
      String(project.budget),
      getRecordedExpense(project.id) === null ? '' : String(getRecordedExpense(project.id)),
      project.teamLead,
      project.targetEndDate,
    ]);
    const csv = [
      ['slug', 'project', 'client', 'status', 'progress_percent', 'budget', 'recorded_finance_cost', 'owner', 'deadline'],
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
      (selectedProjectSlug ? projects.find(project => project.id === selectedProjectSlug || project.slug === selectedProjectSlug) || null : null)
    );

  return (
    <AdminPageShell featureSlug="projects-module" className="projects-module">
      <Modal
        open={Boolean(deleteProject)}
        onClose={() => { if (!deletingProjectRecord) setDeleteProject(null); }}
        busy={deletingProjectRecord}
        size="sm"
        title="Delete project?"
        description={deleteProject ? 'Project "' + deleteProject.name + '" will be removed.' : undefined}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setDeleteProject(null)} disabled={deletingProjectRecord}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDeleteProject()} loading={deletingProjectRecord}>Delete</Button>
          </>
        )}
      >
        <div className="text-xs text-muted">AMS applies project deletion only after the server confirms the operation.</div>
      </Modal>

      <Modal
        open={Boolean(deleteTask)}
        onClose={() => { if (!deletingTaskRecord) setDeleteTask(null); }}
        busy={deletingTaskRecord}
        size="sm"
        title="Delete task?"
        description={deleteTask ? 'Task "' + deleteTask.title + '" will be removed.' : undefined}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setDeleteTask(null)} disabled={deletingTaskRecord}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDeleteTask()} loading={deletingTaskRecord}>Delete</Button>
          </>
        )}
      >
        <div className="text-xs text-muted">AMS applies task deletion only after the server confirms the operation.</div>
      </Modal>

      <Drawer
        open={Boolean(selectedProjectDetail)}
        onClose={clearProjectSelection}
        size="2xl"
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
                ['Start date', formatDate(selectedProjectDetail.startDate)],
                ['Deadline', formatDate(selectedProjectDetail.targetEndDate)],
                ['Client contact', selectedProjectDetail.clientName || 'Not provided'],
                ['Client email', selectedProjectDetail.clientEmail || 'Not provided'],
                ['Tasks', selectedProjectDetail.tasks.filter(task => task.status === 'done').length + '/' + selectedProjectDetail.tasks.length + ' done'],
                ['Service', selectedProjectDetail.serviceCategory || 'Delivery'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-control border border-line bg-bg p-3">
                  <div className="text-xs font-medium text-muted">{label}</div>
                  <div className="mt-1.5 truncate text-xs font-semibold text-fg">{value}</div>
                </div>
              ))}
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-xs font-medium text-muted">Owner</div>
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
                    <span className="rounded-badge border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent-text">Updating…</span>
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-card border border-line bg-bg p-4">
                <div className="text-[11px] font-semibold text-fg">Team members</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedProjectDetail.teamMembers.length > 0
                    ? selectedProjectDetail.teamMembers.map(member => (
                      <span key={member} className="rounded-chip border border-line bg-panel px-2.5 py-1.5 text-[11px] text-muted">{member}</span>
                    ))
                    : <span className="text-xs text-muted">No team members assigned.</span>}
                </div>
              </div>
              <div className="rounded-card border border-line bg-bg p-4">
                <div className="text-[11px] font-semibold text-fg">Technology stack</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedProjectDetail.techStack.length > 0
                    ? selectedProjectDetail.techStack.map(technology => (
                      <span key={technology} className="rounded-chip border border-line bg-panel px-2.5 py-1.5 text-[11px] text-muted">{technology}</span>
                    ))
                    : <span className="text-xs text-muted">No technologies specified.</span>}
                </div>
              </div>
            </div>

            <section aria-label="Project milestones" className="rounded-card border border-line bg-bg p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold text-fg">Milestones</div>
                <span className="rounded-badge border border-line bg-panel px-2 py-1 text-[10px] font-medium tabular-nums text-muted">
                  {selectedProjectDetail.milestones.filter(milestone => milestone.completed).length}/{selectedProjectDetail.milestones.length} completed
                </span>
              </div>
              {selectedProjectDetail.milestones.length === 0 ? (
                <p className="mt-3 text-xs text-muted">No milestones have been defined for this project.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {selectedProjectDetail.milestones.map(milestone => {
                    const overdueMilestone = !milestone.completed && isOverdue(milestone.dueDate);
                    return (
                      <div key={milestone.id} className="flex flex-wrap items-start justify-between gap-3 rounded-control border border-line bg-panel p-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-fg">{milestone.title}</div>
                          <div className="mt-1 text-[10px] text-muted">
                            Due {formatDate(milestone.dueDate)}
                            {typeof milestone.paymentTrigger === 'number' && milestone.paymentTrigger > 0
                              ? ' · Payment trigger ' + formatAmount(milestone.paymentTrigger, currency)
                              : ''}
                          </div>
                        </div>
                        <span className={'rounded-badge border px-2 py-1 text-[10px] font-semibold ' + (
                          milestone.completed
                            ? 'border-success/25 bg-success/10 text-success'
                            : overdueMilestone
                              ? 'border-danger/25 bg-danger/10 text-danger'
                              : 'border-line bg-bg text-muted'
                        )}>
                          {milestone.completed ? 'Completed' : overdueMilestone ? 'Overdue' : 'Upcoming'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {selectedProjectDetail.notes && (
              <div>
                <div className="text-[11px] font-semibold text-muted">Notes</div>
                <p className="mt-2 rounded-card border border-line bg-bg p-4 text-xs leading-5 text-fg">{selectedProjectDetail.notes}</p>
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
      </Drawer>

      <Drawer
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        size="xl"
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
                    onClick={() => void updateTaskStatus(selectedTask, column.id)}
                    disabled={!canManageKanbanTasks || Boolean(movingTaskId) || updatingSubtaskId !== null || selectedTask.status === column.id}
                    className={'min-h-10 rounded-control border px-3 text-xs font-medium transition-colors ' + (selectedTask.status === column.id ? 'border-accent/30 bg-accent/10 text-accent' : 'border-line bg-bg text-muted hover:text-fg') + ((!canManageKanbanTasks || movingTaskId || selectedTask.status === column.id) ? ' cursor-not-allowed opacity-50' : '')}
                  >
                    {column.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted">Description</div>
              <p className="mt-2 rounded-card border border-line bg-bg p-4 text-xs leading-5 text-fg">{selectedTask.description || 'No description provided.'}</p>
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted">
                <span>Checklist</span>
                <span className="font-normal">{(selectedTask.subtasks || []).filter(item => item.completed).length}/{(selectedTask.subtasks || []).length}</span>
              </div>
              {!canManageKanbanTasks && <p className="mt-1 text-[11px] text-muted">Checklist is read-only for your current role.</p>}
              <div className="mt-2 space-y-2">
                {(selectedTask.subtasks || []).length === 0 ? (
                  <div className="rounded-control border border-dashed border-line p-3 text-xs text-muted">No checklist items.</div>
                ) : (
                  (selectedTask.subtasks || []).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!canManageKanbanTasks || updatingSubtaskId !== null || Boolean(movingTaskId)}
                      aria-label={(item.completed ? 'Reopen checklist item ' : 'Complete checklist item ') + item.title}
                      aria-busy={updatingSubtaskId === item.id}
                      onClick={() => { void toggleSubtask(selectedTask, item.id); }}
                      className={'flex w-full items-center gap-2.5 rounded-control border border-line bg-bg p-3 text-left transition-colors ' + ((!canManageKanbanTasks || updatingSubtaskId !== null || movingTaskId) ? 'cursor-not-allowed opacity-60' : 'hover:bg-panel-hover')}
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
      </Drawer>

      <AdminModuleHeader
        className="mb-0"
        eyebrow={(
          <div className="flex flex-wrap items-center gap-2">
            <span>{view === 'all' ? 'Workspace / Projects' : 'Projects'}</span>
            <AdminStatusBadge tone={serverMode ? 'success' : loading ? 'info' : 'warning'}>
              {serverMode ? 'Live project data' : loading ? 'Loading project records' : 'Project data unavailable'}
            </AdminStatusBadge>
          </div>
        )}
        title={view === 'all' ? 'Projects' : view === 'sprint' ? 'Sprint & Delivery' : view === 'budget' ? 'Budget vs Actual' : 'Archived Projects'}
        description={
          view === 'all'
            ? 'Project portfolio, delivery stages, resource ownership, and live execution from one workspace.'
            : view === 'sprint'
              ? 'Move work through execution stages and keep delivery ownership visible.'
              : view === 'budget'
                ? 'Compare each project budget with recorded Finance expenses linked to that project. Delivery progress is never used as a cost estimate.'
                : 'Completed projects kept visible for reference, handover history, and future reuse.'
        }
        actions={(
          <>
            {view === 'all' && (
              <div className="inline-flex min-h-9 items-center gap-1 rounded-control border border-line bg-panel px-0.5">
                <button type="button" aria-pressed={projectLayout === 'board'} onClick={() => openLayout('board')} className={'inline-flex h-9 min-h-9 items-center gap-1.5 rounded-chip border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' + (projectLayout === 'board' ? 'border-line bg-line text-fg' : 'border-transparent text-muted hover:bg-bg hover:text-fg')}>
                  <LayoutGrid size={13} /> Kanban
                </button>
                <button type="button" onClick={() => openLayout('table')} aria-pressed={projectLayout === 'table'} className={'inline-flex h-9 min-h-9 items-center gap-1.5 rounded-chip border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' + (projectLayout === 'table' ? 'border-line bg-line text-fg' : 'border-transparent text-muted hover:bg-bg hover:text-fg')}>
                  <List size={13} /> Table
                </button>
                <button type="button" onClick={() => openLayout('timeline')} aria-pressed={projectLayout === 'timeline'} className={'inline-flex h-9 min-h-9 items-center gap-1.5 rounded-chip border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' + (projectLayout === 'timeline' ? 'border-line bg-line text-fg' : 'border-transparent text-muted hover:bg-bg hover:text-fg')}>
                  <CalendarDays size={13} /> Gantt
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
              <p className="text-xs font-semibold text-fg">Project service status</p>
              <p className="mt-1 text-[11px] leading-5 text-muted">{error}</p>
            </div>
            <span className="rounded-badge border border-warning/25 bg-warning/10 px-2 py-1 text-[10px] font-semibold text-warning">API unavailable</span>
          </div>
        </div>
      )}

      {view === 'all' && (
        <>
    

          

          <AdminPanel
            title="Project portfolio"
            description={serverMode
              ? 'Manage the active project portfolio, move delivery stages from Kanban, and keep the table as the structured reporting view.'
              : loading
                ? 'Loading the current project portfolio from AMS.'
                : 'Live project records are unavailable. Refresh after the project service is restored.'}
          >
            <AdminFilterBar
              slug="projects-directory-filters"
              searchValue={projectSearch}
              onSearchChange={setProjectSearch}
              searchPlaceholder="Search projects, clients, owners..."
              searchLabel="Search projects"
              searchClassName="w-[210px] flex-none"
              actions={(
                <Button
                  type="button"
                  variant="secondary"
                  icon={<X size={13} />}
                  onClick={clearProjectFilters}
                  disabled={!activeProjectFilters && projectSort === 'updated'}
                >
                  Reset filters
                </Button>
              )}
              footer={(
                <div
                  className="flex w-full min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5"
                  style={{ flexWrap: 'nowrap' }}
                  aria-label="Project status quick filters"
                >
                  <button
                    type="button"
                    onClick={() => setProjectStatusFilter('')}
                    className={'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-chip border px-2.5 text-[10px] font-medium transition-colors ' + (!projectStatusFilter ? 'border-accent/25 bg-accent/10 text-fg' : 'border-line bg-bg text-muted hover:bg-panel-hover hover:text-fg')}
                  >
                    All
                    <span className="tabular-nums">{serverMode ? projects.length : '—'}</span>
                  </button>
                  {PROJECT_KANBAN_COLUMNS.map(column => {
                    const count = projects.filter(project => project.status === column.id).length;
                    const active = projectStatusFilter === column.id;
                    return (
                      <button
                        key={column.id}
                        type="button"
                        onClick={() => setProjectStatusFilter(column.id)}
                        className={'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-chip border px-2.5 text-[10px] font-medium transition-colors ' + (active ? 'border-accent/25 bg-accent/10 text-fg' : 'border-line bg-bg text-muted hover:bg-panel-hover hover:text-fg')}
                      >
                        <span className={'h-1.5 w-1.5 shrink-0 rounded-full ' + column.dot} />
                        {column.label}
                        <span className="tabular-nums">{serverMode ? count : '—'}</span>
                      </button>
                    );
                  })}
                  <span className="ml-auto shrink-0 whitespace-nowrap px-1 text-[10px] text-muted">
                    {serverMode ? filteredProjects.length + ' / ' + projects.length : loading ? 'Loading records' : '—'}
                  </span>
                </div>
              )}
            >
              <div
                className="flex w-full min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5"
                style={{ flexWrap: 'nowrap' }}
                aria-label="Project filters"
              >
                <CustomSelect
                  value={projectHealthFilter}
                  onChange={setProjectHealthFilter}
                  options={[{ value: '', label: 'All health' }, ...(['Good', 'At Risk', 'Delayed', 'Blocked'] as ProjectHealth[]).map(value => ({ value, label: value }))]}
                  className="w-[128px] shrink-0"
                  aria-label="Filter projects by health"
                />
                <CustomSelect
                  value={projectClientFilter}
                  onChange={setProjectClientFilter}
                  options={[{ value: '', label: 'All clients' }, ...projectFilterOptions.clients.map(value => ({ value, label: value }))]}
                  className="w-[138px] shrink-0"
                  aria-label="Filter projects by client"
                />
                <CustomSelect
                  value={projectOwnerFilter}
                  onChange={setProjectOwnerFilter}
                  options={[{ value: '', label: 'All owners' }, ...projectFilterOptions.owners.map(value => ({ value, label: value }))]}
                  className="w-[132px] shrink-0"
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
                  className="w-[176px] shrink-0"
                  aria-label="Sort projects"
                />
              </div>
            </AdminFilterBar>
            {loading ? (
              <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(item => <div key={item} className="h-40 animate-pulse rounded-card bg-bg" />)}
              </div>
            ) : projectLayout === 'board' ? (
              <div ref={projectKanbanScrollRef} className="ams-project-kanban-board overflow-x-auto overflow-y-visible cursor-grab" tabIndex={0} role="region" aria-label="Scrollable project board" data-ams-slug="projects-board-scroll">
                {filteredProjects.length === 0 && (
                  <div role="status" className="mx-3 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-control border border-line bg-panel p-3 sm:mx-4">
                    <div className="text-xs text-muted">
                      {projects.length === 0 ? 'No projects yet. Create a project to start the portfolio.' : 'No projects match the current filters.'}
                    </div>
                    {activeProjectFilters > 0 && (
                      <button type="button" onClick={clearProjectFilters} className="inline-flex h-8 items-center rounded-control border border-line bg-bg px-3 text-[11px] font-medium text-fg hover:bg-panel-hover">
                        Reset filters
                      </button>
                    )}
                  </div>
                )}
                <div className="flex min-w-max items-start gap-3 px-3 pb-5 pt-3 sm:gap-3.5 sm:px-4 sm:pb-6 sm:pt-4">
                  {PROJECT_KANBAN_COLUMNS.map(column => {
                    const items = filteredProjects.filter(project => project.status === column.id);
                    const isDropTarget = dragOverProjectStatus === column.id;

                    return (
                      <section
                        key={column.id}
                        aria-label={column.label + ' project column'}
                        className={[
                          'ams-project-kanban-lane flex w-[314px] shrink-0 self-start flex-col overflow-visible rounded-card border transition-[border-color,background-color] duration-150 sm:w-[326px] lg:w-[334px]',
                          isDropTarget
                            ? 'border-accent/50 bg-accent/5'
                            : 'border-line/80',
                        ].join(' ')}
                        data-drop-target={isDropTarget ? 'true' : 'false'}
                      >
                        <div className="shrink-0 border-b border-line bg-panel px-3.5 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={'h-2 w-2 shrink-0 rounded-full ' + column.dot} />
                                <span className="text-xs font-semibold text-fg">{column.label}</span>
                                <span className="rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[10px] font-semibold text-muted">{items.length}</span>
                              </div>
                              <p className="mt-1 hidden text-[10px] leading-4 text-muted sm:block">{column.description}</p>
                            </div>
                            {canManageProjects && (
                              <button
                                type="button"
                                onClick={() => openNewProject(column.id)}
                                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-control border border-line bg-bg px-2.5 text-[10px] font-medium text-muted transition-colors hover:border-accent/30 hover:bg-panel-hover hover:text-fg"
                                aria-label={'Add project to ' + column.label}
                              >
                                <Plus size={12} /> Add
                              </button>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 border-t border-line/70 pt-2 text-[10px] text-muted">
                            <span>{items.reduce((sum, project) => sum + project.tasks.filter(task => task.status !== 'done').length, 0)} open tasks</span>
                            <span className="tabular-nums">{formatAmount(items.reduce((sum, project) => sum + project.budget, 0), currency)}</span>
                          </div>
                        </div>

                        <div
                          onDragEnter={event => {
                            if (!canManageProjects) return;
                            event.preventDefault();
                            setDragOverProjectStatus(column.id);
                            setDragOverProjectId(null);
                          }}
                          onDragOver={event => {
                            if (!canManageProjects) return;
                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';
                            setDragOverProjectStatus(column.id);
                            setDragOverProjectId(null);
                          }}
                          onDragLeave={event => {
                            const nextTarget = event.relatedTarget as Node | null;
                            if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
                              setDragOverProjectStatus(current => current === column.id ? null : current);
                              setDragOverProjectId(null);
                            }
                          }}
                          onDrop={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (!canManageProjects) {
                              setDraggingProjectId(null);
                              setDragOverProjectStatus(null);
                              setDragOverProjectId(null);
                              return;
                            }
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
                              setDragOverProjectId(null);
                            }
                          }}
                          className={'ams-project-kanban-stack flex flex-col gap-2 overflow-visible p-2.5 transition-colors ' + (isDropTarget ? 'bg-accent/5' : '')}>
                          {items.length === 0 ? (
                            <div className={'flex min-h-[104px] items-center justify-center rounded-card border border-dashed p-4 text-center text-[11px] text-muted transition-colors ' + (isDropTarget ? 'border-accent/40 bg-accent/5 text-fg' : 'border-line')}>
                              <span className="max-w-[190px]">
                                <span className="block font-medium text-fg">{canManageProjects && isDropTarget ? 'Drop project here' : 'No projects here'}</span>
                                <span className="mt-1 block text-muted">{canManageProjects ? 'Drag a card into this lane.' : 'No projects in this stage.'}</span>
                              </span>
                            </div>
                          ) : (
                            items.map(project => {
                              const taskDone = project.tasks.filter(task => task.status === 'done').length;
                              const recordedCost = getRecordedExpense(project.id);
                              const recordedCostCount = recordedExpenseTotals?.get(project.id)?.count || 0;
                              const milestoneDone = project.milestones.filter(milestone => milestone.completed).length;
                              const isDragging = draggingProjectId === project.id;

                              return (
                                <React.Fragment key={project.id}>
                                  {dragOverProjectStatus === column.id && dragOverProjectId === project.id && draggingProjectId !== project.id && (
                                    <div className="h-2 rounded-badge border border-dashed border-accent/50 bg-accent/10" aria-hidden="true" />
                                  )}
                                <article
                                  key={project.id}
                                  aria-grabbed={isDragging}
                                  onDragOver={canManageProjects ? (event => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    event.dataTransfer.dropEffect = 'move';
                                    setDragOverProjectStatus(column.id);
                                    setDragOverProjectId(project.id);
                                  }) : undefined}
                                  className={'ams-project-kanban-card group cursor-default select-none rounded-card border border-line p-3.5 transition-[transform,opacity,border-color,background-color] duration-150 hover:-translate-y-px ' + (
                                    isDragging ? 'rotate-[1deg] scale-[0.98] border-accent/50 opacity-70' : movingProjectId === project.id ? 'border-accent/35 opacity-80' : ''
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-start gap-2">
                                      <button type="button"
                                        data-drag-handle="true"
                                        draggable={canManageProjects && !movingProjectId}
                                        onDragStart={event => beginProjectDrag(event, project)}
                                        onDragEnd={() => {
                                          setDraggingProjectId(null);
                                          setDragOverProjectStatus(null);
                                          setDragOverProjectId(null);
                                        }}
                                        onClick={() => openProjectDetail(project)}
                                        onKeyDown={event => {
                                          if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            openProjectDetail(project);
                                            return;
                                          }
                                          if ((event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') || movingProjectId) return;
                                          const currentIndex = PROJECT_KANBAN_COLUMNS.findIndex(item => item.id === project.status);
                                          const nextIndex = currentIndex + (event.key === 'ArrowLeft' ? -1 : 1);
                                          const nextColumn = PROJECT_KANBAN_COLUMNS[nextIndex];
                                          if (!nextColumn) return;
                                          event.preventDefault();
                                          void updateProjectStatus(project, nextColumn.id);
                                        }}
                                        tabIndex={canManageProjects && !movingProjectId ? 0 : -1}
                                        aria-label={canManageProjects ? 'Move ' + project.name + ' between stages. Use left and right arrow keys.' : 'Open details for ' + project.name}
                                  aria-keyshortcuts="ArrowLeft ArrowRight Enter Space"
                                        className={[
                                          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted transition-[background-color,border-color,color] select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                                          canManageProjects && !movingProjectId
                                            ? 'cursor-grab hover:border-accent/35 hover:bg-panel-hover hover:text-fg active:cursor-grabbing'
                                            : 'cursor-default opacity-70',
                                        ].join(' ')}
                                        title={canManageProjects ? 'Drag to move; use left/right arrows or press Enter for details' : 'Open project details'}
                                      >
                                        <GripVertical size={16} strokeWidth={2.2} />
                                      </button>
                                      <button type="button" onClick={() => openProjectDetail(project)} className="min-w-0 text-left">
                                        <div className="break-words whitespace-normal text-[10px] font-medium leading-4 text-muted">{project.clientCompany}</div>
                                        <h3 className="mt-0.5 break-words whitespace-normal text-sm font-semibold leading-5 text-fg">{project.name}</h3>
                                      </button>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                      {movingProjectId === project.id && (
                                        <span className="rounded-badge border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent-text">Updating…</span>
                                      )}
                                      <button type="button" aria-label={'Actions for ' + project.name} onClick={() => openProjectDetail(project)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg">
                                        <MoreHorizontal size={15} />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                                    <span className={'rounded-badge border px-2 py-1 text-[10px] font-medium ' + healthClass(project.health)}>{project.health || 'Good'}</span>
                                    <span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] text-muted">{taskDone}/{project.tasks.length} tasks</span>
                                    <span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] text-muted">{milestoneDone}/{project.milestones.length || 0} milestones</span>
                                  </div>
                                  <div className="mt-3 grid grid-cols-2 gap-2">
                                    <div className="min-w-0 rounded-control border border-line bg-bg px-2.5 py-2">
                                      <div className="text-[10px] font-medium text-muted">Service</div>
                                      <div className="mt-0.5 truncate text-[10px] font-medium text-fg">{project.serviceCategory || 'Delivery'}</div>
                                    </div>
                                    <div className="min-w-0 rounded-control border border-line bg-bg px-2.5 py-2">
                                      <div className="text-[10px] font-medium text-muted">Deadline</div>
                                      <div className={'mt-0.5 truncate text-[10px] font-medium ' + (isOverdue(project.targetEndDate) && project.status !== 'completed' ? 'text-danger' : 'text-fg')}>
                                        {project.targetEndDate ? formatDate(project.targetEndDate) : 'Not set'}
                                      </div>
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

                                  <div className="mt-3 border-t border-line pt-3">
                                    <div className="flex items-end justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="text-[10px] font-medium text-muted">Recorded cost</div>
                                        <div className="mt-0.5 break-words whitespace-normal text-xs font-medium tabular-nums text-fg">
                                          {recordedCost === null ? '—' : formatAmount(recordedCost, currency)}
                                          <span className="text-muted"> / {formatAmount(project.budget, currency)}</span>
                                        </div>
                                        <div className="mt-1 text-[10px] text-muted">
                                          {recordedCost === null ? 'Finance source unavailable' : recordedCostCount + ' expense records'}
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

                                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3 text-[10px]">
                                    <span className="min-w-0 break-words whitespace-normal text-muted">{project.slug}</span>
                                    <div className="flex shrink-0 items-center gap-2">
                                      <button type="button" onClick={() => openProjectDetail(project)} className="inline-flex h-8 min-h-8 items-center justify-center rounded-control border border-line bg-bg px-2.5 text-[10px] font-semibold text-fg transition-colors hover:border-accent/30 hover:bg-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                                        View project
                                      </button>
                                      <button type="button" onClick={() => goToSprint(project)} className="inline-flex h-8 min-h-8 items-center justify-center gap-1 rounded-control border border-accent/25 bg-accent/10 px-2.5 text-[10px] font-semibold text-accent-text transition-colors hover:border-accent/40 hover:bg-accent/15 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                                        Delivery <ArrowUpRight size={13} />
                                      </button>
                                    </div>
                                  </div>
                                </article>
                                </React.Fragment>
                              );
                            })
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            ) : projectLayout === 'timeline' ? (
              <ProjectTimeline
                projects={filteredProjects}
                activeFilterCount={activeProjectFilters}
                onClearFilters={clearProjectFilters}
                onOpenProject={openProjectDetail}
              />
            ) : (
              <div className="grid gap-3 p-3 min-[1280px]:hidden sm:p-4" data-ams-feature-slug="projects-table-cards" role="list" aria-label="Project portfolio cards">
                {pagedProjectTableRows.length === 0 ? (
                  <div className="rounded-control border border-line bg-bg p-6 text-center" role="status">
                    <p className="text-xs font-semibold text-fg">{projects.length === 0 ? 'No projects have been created yet.' : 'No projects match the current filters.'}</p>
                    {(activeProjectFilters > 0 || projectSort !== 'updated') && <button type="button" onClick={clearProjectFilters} className="mt-3 inline-flex h-9 items-center rounded-control border border-line bg-panel px-3 text-[11px] font-medium text-fg hover:bg-panel-hover">Reset filters</button>}
                  </div>
                ) : pagedProjectTableRows.map(project => {
                  const recordedCost = getRecordedExpense(project.id);
                  const overdue = isOverdue(project.targetEndDate) && project.status !== 'completed';
                  return (
                    <article key={project.id} role="listitem" data-ams-slug={'project-portfolio-card-' + project.id} className="min-w-0 rounded-card border border-line bg-bg p-3.5">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <button type="button" onClick={() => openProjectDetail(project)} className="min-w-0 flex-1 text-left">
                          <h3 className="break-words text-sm font-semibold text-fg">{project.name}</h3>
                          <p className="mt-1 break-words text-[11px] text-muted">{project.clientCompany || 'No client linked'}</p>
                        </button>
                        <span className={'inline-flex shrink-0 rounded-badge border px-2 py-1 text-[10px] font-semibold ' + projectStatusClass(project.status)}>{statusLabel(project.status)}</span>
                      </div>
                      <div className="mt-3 border-y border-line py-3">
                        <div className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="text-muted">Delivery progress</span>
                          <span className="font-semibold tabular-nums text-fg">{project.progressPercent}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel">
                          <div className="h-full rounded-full bg-accent" style={{ width: project.progressPercent + '%' }} />
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="min-w-0"><p className="text-[10px] text-muted">Recorded cost / budget</p><p className="mt-1 break-words text-xs font-medium tabular-nums text-fg">{recordedCost === null ? '—' : formatAmount(recordedCost, currency)} <span className="text-muted">/ {formatAmount(project.budget, currency)}</span></p>{recordedCost === null && <p className="mt-1 text-[10px] text-muted">Finance data unavailable</p>}</div>
                        <div className="min-w-0"><p className="text-[10px] text-muted">Deadline</p><p className={'mt-1 break-words text-xs font-medium ' + (overdue ? 'text-danger' : 'text-fg')}>{formatDate(project.targetEndDate)}</p>{overdue && <p className="mt-1 text-[10px] text-danger">Overdue</p>}</div>
                        <div className="min-w-0 col-span-2"><p className="text-[10px] text-muted">Owner</p><div className="mt-1">{project.teamLead ? <ProfileIdentity profile={{ name: project.teamLead, contextLabel: 'Project owner' }} showRole={false} /> : <span className="text-xs text-muted">Unassigned</span>}</div></div>
                      </div>
                      <div className="mt-3 flex justify-end gap-1.5 border-t border-line pt-3">
                        <button type="button" onClick={() => openProjectDetail(project)} className="inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-[11px] font-medium text-fg hover:bg-panel-hover">View project</button>
                        {canManageProjects && <button type="button" data-primary="true" onClick={() => openEditProject(project)} className="inline-flex min-h-9 items-center rounded-control border border-accent/25 bg-accent/10 px-3 text-[11px] font-medium text-accent-text hover:bg-accent/15">Edit</button>}
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="hidden min-[1280px]:block overflow-x-auto custom-scrollbar" tabIndex={0} role="region" aria-label="Scrollable project register table">
                <table className="ams-projects-table min-w-[1080px] text-left">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Recorded cost</th>
                      <th>Owner</th>
                      <th>Deadline</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedProjectTableRows.map(project => {
                      const recordedCost = getRecordedExpense(project.id);
                      return (
                        <tr key={project.id}>
                          <td>
                            <button type="button" onClick={() => openProjectDetail(project)} className="min-w-0 text-left">
                              <div className="max-w-[300px] truncate text-xs font-semibold text-fg">{project.name}</div>
                              <div className="mt-1 max-w-[300px] truncate text-[10px] text-muted">{project.clientCompany || 'No client linked'}</div>
                            </button>
                          </td>
                          <td><span className={'inline-flex rounded-badge border px-2 py-1 text-[10px] font-semibold ' + projectStatusClass(project.status)}>{statusLabel(project.status)}</span></td>
                          <td>
                            <div className="min-w-[150px]">
                              <div className="flex items-center justify-between text-[10px] text-muted"><span>Delivery</span><span className="tabular-nums text-fg">{project.progressPercent}%</span></div>
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-accent" style={{ width: project.progressPercent + '%' }} /></div>
                            </div>
                          </td>
                          <td className="text-xs tabular-nums font-medium text-fg">{recordedCost === null ? '—' : formatAmount(recordedCost, currency)} <span className="text-muted">/ {formatAmount(project.budget, currency)}</span></td>
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
                                      {filteredProjects.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-xs text-muted">
                          <div>{projects.length === 0 ? 'No projects have been created yet.' : 'No projects match the current filters.'}</div>
                          {(activeProjectFilters > 0 || projectSort !== 'updated') && (
                            <button type="button" onClick={clearProjectFilters} className="mt-3 inline-flex h-8 items-center rounded-control border border-line bg-panel px-3 text-[11px] font-medium text-fg hover:bg-panel-hover">
                              Reset filters
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
</tbody>
                </table>
              </div>
            )}
            {projectLayout === 'table' && (
              <AdminTablePagination total={filteredProjects.length} page={projectTablePage} pageSize={projectTablePageSize} onPageChange={setProjectTablePage} onPageSizeChange={setProjectTablePageSize} itemLabel="projects" slug="projects-directory-pagination" />
            )}
          </AdminPanel>

          <section data-ams-feature-slug="projects-kpis" data-ams-slug="projects-kpis" aria-label="Projects key performance indicators">
            <AdminMetricStrip
              className="sm:grid-cols-2 lg:grid-cols-4"
              metrics={[
                {
                  id: 'active-value',
                  label: 'Total active value',
                  value: serverMode ? formatAmount(metrics.value, currency) : '—',
                  change: serverMode ? activeProjects.length + ' active' : loading ? 'Loading records' : 'Unavailable',
                  changeToneClassName: serverMode ? 'text-success' : 'text-muted',
                  context: serverMode ? 'Across active contracts' : loading ? 'Loading live project records' : 'Live project data unavailable',

                  icon: <CircleDollarSign size={15} />,
                  toneClassName: 'text-success',
                },
                {
                  id: 'velocity',
                  label: 'Average project progress',
                  value: serverMode ? metrics.averageProgress + '%' : '—',
                  change: serverMode ? metrics.openTasks + ' open tasks' : loading ? 'Loading records' : 'Unavailable',
                  changeToneClassName: serverMode ? 'text-info' : 'text-muted',
                  context: serverMode ? 'Based on active project progress' : loading ? 'Loading live project records' : 'Live project data unavailable',

                  icon: <BarChart3 size={15} />,
                  toneClassName: 'text-info',
                },
                {
                  id: 'risk',
                  label: 'Milestones at risk',
                  value: serverMode ? String(metrics.milestonesAtRisk || metrics.risks) : '—',
                  change: serverMode ? metrics.risks ? 'Action required' : 'Healthy' : loading ? 'Loading records' : 'Unavailable',
                  changeToneClassName: serverMode ? metrics.risks ? 'text-danger' : 'text-success' : 'text-muted',
                  context: serverMode ? metrics.risks + ' projects need attention' : loading ? 'Loading live project records' : 'Live project data unavailable',
                  icon: <ShieldAlert size={15} />,
                  toneClassName: serverMode ? metrics.risks ? 'text-danger' : 'text-success' : 'text-muted',
                },
                {
                  id: 'allocation',
                  label: 'Resource allocation',
                  value: serverMode ? metrics.assignedPeople + ' assigned' : '—',
                  change: serverMode ? activeProjects.length + ' active projects' : loading ? 'Loading records' : 'Unavailable',
                  changeToneClassName: 'text-muted',
                  context: serverMode ? 'Unique owners & contributors' : loading ? 'Loading live project records' : 'Live project data unavailable',

                  icon: <Users size={15} />,
                  toneClassName: 'text-fg',
                },
              ]}
            />
          </section>



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
                    if (!project || project.id === selectedSprintProject?.id) return;
                    setSelectedTask(null);
                    setTaskSearch('');
                    setTaskPriorityFilter('');
                    setTaskAssigneeFilter('');
                    setTaskSort('priority');
                    setDraggingTaskId(null);
                    setDragOverTaskStatus(null);
                    setDragOverTaskId(null);
                    const next = new URLSearchParams(searchParams);
                    next.set('project', project.slug);
                    setSearchParams(next, { replace: true });
                  }}
                  options={projects.map(project => ({ value: project.id, label: project.name + (project.status === 'completed' ? ' (Completed)' : '') }))}
                  className="w-full sm:w-64"
                  aria-label="Select sprint project"
                />
                {canManageKanbanTasks && selectedSprintProject && selectedSprintProject.status !== 'completed' && (
                  <Button icon={<Plus size={14} />} onClick={() => handleAddTask('todo')}>New task</Button>
                )}
              </div>
            )}
          >
            {loading && !selectedSprintProject ? (
              <div role="status" aria-label="Loading project delivery" className="grid min-h-[360px] gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(item => <div key={item} className="h-64 animate-pulse rounded-card border border-line bg-bg" />)}
              </div>
            ) : selectedSprintProject ? (
              <>
                <div className="grid gap-3 border-b border-line bg-bg/35 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(100px,0.5fr))]">
                  <div className="min-w-0 rounded-card border border-line bg-panel p-4">
                    <div className="flex min-w-0 items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-badge border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent-text">{selectedSprintProject.status === 'completed' ? 'Completed project' : 'Active delivery'}</span>
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
                      <div className="text-xs font-medium text-muted">{label}</div>
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
                      {canManageKanbanTasks ? 'Drag the handle or use left/right arrow keys to change stage' : 'Task movement is read-only'}
                    </span>
                  </div>
                </div>

                <div ref={taskKanbanScrollRef} className="ams-project-kanban-task-board overflow-x-auto bg-bg p-5 sm:p-6 cursor-grab" tabIndex={0} role="region" aria-label="Scrollable project task board" data-ams-slug="project-task-board-scroll">
                  <div className="flex min-w-max items-start gap-3 pb-8 sm:pb-10">
                    {TASK_COLUMNS.map(column => {
                      const tasks = visibleTasks.filter(task => task.status === column.id);
                      const isDropTarget = dragOverTaskStatus === column.id;
                      return (
                        <section
                          key={column.id}
                          aria-label={column.label + ' task column'}
                          onDragOver={event => {
                            if (!canManageKanbanTasks || movingTaskId || updatingSubtaskId) return;
                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';
                            setDragOverTaskStatus(column.id);
                            setDragOverTaskId(null);
                          }}
                          onDragEnter={event => {
                            if (!canManageKanbanTasks || movingTaskId || updatingSubtaskId) return;
                            event.preventDefault();
                            setDragOverTaskStatus(column.id);
                            setDragOverTaskId(null);
                          }}
                          onDragLeave={event => {
                            const nextTarget = event.relatedTarget as Node | null;
                            if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
                              setDragOverTaskStatus(current => current === column.id ? null : current);
                              setDragOverTaskId(null);
                            }
                          }}
                          onDrop={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (!canManageKanbanTasks || movingTaskId || updatingSubtaskId) {
                              setDraggingTaskId(null);
                              setDragOverTaskStatus(null);
                              setDragOverTaskId(null);
                              return;
                            }
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
                              setDragOverTaskId(null);
                            }
                          }}
                          className={[
                            'flex w-[320px] shrink-0 self-start flex-col rounded-card border bg-panel/35 transition-[border-color,background-color] duration-150 sm:w-[340px]',
                            isDropTarget ? 'border-accent/45 bg-accent/5' : 'border-line/80',
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
                              {canManageKanbanTasks && selectedSprintProject.status !== 'completed' && (
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
                            'flex flex-col gap-2.5 bg-bg/30 p-3 pb-3 transition-colors duration-150',
                            isDropTarget ? 'bg-accent/5' : '',
                          ].join(' ')}>
                            {tasks.length === 0 ? (
                              <div className={[
                                'flex min-h-[104px] items-center justify-center rounded-card border border-dashed p-4 text-center transition-colors',
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
                                  {canManageKanbanTasks && selectedSprintProject.status !== 'completed' && !isDropTarget && (
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
                                  <React.Fragment key={task.id}>
                                    {dragOverTaskStatus === column.id && dragOverTaskId === task.id && draggingTaskId !== task.id && (
                                      <div className="h-2 rounded-badge border border-dashed border-accent/50 bg-accent/10" aria-hidden="true" />
                                    )}
                                  <article
                                    key={task.id}
                                    aria-grabbed={isDragging}
                                    aria-busy={movingTaskId === task.id}
                                    onDragOver={canManageKanbanTasks ? (event => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      event.dataTransfer.dropEffect = 'move';
                                      setDragOverTaskStatus(column.id);
                                      setDragOverTaskId(task.id);
                                    }) : undefined}
                                    className={[
                                      'group rounded-card border bg-panel p-3.5 transition-[transform,opacity,border-color,background-color,box-shadow] duration-150',
                                      canManageKanbanTasks ? '' : 'cursor-default',
                                      'border-line hover:border-accent/30 hover:bg-panel-hover',
                                      isDragging ? 'rotate-[0.6deg] scale-[0.98] opacity-50' : movingTaskId === task.id ? 'border-accent/35 opacity-80' : '',
                                    ].join(' ')}
                                  >
                                    {movingTaskId === task.id && (
                                      <div role="status" className="mb-2 text-[10px] font-medium text-accent-text">Saving status…</div>
                                    )}
                                    <div className="flex items-start gap-2.5">
                                      <button type="button"
                                        tabIndex={canManageKanbanTasks && !movingTaskId && updatingSubtaskId === null ? 0 : -1}
                                        aria-label={canManageKanbanTasks ? 'Move ' + task.title + ' between stages. Use left and right arrow keys.' : 'Open details for ' + task.title}
                                  aria-keyshortcuts="ArrowLeft ArrowRight Enter Space"
                                        draggable={canManageKanbanTasks && !movingTaskId && updatingSubtaskId === null}
                                        onDragStart={canManageKanbanTasks ? event => beginTaskDrag(event, task) : undefined}
                                        onDragEnd={() => {
                                          setDraggingTaskId(null);
                                          setDragOverTaskStatus(null);
                                          setDragOverTaskId(null);
                                        }}
                                        onClick={() => setSelectedTask(task)}
                                        onKeyDown={event => {
                                          if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            setSelectedTask(task);
                                            return;
                                          }
                                          if (!canManageKanbanTasks || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') || movingTaskId || updatingSubtaskId) return;
                                          const currentIndex = TASK_COLUMNS.findIndex(item => item.id === task.status);
                                          const nextIndex = currentIndex + (event.key === 'ArrowLeft' ? -1 : 1);
                                          const nextColumn = TASK_COLUMNS[nextIndex];
                                          if (!nextColumn) return;
                                          event.preventDefault();
                                          void updateTaskStatus(task, nextColumn.id);
                                        }}
                                        data-drag-handle="true"
                                        className={[
                                          'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted transition-[background-color,border-color,color,transform] select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                                          canManageKanbanTasks && !movingTaskId
                                            ? 'cursor-grab hover:border-accent/35 hover:bg-panel-hover hover:text-fg active:cursor-grabbing'
                                            : 'cursor-default opacity-70',
                                        ].join(' ')}
                                        title={canManageKanbanTasks ? 'Drag to move; use left/right arrows or press Enter for details' : 'Open task details'}
                                      >
                                        <GripVertical size={16} strokeWidth={2} />
                                      </button>
                                      <button type="button" onClick={() => setSelectedTask(task)} className="min-w-0 flex-1 text-left">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className={'rounded-badge border px-2 py-1 text-[10px] font-semibold ' + priorityClass(task.priority)}>{priorityLabel(task.priority)}</span>
                                          {overdue && (
                                            <span className="inline-flex items-center gap-1 rounded-badge border border-danger/20 bg-danger/5 px-2 py-1 text-[10px] font-semibold text-danger">
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
                                          <span key={tag} className="rounded-badge border border-line bg-bg px-1.5 py-1 text-[10px] text-muted">{tag}</span>
                                        ))}
                                        {(task.tags || []).length > 3 && <span className="rounded-badge border border-line bg-bg px-1.5 py-1 text-[10px] text-muted">+{task.tags.length - 3}</span>}
                                      </div>
                                    )}

                                    {checklistTotal > 0 && (
                                      <div className="mt-3">
                                        <div className="flex items-center justify-between text-[10px] text-muted">
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
                                          <div className="text-[10px] text-muted">{dueDays === null ? 'No due date' : overdue ? 'Past due' : dueDays === 0 ? 'Due today' : dueDays === 1 ? 'Due tomorrow' : 'Due ' + formatDate(task.dueDate)}</div>
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
                                  </React.Fragment>
                                );
                              })
                            )}
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
      {loading && (view === 'budget' || view === 'archived') && (
        <AdminPanel title="Loading projects" description="Loading project records from the shared workspace.">
          <div role="status" aria-label="Loading project records" className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(item => <div key={item} className="h-24 animate-pulse rounded-card border border-line bg-bg" />)}
          </div>
        </AdminPanel>
      )}

      {view === 'budget' && !loading && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Committed', formatAmount(activeProjects.reduce((sum, project) => sum + project.budget, 0), currency), 'Active portfolio'],
              ['Recorded cost', budgetRows.some(row => row.actual === null) ? '—' : formatAmount(budgetRows.filter(row => row.project.status !== 'completed').reduce((sum, row) => sum + (row.actual || 0), 0), currency), expenseLoading ? 'Loading Finance records' : projectExpenses === null ? (expenseError || 'Finance source unavailable') : 'Linked project expenses'],
              ['Remaining', budgetRows.some(row => row.remaining === null) ? '—' : formatAmount(budgetRows.filter(row => row.project.status !== 'completed').reduce((sum, row) => sum + (row.remaining || 0), 0), currency), 'Budget less recorded cost'],
              ['At risk', String(budgetRows.filter(row => row.project.health !== 'Good').length), 'Projects to review'],
            ].map(([label, value, context]) => (
              <article key={label} className="rounded-card border border-line bg-panel p-4">
                <div className="text-xs font-medium text-muted">{label}</div>
                <div className="mt-3 text-2xl font-semibold tabular-nums text-fg">{value}</div>
                <div className="mt-1 text-[11px] text-muted">{context}</div>
              </article>
            ))}
          </section>

          <AdminPanel title="Budget vs actual" description="Actuals use Finance expense entries linked by project ID. Delivery progress is not used as a cost estimate.">
            <div className="grid gap-3 p-3 min-[1280px]:hidden sm:p-4" data-ams-feature-slug="projects-budget-cards" role="list" aria-label="Budget comparison cards">
              {pagedBudgetRows.length === 0 ? (
                <div className="rounded-control border border-line bg-bg p-6 text-center text-xs text-muted" role="status">No projects match the current portfolio filters.</div>
              ) : pagedBudgetRows.map(row => {
                const burnPercent = row.project.budget > 0 && row.actual !== null
                  ? Math.round((row.actual / row.project.budget) * 100)
                  : null;
                return (
                  <article key={row.project.id} role="listitem" data-ams-slug={'projects-budget-card-' + row.project.id} className="min-w-0 rounded-card border border-line bg-bg p-3.5">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <button type="button" onClick={() => openProjectDetail(row.project)} className="min-w-0 flex-1 text-left">
                        <h3 className="break-words text-sm font-semibold text-fg">{row.project.name}</h3>
                        <p className="mt-1 break-words text-[11px] text-muted">{row.project.clientCompany || '—'}</p>
                      </button>
                      <span className={'inline-flex shrink-0 rounded-badge border px-2 py-1 text-[10px] font-semibold ' + healthClass(row.project.health)}>{row.project.health || 'Good'}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 border-y border-line py-3">
                      <div className="min-w-0"><p className="text-[10px] text-muted">Budget</p><p className="mt-1 break-words text-xs font-medium tabular-nums text-fg">{formatAmount(row.project.budget, currency)}</p></div>
                      <div className="min-w-0"><p className="text-[10px] text-muted">Actual to date</p><p className="mt-1 break-words text-xs tabular-nums text-fg">{row.actual === null ? '—' : formatAmount(row.actual, currency)}</p>{row.actual !== null && <p className="mt-1 text-[10px] text-muted">{row.expenseCount} records</p>}</div>
                      <div className="min-w-0"><p className="text-[10px] text-muted">Remaining</p><p className={'mt-1 break-words text-xs tabular-nums ' + (row.remaining !== null && row.remaining < 0 ? 'font-semibold text-danger' : 'text-fg')}>{row.remaining === null ? '—' : formatAmount(row.remaining, currency)}</p></div>
                      <div className="min-w-0"><p className="text-[10px] text-muted">Variance</p><p className={'mt-1 break-words text-xs font-semibold tabular-nums ' + (row.variance !== null && row.variance < 0 ? 'text-danger' : row.variance === null ? 'text-muted' : 'text-success')}>{row.variance === null ? '—' : formatAmount(row.variance, currency)}</p></div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2 text-[10px] text-muted"><span>Delivery progress</span><span className="tabular-nums text-fg">{row.project.progressPercent}%</span></div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel"><div className="h-full rounded-full bg-accent" style={{ width: row.project.progressPercent + '%' }} /></div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2 text-[10px] text-muted"><span>Cost / budget</span><span className="tabular-nums text-fg">{burnPercent === null ? '—' : burnPercent + '%'}</span></div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel"><div className={'h-full rounded-full ' + (burnPercent !== null && burnPercent > 100 ? 'bg-danger' : burnPercent !== null && burnPercent > 85 ? 'bg-warning' : 'bg-success')} style={{ width: Math.min(100, Math.max(0, burnPercent || 0)) + '%' }} /></div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end border-t border-line pt-3">
                      <button type="button" onClick={() => openProjectDetail(row.project)} className="inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-[11px] font-medium text-fg hover:bg-panel-hover">Project details</button>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="hidden min-[1280px]:block overflow-x-auto custom-scrollbar" tabIndex={0} role="region" aria-label="Scrollable project budget comparison table">
              <table className="ams-data-table min-w-[900px] text-left">
                <thead>
                  <tr><th>Project</th><th>Health</th><th>Budget</th><th>Actual to date</th><th>Remaining</th><th>Delivery</th><th>Budget burn</th><th>Variance</th></tr>
                </thead>
                <tbody>
                  {pagedBudgetRows.map(row => {
                    const burnPercent = row.project.budget > 0 && row.actual !== null
                      ? Math.round((row.actual / row.project.budget) * 100)
                      : null;
                    return (
                      <tr key={row.project.id}>
                        <td>
                          <button type="button" onClick={() => openProjectDetail(row.project)} className="min-w-0 text-left">
                            <div className="max-w-[240px] truncate text-xs font-semibold text-fg">{row.project.name}</div>
                            <div className="mt-0.5 max-w-[240px] truncate text-[11px] text-muted">{row.project.clientCompany || '—'}</div>
                          </button>
                        </td>
                        <td>
                          <span className={'inline-flex rounded-badge border px-2 py-1 text-[10px] font-semibold ' + healthClass(row.project.health)}>
                            {row.project.health || 'Good'}
                          </span>
                        </td>
                        <td className="text-xs tabular-nums font-medium text-fg">{formatAmount(row.project.budget, currency)}</td>
                        <td className="text-xs tabular-nums text-fg">{row.actual === null ? '—' : formatAmount(row.actual, currency)}{row.actual !== null && <span className="ml-1 text-[10px] text-muted">{row.expenseCount} records</span>}</td>
                        <td className={'text-xs tabular-nums ' + (row.remaining !== null && row.remaining < 0 ? 'font-semibold text-danger' : 'text-fg')}>{row.remaining === null ? '—' : formatAmount(row.remaining, currency)}</td>
                        <td>
                          <div className="min-w-[145px]">
                            <div className="flex items-center justify-between text-[10px] text-muted">
                              <span>Delivery</span>
                              <span className="tabular-nums text-fg">{row.project.progressPercent}%</span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg">
                              <div className="h-full rounded-full bg-accent" style={{ width: row.project.progressPercent + '%' }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="min-w-[145px]">
                            <div className="flex items-center justify-between text-[10px] text-muted">
                              <span>Cost / budget</span>
                              <span className="tabular-nums text-fg">{burnPercent === null ? '—' : burnPercent + '%'}</span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg">
                              <div
                                className={'h-full rounded-full ' + (burnPercent !== null && burnPercent > 100 ? 'bg-danger' : burnPercent !== null && burnPercent > 85 ? 'bg-warning' : 'bg-success')}
                                style={{ width: Math.min(100, Math.max(0, burnPercent || 0)) + '%' }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className={'text-xs tabular-nums font-semibold ' + (row.variance !== null && row.variance < 0 ? 'text-danger' : row.variance === null ? 'text-muted' : 'text-success')}>
                          {row.variance === null ? '—' : formatAmount(row.variance, currency)}
                        </td>
                      </tr>
                    );
                  })}
                  {budgetRows.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-xs text-muted">No projects match the current portfolio filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <AdminTablePagination total={budgetRows.length} page={budgetTablePage} pageSize={budgetTablePageSize} onPageChange={setBudgetTablePage} onPageSizeChange={setBudgetTablePageSize} itemLabel="projects" slug="budget-vs-actual-pagination" />
          </AdminPanel>
        </>
      )}

      {view === 'archived' && !loading && (
        <div className="space-y-4">


          

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

            <div className="grid gap-3 p-3 min-[1280px]:hidden sm:p-4" data-ams-feature-slug="projects-archived-cards" role="list" aria-label="Archived project cards">
              {pagedArchiveTableRows.length === 0 ? (
                <div className="rounded-control border border-line bg-bg p-6 text-center text-xs text-muted">{archivedProjects.length ? 'No archived projects match the current filters.' : 'No archived projects yet.'}</div>
              ) : pagedArchiveTableRows.map(project => (
                <article key={project.id} role="listitem" data-ams-slug={'archived-project-card-' + project.id} className="min-w-0 rounded-card border border-line bg-bg p-3.5">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <button type="button" onClick={() => openProjectDetail(project)} className="min-w-0 flex-1 text-left">
                      <h3 className="break-words text-sm font-semibold text-fg">{project.name}</h3>
                      <p className="mt-1 break-words text-[11px] text-muted">{project.clientCompany || '—'}</p>
                      <p className="mt-1 text-[10px] text-muted">{project.serviceCategory || 'Delivery'}</p>
                    </button>
                    <span className="shrink-0 rounded-badge border border-success/20 bg-success/10 px-2 py-1 text-[10px] font-semibold text-success">Completed</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 border-y border-line py-3">
                    <div className="min-w-0"><p className="text-[10px] text-muted">Completed</p><p className="mt-1 text-xs text-fg">{formatDate(project.targetEndDate)}</p></div>
                    <div className="min-w-0"><p className="text-[10px] text-muted">Final budget</p><p className="mt-1 break-words text-xs tabular-nums text-fg">{formatAmount(project.budget, currency)}</p></div>
                    <div className="col-span-2 min-w-0"><div className="flex items-center justify-between gap-2 text-[10px] text-muted"><span>Final progress</span><span className="tabular-nums text-fg">{project.progressPercent}%</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel"><div className="h-full rounded-full bg-success" style={{ width: project.progressPercent + '%' }} /></div></div>
                    <div className="col-span-2 min-w-0"><p className="text-[10px] text-muted">Owner</p><div className="mt-1">{project.teamLead ? <ProfileIdentity profile={{ name: project.teamLead, contextLabel: 'Project owner' }} showRole={false} /> : <span className="text-xs text-muted">Unassigned</span>}</div></div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="max-w-full break-all font-mono text-[10px] text-muted">{project.slug}</span>
                    <div className="flex justify-end gap-1.5">
                      <button type="button" className="inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-[11px] font-medium text-fg" onClick={() => openProjectDetail(project)}>View</button>
                      {canManageProjects && <button type="button" className="inline-flex min-h-9 items-center rounded-control border border-accent/25 bg-accent/10 px-3 text-[11px] font-medium text-accent-text" data-primary="true" onClick={() => openEditProject(project)}>Edit</button>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden min-[1280px]:block overflow-x-auto custom-scrollbar" tabIndex={0} role="region" aria-label="Scrollable archived project register">
              <table className="ams-data-table min-w-[1020px] text-left">
                <thead><tr><th>Project</th><th>Client</th><th>Completed</th><th>Budget</th><th>Final progress</th><th>Owner</th><th>Slug</th><th>Actions</th></tr></thead>
                <tbody>
                  {pagedArchiveTableRows.map(project => (
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
          <AdminTablePagination total={filteredArchivedProjects.length} page={archiveTablePage} pageSize={archiveTablePageSize} onPageChange={setArchiveTablePage} onPageSizeChange={setArchiveTablePageSize} itemLabel="completed projects" slug="projects-archived-pagination" />
          </AdminPanel>

          <section data-ams-feature-slug="projects-archived-kpis" data-ams-slug="projects-archived-kpis" aria-label="Archived project summary">
            <AdminMetricStrip
              className="sm:grid-cols-2 lg:grid-cols-4"
              metrics={[
                {
                  id: 'archived-count',
                  label: 'Completed projects',
                  value: serverMode ? String(archivedProjects.length) : '—',
                  change: serverMode ? 'Historical delivery' : loading ? 'Loading records' : 'Unavailable',
                  changeToneClassName: serverMode ? 'text-success' : 'text-muted',
                  context: serverMode ? 'Closed project records' : loading ? 'Loading live project records' : 'Live project data unavailable',

                  icon: <CheckCircle2 size={15} />,
                  toneClassName: 'text-success',
                },
                {
                  id: 'archived-value',
                  label: 'Completed value',
                  value: serverMode ? formatAmount(archiveStats.totalValue, currency) : '—',
                  change: serverMode ? archiveStats.clients + ' clients' : loading ? 'Loading records' : 'Unavailable',
                  changeToneClassName: serverMode ? 'text-info' : 'text-muted',
                  context: serverMode ? 'Historical portfolio value' : loading ? 'Loading live project records' : 'Live project data unavailable',

                  icon: <CircleDollarSign size={15} />,
                  toneClassName: 'text-info',
                },
                {
                  id: 'archived-progress',
                  label: 'Average final progress',
                  value: serverMode ? archiveStats.averageProgress + '%' : '—',
                  change: serverMode ? 'Delivery completion' : loading ? 'Loading records' : 'Unavailable',
                  changeToneClassName: serverMode ? 'text-success' : 'text-muted',
                  context: serverMode ? 'Across archived projects' : loading ? 'Loading live project records' : 'Live project data unavailable',

                  icon: <BarChart3 size={15} />,
                  toneClassName: 'text-fg',
                },
                {
                  id: 'archived-clients',
                  label: 'Historical clients',
                  value: serverMode ? String(archiveStats.clients) : '—',
                  change: serverMode ? filteredArchivedProjects.length + ' visible' : loading ? 'Loading records' : 'Unavailable',
                  changeToneClassName: 'text-muted',
                  context: serverMode ? 'Distinct client companies' : loading ? 'Loading live project records' : 'Live project data unavailable',

                  icon: <Users size={15} />,
                  toneClassName: 'text-fg',
                },
              ]}
            />
          </section>


          
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
            <Button type="submit" form="projects-form" loading={saving} disabled={!canManageProjects}>{editingProject ? 'Save changes' : 'Create project'}</Button>
          </>
        )}
      >
        <form id="projects-form" data-ams-feature-slug="projects-editor-form" data-ams-slug="projects-editor-form" onSubmit={saveProject} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-muted">Project name<input required value={projectForm.name} onChange={event => setProjectForm({ ...projectForm, name: event.target.value })} className={fieldClass} /></label>
            {canReadClients && (
              <div className="min-w-0">
                <label className="text-xs text-muted">{language === 'id' ? 'Klien terdaftar' : 'Link existing client'}</label>
                <CustomSelect
                  value={projectForm.clientId}
                  onChange={(clientId) => {
                    const client = clientOptions.find((item) => item.id === clientId);
                    setProjectForm((current) => client
                      ? { ...current, clientId: client.id, clientName: client.name, clientCompany: client.company, clientEmail: client.email }
                      : { ...current, clientId: '', clientName: current.clientId ? '' : current.clientName, clientCompany: current.clientId ? '' : current.clientCompany, clientEmail: current.clientId ? '' : current.clientEmail });
                  }}
                  options={[
                    { value: '', label: language === 'id' ? 'Tidak ditautkan / isi manual' : 'No linked client / enter manually' },
                    ...clientOptions.map((client) => ({
                      value: client.id,
                      label: client.company ? client.company + ' · ' + client.name : client.name
                    }))
                  ]}
                  placeholder={clientOptionsLoading ? (language === 'id' ? 'Memuat klien...' : 'Loading clients...') : (language === 'id' ? 'Pilih klien' : 'Select a client')}
                  disabled={clientOptionsLoading || Boolean(clientOptionsError)}
                  className="mt-1 w-full"
                  triggerClassName="w-full"
                  slug="projects-client-link"
                  aria-label={language === 'id' ? 'Tautkan klien ke proyek' : 'Link client to project'}
                />
                {clientOptionsError && <p className="mt-1 text-[11px] text-danger" role="status">{clientOptionsError} {language === 'id' ? 'Data kontak tetap bisa diisi manual; tautan klien tidak diubah.' : 'Contact details can still be entered manually; the client link is not changed.'}</p>}
              </div>
            )}
            <label className="text-xs text-muted">Client company<input required value={projectForm.clientCompany} onChange={event => setProjectForm({ ...projectForm, clientId: projectForm.clientId && event.target.value !== (clientOptions.find((client) => client.id === projectForm.clientId)?.company || '') ? '' : projectForm.clientId, clientCompany: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted">Client contact<input value={projectForm.clientName} onChange={event => setProjectForm({ ...projectForm, clientId: projectForm.clientId && event.target.value !== (clientOptions.find((client) => client.id === projectForm.clientId)?.name || '') ? '' : projectForm.clientId, clientName: event.target.value })} className={fieldClass} /></label>
            <label className="text-xs text-muted">Client email<input type="email" value={projectForm.clientEmail} onChange={event => setProjectForm({ ...projectForm, clientId: projectForm.clientId && event.target.value !== (clientOptions.find((client) => client.id === projectForm.clientId)?.email || '') ? '' : projectForm.clientId, clientEmail: event.target.value })} className={fieldClass} /></label>
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
            <Button type="submit" form="projects-task-form" loading={saving} disabled={!canManageKanbanTasks}>{editingTask ? 'Save changes' : 'Create task'}</Button>
          </>
        )}
      >
        <form id="projects-task-form" data-ams-feature-slug="projects-task-form" data-ams-slug="projects-task-form" onSubmit={saveTask} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-muted sm:col-span-2">Task title<input required value={taskForm.title} onChange={event => setTaskForm({ ...taskForm, title: event.target.value })} className={fieldClass} /></label>
            <div><label className="text-xs text-muted">Project</label><CustomSelect value={taskForm.projectId} onChange={value => setTaskForm({ ...taskForm, projectId: value })} options={projects.filter(project => project.status !== 'completed' || project.id === taskForm.projectId).map(project => ({ value: project.id, label: project.name + (project.status === 'completed' ? ' (Completed)' : '') }))} className="mt-1 w-full" /></div>
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
    </AdminPageShell>
  );
};

export default AdminProjects;
