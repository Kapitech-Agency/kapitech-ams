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
  Users,
} from 'lucide-react';
import { AdminMetricStrip, AdminModuleHeader, AdminPanel, AdminTablePagination } from './AdminModulePrimitives';
import { CustomSelect } from '../ui/CustomSelect';
import { Modal } from '../ui/Modal';
import { DonutChart, TrendChart } from '../charts/DashboardCharts';
import { ProfileIdentity } from './ProfileIdentity';
import { TasksWorkspace } from './TasksWorkspace';
import { api } from '../../lib/apiClient';

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
  { name: 'Fikri Nurlete', role: 'Chief Creative Officer', workload: 82, tasks: 11, state: 'High load', tone: 'warning' },
  { name: 'Reynaldo Anakotta', role: 'Project Manager', workload: 74, tasks: 9, state: 'Balanced', tone: 'success' },
  { name: 'Akell Ahmed', role: 'HR Manager', workload: 68, tasks: 8, state: 'Balanced', tone: 'success' },
  { name: 'IBrahim', role: 'Financial FP&A', workload: 55, tasks: 6, state: 'Available', tone: 'info' },
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
const formatLiveMoney = (value: number, currency: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'IDR', maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);


type DashboardTask = {
  id: string;
  task: string;
  project: string;
  assignee: string;
  due: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Review' | 'Blocked' | 'Completed';
};

const sampleTasks: DashboardTask[] = [
  { id: 'task-001', task: 'Approve homepage copy', project: 'Atlas Brand System', assignee: 'Fikri', due: 'Today', priority: 'High', status: 'Open' },
  { id: 'task-002', task: 'Finalize checkout UI', project: 'Meridian Commerce', assignee: 'Sarah', due: 'Tomorrow', priority: 'High', status: 'Open' },
  { id: 'task-003', task: 'QA campaign landing page', project: 'Nova Growth Retainer', assignee: 'Dimas', due: 'Wed', priority: 'Medium', status: 'Review' },
  { id: 'task-004', task: 'Resolve API handoff', project: 'Orbit Product Launch', assignee: 'Raka', due: 'Overdue', priority: 'Urgent', status: 'Blocked' },
  { id: 'task-005', task: 'Prepare client presentation', project: 'Northstar Campaign', assignee: 'Nadia', due: 'Thu', priority: 'Medium', status: 'In Progress' },
  { id: 'task-006', task: 'Review analytics dashboard', project: 'Atlas Brand System', assignee: 'Fikri', due: 'Fri', priority: 'Low', status: 'Completed' },
];

const PerformanceView: React.FC = () => {
  const completionSeries = [58, 63, 69, 76, 81, 84];
  const blockedSeries = [12, 11, 9, 7, 5, 4];
  const cycleTimeSeries = [4.8, 4.6, 4.4, 4.2, 4.0, 3.8];
  const totalTasks = 84;
  const completedTasks = 64;
  const completion = completionSeries[completionSeries.length - 1];
  const avgCycleTime = cycleTimeSeries[cycleTimeSeries.length - 1].toFixed(1) + ' days';
  const blockedTasks = blockedSeries[blockedSeries.length - 1];

  return (
    <div className="space-y-5">
      <AdminMetricStrip
        className="lg:grid-cols-4"
        metrics={[
          { id: 'delivery-score', label: 'Delivery score', value: '92%', change: '+4.8%', changeToneClassName: 'text-success', context: 'vs previous period', sparkline: completionSeries, toneClassName: 'text-success' },
          { id: 'task-completion', label: 'Task completion', value: completion + '%', context: completedTasks + ' of ' + totalTasks + ' tracked tasks', sparkline: completionSeries, toneClassName: 'text-info' },
          { id: 'cycle-time', label: 'Avg. cycle time', value: avgCycleTime, change: '-0.6 days', changeToneClassName: 'text-success', context: 'vs previous period', sparkline: cycleTimeSeries, toneClassName: 'text-fg' },
          { id: 'blocked-work', label: 'Blocked work', value: String(blockedTasks), context: '3 projects affected', sparkline: blockedSeries, toneClassName: 'text-warning' }
        ]}
      />

      <div className="grid gap-4 min-[1100px]:grid-cols-12">
        <AdminPanel
          className="min-[1100px]:col-span-8"
          title="Delivery performance"
          description="How projects are progressing against planned delivery windows."
          bodyClassName="p-4 sm:p-5"
        >
          <div className="grid gap-3 sm:grid-cols-3">
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
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className={item.tone === 'success' ? 'h-full rounded-full bg-success' : item.tone === 'warning' ? 'h-full rounded-full bg-warning' : 'h-full rounded-full bg-danger'}
                    style={{ width: item.value + '%' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-line pt-5">
            <TrendChart
              data={completionSeries.map((value, index) => ({
                label: 'W' + (index + 1),
                primary: value,
                secondary: [18, 16, 14, 12, 10, 9][index],
                tertiary: blockedSeries[index],
              }))}
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
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div className={['h-full rounded-full', progressClasses[member.tone]].join(' ')} style={{ width: member.workload + '%' }} />
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

      <div className="grid gap-4 min-[1100px]:grid-cols-12">
        <AdminPanel
          className="min-[1100px]:col-span-7"
          title="Workstream health"
          description="Sample operational indicators for the current delivery cycle."
          bodyClassName="p-4 sm:p-5"
        >
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
              <div className="h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-success" style={{ width: String(value) + '%' }} />
              </div>
            </div>
          ))}
        </AdminPanel>

        <AdminPanel
          className="min-[1100px]:col-span-5"
          title="Execution summary"
          description="Core performance counters from the current sample period."
          bodyClassName="p-4 sm:p-5"
        >
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
  const [analyticsTeamPage, setAnalyticsTeamPage] = useState(1);
  const [analyticsTeamPageSize, setAnalyticsTeamPageSize] = useState(6);
  const analyticsTeamPageCount = Math.max(1, Math.ceil(sampleTeam.length / analyticsTeamPageSize));
  const pagedAnalyticsTeam = sampleTeam.slice(
    (analyticsTeamPage - 1) * analyticsTeamPageSize,
    analyticsTeamPage * analyticsTeamPageSize,
  );
  useEffect(() => {
    setAnalyticsTeamPage((current) => Math.min(current, analyticsTeamPageCount));
  }, [analyticsTeamPageCount]);

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
                {pagedAnalyticsTeam.map((member) => (
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
          <AdminTablePagination
            total={sampleTeam.length}
            page={analyticsTeamPage}
            pageSize={analyticsTeamPageSize}
            onPageChange={setAnalyticsTeamPage}
            onPageSizeChange={setAnalyticsTeamPageSize}
            itemLabel="members"
            slug="dashboard-team-analytics-pagination"
          />
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
  const [dashboardProjectPage, setDashboardProjectPage] = useState(1);
  const [dashboardProjectPageSize, setDashboardProjectPageSize] = useState(6);
  const [dashboardOverview, setDashboardOverview] = useState<{ metrics?: any; financials?: any; projects?: any[]; source: 'server' | 'ab' }>({ source: 'ab' });

  useEffect(() => {
    let active = true;
    api.dashboard.getOverview()
      .then((response) => {
        if (!active || !response.success) return;
        const projects = Array.isArray(response.data?.projects) ? response.data.projects : [];
        setDashboardOverview({
          metrics: response.data?.metrics,
          financials: response.data?.financials,
          projects,
          source: projects.length > 0 || Boolean(response.data?.metrics) ? 'server' : 'ab'
        });
      })
      .catch(() => {
        if (active) setDashboardOverview({ source: 'ab' });
      });
    return () => { active = false; };
  }, []);

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


  const dashboardProjects = useMemo<DashboardProject[]>(() => {
    const serverProjects = Array.isArray(dashboardOverview.projects)
      ? dashboardOverview.projects.map((project: any, index: number) => {
          const rawType = String(project.type || project.projectType || project.billingType || 'Fixed-fee').toLowerCase();
          const type: Exclude<ProjectFilter, 'All'> = rawType.includes('retainer')
            ? 'Retainer'
            : rawType.includes('enterprise')
              ? 'Enterprise'
              : 'Fixed-fee';
          const health = String(project.health || project.status || '').toLowerCase();
          const statusTone: DashboardProject['statusTone'] =
            health.includes('delay') || health.includes('blocked') ? 'danger'
              : health.includes('risk') ? 'warning'
                : health.includes('review') ? 'info'
                  : 'success';
          return {
            id: String(project.id || project.slug || 'server-project-' + index),
            name: String(project.name || project.title || project.projectName || 'Untitled project'),
            client: String(project.clientName || project.client || 'Unassigned client'),
            type,
            status: String(project.status || project.health || 'Active'),
            statusTone,
            progress: Math.max(0, Math.min(100, Number(project.progress ?? project.progressPercent ?? 0) || 0)),
            lead: String(project.teamLead || project.ownerName || project.lead || 'Unassigned'),
            budget: formatLiveMoney(
              Number(project.budget ?? project.totalBudget ?? 0) || 0,
              String(dashboardOverview.financials?.currency || dashboardOverview.metrics?.currency || 'IDR').toUpperCase()
            )
          };
        })
      : [];
    return serverProjects.length ? serverProjects : sampleProjects;
  }, [dashboardOverview.projects]);

  const filteredProjects = useMemo(
    () => projectFilter === 'All' ? dashboardProjects : dashboardProjects.filter((project) => project.type === projectFilter),
    [dashboardProjects, projectFilter],
  );

  const dashboardProjectPageCount = Math.max(1, Math.ceil(filteredProjects.length / dashboardProjectPageSize));
  const pagedDashboardProjects = filteredProjects.slice(
    (dashboardProjectPage - 1) * dashboardProjectPageSize,
    dashboardProjectPage * dashboardProjectPageSize,
  );

  useEffect(() => {
    setDashboardProjectPage((current) => Math.min(current, dashboardProjectPageCount));
  }, [dashboardProjectPageCount]);

  const totalDelivery = deliveryBreakdown.reduce((total, item) => total + Math.max(0, item.value), 0);
  const onScheduleValue = deliveryBreakdown.find((item) => item.label === 'On schedule')?.value ?? 0;
  const onSchedulePercent = totalDelivery > 0 ? Math.round((Math.max(0, onScheduleValue) / totalDelivery) * 100) : 0;
  const revenueData = sampleRevenueByRange[range];

  if (view === 'tasks') {
    return <TasksWorkspace />;
  }

  return (
    <div className="ams-dashboard min-h-full pb-10">
      <AdminModuleHeader slug="dashboard-header"
        title="Agency overview"
        description="Real-time metrics, project pacing, and financial health for the agency."
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
            { key: 'tasks', label: 'Tasks', search: '' },
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
      <section data-ams-feature-slug="dashboard-overview" data-ams-slug="dashboard-overview" className="mb-5 grid gap-3 min-[1100px]:grid-cols-12" aria-label="Executive overview controls">
        <div className="min-[1100px]:col-span-9">
          <AdminMetricStrip
            className="grid-cols-1 sm:grid-cols-2 min-[760px]:grid-cols-3 min-[1100px]:grid-cols-4"
            metrics={[
              { id: 'active-projects', label: 'Active projects', value: String(Number(dashboardOverview.metrics?.activeProjects ?? 12)), context: dashboardOverview.source === 'server' ? 'live data' : 'A/B dataset', sparkline: [8, 9, 10, Number(dashboardOverview.metrics?.activeProjects ?? 12)], icon: <FolderKanban size={15} />, toneClassName: 'text-success', slug: 'dashboard-active-projects' },
              { id: 'tasks-due', label: 'Overdue tasks', value: String(Number(dashboardOverview.metrics?.overdueTasks ?? 3)), context: dashboardOverview.source === 'server' ? 'current operations' : 'A/B dataset', sparkline: [6, 5, 4, Number(dashboardOverview.metrics?.overdueTasks ?? 3)], icon: <CalendarDays size={15} />, toneClassName: 'text-info', slug: 'dashboard-tasks-overdue' },
              { id: 'overdue', label: 'Projects at risk', value: String(Number(dashboardOverview.metrics?.projectsAtRisk ?? 3)), change: 'Requires attention', changeToneClassName: 'text-danger', sparkline: [6, 5, 4, Number(dashboardOverview.metrics?.projectsAtRisk ?? 3)], icon: <AlertTriangle size={15} />, toneClassName: 'text-danger', slug: 'dashboard-projects-risk' },
              { id: 'revenue', label: 'Monthly revenue', value: formatLiveMoney(Number(dashboardOverview.financials?.revenueThisMonth ?? 84500), String(dashboardOverview.financials?.currency || dashboardOverview.metrics?.currency || 'IDR').toUpperCase()), context: dashboardOverview.source === 'server' ? 'current month' : 'A/B dataset', sparkline: sampleRevenueByRange[range].map((point) => point.primary), icon: <CircleDollarSign size={15} />, toneClassName: 'text-success', slug: 'dashboard-revenue' },
              { id: 'outstanding', label: 'Outstanding invoices', value: formatLiveMoney(Number(dashboardOverview.financials?.outstandingReceivables ?? 32400), String(dashboardOverview.financials?.currency || dashboardOverview.metrics?.currency || 'IDR').toUpperCase()), context: dashboardOverview.source === 'server' ? 'receivables' : 'A/B dataset', sparkline: [22, 25, 28, 32.4], icon: <ReceiptText size={15} />, toneClassName: 'text-warning', slug: 'dashboard-outstanding' },
              { id: 'utilization', label: 'Team utilization', value: '78%', context: dashboardOverview.source === 'server' ? 'tracked operations' : 'A/B dataset', sparkline: [66, 70, 73, 78], icon: <Users size={15} />, toneClassName: 'text-warning', slug: 'dashboard-utilization' },
              { id: 'active-clients', label: 'Open leads', value: String(Number(dashboardOverview.metrics?.openLeads ?? 28)), context: dashboardOverview.source === 'server' ? 'current pipeline' : 'A/B dataset', sparkline: [22, 24, 25, Number(dashboardOverview.metrics?.openLeads ?? 28)], icon: <Users size={15} />, toneClassName: 'text-info', slug: 'dashboard-open-leads' },
              { id: 'avg-project-value', label: 'Avg. project value', value: dashboardOverview.source === 'server' ? formatLiveMoney(Number(dashboardOverview.metrics?.totalBilled || 0) / Math.max(1, Number(dashboardOverview.metrics?.activeProjects || 1)), String(dashboardOverview.financials?.currency || dashboardOverview.metrics?.currency || 'IDR').toUpperCase()) : '$29.8k', context: dashboardOverview.source === 'server' ? 'current project base' : 'A/B dataset', sparkline: [24, 25.5, 28, 29.8], icon: <FolderKanban size={15} />, toneClassName: 'text-fg', slug: 'dashboard-avg-project-value' }
            ]}
          />
        </div>
        <AdminPanel title="Quick actions" description="Jump directly into the most common agency workflows." bodyClassName="p-3" className="min-[1100px]:col-span-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'New project', icon: <Plus size={14} />, href: '/admin/projects' },
              { label: 'Review tasks', icon: <CheckCircle2 size={14} />, href: '/admin/dashboard?view=tasks' },
              { label: 'Log time', icon: <Clock3 size={14} />, href: '/admin/time-logs' },
              { label: 'View invoices', icon: <ReceiptText size={14} />, href: '/admin/invoicing' },
              { label: 'View clients', icon: <Users size={14} />, href: '/admin/clients' },
              { label: 'Open CRM', icon: <FolderKanban size={14} />, href: '/admin/crm' }
            ].map((action) => (
              <Link key={action.label} to={action.href} className="flex min-h-10 items-center gap-2 rounded-control border border-line bg-bg px-3 text-[11px] font-medium text-fg transition-colors hover:border-accent/30 hover:bg-panel-hover hover:text-accent-text">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-muted">{action.icon}</span>
                <span className="truncate">{action.label}</span>
                <ArrowUpRight size={12} className="ml-auto shrink-0 text-muted" />
              </Link>
            ))}
          </div>
        </AdminPanel>
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
            <div className="rounded-control border border-line bg-bg/45 p-4">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">On schedule</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-[-0.03em] tabular-nums text-fg">{onSchedulePercent}%</span>
                    <span className="text-[11px] text-muted">{onScheduleValue} of {totalDelivery} projects</span>
                  </div>
                </div>
                <span className="shrink-0 rounded-badge border border-success/20 bg-success/10 px-2 py-1 text-[10px] font-medium text-success">On track</span>
              </div>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-line" aria-label="Delivery pacing breakdown">
                {deliveryBreakdown.map((item) => {
                  const percent = totalDelivery > 0 ? (Math.max(0, item.value) / totalDelivery) * 100 : 0;
                  return (
                    <div
                      key={item.label}
                      className={['h-full first:rounded-l-full last:rounded-r-full', progressClasses[item.tone]].join(' ')}
                      style={{ width: percent + '%' }}
                      title={item.label + ': ' + Math.round(percent) + '%'}
                    />
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {deliveryBreakdown.map((item) => {
                const safeValue = Math.max(0, item.value);
                const percent = totalDelivery > 0 ? Math.round((safeValue / totalDelivery) * 100) : 0;
                return (
                  <div key={item.label} className="min-w-0 rounded-control border border-line bg-bg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <i className={['h-2 w-2 shrink-0 rounded-full', progressClasses[item.tone]].join(' ')} />
                        <span className="whitespace-nowrap text-[10px] font-medium text-muted">{item.label}</span>
                      </div>
                      <span className={['shrink-0 rounded-badge border px-1.5 py-0.5 text-[9px] font-medium', toneClasses[item.tone]].join(' ')}>
                        {item.tone === 'success' ? 'Healthy' : item.tone === 'warning' ? 'Monitor' : 'Action'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <div>
                        <div className="text-lg font-semibold tabular-nums text-fg">{safeValue}</div>
                        <div className="mt-0.5 text-[10px] text-muted">{safeValue === 1 ? 'project' : 'projects'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold tabular-nums text-fg">{percent}%</div>
                        <div className="mt-0.5 text-[10px] text-muted">of portfolio</div>
                      </div>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
                      <div className={['h-full rounded-full', progressClasses[item.tone]].join(' ')} style={{ width: percent + '%' }} />
                    </div>
                  </div>
                );
              })}
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
                <button key={filter} type="button" aria-pressed={projectFilter === filter} onClick={() => { setProjectFilter(filter); setDashboardProjectPage(1); }} className={['shrink-0 rounded-chip border px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', projectFilter === filter ? 'border-line bg-panel-hover font-medium text-fg' : 'border-transparent bg-transparent text-muted hover:border-line hover:bg-bg hover:text-fg'].join(' ')}>{filter}</button>
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
                {pagedDashboardProjects.map((project) => (
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
          <AdminTablePagination
            total={filteredProjects.length}
            page={dashboardProjectPage}
            pageSize={dashboardProjectPageSize}
            onPageChange={setDashboardProjectPage}
            onPageSizeChange={setDashboardProjectPageSize}
            itemLabel="projects"
            slug="dashboard-projects-pagination"
          />
        </AdminPanel>

        <AdminPanel className="min-[1100px]:col-span-4" bodyClassName="p-4 sm:p-5" title="Team capacity" description="Current task load based on the sample agency plan." actions={<span className="rounded-badge border border-line bg-bg px-2 py-1 text-[11px] text-muted">4 members</span>}>
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
        <article className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2 text-xs font-medium text-fg"><CheckCircle2 size={15} className="text-success" /> Delivery health</div><span className="rounded-badge border border-success/25 bg-success/10 px-2 py-1 text-[10px] font-medium text-success">67% on track</span></div>
          <div className="mt-4 flex items-end justify-between gap-4"><div><div className="text-xl font-semibold tabular-nums text-fg">8 / 12</div><div className="mt-1 text-[10px] text-muted">projects on schedule</div></div><div className="text-right"><div className="text-xs font-semibold text-fg">3 at risk</div><div className="mt-1 text-[10px] text-danger">1 overdue</div></div></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-success" style={{ width: '67%' }} /></div>
        </article>
        <article className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2 text-xs font-medium text-fg"><Clock3 size={15} className="text-warning" /> Priority work</div><span className="rounded-badge border border-warning/25 bg-warning/10 px-2 py-1 text-[10px] font-medium text-warning">6 high</span></div>
          <div className="mt-4 flex items-end justify-between gap-4"><div><div className="text-xl font-semibold tabular-nums text-fg">18</div><div className="mt-1 text-[10px] text-muted">tasks due this week</div></div><div className="text-right"><div className="text-xs font-semibold text-fg">3 overdue</div><div className="mt-1 text-[10px] text-danger">1 blocked</div></div></div>
          <div className="mt-3 flex gap-1"><span className="h-1.5 flex-[3] rounded-full bg-danger" /><span className="h-1.5 flex-[3] rounded-full bg-warning" /><span className="h-1.5 flex-[6] rounded-full bg-info" /><span className="h-1.5 flex-[6] rounded-full bg-line" /></div>
        </article>
        <article className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2 text-xs font-medium text-fg"><ReceiptText size={15} className="text-warning" /> Invoice follow-up</div><span className="rounded-badge border border-warning/25 bg-warning/10 px-2 py-1 text-[10px] font-medium text-warning">Action needed</span></div>
          <div className="mt-4 flex items-end justify-between gap-4"><div><div className="text-xl font-semibold tabular-nums text-fg">$8.7k</div><div className="mt-1 text-[10px] text-muted">past-due balance</div></div><div className="text-right"><div className="text-xs font-semibold text-fg">$32.4k</div><div className="mt-1 text-[10px] text-muted">total outstanding</div></div></div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-muted"><span>27% of outstanding is overdue</span><span className="font-medium text-warning">Follow up</span></div>
        </article>
      </section>

        </>
      ) : view === 'performance' ? (
        <PerformanceView />
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