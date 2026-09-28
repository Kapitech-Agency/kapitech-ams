import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Sparkles,
  Users,
} from 'lucide-react';
import { AdminModuleHeader, AdminPanel } from './AdminModulePrimitives';
import { CustomSelect } from '../ui/CustomSelect';
import { Modal } from '../ui/Modal';
import { DonutChart, TrendChart } from '../charts/DashboardCharts';

type RangeKey = '30D' | 'Q2' | 'YTD' | '12M';
type ProjectFilter = 'All' | 'Enterprise' | 'Retainer' | 'Fixed-fee';

interface DashboardProject {
  id: string;
  name: string;
  client: string;
  type: Exclude<ProjectFilter, 'All'>;
  status: string;
  statusTone: 'success' | 'warning' | 'danger' | 'info';
  progress: number;
  lead: string;
  budget: string;
}

interface TeamMember {
  name: string;
  role: string;
  workload: number;
  tasks: number;
  state: string;
  tone: 'success' | 'warning' | 'info';
}

const sampleProjects: DashboardProject[] = [
  { id: 'proj-001', name: 'Atlas Brand System', client: 'Atlas Group', type: 'Enterprise', status: 'On track', statusTone: 'success', progress: 78, lead: 'Fikri', budget: '$42,000' },
  { id: 'proj-002', name: 'Meridian Commerce', client: 'Meridian Labs', type: 'Fixed-fee', status: 'At risk', statusTone: 'warning', progress: 61, lead: 'Sarah', budget: '$28,500' },
  { id: 'proj-003', name: 'Nova Growth Retainer', client: 'Nova Ventures', type: 'Retainer', status: 'On track', statusTone: 'success', progress: 72, lead: 'Dimas', budget: '$18,000' },
  { id: 'proj-004', name: 'Orbit Product Launch', client: 'Orbit Health', type: 'Enterprise', status: 'Delayed', statusTone: 'danger', progress: 44, lead: 'Raka', budget: '$36,800' },
  { id: 'proj-005', name: 'Northstar Campaign', client: 'Northstar Capital', type: 'Retainer', status: 'In review', statusTone: 'info', progress: 86, lead: 'Nadia', budget: '$24,000' },
];

const sampleTeam: TeamMember[] = [
  { name: 'Fikri Nurlete', role: 'Creative director', workload: 82, tasks: 11, state: 'High load', tone: 'warning' },
  { name: 'Sarah Pratama', role: 'Account lead', workload: 74, tasks: 9, state: 'Balanced', tone: 'success' },
  { name: 'Dimas Ardi', role: 'Product designer', workload: 68, tasks: 8, state: 'Balanced', tone: 'success' },
  { name: 'Raka Mahendra', role: 'Developer', workload: 91, tasks: 13, state: 'Near max', tone: 'warning' },
  { name: 'Nadia Putri', role: 'Strategist', workload: 55, tasks: 6, state: 'Available', tone: 'info' },
];

const sampleRevenueByRange: Record<RangeKey, Array<{ label: string; primary: number; secondary: number; tertiary: number }>> = {
  '30D': [
    { label: 'W1', primary: 18800, secondary: 12400, tertiary: 6400 },
    { label: 'W2', primary: 20100, secondary: 12900, tertiary: 7200 },
    { label: 'W3', primary: 21400, secondary: 13200, tertiary: 8200 },
    { label: 'W4', primary: 22600, secondary: 13800, tertiary: 8800 },
  ],
  Q2: [
    { label: 'Apr', primary: 71800, secondary: 49200, tertiary: 22600 },
    { label: 'May', primary: 80200, secondary: 51400, tertiary: 28800 },
    { label: 'Jun', primary: 84500, secondary: 52200, tertiary: 32300 },
  ],
  YTD: [
    { label: 'Jan', primary: 61000, secondary: 42000, tertiary: 19000 },
    { label: 'Feb', primary: 68500, secondary: 44700, tertiary: 23800 },
    { label: 'Mar', primary: 74200, secondary: 46300, tertiary: 27900 },
    { label: 'Apr', primary: 71800, secondary: 49200, tertiary: 22600 },
    { label: 'May', primary: 80200, secondary: 51400, tertiary: 28800 },
    { label: 'Jun', primary: 84500, secondary: 52200, tertiary: 32300 },
  ],
  '12M': [
    { label: 'Jul', primary: 57400, secondary: 40100, tertiary: 17300 },
    { label: 'Aug', primary: 59200, secondary: 41100, tertiary: 18100 },
    { label: 'Sep', primary: 63800, secondary: 42600, tertiary: 21200 },
    { label: 'Oct', primary: 67100, secondary: 43500, tertiary: 23600 },
    { label: 'Nov', primary: 69600, secondary: 44100, tertiary: 25500 },
    { label: 'Dec', primary: 73200, secondary: 45200, tertiary: 28000 },
    { label: 'Jan', primary: 61000, secondary: 42000, tertiary: 19000 },
    { label: 'Feb', primary: 68500, secondary: 44700, tertiary: 23800 },
    { label: 'Mar', primary: 74200, secondary: 46300, tertiary: 27900 },
    { label: 'Apr', primary: 71800, secondary: 49200, tertiary: 22600 },
    { label: 'May', primary: 80200, secondary: 51400, tertiary: 28800 },
    { label: 'Jun', primary: 84500, secondary: 52200, tertiary: 32300 },
  ],
};

const deliveryBreakdown = [
  { label: 'On schedule', value: 8, tone: 'success' as const },
  { label: 'At risk', value: 3, tone: 'warning' as const },
  { label: 'Overdue', value: 1, tone: 'danger' as const },
];

const toneClasses = {
  success: 'border-success/25 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  danger: 'border-danger/25 bg-danger/10 text-danger',
  info: 'border-info/25 bg-info/10 text-info',
} as const;

const progressClasses = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
} as const;

const formatMoney = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);


type DashboardTask = {
  id: string;
  task: string;
  project: string;
  assignee: string;
  due: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'Blocked' | 'Completed';
};

const sampleTasks: DashboardTask[] = [
  { id: 'task-001', task: 'Approve homepage copy', project: 'Atlas Brand System', assignee: 'Fikri', due: 'Today', priority: 'High', status: 'Open' },
  { id: 'task-002', task: 'Finalize checkout UI', project: 'Meridian Commerce', assignee: 'Sarah', due: 'Tomorrow', priority: 'High', status: 'Open' },
  { id: 'task-003', task: 'QA campaign landing page', project: 'Nova Growth Retainer', assignee: 'Dimas', due: 'Wed', priority: 'Medium', status: 'Open' },
  { id: 'task-004', task: 'Resolve API handoff', project: 'Orbit Product Launch', assignee: 'Raka', due: 'Overdue', priority: 'Urgent', status: 'Blocked' },
  { id: 'task-005', task: 'Prepare client presentation', project: 'Northstar Campaign', assignee: 'Nadia', due: 'Thu', priority: 'Medium', status: 'Open' },
  { id: 'task-006', task: 'Review analytics dashboard', project: 'Atlas Brand System', assignee: 'Fikri', due: 'Fri', priority: 'Low', status: 'Open' },
];

const TasksView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState<'All' | DashboardTask['priority']>('All');
  const [selectedTask, setSelectedTask] = useState<DashboardTask | null>(null);

  const filteredTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sampleTasks.filter((item) => {
      const matchesQuery = !normalized || [item.task, item.project, item.assignee, item.due]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
      const matchesPriority = priority === 'All' || item.priority === priority;
      return matchesQuery && matchesPriority;
    });
  }, [priority, query]);

  return (
    <div className="space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Open tasks', '31', '18 due this week'],
          ['High priority', '6', '3 overdue'],
          ['Completed this week', '24', '+8 vs previous week'],
          ['Blocked', '3', 'Across 2 projects'],
        ].map(([label, value, context]) => (
          <article key={label} className="rounded-card border border-line bg-panel p-4">
            <div className="text-xs text-muted">{label}</div>
            <div className="mt-3 text-2xl font-medium tabular-nums text-fg">{value}</div>
            <div className="mt-1 text-[11px] text-muted">{context}</div>
          </article>
        ))}
      </section>

      <AdminPanel
        title="Tasks this week"
        description="Sample task queue prepared from the Stitch dashboard workload model."
        bodyClassName="p-0"
        actions={(
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="relative block min-w-0 sm:w-52">
              <span className="sr-only">Search tasks</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks…"
                className="h-9 min-h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <CustomSelect
              value={priority}
              onChange={(value) => setPriority(value as 'All' | DashboardTask['priority'])}
              options={['All', 'Urgent', 'High', 'Medium', 'Low'].map((value) => ({
                value,
                label: value === 'All' ? 'All priorities' : value,
              }))}
              aria-label="Filter tasks by priority"
              className="w-full sm:w-40"
              triggerClassName="w-full"
            />
          </div>
        )}
      >
        <div className="border-b border-line px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3 text-[11px] text-muted">
            <span>{filteredTasks.length} of {sampleTasks.length} tasks shown</span>
            {(query || priority !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setPriority('All');
                }}
                className="rounded-control px-2 py-1 text-accent-text hover:bg-bg"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="min-[900px]:hidden divide-y divide-line">
          {filteredTasks.map((item) => (
            <article key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold leading-5 text-fg">{item.task}</h3>
                  <p className="mt-1 truncate text-[11px] text-muted">{item.project}</p>
                </div>
                <span className={['shrink-0 rounded-badge border px-2 py-1 text-[10px] font-medium', item.priority === 'Urgent' ? toneClasses.danger : item.priority === 'High' ? toneClasses.warning : item.priority === 'Medium' ? toneClasses.info : toneClasses.success].join(' ')}>
                  {item.priority}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-control border border-line bg-bg p-2.5">
                  <div className="text-[10px] text-muted">Assignee</div>
                  <div className="mt-1 truncate text-[11px] font-medium text-fg">{item.assignee}</div>
                </div>
                <div className="rounded-control border border-line bg-bg p-2.5">
                  <div className="text-[10px] text-muted">Due</div>
                  <div className={['mt-1 truncate text-[11px] font-medium', item.due === 'Overdue' ? 'text-danger' : 'text-fg'].join(' ')}>{item.due}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(item)}
                className="mt-3 flex min-h-9 w-full items-center justify-center rounded-control border border-line bg-bg px-3 text-xs font-medium text-fg hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                View task
              </button>
              {item.status === 'Blocked' && (
                <div className="mt-3 rounded-control border border-danger/20 bg-danger/5 px-3 py-2 text-[10px] font-medium text-danger">
                  Blocked — requires attention
                </div>
              )}
            </article>
          ))}
          {filteredTasks.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-xs font-medium text-fg">No matching tasks</p>
              <p className="mt-1 text-[11px] text-muted">Adjust the search or priority filter.</p>
            </div>
          )}
        </div>

        <div className="hidden min-[900px]:block overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[840px] border-collapse text-left">
            <thead>
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-muted">Task</th>
                <th className="px-3 py-3 text-xs font-medium text-muted">Project</th>
                <th className="px-3 py-3 text-xs font-medium text-muted">Assignee</th>
                <th className="px-3 py-3 text-xs font-medium text-muted">Due</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-muted">Priority</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((item) => (
                <tr key={item.id} className="border-t border-line hover:bg-panel-hover">
                  <td className="px-4 py-3 text-xs font-medium text-fg">
                    <div>{item.task}</div>
                    {item.status === 'Blocked' && <span className="mt-1 inline-flex rounded-badge border border-danger/25 bg-danger/10 px-1.5 py-0.5 text-[10px] font-medium text-danger">Blocked</span>}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted">{item.project}</td>
                  <td className="px-3 py-3 text-xs text-muted">{item.assignee}</td>
                  <td className="px-3 py-3 text-xs text-muted">{item.due}</td>
                  <td className="px-3 py-3 text-right">
                    <span className={`inline-flex rounded-badge border px-2 py-1 text-[11px] font-medium ${
                      item.priority === 'Urgent' ? toneClasses.danger : item.priority === 'High' ? toneClasses.warning : item.priority === 'Medium' ? toneClasses.info : toneClasses.success
                    }`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedTask(item)}
                      className="inline-flex min-h-8 items-center justify-center rounded-control border border-line bg-panel px-2.5 text-[11px] font-medium text-muted hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-xs font-medium text-fg">No matching tasks</p>
                    <p className="mt-1 text-[11px] text-muted">Adjust the search or priority filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <Modal
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        size="md"
        title={selectedTask?.task || 'Task details'}
        description={selectedTask ? selectedTask.project : undefined}
        footer={(
          <button
            type="button"
            onClick={() => setSelectedTask(null)}
            className="inline-flex min-h-9 items-center justify-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent"
          >
            Close
          </button>
        )}
      >
        {selectedTask && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-control border border-line bg-bg p-3">
              <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Assignee</div>
              <div className="mt-1 text-sm font-semibold text-fg">{selectedTask.assignee}</div>
            </div>
            <div className="rounded-control border border-line bg-bg p-3">
              <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Due</div>
              <div className="mt-1 text-sm font-semibold text-fg">{selectedTask.due}</div>
            </div>
            <div className="rounded-control border border-line bg-bg p-3">
              <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Priority</div>
              <div className="mt-1 text-sm font-semibold text-fg">{selectedTask.priority}</div>
            </div>
            <div className="rounded-control border border-line bg-bg p-3">
              <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Status</div>
              <div className="mt-1 text-sm font-semibold text-fg">{selectedTask.status}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
const PerformanceView: React.FC = () => {
  const completion = 76;
  const totalTasks = 84;
  const completedTasks = 64;
  const avgCycleTime = '3.8 days';
  const blockedTasks = 7;

  return (
    <div className="space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Delivery score', value: '92%', context: '+4.8% vs previous period', tone: 'success' as const },
          { label: 'Task completion', value: '76%', context: '64 of 84 tracked tasks', tone: 'info' as const },
          { label: 'Avg. cycle time', value: avgCycleTime, context: '-0.6 days vs previous period', tone: 'success' as const },
          { label: 'Blocked work', value: String(blockedTasks), context: '3 projects affected', tone: 'warning' as const },
        ].map((metric) => (
          <article key={metric.label} className="min-w-0 rounded-card border border-line bg-panel p-3.5 sm:p-4">
            <div className="text-xs text-muted">{metric.label}</div>
            <div className="mt-3 text-2xl font-medium tabular-nums text-fg">{metric.value}</div>
            <div className="mt-1 text-[11px] text-muted">{metric.context}</div>
          </article>
        ))}
      </section>

      <div className="grid gap-3 min-[1100px]:grid-cols-12">
        <AdminPanel
          className="min-[1100px]:col-span-8"
          title="Delivery performance"
          description="How projects are progressing against planned delivery windows."
          bodyClassName="p-4 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'On schedule', value: 67, tone: 'success' as const },
              { label: 'At risk', value: 25, tone: 'warning' as const },
              { label: 'Delayed', value: 8, tone: 'danger' as const },
            ].map((item) => (
              <div key={item.label} className="rounded-control border border-line bg-bg p-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted">{item.label}</span>
                  <span className="font-semibold tabular-nums text-fg">{item.value}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-sm bg-line">
                  <div
                    className={item.tone === 'success' ? 'h-full rounded-sm bg-success' : item.tone === 'warning' ? 'h-full rounded-sm bg-warning' : 'h-full rounded-sm bg-danger'}
                    style={{ width: item.value + '%' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <TrendChart
              data={[
                { label: 'W1', primary: 58, secondary: 18, tertiary: 12 },
                { label: 'W2', primary: 63, secondary: 16, tertiary: 11 },
                { label: 'W3', primary: 69, secondary: 14, tertiary: 9 },
                { label: 'W4', primary: 76, secondary: 12, tertiary: 7 },
                { label: 'W5', primary: 81, secondary: 10, tertiary: 5 },
                { label: 'W6', primary: 84, secondary: 9, tertiary: 4 },
              ]}
              primaryLabel="Completed"
              secondaryLabel="In progress"
              tertiaryLabel="Blocked"
              ariaLabel="Task completion performance over the last six weeks."
            />
          </div>
        </AdminPanel>

        <AdminPanel
          className="min-[1100px]:col-span-4"
          title="Capacity pressure"
          description="Current workload distribution across the team."
          bodyClassName="p-4 sm:p-5"
        >
          <div className="space-y-4">
            {sampleTeam.map((member) => (
              <div key={member.name}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="truncate text-xs font-medium text-fg">{member.name}</span>
                  <span className="text-xs font-medium tabular-nums text-fg">{member.workload}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-sm bg-line">
                  <div className={['h-full rounded-sm', progressClasses[member.tone]].join(' ')} style={{ width: member.workload + '%' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-control border border-warning/20 bg-warning/5 p-3 text-xs">
            <div className="font-medium text-fg">2 members near maximum load</div>
            <div className="mt-1 leading-5 text-muted">Rebalance work before adding new high-priority assignments.</div>
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-3 min-[1100px]:grid-cols-12">
        <AdminPanel className="min-[1100px]:col-span-7" title="Workstream health" description="Sample operational indicators for the current delivery cycle." bodyClassName="p-4 sm:p-5">
          {[
            ['Creative production', 88, 'Ahead of plan'],
            ['Development', 71, 'On plan'],
            ['Client approvals', 63, 'Needs follow-up'],
            ['QA & launch', 79, 'On plan'],
          ].map(([label, value, state]) => (
            <div key={String(label)} className="mb-4 last:mb-0">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-xs text-fg">{label}</span>
                <span className="text-[11px] text-muted">{state} · {value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-sm bg-line">
                <div className="h-full rounded-sm bg-success" style={{ width: String(value) + '%' }} />
              </div>
            </div>
          ))}
        </AdminPanel>

        <AdminPanel className="min-[1100px]:col-span-5" title="Execution summary" description="Core performance counters from the current sample period." bodyClassName="p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Tasks tracked', String(totalTasks)],
              ['Completed', String(completedTasks)],
              ['Overdue', '3'],
              ['Client approvals pending', '5'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-control border border-line bg-bg p-3">
                <div className="text-lg font-medium tabular-nums text-fg">{value}</div>
                <div className="mt-1 text-[11px] text-muted">{label}</div>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
};

const AnalyticsView: React.FC<{ range: RangeKey }> = ({ range }) => {
  const revenue = [61000, 68500, 74200, 71800, 80200, 84500];
  const expenses = [42000, 44700, 46300, 49200, 51400, 52200];
  const revenueTotal = revenue.reduce((sum, value) => sum + value, 0);
  const expenseTotal = expenses.reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Revenue growth', '+12.4%', 'Month over month'],
          ['Gross margin', '61.9%', 'Sample agency blended margin'],
          ['Portfolio value', '$149.3k', 'Active project budgets'],
          ['Invoice aging', '$8.7k', 'Past due balance'],
        ].map(([label, value, context]) => (
          <article key={label} className="rounded-card border border-line bg-panel p-4">
            <div className="text-xs text-muted">{label}</div>
            <div className="mt-3 text-2xl font-medium tabular-nums text-fg">{value}</div>
            <div className="mt-1 text-[11px] text-muted">{context}</div>
          </article>
        ))}
      </section>

      <div className="grid gap-3 min-[1100px]:grid-cols-12">
        <AdminPanel className="min-[1100px]:col-span-8" title="Financial analytics" description="Revenue, expense, and net contribution trend based on Stitch sample inputs." bodyClassName="p-4 sm:p-5">
          <TrendChart
            data={sampleRevenueByRange[range]}
            primaryLabel="Revenue"
            secondaryLabel="Expenses"
            tertiaryLabel="Net"
            primaryFormat={formatMoney}
            ariaLabel="Financial analytics trend."
          />
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
            {[
              ['Revenue', formatMoney(revenueTotal)],
              ['Expenses', formatMoney(expenseTotal)],
              ['Net', formatMoney(revenueTotal - expenseTotal)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-control bg-bg p-3">
                <div className="text-[11px] text-muted">{label}</div>
                <div className="mt-1 text-sm font-medium tabular-nums text-fg">{value}</div>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel className="min-[1100px]:col-span-4" title="Portfolio mix" description="Sample distribution of active work by commercial model." bodyClassName="p-4 sm:p-5">
          <DonutChart
            data={[
              { label: 'Enterprise', value: 5, tone: 'info' as const },
              { label: 'Retainer', value: 4, tone: 'success' as const },
              { label: 'Fixed-fee', value: 3, tone: 'warning' as const },
            ]}
            ariaLabel="Portfolio mix by commercial model."
          />
          <div className="mt-4 space-y-3 border-t border-line pt-4">
            {[
              ['Enterprise', '42%', '5 projects'],
              ['Retainer', '33%', '4 projects'],
              ['Fixed-fee', '25%', '3 projects'],
            ].map(([label, percent, context]) => (
              <div key={label} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-fg">{label}</span>
                <span className="text-muted">{percent} · {context}</span>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-3 min-[1100px]:grid-cols-12">
        <AdminPanel className="min-[1100px]:col-span-7" title="Team workload analytics" description="Task allocation and utilization by team member." bodyClassName="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-muted">Team member</th>
                  <th className="px-3 py-3 text-xs font-medium text-muted">Tasks</th>
                  <th className="px-3 py-3 text-xs font-medium text-muted">Utilization</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted">State</th>
                </tr>
              </thead>
              <tbody>
                {sampleTeam.map((member) => (
                  <tr key={member.name} className="border-t border-line">
                    <td className="px-4 py-3 text-xs font-medium text-fg">{member.name}</td>
                    <td className="px-3 py-3 text-xs tabular-nums text-muted">{member.tasks}</td>
                    <td className="px-3 py-3">
                      <div className="flex min-w-[150px] items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-line">
                          <div className={['h-full rounded-sm', progressClasses[member.tone]].join(' ')} style={{ width: member.workload + '%' }} />
                        </div>
                        <span className="w-9 text-right text-[11px] tabular-nums text-muted">{member.workload}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted">{member.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>

        <AdminPanel className="min-[1100px]:col-span-5" title="Client & project analytics" description="Sample health signals for decision support." bodyClassName="p-4 sm:p-5">
          <div className="space-y-3">
            {[
              ['Atlas Group', '78%', 'Brand system · enterprise', 'success'],
              ['Meridian Labs', '61%', 'Commerce · fixed-fee', 'warning'],
              ['Nova Ventures', '72%', 'Growth · retainer', 'success'],
              ['Orbit Health', '44%', 'Launch · enterprise', 'danger'],
            ].map(([client, progress, context, tone]) => (
              <div key={client} className="rounded-control border border-line bg-bg p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-fg">{client}</div>
                    <div className="mt-0.5 truncate text-[10px] text-muted">{context}</div>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-fg">{progress}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-line">
                  <div className={['h-full rounded-sm', progressClasses[tone as keyof typeof progressClasses]].join(' ')} style={{ width: progress }} />
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: <CircleDollarSign size={15} />, label: 'Highest revenue month', value: 'June · $84.5k' },
          { icon: <Users size={15} />, label: 'Peak team load', value: 'Raka · 91%' },
          { icon: <AlertTriangle size={15} />, label: 'Risk concentration', value: '3 projects at risk' },
        ].map((item) => (
          <article key={item.label} className="rounded-card border border-line bg-panel p-4">
            <div className="flex items-center gap-2 text-xs text-muted">{item.icon}{item.label}</div>
            <div className="mt-2 text-sm font-medium text-fg">{item.value}</div>
          </article>
        ))}
      </section>
    </div>
  );
};

export const GlobalExecutiveDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const view = (searchParams.get('view') || 'overview') as 'overview' | 'performance' | 'analytics' | 'tasks';
  const [range, setRange] = useState<RangeKey>('Q2');
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('All');
  const [projectActionId, setProjectActionId] = useState<string | null>(null);
  const [projectActionPosition, setProjectActionPosition] = useState<{ top: number; left: number } | null>(null);
  const [projectDetails, setProjectDetails] = useState<DashboardProject | null>(null);

  useEffect(() => {
    if (!projectActionId) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-dashboard-project-actions]')) return;
      setProjectActionId(null);
      setProjectActionPosition(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProjectActionId(null);
        setProjectActionPosition(null);
      }
    };

    const handleScroll = () => {
      setProjectActionId(null);
      setProjectActionPosition(null);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [projectActionId]);


  const filteredProjects = useMemo(
    () => projectFilter === 'All' ? sampleProjects : sampleProjects.filter((project) => project.type === projectFilter),
    [projectFilter],
  );

  const totalDelivery = deliveryBreakdown.reduce((total, item) => total + Math.max(0, item.value), 0);
  const onScheduleValue = deliveryBreakdown.find((item) => item.label === 'On schedule')?.value ?? 0;
  const onSchedulePercent = totalDelivery > 0 ? Math.round((Math.max(0, onScheduleValue) / totalDelivery) * 100) : 0;
  const revenueData = sampleRevenueByRange[range];

  return (
    <div className="ams-dashboard min-h-full pb-10">
      <AdminModuleHeader
        title="Agency overview"
        description="Real-time metrics, project pacing, and financial health for the agency."
        icon={<Sparkles size={18} />}
        actions={(
          <>
            <div className="flex w-full items-center gap-0.5 rounded-control bg-bg p-0.5 sm:w-auto">
              {(['30D', 'Q2', 'YTD', '12M'] as RangeKey[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={range === item}
                  onClick={() => setRange(item)}
                  className={['rounded-chip px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', range === item ? 'bg-line font-medium text-fg' : 'text-muted hover:text-fg'].join(' ')}
                >
                  {item}
                </button>
              ))}
            </div>
            <Link
              to="/admin/projects"
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control bg-accent px-3 text-xs font-medium sm:min-h-9 sm:w-auto text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Plus size={14} />
              New project
            </Link>
          </>
        )}
      />

      <div className="min-[900px]:hidden mb-4 -mt-2">
        <nav aria-label="Dashboard view" className="grid w-full grid-cols-4 gap-1 rounded-control bg-panel border border-line p-1">
          {[
            { key: 'overview', label: 'Overview', search: '' },
            { key: 'performance', label: 'Performance', search: '?view=performance' },
            { key: 'analytics', label: 'Analytics', search: '?view=analytics' },
            { key: 'tasks', label: 'Tasks', search: '?view=tasks' },
          ].map((tab) => (
            <Link
              key={tab.key}
              to={`/admin/dashboard${tab.search}`}
              className={[
                'min-w-0 rounded-chip px-2 py-2 text-center text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                view === tab.key ? 'bg-line text-fg' : 'text-muted hover:bg-bg hover:text-fg',
              ].join(' ')}
              aria-current={view === tab.key ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {view === 'overview' ? (
        <>
      <section className="mb-5" aria-label="Executive key performance indicators">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 min-[760px]:grid-cols-3 min-[1180px]:grid-cols-6">
          {[
            { label: 'Active projects', value: '12', change: '+2 this month', icon: <FolderKanban size={16} />, tone: 'success' },
            { label: 'Tasks due this week', value: '18', change: '6 high priority', icon: <CalendarDays size={16} />, tone: 'info' },
            { label: 'Overdue tasks', value: '3', change: 'Requires attention', icon: <AlertTriangle size={16} />, tone: 'danger' },
            { label: 'Team utilization', value: '78%', change: '+6% vs last month', icon: <Users size={16} />, tone: 'warning' },
            { label: 'Monthly revenue', value: '$84.5k', change: '+12.4% vs May', icon: <CircleDollarSign size={16} />, tone: 'success' },
            { label: 'Outstanding invoices', value: '$32.4k', change: '$8.7k overdue', icon: <ReceiptText size={16} />, tone: 'warning' },
          ].map((metric) => (
            <article key={metric.label} className="rounded-card border border-line bg-panel p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">{metric.label}</span>
                <span className={['flex h-7 w-7 items-center justify-center rounded-control border', toneClasses[metric.tone as keyof typeof toneClasses]].join(' ')}>
                  {metric.icon}
                </span>
              </div>
              <div className="mt-4">
                <div className="truncate text-2xl font-medium tracking-[-0.02em] tabular-nums text-fg">{metric.value}</div>
                <div className="mt-1 text-[11px] text-muted">{metric.change}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-3 min-[1100px]:grid-cols-12">
        <AdminPanel className="min-[1100px]:col-span-8" bodyClassName="p-4 sm:p-5" title="Revenue vs expenses" description="Monthly cash flow performance for the selected period." actions={(
          <div className="hidden items-center gap-3 text-[11px] text-muted sm:flex">
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-accent" /> Revenue</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-info" /> Expenses</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-success" /> Net</span>
          </div>
        )}>
          <TrendChart data={revenueData} primaryLabel="Revenue" secondaryLabel="Expenses" tertiaryLabel="Net" primaryFormat={formatMoney} ariaLabel={'Revenue, expenses, and net trend for ' + range + '.'} />
        </AdminPanel>

        <AdminPanel className="min-[1100px]:col-span-4" bodyClassName="p-4 sm:p-5" title="Delivery & pacing" description="Project delivery distribution across the current portfolio.">
          <div className="space-y-4">
            <div className="rounded-control border border-line bg-bg/45 p-3.5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">On schedule</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-medium tracking-[-0.03em] tabular-nums text-fg">{onSchedulePercent}%</span>
                    <span className="text-[11px] text-muted">{onScheduleValue} of {totalDelivery} projects</span>
                  </div>
                </div>
                <span className="shrink-0 rounded-badge border border-success/20 bg-success/10 px-2 py-1 text-[10px] font-medium text-success">On track</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                <div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: onSchedulePercent + '%' }} />
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-[132px_minmax(0,1fr)] items-center gap-4">
              <div className="mx-auto w-[132px] max-w-full">
                <DonutChart
                  data={deliveryBreakdown}
                  ariaLabel="Project delivery distribution: 8 on schedule, 3 at risk, 1 overdue."
                  showLegend={false}
                />
              </div>

              <div className="min-w-0 space-y-1.5">
                {deliveryBreakdown.map((item) => {
                  const safeValue = Math.max(0, item.value);
                  const percent = totalDelivery > 0 ? Math.round((safeValue / totalDelivery) * 100) : 0;
                  return (
                    <div key={item.label} className="rounded-control border border-transparent px-2.5 py-2 transition-colors hover:border-line hover:bg-bg">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-fg">
                          <i className={['h-2 w-2 shrink-0 rounded-full', progressClasses[item.tone]].join(' ')} />
                          <span className="truncate">{item.label}</span>
                        </span>
                        <span className="shrink-0 text-[11px] font-medium tabular-nums text-fg">{safeValue}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
                          <div className={['h-full rounded-full', progressClasses[item.tone]].join(' ')} style={{ width: percent + '%' }} />
                        </div>
                        <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-muted">{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </AdminPanel>
      </div>

      <div className="mt-3 grid gap-3 min-[1100px]:grid-cols-12">
        <AdminPanel className="min-[1100px]:col-span-8" bodyClassName="p-0" title="Active projects" description="Current delivery status across the agency portfolio." actions={(
          <Link to="/admin/projects" className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-accent-text">View all <ArrowUpRight size={13} /></Link>
        )}>
          <div className="border-b border-line px-4 pt-3 sm:px-5">
            <div className="flex gap-1.5 overflow-x-auto pb-3 custom-scrollbar">
              {(['All', 'Enterprise', 'Retainer', 'Fixed-fee'] as ProjectFilter[]).map((filter) => (
                <button key={filter} type="button" aria-pressed={projectFilter === filter} onClick={() => setProjectFilter(filter)} className={['shrink-0 rounded-chip border px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', projectFilter === filter ? 'border-line bg-panel-hover font-medium text-fg' : 'border-transparent bg-transparent text-muted hover:border-line hover:bg-bg hover:text-fg'].join(' ')}>{filter}</button>
              ))}
            </div>
          </div>
          <div className="min-[900px]:hidden divide-y divide-line">
            {filteredProjects.map((project) => (
              <article key={project.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-xs font-semibold text-fg">{project.name}</h3>
                    <p className="mt-1 truncate text-[11px] text-muted">{project.client}</p>
                  </div>
                  <span className={['shrink-0 rounded-badge border px-2 py-1 text-[10px] font-medium', toneClasses[project.statusTone]].join(' ')}>
                    {project.status}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3 text-[10px] text-muted">
                    <span>{project.type}</span>
                    <span className="tabular-nums">{project.progress}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className={['h-full rounded-full', progressClasses[project.statusTone === 'danger' ? 'danger' : project.statusTone === 'warning' ? 'warning' : 'success']].join(' ')}
                      style={{ width: project.progress + '%' }}
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-control border border-line bg-bg p-2.5">
                    <div className="text-[10px] text-muted">Lead</div>
                    <div className="mt-1 truncate text-[11px] font-medium text-fg">{project.lead}</div>
                  </div>
                  <div className="rounded-control border border-line bg-bg p-2.5">
                    <div className="text-[10px] text-muted">Budget</div>
                    <div className="mt-1 truncate text-[11px] font-medium text-fg">{project.budget}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProjectDetails(project)}
                  className="mt-3 flex min-h-9 w-full items-center justify-center rounded-control border border-line bg-bg px-3 text-xs font-medium text-fg transition-colors hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  View project
                </button>
              </article>
            ))}
          </div>

          <div className="hidden min-[900px]:block overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead><tr>
                <th className="px-4 py-3 text-xs font-medium text-muted sm:px-5">Project / client</th>
                <th className="px-3 py-3 text-xs font-medium text-muted">Status</th>
                <th className="px-3 py-3 text-xs font-medium text-muted">Pacing</th>
                <th className="px-3 py-3 text-xs font-medium text-muted">Lead</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted">Budget</th>
                <th className="w-10 px-2 py-3" />
              </tr></thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="border-t border-line transition-colors hover:bg-panel-hover">
                    <td className="px-4 py-3 sm:px-5"><div className="font-medium text-xs text-fg">{project.name}</div><div className="mt-0.5 text-[11px] text-muted">{project.client}</div></td>
                    <td className="px-3 py-3"><span className={['inline-flex items-center rounded-badge border px-2 py-1 text-[11px] font-medium', toneClasses[project.statusTone]].join(' ')}>{project.status}</span></td>
                    <td className="px-3 py-3"><div className="flex min-w-[150px] items-center gap-2"><div className="h-1.5 min-w-20 flex-1 overflow-hidden rounded-sm bg-line"><div className={['h-full rounded-sm', progressClasses[project.statusTone === 'danger' ? 'danger' : project.statusTone === 'warning' ? 'warning' : 'success']].join(' ')} style={{ width: project.progress + '%' }} /></div><span className="w-8 text-right text-[11px] tabular-nums text-muted">{project.progress}%</span></div></td>
                    <td className="px-3 py-3"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-bg text-[10px] font-semibold text-fg">{project.lead.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span className="text-xs text-muted">{project.lead}</span></div></td>
                    <td className="px-4 py-3 text-right text-xs font-medium tabular-nums text-fg">{project.budget}</td>
                    <td className="relative px-2 py-3 text-right" data-dashboard-project-actions>
                      <button
                        type="button"
                        aria-label={'More actions for ' + project.name}
                        aria-haspopup="menu"
                        aria-expanded={projectActionId === project.id}
                        onClick={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect();
                          setProjectActionPosition({
                            top: Math.min(window.innerHeight - 104, rect.bottom + 4),
                            left: Math.max(8, Math.min(window.innerWidth - 200, rect.right - 192)),
                          });
                          setProjectActionId(current => current === project.id ? null : project.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {projectActionId === project.id && (
                        <div
                          role="menu"
                          aria-label={'Actions for ' + project.name}
                          className="fixed z-[70] w-48 overflow-hidden rounded-card border border-line bg-panel p-1 text-left shadow-none"
                          style={{ top: projectActionPosition?.top, left: projectActionPosition?.left }}
                          data-dashboard-project-actions
                        >
                          <button
                            type="button"
                            role="menuitem"
                            className="flex min-h-9 w-full items-center rounded-control px-3 text-xs text-muted hover:bg-bg hover:text-fg"
                            onClick={() => {
                              setProjectDetails(project);
                              setProjectActionId(null);
                              setProjectActionPosition(null);
                            }}
                          >
                            View project details
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="flex min-h-9 w-full items-center rounded-control px-3 text-xs text-muted hover:bg-bg hover:text-fg"
                            onClick={() => {
                              navigate('/admin/projects');
                              setProjectActionId(null);
                              setProjectActionPosition(null);
                            }}
                          >
                            Open project workspace
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>

        <AdminPanel className="min-[1100px]:col-span-4" bodyClassName="p-4 sm:p-5" title="Team capacity" description="Current task load based on the sample agency plan." actions={<span className="rounded-badge border border-line bg-bg px-2 py-1 text-[11px] text-muted">5 members</span>}>
          <div className="space-y-4">
            {sampleTeam.map((member) => (
              <div key={member.name}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-xs font-semibold text-fg">{member.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><div className="min-w-0"><div className="truncate text-xs font-medium text-fg">{member.name}</div><div className="mt-0.5 truncate text-[10px] text-muted">{member.role}</div></div></div>
                  <div className="shrink-0 text-right"><span className="text-xs font-medium tabular-nums text-fg">{member.workload}%</span><span className="mt-0.5 block text-[10px] text-muted">{member.tasks} tasks · {member.state}</span></div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-sm bg-line"><div className={['h-full rounded-sm', progressClasses[member.tone]].join(' ')} style={{ width: member.workload + '%' }} /></div>
              </div>
            ))}
            <div className="border-t border-line pt-4"><Link to="/admin/time-logs" className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-accent-text">View team schedule <ArrowUpRight size={13} /></Link></div>
          </div>
        </AdminPanel>
      </div>

      <section className="mt-3 grid gap-3 sm:grid-cols-3" aria-label="Dashboard supporting signals">
        <article className="rounded-card border border-line bg-panel p-4"><div className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 size={15} className="text-success" /> Delivery health</div><div className="mt-2 text-lg font-medium tabular-nums text-fg">8 / 12</div><div className="mt-1 text-[11px] text-muted">Projects currently on schedule.</div></article>
        <article className="rounded-card border border-line bg-panel p-4"><div className="flex items-center gap-2 text-xs text-muted"><Clock3 size={15} className="text-warning" /> Priority work</div><div className="mt-2 text-lg font-medium tabular-nums text-fg">6</div><div className="mt-1 text-[11px] text-muted">High-priority tasks due this week.</div></article>
        <article className="rounded-card border border-line bg-panel p-4"><div className="flex items-center gap-2 text-xs text-muted"><ReceiptText size={15} className="text-warning" /> Invoice follow-up</div><div className="mt-2 text-lg font-medium tabular-nums text-fg">$8.7k</div><div className="mt-1 text-[11px] text-muted">Outstanding amount past due.</div></article>
      </section>

        </>
      ) : view === 'performance' ? (
        <PerformanceView />
      ) : view === 'tasks' ? (
        <TasksView />
      ) : (
        <AnalyticsView range={range} />
      )}
      <Modal
        open={Boolean(projectDetails)}
        onClose={() => setProjectDetails(null)}
        size="md"
        title={projectDetails?.name || 'Project details'}
        description={projectDetails ? projectDetails.client : undefined}
        footer={(
          <>
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => setProjectDetails(null)}
            >
              Close
            </button>
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-control bg-accent px-3 text-xs font-medium text-white hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => {
                setProjectDetails(null);
                navigate('/admin/projects');
              }}
            >
              Open workspace
            </button>
          </>
        )}
      >
        {projectDetails && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Status</div>
                <div className="mt-1 text-sm font-semibold text-fg">{projectDetails.status}</div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Progress</div>
                <div className="mt-1 text-sm font-semibold text-fg">{projectDetails.progress}%</div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Project lead</div>
                <div className="mt-1 text-sm font-semibold text-fg">{projectDetails.lead}</div>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Budget</div>
                <div className="mt-1 text-sm font-semibold text-fg">{projectDetails.budget}</div>
              </div>
            </div>
            <div className="rounded-control border border-line bg-bg p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">Delivery pacing</span>
                <span className="text-xs font-semibold text-fg">{projectDetails.progress}% complete</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-sm bg-line">
                <div
                  className={['h-full rounded-sm', progressClasses[projectDetails.statusTone === 'danger' ? 'danger' : projectDetails.statusTone === 'warning' ? 'warning' : 'success']].join(' ')}
                  style={{ width: projectDetails.progress + '%' }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GlobalExecutiveDashboard;