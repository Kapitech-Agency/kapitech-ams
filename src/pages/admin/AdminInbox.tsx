import React, { useEffect, useState, useMemo } from 'react';
import { useReportingPeriod } from '../../lib/ReportingPeriodContext';
// Shared module chrome renders the canonical ams-page-header primitive.
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Mail, 
  RefreshCw, 
  ExternalLink,
  Download, 
  Check, 
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  X
} from 'lucide-react';
import { ContactSubmission, getSubmissionSlug, normalizeContactSubmission } from '../../lib/submissions';
import { EmailForwardingGuideModal } from '../../components/EmailForwardingGuideModal';
import { CannedResponsesModal } from '../../components/admin/inbox/CannedResponsesModal';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';
import { useLanguage } from '../../lib/LanguageContext';
import { api } from '../../lib/apiClient';
import { hasAdminPermission } from '../../lib/adminAuth';

import { AdminFilterBar, AdminModuleHeader, AdminSectionTabs, AdminPageShell } from '../../components/admin/AdminModulePrimitives';
import { MessageWorkspace } from '../../components/admin/inbox/MessageWorkspace';
export const AdminInbox: React.FC = () => {
  const { matchesDate, value: reportPeriodValue, enabled: reportPeriodEnabled } = useReportingPeriod();
  const { language } = useLanguage();
  const canManageCrm = hasAdminPermission('canManageCrm');
  const canManageClients = hasAdminPermission('canManageClients');
  type InboxTab = 'messages' | 'client' | 'unread' | 'starred';
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('view') as InboxTab | null;
  const supportedInboxViews: readonly string[] = ['messages', 'client', 'unread', 'starred'];
  const hasViewParameter = searchParams.has('view');
  const isSupportedInboxView = requestedTab === null || supportedInboxViews.includes(requestedTab);
  const activeInboxTab: InboxTab = requestedTab && supportedInboxViews.includes(requestedTab)
    ? requestedTab
    : 'messages';

  useEffect(() => {
    if (!hasViewParameter || isSupportedInboxView) return;
    const canonicalParams = new URLSearchParams(searchParams);
    canonicalParams.delete('view');
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
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'split' | 'table'>('split');

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

  const inboxChannelOptions = [
    { value: 'all', label: language === 'id' ? 'Semua kanal' : 'All channels' },
    { value: 'inquiry', label: language === 'id' ? 'Inquiry klien' : 'Client inquiry' },
    { value: 'vendor', label: language === 'id' ? 'Vendor freelance' : 'Freelance vendor' },
    { value: 'newsletter', label: 'Newsletter' },
  ];
  const inboxOwnerOptions = useMemo(() => {
    const owners = Array.from(new Set<string>(submissions.map((item) => String(item.assignedTo || '').trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b));
    return [
      { value: 'all', label: language === 'id' ? 'Semua PIC' : 'All owners' },
      { value: '__no_owner__', label: language === 'id' ? 'Belum ditugaskan' : 'Unassigned' },
      ...owners.map((owner) => ({ value: owner, label: owner })),
    ];
  }, [submissions, language]);

  const isMixedInboxTab = activeInboxTab === 'messages' || activeInboxTab === 'starred';
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
    setFilterOwner('all');
    setFilterChannel('all');
    setSearchQuery('');
    setViewMode('split');
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
      const assignedOwner = String(item.assignedTo || '').trim();
      const matchesOwner = filterOwner === 'all' || (filterOwner === '__no_owner__' ? !assignedOwner : assignedOwner === filterOwner);
      const matchesChannel = filterChannel === 'all' || (item.type || 'inquiry') === filterChannel;
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

      return matchesStatus && matchesPriority && matchesOwner && matchesChannel && matchesStarred && matchesSearch && matchesDate(item.createdAt);
    });
  }, [activeTabItems, filterStatus, filterPriority, filterOwner, filterChannel, searchQuery, matchesDate]);

  const inboxListItems = useMemo(
    () => filteredItems.slice().sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [filteredItems]
  );

    const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage((current) => Math.min(current, pageCount)); }, [pageCount]);
  useEffect(() => { setPage(1); }, [activeInboxTab, filterStatus, filterPriority, filterOwner, filterChannel, searchQuery, reportPeriodValue, reportPeriodEnabled]);

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
    link.setAttribute('download', 'kapitech_' + ({ messages: 'all_messages', client: 'sales_inquiries', unread: 'unread_messages', starred: 'starred' }[activeInboxTab]) + '_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminPageShell featureSlug="inbox-module" className="ams-inbox-page ams-inbox-message-redesign">
      
      <AdminModuleHeader slug="inbox-header"
        className="mb-0"
        title={activeInboxTab === 'messages' ? 'All Messages' : activeInboxTab === 'client' ? 'Sales Inquiries' : activeInboxTab === 'unread' ? 'Unread Messages' : 'Starred'}
        description={
          activeInboxTab === 'messages'
            ? (language === 'id' ? 'Tinjau dan tindak lanjuti pesan masuk dalam satu antrean.' : 'Review and triage inbound messages from one source-backed queue.')
            : activeInboxTab === 'client'
              ? (language === 'id' ? 'Tinjau inquiry calon klien dan konteks kebutuhan mereka.' : 'Review prospective-client inquiries and their request context.')
              : activeInboxTab === 'unread'
                ? (language === 'id' ? 'Pesan berstatus New yang masih menunggu peninjauan.' : 'New messages that still need review.')
                : (language === 'id' ? 'Pesan yang disimpan untuk perhatian tim.' : 'Messages saved for team attention.')
        }
        actions={(
          <>
            <span className="ams-inbox-record-count text-[11px] tabular-nums text-muted">{loading && submissions.length === 0 ? (language === 'id' ? 'Memuat…' : 'Loading…') : loadError && submissions.length === 0 ? (language === 'id' ? 'Data tidak tersedia' : 'Unavailable') : activeTabItems.length + ' records'}</span>
            {canManageCrm && <Link to="/admin/cms/careers?tab=applicants" className="ams-action inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent">{language === 'id' ? 'Pelamar Careers' : 'Careers Applicants'}</Link>}
            <button type="button" onClick={() => setIsEmailModalOpen(true)} className="ams-action inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-accent" title={language === 'id' ? 'Buka pengaturan notifikasi email' : 'Open email alert settings'}><Mail size={14} /><span>{language === 'id' ? 'Notifikasi Email' : 'Email Alerts'}</span></button>
          </>
        )}
      />

      <div className="ams-inbox-view-navigation" data-ams-feature-slug="inbox-navigation">
        <div className="ams-inbox-category-navigation">
          <AdminSectionTabs
            ariaLabel="Message categories"
            activeKey={activeInboxTab === 'client' ? 'sales-inquiries' : 'all-messages'}
            className="ams-inbox-category-tabs"
            items={[
              { key: 'all-messages', label: 'All Messages', to: '/admin/inbox?view=messages' },
              { key: 'sales-inquiries', label: 'Sales Inquiries', to: '/admin/inbox?view=client' },
              { key: 'client-requests', label: 'Client Requests', to: '/admin/inbox', available: false },
              { key: 'project-support', label: 'Project & Support', to: '/admin/inbox', available: false },
            ]}
          />
        </div>
        <div className="ams-inbox-saved-views">
          <span className="ams-inbox-saved-views__label">{language === 'id' ? 'Tampilan tersimpan' : 'Saved views'}</span>
          <AdminSectionTabs
            ariaLabel="Message saved views"
            activeKey={activeInboxTab === 'unread' || activeInboxTab === 'starred' ? activeInboxTab : ''}
            className="ams-inbox-saved-tabs"
            variant="secondary"
            items={[
              { key: 'unread', label: 'Unread', to: '/admin/inbox?view=unread' },
              { key: 'starred', label: 'Starred', to: '/admin/inbox?view=starred' },
              { key: 'resolved', label: 'Resolved', to: '/admin/inbox?view=resolved', available: false },
              { key: 'archived', label: 'Archived', to: '/admin/inbox?view=archived', available: false },
            ]}
          />
        </div>
      </div>
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
        <div role="status" aria-live="polite" className={`p-3 sm:p-4 rounded-card text-xs font-sans flex items-start sm:items-center justify-between gap-2 animate-in fade-in duration-300 ${toastMessage.tone === 'danger' ? 'bg-danger/10 border border-danger/30 text-danger' : 'bg-success/10 border border-success/30 text-success'}`}>
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

      <AdminFilterBar
        slug={activeInboxTab === 'starred' ? 'inbox-starred-controls' : activeInboxTab === 'client' ? 'inbox-client-controls' : 'inbox-message-controls'}
        className="ams-inbox-filter-bar"
        searchClassName="ams-inbox-search-field"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={activeInboxTab === 'client' ? 'Search company, contact, service, budget, or brief…' : activeInboxTab === 'starred' ? 'Search saved messages, contact, or company…' : 'Search messages, sender, company, or brief…'}
        searchLabel={activeInboxTab === 'client' ? 'Search sales inquiries' : activeInboxTab === 'starred' ? 'Search saved messages' : 'Search inbound messages'}
        actions={(
          <div className="ams-inbox-toolbar-actions" data-ams-feature-slug="inbox-message-actions">
            <button type="button" onClick={() => void refreshInbox()} disabled={loading} aria-busy={loading || undefined} className="ams-inbox-toolbar-action inline-flex h-9 min-h-9 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-muted transition-colors hover:bg-panel hover:text-fg disabled:cursor-wait disabled:opacity-60">
              <RefreshCw size={13} aria-hidden="true" />{loading ? (language === 'id' ? 'Memuat…' : 'Refreshing') : (language === 'id' ? 'Refresh' : 'Refresh')}
            </button>
            {metrics.newCount > 0 ? (
              <button type="button" onClick={handleMarkAllRead} disabled={!canManageCrm || isUpdating || confirmActionLoading} className="ams-inbox-toolbar-action inline-flex h-9 min-h-9 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-muted transition-colors hover:bg-panel hover:text-fg disabled:cursor-not-allowed disabled:opacity-40">
                <Check size={13} aria-hidden="true" />
                <span>{isMixedInboxTab ? (language === 'id' ? 'Proses Baru' : 'Process New') : (language === 'id' ? 'Tandai ditinjau' : 'Mark in review')}</span>
              </button>
            ) : null}
            <button type="button" onClick={handleExportCSV} title={language === 'id' ? 'Ekspor seluruh record dalam kategori ini; pencarian dan filter tidak diterapkan.' : 'Export all records in this category; search and filters are not applied.'} disabled={activeTabItems.length === 0} className="ams-inbox-toolbar-action inline-flex h-9 min-h-9 items-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-muted transition-colors hover:bg-panel hover:text-fg disabled:cursor-not-allowed disabled:opacity-40">
              <Download size={13} aria-hidden="true" />Export CSV
            </button>
            <div role="group" aria-label="Message register view" className="ams-inbox-view-switch inline-flex h-9 min-h-9 items-center rounded-control border border-line bg-bg p-0.5">
                  <button type="button" aria-pressed={viewMode === 'split'} onClick={() => setViewMode('split')} className={'inline-flex h-8 min-h-8 items-center gap-1.5 rounded-chip border px-3 text-xs font-medium transition-colors ' + (viewMode === 'split' ? 'border-line bg-panel text-fg' : 'border-transparent text-muted hover:bg-panel hover:text-fg')}><LayoutGrid size={13} aria-hidden="true" />Review</button>
                  <button type="button" aria-pressed={viewMode === 'table'} onClick={() => setViewMode('table')} className={'inline-flex h-8 min-h-8 items-center gap-1.5 rounded-chip border px-3 text-xs font-medium transition-colors ' + (viewMode === 'table' ? 'border-line bg-panel text-fg' : 'border-transparent text-muted hover:bg-panel hover:text-fg')}><TableIcon size={13} aria-hidden="true" />Table</button>
            </div>
            <button type="button" onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterPriority('all'); setFilterOwner('all'); setFilterChannel('all'); setPage(1); }} disabled={!searchQuery && filterStatus === 'all' && filterPriority === 'all' && filterOwner === 'all' && filterChannel === 'all'} className="ams-inbox-toolbar-action inline-flex h-9 min-h-9 items-center gap-1.5 rounded-control border border-transparent bg-transparent px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg disabled:cursor-not-allowed disabled:opacity-40">
              <X size={12} aria-hidden="true" />Reset
            </button>
          </div>
        )}
        footer={(
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-muted">{loading && submissions.length === 0 ? (language === 'id' ? 'Memuat pesan…' : 'Loading messages…') : loadError && submissions.length === 0 ? (language === 'id' ? 'Jumlah record belum tersedia.' : 'Inbound record count unavailable.') : filteredItems.length + ' matching ' + (filteredItems.length === 1 ? 'record' : 'records') + ' · Updated automatically every 30 seconds.'}</p>
            <span className={'inline-flex min-h-7 items-center gap-1.5 rounded-badge border px-2 text-[10px] font-medium ' + (loading ? 'border-info/20 bg-info/10 text-info' : loadError ? 'border-warning/20 bg-warning/10 text-warning' : 'border-success/20 bg-success/10 text-success')} role="status" aria-live="polite">
              <span className={'h-1.5 w-1.5 rounded-full ' + (loading ? 'bg-info' : loadError ? 'bg-warning' : 'bg-success')} aria-hidden="true" />
              {loading ? (submissions.length > 0 ? (language === 'id' ? 'Memperbarui' : 'Refreshing') : (language === 'id' ? 'Memuat' : 'Loading')) : loadError ? (submissions.length > 0 ? (language === 'id' ? 'Data lama' : 'Stale') : (language === 'id' ? 'Tidak tersedia' : 'Unavailable')) : 'Live'}
            </span>
          </div>
        )}
      >
        {activeInboxTab === 'messages' || activeInboxTab === 'starred' || activeInboxTab === 'client' ? (
          <div className="ams-inbox-filter-selects" data-ams-feature-slug="inbox-message-filter-selects">
            {activeInboxTab === 'messages' ? (
              <>
                <div className="ams-inbox-filter-control"><CustomSelect value={filterStatus} onChange={setFilterStatus} options={inboxStatusOptions} aria-label="Filter messages by status" slug="inbox-message-status-filter" /></div>
                <div className="ams-inbox-filter-control"><CustomSelect value={filterPriority} onChange={setFilterPriority} options={[{value:'all',label:'All priorities'},{value:'urgent',label:'Urgent'},{value:'high',label:'High'},{value:'normal',label:'Normal'},{value:'low',label:'Low'}]} aria-label="Filter messages by priority" slug="inbox-message-priority-filter" /></div>
                <div className="ams-inbox-filter-control"><CustomSelect value={filterOwner} onChange={setFilterOwner} options={inboxOwnerOptions} aria-label="Filter messages by owner" slug="inbox-message-owner-filter" /></div>
                <div className="ams-inbox-filter-control"><CustomSelect value={filterChannel} onChange={setFilterChannel} options={inboxChannelOptions} aria-label="Filter messages by channel" slug="inbox-message-channel-filter" /></div>
              </>
            ) : activeInboxTab === 'client' ? (
              <>
                <div className="ams-inbox-filter-control"><CustomSelect value={filterStatus} onChange={setFilterStatus} options={inboxStatusOptions} aria-label="Filter sales inquiries by status" /></div>
                <div className="ams-inbox-filter-control"><CustomSelect value={filterPriority} onChange={setFilterPriority} options={[{value:'all',label:'All priorities'},{value:'urgent',label:'Urgent'},{value:'high',label:'High'},{value:'normal',label:'Normal'},{value:'low',label:'Low'}]} aria-label="Filter sales inquiries by priority" /></div>
              </>
            ) : (
              <div className="ams-inbox-filter-control"><CustomSelect value={filterPriority} onChange={setFilterPriority} options={[{value:'all',label:'All priorities'},{value:'urgent',label:'Urgent'},{value:'high',label:'High'},{value:'normal',label:'Normal'},{value:'low',label:'Low'}]} aria-label="Filter saved messages by priority" /></div>
            )}
          </div>
        ) : null}
      </AdminFilterBar>
      {/* 4. MAIN CONTENT VIEW: SPLIT VIEW vs TABLE VIEW */}
      {/* ------------------------------------------------------------- */}
      <MessageWorkspace
          items={inboxListItems}
          selected={selectedSubmission}
          loading={loading}
          unavailable={Boolean(loadError) && submissions.length === 0}
          sourceEmpty={submissions.length === 0}
          language={language}
          whatsAppHref={selectedSubmission?.phone ? `https://wa.me/${cleanPhoneForWhatsApp(selectedSubmission.phone)}` : undefined}
          table={viewMode === 'table'}
          commercial={activeInboxTab === 'client'}
          page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize}
          onSelect={handleSelectSubmission}
          onBack={() => setSelectedSubmission(null)}
          onReset={() => { setSearchQuery(''); setFilterStatus('all'); setFilterPriority('all'); setFilterOwner('all'); setFilterChannel('all'); setPage(1); }}
          onRetry={() => void refreshInbox()}
          onStar={handleToggleStar}
          canManage={canManageCrm}
          canConvert={canManageClients}
          converting={Boolean(convertingSubmissionId)}
          onConvert={() => selectedSubmission && void handleConvertToClient(selectedSubmission)}
          onDelete={() => selectedSubmission && void handleDelete(selectedSubmission.id)}
          onTemplates={() => setIsCannedModalOpen(true)}
          note={internalNoteDraft} onNote={setInternalNoteDraft}
          savingNote={isSavingNote} onSaveNote={handleSaveInternalNote}
          statusControl={selectedSubmission && <CustomSelect aria-label="Message status" disabled={isUpdating || !canManageCrm} value={selectedSubmission.status} onChange={(value) => handleStatusChange(selectedSubmission.id, value as ContactSubmission['status'])} options={inboxStatusOptions.filter((option) => option.value !== 'all')} />}
          priorityControl={selectedSubmission && <CustomSelect aria-label="Message priority" disabled={!canManageCrm} value={selectedSubmission.priority || 'normal'} onChange={(value) => handlePriorityChange(selectedSubmission.id, value as ContactSubmission['priority'])} options={[{ value: 'urgent', label: 'Urgent' }, { value: 'high', label: 'High' }, { value: 'normal', label: 'Normal' }, { value: 'low', label: 'Low' }]} />}
          ownerControl={selectedSubmission && <CustomSelect aria-label="Message owner" disabled={!canManageCrm} value={selectedSubmission.assignedTo || ''} onChange={(value) => handleAssigneeChange(selectedSubmission.id, value)} options={[{ value: '', label: 'Unassigned' }, ...inboxOwnerOptions.filter((option) => !['all', '__no_owner__'].includes(option.value)), ...['Lead Full-Stack Tech', 'Senior UI/UX Designer', 'Technical Project Manager', 'Business Director'].filter((owner) => !inboxOwnerOptions.some((option) => option.value === owner)).map((owner) => ({ value: owner, label: owner }))]} />}
        />
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
