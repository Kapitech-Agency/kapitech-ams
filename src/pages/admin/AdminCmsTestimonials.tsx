import React, { useState, useEffect } from 'react';
import { Users, Plus, Star, Edit3, Trash2, Check, MessageSquare, MapPin, X, Eye, EyeOff } from 'lucide-react';
import type { TestimonialItem } from '../../lib/cmsStore';
import { api } from '../../lib/apiClient';
import { useLanguage } from '../../lib/LanguageContext';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { AdminDataTableShell, AdminFilterBar, AdminModuleHeader, AdminModuleNotice, AdminPageShell, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';

const normalizeCmsTestimonial = (item: TestimonialItem): TestimonialItem => ({
  ...item,
  id: String(item?.id || 'testimonial-' + Date.now().toString(36)),
  quote: String(item?.quote || ''),
  quoteId: String(item?.quoteId || ''),
  author: String(item?.author || 'Anonymous client'),
  role: String(item?.role || ''),
  company: String(item?.company || ''),
  location: String(item?.location || ''),
  rating: Number.isFinite(Number(item?.rating)) ? Math.min(5, Math.max(1, Number(item.rating))) : 5,
  // Preserve legacy testimonials without the newer flag; explicit false remains a draft.
  // New testimonial forms still start with isPublished: false.
  isPublished: item?.isPublished !== false,
});

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setIsLoading(true); setLoadError(null);
    try {
      const res = await api.cms.getTestimonials();
      if (res.success && Array.isArray(res.data?.testimonials)) setTestimonials(res.data.testimonials.filter(Boolean).map(normalizeCmsTestimonial));
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
    return [item.author, item.role, item.company, item.location, item.quote, item.quoteId]
      .map((value) => String(value || '').toLowerCase())
      .some((value) => value.includes(query));
  });
  const totalTestimonialPages = Math.max(1, Math.ceil(filteredTestimonials.length / pageSize));
  const pagedTestimonials = filteredTestimonials.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, pageSize]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalTestimonialPages));
  }, [totalTestimonialPages]);

  const handleTogglePublished = async (item: TestimonialItem) => {
    const nextPublished = item.isPublished !== true;
    try {
      const res = await api.cms.updateTestimonial(item.id, { isPublished: nextPublished });
      if (!res.success) {
        setStatusMessage(res.error || (language === 'id' ? 'Status publikasi gagal diperbarui.' : 'Publication status could not be updated.'));
      } else {
        await loadData();
        setStatusMessage(nextPublished
          ? (language === 'id' ? 'Testimoni berhasil dipublikasikan.' : 'Testimonial published successfully.')
          : (language === 'id' ? 'Testimoni dipindahkan ke draft.' : 'Testimonial moved to draft.'));
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : (language === 'id' ? 'Status publikasi gagal diperbarui.' : 'Publication status could not be updated.'));
    }
    window.setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleOpenAdd = () => {
    const template: TestimonialItem = {
      id: 'testi_' + Date.now().toString(36),
      quote: '',
      quoteId: '',
      author: '',
      role: '',
      company: '',
      location: '',
      rating: 5,
      isPublished: false
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
      setStatusMessage(editingItem.isPublished === true
        ? (language === 'id' ? 'Testimoni berhasil dipublikasikan ke website.' : 'Testimonial published successfully to the website.')
        : (language === 'id' ? 'Testimoni disimpan sebagai draft. Publikasikan dari daftar saat siap.' : 'Testimonial saved as a draft. Publish it from the directory when ready.'));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to save testimonial.');
    } finally {
      setIsSaving(false);
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <AdminPageShell featureSlug="cms-testimonials-module" className="ams-cms-module">
      
      <AdminModuleHeader slug="cms-testimonials-header"
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

      
      
      

      {statusMessage && (
        <AdminModuleNotice
          tone={/failed|could not|unable|error|gagal|wajib|required/i.test(statusMessage) ? 'danger' : 'success'}
          onDismiss={() => setStatusMessage(null)}
        >
          {statusMessage}
        </AdminModuleNotice>
      )}

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
        <span>Testimonial directory</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading testimonials">
          {[1, 2, 3, 4, 5, 6].map(i => (
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
            {testimonials.length === 0 ? 'Add a client testimonial to publish social proof.' : 'Adjust the search to find another testimonial.'}
          </p>
          {testimonials.length === 0 && (
            <Button className="mt-4" icon={<Plus size={14} />} onClick={handleOpenAdd}>Add testimonial</Button>
          )}
        </div>
      ) : (
        <AdminDataTableShell slug="cms-testimonials-directory">
          <div data-ams-feature-slug="cms-testimonials-table-scroll" data-ams-slug="cms-testimonials-table-scroll" className="overflow-x-auto custom-scrollbar">
            <table className="ams-data-table w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-line bg-bg text-[10px] font-medium text-muted">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Company / role</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Quote</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pagedTestimonials.map((item) => (
                  <tr key={item.id} className="h-10 transition-colors hover:bg-bg/60">
                    <td className="px-3 py-2">
                      <ProfileIdentity profile={{ name: item.author, role: item.role || undefined, contextLabel: item.company || undefined }} showRole={false} size="sm" />
                    </td>
                    <td className="px-3 py-2">
                      <div className="min-w-[180px]">
                        <p className="truncate text-[11px] font-medium text-fg">{item.company || 'Company not set'}</p>
                        <p className="mt-0.5 truncate text-[10px] text-muted">{item.role || 'Role not set'}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 text-warning" aria-label={String(item.rating || 5) + ' out of 5 stars'}>
                        {[...Array(item.rating || 5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                      </div>
                    </td>
                    <td className="max-w-[360px] px-4 py-2.5">
                      <p className="line-clamp-2 text-[11px] leading-4 text-muted">“{item.quoteId || item.quote || 'No quote provided.'}”</p>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted"><MapPin size={11} />{item.location || 'Not set'}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => void handleTogglePublished(item)} className={["inline-flex h-8 items-center justify-center gap-1.5 rounded-control border px-2.5 text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent", item.isPublished === true ? "border-success/20 bg-success/10 text-success" : "border-line bg-bg text-muted hover:text-fg"].join(" ")} aria-pressed={item.isPublished === true} aria-label={(item.isPublished === true ? "Unpublish " : "Publish ") + item.author} title={item.isPublished === true ? "Move to draft" : "Publish testimonial"}>{item.isPublished === true ? <Eye size={12} /> : <EyeOff size={12} />}{item.isPublished === true ? "Published" : "Draft"}</button>
                        <button type="button" onClick={() => handleOpenEdit(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg text-muted hover:bg-panel hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={'Edit ' + item.author} title="Edit testimonial"><Edit3 size={13} /></button>
                        <button type="button" onClick={() => setDeleteTarget({ id: item.id, author: item.author })} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={'Delete ' + item.author} title="Delete testimonial"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminTablePagination total={filteredTestimonials.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="testimonials" slug="cms-testimonials-pagination" />
        </AdminDataTableShell>
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
          title={editingItem.author ? `Edit: ${editingItem.author}` : (language === 'id' ? 'Tambah Testimoni Klien' : 'Add client testimonial')}
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
                  className="ams-control w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                    {language === 'id' ? 'Jabatan' : 'Role / Position'}
                  </label>
                  <input
                    type="text"
                    value={editingItem.role}
                    onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value })}
                    placeholder="e.g., VP of Product"
                    className="ams-control w-full text-xs"
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
                    className="ams-control w-full text-xs"
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
                  className="ams-control w-full text-xs"
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
