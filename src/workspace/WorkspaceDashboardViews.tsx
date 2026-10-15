import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Timer,
  WalletCardsCards,
} from 'lucide-react';
import { WorkspaceRole } from './workspaceAccess';
import {
  ActionButton,
  ChartPoint,
  dateLabel,
  dateTimeLabel,
  idr,
  idrCompact,
  MetricCard,
  ProgressRing,
  RevenueLineChart,
  SectionPanel,
  StatusBadge,
  WorkspacePage,
} from './WorkspacePrimitives';

const chartData: ChartPoint[] = [
  { label: 'Mar', revenue: 68, expenses: 42, profit: 26 },
  { label: 'Apr', revenue: 74, expenses: 48, profit: 26 },
  { label: 'May', revenue: 81, expenses: 50, profit: 31 },
  { label: 'Jun', revenue: 77, expenses: 55, profit: 22 },
  { label: 'Jul', revenue: 93, expenses: 59, profit: 34 },
  { label: 'Aug', revenue: 101, expenses: 65, profit: 36 },
  { label: 'Sep', revenue: 116, expenses: 74, profit: 42 },
  { label: 'Oct', revenue: 128, expenses: 79, profit: 49 },
];

export const ExecutiveOverviewView: React.FC = () => (
  <WorkspacePage
    slug="workspace-executive-overview"
    title="Executive Agency Overview"
    description="A consolidated view of commercial performance, delivery capacity, and near-term pipeline health."
    actions={<StatusBadge tone="info">October reporting period</StatusBadge>}
  >
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Revenue · MTD" value={idrCompact(128400000)} detail="+10.7% vs. prior month" tone="success" icon={<ArrowUpRight size={15} />} />
      <MetricCard label="Operating expenses" value={idrCompact(79100000)} detail="61.6% of recognized revenue" tone="neutral" icon={<WalletCardsCards size={15} />} />
      <MetricCard label="Net profit · MTD" value={idrCompact(49300000)} detail="38.4% indicative margin" tone="success" icon={<ArrowUpRight size={15} />} />
      <MetricCard label="Active projects" value="12" detail="3 milestones due this week" tone="info" icon={<CalendarDays size={15} />} />
    </div>

    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
      <SectionPanel title="Financial performance" description="Monthly revenue, expenses and net profit · values in IDR millions">
        <RevenueLineChart data={chartData} />
      </SectionPanel>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <SectionPanel title="Utilization rate gauge" description="Billable and delivery allocation against available team capacity">
          <div className="flex flex-wrap items-center gap-4">
            <ProgressRing value={78} max={100} label="Team utilization" size={132} warningAt={85} sublabel="Target band: 75–85%" />
            <div className="grid min-w-[100px] flex-1 gap-3">
              <div>
                <p className="text-[10px] text-muted">Allocated hours</p>
                <p className="mt-1 text-[16px] font-semibold tabular-nums text-fg">624 / 800</p>
              </div>
              <div>
                <p className="text-[10px] text-muted">Unallocated capacity</p>
                <p className="mt-1 text-[14px] font-semibold tabular-nums text-fg">176 hours</p>
              </div>
            </div>
          </div>
        </SectionPanel>
        <SectionPanel title="Pipeline health tracker" description="Open opportunities weighted by stage probability">
          <div className="rounded-control border border-line bg-bg p-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted">Weighted pipeline value</p>
            <p className="mt-1 text-[25px] font-semibold leading-8 tracking-[-0.025em] tabular-nums text-fg">{idrCompact(196500000)}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
              <div><p className="text-[10px] text-muted">Open deals</p><p className="mt-1 text-[14px] font-semibold text-fg">9</p></div>
              <div><p className="text-[10px] text-muted">Coverage vs target</p><p className="mt-1 text-[14px] font-semibold text-fg">2.4×</p></div>
            </div>
          </div>
          <div className="mt-3 grid gap-2">
            <div className="flex items-center justify-between gap-3 text-[11px]"><span className="text-muted">Proposal or negotiation</span><span className="font-medium tabular-nums text-fg">{idrCompact(142000000)}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-accent" style={{ width: '72%' }} /></div>
            <div className="flex items-center justify-between gap-3 text-[11px]"><span className="text-muted">Awaiting qualification</span><span className="font-medium tabular-nums text-fg">{idrCompact(54500000)}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-series-3" style={{ width: '28%' }} /></div>
          </div>
        </SectionPanel>
      </div>
    </div>

    <SectionPanel title="Delivery and commercial signals" description="Indicators for the weekly leadership check-in">
      <div className="grid min-w-0 gap-3 md:grid-cols-3">
        <div className="flex items-start gap-3 rounded-control border border-line p-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-success/20 bg-success/10 text-success"><CheckCircle2 size={16} /></span>
          <div><p className="text-[12px] font-semibold text-fg">Milestones on track</p><p className="mt-1 text-[11px] leading-4 text-muted">9 of 12 active projects are currently within planned delivery windows.</p></div>
        </div>
        <div className="flex items-start gap-3 rounded-control border border-line p-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-warning/20 bg-warning/10 text-warning"><AlertTriangle size={16} /></span>
          <div><p className="text-[12px] font-semibold text-fg">Capacity requires review</p><p className="mt-1 text-[11px] leading-4 text-muted">Two teams are within seven days of the capacity target.</p></div>
        </div>
        <div className="flex items-start gap-3 rounded-control border border-line p-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-info/20 bg-info/10 text-info"><ShieldCheck size={16} /></span>
          <div><p className="text-[12px] font-semibold text-fg">Commercial follow-up</p><p className="mt-1 text-[11px] leading-4 text-muted">Three proposal-stage opportunities need an owner check-in this week.</p></div>
        </div>
      </div>
    </SectionPanel>
  </WorkspacePage>
);

interface TodoItem {
  id: string;
  title: string;
  project: string;
  dueAt: string;
  priority: 'High' | 'Medium' | 'Low';
  roles: WorkspaceRole[];
  state: 'In progress' | 'Waiting' | 'Not started';
}

const TODO_ITEMS: TodoItem[] = [
  { id: 'TSK-214', title: 'Finalize mobile checkout states', project: 'Aurora Commerce', dueAt: '2026-10-15T16:00:00+07:00', priority: 'High', roles: ['Creative', 'PM'], state: 'In progress' },
  { id: 'TSK-219', title: 'Review homepage prototype', project: 'Nusantara Health', dueAt: '2026-10-16T12:00:00+07:00', priority: 'High', roles: ['PM', 'Creative', 'Admin'], state: 'Waiting' },
  { id: 'TSK-221', title: 'Validate API acceptance notes', project: 'Partner Portal', dueAt: '2026-10-16T16:30:00+07:00', priority: 'Medium', roles: ['Freelancer', 'PM'], state: 'In progress' },
  { id: 'TSK-225', title: 'Prepare client review package', project: 'Aurora Commerce', dueAt: '2026-10-17T11:00:00+07:00', priority: 'Medium', roles: ['Creative', 'Freelancer', 'PM'], state: 'Not started' },
  { id: 'TSK-228', title: 'Reconcile vendor receipts', project: 'Operations', dueAt: '2026-10-17T14:00:00+07:00', priority: 'Medium', roles: ['Finance', 'Admin'], state: 'In progress' },
  { id: 'TSK-231', title: 'Confirm sprint acceptance criteria', project: 'Partner Portal', dueAt: '2026-10-18T15:00:00+07:00', priority: 'Low', roles: ['PM', 'Admin'], state: 'Not started' },
  { id: 'TSK-233', title: 'Submit weekly time record', project: 'Internal Operations', dueAt: '2026-10-18T17:00:00+07:00', priority: 'Low', roles: ['Finance', 'Creative', 'Freelancer', 'PM', 'Admin'], state: 'Not started' },
];

const PRIORITY_TONE = { High: 'danger', Medium: 'warning', Low: 'neutral' } as const;

const StopwatchWidget: React.FC = () => {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const formatted = [Math.floor(elapsed / 3600), Math.floor((elapsed % 3600) / 60), elapsed % 60]
    .map((value) => String(value).padStart(2, '0')).join(':');

  const start = () => { setHasStarted(true); setRunning(true); };
  const pause = () => setRunning(false);
  const stop = () => { setRunning(false); setElapsed(0); setHasStarted(false); };

  return (
    <section aria-label="Stopwatch time tracker" className="rounded-card border border-line bg-panel p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-control border border-accent/25 bg-accent/10 text-accent-text"><Timer size={16} /></span>
          <div><h2 className="text-[14px] font-semibold text-fg">Time tracker</h2><p className="mt-0.5 text-[10px] text-muted">Personal stopwatch · UI session only</p></div>
        </div>
        <StatusBadge tone={running ? 'success' : hasStarted ? 'warning' : 'neutral'}>{running ? 'Running' : hasStarted ? 'Paused' : 'Stopped'}</StatusBadge>
      </div>
      <div className="my-5 rounded-control border border-line bg-bg px-3 py-4 text-center">
        <p className="font-mono text-[31px] font-semibold leading-9 tracking-[0.06em] tabular-nums text-fg" role="timer" aria-live="off">{formatted}</p>
        <p className="mt-2 text-[10px] text-muted">No time entry is submitted to the server from this preview.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <ActionButton variant="primary" onClick={start} disabled={running}><ArrowRight size={13} />Start</ActionButton>
        <ActionButton onClick={pause} disabled={!running}><Clock3 size={13} />Pause</ActionButton>
        <ActionButton onClick={stop} disabled={!running && !hasStarted && elapsed === 0}><Check size={12} />Stop</ActionButton>
      </div>
    </section>
  );
};

const ApprovalCenter: React.FC = () => {
  const [requests, setRequests] = useState([
    { id: 'APR-082', kind: 'Timesheet', subject: 'R. Pratama · Week 41', detail: '38.5 hours · Aurora Commerce', age: 'Submitted 24 min ago', status: 'Pending' as 'Pending' | 'Approved' | 'Returned' },
    { id: 'APR-084', kind: 'Expense', subject: 'Vendor transport reimbursement', detail: idr(675000) + ' · Partner Portal', age: 'Submitted 1 hour ago', status: 'Pending' as 'Pending' | 'Approved' | 'Returned' },
    { id: 'APR-085', kind: 'Timesheet', subject: 'M. Putri · Week 41', detail: '32 hours · Creative delivery', age: 'Submitted 2 hours ago', status: 'Pending' as 'Pending' | 'Approved' | 'Returned' },
  ]);
  const updateRequest = (id: string, status: 'Approved' | 'Returned') => setRequests((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  return (
    <section className="rounded-card border border-line bg-panel p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="text-[14px] font-semibold text-fg">Actionable approval center</h2><p className="mt-1 text-[11px] text-muted">Timesheet and expense review queue</p></div>
        <StatusBadge tone={requests.some((item) => item.status === 'Pending') ? 'warning' : 'success'}>{requests.filter((item) => item.status === 'Pending').length} pending</StatusBadge>
      </div>
      <div className="grid gap-2">
        {requests.map((item) => (
          <article key={item.id} className="flex min-w-0 flex-col gap-3 rounded-control border border-line p-3 sm:flex-row sm:items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted">{item.kind === 'Expense' ? <WalletCards size={16} /> : <Clock3 size={16} />}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><p className="text-[12px] font-semibold text-fg">{item.subject}</p><StatusBadge tone={item.status === 'Approved' ? 'success' : item.status === 'Returned' ? 'danger' : 'warning'}>{item.status}</StatusBadge></div>
              <p className="mt-1 text-[11px] text-muted">{item.detail}</p>
              <p className="mt-1 text-[10px] text-muted">{item.id} · {item.age}</p>
            </div>
            {item.status === 'Pending' ? (
              <div className="flex shrink-0 gap-2">
                <ActionButton compact variant="primary" onClick={() => updateRequest(item.id, 'Approved')}><Check size={12} />Approve</ActionButton>
                <ActionButton compact onClick={() => updateRequest(item.id, 'Returned')}>Return</ActionButton>
              </div>
            ) : <span className="text-[10px] text-muted">Local preview state</span>}
          </article>
        ))}
      </div>
    </section>
  );
};

export const PersonalWorkspaceView: React.FC<{ role: WorkspaceRole | null }> = ({ role }) => {
  const [completeIds, setCompleteIds] = useState<string[]>([]);
  const todos = useMemo(() => TODO_ITEMS
    .filter((item) => role ? item.roles.includes(role) : false)
    .slice()
    .sort((first, second) => new Date(first.dueAt).getTime() - new Date(second.dueAt).getTime()), [role]);

  const toggleComplete = (id: string) => setCompleteIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  return (
    <WorkspacePage
      slug="workspace-personal-hub"
      title="Personal Workspace / My Hub"
      description="A prioritized view of assigned work, upcoming deadlines, and your current focus timer."
    >
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
        <SectionPanel title="Smart to-do list" description="Sorted by soonest deadline · complete a task to update this local view" actions={<StatusBadge tone="info">{todos.length - completeIds.filter((id) => todos.some((task) => task.id === id)).length} open</StatusBadge>}>
          <div className="grid min-w-0 gap-2 md:grid-cols-2">
            {todos.map((item) => {
              const done = completeIds.includes(item.id);
              return (
                <article key={item.id} className={'min-w-0 rounded-control border border-line p-3 transition-colors ' + (done ? 'bg-bg/70' : 'bg-panel')}>
                  <div className="flex items-start gap-2.5">
                    <input
                      id={'todo-' + item.id}
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleComplete(item.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    />
                    <div className="min-w-0 flex-1">
                      <label htmlFor={'todo-' + item.id} className={'block cursor-pointer text-[12px] font-semibold leading-4 ' + (done ? 'text-muted line-through' : 'text-fg')}>{item.title}</label>
                      <p className="mt-1 truncate text-[10px] text-muted">{item.project} · {item.id}</p>
                    </div>
                    <StatusBadge tone={PRIORITY_TONE[item.priority]}>{item.priority}</StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-muted"><CalendarDays size={12} />Due {dateLabel(item.dueAt)}</span>
                    <StatusBadge tone={done ? 'success' : item.state === 'Waiting' ? 'warning' : 'neutral'}>{done ? 'Completed' : item.state}</StatusBadge>
                  </div>
                </article>
              );
            })}
          </div>
          {todos.length === 0 && <p className="rounded-control border border-dashed border-line p-5 text-center text-[12px] text-muted">No tasks are assigned to this role in the preview data.</p>}
        </SectionPanel>
        <StopwatchWidget />
      </div>
      {(role === 'Admin' || role === 'PM') && <ApprovalCenter />}
      <SectionPanel title="Upcoming deadlines" description="Nearest delivery dates from your current to-do list">
        <div className="grid gap-2 sm:grid-cols-3">
          {todos.filter((item) => !completeIds.includes(item.id)).slice(0, 3).map((item) => (
            <div key={item.id} className="flex min-w-0 items-center gap-3 rounded-control border border-line p-3">
              <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-control border border-line bg-bg">
                <span className="text-[9px] uppercase text-muted">{new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(item.dueAt))}</span>
                <span className="text-[13px] font-semibold tabular-nums text-fg">{new Date(item.dueAt).getDate()}</span>
              </div>
              <div className="min-w-0"><p className="truncate text-[11px] font-semibold text-fg">{item.title}</p><p className="mt-1 text-[10px] text-muted">{item.project}</p></div>
            </div>
          ))}
          {todos.filter((item) => !completeIds.includes(item.id)).length === 0 && <p className="text-[11px] text-muted">All assigned tasks in this preview are complete.</p>}
        </div>
      </SectionPanel>
    </WorkspacePage>
  );
};

const ACTIVITY_ITEMS = [
  { time: '2026-10-15T16:45:00+07:00', actor: 'Mika Putri', action: 'submitted a design deliverable for internal review', target: 'Aurora Commerce · Checkout states', type: 'Review', tone: 'info' as const },
  { time: '2026-10-15T16:22:00+07:00', actor: 'Rafi Pratama', action: 'logged time against', target: 'Partner Portal · API acceptance', type: 'Timesheet', tone: 'neutral' as const },
  { time: '2026-10-15T15:58:00+07:00', actor: 'Finance desk', action: 'updated the invoice schedule for', target: 'Nusantara Health · Milestone 2', type: 'Finance', tone: 'warning' as const },
  { time: '2026-10-15T15:31:00+07:00', actor: 'Dina Account Team', action: 'moved an opportunity to Proposal Sent', target: 'PT Aurora Digital', type: 'CRM', tone: 'success' as const },
  { time: '2026-10-15T14:54:00+07:00', actor: 'Project Office', action: 'approved a project checkpoint for', target: 'Nusantara Health Portal', type: 'Project', tone: 'success' as const },
  { time: '2026-10-15T14:11:00+07:00', actor: 'Content editor', action: 'updated the editorial schedule for', target: 'MVP vs. Prototype guide', type: 'CMS', tone: 'neutral' as const },
  { time: '2026-10-15T13:40:00+07:00', actor: 'System monitor', action: 'recorded a successful session verification for', target: 'AMS authentication', type: 'Security', tone: 'info' as const },
];

export const ActivityStreamView: React.FC = () => (
  <WorkspacePage
    slug="workspace-activity-stream"
    title="Live Activity Stream"
    description="A chronological operational activity view for collaboration and audit awareness."
    actions={<ActionButton variant="secondary" onClick={() => window.location.reload()}><Activity size={14} />Refresh view</ActionButton>}
  >
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.8fr)]">
      <SectionPanel title="Recent activity" description="Newest events first · preview events, not a persisted audit log">
        <ol className="relative grid gap-0">
          {ACTIVITY_ITEMS.map((item, index) => (
            <li key={item.time + item.target} className="relative grid grid-cols-[18px_minmax(0,1fr)] gap-3 pb-5 last:pb-0">
              <div className="relative flex justify-center">
                <span className={'relative z-10 mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-panel ' + (item.tone === 'success' ? 'bg-success' : item.tone === 'warning' ? 'bg-warning' : item.tone === 'info' ? 'bg-info' : 'bg-series-4')} />
                {index < ACTIVITY_ITEMS.length - 1 && <span className="absolute bottom-0 top-4 w-px bg-line" />}
              </div>
              <div className="min-w-0 rounded-control border border-line p-3">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <StatusBadge tone={item.tone}>{item.type}</StatusBadge>
                  <time className="text-[10px] tabular-nums text-muted" dateTime={item.time}>{dateTimeLabel(item.time)}</time>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-fg"><span className="font-semibold">{item.actor}</span> {item.action} <span className="font-semibold">{item.target}</span>.</p>
              </div>
            </li>
          ))}
        </ol>
      </SectionPanel>
      <div className="grid min-w-0 content-start gap-4">
        <SectionPanel title="Activity at a glance" description="Event mix in the current sample window">
          <div className="grid gap-3">
            {[['Project & delivery', '2 events', 'var(--series-2)'], ['Finance & approvals', '1 event', 'var(--series-3)'], ['CRM & pipeline', '1 event', 'var(--accent)'], ['Content & security', '2 events', 'var(--series-4)']].map(([label, value, color]) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="flex-1 text-[11px] text-muted">{label}</span>
                <span className="text-[11px] font-semibold tabular-nums text-fg">{value}</span>
              </div>
            ))}
          </div>
        </SectionPanel>
        <SectionPanel title="Audit visibility" description="Activity stream boundary">
          <div className="flex items-start gap-2.5 rounded-control border border-line bg-bg p-3">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-muted" />
            <p className="text-[11px] leading-5 text-muted">These rows demonstrate the activity UI. Authoritative audit events, actor identity and retention must come from the existing server audit API.</p>
          </div>
        </SectionPanel>
      </div>
    </div>
  </WorkspacePage>
);
