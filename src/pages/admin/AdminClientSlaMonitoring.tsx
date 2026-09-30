import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Search,
  TimerReset,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';

type Compliance = 'healthy' | 'warning' | 'degraded';
type Tier = 'tier-1' | 'tier-2' | 'tier-3';
type SortKey = 'client' | 'targetSla' | 'currentUptime' | 'mttrMinutes' | 'lastIncidentAt' | 'compliance';
type SlaAccount = {
  id: string;
  client: string;
  pod: string;
  tier: Tier;
  targetSla: number;
  currentUptime: number;
  mttrMinutes: number;
  responseStatus: string;
  lastIncidentAt: string;
  incidentTitle: string;
  compliance: Compliance;
};

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const seed: SlaAccount[] = [
  { id: 'SLA-001', client: 'PT Astra Digital Ventura', pod: 'Pod Alpha', tier: 'tier-1', targetSla: 99.9, currentUptime: 99.98, mttrMinutes: 21, responseStatus: 'Within SLA', lastIncidentAt: daysAgo(2), incidentTitle: 'API gateway latency spike', compliance: 'healthy' },
  { id: 'SLA-002', client: 'Telkomsel Innovation Labs', pod: 'Pod Beta', tier: 'tier-1', targetSla: 99.9, currentUptime: 99.96, mttrMinutes: 28, responseStatus: 'Within SLA', lastIncidentAt: daysAgo(4), incidentTitle: 'Queue worker restart', compliance: 'healthy' },
  { id: 'SLA-003', client: 'GoTo Financial Technology', pod: 'Pod Gamma', tier: 'tier-1', targetSla: 99.95, currentUptime: 99.91, mttrMinutes: 34, responseStatus: 'Watch', lastIncidentAt: daysAgo(1), incidentTitle: 'Settlement service saturation', compliance: 'warning' },
  { id: 'SLA-004', client: 'ShopeePay International', pod: 'Pod Delta', tier: 'tier-2', targetSla: 99.9, currentUptime: 99.97, mttrMinutes: 19, responseStatus: 'Within SLA', lastIncidentAt: daysAgo(7), incidentTitle: 'Webhook retry burst', compliance: 'healthy' },
  { id: 'SLA-005', client: 'Nusa Cloud Systems', pod: 'Pod Beta', tier: 'tier-2', targetSla: 99.8, currentUptime: 99.78, mttrMinutes: 51, responseStatus: 'Action required', lastIncidentAt: daysAgo(1), incidentTitle: 'Kubernetes node pressure', compliance: 'degraded' },
  { id: 'SLA-006', client: 'Cipta Retail Omnichannel', pod: 'Pod Gamma', tier: 'tier-3', targetSla: 99.5, currentUptime: 99.72, mttrMinutes: 43, responseStatus: 'Within SLA', lastIncidentAt: daysAgo(9), incidentTitle: 'Inventory sync delay', compliance: 'healthy' },
  { id: 'SLA-007', client: 'EnergiPro Systems', pod: 'Pod Alpha', tier: 'tier-2', targetSla: 99.9, currentUptime: 99.89, mttrMinutes: 37, responseStatus: 'Watch', lastIncidentAt: daysAgo(3), incidentTitle: 'Telemetry ingest backlog', compliance: 'warning' },
  { id: 'SLA-008', client: 'Finova NeoBank', pod: 'Pod Delta', tier: 'tier-1', targetSla: 99.99, currentUptime: 99.995, mttrMinutes: 12, responseStatus: 'Within SLA', lastIncidentAt: daysAgo(12), incidentTitle: 'Fraud rules deployment', compliance: 'healthy' }
];

const tierLabel: Record<Tier, string> = { 'tier-1': 'Tier 1 Strategic', 'tier-2': 'Tier 2 Enterprise', 'tier-3': 'Tier 3 Growth' };
const complianceMeta: Record<Compliance, { label: string; dot: string; className: string }> = {
  healthy: { label: 'Compliant', dot: 'bg-success', className: 'border-success/20 bg-success/10 text-success' },
  warning: { label: 'Warning', dot: 'bg-warning', className: 'border-warning/20 bg-warning/10 text-warning' },
  degraded: { label: 'Degraded', dot: 'bg-danger', className: 'border-danger/20 bg-danger/10 text-danger' }
};
const formatPercent = (value: number) => value.toFixed(2) + '%';
const formatDate = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
const sortValue = (item: SlaAccount, key: SortKey): string | number => {
  if (key === 'client') return item.client;
  if (key === 'targetSla') return item.targetSla;
  if (key === 'currentUptime') return item.currentUptime;
  if (key === 'mttrMinutes') return item.mttrMinutes;
  if (key === 'lastIncidentAt') return new Date(item.lastIncidentAt).getTime();
  return item.compliance;
};
const SortButton: React.FC<{ label: string; sortKey: SortKey; activeKey: SortKey; direction: 'asc' | 'desc'; onSort: (key: SortKey) => void }> =
  ({ label, sortKey, activeKey, direction, onSort }) => (
    <button type="button" onClick={() => onSort(sortKey)} className="inline-flex min-h-9 items-center gap-1.5 font-medium hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={`Sort by ${label}`}>
      <span>{label}</span>
      {activeKey === sortKey ? (direction === 'asc' ? <ArrowUp size={13} /> : <ArrowUp size={13} className="rotate-180" />) : <ArrowUpDown size={13} />}
    </button>
  );

export const AdminClientSlaMonitoring: React.FC = () => {
  const [records] = useState(seed);
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState<'all' | Tier>('all');
  const [status, setStatus] = useState<'all' | Compliance>('all');
  const [pod, setPod] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('currentUptime');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<SlaAccount | null>(null);
  const [selectedTelemetry, setSelectedTelemetry] = useState<SlaAccount | null>(null);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsLoading(false));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const podOptions = useMemo(() => Array.from(new Set(records.map((item) => item.pod))).sort(), [records]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter((item) => {
      const searchable = `${item.client} ${item.pod} ${tierLabel[item.tier]} ${item.incidentTitle} ${item.id}`.toLowerCase();
      return (!normalized || searchable.includes(normalized)) && (tier === 'all' || item.tier === tier) && (status === 'all' || item.compliance === status) && (pod === 'all' || item.pod === pod);
    }).sort((a, b) => {
      const av = sortValue(a, sortKey); const bv = sortValue(b, sortKey);
      const comparison = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [records, query, tier, status, pod, sortKey, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [query, tier, status, pod, sortKey, sortDirection]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const complianceCount = records.filter((item) => item.compliance === 'healthy').length;
  const warnings = records.filter((item) => item.compliance === 'warning').length;
  const degraded = records.filter((item) => item.compliance === 'degraded').length;
  const avgUptime = records.reduce((sum, item) => sum + item.currentUptime, 0) / Math.max(1, records.length);
  const avgMttr = records.reduce((sum, item) => sum + item.mttrMinutes, 0) / Math.max(1, records.length);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDirection(key === 'lastIncidentAt' ? 'desc' : 'desc'); }
  };
  const reset = () => { setQuery(''); setTier('all'); setStatus('all'); setPod('all'); setSortKey('currentUptime'); setSortDirection('desc'); setPage(1); };

  const exportSnapshot = () => {
    const rows = [
      ['Account', 'Pod', 'Tier', 'Target SLA', 'Current Uptime', 'MTTR Minutes', 'Last Incident', 'Status'],
      ...filtered.map((item) => [item.client, item.pod, tierLabel[item.tier], formatPercent(item.targetSla), formatPercent(item.currentUptime), item.mttrMinutes, item.lastIncidentAt, complianceMeta[item.compliance].label])
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'kapitech-sla-monitoring.csv'; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  };

  return (
    <div className="ams-clients-module min-h-full pb-8">
      <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5"><h1 className="text-2xl font-medium leading-8 tracking-[-0.02em] text-fg">SLA Monitoring</h1><span className="inline-flex items-center gap-1.5 rounded-badge border border-success/20 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success"><CheckCircle2 size={12} /> {complianceCount}/{records.length} compliant</span></div>
          <p className="mt-1 max-w-3xl text-[13px] leading-5 text-muted">Operational SLA health across active client contracts, response performance, and recent incidents.</p>
        </div>
        <Button type="button" variant="secondary" onClick={exportSnapshot} icon={<Download size={14} />}>Export Snapshot</Button>
      </header>

      {message && <div className="mb-4 flex items-center justify-between rounded-card border border-line bg-panel px-3 py-2.5 text-xs text-fg" role="status" aria-live="polite"><span>{message}</span><button type="button" onClick={() => setMessage(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg" aria-label="Dismiss"><X size={14} /></button></div>}

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4" aria-label="SLA metrics">
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">AVERAGE UPTIME</span><Activity size={18} /></div><div className="mt-3 text-2xl font-medium tabular-nums text-fg">{formatPercent(avgUptime)}</div><p className="mt-1 text-[11px] text-muted">Across the monitored account set</p></div>
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">AVERAGE MTTR</span><TimerReset size={18} /></div><div className="mt-3 text-2xl font-medium tabular-nums text-fg">{Math.round(avgMttr)} min</div><p className="mt-1 text-[11px] text-muted">Time to service recovery</p></div>
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">WARNING ACCOUNTS</span><AlertTriangle size={18} className="text-warning" /></div><div className="mt-3 text-2xl font-medium tabular-nums text-fg">{warnings}</div><p className="mt-1 text-[11px] text-muted">Requires active review</p></div>
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">DEGRADED ACCOUNTS</span><AlertTriangle size={18} className="text-danger" /></div><div className="mt-3 text-2xl font-medium tabular-nums text-fg">{degraded}</div><p className="mt-1 text-[11px] text-muted">Needs corrective action</p></div>
      </section>

      <section className="mb-4 rounded-card border border-line bg-panel p-4" aria-label="SLA filters">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-[420px]"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><label htmlFor="sla-search" className="sr-only">Search SLA accounts</label><input id="sla-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search account, pod, incident, or SLA ID..." className="h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none" /></div>
          <div className="flex flex-wrap items-center gap-2"><CustomSelect value={tier} onChange={(value) => setTier(value as 'all' | Tier)} options={[{ value: 'all', label: 'All tiers' }, { value: 'tier-1', label: 'Tier 1 Strategic' }, { value: 'tier-2', label: 'Tier 2 Enterprise' }, { value: 'tier-3', label: 'Tier 3 Growth' }]} aria-label="SLA tier" className="min-w-[142px]" triggerClassName="w-full" /><CustomSelect value={status} onChange={(value) => setStatus(value as 'all' | Compliance)} options={[{ value: 'all', label: 'All statuses' }, { value: 'healthy', label: 'Compliant' }, { value: 'warning', label: 'Warning' }, { value: 'degraded', label: 'Degraded' }]} aria-label="SLA status" className="min-w-[132px]" triggerClassName="w-full" /><CustomSelect value={pod} onChange={setPod} options={[{ value: 'all', label: 'All pods' }, ...podOptions.map((value) => ({ value, label: value }))]} aria-label="Service pod" className="min-w-[126px]" triggerClassName="w-full" /><button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-[11px] font-medium text-muted hover:bg-panel hover:text-fg"><X size={13} /> Reset</button></div>
        </div>
      </section>

      <section className="ams-client-table-shell overflow-hidden rounded-card border border-line bg-panel" aria-label="SLA monitoring table">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1160px] border-collapse text-left">
            <thead className="bg-bg"><tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
              <th className="px-4 py-2.5"><SortButton label="Client" sortKey="client" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
              <th className="px-4 py-2.5 text-right"><SortButton label="Target SLA" sortKey="targetSla" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
              <th className="px-4 py-2.5 text-right"><SortButton label="Current uptime" sortKey="currentUptime" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
              <th className="px-4 py-2.5"><SortButton label="MTTR" sortKey="mttrMinutes" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
              <th className="px-4 py-2.5"><SortButton label="Last incident" sortKey="lastIncidentAt" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
              <th className="px-4 py-2.5 text-center"><SortButton label="Status" sortKey="compliance" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th><th className="px-4 py-2.5 text-right">Actions</th>
            </tr></thead>
            <tbody>
              {isLoading ? Array.from({ length: pageSize }).map((_, index) => <tr key={index} className="border-b border-line last:border-0">{Array.from({ length: 7 }).map((__, cell) => <td key={cell} className="px-4 py-4"><div className="h-3 w-full max-w-28 animate-pulse rounded-badge bg-line" /></td>)}</tr>) :
               visible.length ? visible.map((item) => {
                 const meta = complianceMeta[item.compliance];
                 return <tr key={item.id} className="border-b border-line last:border-0 transition-colors hover:bg-bg/70">
                   <td className="px-4 py-3"><div className="flex min-w-0 items-center gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-[10px] font-semibold text-fg">{item.client.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div><div className="min-w-0"><div className="truncate text-xs font-semibold text-fg">{item.client}</div><div className="mt-0.5 text-[10px] text-muted">{item.pod} · {tierLabel[item.tier]}</div></div></div></td>
                   <td className="px-4 py-3 text-right text-xs font-medium tabular-nums text-fg">{formatPercent(item.targetSla)}</td>
                   <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-2"><span className="h-1.5 w-12 overflow-hidden rounded-full bg-line/70"><span className="block h-1.5 rounded-full bg-success" style={{ width: Math.max(0, Math.min(100, item.currentUptime)) + '%' }} /></span><span className="text-xs font-semibold tabular-nums text-fg">{formatPercent(item.currentUptime)}</span></div></td>
                   <td className="px-4 py-3"><div className="text-xs font-medium tabular-nums text-fg">{item.mttrMinutes} min</div><div className={`mt-0.5 text-[10px] ${item.compliance === 'degraded' ? 'text-danger' : item.compliance === 'warning' ? 'text-warning' : 'text-success'}`}>{item.responseStatus}</div></td>
                   <td className="px-4 py-3"><div className="max-w-[300px] truncate text-xs text-fg" title={item.incidentTitle}>{formatDate(item.lastIncidentAt)}</div><div className="mt-0.5 max-w-[300px] truncate text-[10px] text-muted">{item.incidentTitle}</div></td>
                   <td className="px-4 py-3 text-center"><span className={`inline-flex min-h-6 items-center gap-1.5 rounded-badge border px-2 py-0.5 text-[10px] font-medium ${meta.className}`}><span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}</span></td>
                   <td className="px-4 py-3 text-right"><div className="ams-table-actions flex items-center justify-end gap-1">
                     <button type="button" onClick={() => setSelectedIncident(item)} aria-label={`View incident log for ${item.client}`} title="Incident log" className="inline-flex h-10 w-10 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><FileText size={15} aria-hidden="true" /></button>
                     <button type="button" onClick={() => setSelectedTelemetry(item)} aria-label={`View telemetry for ${item.client}`} title="Telemetry" className="inline-flex h-10 w-10 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Activity size={16} aria-hidden="true" /></button>
                   </div></td>
                 </tr>;
               }) : <tr><td colSpan={7} className="px-4 py-14 text-center"><Search size={18} className="mx-auto text-muted" /><p className="mt-3 text-sm font-medium text-fg">No matching SLA accounts.</p><p className="mt-1 text-xs text-muted">Adjust the search or clear the active filters.</p><button type="button" onClick={reset} className="mt-4 inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-bg">Reset filters</button></td></tr>}
            </tbody>
          </table>
        </div>

        {!isLoading && <AdminTablePagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="monitored accounts" slug="sla-monitoring-pagination" />}
      </section>

      <section className="mt-3 grid grid-cols-1 gap-3 text-[11px] text-muted md:grid-cols-4" aria-label="SLA summary">
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-4"><CheckCircle2 size={14} className="text-success" /><span>Compliant accounts: <strong className="text-fg">{complianceCount}</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-4"><AlertTriangle size={14} className="text-warning" /><span>Warning accounts: <strong className="text-fg">{warnings}</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-4"><FileText size={14} className="text-info" /><span>Degraded accounts: <strong className="text-fg">{degraded}</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-4"><TimerReset size={14} className="text-accent-text" /><span>Monitored rows: <strong className="text-fg">{filtered.length}</strong></span></div>
      </section>

      <Modal open={!!selectedIncident} onClose={() => setSelectedIncident(null)} size="md" title="Incident log" description={selectedIncident ? `${selectedIncident.client} · ${formatDate(selectedIncident.lastIncidentAt)}` : undefined} footer={<div className="flex justify-end"><Button type="button" variant="secondary" onClick={() => setSelectedIncident(null)}>Close</Button></div>}>
        {selectedIncident && <div className="space-y-4"><div className="rounded-card border border-line bg-bg p-4"><div className="flex items-center gap-2 text-xs font-medium text-fg"><AlertTriangle size={14} className={selectedIncident.compliance === 'degraded' ? 'text-danger' : selectedIncident.compliance === 'warning' ? 'text-warning' : 'text-success'} />{selectedIncident.incidentTitle}</div><p className="mt-2 text-xs text-muted">Status: {complianceMeta[selectedIncident.compliance].label} · MTTR {selectedIncident.mttrMinutes} min</p></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-card border border-line bg-panel p-4"><span className="text-[10px] uppercase tracking-wider text-muted">Target SLA</span><div className="mt-1 text-sm font-semibold tabular-nums text-fg">{formatPercent(selectedIncident.targetSla)}</div></div><div className="rounded-card border border-line bg-panel p-4"><span className="text-[10px] uppercase tracking-wider text-muted">Current uptime</span><div className="mt-1 text-sm font-semibold tabular-nums text-fg">{formatPercent(selectedIncident.currentUptime)}</div></div><div className="rounded-card border border-line bg-panel p-4"><span className="text-[10px] uppercase tracking-wider text-muted">Assigned pod</span><div className="mt-1 text-sm font-semibold text-fg">{selectedIncident.pod}</div></div></div></div>}
      </Modal>

      <Modal open={!!selectedTelemetry} onClose={() => setSelectedTelemetry(null)} size="lg" title="Service telemetry" description={selectedTelemetry ? `${selectedTelemetry.client} · account monitoring snapshot` : undefined} footer={<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setSelectedTelemetry(null)}>Close</Button><Button type="button" variant="primary" onClick={() => setMessage('Telemetry export is not connected yet.')} icon={<Download size={14} />}>Export snapshot</Button></div>}>
        {selectedTelemetry && <div className="space-y-4"><div className="rounded-card border border-line bg-bg p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-fg">{selectedTelemetry.client}</p><p className="mt-0.5 text-xs text-muted">{selectedTelemetry.pod} · {tierLabel[selectedTelemetry.tier]}</p></div><span className={`inline-flex min-h-6 items-center gap-1.5 rounded-badge border px-2 py-0.5 text-[10px] font-medium ${complianceMeta[selectedTelemetry.compliance].className}`}><span className={`h-1.5 w-1.5 rounded-full ${complianceMeta[selectedTelemetry.compliance].dot}`} />{complianceMeta[selectedTelemetry.compliance].label}</span></div></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-card border border-line bg-panel p-4"><span className="text-[10px] uppercase tracking-wider text-muted">30D uptime</span><div className="mt-1 text-lg font-medium tabular-nums text-fg">{formatPercent(selectedTelemetry.currentUptime)}</div></div><div className="rounded-card border border-line bg-panel p-4"><span className="text-[10px] uppercase tracking-wider text-muted">Target</span><div className="mt-1 text-lg font-medium tabular-nums text-fg">{formatPercent(selectedTelemetry.targetSla)}</div></div><div className="rounded-card border border-line bg-panel p-4"><span className="text-[10px] uppercase tracking-wider text-muted">MTTR</span><div className="mt-1 text-lg font-medium tabular-nums text-fg">{selectedTelemetry.mttrMinutes} min</div></div></div><div className="rounded-card border border-line bg-panel p-4"><div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium text-fg">Availability</span><span className="tabular-nums text-muted">{formatPercent(selectedTelemetry.currentUptime)}</span></div><div className="h-2 overflow-hidden rounded-full bg-line/70"><div className="h-2 rounded-full bg-success" style={{ width: Math.min(100, Math.max(0, selectedTelemetry.currentUptime)) + '%' }} /></div><p className="mt-2 text-xs text-muted">Monitoring values are shown from the current client-module data set.</p></div></div>}
      </Modal>
    </div>
  );
};

export default AdminClientSlaMonitoring;