import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Briefcase, CheckCircle2, ExternalLink, FileText,
  Globe, Plus, Search, Send, ShieldAlert, Trash2, Users, X, Pencil,
  RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { getAdminSession } from '../../lib/adminAuth';
import { canAccessAmsRoute, getAmsRole } from '../../lib/amsNavigationAccess';
import { api } from '../../lib/apiClient';
import Button from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { AdminDataTableShell, AdminModuleHeader, AdminModuleNotice, AdminPageShell, AdminTablePagination, Skeleton } from '../../components/admin/AdminModulePrimitives';

type CareerPosition = {
  id: string;
  slug: string;
  title: string;
  titleId: string;
  department: string;
  departmentId: string;
  location: string;
  locationId: string;
  type: string;
  typeId: string;
  workplace: string;
  workplaceId: string;
  badge: string;
  badgeId: string;
  summary: string;
  summaryId: string;
  responsibilities: string[];
  responsibilitiesId: string[];
  requirements: string[];
  requirementsId: string[];
  compensation: string;
  compensationId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type Applicant = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  positionTitle?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  status: string;
  createdAt?: string;
  source?: string;
  message?: string;
  internalNotes?: string;
};

type WorkspaceTab = 'jobs' | 'applicants';
type JobStatusFilter = 'all' | 'published' | 'draft';

const inputClass = 'h-10 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg placeholder:text-muted/60 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/20';
const textareaClass = 'min-h-[92px] w-full resize-y rounded-control border border-line bg-bg px-3 py-2.5 text-xs leading-5 text-fg placeholder:text-muted/60 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/20';

const emptyCareer = (): CareerPosition => ({
  id: '',
  slug: '',
  title: '',
  titleId: '',
  department: '',
  departmentId: '',
  location: '',
  locationId: '',
  type: 'Full Time',
  typeId: 'Full Time',
  workplace: 'Hybrid',
  workplaceId: 'Hybrid',
  badge: '',
  badgeId: '',
  summary: '',
  summaryId: '',
  responsibilities: [],
  responsibilitiesId: [],
  requirements: [],
  requirementsId: [],
  compensation: '',
  compensationId: '',
  isPublished: true,
  createdAt: '',
  updatedAt: ''
});

const normalizeCareer = (source: Partial<CareerPosition>): CareerPosition => ({
  ...emptyCareer(),
  ...source,
  id: String(source.id || ''),
  slug: String(source.slug || ''),
  responsibilities: Array.isArray(source.responsibilities) ? source.responsibilities : [],
  responsibilitiesId: Array.isArray(source.responsibilitiesId) ? source.responsibilitiesId : [],
  requirements: Array.isArray(source.requirements) ? source.requirements : [],
  requirementsId: Array.isArray(source.requirementsId) ? source.requirementsId : [],
  isPublished: source.isPublished !== false
});

const slugify = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 120);

const listToText = (items: string[]) => items.join('\n');
const textToList = (value: string) => value.split('\n').map(item => item.trim()).filter(Boolean).slice(0, 12);

const Field: React.FC<{ label: string; children: React.ReactNode; required?: boolean }> = ({ label, children, required }) => (
  <label className="block min-w-0">
    <span className="mb-1.5 block text-[11px] font-medium text-muted">
      {label}{required && <span className="ml-1 text-danger">*</span>}
    </span>
    {children}
  </label>
);

const statusLabel = (status: string) => ({
  new: 'New',
  screening: 'Screening',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  'in-review': 'In Review',
  contacted: 'Contacted',
  closed: 'Closed'
}[status] || status);

const statusClass = (status: string) => {
  if (status === 'hired' || status === 'closed') return 'border-success/25 bg-success/10 text-success';
  if (status === 'rejected' || status === 'withdrawn') return 'border-danger/25 bg-danger/10 text-danger';
  if (status === 'new') return 'border-warning/25 bg-warning/10 text-warning';
  return 'border-info/25 bg-info/10 text-info';
};

const safeExternalUrl = (value?: string): string | null => {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const applicantCoverLetter = (message?: string): string => {
  if (!message?.trim()) return '';
  const marker = 'Cover Letter:\\n';
  const markerIndex = message.lastIndexOf(marker);
  return markerIndex >= 0 ? message.slice(markerIndex + marker.length).trim() : message.trim();
};

export const AdminCmsCareers: React.FC = () => {
  const { language } = useLanguage();
  const isId = language === 'id';
  const role = getAmsRole(getAdminSession()?.user);
  const canManageJobs = canAccessAmsRoute(role, '/admin/cms/careers');
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(
    canManageJobs && requestedTab !== 'applicants' ? 'jobs' : 'applicants'
  );
  const [positions, setPositions] = useState<CareerPosition[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<JobStatusFilter>('all');
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsPageSize, setJobsPageSize] = useState(10);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [draft, setDraft] = useState<CareerPosition>(emptyCareer());
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; tone: 'success' | 'danger' } | null>(null);
  const [deleteJobTarget, setDeleteJobTarget] = useState<CareerPosition | null>(null);
  const [deletingJob, setDeletingJob] = useState(false);

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsLoaded, setApplicantsLoaded] = useState(false);
  const [applicantsError, setApplicantsError] = useState<string | null>(null);
  const [applicantSearch, setApplicantSearch] = useState('');
  const [applicantStatusFilter, setApplicantStatusFilter] = useState('all');
  const [applicantsPage, setApplicantsPage] = useState(1);
  const [applicantsPageSize, setApplicantsPageSize] = useState(10);
  const [updatingApplicantId, setUpdatingApplicantId] = useState<string | null>(null);
  const [deleteApplicantTarget, setDeleteApplicantTarget] = useState<Applicant | null>(null);
  const [deletingApplicant, setDeletingApplicant] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [internalNotesDraft, setInternalNotesDraft] = useState('');
  const [savingApplicantNotes, setSavingApplicantNotes] = useState(false);

  const loadJobs = async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const result = await api.cms.getCareers();
      if (!result.success || !Array.isArray(result.data?.positions)) {
        throw new Error(result.error || 'Career positions could not be loaded.');
      }
      setPositions((result.data.positions as CareerPosition[]).map(normalizeCareer));
    } catch (error) {
      setJobsError(error instanceof Error ? error.message : 'Career positions could not be loaded.');
    } finally {
      setJobsLoading(false);
    }
  };

  const loadApplicants = async (force = false) => {
    if (applicantsLoaded && !force) return;
    setApplicantsLoading(true);
    setApplicantsError(null);
    try {
      const result = await api.leads.getAll();
      if (!result.success || !Array.isArray(result.data?.leads)) {
        throw new Error(result.error || 'Job applications could not be loaded in the Careers workspace.');
      }
      setApplicants((result.data.leads as Applicant[]).filter(item => (item as any).type === 'career'));
      setApplicantsLoaded(true);
    } catch (error) {
      setApplicantsError(error instanceof Error ? error.message : 'Job applications could not be loaded.');
    } finally {
      setApplicantsLoading(false);
    }
  };

  useEffect(() => {
    if (canManageJobs) void loadJobs();
    else setJobsLoading(false);
  }, [canManageJobs]);

  useEffect(() => {
    const nextTab: WorkspaceTab = canManageJobs && requestedTab !== 'applicants' ? 'jobs' : 'applicants';
    setActiveTab((current) => current === nextTab ? current : nextTab);

    const hasCanonicalQuery = canManageJobs
      ? requestedTab === null || requestedTab === 'applicants'
      : requestedTab === 'applicants';
    if (hasCanonicalQuery) return;

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextTab === 'applicants') next.set('tab', 'applicants');
      else next.delete('tab');
      return next;
    }, { replace: true });
  }, [canManageJobs, requestedTab, setSearchParams]);

  useEffect(() => {
    if (activeTab === 'applicants') void loadApplicants();
  }, [activeTab]);

  const handleWorkspaceTabChange = (tab: WorkspaceTab) => {
    if (tab === 'jobs' && !canManageJobs) return;
    setActiveTab(tab);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (tab === 'applicants') next.set('tab', 'applicants');
      else next.delete('tab');
      return next;
    });
  };

  const filteredPositions = useMemo(() => {
    const q = jobSearch.trim().toLowerCase();
    return positions.filter(position => {
      const matchesStatus = jobStatusFilter === 'all'
        || (jobStatusFilter === 'published' ? position.isPublished : !position.isPublished);
      const fields = [position.title, position.titleId, position.department, position.departmentId, position.slug, position.location];
      return matchesStatus && (!q || fields.some(value => String(value || '').toLowerCase().includes(q)));
    });
  }, [positions, jobSearch, jobStatusFilter]);

  const filteredApplicants = useMemo(() => {
    const q = applicantSearch.trim().toLowerCase();
    return applicants.filter(applicant => {
      const matchesStatus = applicantStatusFilter === 'all' || applicant.status === applicantStatusFilter;
      const fields = [applicant.fullName, applicant.email, applicant.positionTitle, applicant.phone];
      return matchesStatus && (!q || fields.some(value => String(value || '').toLowerCase().includes(q)));
    });
  }, [applicants, applicantSearch, applicantStatusFilter]);

  const totalJobsPages = Math.max(1, Math.ceil(filteredPositions.length / jobsPageSize));
  const safeJobsPage = Math.min(jobsPage, totalJobsPages);
  const pagedPositions = filteredPositions.slice((safeJobsPage - 1) * jobsPageSize, safeJobsPage * jobsPageSize);
  const totalApplicantPages = Math.max(1, Math.ceil(filteredApplicants.length / applicantsPageSize));
  const safeApplicantsPage = Math.min(applicantsPage, totalApplicantPages);
  const pagedApplicants = filteredApplicants.slice((safeApplicantsPage - 1) * applicantsPageSize, safeApplicantsPage * applicantsPageSize);

  useEffect(() => { setJobsPage(1); }, [jobSearch, jobStatusFilter, jobsPageSize]);
  useEffect(() => { setJobsPage(current => Math.min(current, totalJobsPages)); }, [totalJobsPages]);
  useEffect(() => { setApplicantsPage(1); }, [applicantSearch, applicantStatusFilter, applicantsPageSize]);
  useEffect(() => { setApplicantsPage(current => Math.min(current, totalApplicantPages)); }, [totalApplicantPages]);

  const statusOptions = [
    { value: 'new', label: isId ? 'Baru' : 'New' },
    { value: 'in-review', label: isId ? 'Dalam review' : 'In Review' },
    { value: 'contacted', label: isId ? 'Sudah dihubungi' : 'Contacted' },
    { value: 'screening', label: isId ? 'Screening' : 'Screening' },
    { value: 'shortlisted', label: isId ? 'Masuk shortlist' : 'Shortlisted' },
    { value: 'interview', label: isId ? 'Interview' : 'Interview' },
    { value: 'hired', label: isId ? 'Diterima' : 'Hired' },
    { value: 'rejected', label: isId ? 'Ditolak' : 'Rejected' },
    { value: 'withdrawn', label: isId ? 'Mengundurkan diri' : 'Withdrawn' },
    { value: 'closed', label: isId ? 'Ditutup' : 'Closed' }
  ];

  const openCreateEditor = () => {
    setEditorMode('create');
    setDraft(emptyCareer());
    setEditorOpen(true);
  };

  const openEditEditor = (position: CareerPosition) => {
    setEditorMode('edit');
    setDraft(normalizeCareer(position));
    setEditorOpen(true);
  };

  const updateDraft = <K extends keyof CareerPosition,>(key: K, value: CareerPosition[K]) => {
    setDraft(current => ({ ...current, [key]: value }));
  };

  const savePosition = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.titleId.trim() || !draft.department.trim() || !draft.departmentId.trim()) {
      setStatusMessage({ text: isId ? 'Judul dan departemen wajib diisi dalam Bahasa Inggris dan Indonesia.' : 'Job title and department are required in English and Indonesian.', tone: 'danger' });
      return;
    }
    setSaving(true);
    setStatusMessage(null);
    try {
      const payload = {
        ...draft,
        slug: slugify(draft.slug || draft.title),
        updatedAt: new Date().toISOString()
      };
      const result = editorMode === 'create'
        ? await api.cms.createCareer(payload)
        : await api.cms.updateCareer(draft.id, payload);
      if (!result.success || !result.data?.position) {
        throw new Error(result.error || 'Career position could not be saved.');
      }
      const saved = normalizeCareer(result.data.position as CareerPosition);
      setPositions(current => editorMode === 'create'
        ? [saved, ...current]
        : current.map(item => item.id === saved.id ? saved : item));
      setEditorOpen(false);
      setStatusMessage({ text: editorMode === 'create' ? (isId ? 'Lowongan berhasil ditambahkan.' : 'Job opening created.') : (isId ? 'Lowongan berhasil diperbarui.' : 'Job opening updated.'), tone: 'success' });
    } catch (error) {
      setStatusMessage({ text: error instanceof Error ? error.message : 'Career position could not be saved.', tone: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (position: CareerPosition) => {
    setStatusMessage(null);
    try {
      const result = await api.cms.updateCareer(position.id, { isPublished: !position.isPublished });
      if (!result.success || !result.data?.position) throw new Error(result.error || 'Publication status could not be updated.');
      const updated = normalizeCareer(result.data.position as CareerPosition);
      setPositions(current => current.map(item => item.id === updated.id ? updated : item));
      setStatusMessage({ text: updated.isPublished
        ? (isId ? 'Status CMS tersimpan sebagai Dipublikasikan. Periksa halaman Careers publik untuk memastikan visibilitas.' : 'CMS status saved as Published. Verify the public Careers page to confirm visibility.')
        : (isId ? 'Status CMS tersimpan sebagai Draf. Periksa halaman Careers publik untuk memastikan perubahan visibilitas.' : 'CMS status saved as Draft. Verify the public Careers page to confirm visibility changes.'), tone: 'success' });
    } catch (error) {
      setStatusMessage({ text: error instanceof Error ? error.message : 'Publication status could not be updated.', tone: 'danger' });
    }
  };

  const confirmDeleteJob = async () => {
    if (!deleteJobTarget || deletingJob) return;
    const target = deleteJobTarget;
    setDeletingJob(true);
    try {
      const result = await api.cms.deleteCareer(target.id);
      if (!result.success) throw new Error(result.error || 'Career position could not be deleted.');
      setPositions(current => current.filter(item => item.id !== target.id));
      setStatusMessage({ text: isId ? 'Lowongan dihapus. Data lamaran yang sudah masuk tetap tersimpan.' : 'Job deleted. Existing applicant records are retained.', tone: 'success' });
    } catch (error) {
      setStatusMessage({ text: error instanceof Error ? error.message : 'Career position could not be deleted.', tone: 'danger' });
    } finally {
      setDeleteJobTarget(null);
      setDeletingJob(false);
    }
  };

  const updateApplicantStatus = async (applicant: Applicant, status: string) => {
    setUpdatingApplicantId(applicant.id);
    setStatusMessage(null);
    try {
      const result = await api.leads.update(applicant.id, { status });
      if (!result.success) throw new Error(result.error || 'Applicant status could not be updated. Check applicant-management access.');
      setApplicants(current => current.map(item => item.id === applicant.id ? { ...item, status } : item));
      setStatusMessage({ text: isId ? 'Status pelamar diperbarui.' : 'Applicant status updated.', tone: 'success' });
    } catch (error) {
      setStatusMessage({ text: error instanceof Error ? error.message : 'Applicant status could not be updated.', tone: 'danger' });
    } finally {
      setUpdatingApplicantId(null);
    }
  };

  const openApplicantDetails = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setInternalNotesDraft(applicant.internalNotes || '');
  };

  const saveApplicantNotes = async () => {
    if (!selectedApplicant) return;
    setSavingApplicantNotes(true);
    setStatusMessage(null);
    try {
      const result = await api.leads.update(selectedApplicant.id, { internalNotes: internalNotesDraft });
      if (!result.success) throw new Error(result.error || 'Applicant notes could not be saved.');
      const updated = { ...selectedApplicant, internalNotes: internalNotesDraft };
      setSelectedApplicant(updated);
      setApplicants(current => current.map(item => item.id === updated.id ? updated : item));
      setStatusMessage({ text: isId ? 'Catatan internal disimpan.' : 'Internal notes saved.', tone: 'success' });
    } catch (error) {
      setStatusMessage({ text: error instanceof Error ? error.message : 'Applicant notes could not be saved.', tone: 'danger' });
    } finally {
      setSavingApplicantNotes(false);
    }
  };

  const confirmDeleteApplicant = async () => {
    if (!deleteApplicantTarget || deletingApplicant) return;
    const target = deleteApplicantTarget;
    setDeletingApplicant(true);
    try {
      const result = await api.leads.delete(target.id);
      if (!result.success) throw new Error(result.error || 'Applicant record could not be deleted.');
      setApplicants(current => current.filter(item => item.id !== target.id));
      setStatusMessage({ text: isId ? 'Data pelamar dihapus.' : 'Applicant record deleted.', tone: 'success' });
    } catch (error) {
      setStatusMessage({ text: error instanceof Error ? error.message : 'Applicant record could not be deleted.', tone: 'danger' });
    } finally {
      setDeleteApplicantTarget(null);
      setDeletingApplicant(false);
    }
  };

  return (
    <AdminPageShell featureSlug="cms-careers-module" className="ams-cms-module">
      <ConfirmDialog
        open={!!deleteJobTarget}
        onClose={() => { if (!deletingJob) setDeleteJobTarget(null); }}
        loading={deletingJob}
        title={isId ? 'Hapus lowongan?' : 'Delete job opening?'}
        description={isId
          ? 'Lowongan ini akan dihapus dari CMS. Data lamaran yang sudah masuk tetap tersimpan. Periksa halaman Careers publik setelah penghapusan untuk memastikan perubahan visibilitas.'
          : 'This job record will be deleted from the CMS. Existing applications will be retained. Verify the public Careers page after deletion to confirm visibility changes.'}
        confirmLabel={isId ? 'Hapus lowongan' : 'Delete opening'}
        onConfirm={() => void confirmDeleteJob()}
      />
      <ConfirmDialog
        open={!!deleteApplicantTarget}
        onClose={() => { if (!deletingApplicant) setDeleteApplicantTarget(null); }}
        loading={deletingApplicant}
        title={isId ? 'Hapus data pelamar?' : 'Delete applicant record?'}
        description={isId
          ? 'Data pelamar akan dihapus dari pengelolaan Careers. Tindakan ini tidak dapat dibatalkan.'
          : 'This applicant record will be deleted from Careers management. This action cannot be undone.'}
        confirmLabel={isId ? 'Hapus pelamar' : 'Delete applicant'}
        onConfirm={() => void confirmDeleteApplicant()}
      />

      <AdminModuleHeader
        slug="cms-careers-header"
        className="mb-0"
        title={isId ? 'Careers' : 'Careers'}
        description={canManageJobs
          ? (isId
            ? 'Kelola lowongan public site dan tindak lanjuti kandidat dari formulir Careers.'
            : 'Manage public job openings and applicants submitted through the Careers page.')
          : (isId
            ? 'Tinjau dan kelola pelamar yang masuk melalui halaman Careers.'
            : 'Review and manage applications submitted through the public Careers page.')}
        actions={
          <>
            {canManageJobs && activeTab === 'jobs' && (
              <Button type="button" variant="primary" icon={<Plus size={14} />} onClick={openCreateEditor}>
                {isId ? 'Tambah lowongan' : 'Add opening'}
              </Button>
            )}
          </>
        }
      />

      

      <div role="tablist" aria-label={isId ? "Workspace Careers" : "Careers workspace"} className="ams-workspace-tabs inline-flex max-w-full flex-wrap items-center gap-1 rounded-control border border-line bg-panel p-1">
        {([
          ...(canManageJobs ? [{ key: 'jobs' as const, label: isId ? 'Lowongan' : 'Job openings', count: positions.length }] : []),
          { key: 'applicants' as const, label: isId ? 'Pelamar' : 'Applicants', count: applicantsLoaded ? applicants.length : null },
          { key: 'recruitment-history' as const, label: isId ? 'Riwayat Rekrutmen' : 'Recruitment History', count: null, available: false }
        ] as Array<{ key: WorkspaceTab | 'recruitment-history'; label: string; count: number | null; available?: boolean }>).map(tab => tab.available === false ? (
          <span
            key={tab.key}
            aria-disabled="true"
            title={isId ? 'Riwayat rekrutmen belum tersedia.' : 'Recruitment history is not available yet.'}
            data-ams-navigation-status="target-only"
            className="inline-flex min-h-8 cursor-not-allowed items-center rounded-chip border border-transparent px-3 text-[11px] font-medium text-muted/50"
          >
            {tab.label}
          </span>
        ) : (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleWorkspaceTabChange(tab.key as WorkspaceTab)}
            id={`careers-${tab.key}-tab`}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`careers-${tab.key}-panel`}
            tabIndex={activeTab === tab.key ? 0 : -1}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const tabKeys: WorkspaceTab[] = canManageJobs ? ['jobs', 'applicants'] : ['applicants'];
              const currentIndex = tabKeys.indexOf(tab.key as WorkspaceTab);
              const nextIndex = event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? tabKeys.length - 1
                  : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabKeys.length) % tabKeys.length;
              const nextKey = tabKeys[nextIndex];
              handleWorkspaceTabChange(nextKey);
              document.getElementById(`careers-${nextKey}-tab`)?.focus();
            }}
            className={'inline-flex min-h-8 items-center gap-2 rounded-chip border px-3 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' + (activeTab === tab.key ? 'border-accent/25 bg-accent/10 font-semibold text-fg' : 'border-transparent text-muted hover:bg-bg hover:text-fg')}
          >
            {tab.label}
            {tab.count !== null && <span className={'rounded-badge border px-1.5 py-0.5 text-[10px] tabular-nums ' + (activeTab === tab.key ? 'border-accent/25 bg-accent/10 text-accent-text' : 'border-line bg-bg text-muted')}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {statusMessage && (
        <AdminModuleNotice
          tone={statusMessage.tone}
          onDismiss={() => setStatusMessage(null)}
        >
          {statusMessage.text}
        </AdminModuleNotice>
      )}

      {activeTab === 'jobs' ? (
        <section className="space-y-3" data-ams-feature-slug="cms-careers-list" role="tabpanel" id="careers-jobs-panel" aria-labelledby="careers-jobs-tab" tabIndex={0}>
          <div className="flex flex-col gap-3 rounded-card border border-line bg-panel p-4 sm:flex-row sm:items-center">
            <label className="relative min-w-0 flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={jobSearch} onChange={event => setJobSearch(event.target.value)} className={inputClass + ' pl-9'} placeholder={isId ? 'Cari judul, departemen, atau slug...' : 'Search title, department, or slug...'} aria-label="Search job openings" />
            </label>
            <CustomSelect
              value={jobStatusFilter}
              onChange={(value) => setJobStatusFilter(value as JobStatusFilter)}
              options={[
                { value: 'all', label: isId ? 'Semua status' : 'All statuses' },
                { value: 'published', label: isId ? 'Dipublikasikan' : 'Published' },
                { value: 'draft', label: 'Draft' }
              ]}
              size="sm"
              className="w-full sm:w-44"
              triggerClassName="w-full"
              aria-label={isId ? 'Filter status lowongan' : 'Filter job status'}
              slug="careers-job-status-filter"
            />
            <button type="button" onClick={() => { setJobSearch(''); setJobStatusFilter('all'); }} className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs text-muted hover:text-fg">
              <RefreshCw size={13} /> {isId ? 'Reset' : 'Reset'}
            </button>
          </div>

          {jobsLoading ? (
            <div className="grid gap-3 lg:grid-cols-2" role="status" aria-label="Loading job openings">
              {[1, 2].map(item => <div key={item} className="rounded-card border border-line bg-panel p-4"><Skeleton className="h-4 w-28" /><Skeleton className="mt-4 h-5 w-3/4" /><Skeleton className="mt-3 h-3 w-full" /><Skeleton className="mt-2 h-3 w-4/5" /></div>)}
            </div>
          ) : jobsError ? (
            <div className="rounded-card border border-danger/30 bg-danger/10 p-4">
              <p className="text-sm font-semibold text-fg">{isId ? 'Lowongan gagal dimuat' : 'Unable to load job openings'}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{jobsError}</p>
              <button type="button" onClick={() => void loadJobs()} className="mt-3 inline-flex h-9 items-center gap-2 rounded-control border border-line bg-panel px-3 text-xs text-fg"><RefreshCw size={13} />Retry</button>
            </div>
          ) : filteredPositions.length === 0 ? (
            <div className="rounded-card border border-line bg-panel px-6 py-12 text-center">
              <Briefcase size={23} className="mx-auto text-muted" />
              <h3 className="mt-3 text-sm font-semibold text-fg">{positions.length === 0 ? (isId ? 'Belum ada lowongan' : 'No job openings yet') : (isId ? 'Tidak ada lowongan yang cocok' : 'No matching openings')}</h3>
              <p className="mt-1 text-xs leading-5 text-muted">{positions.length === 0 ? (isId ? 'Tambahkan lowongan untuk menampilkannya di halaman Career public site.' : 'Add a job opening to publish it on the public Careers page.') : (isId ? 'Ubah kata kunci atau filter status.' : 'Adjust your search or status filter.')}</p>
              {positions.length === 0 && <button type="button" onClick={openCreateEditor} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-control bg-accent px-3 text-xs font-medium text-white hover:bg-accent-hover"><Plus size={13} />{isId ? 'Tambah lowongan' : 'Add opening'}</button>}
            </div>
          ) : (
            <AdminDataTableShell slug="cms-careers-jobs-table">
              <div className="grid gap-3 p-3 min-[1280px]:hidden sm:p-4" data-ams-feature-slug="cms-careers-jobs-cards" role="list" aria-label={isId ? 'Kartu lowongan kerja' : 'Job opening cards'}>
                {pagedPositions.map(position => {
                  const applicantCount = applicantsLoaded
                    ? applicants.filter(item => String(item.positionTitle || '').toLowerCase() === position.title.toLowerCase() || String(item.positionTitle || '').toLowerCase() === position.titleId.toLowerCase()).length
                    : null;
                  return (
                    <article key={position.id} role="listitem" data-ams-slug={'career-job-card-' + position.id} className="min-w-0 rounded-card border border-line bg-bg p-3.5">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-muted"><Briefcase size={15} /></span>
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-sm font-semibold text-fg">{position.title || (isId ? 'Posisi tanpa judul' : 'Untitled position')}</h3>
                          {position.titleId && <p className="mt-1 break-words text-[11px] text-muted">{position.titleId}</p>}
                          <p className="mt-1 break-all font-mono text-[10px] text-muted">/{position.slug}</p>
                        </div>
                        <span className={'inline-flex shrink-0 items-center gap-1 rounded-badge border px-2 py-1 text-[10px] font-semibold ' + (position.isPublished ? 'border-success/25 bg-success/10 text-success' : 'border-line bg-panel text-muted')}>
                          <span className={'h-1.5 w-1.5 rounded-full ' + (position.isPublished ? 'bg-success' : 'bg-muted')} />
                          {position.isPublished ? (isId ? 'Live' : 'Published') : 'Draft'}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 border-y border-line py-3">
                        <div className="min-w-0"><p className="text-[10px] text-muted">{isId ? 'Departemen' : 'Department'}</p><p className="mt-1 break-words text-xs text-fg">{position.department || '—'}</p></div>
                        <div className="min-w-0"><p className="text-[10px] text-muted">{isId ? 'Jenis kerja' : 'Work type'}</p><p className="mt-1 break-words text-xs text-fg">{position.type} · {position.workplace}</p></div>
                        <div className="min-w-0"><p className="text-[10px] text-muted">{isId ? 'Lokasi' : 'Location'}</p><p className="mt-1 break-words text-xs text-fg">{position.location || '—'}</p></div>
                        <div className="min-w-0"><p className="text-[10px] text-muted">{isId ? 'Pelamar' : 'Applicants'}</p><p className="mt-1 text-xs font-medium tabular-nums text-fg">{applicantCount === null ? '—' : applicantCount}</p></div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <button type="button" onClick={() => void togglePublished(position)} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-[11px] font-medium text-fg hover:bg-panel-hover" title={position.isPublished ? 'Unpublish' : 'Publish'}>
                          {position.isPublished ? <EyeOff size={12} /> : <Eye size={12} />}{position.isPublished ? (isId ? 'Sembunyikan' : 'Unpublish') : 'Publish'}
                        </button>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button type="button" onClick={() => openEditEditor(position)} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-[11px] font-medium text-fg hover:bg-panel-hover"><Pencil size={12} />{isId ? 'Edit' : 'Edit'}</button>
                          <button type="button" onClick={() => setDeleteJobTarget(position)} className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-danger/20 bg-danger/5 text-danger hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={(isId ? 'Hapus ' : 'Delete ') + position.title}><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="hidden min-[1280px]:block overflow-x-auto custom-scrollbar" tabIndex={0} role="region" aria-label="Scrollable job openings register">
                <table className="ams-data-table w-full min-w-[900px] text-left">
                  <thead><tr className="border-b border-line bg-bg text-[10px] font-medium text-muted">
                    <th className="px-4 py-3">{isId ? 'Lowongan' : 'Position'}</th>
                    <th className="px-4 py-3">{isId ? 'Detail' : 'Details'}</th>
                    <th className="px-4 py-3">{isId ? 'Pelamar' : 'Applicants'}</th>
                    <th className="px-4 py-3">{isId ? 'Status' : 'Status'}</th>
                    <th className="px-4 py-3 text-right">{isId ? 'Aksi' : 'Actions'}</th>
                  </tr></thead>
                  <tbody className="divide-y divide-line">
                    {pagedPositions.map(position => {
                      const applicantCount = applicantsLoaded
                        ? applicants.filter(item => String(item.positionTitle || '').toLowerCase() === position.title.toLowerCase() || String(item.positionTitle || '').toLowerCase() === position.titleId.toLowerCase()).length
                        : null;
                      return (
                        <tr key={position.id} className="h-14 transition-colors hover:bg-bg/60">
                          <td className="px-4 py-3">
                            <div className="flex min-w-0 items-start gap-2.5">
                              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted"><Briefcase size={14} /></span>
                              <div className="min-w-0">
                                <p className="font-semibold text-fg">{position.title}</p>
                                <p className="mt-1 text-[10px] text-muted">{position.titleId}</p>
                                <p className="mt-1 font-mono text-[10px] text-muted/70">/{position.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-fg">{position.department}</p>
                            <p className="mt-1 text-[10px] text-muted">{position.type} · {position.workplace}</p>
                            <p className="mt-1 text-[10px] text-muted">{position.location}</p>
                          </td>
                          <td className="px-4 py-3"><span className="font-mono tabular-nums text-fg">{applicantCount === null ? '—' : applicantCount}</span><span className="ml-1 text-[10px] text-muted">{isId ? 'lamaran' : 'applications'}</span></td>
                          <td className="px-4 py-3">
                            <span className={'inline-flex items-center gap-1.5 rounded-badge border px-2 py-1 text-[10px] font-medium ' + (position.isPublished ? 'border-success/25 bg-success/10 text-success' : 'border-line bg-bg text-muted')}>
                              <span className={'h-1.5 w-1.5 rounded-full ' + (position.isPublished ? 'bg-success' : 'bg-muted')} />
                              {position.isPublished ? (isId ? 'Live' : 'Published') : 'Draft'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button type="button" onClick={() => void togglePublished(position)} className="inline-flex h-8 items-center gap-1.5 rounded-control border border-line bg-bg px-2.5 text-[10px] font-medium text-muted hover:text-fg" title={position.isPublished ? 'Unpublish' : 'Publish'}>
                                {position.isPublished ? <EyeOff size={12} /> : <Eye size={12} />}{position.isPublished ? (isId ? 'Sembunyikan' : 'Unpublish') : (isId ? 'Publish' : 'Publish')}
                              </button>
                              <button type="button" onClick={() => openEditEditor(position)} className="inline-flex h-8 items-center gap-1.5 rounded-control border border-line bg-bg px-2.5 text-[10px] font-medium text-fg hover:bg-panel"><Pencil size={12} />{isId ? 'Edit' : 'Edit'}</button>
                              <button type="button" onClick={() => setDeleteJobTarget(position)} className="inline-flex h-8 items-center justify-center rounded-control border border-danger/20 bg-danger/5 px-2 text-danger hover:bg-danger/10" aria-label={(isId ? 'Hapus ' : 'Delete ') + position.title}><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <AdminTablePagination
                total={filteredPositions.length}
                page={safeJobsPage}
                pageSize={jobsPageSize}
                onPageChange={setJobsPage}
                onPageSizeChange={setJobsPageSize}
                itemLabel={isId ? 'lowongan' : 'openings'}
                slug="cms-careers-jobs-pagination"
                secondaryLabel={<a href="https://kapitech.id/careers" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-accent-text hover:text-fg">{isId ? 'Lihat public Career' : 'View public Careers page'}<ExternalLink size={11} /></a>}
              />
            </AdminDataTableShell>
          )}
        </section>
      ) : (
        <section className="space-y-3" data-ams-feature-slug="cms-careers-applicants" role="tabpanel" id="careers-applicants-panel" aria-labelledby="careers-applicants-tab" tabIndex={0}>
          <div className="flex flex-col gap-3 rounded-card border border-line bg-panel p-4 sm:flex-row sm:items-center">
            <label className="relative min-w-0 flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={applicantSearch} onChange={event => setApplicantSearch(event.target.value)} className={inputClass + ' pl-9'} placeholder={isId ? 'Cari nama, email, atau posisi...' : 'Search applicant, email, or position...'} aria-label="Search applicants" />
            </label>
            <CustomSelect
              value={applicantStatusFilter}
              onChange={setApplicantStatusFilter}
              options={[{ value: 'all', label: isId ? 'Semua status' : 'All statuses' }, ...statusOptions]}
              size="sm"
              className="w-full sm:w-44"
              triggerClassName="w-full"
              aria-label={isId ? 'Filter status pelamar' : 'Filter applicant status'}
              slug="careers-applicant-status-filter"
            />
            <button type="button" onClick={() => void loadApplicants(true)} disabled={applicantsLoading} className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs text-muted hover:text-fg disabled:opacity-50"><RefreshCw size={13} className={applicantsLoading ? 'animate-spin' : ''} />{isId ? 'Refresh' : 'Refresh'}</button>
          </div>

          {applicantsLoading && !applicantsLoaded ? (
            <div className="space-y-2" role="status" aria-label="Loading job applicants">
              {[1, 2, 3].map(item => <div key={item} className="flex items-center gap-3 rounded-card border border-line bg-panel p-4"><Skeleton className="h-9 w-9 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="mt-2 h-3 w-60" /></div></div>)}
            </div>
          ) : applicantsError && !applicantsLoaded ? (
            <div className="rounded-card border border-warning/30 bg-warning/5 p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert size={17} className="mt-0.5 shrink-0 text-warning" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-fg">{isId ? 'Pelamar tidak dapat dimuat' : 'Applicants are not available'}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted">{applicantsError}</p>
                  <p className="mt-2 text-xs leading-5 text-muted">{isId ? 'Coba muat ulang daftar pelamar. Jika masalah berlanjut, minta administrator memeriksa akses Anda.' : 'Retry the applicant list. If the issue persists, ask an administrator to review your access.'}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" icon={<RefreshCw size={13} />} onClick={() => void loadApplicants(true)}>{isId ? 'Coba lagi' : 'Try again'}</Button>

                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {applicantsLoading && applicantsLoaded && (
                <div className="flex items-start gap-2.5 rounded-card border border-line bg-panel px-4 py-3" role="status" aria-live="polite">
                  <RefreshCw size={14} className="mt-0.5 shrink-0 text-muted" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-fg">{isId ? 'Memperbarui daftar pelamar' : 'Refreshing applicant list'}</p>
                    <p className="mt-1 text-[11px] leading-5 text-muted">{isId ? 'Data terakhir yang berhasil dimuat tetap ditampilkan selama pembaruan.' : 'Previously loaded applicant records remain visible while the latest list is being checked.'}</p>
                  </div>
                </div>
              )}
              {applicantsError && applicantsLoaded && (
                <div className="flex items-start gap-2.5 rounded-card border border-warning/30 bg-warning/5 px-4 py-3" role="status">
                  <ShieldAlert size={15} className="mt-0.5 shrink-0 text-warning" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-fg">{isId ? 'Pembaruan daftar pelamar gagal' : 'Applicant refresh failed'}</p>
                    <p className="mt-1 text-[11px] leading-5 text-muted">{isId ? 'Data terakhir yang berhasil dimuat tetap dipertahankan. Jumlah lamaran terkini dan perubahan terbaru belum dapat dikonfirmasi. Gunakan Refresh untuk mencoba lagi.' : 'Previously loaded applicant data remains unchanged. The current applicant count and newer changes cannot be confirmed. Use Refresh to try again.'}</p>
                    <p className="mt-1 break-words text-[10px] text-muted">{applicantsError}</p>
                  </div>
                </div>
              )}
              {filteredApplicants.length === 0 ? (
            <div className="rounded-card border border-line bg-panel px-6 py-12 text-center">
              <Users size={23} className="mx-auto text-muted" />
              <h3 className="mt-3 text-sm font-semibold text-fg">{applicantsError && applicantsLoaded && applicants.length === 0 ? (isId ? 'Daftar terakhir kosong, kondisi terkini belum terkonfirmasi' : 'Last successful applicant list was empty') : applicants.length === 0 ? (isId ? 'Belum ada pelamar' : 'No applicants yet') : (isId ? 'Tidak ada pelamar yang cocok' : 'No matching applicants')}</h3>
              <p className="mt-1 text-xs leading-5 text-muted">{applicantsError && applicantsLoaded && applicants.length === 0 ? (isId ? 'Pembaruan gagal sehingga jumlah lamaran terkini tidak dapat dipastikan. Muat ulang untuk memeriksa kembali.' : 'The refresh failed, so the current applicant count cannot be confirmed. Refresh to check again.') : (isId ? 'Lamaran dari halaman Career public site akan muncul di sini secara otomatis.' : 'Applications submitted through the public Careers page will appear here automatically.')}</p>

            </div>
          ) : (
            <AdminDataTableShell slug="cms-careers-applicants-table">
              <div className="grid gap-3 p-3 min-[1280px]:hidden sm:p-4" data-ams-feature-slug="cms-careers-applicants-cards" role="list" aria-label={isId ? 'Kartu pelamar' : 'Applicant cards'}>
                {pagedApplicants.map(applicant => {
                  const resume = safeExternalUrl(applicant.resumeUrl);
                  const portfolio = safeExternalUrl(applicant.portfolioUrl);
                  return (
                    <article key={applicant.id} role="listitem" data-ams-slug={'career-applicant-card-' + applicant.id} className="min-w-0 rounded-card border border-line bg-bg p-3.5">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-sm font-semibold text-fg">{applicant.fullName || (isId ? 'Nama belum tersedia' : 'Unnamed applicant')}</h3>
                          <a href={'mailto:' + applicant.email} className="mt-1 block break-all text-[11px] text-muted hover:text-accent-text">{applicant.email}</a>
                          {applicant.phone && <p className="mt-1 text-[10px] text-muted">{applicant.phone}</p>}
                        </div>
                        <span className="shrink-0 rounded-badge border border-line bg-panel px-2 py-1 text-[10px] font-medium text-fg">{statusLabel(applicant.status)}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 border-y border-line py-3">
                        <div className="min-w-0 col-span-2"><p className="text-[10px] text-muted">{isId ? 'Posisi dilamar' : 'Applied position'}</p><p className="mt-1 break-words text-xs text-fg">{applicant.positionTitle || (isId ? 'Posisi tidak ditentukan' : 'Position not specified')}</p><p className="mt-1 text-[10px] text-muted">{applicant.source || 'Careers'}</p></div>
                        <div className="min-w-0"><p className="text-[10px] text-muted">{isId ? 'Tanggal masuk' : 'Received'}</p><p className="mt-1 text-xs text-fg">{applicant.createdAt ? new Date(applicant.createdAt).toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p></div>
                        <div className="min-w-0"><p className="text-[10px] text-muted">{isId ? 'Dokumen' : 'Documents'}</p><div className="mt-1 flex flex-wrap gap-1.5">{resume && <a href={resume} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-control border border-line bg-panel px-2 text-[10px] text-fg hover:border-accent/30"><FileText size={11} />CV</a>}{portfolio && <a href={portfolio} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-control border border-line bg-panel px-2 text-[10px] text-fg hover:border-accent/30"><ExternalLink size={11} />Portfolio</a>}{!resume && !portfolio && <span className="text-[10px] text-muted">—</span>}</div></div>
                      </div>
                      <div className="mt-3">
                        <label className="text-[10px] font-medium text-muted" htmlFor={'careers-applicant-card-status-' + applicant.id}>{isId ? 'Ubah status' : 'Update status'}</label>
                        <div className="mt-1">
                          <CustomSelect
                            value={applicant.status || 'new'}
                            disabled={updatingApplicantId === applicant.id}
                            onChange={(value) => void updateApplicantStatus(applicant, value)}
                            options={[
                              ...statusOptions,
                              ...(applicant.status && !statusOptions.some(option => option.value === applicant.status)
                                ? [{ value: applicant.status, label: statusLabel(applicant.status) }]
                                : [])
                            ]}
                            size="xs"
                            className="w-full"
                            triggerClassName="w-full px-2 text-[10px]"
                            aria-label={'Status for ' + applicant.fullName}
                            slug={'careers-applicant-card-status-' + applicant.id}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap justify-end gap-1.5 border-t border-line pt-3">
                        <button type="button" onClick={() => openApplicantDetails(applicant)} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-[11px] text-fg hover:border-accent/30 hover:bg-panel-hover"><Eye size={12} />{isId ? 'Detail' : 'Details'}</button>
                        <a href={'mailto:' + applicant.email} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-[11px] text-fg hover:bg-panel-hover"><Send size={12} />Email</a>
                        <button type="button" onClick={() => setDeleteApplicantTarget(applicant)} className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-danger/20 bg-danger/5 text-danger hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={(isId ? 'Hapus pelamar ' : 'Delete applicant ') + applicant.fullName}><Trash2 size={13} /></button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="hidden min-[1280px]:block overflow-x-auto custom-scrollbar" tabIndex={0} role="region" aria-label="Scrollable applicants register">
                <table className="ams-data-table w-full min-w-[980px] text-left">
                  <thead><tr className="border-b border-line bg-bg text-[10px] font-medium text-muted">
                    <th className="px-4 py-3">{isId ? 'Pelamar' : 'Applicant'}</th>
                    <th className="px-4 py-3">{isId ? 'Posisi' : 'Position'}</th>
                    <th className="px-4 py-3">{isId ? 'Tanggal' : 'Received'}</th>
                    <th className="px-4 py-3">{isId ? 'Status' : 'Status'}</th>
                    <th className="px-4 py-3">{isId ? 'Dokumen' : 'Documents'}</th>
                    <th className="px-4 py-3 text-right">{isId ? 'Aksi' : 'Actions'}</th>
                  </tr></thead>
                  <tbody className="divide-y divide-line">
                    {pagedApplicants.map(applicant => {
                      const resume = safeExternalUrl(applicant.resumeUrl);
                      const portfolio = safeExternalUrl(applicant.portfolioUrl);
                      return (
                        <tr key={applicant.id} className="h-14 transition-colors hover:bg-bg/60">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-fg">{applicant.fullName || 'Unnamed applicant'}</p>
                            <a href={'mailto:' + applicant.email} className="mt-1 inline-flex text-[10px] text-muted hover:text-accent-text">{applicant.email}</a>
                            {applicant.phone && <p className="mt-1 text-[10px] text-muted">{applicant.phone}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <p className="max-w-[260px] text-fg">{applicant.positionTitle || (isId ? 'Posisi tidak ditentukan' : 'Position not specified')}</p>
                            <p className="mt-1 max-w-[260px] truncate text-[10px] text-muted">{applicant.source || 'Careers'}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-[10px] text-muted">{applicant.createdAt ? new Date(applicant.createdAt).toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                          <td className="px-4 py-3">
                            <CustomSelect
                              value={applicant.status || 'new'}
                              disabled={updatingApplicantId === applicant.id}
                              onChange={(value) => void updateApplicantStatus(applicant, value)}
                              options={[
                                ...statusOptions,
                                ...(applicant.status && !statusOptions.some(option => option.value === applicant.status)
                                  ? [{ value: applicant.status, label: statusLabel(applicant.status) }]
                                  : [])
                              ]}
                              size="xs"
                              className="w-[146px] max-w-full"
                              triggerClassName="w-full px-2 text-[10px]"
                              aria-label={'Status for ' + applicant.fullName}
                              slug={'careers-applicant-status-' + applicant.id}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {resume && <a href={resume} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-control border border-line bg-bg px-2 text-[10px] text-fg hover:border-accent/30"><FileText size={11} />CV</a>}
                              {portfolio && <a href={portfolio} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-control border border-line bg-bg px-2 text-[10px] text-fg hover:border-accent/30"><ExternalLink size={11} />Portfolio</a>}
                              {!resume && !portfolio && <span className="text-[10px] text-muted">—</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button type="button" onClick={() => openApplicantDetails(applicant)} className="inline-flex h-8 items-center gap-1.5 rounded-control border border-line bg-bg px-2.5 text-[10px] text-fg hover:border-accent/30 hover:bg-panel"><Eye size={11} />{isId ? 'Detail' : 'Details'}</button>
                              <a href={'mailto:' + applicant.email} className="inline-flex h-8 items-center gap-1.5 rounded-control border border-line bg-bg px-2.5 text-[10px] text-fg hover:bg-panel"><Send size={11} />Email</a>
                              <button type="button" onClick={() => setDeleteApplicantTarget(applicant)} className="inline-flex h-8 items-center justify-center rounded-control border border-danger/20 bg-danger/5 px-2 text-danger hover:bg-danger/10" aria-label={(isId ? 'Hapus pelamar ' : 'Delete applicant ') + applicant.fullName}><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <AdminTablePagination
                total={filteredApplicants.length}
                page={safeApplicantsPage}
                pageSize={applicantsPageSize}
                onPageChange={setApplicantsPage}
                onPageSizeChange={setApplicantsPageSize}
                itemLabel={isId ? 'pelamar' : 'applicants'}
                slug="cms-careers-applicants-pagination"
              />
            </AdminDataTableShell>
              )}
            </>
          )}
        </section>
      )}

      <Drawer
        open={!!selectedApplicant}
        onClose={() => !savingApplicantNotes && setSelectedApplicant(null)}
        title={selectedApplicant?.fullName || (isId ? 'Detail pelamar' : 'Applicant details')}
        description={selectedApplicant ? [selectedApplicant.positionTitle, selectedApplicant.email].filter(Boolean).join(' · ') : undefined}
        size="3xl"
        slug="cms-career-applicant-details"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setSelectedApplicant(null)} disabled={savingApplicantNotes}>{isId ? 'Tutup' : 'Close'}</Button>
            <Button type="button" variant="primary" onClick={() => void saveApplicantNotes()} disabled={savingApplicantNotes} icon={savingApplicantNotes ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}>
              {savingApplicantNotes ? (isId ? 'Menyimpan...' : 'Saving...') : (isId ? 'Simpan catatan' : 'Save notes')}
            </Button>
          </>
        }
      >
        {selectedApplicant && (() => {
          const resume = safeExternalUrl(selectedApplicant.resumeUrl);
          const portfolio = safeExternalUrl(selectedApplicant.portfolioUrl);
          return (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-control border border-line bg-bg p-3">
                  <span className="text-[10px] text-muted">{isId ? 'Email' : 'Email'}</span>
                  <a href={'mailto:' + selectedApplicant.email} className="mt-1 block break-all text-xs font-medium text-fg hover:text-accent-text">{selectedApplicant.email || '—'}</a>
                </div>
                <div className="rounded-control border border-line bg-bg p-3">
                  <span className="text-[10px] text-muted">{isId ? 'Nomor telepon' : 'Phone'}</span>
                  <p className="mt-1 text-xs font-medium text-fg">{selectedApplicant.phone || '—'}</p>
                </div>
                <div className="rounded-control border border-line bg-bg p-3">
                  <span className="text-[10px] text-muted">{isId ? 'Tanggal masuk' : 'Date received'}</span>
                  <p className="mt-1 text-xs font-medium text-fg">{selectedApplicant.createdAt ? new Date(selectedApplicant.createdAt).toLocaleString(isId ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</p>
                </div>
                <div className="rounded-control border border-line bg-bg p-3">
                  <span className="text-[10px] text-muted">{isId ? 'Sumber' : 'Source'}</span>
                  <p className="mt-1 text-xs font-medium text-fg">{selectedApplicant.source || 'Careers'}</p>
                </div>
              </div>

              <section className="rounded-card border border-line bg-bg p-3.5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold text-fg">{isId ? 'Cover letter / pesan kandidat' : 'Cover letter / applicant message'}</h3>
                  <span className="text-[10px] text-muted">{applicantCoverLetter(selectedApplicant.message).length} {isId ? 'karakter' : 'characters'}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-xs leading-6 text-muted">
                  {applicantCoverLetter(selectedApplicant.message) || (isId ? 'Kandidat tidak menyertakan pesan.' : 'No message was provided.')}
                </p>
              </section>

              <div className="flex flex-wrap gap-2">
                {resume && <a href={resume} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:border-accent/30"><FileText size={13} />{isId ? 'Buka CV / Resume' : 'Open CV / Resume'}<ExternalLink size={11} /></a>}
                {portfolio && <a href={portfolio} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:border-accent/30">{isId ? 'Buka portfolio' : 'Open portfolio'}<ExternalLink size={11} /></a>}
                {!resume && !portfolio && <p className="text-[11px] text-muted">{isId ? 'Tidak ada tautan dokumen.' : 'No document links available.'}</p>}
              </div>

              <Field label={isId ? 'Catatan internal untuk tim rekrutmen' : 'Internal notes for the hiring team'}>
                <textarea className={textareaClass + ' min-h-[120px]'} value={internalNotesDraft} onChange={event => setInternalNotesDraft(event.target.value.slice(0, 5000))} maxLength={5000} placeholder={isId ? 'Catat hasil screening, jadwal interview, atau tindak lanjut...' : 'Record screening notes, interview plans, or follow-ups...'} />
              </Field>
              <p className="text-[10px] leading-4 text-muted">{isId ? 'Catatan hanya untuk internal AMS dan tidak tampil di public site.' : 'Notes are internal to AMS and are not shown on the public site.'}</p>
            </div>
          );
        })()}
      </Drawer>

      <Drawer
        open={editorOpen}
        onClose={() => !saving && setEditorOpen(false)}
        title={editorMode === 'create' ? (isId ? 'Tambah lowongan baru' : 'Add a job opening') : (isId ? 'Edit lowongan' : 'Edit job opening')}
        description={isId ? 'Konten bilingual ini ditampilkan pada halaman Career public site.' : 'Edit bilingual content shown on the public Careers page.'}
        size="4xl"
        slug="cms-careers-editor"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setEditorOpen(false)} disabled={saving}>{isId ? 'Batal' : 'Cancel'}</Button>
            <Button type="submit" form="cms-career-position-form" variant="primary" disabled={saving} icon={saving ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}>{saving ? (isId ? 'Menyimpan...' : 'Saving...') : (isId ? 'Simpan lowongan' : 'Save opening')}</Button>
          </>
        }
      >
        <form id="cms-career-position-form" data-ams-feature-slug="cms-career-position-form" onSubmit={savePosition} className="cms-career-editor-form space-y-5">
          <section className="grid gap-3 rounded-card border border-line bg-bg p-4 sm:grid-cols-[minmax(0,1fr)_240px]">
            <Field label="URL slug" required>
              <input className={inputClass + ' font-mono'} value={draft.slug} onChange={event => updateDraft('slug', slugify(event.target.value))} placeholder="ui-ux-product-designer" required />
            </Field>
            <label className="flex min-h-10 items-center gap-3 rounded-control border border-line bg-bg px-3 py-2">
              <input type="checkbox" checked={draft.isPublished} onChange={event => updateDraft('isPublished', event.target.checked)} className="h-4 w-4 accent-accent" />
              <span>
                <span className="block text-xs font-medium text-fg">{isId ? 'Publikasikan lowongan' : 'Publish opening'}</span>
                <span className="block mt-0.5 text-[10px] text-muted">{draft.isPublished ? 'Visible on public site' : 'Saved as draft'}</span>
              </span>
            </label>
          </section>

          <div data-ams-drawer-layout="sections" className="grid min-w-0 gap-4 xl:grid-cols-2">
            <section className="cms-career-language-panel min-w-0 space-y-4 rounded-card border border-line bg-bg p-4">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-badge border border-line bg-panel text-[10px] font-semibold text-fg">EN</span>
                <h3 className="text-xs font-semibold text-fg">English content</h3>
              </div>
              <div className="cms-career-editor-group space-y-3">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Role details</h4>
                <Field label="Job title" required><input className={inputClass} value={draft.title} onChange={event => {
                const title = event.target.value;
                setDraft(current => ({ ...current, title, slug: editorMode === 'create' && (!current.slug || current.slug === slugify(current.title)) ? slugify(title) : current.slug }));
              }} required placeholder="Frontend Engineer" /></Field>
              <Field label="Department" required><input className={inputClass} value={draft.department} onChange={event => updateDraft('department', event.target.value)} required placeholder="Innovation Development" /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Location"><input className={inputClass} value={draft.location} onChange={event => updateDraft('location', event.target.value)} placeholder="South Tangerang / Remote" /></Field>
                <Field label="Workplace"><input className={inputClass} value={draft.workplace} onChange={event => updateDraft('workplace', event.target.value)} placeholder="Hybrid / Remote / WFO" /></Field>
                <Field label="Employment type"><input className={inputClass} value={draft.type} onChange={event => updateDraft('type', event.target.value)} placeholder="Full Time / Contract" /></Field>
                <Field label="Badge"><input className={inputClass} value={draft.badge} onChange={event => updateDraft('badge', event.target.value)} placeholder="Full Time • On-site" /></Field>
              </div>
              </div>
              <div className="cms-career-editor-group space-y-3">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Description & compensation</h4>
                <Field label="Short description"><textarea className={textareaClass} value={draft.summary} onChange={event => updateDraft('summary', event.target.value)} placeholder="Describe the role and its impact..." /></Field>
              <Field label="Compensation"><input className={inputClass} value={draft.compensation} onChange={event => updateDraft('compensation', event.target.value)} placeholder="Salary, benefits, or commission" /></Field>
              </div>
              <div className="cms-career-editor-group space-y-3">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Responsibilities & requirements</h4>
              <Field label="Responsibilities (one per line)"><textarea data-ams-drawer-size="large" className={textareaClass + ' min-h-[130px]'} value={listToText(draft.responsibilities)} onChange={event => updateDraft('responsibilities', textToList(event.target.value))} placeholder={'Own the feature lifecycle\nCollaborate with design and engineering'} /></Field>
              <Field label="Requirements (one per line)"><textarea data-ams-drawer-size="large" className={textareaClass + ' min-h-[130px]'} value={listToText(draft.requirements)} onChange={event => updateDraft('requirements', textToList(event.target.value))} placeholder={'Strong portfolio\nClear written communication'} /></Field>
              </div>
            </section>

            <section className="cms-career-language-panel min-w-0 space-y-4 rounded-card border border-line bg-bg p-4">
              <div className="flex items-center gap-2 border-b border-line pb-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-badge border border-line bg-panel text-[10px] font-semibold text-fg">ID</span>
                <h3 className="text-xs font-semibold text-fg">Konten Bahasa Indonesia</h3>
              </div>
              <div className="cms-career-editor-group space-y-3">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Informasi peran</h4>
                <Field label="Judul lowongan" required><input className={inputClass} value={draft.titleId} onChange={event => updateDraft('titleId', event.target.value)} required placeholder="Frontend Engineer" /></Field>
              <Field label="Departemen" required><input className={inputClass} value={draft.departmentId} onChange={event => updateDraft('departmentId', event.target.value)} required placeholder="Innovation Development" /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Lokasi"><input className={inputClass} value={draft.locationId} onChange={event => updateDraft('locationId', event.target.value)} placeholder="Tangerang Selatan / Remote" /></Field>
                <Field label="Pengaturan kerja"><input className={inputClass} value={draft.workplaceId} onChange={event => updateDraft('workplaceId', event.target.value)} placeholder="Hybrid / Remote / WFO" /></Field>
                <Field label="Jenis pekerjaan"><input className={inputClass} value={draft.typeId} onChange={event => updateDraft('typeId', event.target.value)} placeholder="Full Time / Kontrak" /></Field>
                <Field label="Badge"><input className={inputClass} value={draft.badgeId} onChange={event => updateDraft('badgeId', event.target.value)} placeholder="Full Time • On-site" /></Field>
              </div>
              </div>
              <div className="cms-career-editor-group space-y-3">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Deskripsi & kompensasi</h4>
                <Field label="Deskripsi singkat"><textarea className={textareaClass} value={draft.summaryId} onChange={event => updateDraft('summaryId', event.target.value)} placeholder="Jelaskan peran, tanggung jawab, dan dampaknya..." /></Field>
              <Field label="Kompensasi"><input className={inputClass} value={draft.compensationId} onChange={event => updateDraft('compensationId', event.target.value)} placeholder="Gaji, benefit, atau komisi" /></Field>
              </div>
              <div className="cms-career-editor-group space-y-3">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Tanggung jawab & persyaratan</h4>
              <Field label="Tanggung jawab (satu per baris)"><textarea className={textareaClass + ' min-h-[130px]'} value={listToText(draft.responsibilitiesId)} onChange={event => updateDraft('responsibilitiesId', textToList(event.target.value))} placeholder={'Mengelola proses delivery fitur\nBerkolaborasi dengan tim desain dan engineering'} /></Field>
              <Field label="Persyaratan (satu per baris)"><textarea className={textareaClass + ' min-h-[130px]'} value={listToText(draft.requirementsId)} onChange={event => updateDraft('requirementsId', textToList(event.target.value))} placeholder={'Portofolio yang relevan\nKomunikasi tertulis yang baik'} /></Field>
              </div>
            </section>
          </div>
        </form>
      </Drawer>
    </AdminPageShell>
  );
};

export default AdminCmsCareers;
