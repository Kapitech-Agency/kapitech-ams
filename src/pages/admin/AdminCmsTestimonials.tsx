import React, { useState, useEffect } from 'react';
import { Users, Plus, Star, Edit3, Trash2, Check, MessageSquare, MapPin } from 'lucide-react';
import { TestimonialItem } from '../../lib/cmsStore';
import { api } from '../../lib/apiClient';
import { useLanguage } from '../../lib/LanguageContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

export const AdminCmsTestimonials: React.FC = () => {
  const { language } = useLanguage();
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; author: string } | null>(null);

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

  const handleOpenAdd = () => {
    const template: TestimonialItem = {
      id: 'testi_' + Date.now().toString(36),
      quote: '',
      quoteId: '',
      author: '',
      role: 'Head of Product / CEO',
      company: '',
      location: 'Jakarta, Indonesia',
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
    if (!deleteTarget) return;
    const res = await api.cms.deleteTestimonial(deleteTarget.id);
    setDeleteTarget(null);
    if (!res.success) { setStatusMessage(res.error || 'Delete failed.'); return; }
    await loadData();
    setStatusMessage('Testimoni berhasil dihapus.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.author.trim() || (!editingItem.quoteId && !editingItem.quote)) {
      setStatusMessage('Nama author dan isi kutipan testimoni wajib diisi.');
      return;
    }

    const exists = testimonials.some(item => item.id === editingItem.id);
    const res = exists ? await api.cms.updateTestimonial(editingItem.id, editingItem) : await api.cms.createTestimonial(editingItem);
    if (!res.success) { setStatusMessage(res.error || 'Failed to save testimonial.'); return; }
    setIsModalOpen(false);
    setEditingItem(null);
    await loadData();
    setStatusMessage('Testimoni berhasil disimpan ke database CMS!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="ams-page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="ams-page-title">
            <Users className="text-accent-text shrink-0" size={22} />
            <span>Testimonials</span>
          </h1>
          <p className="text-xs text-muted mt-1 font-sans">
            {language === 'id' 
              ? 'Kelola ulasan klien, feedback kepuasan, dan rekomendasi eksekutif yang tampil di homepage.'
              : 'Manage client reviews, enterprise feedback, and executive recommendations on the homepage.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="min-h-10 px-3 rounded-control bg-accent hover:bg-accent-hover active:bg-accent-pressed text-white text-xs font-sans font-medium transition-colors flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Plus size={14} />
          <span>{language === 'id' ? 'Tambah Testimoni' : 'Add Testimonial'}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-control bg-success/10 border border-success/25 text-success text-xs font-sans flex items-center gap-2">
          <Check size={14} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Testimonials List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="Loading testimonials">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-card border border-line bg-panel animate-pulse" />)}
        </div>
      ) : loadError ? (
        <div className="rounded-card border border-danger/30 bg-danger/5 p-4 sm:p-5 flex items-center justify-between gap-4">
          <div><p className="text-sm font-semibold text-fg">Unable to load testimonials</p><p className="mt-1 text-xs text-muted">{loadError}</p></div>
          <Button variant="secondary" onClick={() => void loadData()}>Retry</Button>
        </div>
      ) : testimonials.length === 0 ? (
        <div className="rounded-card border border-line bg-panel p-6 sm:p-8 text-center">
          <MessageSquare className="mx-auto text-muted" size={22} />
          <p className="mt-3 text-sm font-semibold text-fg">No testimonials yet</p>
          <p className="mt-1 text-xs text-muted">Add a client testimonial to publish social proof.</p>
          <Button className="mt-4" icon={<Plus size={14} />} onClick={handleOpenAdd}>Add Testimonial</Button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {testimonials.map((item) => (
          <div
            key={item.id}
            className="bg-panel border border-line rounded-card p-4 flex flex-col justify-between hover:border-line transition-all"
          >
            <div>
              {/* Rating stars */}
              <div className="flex items-center gap-1 text-warning mb-4">
                {[...Array(item.rating || 5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-xs text-muted leading-relaxed italic mb-6">
                "{item.quoteId || item.quote}"
              </p>
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-fg">{item.author}</div>
                <div className="text-xs font-sans text-muted">
                  {item.role}, <span className="text-fg">{item.company}</span>
                </div>
                <div className="text-[11px] font-sans text-muted mt-0.5 flex items-center gap-1">
                  <MapPin size={10} />
                  <span>{item.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="min-h-9 min-w-9 rounded-control bg-panel hover:bg-panel-hover text-muted hover:text-fg border border-line transition-colors flex items-center justify-center"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => setDeleteTarget({ id: item.id, author: item.author })}
                  className="min-h-9 min-w-9 rounded-control bg-panel hover:bg-danger/10 text-muted hover:text-danger border border-line hover:border-danger/30 transition-colors flex items-center justify-center"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
      )}

      {deleteTarget && (
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm"
          title="Delete testimonial"
          description={`This will permanently remove the testimonial from the CMS. Review the author before confirming.`}>
          <div className="space-y-4">
            <div className="rounded-control border border-danger/30 bg-danger/5 p-3">
              <p className="text-sm font-semibold text-fg">{deleteTarget.author}</p>
              <p className="mt-1 text-xs text-muted">The testimonial will no longer appear on the public site.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={() => void handleDelete()}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Add / Edit Testimonial */}
      {isModalOpen && editingItem && (
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg" title={editingItem.author ? `Edit: ${editingItem.author}` : (language === 'id' ? 'Tambah Testimoni Klien' : 'Add Client Testimonial')}>
          <div className="space-y-4">
            <form onSubmit={handleSaveModal} className="space-y-4">
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

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{language === 'id' ? 'Batal' : 'Cancel'}</Button>
                <Button type="submit">{language === 'id' ? 'Simpan Testimoni' : 'Save Testimonial'}</Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

    </div>
  );
};
export default AdminCmsTestimonials;
