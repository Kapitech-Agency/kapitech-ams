import React, { FormEvent, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  CircleDollarSign,
  FileText,
  Filter,
  FolderKanban,
  LayoutGrid,
  ListTodo,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Target,
  UsersRound,
  X,
} from '../../lib/untitled-ui-icon-bridge';
import { AdminPageShell } from './AdminModulePrimitives';
import { Drawer } from '../ui/Drawer';
import Button from '../ui/Button';

type PreviewTab = 'Overview' | 'Projects' | 'My tasks' | 'Workflow' | 'Calendar' | 'Reports';
type TaskStatus = 'To do' | 'In progress' | 'In review' | 'Done';
type TaskPriority = 'Low' | 'Medium' | 'High';

interface PreviewTask {
  id: string;
  title: string;
  project: string;
  owner: string;
  initials: string;
  status: TaskStatus;
  priority: TaskPriority;
  due: string;
  dueKey: 'today' | 'tomorrow' | 'later';
  comments: number;
}

interface PreviewProject {
  id: string;
  name: string;
  client: string;
  owner: string;
  initials: string;
  stage: string;
  progress: number;
  health: 'On track' | 'Needs attention' | 'At risk';
  due: string;
  type: string;
}

const initialTasks: PreviewTask[] = [
  { id: 'TSK-241', title: 'Approve homepage direction', project: 'Kapitech Public Site', owner: 'Fikri', initials: 'FN', status: 'In review', priority: 'High', due: 'Today', dueKey: 'today', comments: 4 },
  { id: 'TSK-242', title: 'Finalize mobile navigation', project: 'Kapitech Public Site', owner: 'Nadia', initials: 'NA', status: 'In progress', priority: 'High', due: 'Today', dueKey: 'today', comments: 2 },
  { id: 'TSK-243', title: 'Prepare client review deck', project: 'Navees Gold', owner: 'Fikri', initials: 'FN', status: 'To do', priority: 'Medium', due: 'Tomorrow', dueKey: 'tomorrow', comments: 1 },
  { id: 'TSK-244', title: 'Review invoice milestones', project: 'Pertamina SMS', owner: 'Dimas', initials: 'DP', status: 'In progress', priority: 'Medium', due: 'Tomorrow', dueKey: 'tomorrow', comments: 3 },
  { id: 'TSK-245', title: 'Publish approved case study', project: 'Kapitech Public Site', owner: 'Sarah', initials: 'SA', status: 'Done', priority: 'Low', due: 'Oct 19', dueKey: 'later', comments: 0 },
  { id: 'TSK-246', title: 'Share updated project timeline', project: 'Sababay Winery', owner: 'Raka', initials: 'RA', status: 'To do', priority: 'High', due: 'Oct 19', dueKey: 'later', comments: 2 },
  { id: 'TSK-247', title: 'Confirm scope with stakeholders', project: 'Navees Gold', owner: 'Nadia', initials: 'NA', status: 'In progress', priority: 'Medium', due: 'Oct 20', dueKey: 'later', comments: 1 },
  { id: 'TSK-248', title: 'Complete QA checklist', project: 'Pertamina SMS', owner: 'Dimas', initials: 'DP', status: 'In review', priority: 'Low', due: 'Oct 21', dueKey: 'later', comments: 5 },
];

const initialProjects: PreviewProject[] = [
  { id: 'PRJ-108', name: 'Kapitech Public Site', client: 'Kapitech Agency', owner: 'Fikri', initials: 'FN', stage: 'Design review', progress: 76, health: 'Needs attention', due: 'Oct 22, 2026', type: 'Internal' },
  { id: 'PRJ-109', name: 'Navees Gold E-commerce', client: 'Navees Gold', owner: 'Nadia', initials: 'NA', stage: 'In production', progress: 58, health: 'On track', due: 'Oct 29, 2026', type: 'Fixed fee' },
  { id: 'PRJ-110', name: 'Pertamina Sales Management', client: 'Pertamina', owner: 'Dimas', initials: 'DP', stage: 'Client review', progress: 88, health: 'On track', due: 'Oct 19, 2026', type: 'Enterprise' },
  { id: 'PRJ-111', name: 'Sababay Winery', client: 'Sababay', owner: 'Raka', initials: 'RA', stage: 'Planning', progress: 32, health: 'At risk', due: 'Nov 06, 2026', type: 'Retainer' },
];

const taskStatuses: TaskStatus[] = ['To do', 'In progress', 'In review', 'Done'];
const previewTabs: PreviewTab[] = ['Overview', 'Projects', 'My tasks', 'Workflow', 'Calendar', 'Reports'];

const priorityClass: Record<TaskPriority, string> = {
  High: 'border-danger/25 bg-danger/10 text-danger',
  Medium: 'border-warning/25 bg-warning/10 text-warning',
  Low: 'border-line bg-bg text-muted',
};

const healthClass: Record<PreviewProject['health'], string> = {
  'On track': 'border-success/25 bg-success/10 text-success',
  'Needs attention': 'border-warning/25 bg-warning/10 text-warning',
  'At risk': 'border-danger/25 bg-danger/10 text-danger',
};

const statusClass: Record<TaskStatus, string> = {
  'To do': 'border-line bg-bg text-muted',
  'In progress': 'border-info/25 bg-info/10 text-info',
  'In review': 'border-warning/25 bg-warning/10 text-warning',
  Done: 'border-success/25 bg-success/10 text-success',
};

const nextStatus = (status: TaskStatus): TaskStatus => {
  const current = taskStatuses.indexOf(status);
  return taskStatuses[Math.min(current + 1, taskStatuses.length - 1)];
};

const initialsFor = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');

const makeId = (prefix: string, used: string[]) => {
  const number = Math.max(200, ...used.map((id) => Number(id.split('-').at(-1)) || 0)) + 1;
  return prefix + '-' + number;
};

export const AmsRevampPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PreviewTab>('Overview');
  const [tasks, setTasks] = useState<PreviewTask[]>(initialTasks);
  const [projects, setProjects] = useState<PreviewProject[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState<'All tasks' | 'Due soon' | 'High priority'>('All tasks');
  const [drawerMode, setDrawerMode] = useState<'task' | 'project' | 'details' | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProject, setTaskProject] = useState(initialProjects[0].name);
  const [taskOwner, setTaskOwner] = useState('Fikri');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('Medium');
  const [taskDue, setTaskDue] = useState('tomorrow');
  const [projectName, setProjectName] = useState('');
  const [projectClient, setProjectClient] = useState('');
  const [projectOwner, setProjectOwner] = useState('Fikri');
  const [lastUpdated, setLastUpdated] = useState('just now');
  const [notice, setNotice] = useState('');

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesQuery = !query || [task.title, task.project, task.owner, task.id].some((value) => value.toLowerCase().includes(query));
      const matchesFilter = taskFilter === 'All tasks'
        || (taskFilter === 'Due soon' && task.dueKey !== 'later' && task.status !== 'Done')
        || (taskFilter === 'High priority' && task.priority === 'High' && task.status !== 'Done');
      const matchesMe = activeTab !== 'My tasks' || task.owner === 'Fikri';
      return matchesQuery && matchesFilter && matchesMe;
    });
  }, [activeTab, searchQuery, taskFilter, tasks]);

  const activeTasks = tasks.filter((task) => task.status !== 'Done');
  const todayTasks = tasks.filter((task) => task.dueKey === 'today' && task.status !== 'Done');
  const highPriorityTasks = tasks.filter((task) => task.priority === 'High' && task.status !== 'Done');
  const projectAttention = projects.filter((project) => project.health !== 'On track').length;

  const openTaskComposer = () => {
    setTaskTitle('');
    setDrawerMode('task');
  };

  const openProjectComposer = () => {
    setProjectName('');
    setProjectClient('');
    setDrawerMode('project');
  };

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3200);
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (drawerMode === 'task') {
      if (!taskTitle.trim()) return;
      const id = makeId('TSK', tasks.map((task) => task.id));
      const dueLabels: Record<string, { label: string; key: PreviewTask['dueKey'] }> = {
        today: { label: 'Today', key: 'today' },
        tomorrow: { label: 'Tomorrow', key: 'tomorrow' },
        later: { label: 'Oct 23', key: 'later' },
      };
      const due = dueLabels[taskDue];
      const newTask: PreviewTask = {
        id, title: taskTitle.trim(), project: taskProject, owner: taskOwner,
        initials: initialsFor(taskOwner), status: 'To do', priority: taskPriority,
        due: due.label, dueKey: due.key, comments: 0,
      };
      setTasks((current) => [newTask, ...current]);
      setSelectedTaskId(id);
      setDrawerMode('details');
      setActiveTab('My tasks');
      setTaskFilter('All tasks');
      notify('Task added to this UI preview. Nothing was sent to AMS.');
      return;
    }
    if (drawerMode === 'project') {
      if (!projectName.trim() || !projectClient.trim()) return;
      const id = makeId('PRJ', projects.map((project) => project.id));
      const newProject: PreviewProject = {
        id, name: projectName.trim(), client: projectClient.trim(), owner: projectOwner,
        initials: initialsFor(projectOwner), stage: 'Planning', progress: 8,
        health: 'On track', due: 'Set a target date', type: 'New project',
      };
      setProjects((current) => [newProject, ...current]);
      setDrawerMode(null);
      setActiveTab('Projects');
      notify('Project added to this UI preview. Nothing was sent to AMS.');
    }
  };

  const advanceTask = (taskId: string) => {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: nextStatus(task.status) } : task));
    notify('Task status updated in this UI preview.');
  };

  const openTaskDetails = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDrawerMode('details');
  };

  const taskCard = (task: PreviewTask, compact = false) => (
    <article key={task.id} className="rounded-card border border-line bg-panel p-3.5 transition-colors hover:border-accent/25">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[10px] text-muted">{task.id}</span>
        <span className={'rounded-badge border px-2 py-0.5 text-[10px] font-medium ' + priorityClass[task.priority]}>{task.priority}</span>
      </div>
      <button type="button" className="mt-2 block w-full text-left text-[13px] font-semibold leading-5 text-fg hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" onClick={() => openTaskDetails(task.id)}>
        {task.title}
      </button>
      <p className="mt-1 text-[11px] leading-4 text-muted">{task.project}</p>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-[9px] font-semibold text-fg">{task.initials}</span>
          <span className="truncate text-[11px] text-muted">{task.owner}</span>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] text-muted"><CalendarDays size={12} />{task.due}</span>
      </div>
      {!compact && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className={'inline-flex items-center rounded-badge border px-2 py-1 text-[10px] font-medium ' + statusClass[task.status]}>{task.status}</span>
          {task.status !== 'Done' && (
            <button type="button" onClick={() => advanceTask(task.id)} className="inline-flex min-h-7 items-center gap-1 rounded-control px-2 text-[10px] font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" aria-label={'Move ' + task.id + ' to next status'}>
              Move forward <ChevronRight size={12} />
            </button>
          )}
        </div>
      )}
    </article>
  );

  const projectCard = (project: PreviewProject) => (
    <article key={project.id} className="rounded-card border border-line bg-panel p-4 transition-colors hover:border-accent/25">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted"><FolderKanban size={18} /></span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-fg">{project.name}</p>
            <p className="mt-1 truncate text-[11px] text-muted">{project.client} · {project.id}</p>
          </div>
        </div>
        <button type="button" onClick={() => notify('Project actions are part of the next prototype iteration.')} aria-label={'More actions for ' + project.name} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-bg hover:text-fg"><MoreHorizontal size={16} /></button>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className={'rounded-badge border px-2 py-1 text-[10px] font-medium ' + healthClass[project.health]}>{project.health}</span>
        <span className="text-[11px] text-muted">{project.stage}</span>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px]"><span className="text-muted">Progress</span><span className="font-semibold tabular-nums text-fg">{project.progress}%</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-accent" style={{ width: project.progress + '%' }} /></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
        <div><p className="text-[10px] text-muted">Project lead</p><div className="mt-1 flex items-center gap-1.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-bg text-[8px] font-semibold text-fg">{project.initials}</span><span className="truncate text-[11px] font-medium text-fg">{project.owner}</span></div></div>
        <div><p className="text-[10px] text-muted">Target date</p><p className="mt-1 text-[11px] font-medium text-fg">{project.due}</p></div>
      </div>
    </article>
  );

  return (
    <AdminPageShell featureSlug="ams-ux-ui-preview" className="ams-dashboard">
      <header className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-badge border border-accent/25 bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent-text">UX/UI Preview</span>
            <span className="rounded-badge border border-warning/25 bg-warning/10 px-2 py-1 text-[10px] font-medium text-warning">Sample data · UI only</span>
          </div>
          <h1 className="text-xl font-semibold leading-7 tracking-[-0.01em] text-fg sm:text-2xl">Agency workspace</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">Projects, tasks, team workload, and delivery decisions in one clear workspace.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button type="button" onClick={() => { setLastUpdated('just now'); notify('Preview refreshed. Demo data remains unchanged.'); }} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <RefreshCw size={14} /> Refresh
          </button>
          <button type="button" onClick={openProjectComposer} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <Plus size={14} /> New project
          </button>
          <button type="button" onClick={openTaskComposer} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-control bg-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <Plus size={14} /> Create task
          </button>
        </div>
      </header>

      <section aria-label="Preview navigation" className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-control border border-line bg-panel p-1 ams-topnav-scroll">
        {previewTabs.map((tab) => (
          <button key={tab} type="button" aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)} className={'inline-flex min-h-8 shrink-0 items-center rounded-chip border px-3 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' + (activeTab === tab ? 'border-accent/25 bg-accent/10 text-fg' : 'border-transparent text-muted hover:bg-bg hover:text-fg')}>
            {tab === 'My tasks' && <ListTodo size={13} className="mr-1.5" />}
            {tab === 'Projects' && <FolderKanban size={13} className="mr-1.5" />}
            {tab === 'Workflow' && <Activity size={13} className="mr-1.5" />}
            {tab === 'Calendar' && <CalendarDays size={13} className="mr-1.5" />}
            {tab === 'Reports' && <FileText size={13} className="mr-1.5" />}
            {tab}
          </button>
        ))}
      </section>

      {activeTab === 'Overview' && (
        <>
          <section aria-label="Agency health metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Active projects', value: String(projects.length), helper: 'Across all delivery stages', icon: <FolderKanban size={16} />, tone: 'text-fg' },
              { label: 'Tasks due today', value: String(todayTasks.length), helper: 'Needs attention today', icon: <CalendarDays size={16} />, tone: todayTasks.length ? 'text-warning' : 'text-success' },
              { label: 'High-priority tasks', value: String(highPriorityTasks.length), helper: 'Unfinished priority work', icon: <Target size={16} />, tone: highPriorityTasks.length ? 'text-danger' : 'text-success' },
              { label: 'Projects to review', value: String(projectAttention), helper: 'Status needs a decision', icon: <AlertCircle size={16} />, tone: projectAttention ? 'text-warning' : 'text-success' },
            ].map((metric) => (
              <article key={metric.label} className="rounded-card border border-line bg-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-medium text-muted">{metric.label}</span>
                  <span className={'flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg ' + metric.tone}>{metric.icon}</span>
                </div>
                <p className="mt-3 text-2xl font-medium leading-8 tracking-[-0.02em] tabular-nums text-fg">{metric.value}</p>
                <p className="mt-1 text-[11px] leading-4 text-muted">{metric.helper}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-3 xl:grid-cols-12">
            <article className="rounded-card border border-line bg-panel p-4 sm:p-5 xl:col-span-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-sm font-semibold text-fg">Delivery workflow</h2><p className="mt-1 text-xs text-muted">See where work is moving and where decisions are needed.</p></div>
                <button type="button" onClick={() => setActiveTab('Workflow')} className="inline-flex min-h-8 items-center gap-1 rounded-control px-2 text-xs font-medium text-muted hover:bg-bg hover:text-fg">View workflow <ArrowUpRight size={13} /></button>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-4">
                {[
                  { label: 'Planning', count: projects.filter((p) => p.stage === 'Planning').length, description: 'Scope & owners' },
                  { label: 'In production', count: projects.filter((p) => /production|design/i.test(p.stage)).length, description: 'Work in progress' },
                  { label: 'Client review', count: projects.filter((p) => /review/i.test(p.stage)).length, description: 'Waiting for feedback' },
                  { label: 'Ready to deliver', count: projects.filter((p) => p.progress >= 90).length, description: 'Final checks' },
                ].map((stage, index) => (
                  <button key={stage.label} type="button" onClick={() => setActiveTab('Workflow')} className="relative min-w-0 rounded-control border border-line bg-bg p-3 text-left transition-colors hover:border-accent/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    <span className="flex h-7 w-7 items-center justify-center rounded-control border border-line bg-panel text-[11px] font-semibold text-fg">{index + 1}</span>
                    <span className="mt-3 block text-xs font-semibold text-fg">{stage.label}</span>
                    <span className="mt-1 block text-[10px] leading-4 text-muted">{stage.description}</span>
                    <span className="mt-3 block text-lg font-semibold tabular-nums text-fg">{stage.count} <span className="text-[10px] font-normal text-muted">projects</span></span>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-control border border-warning/20 bg-warning/5 px-3 py-2.5 text-[11px] leading-4 text-muted">
                <AlertCircle size={14} className="shrink-0 text-warning" />
                <span><strong className="font-semibold text-fg">{projectAttention} projects</strong> require a status check before the next client update.</span>
                <button type="button" onClick={() => setActiveTab('Projects')} className="ml-auto shrink-0 font-semibold text-accent-text hover:underline">Review</button>
              </div>
            </article>

            <article className="rounded-card border border-line bg-panel p-4 sm:p-5 xl:col-span-4">
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-fg">Quick actions</h2><p className="mt-1 text-xs text-muted">Start common work without hunting through menus.</p></div><span className="flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg text-muted"><Target size={15} /></span></div>
              <div className="mt-4 grid gap-2">
                <button type="button" onClick={openTaskComposer} className="flex min-h-11 items-center gap-3 rounded-control border border-line bg-bg px-3 text-left transition-colors hover:border-accent/25 hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><span className="flex h-7 w-7 items-center justify-center rounded-control border border-line bg-panel text-muted"><ListTodo size={14} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-fg">Create a task</span><span className="mt-0.5 block text-[10px] text-muted">Assign an owner and due date</span></span><ChevronRight size={14} className="text-muted" /></button>
                <button type="button" onClick={openProjectComposer} className="flex min-h-11 items-center gap-3 rounded-control border border-line bg-bg px-3 text-left transition-colors hover:border-accent/25 hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><span className="flex h-7 w-7 items-center justify-center rounded-control border border-line bg-panel text-muted"><FolderKanban size={14} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-fg">Start a project</span><span className="mt-0.5 block text-[10px] text-muted">Set up a delivery workspace</span></span><ChevronRight size={14} className="text-muted" /></button>
                <button type="button" onClick={() => setActiveTab('My tasks')} className="flex min-h-11 items-center gap-3 rounded-control border border-line bg-bg px-3 text-left transition-colors hover:border-accent/25 hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><span className="flex h-7 w-7 items-center justify-center rounded-control border border-line bg-panel text-muted"><CalendarDays size={14} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-fg">Plan my day</span><span className="mt-0.5 block text-[10px] text-muted">See your tasks by due date</span></span><ChevronRight size={14} className="text-muted" /></button>
              </div>
            </article>
          </section>

          <section className="grid gap-3 xl:grid-cols-12">
            <article className="min-w-0 rounded-card border border-line bg-panel xl:col-span-8">
              <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div><h2 className="text-sm font-semibold text-fg">Priority tasks</h2><p className="mt-1 text-xs text-muted">The next actions most likely to unblock delivery.</p></div>
                <button type="button" onClick={() => { setActiveTab('My tasks'); setTaskFilter('All tasks'); }} className="inline-flex min-h-8 items-center gap-1 text-xs font-medium text-muted hover:text-accent-text">View all tasks <ArrowUpRight size={13} /></button>
              </div>
              <div className="flex flex-col gap-2 p-3 sm:p-4">
                {tasks.filter((task) => task.priority === 'High' && task.status !== 'Done').slice(0, 4).map((task) => (
                  <div key={task.id} className="flex min-w-0 items-center gap-3 rounded-control border border-line bg-bg p-3">
                    <span className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-control border ' + (task.status === 'In review' ? 'border-warning/25 bg-warning/10 text-warning' : 'border-line bg-panel text-muted')}><ListTodo size={15} /></span>
                    <div className="min-w-0 flex-1"><button type="button" onClick={() => openTaskDetails(task.id)} className="block max-w-full truncate text-left text-xs font-semibold text-fg hover:text-accent-text">{task.title}</button><p className="mt-1 truncate text-[10px] text-muted">{task.project} · {task.owner}</p></div>
                    <span className="hidden shrink-0 text-[10px] text-muted sm:inline-flex sm:items-center sm:gap-1"><CalendarDays size={12} />{task.due}</span>
                    <button type="button" onClick={() => advanceTask(task.id)} disabled={task.status === 'Done'} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-muted transition-colors hover:text-fg disabled:cursor-not-allowed disabled:opacity-40" aria-label={'Advance ' + task.id}><ChevronRight size={14} /></button>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-card border border-line bg-panel p-4 sm:p-5 xl:col-span-4">
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-fg">Team capacity</h2><p className="mt-1 text-xs text-muted">At-a-glance workload signals.</p></div><UsersRound size={16} className="text-muted" /></div>
              <div className="mt-4 space-y-4">
                {[{ name: 'Fikri Nurlete', role: 'Product & delivery', load: 82, initials: 'FN' }, { name: 'Nadia Anwar', role: 'Design', load: 68, initials: 'NA' }, { name: 'Dimas Pratama', role: 'Engineering', load: 74, initials: 'DP' }].map((member) => (
                  <div key={member.name}>
                    <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-bg text-[10px] font-semibold text-fg">{member.initials}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-fg">{member.name}</p><p className="mt-0.5 truncate text-[10px] text-muted">{member.role}</p></div><span className={'text-[11px] font-semibold tabular-nums ' + (member.load >= 80 ? 'text-warning' : 'text-fg')}>{member.load}%</span></div>
                    <div className="ml-10 mt-2 h-1.5 rounded-full bg-line"><div className={'h-full rounded-full ' + (member.load >= 80 ? 'bg-warning' : 'bg-info')} style={{ width: member.load + '%' }} /></div>
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-line pt-3 text-[10px] leading-4 text-muted">Workload is illustrative here. Team availability should be connected to assigned tasks and tracked time in the implementation phase.</p>
            </article>
          </section>
        </>
      )}

      {activeTab === 'Projects' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-base font-semibold text-fg">Project portfolio</h2><p className="mt-1 text-xs text-muted">{projects.length} sample workspaces · grouped for quick scanning</p></div>
            <div className="flex flex-wrap items-center gap-2"><label className="relative"><span className="sr-only">Search projects and tasks</span><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search projects..." className="min-h-9 w-full rounded-control border border-line bg-panel pl-9 pr-3 text-xs text-fg placeholder:text-muted sm:w-56" /></label><button type="button" onClick={openProjectComposer} className="inline-flex min-h-9 items-center gap-2 rounded-control bg-accent px-3 text-xs font-semibold text-white hover:bg-accent-hover"><Plus size={13} />New project</button></div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {projects.filter((project) => !searchQuery.trim() || [project.name, project.client, project.owner, project.stage].some((value) => value.toLowerCase().includes(searchQuery.toLowerCase()))).map(projectCard)}
          </div>
        </>
      )}

      {activeTab === 'My tasks' && (
        <>
          <section className="flex flex-col gap-3 rounded-card border border-line bg-panel p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-bg text-muted"><ListTodo size={18} /></span><div><h2 className="text-base font-semibold text-fg">My tasks</h2><p className="mt-1 text-xs text-muted">Prioritised work with clear owners, dates, and next actions.</p></div></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative"><span className="sr-only">Search tasks</span><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search tasks..." className="min-h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg placeholder:text-muted sm:w-52" /></label>
              <label className="relative"><span className="sr-only">Filter tasks</span><Filter size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><select value={taskFilter} onChange={(event) => setTaskFilter(event.target.value as typeof taskFilter)} className="min-h-9 w-full appearance-none rounded-control border border-line bg-bg pl-9 pr-8 text-xs text-fg sm:w-40"><option>All tasks</option><option>Due soon</option><option>High priority</option></select><ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" /></label>
              <button type="button" onClick={openTaskComposer} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-control bg-accent px-3 text-xs font-semibold text-white hover:bg-accent-hover"><Plus size={13} />Create task</button>
            </div>
          </section>
          <div className="grid gap-3 xl:grid-cols-4">
            {taskStatuses.map((status) => {
              const columnTasks = filteredTasks.filter((task) => task.status === status);
              return <section key={status} className="min-w-0 rounded-card border border-line bg-bg p-3" aria-label={status + ' tasks'}>
                <div className="mb-3 flex items-center justify-between gap-2 px-1"><div className="flex items-center gap-2"><span className={'h-2 w-2 rounded-full ' + (status === 'Done' ? 'bg-success' : status === 'In review' ? 'bg-warning' : status === 'In progress' ? 'bg-info' : 'bg-line')} /><h3 className="text-xs font-semibold text-fg">{status}</h3><span className="rounded-badge border border-line bg-panel px-1.5 py-0.5 text-[10px] tabular-nums text-muted">{columnTasks.length}</span></div>{status !== 'Done' && <button type="button" onClick={openTaskComposer} aria-label={'Add task to ' + status} className="flex h-7 w-7 items-center justify-center rounded-control text-muted hover:bg-panel hover:text-fg"><Plus size={13} /></button>}</div>
                <div className="space-y-2">{columnTasks.map((task) => taskCard(task))}{columnTasks.length === 0 && <div className="rounded-control border border-dashed border-line px-3 py-6 text-center text-[11px] text-muted">No tasks in this stage</div>}</div>
              </section>;
            })}
          </div>
          <p className="text-[11px] text-muted">Use “Move forward” on a task to advance it through the workflow. Changes stay in this preview only.</p>
        </>
      )}

      {activeTab === 'Workflow' && (
        <>
          <div><h2 className="text-base font-semibold text-fg">Delivery workflow</h2><p className="mt-1 text-xs text-muted">A simple stage-by-stage view of how a project moves from brief to handover.</p></div>
          <section className="grid gap-3 xl:grid-cols-4">
            {[
              { name: '1. Plan', description: 'Align scope, outcomes, timeline, and owner.', stage: ['Planning'] },
              { name: '2. Produce', description: 'Keep work moving and blockers visible.', stage: ['In production', 'Design review'] },
              { name: '3. Review', description: 'Collect decisions and close feedback loops.', stage: ['Client review'] },
              { name: '4. Deliver', description: 'Confirm final checks and client handover.', stage: ['Delivered'] },
            ].map((column) => {
              const stageProjects = projects.filter((project) => column.stage.some((stage) => project.stage.toLowerCase() === stage.toLowerCase()));
              return <article key={column.name} className="rounded-card border border-line bg-panel p-4"><div className="border-b border-line pb-3"><h3 className="text-sm font-semibold text-fg">{column.name}</h3><p className="mt-1 text-[11px] leading-4 text-muted">{column.description}</p></div><div className="mt-3 space-y-2">{stageProjects.length ? stageProjects.map(projectCard) : <div className="rounded-control border border-dashed border-line px-3 py-6 text-center text-[11px] text-muted">No projects in this stage</div>}</div></article>;
            })}
          </section>
          <article className="rounded-card border border-line bg-panel p-4 sm:p-5"><h3 className="text-sm font-semibold text-fg">Workflow rules to make visible</h3><div className="mt-4 grid gap-3 md:grid-cols-3">{[{title:'Every task has an owner',body:'Make ownership explicit before work starts.',icon:<UsersRound size={15} />},{title:'Every stage has an exit condition',body:'Show what must be true before a handoff.',icon:<CheckCircle2 size={15} />},{title:'Blockers surface early',body:'Highlight risk before a due date is missed.',icon:<AlertCircle size={15} />}].map((rule)=><div key={rule.title} className="flex gap-3 rounded-control border border-line bg-bg p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-muted">{rule.icon}</span><div><p className="text-xs font-semibold text-fg">{rule.title}</p><p className="mt-1 text-[11px] leading-4 text-muted">{rule.body}</p></div></div>)}</div></article>
        </>
      )}

      {activeTab === 'Calendar' && (
        <>
          <div><h2 className="text-base font-semibold text-fg">Upcoming work</h2><p className="mt-1 text-xs text-muted">The next few days of deadlines, separated by urgency.</p></div>
          <div className="grid gap-3 xl:grid-cols-3">
            {[{key:'today',label:'Today',caption:'Needs action now'},{key:'tomorrow',label:'Tomorrow',caption:'Prepare the next handoff'},{key:'later',label:'Coming up',caption:'Plan ahead'}].map((group)=><section key={group.key} className="rounded-card border border-line bg-panel p-4"><div className="border-b border-line pb-3"><h3 className="text-sm font-semibold text-fg">{group.label}</h3><p className="mt-1 text-[11px] text-muted">{group.caption}</p></div><div className="mt-3 space-y-2">{tasks.filter((task)=>task.dueKey===group.key && task.status!=='Done').map((task)=><div key={task.id} className="rounded-control border border-line bg-bg p-3"><div className="flex items-start justify-between gap-2"><span className="text-[10px] text-muted">{task.id}</span><span className={'rounded-badge border px-1.5 py-0.5 text-[10px] ' + priorityClass[task.priority]}>{task.priority}</span></div><button type="button" onClick={()=>openTaskDetails(task.id)} className="mt-2 block text-left text-xs font-semibold leading-5 text-fg hover:text-accent-text">{task.title}</button><p className="mt-1 text-[10px] text-muted">{task.project}</p><div className="mt-3 flex items-center justify-between border-t border-line pt-2"><span className="text-[10px] text-muted">{task.owner}</span><span className="text-[10px] text-muted">{task.due}</span></div></div>)}{!tasks.some((task)=>task.dueKey===group.key && task.status!=='Done')&&<p className="py-6 text-center text-[11px] text-muted">Nothing scheduled</p>}</div></section>)}
          </div>
        </>
      )}

      {activeTab === 'Reports' && (
        <>
          <div><h2 className="text-base font-semibold text-fg">Delivery signals</h2><p className="mt-1 text-xs text-muted">A first-pass reporting layout focused on actions, not decorative charts.</p></div>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[{label:'Tasks completed',value:tasks.filter((task)=>task.status==='Done').length,sub:'Completed in this preview',icon:<CheckCircle2 size={16}/>},{label:'Open tasks',value:activeTasks.length,sub:'Work still in motion',icon:<ListTodo size={16}/>},{label:'Tasks due today',value:todayTasks.length,sub:'Immediate delivery pressure',icon:<CalendarDays size={16}/>},{label:'High priority',value:highPriorityTasks.length,sub:'Should be reviewed first',icon:<Target size={16}/>}].map((metric)=><article key={metric.label} className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-muted">{metric.label}</span><span className="text-muted">{metric.icon}</span></div><p className="mt-3 text-2xl font-medium tabular-nums text-fg">{metric.value}</p><p className="mt-1 text-[11px] text-muted">{metric.sub}</p></article>)}
          </section>
          <article className="rounded-card border border-line bg-panel p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-fg">Task distribution by stage</h3><p className="mt-1 text-xs text-muted">Use stage counts to spot where work is accumulating.</p></div><span className="inline-flex items-center gap-1 text-[10px] text-muted"><SlidersHorizontal size={12}/> Preview data</span></div><div className="mt-5 space-y-4">{taskStatuses.map((status)=>{const count=tasks.filter((task)=>task.status===status).length;const pct=tasks.length?Math.round(count/tasks.length*100):0;return <div key={status}><div className="flex items-center justify-between gap-3 text-xs"><span className="text-fg">{status}</span><span className="tabular-nums text-muted">{count} tasks · {pct}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-line"><div className={'h-full rounded-full '+(status==='Done'?'bg-success':status==='In review'?'bg-warning':status==='In progress'?'bg-info':'bg-accent')} style={{width:pct+'%'}} /></div></div>})}</div></article>
        </>
      )}

      <footer className="flex flex-col gap-1 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] leading-4 text-muted">Prototype scope: interaction and layout only. Demo changes reset when this page is reloaded.</p>
        <p className="inline-flex items-center gap-1.5 text-[10px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Last refreshed {lastUpdated}</p>
      </footer>

      {notice && <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-[80] max-w-sm rounded-control border border-line bg-panel px-4 py-3 text-xs font-medium text-fg">{notice}</div>}

      <Drawer
        open={drawerMode === 'task' || drawerMode === 'project'}
        onClose={() => setDrawerMode(null)}
        title={drawerMode === 'task' ? 'Create task' : 'Create project'}
        description={drawerMode === 'task' ? 'Capture the action, assign one owner, and make the next step clear.' : 'Start a workspace with clear ownership and a client.'}
        size="lg"
        slug="ams-preview-create-drawer"
        footer={<><Button type="button" variant="secondary" onClick={() => setDrawerMode(null)}>Cancel</Button><Button type="submit" form="ams-preview-create-form" variant="primary">{drawerMode === 'task' ? 'Create task' : 'Create project'}</Button></>}
      >
        <form id="ams-preview-create-form" onSubmit={handleCreate} className="space-y-5 p-5">
          {drawerMode === 'task' ? (
            <>
              <div><label htmlFor="preview-task-title" className="mb-1.5 block text-xs font-medium text-fg">Task title <span className="text-danger">*</span></label><input id="preview-task-title" value={taskTitle} onChange={(event)=>setTaskTitle(event.target.value)} required maxLength={120} placeholder="e.g. Review client feedback" className="w-full rounded-control border border-line bg-bg px-3 py-2.5 text-xs text-fg placeholder:text-muted" /><p className="mt-1 text-[10px] text-muted">Use an action verb so the task is easy to understand in a list.</p></div>
              <div><label htmlFor="preview-task-project" className="mb-1.5 block text-xs font-medium text-fg">Project</label><select id="preview-task-project" value={taskProject} onChange={(event)=>setTaskProject(event.target.value)} className="w-full rounded-control border border-line bg-bg px-3 py-2.5 text-xs text-fg">{projects.map((project)=><option key={project.id} value={project.name}>{project.name}</option>)}</select></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="preview-task-owner" className="mb-1.5 block text-xs font-medium text-fg">Owner</label><select id="preview-task-owner" value={taskOwner} onChange={(event)=>setTaskOwner(event.target.value)} className="w-full rounded-control border border-line bg-bg px-3 py-2.5 text-xs text-fg"><option>Fikri</option><option>Nadia</option><option>Dimas</option><option>Raka</option><option>Sarah</option></select></div><div><label htmlFor="preview-task-priority" className="mb-1.5 block text-xs font-medium text-fg">Priority</label><select id="preview-task-priority" value={taskPriority} onChange={(event)=>setTaskPriority(event.target.value as TaskPriority)} className="w-full rounded-control border border-line bg-bg px-3 py-2.5 text-xs text-fg"><option>Low</option><option>Medium</option><option>High</option></select></div></div>
              <div><label htmlFor="preview-task-due" className="mb-1.5 block text-xs font-medium text-fg">Due date</label><select id="preview-task-due" value={taskDue} onChange={(event)=>setTaskDue(event.target.value)} className="w-full rounded-control border border-line bg-bg px-3 py-2.5 text-xs text-fg"><option value="today">Today</option><option value="tomorrow">Tomorrow</option><option value="later">Later this week</option></select></div>
              <p className="rounded-control border border-warning/25 bg-warning/5 p-3 text-[11px] leading-4 text-muted">This form is a UI prototype. Saving updates only the browser state on this page; it does not create a real AMS record.</p>
            </>
          ) : (
            <>
              <div><label htmlFor="preview-project-name" className="mb-1.5 block text-xs font-medium text-fg">Project name <span className="text-danger">*</span></label><input id="preview-project-name" value={projectName} onChange={(event)=>setProjectName(event.target.value)} required maxLength={120} placeholder="e.g. Customer portal redesign" className="w-full rounded-control border border-line bg-bg px-3 py-2.5 text-xs text-fg placeholder:text-muted" /></div>
              <div><label htmlFor="preview-project-client" className="mb-1.5 block text-xs font-medium text-fg">Client / business unit <span className="text-danger">*</span></label><input id="preview-project-client" value={projectClient} onChange={(event)=>setProjectClient(event.target.value)} required maxLength={120} placeholder="e.g. Navees Gold" className="w-full rounded-control border border-line bg-bg px-3 py-2.5 text-xs text-fg placeholder:text-muted" /></div>
              <div><label htmlFor="preview-project-owner" className="mb-1.5 block text-xs font-medium text-fg">Project lead</label><select id="preview-project-owner" value={projectOwner} onChange={(event)=>setProjectOwner(event.target.value)} className="w-full rounded-control border border-line bg-bg px-3 py-2.5 text-xs text-fg"><option>Fikri</option><option>Nadia</option><option>Dimas</option><option>Raka</option><option>Sarah</option></select></div>
              <p className="rounded-control border border-warning/25 bg-warning/5 p-3 text-[11px] leading-4 text-muted">Project details and scheduling will be connected to the approved data model after the UI direction is reviewed.</p>
            </>
          )}
        </form>
      </Drawer>

      <Drawer
        open={drawerMode === 'details' && Boolean(selectedTask)}
        onClose={() => setDrawerMode(null)}
        title={selectedTask?.title || 'Task details'}
        description={selectedTask ? selectedTask.id + ' · ' + selectedTask.project : undefined}
        size="lg"
        slug="ams-preview-task-details"
        footer={<><Button type="button" variant="secondary" onClick={() => setDrawerMode(null)}>Close</Button>{selectedTask && selectedTask.status !== 'Done' && <Button type="button" variant="primary" onClick={() => advanceTask(selectedTask.id)}>Move to {nextStatus(selectedTask.status)}</Button>}</>}
      >
        {selectedTask && <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-2"><span className={'rounded-badge border px-2 py-1 text-[10px] font-medium '+statusClass[selectedTask.status]}>{selectedTask.status}</span><span className={'rounded-badge border px-2 py-1 text-[10px] font-medium '+priorityClass[selectedTask.priority]}>{selectedTask.priority} priority</span></div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">Owner</p><p className="mt-1 text-xs font-semibold text-fg">{selectedTask.owner}</p></div><div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">Due date</p><p className="mt-1 text-xs font-semibold text-fg">{selectedTask.due}</p></div></div>
          <div><h3 className="text-xs font-semibold text-fg">Next step</h3><p className="mt-1 text-xs leading-5 text-muted">Confirm the expected output, keep one accountable owner, and move the task to the next review stage when ready.</p></div>
          <div className="rounded-control border border-line bg-bg p-3"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-fg">Discussion</span><span className="inline-flex items-center gap-1 text-[10px] text-muted"><MessageSquare size={12}/>{selectedTask.comments} comments</span></div><p className="mt-2 text-[11px] leading-4 text-muted">{selectedTask.comments ? 'Comment history will appear here when connected to the task record.' : 'No comments yet. Keep discussion attached to the work item.'}</p></div>
          <p className="text-[10px] leading-4 text-muted">Demo-only task detail. No activity or comments are saved to the live system.</p>
        </div>}
      </Drawer>
    </AdminPageShell>
  );
};

export default AmsRevampPreview;
