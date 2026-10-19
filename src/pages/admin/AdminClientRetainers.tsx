import React, { useEffect, useMemo, useState } from 'react';
import { useReportingPeriod } from '../../lib/ReportingPeriodContext';
import { formatRetainerRenewalDate, getDefaultRetainerRenewalDate, getRetainerRenewalDays } from '../../lib/retainerDateDefaults';
import {
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Plus,
  Pencil,
  RotateCcw,
  Search,
  TriangleAlert,
  X
} from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { hasAdminPermission } from '../../lib/adminAuth';
import { api } from '../../lib/apiClient';
import type { AgencyClient } from '../../lib/clientStore';
import { Button } from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Drawer } from '../../components/ui/Drawer';
import { AdminFilterBar, AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminSectionTabs, AdminStatusBadge, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';

type Health = 'healthy' | 'near-cap' | 'overage-risk' | 'not-configured';
type Cycle = 'monthly' | 'quarterly' | 'annual';
type Tier = 'tier-1' | 'tier-2' | 'tier-3';
type SortKey = 'client' | 'monthlyValue' | 'committedHours' | 'usedHours' | 'renewal' | 'health';

type Retainer = {
  id: string;
  clientId?: string;
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
  tierRecorded: boolean;
  cycleRecorded: boolean;
  monthlyValueRecorded: boolean;
  committedHoursRecorded: boolean;
  usedHoursRecorded: boolean;
  overageRateRecorded: boolean;
  renewalRecorded: boolean;
};

const tierLabel: Record<Tier, string> = { 'tier-1': 'Tier 1 Strategic', 'tier-2': 'Tier 2 Enterprise', 'tier-3': 'Tier 3 Growth' };
const cycleLabel: Record<Cycle, string> = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' };
const healthMeta: Record<Health, { label: string; dot: string; className: string }> = {
  healthy: { label: 'Healthy', dot: 'bg-success', className: 'border-success/20 bg-success/10 text-success' },
  'near-cap': { label: 'Near Cap', dot: 'bg-warning', className: 'border-warning/20 bg-warning/10 text-warning' },
  'overage-risk': { label: 'Overage Risk', dot: 'bg-danger', className: 'border-danger/20 bg-danger/10 text-danger' },
  'not-configured': { label: 'Usage unavailable', dot: 'bg-line', className: 'border-line bg-bg text-muted' }
};
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const formatDate = (value: string) => formatRetainerRenewalDate(value);
const renewalDays = (value: string) => getRetainerRenewalDays(value);
const isRenewalHighlighted = (value: string) => {
  const days = renewalDays(value);
  return days !== null && days <= 30;
};
const isRecordedFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const mapClientRetainer = (client: AgencyClient): Retainer => {
  const committedHoursRecorded = isRecordedFiniteNumber(client.retainerCommittedHours) && client.retainerCommittedHours >= 0;
  const usedHoursRecorded = isRecordedFiniteNumber(client.retainerUsedHours) && client.retainerUsedHours >= 0;
  const monthlyValueRecorded = isRecordedFiniteNumber(client.retainerMonthlyValue) && client.retainerMonthlyValue >= 0;
  const overageRateRecorded = isRecordedFiniteNumber(client.retainerOverageRate) && client.retainerOverageRate >= 0;
  const tierRecorded = client.retainerTier === 'tier-1' || client.retainerTier === 'tier-2' || client.retainerTier === 'tier-3';
  const cycleRecorded = client.retainerCycle === 'monthly' || client.retainerCycle === 'quarterly' || client.retainerCycle === 'annual';
  const renewal = String(client.retainerRenewal || '');
  const renewalRecorded = Boolean(renewal.trim());
  const committedHours = committedHoursRecorded ? client.retainerCommittedHours as number : 0;
  const usedHours = usedHoursRecorded ? client.retainerUsedHours as number : 0;
  const tier: Tier = client.retainerTier === 'tier-1' || client.retainerTier === 'tier-3' ? client.retainerTier : 'tier-2';
  const cycle: Cycle = client.retainerCycle === 'quarterly' || client.retainerCycle === 'annual' ? client.retainerCycle : 'monthly';
  const usageIsConfigured = committedHoursRecorded && committedHours > 0 && usedHoursRecorded;
  const burnRatio = usageIsConfigured ? usedHours / committedHours : null;
  const clientName = String(client.company || client.name || 'Unnamed client');
  return {
    id: String(client.retainerId || ('RET-' + client.id)),
    clientId: client.id,
    initials: clientName.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'CL',
    client: clientName,
    tier,
    monthlyValue: monthlyValueRecorded ? client.retainerMonthlyValue as number : 0,
    committedHours,
    usedHours,
    overageRate: overageRateRecorded ? client.retainerOverageRate as number : 0,
    cycle,
    renewal,
    health: burnRatio === null ? 'not-configured' : burnRatio > 1 ? 'overage-risk' : burnRatio >= 0.85 ? 'near-cap' : 'healthy',
    tierRecorded,
    cycleRecorded,
    monthlyValueRecorded,
    committedHoursRecorded,
    usedHoursRecorded,
    overageRateRecorded,
    renewalRecorded
  };
};

const getRetainerUsage = (item: Retainer): number | null =>
  item.committedHoursRecorded && item.committedHours > 0 && item.usedHoursRecorded
    ? Math.round(item.usedHours / item.committedHours * 100)
    : null;

const getRetainerRemainingHours = (item: Retainer): number | null =>
  getRetainerUsage(item) === null ? null : item.committedHours - item.usedHours;

const sortValue = (item: Retainer, key: SortKey): string | number => {
  if (key === 'client') return item.client;
  if (key === 'monthlyValue') return item.monthlyValue;
  if (key === 'committedHours') return item.committedHours;
  if (key === 'usedHours') return item.usedHours / Math.max(1, item.committedHours);
  if (key === 'renewal') { const timestamp = new Date(item.renewal).getTime(); return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER; }
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
  const { matchesDate, value: reportPeriodValue, enabled: reportPeriodEnabled } = useReportingPeriod();
  const { language } = useLanguage();
  const canManageRetainers = hasAdminPermission('canManageClients');
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [records, setRecords] = useState<Retainer[]>([]);
  const [query, setQuery] = useState('');
  const [cycle, setCycle] = useState<'all' | Cycle>('all');
  const [tier, setTier] = useState<'all' | Tier>('all');
  const [health, setHealth] = useState<'all' | Health>('all');
  const [sortKey, setSortKey] = useState<SortKey>('renewal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [retainerFormOpen, setRetainerFormOpen] = useState(false);
  const [editingRetainer, setEditingRetainer] = useState<Retainer | null>(null);
  const [retainerSaving, setRetainerSaving] = useState(false);
  const [retainerClient, setRetainerClient] = useState('');
  const [retainerTier, setRetainerTier] = useState<Tier>('tier-2');
  const [retainerMonthlyValue, setRetainerMonthlyValue] = useState('100000000');
  const [retainerCommittedHours, setRetainerCommittedHours] = useState('160');
  const [retainerOverageRate, setRetainerOverageRate] = useState('650000');
  const [retainerCycle, setRetainerCycle] = useState<Cycle>('monthly');
  const [retainerRenewal, setRetainerRenewal] = useState(() => getDefaultRetainerRenewalDate());
  const [message, setMessage] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let mounted = true;
    const loadRetainers = async () => {
      setIsLoading(true);
      try {
        const response = await api.clients.getAll();
        if (!response.success || !Array.isArray(response.data?.clients)) {
          throw new Error(response.error || 'Client records could not be loaded.');
        }
        const rows = response.data.clients as AgencyClient[];
        if (mounted) {
          setClients(rows);
          setRecords(rows.filter((client) => client.activeRetainer === true).map(mapClientRetainer));
          setMessage(null);
        }
      } catch (error) {
        if (mounted) {
          setClients([]);
          setRecords([]);
          setMessage(error instanceof Error ? error.message : 'Client records could not be loaded.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadRetainers();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter((item) => {
      if (!matchesDate(item.renewal)) return false;
      const searchable = `${item.client} ${item.id} ${tierLabel[item.tier]} ${cycleLabel[item.cycle]}`.toLowerCase();
      return (!normalized || searchable.includes(normalized)) && (cycle === 'all' || item.cycle === cycle) && (tier === 'all' || item.tier === tier) && (health === 'all' || item.health === health);
    }).sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      const comparison = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [records, query, cycle, tier, health, sortKey, sortDirection, matchesDate]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [query, cycle, tier, health, sortKey, sortDirection, reportPeriodValue, reportPeriodEnabled]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const mrrRecorded = records.every((item) => item.monthlyValueRecorded);
  const mrr = mrrRecorded ? records.reduce((sum, item) => sum + item.monthlyValue, 0) : null;
  const usageTotalsRecorded = records.every((item) => item.committedHoursRecorded && item.committedHours > 0 && item.usedHoursRecorded);
  const allocated = usageTotalsRecorded ? records.reduce((sum, item) => sum + item.committedHours, 0) : null;
  const used = usageTotalsRecorded ? records.reduce((sum, item) => sum + item.usedHours, 0) : null;
  const burn = allocated !== null && used !== null && allocated > 0 ? (used / allocated) * 100 : null;
  const renewalDateCount = records.filter((item) => item.renewalRecorded && renewalDays(item.renewal) !== null).length;
  const renewalDatesComplete = renewalDateCount === records.length;
  const renewals = records.filter((item) => {
    const days = item.renewalRecorded ? renewalDays(item.renewal) : null;
    return days !== null && days >= 0 && days <= 30;
  });
  const renewalsValueRecorded = renewals.every((item) => item.monthlyValueRecorded);
  const renewalsValue = renewalsValueRecorded ? renewals.reduce((sum, item) => sum + item.monthlyValue, 0) : null;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDirection(key === 'renewal' ? 'asc' : 'desc'); }
  };

  const reset = () => {
    setQuery(''); setCycle('all'); setTier('all'); setHealth('all'); setSortKey('renewal'); setSortDirection('asc'); setPage(1);
  };

  const openRetainerForm = (record?: Retainer) => {
    setEditingRetainer(record || null);
    setRetainerClient(record?.client || '');
    setRetainerTier(record?.tier || 'tier-2');
    setRetainerMonthlyValue(String(record?.monthlyValue ?? 100000000));
    setRetainerCommittedHours(String(record?.committedHours ?? 160));
    setRetainerOverageRate(String(record?.overageRate ?? 650000));
    setRetainerCycle(record?.cycle || 'monthly');
    setRetainerRenewal(record?.renewal || getDefaultRetainerRenewalDate());
    setMessage(null);
    setRetainerFormOpen(true);
  };

  const createRetainer = async (event: React.FormEvent) => {
    event.preventDefault();
    const clientName = retainerClient.trim();
    const monthlyValue = Number(retainerMonthlyValue);
    const committedHours = Number(retainerCommittedHours);
    const overageRate = Number(retainerOverageRate);

    if (!clientName || !Number.isFinite(monthlyValue) || monthlyValue < 0 || !Number.isFinite(committedHours) || committedHours <= 0 || !Number.isFinite(overageRate) || overageRate < 0 || !retainerRenewal) {
      setMessage(language === 'id' ? 'Lengkapi data retainer dengan nilai yang valid.' : 'Complete the retainer fields with valid values.');
      return;
    }

    const targetClient = editingRetainer?.clientId
      ? clients.find((item) => item.id === editingRetainer.clientId)
      : clients.find((item) => String(item.company || item.name || '').trim().toLowerCase() === clientName.toLowerCase());

    if (!targetClient) {
      setMessage(language === 'id'
        ? 'Klien harus sudah ada di Client Directory. Gunakan nama perusahaan yang sama persis.'
        : 'The client must already exist in Client Directory. Enter the exact company name.');
      return;
    }
    if (!editingRetainer && targetClient.activeRetainer) {
      setMessage(language === 'id' ? 'Klien ini sudah memiliki retainer aktif. Gunakan Edit Terms.' : 'This client already has an active retainer. Use Edit Terms.');
      return;
    }

    const suffix = Date.now().toString(36).toUpperCase();
    const retainerId = editingRetainer?.id || ('RET-' + new Date().getFullYear() + '-' + suffix);


    if (!targetClient) return;
    setRetainerSaving(true);
    try {
      const response = await api.clients.update(targetClient.id, {
        activeRetainer: true,
        retainerId,
        retainerTier,
        retainerMonthlyValue: monthlyValue,
        retainerCommittedHours: committedHours,
        retainerOverageRate: overageRate,
        retainerCycle,
        retainerRenewal
      });
      if (!response.success || !response.data?.client) {
        throw new Error(response.error || 'Retainer could not be saved to the client record.');
      }
      const savedClient = response.data.client as AgencyClient;
      const savedRetainer = mapClientRetainer(savedClient);
      setClients((current) => current.map((item) => item.id === savedClient.id ? savedClient : item));
      setRecords((current) => editingRetainer
        ? current.map((item) => item.clientId === savedClient.id ? savedRetainer : item)
        : [savedRetainer, ...current.filter((item) => item.clientId !== savedClient.id)]);
      setPage(1);
      setRetainerFormOpen(false);
      setEditingRetainer(null);
      setMessage(language === 'id' ? 'Retainer tersimpan di Client Directory.' : 'Retainer saved to Client Directory.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Retainer could not be saved.');
    } finally {
      setRetainerSaving(false);
    }
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


  return (
    <AdminPageShell featureSlug="client-retainers-module" className="ams-clients-module">
      <AdminModuleHeader slug="client-retainers-header"
        className="mb-0"
        title="Client Retainer Agreements"
        description="Manage saved retainer terms, committed hours, and renewal dates."
        eyebrow={<AdminStatusBadge tone="neutral">{records.length} active contracts</AdminStatusBadge>}
        actions={(
          <>
            <Button type="button" variant="secondary" onClick={exportReport} icon={<Download size={14} />}>Export Report</Button>
            {canManageRetainers && <Button type="button" variant="primary" onClick={openRetainerForm} icon={<Plus size={14} />}>New Retainer</Button>}
          </>
        )}
      />

      <AdminSectionTabs
        ariaLabel="Client Agreements worksheets"
        activeKey="retainers"
        className="w-full border-b border-line pb-2"
        items={[
          { key: 'contracts', label: 'Contracts & SOWs', to: '/admin/contracts' },
          { key: 'retainers', label: 'Retainers & Service Commitments', to: '/admin/clients/retainers' },
          { key: 'renewals', label: 'Renewal Schedule', to: '/admin/contracts?view=renewals' },
          { key: 'history', label: 'Contract History', to: '/admin/contracts', available: false },
        ]}
      />

      <div className="flex items-start gap-3 rounded-card border border-warning/25 bg-warning/5 px-3 py-3 text-xs text-muted" role="status" aria-live="polite" data-ams-slug="retainer-time-log-reconciliation-state">
        <TriangleAlert size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
        <p className="leading-5">Hours used currently reflect the saved Client Directory field. AMS does not yet reconcile Time Logs with retainer billing cycles and eligible-entry rules. Verify usage before applying overage or billing.</p>
      </div>

      {message && <div className="flex items-center justify-between rounded-card border border-line bg-panel px-3 py-2.5 text-xs text-fg" role="status" aria-live="polite"><span>{message}</span><button type="button" onClick={() => setMessage(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg" aria-label="Dismiss"><X size={14} /></button></div>}



      <AdminFilterBar slug="client-retainers-filters"
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search client, retainer ID, tier, or cycle..."
        searchLabel="Search retainers"
        actions={(
          <>
            <CustomSelect value={cycle} onChange={(value) => setCycle(value as 'all' | Cycle)} options={[{ value: 'all', label: 'All cycles' }, { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annual', label: 'Annual' }]} aria-label="Billing cycle" className="min-w-[136px]" triggerClassName="w-full" />
            <CustomSelect value={tier} onChange={(value) => setTier(value as 'all' | Tier)} options={[{ value: 'all', label: 'All tiers' }, { value: 'tier-1', label: 'Tier 1 Strategic' }, { value: 'tier-2', label: 'Tier 2 Enterprise' }, { value: 'tier-3', label: 'Tier 3 Growth' }]} aria-label="Retainer tier" className="min-w-[146px]" triggerClassName="w-full" />
            <CustomSelect value={health} onChange={(value) => setHealth(value as 'all' | Health)} options={[{ value: 'all', label: 'All health' }, { value: 'healthy', label: 'Healthy' }, { value: 'near-cap', label: 'Near cap' }, { value: 'overage-risk', label: 'Overage risk' }, { value: 'not-configured', label: 'Usage unavailable' }]} aria-label="Retainer health" className="min-w-[138px]" triggerClassName="w-full" />
            <Button type="button" variant="secondary" icon={<RotateCcw size={13} />} onClick={reset}>Reset filters</Button>
          </>
        )}
      />

      <section data-ams-feature-slug="retainers-directory" data-ams-slug="retainers-directory" className="ams-client-table-shell overflow-hidden rounded-card border border-line bg-panel" aria-label="Retainer agreements table">
        <div className="min-w-0">
          <div className="grid gap-3 p-3 min-[1280px]:hidden sm:p-4" data-ams-feature-slug="retainers-compact-cards" role="list" aria-label="Retainer agreement cards">
            {isLoading ? Array.from({ length: pageSize }).map((_, index) => (
              <div key={index} className="rounded-card border border-line bg-bg p-4" role="status" aria-label="Loading retainer">
                <div className="h-3 w-36 animate-pulse rounded-badge bg-line" />
                <div className="mt-3 h-3 w-24 animate-pulse rounded-badge bg-line" />
                <div className="mt-4 h-8 animate-pulse rounded-control bg-line/60" />
              </div>
            )) : visible.length ? visible.map((item) => {
              const usage = getRetainerUsage(item);
              const meta = healthMeta[item.health];
              return (
                <article key={item.id} data-ams-slug={'client-retainer-card-' + item.id.toLowerCase()} role="listitem" className="min-w-0 rounded-card border border-line bg-bg p-3.5">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-[11px] font-semibold text-fg">{item.initials}</div>
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-semibold text-fg">{item.client}</h3>
                        <p className="mt-1 break-words text-[10px] text-muted">{item.id} · {item.tierRecorded ? tierLabel[item.tier] : 'Tier not recorded'}</p>
                      </div>
                    </div>
                    <span className={'inline-flex shrink-0 items-center gap-1.5 rounded-badge border px-2 py-1 text-[10px] font-medium ' + meta.className}>
                      <span className={'h-1.5 w-1.5 rounded-full ' + meta.dot} />{meta.label}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 border-y border-line py-3">
                    <div className="min-w-0"><p className="text-[10px] text-muted">Monthly value</p><p className="mt-1 break-words text-xs font-semibold tabular-nums text-fg">{item.monthlyValueRecorded ? money(item.monthlyValue) : 'Not recorded'}{item.monthlyValueRecorded && <span className="ml-0.5 text-[10px] font-normal text-muted">/mo</span>}</p></div>
                    <div className="min-w-0"><p className="text-[10px] text-muted">Overage rate</p><p className="mt-1 break-words text-xs font-medium tabular-nums text-fg">{item.overageRateRecorded ? money(item.overageRate) : 'Not recorded'}{item.overageRateRecorded && <span className="ml-0.5 text-[10px] font-normal text-muted">/hr</span>}</p></div>
                    <div className="min-w-0"><p className="text-[10px] text-muted">Committed hours</p><p className="mt-1 text-xs tabular-nums text-fg">{item.committedHoursRecorded ? item.committedHours + ' hrs' : 'Not recorded'}</p></div>
                    <div className="min-w-0"><p className="text-[10px] text-muted">Cycle / renewal</p><p className="mt-1 text-xs text-fg">{item.cycleRecorded ? cycleLabel[item.cycle] : 'Cycle not recorded'}</p><p className={'mt-1 break-words text-[10px] font-medium ' + (isRenewalHighlighted(item.renewal) ? 'text-warning' : 'text-muted')}>{item.renewalRecorded ? 'Renews ' + formatDate(item.renewal) : 'Renewal date not recorded'}</p></div>
                  </div>
                  <div className="mt-3" data-ams-slug="retainer-usage-context">
                    {usage === null ? (
                      <p className="text-xs leading-5 text-muted" role="status">Usage unavailable. Record committed hours above zero and used hours to show utilization or remaining hours.</p>
                    ) : (
                      <>
                        <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] tabular-nums">
                          <span className="text-muted">Hours used</span>
                          <span className={usage >= 95 ? 'font-semibold text-danger' : usage >= 80 ? 'font-semibold text-warning' : 'font-medium text-fg'}>{item.usedHours} / {item.committedHours} hrs · {usage}%</span>
                        </div>
                        <p className="mb-2 text-[10px] text-muted">{getRetainerRemainingHours(item)! >= 0 ? 'Remaining ' + getRetainerRemainingHours(item) + ' hrs' : 'Over commitment by ' + Math.abs(getRetainerRemainingHours(item)!) + ' hrs'}</p>
                        <div className="h-1.5 overflow-hidden rounded-full bg-line/70"><div className={'h-1.5 rounded-full ' + (usage >= 95 ? 'bg-danger' : usage >= 80 ? 'bg-warning' : 'bg-success')} style={{ width: Math.min(100, usage) + '%' }} /></div>
                      </>
                    )}
                  </div>
                  <div className="mt-3 flex justify-end border-t border-line pt-3">
                    {canManageRetainers && <button type="button" onClick={() => openRetainerForm(item)} aria-label={'Edit terms for ' + item.client} title="Edit terms" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-[11px] text-muted hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Pencil size={13} aria-hidden="true" />Edit terms</button>}
                  </div>
                </article>
              );
            }) : (
              <div className="rounded-control border border-line bg-bg px-4 py-10 text-center">
                <Search size={18} className="mx-auto text-muted" />
                <p className="mt-3 text-sm font-medium text-fg">{records.length === 0 ? 'No active retainer agreements.' : 'No matching retainers.'}</p>
                <p className="mt-1 text-xs text-muted">{records.length === 0 ? 'Create a retainer for a client already listed in Client Directory.' : 'Adjust the search or clear the active filters.'}</p>
                <button type="button" onClick={reset} className="mt-4 inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">Reset filters</button>
              </div>
            )}
          </div>
          <div className="hidden min-[1280px]:block overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <thead className="bg-bg"><tr className="border-b border-line text-[11px] font-medium text-muted">
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
                 const usage = getRetainerUsage(item); const meta = healthMeta[item.health];
                 return <tr key={item.id} data-ams-slug={'client-retainer-' + item.id.toLowerCase()} className="border-b border-line last:border-0 transition-colors hover:bg-bg/70">
                                      <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-[11px] font-semibold text-fg">{item.initials}</div><div className="min-w-0"><div className="truncate text-xs font-semibold text-fg">{item.client}</div><div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted"><span className="tabular-nums">{item.id}</span><span>•</span><span>{item.tierRecorded ? tierLabel[item.tier] : 'Tier not recorded'}</span></div></div></div></td>
                   <td className="px-4 py-3 text-right text-xs font-medium tabular-nums text-fg">{item.monthlyValueRecorded ? money(item.monthlyValue) + '/mo' : 'Not recorded'}</td>
                   <td className="px-4 py-3 text-right text-xs font-medium tabular-nums text-fg">{item.committedHoursRecorded ? item.committedHours + ' hrs' : 'Not recorded'}</td>
                   <td className="px-4 py-3"><div className="w-44 max-w-full">{usage === null ? <span className="text-xs text-muted" role="status">Usage unavailable</span> : <><div className="mb-1 flex items-center justify-between text-[10px] tabular-nums"><span className="font-medium text-fg">{item.usedHours} / {item.committedHours} hrs</span><span className={usage >= 95 ? 'font-semibold text-danger' : usage >= 80 ? 'font-semibold text-warning' : 'text-muted'}>{usage}%</span></div><p className="mb-1 text-[10px] text-muted">{getRetainerRemainingHours(item)! >= 0 ? 'Remaining ' + getRetainerRemainingHours(item) + ' hrs' : 'Over commitment by ' + Math.abs(getRetainerRemainingHours(item)!) + ' hrs'}</p><div className="h-1.5 overflow-hidden rounded-full bg-line/70"><div className={'h-1.5 rounded-full ' + (usage >= 95 ? 'bg-danger' : usage >= 80 ? 'bg-warning' : 'bg-success')} style={{ width: Math.min(100, usage) + '%' }} /></div></>}</div></td>
                   <td className="px-4 py-3 text-right text-xs font-medium tabular-nums text-fg">{item.overageRateRecorded ? money(item.overageRate) + '/hr' : 'Not recorded'}</td>
                   <td className="px-4 py-3 text-[11px] text-muted"><div>{item.cycleRecorded ? cycleLabel[item.cycle] : 'Cycle not recorded'}</div><div className={(isRenewalHighlighted(item.renewal) ? 'text-warning ' : 'text-fg ') + 'mt-0.5 font-medium'}>{item.renewalRecorded ? 'Renews ' + formatDate(item.renewal) : 'Renewal date not recorded'}</div></td>
                   <td className="px-4 py-3 text-center"><span className={'inline-flex min-h-6 items-center gap-1.5 rounded-badge border px-2 py-0.5 text-[10px] font-medium ' + meta.className}><span className={'h-1.5 w-1.5 rounded-full ' + meta.dot} />{meta.label}{usage !== null && usage >= 80 ? ' · ' + usage + '%' : ''}</span></td>
<td className="px-4 py-3 text-right"><div className="ams-table-actions flex items-center justify-end gap-1">
                     {canManageRetainers && <>
                       <button type="button" onClick={() => openRetainerForm(item)} aria-label={`Edit terms for ${item.client}`} title="Edit terms" className="inline-flex h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Pencil size={15} aria-hidden="true" /></button>
                     </>}
                   </div></td>
                 </tr>;
               }) : <tr><td colSpan={8} className="px-4 py-14 text-center"><Search size={18} className="mx-auto text-muted" /><p className="mt-3 text-sm font-medium text-fg">{records.length === 0 ? 'No active retainer agreements.' : 'No matching retainers.'}</p><p className="mt-1 text-xs text-muted">{records.length === 0 ? 'Create a retainer for a client already listed in Client Directory.' : 'Adjust the search or clear the active filters.'}</p><button type="button" onClick={reset} className="mt-4 inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-bg">Reset filters</button></td></tr>}
            </tbody>
          </table>
          </div>
        </div>
        {!isLoading && <AdminTablePagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="retainers" slug="retainers-pagination" />}
      </section>

      <section data-ams-feature-slug="retainers-kpis" data-ams-slug="retainers-kpis" aria-label="Retainer metrics">
        <AdminMetricStrip
          slug="retainers-kpis"
          metrics={[
            { id: 'monthly-value', label: 'Monthly retainer value', value: mrr === null ? 'Not fully recorded' : money(mrr), context: mrr === null ? 'At least one active retainer has no recorded monthly value' : 'Current committed recurring value', icon: <ArrowUp size={15} />, toneClassName: 'text-success' },
            { id: 'committed-hours', label: 'Committed retainer hours', value: allocated === null ? 'Not fully recorded' : allocated.toLocaleString() + ' hrs', context: burn === null || used === null ? 'Usage summary needs a recorded positive commitment and used-hour value on every active retainer' : 'Used ' + used.toLocaleString() + ' hrs · ' + burn.toFixed(1) + '% burn', icon: <Clock3 size={15} />, toneClassName: 'text-info' },
            { id: 'renewals-due', label: 'Renewals due in 30 days', value: renewals.length, context: !renewalDatesComplete ? renewalDateCount + ' of ' + records.length + ' active retainers have valid renewal dates; missing dates excluded' : renewalsValue === null ? 'Monthly value is not recorded for every renewal in range' : money(renewalsValue) + ' monthly value', icon: <CalendarDays size={15} />, toneClassName: 'text-warning' }
          ]}
        />
      </section>

      <Drawer slug="retainer-create-drawer"
        open={retainerFormOpen}
        onClose={() => { setRetainerFormOpen(false); setEditingRetainer(null); }}
        size="lg"
        title={editingRetainer ? 'Edit retainer' : 'New retainer'}
        description="Save retainer terms against an existing client record."
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => { setRetainerFormOpen(false); setEditingRetainer(null); }}>Cancel</Button>
            <Button type="submit" form="retainer-create-form" variant="primary" loading={retainerSaving}>{editingRetainer ? 'Save changes' : 'Create retainer'}</Button>
          </>
        )}
      >
        <form id="retainer-create-form" onSubmit={createRetainer} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-[11px] font-medium text-muted">Client</span>
              <input required value={retainerClient} onChange={(event) => setRetainerClient(event.target.value)} disabled={Boolean(editingRetainer)} placeholder="Existing client company name" className="h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent disabled:opacity-60" />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted">Tier</span>
              <CustomSelect value={retainerTier} onChange={(value) => setRetainerTier(value as Tier)} options={[{ value: 'tier-1', label: 'Tier 1 Strategic' }, { value: 'tier-2', label: 'Tier 2 Enterprise' }, { value: 'tier-3', label: 'Tier 3 Growth' }]} className="w-full" triggerClassName="w-full" />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted">Billing cycle</span>
              <CustomSelect value={retainerCycle} onChange={(value) => setRetainerCycle(value as Cycle)} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annual', label: 'Annual' }]} className="w-full" triggerClassName="w-full" />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted">Monthly value</span>
              <input required type="number" min="0" step="1000000" value={retainerMonthlyValue} onChange={(event) => setRetainerMonthlyValue(event.target.value)} className="h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent" />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted">Committed hours</span>
              <input required type="number" min="1" step="1" value={retainerCommittedHours} onChange={(event) => setRetainerCommittedHours(event.target.value)} className="h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent" />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted">Overage rate</span>
              <input required type="number" min="0" step="50000" value={retainerOverageRate} onChange={(event) => setRetainerOverageRate(event.target.value)} className="h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent" />
            </label>
            <label className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted">Renewal date</span>
              <input required type="date" value={retainerRenewal} onChange={(event) => setRetainerRenewal(event.target.value)} className="h-9 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus:border-accent" />
            </label>
          </div>
        </form>
      </Drawer>

    </AdminPageShell>
  );
};

export default AdminClientRetainers;