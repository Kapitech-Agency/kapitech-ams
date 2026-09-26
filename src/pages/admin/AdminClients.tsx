import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  Pencil,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { AgencyClient } from '../../lib/clientStore';
import { formatAmount, getActiveCurrency, CURRENCY_EVENT, CurrencyCode } from '../../lib/currency';
import { useLanguage } from '../../lib/LanguageContext';
import { hasAdminPermission } from '../../lib/adminAuth';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';

type SortKey = 'name' | 'company' | 'updatedAt' | 'projectsCount';
type SortDirection = 'asc' | 'desc';

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
        setClients(res.data.clients as AgencyClient[]);
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
      const searchable = [client.name, client.company, client.email, client.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (!query || searchable.includes(query)) &&
        (statusFilter === 'all' || client.status === statusFilter);
    });

    return [...result].sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'projectsCount') {
        comparison = a.projectsCount - b.projectsCount;
      } else if (sortKey === 'updatedAt') {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else {
        comparison = String(a[sortKey]).localeCompare(String(b[sortKey]), undefined, { sensitivity: 'base' });
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [clients, searchQuery, statusFilter, sortKey, sortDirection]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, sortKey, sortDirection]);

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

  const clientMetrics = useMemo(() => ({
    total: clients.length,
    active: clients.filter((client) => client.status === 'active').length,
    leads: clients.filter((client) => client.status === 'lead').length,
    overBudget: overBudgetClients.length,
  }), [clients, overBudgetClients]);

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

    const clientData: AgencyClient = {
      id: editingClient?.id || 'client_' + Date.now().toString(36),
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

      const savedClient = res.data.client as AgencyClient;
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

  const SortButton: React.FC<{ label: string; sort: SortKey }> = ({ label, sort }) => {
    const active = sortKey === sort;
    return (
      <button
        type="button"
        onClick={() => toggleSort(sort)}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-control text-left text-xs font-medium text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={active ? `Sort by ${label}, ${sortDirection === 'asc' ? 'ascending' : 'descending'}` : `Sort by ${label}`}
      >
        <span>{label}</span>
        {active ? (sortDirection === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />) : <ArrowUpDown size={12} aria-hidden="true" />}
      </button>
    );
  };

  return (
    <div className="min-h-full pb-8">
      <header className="ams-dashboard-header mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Kapitech AMS</span>
            <span aria-hidden="true">/</span>
            <span className="text-fg">{t('admin.client.title')}</span>
          </div>
          <h1 className="mt-2 text-xl font-semibold leading-7 tracking-[-0.01em] text-fg">
            {t('admin.client.title')}
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
            {t('admin.client.subtitle')}
          </p>
        </div>
        {canManageClients && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Button
              type="button"
              variant="primary"
              icon={<Plus size={14} aria-hidden="true" />}
              onClick={openCreate}
              className="w-full sm:w-auto"
            >
              {t('admin.client.addClient')}
            </Button>
          </div>
        )}
      </header>

      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-4 flex items-center gap-2 rounded-card border p-3 text-xs ${statusTone === 'danger'
            ? 'border-danger/30 bg-danger/10 text-danger'
            : 'border-success/30 bg-success/10 text-success'}`}
        >
          {statusTone === 'danger' ? <ShieldAlert size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
          <span>{statusMessage}</span>
        </div>
      )}

      {overBudgetClients.length > 0 && (
        <div className="mb-4 rounded-card border border-warning/30 bg-warning/10 p-3">
          <div className="flex items-start gap-2 text-xs text-warning">
            <ShieldAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-medium text-warning">Daily ad-spend SLA exceeded</p>
              <p className="mt-1 text-warning">
                {overBudgetClients.length} client{overBudgetClients.length === 1 ? '' : 's'} exceed{overBudgetClients.length === 1 ? 's' : ''} the configured daily cap.
              </p>
            </div>
          </div>
        </div>
      )}

      <section aria-labelledby="client-snapshot-title" className="mb-6">
        <div className="mb-3">
          <h2 id="client-snapshot-title" className="text-sm font-semibold text-fg">
            {language === 'id' ? 'Ringkasan klien' : 'Client snapshot'}
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            {language === 'id' ? 'Sinyal utama dari direktori klien saat ini.' : 'Key signals from the current client directory.'}
          </p>
        </div>
        <div className="grid grid-cols-2 border-y border-line sm:grid-cols-4">
          {[
            { label: language === 'id' ? 'Total klien' : 'Total clients', value: clientMetrics.total, helper: language === 'id' ? 'Semua status' : 'All statuses', valueClass: 'text-fg' },
            { label: language === 'id' ? 'Klien aktif' : 'Active clients', value: clientMetrics.active, helper: language === 'id' ? 'Sedang berjalan' : 'Currently active', valueClass: 'text-success' },
            { label: language === 'id' ? 'Prospek' : 'Leads', value: clientMetrics.leads, helper: language === 'id' ? 'Status lead' : 'Lead status', valueClass: 'text-info' },
            { label: language === 'id' ? 'Melewati SLA' : 'Over budget', value: clientMetrics.overBudget, helper: language === 'id' ? 'Daily ad-spend' : 'Daily ad-spend SLA', valueClass: 'text-warning' }
          ].map((metric, index) => (
            <div key={metric.label} className={`ams-kpi min-w-0 px-4 py-4 ${index % 2 === 1 ? 'border-l border-line' : ''} ${index >= 2 ? 'border-t border-line' : ''} ${index > 0 ? 'sm:border-l sm:border-t-0' : ''}`}>
              <p className="ams-meta">{metric.label}</p>
              <p className={`ams-kpi-value mt-2 ${metric.valueClass}`}>{isLoading ? '—' : metric.value}</p>
              <p className="ams-meta mt-1">{metric.helper}</p>
            </div>
          ))}
        </div>
      </section>
      <section
        aria-label={language === 'id' ? 'Pencarian dan filter klien' : 'Client directory controls'}
        className="mb-6 rounded-card border border-line bg-panel p-4"
      >
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="client-search" className="mb-1.5 block text-xs font-medium text-muted">
              {language === 'id' ? 'Cari klien' : 'Search clients'}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} aria-hidden="true" />
              <input
                id="client-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('admin.client.searchPlaceholder')}
                className="h-10 w-full pl-9 pr-9 text-[13px]"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 flex min-h-8 min-w-8 -translate-y-1/2 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div className="w-full lg:w-48 lg:shrink-0">
            <label htmlFor="client-status" className="mb-1.5 block text-xs font-medium text-muted">
              Status
            </label>
            <CustomSelect
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as 'all' | AgencyClient['status'])}
              options={[
                { value: 'all', label: language === 'id' ? 'Semua status' : 'All statuses' },
                ...STATUS_OPTIONS
              ]}
              aria-label="Filter clients by status"
              className="w-full"
              triggerClassName="w-full"
            />
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2 lg:shrink-0">
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs tabular-nums text-muted">
            {filteredClients.length} result{filteredClients.length === 1 ? '' : 's'}
          </p>
          <p className="text-xs text-muted">
            {language === 'id' ? 'Hasil mengikuti pencarian dan filter aktif.' : 'Results reflect the active search and filters.'}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-card border border-line bg-panel" aria-label={language === 'id' ? 'Daftar klien' : 'Client list'}>
        {errorMessage ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <ShieldAlert size={20} className="text-danger" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-fg">{errorMessage}</p>
              <p className="mt-1 text-xs text-muted">Check the connection and retry.</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => void loadData()}>Retry</Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left">
                <thead>
                  <tr>
                    <th scope="col"><SortButton label="Client" sort="name" /></th>
                    <th scope="col"><SortButton label="Company" sort="company" /></th>
                    <th scope="col">Contact</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right"><SortButton label="Projects" sort="projectsCount" /></th>
                    <th scope="col"><SortButton label="Last updated" sort="updatedAt" /></th>
                    <th scope="col" className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index} aria-hidden="true">
                        {Array.from({ length: 7 }).map((__, cell) => (
                          <td key={cell}>
                            <div className="h-3 w-24 animate-pulse rounded-badge bg-line" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : paginatedClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="mx-auto max-w-sm">
                          <Users size={20} className="mx-auto text-muted" aria-hidden="true" />
                          <p className="mt-3 text-sm font-medium text-fg">
                            {clients.length === 0
                              ? (language === 'id' ? 'Belum ada klien.' : 'No clients yet.')
                              : (language === 'id' ? 'Tidak ada hasil yang cocok.' : 'No matching clients.')}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {clients.length === 0
                              ? 'Add your first client to build the directory.'
                              : 'Try another search or clear the active filters.'}
                          </p>
                          {clients.length === 0 && canManageClients && (
                            <Button type="button" variant="primary" icon={<Plus size={14} />} onClick={openCreate} className="mt-4">
                              Add client
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedClients.map((client) => {
                      const meta = statusMeta[client.status];
                      return (
                        <tr key={client.id}>
                          <td>
                            <button
                              type="button"
                              onClick={() => setSelectedClient(client)}
                              className="group block max-w-[220px] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                              aria-label={`View ${client.company}`}
                            >
                              <span className="block truncate text-[13px] font-medium text-fg group-hover:text-accent-text">
                                {client.name}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted">
                                {client.id}
                              </span>
                            </button>
                          </td>
                          <td>
                            <div className="max-w-[230px]">
                              <p className="truncate text-[13px] font-medium text-fg">{client.company}</p>
                              <p className="mt-0.5 truncate text-xs text-muted">{client.industry || '—'}</p>
                            </div>
                          </td>
                          <td>
                            <div className="max-w-[230px] min-w-0">
                              {client.email ? (
                                <a href={`mailto:${client.email}`} className="block truncate text-[13px] text-fg hover:text-accent-text">
                                  {client.email}
                                </a>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                              {client.phone && (
                                <a href={`tel:${client.phone}`} className="mt-0.5 block truncate text-xs text-muted hover:text-fg">
                                  {client.phone}
                                </a>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`inline-flex items-center gap-1.5 rounded-badge px-2 py-1 text-xs font-semibold ${statusClasses[meta.tone]}`}>
                              {meta.icon}
                              {meta.label}
                            </span>
                          </td>
                          <td className="text-right tabular-nums">{client.projectsCount}</td>
                          <td className="whitespace-nowrap text-muted">{formatDate(client.updatedAt, language)}</td>
                          <td>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedClient(client)}
                                className="flex min-h-10 min-w-10 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg"
                                aria-label={`View ${client.company}`}
                                title="View client"
                              >
                                <Eye size={15} aria-hidden="true" />
                              </button>
                              {canManageClients && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openEdit(client)}
                                    className="flex min-h-10 min-w-10 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg"
                                    aria-label={`Edit ${client.company}`}
                                    title="Edit client"
                                  >
                                    <Pencil size={15} aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(client)}
                                    className="flex min-h-10 min-w-10 items-center justify-center rounded-control text-muted hover:bg-danger/10 hover:text-danger"
                                    aria-label={`Delete ${client.company}`}
                                    title="Delete client"
                                  >
                                    <Trash2 size={15} aria-hidden="true" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!isLoading && filteredClients.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted">
                  Showing <span className="tabular-nums text-fg">{(page - 1) * pageSize + 1}</span> to{' '}
                  <span className="tabular-nums text-fg">{Math.min(page * pageSize, filteredClients.length)}</span> of{' '}
                  <span className="tabular-nums text-fg">{filteredClients.length}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="flex min-h-10 min-w-10 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>
                  <span className="min-w-16 text-center text-xs tabular-nums text-fg">{page} / {pageCount}</span>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                    disabled={page === pageCount}
                    aria-label="Next page"
                    className="flex min-h-10 min-w-10 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
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
        fitContent
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
