import React, { useEffect, useState, useMemo } from 'react';
// Shared module chrome renders the canonical ams-dashboard-header primitive.
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Skeleton } from '../../components/ui/Skeleton';
import { 
  Inbox, 
  Mail, 
  Phone, 
  Filter, 
  Search, 
  RefreshCw, 
  Trash2, 
  ExternalLink,
  MessageSquare, 
  Briefcase, 
  Globe, 
  Download, 
  Copy, 
  Plus, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  Check, 
  Tag, 
  DollarSign,
  Star,
  Layers,
  Calendar,
  Send,
  User,
  Clock,
  Building2,
  FileText,
  HelpCircle,
  TrendingUp,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { ContactSubmission, getSubmissionSlug, normalizeContactSubmission } from '../../lib/submissions';
import { CrmLead } from '../../lib/crmStore';
import { 
  formatAmount, 
  getActiveCurrency, 
  CurrencyCode, 
  CURRENCY_EVENT 
} from '../../lib/currency';
import { EmailForwardingGuideModal } from '../../components/EmailForwardingGuideModal';
import { CannedResponsesModal } from '../../components/admin/inbox/CannedResponsesModal';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { ConvertToCrmModal } from '../../components/admin/inbox/ConvertToCrmModal';
import { Modal } from '../../components/ui/Modal';
import { useLanguage } from '../../lib/LanguageContext';
import { api } from '../../lib/apiClient';
import { hasAdminPermission } from '../../lib/adminAuth';

import { AdminMetricStrip, AdminModuleHeader, AdminTablePagination , AdminPageShell } from '../../components/admin/AdminModulePrimitives';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';
export const AdminInbox: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const canManageCrm = hasAdminPermission('canManageCrm');
  type InboxTab = 'overview' | 'client' | 'jobs' | 'starred';
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('view') as InboxTab | null;
  const activeInboxTab: InboxTab = requestedTab && ['overview', 'client', 'jobs', 'starred'].includes(requestedTab)
    ? requestedTab
    : 'client';

  // Core Data & Currency
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [crmDeals, setCrmDeals] = useState<CrmLead[]>([]);

  // Filters & Views
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [onlyStarred, setOnlyStarred] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'split' | 'table'>('split');

  // Selection & Panels
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [detailTab, setDetailTab] = useState<'brief' | 'notes' | 'specs'>('brief');
  const [internalNoteDraft, setInternalNoteDraft] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Modals & Feedback
  const [isCannedModalOpen, setIsCannedModalOpen] = useState(false);
  const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [prevCount, setPrevCount] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; link?: string; linkText?: string; tone?: 'success' | 'danger' } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'mark-read'; id?: string; count?: number; targetStatus?: ContactSubmission['status'] } | null>(null);

  // Sync Currency
  useEffect(() => {
    const handleCurrencyChange = (e: any) => {
      setCurrency(e.detail?.currency || getActiveCurrency());
    };
    window.addEventListener(CURRENCY_EVENT, handleCurrencyChange);
    return () => window.removeEventListener(CURRENCY_EVENT, handleCurrencyChange);
  }, []);

  // Server-backed inbox refresh. The API is the only source of truth.
  const refreshInbox = async () => {
    setLoading(true);
    try {
      const [res, dealsRes] = await Promise.all([
        api.leads.getAll(),
        api.crm.getDeals()
      ]);

      if (dealsRes.success && Array.isArray(dealsRes.data?.deals)) {
        setCrmDeals(dealsRes.data.deals as CrmLead[]);
      }

      if (!res.success || !Array.isArray(res.data?.leads)) {
        setToastMessage({
          text: res.error || (language === 'id' ? 'Inbox gagal dimuat.' : 'Inbox could not be loaded.'),
          tone: 'danger'
        });
        return;
      }

      const items = (res.data.leads as ContactSubmission[]).map(normalizeContactSubmission);
      setSubmissions(items);
      setPrevCount(items.length);
    } catch {
      setToastMessage({
        text: language === 'id' ? 'Inbox gagal dimuat. Coba lagi.' : 'Inbox could not be loaded. Please retry.',
        tone: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshInbox();
    const timer = window.setInterval(() => void refreshInbox(), 30000);
    return () => window.clearInterval(timer);
  }, []);


  const activeTabItems = useMemo(() => {
    switch (activeInboxTab) {
      case 'overview': return submissions;
      case 'jobs': return submissions.filter((item) => item.type === 'career');
      case 'starred': return submissions.filter((item) => !!item.starred);
      case 'client':
      default: return submissions.filter((item) => item.type !== 'career');
    }
  }, [activeInboxTab, submissions]);

  const isMixedInboxTab = activeInboxTab === 'overview' || activeInboxTab === 'starred';
  const inboxStatusOptions = activeInboxTab === 'jobs'
    ? [
        { value: 'all', label: language === 'id' ? 'Semua Status' : 'All Status' },
        { value: 'new', label: 'Status: New' },
        { value: 'screening', label: 'Status: Screening' },
        { value: 'shortlisted', label: 'Status: Shortlisted' },
        { value: 'interview', label: 'Status: Interview' },
        { value: 'hired', label: 'Status: Hired' },
        { value: 'rejected', label: 'Status: Rejected' },
        { value: 'withdrawn', label: 'Status: Withdrawn' }
      ]
    : activeInboxTab === 'client'
      ? [
          { value: 'all', label: language === 'id' ? 'Semua Status' : 'All Status' },
          { value: 'new', label: 'Status: New' },
          { value: 'in-review', label: 'Status: In Review' },
          { value: 'contacted', label: 'Status: Contacted' },
          { value: 'closed', label: 'Status: Closed Deal' }
        ]
      : [
          { value: 'all', label: language === 'id' ? 'Semua Status' : 'All Status' },
          { value: 'new', label: 'Status: New' },
          { value: 'in-review', label: 'Status: In Review' },
          { value: 'contacted', label: 'Status: Contacted' },
          { value: 'closed', label: 'Status: Closed Deal' },
          { value: 'screening', label: 'Status: Screening' },
          { value: 'shortlisted', label: 'Status: Shortlisted' },
          { value: 'interview', label: 'Status: Interview' },
          { value: 'hired', label: 'Status: Hired' },
          { value: 'rejected', label: 'Status: Rejected' },
          { value: 'withdrawn', label: 'Status: Withdrawn' }
        ];

  const inboxTabs: Array<{ key: InboxTab; label: string; count: number }> = [
    { key: 'overview', label: 'Overview', count: submissions.length },
    { key: 'client', label: 'Client Inbox', count: submissions.filter((item) => item.type !== 'career').length },
    { key: 'jobs', label: 'Job Applications', count: submissions.filter((item) => item.type === 'career').length },
    { key: 'starred', label: 'Starred', count: submissions.filter((item) => !!item.starred).length }
  ];
  const inboxTabHref = (tab: InboxTab) => tab === 'client' ? '/admin/inbox' : '/admin/inbox?view=' + tab;

  useEffect(() => {
    setSelectedSubmission(null);
    setPage(1);
    setFilterStatus('all');
    setFilterPriority('all');
    setSearchQuery('');
  }, [activeInboxTab]);

  // Keep selected submission in sync with store
  useEffect(() => {
    if (selectedSubmission) {
      const updated = submissions.find(s => s.id === selectedSubmission.id);
      if (updated) {
        setSelectedSubmission(updated);
        setInternalNoteDraft(updated.internalNotes || '');
      }
    }
  }, [submissions]);

  // When clicking a submission
  const handleSelectSubmission = (sub: ContactSubmission) => {
    setSelectedSubmission(sub);
    setInternalNoteDraft(sub.internalNotes || '');
    setDetailTab('brief');
  };

  // Status update
  const handleStatusChange = async (id: string, newStatus: ContactSubmission['status']) => {
    if (!canManageCrm) {
      setToastMessage({ text: language === 'id' ? 'Anda tidak memiliki izin mengelola Leads & Inbox.' : 'You do not have CRM permission.', tone: 'danger' });
      window.setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setIsUpdating(true);
    try {
      const res = await api.leads.update(id, { status: newStatus });
      if (!res.success) throw new Error(res.error || 'Status update failed');
      await refreshInbox();
    } catch (err) {
      setToastMessage({
        text: language === 'id'
          ? 'Status lead gagal diperbarui. Periksa koneksi lalu coba lagi.'
          : 'Lead status could not be updated. Check your connection and try again.',
        tone: 'danger'
      });
      window.setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  // Priority update
  const handlePriorityChange = async (id: string, newPriority: ContactSubmission['priority']) => {
    if (!canManageCrm) {
      setToastMessage({ text: language === 'id' ? 'Anda tidak memiliki izin mengelola Leads & Inbox.' : 'You do not have CRM permission.', tone: 'danger' });
      window.setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    try {
      const res = await api.leads.update(id, { priority: newPriority });
      if (!res.success) throw new Error(res.error || 'Priority update failed');
      await refreshInbox();
    } catch (err) {
      setToastMessage({
        text: language === 'id'
          ? 'Prioritas lead gagal diperbarui. Coba lagi.'
          : 'Lead priority could not be updated. Please try again.',
        tone: 'danger'
      });
      window.setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Assignee update
  const handleAssigneeChange = async (id: string, assignee: string) => {
    if (!canManageCrm) {
      setToastMessage({ text: language === 'id' ? 'Anda tidak memiliki izin mengelola Leads & Inbox.' : 'You do not have CRM permission.', tone: 'danger' });
      window.setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    try {
      const res = await api.leads.update(id, { assignedTo: assignee });
      if (!res.success) throw new Error(res.error || 'Assignee update failed');
      await refreshInbox();
    } catch (err) {
      setToastMessage({
        text: language === 'id'
          ? 'Assignee lead gagal diperbarui. Coba lagi.'
          : 'Lead assignee could not be updated. Please try again.',
        tone: 'danger'
      });
      window.setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Star toggle
  const handleToggleStar = async (e: React.MouseEvent, id: string, currentStarred?: boolean) => {
    if (!canManageCrm) {
      setToastMessage({ text: language === 'id' ? 'Anda tidak memiliki izin mengelola Leads & Inbox.' : 'You do not have CRM permission.', tone: 'danger' });
      window.setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    e.stopPropagation();
    try {
      const res = await api.leads.update(id, { starred: !currentStarred });
      if (!res.success) throw new Error(res.error || 'Star update failed');
      await refreshInbox();
    } catch (err) {
      setToastMessage({
        text: language === 'id'
          ? 'Status bintang gagal diperbarui. Coba lagi.'
          : 'Starred state could not be updated. Please try again.',
        tone: 'danger'
      });
      window.setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Save internal notes
  const handleSaveInternalNote = async () => {
    if (!selectedSubmission || !canManageCrm) return;
    setIsSavingNote(true);
    try {
      const res = await api.leads.update(selectedSubmission.id, { internalNotes: internalNoteDraft });
      if (!res.success) throw new Error(res.error || 'Notes update failed');
      await refreshInbox();
      setToastMessage({
        text: language === 'id' ? 'Catatan internal agensi berhasil disimpan.' : 'Internal team notes saved successfully.'
      });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setToastMessage({
        text: language === 'id'
          ? 'Catatan internal gagal disimpan. Periksa koneksi lalu coba lagi.'
          : 'Internal notes could not be saved. Check your connection and try again.',
        tone: 'danger'
      });
      window.setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Delete submission
  const handleDelete = async (id: string) => {
    if (!canManageCrm) return;
    setConfirmAction({ type: 'delete', id });
  };

  const confirmDelete = async (id: string) => {
    try {
      const res = await api.leads.delete(id);
      if (!res.success) throw new Error(res.error || 'Delete failed');
      await refreshInbox();
      if (selectedSubmission?.id === id) setSelectedSubmission(null);
      setToastMessage({
        text: language === 'id' ? 'Pesan telah dihapus.' : 'Record deleted successfully.'
      });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setToastMessage({
        text: language === 'id'
          ? 'Lead gagal dihapus. Coba lagi.'
          : 'The lead could not be deleted. Please try again.',
        tone: 'danger'
      });
      window.setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setConfirmAction(null);
    }
  };

  // Mark all new as the next triage stage for the active inbox.
  const handleMarkAllRead = async () => {
    if (!canManageCrm) return;
    const count = activeTabItems.filter((item) => item.status === 'new').length;
    if (count > 0) {
      setConfirmAction({
        type: 'mark-read',
        count,
        targetStatus: activeInboxTab === 'jobs' ? 'screening' : 'in-review'
      });
    }
  };

  const confirmMarkAllRead = async (count: number, targetStatus: ContactSubmission['status']) => {
    try {
      const unread = activeTabItems.filter((item) => item.status === 'new');
      for (const item of unread) {
        const res = await api.leads.update(item.id, { status: targetStatus });
        if (!res.success) throw new Error(res.error || 'Bulk status update failed');
      }
      await refreshInbox();
      setToastMessage({
        text: language === 'id'
          ? String(count) + (activeInboxTab === 'jobs' ? ' lamaran dipindahkan ke screening.' : ' pesan ditandai telah ditinjau.')
          : String(count) + (activeInboxTab === 'jobs' ? ' applications moved to Screening.' : ' messages marked as In Review.')
      });
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage({
        text: language === 'id' ? 'Pesan gagal diperbarui. Coba lagi.' : 'Records could not be updated. Please try again.',
        tone: 'danger'
      });
      window.setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setConfirmAction(null);
    }
  };


  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clean WhatsApp number
  const cleanPhoneForWhatsApp = (rawPhone?: string) => {
    if (!rawPhone) return '';
    let digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '62' + digits.substring(1);
    return digits;
  };

  // Relative timestamp calculation
  const formatRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diffSec < 60) return language === 'id' ? 'Baru saja' : 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ${language === 'id' ? 'lalu' : 'ago'}`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ${language === 'id' ? 'lalu' : 'ago'}`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ${language === 'id' ? 'lalu' : 'ago'}`;
      return d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Estimated deal value parser from string
  const estimateDealValue = (sub: ContactSubmission): number => {
    if (sub.budget) {
      const b = sub.budget.toLowerCase();
      if (b.includes('25,000') || b.includes('50,000') || b.includes('100jt') || b.includes('100m')) return 120000000;
      if (b.includes('10,000') || b.includes('50jt')) return 75000000;
      if (b.includes('5,000') || b.includes('15,000') || b.includes('25jt')) return 45000000;
    }
    return 35000000;
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = activeTabItems.length;
    const newCount = activeTabItems.filter((item) => item.status === 'new').length;
    const convertedCount = activeInboxTab === 'jobs'
      ? activeTabItems.filter((item) => item.status === 'hired').length
      : activeTabItems.filter((item) => crmDeals.some((deal) => (deal as any).inquiryId === item.id)).length;
    const conversionRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;
    const totalPipelineValue = activeTabItems.reduce((acc, item) => acc + estimateDealValue(item), 0);
    const interviewCount = activeTabItems.filter((item) => item.status === 'interview').length;

    return { total, newCount, convertedCount, conversionRate, totalPipelineValue, interviewCount };
  }, [activeInboxTab, activeTabItems, crmDeals]);

  // Filtering
  const filteredItems = useMemo(() => {
    return activeTabItems.filter(item => {
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || (item.priority || 'normal') === filterPriority;
      const matchesStarred = !onlyStarred || !!item.starred;

      const queryLower = searchQuery.toLowerCase().trim();
      const matchesSearch = !queryLower || (
        (item.fullName || '').toLowerCase().includes(queryLower) ||
        (item.email || '').toLowerCase().includes(queryLower) ||
        (item.company || '').toLowerCase().includes(queryLower) ||
        (item.message || '').toLowerCase().includes(queryLower) ||
        (item.positionTitle || '').toLowerCase().includes(queryLower) ||
        (item.services || []).some(s => s.toLowerCase().includes(queryLower)) ||
        (item.source || '').toLowerCase().includes(queryLower) ||
        (item.positionTitle || '').toLowerCase().includes(queryLower) ||
        (item.specialty || '').toLowerCase().includes(queryLower) ||
        (item.tools || '').toLowerCase().includes(queryLower) ||
        (item.resumeUrl || '').toLowerCase().includes(queryLower) ||
        (item.linkedinUrl || '').toLowerCase().includes(queryLower)
      );

      return matchesStatus && matchesPriority && matchesStarred && matchesSearch;
    });
  }, [activeTabItems, filterStatus, filterPriority, onlyStarred, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage((current) => Math.min(current, pageCount)); }, [pageCount]);
  useEffect(() => { setPage(1); }, [activeInboxTab, filterStatus, filterPriority, onlyStarred, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (submissions.length === 0) return;
    const headers = ['ID', 'Date', 'Type', 'Status', 'Priority', 'Full Name', 'Email', 'Company', 'Phone', 'Services', 'Budget', 'Converted To CRM', 'Message', 'Source'];
    const rows = activeTabItems.map(s => [
      `"${s.id}"`,
      `"${new Date(s.createdAt).toLocaleString()}"`,
      `"${s.type || 'inquiry'}"`,
      `"${s.status}"`,
      `"${s.priority || 'normal'}"`,
      `"${(s.fullName || '').replace(/"/g, '""')}"`,
      `"${s.email || ''}"`,
      `"${(s.company || '').replace(/"/g, '""')}"`,
      `"${s.phone || ''}"`,
      `"${(s.services || []).join(', ')}"`,
      `"${s.budget || ''}"`,
      `"${crmDeals.some(d => (d as any).inquiryId === s.id) ? 'YES' : 'NO'}`,
      `"${(s.message || '').replace(/"/g, '""')}"`,
      `"${s.source || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'kapitech_' + (activeInboxTab === 'jobs' ? 'job_applications' : 'client_inbox') + '_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for channel badges
  const renderChannelBadge = (type?: string) => {
    switch (type) {
      case 'career':
        return (
          <span className="px-2 py-0.5 rounded-chip bg-info/10 border border-info/30 text-info text-[10px] font-sans flex items-center gap-1">
            <Briefcase size={10} />
            <span>Job Application</span>
          </span>
        );
      case 'vendor':
        return (
          <span className="px-2 py-0.5 rounded-chip bg-panel border border-line text-muted text-[10px] font-sans flex items-center gap-1">
            <Globe size={10} />
            <span>Freelance Vendor</span>
          </span>
        );
      case 'newsletter':
        return (
          <span className="px-2 py-0.5 rounded-chip bg-warning/10 border border-warning/30 text-warning text-[10px] font-sans flex items-center gap-1">
            <Sparkles size={10} />
            <span>Newsletter</span>
          </span>
        );
      case 'inquiry':
      default:
        return (
          <span className="px-2 py-0.5 rounded-chip bg-info/10 border border-info/30 text-info text-[10px] font-sans flex items-center gap-1 font-semibold">
            <MessageSquare size={10} />
            <span>Client Inquiry</span>
          </span>
        );
    }
  };

  // Status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-2 py-0.5 rounded-chip text-[10px] font-sans bg-danger/10 text-danger border border-danger/30 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-danger " />
            <span>New</span>
          </span>
        );
      case 'in-review':
        return (
          <span className="px-2 py-0.5 rounded-chip text-[10px] font-sans bg-warning/10 text-warning border border-warning/30">
            In Review
          </span>
        );
      case 'contacted':
        return (
          <span className="px-2 py-0.5 rounded-chip text-[10px] font-sans bg-info/10 text-info border border-info/30">
            Contacted
          </span>
        );
      case 'closed':
        return (
          <span className="px-2 py-0.5 rounded-chip text-[10px] font-sans bg-success/10 text-success border border-success/30 font-semibold">
            Closed Deal
          </span>
        );
      case 'screening':
        return <span className="px-2 py-0.5 rounded-chip text-[10px] font-sans bg-warning/10 text-warning border border-warning/30">Screening</span>;
      case 'shortlisted':
        return <span className="px-2 py-0.5 rounded-chip text-[10px] font-sans bg-info/10 text-info border border-info/30">Shortlisted</span>;
      case 'interview':
        return <span className="px-2 py-0.5 rounded-chip text-[10px] font-sans bg-info/10 text-info border border-info/30">Interview</span>;
      case 'hired':
        return <span className="px-2 py-0.5 rounded-chip text-[10px] font-sans bg-success/10 text-success border border-success/30 font-semibold">Hired</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-chip text-[10px] font-sans bg-danger/10 text-danger border border-danger/30">Rejected</span>;
      case 'withdrawn':
        return <span className="px-2 py-0.5 rounded-chip text-[10px] font-sans bg-panel text-muted border border-line">Withdrawn</span>;
      default:
        return (
          <span className="px-2 py-0.5 rounded-chip text-[10px] font-sans bg-panel text-muted border border-line">
            {status}
          </span>
        );
    }
  };

  // Priority indicator
  const renderPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-1.5 py-0.5 rounded-badge text-[9px] font-sans bg-danger/10 text-danger border border-danger/30 font-semibold">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="px-1.5 py-0.5 rounded-badge text-[9px] font-sans bg-warning/10 text-warning border border-warning/30">
            High
          </span>
        );
      case 'low':
        return (
          <span className="px-1.5 py-0.5 rounded-badge text-[9px] font-sans bg-panel-hover text-muted border border-line">
            Low
          </span>
        );
      case 'normal':
      default:
        return null;
    }
  };

  // Find linked lead if converted
  const linkedLead = useMemo(() => {
    if (!selectedSubmission) return null;
    return crmDeals.find(l => (l as any).inquiryId === selectedSubmission.id) || null;
  }, [selectedSubmission, crmDeals]);

  return (
    <AdminPageShell featureSlug="inbox-module" className="ams-inbox-page">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-3 sm:p-4 rounded-card text-xs font-sans flex items-start sm:items-center justify-between gap-2 animate-in fade-in duration-300 ${toastMessage.tone === 'danger' ? 'bg-danger/10 border border-danger/30 text-danger' : 'bg-success/10 border border-success/30 text-success'}`}>
          <div className="flex items-center gap-2.5">
            {toastMessage.tone === 'danger' ? <AlertCircle size={16} className="text-danger shrink-0" aria-hidden="true" /> : <Check size={16} className="text-success shrink-0" aria-hidden="true" />}
            <span>{toastMessage.text}</span>
          </div>
          {toastMessage.link && (
            <Link
              to={toastMessage.link}
              className="px-3 py-1 rounded-control bg-success text-bg font-medium hover:bg-success/90 transition-colors flex items-center gap-1 shrink-0 ml-3"
            >
              <span>{toastMessage.linkText || 'Open'}</span>
              <ExternalLink size={11} />
            </Link>
          )}
        </div>
      )}

      <AdminModuleHeader slug="inbox-header"
        className="mb-0"
        title="Inbox"
        description={language === 'id' ? 'Kelola seluruh inbound dari website: inquiry klien dan lamaran kerja dalam satu alur operasional AMS.' : 'Manage all website inbound in one operational flow: client inquiries and job applications.'}
        actions={(
          <>
            <span className="text-[11px] tabular-nums text-muted">{activeTabItems.length} inbound</span>
            <button type="button" onClick={() => setIsEmailModalOpen(true)} className="ams-action inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent" title={language === 'id' ? 'Buka pengaturan notifikasi email' : 'Open email alert settings'}><Mail size={14} /><span>{language === 'id' ? 'Notifikasi Email' : 'Email Alerts'}</span></button>
            {metrics.newCount > 0 && <button type="button" onClick={handleMarkAllRead} disabled={!canManageCrm} className="ams-action inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent"><Check size={14} /><span>{activeInboxTab === 'jobs'
    ? (language === 'id' ? 'Mulai Screening' : 'Start Screening')
    : (language === 'id' ? 'Tandai Dibaca' : 'Mark Read')}</span></button>}
            {activeTabItems.length > 0 && <button type="button" onClick={handleExportCSV} className="ams-action inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent"><Download size={14} /><span>Export CSV</span></button>}
          </>
        )}
      />
      <div data-ams-feature-slug="inbox-top-navigation" data-ams-slug="inbox-top-navigation" className="mb-6 min-w-0">
        <nav aria-label="Inbox sections" className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-control border border-line bg-panel p-1 custom-scrollbar">
          {inboxTabs.map((tab) => {
            const active = activeInboxTab === tab.key;
            return (
              <Link
                key={tab.key}
                to={inboxTabHref(tab.key)}
                aria-current={active ? 'page' : undefined}
                data-ams-slug={'inbox-tab-' + tab.key}
                className={'inline-flex h-9 min-h-9 shrink-0 items-center gap-2 rounded-chip border px-3 text-xs font-medium transition-colors ' + (
                  active
                    ? 'border-accent/25 bg-accent/10 text-fg font-semibold'
                    : 'border-transparent text-muted hover:bg-bg hover:text-fg'
                )}
              >
                <span>{tab.label}</span>
                <span className={'rounded-badge px-1.5 py-0.5 text-[10px] tabular-nums ' + (active ? 'bg-accent/15 text-accent-text' : 'bg-bg text-muted')}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. EXECUTIVE KPI SUMMARY RIBBON */}
      <section data-ams-feature-slug="inbox-performance-snapshot" data-ams-slug="inbox-performance-snapshot" aria-label="Inbox performance snapshot" className="rounded-card border border-line bg-panel p-4">
        <div className="mb-3 flex items-end justify-between gap-3 border-b border-line pb-3">
          <div>
            <h2 className="text-sm font-semibold text-fg">
              {activeInboxTab === 'jobs'
                ? (language === 'id' ? 'Ringkasan rekrutmen' : 'Recruitment snapshot')
                : (language === 'id' ? 'Ringkasan client inbox' : 'Client inbox snapshot')}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {activeInboxTab === 'jobs'
                ? (language === 'id' ? 'Intake, screening, interview, dan hiring pipeline.' : 'Intake, screening, interview, and hiring pipeline.')
                : (language === 'id' ? 'Intake, triage, konversi, dan estimasi peluang.' : 'Intake, triage, conversion, and estimated opportunity volume.')}
            </p>
          </div>
          <span className="text-[11px] font-medium tabular-nums text-muted">{metrics.total} inbound</span>
        </div>
        <AdminMetricStrip slug="inbox-kpis"
          className="lg:grid-cols-4"
          metrics={[
            {
              id: 'total',
              label: activeInboxTab === 'jobs' ? (language === 'id' ? 'Total Lamaran' : 'Total Applications') : (language === 'id' ? 'Total Inquiry' : 'Total Inquiries'),
              value: metrics.total,
              context: activeInboxTab === 'jobs' ? (language === 'id' ? 'Semua lamaran masuk' : 'All applications received') : (language === 'id' ? 'Semua inbound klien' : 'All client inbound'),
              sparkline: [metrics.total, metrics.newCount, metrics.convertedCount, metrics.conversionRate],
              icon: <Inbox size={16} strokeWidth={1.8} />
            },
            {
              id: 'action',
              label: language === 'id' ? 'Perlu Ditinjau' : 'Action Needed',
              value: <span className="inline-flex items-center gap-2 text-danger">{metrics.newCount}{metrics.newCount > 0 && <span className="h-2 w-2 rounded-full bg-danger" />}</span>,
              context: activeInboxTab === 'jobs' ? (language === 'id' ? 'Belum masuk screening' : 'Awaiting screening') : (language === 'id' ? 'Belum dikualifikasi' : 'Pending initial triage'),
              sparkline: [metrics.total, metrics.newCount, metrics.convertedCount],
              icon: <AlertCircle size={16} strokeWidth={1.8} />,
              toneClassName: 'text-danger'
            },
            {
              id: 'progress',
              label: activeInboxTab === 'jobs' ? 'Hired' : (language === 'id' ? 'Dikonversi ke CRM' : 'Converted to CRM'),
              value: metrics.convertedCount,
              context: activeInboxTab === 'jobs' ? (language === 'id' ? metrics.conversionRate + '% dari total lamaran' : metrics.conversionRate + '% of total applications') : metrics.conversionRate + '% conversion',
              sparkline: [0, metrics.newCount, metrics.convertedCount, metrics.conversionRate],
              icon: activeInboxTab === 'jobs' ? <User size={16} strokeWidth={1.8} /> : <Briefcase size={16} strokeWidth={1.8} />,
              toneClassName: 'text-success'
            },
            {
              id: 'pipeline',
              label: activeInboxTab === 'jobs' ? 'Interview' : (language === 'id' ? 'Volume Peluang' : 'Opportunity Volume'),
              value: activeInboxTab === 'jobs' ? metrics.interviewCount : formatAmount(metrics.totalPipelineValue, currency),
              context: activeInboxTab === 'jobs' ? (language === 'id' ? 'Tahap interview aktif' : 'Active interview stage') : (language === 'id' ? 'Estimasi nilai brief masuk' : 'Estimated inbound opportunity value'),
              sparkline: activeInboxTab === 'jobs' ? [metrics.newCount, metrics.interviewCount, metrics.convertedCount] : activeTabItems.slice(0, 8).map(estimateDealValue),
              icon: activeInboxTab === 'jobs' ? <Calendar size={16} strokeWidth={1.8} /> : <TrendingUp size={16} strokeWidth={1.8} />,
              toneClassName: 'text-success'
            }
          ]}
        />
      </section>

      {/* 3. INBOX CONTROLS */}
      <section
        data-ams-feature-slug="inbox-controls"
        data-ams-slug="inbox-controls"
        className="overflow-hidden rounded-card border border-line bg-panel"
      >
        <div className="flex flex-col gap-2.5 p-3 sm:p-4 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search inbox</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeInboxTab === 'jobs'
                ? (language === 'id' ? 'Cari kandidat, posisi, email, skill, atau tools...' : 'Search candidate, role, email, skills, or tools...')
                : isMixedInboxTab
                  ? (language === 'id' ? 'Cari nama, perusahaan, kandidat, posisi, atau email...' : 'Search names, companies, candidates, roles, or email...')
                  : (language === 'id' ? 'Cari nama, email, perusahaan, jasa, atau isi brief...' : 'Search name, email, company, services, or message...')}
              className="h-9 min-h-9 w-full rounded-control border border-line bg-bg pl-9 pr-8 text-xs text-fg outline-none placeholder:text-muted focus:border-accent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-badge text-muted hover:bg-panel hover:text-fg"
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
          </label>

          <div className="flex min-w-0 items-center gap-2 overflow-x-auto custom-scrollbar xl:shrink-0">
            <div className="w-[150px] shrink-0">
              <CustomSelect value={filterStatus} onChange={setFilterStatus} options={inboxStatusOptions} />
            </div>
            <div className="w-[150px] shrink-0">
              <CustomSelect
                value={filterPriority}
                onChange={setFilterPriority}
                options={[
                  { value: 'all', label: language === 'id' ? 'Semua Prioritas' : 'All Priorities' },
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'high', label: 'High' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'low', label: 'Low' }
                ]}
              />
            </div>
            <button
              type="button"
              onClick={() => setOnlyStarred(!onlyStarred)}
              className={'inline-flex h-9 min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-control border px-3 text-xs font-medium transition-colors ' + (
                onlyStarred
                  ? 'border-warning/30 bg-warning/10 text-warning'
                  : 'border-line bg-bg text-muted hover:bg-panel hover:text-fg'
              )}
            >
              <Star size={14} className={onlyStarred ? 'fill-warning text-warning' : ''} />
              <span>{language === 'id' ? 'Ditandai' : 'Starred'}</span>
            </button>
            <div className="ml-auto flex shrink-0 items-center rounded-control border border-line bg-bg p-0.5">
              <button type="button" onClick={() => setViewMode('split')} aria-pressed={viewMode === 'split'} className={'inline-flex h-8 min-h-8 items-center gap-1.5 rounded-chip px-2.5 text-[11px] font-medium ' + (viewMode === 'split' ? 'bg-panel border border-line text-fg' : 'text-muted hover:text-fg')}>
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button type="button" onClick={() => setViewMode('table')} aria-pressed={viewMode === 'table'} className={'inline-flex h-8 min-h-8 items-center gap-1.5 rounded-chip px-2.5 text-[11px] font-medium ' + (viewMode === 'table' ? 'bg-panel border border-line text-fg' : 'text-muted hover:text-fg')}>
                <TableIcon size={13} />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      
      {/* 4. MAIN CONTENT VIEW: SPLIT VIEW vs TABLE VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'table' ? (
        /* DENSE SPREADSHEET TABLE VIEW */
        <div className="bg-panel border border-line rounded-card overflow-hidden">
          <div className="ams-table-scroll overflow-x-auto custom-scrollbar">
            <div data-ams-feature-slug="inbox-leads-directory" data-ams-slug="inbox-leads-directory" className="overflow-x-auto"><table className="ams-table w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-panel border-b border-line text-muted">
                  <th className="p-3 w-10 text-center">★</th>
                  <th className="p-3">{activeInboxTab === 'jobs' ? (language === 'id' ? 'Kandidat & Posisi' : 'Candidate & Role') : (language === 'id' ? 'Klien & Perusahaan' : 'Client & Company')}</th>
                  <th className="p-3">{language === 'id' ? 'Kanal' : 'Channel'}</th>
                  <th className="p-3">{activeInboxTab === 'jobs' ? (language === 'id' ? 'Skill / Spesialisasi' : 'Skills / Specialty') : (language === 'id' ? 'Layanan Diminta' : 'Requested Services')}</th>
                  <th className="p-3">{activeInboxTab === 'jobs' ? (language === 'id' ? 'Pengalaman' : 'Experience') : (language === 'id' ? 'Estimasi Nilai' : 'Valuation')}</th>
                  <th className="p-3">{language === 'id' ? 'Status' : 'Status'}</th>
                  <th className="p-3">{language === 'id' ? 'Waktu' : 'Date'}</th>
                  <th className="p-3 text-right">{language === 'id' ? 'Aksi' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-muted">
                      <Inbox size={32} className="mx-auto text-line mb-2" />
                      <p>{language === 'id' ? 'Tidak ada data pesan yang sesuai kriteria.' : 'No records match your filters.'}</p>
                    </td>
                  </tr>
                ) : (
                  pagedItems.map((item) => {
                    const isConverted = crmDeals.some(d => (d as any).inquiryId === item.id);
                    return (
                      <tr 
                        key={item.id}
                        onClick={() => {
                          handleSelectSubmission(item);
                          setViewMode('split');
                        }}
                        className="hover:bg-panel-hover cursor-pointer transition-colors group"
                      >
                        {/* Star */}
                        <td className="p-3 text-center" onClick={(e) => handleToggleStar(e, item.id, item.starred)}>
                          <Star 
                            size={14} 
                            className={`mx-auto transition-colors ${
                              item.starred ? 'fill-warning text-warning' : 'text-muted hover:text-warning'
                            }`} 
                          />
                        </td>

                        {/* Name & Company */}
                        <td className="p-3">
                          <div className="font-semibold text-fg font-sans text-sm flex items-center gap-1.5">
                            <span>{item.fullName}</span>
                            {isConverted && activeInboxTab === 'client' && (
                              <span className="text-[9px] font-sans px-1.5 py-0.2 rounded-badge bg-success/10 text-success border border-success/30">
                                CRM ✓
                              </span>
                            )}
                            {activeInboxTab === 'jobs' && item.status === 'hired' && (
                              <span className="text-[9px] font-sans px-1.5 py-0.2 rounded-badge bg-success/10 text-success border border-success/30">
                                Hired ✓
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted truncate max-w-[200px]">
                            {activeInboxTab === 'jobs' ? (item.positionTitle || item.specialty || item.email) : (item.company || item.email)}
                          </div>
                        </td>

                        {/* Channel */}
                        <td className="p-3">
                          {renderChannelBadge(item.type)}
                        </td>

                        {/* Services */}
                        <td className="p-3 max-w-[200px]">
                          <div className="flex flex-wrap gap-1">
                            {activeInboxTab === 'jobs' ? (
                              <>
                                <span className="px-1.5 py-0.5 rounded-badge bg-panel border border-line text-[10px] text-fg">{item.positionTitle || 'Role not specified'}</span>
                                {item.specialty && <span className="px-1.5 py-0.5 rounded-badge bg-panel border border-line text-[10px] text-muted">{item.specialty}</span>}
                              </>
                            ) : (
                              <>
                                {item.services && item.services.length > 0 ? (
                                  item.services.slice(0, 2).map((svc, i) => (
                                    <span key={i} className="px-1.5 py-0.5 rounded-badge bg-panel border border-line text-[10px] text-fg">{svc}</span>
                                  ))
                                ) : (
                                  <span className="text-muted text-[10px]">{item.specialty || '-'}</span>
                                )}
                                {item.services && item.services.length > 2 && (
                                  <span className="text-[10px] text-muted">+{item.services.length - 2}</span>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* Value / Experience */}
                        <td className="p-3 font-semibold text-fg">
                          {activeInboxTab === 'jobs'
                            ? (item.experienceYears ? item.experienceYears + ' yrs' : '-')
                            : formatAmount(estimateDealValue(item), currency)}
                        </td>

                        {/* Status & Priority */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {renderStatusBadge(item.status)}
                            {renderPriorityBadge(item.priority)}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="p-3 text-[11px] text-muted whitespace-nowrap">
                          {formatRelativeTime(item.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {item.phone && cleanPhoneForWhatsApp(item.phone) && (
                              <a
                                href={`https://wa.me/${cleanPhoneForWhatsApp(item.phone)}?text=Halo%20${encodeURIComponent(item.fullName)},%20terima%20kasih%20telah%20menghubungi%20Kapitech%20Agency...`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-control bg-success/10 hover:bg-success/15 text-success border border-success/20"
                                title="Chat on WhatsApp"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                            <button
                              onClick={() => {
                                handleSelectSubmission(item);
                                setViewMode('split');
                              }}
                              className="px-2.5 py-1 rounded-control bg-panel hover:bg-panel-hover text-muted hover:text-fg border border-line text-[11px]"
                            >
                              {language === 'id' ? 'Buka' : 'Inspect'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table></div>
          </div>
          <AdminTablePagination total={filteredItems.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel={activeInboxTab === 'jobs' ? 'applications' : 'inbound records'} slug={'inbox-' + activeInboxTab + '-pagination'} />
        </div>
      ) : loading ? (
        <div className="rounded-card border border-line bg-panel p-4" role="status" aria-label="Loading inbox records">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                <Skeleton className="h-8 w-8 shrink-0 rounded-control" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-56 max-w-full" />
                  <Skeleton className="h-3 w-80 max-w-full" />
                </div>
                <Skeleton className="hidden h-3 w-20 sm:block" />
              </div>
            ))}
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        /* SINGLE UNIFIED EMPTY STATE - PREVENTS DUPLICATE BOXES */
        <div className="ams-empty-state bg-panel border border-line rounded-card p-12 sm:p-16 text-center text-muted space-y-4 flex flex-col items-center">
          <div className="w-16 h-16 rounded-card bg-panel border border-line flex items-center justify-center text-line mx-auto">
            <Inbox size={32} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-fg font-semibold font-sans text-base sm:text-lg text-center">
              {submissions.length === 0
                ? (language === 'id' ? 'Kotak Masuk Masih Kosong' : 'No Inbound Records Found')
                : (language === 'id' ? 'Tidak Ada Pesan yang Sesuai Kriteria' : 'No Inbound Records Match Your Filters')}
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-md mx-auto font-sans leading-relaxed text-center">
              {submissions.length === 0
                ? (language === 'id'
                    ? 'Belum ada brief proyek klien, lamaran karir, atau pesan masuk dari formulir website.'
                    : 'All client project briefs, career applications, and inquiries from the public website will appear here in real time.')
                : (language === 'id'
                    ? 'Sesuaikan kata kunci pencarian, status filter, atau ganti kategori kanal di atas.'
                    : 'Try adjusting your search query, status filters, or switching channel tabs.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {(searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || onlyStarred) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterPriority('all');
                  setOnlyStarred(false);
                }}
                className="min-h-10 px-4 rounded-control bg-panel hover:bg-panel-hover text-fg border border-line text-xs font-sans font-medium transition-colors"
              >
                {language === 'id' ? 'Reset Semua Filter' : 'Reset All Filters'}
              </button>
            )}

          </div>
        </div>
      ) : (
        /* SPLIT MASTER-DETAIL VIEW (when items exist) */
        <div className="ams-inbox-workspace grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.18fr)]">
          
          {/* Left: Master Briefs List Pane */}
          <div className={`ams-inbox-list-pane space-y-3 ${
            selectedSubmission 
              ? 'hidden lg:block' 
              : 'block'
          }`}>
            {filteredItems.map((item) => {
              const isSelected = selectedSubmission?.id === item.id;
              const isConverted = crmDeals.some(d => (d as any).inquiryId === item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectSubmission(item)}
                  className={`group relative rounded-card border p-3.5 font-sans transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-accent/8 border-accent/30'
                      : item.status === 'new'
                      ? 'bg-panel border-danger/30 hover:border-danger/50'
                      : 'bg-panel border-line hover:border-line hover:bg-panel-hover'
                  }`}
                >
                    {/* Top Row: Channel, Status, Star, Timestamp */}
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        {renderChannelBadge(item.type)}
                        {renderStatusBadge(item.status)}
                        {renderPriorityBadge(item.priority)}
                        {isConverted && (
                          <span className="px-1.5 py-0.5 rounded-badge text-[9px] font-sans bg-success/10 text-success border border-success/30 font-semibold">
                            CRM ✓
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleToggleStar(e, item.id, item.starred)}
                          disabled={!canManageCrm}
                          className="min-h-10 min-w-10 rounded-control flex items-center justify-center text-muted hover:text-warning hover:bg-warning/10 transition-colors focus-visible:outline-none" aria-label={item.starred ? "Unstar brief" : "Star brief"}
                        >
                          <Star size={13} className={item.starred ? 'fill-warning text-warning' : ''} />
                        </button>
                        <span className="text-[10px] text-muted">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Client Name & Company */}
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <ProfileIdentity profile={{ name: item.fullName || 'Anonymous Client', role: item.positionTitle || (item.type === 'career' ? 'Candidate' : 'Contact'), contextLabel: item.type === 'career' ? item.positionTitle : item.company, companyEmail: item.email, phone: item.phone }} size="sm" showRole={false} />
                      <span className="text-xs font-sans font-semibold text-success shrink-0">
                        {item.type === 'career' ? (item.experienceYears ? item.experienceYears + ' yrs' : '-') : formatAmount(estimateDealValue(item), currency)}
                      </span>
                    </div>

                    <div className="text-xs text-muted truncate mb-2">
                      {item.type === 'career'
                        ? [item.positionTitle || 'Role not specified', item.specialty, item.location].filter(Boolean).join(' · ')
                        : (item.company || item.email)}
                    </div>

                    {/* Service / Skill Tags */}
                    {(
                      item.type === 'career'
                        ? [item.positionTitle, item.specialty, item.experienceYears ? item.experienceYears + ' yrs' : undefined].filter(Boolean)
                        : (item.services || [])
                    ).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2.5">
                        {(
                          item.type === 'career'
                            ? [item.positionTitle, item.specialty, item.experienceYears ? item.experienceYears + ' yrs' : undefined].filter(Boolean) as string[]
                            : (item.services || [])
                        ).slice(0, 3).map((value, i) => (
                          <span key={i} className="text-[9px] font-sans px-1.5 py-0.5 rounded-badge bg-panel border border-line text-muted">
                            {value}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Message Preview */}
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed font-sans">
                      {item.message || (language === 'id' ? 'Tidak ada isi brief.' : 'No brief body provided.')}
                    </p>

                    {/* Bottom notes indicator if present */}
                    {item.internalNotes && (
                      <div className="mt-2.5 pt-2 border-t border-line flex items-center gap-1.5 text-[10px] text-warning/80">
                        <FileText size={11} />
                        <span className="truncate">{item.internalNotes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Right: Message Reader & Command Hub Pane */}
          {selectedSubmission ? (
            <div className="ams-inbox-reader-pane min-w-0 rounded-card border border-line bg-panel p-4 sm:p-5 lg:sticky lg:top-4 lg:min-h-[calc(100vh-250px)]">
              <div>
                
                {/* Mobile Back Button */}
                <div className="lg:hidden mb-4 pb-3 border-b border-line">
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="flex items-center gap-2 text-xs font-sans text-muted hover:text-fg transition-colors min-h-[44px]"
                  >
                    <ArrowLeft size={16} />
                    <span>{language === 'id' ? 'Kembali ke Daftar Pesan' : 'Back to Briefs List'}</span>
                  </button>
                </div>

                {/* Reader Header */}
                <div className="flex items-start justify-between gap-4 pb-5 border-b border-line mb-5">
                  <div className="flex items-start gap-3">
                    {/* Client Avatar Initials */}
                    <ProfileIdentity profile={{ name: selectedSubmission.fullName, role: selectedSubmission.positionTitle || (selectedSubmission.type === 'career' ? 'Candidate' : 'Contact'), companyEmail: selectedSubmission.email, phone: selectedSubmission.phone, division: selectedSubmission.company }} />

                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {renderChannelBadge(selectedSubmission.type)}
                        {renderStatusBadge(selectedSubmission.status)}
                        <span className="text-[10px] font-sans text-muted">
                          ID: {selectedSubmission.id}
                        </span>
                      </div>
                      
                      <h2 className="text-lg font-semibold tracking-[-0.01em] text-fg sm:text-xl">
                        {selectedSubmission.fullName}
                      </h2>

                      <p className="text-xs text-success font-sans mt-0.5 font-semibold flex items-center gap-1.5">
                        <Building2 size={12} />
                        <span>
                          {selectedSubmission.type === 'career'
                            ? ('Position: ' + (selectedSubmission.positionTitle || selectedSubmission.specialty || 'Role not specified'))
                            : (selectedSubmission.company || 'Individual Client')}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Star toggle */}
                    <button
                      onClick={(e) => handleToggleStar(e, selectedSubmission.id, selectedSubmission.starred)}
                      className="p-2 rounded-card bg-panel border border-line text-muted hover:text-warning transition-colors"
                      title="Star this brief"
                    >
                      <Star size={15} className={selectedSubmission.starred ? 'fill-warning text-warning' : ''} />
                    </button>

                    {/* Close button on desktop */}
                    <button
                      onClick={() => setSelectedSubmission(null)}
                      className="hidden lg:inline-flex text-xs text-muted hover:text-fg px-3 py-2 rounded-control bg-panel border border-line min-h-10 items-center" aria-label="Close brief"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Primary Action Ribbon (Quick Canned Replies, WA, Email, Convert to CRM) */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5 rounded-card border border-line bg-bg p-3.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeInboxTab === 'client' ? (
                      <>
                        {crmDeals.some(d => (d as any).inquiryId === selectedSubmission.id) ? (
                          <Link
                            to="/admin/crm"
                            className="h-9 px-3.5 rounded-control bg-success/10 text-success border border-success/30 hover:bg-success/20 text-xs font-sans font-semibold transition-all flex items-center gap-1.5"
                          >
                            <ShieldCheck size={14} />
                            <span>{language === 'id' ? 'Buka Deal di CRM' : 'View CRM Deal'}</span>
                            <ExternalLink size={11} />
                          </Link>
                        ) : (
                          <button
                            onClick={() => setIsCrmModalOpen(true)}
                            disabled={!canManageCrm}
                            className="h-9 px-3.5 rounded-control bg-success hover:bg-accent-hover text-fg text-xs font-sans font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <Briefcase size={14} />
                            <span>{language === 'id' ? 'Konversi ke CRM' : 'Convert to CRM'}</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {selectedSubmission.resumeUrl && (
                          <a href={selectedSubmission.resumeUrl} target="_blank" rel="noopener noreferrer" className="h-9 px-3.5 rounded-control bg-info/10 text-info border border-info/30 hover:bg-info/15 text-xs font-sans font-semibold transition-colors flex items-center gap-1.5">
                            <FileText size={13} />
                            <span>Resume</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                        {selectedSubmission.portfolioUrl && (
                          <a href={selectedSubmission.portfolioUrl} target="_blank" rel="noopener noreferrer" className="h-9 px-3.5 rounded-control bg-panel text-fg border border-line hover:bg-panel-hover text-xs font-sans font-semibold transition-colors flex items-center gap-1.5">
                            <Globe size={13} />
                            <span>Portfolio</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                        {selectedSubmission.linkedinUrl && (
                          <a href={selectedSubmission.linkedinUrl} target="_blank" rel="noopener noreferrer" className="h-9 px-3.5 rounded-control bg-panel text-fg border border-line hover:bg-panel-hover text-xs font-sans font-semibold transition-colors flex items-center gap-1.5">
                            <span>LinkedIn</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Quick Canned Response Template Picker */}
                    <button
                      onClick={() => setIsCannedModalOpen(true)}
                      disabled={!canManageCrm}
                      className="h-9 px-3.5 rounded-control bg-panel hover:bg-panel-hover text-fg border border-line text-xs font-sans font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles size={13} className="text-danger" />
                      <span>{language === 'id' ? 'Respon Cepat' : 'Canned Response'}</span>
                    </button>
                  </div>

                  {/* Direct Contact Dispatchers */}
                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp */}
                    {selectedSubmission.phone && cleanPhoneForWhatsApp(selectedSubmission.phone) && (
                      <a
                        href={`https://wa.me/${cleanPhoneForWhatsApp(selectedSubmission.phone)}?text=Halo%20${encodeURIComponent(selectedSubmission.fullName)},%20kami%20dari%20Kapitech%20Agency.%20Menindaklanjuti%20formulir%20konsultasi%20proyek%20Anda...`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-3 rounded-control bg-success/10 hover:bg-success/20 text-success border border-success/30 text-xs font-sans transition-colors flex items-center gap-1"
                        title="Chat via WhatsApp"
                      >
                        <span>WhatsApp</span>
                        <ExternalLink size={11} />
                      </a>
                    )}

                    {/* Mailto */}
                    <a
                      href={`mailto:${selectedSubmission.email}?subject=Kapitech Agency - Project Brief Follow-up&body=Dear ${encodeURIComponent(selectedSubmission.fullName)},%0D%0A%0D%0AThank you for reaching out to Kapitech Agency regarding your project brief.`}
                      className="h-9 px-3 rounded-control bg-accent hover:bg-accent text-white text-xs font-sans font-semibold transition-colors flex items-center gap-1"
                      title="Compose Email"
                    >
                      <Mail size={13} />
                      <span>Email</span>
                    </a>
                  </div>
                </div>

                {/* Reader Sub-Tabs */}
                <div className="mb-5 flex items-center gap-1 border-b border-line pb-2">
                  <button
                    onClick={() => setDetailTab('brief')}
                    className={`pb-1 text-xs font-sans font-semibold transition-colors border-b-2 ${
                      detailTab === 'brief'
                        ? 'text-fg border-accent'
                        : 'text-muted border-transparent hover:text-fg'
                    }`}
                  >
                    {selectedSubmission.type === 'career'
                      ? (language === 'id' ? 'Detail Lamaran' : 'Application Details')
                      : (language === 'id' ? 'Detail Brief & Kontak' : 'Brief & Contact Specs')}
                  </button>

                  <button
                    onClick={() => setDetailTab('notes')}
                    className={`pb-1 text-xs font-sans font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
                      detailTab === 'notes'
                        ? 'text-fg border-accent'
                        : 'text-muted border-transparent hover:text-fg'
                    }`}
                  >
                    <span>{language === 'id' ? 'Catatan Tim Agensi' : 'Internal Team Notes'}</span>
                    {selectedSubmission.internalNotes && (
                      <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                    )}
                  </button>
                </div>

                {/* TAB 1: BRIEF & CONTACT SPECS */}
                {detailTab === 'brief' && (
                  <div className="space-y-5">
                    {/* Contact Specs Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Email Card */}
                      <div className="p-4 rounded-card bg-panel border border-line">
                        <div className="flex items-center justify-between text-xs font-sans text-muted mb-1">
                          <div className="flex items-center gap-1.5">
                            <Mail size={13} className="text-danger" />
                            <span>Email</span>
                          </div>
                          <button
                            onClick={() => handleCopyText(selectedSubmission.email, 'email')}
                            className="text-[10px] text-danger hover:underline flex items-center gap-1 font-sans"
                          >
                            <Copy size={11} />
                            <span>{copiedId === 'email' ? (language === 'id' ? 'Tersalin!' : 'Copied!') : (language === 'id' ? 'Salin' : 'Copy')}</span>
                          </button>
                        </div>
                        <a 
                          href={`mailto:${selectedSubmission.email}`}
                          className="text-xs font-sans font-medium text-fg hover:text-danger transition-colors break-all block"
                        >
                          {selectedSubmission.email}
                        </a>
                      </div>

                      {/* Phone Card */}
                      <div className="p-4 rounded-card bg-panel border border-line">
                        <div className="flex items-center justify-between text-xs font-sans text-muted mb-1">
                          <div className="flex items-center gap-1.5">
                            <Phone size={13} className="text-danger" />
                            <span>WhatsApp / {language === 'id' ? 'Telepon' : 'Phone'}</span>
                          </div>
                          {selectedSubmission.phone && (
                            <button
                              onClick={() => handleCopyText(selectedSubmission.phone || '', 'phone')}
                              className="text-[10px] text-danger hover:underline flex items-center gap-1 font-sans"
                            >
                              <Copy size={11} />
                              <span>{copiedId === 'phone' ? (language === 'id' ? 'Tersalin!' : 'Copied!') : (language === 'id' ? 'Salin' : 'Copy')}</span>
                            </button>
                          )}
                        </div>
                        <p className="text-xs font-sans font-medium text-fg">
                          {selectedSubmission.phone || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Scope & Budget Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Services */}
                      <div className="p-4 rounded-card bg-panel border border-line">
                        <div className="flex items-center gap-2 text-xs font-sans text-muted mb-1.5">
                          <Tag size={13} className="text-danger" />
                          <span>{selectedSubmission.type === 'career'
                            ? (language === 'id' ? 'Posisi / Spesialisasi' : 'Position / Specialty')
                            : (language === 'id' ? 'Layanan / Spesialisasi' : 'Requested Services')}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedSubmission.services && selectedSubmission.services.length > 0 ? (
                            selectedSubmission.services.map((svc, i) => (
                              <span key={i} className="text-[10px] font-sans px-2 py-0.5 rounded-badge bg-panel border border-line text-fg">
                                {svc}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-fg font-sans">
                              {selectedSubmission.type === 'career'
                                ? (selectedSubmission.specialty || selectedSubmission.positionTitle || 'Specialty not provided')
                                : (selectedSubmission.specialty || selectedSubmission.positionTitle || 'General Consultation')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Budget / Experience */}
                      <div className="p-4 rounded-card bg-panel border border-line">
                        <div className="flex items-center justify-between text-xs font-sans text-muted mb-1">
                          <div className="flex items-center gap-1.5">
                            {selectedSubmission.type === 'career' ? <Clock size={13} className="text-danger" /> : <DollarSign size={13} className="text-danger" />}
                            <span>{selectedSubmission.type === 'career'
                              ? (language === 'id' ? 'Pengalaman' : 'Experience')
                              : (language === 'id' ? 'Estimasi Anggaran' : 'Budget Bracket')}</span>
                          </div>
                          <span className="text-success font-semibold">
                            {selectedSubmission.type === 'career'
                              ? (selectedSubmission.experienceYears ? selectedSubmission.experienceYears + ' yrs' : '-')
                              : formatAmount(estimateDealValue(selectedSubmission), currency)}
                          </span>
                        </div>
                        <p className="text-xs font-sans font-semibold text-fg">
                          {selectedSubmission.type === 'career'
                            ? (selectedSubmission.availability || selectedSubmission.location || (language === 'id' ? 'Ketersediaan belum ditentukan' : 'Availability not provided'))
                            : (selectedSubmission.budget || selectedSubmission.rateCard || (language === 'id' ? 'Tidak ditentukan' : 'Unspecified'))}
                        </p>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-sans text-muted normal-case tracking-normal block font-semibold">
                          {selectedSubmission.type === 'career'
                            ? (language === 'id' ? 'Cover Letter / Pesan Kandidat' : 'Candidate Message / Cover Letter')
                            : (language === 'id' ? 'Detail Pesan / Brief Klien' : 'Client Brief Statement')}
                        </label>
                        <button
                          onClick={() => handleCopyText(selectedSubmission.message, 'msg')}
                          className="text-[10px] text-muted hover:text-fg flex items-center gap-1 font-sans"
                        >
                          <Copy size={11} />
                          <span>{copiedId === 'msg' ? (language === 'id' ? 'Tersalin' : 'Copied') : (language === 'id' ? 'Salin Brief' : 'Copy Brief')}</span>
                        </button>
                      </div>
                      <div className="p-4 rounded-card bg-panel border border-line text-xs text-muted whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto font-sans">
                        {selectedSubmission.message}
                      </div>
                    </div>

                    {/* Metadata Specs */}
                    <div className="p-4 rounded-card bg-panel/50 border border-line text-[11px] font-sans text-muted grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>{language === 'id' ? 'Kanal Sumber:' : 'Intake Source:'} <span className="text-fg">{selectedSubmission.source || 'Website Form'}</span></div>
                      {selectedSubmission.type === 'career' && selectedSubmission.tools && (
                        <div>{language === 'id' ? 'Tools:' : 'Tools:'} <span className="text-fg">{selectedSubmission.tools}</span></div>
                      )}
                      {selectedSubmission.type === 'career' && selectedSubmission.linkedinUrl && (
                        <div className="truncate">{language === 'id' ? 'LinkedIn:' : 'LinkedIn:'} <a href={selectedSubmission.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-fg hover:text-accent-text">{selectedSubmission.linkedinUrl}</a></div>
                      )}
                      <div>{language === 'id' ? 'Waktu Diterima:' : 'Timestamp:'} <span className="text-fg">{new Date(selectedSubmission.createdAt).toLocaleString()}</span></div>
                      {selectedSubmission.userAgent && (
                        <div className="sm:col-span-2 truncate">{language === 'id' ? 'Klien Browser:' : 'User Agent:'} <span className="text-fg">{selectedSubmission.userAgent}</span></div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: INTERNAL TEAM NOTES & COLLABORATION */}
                {detailTab === 'notes' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-card bg-panel border border-line space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-sans text-fg font-semibold flex items-center gap-1.5">
                          <FileText size={14} className="text-danger" />
                          <span>{language === 'id' ? 'Catatan Rahasia Agensi' : 'Private Agency Team Notes'}</span>
                        </label>
                        <span className="text-[10px] font-sans text-muted">
                          {language === 'id' ? 'Hanya terlihat oleh staf AMS' : 'Visible only to AMS staff'}
                        </span>
                      </div>

                      <textarea
                        rows={6}
                        value={internalNoteDraft}
                        onChange={(e) => setInternalNoteDraft(e.target.value)}
                        placeholder={language === 'id' 
                          ? 'Tulis catatan teknis, rangkuman discovery call, kesepakatan timeline, atau petunjuk khusus untuk tim...' 
                          : 'Enter technical scoping notes, discovery call summary, milestone commitments, or specific client instructions...'}
                        className="w-full min-h-10 p-3 bg-panel border border-line rounded-control text-xs text-fg placeholder:text-muted font-sans focus:outline-none focus:border-accent leading-relaxed"
                      />

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          disabled={isSavingNote || !canManageCrm}
                          onClick={handleSaveInternalNote}
                          className="min-h-10 px-4 py-2 rounded-control bg-accent hover:bg-accent text-white text-xs font-sans font-semibold transition-all flex items-center gap-1.5 "
                        >
                          <Check size={14} />
                          <span>{isSavingNote ? (language === 'id' ? 'Menyimpan...' : 'Saving...') : (language === 'id' ? 'Simpan Catatan' : 'Save Notes')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Assigned Owner Setting */}
                    <div className="p-4 rounded-card bg-panel border border-line space-y-2">
                      <label className="text-xs font-sans text-muted flex items-center gap-1.5">
                        <User size={13} className="text-success" />
                        <span>{language === 'id' ? 'Penanggung Jawab Kualifikasi' : 'Assigned Triage Lead'}</span>
                      </label>
                      <CustomSelect
                        disabled={!canManageCrm}
                        value={selectedSubmission.assignedTo || (activeInboxTab === 'jobs' ? 'People & Operations' : 'Lead Full-Stack Tech')}
                        onChange={(value) => handleAssigneeChange(selectedSubmission.id, value)}
                        options={activeInboxTab === 'jobs'
                          ? [
                              { value: 'People & Operations', label: 'People & Operations' },
                              { value: 'Engineering Lead', label: 'Engineering Lead' },
                              { value: 'Design Lead', label: 'Design Lead' },
                              { value: 'Executive Management', label: 'Executive Management' }
                            ]
                          : [
                              { value: 'Lead Full-Stack Tech', label: 'Lead Full-Stack Tech (Engineering)' },
                              { value: 'Senior UI/UX Designer', label: 'Senior UI/UX Designer (Design)' },
                              { value: 'Technical Project Manager', label: 'Technical Project Manager (Scoping)' },
                              { value: 'Business Director', label: 'Business Director (Accounts)' }
                            ]}
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Status & Priority Controls Bar */}
              <div className="pt-5 mt-6 border-t border-line flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Status Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-sans text-muted">Status:</span>
                    <CustomSelect
                      disabled={isUpdating || !canManageCrm}
                      value={selectedSubmission.status}
                      onChange={(value) => handleStatusChange(selectedSubmission.id, value as ContactSubmission['status'])}
                      options={activeInboxTab === 'jobs'
                        ? [
                            { value: 'new', label: 'New' },
                            { value: 'screening', label: 'Screening' },
                            { value: 'shortlisted', label: 'Shortlisted' },
                            { value: 'interview', label: 'Interview' },
                            { value: 'hired', label: 'Hired' },
                            { value: 'rejected', label: 'Rejected' },
                            { value: 'withdrawn', label: 'Withdrawn' }
                          ]
                        : [
                            { value: 'new', label: 'New' },
                            { value: 'in-review', label: 'In Review' },
                            { value: 'contacted', label: 'Contacted' },
                            { value: 'closed', label: 'Closed Deal' }
                          ]}
                    />
                  </div>

                  {/* Priority Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-sans text-muted">Priority:</span>
                    <CustomSelect disabled={!canManageCrm} value={selectedSubmission.priority || 'normal'} onChange={(value) => handlePriorityChange(selectedSubmission.id, value as ContactSubmission['priority'])} options={[{value:'urgent',label:'Urgent'},{value:'high',label:'High'},{value:'normal',label:'Normal'},{value:'low',label:'Low'}]} />
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(selectedSubmission.id)}
                  disabled={!canManageCrm}
                  className="min-h-10 min-w-10 p-2 rounded-control bg-panel border border-line text-muted hover:text-danger hover:border-danger/40 transition-colors flex items-center justify-center"
                  title={language === 'id' ? 'Hapus pesan ini secara permanen' : 'Delete this brief permanently'}
                >
                  <Trash2 size={16} />
                </button>
              </div>

            </div>
          ) : (
            /* Empty State on Desktop when no submission is selected */
            <div className="hidden lg:flex lg:col-span-7 bg-panel border border-line rounded-card p-12 flex-col items-center justify-center text-center text-muted min-h-[460px]">
              <div className="w-16 h-16 rounded-card bg-panel border border-line flex items-center justify-center text-line mb-4">
                <Inbox size={32} />
              </div>
              <h3 className="text-fg font-medium mb-1 font-sans text-base">
                {activeInboxTab === 'jobs'
                  ? (language === 'id' ? 'Pilih Lamaran untuk Meninjau Kandidat' : 'Select an Application to Review')
                  : (language === 'id' ? 'Pilih Pesan untuk Membaca Brief' : 'Select a Brief to Inspect')}
              </h3>
              <p className="text-xs text-muted max-w-sm font-sans leading-relaxed">
                {language === 'id'
                  ? (activeInboxTab === 'jobs'
                    ? 'Klik salah satu lamaran untuk melihat detail kandidat, tautan resume/portfolio, catatan internal, dan status rekrutmen.'
                    : 'Klik salah satu inquiry untuk melihat detail brief, respon cepat, kontak WhatsApp/Email, dan konversi ke pipeline CRM.')
                  : (activeInboxTab === 'jobs'
                    ? 'Select an application to review candidate details, resume or portfolio links, internal notes, and hiring stage.'
                    : 'Select an inquiry to review the brief, quick responses, WhatsApp/Email contact, and CRM conversion.')}
              </p>
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MODALS & DIALOGS */}
      {/* ------------------------------------------------------------- */}
      
      {/* Shared confirmation dialog */}
      <Modal slug="inbox-modal"
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.type === 'delete'
          ? (language === 'id' ? 'Hapus pesan?' : 'Delete message?')
          : activeInboxTab === 'jobs'
            ? (language === 'id' ? 'Pindahkan lamaran ke Screening?' : 'Move applications to Screening?')
            : (language === 'id' ? 'Tandai pesan sebagai ditinjau?' : 'Mark messages as reviewed?')}
        description={confirmAction?.type === 'delete'
          ? (language === 'id' ? 'Tindakan ini menghapus data inbox secara permanen dan tidak dapat dibatalkan.' : 'This permanently removes the inbox record and cannot be undone.')
          : activeInboxTab === 'jobs'
            ? (language === 'id'
              ? `Sebanyak ${confirmAction?.count ?? 0} lamaran baru akan dipindahkan ke Screening.`
              : `${confirmAction?.count ?? 0} new applications will be moved to Screening.`)
            : (language === 'id'
              ? `Sebanyak ${confirmAction?.count ?? 0} pesan baru akan diubah menjadi In Review.`
              : `${confirmAction?.count ?? 0} new messages will be moved to In Review.`)}
        footer={(
          <>
            <button type="button" onClick={() => setConfirmAction(null)} className="min-h-10 rounded-control border border-line bg-panel px-4 text-xs font-medium text-muted hover:bg-bg hover:text-fg">Cancel</button>
            <button
              type="button"
              onClick={() => confirmAction?.type === 'delete' && confirmAction.id
                ? void confirmDelete(confirmAction.id)
                : confirmAction?.count
                  ? void confirmMarkAllRead(confirmAction.count, confirmAction.targetStatus || (activeInboxTab === 'jobs' ? 'screening' : 'in-review'))
                  : setConfirmAction(null)}
              className={`min-h-10 rounded-control px-4 text-xs font-semibold text-white ${confirmAction?.type === 'delete' ? 'bg-danger hover:bg-danger/90' : 'bg-accent hover:bg-accent/90'}`}
            >
              {confirmAction?.type === 'delete'
                ? (language === 'id' ? 'Hapus Permanen' : 'Delete Permanently')
                : activeInboxTab === 'jobs'
                  ? (language === 'id' ? 'Pindahkan ke Screening' : 'Move to Screening')
                  : (language === 'id' ? 'Tandai In Review' : 'Mark In Review')}
            </button>
          </>
        )}
      />

      {/* Canned Responses Template Modal */}
      {selectedSubmission && (
        <CannedResponsesModal
          isOpen={isCannedModalOpen}
          onClose={() => setIsCannedModalOpen(false)}
          submission={selectedSubmission}
        />
      )}

      {/* Convert to CRM Lead Modal */}
      {selectedSubmission && (
        <ConvertToCrmModal
          isOpen={isCrmModalOpen}
          onClose={() => setIsCrmModalOpen(false)}
          submission={selectedSubmission}
          onConverted={(leadId, dealVal) => {
            setToastMessage({
              text: language === 'id'
                ? `Lead "${selectedSubmission.fullName}" berhasil dikonversi ke CRM Pipeline (${formatAmount(dealVal, currency)})!`
                : `Lead "${selectedSubmission.fullName}" converted to CRM Pipeline (${formatAmount(dealVal, currency)})!`,
              link: '/admin/crm',
              linkText: language === 'id' ? 'Buka CRM' : 'Open CRM'
            });
            setTimeout(() => setToastMessage(null), 5000);
          }}
        />
      )}

      {/* Email Forwarding Guide Modal */}
      <EmailForwardingGuideModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        adminEmail="kapitechagency@gmail.com"
      />

    </AdminPageShell>
  );
};

export default AdminInbox;
