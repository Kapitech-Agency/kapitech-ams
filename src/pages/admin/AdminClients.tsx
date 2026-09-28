import React, { useEffect, useMemo, useState } from 'react';
// Shared module chrome renders the canonical ams-dashboard-header primitive.
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleDashed,
  Download,
  Eye,
  Globe,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  TrendingUp,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';
import { AgencyClient, createClientSlug, normalizeAgencyClient } from '../../lib/clientStore';
import { formatAmount, getActiveCurrency, CURRENCY_EVENT, CurrencyCode } from '../../lib/currency';
import { useLanguage } from '../../lib/LanguageContext';
import { hasAdminPermission } from '../../lib/adminAuth';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';


type SortKey = 'name' | 'company' | 'industry' | 'status' | 'updatedAt' | 'projectsCount' | 'totalSpend';
type SortDirection = 'asc' | 'desc';
type SlaFilter = 'all' | 'healthy' | 'near' | 'over' | 'not-configured';
type StatusScope = 'all' | 'active' | 'lead' | 'at-risk';

const STATUS_OPTIONS: Array<{ value: AgencyClient['status']; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'lead', label: 'Lead' },
  { value: 'inactive', label: 'Inactive' }
];

const statusMeta: Record<AgencyClient['status'], { label: string; tone: 'success' | 'info' | 'warning' | 'neutral'; icon: React.ReactNode }> = {
  active: { label: 'Active', tone: 'success', icon: <Activity size={12} aria-hidden="true" /> },
  completed: { label: 'Completed', tone: 'info', icon: <Check size={12} aria-hidden="true" /> },
  lead: { label: 'Lead', tone: 'warning', icon: <Users size={12} aria-hidden="true" /> },
  inactive: { label: 'Inactive', tone: 'neutral', icon: <X size={12} aria-hidden="true" /> }
};

const statusClasses: Record<'success' | 'info' | 'warning' | 'neutral', string> = {
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  neutral: 'bg-bg text-muted'
};

const slaClasses = {
  success: 'border-success/20 bg-success/10 text-success',
  warning: 'border-warning/20 bg-warning/10 text-warning',
  danger: 'border-danger/20 bg-danger/10 text-danger',
  neutral: 'border-line bg-bg text-muted'
} as const;


const formatDate = (value: string, language: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

export const AdminClients: React.FC = () => {
  const canManageClients = hasAdminPermission('canManageClients');
  const { t, language } = useLanguage();
  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AgencyClient['status']>('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState<SlaFilter>('all');
  const [statusScope, setStatusScope] = useState<StatusScope>('all');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'danger'>('success');

  const [selectedClient, setSelectedClient] = useState<AgencyClient | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<AgencyClient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgencyClient | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [clientStatus, setClientStatus] = useState<AgencyClient['status']>('active');
  const [totalSpend, setTotalSpend] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  const [slaDailyBudget, setSlaDailyBudget] = useState(0);
  const [currentDailySpend, setCurrentDailySpend] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (message: string, tone: 'success' | 'danger' = 'success') => {
    setStatusTone(tone);
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.clients.getAll();
      if (res.success && Array.isArray(res.data?.clients)) {
        setClients((res.data.clients as AgencyClient[]).map(normalizeAgencyClient));
      } else {
        setErrorMessage(language === 'id' ? 'Daftar klien gagal dimuat.' : 'Client directory could not be loaded.');
      }
    } catch {
      setErrorMessage(language === 'id' ? 'Daftar klien gagal dimuat.' : 'Client directory could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const handleCurrencyChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ currency?: CurrencyCode }>;
      setCurrency(customEvent.detail?.currency || getActiveCurrency());
    };
    window.addEventListener(CURRENCY_EVENT, handleCurrencyChange);
    return () => window.removeEventListener(CURRENCY_EVENT, handleCurrencyChange);
  }, [language]);

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const result = clients.filter((client) => {
      const searchable = [
        client.name,
        client.company,
        client.email,
        client.phone,
        client.id,
        client.industry,
        client.location
      ].filter(Boolean).join(' ').toLowerCase();

      if (query && !searchable.includes(query)) return false;
      if (statusFilter !== 'all' && client.status !== statusFilter) return false;
      if (industryFilter !== 'all' && client.industry !== industryFilter) return false;

      const budget = Number(client.slaDailyAdSpendBudget || 0);
      const spend = Number(client.currentDailyAdSpend || 0);
      const slaState =
        budget <= 0
          ? 'not-configured'
          : spend > budget
            ? 'over'
            : spend / budget >= 0.9
              ? 'near'
              : 'healthy';

      if (slaFilter !== 'all' && slaState !== slaFilter) return false;
      if (statusScope === 'active' && client.status !== 'active') return false;
      if (statusScope === 'lead' && client.status !== 'lead') return false;
      if (statusScope === 'at-risk' && !['near', 'over'].includes(slaState)) return false;

      return true;
    });

    return [...result].sort((a, b) => {
      let comparison = 0;

      if (sortKey === 'projectsCount') {
        comparison = Number(a.projectsCount || 0) - Number(b.projectsCount || 0);
      } else if (sortKey === 'totalSpend') {
        comparison = Number(a.totalSpend || 0) - Number(b.totalSpend || 0);
      } else if (sortKey === 'updatedAt') {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else {
        comparison = String(a[sortKey] || '').localeCompare(
          String(b[sortKey] || ''),
          undefined,
          { sensitivity: 'base' }
        );
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [
    clients,
    searchQuery,
    statusFilter,
    industryFilter,
    slaFilter,
    statusScope,
    sortKey,
    sortDirection
  ]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, industryFilter, slaFilter, statusScope, sortKey, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const paginatedClients = useMemo(
    () => filteredClients.slice((page - 1) * pageSize, page * pageSize),
    [filteredClients, page]
  );

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const overBudgetClients = useMemo(
    () => clients.filter((client) =>
      Boolean(client.slaDailyAdSpendBudget && client.currentDailyAdSpend &&
        client.currentDailyAdSpend > client.slaDailyAdSpendBudget)
    ),
    [clients]
  );

  const clientMetrics = useMemo(() => {
    const configured = clients.filter((client) => Number(client.slaDailyAdSpendBudget || 0) > 0);
    const healthy = configured.filter((client) => {
      const budget = Number(client.slaDailyAdSpendBudget || 0);
      const spend = Number(client.currentDailyAdSpend || 0);
      return spend / budget < 0.9;
    }).length;

    return {
      total: clients.length,
      active: clients.filter((client) => client.status === 'active').length,
      leads: clients.filter((client) => client.status === 'lead').length,
      overBudget: clients.filter((client) => {
        const budget = Number(client.slaDailyAdSpendBudget || 0);
        const spend = Number(client.currentDailyAdSpend || 0);
        return budget > 0 && spend > budget;
      }).length,
      atRisk: clients.filter((client) => {
        const budget = Number(client.slaDailyAdSpendBudget || 0);
        const spend = Number(client.currentDailyAdSpend || 0);
        return budget > 0 && spend / budget >= 0.9;
      }).length,
      configuredSla: configured.length,
      slaCompliance: configured.length ? Math.round((healthy / configured.length) * 1000) / 10 : null,
      totalBilled: clients.reduce((sum, client) => sum + Number(client.totalSpend || 0), 0)
    };
  }, [clients]);

  const openCreate = () => {
    setEditingClient(null);
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setLocation('');
    setIndustry('');
    setClientStatus('active');
    setTotalSpend(0);
    setProjectsCount(0);
    setRole('');
    setNotes('');
    setSlaDailyBudget(0);
    setCurrentDailySpend(0);
    setFormError(null);
    setIsClientModalOpen(true);
  };

  const openEdit = (client: AgencyClient) => {
    setEditingClient(client);
    setName(client.name);
    setCompany(client.company);
    setEmail(client.email);
    setPhone(client.phone);
    setWebsite(client.website || '');
    setLocation(client.location);
    setIndustry(client.industry);
    setClientStatus(client.status);
    setTotalSpend(client.totalSpend || 0);
    setProjectsCount(client.projectsCount || 0);
    setRole(client.contactPersonRole || '');
    setNotes(client.notes || '');
    setSlaDailyBudget(client.slaDailyAdSpendBudget || 0);
    setCurrentDailySpend(client.currentDailyAdSpend || 0);
    setFormError(null);
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageClients) return;
    if (isSaving) return;

    if (!name.trim() || !company.trim()) {
      setFormError(language === 'id' ? 'Nama kontak dan perusahaan wajib diisi.' : 'Contact name and company are required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const clientId = editingClient?.id || 'client_' + Date.now().toString(36);
    const clientData: AgencyClient = {
      id: clientId,
      slug: editingClient?.slug || createClientSlug(company.trim(), clientId),
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      website: website.trim(),
      location: location.trim(),
      industry: industry.trim(),
      status: clientStatus,
      totalSpend: Number(totalSpend) || 0,
      projectsCount: Math.max(0, Number(projectsCount) || 0),
      contactPersonRole: role.trim(),
      notes: notes.trim(),
      slaDailyAdSpendBudget: Math.max(0, Number(slaDailyBudget) || 0),
      currentDailyAdSpend: Math.max(0, Number(currentDailySpend) || 0),
      createdAt: editingClient?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const res = editingClient
        ? await api.clients.update(clientData.id, clientData)
        : await api.clients.create(clientData);

      if (!res.success || !res.data?.client) {
        setFormError(res.error || (language === 'id' ? 'Klien gagal disimpan.' : 'Client could not be saved.'));
        return;
      }

      const savedClient = normalizeAgencyClient(res.data.client as AgencyClient);
      setClients((current) => editingClient
        ? current.map((item) => item.id === savedClient.id ? savedClient : item)
        : [savedClient, ...current]);
      setIsClientModalOpen(false);
      showToast(language === 'id' ? 'Klien berhasil disimpan.' : 'Client saved.');
    } catch {
      setFormError(language === 'id' ? 'Klien gagal disimpan.' : 'Client could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !canManageClients || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await api.clients.delete(deleteTarget.id);
      if (!res.success) {
        showToast(res.error || (language === 'id' ? 'Klien gagal dihapus.' : 'Client could not be deleted.'), 'danger');
        return;
      }
      setClients((current) => current.filter((client) => client.id !== deleteTarget.id));
      if (selectedClient?.id === deleteTarget.id) setSelectedClient(null);
      showToast(language === 'id' ? 'Klien dihapus.' : 'Client deleted.');
      setDeleteTarget(null);
    } catch {
      showToast(language === 'id' ? 'Klien gagal dihapus.' : 'Client could not be deleted.', 'danger');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection(key === 'updatedAt' ? 'desc' : 'asc');
    }
  };

  const handleExport = () => {
    const rows = [
      [
        'Client account',
        'Client ID',
        'Location',
        'Industry',
        'Status',
        'Contact',
        'Email',
        'Projects',
        'Lifetime billed value',
        'SLA budget',
        'Current daily spend'
      ],
      ...filteredClients.map((client) => [
        client.company,
        client.id,
        client.location,
        client.industry,
        client.status,
        client.name,
        client.email,
        client.projectsCount,
        client.totalSpend,
        client.slaDailyAdSpendBudget || 0,
        client.currentDailyAdSpend || 0
      ])
    ];

    const csv = rows
      .map((row) => row.map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = 'kapitech-client-directory.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);

    showToast(language === 'id' ? 'Direktori berhasil diekspor.' : 'Directory exported.');
  };

  return (
    <div className="min-h-full pb-8">
      <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.02em] text-fg">Clients & Key Accounts</h1>
            <span className="inline-flex items-center rounded-badge border border-line bg-panel px-2 py-0.5 text-[11px] font-medium text-fg">{clientMetrics.active} Accounts Active</span>
          </div>
          <p className="mt-1 text-[13px] leading-[18px] text-muted">Directory of enterprise client retainers, SLA tracking, allocated engineering pods, and billing run-rates.</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button type="button" variant="secondary" onClick={() => {
            const rows = filteredClients.map((client) => [client.id, client.name, client.company, client.industry || '', client.status, client.projectsCount, client.totalSpend || 0, client.location || ''].map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(','));
            const csv = ['Client ID,Contact,Company,Industry,Status,Projects,Total Spend,Location', ...rows].join('\\n');
            const blob = new Blob(['\\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'kapitech-client-directory.csv';
            anchor.click();
            URL.revokeObjectURL(url);
          }} icon={<ArrowDown size={14} aria-hidden="true" />}>Export Directory</Button>
          {canManageClients && (
            <Button type="button" variant="primary" onClick={openCreate} icon={<Plus size={14} aria-hidden="true" />}>New Client</Button>
          )}
        </div>
      </section>

      <section aria-label="Client metrics" className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-center justify-between"><span className="text-[11px] leading-[14px] text-muted">TOTAL ACTIVE CLIENTS</span><Users size={18} className="text-muted" aria-hidden="true" /></div>
          <div className="mt-3 text-[24px] font-medium leading-8 tracking-[-0.02em] tabular-nums text-fg">{isLoading ? '—' : clientMetrics.active}</div>
          <p className="mt-1 text-[11px] leading-[14px] text-muted">+{clientMetrics.leads} onboarding / lead accounts</p>
        </div>
        <div className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-center justify-between"><span className="text-[11px] leading-[14px] text-muted">MONTHLY RUN-RATE</span><TrendingUp size={18} className="text-success" aria-hidden="true" /></div>
          <div className="mt-3 text-[24px] font-medium leading-8 tracking-[-0.02em] tabular-nums text-fg">{isLoading ? '—' : new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(clients.reduce((sum, client) => sum + (Number(client.totalSpend) || 0), 0))}</div>
          <p className="mt-1 text-[11px] leading-[14px] text-success">Current client value</p>
        </div>
        <div className="rounded-card border border-line bg-panel p-4">
          <div className="flex items-center justify-between"><span className="text-[11px] leading-[14px] text-muted">AVG SLA COMPLIANCE</span><ShieldCheck size={18} className="text-muted" aria-hidden="true" /></div>
          <div className="mt-3 text-[24px] font-medium leading-8 tracking-[-0.02em] tabular-nums text-fg">{isLoading ? '—' : clientMetrics.total ? `${Math.max(0, Math.min(100, ((clientMetrics.total - clientMetrics.overBudget) / clientMetrics.total) * 100)).toFixed(1)}%` : '—'}</div>
          <p className="mt-1 text-[11px] leading-[14px] text-muted">Target: 99.0% SLA uptime</p>
        </div>
      </section>

      <section aria-label="Search and filter clients" className="mb-6 rounded-card border border-line bg-panel p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-[420px]">
            <Search size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <label htmlFor="client-directory-search" className="sr-only">Search client or project</label>
            <input id="client-directory-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by company, pod lead, or client ID..." className="h-8 min-h-8 w-full rounded-control border border-line bg-bg pl-8 pr-3 text-[12px] text-fg placeholder:text-muted focus:border-accent focus:outline-none" autoComplete="off" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CustomSelect value="all" onChange={() => undefined} options={[{ value: 'all', label: 'All industries' }]} aria-label="Filter by industry" className="min-w-[132px]" triggerClassName="w-full" />
            <CustomSelect value={statusFilter} onChange={(value) => setStatusFilter(value as 'all' | AgencyClient['status'])} options={[{ value: 'all', label: 'All tiers' }, ...STATUS_OPTIONS]} aria-label="Filter by client status" className="min-w-[120px]" triggerClassName="w-full" />
            <CustomSelect value="all" onChange={() => undefined} options={[{ value: 'all', label: 'All pods' }]} aria-label="Filter by pod" className="min-w-[110px]" triggerClassName="w-full" />
            <div className="flex items-center rounded-control border border-line bg-bg p-0.5">
              {[
                { id: 'active', label: 'Active' },
                { id: 'onboarding', label: 'Onboarding' },
                { id: 'at-risk', label: 'At-risk' }
              ].map((item) => (
                <button key={item.id} type="button" onClick={() => item.id === 'active' ? setStatusFilter('active') : item.id === 'onboarding' ? setStatusFilter('lead') : setStatusFilter('inactive')} className={`rounded-chip px-2.5 py-1 text-[11px] font-medium transition-colors ${((item.id === 'active' && statusFilter === 'active') || (item.id === 'onboarding' && statusFilter === 'lead') || (item.id === 'at-risk' && statusFilter === 'inactive')) ? 'bg-line text-fg' : 'text-muted hover:text-fg'}`}>{item.label}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Clients directory" className="overflow-hidden rounded-card border border-line bg-panel">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1120px] border-collapse text-left">
            <thead className="bg-bg"><tr className="border-b border-line text-[11px] leading-[14px] text-muted">
              <th className="px-4 py-2.5 font-medium">CLIENT ACCOUNT</th><th className="px-4 py-2.5 font-medium">INDUSTRY</th><th className="px-4 py-2.5 font-medium">CONTRACT TIER</th><th className="px-4 py-2.5 font-medium">ASSIGNED POD & LEAD</th><th className="px-4 py-2.5 text-right font-medium">MONTHLY RUN-RATE</th><th className="px-4 py-2.5 font-medium">SLA HEALTH</th><th className="px-4 py-2.5 text-right font-medium">ACTIONS</th>
            </tr></thead>
            <tbody className="divide-y divide-line text-[13px] leading-[18px]">
              {isLoading ? Array.from({ length: 6 }).map((_, index) => <tr key={index}>{Array.from({ length: 7 }).map((__, cell) => <td key={cell} className="px-4 py-3"><div className="h-3 w-24 animate-pulse rounded-badge bg-line" /></td>)}</tr>) : paginatedClients.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><Users size={20} className="mx-auto text-muted" aria-hidden="true" /><p className="mt-3 text-sm font-medium text-fg">{clients.length ? 'No matching clients.' : 'No clients yet.'}</p><p className="mt-1 text-xs text-muted">Try another search or add your first client.</p></td></tr>
              ) : paginatedClients.map((client) => {
                const budget = Number(client.slaDailyAdSpendBudget) || 0;
                const spend = Number(client.currentDailyAdSpend) || 0;
                const slaState = budget <= 0 ? 'neutral' : spend > budget ? 'danger' : spend >= budget * 0.9 ? 'warning' : 'success';
                const slaValue = budget > 0 ? Math.max(0, Math.min(100, (1 - spend / budget) * 100)) : null;
                return (
                  <tr key={client.id} className="transition-colors hover:bg-bg">
                    <td className="px-4 py-3"><button type="button" onClick={() => setSelectedClient(client)} className="block max-w-[250px] text-left"><span className="block truncate font-medium text-fg">{client.company}</span><span className="mt-0.5 block truncate text-[11px] text-muted tabular-nums">ID: {client.id} • {client.location || '—'}</span></button></td>
                    <td className="px-4 py-3 text-muted">{client.industry || '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center rounded-badge border px-2 py-0.5 text-[11px] font-medium ${client.projectsCount >= 5 ? 'border-accent/30 bg-accent/10 text-accent-text' : client.status === 'lead' ? 'border-info/20 bg-info/10 text-info' : 'border-line bg-bg text-fg'}`}>{client.projectsCount >= 5 ? 'Tier 1 Strategic' : client.status === 'lead' ? 'Project-based' : 'Retainer Core'}</span></td>
                    <td className="px-4 py-3"><div className="font-medium text-fg">{client.contactPersonRole || 'Pod Alpha'}</div><div className="text-[11px] text-muted">{client.name || 'Unassigned lead'}</div></td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-fg">{new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(client.totalSpend) || 0)}<span className="ml-1 text-[11px] font-normal text-muted">/mo</span></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${slaState === 'success' ? 'bg-success' : slaState === 'warning' ? 'bg-warning' : slaState === 'danger' ? 'bg-danger' : 'bg-line'}`} aria-hidden="true" /><span className={slaState === 'danger' ? 'font-medium text-danger tabular-nums' : 'text-fg tabular-nums'}>{slaValue === null ? 'Not configured' : `${slaValue.toFixed(1)}%`}</span></div></td>
                    <td className="px-4 py-3 text-right"><div className="inline-flex items-center gap-1.5"><button type="button" onClick={() => setSelectedClient(client)} className="rounded-control border border-line bg-panel px-2 py-1 text-[11px] font-medium text-fg transition-colors hover:bg-bg">View Profile</button>{canManageClients && <button type="button" onClick={() => openEdit(client)} className="rounded-control border border-line bg-panel px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-bg hover:text-fg">Manage</button>}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredClients.length > 0 && <div className="flex flex-col gap-3 border-t border-line bg-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] text-muted">Showing <span className="font-medium tabular-nums text-fg">{(page - 1) * pageSize + 1}</span> to <span className="font-medium tabular-nums text-fg">{Math.min(page * pageSize, filteredClients.length)}</span> of <span className="font-medium tabular-nums text-fg">{filteredClients.length}</span> records</p><div className="flex items-center gap-1.5"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-control border border-line bg-panel px-2.5 py-1 text-[11px] text-muted disabled:cursor-not-allowed disabled:opacity-40">Previous</button><div className="flex items-center gap-1 px-1">{Array.from({ length: Math.min(3, pageCount) }, (_, index) => index + 1).map((value) => <button key={value} type="button" onClick={() => setPage(value)} className={`h-6 w-6 rounded-chip text-[11px] tabular-nums ${page === value ? 'bg-line text-fg' : 'text-muted hover:bg-panel'}`}>{value}</button>)}{pageCount > 4 && <span className="px-0.5 text-muted">…</span>}{pageCount > 3 && <button type="button" onClick={() => setPage(pageCount)} className={`h-6 w-6 rounded-chip text-[11px] tabular-nums ${page === pageCount ? 'bg-line text-fg' : 'text-muted hover:bg-panel'}`}>{pageCount}</button>}</div><button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="rounded-control border border-line bg-panel px-2.5 py-1 text-[11px] text-fg disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>}
      </section>


      <Modal
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        size="lg"
        title={selectedClient?.company || 'Client details'}
        description={selectedClient ? `${selectedClient.name} · ${selectedClient.id}` : undefined}
        footer={<Button type="button" variant="secondary" onClick={() => setSelectedClient(null)}>Close</Button>}
      >
        {selectedClient && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-base font-semibold text-fg">{selectedClient.name}</p>
                <p className="mt-1 text-xs text-muted">{selectedClient.contactPersonRole || 'Primary contact'}</p>
              </div>
              <span className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-badge px-2 py-1 text-xs font-semibold ${statusClasses[statusMeta[selectedClient.status].tone]}`}>
                {statusMeta[selectedClient.status].icon}
                {statusMeta[selectedClient.status].label}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted">Email</p>
                {selectedClient.email ? (
                  <a href={`mailto:${selectedClient.email}`} className="mt-1 block truncate text-sm text-fg hover:text-accent-text">{selectedClient.email}</a>
                ) : <p className="mt-1 text-sm text-fg">—</p>}
              </div>
              <div>
                <p className="text-xs text-muted">Phone</p>
                {selectedClient.phone ? (
                  <a href={`tel:${selectedClient.phone}`} className="mt-1 block text-sm text-fg hover:text-accent-text">{selectedClient.phone}</a>
                ) : <p className="mt-1 text-sm text-fg">—</p>}
              </div>
              <div>
                <p className="text-xs text-muted">Industry</p>
                <p className="mt-1 text-sm text-fg">{selectedClient.industry || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Location</p>
                <p className="mt-1 text-sm text-fg">{selectedClient.location || '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted">Website</p>
                {selectedClient.website ? (
                  <a href={selectedClient.website} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-2 truncate text-sm text-accent-text hover:text-fg">
                    <Globe size={14} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">{selectedClient.website}</span>
                  </a>
                ) : <p className="mt-1 text-sm text-fg">—</p>}
              </div>
            </div>

            <div className="border-y border-line py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted">Projects</p>
                  <p className="mt-1 text-base font-medium tabular-nums text-fg">{selectedClient.projectsCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Cumulative billed value</p>
                  <p className="mt-1 text-base font-medium tabular-nums text-fg">{formatAmount(selectedClient.totalSpend || 0, currency)}</p>
                </div>
              </div>
            </div>

            {(selectedClient.slaDailyAdSpendBudget || selectedClient.currentDailyAdSpend) ? (
              <div>
                <p className="text-xs font-medium text-fg">Daily ad-spend SLA</p>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted">Current spend</p>
                    <p className="mt-1 text-sm tabular-nums text-fg">{formatAmount(selectedClient.currentDailyAdSpend || 0, currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Agreed cap</p>
                    <p className="mt-1 text-sm tabular-nums text-fg">{formatAmount(selectedClient.slaDailyAdSpendBudget || 0, currency)}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedClient.notes && (
              <div>
                <p className="text-xs text-muted">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-fg">{selectedClient.notes}</p>
              </div>
            )}

            <div className="text-xs text-muted">
              Last updated {formatDate(selectedClient.updatedAt, language)}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={isClientModalOpen}
        onClose={() => !isSaving && setIsClientModalOpen(false)}
        size="xl"
        title={editingClient ? 'Edit client' : 'Add client'}
        description={editingClient
          ? 'Update the client record and operational settings.'
          : 'Create a client record with the information your team needs to operate the account.'}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setIsClientModalOpen(false)} disabled={isSaving} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" form="client-form" variant="primary" loading={isSaving} className="w-full sm:w-auto">
              {editingClient ? 'Save changes' : 'Create client'}
            </Button>
          </>
        }
      >
        <form id="client-form" onSubmit={handleSaveClient} className="space-y-5">
          {formError && (
            <div role="alert" className="flex items-start gap-2 rounded-control border border-danger/30 bg-danger/10 p-3 text-xs leading-5 text-danger">
              <ShieldAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <section aria-labelledby="client-contact-section" className="grid gap-4 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-5">
            <div>
              <h3 id="client-contact-section" className="text-sm font-semibold text-fg">Contact information</h3>
              <p className="mt-1 text-xs leading-4 text-muted">Primary contact and company details.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label htmlFor="client-name" className="mb-1.5 block">Contact person *</label><input id="client-name" type="text" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Contact person" /></div>
              <div><label htmlFor="client-company" className="mb-1.5 block">Company *</label><input id="client-company" type="text" required value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company name" /></div>
              <div><label htmlFor="client-role" className="mb-1.5 block">Contact role</label><input id="client-role" type="text" value={role} onChange={(event) => setRole(event.target.value)} placeholder="Role or title" /></div>
              <div><label htmlFor="client-industry" className="mb-1.5 block">Industry</label><input id="client-industry" type="text" value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="Industry" /></div>
              <div><label htmlFor="client-email" className="mb-1.5 block">Email</label><input id="client-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="contact@company.com" /></div>
              <div><label htmlFor="client-phone" className="mb-1.5 block">Phone / WhatsApp</label><input id="client-phone" type="text" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+62 ..." /></div>
              <div><label htmlFor="client-website" className="mb-1.5 block">Website</label><input id="client-website" type="url" value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://company.com" /></div>
              <div><label htmlFor="client-location" className="mb-1.5 block">Location</label><input id="client-location" type="text" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, country" /></div>
            </div>
          </section>

          <section aria-labelledby="client-account-section" className="grid gap-4 border-t border-line pt-5 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-5">
            <div>
              <h3 id="client-account-section" className="text-sm font-semibold text-fg">Account settings</h3>
              <p className="mt-1 text-xs leading-4 text-muted">Keep the account state aligned with the relationship.</p>
            </div>
            <div className="max-w-sm">
              <label htmlFor="client-status" className="mb-1.5 block">Account status</label>
              <CustomSelect value={clientStatus} onChange={(value) => setClientStatus(value as AgencyClient['status'])} options={STATUS_OPTIONS} aria-label="Client account status" className="w-full" triggerClassName="w-full" />
            </div>
          </section>

          <section aria-labelledby="client-relationship-section" className="grid gap-4 border-t border-line pt-5 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-5">
            <div>
              <h3 id="client-relationship-section" className="text-sm font-semibold text-fg">Client relationship</h3>
              <p className="mt-1 text-xs leading-4 text-muted">Operational values tracked on the client record.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label htmlFor="client-projects" className="mb-1.5 block">Projects count</label><input id="client-projects" type="number" min="0" inputMode="numeric" value={projectsCount} onChange={(event) => setProjectsCount(Number(event.target.value))} /></div>
              <div><label htmlFor="client-spend" className="mb-1.5 block">Cumulative billed value</label><input id="client-spend" type="number" min="0" inputMode="decimal" value={totalSpend} onChange={(event) => setTotalSpend(Number(event.target.value))} /></div>
            </div>
          </section>

          <section aria-labelledby="client-sla-section" className="grid gap-3 border-t border-line pt-4 sm:grid-cols-[160px_minmax(0,1fr)]">
            <div>
              <h3 id="client-sla-section" className="text-sm font-semibold text-fg">Daily ad-spend SLA</h3>
              <p className="mt-1 text-xs leading-4 text-muted">Optional tracking for the configured daily cap.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="client-sla" className="mb-1.5 block">Agreed daily cap</label><input id="client-sla" type="number" min="0" inputMode="decimal" value={slaDailyBudget} onChange={(event) => setSlaDailyBudget(Number(event.target.value))} /></div>
              <div><label htmlFor="client-daily-spend" className="mb-1.5 block">Current daily spend</label><input id="client-daily-spend" type="number" min="0" inputMode="decimal" value={currentDailySpend} onChange={(event) => setCurrentDailySpend(Number(event.target.value))} /></div>
            </div>
          </section>

          <section aria-labelledby="client-notes-section" className="grid gap-3 border-t border-line pt-4 sm:grid-cols-[160px_minmax(0,1fr)]">
            <div>
              <h3 id="client-notes-section" className="text-sm font-semibold text-fg">Notes & requirements</h3>
              <p className="mt-1 text-xs leading-4 text-muted">Preferences, requirements, billing context, or operational notes.</p>
            </div>
            <textarea id="client-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Client preferences, requirements, billing notes..." className="resize-y" />
          </section>
        </form>
      </Modal>
      <Modal
        open={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        size="sm"
        title="Delete client?"
        description={deleteTarget ? `This will remove the client record for ${deleteTarget.company}.` : undefined}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDelete()} loading={isDeleting}>Delete client</Button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-3">
            <p className="text-sm text-fg">
              You are deleting <span className="font-medium">{deleteTarget.company}</span>.
            </p>
            <p className="text-xs leading-5 text-muted">
              The existing client API will remove this record. Confirm only if this is the intended client.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminClients;