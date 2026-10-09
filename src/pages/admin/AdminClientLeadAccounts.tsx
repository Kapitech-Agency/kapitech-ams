import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Eye,
  FileText,
  MailCheck,
  Plus,
  Search,
  Target,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';
import { AdminFilterBar, AdminModuleHeader, AdminPageShell, AdminSectionTabs, AdminStatusBadge, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';
import { api } from '../../lib/apiClient';
import { isSlugFixtureMode } from '../../lib/runtimeMode';

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
const compactMoney = (value: number) => value >= 1000000000 ? 'Rp ' + (value / 1000000000).toFixed(2) + 'B' : value >= 1000000 ? 'Rp ' + (value / 1000000).toFixed(value >= 10000000 ? 0 : 1) + 'M' : money(value);

const dueLabel = (iso: string, urgent?: boolean) => {
  if (!iso) return 'Not scheduled';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';
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
  const date = new Date(item.dueAt).getTime();
  return Number.isFinite(date) ? date : Number.MAX_SAFE_INTEGER;
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
  const navigate = useNavigate();
  const fixtureMode = isSlugFixtureMode();
  const [records, setRecords] = useState<Lead[]>(() => fixtureMode ? seed : []);
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
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (fixtureMode) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const loadDeals = async () => {
      setIsLoading(true);
      try {
        const response = await api.crm.getDeals();
        if (!response.success || !Array.isArray(response.data?.deals)) {
          if (mounted) {
            setRecords([]);
            setMessage(response.error || 'CRM opportunities could not be loaded.');
          }
          return;
        }

        // This workspace shows open CRM opportunities only; closed deals remain in CRM history.
        const openDeals = response.data.deals
          .filter((deal: any) => !['won', 'lost', 'closed_won', 'closed_lost'].includes(String(deal.stage || '').toLowerCase()))
          .map((deal: any): Lead => {
            const stageValue = String(deal.stage || 'new').toLowerCase();
            const stage: Stage = stageValue === 'proposal'
              ? 'proposal'
              : stageValue === 'negotiation'
                ? 'contract'
                : 'discovery';
            const ownerName = String(deal.owner || deal.assignedTo || 'Unassigned');
            const ownerInitials = ownerName.split(/\s+/).filter(Boolean).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() || 'UN';
            const companyName = String(deal.company || deal.clientName || 'Unnamed opportunity');
            const probability = Number(deal.probability ?? 0);
            return {
              id: String(deal.id),
              initials: companyName.split(/\s+/).filter(Boolean).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() || 'CL',
              company: companyName,
              contact: String(deal.clientName || ''),
              owner: ownerName,
              ownerRole: 'CRM owner',
              ownerInitials,
              brief: String(deal.title || deal.servicePillar || deal.notes || 'CRM opportunity'),
              location: String(deal.location || 'Not recorded'),
              monthlyValue: Number(deal.monthlyValue) || 0,
              annualValue: Number(deal.value ?? deal.dealValue) || 0,
              stage,
              probability: Math.round(Math.max(0, Math.min(1, probability > 1 ? probability / 100 : probability)) * 100),
              nextAction: String(deal.nextAction || 'Follow up on opportunity'),
              dueAt: String(deal.expectedCloseDate || '')
            };
          });

        if (mounted) {
          setRecords(openDeals);
          setMessage(null);
        }
      } catch (error) {
        if (mounted) {
          setRecords([]);
          setMessage(error instanceof Error ? error.message : 'CRM opportunities could not be loaded.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadDeals();
    return () => { mounted = false; };
  }, [fixtureMode]);

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
      ['CRM Deal ID', 'Company', 'Contact', 'Opportunity', 'Location', 'Deal Value', 'Stage', 'Probability', 'Owner', 'Next Action', 'Expected Close'],
      ...filtered.map((item) => [item.id, item.company, item.contact, item.brief, item.location, item.annualValue, stageMeta[item.stage].label, item.probability + '%', item.owner, item.nextAction, item.dueAt])
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

  const addLead = async () => {
    const company = newCompany.trim();
    if (!company) {
      setMessage('Company name is required.');
      return;
    }
    if (!fixtureMode) {
      try {
        const response = await api.crm.createDeal({
          title: `New opportunity: ${company}`,
          clientName: newContact.trim() || company,
          company,
          value: 0,
          stage: 'new',
          probability: 25,
          priority: 'medium',
          source: 'Internal',
          notes: 'Created from the Client Lead Accounts workspace.'
        });
        if (!response.success || !response.data?.deal) {
          setMessage(response.error || 'The opportunity could not be saved to CRM.');
          return;
        }
        const deal = response.data.deal;
        const ownerName = String(deal.owner || deal.assignedTo || 'Unassigned');
        const newRecord: Lead = {
          id: String(deal.id),
          initials: company.split(/\s+/).filter(Boolean).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() || 'CL',
          company: String(deal.company || company),
          contact: String(deal.clientName || newContact.trim() || company),
          owner: ownerName,
          ownerRole: 'CRM owner',
          ownerInitials: ownerName.split(/\s+/).filter(Boolean).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() || 'UN',
          brief: String(deal.title || `New opportunity: ${company}`),
          location: String(deal.location || 'Not recorded'),
          monthlyValue: 0,
          annualValue: Number(deal.value) || 0,
          stage: 'discovery',
          probability: 25,
          nextAction: 'Follow up on opportunity',
          dueAt: String(deal.expectedCloseDate || '')
        };
        setRecords((current) => [newRecord, ...current]);
        setNewCompany('');
        setNewContact('');
        setIsAdding(false);
        setPage(1);
        setMessage('Opportunity saved to CRM. Add a deal value and expected close date in CRM when ready.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'The opportunity could not be saved to CRM.');
      }
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
    <AdminPageShell featureSlug="client-lead-accounts-module" className="ams-clients-module">
      <AdminModuleHeader slug="client-lead-accounts-header"
        className="mb-0"
        title="Lead Accounts & Pipeline"
        description="Open CRM opportunities, qualification stages, deal values, and expected close dates."
        eyebrow={<AdminStatusBadge tone="info">{records.length} open opportunities</AdminStatusBadge>}
        actions={(
          <>
            <Button type="button" variant="secondary" onClick={exportPipeline} icon={<ArrowDown size={14} />}>Export Pipeline</Button>
            <Button type="button" variant="primary" onClick={() => setIsAdding(true)} icon={<Plus size={14} />}>Add Lead Account</Button>
          </>
        )}
      />

      <div className="min-[900px]:hidden min-w-0">
        <AdminSectionTabs
          ariaLabel="Clients sections"
          activeKey="lead-accounts"
          items={[
            { key: 'all-clients', label: 'All Clients', to: '/admin/clients' },
            { key: 'retainers', label: 'Retainers', to: '/admin/clients/retainers' },
            { key: 'sla-monitoring', label: 'SLA Monitoring', to: '/admin/clients/sla-monitoring' },
            { key: 'lead-accounts', label: 'Lead Accounts', to: '/admin/clients/lead-accounts' },
          ]}
        />
      </div>

      {message && (
        <div className="flex items-center justify-between rounded-card border border-line bg-panel px-3 py-2.5 text-xs text-fg" role="status" aria-live="polite">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg" aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}

      <section data-ams-feature-slug="lead-accounts-kpis" data-ams-slug="lead-accounts-kpis" className="grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Pipeline metrics">
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">OPEN DEAL VALUE</span><CircleDollarSign size={18} /></div><div className="mt-3 text-2xl font-medium tabular-nums text-fg">{compactMoney(pipelineValue)}</div><p className="mt-1 text-[11px] text-muted">Combined value of open CRM opportunities</p></div>
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">WEIGHTED WIN PROBABILITY</span><Target size={18} /></div><div className="mt-3 text-2xl font-medium tabular-nums text-fg">{weightedProbability.toFixed(1)}%</div><p className="mt-1 text-[11px] text-muted">Value-weighted across {records.length} opportunities</p></div>
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">DEALS IN PROPOSAL</span><MailCheck size={18} /><span className="sr-only">{proposalCount} proposal stage records</span></div><div className="mt-3 text-2xl font-medium tabular-nums text-fg">{proposalCount}</div><p className="mt-1 text-[11px] text-muted">Opportunities currently in proposal stage</p></div>
      </section>

      <AdminFilterBar slug="lead-accounts-filters"
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search company, contact, owner, brief, or ID..."
        searchLabel="Search lead pipeline"
        actions={(
          <>
            <CustomSelect value={owner} onChange={setOwner} options={[{ value: 'all', label: 'All owners' }, ...ownerOptions.map((value) => ({ value, label: value }))]} aria-label="Lead owner" className="min-w-[132px]" triggerClassName="w-full" />
            <Button type="button" variant="secondary" icon={<X size={13} />} onClick={reset}>Reset filters</Button>
          </>
        )}
        footer={(
          <div className="flex min-w-0 gap-1 overflow-x-auto custom-scrollbar" role="tablist" aria-label="Pipeline stages">
          {stageOrder.map((value) => (
            <button key={value} type="button" role="tab" aria-selected={stage === value} onClick={() => { setStage(value); setPage(1); }} className={`inline-flex min-h-9 shrink-0 items-center rounded-control border px-3 text-[11px] font-medium transition-colors ${stage === value ? 'border-line bg-line text-fg' : 'border-transparent text-muted hover:bg-bg hover:text-fg'}`}>
              {value === 'all' ? 'All leads' : stageMeta[value].label} ({stageCounts[value]})
            </button>
          ))}
          </div>
        )}
      />

      <section data-ams-feature-slug="lead-accounts-directory" data-ams-slug="lead-accounts-directory" className="ams-client-table-shell overflow-hidden rounded-card border border-line bg-panel" aria-label="Lead pipeline table">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1220px] border-collapse text-left">
            <thead className="bg-bg">
              <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
                <th className="px-5 py-2.5"><SortButton label="Prospect / company" sortKey="company" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                <th className="px-4 py-2.5 text-right"><SortButton label="Deal value" sortKey="annualValue" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                <th className="px-4 py-2.5"><SortButton label="Stage" sortKey="stage" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                <th className="px-4 py-2.5"><SortButton label="Lead owner" sortKey="owner" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                <th className="px-4 py-2.5"><SortButton label="Win probability" sortKey="probability" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                <th className="px-4 py-2.5"><SortButton label="Next action" sortKey="dueAt" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                <th className="px-5 py-2.5 text-right">Actions</th>
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
                      <tr key={item.id} data-ams-slug={'client-lead-' + item.id.toLowerCase()} className="border-b border-line last:border-0 transition-colors hover:bg-bg/70">
                        <td className="px-5 py-3"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-[11px] font-semibold text-fg">{item.initials}</div><div className="min-w-0"><div className="truncate text-xs font-semibold leading-snug text-fg">{item.company}</div><div className="mt-0.5 text-[10px] text-muted">{item.brief} · {item.location}</div></div></div></td>
                        <td className="px-4 py-3 text-right tabular-nums"><div className="text-xs font-medium text-fg">{compactMoney(item.annualValue)}</div><div className="mt-0.5 text-[10px] text-muted">{item.monthlyValue > 0 ? money(item.monthlyValue) + '/mo' : 'CRM deal value'}</div></td>
                        <td className="px-4 py-3"><span className="inline-flex min-h-6 items-center gap-1.5 rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] font-medium text-muted"><span className={`h-1.5 w-1.5 rounded-full ${stageMeta[item.stage].dot}`} />{stageMeta[item.stage].label}</span></td>
                        <td className="px-4 py-3"><ProfileIdentity profile={{ name: item.owner, role: item.ownerRole || undefined, contextLabel: 'Lead owner' }} size="sm" /></td>
                        <td className="px-4 py-3 tabular-nums"><div className="flex items-center gap-2"><span className="h-1.5 w-16 overflow-hidden rounded-full bg-line/70"><span className="block h-1.5 rounded-full bg-accent" style={{ width: Math.min(100, item.probability) + '%' }} /></span><span className="text-xs font-medium text-fg">{item.probability}%</span></div></td>
                        <td className="px-4 py-3"><div className="text-xs font-medium text-fg">{item.nextAction}</div><div className={`mt-0.5 text-[10px] ${item.urgent ? 'font-medium text-accent-text' : new Date(item.dueAt).getTime() < Date.now() ? 'text-danger' : 'text-muted'}`}>{dueLabel(item.dueAt, item.urgent)}</div></td>
                        <td className="px-5 py-3 text-right"><div className="ams-table-actions flex items-center justify-end gap-1">
                          <button type="button" onClick={() => setSelectedLead(item)} aria-label={`View deal for ${item.company}`} title="View deal" className="inline-flex h-10 w-10 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Eye size={16} aria-hidden="true" /></button>
                          <button type="button" onClick={() => navigate('/admin/proposals')} aria-label={`Open proposals for ${item.company}`} title="Open Proposals" className={`inline-flex h-10 w-10 items-center justify-center rounded-control transition-colors ${item.stage === 'ready-to-sign' ? 'bg-accent/10 text-accent-text hover:bg-accent/20' : 'text-muted hover:bg-bg hover:text-fg'} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}><Plus size={16} aria-hidden="true" /></button>
                        </div></td>
                      </tr>
                    ))
                  : (
                    <tr><td colSpan={7} className="px-4 py-14 text-center"><Search size={18} className="mx-auto text-muted" /><p className="mt-3 text-sm font-medium text-fg">No matching pipeline accounts.</p><p className="mt-1 text-xs text-muted">Adjust the search or clear the active filters.</p><button type="button" onClick={reset} className="mt-4 inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-bg">Reset filters</button></td></tr>
                  )}
            </tbody>
          </table>
        </div>

        {!isLoading && (
          <AdminTablePagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="pipeline accounts" slug="lead-accounts-pagination" />
        )}
      </section>

      <section data-ams-feature-slug="lead-accounts-summary" data-ams-slug="lead-accounts-summary" className="grid grid-cols-1 gap-3 text-[11px] text-muted md:grid-cols-4" aria-label="Pipeline summary">
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-4"><CircleDollarSign size={14} className="text-accent-text" /><span>Open annual value: <strong className="text-fg">{compactMoney(pipelineValue)}</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-4"><Target size={14} className="text-info" /><span>Weighted probability: <strong className="text-fg">{weightedProbability.toFixed(1)}%</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-4"><Clock3 size={14} className="text-warning" /><span>Contract review: <strong className="text-fg">{stageCounts.contract}</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-4"><CheckCircle2 size={14} className="text-success" /><span>Ready to sign: <strong className="text-fg">{stageCounts['ready-to-sign']}</strong></span></div>
      </section>

      <Modal slug="lead-account-detail-modal" open={!!selectedLead} onClose={() => setSelectedLead(null)} size="md" title="Lead account" description={selectedLead ? `${selectedLead.company} · ${selectedLead.id}` : undefined} footer={<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setSelectedLead(null)}>Close</Button><Button type="button" variant="primary" onClick={() => { setSelectedLead(null); navigate('/admin/proposals'); }} icon={<FileText size={14} />}>Open Proposals</Button></div>}>
        {selectedLead && <div className="space-y-4"><div className="flex items-center gap-3 rounded-card border border-line bg-bg p-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-xs font-semibold text-fg">{selectedLead.initials}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-fg">{selectedLead.company}</p><div className="mt-0.5 flex items-center gap-2"><ProfileIdentity profile={{ name: selectedLead.contact, role: undefined, contextLabel: selectedLead.company }} size="sm" showRole={false} /><span className="text-xs text-muted">· {selectedLead.location}</span></div></div></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-card border border-line bg-panel p-4"><span className="text-[10px] uppercase tracking-wider text-muted">Deal value</span><div className="mt-1 text-sm font-semibold tabular-nums text-fg">{money(selectedLead.annualValue)}</div></div><div className="rounded-card border border-line bg-panel p-4"><span className="text-[10px] uppercase tracking-wider text-muted">Win probability</span><div className="mt-1 text-sm font-semibold tabular-nums text-fg">{selectedLead.probability}%</div></div><div className="rounded-card border border-line bg-panel p-4"><span className="text-[10px] uppercase tracking-wider text-muted">Stage</span><div className="mt-1 text-sm font-semibold text-fg">{stageMeta[selectedLead.stage].label}</div></div></div><div className="rounded-card border border-line bg-panel p-4"><span className="text-[10px] uppercase tracking-wider text-muted">Next action</span><p className="mt-1 text-sm font-medium text-fg">{selectedLead.nextAction}</p><p className="mt-1 text-xs text-muted">{dueLabel(selectedLead.dueAt, selectedLead.urgent)}</p></div><div className="text-xs text-muted flex items-center gap-2"><span>Owner:</span><ProfileIdentity profile={{ name: selectedLead.owner, role: selectedLead.ownerRole || undefined, contextLabel: 'Lead owner' }} size="sm" showRole={false} /></div></div>}
      </Modal>

      <Drawer slug="lead-account-create-drawer" open={isAdding} onClose={() => setIsAdding(false)} size="sm" title="Add lead account" description="Start a new opportunity in Discovery & Audit." footer={<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button><Button type="button" variant="primary" onClick={addLead} icon={<Plus size={14} />}>Add lead</Button></div>}>
        <div className="space-y-4"><div><label htmlFor="lead-company" className="mb-1.5 block text-xs font-medium text-fg">Company</label><input id="lead-company" value={newCompany} onChange={(event) => setNewCompany(event.target.value)} placeholder="Company name" className="h-9 w-full rounded-control border border-line bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none" /></div><div><label htmlFor="lead-contact" className="mb-1.5 block text-xs font-medium text-fg">Contact person</label><input id="lead-contact" value={newContact} onChange={(event) => setNewContact(event.target.value)} placeholder="Contact person" className="h-9 w-full rounded-control border border-line bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none" /></div><div className="rounded-card border border-line bg-bg p-4 text-xs text-muted">New opportunities start in <span className="font-medium text-fg">Discovery &amp; Audit</span> with a 25% initial probability.</div></div>
      </Drawer>
    </AdminPageShell>
  );
};

export default AdminClientLeadAccounts;