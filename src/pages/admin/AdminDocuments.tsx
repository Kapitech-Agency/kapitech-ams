import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useReportingPeriod } from '../../lib/ReportingPeriodContext';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  Eye,
  FileCode2,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { hasAdminPermission } from '../../lib/adminAuth';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';
import { Drawer } from '../../components/ui/Drawer';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';
import {
  AdminFilterBar,
  AdminModuleHeader,
  AdminPageShell,
  AdminPanel,
  AdminStatusBadge,
  AdminTablePagination,
} from '../../components/admin/AdminModulePrimitives';
import { Skeleton } from '../../components/ui/Skeleton';

interface DocumentItem {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  department?: string;
  type?: string;
  fileType?: string;
  size?: string | number;
  fileSize?: number;
  sizeBytes?: number;
  url?: string;
  downloadUrl?: string;
  mimeType?: string;
  status?: 'pending_upload' | 'ready' | 'external_link';
  sourceType?: 'private_file' | 'external_link';
  owner?: string;
  uploadedBy?: string;
  uploadedDate?: string;
  uploadedAt?: string;
  updatedAt?: string;
  relatedEntity?: string;
  relatedId?: string;
  accessLevel?: string;
  tags?: string[];
}

type SortKey = 'name' | 'category' | 'size' | 'updated' | 'status';
type TabKey = 'all' | 'sops' | 'legal' | 'finance' | 'hr' | 'infra';

const DOCUMENT_TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'All Documents' },
  { key: 'sops', label: 'SOP & Guides' },
  { key: 'legal', label: 'Legal & Corporate' },
  { key: 'finance', label: 'Finance & Tax' },
  { key: 'hr', label: 'HR & People' },
  { key: 'infra', label: 'Security & Keys' },
];


const PAGE_SIZES = [10, 25, 50];
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPTED_TYPES = '.pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip';

const titleOf = (doc: DocumentItem) => String(doc.name || doc.title || 'Untitled document');
const ownerOf = (doc: DocumentItem) => String(doc.owner || doc.uploadedBy || 'Kapitech System');
const categoryOf = (doc: DocumentItem) => String(doc.category || 'General');
const readyOf = (doc: DocumentItem) => doc.status === 'ready' || doc.sourceType === 'external_link';
const searchTextOf = (doc: DocumentItem) => [
  titleOf(doc), doc.description, doc.category, doc.department, doc.relatedEntity,
  doc.accessLevel, doc.type, doc.fileType, ...(doc.tags || [])
].filter(Boolean).join(' ').toLowerCase();

const sizeBytesOf = (doc: DocumentItem) => {
  if (typeof doc.fileSize === 'number') return doc.fileSize;
  if (typeof doc.sizeBytes === 'number') return doc.sizeBytes;
  const raw = String(doc.size || '').trim().replace(',', '.');
  const match = raw.match(/^([0-9.]+)\s*(B|KB|MB|GB)?$/i);
  if (!match) return 0;
  const n = Number(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  return n * ({ B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 }[unit] || 1);
};

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + ' GB';
  if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(1) + ' MB';
  if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB';
  return Math.round(bytes) + ' B';
};

const dateOf = (doc: DocumentItem) => {
  const raw = doc.updatedAt || doc.uploadedAt || doc.uploadedDate;
  if (!raw) return 'Not recorded';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? String(raw) : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const typeOf = (doc: DocumentItem) => {
  const direct = String(doc.type || doc.fileType || '').trim();
  if (direct) return direct.toUpperCase();
  const ext = titleOf(doc).split('.').pop();
  return ext ? ext.toUpperCase() : 'FILE';
};


const matchesTab = (doc: DocumentItem, tab: TabKey) => {
  if (tab === 'all') return true;
  const text = searchTextOf(doc);
  if (tab === 'sops') return /sop|policy|guide|handbook|procedure|manual/.test(text);
  if (tab === 'legal') return /legal|contract|charter|corporate|agreement|nda/.test(text);
  if (tab === 'finance') return /finance|financial|tax|invoice|audit|accounting/.test(text);
  if (tab === 'hr') return /\bhr\b|people|human|employee|culture|talent/.test(text);
  return /security|key|credential|infra|engineering|devops|access/.test(text);
};

const docIcon = (doc: DocumentItem) => {
  const type = typeOf(doc);
  if (type.includes('XLS') || type.includes('CSV')) return <FileSpreadsheet size={16} />;
  if (type.includes('ZIP')) return <FileCode2 size={16} />;
  if (/security|key|credential/i.test(searchTextOf(doc))) return <LockKeyhole size={16} />;
  return <FileText size={16} />;
};

const categoryTone = (doc: DocumentItem) => {
  const text = searchTextOf(doc);
  if (/security|key|credential|infra|engineering|devops/.test(text)) return 'border-warning/25 bg-warning/10 text-warning';
  if (/finance|financial|tax|invoice|accounting|audit/.test(text)) return 'border-success/25 bg-success/10 text-success';
  if (/legal|contract|charter|corporate|agreement|nda/.test(text)) return 'border-accent/25 bg-accent/10 text-accent-text';
  if (/sop|policy|guide|handbook|procedure|manual/.test(text)) return 'border-info/25 bg-info/10 text-info';
  return 'border-line bg-bg text-muted';
};

const statusTone = (doc: DocumentItem) => readyOf(doc)
  ? 'border-success/25 bg-success/10 text-success'
  : 'border-warning/25 bg-warning/10 text-warning';

const statusLabel = (doc: DocumentItem) => readyOf(doc) ? 'Ready' : 'Pending';

export const AdminDocuments: React.FC = () => {
  const { matchesDate, value: reportPeriodValue, enabled: reportPeriodEnabled } = useReportingPeriod();
  const [searchParams, setSearchParams] = useSearchParams();
  const canManageDocuments =
    hasAdminPermission('canManageProjects') ||
    hasAdminPermission('canManageCrm') ||
    hasAdminPermission('canAccessServerAndApi');

  const requestedTab = (searchParams.get('documents') || 'all') as TabKey;
  const activeTab = DOCUMENT_TABS.some((tab) => tab.key === requestedTab) ? requestedTab : 'all';

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notice, setNotice] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Contract');
  const [uploadRelatedType, setUploadRelatedType] = useState('General');
  const [uploadRelatedId, setUploadRelatedId] = useState('');
  const [relatedClients, setRelatedClients] = useState<Array<{ id: string; name: string }>>([]);
  const [relatedProjects, setRelatedProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [relatedClientsError, setRelatedClientsError] = useState<string | null>(null);
  const [relatedProjectsError, setRelatedProjectsError] = useState<string | null>(null);
  const [relatedClientsLoading, setRelatedClientsLoading] = useState(false);
  const [relatedProjectsLoading, setRelatedProjectsLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [uploadDragActive, setUploadDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3500);
  };

  const loadDocuments = async () => {
    setIsLoading(true);
    setLoadError(null);

    const requestDocuments = async () => {
      const response = await api.documents.getAll();
      if (!response.success) {
        throw {
          status: response.status,
          message: response.error || 'The document service could not be reached.'
        };
      }

      const payload = response.data as { documents?: unknown } | undefined;
      return Array.isArray(payload?.documents) ? payload.documents as DocumentItem[] : [];
    };

    try {
      const loaded = await requestDocuments();
      setDocuments(loaded);
    } catch (firstError: any) {
      let hadAccessFailure = firstError?.status === 401 || firstError?.status === 403;
      // Retry transient server/auth races once before showing the module error state.
      // A 401 can occur briefly while the authenticated session cookie is being
      // restored after navigation or a fresh login.
      if (firstError?.status === 401 || firstError?.status === 502 || firstError?.status === 503) {
        await new Promise((resolve) => window.setTimeout(resolve, 800));
        try {
          const loaded = await requestDocuments();
          setDocuments(loaded);
          return;
        } catch (retryError: any) {
          hadAccessFailure = hadAccessFailure || retryError?.status === 401 || retryError?.status === 403;
          firstError = retryError;
        }
      }

      // Retain last-known-good rows for transient service failures, but never keep displaying
      // private records after the session or authorization check has failed.
      if (hadAccessFailure) {
        setDocuments([]);
        setSelectedDocument(null);
        setDeleteTarget(null);
      }

      if (firstError?.status === 401) {
        setLoadError('Your AMS session has expired. Please sign in again and retry.');
      } else if (firstError?.status === 403) {
        setLoadError('You do not have permission to access the document vault.');
      } else if (firstError?.message) {
        setLoadError(firstError.message);
      } else {
        setLoadError('Documents could not be loaded. Please retry.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  useEffect(() => {
    let mounted = true;
    setRelatedClientsLoading(true);
    setRelatedProjectsLoading(true);
    void Promise.all([api.clients.getAll(), api.projects.getAll()]).then(([clientRes, projectRes]) => {
      if (!mounted) return;
      if (clientRes.success && Array.isArray(clientRes.data?.clients)) {
        setRelatedClients((clientRes.data.clients as Array<Record<string, unknown>>).map((client) => ({
          id: String(client.id || ''),
          name: String(client.company || client.companyName || client.name || client.clientName || client.id || 'Unnamed client'),
        })).filter((client) => client.id));
        setRelatedClientsError(null);
      } else {
        setRelatedClients([]);
        setRelatedClientsError(clientRes.error || 'Client records are unavailable for linking.');
      }
      if (projectRes.success && Array.isArray(projectRes.data?.projects)) {
        setRelatedProjects((projectRes.data.projects as Array<Record<string, unknown>>).map((project) => ({
          id: String(project.id || ''),
          name: String(project.name || project.title || project.id || 'Unnamed project'),
        })).filter((project) => project.id));
        setRelatedProjectsError(null);
      } else {
        setRelatedProjects([]);
        setRelatedProjectsError(projectRes.error || 'Project records are unavailable for linking.');
      }
    }).catch((error) => {
      if (!mounted) return;
      const message = error instanceof Error ? error.message : 'Related records could not be loaded.';
      setRelatedClients([]);
      setRelatedProjects([]);
      setRelatedClientsError(message);
      setRelatedProjectsError(message);
    }).finally(() => {
      if (mounted) {
        setRelatedClientsLoading(false);
        setRelatedProjectsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, pageSize, reportPeriodValue, reportPeriodEnabled]);

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const items = documents.filter((doc) =>
      matchesTab(doc, activeTab) &&
      matchesDate(doc.updatedAt || doc.uploadedAt || doc.uploadedDate || (doc as any).createdAt) &&
      (!q || searchTextOf(doc).includes(q))
    );

    return items.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'name') comparison = titleOf(a).localeCompare(titleOf(b));
      if (sortKey === 'category') comparison = categoryOf(a).localeCompare(categoryOf(b));
      if (sortKey === 'size') comparison = sizeBytesOf(a) - sizeBytesOf(b);
      if (sortKey === 'status') comparison = statusLabel(a).localeCompare(statusLabel(b));
      if (sortKey === 'updated') {
        comparison = new Date(a.updatedAt || a.uploadedAt || a.uploadedDate || 0).getTime()
          - new Date(b.updatedAt || b.uploadedAt || b.uploadedDate || 0).getTime();
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [documents, activeTab, searchQuery, sortKey, sortDirection, matchesDate]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedDocuments = filteredDocuments.slice((safePage - 1) * pageSize, safePage * pageSize);

  const resetFilters = () => {
    setSearchQuery('');
    setPage(1);
  };

  const changeSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setSortDirection(key === 'size' || key === 'updated' ? 'desc' : 'asc');
  };

  const handleDownload = (doc: DocumentItem) => {
    const url = doc.downloadUrl || doc.url;
    if (!url) {
      notify('This document has no downloadable file yet.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const validateFile = (file: File | null) => {
    if (!file) return 'Select a document file first.';
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return 'File size must be between 1 byte and 25 MB.';
    return null;
  };

  const pickFile = (file: File | null) => {
    setUploadFile(file);
    const error = validateFile(file);
    if (error) notify(error);
  };

  const cleanupIncompleteDocument = async (id: string): Promise<{ confirmed: boolean; error?: string }> => {
    try {
      const response = await api.documents.delete(id);
      return response.success
        ? { confirmed: true }
        : { confirmed: false, error: response.error || 'The temporary document record could not be removed.' };
    } catch (error) {
      return {
        confirmed: false,
        error: error instanceof Error ? error.message : 'The temporary document record could not be removed.'
      };
    }
  };

  const relatedRecords = uploadRelatedType === 'Client' ? relatedClients : uploadRelatedType === 'Project' ? relatedProjects : [];
  const relatedRecordLoading = uploadRelatedType === 'Client' ? relatedClientsLoading : uploadRelatedType === 'Project' ? relatedProjectsLoading : false;
  const relatedRecordError = uploadRelatedType === 'Client' ? relatedClientsError : uploadRelatedType === 'Project' ? relatedProjectsError : null;
  const relatedHref = (doc: DocumentItem) => doc.relatedId && doc.relatedEntity === 'Client'
    ? '/admin/clients?client=' + encodeURIComponent(doc.relatedId)
    : doc.relatedId && doc.relatedEntity === 'Project'
      ? '/admin/projects?project=' + encodeURIComponent(doc.relatedId)
      : null;
  const relatedLabel = (doc: DocumentItem) => {
    if (!doc.relatedId || !['Client', 'Project'].includes(String(doc.relatedEntity || ''))) return doc.relatedEntity || doc.department || 'Internal';
    const records = doc.relatedEntity === 'Client' ? relatedClients : relatedProjects;
    const linked = records.find((record) => record.id === doc.relatedId);
    return linked ? linked.name : `${doc.relatedEntity} record · ${doc.relatedId}`;
  };

  const saveUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageDocuments) return;
    if (uploading) return;
    if (!uploadTitle.trim()) {
      notify('Enter a document title.');
      return;
    }
    if (uploadRelatedType !== 'General' && (!uploadRelatedId || !relatedRecords.some((record) => record.id === uploadRelatedId))) {
      notify(relatedRecordError || 'Select an existing client or project record before uploading.');
      return;
    }
    const fileError = validateFile(uploadFile);
    if (fileError || !uploadFile) {
      if (fileError) notify(fileError);
      return;
    }

    setUploading(true);
    let createdId = '';
    let createAttempted = false;
    let uploadAttempted = false;
    try {
      createAttempted = true;
      const created = await api.documents.create({
        name: uploadTitle.trim(),
        title: uploadTitle.trim(),
        category: uploadCategory,
        type: (uploadFile.name.split('.').pop() || 'FILE').toUpperCase().slice(0, 40),
        mimeType: uploadFile.type || 'application/octet-stream',
        size: formatBytes(uploadFile.size),
        sizeBytes: uploadFile.size,
        relatedEntity: uploadRelatedType,
        relatedId: uploadRelatedType === 'General' ? '' : uploadRelatedId,
      });

      if (!created.success || !created.data?.document) {
        const createOutcomeUnknown = created.status === undefined || created.status >= 500;
        if (createOutcomeUnknown) {
          await loadDocuments();
          notify((created.error || 'The document record could not be confirmed.')
            + ' The record may already exist. Inspect the refreshed vault before retrying the upload.');
        } else {
          notify(created.error || 'Document could not be created.');
        }
        return;
      }

      createdId = String(created.data.document.id);
      uploadAttempted = true;
      const uploaded = await api.documents.uploadContent(createdId, uploadFile);
      if (!uploaded.success || !uploaded.data?.document) {
        // No HTTP response (timeout/network interruption) or a server error can mean
        // the storage write completed but its response did not reach this client.
        // Do not delete a possibly completed document: DELETE also removes its object.
        const uploadOutcomeUnknown = uploaded.status === undefined || uploaded.status >= 500;
        if (uploadOutcomeUnknown) {
          await loadDocuments();
          notify((uploaded.error || 'The upload result could not be confirmed.')
            + ' The file may already be stored. Inspect the refreshed vault before retrying; do not upload it again until its status is clear.');
          return;
        }

        const cleanup = await cleanupIncompleteDocument(createdId);
        if (!cleanup.confirmed) {
          await loadDocuments();
          notify((uploaded.error || 'The file could not be stored in the vault.') + ' Temporary record cleanup could not be confirmed. The vault was refreshed; inspect the document list before retrying.');
        } else {
          notify(uploaded.error || 'The file could not be stored in the vault.');
        }
        return;
      }

      setDocuments((current) => [uploaded.data.document, ...current]);
      setUploadOpen(false);
      setUploadTitle('');
      setUploadCategory('Contract');
      setUploadRelatedType('General');
      setUploadRelatedId('');
      setUploadFile(null);
      setInputKey((current) => current + 1);
      notify('Document stored in the private vault.');
    } catch {
      if (uploadAttempted && createdId) {
        // The request may have reached storage even when its response was lost.
        // Never delete a possibly completed upload from an ambiguous transport failure.
        await loadDocuments();
        notify('The upload result could not be confirmed. The file may already be stored. Inspect the refreshed vault before retrying; do not upload it again until its status is clear.');
      } else if (createAttempted && !createdId) {
        // A timed-out create may have persisted a pending record without returning its ID.
        // Refresh the vault and do not issue an automatic duplicate create.
        await loadDocuments();
        notify('The document record creation result could not be confirmed. Inspect the refreshed vault before retrying; the record may already exist.');
      } else {
        const cleanup = createdId
          ? await cleanupIncompleteDocument(createdId)
          : { confirmed: true };
        if (!cleanup.confirmed) {
          await loadDocuments();
          notify('The document upload failed, and temporary record cleanup could not be confirmed. The vault was refreshed; inspect the document list before retrying.');
        } else {
          notify('The document upload failed. Check the file and try again.');
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !canManageDocuments) return;
    setDeleteLoading(true);
    try {
      const response = await api.documents.delete(deleteTarget.id);
      if (!response.success) {
        notify(response.error || 'Document could not be deleted.');
        return;
      }
      setDocuments((current) => current.filter((doc) => doc.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSelectedDocument(null);
      notify('Document deleted.');
    } catch {
      notify('Document could not be deleted. Check your session and try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeFilterCount = [searchQuery].filter(Boolean).length;
  const tabLabel = DOCUMENT_TABS.find((tab) => tab.key === activeTab)?.label || 'All Internal Documents';

  return (
    <AdminPageShell featureSlug="documents-module" className="documents-module">
      {notice && (
        <div
          className="fixed left-3 right-3 top-16 z-50 flex items-center gap-2 rounded-card border border-line bg-panel px-4 py-2.5 text-xs text-fg sm:left-auto sm:right-6 sm:top-20"
          role="status"
          aria-live="polite"
          data-ams-slug="documents-notice"
        >
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      <div data-ams-slug="documents-header">
        <AdminModuleHeader
          className="mb-0"
          title={activeTab === 'all' ? 'Internal Document Vault' : tabLabel}
          description={activeTab === 'all'
            ? 'Secure internal repository for SOPs, legal records, finance documents, and technical assets.'
            : activeTab === 'sops'
              ? 'Operating procedures, process guides, and internal reference documents.'
              : activeTab === 'legal'
                ? 'Corporate records, signed agreements, and legal documentation.'
                : activeTab === 'finance'
                  ? 'Finance, invoice, accounting, and tax documents.'
                  : activeTab === 'hr'
                    ? 'HR policies, personnel records, and people-operations documents.'
                    : 'Security, infrastructure, and access-control documentation.'}
          eyebrow={(
            <AdminStatusBadge tone="info" icon={<LockKeyhole size={12} />}>
              Private vault
            </AdminStatusBadge>
          )}
          actions={(
            <>
              {canManageDocuments && (
                <Button
                  type="button"
                  variant="primary"
                  icon={<Plus size={14} />}
                  onClick={() => setUploadOpen(true)}
                  data-ams-slug="documents-upload-header"
                >
                  Upload document
                </Button>
              )}
            </>
          )}
        />
      </div>




      <div data-ams-feature-slug="documents-workspace" className="space-y-4">
        <AdminFilterBar
          slug="documents-filters"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search documents, entities, tags..."
          searchLabel="Search documents"
          actions={activeFilterCount ? (
            <Button type="button" variant="secondary" icon={<RefreshCw size={13} />} onClick={resetFilters} data-ams-slug="documents-filter-reset">
              Reset filters
            </Button>
          ) : undefined}
        >
          <div className="w-full shrink-0 sm:w-[180px]">
            <CustomSelect
              value={sortKey + ':' + sortDirection}
              onChange={(value) => {
                const [nextKey, nextDirection] = String(value).split(':') as [SortKey, 'asc' | 'desc'];
                setSortKey(nextKey);
                setSortDirection(nextDirection);
              }}
              size="sm"
              aria-label="Sort documents"
              options={[
                { value: 'updated:desc', label: 'Recently updated' },
                { value: 'updated:asc', label: 'Oldest updated' },
                { value: 'name:asc', label: 'Name A–Z' },
                { value: 'name:desc', label: 'Name Z–A' },
                { value: 'size:desc', label: 'Largest files' },
                { value: 'size:asc', label: 'Smallest files' },
                { value: 'category:asc', label: 'Category A–Z' },
                { value: 'status:asc', label: 'Status' },
              ]}
            />
          </div>
        </AdminFilterBar>

        {isLoading && documents.length > 0 && (
          <div className="flex items-center gap-2 rounded-control border border-line bg-bg px-3 py-2 text-xs text-muted" role="status" data-ams-slug="documents-refreshing">
            <RefreshCw size={13} className="animate-spin" />
            <span>Refreshing document list. Previously loaded records remain visible.</span>
          </div>
        )}

        {loadError && documents.length > 0 && (
          <div className="flex flex-col gap-2 rounded-control border border-danger/20 bg-danger/5 px-3 py-3 text-xs text-danger sm:flex-row sm:items-center sm:justify-between" role="alert" data-ams-slug="documents-error">
            <span>{loadError} Showing the last successfully loaded document list.</span>
            <Button type="button" variant="secondary" onClick={() => void loadDocuments()} data-ams-slug="documents-error-retry">Retry</Button>
          </div>
        )}

        <section aria-label="Documents directory" data-ams-slug="documents-directory" className="ams-data-table-shell overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-fg">{tabLabel}</h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                {filteredDocuments.length} visible file{filteredDocuments.length === 1 ? '' : 's'} · private internal vault
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-badge border border-info/20 bg-info/5 px-2 py-1 text-[10px] font-medium text-info">
                <LockKeyhole size={11} className="mr-1 inline-block" />
                Access controlled
              </span>
            </div>
          </div>

          {isLoading && documents.length === 0 ? (
            <div className="space-y-2 p-4 sm:p-5" role="status" aria-label="Loading documents" data-ams-slug="documents-loading">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="grid grid-cols-[minmax(220px,1fr)_130px_90px_140px_120px] gap-3 border-b border-line px-2 py-3 last:border-b-0">
                  <div className="flex items-center gap-3"><Skeleton className="h-8 w-8 shrink-0" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-3.5 w-48 max-w-full" /><Skeleton className="h-3 w-28" /></div></div>
                  <Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-14" /><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : loadError && documents.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-5 py-12 text-center" role="alert" data-ams-slug="documents-unavailable">
              <div className="flex h-10 w-10 items-center justify-center rounded-control border border-danger/20 bg-danger/5 text-danger"><FileText size={17} /></div>
              <h3 className="mt-3 text-sm font-semibold text-fg">Documents unavailable</h3>
              <p className="mt-1 max-w-md text-xs leading-5 text-muted">{loadError}</p>
              <Button type="button" variant="secondary" onClick={() => void loadDocuments()} className="mt-4" data-ams-slug="documents-unavailable-retry">Retry</Button>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-5 py-12 text-center" data-ams-slug="documents-empty">
              <div className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-bg text-muted"><FileText size={17} /></div>
              <h3 className="mt-3 text-sm font-semibold text-fg">{documents.length ? 'No documents match the current filters' : 'No documents in the vault yet'}</h3>
              <p className="mt-1 max-w-md text-xs leading-5 text-muted">{documents.length ? 'Change the search or filters to widen the current document list.' : 'Upload the first internal document to populate this vault.'}</p>
              {documents.length && activeFilterCount ? (
                <Button type="button" variant="secondary" onClick={resetFilters} className="mt-4" data-ams-slug="documents-empty-reset">Reset filters</Button>
              ) : canManageDocuments ? (
                <Button type="button" variant="primary" icon={<Plus size={14} />} onClick={() => setUploadOpen(true)} className="mt-4" data-ams-slug="documents-empty-upload">Upload document</Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="min-[900px]:hidden divide-y divide-line" data-ams-feature-slug="documents-mobile-list">
                {pagedDocuments.map((doc) => {
                  const canDownload = Boolean(doc.downloadUrl || doc.url);
                  return (
                    <article key={doc.id} className="p-4" data-ams-slug={'document-' + doc.id}>
                      <div className="flex items-start gap-3">
                        <div className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-control border ' + categoryTone(doc)}>{docIcon(doc)}</div>
                        <button type="button" onClick={() => setSelectedDocument(doc)} className="min-w-0 flex-1 text-left" data-ams-slug={'document-' + doc.id + '-open'}>
                          <h3 className="truncate text-xs font-semibold text-fg">{titleOf(doc)}</h3>
                          <p className="mt-1 truncate text-[10px] text-muted">{typeOf(doc)} · {categoryOf(doc)}</p>
                        </button>
                        <span className={'shrink-0 rounded-badge border px-2 py-1 text-[10px] font-semibold ' + statusTone(doc)}>{statusLabel(doc)}</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-control border border-line bg-bg p-2.5"><div className="text-[10px] text-muted">Size</div><div className="mt-1 text-[11px] font-medium tabular-nums text-fg">{formatBytes(sizeBytesOf(doc))}</div></div>
                        <div className="rounded-control border border-line bg-bg p-2.5"><div className="text-[10px] text-muted">Updated</div><div className="mt-1 truncate text-[11px] font-medium text-fg">{dateOf(doc)}</div></div>
                      </div>
                      <div className="mt-3 flex min-w-0 items-center gap-2">
                        <ProfileIdentity profile={{ name: ownerOf(doc), contextLabel: 'Document owner' }} size="sm" showRole={false} />
                        {relatedHref(doc) ? <Link to={relatedHref(doc)!} className="truncate text-[10px] text-accent-text hover:underline">· {relatedLabel(doc)}</Link> : <span className="truncate text-[10px] text-muted">· {relatedLabel(doc)}</span>}
                      </div>
                      <div className="mt-3 flex justify-end gap-1.5">
                        <button type="button" title="Preview" aria-label={'Preview ' + titleOf(doc)} onClick={() => setSelectedDocument(doc)} data-ams-slug={'document-' + doc.id + '-preview'} className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-line bg-bg text-muted hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Eye size={14} /></button>
                        <button type="button" title="Download" aria-label={'Download ' + titleOf(doc)} onClick={() => handleDownload(doc)} disabled={!canDownload} data-ams-slug={'document-' + doc.id + '-download'} className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-line bg-bg text-muted hover:bg-panel-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"><Download size={14} /></button>
                        {canManageDocuments && <button type="button" title="Delete" aria-label={'Delete ' + titleOf(doc)} onClick={() => setDeleteTarget(doc)} data-ams-slug={'document-' + doc.id + '-delete'} className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-line bg-bg text-muted hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Trash2 size={14} /></button>}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden min-[900px]:block overflow-x-auto custom-scrollbar" data-ams-feature-slug="documents-table" tabIndex={0} role="region" aria-label="Scrollable private document register">
                <table className="ams-data-table min-w-[1050px] text-left">
                  <thead>
                    <tr>
                      {[
                        ['name', 'Document'],
                        ['category', 'Category'],
                        ['size', 'Size'],
                        ['updated', 'Last updated'],
                        ['status', 'Status'],
                      ].map(([key, label]) => (
                        <th key={key} data-ams-slug={'documents-column-' + key}>
                          <button type="button" onClick={() => changeSort(key as SortKey)} data-ams-slug={'documents-sort-' + key} className="inline-flex min-h-8 items-center gap-1 rounded-control px-1 text-left text-[11px] font-medium text-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                            {label}
                            {sortKey === key && <span aria-hidden="true">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                          </button>
                        </th>
                      ))}
                      <th className="w-32 text-right" data-ams-slug="documents-column-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedDocuments.map((doc) => {
                      const canDownload = Boolean(doc.downloadUrl || doc.url);
                      return (
                        <tr key={doc.id} data-ams-slug={'document-' + doc.id}>
                          <td>
                            <div className="flex min-w-0 items-center gap-3">
                              <div className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-control border ' + categoryTone(doc)}>{docIcon(doc)}</div>
                              <button type="button" onClick={() => setSelectedDocument(doc)} className="min-w-0 text-left" data-ams-slug={'document-' + doc.id + '-open'}>
                                <div className="max-w-[400px] truncate text-xs font-medium text-fg">{titleOf(doc)}</div>
                                <div className="mt-1 flex max-w-[440px] items-center gap-2 truncate text-[10px] text-muted"><span>{typeOf(doc)}</span><span>·</span><span>{relatedLabel(doc)}</span></div>
                              </button>
                            </div>
                          </td>
                          <td><span className={'inline-flex rounded-badge border px-2 py-0.5 text-[10px] font-medium ' + categoryTone(doc)}>{categoryOf(doc)}</span></td>
                          <td className="font-mono tabular-nums text-xs text-muted">{formatBytes(sizeBytesOf(doc))}</td>
                          <td><div className="text-xs tabular-nums text-fg">{dateOf(doc)}</div><div className="mt-1"><ProfileIdentity profile={{ name: ownerOf(doc), contextLabel: 'Document owner' }} size="sm" showRole={false} /></div></td>
                          <td><div className="flex flex-wrap items-center gap-1.5"><span className={'inline-flex items-center gap-1.5 rounded-badge border px-2 py-1 text-[10px] font-semibold ' + statusTone(doc)}><CheckCircle2 size={11} />{statusLabel(doc)}</span>{doc.accessLevel && <span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] text-muted">{doc.accessLevel}</span>}</div></td>
                          <td className="text-right">
                            <div className="ams-table-actions">
                              <button type="button" title="Preview" aria-label={'Preview ' + titleOf(doc)} onClick={() => setSelectedDocument(doc)} data-ams-slug={'document-' + doc.id + '-preview'} className="ams-table-action"><Eye size={14} /></button>
                              <button type="button" title="Download" aria-label={'Download ' + titleOf(doc)} onClick={() => handleDownload(doc)} disabled={!canDownload} data-ams-slug={'document-' + doc.id + '-download'} className="ams-table-action disabled:opacity-40"><Download size={14} /></button>
                              {canManageDocuments && <button type="button" title="Delete" aria-label={'Delete ' + titleOf(doc)} onClick={() => setDeleteTarget(doc)} data-ams-slug={'document-' + doc.id + '-delete'} className="ams-table-action hover:border-danger/30 hover:bg-danger/5 hover:text-danger"><Trash2 size={14} /></button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <AdminTablePagination total={filteredDocuments.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="visible files" slug="documents-pagination" />
            </>
          )}
        </section>

      <AdminPanel slug="documents-upload-dropzone" className="border-dashed" bodyClassName="p-4 sm:px-5">
        <div
          className={'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ' + (uploadDragActive ? 'rounded-card bg-accent/5 ring-1 ring-accent/30' : '')}
          onDragEnter={(event) => { event.preventDefault(); setUploadDragActive(true); }}
          onDragOver={(event) => { event.preventDefault(); setUploadDragActive(true); }}
          onDragLeave={() => setUploadDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setUploadDragActive(false);
            const file = event.dataTransfer.files?.[0] || null;
            pickFile(file);
            if (file && canManageDocuments && !validateFile(file)) setUploadOpen(true);
          }}
          data-ams-feature-slug="documents-dropzone"
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted">
              <UploadCloud size={19} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-fg">Upload new internal document</h2>
                <span className="rounded-badge border border-info/25 bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info">Private vault</span>
                <span className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] text-muted">Auto-indexed</span>
              </div>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">Drag and drop or browse locally. Supported PDF, DOCX, XLSX, ZIP, images, text and common office files. Maximum 25 MB.</p>
            </div>
          </div>
          <input
            key={inputKey}
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              pickFile(file);
              if (file && canManageDocuments && !validateFile(file)) setUploadOpen(true);
            }}
            data-ams-slug="documents-upload-input"
          />
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              icon={<UploadCloud size={14} />}
              onClick={() => fileInputRef.current?.click()}
              disabled={!canManageDocuments}
              data-ams-slug="documents-upload-browse"
            >
              Browse files
            </Button>
            {uploadFile && <span className="max-w-[220px] truncate text-[11px] text-muted" title={uploadFile.name}>Selected: {uploadFile.name}</span>}
          </div>
        </div>
      </AdminPanel>
      </div>

      <Drawer
        open={uploadOpen}
        onClose={() => !uploading && setUploadOpen(false)}
        size="lg"
        title="Upload document"
        description="Store an internal file through the current AMS document API."
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setUploadOpen(false)} disabled={uploading} data-ams-slug="documents-upload-cancel">Cancel</Button>
            <Button type="submit" form="documents-upload-form" variant="primary" loading={uploading} icon={<UploadCloud size={14} />} data-ams-slug="documents-upload-submit">Store document</Button>
          </>
        )}
      >
        <form id="documents-upload-form" onSubmit={saveUpload} className="space-y-4" data-ams-feature-slug="documents-upload-form" data-ams-slug="documents-upload-form">
          <div data-ams-slug="documents-upload-title">
            <label htmlFor="documents-upload-title" className="text-xs font-medium text-muted">Document title</label>
            <input id="documents-upload-title" value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} required placeholder="e.g. Master Services Agreement 2026" className="mt-1 h-10 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none placeholder:text-muted focus:border-accent" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div data-ams-slug="documents-upload-category"><label className="text-xs font-medium text-muted">Category</label><CustomSelect aria-label="Category" value={uploadCategory} onChange={setUploadCategory} options={['Contract','Proposal','Invoice','Deliverable','Compliance','SOP & Guides','Legal & Corporate','Finance & Tax','HR & People','Security & Keys'].map((value) => ({ value, label: value }))} triggerClassName="mt-1 h-9 min-h-9 w-full" /></div>
            <div data-ams-slug="documents-upload-related"><label className="text-xs font-medium text-muted">Related entity</label><CustomSelect aria-label="Related entity" value={uploadRelatedType} onChange={(value) => { setUploadRelatedType(value); setUploadRelatedId(''); }} options={['General','Client','Project'].map((value) => ({ value, label: value }))} triggerClassName="mt-1 w-full" /></div>
          </div>
          {uploadRelatedType !== 'General' && (
            <div data-ams-slug="documents-upload-related-record">
              <label className="text-xs font-medium text-muted">{uploadRelatedType} record *</label>
              <CustomSelect
                aria-label={uploadRelatedType + ' record'}
                value={uploadRelatedId}
                onChange={setUploadRelatedId}
                options={relatedRecords.map((record) => ({ value: record.id, label: record.name }))}
                placeholder={relatedRecordLoading ? 'Loading records…' : 'Select an existing ' + uploadRelatedType.toLowerCase()}
                disabled={relatedRecordLoading || Boolean(relatedRecordError) || relatedRecords.length === 0}
                triggerClassName="mt-1 h-9 min-h-9 w-full"
              />
              {relatedRecordLoading ? <p className="mt-1 text-[10px] text-muted">Loading persisted records.</p> : relatedRecordError ? <p className="mt-1 text-[10px] text-danger">{relatedRecordError}</p> : relatedRecords.length === 0 ? <p className="mt-1 text-[10px] text-muted">No accessible records are available to link.</p> : <p className="mt-1 text-[10px] text-muted">The relationship is stored against the selected record ID.</p>}
            </div>
          )}
          <div data-ams-slug="documents-upload-file">
            <label className="text-xs font-medium text-muted">Document file</label>
            <input id="documents-file-input" key={inputKey} type="file" accept={ACCEPTED_TYPES} onChange={(event) => pickFile(event.target.files?.[0] || null)} className="mt-1 block h-10 w-full rounded-control border border-line bg-bg px-2 py-2 text-xs text-fg" />
            <p className="mt-1 text-[10px] leading-4 text-muted">Maximum 25 MB. Access is handled by the current AMS session and role permissions.</p>
          </div>
          {uploadFile && <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-bg px-3 py-2.5"><div className="min-w-0"><div className="truncate text-xs font-medium text-fg">{uploadFile.name}</div><div className="mt-1 text-[10px] text-muted">{formatBytes(uploadFile.size)} · {uploadFile.type || 'unknown type'}</div></div><button type="button" onClick={() => { setUploadFile(null); setInputKey((current) => current + 1); }} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted hover:bg-danger/10 hover:text-danger" aria-label="Remove selected file"><X size={14} /></button></div>}
        </form>
      </Drawer>

      <Modal
        open={Boolean(selectedDocument)}
        onClose={() => setSelectedDocument(null)}
        size="lg"
        title={selectedDocument ? titleOf(selectedDocument) : 'Document details'}
        description={selectedDocument ? categoryOf(selectedDocument) : undefined}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setSelectedDocument(null)} data-ams-slug="documents-preview-close">Close</Button>
            {selectedDocument?.downloadUrl || selectedDocument?.url ? <Button type="button" variant="primary" icon={<Download size={14} />} onClick={() => selectedDocument && handleDownload(selectedDocument)} data-ams-slug="documents-preview-download">Download document</Button> : null}
          </>
        )}
      >
        {selectedDocument && (
          <div className="space-y-4" data-ams-feature-slug={'document-' + selectedDocument.id + '-details'} data-ams-slug={'document-' + selectedDocument.id + '-details'}>
            <div className="flex items-start gap-3 rounded-card border border-line bg-bg p-4">
              <div className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-control border ' + categoryTone(selectedDocument)}>{docIcon(selectedDocument)}</div>
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-fg">{titleOf(selectedDocument)}</div><div className="mt-1 text-xs text-muted">{typeOf(selectedDocument)} · {formatBytes(sizeBytesOf(selectedDocument))}</div></div>
              <span className={'rounded-badge border px-2 py-1 text-[10px] font-semibold ' + statusTone(selectedDocument)}>{statusLabel(selectedDocument)}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-control border border-line bg-bg p-3"><div className="text-[10px] text-muted">Category</div><div className="mt-1 text-xs font-semibold text-fg">{categoryOf(selectedDocument)}</div></div>
              <div className="rounded-control border border-line bg-bg p-3"><div className="text-[10px] text-muted">Related entity</div><div className="mt-1 text-xs font-semibold text-fg">{relatedLabel(selectedDocument)}{selectedDocument.relatedId ? <span className="mt-1 block break-all text-[10px] font-normal text-muted">Record ID: {selectedDocument.relatedId}</span> : null}{relatedHref(selectedDocument) ? <Link to={relatedHref(selectedDocument)!} className="mt-2 inline-flex text-xs font-medium text-accent-text hover:underline">Open linked {selectedDocument.relatedEntity?.toLowerCase()} record</Link> : null}</div></div>
              <div className="rounded-control border border-line bg-bg p-3"><div className="text-[10px] text-muted">Last updated</div><div className="mt-1 text-xs font-semibold tabular-nums text-fg">{dateOf(selectedDocument)}</div></div>
              <div className="rounded-control border border-line bg-bg p-3"><div className="text-[10px] text-muted">Owner</div><div className="mt-1"><ProfileIdentity profile={{ name: ownerOf(selectedDocument), contextLabel: 'Document owner' }} size="sm" showRole={false} /></div></div>
            </div>
            {selectedDocument.description && <div className="rounded-card border border-line bg-bg p-4"><div className="text-xs font-semibold text-fg">Description</div><p className="mt-2 text-xs leading-5 text-muted">{selectedDocument.description}</p></div>}
            {(selectedDocument.tags || []).length > 0 && <div className="rounded-card border border-line bg-bg p-4"><div className="text-xs font-semibold text-fg">Tags</div><div className="mt-2 flex flex-wrap gap-1.5">{(selectedDocument.tags || []).map((tag) => <span key={tag} className="rounded-badge border border-line bg-panel px-2 py-1 text-[10px] text-muted">{tag}</span>)}</div></div>}
            <div className="flex items-start gap-2 rounded-control border border-info/20 bg-info/5 px-3 py-3 text-[11px] text-muted"><LockKeyhole size={14} className="mt-0.5 shrink-0 text-info" /><span>Document access is handled through the current AMS session and role permissions. Storage URLs are not shown in the interface.</span></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        title="Delete document?"
        description={deleteTarget ? 'This will permanently remove "' + titleOf(deleteTarget) + '" from the document registry and private vault.' : 'This document will be permanently deleted.'}
        confirmLabel="Delete permanently"
        onConfirm={() => void confirmDelete()}
        loading={deleteLoading}
      />
    </AdminPageShell>
  );
};

export default AdminDocuments;
