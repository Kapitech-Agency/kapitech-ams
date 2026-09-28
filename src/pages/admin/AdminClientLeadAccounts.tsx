import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  MailCheck,
  Plus,
  Search,
  Target,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';

type Stage = 'discovery' | 'proposal' | 'contract' | 'ready-to-sign';
type SortKey = 'company' | 'annualValue' | 'stage' | 'owner' | 'probability' | 'dueAt';

type Lead = {
  id: string;
  initials: string;
  company: string;
  contact: string;
  owner: string;
  ownerRole: string;
  ownerInitials: string;
  brief: string;
  location: string;
  monthlyValue: number;
  annualValue: number;
  stage: Stage;
  probability: number;
  nextAction: string;
  dueAt: string;
  urgent?: boolean;
};

const daysFromNow = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

const seed: Lead[] = [
  { id: 'LEAD-001', initials: 'BA', company: 'Bank Artha Mandiri Digital', contact: 'Rizky Pranata', owner: 'Alex Vance', ownerRole: 'Lead Director', ownerInitials: 'AV', brief: 'Core Banking API Integration', location: 'Jakarta', monthlyValue: 320000000, annualValue: 3840000000, stage: 'proposal', probability: 75, nextAction: 'Technical demo review', dueAt: daysFromNow(2) },
  { id: 'LEAD-002', initials: 'MU', company: 'Medika Utama Telehealth', contact: 'Nadia Putri', owner: 'Alex Vance', ownerRole: 'Lead Director', ownerInitials: 'AV', brief: 'HIPAA-compliant Cloud Migration', location: 'Bandung', monthlyValue: 180000000, annualValue: 2160000000, stage: 'discovery', probability: 50, nextAction: 'Architecture audit presentation', dueAt: daysFromNow(6) },
  { id: 'LEAD-003', initials: 'LK', company: 'Logistik Kilat Nusantara', contact: 'Fajar Hidayat', owner: 'Alex Vance', ownerRole: 'Lead Director', ownerInitials: 'AV', brief: 'Fleet Telematics IoT Backend', location: 'Surabaya', monthlyValue: 240000000, annualValue: 2880000000, stage: 'contract', probability: 90, nextAction: 'Final MSA redline sign-off', dueAt: daysFromNow(3), urgent: true },
  { id: 'LEAD-004', initials: 'AP', company: 'AstraPay E-Wallet', contact: 'Dimas Kurniawan', owner: 'Alex Vance', ownerRole: 'Lead Director', ownerInitials: 'AV', brief: 'Microservices Re-architecture', location: 'Jakarta', monthlyValue: 450000000, annualValue: 5400000000, stage: 'proposal', probability: 65, nextAction: 'Send enterprise revised quotation', dueAt: daysFromNow(4) },
  { id: 'LEAD-005', initials: 'CR', company: 'Cipta Retail Omnichannel', contact: 'Sarah Melati', owner: 'Alex Vance', ownerRole: 'Lead Director', ownerInitials: 'AV', brief: 'Headless E-commerce & Inventory', location: 'Tangerang', monthlyValue: 160000000, annualValue: 1920000000, stage: 'proposal', probability: 55, nextAction: 'Scoping validation with CTO', dueAt: daysFromNow(7) },
  { id: 'LEAD-006', initials: 'DC', company: 'DanaCepat P2P Lending', contact: 'Arief Nugroho', owner: 'Alex Vance', ownerRole: 'Lead Director', ownerInitials: 'AV', brief: 'Security Audit & Vault Compliance', location: 'Jakarta', monthlyValue: 130000000, annualValue: 1560000000, stage: 'ready-to-sign', probability: 95, nextAction: 'Digital contract signing', dueAt: daysFromNow(0) },
  { id: 'LEAD-007', initials: 'NS', company: 'NusaShip Commerce', contact: 'Rafi Aditya', owner: 'Maya Chen', ownerRole: 'Growth Lead', ownerInitials: 'MC', brief: 'Cross-border Order Routing', location: 'Jakarta', monthlyValue: 155000000, annualValue: 1860000000, stage: 'discovery', probability: 45, nextAction: 'Stakeholder discovery session', dueAt: daysFromNow(8) },
  { id: 'LEAD-008', initials: 'TM', company: 'TransMed Supply', contact: 'Alya Prameswari', owner: 'Maya Chen', ownerRole: 'Growth Lead', ownerInitials: 'MC', brief: 'Healthcare Inventory Platform', location: 'Surabaya', monthlyValue: 205000000, annualValue: 2460000000, stage: 'discovery', probability: 55, nextAction: 'Technical discovery workshop', dueAt: daysFromNow(9) },
  { id: 'LEAD-009', initials: 'FN', company: 'Finova NeoBank', contact: 'Yusuf Ramadhan', owner: 'Maya Chen', ownerRole: 'Growth Lead', ownerInitials: 'MC', brief: 'Fraud Detection Service', location: 'Jakarta', monthlyValue: 360000000, annualValue: 4320000000, stage: 'contract', probability: 82, nextAction: 'Security schedule review', dueAt: daysFromNow(5) },
  { id: 'LEAD-010', initials: 'GT', company: 'GarudaTrip Platform', contact: 'Kevin Hartono', owner: 'Nadia Karim', ownerRole: 'Account Director', ownerInitials: 'NK', brief: 'Travel Booking Infrastructure', location: 'Bali', monthlyValue: 145000000, annualValue: 1740000000, stage: 'contract', probability: 88, nextAction: 'Procurement confirmation', dueAt: daysFromNow(3) },
  { id: 'LEAD-011', initials: 'OL', company: 'OtoLink Mobility', contact: 'Tania Wibowo', owner: 'Nadia Karim', ownerRole: 'Account Director', ownerInitials: 'NK', brief: 'Connected Fleet Management', location: 'Bandung', monthlyValue: 190000000, annualValue: 2280000000, stage: 'proposal', probability: 62, nextAction: 'Commercial review with CFO', dueAt: daysFromNow(10) },
  { id: 'LEAD-012', initials: 'MS', company: 'Merah Selatan Logistics', contact: 'Reno Saputra', owner: 'Nadia Karim', ownerRole: 'Account Director', ownerInitials: 'NK', brief: 'Warehouse Automation Layer', location: 'Semarang', monthlyValue: 125000000, annualValue: 1500000000, stage: 'proposal', probability: 48, nextAction: 'Solution architecture review', dueAt: daysFromNow(11) }
];

const stageMeta: Record<Stage, { label: string; dot: string }> = {
  discovery: { label: 'Discovery & Audit', dot: 'bg-muted' },
  proposal: { label: 'Proposal & Scoping', dot: 'bg-info' },
  contract: { label: 'Contract & Legal Review', dot: 'bg-warning' },
  'ready-to-sign': { label: 'Ready to Sign', dot: 'bg-success' }
};

const stageOrder: Array<'all' | Stage> = ['all', 'discovery', 'proposal', 'contract', 'ready-to-sign'];
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const compactMoney = (value: number) => value >= 1000000000 ? 'Rp ' + (value / 1000000000).toFixed(2) + 'B' : 'Rp ' + Math.round(value / 1000000) + 'M';

const dueLabel = (iso: string, urgent?: boolean) => {
  const date = new Date(iso);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((target - start) / 86400000);
  const dateText = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(date);
  if (urgent) return dateText + ' · Urgent';
  if (days < 0) return dateText + ' · ' + Math.abs(days) + 'd overdue';
  if (days === 0) return dateText + ' · Today';
  if (days === 1) return dateText + ' · Tomorrow';
  return dateText + ' · In ' + days + ' days';
};

const sortValue = (item: Lead, key: SortKey): string | number => {
  if (key === 'company') return item.company;
  if (key === 'annualValue') return item.annualValue;
  if (key === 'stage') return stageMeta[item.stage].label;
  if (key === 'owner') return item.owner;
  if (key === 'probability') return item.probability;
  return new Date(item.dueAt).getTime();
};

const SortButton: React.FC<{
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}> = ({ label, sortKey, activeKey, direction, onSort }) => (
  <button type="button" onClick={() => onSort(sortKey)} className="inline-flex min-h-9 items-center gap-1.5 font-medium hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={`Sort by ${label}`}>
    <span>{label}</span>
    {activeKey === sortKey ? (direction === 'asc' ? <ArrowUp size={13} /> : <ArrowUp size={13} className="rotate-180" />) : <ArrowUpDown size={13} />}
  </button>
);

export const AdminClientLeadAccounts: React.FC = () => {
  const [records, setRecords] = useState(seed);
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<'all' | Stage>('all');
  const [owner, setOwner] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('dueAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newContact, setNewContact] = useState('');
  const pageSize = 6;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsLoading(false));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const ownerOptions = useMemo(() => Array.from(new Set(records.map((item) => item.owner))).sort(), [records]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records
      .filter((item) => {
        const searchable = `${item.company} ${item.contact} ${item.owner} ${item.brief} ${item.location} ${item.id}`.toLowerCase();
        return (!normalized || searchable.includes(normalized)) && (stage === 'all' || item.stage === stage) && (owner === 'all' || item.owner === owner);
      })
      .sort((a, b) => {
        const av = sortValue(a, sortKey);
        const bv = sortValue(b, sortKey);
        const comparison = typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [records, query, stage, owner, sortKey, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [query, stage, owner, sortKey, sortDirection]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const pipelineValue = records.reduce((sum, item) => sum + item.annualValue, 0);
  const weightedProbability = pipelineValue ? records.reduce((sum, item) => sum + item.annualValue * item.probability, 0) / pipelineValue : 0;
  const proposalCount = records.filter((item) => item.stage === 'proposal').length;
  const stageCounts = stageOrder.reduce((acc, value) => {
    acc[value] = value === 'all' ? records.length : records.filter((item) => item.stage === value).length;
    return acc;
  }, {} as Record<'all' | Stage, number>);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDirection(key === 'dueAt' ? 'asc' : 'desc');
    }
  };

  const reset = () => {
    setQuery('');
    setStage('all');
    setOwner('all');
    setSortKey('dueAt');
    setSortDirection('asc');
    setPage(1);
  };

  const exportPipeline = () => {
    const rows = [
      ['Lead ID', 'Company', 'Contact', 'Brief', 'Location', 'Monthly Value', 'Annual Value', 'Stage', 'Probability', 'Owner', 'Next Action', 'Due'],
      ...filtered.map((item) => [item.id, item.company, item.contact, item.brief, item.location, item.monthlyValue, item.annualValue, stageMeta[item.stage].label, item.probability + '%', item.owner, item.nextAction, item.dueAt])
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'kapitech-lead-pipeline.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const addLead = () => {
    const company = newCompany.trim();
    if (!company) {
      setMessage('Company name is required.');
      return;
    }
    const lead: Lead = {
      id: 'LEAD-' + String(records.length + 1).padStart(3, '0'),
      initials: company.slice(0, 2).toUpperCase(),
      company,
      contact: newContact.trim() || 'New prospect',
      owner: 'Alex Vance',
      ownerRole: 'Lead Director',
      ownerInitials: 'AV',
      brief: 'New pipeline opportunity',
      location: 'Indonesia',
      monthlyValue: 0,
      annualValue: 0,
      stage: 'discovery',
      probability: 25,
      nextAction: 'Qualify opportunity',
      dueAt: daysFromNow(7)
    };
    setRecords((current) => [lead, ...current]);
    setNewCompany('');
    setNewContact('');
    setIsAdding(false);
    setMessage('Lead account added to the pipeline.');
  };

  return (
    <div className="min-h-full pb-8">
      <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-medium leading-8 tracking-[-0.02em] text-fg">Lead Accounts &amp; Pipeline</h1>
            <span className="inline-flex items-center rounded-badge border border-accent/20 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent-text">{records.length} Prospective Accounts</span>
          </div>
          <p className="mt-1 max-w-3xl text-[13px] leading-5 text-muted">Enterprise opportunities, qualification stages, projected retainer value, and next actions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <Button type="button" variant="secondary" onClick={exportPipeline} icon={<ArrowDown size={14} />}>Export Pipeline</Button>
          <Button type="button" variant="primary" onClick={() => setIsAdding(true)} icon={<Plus size={14} />}>Add Lead Account</Button>
        </div>
      </header>

      {message && (
        <div className="mb-4 flex items-center justify-between rounded-card border border-line bg-panel px-3 py-2.5 text-xs text-fg" role="status" aria-live="polite">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg" aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Pipeline metrics">
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">OPEN PIPELINE VALUE</span><CircleDollarSign size={18} /></div><div className="mt-3 text-2xl font-medium tabular-nums text-fg">{compactMoney(pipelineValue)}</div><p className="mt-1 text-[11px] text-muted">Combined projected annual value</p></div>
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">WEIGHTED WIN PROBABILITY</span><Target size={18} /></div><div className="mt-3 text-2xl font-medium tabular-nums text-fg">{weightedProbability.toFixed(1)}%</div><p className="mt-1 text-[11px] text-muted">Value-weighted across {records.length} opportunities</p></div>
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">PROPOSALS OUT FOR REVIEW</span><MailCheck size={18} /><span className="sr-only">{proposalCount} proposal stage records</span></div><div className="mt-3 text-2xl font-medium tabular-nums text-fg">{proposalCount}</div><p className="mt-1 text-[11px] text-muted">Opportunities currently in proposal stage</p></div>
      </section>

      <section className="mb-4 rounded-card border border-line bg-panel p-3" aria-label="Pipeline filters">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-[420px]">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <label htmlFor="lead-search" className="sr-only">Search lead pipeline</label>
            <input id="lead-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, contact, owner, brief, or ID..." className="h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none" />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <CustomSelect value={owner} onChange={setOwner} options={[{ value: 'all', label: 'All owners' }, ...ownerOptions.map((value) => ({ value, label: value }))]} aria-label="Lead owner" className="min-w-[132px]" triggerClassName="w-full" />
            <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-[11px] font-medium text-muted hover:bg-panel hover:text-fg"><X size={13} /> Reset</button>
          </div>
        </div>
        <div className="mt-3 flex min-w-0 gap-1 overflow-x-auto custom-scrollbar pb-1" role="tablist" aria-label="Pipeline stages">
          {stageOrder.map((value) => (
            <button key={value} type="button" role="tab" aria-selected={stage === value} onClick={() => { setStage(value); setPage(1); }} className={`inline-flex min-h-9 shrink-0 items-center rounded-control border px-3 text-[11px] font-medium transition-colors ${stage === value ? 'border-line bg-line text-fg' : 'border-transparent text-muted hover:bg-bg hover:text-fg'}`}>
              {value === 'all' ? 'All leads' : stageMeta[value].label} ({stageCounts[value]})
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-card border border-line bg-panel" aria-label="Lead pipeline table">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1220px] border-collapse text-left">
            <thead className="bg-bg">
              <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
                <th className="px-5 py-2.5"><SortButton label="Prospect / company" sortKey="company" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                <th className="px-4 py-2.5 text-right"><SortButton label="Annual value" sortKey="annualValue" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                <th className="px-4 py-2.5"><SortButton label="Stage" sortKey="stage" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                <th className="px-4 py-2.5"><SortButton label="Lead owner" sortKey="owner" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                <th className="px-4 py-2.5"><SortButton label="Win probability" sortKey="probability" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                <th className="px-4 py-2.5"><SortButton label="Next action" sortKey="dueAt" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                <th className="px-5 py-2.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: pageSize }).map((_, index) => (
                    <tr key={index} className="border-b border-line last:border-0">
                      {Array.from({ length: 7 }).map((__, cell) => <td key={cell} className="px-4 py-4"><div className="h-3 w-full max-w-28 animate-pulse rounded-badge bg-line" /></td>)}
                    </tr>
                  ))
                : visible.length
                  ? visible.map((item) => (
                      <tr key={item.id} className="border-b border-line last:border-0 transition-colors hover:bg-bg/70">
                        <td className="px-5 py-3"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-[11px] font-semibold text-fg">{item.initials}</div><div className="min-w-0"><div className="truncate text-xs font-semibold leading-snug text-fg">{item.company}</div><div className="mt-0.5 text-[10px] text-muted">{item.brief} · {item.location}</div></div></div></td>
                        <td className="px-4 py-3 text-right tabular-nums"><div className="text-xs font-medium text-fg">{compactMoney(item.annualValue)}</div><div className="mt-0.5 text-[10px] text-muted">{money(item.monthlyValue)}/mo</div></td>
                        <td className="px-4 py-3"><span className="inline-flex min-h-6 items-center gap-1.5 rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] font-medium text-muted"><span className={`h-1.5 w-1.5 rounded-full ${stageMeta[item.stage].dot}`} />{stageMeta[item.stage].label}</span></td>
                        <td className="px-4 py-3"><div className="flex items-center gap-1.5 whitespace-nowrap"><div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-[9px] font-semibold text-fg">{item.ownerInitials}</div><span className="text-xs text-fg">{item.owner}</span></div><div className="mt-0.5 text-[10px] text-muted">{item.ownerRole}</div></td>
                        <td className="px-4 py-3 tabular-nums"><div className="flex items-center gap-2"><span className="h-1.5 w-16 overflow-hidden rounded-full bg-line/70"><span className="block h-1.5 rounded-full bg-accent" style={{ width: Math.min(100, item.probability) + '%' }} /></span><span className="text-xs font-medium text-fg">{item.probability}%</span></div></td>
                        <td className="px-4 py-3"><div className="text-xs font-medium text-fg">{item.nextAction}</div><div className={`mt-0.5 text-[10px] ${item.urgent ? 'font-medium text-accent-text' : new Date(item.dueAt).getTime() < Date.now() ? 'text-danger' : 'text-muted'}`}>{dueLabel(item.dueAt, item.urgent)}</div></td>
                        <td className="px-5 py-3 text-right"><div className="flex flex-wrap items-center justify-end gap-1.5"><button type="button" onClick={() => setSelectedLead(item)} className="inline-flex min-h-9 items-center rounded-control border border-line bg-bg px-3 text-[11px] font-medium text-fg hover:bg-panel">View deal</button><button type="button" onClick={() => setMessage(`Proposal creation is not connected for ${item.company} yet.`)} className={`inline-flex min-h-9 items-center rounded-control border px-3 text-[11px] font-medium transition-colors ${item.stage === 'ready-to-sign' ? 'border-accent bg-accent/10 text-accent-text hover:bg-accent hover:text-white' : 'border-line bg-bg text-fg hover:bg-panel'}`}>Create proposal</button></div></td>
                      </tr>
                    ))
                  : (
                    <tr><td colSpan={7} className="px-4 py-14 text-center"><Search size={18} className="mx-auto text-muted" /><p className="mt-3 text-sm font-medium text-fg">No matching pipeline accounts.</p><p className="mt-1 text-xs text-muted">Adjust the search or clear the active filters.</p><button type="button" onClick={reset} className="mt-4 inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-bg">Reset filters</button></td></tr>
                  )}
            </tbody>
          </table>
        </div>

        {!isLoading && (
          <div className="flex flex-col gap-3 border-t border-line bg-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted">Showing <span className="font-medium tabular-nums text-fg">{filtered.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filtered.length)}</span> of <span className="font-medium tabular-nums text-fg">{filtered.length}</span> pipeline accounts</p>
            <div className="flex items-center gap-1.5"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={14} /></button><span className="min-w-16 text-center text-[11px] font-medium tabular-nums text-fg">{page} / {pageCount}</span><button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page === pageCount} className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-line bg-panel text-fg hover:bg-bg disabled:opacity-40" aria-label="Next page"><ChevronRight size={14} /></button></div>
          </div>
        )}
      </section>

      <section className="mt-3 grid grid-cols-1 gap-3 text-[11px] text-muted md:grid-cols-4" aria-label="Pipeline summary">
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-3"><CircleDollarSign size={14} className="text-accent-text" /><span>Open annual value: <strong className="text-fg">{compactMoney(pipelineValue)}</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-3"><Target size={14} className="text-info" /><span>Weighted probability: <strong className="text-fg">{weightedProbability.toFixed(1)}%</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-3"><Clock3 size={14} className="text-warning" /><span>Contract review: <strong className="text-fg">{stageCounts.contract}</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-3"><CheckCircle2 size={14} className="text-success" /><span>Ready to sign: <strong className="text-fg">{stageCounts['ready-to-sign']}</strong></span></div>
      </section>

      <Modal open={!!selectedLead} onClose={() => setSelectedLead(null)} size="md" title="Lead account" description={selectedLead ? `${selectedLead.company} · ${selectedLead.id}` : undefined} footer={<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setSelectedLead(null)}>Close</Button><Button type="button" variant="primary" onClick={() => { if (selectedLead) setMessage(`Proposal creation is not connected for ${selectedLead.company} yet.`); setSelectedLead(null); }} icon={<FileText size={14} />}>Create proposal</Button></div>}>
        {selectedLead && <div className="space-y-4"><div className="flex items-center gap-3 rounded-card border border-line bg-bg p-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-xs font-semibold text-fg">{selectedLead.initials}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-fg">{selectedLead.company}</p><p className="mt-0.5 text-xs text-muted">{selectedLead.contact} · {selectedLead.location}</p></div></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-card border border-line bg-panel p-3"><span className="text-[10px] uppercase tracking-wider text-muted">Annual value</span><div className="mt-1 text-sm font-semibold tabular-nums text-fg">{money(selectedLead.annualValue)}</div></div><div className="rounded-card border border-line bg-panel p-3"><span className="text-[10px] uppercase tracking-wider text-muted">Win probability</span><div className="mt-1 text-sm font-semibold tabular-nums text-fg">{selectedLead.probability}%</div></div><div className="rounded-card border border-line bg-panel p-3"><span className="text-[10px] uppercase tracking-wider text-muted">Stage</span><div className="mt-1 text-sm font-semibold text-fg">{stageMeta[selectedLead.stage].label}</div></div></div><div className="rounded-card border border-line bg-panel p-3"><span className="text-[10px] uppercase tracking-wider text-muted">Next action</span><p className="mt-1 text-sm font-medium text-fg">{selectedLead.nextAction}</p><p className="mt-1 text-xs text-muted">{dueLabel(selectedLead.dueAt, selectedLead.urgent)}</p></div><div className="text-xs text-muted">Owner: <span className="font-medium text-fg">{selectedLead.owner}</span> · {selectedLead.ownerRole}</div></div>}
      </Modal>

      <Modal open={isAdding} onClose={() => setIsAdding(false)} size="sm" title="Add lead account" description="Start a new opportunity in Discovery & Audit." footer={<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button><Button type="button" variant="primary" onClick={addLead} icon={<Plus size={14} />}>Add lead</Button></div>}>
        <div className="space-y-4"><div><label htmlFor="lead-company" className="mb-1.5 block text-xs font-medium text-fg">Company</label><input id="lead-company" value={newCompany} onChange={(event) => setNewCompany(event.target.value)} placeholder="Company name" className="h-9 w-full rounded-control border border-line bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none" /></div><div><label htmlFor="lead-contact" className="mb-1.5 block text-xs font-medium text-fg">Contact person</label><input id="lead-contact" value={newContact} onChange={(event) => setNewContact(event.target.value)} placeholder="Contact person" className="h-9 w-full rounded-control border border-line bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none" /></div><div className="rounded-card border border-line bg-bg p-3 text-xs text-muted">New opportunities start in <span className="font-medium text-fg">Discovery &amp; Audit</span> with a 25% initial probability.</div></div>
      </Modal>
    </div>
  );
};

export default AdminClientLeadAccounts;