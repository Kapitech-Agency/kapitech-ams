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
import { AgencyClient, createClientSlug, getAgencyClientSlug, normalizeAgencyClient } from '../../lib/clientStore';
import { formatAmount, getActiveCurrency, CURRENCY_EVENT, CurrencyCode } from '../../lib/currency';
import { useLanguage } from '../../lib/LanguageContext';
import { hasAdminPermission } from '../../lib/adminAuth';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { AdminFilterBar, AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminSectionTabs, AdminStatusBadge, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';


type SortKey = 'name' | 'company' | 'industry' | 'status' | 'updatedAt' | 'projectsCount' | 'totalSpend';
type SortDirection = 'asc' | 'desc';
type SlaFilter = 'all' | 'healthy' | 'near' | 'over' | 'not-configured';
type StatusScope = 'all' | 'active' | 'lead' | 'at-risk';

const STATUS_OPTIONS: Array<{ value: AgencyClient['status']; label: string }> = [
  { value: 'lead', label: 'Lead' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
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
  const [locationFilter, setLocationFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState<SlaFilter>('all');
  const [statusScope, setStatusScope] = useState<StatusScope>('all');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
        client.location,
        client.slug
      ].filter(Boolean).join(' ').toLowerCase();

      if (query && !searchable.includes(query)) return false;
      if (statusFilter !== 'all' && client.status !== statusFilter) return false;
      if (industryFilter !== 'all' && client.industry !== industryFilter) return false;
      if (locationFilter !== 'all' && client.location !== locationFilter) return false;

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
    locationFilter,
    slaFilter,
    statusScope,
    sortKey,
    sortDirection
  ]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, industryFilter, locationFilter, slaFilter, statusScope, sortKey, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const paginatedClients = useMemo(
    () => filteredClients.slice((page - 1) * pageSize, page * pageSize),
    [filteredClients, page]
  );

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const industryOptions = useMemo(() => Array.from(new Set(clients.map((client) => client.industry).filter(Boolean))).sort(), [clients]);
  const locationOptions = useMemo(() => Array.from(new Set(clients.map((client) => client.location).filter(Boolean))).sort(), [clients]);

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

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setIndustryFilter('all');
    setLocationFilter('all');
    setSlaFilter('all');
    setStatusScope('all');
    setPage(1);
  };

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
        'Slug',
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
        client.slug,
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
    <AdminPageShell featureSlug="clients-module" className="ams-clients-module">
      <div data-ams-feature-slug="clients-header" data-ams-slug="clients-header">
        <AdminModuleHeader
          className="mb-0"
          title="Clients & Key Accounts"
        description="Directory of enterprise clients, relationship health, spend-cap status, and account operations."
        eyebrow={<AdminStatusBadge tone="neutral">{clientMetrics.active} active accounts</AdminStatusBadge>}
        actions={(
          <>
            <Button type="button" variant="secondary" onClick={() => {
              const rows = filteredClients.map((client) => [client.id, client.slug, client.name, client.company, client.industry || '', client.status, client.projectsCount, client.totalSpend || 0, client.location || ''].map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(','));
              const csv = ['Client ID,Slug,Contact,Company,Industry,Status,Projects,Total Spend,Location', ...rows].join('\\n');
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
          </>
          )}
        />
      </div>
      <div className="min-[900px]:hidden min-w-0" data-ams-slug="clients-mobile-tabs">
        <AdminSectionTabs
          ariaLabel="Clients sections"
          activeKey="all-clients"
          items={[
            { key: 'all-clients', label: 'All Clients', to: '/admin/clients' },
            { key: 'retainers', label: 'Retainers', to: '/admin/clients/retainers' },
            { key: 'sla-monitoring', label: 'SLA Monitoring', to: '/admin/clients/sla-monitoring' },
            { key: 'lead-accounts', label: 'Lead Accounts', to: '/admin/clients/lead-accounts' },
          ]}
        />
      </div>

      <section aria-label="Client metrics">
        <AdminMetricStrip
          className="lg:grid-cols-3"
          metrics={[
            { id: 'active-clients', label: 'Active clients', value: isLoading ? '—' : clientMetrics.active, change: isLoading ? '—' : '+' + clientMetrics.leads, changeToneClassName: 'text-warning', context: 'onboarding / lead accounts', sparkline: [clientMetrics.leads, clientMetrics.active, clientMetrics.total, clientMetrics.atRisk], icon: <Users size={15} aria-hidden="true" /> },
            { id: 'billed-value', label: 'Cumulative billed value', value: isLoading ? '—' : new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(clientMetrics.totalBilled), context: 'across client records', sparkline: clients.slice(0, 8).map((client) => Number(client.totalSpend || 0)), icon: <TrendingUp size={15} aria-hidden="true" />, toneClassName: 'text-success' },
            { id: 'sla-compliance', label: 'Spend cap compliance', value: isLoading ? '—' : clientMetrics.slaCompliance === null ? '—' : `${clientMetrics.slaCompliance.toFixed(1)}%`, context: clientMetrics.configuredSla + ' configured spend-cap records', sparkline: [clientMetrics.atRisk, clientMetrics.overBudget, clientMetrics.configuredSla, clientMetrics.slaCompliance === null ? 0 : clientMetrics.slaCompliance], icon: <ShieldCheck size={15} aria-hidden="true" />, toneClassName: clientMetrics.slaCompliance !== null && clientMetrics.slaCompliance >= 90 ? 'text-success' : 'text-fg' }
          ]}
        />
      </section>

      <AdminFilterBar
        slug="client-directory-filters"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by company, contact, industry, or client ID..."
        searchLabel="Search clients"
        actions={(
          <Button type="button" variant="secondary" icon={<X size={13} />} onClick={resetFilters}>Reset filters</Button>
        )}
        footer={(
          <div className="flex min-w-0 gap-1 overflow-x-auto custom-scrollbar" aria-label="Client scopes">
          {[
            { id: 'all', label: 'All accounts' },
            { id: 'active', label: 'Active' },
            { id: 'lead', label: 'Onboarding' },
            { id: 'at-risk', label: 'At-risk' }
          ].map((item) => (
            <button key={item.id} type="button" onClick={() => { setStatusScope(item.id as StatusScope); setPage(1); }} className={`inline-flex min-h-9 shrink-0 items-center rounded-control border px-3 text-[11px] font-medium transition-colors ${statusScope === item.id ? 'border-line bg-line text-fg' : 'border-transparent text-muted hover:bg-bg hover:text-fg'}`}>
              {item.label}
            </button>
          ))}
          </div>
        )}
      />

      <section aria-label="Clients directory" className="ams-client-table-shell overflow-hidden rounded-card border border-line bg-panel">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="ams-client-table w-full min-w-[1240px] border-collapse text-left">
            <thead className="bg-bg">
              <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
                <th className="px-4 py-2.5"><button type="button" onClick={() => toggleSort('company')} className="inline-flex min-h-9 items-center gap-1.5 font-medium hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Client account {sortKey === 'company' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowUp size={13} className="rotate-180" />) : <ArrowUpDown size={13} />}</button></th>
                <th className="px-4 py-2.5">Slug</th>
                <th className="px-4 py-2.5"><button type="button" onClick={() => toggleSort('industry')} className="inline-flex min-h-9 items-center gap-1.5 font-medium hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Industry {sortKey === 'industry' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowUp size={13} className="rotate-180" />) : <ArrowUpDown size={13} />}</button></th>
                <th className="px-4 py-2.5">Contract tier</th>
                <th className="px-4 py-2.5">Contact &amp; role</th>
                <th className="px-4 py-2.5 text-right"><button type="button" onClick={() => toggleSort('totalSpend')} className="ml-auto inline-flex min-h-9 items-center gap-1.5 font-medium hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Billed value {sortKey === 'totalSpend' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowUp size={13} className="rotate-180" />) : <ArrowUpDown size={13} />}</button></th>
                <th className="px-4 py-2.5">Spend cap health</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-[13px] leading-[18px]">
              {isLoading ? Array.from({ length: 6 }).map((_, index) => <tr key={index}>{Array.from({ length: 8 }).map((__, cell) => <td key={cell} className="px-4 py-3"><div className="h-3 w-24 animate-pulse rounded-badge bg-line" /></td>)}</tr>) : paginatedClients.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-14 text-center"><Users size={20} className="mx-auto text-muted" aria-hidden="true" /><p className="mt-3 text-sm font-medium text-fg">{clients.length ? 'No matching clients.' : 'No clients yet.'}</p><p className="mt-1 text-xs text-muted">Adjust the search or active filters.</p>{clients.length > 0 && <button type="button" onClick={resetFilters} className="mt-4 inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-bg">Reset filters</button>}</td></tr>
              ) : paginatedClients.map((client) => {
                const budget = Number(client.slaDailyAdSpendBudget) || 0;
                const spend = Number(client.currentDailyAdSpend) || 0;
                const spendState = budget <= 0 ? 'neutral' : spend > budget ? 'danger' : spend >= budget * 0.9 ? 'warning' : 'success';
                const headroom = budget > 0 ? Math.max(0, Math.min(100, (1 - spend / budget) * 100)) : null;
                const clientSlug = getAgencyClientSlug(client as AgencyClient & Record<string, unknown>) || createClientSlug(client.company || client.name || 'client account', client.id);
                return (
                  <tr key={client.id} className="transition-colors hover:bg-bg/70">
                    <td className="px-4 py-3"><button type="button" onClick={() => setSelectedClient(client)} className="block max-w-[270px] text-left"><span className="block truncate font-medium text-fg">{client.company}</span><span className="mt-0.5 block truncate font-mono text-[10px] text-muted" title={clientSlug}>{clientSlug}</span><span className="mt-0.5 block truncate text-[11px] text-muted tabular-nums">ID: {client.id} • {client.location || '—'}</span></button></td>
                    <td className="px-4 py-3"><span className="block whitespace-nowrap font-mono text-[11px] text-fg" title={clientSlug}>{clientSlug}</span></td>
                    <td className="px-4 py-3 text-muted">{client.industry || '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex min-h-6 items-center rounded-badge border px-2 py-0.5 text-[11px] font-medium ${client.projectsCount >= 5 ? 'border-accent/30 bg-accent/10 text-accent-text' : client.status === 'lead' ? 'border-info/20 bg-info/10 text-info' : 'border-line bg-bg text-fg'}`}>{client.projectsCount >= 5 ? 'Tier 1 Strategic' : client.status === 'lead' ? 'Project-based' : 'Retainer Core'}</span></td>
                    <td className="px-4 py-3">{client.name ? <ProfileIdentity profile={{ name: client.name, role: client.contactPersonRole || undefined, contextLabel: client.company, companyEmail: client.email, phone: client.phone }} /> : <span className="text-xs text-muted">—</span>}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-fg">{new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(client.totalSpend) || 0)}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${spendState === 'success' ? 'bg-success' : spendState === 'warning' ? 'bg-warning' : spendState === 'danger' ? 'bg-danger' : 'bg-line'}`} aria-hidden="true" /><span className={spendState === 'danger' ? 'font-medium text-danger tabular-nums' : 'text-fg tabular-nums'}>{headroom === null ? 'Not configured' : headroom.toFixed(1) + '% headroom'}</span></div></td>
                    <td className="px-4 py-3 text-right"><div className="ams-table-actions flex items-center justify-end gap-1">
                        <button type="button" onClick={() => setSelectedClient(client)} aria-label={`View profile for ${client.company}`} title="View profile" className="inline-flex h-10 w-10 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                          <Eye size={16} aria-hidden="true" />
                        </button>
                        {canManageClients && (
                          <button type="button" onClick={() => openEdit(client)} aria-label={`Manage ${client.company}`} title="Manage client" className="inline-flex h-10 w-10 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                        )}
                      </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && <AdminTablePagination total={filteredClients.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="records" slug="client-directory-pagination" />}
      </section>

      <Modal
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        size="lg"
        title={selectedClient?.company || 'Client details'}
        description={selectedClient ? `${selectedClient.name} · ${selectedClient.id} · ${getAgencyClientSlug(selectedClient as AgencyClient & Record<string, unknown>)}` : undefined}
        footer={<Button type="button" variant="secondary" onClick={() => setSelectedClient(null)}>Close</Button>}
      >
        {selectedClient && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <ProfileIdentity profile={{ name: selectedClient.name || selectedClient.company || 'Client contact', role: selectedClient.contactPersonRole || undefined, contextLabel: selectedClient.company, companyEmail: selectedClient.email, phone: selectedClient.phone }} />
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
                <p className="text-xs text-muted">Slug</p>
                <p className="mt-1 truncate font-mono text-xs text-fg">{getAgencyClientSlug(selectedClient as AgencyClient & Record<string, unknown>)}</p>
              </div>
              <div>
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

      <Drawer
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
      </Drawer>
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
    </AdminPageShell>
  );
};

export default AdminClients;