import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
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
import { Modal } from '../../components/ui/Modal';
import { ProjectItem } from '../../data/projectsData';
import { useLanguage } from '../../lib/LanguageContext';
import { useDragToScroll } from '../../lib/useDragToScroll';
import { CustomSelect } from '../../components/ui/CustomSelect';

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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Tag inputs state
  const [techInput, setTechInput] = useState('');
  const [deliverableInput, setDeliverableInput] = useState('');
  const [metricLabel, setMetricLabel] = useState('');
  const [metricValue, setMetricValue] = useState('');

  const loadProjects = async () => {
    try {
      const res = await api.cms.getProjects();
      if (res.success && Array.isArray(res.data?.projects)) setProjects(res.data.projects as ProjectItem[]);
    } catch {
      setStatusMessage(language === 'id' ? 'Gagal memuat case study.' : 'Failed to load case studies.');
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
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
      desc: '',
      descId: '',
      challenge: '',
      challengeId: '',
      solution: '',
      solutionId: '',
      deliverables: ['Full-Stack Architecture', 'Responsive UI/UX', 'Cloud Deployment'],
      technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js'],
      impact: [
        { label: 'Conversion Lift', value: '+40%' },
        { label: 'Latency', value: '< 200ms' }
      ],
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
    const res = await api.cms.deleteProject(id);
    if (res.success) {
      void loadProjects();
      setStatusMessage('Case study deleted successfully.');
    } else {
      setStatusMessage(res.error || 'Delete failed.');
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleToggleFeatured = (project: ProjectItem) => {
    const updated = { ...project, featured: !project.featured };
    void api.cms.updateProject(updated.id, updated).then((res) => { if (res.success) void loadProjects(); else setStatusMessage(res.error || 'Update failed.'); });
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Only image files are supported (PNG, JPG, WebP, SVG).');
      return;
    }
    const reader = new FileReader();
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
      alert('Project title is required.');
      return;
    }

    const res = editingProject.id && projects.some(p => p.id === editingProject.id)
      ? await api.cms.updateProject(editingProject.id, editingProject)
      : await api.cms.createProject(editingProject);
    if (!res.success) { setStatusMessage(res.error || 'Failed to save case study.'); return; }
    setIsModalOpen(false);
    setEditingProject(null);
    await loadProjects();
    setStatusMessage('Case study published successfully to live site!');
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
    <div className="space-y-6">
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm" title="Delete case study?" description={deleteTarget ? `Case study "${deleteTarget.title}" will be permanently removed.` : undefined}>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2"><button type="button" onClick={() => setDeleteTarget(null)} className="min-h-10 px-4 rounded-control border border-line bg-panel text-xs text-muted">Cancel</button><button type="button" onClick={() => void confirmDeleteProject()} className="min-h-10 px-4 rounded-control bg-danger text-white text-xs font-semibold">Delete</button></div>
        </Modal>
      
      {/* Top Title & Actions */}
      <div className="ams-page-header flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="ams-page-title">
            <Layers className="text-accent-text shrink-0" size={22} />
            <span>{t('admin.nav.cmsProjects')}</span>
          </h1>
          <p className="text-xs text-muted mt-1 font-sans">
            {language === 'id'
              ? 'Kelola showcase studi kasus dan portofolio agency untuk kapitech.id/work.'
              : 'Manage case studies, portfolio showcases, and technical deliverables at kapitech.id/work.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="min-h-10 px-4 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-sans font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={15} />
            <span>{language === 'id' ? 'Tambah Case Study' : 'Add Case Study'}</span>
          </button>
        </div>
      </div>

      {/* Success alert */}
      {statusMessage && (
        <div className="p-3.5 rounded-card bg-success/10 border border-success/30 text-success text-xs font-sans flex items-center gap-2 animate-in fade-in duration-300">
          <Check size={15} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Filter & Search Bar (In-Card) */}
      <div className="bg-panel border border-line p-4 rounded-card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'id' ? 'Cari proyek, klien, industri, teknologi...' : 'Search projects, client names, industries, tech stack...'}
              className="w-full pl-10 pr-4 py-2.5 bg-panel border border-line rounded-control text-xs text-fg focus:outline-none focus:border-accent placeholder:text-muted font-sans min-h-10 py-2.5"
            />
          </div>

          <div>
            <CustomSelect
              value={filterPillar}
              onChange={(val) => setFilterPillar(val as any)}
              options={[
                { value: 'All', label: language === 'id' ? 'Semua Pilar Studio' : 'All Studio Pillars' },
                { value: 'Visual Experience', label: 'Visual Experience' },
                { value: 'Innovation Development', label: 'Innovation Development' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Projects Grid with Drag-to-scroll support */}
      <div 
        ref={galleryScrollRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      >
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-panel border border-line hover:border-line rounded-card overflow-hidden flex flex-col group transition-all"
          >
            {/* Image Thumbnail */}
            <div className="relative h-48 w-full bg-bg overflow-hidden">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
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
                    className="text-[10px] font-sans px-2 py-0.5 rounded bg-panel border border-line text-muted"
                  >
                    {tech}
                  </span>
                ))}
                {project.technologies.length > 4 && (
                  <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-panel border border-line text-muted">
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
                    className="p-1.5 rounded-control bg-panel hover:bg-panel-hover text-muted hover:text-fg border border-line transition-colors"
                    title="Edit Case Study"
                  >
                    <Edit3 size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(project.id, project.title)}
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

      {/* MODAL: ADD / EDIT PROJECT WITH LIVE PREVIEW & DRAG & DROP */}
      <Modal open={isModalOpen && !!editingProject} onClose={() => setIsModalOpen(false)} size="xl" title={editingProject?.title ? 'Edit: ' + editingProject.title : 'Add New Case Study'} description="Manage the case study content and live card preview.">
            <div className="flex items-center justify-end pb-3 border-b border-line mb-4">
              <div className="flex items-center gap-3">
                <FolderKanban className="text-accent-text" size={20} />
                <h2 className="text-lg font-semibold font-sans text-fg">
                  {editingProject.title ? `Edit: ${editingProject.title}` : 'Add New Case Study'}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {/* Modal Tab Switcher */}
                <div className="flex items-center rounded-control bg-panel border border-line p-0.5">
                  <button
                    type="button"
                    onClick={() => setModalTab('details')}
                    className={`px-3 py-1 rounded-chip text-[11px] font-semibold transition-all ${
                      modalTab === 'details' ? 'bg-panel text-fg' : 'text-muted hover:text-fg'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-chip text-[11px] font-semibold transition-all ${
                      modalTab === 'preview' ? 'bg-panel text-fg' : 'text-muted hover:text-fg'
                    }`}
                  >
                    <Eye size={12} />
                    <span>Card Preview</span>
                  </button>
                </div>

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
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-panel border border-line text-muted">
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
              <form onSubmit={handleSaveModal} className="space-y-4">
                
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
                      className="px-3.5 py-2 rounded-control bg-panel hover:bg-panel text-fg border border-line"
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
                      className="px-3.5 py-2 rounded-control bg-panel hover:bg-panel text-fg border border-line"
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
                      className="w-4 h-4 rounded bg-panel border-line text-danger accent-accent"
                    />
                    <span className="text-fg">Feature in Homepage Highlights</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-control bg-panel text-muted hover:text-fg border border-line"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-control bg-accent text-white font-semibold hover:bg-accent-hover transition-all"
                    >
                      Save Case Study
                    </button>
                  </div>
                </div>

              </form>
            )}
      </Modal>

    </div>
  );
};
export default AdminCmsProjects;
