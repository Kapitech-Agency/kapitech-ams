import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileCode2,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { hasAdminPermission } from '../../lib/adminAuth';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';
import {
  AdminFilterBar,
  AdminMetricStrip,
  AdminModuleHeader,
  AdminPanel,
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
  accessLevel?: string;
  tags?: string[];
}

type SortKey = 'name' | 'category' | 'size' | 'updated' | 'status';
type TabKey = 'all' | 'sops' | 'legal' | 'finance' | 'infra';
type CategoryKey = 'all' | 'sop' | 'legal' | 'finance' | 'hr' | 'security';

const DOCUMENT_TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'All Internal Documents' },
  { key: 'sops', label: 'SOPs & Policies' },
  { key: 'legal', label: 'Legal & Corporate' },
  { key: 'finance', label: 'Finance & Tax' },
  { key: 'infra', label: 'Infrastructure & Keys' },
];

const CATEGORY_FILTERS: Array<{ key: CategoryKey; label: string }> = [
  { key: 'all', label: 'All Files' },
  { key: 'sop', label: 'SOP & Guides' },
  { key: 'legal', label: 'Legal & Charters' },
  { key: 'finance', label: 'Financial Reports' },
  { key: 'hr', label: 'HR & People' },
  { key: 'security', label: 'Security & Keys' },
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

const matchesCategory = (doc: DocumentItem, key: CategoryKey) => {
  if (key === 'all') return true;
  const text = searchTextOf(doc);
  if (key === 'sop') return /sop|policy|guide|handbook|procedure|manual/.test(text);
  if (key === 'legal') return /legal|contract|charter|corporate|agreement|nda/.test(text);
  if (key === 'finance') return /finance|financial|tax|invoice|audit|accounting/.test(text);
  if (key === 'hr') return /hr|people|human|employee|culture|talent/.test(text);
  return /security|key|credential|infra|engineering|devops|access/.test(text);
};

const matchesTab = (doc: DocumentItem, tab: TabKey) => {
  if (tab === 'all') return true;
  const text = searchTextOf(doc);
  if (tab === 'sops') return /sop|policy|guide|handbook|procedure|manual/.test(text);
  if (tab === 'legal') return /legal|contract|charter|corporate|agreement|nda/.test(text);
  if (tab === 'finance') return /finance|financial|tax|invoice|audit|accounting/.test(text);
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
  const { language } = useLanguage();
  const canManageDocuments =
    hasAdminPermission('canManageProjects') ||
    hasAdminPermission('canManageCrm') ||
    hasAdminPermission('canAccessServerAndApi');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Contract');
  const [uploadFileType, setUploadFileType] = useState('PDF');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadRelatedType, setUploadRelatedType] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await api.documents.getAll();
      if (res.success && res.data?.documents) {
        setDocuments(res.data.documents);
      }
    } catch {
      showToast('Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const allowedDocumentTypes = '.pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip';

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageDocuments) return;
    if (!uploadTitle.trim()) {
      showToast('Please specify a title.');
      return;
    }
    if (!uploadFile) {
      showToast(language === 'id' ? 'Pilih file dokumen terlebih dahulu.' : 'Select a document file first.');
      return;
    }
    if (uploadFile.size <= 0 || uploadFile.size > 25 * 1024 * 1024) {
      showToast(language === 'id' ? 'Ukuran file harus antara 1 byte dan 25 MB.' : 'File size must be between 1 byte and 25 MB.');
      return;
    }

    setIsSubmitting(true);
    let documentId = '';
    try {
      const payload = {
        name: uploadTitle,
        title: uploadTitle,
        category: uploadCategory,
        type: (uploadFile.name.split('.').pop() || uploadFileType).toUpperCase().slice(0, 40),
        mimeType: uploadFile.type || 'application/octet-stream',
        size: (uploadFile.size / (1024 * 1024)).toFixed(1) + ' MB',
        sizeBytes: uploadFile.size,
        relatedEntity: uploadRelatedType
      };

      const created = await api.documents.create(payload);
      if (!created.success || !created.data?.document) {
        showToast(created.error || 'Upload failed.');
        return;
      }

      documentId = created.data.document.id;
      const uploaded = await api.documents.uploadContent(documentId, uploadFile);
      if (!uploaded.success || !uploaded.data?.document) {
        await api.documents.delete(documentId);
        showToast(uploaded.error || (language === 'id' ? 'File gagal disimpan ke vault.' : 'File could not be stored in the vault.'));
        return;
      }

      setDocuments(prev => [uploaded.data.document, ...prev]);
      setIsUploadModalOpen(false);
      setUploadTitle('');
      setUploadFile(null);
      showToast(language === 'id' ? 'Dokumen tersimpan di private vault.' : 'Document securely stored in the private vault.');
    } catch {
      if (documentId) await api.documents.delete(documentId).catch(() => {});
      showToast(language === 'id' ? 'Terjadi kesalahan saat mengunggah dokumen.' : 'Error uploading document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManageDocuments) return;
    setDeleteTarget(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      const res = await api.documents.delete(id);
      if (res.success) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        showToast('Document deleted.');
      }
    } catch {
      showToast('Failed to delete.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      const cat = (d.category || '').toLowerCase();
      const matchesCategory = categoryFilter === 'all' || cat.includes(categoryFilter.toLowerCase());
      const title = (d.name || d.title || '').toLowerCase();
      const matchesSearch = title.includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [documents, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 left-3 right-3 sm:left-auto sm:top-20 sm:right-6 z-50 px-4 py-2.5 rounded-card bg-panel border border-line text-fg text-xs font-sans flex items-center gap-2">
          <span className="w-2 h-2 rounded-badge bg-accent" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <AdminModuleHeader
        icon={<FileText size={20} />}
        title={language === 'id' ? 'Brankas Dokumen & Aset Agency' : 'Documents & Asset Vault'}
        description={language === 'id'
          ? 'Arsip kontrak digital, NDA, proposal komersial, berkas kepatuhan pajak, dan deliverable proyek.'
          : 'Digital contract repository, NDAs, commercial proposals, tax compliance, and project assets.'}
        actions={
          <Button
            type="button"
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => setIsUploadModalOpen(true)}
          >
            {language === 'id' ? 'Unggah dokumen' : 'Upload document'}
          </Button>
        }
      />

      {/* Document filters */}
      <div className="rounded-card border border-line bg-panel p-2"><div className="mb-2 px-2 text-xs font-medium text-muted">Filter documents</div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {(['all', 'contract', 'proposal', 'invoice', 'deliverable', 'compliance'] as const).map((cat) => {
          const count = cat === 'all' ? documents.length : documents.filter(d => (d.category || '').toLowerCase().includes(cat)).length;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
              className={`min-h-10 px-3 py-2 rounded-chip border text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[.98] ${
                categoryFilter === cat
                  ? 'bg-panel-hover border-line text-fg'
                  : 'bg-panel border-line text-muted hover:text-fg hover:border-line'
              }`}
            >
              <div className="text-xs font-sans normal-case tracking-normal capitalize">{cat === 'all' ? 'All documents' : cat}</div>
              <div className="text-lg font-semibold font-sans text-fg mt-1">{count}</div>
            </button>
          );
        })}
      </div></div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-card bg-panel border border-line">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'id' ? 'Cari judul file, tag, atau nomor kontrak...' : 'Search document title or references...'}
            className="w-full min-h-10 sm:h-9 pl-8 pr-3 text-xs bg-panel text-fg placeholder-muted rounded-control border border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus:border-accent font-sans"
          />
        </div>

        <div className="flex items-center gap-2">
          {categoryFilter !== 'all' && (
            <button
              onClick={() => setCategoryFilter('all')}
              className="px-3 min-h-10 rounded-control text-xs font-sans bg-panel border border-line text-fg flex items-center gap-1 hover:text-fg"
            >
              <span>Reset filter ({categoryFilter})</span>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="rounded-card bg-panel border border-line overflow-hidden">
        {isLoading ? (
          <div className="space-y-0" role="status" aria-label="Loading document vault">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="grid grid-cols-[minmax(180px,1fr)_120px_90px_120px_120px_72px] items-center gap-4 border-b border-line px-4 py-3 last:border-b-0">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48 max-w-full" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="min-h-[160px] px-4 py-8 text-center text-xs font-sans text-muted flex flex-col items-center justify-center">
            {language === 'id' ? 'Belum ada dokumen di registri.' : 'No documents found in the registry.'}
          </div>
        ) : (
          <>
          <div className="min-[900px]:hidden divide-y divide-line">
            {filteredDocs.map((doc) => {
              const docTitle = doc.name || doc.title || 'Untitled Document';
              const docDate = doc.uploadedDate || (doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Recent');
              const docOwner = doc.owner || doc.uploadedBy || 'Kapitech System';
              const docType = doc.type || doc.fileType || 'PDF';
              const docSize = doc.size ? String(doc.size) : '1.5 MB';
              const ready = doc.status === 'ready' || doc.sourceType === 'external_link';
              return (
                <article key={doc.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-accent">
                      <FileText size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-xs font-semibold text-fg">{docTitle}</h3>
                      <p className="mt-1 truncate text-[10px] text-muted">{docType} · {doc.category || 'General'}</p>
                    </div>
                    <span className={`shrink-0 rounded-badge border px-2 py-1 text-[10px] font-semibold ${ready ? 'border-success/20 bg-success/10 text-success' : 'border-warning/20 bg-warning/10 text-warning'}`}>
                      {ready ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-control border border-line bg-bg p-2.5">
                      <div className="text-[10px] text-muted">Size</div>
                      <div className="mt-1 text-[11px] font-medium text-fg">{docSize}</div>
                    </div>
                    <div className="rounded-control border border-line bg-bg p-2.5">
                      <div className="text-[10px] text-muted">Uploaded</div>
                      <div className="mt-1 truncate text-[11px] font-medium text-fg">{docDate}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex min-w-0 items-center gap-2"><ProfileIdentity profile={{ name: docOwner, role: undefined, contextLabel: 'Document owner' }} size="sm" showRole={false} /><span className="min-w-0 truncate text-[10px] text-muted">· {doc.relatedEntity || 'General'}</span></div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(doc.downloadUrl || doc.url) ? (
                      <a href={doc.downloadUrl || doc.url} target="_blank" rel="noopener noreferrer" className="flex min-h-9 items-center justify-center rounded-control border border-line bg-bg text-xs font-medium text-fg">
                        Open
                      </a>
                    ) : (
                      <span className="flex min-h-9 items-center justify-center rounded-control border border-line bg-bg text-xs text-muted">Unavailable</span>
                    )}
                    <button type="button" onClick={() => handleDelete(doc.id)} className="min-h-9 rounded-control border border-line bg-bg text-xs font-medium text-danger">
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="hidden min-[900px]:block ams-table-scroll overflow-x-auto">
            <table className="ams-table w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-line bg-panel/50 text-xs font-sans text-muted normal-case">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs font-sans text-fg">
                {filteredDocs.map((doc) => {
                  const docTitle = doc.name || doc.title || 'Untitled Document';
                  const docDate = doc.uploadedDate || (doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Recent');
                  const docOwner = doc.owner || doc.uploadedBy || 'Kapitech System';
                  const docType = doc.type || doc.fileType || 'PDF';
                  const docSize = doc.size ? String(doc.size) : '1.5 MB';

                  return (
                    <tr key={doc.id} className="hover:bg-panel-hover transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-control bg-panel border border-line flex items-center justify-center text-accent shrink-0">
                            <FileText size={14} />
                          </div>
                          <div>
                            <div className="font-semibold text-fg">{docTitle}</div>
                            <div className="text-xs font-sans text-muted">{docType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-badge text-xs font-sans normal-case bg-panel text-muted border border-line">
                          {doc.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-xs text-muted">
                        {docSize}
                      </td>
                      <td className="py-3 px-4 font-sans text-xs text-fg">
                        {doc.relatedEntity || 'General'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={'px-2 py-0.5 rounded-badge text-xs font-sans normal-case border ' + (
                          doc.status === 'ready' || doc.sourceType === 'external_link'
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-warning/10 text-warning border-warning/20'
                        )}>
                          {doc.status === 'ready' || doc.sourceType === 'external_link' ? 'ready' : 'pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-xs text-muted">
                        <div>{docDate}</div>
                        <div className="flex items-center gap-2 text-xs text-muted/70"><span>by</span><ProfileIdentity profile={{ name: docOwner, role: undefined, contextLabel: 'Document owner' }} size="sm" showRole={false} /></div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(doc.downloadUrl || doc.url) ? (
                            <a
                              href={doc.downloadUrl || doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={language === 'id' ? 'Buka dokumen' : 'Open document'}
                              className="min-h-10 min-w-10 p-2 rounded-control hover:bg-panel-hover text-muted hover:text-fg transition-colors flex items-center justify-center"
                            >
                              <Download size={14} />
                            </a>
                          ) : (
                            <span title={language === 'id' ? 'Tidak ada URL dokumen' : 'No document URL'} className="p-1.5 text-muted">
                              <Download size={14} />
                            </span>
                          )}
                          <button
                            onClick={() => handleDelete(doc.id)}
                            title="Delete"
                            className="min-h-10 min-w-10 rounded-control hover:bg-danger/10 text-muted hover:text-danger transition-colors flex items-center justify-center"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={language === 'id' ? 'Hapus dokumen?' : 'Delete document?'}
        description={language === 'id' ? 'Dokumen akan dihapus dari private vault dan tindakan ini tidak dapat dibatalkan.' : 'The document will be removed from the private vault and this action cannot be undone.'}
        confirmLabel={language === 'id' ? 'Hapus permanen' : 'Delete permanently'}
        onConfirm={() => { if (deleteTarget) void confirmDelete(deleteTarget); }}
      />

      {/* UPLOAD MODAL */}
      <Drawer
        open={isUploadModalOpen}
        onClose={() => !isSubmitting && setIsUploadModalOpen(false)}
        size="md"
        title={language === 'id' ? 'Unggah dokumen' : 'Upload document'}
        description={language === 'id' ? 'Tambahkan dokumen ke private vault AMS.' : 'Add a document to the AMS private vault.'}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setIsUploadModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" form="document-upload-form" disabled={isSubmitting} loading={isSubmitting} icon={<Plus size={14} />}>
              {language === 'id' ? 'Simpan ke Private Vault' : 'Store in Private Vault'}
            </Button>
          </>
        )}
      >
            <form id="document-upload-form" onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-xs font-sans text-muted">Document Title *</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Master Services Agreement 2026"
                  className="w-full min-h-10 sm:h-9 px-3 rounded-control bg-panel text-fg border border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-sans text-muted">Category</label>
                  <CustomSelect value={uploadCategory} onChange={setUploadCategory} options={['Contract','Proposal','Invoice','Deliverable','Compliance'].map(value => ({value,label:value}))} className="w-full" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-sans text-muted">Related Entity</label>
                  <CustomSelect value={uploadRelatedType} onChange={setUploadRelatedType} options={['General','Client','Deal','Project'].map(value => ({value,label:value}))} className="w-full" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-sans text-muted">{language === 'id' ? 'File Dokumen *' : 'Document File *'}</label>
                <input
                  type="file"
                  required
                  accept={allowedDocumentTypes}
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full h-10 px-2 py-2 rounded-control bg-panel text-fg border border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus:border-accent text-xs"
                />
                <p className="text-xs text-muted font-sans">
                  {language === 'id'
                    ? 'File disimpan di server-side private vault, di luar static web root. Maksimal 25 MB. Akses selalu melalui session + RBAC.'
                    : 'Files are stored in a server-side private vault outside the static web root. Max 25 MB. Access requires session + RBAC.'}
                </p>
              </div>

            </form>
      </Drawer>
    </div>
  );
};
