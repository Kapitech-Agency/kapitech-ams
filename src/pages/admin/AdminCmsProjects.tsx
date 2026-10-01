import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Star, 
  ExternalLink, 
  Sparkles, 
  Image as ImageIcon, 
  Check, 
  X, 
  Layers, 
  TrendingUp, 
  Globe,
  UploadCloud,
  FileText,
  Eye,
  Sliders,
  Tag
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Drawer } from '../../components/ui/Drawer';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { ProjectItem } from '../../data/projectsData';
import { useLanguage } from '../../lib/LanguageContext';
import { useDragToScroll } from '../../lib/useDragToScroll';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Skeleton } from '../../components/ui/Skeleton';
import { AdminModuleHeader , AdminPageShell } from '../../components/admin/AdminModulePrimitives';

export const AdminCmsProjects: React.FC = () => {
  const { language, t } = useLanguage();
  const galleryScrollRef = useDragToScroll<HTMLDivElement>();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPillar, setFilterPillar] = useState<'All' | 'Visual Experience' | 'Innovation Development'>('All');
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'details' | 'preview'>('details');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Tag inputs state
  const [techInput, setTechInput] = useState('');
  const [deliverableInput, setDeliverableInput] = useState('');
  const [metricLabel, setMetricLabel] = useState('');
  const [metricValue, setMetricValue] = useState('');

  const loadProjects = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.cms.getProjects();
      if (res.success && Array.isArray(res.data?.projects)) {
        setProjects(res.data.projects as ProjectItem[]);
      } else {
        setLoadError(res.error || (language === 'id' ? 'Daftar case study gagal dimuat.' : 'Case studies could not be loaded.'));
      }
    } catch {
      setLoadError(language === 'id' ? 'Daftar case study gagal dimuat. Coba lagi.' : 'Case studies could not be loaded. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const handleOpenAdd = () => {
    const newTemplate: ProjectItem = {
      id: 'project-' + Date.now().toString(36),
      title: '',
      client: '',
      industry: 'FinTech / SaaS Enterprise',
      pillar: 'Innovation Development',
      service: 'Web Application',
      featured: false,
      image: '',
      desc: '',
      descId: '',
      challenge: '',
      challengeId: '',
      solution: '',
      solutionId: '',
      deliverables: [],
      technologies: [],
      impact: [],
      year: new Date().getFullYear().toString()
    };
    setEditingProject(newTemplate);
    setModalTab('details');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: ProjectItem) => {
    setEditingProject({ ...project });
    setModalTab('details');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const confirmDeleteProject = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await api.cms.deleteProject(id);
      if (!res.success) {
        setStatusMessage(res.error || 'Delete failed.');
        return;
      }
      await loadProjects();
      setStatusMessage('Case study deleted successfully.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Delete failed.');
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleToggleFeatured = async (project: ProjectItem) => {
    const nextProject = { ...project, featured: !project.featured };
    try {
      const res = await api.cms.updateProject(nextProject.id, nextProject);
      if (res.success) {
        await loadProjects();
        setStatusMessage(nextProject.featured ? 'Project featured successfully.' : 'Project removed from featured.');
      } else {
        setStatusMessage(res.error || 'Update failed.');
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Update failed.');
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatusMessage(language === 'id' ? 'Hanya file gambar yang didukung (PNG, JPG, WebP, SVG).' : 'Only image files are supported (PNG, JPG, WebP, SVG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage(language === 'id' ? 'Ukuran gambar maksimal 10MB.' : 'Image size must not exceed 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setStatusMessage(language === 'id' ? 'Gambar gagal diproses.' : 'The image could not be processed.');
    };
    reader.onload = (e) => {
      if (e.target?.result && editingProject) {
        setEditingProject({
          ...editingProject,
          image: e.target.result as string
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleAddTech = () => {
    if (!techInput.trim() || !editingProject) return;
    if (!editingProject.technologies.includes(techInput.trim())) {
      setEditingProject({
        ...editingProject,
        technologies: [...editingProject.technologies, techInput.trim()]
      });
    }
    setTechInput('');
  };

  const handleRemoveTech = (techToRemove: string) => {
    if (!editingProject) return;
    setEditingProject({
      ...editingProject,
      technologies: editingProject.technologies.filter(t => t !== techToRemove)
    });
  };

  const handleAddDeliverable = () => {
    if (!deliverableInput.trim() || !editingProject) return;
    if (!editingProject.deliverables.includes(deliverableInput.trim())) {
      setEditingProject({
        ...editingProject,
        deliverables: [...editingProject.deliverables, deliverableInput.trim()]
      });
    }
    setDeliverableInput('');
  };

  const handleRemoveDeliverable = (itemToRemove: string) => {
    if (!editingProject) return;
    setEditingProject({
      ...editingProject,
      deliverables: editingProject.deliverables.filter(d => d !== itemToRemove)
    });
  };

  const handleAddImpactMetric = () => {
    if (!metricLabel.trim() || !metricValue.trim() || !editingProject) return;
    const newImpact = [...(editingProject.impact || []), { label: metricLabel.trim(), value: metricValue.trim() }];
    setEditingProject({
      ...editingProject,
      impact: newImpact
    });
    setMetricLabel('');
    setMetricValue('');
  };

  const handleRemoveImpactMetric = (idx: number) => {
    if (!editingProject || !editingProject.impact) return;
    setEditingProject({
      ...editingProject,
      impact: editingProject.impact.filter((_, i) => i !== idx)
    });
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editingProject.title.trim()) {
      setStatusMessage(language === 'id' ? 'Judul case study wajib diisi.' : 'Project title is required.');
      return;
    }

    try {
      const res = editingProject.id && projects.some(p => p.id === editingProject.id)
        ? await api.cms.updateProject(editingProject.id, editingProject)
        : await api.cms.createProject(editingProject);
      if (!res.success) {
        setStatusMessage(res.error || 'Failed to save case study.');
        return;
      }
      setIsModalOpen(false);
      setEditingProject(null);
      await loadProjects();
      setStatusMessage('Case study published successfully to live site!');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save case study.');
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const filteredProjects = projects.filter((p) => {
    const matchesPillar = filterPillar === 'All' || p.pillar === filterPillar;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      p.title.toLowerCase().includes(query) ||
      p.client.toLowerCase().includes(query) ||
      p.industry.toLowerCase().includes(query) ||
      p.service.toLowerCase().includes(query);
    return matchesPillar && matchesSearch;
  });

  return (
    <AdminPageShell featureSlug="cms-projects-module">
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete case study?"
          description={deleteTarget ? `Case study "${deleteTarget.title}" will be permanently removed.` : 'This case study will be permanently removed.'}
          confirmLabel="Delete"
          onConfirm={() => void confirmDeleteProject()}
        />
      
      <AdminModuleHeader slug="cms-projects-header"
        icon={<Layers size={20} />}
        className="mb-0"
        title={t('admin.nav.cmsProjects')}
        description={language === 'id'
          ? 'Kelola showcase studi kasus dan portofolio agency untuk kapitech.id/work.'
          : 'Manage case studies, portfolio showcases, and technical deliverables at kapitech.id/work.'}
        actions={
          <Button
            type="button"
            variant="primary"
            icon={<Plus size={15} />}
            onClick={handleOpenAdd}
          >
            {language === 'id' ? 'Tambah case study' : 'Add case study'}
          </Button>
        }
      />

      {/* Success alert */}
      {statusMessage && (() => {
        const failed = /failed|could not|unable|error|gagal|wajib|required/i.test(statusMessage);
        return (
          <div className={['p-3.5 rounded-card border text-xs font-sans flex items-center gap-2 animate-in fade-in duration-300', failed ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-success/10 border-success/30 text-success'].join(' ')}>
            {failed ? <X size={15} /> : <Check size={15} />}
            <span>{statusMessage}</span>
          </div>
        );
      })()}

      {/* Portfolio filters */}
      <div className="overflow-hidden rounded-card border border-line bg-panel p-3.5 sm:p-4">
        <div
          className="ams-topnav-scroll w-full overflow-x-auto"
          style={{ overflowX: 'auto' }}
        >
          <div
            className="flex w-max items-center gap-2"
            style={{ flexWrap: 'nowrap', minWidth: 'max-content', whiteSpace: 'nowrap' }}
          >
            <div
              className="relative shrink-0"
              style={{ width: '180px', minWidth: '180px' }}
            >
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                size={14}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'id' ? 'Cari proyek atau klien...' : 'Search projects or clients...'}
                aria-label={language === 'id' ? 'Cari portfolio' : 'Search portfolio'}
                className="h-9 min-h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
              />
            </div>

            <div
              className="inline-flex h-9 shrink-0 items-center rounded-control border border-line bg-bg p-1"
              style={{ flexWrap: 'nowrap' }}
              role="group"
              aria-label="Portfolio pillar filter"
            >
              {[
                { value: 'All', label: language === 'id' ? 'Semua' : 'All' },
                { value: 'Visual Experience', label: 'Visual Experience' },
                { value: 'Innovation Development', label: 'Innovation Development' }
              ].map((option) => {
                const active = filterPillar === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilterPillar(option.value as typeof filterPillar)}
                    aria-pressed={active}
                    className={[
                      "inline-flex h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-chip px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      active
                        ? "border border-accent/25 bg-accent/10 font-semibold text-fg"
                        : "border border-transparent text-muted hover:bg-panel hover:text-fg"
                    ].join(" ")}
                    style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <span
              className="shrink-0 text-[11px] text-muted"
              style={{ whiteSpace: 'nowrap' }}
            >
              {filteredProjects.length} of {projects.length}
            </span>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterPillar('All');
              }}
              disabled={!searchQuery && filterPillar === 'All'}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-control border border-line bg-bg px-2.5 text-[11px] font-medium text-muted transition-colors hover:border-accent/30 hover:bg-panel-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-45"
              style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              aria-label="Reset portfolio filters"
            >
              <X size={13} />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid with Drag-to-scroll support */}
      <div data-ams-feature-slug="cms-projects-directory" data-ams-slug="cms-projects-directory">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" role="status" aria-label="Loading case studies">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="overflow-hidden rounded-card border border-line bg-panel">
              <Skeleton className="h-48 rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex gap-1.5"><Skeleton className="h-5 w-14" /><Skeleton className="h-5 w-16" /></div>
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-card border border-danger/30 bg-danger/10 p-4">
          <p className="text-sm font-semibold text-fg">Unable to load case studies</p>
          <p className="mt-1 text-xs leading-5 text-muted">{loadError}</p>
          <button type="button" onClick={() => void loadProjects()} className="mt-4 min-h-10 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-panel-hover">Retry</button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-card border border-line bg-panel p-10 text-center">
          <p className="text-sm font-semibold text-fg">{projects.length === 0 ? 'No case studies yet' : 'No matching case studies'}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{projects.length === 0 ? 'Add a case study to publish it through the CMS.' : 'Adjust the search or pillar filter.'}</p>
          {projects.length === 0 && (
            <button type="button" onClick={handleOpenAdd} className="mt-4 min-h-10 rounded-control bg-accent px-3 text-xs font-medium text-white hover:bg-accent-hover">Add case study</button>
          )}
        </div>
      ) : (
        <div ref={galleryScrollRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            data-ams-slug={'cms-project-' + project.id}
            className="bg-panel border border-line hover:border-line rounded-card overflow-hidden flex flex-col group transition-all"
          >
            {/* Image Thumbnail */}
            <div className="relative h-48 w-full bg-bg overflow-hidden">
              {project.image ? (
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-panel text-muted">
                  <ImageIcon size={28} aria-hidden="true" />
                </div>
              )}
              <div className="absolute inset-0 bg-bg/30" />

              {/* Badges on image */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-badge text-[10px] font-sans font-semibold border ${
                  project.pillar === 'Visual Experience'
                    ? 'bg-info/10 text-info border-info/30'
                    : 'bg-info/10 text-info border-info/30'
                }`}>
                  {project.pillar}
                </span>
              </div>

              <div className="absolute top-3 right-3 flex items-center gap-1">
                <button
                  onClick={() => handleToggleFeatured(project)}
                  className={`p-1.5 rounded-control border text-xs transition-colors  ${
                    project.featured
                      ? 'bg-warning/10 text-warning border-warning/30'
                      : 'bg-panel text-muted border-line hover:text-fg'
                  }`}
                  title={project.featured ? 'Status: Featured (Click to toggle)' : 'Click to feature'}
                >
                  <Star size={13} fill={project.featured ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-[11px] font-sans text-fg/80">{project.client}</div>
                <div className="text-base font-semibold font-sans text-fg truncate">
                  {project.title}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-4 font-sans text-xs">
              <p className="text-muted line-clamp-2 font-sans text-xs">
                {project.descId || project.desc || 'No case study summary entered.'}
              </p>

              {/* Tech Tags */}
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.slice(0, 4).map((tech, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-sans px-2 py-0.5 rounded-badge bg-panel border border-line text-muted"
                  >
                    {tech}
                  </span>
                ))}
                {project.technologies.length > 4 && (
                  <span className="text-[10px] font-sans px-1.5 py-0.5 rounded-badge bg-panel border border-line text-muted">
                    +{project.technologies.length - 4}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-line flex items-center justify-between">
                <div className="text-[10px] text-muted">
                  Release {project.year || '2025'}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(project)}
                    data-ams-slug={'cms-project-edit-' + project.id}
                    className="p-1.5 rounded-control bg-panel hover:bg-panel-hover text-muted hover:text-fg border border-line transition-colors"
                    title="Edit Case Study"
                  >
                    <Edit3 size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(project.id, project.title)}
                    data-ams-slug={'cms-project-delete-' + project.id}
                    className="p-1.5 rounded-control bg-panel hover:bg-accent/10 text-muted hover:text-danger border border-line hover:border-danger/30 transition-colors"
                    title="Delete Case Study"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        </div>
      )}
      {/* MODAL: ADD / EDIT PROJECT WITH LIVE PREVIEW & DRAG & DROP */}
      </div>

      <Drawer slug="cms-project-editor-drawer"
        open={isModalOpen && !!editingProject}
        onClose={() => setIsModalOpen(false)}
        size="xl"
        title={editingProject?.title ? 'Edit: ' + editingProject.title : 'Add New Case Study'}
        description="Manage the case study content and live card preview."
        footer={modalTab === 'details'
          ? (
            <>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" form="case-study-form">Save Case Study</Button>
            </>
          )
          : (
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Close preview</Button>
          )}
      >
            <div className="flex items-center justify-end border-b border-line pb-3 mb-4">
              <div className="flex items-center rounded-control bg-panel border border-line p-0.5" role="tablist" aria-label="Case study editor">
                <button
                  type="button"
                  role="tab"
                  aria-selected={modalTab === 'details'}
                  onClick={() => setModalTab('details')}
                  className={`px-3 py-1 rounded-chip text-[11px] font-semibold transition-all ${modalTab === 'details' ? 'bg-panel text-fg' : 'text-muted hover:text-fg'}`}
                >
                  Details
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={modalTab === 'preview'}
                  onClick={() => setModalTab('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-chip text-[11px] font-semibold transition-all ${modalTab === 'preview' ? 'bg-panel text-fg' : 'text-muted hover:text-fg'}`}
                >
                  <Eye size={12} />
                  <span>Card Preview</span>
                </button>
              </div>
            </div>

            {modalTab === 'preview' ? (
              <div className="py-6 flex flex-col items-center">
                <div className="text-[11px] text-muted mb-4">
                  Live Showcase Preview (as rendered on <code className="text-fg">kapitech.id/work</code>):
                </div>
                <div className="w-full max-w-sm max-h-[calc(100dvh-24px)] bg-panel border border-line rounded-card overflow-y-auto">
                  <div className="relative h-48 w-full bg-bg">
                    <img src={editingProject.image} alt={editingProject.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-bg/40" />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-badge text-[10px] font-sans font-semibold bg-accent/10 text-accent-text border border-accent/30">
                      {editingProject.pillar}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="text-[10px] text-fg/80">{editingProject.client || 'Client Name'}</div>
                      <div className="text-base font-semibold font-sans text-fg truncate">
                        {editingProject.title || 'Untitled Case Study'}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 font-sans text-xs">
                    <p className="text-muted text-xs font-sans">
                      {editingProject.descId || editingProject.desc || 'No description entered.'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {editingProject.technologies.map((t, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-badge bg-panel border border-line text-muted">
                          {t}
                        </span>
                      ))}
                    </div>
                    {editingProject.impact && editingProject.impact.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-line">
                        {editingProject.impact.map((imp, idx) => (
                          <div key={idx} className="bg-panel p-2 rounded-control border border-line">
                            <div className="text-[9px] text-muted normal-case">{imp.label}</div>
                            <div className="text-xs font-semibold text-success">{imp.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <form id="case-study-form" data-ams-feature-slug="cms-project-form" data-ams-slug="cms-project-form" onSubmit={handleSaveModal} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-muted mb-1 font-semibold">Project Title *</label>
                    <input
                      type="text"
                      required
                      value={editingProject.title}
                      onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                      placeholder="e.g. Bank Digital Nusantara Mobile"
                      className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-muted mb-1 font-semibold">Client Name / Company</label>
                    <input
                      type="text"
                      value={editingProject.client}
                      onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                      placeholder="PT Bank Digital Nusantara"
                      className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-muted mb-1 font-semibold">Studio Pillar</label>
                    <CustomSelect value={editingProject.pillar} onChange={(value) => setEditingProject({ ...editingProject, pillar: value as any })} options={[{value:'Visual Experience',label:'Visual Experience'},{value:'Innovation Development',label:'Innovation Development'}]} className="w-full" />
                  </div>

                  <div>
                    <label className="block text-muted mb-1 font-semibold">Service Category</label>
                    <input
                      type="text"
                      value={editingProject.service}
                      onChange={(e) => setEditingProject({ ...editingProject, service: e.target.value as any })}
                      placeholder="UI/UX Design, Web Application..."
                      className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-muted mb-1 font-semibold">Release Year</label>
                    <input
                      type="text"
                      value={editingProject.year}
                      onChange={(e) => setEditingProject({ ...editingProject, year: e.target.value })}
                      placeholder="2025"
                      className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent font-sans"
                    />
                  </div>
                </div>

                {/* Drag & Drop File Upload or URL */}
                <div>
                  <label className="block text-muted mb-1 font-semibold">
                    Cover Image (Drag & Drop File or URL)
                  </label>
                  
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-control p-4 text-center transition-all ${
                      isDraggingFile 
                        ? 'border-accent bg-accent/10' 
                        : 'border-line bg-panel hover:border-line'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      {editingProject.image ? (
                        <div className="relative w-36 h-20 rounded-control overflow-hidden border border-line mb-1">
                          <img src={editingProject.image} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <UploadCloud className="text-muted" size={28} />
                      )}
                      
                      <div className="text-fg">
                        <span>Drag & drop image here, or </span>
                        <label className="text-danger cursor-pointer hover:underline font-semibold">
                          browse file
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-muted">PNG, JPG, WebP up to 10MB</p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <input
                      type="url"
                      value={editingProject.image}
                      onChange={(e) => setEditingProject({ ...editingProject, image: e.target.value })}
                      placeholder="Or paste direct image URL (https://...)"
                      className="w-full px-3.5 py-2 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-muted mb-1 font-semibold">Short Executive Summary</label>
                  <textarea
                    rows={2}
                    value={editingProject.descId || editingProject.desc}
                    onChange={(e) => setEditingProject({ ...editingProject, descId: e.target.value, desc: e.target.value })}
                    placeholder="Brief description of the solution delivered for client..."
                    className="w-full px-3.5 py-2 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent font-sans text-xs"
                  />
                </div>

                {/* Tech Stack Chip Manager */}
                <div>
                  <label className="block text-muted mb-1 font-semibold">Tech Stack & Frameworks</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTech(); } }}
                      placeholder="Type tech name and press Enter (e.g. Next.js 14, Tailwind, Go)..."
                      className="flex-1 px-3.5 py-2 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={handleAddTech}
                      className="min-h-10 px-3.5 py-2 rounded-control bg-panel hover:bg-panel text-fg border border-line"
                    >
                      Add Tag
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {editingProject.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-panel border border-line text-fg text-[11px]"
                      >
                        <span>{tech}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTech(tech)}
                          className="text-muted hover:text-danger"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Impact Metrics Editor */}
                <div>
                  <label className="block text-muted mb-1 font-semibold">Impact Metrics & Key Results</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={metricLabel}
                      onChange={(e) => setMetricLabel(e.target.value)}
                      placeholder="Metric label (e.g. Conversion Lift)"
                      className="flex-1 px-3.5 py-2 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      value={metricValue}
                      onChange={(e) => setMetricValue(e.target.value)}
                      placeholder="Value (e.g. +40%)"
                      className="w-32 px-3.5 py-2 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={handleAddImpactMetric}
                      className="min-h-10 px-3.5 py-2 rounded-control bg-panel hover:bg-panel text-fg border border-line"
                    >
                      Add Metric
                    </button>
                  </div>
                  {editingProject.impact && editingProject.impact.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {editingProject.impact.map((imp, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-control bg-panel border border-line">
                          <span className="text-muted">{imp.label}:</span>
                          <span className="text-success font-semibold">{imp.value}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveImpactMetric(idx)}
                            className="text-muted hover:text-danger ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-line flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProject.featured}
                      onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                      className="w-4 h-4 rounded-badge bg-panel border-line text-danger accent-accent"
                    />
                    <span className="text-fg">Feature in Homepage Highlights</span>
                  </label>

                </div>

              </form>
            )}
      </Drawer>

    </AdminPageShell>
  );
};
export default AdminCmsProjects;
