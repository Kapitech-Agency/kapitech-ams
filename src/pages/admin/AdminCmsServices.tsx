import React, { useEffect, useState } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Code, 
  Palette, 
  Cpu, 
  SearchCode, 
  FileCode2, 
  PenTool, 
  CheckCircle2, 
  ArrowUpRight,
  ShieldCheck,
  X,
  Clock,
  Eye,
  Sliders,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import type { ServiceItemData } from '../../data/servicesData';
import { useLanguage } from '../../lib/LanguageContext';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { api } from '../../lib/apiClient';
import { Drawer } from '../../components/ui/Drawer';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { AdminDataTableShell, AdminFilterBar, AdminModuleHeader, AdminModuleNotice, AdminPageShell, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';


type CmsServiceRecord = ServiceItemData & {
  id?: string;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
type CmsServiceCapability = ServiceItemData['capabilities'][number];

const normalizeCmsService = (service: CmsServiceRecord | ServiceItemData | null | undefined): CmsServiceRecord => {
  const source = (service || {}) as Partial<CmsServiceRecord>;
  const title = typeof source.title === 'string' && source.title.trim() ? source.title.trim() : 'Untitled service';
  const slug = typeof source.slug === 'string' && source.slug.trim()
    ? source.slug.trim()
    : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const type: ServiceItemData['type'] = source.type === 'solution' ? 'solution' : 'service';
  const category: ServiceItemData['category'] =
    source.category === 'Solutions' || source.category === 'Branding' || source.category === 'Design' || source.category === 'Development'
      ? source.category
      : 'Development';

  return {
  ...source,
  slug,
  type,
  category,
  title,
  navSubtitle: source.navSubtitle || '',
  navSubtitleId: source.navSubtitleId || '',
  heroHeadline: source.heroHeadline || '',
  heroHeadlineId: source.heroHeadlineId || '',
  heroSubtitle: source.heroSubtitle || '',
  heroSubtitleId: source.heroSubtitleId || '',
  badge: source.badge || 'Active',
  badgeId: source.badgeId || source.badge || 'Active',
  metrics: Array.isArray(service.metrics) ? service.metrics : [],
  testimonial: source.testimonial || { quote: '', quoteId: '', highlight: '', highlightId: '', author: '', role: '', company: '', avatar: '' },
  caseStudySlugs: Array.isArray(source.caseStudySlugs) ? source.caseStudySlugs : [],
  problemsSolutions: Array.isArray(source.problemsSolutions) ? source.problemsSolutions : [],
  capabilities: Array.isArray(source.capabilities) ? source.capabilities : [],
  processStages: Array.isArray(source.processStages) ? source.processStages : [],
  businessOutcomes: source.businessOutcomes || { heading: '', headingId: '', benefits: [], benefitsId: [] },
  tools: Array.isArray(source.tools) ? source.tools : [],
  faqs: Array.isArray(source.faqs) ? source.faqs : []
  };
};

export const AdminCmsServices: React.FC = () => {
  const { language } = useLanguage();
  const [servicesList, setServicesList] = useState<CmsServiceRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Backend is the only CMS source of truth.
  React.useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setLoadError(null);
    void api.cms.getServices()
      .then((res) => {
        if (!mounted) return;
        if (res.success && Array.isArray(res.data?.services)) {
          setServicesList((Array.isArray(res.data.services) ? res.data.services : []).filter(Boolean).map(normalizeCmsService));
        } else {
          setLoadError(res.error || (language === 'id' ? 'Daftar layanan gagal dimuat.' : 'Services could not be loaded.'));
        }
      })
      .catch(() => {
        if (mounted) setLoadError(language === 'id' ? 'Daftar layanan gagal dimuat. Coba lagi.' : 'Services could not be loaded. Try again.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, [language]);

  // Modals & Editing State
  const [editingService, setEditingService] = useState<CmsServiceRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedServiceForDetail, setSelectedServiceForDetail] = useState<CmsServiceRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CmsServiceRecord | null>(null);
  const [deletingService, setDeletingService] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [publishingServiceId, setPublishingServiceId] = useState<string | null>(null);

  // New Service Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newCategory, setNewCategory] = useState<'Solutions' | 'Branding' | 'Design' | 'Development'>('Development');
  const [newHeadline, setNewHeadline] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newIsPublished, setNewIsPublished] = useState(false);
  const [newCapability, setNewCapability] = useState('');
  const [tempCapabilities, setTempCapabilities] = useState<CmsServiceCapability[]>([]);

  const categories = ['All', 'Development', 'Design', 'Branding', 'Solutions'];

  const filtered = servicesList.filter((service) => {
    const matchesCat = selectedCategory === 'All' || service.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const searchable = [service.title, service.heroHeadline, service.heroSubtitle, service.slug]
      .map((value) => String(value || '').toLowerCase());
    return matchesCat && (!q || searchable.some((value) => value.includes(q)));
  });
  const totalServicePages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedServices = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [searchQuery, selectedCategory, pageSize]);
  useEffect(() => { setPage((current) => Math.min(current, totalServicePages)); }, [totalServicePages]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Design':
        return <Palette size={14} className="text-series-3" />;
      case 'Development':
        return <Code size={14} className="text-accent-text" />;
      case 'Branding':
        return <Sparkles size={14} className="text-warning" />;
      case 'Solutions':
      default:
        return <Cpu size={14} className="text-success" />;
    }
  };

  const openServiceEditor = (service?: CmsServiceRecord) => {
    setStatusMessage(null);
    setEditingService(service || null);
    setNewTitle(service?.title || '');
    setNewSlug(service?.slug || '');
    setNewCategory(service?.category || 'Development');
    setNewHeadline(service?.heroHeadline || '');
    setNewSubtitle(service?.heroSubtitle || '');
    setNewBadge(service?.badge || '');
    setNewIsPublished(service?.isPublished === true);
    setTempCapabilities(Array.isArray(service?.capabilities) ? service.capabilities.map((item) => ({ ...item })) : []);
    setNewCapability('');
    setIsAddModalOpen(true);
  };

  const resetServiceEditor = () => {
    setIsAddModalOpen(false);
    setEditingService(null);
    setNewTitle('');
    setNewSlug('');
    setNewCategory('Development');
    setNewHeadline('');
    setNewSubtitle('');
    setNewBadge('');
    setNewIsPublished(false);
    setNewCapability('');
    setTempCapabilities([]);
  };

  const handleAddTempCapability = () => {
    const title = newCapability.trim();
    if (!title) return;
    setTempCapabilities((current) => [...current, {
      title,
      titleId: title,
      desc: 'Production-ready delivery adhering to modern web standards and security benchmarks.',
      descId: 'Eksekusi produksi sesuai standar arsitektur modern dan keamanan data.'
    }]);
    setNewCapability('');
  };

  const handleRemoveTempCapability = (index: number) => {
    setTempCapabilities((current) => current.filter((_, i) => i !== index));
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingService) return;
    const title = newTitle.trim();
    const slug = newSlug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!title || !slug) {
      setStatusMessage(language === 'id' ? 'Judul layanan dan URL slug wajib diisi.' : 'Service title and URL slug are required.');
      return;
    }
    if (editingService && !editingService.id) {
      setStatusMessage(language === 'id'
        ? 'Layanan ini belum memiliki ID CMS sehingga tidak dapat diedit dengan aman. Muat ulang data atau hubungi administrator.'
        : 'This service has no CMS record ID and cannot be safely edited. Reload the records or contact an administrator.');
      return;
    }

    const payload: CmsServiceRecord = editingService
      ? {
          ...editingService,
          slug,
          title,
          category: newCategory,
          heroHeadline: newHeadline,
          heroSubtitle: newSubtitle,
          badge: newBadge,
          capabilities: tempCapabilities.map((item) => ({ ...item })),
          isPublished: newIsPublished
        }
      : {
          slug,
          type: 'service',
          category: newCategory,
          title,
          navSubtitle: newHeadline,
          navSubtitleId: newHeadline,
          heroHeadline: newHeadline,
          heroHeadlineId: newHeadline,
          heroSubtitle: newSubtitle,
          heroSubtitleId: newSubtitle,
          badge: newBadge,
          badgeId: newBadge,
          metrics: [],
          testimonial: {
            quote: '', quoteId: '', highlight: '', highlightId: '', author: '', role: '', company: '', avatar: ''
          },
          caseStudySlugs: [],
          problemsSolutions: [],
          capabilities: tempCapabilities.map((item) => ({ ...item })),
          processStages: [],
          businessOutcomes: { heading: '', headingId: '', benefits: [], benefitsId: [] },
          tools: [],
          faqs: [],
          isPublished: newIsPublished
        };

    setSavingService(true);
    setStatusMessage(null);
    try {
      const response = editingService?.id
        ? await api.cms.updateService(editingService.id, payload)
        : await api.cms.createService(payload);
      if (!response.success) {
        setStatusMessage(response.error || (language === 'id' ? 'Layanan gagal disimpan.' : 'Service could not be saved.'));
        return;
      }
      const saved = normalizeCmsService(response.data?.service || payload);
      setServicesList((current) => {
        const withoutSaved = current.filter((item) => saved.id ? item.id !== saved.id : item.slug !== saved.slug);
        return [saved, ...withoutSaved];
      });
      setSelectedServiceForDetail((current) => current && (current.id === saved.id || current.slug === saved.slug) ? saved : current);
      resetServiceEditor();
      setStatusMessage(newIsPublished
        ? (language === 'id' ? 'Layanan disimpan dan dipublikasikan.' : 'Service saved and published.')
        : (language === 'id' ? 'Layanan disimpan sebagai draft.' : 'Service saved as draft.'));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : (language === 'id' ? 'Layanan gagal disimpan.' : 'Service could not be saved.'));
    } finally {
      setSavingService(false);
    }
    window.setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleTogglePublished = async (service: CmsServiceRecord) => {
    if (!service.id || publishingServiceId) {
      setStatusMessage(language === 'id' ? 'Layanan belum memiliki ID CMS yang valid.' : 'Service has no valid CMS record ID.');
      return;
    }
    const nextPublished = service.isPublished !== true;
    setPublishingServiceId(service.id);
    setStatusMessage(null);
    try {
      const response = await api.cms.updateService(service.id, { isPublished: nextPublished });
      if (!response.success) throw new Error(response.error || 'Publication status could not be updated.');
      const saved = normalizeCmsService(response.data?.service || { ...service, isPublished: nextPublished });
      setServicesList((current) => current.map((item) => item.id === service.id ? saved : item));
      setSelectedServiceForDetail((current) => current?.id === service.id ? saved : current);
      setStatusMessage(nextPublished
        ? (language === 'id' ? 'Layanan berhasil dipublikasikan.' : 'Service published successfully.')
        : (language === 'id' ? 'Layanan disimpan sebagai draft dan disembunyikan dari website.' : 'Service unpublished and hidden from the public website.'));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Publication status could not be updated.');
    } finally {
      setPublishingServiceId(null);
      window.setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleDeleteService = async (service: CmsServiceRecord) => {
    if (!service.id) {
      setStatusMessage(language === 'id'
        ? 'Layanan ini belum memiliki ID CMS sehingga tidak dapat dihapus dengan aman.'
        : 'This service has no CMS record ID and cannot be safely deleted.');
      return;
    }
    setDeleteTarget(service);
  };

  const confirmDeleteService = async () => {
    if (!deleteTarget?.id || deletingService) return;
    const target = deleteTarget;
    setDeletingService(true);
    try {
      const response = await api.cms.deleteService(target.id);
      if (!response.success) {
        setStatusMessage(response.error || 'Service could not be deleted.');
        return;
      }
      setServicesList((current) => current.filter((item) => item.id !== target.id));
      setSelectedServiceForDetail((current) => current?.id === target.id ? null : current);
      setStatusMessage(language === 'id' ? 'Layanan berhasil dihapus.' : 'Service deleted successfully.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Service could not be deleted.');
    } finally {
      setDeleteTarget(null);
      setDeletingService(false);
      window.setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <AdminPageShell featureSlug="cms-services-module" className="ams-cms-module">
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => { if (!deletingService) setDeleteTarget(null); }}
          loading={deletingService}
          title={language === 'id' ? 'Hapus layanan?' : 'Delete service?'}
          description={language === 'id' ? 'Layanan ini akan dihapus dari CMS.' : 'This service will be removed from the CMS.'}
          confirmLabel={language === 'id' ? 'Hapus' : 'Delete'}
          onConfirm={() => void confirmDeleteService()}
        />
      
      <AdminModuleHeader slug="cms-services-header"
        className="mb-0"
        title="Services"
        description={
          <>Manage live service offerings, SLA benchmarks, deliverables, and technical capabilities published on <code className="rounded-badge border border-line bg-panel px-1.5 py-0.5 text-fg">/services</code>.</>
        }
        actions={
          <Button
            type="button"
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => openServiceEditor()}
          >
            Add service
          </Button>
        }
      />
      <AdminFilterBar
        slug="cms-services-filters"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search service name, slug, or capability..."
        searchLabel="Search services"
        actions={(
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setPage(1);
            }}
            disabled={!searchQuery && selectedCategory === 'All'}
            className="inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-muted hover:bg-panel hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={13} />
            Reset
          </button>
        )}
      >
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                aria-pressed={active}
                className={[
                  'inline-flex min-h-8 shrink-0 items-center justify-center rounded-chip border px-3 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  active
                    ? 'border-accent/25 bg-accent/10 font-semibold text-fg'
                    : 'border-transparent text-muted hover:bg-bg hover:text-fg'
                ].join(' ')}
              >
                {category}
              </button>
            );
          })}
        </div>
      </AdminFilterBar>

{statusMessage && (
        <AdminModuleNotice
          tone={/failed|could not|unable|error|gagal|wajib|required/i.test(statusMessage) ? 'danger' : 'success'}
          onDismiss={() => setStatusMessage(null)}
        >
          {statusMessage}
        </AdminModuleNotice>
      )}



      <div className="flex items-center justify-between gap-3 text-[11px] text-muted">
        <span>{filtered.length} of {servicesList.length} services</span>
        <span>Service directory</span>
      </div>

      {/* Services List Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full" role="status" aria-label="Loading services">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="rounded-card border border-line bg-panel p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-5 w-40" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1 h-3 w-4/5" />
              <div className="mt-4 flex gap-1.5"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-20" /></div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-card border border-danger/30 bg-danger/10 p-4">
          <p className="text-sm font-semibold text-fg">Unable to load services</p>
          <p className="mt-1 text-xs leading-5 text-muted">{loadError}</p>
          <button type="button" onClick={() => void (async () => {
     setIsLoading(true);
     try {
       const res = await api.cms.getServices();
       if (res.success && Array.isArray(res.data?.services)) {
         setServicesList((res.data.services as ServiceItemData[]).map(normalizeCmsService));
         setLoadError(null);
       } else {
         setLoadError(res.error || 'Services could not be loaded. Try again.');
       }
     } catch {
       setLoadError('Services could not be loaded. Try again.');
     } finally {
       setIsLoading(false);
     }
   })()} className="mt-4 min-h-10 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-card border border-line bg-panel p-10 text-center">
          <p className="text-sm font-semibold text-fg">{servicesList.length === 0 ? 'No services yet' : 'No matching services'}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{servicesList.length === 0 ? 'Add a service before publishing it to the public site.' : 'Adjust the search or category filter.'}</p>
          {servicesList.length === 0 && (
            <button type="button" onClick={() => openServiceEditor()} className="mt-4 min-h-10 rounded-control bg-accent px-3 text-xs font-medium text-white hover:bg-accent-hover">Add service</button>
          )}
        </div>
      ) : (
        <AdminDataTableShell slug="cms-services-directory">
          <div data-ams-feature-slug="cms-services-table-scroll" data-ams-slug="cms-services-table-scroll" className="overflow-x-auto custom-scrollbar" tabIndex={0} role="region" aria-label="Scrollable service register">
          <table className="ams-data-table w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-line bg-bg text-[10px] font-medium text-muted">
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Publication</th>
                <th className="px-4 py-3">Capabilities</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pagedServices.map((item) => (
                <tr key={item.slug} className="h-12 transition-colors hover:bg-bg/60">
                  <td className="px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-bg">{getCategoryIcon(item.category)}</span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-fg">{item.title}</p>
                        <p className="mt-0.5 max-w-[340px] truncate text-[10px] text-muted">{item.heroSubtitle || item.heroSubtitleId || 'No description provided.'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><span className="inline-flex rounded-badge border border-line bg-bg px-2 py-1 text-[10px] text-muted">{item.category}</span></td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      disabled={!item.id || publishingServiceId === item.id}
                      onClick={() => void handleTogglePublished(item)}
                      aria-pressed={item.isPublished === true}
                      className={'inline-flex min-h-7 items-center gap-1.5 rounded-badge border px-2 py-1 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ' + (item.isPublished === true ? 'border-success/20 bg-success/10 text-success' : 'border-line bg-bg text-muted')}
                      title={item.isPublished === true ? 'Unpublish from website' : 'Publish to website'}
                    >
                      {publishingServiceId === item.id ? 'Saving…' : item.isPublished === true ? 'Published' : 'Draft'}
                    </button>
                    <p className="mt-1 text-[10px] text-muted">Badge: {item.badgeId || item.badge || '—'}</p>
                  </td>
                  <td className="max-w-[250px] px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {item.capabilities.slice(0, 2).map((cap, index) => <span key={index} className="rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[10px] text-muted">{cap.title || cap.titleId}</span>)}
                      {item.capabilities.length > 2 && <span className="rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[10px] text-muted">+{item.capabilities.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><span className="font-mono text-[10px] text-muted">/{item.slug}</span></td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" onClick={() => setSelectedServiceForDetail(item)} className="inline-flex h-8 items-center gap-1.5 rounded-control border border-line bg-bg px-2.5 text-[10px] font-medium text-fg hover:bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Eye size={12} />Inspect</button>
                      <button type="button" disabled={!item.id} onClick={() => openServiceEditor(item)} className="inline-flex h-8 items-center gap-1.5 rounded-control border border-line bg-bg px-2.5 text-[10px] font-medium text-fg hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Edit3 size={12} />Edit</button>
                      <a href={`https://kapitech.id/services/${item.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-control border border-accent/25 bg-accent/10 px-2.5 text-[10px] font-medium text-accent-text hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><ExternalLink size={11} />Live</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminTablePagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="services" slug="cms-services-pagination" />
        </AdminDataTableShell>
      )}
      {/* Service Detail / Inspection Modal */}
      <Drawer
        slug="cms-service-detail-drawer"
        open={!!selectedServiceForDetail}
        onClose={() => setSelectedServiceForDetail(null)}
        size="3xl"
        title={selectedServiceForDetail?.title || 'Service detail'}
        description={selectedServiceForDetail?.heroSubtitle || selectedServiceForDetail?.heroSubtitleId}
        footer={selectedServiceForDetail ? (
          <>
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleDeleteService(selectedServiceForDetail)}
              icon={<Trash2 size={13} />}
            >
              Delete offering
            </Button>
            <Button type="button" variant="secondary" onClick={() => { const service = selectedServiceForDetail; setSelectedServiceForDetail(null); openServiceEditor(service); }}><Edit3 size={13} /> Edit service</Button>
            <Button type="button" variant="secondary" loading={publishingServiceId === selectedServiceForDetail.id} disabled={!selectedServiceForDetail.id || publishingServiceId !== null} onClick={() => void handleTogglePublished(selectedServiceForDetail)}>{selectedServiceForDetail.isPublished === true ? 'Unpublish' : 'Publish'}</Button>
            <Button type="button" variant="secondary" onClick={() => setSelectedServiceForDetail(null)}>Close</Button>
            <a
              href={`https://kapitech.id/services/${selectedServiceForDetail.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control bg-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>Open public page</span>
              <ExternalLink size={12} />
            </a>
          </>
        ) : null}
      >
        {selectedServiceForDetail && (
          <>
            <div className="flex items-center gap-2 font-sans text-xs text-accent font-semibold mb-2">
              <span>{selectedServiceForDetail.category}</span>
              <span>•</span>
              <span className="text-muted">/{selectedServiceForDetail.slug}</span>
            </div>

            <h2 className="text-sm font-semibold text-fg mb-1.5">
              {selectedServiceForDetail.title}
            </h2>
            <p className="text-[11px] leading-5 text-muted mb-4">
              {selectedServiceForDetail.heroSubtitle || selectedServiceForDetail.heroSubtitleId}
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 mb-4">
              {selectedServiceForDetail.metrics?.map((m, idx) => (
                <div key={idx} className="bg-panel border border-line p-4 rounded-card text-center">
                  <div className="text-lg font-sans font-semibold text-accent">{m.value}</div>
                  <div className="text-[10px] font-sans text-muted mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Capabilities */}
            <div className="mb-5">
              <h4 className="text-xs font-sans normal-case text-muted font-semibold tracking-normal mb-2">
                Detailed Capabilities & SLA Scope
              </h4>
              <div className="space-y-1.5">
                {selectedServiceForDetail.capabilities?.map((cap, cIdx) => (
                  <div key={cIdx} className="bg-panel border border-line p-3 rounded-card">
                    <div className="text-xs font-semibold text-fg flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-success" />
                      <span>{cap.title || cap.titleId}</span>
                    </div>
                    <p className="text-[11px] text-muted mt-1 pl-5">
                      {cap.desc || cap.descId}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Process Stages */}
            {selectedServiceForDetail.processStages && selectedServiceForDetail.processStages.length > 0 && (
              <div className="mb-5">
                <h4 className="text-xs font-sans normal-case text-muted font-semibold tracking-normal mb-2">
                  Delivery Process & Milestones
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedServiceForDetail.processStages.map((stage, sIdx) => (
                    <div key={sIdx} className="bg-panel border border-line p-3 rounded-card">
                      <div className="flex items-center gap-2 text-accent font-sans text-xs font-semibold mb-1">
                        <span>{stage.stageNumber}</span>
                        <span className="text-fg font-sans font-semibold">{stage.stageName}</span>
                      </div>
                      <p className="text-[11px] text-muted mb-2">{stage.stageDesc}</p>
                      <div className="flex flex-wrap gap-1">
                        {stage.deliverables?.map((d, dIdx) => (
                          <span key={dIdx} className="text-[10px] font-sans bg-panel text-success px-1.5 py-0.5 rounded-badge border border-line">
                            ✓ {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </>
        )}
      </Drawer>

      {/* Add New Service Modal */}
      <Drawer slug="cms-service-editor-drawer"
        open={isAddModalOpen}
        onClose={resetServiceEditor}
        size="lg"
        title={editingService ? 'Edit agency service' : 'Add agency service'}
        description={editingService ? 'Update the service while preserving rich content fields not shown in this editor.' : 'Create a service entry for the public agency catalog.'}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={resetServiceEditor} disabled={savingService}>Cancel</Button>
            <Button type="submit" form="service-form" loading={savingService} disabled={savingService}>{newIsPublished ? 'Save & publish' : 'Save draft'}</Button>
          </>
        )}
      >
            <form id="service-form" data-ams-feature-slug="cms-service-form" data-ams-slug="cms-service-form" onSubmit={handleSaveService} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-muted mb-1 font-medium">Service Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (!editingService || !newSlug) setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                  }}
                  placeholder="e.g. Enterprise SEO & Core Web Vitals"
                  className="ams-control w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-muted mb-1 font-medium">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="e.g. enterprise-seo"
                    className="ams-control w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-muted mb-1 font-medium">Category</label>
                  <CustomSelect value={newCategory} onChange={(value) => setNewCategory(value as any)} options={[{value:'Development',label:'Development'},{value:'Design',label:'Design'},{value:'Branding',label:'Branding'},{value:'Solutions',label:'Solutions'}]} className="w-full" />
                </div>
              </div>

              <div>
                <label className="block text-muted mb-1 font-medium">Hero Headline</label>
                <input
                  type="text"
                  value={newHeadline}
                  onChange={(e) => setNewHeadline(e.target.value)}
                  placeholder="e.g. High-Impact Technical SEO for Scaling Ventures"
                  className="ams-control w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-muted mb-1 font-medium">Description & Scope Overview</label>
                <textarea
                  rows={2}
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="Explain client value proposition, measurable KPI improvements, and SLA guarantee..."
                  className="ams-control w-full text-xs"
                />
              </div>

              {/* Capabilities Manager */}
              <div>
                <label className="block text-muted mb-1 font-medium">Core Deliverables & Capabilities</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCapability}
                    onChange={(e) => setNewCapability(e.target.value)}
                    placeholder="Add deliverable point..."
                    className="ams-control flex-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddTempCapability}
                    className="min-h-10 px-3 py-1.5 rounded-control bg-panel hover:bg-panel-hover border border-line text-fg text-xs font-semibold transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                  {tempCapabilities.map((cap, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-control bg-panel border border-line text-[11px]">
                      <span className="text-fg truncate">{cap.title || cap.titleId}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTempCapability(idx)}
                        className="text-danger hover:bg-accent-hover ml-2"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2 rounded-control border border-line bg-panel p-3">
                <input type="checkbox" checked={newIsPublished} onChange={(event) => setNewIsPublished(event.target.checked)} className="mt-0.5 h-4 w-4 accent-accent" />
                <span>
                  <span className="block text-xs font-medium text-fg">Publish on public website</span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-muted">{newIsPublished ? 'This service will be visible in the public service catalog after saving.' : 'Save as draft. The service remains in AMS and is hidden from public service responses.'}</span>
                </span>
              </label>
            </form>
      </Drawer>

    </AdminPageShell>
  );
};

export default AdminCmsServices;

