import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Plus,
  Pencil,
  ReceiptText,
  RotateCcw,
  Search,
  TimerReset,
  TriangleAlert,
  X
} from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { Button } from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';

type Health = 'healthy' | 'near-cap' | 'overage-risk';
type Cycle = 'monthly' | 'quarterly' | 'annual';
type Tier = 'tier-1' | 'tier-2' | 'tier-3';
type SortKey = 'client' | 'monthlyValue' | 'committedHours' | 'usedHours' | 'renewal' | 'health';

type Retainer = {
  id: string;
  initials: string;
  client: string;
  tier: Tier;
  monthlyValue: number;
  committedHours: number;
  usedHours: number;
  overageRate: number;
  cycle: Cycle;
  renewal: string;
  health: Health;
};

const seed: Retainer[] = [
  { id: 'RET-2024-01', initials: 'NV', client: 'PT Nusantara Vault Bank', tier: 'tier-1', monthlyValue: 250000000, committedHours: 400, usedHours: 312, overageRate: 850000, cycle: 'monthly', renewal: '2026-11-30', health: 'healthy' },
  { id: 'RET-2024-04', initials: 'SB', client: 'SatuBio Diagnostics', tier: 'tier-2', monthlyValue: 175000000, committedHours: 280, usedHours: 246, overageRate: 750000, cycle: 'monthly', renewal: '2026-10-15', health: 'near-cap' },
  { id: 'RET-2023-18', initials: 'KL', client: 'Kinetix Logistics', tier: 'tier-2', monthlyValue: 140000000, committedHours: 220, usedHours: 138, overageRate: 700000, cycle: 'quarterly', renewal: '2026-12-31', health: 'healthy' },
  { id: 'RET-2024-09', initials: 'PP', client: 'PayPintar Gateways', tier: 'tier-1', monthlyValue: 210000000, committedHours: 350, usedHours: 348, overageRate: 900000, cycle: 'monthly', renewal: '2027-01-15', health: 'overage-risk' },
  { id: 'RET-2023-31', initials: 'AM', client: 'AeroMedika Telemetry', tier: 'tier-3', monthlyValue: 90000000, committedHours: 150, usedHours: 96, overageRate: 650000, cycle: 'monthly', renewal: '2027-03-31', health: 'healthy' },
  { id: 'RET-2024-11', initials: 'VC', client: 'Voltran Core Infra', tier: 'tier-2', monthlyValue: 120000000, committedHours: 200, usedHours: 164, overageRate: 750000, cycle: 'annual', renewal: '2027-08-31', health: 'near-cap' }
];

const tierLabel: Record<Tier, string> = { 'tier-1': 'Tier 1 Strategic', 'tier-2': 'Tier 2 Enterprise', 'tier-3': 'Tier 3 Growth' };
const cycleLabel: Record<Cycle, string> = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' };
const healthMeta: Record<Health, { label: string; dot: string; className: string }> = {
  healthy: { label: 'Healthy', dot: 'bg-success', className: 'border-success/20 bg-success/10 text-success' },
  'near-cap': { label: 'Near Cap', dot: 'bg-warning', className: 'border-warning/20 bg-warning/10 text-warning' },
  'overage-risk': { label: 'Overage Risk', dot: 'bg-danger', className: 'border-danger/20 bg-danger/10 text-danger' }
};
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const formatDate = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
const renewalDays = (value: string) => Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
const sortValue = (item: Retainer, key: SortKey): string | number => {
  if (key === 'client') return item.client;
  if (key === 'monthlyValue') return item.monthlyValue;
  if (key === 'committedHours') return item.committedHours;
  if (key === 'usedHours') return item.usedHours / Math.max(1, item.committedHours);
  if (key === 'renewal') return new Date(item.renewal).getTime();
  return item.health;
};

const SortButton: React.FC<{ label: string; sortKey: SortKey; activeKey: SortKey; direction: 'asc' | 'desc'; onSort: (key: SortKey) => void }> =
  ({ label, sortKey, activeKey, direction, onSort }) => (
    <button type="button" onClick={() => onSort(sortKey)} className="inline-flex min-h-9 items-center gap-1.5 font-medium hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={`Sort by ${label}`}>
      <span>{label}</span>
      {activeKey === sortKey ? (direction === 'asc' ? <ArrowUp size={13} /> : <ArrowUp size={13} className="rotate-180" />) : <ArrowUpDown size={13} />}
    </button>
  );

export const AdminClientRetainers: React.FC = () => {
  const { language } = useLanguage();
  const [records, setRecords] = useState(seed);
  const [query, setQuery] = useState('');
  const [cycle, setCycle] = useState<'all' | Cycle>('all');
  const [tier, setTier] = useState<'all' | Tier>('all');
  const [health, setHealth] = useState<'all' | Health>('all');
  const [sortKey, setSortKey] = useState<SortKey>('renewal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hoursTarget, setHoursTarget] = useState<Retainer | null>(null);
  const [hours, setHours] = useState('8');
  const [message, setMessage] = useState<string | null>(null);
  const pageSize = 6;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsLoading(false));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter((item) => {
      const searchable = `${item.client} ${item.id} ${tierLabel[item.tier]} ${cycleLabel[item.cycle]}`.toLowerCase();
      return (!normalized || searchable.includes(normalized)) && (cycle === 'all' || item.cycle === cycle) && (tier === 'all' || item.tier === tier) && (health === 'all' || item.health === health);
    }).sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      const comparison = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [records, query, cycle, tier, health, sortKey, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [query, cycle, tier, health, sortKey, sortDirection]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const mrr = records.reduce((sum, item) => sum + item.monthlyValue, 0);
  const allocated = records.reduce((sum, item) => sum + item.committedHours, 0);
  const used = records.reduce((sum, item) => sum + item.usedHours, 0);
  const burn = allocated ? (used / allocated) * 100 : 0;
  const renewals = records.filter((item) => renewalDays(item.renewal) >= 0 && renewalDays(item.renewal) <= 30);
  const renewalsValue = renewals.reduce((sum, item) => sum + item.monthlyValue, 0);
  const nearCap = records.filter((item) => item.health === 'near-cap').length;
  const avgRate = records.length ? records.reduce((sum, item) => sum + item.overageRate, 0) / records.length : 0;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDirection(key === 'renewal' ? 'asc' : 'desc'); }
  };

  const reset = () => {
    setQuery(''); setCycle('all'); setTier('all'); setHealth('all'); setSortKey('renewal'); setSortDirection('asc'); setPage(1);
  };

  const exportReport = () => {
    const rows = [
      ['Retainer ID', 'Client', 'Tier', 'Monthly Value', 'Committed Hours', 'Used Hours', 'Burn Rate', 'Overage Rate', 'Cycle', 'Renewal', 'Health'],
      ...filtered.map((item) => [item.id, item.client, tierLabel[item.tier], item.monthlyValue, item.committedHours, item.usedHours, Math.round(item.usedHours / Math.max(1, item.committedHours) * 100) + '%', item.overageRate, cycleLabel[item.cycle], item.renewal, healthMeta[item.health].label])
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'kapitech-retainer-report.csv'; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  };

  const logHours = () => {
    if (!hoursTarget) return;
    const amount = Math.max(0, Number(hours) || 0);
    setRecords((current) => current.map((item) => item.id === hoursTarget.id ? { ...item, usedHours: Math.min(item.committedHours, item.usedHours + amount) } : item));
    setMessage(`${amount} hours logged for ${hoursTarget.client}.`);
    setHoursTarget(null);
  };

  return (
    <div className="ams-clients-module min-h-full pb-8">
      <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5"><h1 className="text-2xl font-medium leading-8 tracking-[-0.02em] text-fg">Client Retainer Agreements</h1><span className="inline-flex items-center rounded-badge border border-success/20 bg-success/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-success">{records.length} Active Contracts</span></div>
          <p className="mt-1 max-w-3xl text-[13px] leading-5 text-muted">Overview of recurring retainers, allocated hours, burn rates, overage caps, and renewal terms.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <Button type="button" variant="secondary" onClick={exportReport} icon={<Download size={14} />}>Export Report</Button>
          <Button type="button" variant="primary" onClick={() => setMessage(language === 'id' ? 'Form retainer baru belum tersedia.' : 'New retainer form is not available yet.')} icon={<Plus size={14} />}>New Retainer</Button>
        </div>
      </header>

      {message && <div className="mb-4 flex items-center justify-between rounded-card border border-line bg-panel px-3 py-2.5 text-xs text-fg" role="status" aria-live="polite"><span>{message}</span><button type="button" onClick={() => setMessage(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg" aria-label="Dismiss"><X size={14} /></button></div>}

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Retainer metrics">
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">TOTAL MONTHLY RETAINER MRR</span><ArrowUp size={18} className="text-success" /></div><div className="mt-3 text-2xl font-medium leading-8 tabular-nums text-fg">{money(mrr)}</div><p className="mt-1 text-[11px] text-muted">Current committed recurring value</p></div>
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">ALLOCATED RETAINER HOURS</span><Clock3 size={18} className="text-info" /></div><div className="mt-3 text-2xl font-medium leading-8 tabular-nums text-fg">{allocated.toLocaleString()} hrs/mo</div><p className="mt-1 text-[11px] tabular-nums text-muted">Burned {used.toLocaleString()} hrs · {burn.toFixed(1)}%</p></div>
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">UPCOMING RENEWALS (30D)</span><CalendarDays size={18} className="text-warning" /></div><div className="mt-3 text-2xl font-medium leading-8 tabular-nums text-fg">{renewals.length}</div><p className="mt-1 text-[11px] text-muted">{money(renewalsValue)} monthly value</p></div>
      </section>

      <section className="mb-4 rounded-card border border-line bg-panel p-3" aria-label="Retainer filters">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-[420px]"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><label htmlFor="retainer-search" className="sr-only">Search retainers</label><input id="retainer-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client, retainer ID, tier, or cycle..." className="h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none" /></div>
          <div className="flex flex-wrap items-center gap-2"><CustomSelect value={cycle} onChange={(value) => setCycle(value as 'all' | Cycle)} options={[{ value: 'all', label: 'All cycles' }, { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annual', label: 'Annual' }]} aria-label="Billing cycle" className="min-w-[136px]" triggerClassName="w-full" /><CustomSelect value={tier} onChange={(value) => setTier(value as 'all' | Tier)} options={[{ value: 'all', label: 'All tiers' }, { value: 'tier-1', label: 'Tier 1 Strategic' }, { value: 'tier-2', label: 'Tier 2 Enterprise' }, { value: 'tier-3', label: 'Tier 3 Growth' }]} aria-label="Retainer tier" className="min-w-[146px]" triggerClassName="w-full" /><CustomSelect value={health} onChange={(value) => setHealth(value as 'all' | Health)} options={[{ value: 'all', label: 'All health' }, { value: 'healthy', label: 'Healthy' }, { value: 'near-cap', label: 'Near cap' }, { value: 'overage-risk', label: 'Overage risk' }]} aria-label="Retainer health" className="min-w-[138px]" triggerClassName="w-full" /><button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-[11px] font-medium text-muted hover:bg-panel hover:text-fg"><RotateCcw size={13} /> Reset</button></div>
        </div>
      </section>

      <section className="ams-client-table-shell overflow-hidden rounded-card border border-line bg-panel" aria-label="Retainer agreements table">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <thead className="bg-bg"><tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
              <th className="px-4 py-2.5"><SortButton label="Client & contract" sortKey="client" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
              <th className="px-4 py-2.5 text-right"><SortButton label="Monthly value" sortKey="monthlyValue" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
              <th className="px-4 py-2.5 text-right"><SortButton label="Committed hours" sortKey="committedHours" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
              <th className="px-4 py-2.5"><SortButton label="Hours used" sortKey="usedHours" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
              <th className="px-4 py-2.5 text-right">Overage rate</th><th className="px-4 py-2.5">Cycle / renewal</th>
              <th className="px-4 py-2.5 text-center"><SortButton label="Status" sortKey="health" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th><th className="px-4 py-2.5 text-right">Actions</th>
            </tr></thead>
            <tbody>
              {isLoading ? Array.from({ length: pageSize }).map((_, index) => <tr key={index} className="border-b border-line last:border-0">{Array.from({ length: 8 }).map((__, cell) => <td key={cell} className="px-4 py-4"><div className="h-3 w-full max-w-28 animate-pulse rounded-badge bg-line" /></td>)}</tr>) :
               visible.length ? visible.map((item) => {
                 const usage = Math.round(item.usedHours / Math.max(1, item.committedHours) * 100); const meta = healthMeta[item.health];
                 return <tr key={item.id} className="border-b border-line last:border-0 transition-colors hover:bg-bg/70">
                   <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-[11px] font-semibold text-fg">{item.initials}</div><div className="min-w-0"><div className="truncate text-xs font-semibold text-fg">{item.client}</div><div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted"><span className="tabular-nums">{item.id}</span><span>•</span><span>{tierLabel[item.tier]}</span></div></div></div></td>
                   <td className="px-4 py-3 text-right text-xs font-medium tabular-nums text-fg">{money(item.monthlyValue)}<span className="ml-0.5 text-[10px] text-muted">/mo</span></td>
                   <td className="px-4 py-3 text-right text-xs font-medium tabular-nums text-fg">{item.committedHours} hrs</td>
                   <td className="px-4 py-3"><div className="w-44 max-w-full"><div className="mb-1 flex items-center justify-between text-[10px] tabular-nums"><span className="font-medium text-fg">{item.usedHours} / {item.committedHours} hrs</span><span className={usage >= 95 ? 'font-semibold text-danger' : usage >= 80 ? 'font-semibold text-warning' : 'text-muted'}>{usage}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-line/70"><div className={`h-1.5 rounded-full ${usage >= 95 ? 'bg-danger' : usage >= 80 ? 'bg-warning' : 'bg-success'}`} style={{ width: Math.min(100, usage) + '%' }} /></div></div></td>
                   <td className="px-4 py-3 text-right text-xs font-medium tabular-nums text-fg">{money(item.overageRate)}<span className="ml-0.5 text-[10px] text-muted">/hr</span></td>
                   <td className="px-4 py-3 text-[11px] text-muted"><div>{cycleLabel[item.cycle]}</div><div className={(renewalDays(item.renewal) <= 30 ? 'text-warning ' : 'text-fg ') + 'mt-0.5 font-medium'}>Renews {formatDate(item.renewal)}</div></td>
                   <td className="px-4 py-3 text-center"><span className={`inline-flex min-h-6 items-center gap-1.5 rounded-badge border px-2 py-0.5 text-[10px] font-medium ${meta.className}`}><span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}{usage >= 80 ? ` · ${usage}%` : ''}</span></td>
                   <td className="px-4 py-3 text-right"><div className="ams-table-actions flex items-center justify-end gap-1">
                     <button type="button" onClick={() => setMessage(`Terms editing is not connected for ${item.client} yet.`)} aria-label={`Edit terms for ${item.client}`} title="Edit terms" className="inline-flex h-10 w-10 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Pencil size={15} aria-hidden="true" /></button>
                     <button type="button" onClick={() => { setHoursTarget(item); setHours('8'); }} aria-label={`Log hours for ${item.client}`} title="Log hours" className="inline-flex h-10 w-10 items-center justify-center rounded-control text-accent-text hover:bg-accent/10 hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Clock3 size={16} aria-hidden="true" /></button>
                   </div></td>
                 </tr>;
               }) : <tr><td colSpan={8} className="px-4 py-14 text-center"><Search size={18} className="mx-auto text-muted" /><p className="mt-3 text-sm font-medium text-fg">No matching retainers.</p><p className="mt-1 text-xs text-muted">Adjust the search or clear the active filters.</p><button type="button" onClick={reset} className="mt-4 inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-bg">Reset filters</button></td></tr>}
            </tbody>
          </table>
        </div>
        {!isLoading && <div className="flex flex-col gap-3 border-t border-line bg-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] text-muted">Showing <span className="font-medium tabular-nums text-fg">{filtered.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filtered.length)}</span> of <span className="font-medium tabular-nums text-fg">{filtered.length}</span> retainers</p><div className="flex items-center gap-1.5"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg hover:text-fg disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={14} /></button><span className="min-w-16 text-center text-[11px] font-medium tabular-nums text-fg">{page} / {pageCount}</span><button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-line bg-panel text-fg hover:bg-bg disabled:opacity-40" aria-label="Next page"><ChevronRight size={14} /></button></div></div>}
      </section>

      <section className="mt-3 grid grid-cols-1 gap-3 text-[11px] text-muted md:grid-cols-4" aria-label="Retainer summary">
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-3"><CheckCircle2 size={14} className="text-success" /><span>Agency burn: <strong className="text-fg">{burn.toFixed(1)}%</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-3"><TriangleAlert size={14} className="text-warning" /><span>Near cap: <strong className="text-fg">{nearCap}</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-3"><ReceiptText size={14} className="text-info" /><span>Average overage: <strong className="text-fg">{money(avgRate)}/hr</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-3"><TimerReset size={14} className="text-accent-text" /><span>Data source: <strong className="text-fg">Retainer workspace</strong></span></div>
      </section>

      <Modal open={!!hoursTarget} onClose={() => setHoursTarget(null)} size="sm" title="Log retainer hours" description={hoursTarget ? `${hoursTarget.client} · ${hoursTarget.id}` : undefined} footer={<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setHoursTarget(null)}>Cancel</Button><Button type="button" variant="primary" onClick={logHours}>Log hours</Button></div>}>
        {hoursTarget && <div className="space-y-4"><div><label htmlFor="retainer-hours" className="mb-1.5 block text-xs font-medium text-fg">Hours to log</label><input id="retainer-hours" type="number" min="0" step="0.5" value={hours} onChange={(event) => setHours(event.target.value)} className="h-9 w-full rounded-control border border-line bg-bg px-3 text-sm text-fg focus:border-accent focus:outline-none" /></div><div className="rounded-card border border-line bg-bg p-3 text-xs text-muted">Current usage: <span className="font-medium tabular-nums text-fg">{hoursTarget.usedHours}</span> / {hoursTarget.committedHours} hrs.</div></div>}
      </Modal>
    </div>
  );
};

export default AdminClientRetainers;