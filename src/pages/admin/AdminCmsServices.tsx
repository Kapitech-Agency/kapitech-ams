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
import { Modal } from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { AdminDataTableShell, AdminFilterBar, AdminMetricStrip, AdminModuleHeader, AdminModuleNotice, AdminPageShell, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';


const normalizeCmsService = (service: ServiceItemData | null | undefined): ServiceItemData => {
  const source = (service || {}) as Partial<ServiceItemData>;
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
  const [servicesList, setServicesList] = useState<ServiceItemData[]>([]);
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
  const [editingService, setEditingService] = useState<ServiceItemData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedServiceForDetail, setSelectedServiceForDetail] = useState<ServiceItemData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletingService, setDeletingService] = useState(false);

  // New Service Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newCategory, setNewCategory] = useState<'Solutions' | 'Branding' | 'Design' | 'Development'>('Development');
  const [newHeadline, setNewHeadline] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newCapability, setNewCapability] = useState('');
  const [tempCapabilities, setTempCapabilities] = useState<string[]>([]);

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

  const handleAddTempCapability = () => {
    if (newCapability.trim()) {
      setTempCapabilities([...tempCapabilities, newCapability.trim()]);
      setNewCapability('');
    }
  };

  const handleRemoveTempCapability = (index: number) => {
    setTempCapabilities(tempCapabilities.filter((_, i) => i !== index));
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSlug) return;

    const newService: ServiceItemData = {
      slug: newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      type: 'service',
      category: newCategory,
      title: newTitle,
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
      capabilities: tempCapabilities.map(cap => ({
        title: cap,
        titleId: cap,
        desc: 'Production-ready delivery adhering to modern web standards and security benchmarks.',
        descId: 'Eksekusi produksi sesuai standar arsitektur modern dan keamanan data.'
      })),
      processStages: [],
      businessOutcomes: { heading: '', headingId: '', benefits: [], benefitsId: [] },
      tools: [],
      faqs: []
    };

    try {
      const res = await api.cms.createService(newService);
      if (!res.success) {
        setStatusMessage(res.error || 'Service could not be created.');
        return;
      }
      setServicesList((current) => [newService, ...current]);
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewSlug('');
      setNewHeadline('');
      setNewSubtitle('');
      setStatusMessage(language === 'id' ? `Layanan "${newTitle}" berhasil ditambahkan ke CMS!` : `Service "${newTitle}" successfully added to CMS!`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Service could not be created.');
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleDeleteService = async (slug: string) => {
    setDeleteTarget(slug);
  };

  const confirmDeleteService = async () => {
    if (!deleteTarget || deletingService) return;
    const slug = deleteTarget;
    setDeletingService(true);
    try {
      const res = await api.cms.deleteService(slug);
      if (!res.success) {
        setStatusMessage(res.error || 'Service could not be deleted.');
        return;
      }
      setServicesList(current => current.filter(s => s.slug !== slug));
      setStatusMessage('Service deleted successfully.');
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
          <>
            <span className="text-xs tabular-nums text-muted">{servicesList.length} offerings</span>
            <Button
              type="button"
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add service
            </Button>
          </>
        }
      />


      

      {statusMessage && (
        <AdminModuleNotice
          tone={/failed|could not|unable|error|gagal|wajib|required/i.test(statusMessage) ? 'danger' : 'success'}
          onDismiss={() => setStatusMessage(null)}
        >
          {statusMessage}
        </AdminModuleNotice>
      )}

      <AdminMetricStrip slug="cms-services-kpis"
        className="grid-cols-2 sm:grid-cols-4"
        metrics={[
          {
            id: 'total-services',
            label: 'Total services',
            value: servicesList.length,
            icon: <Layers size={15} />,
            toneClassName: 'text-accent-text'
          },
          {
            id: 'development-services',
            label: 'Development',
            value: servicesList.filter((item) => item.category === 'Development').length,
            icon: <Code size={15} />,
            toneClassName: 'text-accent-text'
          },
          {
            id: 'design-services',
            label: 'Design',
            value: servicesList.filter((item) => item.category === 'Design').length,
            icon: <PenTool size={15} />,
            toneClassName: 'text-info'
          },
          {
            id: 'active-categories',
            label: 'Categories used',
            value: new Set(servicesList.map((item) => item.category)).size,
            icon: <Sliders size={15} />,
            toneClassName: 'text-success'
          }
        ]}
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
            <button type="button" onClick={() => setIsAddModalOpen(true)} className="mt-4 min-h-10 rounded-control bg-accent px-3 text-xs font-medium text-white hover:bg-accent-hover">Add service</button>
          )}
        </div>
      ) : (
        <AdminDataTableShell slug="cms-services-directory">
          <div data-ams-feature-slug="cms-services-table-scroll" data-ams-slug="cms-services-table-scroll" className="overflow-x-auto custom-scrollbar">
          <table className="ams-data-table w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-line bg-bg text-[10px] font-medium text-muted">
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
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
                  <td className="px-4 py-2.5"><span className="inline-flex rounded-badge border border-success/20 bg-success/10 px-2 py-1 text-[10px] font-semibold text-success">{item.badgeId || item.badge || 'Active'}</span></td>
                  <td className="max-w-[250px] px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {item.capabilities.slice(0, 2).map((cap, index) => <span key={index} className="rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[9px] text-muted">{cap.title || cap.titleId}</span>)}
                      {item.capabilities.length > 2 && <span className="rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[9px] text-muted">+{item.capabilities.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><span className="font-mono text-[10px] text-muted">/{item.slug}</span></td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" onClick={() => setSelectedServiceForDetail(item)} className="inline-flex h-8 items-center gap-1.5 rounded-control border border-line bg-bg px-2.5 text-[10px] font-medium text-fg hover:bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Eye size={12} />Inspect</button>
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
      <Modal slug="cms-service-detail-modal" open={!!selectedServiceForDetail} onClose={() => setSelectedServiceForDetail(null)} size="lg" title={selectedServiceForDetail?.title || 'Service detail'} description={selectedServiceForDetail?.heroSubtitle || selectedServiceForDetail?.heroSubtitleId}>
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
                          <span key={dIdx} className="text-[9px] font-sans bg-panel text-success px-1.5 py-0.5 rounded-badge border border-line">
                            ✓ {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleDeleteService(selectedServiceForDetail.slug)}
                icon={<Trash2 size={13} />}
              >
                Delete Offering
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button type="button" variant="secondary" onClick={() => setSelectedServiceForDetail(null)}>Close</Button>
                <a
                  href={`https://kapitech.id/services/${selectedServiceForDetail.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-sans font-semibold flex items-center gap-1 transition-all"
                >
                  <span>Open Public Page</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Add New Service Modal */}
      <Drawer slug="cms-service-editor-drawer"
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        size="lg"
        title="Add agency service"
        description="Create a service entry for the public agency catalog."
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="service-form">Publish Service</Button>
          </>
        )}
      >
            <form id="service-form" data-ams-feature-slug="cms-service-form" data-ams-slug="cms-service-form" onSubmit={handleCreateService} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-muted mb-1 font-medium">Service Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
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
                      <span className="text-fg truncate">{cap}</span>
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

            </form>
      </Drawer>

    </AdminPageShell>
  );
};

export default AdminCmsServices;

