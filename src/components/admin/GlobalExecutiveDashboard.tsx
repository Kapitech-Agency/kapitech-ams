import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

const sampleRevenue = [
  { label: 'Jan', primary: 61000, secondary: 42000, tertiary: 19000 },
  { label: 'Feb', primary: 68500, secondary: 44700, tertiary: 23800 },
  { label: 'Mar', primary: 74200, secondary: 46300, tertiary: 27900 },
  { label: 'Apr', primary: 71800, secondary: 49200, tertiary: 22600 },
  { label: 'May', primary: 80200, secondary: 51400, tertiary: 28800 },
  { label: 'Jun', primary: 84500, secondary: 52200, tertiary: 32300 },
];

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

export const GlobalExecutiveDashboard: React.FC = () => {
  const [range, setRange] = useState<RangeKey>('Q2');
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('All');

  const filteredProjects = useMemo(
    () => projectFilter === 'All' ? sampleProjects : sampleProjects.filter((project) => project.type === projectFilter),
    [projectFilter],
  );

  const totalDelivery = deliveryBreakdown.reduce((total, item) => total + item.value, 0);
  const onSchedulePercent = Math.round((deliveryBreakdown[0].value / totalDelivery) * 100);

  return (
    <div className="min-h-full pb-10">
      <AdminModuleHeader
        title="Agency overview"
        description="Real-time metrics, project pacing, and financial health for the agency."
        icon={<Sparkles size={18} />}
        actions={(
          <>
            <div className="flex items-center gap-0.5 rounded-control bg-bg p-0.5">
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
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-control bg-accent px-3 text-xs font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Plus size={14} />
              New project
            </Link>
          </>
        )}
      />

      <section className="mb-6" aria-label="Executive key performance indicators">
        <div className="grid gap-3 sm:grid-cols-2 min-[760px]:grid-cols-3 min-[1180px]:grid-cols-6">
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
                <div className="text-2xl font-medium tracking-[-0.02em] tabular-nums text-fg">{metric.value}</div>
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
          <TrendChart data={sampleRevenue} primaryLabel="Revenue" secondaryLabel="Expenses" tertiaryLabel="Net" primaryFormat={formatMoney} ariaLabel={'Revenue, expenses, and net trend for ' + range + '.'} />
        </AdminPanel>

        <AdminPanel className="min-[1100px]:col-span-4" bodyClassName="p-4 sm:p-5" title="Delivery & pacing" description="Project delivery distribution across the current portfolio.">
          <div className="grid items-center gap-4 sm:grid-cols-[150px_1fr] min-[1100px]:grid-cols-1">
            <div className="mx-auto w-full max-w-[160px]">
              <DonutChart data={deliveryBreakdown} ariaLabel="Project delivery distribution: 8 on schedule, 3 at risk, 1 overdue." />
            </div>
            <div>
              <div className="flex items-end justify-between gap-3">
                <div><div className="text-xs text-muted">On schedule</div><div className="mt-1 text-2xl font-medium tabular-nums text-fg">{onSchedulePercent}%</div></div>
                <span className="text-[11px] text-muted">12 active projects</span>
              </div>
              <div className="mt-4 space-y-3 border-t border-line pt-4">
                {deliveryBreakdown.map((item) => {
                  const percent = Math.round((item.value / totalDelivery) * 100);
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex min-w-0 items-center gap-2 text-fg"><i className={['h-2 w-2 rounded-full', progressClasses[item.tone]].join(' ')} />{item.label}</span>
                        <span className="tabular-nums text-muted">{item.value} ({percent}%)</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-sm bg-line"><div className={['h-full rounded-sm', progressClasses[item.tone]].join(' ')} style={{ width: percent + '%' }} /></div>
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
          <div className="overflow-x-auto custom-scrollbar">
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
                    <td className="px-2 py-3 text-right"><button type="button" aria-label={'More actions for ' + project.name} className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><MoreHorizontal size={15} /></button></td>
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
    </div>
  );
};

export default GlobalExecutiveDashboard;