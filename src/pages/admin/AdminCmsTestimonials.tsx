import React, { useState, useEffect } from 'react';
import { Users, Plus, Star, Edit3, Trash2, Check, MessageSquare, MapPin, X } from 'lucide-react';
import { TestimonialItem } from '../../lib/cmsStore';
import { api } from '../../lib/apiClient';
import { useLanguage } from '../../lib/LanguageContext';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { AdminFilterBar, AdminModuleHeader, AdminPageShell, AdminSectionTabs, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';

export const AdminCmsTestimonials: React.FC = () => {
  const { language } = useLanguage();
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; author: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = async () => {
    setIsLoading(true); setLoadError(null);
    try {
      const res = await api.cms.getTestimonials();
      if (res.success && Array.isArray(res.data?.testimonials)) setTestimonials(res.data.testimonials as TestimonialItem[]);
      else setLoadError(res.error || 'Unable to load testimonials.');
    } catch { setLoadError('Unable to load testimonials. Check the connection and retry.'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredTestimonials = testimonials.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [
      item.author,
      item.role,
      item.company,
      item.location,
      item.quote,
      item.quoteId
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
  });
  const totalTestimonialPages = Math.max(1, Math.ceil(filteredTestimonials.length / pageSize));
  const pagedTestimonials = filteredTestimonials.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, pageSize]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalTestimonialPages));
  }, [totalTestimonialPages]);

  const handleOpenAdd = () => {
    const template: TestimonialItem = {
      id: 'testi_' + Date.now().toString(36),
      quote: '',
      quoteId: '',
      author: '',
      role: '',
      company: '',
      location: '',
      rating: 5
    };
    setEditingItem(template);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: TestimonialItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await api.cms.deleteTestimonial(deleteTarget.id);
      if (!res.success) {
        setStatusMessage(res.error || 'Delete failed.');
        return;
      }
      setDeleteTarget(null);
      await loadData();
      setStatusMessage('Testimoni berhasil dihapus.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Delete failed.');
    } finally {
      setIsDeleting(false);
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!editingItem || !editingItem.author.trim() || (!editingItem.quoteId && !editingItem.quote)) {
      setStatusMessage('Nama author dan isi kutipan testimoni wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const exists = testimonials.some(item => item.id === editingItem.id);
      const res = exists
        ? await api.cms.updateTestimonial(editingItem.id, editingItem)
        : await api.cms.createTestimonial(editingItem);
      if (!res.success) {
        setStatusMessage(res.error || 'Failed to save testimonial.');
        return;
      }
      setIsModalOpen(false);
      setEditingItem(null);
      await loadData();
      setStatusMessage('Testimoni berhasil disimpan ke database CMS!');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save testimonial.');
    } finally {
      setIsSaving(false);
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <AdminPageShell featureSlug="cms-testimonials-module">
      
      <AdminModuleHeader slug="cms-testimonials-header"
        icon={<Users size={20} />}
        className="mb-0"
        title="Testimonials"
        description={language === 'id'
          ? 'Kelola ulasan klien, feedback kepuasan, dan rekomendasi eksekutif yang tampil di homepage.'
          : 'Manage client reviews, enterprise feedback, and executive recommendations on the homepage.'}
        actions={
          <Button
            type="button"
            variant="primary"
            icon={<Plus size={14} />}
            onClick={handleOpenAdd}
          >
            {language === 'id' ? 'Tambah testimoni' : 'Add testimonial'}
          </Button>
        }
      />

      <AdminSectionTabs
        ariaLabel="CMS sections"
        activeKey="testimonials"
        items={[
          { key: 'projects', label: 'Projects', to: '/admin/cms/projects' },
          { key: 'services', label: 'Services', to: '/admin/cms/services' },
          { key: 'testimonials', label: 'Testimonials', to: '/admin/cms/testimonials' }
        ]}
      />

      {statusMessage && (() => {
        const failed = /failed|could not|unable|error|gagal|wajib|required/i.test(statusMessage);
        return (
          <div className={['p-3 rounded-control border text-xs font-sans flex items-center gap-2', failed ? 'bg-danger/10 border-danger/25 text-danger' : 'bg-success/10 border-success/25 text-success'].join(' ')}>
            {failed ? <X size={14} /> : <Check size={14} />}
            <span>{statusMessage}</span>
          </div>
        );
      })()}

      <AdminFilterBar
        slug="cms-testimonials-filters"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search author, company, role, location, or quote..."
        searchLabel="Search testimonials"
        actions={(
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setPage(1);
            }}
            disabled={!searchQuery}
            className="inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-control border border-line bg-bg px-3 text-xs font-medium text-muted hover:bg-panel hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={13} />
            Reset
          </button>
        )}
      />

      <div className="flex items-center justify-between gap-3 text-[11px] text-muted">
        <span>{filteredTestimonials.length} of {testimonials.length} testimonials</span>
        <span className="tabular-nums">Page {page} of {totalTestimonialPages}</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="Loading testimonials">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-card border border-line bg-panel p-4">
              <div className="h-4 w-20 rounded-control bg-line/60" />
              <div className="mt-5 h-14 w-full rounded-control bg-line/40" />
              <div className="mt-5 h-9 w-32 rounded-control bg-line/50" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-card border border-danger/20 bg-danger/10 p-4">
          <p className="text-sm font-semibold text-fg">Unable to load testimonials</p>
          <p className="mt-1 text-xs leading-5 text-muted">{loadError}</p>
          <Button className="mt-4" variant="secondary" onClick={() => void loadData()}>Retry</Button>
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-card border border-line bg-panel p-10 text-center">
          <MessageSquare className="text-muted" size={22} />
          <p className="mt-3 text-sm font-semibold text-fg">{testimonials.length === 0 ? 'No testimonials yet' : 'No matching testimonials'}</p>
          <p className="mt-1 max-w-md text-xs leading-5 text-muted">
            {testimonials.length === 0
              ? 'Add a client testimonial to publish social proof.'
              : 'Adjust the search to find another testimonial.'}
          </p>
          {testimonials.length === 0 && (
            <Button className="mt-4" icon={<Plus size={14} />} onClick={handleOpenAdd}>Add testimonial</Button>
          )}
        </div>
      ) : (
        <>
          <div data-ams-feature-slug="cms-testimonials-directory" data-ams-slug="cms-testimonials-directory" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pagedTestimonials.map((item) => (
              <div key={item.id} className="group flex min-h-[220px] flex-col justify-between rounded-card border border-line bg-panel p-4 transition-colors hover:bg-panel-hover">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 text-warning" aria-label={String(item.rating || 5) + ' out of 5 stars'}>
                      {[...Array(item.rating || 5)].map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
                    </div>
                    <span className="rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[9px] font-mono text-muted">#{item.id}</span>
                  </div>
                  <p className="mt-4 line-clamp-5 text-xs leading-5 text-muted">“{item.quoteId || item.quote}”</p>
                </div>
                <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
                  <div className="min-w-0">
                    <ProfileIdentity profile={{ name: item.author, role: item.role || undefined, contextLabel: item.company || undefined }} showRole />
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted">
                      <MapPin size={10} />
                      <span className="truncate">{item.location || 'Location not set'}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button type="button" onClick={() => handleOpenEdit(item)} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-control border border-line bg-bg text-muted hover:bg-panel hover:text-fg" aria-label={'Edit ' + item.author}>
                      <Edit3 size={14} />
                    </button>
                    <button type="button" onClick={() => setDeleteTarget({ id: item.id, author: item.author })} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-control border border-line bg-bg text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger" aria-label={'Delete ' + item.author}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <AdminTablePagination
            total={filteredTestimonials.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="testimonials"
            slug="cms-testimonials-pagination"
          />
        </>
      )}

      {deleteTarget && (
        <Modal slug="cms-testimonial-delete-modal"
          open={!!deleteTarget}
          onClose={() => !isDeleting && setDeleteTarget(null)}
          size="sm"
          title="Delete testimonial"
          description={`This will permanently remove the testimonial from the CMS. Review the author before confirming.`}
          footer={(
            <>
              <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={() => void handleDelete()} loading={isDeleting}>Delete</Button>
            </>
          )}
        >
          <div className="space-y-4">
            <div className="rounded-control border border-danger/30 bg-danger/5 p-3">
              <p className="text-sm font-semibold text-fg">{deleteTarget.author}</p>
              <p className="mt-1 text-xs text-muted">The testimonial will no longer appear on the public site.</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Add / Edit Testimonial */}
      {isModalOpen && editingItem && (
        <Drawer slug="cms-testimonial-editor-drawer"
          open={isModalOpen}
          onClose={() => !isSaving && setIsModalOpen(false)}
          size="lg"
          title={editingItem.author ? `Edit: ${editingItem.author}` : (language === 'id' ? 'Tambah Testimoni Klien' : 'Add Client Testimonial')}
          footer={(
            <>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                {language === 'id' ? 'Batal' : 'Cancel'}
              </Button>
              <Button type="submit" form="testimonial-form" loading={isSaving}>
                {language === 'id' ? 'Simpan Testimoni' : 'Save Testimonial'}
              </Button>
            </>
          )}
        >
          <div className="space-y-4">
            <form id="testimonial-form" data-ams-feature-slug="cms-testimonial-form" data-ams-slug="cms-testimonial-form" onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                  {language === 'id' ? 'Nama Klien / Eksekutif *' : 'Client / Executive Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.author}
                  onChange={(e) => setEditingItem({ ...editingItem, author: e.target.value })}
                  placeholder="e.g., Marcus Thorne"
                  className="w-full ams-control text-xs text-fg font-sans min-h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                    {language === 'id' ? 'Jabatan' : 'Role / Position'}
                  </label>
                  <input
                    type="text"
                    value={editingItem.role}
                    onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value })}
                    placeholder="e.g., VP of Product"
                    className="w-full ams-control text-xs text-fg font-sans min-h-10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                    {language === 'id' ? 'Perusahaan' : 'Company'}
                  </label>
                  <input
                    type="text"
                    value={editingItem.company}
                    onChange={(e) => setEditingItem({ ...editingItem, company: e.target.value })}
                    placeholder="e.g., Finova Global"
                    className="w-full ams-control text-xs text-fg font-sans min-h-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                  {language === 'id' ? 'Lokasi Klien' : 'Client Location'}
                </label>
                <input
                  type="text"
                  value={editingItem.location}
                  onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                  placeholder="e.g., Jakarta, Indonesia"
                  className="w-full ams-control text-xs text-fg font-sans min-h-10"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                  {language === 'id' ? 'Isi Kutipan Testimoni *' : 'Testimonial Quote *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingItem.quoteId || editingItem.quote}
                  onChange={(e) => setEditingItem({ ...editingItem, quoteId: e.target.value, quote: e.target.value })}
                  placeholder={language === 'id' ? 'Ceritakan dampak positif atau kecepatan kerja sama dengan Kapitech...' : 'Share client feedback, impact, and delivery speed...'}
                  className="w-full ams-control text-xs text-fg font-sans"
                />
              </div>

            </form>
          </div>
        </Drawer>
      )}

    </AdminPageShell>
  );
};
export default AdminCmsTestimonials;
