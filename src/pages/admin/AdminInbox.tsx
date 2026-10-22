import React, { useEffect, useState, useMemo } from 'react';
import { useReportingPeriod } from '../../lib/ReportingPeriodContext';
// Shared module chrome renders the canonical ams-page-header primitive.
import { Link, useSearchParams } from 'react-router-dom';
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
  Users,
  Building2,
  FileText,
  HelpCircle,
  TrendingUp,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  AlertCircle,
  X
} from 'lucide-react';
import { ContactSubmission, getSubmissionSlug, normalizeContactSubmission } from '../../lib/submissions';
import { isInboxActionable, isInboxHighPriority, isInboxUnassigned } from '../../lib/inboxTriage';
import { EmailForwardingGuideModal } from '../../components/EmailForwardingGuideModal';
import { CannedResponsesModal } from '../../components/admin/inbox/CannedResponsesModal';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';
import { useLanguage } from '../../lib/LanguageContext';
import { api } from '../../lib/apiClient';
import { hasAdminPermission } from '../../lib/adminAuth';

import { AdminFilterBar, AdminModuleHeader, AdminSectionTabs, AdminTablePagination, AdminPageShell } from '../../components/admin/AdminModulePrimitives';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';
export const AdminInbox: React.FC = () => {
  const { matchesDate, value: reportPeriodValue, enabled: reportPeriodEnabled } = useReportingPeriod();
  const { language } = useLanguage();
  const canManageCrm = hasAdminPermission('canManageCrm');
  const canManageClients = hasAdminPermission('canManageClients');
  type InboxTab = 'overview' | 'messages' | 'client' | 'unread' | 'starred';
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('view') as InboxTab | null;
  const supportedInboxViews: readonly string[] = ['overview', 'messages', 'client', 'unread', 'starred'];
  const hasViewParameter = searchParams.has('view');
  const isSupportedInboxView = requestedTab === null || supportedInboxViews.includes(requestedTab);
  const activeInboxTab: InboxTab = requestedTab && supportedInboxViews.includes(requestedTab)
    ? requestedTab
    : 'overview';

  useEffect(() => {
    if (!hasViewParameter || isSupportedInboxView) return;
    const canonicalParams = new URLSearchParams(searchParams);
    canonicalParams.set('view', 'overview');
    setSearchParams(canonicalParams, { replace: true });
  }, [hasViewParameter, isSupportedInboxView, searchParams, setSearchParams]);

  // Core Data & Currency
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters & Views
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'split' | 'table' | 'overview' | 'board' | 'queue'>('split');

  // Selection & Panels
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [detailTab, setDetailTab] = useState<'brief' | 'notes'>('brief');
  const [internalNoteDraft, setInternalNoteDraft] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [convertingSubmissionId, setConvertingSubmissionId] = useState<string | null>(null);

  // Modals & Feedback
  const [isCannedModalOpen, setIsCannedModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [prevCount, setPrevCount] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; link?: string; linkText?: string; tone?: 'success' | 'danger' } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'mark-read'; id?: string; count?: number; targetStatus?: ContactSubmission['status'] } | null>(null);
  const [confirmActionLoading, setConfirmActionLoading] = useState(false);

  // Server-backed inbox refresh. The API is the only source of truth.
  const refreshInbox = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.leads.getAll();

      if (!res.success || !Array.isArray(res.data?.leads)) {
        setLoadError(res.error || (language === 'id' ? 'Inbox gagal dimuat.' : 'Inbox could not be loaded.'));
        return;
      }

      const items = (res.data.leads as ContactSubmission[])
        .map(normalizeContactSubmission)
        .filter((item) => item.type !== 'career');
      setSubmissions(items);
      setPrevCount(items.length);
      setLoadError(null);
    } catch {
      setLoadError(language === 'id' ? 'Inbox gagal dimuat. Coba lagi.' : 'Inbox could not be loaded. Please retry.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void refreshInbox();
    const timer = window.setInterval(() => void refreshInbox(true), 30000);
    return () => window.clearInterval(timer);
  }, []);


  const activeTabItems = useMemo(() => {
    switch (activeInboxTab) {
      case 'overview':
      case 'messages': return submissions;
      case 'unread': return submissions.filter((item) => item.status === 'new');
      case 'starred': return submissions.filter((item) => !!item.starred);
      case 'client':
        // Keep Sales Inquiries scoped to actual inquiry records.
        // Legacy records without a type retain their historical inquiry behavior.
        return submissions.filter((item) => !item.type || item.type === 'inquiry');
      default: return submissions;
    }
  }, [activeInboxTab, submissions]);

  type TriageScope = 'action' | 'unassigned' | 'priority' | 'saved';
  const [triageScope, setTriageScope] = useState<TriageScope>('action');

  const isMixedInboxTab = activeInboxTab === 'overview' || activeInboxTab === 'messages' || activeInboxTab === 'starred';
  const inboxStatusOptions = [
    { value: 'all', label: language === 'id' ? 'Semua Status' : 'All Status' },
    { value: 'new', label: 'Status: New' },
    { value: 'in-review', label: 'Status: In Review' },
    { value: 'contacted', label: 'Status: Contacted' },
    { value: 'closed', label: 'Status: Closed Deal' }
  ];

  useEffect(() => {
    setSelectedSubmission(null);
    setPage(1);
    setFilterStatus('all');
    setFilterPriority('all');
    setSearchQuery('');
    setViewMode(activeInboxTab === 'overview' ? 'overview' : activeInboxTab === 'starred' ? 'queue' : 'split');
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

  const handleConvertToClient = async (submission: ContactSubmission) => {
    if (!canManageClients || (submission.type && submission.type !== 'inquiry') || convertingSubmissionId) return;
    setConvertingSubmissionId(submission.id);
    try {
      const result = await api.leads.convertToClient(submission.id);
      if (!result.success || !result.data?.client) {
        throw new Error(result.error || 'Lead could not be converted to a client.');
      }
      await refreshInbox();
      setSelectedSubmission((current) => current?.id === submission.id
        ? {
            ...current,
            status: 'closed',
            convertedClientId: result.data!.client.id,
            convertedAt: result.data!.lead?.convertedAt || new Date().toISOString(),
            conversionType: result.data!.created ? 'created-client' : 'linked-existing-client'
          }
        : current);
      setToastMessage({
        text: result.data.replayed
          ? (language === 'id' ? 'Lead ini sudah terhubung ke client.' : 'This lead is already linked to a client.')
          : result.data.created
            ? (language === 'id' ? 'Lead berhasil dikonversi menjadi client.' : 'Lead converted to a client.')
            : (language === 'id' ? 'Lead terhubung ke client yang sudah ada.' : 'Lead linked to an existing client.')
      });
      window.setTimeout(() => setToastMessage(null), 3500);
    } catch (error) {
      setToastMessage({
        text: error instanceof Error ? error.message : (language === 'id' ? 'Lead gagal dikonversi. Coba lagi.' : 'Lead could not be converted. Please retry.'),
        tone: 'danger'
      });
      window.setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setConvertingSubmissionId(null);
    }
  };

  // Status update
  const handleStatusChange = async (id: string, newStatus: ContactSubmission['status']) => {
    if (!canManageCrm) {
      setToastMessage({ text: language === 'id' ? 'Anda tidak memiliki izin mengelola inbox.' : 'You do not have permission to manage the inbox.', tone: 'danger' });
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
      setToastMessage({ text: language === 'id' ? 'Anda tidak memiliki izin mengelola inbox.' : 'You do not have permission to manage the inbox.', tone: 'danger' });
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
      setToastMessage({ text: language === 'id' ? 'Anda tidak memiliki izin mengelola inbox.' : 'You do not have permission to manage the inbox.', tone: 'danger' });
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
      setToastMessage({ text: language === 'id' ? 'Anda tidak memiliki izin mengelola inbox.' : 'You do not have permission to manage the inbox.', tone: 'danger' });
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
    if (confirmActionLoading) return;
    setConfirmActionLoading(true);
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
      setConfirmActionLoading(false);
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
        targetStatus: activeInboxTab === 'client' ? 'in-review' : undefined
      });
    }
  };

  const confirmMarkAllRead = async (count: number, targetStatus?: ContactSubmission['status']) => {
    if (confirmActionLoading) return;
    setConfirmActionLoading(true);
    try {
      const unread = activeTabItems.filter((item) => item.status === 'new');
      for (const item of unread) {
        const nextStatus = targetStatus || 'in-review';
        const res = await api.leads.update(item.id, { status: nextStatus });
        if (!res.success) throw new Error(res.error || 'Bulk status update failed');
      }
      await refreshInbox();
      setToastMessage({
        text: language === 'id'
          ? String(count) + (isMixedInboxTab ? ' record baru diproses.' : ' pesan ditandai telah ditinjau.')
          : String(count) + (isMixedInboxTab ? ' new records processed.' : ' messages marked as In Review.')
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
      setConfirmActionLoading(false);
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

  // Metrics calculation
  const metrics = useMemo(() => ({
    total: activeTabItems.length,
    newCount: activeTabItems.filter((item) => item.status === 'new').length
  }), [activeTabItems]);

  // Filtering
  const filteredItems = useMemo(() => {
    return activeTabItems.filter(item => {
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || (item.priority || 'normal') === filterPriority;
      const matchesStarred = activeInboxTab === 'starred' ? !!item.starred : true;

      const queryLower = searchQuery.toLowerCase().trim();
      const matchesSearch = !queryLower || (
        getSubmissionSlug(item).toLowerCase().includes(queryLower) ||
        (item.fullName || '').toLowerCase().includes(queryLower) ||
        (item.email || '').toLowerCase().includes(queryLower) ||
        (item.company || '').toLowerCase().includes(queryLower) ||
        (item.message || '').toLowerCase().includes(queryLower) ||
        (item.positionTitle || '').toLowerCase().includes(queryLower) ||
        (item.services || []).some(s => s.toLowerCase().includes(queryLower)) ||
        (item.source || '').toLowerCase().includes(queryLower) ||
        (item.specialty || '').toLowerCase().includes(queryLower)
      );

      return matchesStatus && matchesPriority && matchesStarred && matchesSearch && matchesDate(item.createdAt);
    });
  }, [activeTabItems, filterStatus, filterPriority, searchQuery, matchesDate]);

  const triageItems = useMemo(() => {
    return filteredItems
      .filter((item) =>
        triageScope === 'action'
          ? isInboxActionable(item)
          : triageScope === 'unassigned'
            ? isInboxUnassigned(item)
            : triageScope === 'priority'
              ? isInboxHighPriority(item)
              : !!item.starred
      )
      .sort((a, b) => {
        const priorityRank = (item: ContactSubmission) =>
          item.priority === 'urgent' ? 0 : item.priority === 'high' ? 1 : item.priority === 'normal' ? 2 : 3;
        const statusRank = (item: ContactSubmission) => item.status === 'new' ? 0 : item.status === 'in-review' ? 1 : 2;
        const scoreA = priorityRank(a) * 10 + statusRank(a);
        const scoreB = priorityRank(b) * 10 + statusRank(b);
        return scoreA - scoreB || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [filteredItems, triageScope]);
  const visibleTriageItems = triageItems.slice(0, 8);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage((current) => Math.min(current, pageCount)); }, [pageCount]);
  useEffect(() => { setPage(1); }, [activeInboxTab, filterStatus, filterPriority, searchQuery, reportPeriodValue, reportPeriodEnabled]);

  // Export CSV
  const handleExportCSV = () => {
    if (submissions.length === 0) return;
    const headers = ['ID', 'Slug', 'Date', 'Type', 'Status', 'Priority', 'Full Name', 'Email', 'Company', 'Phone', 'Services', 'Budget', 'Message', 'Source'];
    const rows = activeTabItems.map(s => [
      `"${s.id}"`,
      `"${getSubmissionSlug(s)}"`,
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
      `"${(s.message || '').replace(/"/g, '""')}"`,
      `"${s.source || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'kapitech_' + ({ overview: 'all_inbound', messages: 'all_messages', client: 'sales_inquiries', unread: 'unread_messages', starred: 'starred' }[activeInboxTab]) + '_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for channel badges
  const renderChannelBadge = (type?: string) => {
    switch (type) {
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
          <span className="px-1.5 py-0.5 rounded-badge text-[10px] font-sans bg-danger/10 text-danger border border-danger/30 font-semibold">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="px-1.5 py-0.5 rounded-badge text-[10px] font-sans bg-warning/10 text-warning border border-warning/30">
            High
          </span>
        );
      case 'low':
        return (
          <span className="px-1.5 py-0.5 rounded-badge text-[10px] font-sans bg-panel-hover text-muted border border-line">
            Low
          </span>
        );
      case 'normal':
      default:
        return null;
    }
  };

  return (
    <AdminPageShell featureSlug="inbox-module" className="ams-inbox-page">
      
      <AdminModuleHeader slug="inbox-header"
        className="mb-0"
        title={activeInboxTab === 'overview' ? 'Inbox Overview' : activeInboxTab === 'messages' ? 'All Messages' : activeInboxTab === 'client' ? 'Sales Inquiries' : activeInboxTab === 'unread' ? 'Unread Messages' : 'Starred'}
        description={
          activeInboxTab === 'overview'
            ? (language === 'id'
              ? 'Triage inbound, tinjau record yang perlu keputusan, dan buka konteks record sebelum mengambil tindakan.'
              : 'Triage inbound records, review items needing a decision, and inspect record context before acting.')
            : activeInboxTab === 'messages'
              ? (language === 'id' ? 'Semua pesan masuk dari sumber yang tersedia, tidak termasuk pelamar Careers.' : 'All inbound messages from available sources, excluding Careers applicants.')
              : activeInboxTab === 'client'
                ? (language === 'id'
                  ? 'Kelola inquiry calon klien, prioritas tindak lanjut, dan status respons.'
                  : 'Review sales inquiries, prioritize follow-ups, and track response status.')
                : activeInboxTab === 'unread'
                  ? (language === 'id'
                    ? 'Record berstatus New yang saat ini menjadi antrean pesan belum ditangani.'
                    : 'Records in New status, which the current Inbox uses as its pending or unread queue.')
                  : (language === 'id'
                    ? 'Kelola record yang disimpan untuk tindak lanjut prioritas.'
                    : 'Manage records intentionally saved for priority follow-up.')
        }
        actions={(
          <>
            <span className="text-[11px] tabular-nums text-muted">{loadError && submissions.length === 0 ? (language === 'id' ? 'Data tidak tersedia' : 'Unavailable') : activeTabItems.length + ' total inbound'}</span>
            {canManageCrm && <Link to="/admin/cms/careers?tab=applicants" className="ams-action inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent">{language === 'id' ? 'Pelamar Careers' : 'Careers Applicants'}</Link>}
            <button type="button" onClick={() => setIsEmailModalOpen(true)} className="ams-action inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent" title={language === 'id' ? 'Buka pengaturan notifikasi email' : 'Open email alert settings'}><Mail size={14} /><span>{language === 'id' ? 'Notifikasi Email' : 'Email Alerts'}</span></button>
            {metrics.newCount > 0 && activeInboxTab !== 'overview' && activeInboxTab !== 'unread' && <button type="button" onClick={handleMarkAllRead} disabled={!canManageCrm} className="ams-action inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent"><Check size={14} /><span>{isMixedInboxTab ? (language === 'id' ? 'Proses Baru' : 'Process New') : (language === 'id' ? 'Tandai Dibaca' : 'Mark Read')}</span></button>}
            {activeTabItems.length > 0 && activeInboxTab !== 'overview' && <button type="button" onClick={handleExportCSV} className="ams-action inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent"><Download size={14} /><span>Export CSV</span></button>}
          </>
        )}
      />

      {(['messages', 'client', 'unread', 'starred'] as InboxTab[]).includes(activeInboxTab) && (
        <>
          <AdminSectionTabs
            ariaLabel="Message categories"
            activeKey={activeInboxTab === 'client' ? 'sales-inquiries' : 'all-messages'}
            className="w-full border-b border-line pb-2"
            items={[
              { key: 'all-messages', label: 'All Messages', to: '/admin/inbox?view=messages' },
              { key: 'sales-inquiries', label: 'Sales Inquiries', to: '/admin/inbox?view=client' },
              { key: 'client-requests', label: 'Client Requests', to: '/admin/inbox', available: false },
              { key: 'project-support', label: 'Project & Support', to: '/admin/inbox', available: false },
            ]}
          />
          <AdminSectionTabs
            ariaLabel="Message saved views"
            activeKey={activeInboxTab === 'unread' || activeInboxTab === 'starred' ? activeInboxTab : ''}
            className="w-full pb-1"
            items={[
              { key: 'unread', label: 'Unread', to: '/admin/inbox?view=unread' },
              { key: 'starred', label: 'Starred', to: '/admin/inbox?view=starred' },
              { key: 'resolved', label: 'Resolved', to: '/admin/inbox?view=resolved', available: false },
              { key: 'archived', label: 'Archived', to: '/admin/inbox?view=archived', available: false },
            ]}
          />
        </>
      )}

      {loadError && (
        <div className="flex flex-col gap-3 rounded-card border border-warning/25 bg-warning/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" role="alert" data-ams-slug="inbox-load-unavailable">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-fg">{language === 'id' ? 'Data Inbox tidak tersedia' : 'Inbox data unavailable'}</p>
            <p className="mt-1 text-[11px] leading-5 text-muted">
              {loadError}{' '}{submissions.length > 0
                ? (language === 'id' ? 'Data terakhir yang berhasil dimuat tetap ditampilkan.' : 'The last successfully loaded records remain visible.')
                : (language === 'id' ? 'Jumlah dan status antrean belum bisa diverifikasi.' : 'Queue totals and empty states cannot be verified yet.')}
            </p>
          </div>
          <button type="button" onClick={() => void refreshInbox()} disabled={loading} aria-busy={loading || undefined} className="inline-flex min-h-9 items-center justify-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60">{loading ? (language === 'id' ? 'Memuat…' : 'Retrying…') : (language === 'id' ? 'Coba lagi' : 'Retry')}</button>
        </div>
      )}

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

      {/* 3. TAB-SPECIFIC CONTROLS */}
      {activeInboxTab === 'overview' || activeInboxTab === 'messages' || activeInboxTab === 'unread' ? (
        <AdminFilterBar
          slug="inbox-overview-controls"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search inbound, company, or slug..."
          searchLabel="Search inbound"
          actions={(
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto custom-scrollbar">
              {activeInboxTab === 'messages' && (
                <>
                  <div className="w-[150px] shrink-0">
                    <CustomSelect
                      value={filterStatus}
                      onChange={setFilterStatus}
                      options={inboxStatusOptions}
                      aria-label="Filter messages by status"
                      slug="inbox-message-status-filter"
                    />
                  </div>
                  <div className="w-[150px] shrink-0">
                    <CustomSelect
                      value={filterPriority}
                      onChange={setFilterPriority}
                      options={[
                        { value: 'all', label: 'All priorities' },
                        { value: 'urgent', label: 'Urgent' },
                        { value: 'high', label: 'High' },
                        { value: 'normal', label: 'Normal' },
                        { value: 'low', label: 'Low' },
                      ]}
                      aria-label="Filter messages by priority"
                      slug="inbox-message-priority-filter"
                    />
                  </div>
                </>
              )}
              <button type="button" onClick={() => void refreshInbox()} className="inline-flex h-9 min-h-9 shrink-0 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-muted hover:bg-panel hover:text-fg">
                <RefreshCw size={13} />Refresh
              </button>
              {activeInboxTab === 'messages' && (
                <Link
                  to="/admin/inbox?view=unread"
                  className="inline-flex h-9 min-h-9 shrink-0 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-muted hover:bg-panel hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Mail size={13} />Unread
                </Link>
              )}
              {activeInboxTab === 'unread' && (
                <Link
                  to="/admin/inbox?view=messages"
                  className="inline-flex h-9 min-h-9 shrink-0 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-muted hover:bg-panel hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Inbox size={13} />All Messages
                </Link>
              )}
              {activeInboxTab === 'messages' && (
                <Link
                  to="/admin/inbox?view=starred"
                  className="inline-flex h-9 min-h-9 shrink-0 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-muted hover:bg-panel hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Star size={13} />Starred
                </Link>
              )}
              {metrics.newCount > 0 && (
                <button type="button" onClick={handleMarkAllRead} disabled={!canManageCrm} className="inline-flex h-9 min-h-9 shrink-0 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-muted hover:bg-panel hover:text-fg disabled:pointer-events-none disabled:opacity-40">
                  <Check size={13} />
                  <span>{isMixedInboxTab ? (language === 'id' ? 'Proses Baru' : 'Process New') : (language === 'id' ? 'Tandai Dibaca' : 'Mark Read')}</span>
                </button>
              )}
              <button type="button" onClick={handleExportCSV} disabled={activeTabItems.length === 0} className="inline-flex h-9 min-h-9 shrink-0 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-muted hover:bg-panel hover:text-fg disabled:pointer-events-none disabled:opacity-40">
                <Download size={13} />Export
              </button>
              <button type="button" onClick={() => setViewMode('split')} className="inline-flex h-9 min-h-9 shrink-0 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Open review workspace">
                <User size={13} />Review
              </button>
              <button type="button" onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterPriority('all'); }} disabled={!searchQuery && filterStatus === 'all' && filterPriority === 'all'} className="inline-flex h-9 min-h-9 shrink-0 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-muted hover:bg-panel hover:text-fg disabled:pointer-events-none disabled:opacity-40">
                Reset
              </button>
            </div>
          )}
          footer={(
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] text-muted">{loadError && submissions.length === 0 ? (language === 'id' ? 'Jumlah record belum tersedia.' : 'Inbound record count unavailable.') : filteredItems.length + ' matching inbound records · updates automatically every 30 seconds.'}</p>
              <span className={'inline-flex min-h-7 items-center gap-1.5 rounded-badge border px-2 text-[10px] font-medium ' + (loading ? 'border-info/20 bg-info/10 text-info' : loadError ? 'border-warning/20 bg-warning/10 text-warning' : 'border-success/20 bg-success/10 text-success')}>
                <span className={'h-1.5 w-1.5 rounded-full ' + (loading ? 'bg-info' : loadError ? 'bg-warning' : 'bg-success')} />
                {loading ? (submissions.length > 0 ? (language === 'id' ? 'Memperbarui' : 'Refreshing') : (language === 'id' ? 'Memuat' : 'Loading')) : loadError ? (submissions.length > 0 ? (language === 'id' ? 'Data lama' : 'Stale') : (language === 'id' ? 'Tidak tersedia' : 'Unavailable')) : 'Live'}
              </span>
            </div>
          )}
        />
      ) : activeInboxTab === 'starred' ? (
        <AdminFilterBar
          slug="inbox-starred-controls"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search saved records, company, contact, or slug..."
          searchLabel="Search starred records"
          actions={(
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto custom-scrollbar">
              <div className="w-[150px] shrink-0"><CustomSelect value={filterPriority} onChange={setFilterPriority} options={[{value:'all',label:'All Priorities'},{value:'urgent',label:'Urgent'},{value:'high',label:'High'},{value:'normal',label:'Normal'},{value:'low',label:'Low'}]} /></div>
              <div role="group" aria-label="Starred record view" className="flex shrink-0 items-center rounded-control border border-line bg-bg p-0.5">
                <button type="button" aria-pressed={viewMode === 'queue'} onClick={() => setViewMode('queue')} className={'inline-flex h-9 min-h-9 items-center gap-1.5 rounded-chip border px-3 text-xs font-medium transition-colors ' + (viewMode === 'queue' ? 'border-line bg-panel text-fg' : 'border-transparent text-muted hover:bg-panel hover:text-fg')}><Star size={13}/>Queue</button>
                <button type="button" aria-pressed={viewMode === 'split'} onClick={() => setViewMode('split')} className={'inline-flex h-9 min-h-9 items-center gap-1.5 rounded-chip border px-3 text-xs font-medium transition-colors ' + (viewMode === 'split' ? 'border-line bg-panel text-fg' : 'border-transparent text-muted hover:bg-panel hover:text-fg')}><User size={13}/>Review</button>
              </div>
            </div>
          )}
        />
      ) : (
        <AdminFilterBar
          slug="inbox-client-controls"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search company, contact, service, budget, or brief..."
          searchLabel="Search client inquiries"
          actions={(
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto custom-scrollbar">
              <div className="w-[150px] shrink-0"><CustomSelect value={filterStatus} onChange={setFilterStatus} options={inboxStatusOptions} /></div>
              <div className="w-[150px] shrink-0"><CustomSelect value={filterPriority} onChange={setFilterPriority} options={[{value:'all',label:'All Priorities'},{value:'urgent',label:'Urgent'},{value:'high',label:'High'},{value:'normal',label:'Normal'},{value:'low',label:'Low'}]} /></div>
              <div className="flex shrink-0 items-center rounded-control border border-line bg-bg p-0.5">
                <button type="button" aria-pressed={viewMode === 'split'} onClick={() => setViewMode('split')} className={'inline-flex h-9 min-h-9 items-center gap-1.5 rounded-chip border px-3 text-xs font-medium transition-colors ' + (viewMode === 'split' ? 'border-line bg-panel text-fg' : 'border-transparent text-muted hover:bg-panel hover:text-fg')}><LayoutGrid size={13}/>Review</button>
                <button type="button" aria-pressed={viewMode === 'table'} onClick={() => setViewMode('table')} className={'inline-flex h-9 min-h-9 items-center gap-1.5 rounded-chip border px-3 text-xs font-medium transition-colors ' + (viewMode === 'table' ? 'border-line bg-panel text-fg' : 'border-transparent text-muted hover:bg-panel hover:text-fg')}><TableIcon size={13}/>Table</button>
              </div>
            </div>
          )}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* Client pipeline context card */}
      {activeInboxTab === 'client' && viewMode === 'split' && (
        <section data-ams-feature-slug="inbox-client-pipeline" data-ams-slug="inbox-client-pipeline" className="rounded-card border border-line bg-panel p-3.5">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-fg">Inquiry status</h3><p className="mt-0.5 text-[11px] text-muted">Track client inquiries by status and follow-up stage.</p></div><span className="text-[11px] tabular-nums text-muted">{activeTabItems.length} inquiries</span></div>
          <div className="grid grid-cols-2 gap-2 min-[1100px]:grid-cols-4">
            {[
              {key:'new',label:'New'},{key:'in-review',label:'In review'},{key:'contacted',label:'Contacted'},{key:'closed',label:'Closed'}
            ].map((stage)=>{
              const count=activeTabItems.filter((item)=>item.status===stage.key).length;
              const active = filterStatus === stage.key;
              return <button
                type="button"
                key={stage.key}
                onClick={() => setFilterStatus(active ? 'all' : stage.key)}
                aria-pressed={active}
                className={'group rounded-card border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' + (
                  active
                    ? 'border-accent/25 bg-accent/10'
                    : 'border-line bg-bg hover:border-muted hover:bg-panel'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={'text-[10px] font-medium ' + (active ? 'text-fg' : 'text-muted')}>{stage.label}</span>
                  <span className={'rounded-badge border px-1.5 py-0.5 text-[10px] font-medium tabular-nums ' + (active ? 'border-accent/20 bg-bg text-fg' : 'border-line bg-panel text-muted')}>{count}</span>
                </div>
                <p className={'mt-2 text-[11px] font-medium ' + (active ? 'text-fg' : 'text-muted')}>{count} {count === 1 ? 'inquiry' : 'inquiries'}</p>
              </button>;
            })}
          </div>
        </section>
      )}

      {/* 4. MAIN CONTENT VIEW: SPLIT VIEW vs TABLE VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'overview' ? (
        <section data-ams-feature-slug="inbox-overview-workspace" data-ams-slug="inbox-overview-workspace" className="grid grid-cols-1 gap-3 min-[1100px]:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="overflow-hidden rounded-card border border-line bg-panel">
            <div className="border-b border-line px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-fg">Triage queue</h3>
                    <span className="rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted">{triageItems.length}</span>
                  </div>
                  <p className="mt-1 max-w-xl text-[11px] leading-4 text-muted">New, unassigned, and urgent/high-priority records appear here first. Use the scopes to focus the queue.</p>
                </div>
                <button type="button" onClick={() => setViewMode('split')} className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-control border border-line bg-bg px-2.5 text-[10px] font-medium text-fg hover:bg-panel">
                  <Inbox size={12} />Open full inbox
                </button>
              </div>
              <div className="mt-3 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                {[
                  { key: 'action' as TriageScope, label: 'Needs action', count: filteredItems.filter(isInboxActionable).length },
                  { key: 'unassigned' as TriageScope, label: 'Unassigned', count: filteredItems.filter(isInboxUnassigned).length },
                  { key: 'priority' as TriageScope, label: 'Priority', count: filteredItems.filter(isInboxHighPriority).length },
                  { key: 'saved' as TriageScope, label: 'Saved', count: filteredItems.filter((item) => !!item.starred).length }
                ].map((scope) => (
                  <button
                    key={scope.key}
                    type="button"
                    aria-pressed={triageScope === scope.key}
                    onClick={() => {
                      setTriageScope(scope.key);
                      setSelectedSubmission(null);
                    }}
                    className={
                      'inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-chip border px-2.5 text-[10px] font-medium transition-colors ' +
                      (triageScope === scope.key ? 'border-accent/30 bg-accent/10 text-accent-text' : 'border-line bg-bg text-muted hover:text-fg')
                    }
                  >
                    <span>{scope.label}</span><span className="tabular-nums">{scope.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-line">
              {triageItems.length === 0 ? (
                <div className="min-h-[180px] px-4 py-6">
                  <div className="rounded-control border border-line bg-bg p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-panel">
                        <Check size={15} className="text-success" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-fg">{loadError && submissions.length === 0 ? (language === 'id' ? 'Inbox tidak tersedia' : 'Inbox unavailable') : triageScope === 'action' ? 'No records need action' : triageScope === 'unassigned' ? 'No unassigned records' : triageScope === 'priority' ? 'No priority records' : 'No saved records'}</p>
                        <p className="mt-0.5 text-[10px] leading-4 text-muted">{loadError && submissions.length === 0 ? (language === 'id' ? 'Sumber data gagal dimuat. Coba lagi untuk memverifikasi antrean.' : 'The inbox source failed to load. Retry to verify this queue.') : triageScope === 'action' ? 'No new, unassigned, or urgent/high-priority records need attention.' : triageScope === 'unassigned' ? 'Every current record in this queue has an assigned owner.' : triageScope === 'priority' ? 'Urgent and high-priority records are clear.' : 'Star a record when the team needs to keep it on the follow-up list.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                visibleTriageItems.map((item) => {
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleSelectSubmission(item)}
                      className={'block w-full px-4 py-3 text-left transition-colors hover:bg-panel-hover ' + (selectedSubmission?.id === item.id ? 'bg-accent/5' : '')}
                    >
                      <div className="grid grid-cols-[4px_minmax(0,1fr)] gap-3">
                        <span className={'mt-0.5 h-full min-h-12 w-1 rounded-full ' + (item.priority === 'urgent' ? 'bg-danger' : item.priority === 'high' ? 'bg-warning' : item.status === 'new' ? 'bg-info' : 'bg-line')} aria-hidden="true" />
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {renderChannelBadge(item.type)}
                                {renderStatusBadge(item.status)}
                                {renderPriorityBadge(item.priority)}
                                {item.starred && <Star size={11} className="fill-warning text-warning" />}
                              </div>
                              <div className="mt-1.5 flex items-center gap-2">
                                <p className="truncate text-xs font-semibold text-fg">{item.fullName || 'Anonymous'}</p>
                                <span className="hidden truncate text-[10px] text-muted sm:inline">{item.company || item.email}</span>
                              </div>
                            </div>
                            <span className="shrink-0 text-[10px] tabular-nums text-muted">{formatRelativeTime(item.createdAt)}</span>
                          </div>
                          <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-muted">{item.message || 'No brief content provided.'}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate font-mono text-[10px] text-muted/70">/{getSubmissionSlug(item)}</span>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {item.assignedTo && <span className="hidden max-w-[120px] truncate rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[10px] text-muted md:inline">{item.assignedTo}</span>}
                              <span className="text-[10px] text-muted">Review record</span>
                              <ChevronRight size={12} className="text-muted" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-line bg-bg/50 px-4 py-2.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] leading-4 text-muted">{triageItems.length > visibleTriageItems.length ? `Showing ${visibleTriageItems.length} of ${triageItems.length} matching records, ordered by priority and age.` : triageItems.length > 0 ? `${visibleTriageItems.length} matching records, ordered by priority and age.` : 'The queue updates automatically as new inbound records arrive.'}</p>
                <button type="button" onClick={() => { setViewMode('split'); setFilterStatus('new'); }} className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-2.5 text-[10px] font-medium text-fg hover:bg-bg">
                  <Filter size={11} />Open filtered list
                </button>
              </div>
            </div>
          </div>

          <aside className="flex min-h-[420px] flex-col overflow-hidden rounded-card border border-line bg-panel">
            <div className="border-b border-line px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-fg">Record review</h3>
                  <p className="mt-1 text-[11px] leading-4 text-muted">Select a record in the triage queue to inspect its identity, status, ownership, brief, and available actions.</p>
                </div>
                <span className="shrink-0 rounded-badge border border-line bg-bg px-2 py-1 text-[10px] font-medium text-muted">{selectedSubmission ? 'Selected' : 'No selection'}</span>
              </div>
            </div>

            {selectedSubmission ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-line px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {renderChannelBadge(selectedSubmission.type)}
                        {renderStatusBadge(selectedSubmission.status)}
                        {renderPriorityBadge(selectedSubmission.priority)}
                      </div>
                      <h4 className="mt-2 truncate text-sm font-semibold text-fg">{selectedSubmission.fullName || 'Anonymous'}</h4>
                      <p className="mt-0.5 truncate text-[11px] text-muted">{selectedSubmission.company || selectedSubmission.email}</p>
                      <p className="mt-1 font-mono text-[10px] text-muted/70">/{getSubmissionSlug(selectedSubmission)}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedSubmission(null)} className="inline-flex h-9 w-9 min-h-9 min-w-9 shrink-0 aspect-square items-center justify-center rounded-control border border-line bg-bg p-0 text-muted transition-colors hover:bg-panel hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Clear selected record" title="Clear selected record"><X size={14} /></button>
                  </div>
                </div>

                <div className="flex-1 px-4 py-4">
                  <div className="space-y-3">
                    <div className="rounded-control border border-line bg-bg p-3">
                      <p className="text-[10px] font-medium text-muted">Brief</p>
                      <p className="mt-1.5 text-[11px] leading-5 text-fg">{selectedSubmission.message || 'No brief content provided.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">Status</p><p className="mt-1 text-xs font-medium text-fg">{selectedSubmission.status}</p></div>
                      <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">Received</p><p className="mt-1 text-xs font-medium tabular-nums text-fg">{formatRelativeTime(selectedSubmission.createdAt)}</p></div>
                    </div>
                    <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] font-medium text-muted">Ownership</p><p className="mt-1 text-xs font-medium text-fg">{selectedSubmission.assignedTo || 'Unassigned'}</p></div>
                    {selectedSubmission.internalNotes && <div className="rounded-control border border-warning/20 bg-warning/10 p-3"><p className="text-[10px] font-medium text-warning">Internal note</p><p className="mt-1 text-[11px] leading-4 text-fg">{selectedSubmission.internalNotes}</p></div>}
                  </div>
                </div>

                <div className="border-t border-line bg-bg/50 px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {(!selectedSubmission.type || selectedSubmission.type === 'inquiry') && canManageClients && (
                      selectedSubmission.convertedClientId ? (
                        <Link to="/admin/clients/all-clients" className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-control border border-success/25 bg-success/10 px-3 text-[10px] font-medium text-success">
                          <Check size={12} />{language === 'id' ? 'Sudah menjadi client' : 'Client linked'}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleConvertToClient(selectedSubmission)}
                          disabled={convertingSubmissionId === selectedSubmission.id || isUpdating}
                          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-control border border-accent/30 bg-accent/10 px-3 text-[10px] font-medium text-fg hover:bg-accent/15 disabled:opacity-50"
                        >
                          <Building2 size={12} />{convertingSubmissionId === selectedSubmission.id
                            ? (language === 'id' ? 'Mengonversi…' : 'Converting…')
                            : (language === 'id' ? 'Jadikan client' : 'Convert to client')}
                        </button>
                      )
                    )}
                    {selectedSubmission.status === 'new' && (
                      <button type="button" onClick={() => void handleStatusChange(selectedSubmission.id, 'in-review')} disabled={!canManageCrm || isUpdating} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-control bg-accent px-3 text-[10px] font-medium text-white hover:bg-accent/90 disabled:opacity-50">
                        <Check size={12} />Start review
                      </button>
                    )}
                    <button type="button" onClick={() => setViewMode('split')} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-[10px] font-medium text-fg hover:bg-bg"><ExternalLink size={12} />Open full review</button>
                    <button type="button" onClick={(event) => handleToggleStar(event, selectedSubmission.id, selectedSubmission.starred)} disabled={!canManageCrm} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-[10px] font-medium text-muted hover:text-warning disabled:opacity-50">
                      <Star size={12} className={selectedSubmission.starred ? 'fill-warning text-warning' : ''} />{selectedSubmission.starred ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-1 flex-col items-center justify-center px-8 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-card border border-line bg-bg text-muted"><Inbox size={20} /></div>
                <p className="mt-3 text-sm font-medium text-fg">Select an inbound record</p>
                <p className="mt-1 max-w-xs text-[11px] leading-5 text-muted">Choose a record from the queue to see its status, ownership, brief, and next action here.</p>
              </div>
            )}
          </aside>
        </section>
      ) : viewMode === 'queue' ? (
        <section data-ams-feature-slug="inbox-starred-queue" data-ams-slug="inbox-starred-queue" className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {[
              {key:'client',title:'Starred client work',description:'Saved sales opportunities and follow-up threads.',items:filteredItems}
            ].map((group)=><div key={group.key} className="rounded-card border border-line bg-panel overflow-hidden"><div className="border-b border-line px-4 py-3.5"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-fg">{group.title}</h3><p className="mt-0.5 text-[11px] text-muted">{group.description}</p></div><span className="text-[11px] tabular-nums text-muted">{group.items.length}</span></div></div><div className="divide-y divide-line">{group.items.map((item)=><div key={item.id} className="px-4 py-3 hover:bg-panel-hover transition-colors"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5 flex-wrap">{renderChannelBadge(item.type)}{renderStatusBadge(item.status)}{renderPriorityBadge(item.priority)}</div><div className="mt-1.5 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-fg">{item.fullName}</p><p className="truncate text-[11px] text-muted">{item.company || item.email}</p></div><span className="shrink-0 text-[10px] tabular-nums text-muted">{formatRelativeTime(item.createdAt)}</span></div><p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted">{item.message||'No message content.'}</p><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-[10px] text-muted/75">/{getSubmissionSlug(item)}</span><div className="flex items-center gap-1.5"><button type="button" onClick={(e)=>handleToggleStar(e,item.id,item.starred)} disabled={!canManageCrm} className="inline-flex min-h-8 items-center gap-1 rounded-control border border-warning/30 bg-warning/10 px-2.5 text-[10px] font-medium text-warning hover:bg-warning/15"><Star size={11} className="fill-warning"/>Remove</button><button type="button" onClick={()=>{handleSelectSubmission(item);setViewMode('split');}} className="inline-flex min-h-8 items-center gap-1 rounded-control border border-line bg-panel px-2.5 text-[10px] font-medium text-fg hover:bg-bg">Review<ChevronRight size={11}/></button></div></div></div></div></div>) }{group.items.length===0&&<div className="p-12 text-center"><Star size={20} className="mx-auto mb-2 text-line"/><p className="text-xs text-muted">No starred records in this queue.</p></div>}</div></div>)}
          </div>

        </section>
      ) : viewMode === 'table' ? (
        /* DENSE SPREADSHEET TABLE VIEW */

        /* DENSE SPREADSHEET TABLE VIEW */
        <div className="bg-panel border border-line rounded-card overflow-hidden">
          <div className="ams-table-scroll overflow-x-auto custom-scrollbar" tabIndex={0} role="region" aria-label="Scrollable inbox inquiry register">
            <div data-ams-feature-slug="inbox-leads-directory" data-ams-slug="inbox-leads-directory" className="min-w-0"><table className="ams-table w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-panel border-b border-line text-muted">
                  <th className="p-3 w-10 text-center">★</th>
                  <th className="p-3">{activeInboxTab === 'client' ? (language === 'id' ? 'Klien & Perusahaan' : 'Client & Company') : (language === 'id' ? 'Inbound & Konteks' : 'Inbound & Context')}</th>
                  <th className="p-3">{language === 'id' ? 'Kanal' : 'Channel'}</th>
                  <th className="p-3">{language === 'id' ? 'Layanan Diminta' : 'Requested Services'}</th>
                  <th className="p-3">{language === 'id' ? 'Anggaran' : 'Budget'}</th>
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
                      <p>{loadError && submissions.length === 0
                  ? (language === 'id' ? 'Inbox tidak tersedia.' : 'Inbox is unavailable.')
                  : submissions.length === 0
                    ? (language === 'id' ? 'Belum ada pesan masuk.' : 'No inbound records yet.')
                    : (language === 'id' ? 'Tidak ada data pesan yang sesuai kriteria.' : 'No records match your filters.')}</p>
                    </td>
                  </tr>
                ) : (
                  pagedItems.map((item) => {
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
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={(event) => void handleToggleStar(event, item.id, item.starred)}
                            aria-label={item.starred
                              ? (language === 'id' ? 'Hapus bintang dari ' : 'Remove star from ') + (item.fullName || item.email)
                              : (language === 'id' ? 'Beri bintang pada ' : 'Star ') + (item.fullName || item.email)}
                            aria-pressed={Boolean(item.starred)}
                            disabled={!canManageCrm}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-control text-muted transition-colors hover:bg-bg hover:text-warning focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Star
                              size={14}
                              aria-hidden="true"
                              className={item.starred ? 'fill-warning text-warning' : 'text-muted'}
                            />
                          </button>
                        </td>

                        {/* Name & Company */}
                        <td className="p-3">
                          <div className="font-semibold text-fg font-sans text-sm flex items-center gap-1.5">
                            <span>{item.fullName}</span>
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
                          </div>
                        </td>

                        {/* Budget */}
                        <td className="p-3 font-semibold text-fg">
{item.budget || (language === 'id' ? 'Tidak ditentukan' : 'Not provided')}
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
          <AdminTablePagination total={filteredItems.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel={language === 'id' ? 'record inbound' : 'inbound records'} slug={'inbox-' + activeInboxTab + '-pagination'} />
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
      ) : (
        /* SPLIT MASTER-DETAIL VIEW (when items exist) */
        <div className="ams-inbox-workspace grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.18fr)]">
          
          {/* Left: Master Briefs List Pane */}
          <div className={`ams-inbox-list-pane space-y-3 ${selectedSubmission ? 'hidden lg:block' : 'block'}`}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isSelected = selectedSubmission?.id === item.id;
                return (
                  <div key={item.id} onClick={() => handleSelectSubmission(item)} className={`group relative cursor-pointer rounded-card border p-3.5 font-sans transition-colors ${
                    isSelected ? 'border-accent/30 bg-accent/8' : item.status === 'new' ? 'border-danger/30 bg-panel hover:border-danger/50' : 'border-line bg-panel hover:bg-panel-hover'
                  }`}>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        {renderChannelBadge(item.type)}
                        {renderStatusBadge(item.status)}
                        {renderPriorityBadge(item.priority)}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button type="button" onClick={(event) => handleToggleStar(event, item.id, item.starred)} disabled={!canManageCrm} className="inline-flex h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-warning/10 hover:text-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50" aria-label={item.starred ? 'Unstar record' : 'Star record'}>
                          <Star size={13} className={item.starred ? 'fill-warning text-warning' : ''} />
                        </button>
                        <span className="text-[10px] tabular-nums text-muted">{formatRelativeTime(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <ProfileIdentity profile={{ name: item.fullName || 'Anonymous', role: item.positionTitle || 'Contact', contextLabel: item.company, companyEmail: item.email, phone: item.phone }} size="sm" showRole={false} />
                        <p className="mt-1 truncate text-[11px] text-muted">{item.company || item.email}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-fg">{item.budget || (language === 'id' ? 'Tidak ditentukan' : 'Not provided')}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(item.services || []).filter(Boolean).slice(0, 3).map((value, index) => (
                        <span key={index} className="rounded-badge border border-line bg-panel px-1.5 py-0.5 text-[10px] text-muted">{value}</span>
                      ))}
                    </div>
                    <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-muted">{item.message || (language === 'id' ? 'Tidak ada isi brief.' : 'No brief content provided.')}</p>
                    <p className="mt-2 truncate font-mono text-[10px] text-muted/70">/{getSubmissionSlug(item)}</p>
                  </div>
                );
              })
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-card border border-line bg-panel px-6 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-card border border-line bg-bg text-muted"><Inbox size={18} /></div>
                <p className="mt-3 text-xs font-medium text-fg">{loadError && submissions.length === 0 ? (language === 'id' ? 'Inbox tidak tersedia' : 'Inbox unavailable') : submissions.length === 0 ? 'No inbound records yet' : 'No matching records'}</p>
                <p className="mt-1 max-w-xs text-[10px] leading-4 text-muted">{loadError && submissions.length === 0 ? (language === 'id' ? 'Coba muat ulang untuk memverifikasi data masuk.' : 'Retry to verify incoming records.') : submissions.length === 0 ? 'New inquiries will appear here as they arrive.' : 'Try another search or reset the active filters.'}</p>
                {(searchQuery || filterStatus !== 'all' || filterPriority !== 'all') && (
                  <button type="button" onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterPriority('all'); }} className="mt-4 inline-flex min-h-8 items-center gap-1.5 rounded-control border border-line bg-panel px-2.5 text-[10px] font-medium text-fg hover:bg-bg"><Filter size={11} />Reset filters</button>
                )}
              </div>
            )}

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
                    <ProfileIdentity profile={{ name: selectedSubmission.fullName, role: selectedSubmission.positionTitle || 'Contact', companyEmail: selectedSubmission.email, phone: selectedSubmission.phone, division: selectedSubmission.company }} />

                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {renderChannelBadge(selectedSubmission.type)}
                        {renderStatusBadge(selectedSubmission.status)}
                        <span className="text-[10px] font-sans text-muted">
                          /{getSubmissionSlug(selectedSubmission)}
                        </span>
                      </div>
                      
                      <h2 className="text-lg font-semibold tracking-[-0.01em] text-fg sm:text-xl">
                        {selectedSubmission.fullName}
                      </h2>

                      <p className="text-xs text-success font-sans mt-0.5 font-semibold flex items-center gap-1.5">
                        <Building2 size={12} />
                        <span>
                          {selectedSubmission.company || 'Individual Client'}
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
                      type="button"
                      onClick={() => setSelectedSubmission(null)}
                      className="hidden lg:inline-flex h-9 w-9 min-h-9 min-w-9 shrink-0 aspect-square items-center justify-center rounded-control border border-line bg-bg p-0 text-muted transition-colors hover:bg-panel hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      aria-label={language === 'id' ? 'Tutup detail' : 'Close detail'}
                      title={language === 'id' ? 'Tutup detail' : 'Close detail'}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Primary Action Ribbon (Quick Responses and Direct Contact) */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5 rounded-card border border-line bg-bg p-3.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Applicant files are managed in Website CMS → Careers → Applicants. */}

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
                <div className="mb-4 inline-flex min-h-9 max-w-full items-center gap-0.5 overflow-x-auto rounded-control border border-line bg-bg p-0.5 custom-scrollbar" role="tablist" aria-label="Submission details">
                  <button
                    type="button"
                    role="tab"
                    id="submission-detail-brief-tab"
                    aria-controls="submission-detail-brief-panel"
                    aria-selected={detailTab === 'brief'}
                    tabIndex={detailTab === 'brief' ? 0 : -1}
                    onClick={() => setDetailTab('brief')}
                    onKeyDown={(event) => {
                      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                      event.preventDefault();
                      const nextTab = event.key === 'Home' ? 'brief' : event.key === 'End' ? 'notes' : detailTab === 'brief' ? 'notes' : 'brief';
                      setDetailTab(nextTab);
                      document.getElementById('submission-detail-' + nextTab + '-tab')?.focus();
                    }}
                    className={
                      'inline-flex h-9 min-h-9 shrink-0 items-center rounded-chip border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
                      (detailTab === 'brief'
                        ? 'border-line bg-panel text-fg'
                        : 'border-transparent text-muted hover:bg-panel hover:text-fg')
                    }
                  >
                    {language === 'id' ? 'Brief & kontak' : 'Brief & contact'}
                  </button>

                  <button
                    type="button"
                    role="tab"
                    id="submission-detail-notes-tab"
                    aria-controls="submission-detail-notes-panel"
                    aria-selected={detailTab === 'notes'}
                    tabIndex={detailTab === 'notes' ? 0 : -1}
                    onClick={() => setDetailTab('notes')}
                    onKeyDown={(event) => {
                      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                      event.preventDefault();
                      const nextTab = event.key === 'Home' ? 'brief' : event.key === 'End' ? 'notes' : detailTab === 'brief' ? 'notes' : 'brief';
                      setDetailTab(nextTab);
                      document.getElementById('submission-detail-' + nextTab + '-tab')?.focus();
                    }}
                    className={
                      'inline-flex h-9 min-h-9 shrink-0 items-center gap-1.5 rounded-chip border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
                      (detailTab === 'notes'
                        ? 'border-line bg-panel text-fg'
                        : 'border-transparent text-muted hover:bg-panel hover:text-fg')
                    }
                  >
                    <span>{language === 'id' ? 'Catatan internal' : 'Internal notes'}</span>
                    {selectedSubmission.internalNotes && (
                      <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-label="Has internal notes" />
                    )}
                  </button>
                </div>

                {/* TAB 1: BRIEF & CONTACT SPECS */}
                {detailTab === 'brief' && (
                  <div role="tabpanel" id="submission-detail-brief-panel" aria-labelledby="submission-detail-brief-tab" tabIndex={0} className="space-y-5">
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
                          <span>{language === 'id' ? 'Layanan / Spesialisasi' : 'Requested Services'}</span>
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
                              {selectedSubmission.specialty || selectedSubmission.positionTitle || 'General Consultation'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Budget */}
                      <div className="p-4 rounded-card bg-panel border border-line">
                        <div className="flex items-center justify-between text-xs font-sans text-muted mb-1">
                          <div className="flex items-center gap-1.5">
                            <DollarSign size={13} className="text-danger" />
                            <span>{language === 'id' ? 'Estimasi Anggaran' : 'Budget Bracket'}</span>
                          </div>
                          <span className="text-success font-semibold">
                            {selectedSubmission.budget || (language === 'id' ? 'Tidak ditentukan' : 'Not provided')}
                          </span>
                        </div>
                        <p className="text-xs font-sans font-semibold text-fg">
                          {selectedSubmission.rateCard || (selectedSubmission.budget
                            ? (language === 'id' ? 'Anggaran disampaikan oleh klien' : 'Client-provided budget')
                            : (language === 'id' ? 'Tidak ditentukan' : 'Unspecified'))}
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
                    <div className="p-4 rounded-card bg-panel/50 border border-line text-[11px] font-sans text-muted grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  <div role="tabpanel" id="submission-detail-notes-panel" aria-labelledby="submission-detail-notes-tab" tabIndex={0} className="space-y-4">
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
                        value={selectedSubmission.assignedTo || 'Lead Full-Stack Tech'}
                        onChange={(value) => handleAssigneeChange(selectedSubmission.id, value)}
                        options={[
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
                      options={[
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
            <div className="hidden lg:flex min-w-0 min-h-[460px] flex-col items-center justify-center rounded-card border border-line bg-panel px-6 py-10 text-center">
              <div className="w-16 h-16 rounded-card bg-panel border border-line flex items-center justify-center text-line mb-4">
                <Inbox size={32} />
              </div>
              <h3 className="text-fg font-medium mb-1 font-sans text-base">
                {activeInboxTab === 'client'
                  ? (language === 'id' ? 'Pilih Pesan untuk Membaca Brief' : 'Select a Brief to Inspect')
                  : (language === 'id' ? 'Pilih Record untuk Ditinjau' : 'Select a Record to Review')}
              </h3>
              <p className="text-xs text-muted max-w-sm font-sans leading-relaxed">
                {language === 'id'
                  ? (activeInboxTab === 'client'
                    ? 'Klik salah satu inquiry untuk melihat brief, respon cepat, kontak WhatsApp/Email, dan status tindak lanjut.'
                    : 'Klik salah satu record untuk melihat detail inbound, status, catatan internal, dan tindak lanjut.')
                  : 'Select an inquiry to review the brief, quick responses, WhatsApp/Email contact, and follow-up status.'}
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
        onClose={() => { if (!confirmActionLoading) setConfirmAction(null); }}
        busy={confirmActionLoading}
        title={confirmAction?.type === 'delete'
          ? (language === 'id' ? 'Hapus pesan?' : 'Delete message?')
          : isMixedInboxTab
              ? (language === 'id' ? 'Proses record baru?' : 'Process new records?')
              : (language === 'id' ? 'Tandai pesan sebagai ditinjau?' : 'Mark messages as reviewed?')}
        description={confirmAction?.type === 'delete'
          ? (language === 'id' ? 'Tindakan ini menghapus data inbox secara permanen dan tidak dapat dibatalkan.' : 'This permanently removes the inbox record and cannot be undone.')
          : isMixedInboxTab
              ? (language === 'id'
                ? `Sebanyak ${confirmAction?.count ?? 0} record baru akan diproses sesuai jenis inbound.`
                : `${confirmAction?.count ?? 0} new records will be moved to their next workflow stage.`)
              : (language === 'id'
                ? `Sebanyak ${confirmAction?.count ?? 0} pesan baru akan diubah menjadi In Review.`
                : `${confirmAction?.count ?? 0} new messages will be moved to In Review.`)}
        footer={(
          <>
            <button type="button" onClick={() => setConfirmAction(null)} disabled={confirmActionLoading} className="min-h-10 rounded-control border border-line bg-panel px-4 text-xs font-medium text-muted hover:bg-bg hover:text-fg disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
            <button
              type="button"
              disabled={confirmActionLoading}
              aria-busy={confirmActionLoading || undefined}
              onClick={() => confirmAction?.type === 'delete' && confirmAction.id
                ? void confirmDelete(confirmAction.id)
                : confirmAction?.count
                  ? void confirmMarkAllRead(confirmAction.count, confirmAction.targetStatus)
                  : setConfirmAction(null)}
              className={`min-h-10 rounded-control px-4 text-xs font-semibold text-white ${confirmAction?.type === 'delete' ? 'bg-danger hover:bg-danger/90' : 'bg-accent hover:bg-accent/90'}`}
            >
              {confirmActionLoading
                ? (language === 'id' ? 'Memproses...' : 'Processing...')
                : confirmAction?.type === 'delete'
                  ? (language === 'id' ? 'Hapus Permanen' : 'Delete Permanently')
                  : isMixedInboxTab
                      ? (language === 'id' ? 'Proses Record' : 'Process Records')
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
