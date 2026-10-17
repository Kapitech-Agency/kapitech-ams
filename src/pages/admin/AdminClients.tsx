import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useReportingPeriod } from '../../lib/ReportingPeriodContext';
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
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  Mail as MailIcon,
  MessageSquare,
  Phone,
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

const getStatusScopeFromSearchParams = (searchParams: URLSearchParams): StatusScope => {
  const scope = searchParams.get('scope');
  if (scope === 'active') return 'active';
  if (scope === 'onboarding') return 'lead';
  if (scope === 'at-risk') return 'at-risk';
  return 'all';
};

const getStatusScopeQueryValue = (scope: StatusScope): string | null => {
  if (scope === 'lead') return 'onboarding';
  return scope === 'all' ? null : scope;
};
type ClientInteractionType = 'call' | 'email' | 'meeting' | 'message' | 'note';

type ClientInteraction = {
  id: string;
  clientId: string;
  type: ClientInteractionType;
  subject: string;
  summary: string;
  contactName?: string;
  outcome?: string;
  nextStep?: string;
  occurredAt: string;
  createdByUserId?: string;
  createdByName?: string;
  createdAt: string;
  sourceType?: 'manual' | 'system';
  systemAction?: string;
  sourceReferenceId?: string;
};

const CLIENT_INTERACTION_OPTIONS: Array<{ value: ClientInteractionType; label: string }> = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'call', label: 'Phone call' },
  { value: 'email', label: 'Email' },
  { value: 'message', label: 'Message' },
  { value: 'note', label: 'Internal note' },
];

const clientInteractionLabel = (type: ClientInteractionType) =>
  CLIENT_INTERACTION_OPTIONS.find((item) => item.value === type)?.label || 'Interaction';

const toLocalDateTimeInput = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const formatInteractionTimestamp = (value: string, language: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date not recorded';
  return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date);
};

type ClientContractSummary = {
  id: string;
  contractNumber?: string;
  title?: string;
  contractType?: string;
  status?: string;
  clientId?: string;
  clientName?: string;
  projectName?: string;
  contractValue?: number;
  currency?: 'IDR' | 'USD';
  documentUrl?: string;
  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  signedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

const normalizeClientRelationName = (value: unknown) =>
  String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const CONTRACT_STATUS_PRESENTATION: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'border-line bg-bg text-muted' },
  in_review: { label: 'In review', className: 'border-warning/25 bg-warning/10 text-warning' },
  sent: { label: 'Sent for signature', className: 'border-info/25 bg-info/10 text-info' },
  signed: { label: 'Signed', className: 'border-accent/25 bg-accent/10 text-accent-text' },
  active: { label: 'Active', className: 'border-success/25 bg-success/10 text-success' },
  completed: { label: 'Completed', className: 'border-line bg-bg text-muted' },
  expired: { label: 'Expired', className: 'border-danger/25 bg-danger/10 text-danger' },
  terminated: { label: 'Terminated', className: 'border-danger/25 bg-danger/10 text-danger' },
};

const isSecureContractDocumentUrl = (value?: string) => {
  if (!value) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

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

type ClientProfileReadinessItem = {
  key: string;
  label: string;
  complete: boolean;
};

const getClientProfileReadiness = (client: AgencyClient): ClientProfileReadinessItem[] => [
  { key: 'company', label: 'Company name', complete: Boolean(String(client.company || '').trim()) },
  { key: 'contact', label: 'Primary contact', complete: Boolean(String(client.name || '').trim()) },
  { key: 'email', label: 'Business email', complete: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(client.email || '').trim()) },
  { key: 'phone', label: 'Phone / WhatsApp', complete: Boolean(String(client.phone || '').trim()) },
  { key: 'industry', label: 'Industry', complete: Boolean(String(client.industry || '').trim()) },
  { key: 'location', label: 'Business location', complete: Boolean(String(client.location || '').trim()) },
  { key: 'requirements', label: 'Project requirements / account notes', complete: Boolean(String(client.notes || '').trim()) },
];

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
  const { matchesDate } = useReportingPeriod();
  const canManageClients = hasAdminPermission('canManageClients');
  const canViewClientContracts = canManageClients || hasAdminPermission('canManageCrm') || hasAdminPermission('canManageProjects');
  const canManageClientInteractions = canManageClients || hasAdminPermission('canManageCrm');
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AgencyClient['status']>('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState<SlaFilter>('all');
  const [statusScope, setStatusScope] = useState<StatusScope>(() => getStatusScopeFromSearchParams(searchParams));
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'danger'>('success');

  const [selectedClient, setSelectedClient] = useState<AgencyClient | null>(null);
  const [clientContracts, setClientContracts] = useState<ClientContractSummary[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsError, setContractsError] = useState<string | null>(null);
  const [clientInteractions, setClientInteractions] = useState<ClientInteraction[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);
  const [interactionsError, setInteractionsError] = useState<string | null>(null);
  const [interactionReloadKey, setInteractionReloadKey] = useState(0);
  const [interactionDrawerOpen, setInteractionDrawerOpen] = useState(false);
  const [interactionClient, setInteractionClient] = useState<AgencyClient | null>(null);
  const [interactionSaving, setInteractionSaving] = useState(false);
  const [interactionFormError, setInteractionFormError] = useState<string | null>(null);
  const [interactionForm, setInteractionForm] = useState({
    type: 'meeting' as ClientInteractionType,
    subject: '',
    summary: '',
    contactName: '',
    outcome: '',
    nextStep: '',
    occurredAt: toLocalDateTimeInput(new Date()),
  });
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

  useEffect(() => {
    const requestedScope = getStatusScopeFromSearchParams(searchParams);
    setStatusScope((current) => current === requestedScope ? current : requestedScope);
  }, [searchParams]);

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

  useEffect(() => {
    const requestedClientId = searchParams.get('client');
    if (!requestedClientId || isLoading) return;
    const linkedClient = clients.find((client) => String(client.id) === requestedClientId);
    if (!linkedClient) return;
    setSelectedClient(linkedClient);
    const next = new URLSearchParams(searchParams);
    next.delete('client');
    setSearchParams(next, { replace: true });
  }, [searchParams, isLoading, clients, setSearchParams]);

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const result = clients.filter((client) => {
      if (!matchesDate(client.createdAt || client.updatedAt)) return false;
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
    sortDirection,
    matchesDate,
  ]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, industryFilter, locationFilter, slaFilter, statusScope, sortKey, sortDirection]);
  useEffect(() => {
    if (!selectedClient || !canViewClientContracts) {
      setClientContracts([]);
      setContractsError(null);
      setContractsLoading(false);
      return;
    }

    let active = true;
    setClientContracts([]);
    setContractsError(null);
    setContractsLoading(true);

    void api.contracts.getAll().then((response) => {
      if (!active) return;
      if (!response.success || !Array.isArray(response.data?.contracts)) {
        setContractsError(response.error || 'Contract register could not be loaded.');
        return;
      }

      const rows = (response.data.contracts as ClientContractSummary[])
        .filter((contract) => {
          const contractClientId = String(contract.clientId || '').trim();
          if (contractClientId) return contractClientId === selectedClient.id;
          return normalizeClientRelationName(contract.clientName) === normalizeClientRelationName(selectedClient.company);
        })
        .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));

      setClientContracts(rows);
    }).catch((error) => {
      if (active) setContractsError(error instanceof Error ? error.message : 'Contract register could not be loaded.');
    }).finally(() => {
      if (active) setContractsLoading(false);
    });

    return () => { active = false; };
  }, [selectedClient?.id, selectedClient?.company, canViewClientContracts]);
  useEffect(() => {
    if (!selectedClient || !canManageClientInteractions) {
      setClientInteractions([]);
      setInteractionsError(null);
      setInteractionsLoading(false);
      return;
    }

    let active = true;
    setClientInteractions([]);
    setInteractionsError(null);
    setInteractionsLoading(true);
    void api.clients.getInteractions(selectedClient.id).then((response) => {
      if (!active) return;
      if (!response.success || !Array.isArray(response.data?.interactions)) {
        setInteractionsError(response.error || 'Client interaction history could not be loaded.');
        return;
      }
      setClientInteractions(response.data.interactions as ClientInteraction[]);
    }).catch((error) => {
      if (active) setInteractionsError(error instanceof Error ? error.message : 'Client interaction history could not be loaded.');
    }).finally(() => {
      if (active) setInteractionsLoading(false);
    });

    return () => { active = false; };
  }, [selectedClient?.id, canManageClientInteractions, interactionReloadKey]);



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
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('scope');
    setSearchParams(nextParams, { replace: true });
  };

  const changeStatusScope = (scope: StatusScope) => {
    setStatusScope(scope);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    const queryValue = getStatusScopeQueryValue(scope);
    if (queryValue) nextParams.set('scope', queryValue);
    else nextParams.delete('scope');
    setSearchParams(nextParams);
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

  const openInteractionDrawer = () => {
    if (!selectedClient || !canManageClientInteractions) return;
    setInteractionClient(selectedClient);
    setInteractionForm({
      type: 'meeting',
      subject: '',
      summary: '',
      contactName: selectedClient.name || '',
      outcome: '',
      nextStep: '',
      occurredAt: toLocalDateTimeInput(new Date()),
    });
    setInteractionFormError(null);
    setSelectedClient(null);
    setInteractionDrawerOpen(true);
  };

  const closeInteractionDrawer = () => {
    if (interactionSaving) return;
    const clientToReopen = interactionClient;
    setInteractionDrawerOpen(false);
    setInteractionClient(null);
    setInteractionFormError(null);
    if (clientToReopen) setSelectedClient(clientToReopen);
  };

  const saveClientInteraction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!interactionClient || !canManageClientInteractions || interactionSaving) return;

    const subject = interactionForm.subject.trim();
    const summary = interactionForm.summary.trim();
    if (!subject || !summary) {
      setInteractionFormError('Subject and summary are required.');
      return;
    }
    const occurredAt = new Date(interactionForm.occurredAt);
    if (Number.isNaN(occurredAt.getTime())) {
      setInteractionFormError('Enter a valid date and time for this interaction.');
      return;
    }

    setInteractionSaving(true);
    setInteractionFormError(null);
    try {
      const response = await api.clients.createInteraction(interactionClient.id, {
        type: interactionForm.type,
        subject,
        summary,
        contactName: interactionForm.contactName.trim(),
        outcome: interactionForm.outcome.trim(),
        nextStep: interactionForm.nextStep.trim(),
        occurredAt: occurredAt.toISOString(),
      });
      if (!response.success || !response.data?.interaction) {
        setInteractionFormError(response.error || 'Interaction could not be saved.');
        return;
      }

      const created = response.data.interaction as ClientInteraction;
      const clientToReopen = interactionClient;
      setClientInteractions(current => [created, ...current.filter(item => item.id !== created.id)]
        .sort((a, b) => String(b.occurredAt || '').localeCompare(String(a.occurredAt || ''))));
      setInteractionDrawerOpen(false);
      setInteractionClient(null);
      setInteractionFormError(null);
      setSelectedClient(clientToReopen);
      showToast('Client interaction saved.');
    } catch (error) {
      setInteractionFormError(error instanceof Error ? error.message : 'Interaction could not be saved.');
    } finally {
      setInteractionSaving(false);
    }
  };

  const selectedClientReadiness = selectedClient ? getClientProfileReadiness(selectedClient) : [];
  const selectedClientReadinessCount = selectedClientReadiness.filter((item) => item.complete).length;
  const selectedClientReadinessPercent = selectedClientReadiness.length
    ? Math.round((selectedClientReadinessCount / selectedClientReadiness.length) * 100)
    : 0;

  return (
    <AdminPageShell featureSlug="clients-module" className="ams-clients-module">
      <div data-ams-feature-slug="clients-header" data-ams-slug="clients-header">
        <span className="sr-only" data-ams-feature-slug="clients-key-accounts-tab" data-ams-slug="clients-key-accounts-tab">Clients & Key Accounts</span>
        <AdminModuleHeader slug="clients-header"
          className="mb-0"
          title="Clients & Key Accounts"
        description="Directory of enterprise clients, relationship health, spend-cap status, and account operations."
        eyebrow={<AdminStatusBadge tone="neutral">{isLoading || errorMessage ? '— active accounts' : clientMetrics.active + ' active accounts'}</AdminStatusBadge>}
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
      

      {errorMessage && (
        <div role="alert" aria-live="assertive" className="flex flex-col gap-3 rounded-card border border-danger/25 bg-danger/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            <CircleAlert size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-fg">{language === 'id' ? 'Direktori klien tidak tersedia' : 'Client directory unavailable'}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{errorMessage}</p>
            </div>
          </div>
          <Button type="button" variant="secondary" loading={isLoading} onClick={() => void loadData()} className="shrink-0 self-start sm:self-auto">
            {language === 'id' ? 'Coba lagi' : 'Retry loading'}
          </Button>
        </div>
      )}

      <section data-ams-feature-slug="clients-metrics" data-ams-slug="clients-metrics" aria-label="Client metrics">
        <AdminMetricStrip slug="clients-kpis"
          className="lg:grid-cols-3"
          metrics={[
            { id: 'active-clients', label: 'Active clients', value: isLoading || errorMessage ? '—' : clientMetrics.active, change: isLoading || errorMessage ? '—' : '+' + clientMetrics.leads, changeToneClassName: 'text-warning', context: isLoading ? 'Loading live data' : errorMessage ? 'Live data unavailable' : 'onboarding / lead accounts', sparkline: isLoading || errorMessage ? undefined : [clientMetrics.leads, clientMetrics.active, clientMetrics.total, clientMetrics.atRisk], icon: <Users size={15} aria-hidden="true" /> },
            { id: 'billed-value', label: 'Cumulative billed value', value: isLoading || errorMessage ? '—' : new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(clientMetrics.totalBilled), context: isLoading ? 'Loading live data' : errorMessage ? 'Live data unavailable' : 'across client records', sparkline: isLoading || errorMessage ? undefined : clients.slice(0, 8).map((client) => Number(client.totalSpend || 0)), icon: <TrendingUp size={15} aria-hidden="true" />, toneClassName: 'text-success' },
            { id: 'sla-compliance', label: 'Spend cap compliance', value: isLoading || errorMessage ? '—' : clientMetrics.slaCompliance === null ? '—' : `${clientMetrics.slaCompliance.toFixed(1)}%`, context: isLoading ? 'Loading live data' : errorMessage ? 'Live data unavailable' : clientMetrics.configuredSla + ' configured spend-cap records', sparkline: isLoading || errorMessage ? undefined : [clientMetrics.atRisk, clientMetrics.overBudget, clientMetrics.configuredSla, clientMetrics.slaCompliance === null ? 0 : clientMetrics.slaCompliance], icon: <ShieldCheck size={15} aria-hidden="true" />, toneClassName: clientMetrics.slaCompliance !== null && clientMetrics.slaCompliance >= 90 ? 'text-success' : 'text-fg' }
          ]}
        />
      </section>

      <AdminFilterBar slug="client-directory-filters"
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
            <button key={item.id} type="button" onClick={() => changeStatusScope(item.id as StatusScope)} className={`inline-flex min-h-9 shrink-0 items-center rounded-control border px-3 text-[11px] font-medium transition-colors ${statusScope === item.id ? 'border-line bg-line text-fg' : 'border-transparent text-muted hover:bg-bg hover:text-fg'}`}>
              {item.label}
            </button>
          ))}
          </div>
        )}
      />

      <section data-ams-feature-slug="clients-directory-table" data-ams-slug="clients-directory-table" aria-label="Clients directory" className="ams-client-table-shell overflow-hidden rounded-card border border-line bg-panel">
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
                <tr><td colSpan={8} className="p-0"><div className="flex min-h-[280px] w-full flex-col items-center justify-center px-5 py-12 text-center" data-ams-slug="clients-empty-state"><div className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-bg text-muted"><Users size={20} aria-hidden="true" /></div><p className="mt-3 text-sm font-medium text-fg">{errorMessage ? 'Client directory unavailable.' : clients.length ? 'No matching clients.' : 'No clients yet.'}</p><p className="mt-1 max-w-sm text-xs leading-5 text-muted">{errorMessage ? 'The client data could not be loaded. Use the retry action above.' : 'Adjust the search or active filters.'}</p>{clients.length > 0 && <button type="button" onClick={resetFilters} className="mt-4 inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-bg">Reset filters</button>}</div></td></tr>
              ) : paginatedClients.map((client) => {
                const budget = Number(client.slaDailyAdSpendBudget) || 0;
                const spend = Number(client.currentDailyAdSpend) || 0;
                const spendState = budget <= 0 ? 'neutral' : spend > budget ? 'danger' : spend >= budget * 0.9 ? 'warning' : 'success';
                const headroom = budget > 0 ? Math.max(0, Math.min(100, (1 - spend / budget) * 100)) : null;
                const clientSlug = getAgencyClientSlug(client as AgencyClient & Record<string, unknown>) || createClientSlug(client.company || client.name || 'client account', client.id);
                return (
                  <tr key={client.id} data-ams-slug={'client-account-' + clientSlug} className="transition-colors hover:bg-bg/70">
                    <td className="px-4 py-3"><button type="button" onClick={() => setSelectedClient(client)} className="block max-w-[270px] text-left"><span className="block truncate font-medium text-fg">{client.company}</span><span className="mt-1 block truncate text-[11px] text-muted tabular-nums">ID: {client.id} · {client.location || 'Location not set'}</span></button></td>
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

      <Modal slug="client-directory-detail-modal"
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        size="lg"
        title={selectedClient?.company || 'Client details'}
        description={selectedClient ? `${selectedClient.name} · ${selectedClient.id} · ${getAgencyClientSlug(selectedClient as AgencyClient & Record<string, unknown>)}` : undefined}
        footer={<div className="flex flex-wrap justify-end gap-2">{canManageClientInteractions && <Button type="button" variant="secondary" onClick={openInteractionDrawer} icon={<Plus size={13} aria-hidden="true" />}>Log interaction</Button>}{canManageClients && <Button type="button" variant="secondary" onClick={() => { if (!selectedClient) return; const client = selectedClient; setSelectedClient(null); openEdit(client); }}>{selectedClient?.status === 'lead' ? 'Continue onboarding' : 'Edit client'}</Button>}<Button type="button" variant="secondary" onClick={() => setSelectedClient(null)}>Close</Button></div>}
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

            {canManageClientInteractions && (
              <section
                aria-label="Client relationship timeline"
                data-ams-feature-slug="client-interaction-timeline"
                data-ams-slug="client-interaction-timeline"
                className="overflow-hidden rounded-card border border-line bg-panel"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-fg"><Activity size={15} className="text-muted" aria-hidden="true" /> Relationship timeline</h3>
                    <p className="mt-1 text-xs leading-5 text-muted">Saved client calls, meetings, emails, messages, and internal notes.</p>
                  </div>
                  <Button type="button" variant="secondary" onClick={openInteractionDrawer} icon={<Plus size={13} aria-hidden="true" />}>Log interaction</Button>
                </div>

                {interactionsLoading ? (
                  <div className="space-y-2 p-4" role="status" aria-label="Loading client interaction history">
                    {[1, 2, 3].map(item => <div key={item} className="h-16 animate-pulse rounded-control border border-line bg-bg" />)}
                  </div>
                ) : interactionsError ? (
                  <div className="flex flex-col items-start gap-2 p-4" role="alert">
                    <p className="text-xs font-medium text-fg">Interaction history unavailable</p>
                    <p className="text-xs leading-5 text-muted">{interactionsError}</p>
                    <Button type="button" variant="secondary" onClick={() => setInteractionReloadKey(value => value + 1)}>Retry loading</Button>
                  </div>
                ) : clientInteractions.length ? (
                  <div className="divide-y divide-line">
                    {clientInteractions.map(interaction => (
                      <article key={interaction.id} data-ams-slug={'client-interaction-' + interaction.id} className="flex gap-3 px-4 py-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted" aria-hidden="true">
                          {interaction.type === 'meeting' ? <CalendarDays size={14} /> : interaction.type === 'email' ? <MailIcon size={14} /> : interaction.type === 'call' ? <Phone size={14} /> : interaction.type === 'message' ? <MessageSquare size={14} /> : <FileText size={14} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-xs font-semibold text-fg">{interaction.subject}</span>
                            <span className={'rounded-badge border px-2 py-0.5 text-[10px] font-medium ' + (interaction.sourceType === 'system' ? 'border-accent/25 bg-accent/10 text-accent-text' : 'border-line bg-bg text-muted')}>{interaction.sourceType === 'system' ? 'System activity' : clientInteractionLabel(interaction.type)}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-fg">{interaction.summary}</p>
                          {(interaction.contactName || interaction.outcome || interaction.nextStep) && (
                            <dl className="mt-2 grid gap-x-5 gap-y-2 sm:grid-cols-2">
                              {interaction.contactName && <div><dt className="text-[10px] text-muted">Contact</dt><dd className="mt-0.5 text-xs text-fg">{interaction.contactName}</dd></div>}
                              {interaction.outcome && <div><dt className="text-[10px] text-muted">Outcome</dt><dd className="mt-0.5 text-xs text-fg">{interaction.outcome}</dd></div>}
                              {interaction.nextStep && <div className="sm:col-span-2"><dt className="text-[10px] text-muted">Next step</dt><dd className="mt-0.5 text-xs text-fg">{interaction.nextStep}</dd></div>}
                            </dl>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
                            <span>{formatInteractionTimestamp(interaction.occurredAt, language)}</span>
                            <span>Logged by {interaction.createdByName || 'AMS user'}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-2 p-4" data-ams-slug="client-interaction-empty">
                    <p className="text-xs font-medium text-fg">No interactions recorded yet</p>
                    <p className="text-xs leading-5 text-muted">Record the next client conversation so the team can follow the relationship history and agreed next steps.</p>
                    <Button type="button" variant="secondary" onClick={openInteractionDrawer} icon={<Plus size={13} aria-hidden="true" />}>Log first interaction</Button>
                  </div>
                )}
              </section>
            )}

            {selectedClient.status === 'lead' && (
              <section
                aria-label="Onboarding profile readiness"
                data-ams-feature-slug="client-onboarding-readiness"
                data-ams-slug="client-onboarding-readiness"
                className="rounded-card border border-line bg-bg p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-fg">Onboarding profile readiness</h3>
                    <p className="mt-1 text-xs leading-5 text-muted">Required client profile details recorded in AMS.</p>
                  </div>
                  <span className="shrink-0 rounded-badge border border-line bg-panel px-2 py-1 text-xs font-semibold tabular-nums text-fg">
                    {selectedClientReadinessCount}/{selectedClientReadiness.length} · {selectedClientReadinessPercent}%
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Client profile readiness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={selectedClientReadinessPercent}>
                  <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: selectedClientReadinessPercent + '%' }} />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {selectedClientReadiness.map((item) => (
                    <div key={item.key} className="flex min-w-0 items-center gap-2 rounded-control border border-line bg-panel px-3 py-2.5">
                      {item.complete
                        ? <CheckCircle2 size={14} className="shrink-0 text-success" aria-hidden="true" />
                        : <CircleDashed size={14} className="shrink-0 text-muted" aria-hidden="true" />}
                      <span className="min-w-0 flex-1 text-xs text-fg">{item.label}</span>
                      <span className={'shrink-0 text-[10px] font-medium ' + (item.complete ? 'text-success' : 'text-muted')}>
                        {item.complete ? 'Complete' : 'Missing'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] leading-4 text-muted">
                  This score covers profile completeness only. Contract approval, project kickoff, and billing readiness must be verified in their existing AMS modules.
                </p>
              </section>
            )}

            {canViewClientContracts && (
              <section
                aria-label="Client contracts and statements of work"
                data-ams-feature-slug="client-contract-history"
                data-ams-slug="client-contract-history"
                className="overflow-hidden rounded-card border border-line bg-panel"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-fg"><FileText size={15} className="text-muted" aria-hidden="true" /> Contracts &amp; Statements of Work</h3>
                    <p className="mt-1 text-xs leading-5 text-muted">Saved contracts linked to this client record.</p>
                  </div>
                  <Link to="/admin/contracts" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-fg transition-colors hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    Contract register <ExternalLink size={12} aria-hidden="true" />
                  </Link>
                </div>

                {contractsLoading ? (
                  <div className="space-y-2 p-4" role="status" aria-label="Loading client contracts">
                    {[1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-control border border-line bg-bg" />)}
                  </div>
                ) : contractsError ? (
                  <div className="flex items-start gap-2.5 p-4" role="alert">
                    <CircleAlert size={15} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-medium text-fg">Contract register unavailable</p>
                      <p className="mt-1 text-xs leading-5 text-muted">{contractsError}</p>
                    </div>
                  </div>
                ) : clientContracts.length ? (
                  <div className="divide-y divide-line">
                    {clientContracts.map((contract) => {
                      const state = CONTRACT_STATUS_PRESENTATION[String(contract.status || '').toLowerCase()] || {
                        label: String(contract.status || 'Unknown').replace(/_/g, ' '),
                        className: 'border-line bg-bg text-muted',
                      };
                      const dateRange = [contract.startDate, contract.endDate].filter(Boolean).join(' – ');
                      return (
                        <article key={contract.id} data-ams-slug={'client-contract-' + contract.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-fg">{contract.title || contract.contractNumber || 'Untitled contract'}</span>
                              <span className={'inline-flex rounded-badge border px-2 py-0.5 text-[10px] font-semibold ' + state.className}>{state.label}</span>
                            </div>
                            <p className="mt-1 text-[10px] text-muted">
                              {contract.contractNumber || contract.id}
                              {contract.contractType ? ' · ' + String(contract.contractType).replace(/_/g, ' ').toUpperCase() : ''}
                              {contract.projectName ? ' · ' + contract.projectName : ''}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted">
                              {dateRange && <span className="inline-flex items-center gap-1"><CalendarDays size={11} aria-hidden="true" />{dateRange}</span>}
                              {contract.signedAt && <span>Signed {formatDate(contract.signedAt, language)}</span>}
                              {Number.isFinite(Number(contract.contractValue)) && <span className="font-medium tabular-nums text-fg">{formatAmount(Number(contract.contractValue) || 0, contract.currency === 'USD' ? 'USD' : 'IDR')}</span>}
                            </div>
                          </div>
                          {isSecureContractDocumentUrl(contract.documentUrl) && (
                            <a href={contract.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-fg transition-colors hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                              Open document <ExternalLink size={12} aria-hidden="true" />
                            </a>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-2 p-4" data-ams-slug="client-contract-empty">
                    <p className="text-xs font-medium text-fg">No linked contracts yet</p>
                    <p className="text-xs leading-5 text-muted">Contracts and statements of work added in the Contract register will appear here when linked by client ID or exact company name.</p>
                    <Link to="/admin/contracts" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-fg transition-colors hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                      Open contract register <ExternalLink size={12} aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </section>
            )}

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

      <Drawer slug="client-editor-drawer"
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
        <form id="client-form" data-ams-feature-slug="client-editor-form" data-ams-slug="client-editor-form" onSubmit={handleSaveClient} className="space-y-5">
          {formError && (
            <div role="alert" className="flex items-start gap-2 rounded-control border border-danger/30 bg-danger/10 p-3 text-xs leading-5 text-danger">
              <ShieldAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <section aria-labelledby="client-contact-section" data-ams-drawer-layout="sections" className="grid gap-4 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-5">
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

          <section aria-labelledby="client-account-section" data-ams-drawer-layout="sections" className="grid gap-4 border-t border-line pt-5 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-5">
            <div>
              <h3 id="client-account-section" className="text-sm font-semibold text-fg">Account settings</h3>
              <p className="mt-1 text-xs leading-4 text-muted">Keep the account state aligned with the relationship.</p>
            </div>
            <div className="max-w-sm">
              <label htmlFor="client-status" className="mb-1.5 block">Account status</label>
              <CustomSelect value={clientStatus} onChange={(value) => setClientStatus(value as AgencyClient['status'])} options={STATUS_OPTIONS} aria-label="Client account status" className="w-full" triggerClassName="w-full" />
            </div>
          </section>

          <section aria-labelledby="client-relationship-section" data-ams-drawer-layout="sections" className="grid gap-4 border-t border-line pt-5 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-5">
            <div>
              <h3 id="client-relationship-section" className="text-sm font-semibold text-fg">Client relationship</h3>
              <p className="mt-1 text-xs leading-4 text-muted">Operational values tracked on the client record.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label htmlFor="client-projects" className="mb-1.5 block">Projects count</label><input id="client-projects" type="number" min="0" inputMode="numeric" value={projectsCount} onChange={(event) => setProjectsCount(Number(event.target.value))} /></div>
              <div><label htmlFor="client-spend" className="mb-1.5 block">Cumulative billed value</label><input id="client-spend" type="number" min="0" inputMode="decimal" value={totalSpend} onChange={(event) => setTotalSpend(Number(event.target.value))} /></div>
            </div>
          </section>

          <section aria-labelledby="client-sla-section" data-ams-drawer-layout="sections" className="grid gap-3 border-t border-line pt-4 sm:grid-cols-[160px_minmax(0,1fr)]">
            <div>
              <h3 id="client-sla-section" className="text-sm font-semibold text-fg">Daily ad-spend SLA</h3>
              <p className="mt-1 text-xs leading-4 text-muted">Optional tracking for the configured daily cap.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="client-sla" className="mb-1.5 block">Agreed daily cap</label><input id="client-sla" type="number" min="0" inputMode="decimal" value={slaDailyBudget} onChange={(event) => setSlaDailyBudget(Number(event.target.value))} /></div>
              <div><label htmlFor="client-daily-spend" className="mb-1.5 block">Current daily spend</label><input id="client-daily-spend" type="number" min="0" inputMode="decimal" value={currentDailySpend} onChange={(event) => setCurrentDailySpend(Number(event.target.value))} /></div>
            </div>
          </section>

          <section aria-labelledby="client-notes-section" data-ams-drawer-layout="sections" className="grid gap-3 border-t border-line pt-4 sm:grid-cols-[160px_minmax(0,1fr)]">
            <div>
              <h3 id="client-notes-section" className="text-sm font-semibold text-fg">Notes & requirements</h3>
              <p className="mt-1 text-xs leading-4 text-muted">Preferences, requirements, billing context, or operational notes.</p>
            </div>
            <textarea id="client-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Client preferences, requirements, billing notes..." className="resize-y" />
          </section>
        </form>
      </Drawer>
      <Drawer
        slug="client-interaction-create-drawer"
        open={interactionDrawerOpen}
        onClose={closeInteractionDrawer}
        closeOnEscape={!interactionSaving}
        size="lg"
        title="Log client interaction"
        description={interactionClient ? 'Record a persistent relationship update for ' + interactionClient.company + '.' : 'Record a persistent client relationship update.'}
        footer={<div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={interactionSaving} onClick={closeInteractionDrawer}>Cancel</Button><Button type="submit" form="client-interaction-form" variant="primary" loading={interactionSaving} disabled={interactionSaving} icon={<CheckCircle2 size={14} aria-hidden="true" />}>Save interaction</Button></div>}
      >
        <form id="client-interaction-form" onSubmit={saveClientInteraction} className="space-y-5" noValidate>
          {interactionFormError && <div role="alert" className="rounded-control border border-danger/30 bg-danger/10 p-3 text-xs leading-5 text-danger">{interactionFormError}</div>}
          {interactionClient && <div className="rounded-control border border-line bg-bg px-3 py-2.5"><p className="text-[10px] uppercase tracking-wide text-muted">Client</p><p className="mt-1 text-xs font-semibold text-fg">{interactionClient.company}</p><p className="mt-0.5 text-[10px] text-muted">{interactionClient.id}</p></div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="client-interaction-type" className="mb-1.5 block">Interaction type</label>
              <CustomSelect value={interactionForm.type} onChange={value => setInteractionForm(current => ({ ...current, type: value as ClientInteractionType }))} options={CLIENT_INTERACTION_OPTIONS} aria-label="Interaction type" className="w-full" triggerClassName="w-full" />
            </div>
            <div>
              <label htmlFor="client-interaction-date" className="mb-1.5 block">Date and time</label>
              <input id="client-interaction-date" type="datetime-local" required value={interactionForm.occurredAt} disabled={interactionSaving} onChange={event => setInteractionForm(current => ({ ...current, occurredAt: event.target.value }))} className="w-full" />
            </div>
          </div>
          <div>
            <label htmlFor="client-interaction-subject" className="mb-1.5 block">Subject <span className="text-danger">*</span></label>
            <input id="client-interaction-subject" type="text" required maxLength={160} value={interactionForm.subject} disabled={interactionSaving} onChange={event => setInteractionForm(current => ({ ...current, subject: event.target.value }))} placeholder="e.g. Website scope alignment" className="w-full" />
          </div>
          <div>
            <label htmlFor="client-interaction-summary" className="mb-1.5 block">Summary <span className="text-danger">*</span></label>
            <textarea id="client-interaction-summary" rows={4} required maxLength={4000} value={interactionForm.summary} disabled={interactionSaving} onChange={event => setInteractionForm(current => ({ ...current, summary: event.target.value }))} placeholder="Record what was discussed, decisions, concerns, or requests." className="w-full resize-y" />
            <p className="mt-1 text-[10px] text-muted">{interactionForm.summary.length}/4000 characters</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="client-interaction-contact" className="mb-1.5 block">Contact person</label>
              <input id="client-interaction-contact" value={interactionForm.contactName} maxLength={160} disabled={interactionSaving} onChange={event => setInteractionForm(current => ({ ...current, contactName: event.target.value }))} placeholder="Client contact" className="w-full" />
            </div>
            <div>
              <label htmlFor="client-interaction-outcome" className="mb-1.5 block">Outcome</label>
              <input id="client-interaction-outcome" value={interactionForm.outcome} maxLength={1000} disabled={interactionSaving} onChange={event => setInteractionForm(current => ({ ...current, outcome: event.target.value }))} placeholder="Decision or agreement" className="w-full" />
            </div>
          </div>
          <div>
            <label htmlFor="client-interaction-next-step" className="mb-1.5 block">Next step</label>
            <input id="client-interaction-next-step" value={interactionForm.nextStep} maxLength={500} disabled={interactionSaving} onChange={event => setInteractionForm(current => ({ ...current, nextStep: event.target.value }))} placeholder="Action owner or follow-up" className="w-full" />
          </div>
          <p className="text-[10px] leading-4 text-muted">Entries are saved to AMS and visible to users with Client or CRM access. Do not include passwords, payment credentials, or other secrets.</p>
        </form>
      </Drawer>

      <Modal
        open={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        busy={isDeleting}
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