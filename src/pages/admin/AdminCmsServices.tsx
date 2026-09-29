import React, { useState } from 'react';
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
import { allSolutionsAndServices, ServiceItemData } from '../../data/servicesData';
import { useLanguage } from '../../lib/LanguageContext';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { api } from '../../lib/apiClient';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { AdminMetricStrip, AdminModuleHeader } from '../../components/admin/AdminModulePrimitives';

export const AdminCmsServices: React.FC = () => {
  const { language } = useLanguage();
  const [servicesList, setServicesList] = useState<ServiceItemData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
          setServicesList(res.data.services as ServiceItemData[]);
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

  const filtered = servicesList.filter((s) => {
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      s.title.toLowerCase().includes(q) ||
      (s.heroHeadline && s.heroHeadline.toLowerCase().includes(q)) ||
      (s.heroSubtitle && s.heroSubtitle.toLowerCase().includes(q)) ||
      s.slug.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

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

    const res = await api.cms.createService(newService);
    if (!res.success) { setStatusMessage(res.error || 'Service could not be created.'); return; }
    setServicesList((current) => [newService, ...current]);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewSlug('');
    setNewHeadline('');
    setNewSubtitle('');
    setStatusMessage(language === 'id' ? `Layanan "${newTitle}" berhasil ditambahkan ke CMS!` : `Service "${newTitle}" successfully added to CMS!`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleDeleteService = async (slug: string) => {
    setDeleteTarget(slug);
  };

  const confirmDeleteService = async () => {
    if (!deleteTarget) return;
    const slug = deleteTarget;
    setDeleteTarget(null);
    const res = await api.cms.deleteService(slug);
    if (!res.success) { setStatusMessage(res.error || 'Service could not be deleted.'); return; }
    setServicesList(servicesList.filter(s => s.slug !== slug));
    setStatusMessage('Service deleted successfully.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={language === 'id' ? 'Hapus layanan?' : 'Delete service?'}
          description={language === 'id' ? 'Layanan ini akan dihapus dari CMS.' : 'This service will be removed from the CMS.'}
          confirmLabel={language === 'id' ? 'Hapus' : 'Delete'}
          onConfirm={() => void confirmDeleteService()}
        />
      
      <AdminModuleHeader
        icon={<Layers size={20} />}
        eyebrow={
          <>
            <Cpu size={14} className="text-accent" />
            <span>Service Catalog & Execution Engine</span>
          </>
        }
        title="Agency Services (SEO & Dev)"
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
        <div className="p-3.5 rounded-card bg-success/10 border border-success/30 text-success text-xs font-sans flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <CheckCircle2 size={16} className="text-success" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-muted hover:text-fg">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Catalog metrics */}
      <AdminMetricStrip
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

      {/* Category Pills & Search */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-panel p-4 rounded-card border border-line">
        <div className="flex flex-nowrap items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:overflow-visible sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-control text-xs font-sans transition-all ${
                selectedCategory === cat
                  ? 'bg-panel-hover text-fg font-semibold border border-line'
                  : 'text-muted border border-transparent hover:text-fg hover:bg-panel'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'id' ? 'Cari layanan berdasarkan nama atau slug...' : 'Search service by name or slug...'}
            className="w-full pl-9 pr-3 py-2 bg-panel border border-line rounded-control text-xs text-fg placeholder:text-muted focus:outline-none focus:border-accent font-sans transition-colors min-h-10 py-2.5"
          />
        </div>
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
          <button type="button" onClick={() => window.location.reload()} className="mt-4 min-h-10 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">Retry</button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
        {filtered.map((item) => (
          <div
            key={item.slug}
            className="w-full h-full bg-panel border border-line rounded-card p-4 flex flex-col justify-between hover:border-line transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {getCategoryIcon(item.category)}
                  <span className="text-[10px] font-sans text-muted normal-case tracking-normal font-semibold">
                    {item.category}
                  </span>
                </div>
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-badge bg-success/10 border border-success/30 text-success font-semibold">
                  {item.badgeId || item.badge || 'Active'}
                </span>
              </div>

              <h3 className="text-base font-semibold font-sans text-fg mb-1.5 group-hover:text-accent transition-colors">
                {item.title}
              </h3>
              
              <p className="text-xs text-muted leading-relaxed mb-4 line-clamp-2">
                {item.heroSubtitle || item.heroSubtitleId}
              </p>

              {/* Core Capabilities Preview */}
              <div className="space-y-1.5 mb-4">
                <div className="text-[10px] font-sans text-muted normal-case tracking-normal font-semibold">
                  Core Capabilities:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.capabilities.slice(0, 3).map((c, idx) => (
                    <span key={idx} className="text-[10px] font-sans px-2 py-0.5 rounded-control bg-panel text-fg border border-line">
                      {c.title || c.titleId}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tech Stack / Tools */}
              {item.tools && item.tools.length > 0 && (
                <div className="pt-2 border-t border-line mb-3 flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                  <span className="text-[10px] font-sans text-muted shrink-0">Tech:</span>
                  {item.tools.slice(0, 4).map((tool, tIdx) => (
                    <span key={tIdx} className="text-[9px] font-sans text-muted bg-panel px-1.5 py-0.5 rounded-badge border border-line shrink-0">
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-between text-xs font-sans text-muted">
              <span className="truncate max-w-[120px]">/{item.slug}</span>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={() => setSelectedServiceForDetail(item)}
                  className="px-2.5 py-1 rounded-control bg-panel hover:bg-panel-hover border border-line text-fg text-[11px] font-sans flex items-center gap-1 transition-colors"
                >
                  <Eye size={12} className="text-muted" />
                  <span>Inspect</span>
                </button>
                <a
                  href={`https://kapitech.id/services/${item.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-control bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 text-[11px] font-sans flex items-center gap-1 transition-colors"
                >
                  <span>Live</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>

          </div>
        ))}

        </div>
      )}
      {/* Service Detail / Inspection Modal */}
      <Modal open={!!selectedServiceForDetail} onClose={() => setSelectedServiceForDetail(null)} size="lg" title={selectedServiceForDetail?.title || 'Service detail'} description={selectedServiceForDetail?.heroSubtitle || selectedServiceForDetail?.heroSubtitleId}>
            <div className="flex items-center gap-2 font-sans text-xs text-accent font-semibold mb-2">
              <span>{selectedServiceForDetail.category}</span>
              <span>•</span>
              <span className="text-muted">/{selectedServiceForDetail.slug}</span>
            </div>

            <h2 className="text-xl font-sans font-semibold text-fg mb-2">
              {selectedServiceForDetail.title}
            </h2>
            <p className="text-xs text-muted mb-5 leading-relaxed">
              {selectedServiceForDetail.heroSubtitle || selectedServiceForDetail.heroSubtitleId}
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
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
              <div className="space-y-2">
                {selectedServiceForDetail.capabilities?.map((cap, cIdx) => (
                  <div key={cIdx} className="bg-panel border border-line p-4 rounded-card">
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
                    <div key={sIdx} className="bg-panel border border-line p-4 rounded-card">
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

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-4 border-t border-line">
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
      </Modal>

      {/* Add New Service Modal */}
      <Drawer
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        size="lg"
        title="Add New Agency Service Offering"
        description="Publish a new technical capability or SEO service package into the agency catalog."
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="service-form">Publish Service</Button>
          </>
        )}
      >
            <form id="service-form" onSubmit={handleCreateService} className="space-y-4 text-xs font-sans">
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
                  className="w-full px-3 py-2.5 rounded-control bg-panel border border-line text-fg focus:outline-none focus:border-accent min-h-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted mb-1 font-medium">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="e.g. enterprise-seo"
                    className="w-full px-3 py-2 rounded-card bg-panel border border-line text-fg font-sans text-[11px] focus:outline-none focus:border-accent"
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
                  className="w-full px-3 py-2.5 rounded-control bg-panel border border-line text-fg focus:outline-none focus:border-accent min-h-10"
                />
              </div>

              <div>
                <label className="block text-muted mb-1 font-medium">Description & Scope Overview</label>
                <textarea
                  rows={2}
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="Explain client value proposition, measurable KPI improvements, and SLA guarantee..."
                  className="w-full px-3 py-2.5 rounded-control bg-panel border border-line text-fg focus:outline-none focus:border-accent min-h-10"
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
                    className="flex-1 px-3 py-1.5 rounded-card bg-panel border border-line text-fg text-xs focus:outline-none focus:border-accent"
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

    </div>
  );
};

export default AdminCmsServices;

