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
import type { ProjectItem } from '../../data/projectsData';
import { useLanguage } from '../../lib/LanguageContext';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Skeleton } from '../../components/ui/Skeleton';
import { AdminFilterBar, AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';


const slugifyCaseStudy = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

const normalizeCmsProject = (project: ProjectItem): ProjectItem => ({
  ...project,
  slug: project.slug || project.id || '',
  title: project.title || '',
  client: project.client || '',
  industry: project.industry || 'Unspecified',
  service: project.service || 'Web Application',
  image: project.image || '',
  desc: project.desc || '',
  descId: project.descId || '',
  challenge: project.challenge || '',
  challengeId: project.challengeId || '',
  solution: project.solution || '',
  solutionId: project.solutionId || '',
  execution: project.execution || '',
  executionId: project.executionId || '',
  outcome: project.outcome || '',
  outcomeId: project.outcomeId || '',
  deliverables: Array.isArray(project.deliverables) ? project.deliverables : [],
  technologies: Array.isArray(project.technologies) ? project.technologies : [],
  impact: Array.isArray(project.impact) ? project.impact : [],
  year: project.year || '',
  isPublished: project.isPublished !== false
});

export const AdminCmsProjects: React.FC = () => {
  const { language, t } = useLanguage();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
        setProjects((Array.isArray(res.data.projects) ? res.data.projects : []).filter(Boolean).map(normalizeCmsProject));
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
      execution: '',
      executionId: '',
      outcome: '',
      outcomeId: '',
      deliverables: [],
      technologies: [],
      impact: [],
      year: new Date().getFullYear().toString(),
      isPublished: true,
      slug: ''
    };
    setTechInput('');
    setDeliverableInput('');
    setMetricLabel('');
    setMetricValue('');
    setEditingProject(newTemplate);
    setModalTab('details');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: ProjectItem) => {
    setTechInput('');
    setDeliverableInput('');
    setMetricLabel('');
    setMetricValue('');
    setEditingProject(normalizeCmsProject(project));
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
    const nextFeatured = !project.featured;
    try {
      const res = await api.cms.updateProject(project.id, { featured: nextFeatured });
      if (res.success) {
        await loadProjects();
        setStatusMessage(nextFeatured ? 'Project featured successfully.' : 'Project removed from featured.');
      } else {
        setStatusMessage(res.error || 'Update failed.');
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Update failed.');
    }
  };

  const handleTogglePublished = async (project: ProjectItem) => {
    const nextPublished = project.isPublished === false;
    try {
      const res = await api.cms.updateProject(project.id, { isPublished: nextPublished });
      if (res.success) {
        await loadProjects();
        setStatusMessage(nextPublished ? 'Case study published successfully.' : 'Case study unpublished from the public site.');
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

    const payload: ProjectItem = {
      ...editingProject,
      slug: slugifyCaseStudy(editingProject.slug || editingProject.title) || editingProject.id,
      isPublished: editingProject.isPublished !== false
    };

    try {
      const res = payload.id && projects.some(p => p.id === payload.id)
        ? await api.cms.updateProject(payload.id, payload)
        : await api.cms.createProject(payload);
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

  const filteredProjects = projects.filter((project) => {
    const matchesPillar = filterPillar === 'All' || project.pillar === filterPillar;
    const query = searchQuery.trim().toLowerCase();
    const searchable = [
      project.title,
      project.client,
      project.industry,
      project.service,
      project.desc,
      project.descId,
      project.challenge,
      project.challengeId,
      project.solution,
      project.solutionId,
      ...project.deliverables,
      ...project.technologies
    ].map((value) => String(value || '').toLowerCase());
    return matchesPillar && (!query || searchable.some((value) => value.includes(query)));
  });
  const totalProjectPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const pagedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [searchQuery, filterPillar, pageSize]);
  useEffect(() => { setPage((current) => Math.min(current, totalProjectPages)); }, [totalProjectPages]);

  return (
    <AdminPageShell featureSlug="cms-projects-module" className="ams-cms-module">
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
        title="Projects"
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

      
      <AdminMetricStrip
        slug="cms-projects-kpis"
        className="grid-cols-2 sm:grid-cols-4"
        metrics={[
          { id: 'projects-total', label: 'Case studies', value: projects.length, icon: <Layers size={15} />, toneClassName: 'text-accent-text' },
          { id: 'projects-featured', label: 'Featured', value: projects.filter((project) => project.featured).length, icon: <Star size={15} />, toneClassName: 'text-warning' },
          { id: 'projects-visual', label: 'Visual experience', value: projects.filter((project) => project.pillar === 'Visual Experience').length, icon: <Eye size={15} />, toneClassName: 'text-info' },
          { id: 'projects-development', label: 'Innovation development', value: projects.filter((project) => project.pillar === 'Innovation Development').length, icon: <TrendingUp size={15} />, toneClassName: 'text-success' }
        ]}
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

      <AdminFilterBar
        slug="cms-projects-filters"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search project, client, industry, or service..."
        searchLabel="Search case studies"
        className="mt-4"
        actions={(
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterPillar('All');
              setPage(1);
            }}
            disabled={!searchQuery && filterPillar === 'All'}
            className="inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-muted hover:bg-panel hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={13} />
            Reset
          </button>
        )}
      >
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
          {[
            { value: 'All', label: 'All' },
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
                  'inline-flex min-h-8 shrink-0 items-center justify-center rounded-chip border px-3 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                  active
                    ? 'border-accent/25 bg-accent/10 font-semibold text-fg'
                    : 'border-transparent text-muted hover:bg-bg hover:text-fg'
                ].join(' ')}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </AdminFilterBar>

      <div className="flex items-center justify-between gap-3 text-[11px] text-muted">
        <span>{filteredProjects.length} of {projects.length} case studies</span>
        <span>Case study directory</span>
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
        <>
                <div className="overflow-x-auto rounded-card border border-line bg-panel">
          <table className="ams-table w-full min-w-[1080px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-bg text-[10px] font-medium text-muted">
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Pillar</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pagedProjects.map((project) => (
                <tr key={project.id} data-ams-slug={'cms-project-' + project.id} className="h-10 transition-colors hover:bg-bg/60">
                  <td className="px-3 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-9 w-12 shrink-0 overflow-hidden rounded-control border border-line bg-bg">
                        {project.image ? <img src={project.image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-muted"><ImageIcon size={14} /></div>}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-fg">{project.title || 'Untitled case study'}</p>
                        <p className="mt-0.5 truncate text-[10px] text-muted">{project.client || 'Client not set'} · /{project.slug || project.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2"><span className="inline-flex max-w-[180px] truncate rounded-badge border border-accent/25 bg-accent/10 px-2 py-1 text-[10px] font-medium text-accent-text">{project.pillar || 'Unspecified'}</span></td>
                  <td className="max-w-[220px] px-4 py-2.5"><span className="block truncate text-[11px] text-muted">{project.service || 'Not set'}</span></td>
                  <td className="px-4 py-2.5 font-mono text-[11px] tabular-nums text-fg">{project.year || '—'}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePublished(project)}
                      className={project.isPublished === false
                        ? 'inline-flex h-8 items-center gap-1 rounded-control border border-line bg-bg px-2.5 text-[10px] font-semibold text-muted hover:text-fg'
                        : 'inline-flex h-8 items-center gap-1 rounded-control border border-success/20 bg-success/10 px-2.5 text-[10px] font-semibold text-success hover:bg-success/15'}
                      aria-pressed={project.isPublished !== false}
                    >
                      <Eye size={11} />
                      {project.isPublished === false ? 'Draft' : 'Published'}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => handleToggleFeatured(project)} className={`inline-flex h-8 items-center gap-1 rounded-control border px-2.5 text-[10px] font-semibold ${project.featured ? 'border-warning/20 bg-warning/10 text-warning' : 'border-line bg-bg text-muted hover:text-fg'}`} aria-pressed={project.featured}>
                      <Star size={11} fill={project.featured ? 'currentColor' : 'none'} />
                      {project.featured ? 'Featured' : 'Standard'}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" onClick={() => handleOpenEdit(project)} data-ams-slug={'cms-project-edit-' + project.id} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg text-muted hover:bg-panel hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={'Edit ' + project.title} title="Edit case study"><Edit3 size={13} /></button>
                      <button type="button" onClick={() => handleDelete(project.id, project.title)} data-ams-slug={'cms-project-delete-' + project.id} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={'Delete ' + project.title} title="Delete case study"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminTablePagination total={filteredProjects.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="case studies" slug="cms-projects-pagination" />
        </>
      )}
      {/* MODAL: ADD / EDIT PROJECT WITH LIVE PREVIEW & DRAG & DROP */}
      </div>

      {editingProject && (
      <Drawer slug="cms-project-editor-drawer"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        dialogClassName="border-l border-line bg-panel max-w-[560px]"
        title={editingProject?.title ? 'Edit: ' + editingProject.title : 'Add new case study'}
        description="Maintain the public case study content, media, and presentation."
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
            <div className="flex items-center justify-end border-b border-line pb-4">
              <div className="flex items-center rounded-control bg-panel border border-line p-0.5" role="tablist" aria-label="Case study editor">
                <button
                  type="button"
                  role="tab"
                  aria-selected={modalTab === 'details'}
                  onClick={() => setModalTab('details')}
                  className={`inline-flex h-8 items-center rounded-chip px-3 text-[11px] font-medium transition-colors ${modalTab === 'details' ? 'border border-line bg-panel text-fg' : 'border border-transparent text-muted hover:bg-bg hover:text-fg'}`}
                >
                  Details
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={modalTab === 'preview'}
                  onClick={() => setModalTab('preview')}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-chip px-3 text-[11px] font-medium transition-colors ${modalTab === 'preview' ? 'border border-line bg-panel text-fg' : 'border border-transparent text-muted hover:bg-bg hover:text-fg'}`}
                >
                  <Eye size={12} />
                  <span>Card Preview</span>
                </button>
              </div>
            </div>

            {modalTab === 'preview' ? (
              <div className="space-y-5 py-4">
                <div className="rounded-card border border-line bg-bg p-3 text-[11px] text-muted">
                  Live case study preview. This is the content structure that will feed the public <code className="text-fg">/work</code> detail modal.
                </div>

                <div className="overflow-hidden rounded-card border border-line bg-bg">
                  <div className="relative h-48 bg-panel">
                    {editingProject.image ? (
                      <img src={editingProject.image} alt={editingProject.title || 'Case study'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted">
                        <ImageIcon size={28} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/35 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.08em]">
                        <span className="rounded-badge border border-accent/30 bg-accent/10 px-2 py-1 text-accent-text">{editingProject.pillar}</span>
                        <span className="rounded-badge border border-line bg-bg/80 px-2 py-1 text-muted">{editingProject.service}</span>
                        <span className="rounded-badge border border-line bg-bg/80 px-2 py-1 font-mono tabular-nums text-muted">{editingProject.year}</span>
                      </div>
                      <p className="text-[10px] text-muted">{editingProject.client || 'Client'} · {editingProject.industry || 'Industry'}</p>
                      <h3 className="mt-1 text-lg font-semibold leading-tight text-fg">{editingProject.title || 'Untitled case study'}</h3>
                    </div>
                  </div>

                  <div className="space-y-5 p-4">
                    <section>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Project Context</p>
                      <p className="mt-2 text-xs leading-6 text-fg">
                        {editingProject.descId || editingProject.desc || 'No project summary entered.'}
                      </p>
                    </section>

                    <div className="grid gap-3">
                      <section className="rounded-control border border-line bg-panel p-3">
                        <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-accent-text">01 · Client Challenge</div>
                        <p className="mt-2 text-xs leading-6 text-muted">{editingProject.challengeId || editingProject.challenge || 'No client challenge entered.'}</p>
                      </section>
                      <section className="rounded-control border border-accent/20 bg-accent/5 p-3">
                        <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-accent-text">02 · Kapitech Solution</div>
                        <p className="mt-2 text-xs leading-6 text-muted">{editingProject.solutionId || editingProject.solution || 'No Kapitech solution entered.'}</p>
                      </section>
                      <section className="rounded-control border border-line bg-panel p-3">
                        <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">03 · Execution Narrative</div>
                        <p className="mt-2 text-xs leading-6 text-muted">{editingProject.executionId || editingProject.execution || 'No execution narrative entered.'}</p>
                      </section>
                    </div>

                    <section>
                      <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">03 · Execution & Delivery</div>
                      <div className="mt-2 space-y-2">
                        {editingProject.deliverables.length > 0 ? editingProject.deliverables.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 rounded-control border border-line bg-panel px-3 py-2 text-xs text-fg">
                            <span className="font-mono text-accent-text">{String(idx + 1).padStart(2, '0')}</span>
                            <span>{item}</span>
                          </div>
                        )) : <p className="mt-2 text-xs text-muted">No deliverables entered.</p>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {editingProject.technologies.map((item, idx) => (
                          <span key={idx} className="rounded-badge border border-line bg-panel px-2 py-1 text-[10px] font-mono text-muted">{item}</span>
                        ))}
                      </div>
                    </section>

                    <section>
                      <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">04 · Outcome & Client Impact</div>
                      <p className="mt-2 text-xs leading-6 text-muted">{editingProject.outcomeId || editingProject.outcome || 'No client outcome narrative entered.'}</p>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {editingProject.impact.length > 0 ? editingProject.impact.map((item, idx) => (
                          <div key={idx} className="rounded-control border border-line bg-panel p-3">
                            <div className="text-lg font-semibold text-fg">{item.value}</div>
                            <div className="mt-1 text-[9px] uppercase tracking-[0.08em] text-muted">{item.label}</div>
                          </div>
                        )) : <p className="text-xs text-muted">No impact metrics entered.</p>}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            ) : (
              <form id="case-study-form" data-ams-feature-slug="cms-project-form" data-ams-slug="cms-project-form" onSubmit={handleSaveModal} className="space-y-5">
                <section className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-fg">Identity & publishing</h4>
                    <p className="mt-1 text-[11px] leading-5 text-muted">Core fields used by the directory, filters, featured spotlight, and public case study detail.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-muted font-semibold">Project Title *</label>
                      <input
                        type="text"
                        required
                        value={editingProject.title}
                        onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                        onBlur={() => {
                          if (!editingProject.slug.trim()) setEditingProject((current) => current ? { ...current, slug: slugifyCaseStudy(current.title) } : current);
                        }}
                        placeholder="e.g. Bank Digital Nusantara Mobile"
                        className="ams-control w-full text-xs"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-muted font-semibold">Slug *</label>
                      <input
                        type="text"
                        required
                        value={editingProject.slug || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, slug: slugifyCaseStudy(e.target.value) })}
                        placeholder="bank-digital-nusantara-mobile"
                        className="ams-control w-full text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-muted font-semibold">Client Name / Company</label>
                      <input
                        type="text"
                        value={editingProject.client}
                        onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                        placeholder="PT Bank Digital Nusantara"
                        className="ams-control w-full text-xs"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-muted font-semibold">Industry</label>
                      <input
                        type="text"
                        value={editingProject.industry}
                        onChange={(e) => setEditingProject({ ...editingProject, industry: e.target.value })}
                        placeholder="FinTech & Banking"
                        className="ams-control w-full text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-muted font-semibold">Studio Pillar</label>
                      <CustomSelect
                        value={editingProject.pillar}
                        onChange={(value) => setEditingProject({ ...editingProject, pillar: value as ProjectItem['pillar'] })}
                        options={[
                          { value: 'Visual Experience', label: 'Visual Experience' },
                          { value: 'Innovation Development', label: 'Innovation Development' }
                        ]}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-muted font-semibold">Service Category</label>
                      <input
                        type="text"
                        value={editingProject.service}
                        onChange={(e) => setEditingProject({ ...editingProject, service: e.target.value as ProjectItem['service'] })}
                        placeholder="UI/UX Design, Web Application..."
                        className="ams-control w-full text-xs"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-muted font-semibold">Release Year</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editingProject.year}
                        onChange={(e) => setEditingProject({ ...editingProject, year: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        placeholder="2026"
                        className="ams-control w-full text-xs font-mono"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-3 border-t border-line pt-5">
                  <div>
                    <h4 className="text-sm font-semibold text-fg">Cover media</h4>
                    <p className="mt-1 text-[11px] leading-5 text-muted">Use a hosted image URL for production-sized media. Local file upload remains available for smaller assets.</p>
                  </div>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleDrop}
                    className={['rounded-control border-2 border-dashed p-4 text-center transition-colors', isDraggingFile ? 'border-accent bg-accent/10' : 'border-line bg-panel'].join(' ')}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      {editingProject.image ? (
                        <div className="relative mb-1 h-20 w-36 overflow-hidden rounded-control border border-line">
                          <img src={editingProject.image} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <UploadCloud className="text-muted" size={28} />
                      )}
                      <div className="text-fg">
                        <span>Drag & drop image here, or </span>
                        <label className="cursor-pointer font-semibold text-danger hover:underline">
                          browse file
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <input
                    type="url"
                    value={editingProject.image}
                    onChange={(e) => setEditingProject({ ...editingProject, image: e.target.value })}
                    placeholder="Paste direct image URL (https://...)"
                    className="ams-control w-full text-xs"
                  />
                </section>

                <section className="space-y-4 border-t border-line pt-5">
                  <div>
                    <h4 className="text-sm font-semibold text-fg">Narrative</h4>
                    <p className="mt-1 text-[11px] leading-5 text-muted">Keep the English and Indonesian variants aligned. These fields feed the public case study modal directly.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="space-y-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">English</div>
                      <div>
                        <label className="mb-1 block text-muted font-medium">Project Context / Summary</label>
                        <textarea rows={4} value={editingProject.desc} onChange={(e) => setEditingProject({ ...editingProject, desc: e.target.value })} placeholder="What was the project and what did Kapitech deliver?" className="ams-control w-full resize-y text-xs leading-5" />
                      </div>
                      <div>
                        <label className="mb-1 block text-muted font-medium">01 · Client Challenge</label>
                        <textarea rows={5} value={editingProject.challenge} onChange={(e) => setEditingProject({ ...editingProject, challenge: e.target.value })} placeholder="What business, product, operational, or communication problem was the client facing?" className="ams-control w-full resize-y text-xs leading-5" />
                      </div>
                      <div>
                        <label className="mb-1 block text-muted font-medium">02 · Kapitech Solution</label>
                        <textarea rows={5} value={editingProject.solution} onChange={(e) => setEditingProject({ ...editingProject, solution: e.target.value })} placeholder="What strategy, design, engineering, or production approach did Kapitech use?" className="ams-control w-full resize-y text-xs leading-5" />
                      </div>
                      <div>
                        <label className="mb-1 block text-muted font-medium">03 · Execution Narrative</label>
                        <textarea rows={5} value={editingProject.execution} onChange={(e) => setEditingProject({ ...editingProject, execution: e.target.value })} placeholder="Explain how the work was executed: process, phases, collaboration, implementation, production, or deployment." className="ams-control w-full resize-y text-xs leading-5" />
                      </div>
                      <div>
                        <label className="mb-1 block text-muted font-medium">04 · Client Outcome / Impact Narrative</label>
                        <textarea rows={5} value={editingProject.outcome} onChange={(e) => setEditingProject({ ...editingProject, outcome: e.target.value })} placeholder="Explain what changed for the client after delivery and why the result mattered." className="ams-control w-full resize-y text-xs leading-5" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Bahasa Indonesia</div>
                      <div>
                        <label className="mb-1 block text-muted font-medium">Konteks / Ringkasan Proyek</label>
                        <textarea rows={4} value={editingProject.descId} onChange={(e) => setEditingProject({ ...editingProject, descId: e.target.value })} placeholder="Apa proyeknya dan apa yang Kapitech kerjakan?" className="ams-control w-full resize-y text-xs leading-5" />
                      </div>
                      <div>
                        <label className="mb-1 block text-muted font-medium">01 · Masalah Klien</label>
                        <textarea rows={5} value={editingProject.challengeId} onChange={(e) => setEditingProject({ ...editingProject, challengeId: e.target.value })} placeholder="Masalah bisnis, produk, operasional, atau komunikasi apa yang dihadapi klien?" className="ams-control w-full resize-y text-xs leading-5" />
                      </div>
                      <div>
                        <label className="mb-1 block text-muted font-medium">02 · Solusi Kapitech</label>
                        <textarea rows={5} value={editingProject.solutionId} onChange={(e) => setEditingProject({ ...editingProject, solutionId: e.target.value })} placeholder="Strategi, desain, engineering, atau pendekatan produksi apa yang digunakan Kapitech?" className="ams-control w-full resize-y text-xs leading-5" />
                      </div>
                      <div>
                        <label className="mb-1 block text-muted font-medium">03 · Narasi Eksekusi</label>
                        <textarea rows={5} value={editingProject.executionId} onChange={(e) => setEditingProject({ ...editingProject, executionId: e.target.value })} placeholder="Jelaskan bagaimana pekerjaan dieksekusi: proses, tahapan, kolaborasi, implementasi, produksi, atau deployment." className="ams-control w-full resize-y text-xs leading-5" />
                      </div>
                      <div>
                        <label className="mb-1 block text-muted font-medium">04 · Narasi Hasil / Dampak</label>
                        <textarea rows={5} value={editingProject.outcomeId} onChange={(e) => setEditingProject({ ...editingProject, outcomeId: e.target.value })} placeholder="Jelaskan perubahan yang dirasakan klien setelah delivery dan mengapa hasil tersebut penting." className="ams-control w-full resize-y text-xs leading-5" />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-3 border-t border-line pt-5">
                  <div>
                    <h4 className="text-sm font-semibold text-fg">03 · Execution & delivery</h4>
                    <p className="mt-1 text-[11px] leading-5 text-muted">List the concrete outputs that were executed, produced, designed, engineered, or handed over to the client.</p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={deliverableInput}
                      onChange={(e) => setDeliverableInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDeliverable(); } }}
                      placeholder="e.g. Product design system, corporate website, launch film..."
                      className="ams-control min-w-0 flex-1 text-xs"
                    />
                    <Button type="button" variant="secondary" onClick={handleAddDeliverable}>Add output</Button>
                  </div>

                  {editingProject.deliverables.length > 0 ? (
                    <div className="space-y-2">
                      {editingProject.deliverables.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-control border border-line bg-panel px-3 py-2.5">
                          <span className="w-7 shrink-0 text-[10px] font-mono font-semibold text-accent-text">{String(idx + 1).padStart(2, '0')}</span>
                          <span className="min-w-0 flex-1 text-xs text-fg">{item}</span>
                          <button type="button" onClick={() => handleRemoveDeliverable(item)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-danger" aria-label={'Remove ' + item}>
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-control border border-dashed border-line bg-bg p-3 text-xs text-muted">No delivery outputs added yet.</div>
                  )}
                </section>

                <section className="space-y-3 border-t border-line pt-5">
                  <div>
                    <h4 className="text-sm font-semibold text-fg">Technology & tooling</h4>
                    <p className="mt-1 text-[11px] leading-5 text-muted">Add the tools, frameworks, production stack, or platforms that materially supported delivery.</p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTech(); } }}
                      placeholder="e.g. Figma, Next.js, Blender, DaVinci Resolve..."
                      className="ams-control min-w-0 flex-1 text-xs"
                    />
                    <Button type="button" variant="secondary" onClick={handleAddTech}>Add technology</Button>
                  </div>

                  {editingProject.technologies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {editingProject.technologies.map((tech, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 rounded-badge border border-line bg-panel px-2.5 py-1.5 text-[11px] text-fg">
                          <span>{tech}</span>
                          <button type="button" onClick={() => handleRemoveTech(tech)} className="text-muted hover:text-danger" aria-label={'Remove ' + tech}>
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-control border border-dashed border-line bg-bg p-3 text-xs text-muted">No technologies added yet.</div>
                  )}
                </section>

                <section className="space-y-3 border-t border-line pt-5">
                  <div>
                    <h4 className="text-sm font-semibold text-fg">04 · Outcome & client impact</h4>
                    <p className="mt-1 text-[11px] leading-5 text-muted">Use measurable business, product, operational, audience, or experience results where available.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                    <input
                      type="text"
                      value={metricLabel}
                      onChange={(e) => setMetricLabel(e.target.value)}
                      placeholder="Metric label"
                      className="ams-control w-full text-xs"
                    />
                    <input
                      type="text"
                      value={metricValue}
                      onChange={(e) => setMetricValue(e.target.value)}
                      placeholder="Value, e.g. +40%"
                      className="ams-control w-full text-xs"
                    />
                    <Button type="button" variant="secondary" onClick={handleAddImpactMetric}>Add metric</Button>
                  </div>

                  {editingProject.impact.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {editingProject.impact.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 rounded-control border border-line bg-panel px-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-fg">{item.label}</p>
                            <p className="mt-0.5 text-xs font-semibold text-success">{item.value}</p>
                          </div>
                          <button type="button" onClick={() => handleRemoveImpactMetric(idx)} className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-danger" aria-label={'Remove ' + item.label}>
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-control border border-dashed border-line bg-bg p-3 text-xs text-muted">No impact metrics added yet.</div>
                  )}
                </section>

                <section className="flex flex-col gap-3 border-t border-line pt-5">
                  <label className="flex items-start gap-3 rounded-control border border-line bg-bg p-3.5">
                    <input
                      type="checkbox"
                      checked={editingProject.featured}
                      onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded-badge border-line bg-panel accent-accent"
                    />
                    <span>
                      <span className="block text-xs font-semibold text-fg">Feature in public spotlight</span>
                      <span className="mt-0.5 block text-[11px] leading-5 text-muted">Allow this case study to appear in the Featured Case Study Spotlight carousel.</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 rounded-control border border-line bg-bg p-3.5">
                    <input
                      type="checkbox"
                      checked={editingProject.isPublished !== false}
                      onChange={(e) => setEditingProject({ ...editingProject, isPublished: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded-badge border-line bg-panel accent-accent"
                    />
                    <span>
                      <span className="block text-xs font-semibold text-fg">Publish on public site</span>
                      <span className="mt-0.5 block text-[11px] leading-5 text-muted">Unpublished case studies remain in the CMS but are hidden from public /work responses.</span>
                    </span>
                  </label>
                </section>
              </form>
            )}
      </Drawer>
      )}

    </AdminPageShell>
  );
};
export default AdminCmsProjects;
