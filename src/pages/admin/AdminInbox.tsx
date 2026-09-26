import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { ContactSubmission } from '../../lib/submissions';
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

export const AdminInbox: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const canManageCrm = hasAdminPermission('canManageCrm');

  // Core Data & Currency
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [crmDeals, setCrmDeals] = useState<CrmLead[]>([]);

  // Filters & Views
  const [filterType, setFilterType] = useState<string>('all');
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
  const [toastMessage, setToastMessage] = useState<{ text: string; link?: string; linkText?: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'mark-read'; id?: string; count?: number } | null>(null);

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
    const [res, dealsRes] = await Promise.all([api.leads.getAll(), api.crm.getDeals()]);
    if (dealsRes.success && Array.isArray(dealsRes.data?.deals)) setCrmDeals(dealsRes.data.deals as CrmLead[]);
    if (!res.success || !Array.isArray(res.data?.leads)) {
      setLoading(false);
      return;
    }
    const items = res.data.leads as ContactSubmission[];
    setSubmissions(items);
    setPrevCount(items.length);
    setLoading(false);
  };

  useEffect(() => {
    void refreshInbox();
    const timer = window.setInterval(() => void refreshInbox(), 30000);
    return () => window.clearInterval(timer);
  }, []);


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
      setToastMessage({ text: language === 'id' ? 'Anda tidak memiliki izin mengelola Leads & Inbox.' : 'You do not have CRM permission.' });
      window.setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setIsUpdating(true);
    try {
      const res = await api.leads.update(id, { status: newStatus });
      if (!res.success) throw new Error(res.error || 'Status update failed');
      await refreshInbox();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Priority update
  const handlePriorityChange = async (id: string, newPriority: ContactSubmission['priority']) => {
    if (!canManageCrm) {
      setToastMessage({ text: language === 'id' ? 'Anda tidak memiliki izin mengelola Leads & Inbox.' : 'You do not have CRM permission.' });
      window.setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    try {
      const res = await api.leads.update(id, { priority: newPriority });
      if (!res.success) throw new Error(res.error || 'Priority update failed');
      await refreshInbox();
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  };

  // Assignee update
  const handleAssigneeChange = async (id: string, assignee: string) => {
    if (!canManageCrm) {
      setToastMessage({ text: language === 'id' ? 'Anda tidak memiliki izin mengelola Leads & Inbox.' : 'You do not have CRM permission.' });
      window.setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    try {
      const res = await api.leads.update(id, { assignedTo: assignee });
      if (!res.success) throw new Error(res.error || 'Assignee update failed');
      await refreshInbox();
    } catch (err) {
      console.error('Failed to update assignee:', err);
    }
  };

  // Star toggle
  const handleToggleStar = async (e: React.MouseEvent, id: string, currentStarred?: boolean) => {
    if (!canManageCrm) {
      setToastMessage({ text: language === 'id' ? 'Anda tidak memiliki izin mengelola Leads & Inbox.' : 'You do not have CRM permission.' });
      window.setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    e.stopPropagation();
    try {
      const res = await api.leads.update(id, { starred: !currentStarred });
      if (!res.success) throw new Error(res.error || 'Star update failed');
      await refreshInbox();
    } catch (err) {
      console.error('Failed to toggle star:', err);
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
      console.error('Failed to save notes:', err);
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
      console.error('Failed to delete submission:', err);
    } finally {
      setConfirmAction(null);
    }
  };

  // Mark all new as In-Review
  const handleMarkAllRead = async () => {
    if (!canManageCrm) return;
    const count = submissions.filter(s => s.status === 'new').length;
    if (count > 0) setConfirmAction({ type: 'mark-read', count });
  };

  const confirmMarkAllRead = async (count: number) => {
    try {
      const unread = submissions.filter(s => s.status === 'new');
      for (const item of unread) {
        const res = await api.leads.update(item.id, { status: 'in-review' });
        if (!res.success) throw new Error(res.error || 'Bulk status update failed');
      }
      await refreshInbox();
      setToastMessage({
        text: language === 'id' ? `${count} pesan ditandai telah ditinjau.` : `${count} messages marked as In Review.`
      });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
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
    const total = submissions.length;
    const newCount = submissions.filter(s => s.status === 'new').length;
    const convertedCount = submissions.filter(s => crmDeals.some(d => (d as any).inquiryId === s.id)).length;
    const conversionRate = total > 0 ? Math.round((convertedCount / total) * 100) : 0;
    
    // Sum estimated deal volume
    const totalPipelineValue = submissions.reduce((acc, sub) => acc + estimateDealValue(sub), 0);

    return {
      total,
      newCount,
      convertedCount,
      conversionRate,
      totalPipelineValue
    };
  }, [submissions]);

  // Filtering
  const filteredItems = useMemo(() => {
    return submissions.filter(item => {
      const matchesType = filterType === 'all' || (item.type || 'inquiry') === filterType;
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
        (item.source || '').toLowerCase().includes(queryLower)
      );

      return matchesType && matchesStatus && matchesPriority && matchesStarred && matchesSearch;
    });
  }, [submissions, filterType, filterStatus, filterPriority, onlyStarred, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (submissions.length === 0) return;
    const headers = ['ID', 'Date', 'Type', 'Status', 'Priority', 'Full Name', 'Email', 'Company', 'Phone', 'Services', 'Budget', 'Converted To CRM', 'Message', 'Source'];
    const rows = submissions.map(s => [
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
    link.setAttribute('download', `kapitech_leads_inbox_${new Date().toISOString().split('T')[0]}.csv`);
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
            <span>Studio Role</span>
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
            <span>Client Brief</span>
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
    <div className="ams-inbox-page space-y-6 pb-8">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 sm:p-4 rounded-card bg-success/10 border border-success/30 text-success text-xs font-sans flex items-start sm:items-center justify-between gap-2 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <Check size={16} className="text-success shrink-0" />
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

      <header className="ams-dashboard-header mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Kapitech AMS</span>
            <span aria-hidden="true">/</span>
            <span className="text-fg">Leads & Inbox</span>
          </div>
          <h1 className="mt-2 text-xl font-semibold leading-7 tracking-[-0.01em] text-fg">Leads & Inbox</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
            {language === 'id'
              ? 'Kelola inquiry masuk, lakukan triage, balas dengan cepat, dan teruskan peluang yang siap ke CRM.'
              : 'Triage inbound inquiries, respond quickly, and move qualified opportunities into CRM.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="text-[11px] tabular-nums text-muted">{submissions.length} inbound</span>
          <button type="button" onClick={() => setIsEmailModalOpen(true)} className="ams-action inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-line bg-transparent px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" title={language === 'id' ? 'Buka pengaturan notifikasi email' : 'Open email alert settings'}>
            <Mail size={14} />
            <span>{language === 'id' ? 'Notifikasi Email' : 'Email Alerts'}</span>
          </button>
          {metrics.newCount > 0 && (
            <button type="button" onClick={handleMarkAllRead} disabled={!canManageCrm} className="ams-action inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-line bg-transparent px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              <Check size={14} />
              <span>{language === 'id' ? 'Tandai Dibaca' : 'Mark Read'}</span>
            </button>
          )}
          {submissions.length > 0 && (
            <button type="button" onClick={handleExportCSV} className="ams-action inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-line bg-transparent px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. EXECUTIVE KPI SUMMARY RIBBON */}
      {/* ------------------------------------------------------------- */}
      <div className="ams-inbox-kpi grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Inbound */}
        <div className="p-4 rounded-card bg-panel border border-line space-y-1">
          <div className="flex items-center justify-between text-xs font-sans text-muted">
            <span>{language === 'id' ? 'Total Masuk' : 'Total Inbound'}</span>
            <Inbox size={14} className="text-muted" />
          </div>
          <div className="text-2xl font-semibold font-sans text-fg">
            {metrics.total}
          </div>
          <p className="text-[11px] font-sans text-muted">
            {language === 'id' ? 'Seluruh kanal formulir' : 'All intake touchpoints'}
          </p>
        </div>

        {/* Metric 2: Action Needed / New */}
        <div className="p-4 rounded-card bg-panel border border-line space-y-1">
          <div className="flex items-center justify-between text-xs font-sans text-muted">
            <span>{language === 'id' ? 'Perlu Ditinjau' : 'Action Needed'}</span>
            <AlertCircle size={14} className="text-danger" />
          </div>
          <div className="text-2xl font-semibold font-sans text-danger flex items-center gap-2">
            <span>{metrics.newCount}</span>
            {metrics.newCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
            )}
          </div>
          <p className="text-[11px] font-sans text-muted">
            {language === 'id' ? 'Belum dikualifikasi' : 'Pending initial triage'}
          </p>
        </div>

        {/* Metric 3: Converted to CRM */}
        <div className="p-4 rounded-card bg-panel border border-line space-y-1">
          <div className="flex items-center justify-between text-xs font-sans text-muted">
            <span>{language === 'id' ? 'Dikonversi ke CRM' : 'Converted to CRM'}</span>
            <Briefcase size={14} className="text-success" />
          </div>
          <div className="text-2xl font-semibold font-sans text-success">
            {metrics.convertedCount} <span className="text-xs text-muted">({metrics.conversionRate}%)</span>
          </div>
          <p className="text-[11px] font-sans text-muted">
            {language === 'id' ? 'Aktif dalam pipeline agensi' : 'Active deal opportunities'}
          </p>
        </div>

        {/* Metric 4: Estimated Pipeline Volume */}
        <div className="p-4 rounded-card bg-panel border border-line space-y-1">
          <div className="flex items-center justify-between text-xs font-sans text-muted">
            <span>{language === 'id' ? 'Volume Peluang' : 'Intake Valuation'}</span>
            <TrendingUp size={14} className="text-success" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold font-sans text-fg truncate">
            {formatAmount(metrics.totalPipelineValue, currency)}
          </div>
          <p className="text-[11px] font-sans text-muted">
            {language === 'id' ? 'Estimasi nilai brief masuk' : 'Cumulative brief budget estimate'}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. UNIFIED FILTER TABS & TOOLBAR */}
      {/* ------------------------------------------------------------- */}
      <div className="ams-inbox-toolbar bg-panel border border-line p-4 sm:p-5 rounded-card space-y-3">
        
        {/* Top Channel Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {[
              { key: 'all', label: language === 'id' ? 'Semua Form' : 'All Briefs' },
              { key: 'inquiry', label: language === 'id' ? 'Konsultasi Klien' : 'Client Briefs' },
              { key: 'career', label: language === 'id' ? 'Lamaran Karir' : 'Career Roles' },
              { key: 'vendor', label: language === 'id' ? 'Freelance Vendor' : 'Vendor Partners' },
              { key: 'newsletter', label: language === 'id' ? 'Newsletter' : 'Subscriptions' }
            ].map((tab) => {
              const count = tab.key === 'all' 
                ? submissions.length 
                : submissions.filter(s => (s.type || 'inquiry') === tab.key).length;

              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterType(tab.key)}
                  className={`min-h-10 px-3 rounded-control text-xs font-sans transition-all flex items-center gap-2 border ${
                    filterType === tab.key
                      ? 'bg-accent text-white border-accent font-semibold'
                      : 'bg-panel text-muted border-line hover:text-fg'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-chip text-[10px] ${
                    filterType === tab.key ? 'bg-panel-hover text-fg' : 'bg-panel text-muted'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Switcher: Split View vs Data Table View */}
          <div className="flex items-center bg-panel border border-line rounded-card p-0.5">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1.5 rounded-control text-xs font-sans transition-all flex items-center gap-1.5 ${
                viewMode === 'split'
                  ? 'bg-panel text-fg font-semibold border border-line'
                  : 'text-muted hover:text-fg'
              }`}
              title="Split Master-Detail View"
            >
              <LayoutGrid size={13} />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-control text-xs font-sans transition-all flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-panel text-fg font-semibold border border-line'
                  : 'text-muted hover:text-fg'
              }`}
              title="Spreadsheet Table View"
            >
              <TableIcon size={13} />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>

        {/* Search & Secondary Filter Dropdowns */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 pt-1">
          {/* Universal Search */}
          <div className="relative w-full md:flex-1 md:min-w-0 md:w-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'id' ? 'Cari nama, email, perusahaan, jasa, atau isi brief...' : 'Search name, email, company, requested stack, or message...'}
              className="w-full pl-10 pr-8 py-2 rounded-control bg-panel border border-line text-xs text-fg focus:outline-none focus:border-accent placeholder:text-muted font-sans min-h-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="ams-inbox-filter-controls flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 custom-scrollbar touch-pan-x md:overflow-visible md:pb-0 md:mx-0 md:px-0">
            {/* Status Dropdown */}
            <div className="w-[148px] shrink-0">
              <CustomSelect value={filterStatus} onChange={setFilterStatus} options={[{value:'all',label:language === 'id' ? 'Semua Status' : 'All Status'},{value:'new',label:'Status: New'},{value:'in-review',label:'Status: In Review'},{value:'contacted',label:'Status: Contacted'},{value:'closed',label:'Status: Closed Deal'}]} />
            </div>

            {/* Priority Dropdown */}
            <div className="w-[148px] shrink-0">
              <CustomSelect value={filterPriority} onChange={setFilterPriority} options={[{value:'all',label:language === 'id' ? 'Semua Prioritas' : 'All Priorities'},{value:'urgent',label:'Urgent'},{value:'high',label:'High'},{value:'normal',label:'Normal'},{value:'low',label:'Low'}]} />
            </div>

            {/* Starred Only Toggle */}
            <div className="w-[124px] shrink-0 flex items-center">
              <button
              onClick={() => setOnlyStarred(!onlyStarred)}
              className={`w-full min-h-10 px-3 rounded-control border text-xs font-sans transition-colors flex items-center justify-center gap-2 ${
                onlyStarred
                  ? 'bg-warning/10 border-warning/30 text-warning font-semibold'
                  : 'bg-panel border-line text-muted hover:text-fg'
              }`}
            >
              <Star size={14} className={onlyStarred ? 'fill-warning text-warning' : ''} />
              <span>{language === 'id' ? 'Ditandai' : 'Starred'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MAIN CONTENT VIEW: SPLIT VIEW vs TABLE VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'table' ? (
        /* DENSE SPREADSHEET TABLE VIEW */
        <div className="bg-panel border border-line rounded-card overflow-hidden">
          <div className="ams-table-scroll overflow-x-auto custom-scrollbar">
            <table className="ams-table w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-panel border-b border-line text-muted">
                  <th className="p-3 w-10 text-center">★</th>
                  <th className="p-3">{language === 'id' ? 'Klien & Perusahaan' : 'Client & Company'}</th>
                  <th className="p-3">{language === 'id' ? 'Kanal' : 'Channel'}</th>
                  <th className="p-3">{language === 'id' ? 'Layanan Diminta' : 'Requested Stack'}</th>
                  <th className="p-3">{language === 'id' ? 'Estimasi Nilai' : 'Valuation'}</th>
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
                  filteredItems.map((item) => {
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
                            {isConverted && (
                              <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-success/10 text-success border border-success/30">
                                CRM ✓
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted truncate max-w-[200px]">
                            {item.company || item.email}
                          </div>
                        </td>

                        {/* Channel */}
                        <td className="p-3">
                          {renderChannelBadge(item.type)}
                        </td>

                        {/* Services */}
                        <td className="p-3 max-w-[200px]">
                          <div className="flex flex-wrap gap-1">
                            {item.services && item.services.length > 0 ? (
                              item.services.slice(0, 2).map((svc, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-panel border border-line text-[10px] text-fg">
                                  {svc}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted text-[10px]">{item.specialty || '-'}</span>
                            )}
                            {item.services && item.services.length > 2 && (
                              <span className="text-[10px] text-muted">+{item.services.length - 2}</span>
                            )}
                          </div>
                        </td>

                        {/* Valuation */}
                        <td className="p-3 font-semibold text-fg">
                          {formatAmount(estimateDealValue(item), currency)}
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
            </table>
          </div>
        </div>
      ) : loading ? (
        /* LOADING STATE */
        <div className="flex flex-col items-center justify-center py-20 text-muted space-y-3 bg-panel border border-line rounded-card">
          <RefreshCw className="animate-spin text-accent" size={24} />
          <p className="text-xs font-sans">{language === 'id' ? 'Memuat pesan masuk...' : 'Syncing inbox records...'}</p>
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
            {(searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterType !== 'all' || onlyStarred) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterPriority('all');
                  setFilterType('all');
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
        <div className="ams-inbox-workspace grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          
          {/* Left: Master Briefs List Pane */}
          <div className={`ams-inbox-list-pane space-y-3 ${
            selectedSubmission 
              ? 'hidden lg:block lg:col-span-5' 
              : 'col-span-12 lg:col-span-5'
          }`}>
            {filteredItems.map((item) => {
              const isSelected = selectedSubmission?.id === item.id;
              const isConverted = crmDeals.some(d => (d as any).inquiryId === item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectSubmission(item)}
                  className={`relative p-4 rounded-card border transition-all cursor-pointer font-sans group ${
                    isSelected
                      ? 'bg-panel border-accent'
                      : item.status === 'new'
                      ? 'bg-panel border-danger/30 hover:border-danger/50'
                      : 'bg-panel border-line hover:border-line hover:bg-panel-hover'
                  }`}
                >
                    {/* Linear-style Left Accent Strip */}
                    {isSelected && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 bg-accent rounded-r-full" />
                    )}

                    {/* Top Row: Channel, Status, Star, Timestamp */}
                    <div className="flex items-center justify-between gap-2 mb-2">
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
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-fg font-sans truncate">
                        {item.fullName || 'Anonymous Client'}
                      </h3>
                      <span className="text-xs font-sans font-semibold text-success shrink-0">
                        {formatAmount(estimateDealValue(item), currency)}
                      </span>
                    </div>

                    <div className="text-xs text-muted truncate mb-2">
                      {item.company || item.positionTitle || item.email}
                    </div>

                    {/* Service Tags */}
                    {item.services && item.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2.5">
                        {item.services.slice(0, 3).map((svc, i) => (
                          <span key={i} className="text-[9px] font-sans px-1.5 py-0.5 rounded bg-panel border border-line text-muted">
                            {svc}
                          </span>
                        ))}
                        {item.services.length > 3 && (
                          <span className="text-[9px] font-sans text-muted self-center">
                            +{item.services.length - 3}
                          </span>
                        )}
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
            <div className="ams-inbox-reader-pane col-span-12 lg:col-span-7 bg-panel border border-line rounded-card p-5 sm:p-6 flex flex-col justify-between">
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
                    <div className="w-12 h-12 rounded-card bg-panel border border-line flex items-center justify-center text-fg font-sans font-semibold text-lg shrink-0">
                      {selectedSubmission.fullName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {renderChannelBadge(selectedSubmission.type)}
                        {renderStatusBadge(selectedSubmission.status)}
                        <span className="text-[10px] font-sans text-muted">
                          ID: {selectedSubmission.id}
                        </span>
                      </div>
                      
                      <h2 className="text-xl sm:text-2xl font-semibold font-sans text-fg tracking-[-0.01em]">
                        {selectedSubmission.fullName}
                      </h2>

                      <p className="text-xs text-success font-sans mt-0.5 font-semibold flex items-center gap-1.5">
                        <Building2 size={12} />
                        <span>{selectedSubmission.company || selectedSubmission.positionTitle || 'Individual Client'}</span>
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
                <div className="p-3 rounded-card bg-panel border border-line flex flex-wrap items-center justify-between gap-2.5 mb-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 1-Click Convert to CRM Lead */}
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
                <div className="flex items-center gap-2 border-b border-line pb-3 mb-5">
                  <button
                    onClick={() => setDetailTab('brief')}
                    className={`pb-1 text-xs font-sans font-semibold transition-colors border-b-2 ${
                      detailTab === 'brief'
                        ? 'text-fg border-accent'
                        : 'text-muted border-transparent hover:text-fg'
                    }`}
                  >
                    {language === 'id' ? 'Detail Brief & Kontak' : 'Brief & Contact Specs'}
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
                      <div className="p-3 rounded-card bg-panel border border-line">
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
                      <div className="p-3 rounded-card bg-panel border border-line">
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
                      <div className="p-3 rounded-card bg-panel border border-line">
                        <div className="flex items-center gap-2 text-xs font-sans text-muted mb-1.5">
                          <Tag size={13} className="text-danger" />
                          <span>{language === 'id' ? 'Layanan / Spesialisasi' : 'Requested Services'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedSubmission.services && selectedSubmission.services.length > 0 ? (
                            selectedSubmission.services.map((svc, i) => (
                              <span key={i} className="text-[10px] font-sans px-2 py-0.5 rounded bg-panel border border-line text-fg">
                                {svc}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-fg font-sans">
                              {selectedSubmission.specialty || selectedSubmission.positionTitle || 'General Consultation'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Budget */}
                      <div className="p-3 rounded-card bg-panel border border-line">
                        <div className="flex items-center justify-between text-xs font-sans text-muted mb-1">
                          <div className="flex items-center gap-1.5">
                            <DollarSign size={13} className="text-danger" />
                            <span>{language === 'id' ? 'Estimasi Anggaran' : 'Budget Bracket'}</span>
                          </div>
                          <span className="text-success font-semibold">
                            {formatAmount(estimateDealValue(selectedSubmission), currency)}
                          </span>
                        </div>
                        <p className="text-xs font-sans font-semibold text-fg">
                          {selectedSubmission.budget || selectedSubmission.rateCard || (language === 'id' ? 'Tidak ditentukan' : 'Unspecified')}
                        </p>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-sans text-muted normal-case tracking-normal block font-semibold">
                          {language === 'id' ? 'Detail Pesan / Brief Klien' : 'Client Brief Statement'}
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
                    <div className="p-3 rounded-card bg-panel/50 border border-line text-[11px] font-sans text-muted grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>{language === 'id' ? 'Kanal Sumber:' : 'Intake Source:'} <span className="text-fg">{selectedSubmission.source || 'Website Form'}</span></div>
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
                      <CustomSelect disabled={!canManageCrm} value={selectedSubmission.assignedTo || 'Lead Full-Stack Tech'} onChange={(value) => handleAssigneeChange(selectedSubmission.id, value)} options={[{value:'Lead Full-Stack Tech',label:'Lead Full-Stack Tech (Engineering)'},{value:'Senior UI/UX Designer',label:'Senior UI/UX Designer (Design)'},{value:'Technical Project Manager',label:'Technical Project Manager (Scoping)'},{value:'Business Director',label:'Business Director (Accounts)'}]} />
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
                    <CustomSelect disabled={isUpdating || !canManageCrm} value={selectedSubmission.status} onChange={(value) => handleStatusChange(selectedSubmission.id, value as ContactSubmission['status'])} options={[{value:'new',label:'New'},{value:'in-review',label:'In Review'},{value:'contacted',label:'Contacted'},{value:'closed',label:'Closed Deal'}]} />
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
                {language === 'id' ? 'Pilih Pesan untuk Membaca Brief' : 'Select a Brief to Inspect'}
              </h3>
              <p className="text-xs text-muted max-w-sm font-sans leading-relaxed">
                {language === 'id'
                  ? 'Klik salah satu pesan di sebelah kiri untuk melihat rincian brief, template respon cepat, kontak WhatsApp/Email, dan konversi ke pipeline CRM.'
                  : 'Click any submission on the left to examine technical brief specs, dispatch executive canned responses, and convert into active CRM deals.'}
              </p>
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MODALS & DIALOGS */}
      {/* ------------------------------------------------------------- */}
      
      {/* Shared confirmation dialog */}
      <Modal
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.type === 'delete' ? (language === 'id' ? 'Hapus pesan?' : 'Delete message?') : (language === 'id' ? 'Tandai pesan sebagai ditinjau?' : 'Mark messages as reviewed?')}
        description={confirmAction?.type === 'delete'
          ? (language === 'id' ? 'Tindakan ini menghapus data inbox secara permanen dan tidak dapat dibatalkan.' : 'This permanently removes the inbox record and cannot be undone.')
          : (language === 'id' ? `Sebanyak ${confirmAction?.count ?? 0} pesan baru akan diubah menjadi In Review.` : `${confirmAction?.count ?? 0} new messages will be moved to In Review.`)}
        footer={(
          <>
            <button type="button" onClick={() => setConfirmAction(null)} className="min-h-10 rounded-control border border-line bg-panel px-4 text-xs font-medium text-muted hover:bg-bg hover:text-fg">Cancel</button>
            <button
              type="button"
              onClick={() => confirmAction?.type === 'delete' && confirmAction.id
                ? void confirmDelete(confirmAction.id)
                : confirmAction?.count
                  ? void confirmMarkAllRead(confirmAction.count)
                  : setConfirmAction(null)}
              className={`min-h-10 rounded-control px-4 text-xs font-semibold text-white ${confirmAction?.type === 'delete' ? 'bg-danger hover:bg-danger/90' : 'bg-accent hover:bg-accent/90'}`}
            >
              {confirmAction?.type === 'delete' ? (language === 'id' ? 'Hapus Permanen' : 'Delete Permanently') : (language === 'id' ? 'Tandai In Review' : 'Mark In Review')}
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

    </div>
    </div>
  );
};

export default AdminInbox;
