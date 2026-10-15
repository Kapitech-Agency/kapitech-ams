import React, { useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronRight, Clock3, FileText, GripVertical, MessageSquare, Plus, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from '../components/ui/Modal';
import { WorkspaceRole } from './workspaceAccess';
import {
  ActionButton,
  dateLabel,
  idrCompact,
  MetricCard,
  ProgressRing,
  SectionPanel,
  StatusBadge,
  TableScroller,
  tableCellClassName,
  tableClassName,
  tableHeadClassName,
  TextField,
  WorkspacePage,
} from './WorkspacePrimitives';

type ProjectStatus = 'Planning' | 'In delivery' | 'Client review' | 'On hold' | 'Done';
interface ProjectRecord {
  id: string;
  name: string;
  client: string;
  owner: string;
  status: ProjectStatus;
  dueAt: string;
  health: 'On track' | 'At risk' | 'Delayed';
  memberRoles: WorkspaceRole[];
  progress: number;
}
const PROJECTS: ProjectRecord[] = [
  { id: 'PRJ-031', name: 'Aurora Commerce Platform', client: 'Aurora Commerce', owner: 'Rafi Pratama', status: 'In delivery', dueAt: '2026-11-04', health: 'On track', memberRoles: ['Admin', 'PM', 'Creative'], progress: 68 },
  { id: 'PRJ-032', name: 'Nusantara Health Portal', client: 'Nusantara Health', owner: 'Dina Kartika', status: 'Client review', dueAt: '2026-10-28', health: 'At risk', memberRoles: ['Admin', 'PM', 'Creative'], progress: 82 },
  { id: 'PRJ-033', name: 'Partner API Integration', client: 'Partner Portal Co.', owner: 'Rafi Pratama', status: 'In delivery', dueAt: '2026-11-12', health: 'On track', memberRoles: ['Admin', 'PM', 'Freelancer'], progress: 44 },
  { id: 'PRJ-034', name: 'Kapitech Editorial System', client: 'Internal', owner: 'Mika Putri', status: 'Planning', dueAt: '2026-11-20', health: 'On track', memberRoles: ['Admin', 'PM', 'Creative'], progress: 16 },
  { id: 'PRJ-035', name: 'Sababay Website Care', client: 'Sababay Digital', owner: 'Dina Kartika', status: 'On hold', dueAt: '2026-10-30', health: 'Delayed', memberRoles: ['Admin', 'PM', 'Freelancer'], progress: 57 },
];

type TaskStage = 'Backlog' | 'In Progress' | 'Internal Review' | 'Client Review' | 'Done';
interface WorkTask {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  assignee: string;
  dueAt: string;
  priority: 'High' | 'Medium' | 'Low';
  stage: TaskStage;
  assignedRoles: WorkspaceRole[];
  subtasks: string[];
  comments: Array<{ author: string; text: string; time: string }>;
}
const TASK_STAGES: TaskStage[] = ['Backlog', 'In Progress', 'Internal Review', 'Client Review', 'Done'];
const INITIAL_TASKS: WorkTask[] = [
  { id: 'TSK-214', title: 'Finalize mobile checkout states', projectId: 'PRJ-031', projectName: 'Aurora Commerce Platform', assignee: 'Mika Putri', dueAt: '2026-10-15', priority: 'High', stage: 'In Progress', assignedRoles: ['Admin', 'PM', 'Creative'], subtasks: ['Validate empty-cart state', 'Confirm responsive spacing', 'Export handoff assets'], comments: [{ author: 'Dina Kartika', text: 'Please include one screenshot for the narrow mobile breakpoint.', time: '15 Oct · 14:10' }] },
  { id: 'TSK-219', title: 'Review patient dashboard prototype', projectId: 'PRJ-032', projectName: 'Nusantara Health Portal', assignee: 'Mika Putri', dueAt: '2026-10-16', priority: 'High', stage: 'Internal Review', assignedRoles: ['Admin', 'PM', 'Creative'], subtasks: ['Audit dashboard hierarchy', 'Check chart labels'], comments: [{ author: 'Rafi Pratama', text: 'Review against the agreed KPI definition before client review.', time: '15 Oct · 12:42' }] },
  { id: 'TSK-221', title: 'Complete API acceptance notes', projectId: 'PRJ-033', projectName: 'Partner API Integration', assignee: 'A. Freelancer', dueAt: '2026-10-16', priority: 'High', stage: 'In Progress', assignedRoles: ['Admin', 'PM', 'Freelancer'], subtasks: ['Verify error responses', 'Document pagination cases', 'Attach test evidence'], comments: [{ author: 'Rafi Pratama', text: 'Attach the acceptance evidence to the internal review thread.', time: '15 Oct · 13:30' }] },
  { id: 'TSK-223', title: 'Prepare API test fixture', projectId: 'PRJ-033', projectName: 'Partner API Integration', assignee: 'A. Freelancer', dueAt: '2026-10-18', priority: 'Medium', stage: 'Backlog', assignedRoles: ['Admin', 'PM', 'Freelancer'], subtasks: ['Create payload examples', 'Verify auth expiry response'], comments: [] },
  { id: 'TSK-228', title: 'Confirm editorial component inventory', projectId: 'PRJ-034', projectName: 'Kapitech Editorial System', assignee: 'Mika Putri', dueAt: '2026-10-19', priority: 'Medium', stage: 'Backlog', assignedRoles: ['Admin', 'PM', 'Creative'], subtasks: ['List available block types', 'Flag missing authoring states'], comments: [] },
];

const healthTone = (health: ProjectRecord['health']) =>
  health === 'On track' ? 'success' : health === 'At risk' ? 'warning' : 'danger';
const priorityTone = (priority: WorkTask['priority']) =>
  priority === 'High' ? 'danger' : priority === 'Medium' ? 'warning' : 'neutral';

const FreelancerAssignedTaskCards: React.FC = () => {
  const assigned = INITIAL_TASKS.filter((task) => task.assignedRoles.includes('Freelancer'));
  return (
    <div className="grid min-w-0 gap-4">
      <div className="rounded-control border border-line bg-panel px-3 py-3 text-[11px] leading-5 text-muted">Freelancer view is scoped to assigned task cards only. Project-wide timelines, cross-project matrices and unassigned work are not rendered.</div>
      <SectionPanel title="Assigned single-task cards" description="Only tasks assigned to the Freelancer role are included in this preview.">
        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {assigned.map((task) => (
            <article key={task.id} className="min-w-0 rounded-control border border-line p-4">
              <div className="flex items-start justify-between gap-2"><StatusBadge tone={priorityTone(task.priority)}>{task.priority} priority</StatusBadge><span className="font-mono text-[10px] text-muted">{task.id}</span></div>
              <h3 className="mt-3 text-[13px] font-semibold leading-5 text-fg">{task.title}</h3>
              <p className="mt-1 text-[11px] text-muted">{task.projectName}</p>
              <div className="mt-4 grid gap-2 border-t border-line pt-3">
                <div className="flex items-center justify-between gap-2 text-[11px]"><span className="text-muted">Due date</span><span className="font-medium text-fg">{dateLabel(task.dueAt)}</span></div>
                <div className="flex items-center justify-between gap-2 text-[11px]"><span className="text-muted">Workflow</span><StatusBadge tone={task.stage === 'Done' ? 'success' : task.stage.includes('Review') ? 'info' : 'neutral'}>{task.stage}</StatusBadge></div>
                <div className="flex items-center justify-between gap-2 text-[11px]"><span className="text-muted">Nested subtasks</span><span className="font-medium tabular-nums text-fg">{task.subtasks.length}</span></div>
              </div>
              <Link to="/workspace/projects/tasks" className="mt-4 inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-accent-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{'Open task detail'} <ChevronRight size={13} /></Link>
            </article>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
};

export const ProjectHubView: React.FC<{ role: WorkspaceRole | null }> = ({ role }) => {
  const [tab, setTab] = useState<'board' | 'timeline' | 'matrix'>('board');
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const writable = role === 'Admin' || role === 'PM';
  const projects = PROJECTS.filter((project) => role === 'Admin' || role === 'PM' || (role ? project.memberRoles.includes(role) : false));
  const visibleTasks = tasks.filter((task) => role === 'Admin' || role === 'PM' || (role ? task.assignedRoles.includes(role) : false));

  const moveTask = (taskId: string, stage: TaskStage) => {
    if (!writable) return;
    setTasks((items) => items.map((task) => task.id === taskId ? { ...task, stage } : task));
  };

  if (role === 'Freelancer') return (
    <WorkspacePage slug="workspace-project-hub-freelancer" title="Project Hub" description="Your assigned task scope, with project-wide planning views intentionally hidden.">
      <FreelancerAssignedTaskCards />
    </WorkspacePage>
  );

  return (
    <WorkspacePage slug="workspace-project-hub" title="Project Hub" description="Switch between delivery kanban, timeline planning and the project list matrix." actions={<StatusBadge tone={writable ? 'info' : 'neutral'}>{writable ? 'Project management' : 'Member view · assigned projects only'}</StatusBadge>}>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Visible projects" value={String(projects.length)} detail={role === 'Creative' ? 'Projects with your member role' : 'All workspace projects'} />
        <MetricCard label="Tasks in delivery" value={String(visibleTasks.filter((task) => !['Backlog', 'Done'].includes(task.stage)).length)} detail="In progress or in review" tone="info" />
        <MetricCard label="At-risk projects" value={String(projects.filter((project) => project.health !== 'On track').length)} detail="Require review" tone={projects.some((project) => project.health !== 'On track') ? 'warning' : 'success'} />
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-1 overflow-x-auto rounded-control border border-line bg-panel p-1" role="tablist" aria-label="Project hub views">
        {[
          { key: 'board' as const, label: 'Kanban task board' },
          { key: 'timeline' as const, label: 'Gantt timeline' },
          { key: 'matrix' as const, label: 'Project list matrix' },
        ].map((item) => <button key={item.key} type="button" role="tab" aria-selected={tab === item.key} onClick={() => setTab(item.key)} className={'min-h-8 shrink-0 rounded-chip border px-3 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' + (tab === item.key ? 'border-accent/25 bg-accent/10 text-fg' : 'border-transparent text-muted hover:bg-bg hover:text-fg')}>{item.label}</button>)}
        {!writable && <span className="ml-auto px-2 text-[10px] text-muted">Read-only member view</span>}
      </div>

      {tab === 'board' && (
        <SectionPanel title="Interactive task board" description="Move tasks between delivery stages. Only Admin and PM roles can change workflow stages.">
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max items-start gap-3">
              {TASK_STAGES.map((stage) => {
                const items = visibleTasks.filter((task) => task.stage === stage);
                return (
                  <section key={stage} aria-label={stage + ' tasks'} onDragOver={(event) => { if (writable) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); if (writable && draggedTask) moveTask(draggedTask, stage); setDraggedTask(null); }} className="w-[238px] min-w-[238px] rounded-card border border-line bg-bg/60 p-2.5">
                    <header className="mb-2.5 flex items-center justify-between border-b border-line px-1 pb-2.5"><h3 className="text-[11px] font-semibold text-fg">{stage}</h3><span className="rounded-badge border border-line bg-panel px-1.5 py-0.5 text-[10px] tabular-nums text-muted">{items.length}</span></header>
                    <div className="grid min-h-[170px] content-start gap-2">
                      {items.map((task) => (
                        <article key={task.id} draggable={writable} onDragStart={(event) => { if (!writable) return; setDraggedTask(task.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', task.id); }} onDragEnd={() => setDraggedTask(null)} className={'min-w-0 rounded-control border border-line bg-panel p-3 ' + (writable ? 'cursor-grab active:cursor-grabbing' : '')}>
                          <div className="flex items-start justify-between gap-2"><span className="font-mono text-[10px] text-muted">{task.id}</span><StatusBadge tone={priorityTone(task.priority)}>{task.priority}</StatusBadge></div>
                          <p className="mt-2 text-[12px] font-semibold leading-4 text-fg">{task.title}</p>
                          <p className="mt-1 text-[10px] text-muted">{task.projectName}</p>
                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2 text-[10px] text-muted"><span>{task.assignee}</span><span>{dateLabel(task.dueAt)}</span></div>
                          <label className="mt-2 grid gap-1 text-[10px] font-medium text-muted">Workflow stage
                            <select aria-label={'Move ' + task.title} value={task.stage} disabled={!writable} onChange={(event) => moveTask(task.id, event.target.value as TaskStage)} className="h-8 min-w-0 rounded-control border border-line bg-panel px-2 text-[10px] text-fg disabled:opacity-60">{TASK_STAGES.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                          </label>
                        </article>
                      ))}
                      {!items.length && <p className="rounded-control border border-dashed border-line p-4 text-center text-[10px] text-muted">No tasks in this stage</p>}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </SectionPanel>
      )}

      {tab === 'timeline' && (
        <SectionPanel title="Dynamic Gantt chart timeline" description="Planning scaffold with week cells and project phase bars. Replace sample dates with the existing project API response.">
          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              <div className="grid grid-cols-[230px_repeat(5,minmax(88px,1fr))] border-b border-line bg-bg text-[10px] font-semibold text-muted">
                <div className="px-3 py-3">Project / owner</div>{['12–18 Oct', '19–25 Oct', '26 Oct–1 Nov', '2–8 Nov', '9–15 Nov'].map((week) => <div key={week} className="border-l border-line px-2 py-3 text-center">{week}</div>)}
              </div>
              {projects.map((project, index) => {
                const startCol = index === 0 ? 1 : index === 1 ? 2 : index === 2 ? 2 : index === 3 ? 1 : 3;
                const span = index === 1 ? 3 : index === 3 ? 4 : 2;
                return <div key={project.id} className="grid grid-cols-[230px_repeat(5,minmax(88px,1fr))] border-b border-line">
                  <div className="px-3 py-3"><p className="text-[11px] font-semibold text-fg">{project.name}</p><p className="mt-1 text-[10px] text-muted">{project.owner} · {project.progress}%</p></div>
                  <div className="col-span-5 grid grid-cols-5 items-center" style={{ gridColumn: '2 / span 5' }}>
                    <div className="col-span-5 grid grid-cols-5 gap-0">
                      {Array.from({ length: 5 }, (_, cell) => <div key={cell} className="relative h-[53px] border-l border-line first:border-l-0" />)}
                      <div className="pointer-events-none col-span-5 row-start-1 self-center px-2" style={{ gridColumn: startCol + ' / span ' + span }}>
                        <div className={'flex h-6 items-center rounded-chip border px-2 text-[10px] font-semibold ' + (project.health === 'On track' ? 'border-success/20 bg-success/10 text-success' : project.health === 'At risk' ? 'border-warning/25 bg-warning/10 text-warning' : 'border-danger/20 bg-danger/10 text-danger')}>{project.progress}% · {project.status}</div>
                      </div>
                    </div>
                  </div>
                </div>;
              })}
            </div>
          </div>
        </SectionPanel>
      )}

      {tab === 'matrix' && (
        <SectionPanel title="Project list matrix" description="Filter scope has already been applied for the active role.">
          <TableScroller label="Project list matrix">
            <table className={tableClassName + ' min-w-[800px]'}>
              <thead className={tableHeadClassName}><tr><th className="px-3 py-3">Project</th><th className="px-3 py-3">Client</th><th className="px-3 py-3">Project owner</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Health</th><th className="px-3 py-3">Due date</th><th className="px-3 py-3 text-right">Progress</th></tr></thead>
              <tbody>{projects.map((project) => <tr key={project.id} className="hover:bg-bg/60"><td className={tableCellClassName}><p className="font-semibold text-fg">{project.name}</p><p className="mt-1 font-mono text-[10px] text-muted">{project.id}</p></td><td className={tableCellClassName + ' text-muted'}>{project.client}</td><td className={tableCellClassName + ' text-fg'}>{project.owner}</td><td className={tableCellClassName}><StatusBadge tone={project.status === 'Done' ? 'success' : project.status === 'On hold' ? 'warning' : 'info'}>{project.status}</StatusBadge></td><td className={tableCellClassName}><StatusBadge tone={healthTone(project.health)}>{project.health}</StatusBadge></td><td className={tableCellClassName + ' whitespace-nowrap tabular-nums text-muted'}>{dateLabel(project.dueAt)}</td><td className={tableCellClassName + ' text-right tabular-nums font-semibold text-fg'}>{project.progress}%</td></tr>)}</tbody>
            </table>
          </TableScroller>
        </SectionPanel>
      )}
    </WorkspacePage>
  );
};

export const TaskDeliverablesView: React.FC<{ role: WorkspaceRole | null }> = ({ role }) => {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [checkedSubtasks, setCheckedSubtasks] = useState<Record<string, string[]>>({});
  const visibleTasks = useMemo(() => tasks.filter((task) => role === 'Admin' || role === 'PM' || (role ? task.assignedRoles.includes(role) : false)), [role, tasks]);
  const selectedTask = visibleTasks.find((task) => task.id === selectedId) || null;

  const updateTask = (taskId: string, update: (task: WorkTask) => WorkTask) => setTasks((current) => current.map((task) => task.id === taskId ? update(task) : task));
  const addSubtask = (event: React.FormEvent) => {
    event.preventDefault();
    const text = newSubtask.trim();
    if (!selectedTask || !text) return;
    updateTask(selectedTask.id, (task) => ({ ...task, subtasks: [...task.subtasks, text] }));
    setNewSubtask('');
  };
  const addComment = (event: React.FormEvent) => {
    event.preventDefault();
    const text = newComment.trim();
    if (!selectedTask || !text) return;
    updateTask(selectedTask.id, (task) => ({ ...task, comments: [...task.comments, { author: role || 'Team member', text, time: 'Just now' }] }));
    setNewComment('');
  };
  const toggleSubtask = (taskId: string, item: string) => setCheckedSubtasks((current) => {
    const present = current[taskId] || [];
    return { ...current, [taskId]: present.includes(item) ? present.filter((value) => value !== item) : [...present, item] };
  });

  return (
    <WorkspacePage slug="workspace-task-engine" title="Task & Deliverables Engine" description="Nested task planning, deliverable proofing and review discussion threads." actions={<StatusBadge tone="info">{visibleTasks.length} visible tasks</StatusBadge>}>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <MetricCard label="Active deliverables" value={String(visibleTasks.filter((task) => task.stage !== 'Done').length)} detail="Assigned to current role" />
        <MetricCard label="Internal review" value={String(visibleTasks.filter((task) => task.stage === 'Internal Review').length)} detail="Awaiting internal proofing" tone="warning" />
        <MetricCard label="Nested sub-tasks" value={String(visibleTasks.reduce((sum, task) => sum + task.subtasks.length, 0))} detail="Across visible deliverables" tone="info" />
      </div>
      <SectionPanel title="Deliverables and task hierarchy" description="Open a task to review nested subtasks and internal proofing comments. Local changes are not persisted to the server.">
        <div className="grid min-w-0 gap-2">
          {visibleTasks.map((task) => {
            const checked = checkedSubtasks[task.id] || [];
            return (
              <article key={task.id} className="flex min-w-0 flex-col gap-3 rounded-control border border-line p-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted"><FileText size={15} /></span>
                  <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold leading-4 text-fg">{task.title}</p><p className="mt-1 truncate text-[10px] text-muted">{task.projectName} · {task.id}</p><div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge tone={priorityTone(task.priority)}>{task.priority} priority</StatusBadge><StatusBadge tone={task.stage === 'Done' ? 'success' : task.stage.includes('Review') ? 'info' : 'neutral'}>{task.stage}</StatusBadge></div></div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3 text-[10px] text-muted"><span className="inline-flex items-center gap-1"><UsersRound size={12} />{task.assignee}</span><span className="inline-flex items-center gap-1"><CalendarDays size={12} />{dateLabel(task.dueAt)}</span><span className="inline-flex items-center gap-1"><Check size={12} />{checked.length}/{task.subtasks.length}</span><ActionButton compact onClick={() => setSelectedId(task.id)}>Open task detail <ChevronRight size={12} /></ActionButton></div>
              </article>
            );
          })}
          {!visibleTasks.length && <p className="rounded-control border border-dashed border-line p-6 text-center text-[11px] text-muted">No deliverables are assigned to this role in the preview data.</p>}
        </div>
      </SectionPanel>

      <Modal
        open={Boolean(selectedTask)}
        onClose={() => { setSelectedId(null); setNewSubtask(''); setNewComment(''); }}
        title={selectedTask ? selectedTask.title : 'Task detail'}
        description={selectedTask ? selectedTask.projectName + ' · ' + selectedTask.id + ' · Assigned to ' + selectedTask.assignee : undefined}
        size="2xl"
        footer={<ActionButton variant="primary" onClick={() => { setSelectedId(null); setNewSubtask(''); setNewComment(''); }}>Close task detail</ActionButton>}
      >
        {selectedTask && (
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="min-w-0">
              <SectionPanel title="Nested sub-task builder" description="Use checkboxes to track subtask completion in this view.">
                <div className="grid gap-2">
                  {selectedTask.subtasks.map((item, index) => {
                    const checked = (checkedSubtasks[selectedTask.id] || []).includes(item);
                    return <label key={item + index} className="flex min-w-0 items-start gap-2.5 rounded-control border border-line px-2.5 py-2"><input type="checkbox" checked={checked} onChange={() => toggleSubtask(selectedTask.id, item)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" /><span className={'flex-1 text-[11px] leading-4 ' + (checked ? 'text-muted line-through' : 'text-fg')}>{item}</span><span className="text-[10px] text-muted">S{index + 1}</span></label>;
                  })}
                  <form onSubmit={addSubtask} className="flex min-w-0 gap-2 pt-2">
                    <label className="sr-only" htmlFor="new-subtask">New sub-task</label><input id="new-subtask" value={newSubtask} onChange={(event) => setNewSubtask(event.target.value)} placeholder="Add a nested sub-task" className="h-9 min-w-0 flex-1 rounded-control border border-line bg-panel px-3 text-[11px] text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                    <ActionButton type="submit" variant="primary" disabled={!newSubtask.trim()}><Plus size={13} />Add</ActionButton>
                  </form>
                </div>
              </SectionPanel>
              <div className="mt-4 rounded-control border border-line bg-bg p-3">
                <p className="text-[11px] font-semibold text-fg">Internal proofing checklist</p>
                <ul className="mt-2 grid gap-2 text-[11px] leading-4 text-muted"><li className="flex gap-2"><Check size={13} className="shrink-0 text-success" />Acceptance criteria reviewed</li><li className="flex gap-2"><Clock3 size={13} className="shrink-0 text-muted" />Attach final evidence before client review</li><li className="flex gap-2"><MessageSquare size={13} className="shrink-0 text-muted" />Resolve reviewer comments before moving to Done</li></ul>
              </div>
            </div>
            <div className="min-w-0">
              <SectionPanel title="Internal proofing & review space" description="Comment stream for team review and revision context.">
                <div className="grid max-h-[300px] gap-3 overflow-y-auto pr-1">
                  {selectedTask.comments.map((comment, index) => <article key={comment.author + comment.time + index} className="rounded-control border border-line p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[11px] font-semibold text-fg">{comment.author}</p><time className="text-[10px] text-muted">{comment.time}</time></div><p className="mt-2 text-[11px] leading-5 text-muted">{comment.text}</p></article>)}
                  {!selectedTask.comments.length && <p className="rounded-control border border-dashed border-line p-4 text-center text-[11px] text-muted">No comments yet.</p>}
                </div>
                <form onSubmit={addComment} className="mt-3 grid gap-2 border-t border-line pt-3">
                  <label htmlFor="new-review-comment" className="text-[11px] font-medium text-fg">Add a review comment</label><textarea id="new-review-comment" value={newComment} onChange={(event) => setNewComment(event.target.value)} rows={3} placeholder="Describe requested changes or proofing notes..." className="min-w-0 resize-y rounded-control border border-line bg-panel p-3 text-[11px] text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                  <div className="flex justify-end"><ActionButton type="submit" variant="primary" disabled={!newComment.trim()}>Post comment</ActionButton></div>
                </form>
              </SectionPanel>
            </div>
          </div>
        )}
      </Modal>
    </WorkspacePage>
  );
};

interface RetainerRecord {
  id: string;
  client: string;
  packageName: string;
  allowance: number;
  burned: number;
  resetAt: string;
  alert: string;
}
const RETAINERS: RetainerRecord[] = [
  { id: 'RET-012', client: 'Aurora Commerce', packageName: 'Product engineering · monthly', allowance: 160, burned: 124, resetAt: '2026-11-01', alert: 'On track' },
  { id: 'RET-013', client: 'Nusantara Health', packageName: 'Design & optimization', allowance: 80, burned: 69, resetAt: '2026-11-01', alert: 'Approaching cap' },
  { id: 'RET-014', client: 'Sababay Digital', packageName: 'Website care', allowance: 40, burned: 17, resetAt: '2026-11-01', alert: 'On track' },
];

export const RetainerManagerView: React.FC = () => (
  <WorkspacePage slug="workspace-retainer-manager" title="Retainer Manager & Hours Pool" description="Monthly hours allocations, consumed delivery time, remaining quota and approaching-cap alerts.">
    <div className="grid min-w-0 gap-3 sm:grid-cols-3">
      <MetricCard label="Allocated hours" value={String(RETAINERS.reduce((sum, item) => sum + item.allowance, 0))} detail="Across active monthly pools" />
      <MetricCard label="Hours burned" value={String(RETAINERS.reduce((sum, item) => sum + item.burned, 0))} detail="Logged in preview records" tone="info" />
      <MetricCard label="Hours remaining" value={String(RETAINERS.reduce((sum, item) => sum + item.allowance - item.burned, 0))} detail="Reset on 1 Nov 2026" tone="success" />
    </div>
    <SectionPanel title="Monthly hours pool counters" description="Progress rings show usage against the contracted monthly allocation.">
      <div className="grid min-w-0 gap-3 xl:grid-cols-3">
        {RETAINERS.map((item) => {
          const usage = Math.round(item.burned / item.allowance * 100);
          const remaining = item.allowance - item.burned;
          const warning = usage >= 80;
          return (
            <article key={item.id} className="min-w-0 rounded-control border border-line p-4">
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-[12px] font-semibold text-fg">{item.client}</h3><p className="mt-1 text-[10px] text-muted">{item.packageName}</p></div><StatusBadge tone={warning ? 'warning' : 'success'}>{warning ? 'Approaching cap' : 'On track'}</StatusBadge></div>
              <div className="my-4 flex flex-wrap items-center justify-between gap-3">
                <ProgressRing value={item.burned} max={item.allowance} label="Monthly hours used" size={102} warningAt={80} sublabel={item.burned + ' hours burned'} />
                <div className="grid gap-3 text-right"><div><p className="text-[10px] text-muted">Monthly quota</p><p className="mt-1 text-[14px] font-semibold tabular-nums text-fg">{item.allowance} h</p></div><div><p className="text-[10px] text-muted">Remaining</p><p className="mt-1 text-[14px] font-semibold tabular-nums text-fg">{remaining} h</p></div></div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className={'h-full rounded-full ' + (warning ? 'bg-warning' : 'bg-accent')} style={{ width: usage + '%' }} /></div>
              {warning && <p className="mt-3 text-[11px] leading-4 text-warning">Usage is above the 80% alert threshold. Confirm remaining scope with the delivery owner.</p>}
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[10px] text-muted"><span>{item.id}</span><span>Resets {dateLabel(item.resetAt)}</span></div>
            </article>
          );
        })}
      </div>
    </SectionPanel>
  </WorkspacePage>
);
