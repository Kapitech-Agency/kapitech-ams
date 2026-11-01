import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, Eye, FolderKanban, Pencil } from 'lucide-react';
import { AdminDataTableShell, AdminStatusBadge } from '../AdminModulePrimitives';
import { DashboardControl } from '../DashboardControls';
import { DashboardEmptyState } from '../DashboardEmptyState';
import { CustomSelect } from '../../ui/CustomSelect';
import { ProfileIdentity } from '../ProfileIdentity';

export type TaskExecutionRecord = {
  id: string; title: string; description: string; projectId: string; projectName: string; projectSlug: string;
  clientName: string; assigneeId: string; assignee: string; priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done'; dueDate: string; tags: string[]; blocked: boolean;
  slug: string; createdAt: string; updatedAt?: string; subtasks: Array<{ id: string; title: string; completed: boolean }>;
};
export type TaskExecutionSort = 'title' | 'projectName' | 'assignee' | 'priority' | 'status' | 'dueDate' | 'createdAt';
type RecordActions = {
  onOpen: (task: TaskExecutionRecord) => void;
  onEdit?: (task: TaskExecutionRecord) => void;
  projectHref: (task: TaskExecutionRecord) => string | undefined;
  formatDue: (date: string) => string;
  dueState: (task: TaskExecutionRecord) => string;
};
const statusLabels = { todo: 'To do', in_progress: 'In progress', review: 'Review', done: 'Done' };
const statusTones = { todo: 'neutral', in_progress: 'info', review: 'warning', done: 'success' } as const;
const priorityTones = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' } as const;
const priorityLabels = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

const TaskIdentity = ({ task, onOpen }: { task: TaskExecutionRecord } & Pick<RecordActions, 'onOpen'>) => (
  <div className="ams-task-identity">
    <button type="button" onClick={() => onOpen(task)} aria-label={'Open task ' + task.title}>{task.title}</button>
    <span>{task.projectName} <span aria-hidden="true">&middot;</span> {task.clientName || 'Client not linked'}</span>
    {task.tags.length > 0 && <small>{task.tags.join(' / ')}</small>}
  </div>
);
const Assignee = ({ task }: { task: TaskExecutionRecord }) => task.assignee && task.assignee.toLowerCase() !== 'unassigned'
  ? <ProfileIdentity profile={{ name: task.assignee, contextLabel: 'Task assignee' }} showRole={false} />
  : <span className="text-muted">Unassigned</span>;
const Due = ({ task, formatDue, dueState }: { task: TaskExecutionRecord } & Pick<RecordActions, 'formatDue' | 'dueState'>) => (
  <div className="ams-task-due"><span className={dueState(task) === 'overdue' ? 'text-danger' : dueState(task) === 'due-soon' ? 'text-warning' : ''}>{formatDue(task.dueDate)}</span>
    {task.dueDate && <small>{dueState(task) === 'overdue' ? 'Overdue' : dueState(task) === 'completed' ? 'Completed task' : dueState(task) === 'due-soon' ? 'Due soon' : dueState(task) === 'this-week' ? 'Due this week' : 'Scheduled'}</small>}
  </div>
);
const Checklist = ({ task }: { task: TaskExecutionRecord }) => <span className="ams-task-checklist-summary">{task.subtasks.length ? task.subtasks.filter(item => item.completed).length + '/' + task.subtasks.length + ' checklist items' : 'No checklist recorded'}</span>;
const TaskActions = ({ task, onOpen, onEdit, projectHref }: { task: TaskExecutionRecord } & Pick<RecordActions, 'onOpen' | 'onEdit' | 'projectHref'>) => {
  const href = projectHref(task);
  return <div className="ams-task-actions">
    <DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" icon={<Eye size={14} />} onClick={() => onOpen(task)} ariaLabel={'View task ' + task.title}>View</DashboardControl>
    {onEdit && <DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" icon={<Pencil size={14} />} onClick={() => onEdit(task)} ariaLabel={'Edit task ' + task.title}>Edit</DashboardControl>}
    {href && <DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" icon={<FolderKanban size={14} />} to={href} ariaLabel={'Open project delivery for ' + task.title}>Project</DashboardControl>}
  </div>;
};

/** Shared task meaning across Board, List, project queues and blocked work. */
export const TaskExecutionCard: React.FC<{ task: TaskExecutionRecord; dragHandle?: React.ReactNode; stageActions?: React.ReactNode; showBrief?: boolean } & RecordActions> = props => (
  <div className="ams-task-card-content">
    <div className="ams-task-card-heading">{props.dragHandle}<TaskIdentity {...props} /></div>
    <div className="ams-task-signals"><AdminStatusBadge tone={statusTones[props.task.status]}>{statusLabels[props.task.status]}</AdminStatusBadge><AdminStatusBadge tone={priorityTones[props.task.priority]}>{priorityLabels[props.task.priority]}</AdminStatusBadge>{props.task.blocked && <AdminStatusBadge tone="danger">Blocked / waiting</AdminStatusBadge>}</div>
    <div className="ams-task-card-context"><Assignee task={props.task} /><Due {...props} /></div>
    <Checklist task={props.task} />
    {props.showBrief && <div className="ams-task-brief"><strong>Task brief</strong><p>{props.task.description || 'No task brief recorded.'}</p></div>}
    <div className="ams-task-card-footer"><TaskActions {...props} />{props.stageActions}</div>
  </div>
);

export const TaskExecutionList: React.FC<{
  rows: TaskExecutionRecord[]; canManage: boolean; selectedIds: string[]; allVisibleSelected: boolean;
  onSelect: (id: string) => void; onSelectVisible: () => void;
  sortKey: TaskExecutionSort; sortDirection: 'asc' | 'desc'; onSort: (key: TaskExecutionSort) => void;
  onStatus?: (task: TaskExecutionRecord, status: TaskExecutionRecord['status']) => void; mutating?: boolean;
} & RecordActions> = props => {
  const heading = (key: TaskExecutionSort, label: string) => <DashboardControl variant="filter" active={props.sortKey === key} size="compact" onClick={() => props.onSort(key)} ariaLabel={'Sort tasks by ' + label}>{label}{props.sortKey === key ? props.sortDirection === 'asc' ? ' ↑' : ' ↓' : ''}</DashboardControl>;
  const sortState = (key: TaskExecutionSort) => props.sortKey === key ? props.sortDirection === 'asc' ? 'ascending' as const : 'descending' as const : 'none' as const;
  return <AdminDataTableShell embedded className="ams-task-register" slug="tasks-list-records">
    <div className="ams-task-compact-list" role="list" aria-label="Task cards">{props.rows.map(task => <article key={task.id} role="listitem" className="ams-task-compact-record ams-overview-panel">
      {props.canManage && <label className="ams-task-selection"><input type="checkbox" disabled={props.mutating} checked={props.selectedIds.includes(task.id)} onChange={() => props.onSelect(task.id)} />Select task</label>}
      <TaskExecutionCard {...props} task={task} />
    </article>)}</div>
    <div className="ams-task-table-scroll custom-scrollbar" data-ams-feature-slug="tasks-table-view" tabIndex={0} role="region" aria-label="Scrollable task register">
      <table className="ams-data-table"><caption className="sr-only">Task delivery register: brief, project, ownership, priority, stage, dates and checklist.</caption>
        <thead><tr>
          {props.canManage && <th scope="col"><input type="checkbox" disabled={props.mutating} checked={props.allVisibleSelected} onChange={props.onSelectVisible} aria-label="Select visible tasks" /></th>}
          <th scope="col" aria-sort={sortState('title')}>{heading('title', 'Task & project')}</th><th scope="col" aria-sort={sortState('assignee')}>{heading('assignee', 'Assignee')}</th><th scope="col" aria-sort={sortState('priority')}>{heading('priority', 'Priority')}</th><th scope="col" aria-sort={sortState('status')}>{heading('status', 'Stage')}</th><th scope="col" aria-sort={sortState('dueDate')}>{heading('dueDate', 'Due date')}</th><th scope="col">Checklist</th><th scope="col">Actions</th>
        </tr></thead>
        <tbody>{props.rows.map(task => <tr key={task.id} data-ams-slug={task.slug}>
          {props.canManage && <td><input type="checkbox" disabled={props.mutating} checked={props.selectedIds.includes(task.id)} onChange={() => props.onSelect(task.id)} aria-label={'Select ' + task.title} /></td>}
          <td><TaskIdentity task={task} onOpen={props.onOpen} /></td><td><Assignee task={task} /></td><td><AdminStatusBadge tone={priorityTones[task.priority]}>{priorityLabels[task.priority]}</AdminStatusBadge></td>
          <td><div className="ams-task-signals">{props.onStatus ? <CustomSelect value={task.status} disabled={props.mutating} onChange={value => props.onStatus?.(task, value as TaskExecutionRecord['status'])} options={Object.entries(statusLabels).map(([value,label]) => ({value,label}))} aria-label={'Change stage for ' + task.title} /> : <AdminStatusBadge tone={statusTones[task.status]}>{statusLabels[task.status]}</AdminStatusBadge>}{task.blocked && <AdminStatusBadge tone="danger">Blocked / waiting</AdminStatusBadge>}</div></td><td><Due {...props} task={task} /></td><td><Checklist task={task} /></td><td><TaskActions {...props} task={task} /></td>
        </tr>)}</tbody>
      </table>
    </div>
  </AdminDataTableShell>;
};

const ProjectQueue: React.FC<{ tasks: TaskExecutionRecord[] } & RecordActions> = ({ tasks, ...actions }) => {
  const [expanded, setExpanded] = useState(false);
  const task = tasks[0];
  return <details className="ams-task-project-queue" onToggle={event => setExpanded(event.currentTarget.open)}>
    <summary><span><strong>{task.projectId ? task.projectName : 'Tasks without a linked project'}</strong><span>{task.projectId ? task.clientName || 'Client not linked' : 'Review project linkage in each task.'}</span></span><span className="ams-task-project-counts"><span>{tasks.length} tasks</span><span>{tasks.filter(item => item.status !== 'done').length} open</span><span>{tasks.filter(item => item.status === 'done').length} done</span><span>{tasks.filter(item => item.status === 'review').length} review</span><span>{tasks.filter(item => item.blocked).length} flagged</span></span><ChevronDown size={14} aria-hidden="true" /></summary>
    {expanded && <div className="ams-task-project-records">{tasks.map(item => <article key={item.id} className="ams-task-compact-record ams-overview-panel"><TaskExecutionCard {...actions} task={item} /></article>)}</div>}
  </details>;
};

export const TaskProjectQueues: React.FC<{ records: TaskExecutionRecord[] } & RecordActions> = ({ records, ...actions }) => {
  const groups = new Map<string, TaskExecutionRecord[]>();
  records.forEach(task => { const key = task.projectId || '__unlinked__'; groups.set(key, [...(groups.get(key) || []), task]); });
  return <section className="ams-task-project-queues" data-ams-feature-slug="tasks-project-queues" aria-label="Tasks grouped by project"><p className="ams-task-view-help">Open a project queue to inspect its tasks. Counts reflect the selected queue and filters.</p>{[...groups].map(([key, tasks]) => <ProjectQueue key={key} tasks={tasks} {...actions} />)}</section>;
};

export const TaskBlockedWork: React.FC<{ rows: TaskExecutionRecord[] } & RecordActions> = props => <section className="ams-task-blocked-work" data-ams-feature-slug="tasks-blocked-work" aria-label="Blocked and waiting tasks">
  <div className="ams-task-blocker-guidance"><AlertTriangle size={16} aria-hidden="true" /><p>These tasks carry a blocked or waiting flag. Review their brief, tags and assignee before changing stage. A prerequisite task or blocker reason is not recorded as a separate field.</p></div>
  {props.rows.length ? <div className="ams-task-blocker-grid">{props.rows.map(task => <article key={task.id} className="ams-task-compact-record ams-overview-panel"><TaskExecutionCard {...props} task={task} showBrief /></article>)}</div> : <DashboardEmptyState eyebrow="Blocked work" title="No blocked or waiting tasks in this view" description="Flagged tasks will appear here when they match the current queue and filters." icon={<AlertTriangle size={17} />} />}
</section>;
