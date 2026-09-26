import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Star,
  DollarSign,
  Briefcase,
  Globe,
  Mail,
  Phone,
  Tag,
  ExternalLink,
  Github,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Edit3,
  X,
  Check,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  AgencyVendor,
  VendorContract,
  VendorType,
  VendorStatus,
} from '../../lib/vendorStore';
import { formatAmount, getActiveCurrency, CurrencyCode, CURRENCY_EVENT } from '../../lib/currency';
import { useLanguage } from '../../lib/LanguageContext';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/apiClient';
import { hasAdminPermission } from '../../lib/adminAuth';

export const AdminVendors: React.FC = () => {
  const { t, language } = useLanguage();
  const canManageVendors = hasAdminPermission('canManageVendors');
  const canViewVendors = canManageVendors || hasAdminPermission('canViewFinancials');
  const [vendors, setVendors] = useState<AgencyVendor[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [vettedFilter, setVettedFilter] = useState<string>('All');

  // Modals & Drawers
  const [selectedVendor, setSelectedVendor] = useState<AgencyVendor | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editingVendor, setEditingVendor] = useState<AgencyVendor | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formType, setFormType] = useState<VendorType>('freelancer');
  const [formCategory, setFormCategory] = useState<AgencyVendor['primaryCategory']>('Frontend Dev');
  const [formSkills, setFormSkills] = useState('React, TypeScript, Tailwind CSS');
  const [formRate, setFormRate] = useState<number>(450000);
  const [formRating, setFormRating] = useState<number>(5.0);
  const [formLocation, setFormLocation] = useState('Jakarta, Indonesia');
  const [formPortfolio, setFormPortfolio] = useState('');
  const [formGithub, setFormGithub] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<VendorStatus>('active');
  const [formIsVetted, setFormIsVetted] = useState<boolean>(true);

  const loadVendors = async () => {
    if (!canViewVendors) {
      setVendors([]);
      return;
    }
    try {
      const res = await api.vendors.getAll();
      if (res.success && Array.isArray(res.data?.vendors)) {
        setVendors(res.data.vendors as AgencyVendor[]);
      }
    } catch {
      setStatusMessage(language === 'id' ? 'Vendor gagal dimuat.' : 'Failed to load vendors.');
    }
  };

  useEffect(() => {
    void loadVendors();
  }, [canViewVendors, language]);

  useEffect(() => {
    const handleCurrency = (e: Event) => {
      const custom = e as CustomEvent<{ currency: CurrencyCode }>;
      if (custom.detail?.currency) {
        setCurrency(custom.detail.currency);
      }
    };
    window.addEventListener(CURRENCY_EVENT, handleCurrency);
    return () => window.removeEventListener(CURRENCY_EVENT, handleCurrency);
  }, []);

  // Filtered list
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.companyName && v.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = selectedCategory === 'All' || v.primaryCategory === selectedCategory;
      const matchType = selectedType === 'All' || v.type === selectedType;
      const matchStatus = statusFilter === 'All' || v.status === statusFilter;
      const matchVetted = vettedFilter === 'All' || (vettedFilter === 'vetted' ? (v.isVetted ?? true) : !(v.isVetted ?? true));

      return matchSearch && matchCat && matchType && matchStatus && matchVetted;
    });
  }, [vendors, searchQuery, selectedCategory, selectedType, statusFilter, vettedFilter]);

  const handleOpenAdd = () => {
    setEditingVendor(null);
    setFormName('');
    setFormCompany('');
    setFormEmail('');
    setFormPhone('');
    setFormType('freelancer');
    setFormCategory('Frontend Dev');
    setFormSkills('React, TypeScript, Tailwind CSS');
    setFormRate(450000);
    setFormRating(5.0);
    setFormLocation('Jakarta, Indonesia');
    setFormPortfolio('');
    setFormGithub('');
    setFormNotes('');
    setFormStatus('active');
    setFormIsVetted(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: AgencyVendor) => {
    setEditingVendor(v);
    setFormName(v.name);
    setFormCompany(v.companyName || '');
    setFormEmail(v.email);
    setFormPhone(v.phone);
    setFormType(v.type);
    setFormCategory(v.primaryCategory);
    setFormSkills(v.skills.join(', '));
    setFormRate(v.hourlyRate);
    setFormRating(v.rating);
    setFormLocation(v.location);
    setFormPortfolio(v.portfolioUrl || '');
    setFormGithub(v.githubUrl || '');
    setFormNotes(v.notes || '');
    setFormStatus(v.status);
    setFormIsVetted(v.isVetted ?? true);
    setIsModalOpen(true);
  };

  const handleToggleVettedQuick = (v: AgencyVendor, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated: AgencyVendor = {
      ...v,
      isVetted: !(v.isVetted ?? true),
      updatedAt: new Date().toISOString()
    };
    if (!canManageVendors) return;
    void api.vendors.update(updated.id, updated).then((res) => {
      if (res.success && res.data?.vendor) {
        setVendors(prev => prev.map(item => item.id === updated.id ? res.data!.vendor as AgencyVendor : item));
      }
    }).catch(() => {
      setStatusMessage(language === 'id' ? 'Gagal memperbarui vendor.' : 'Failed to update vendor.');
    });
    if (selectedVendor && selectedVendor.id === v.id) {
      setSelectedVendor(updated);
    }
    setStatusMessage(
      language === 'id' 
        ? `Status verifikasi ${v.name} diubah menjadi ${updated.isVetted ? 'Terverifikasi (Vetted)' : 'Standar'}` 
        : `Verification status for ${v.name} set to ${updated.isVetted ? 'Vetted' : 'Standard'}`
    );
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert('Nama vendor dan email wajib diisi.');
      return;
    }

    const skillsArray = formSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const vendorToSave: AgencyVendor = {
      id: editingVendor ? editingVendor.id : 'ven_' + Date.now().toString(36),
      name: formName.trim(),
      companyName: formCompany.trim() || undefined,
      email: formEmail.trim(),
      phone: formPhone.trim(),
      type: formType,
      primaryCategory: formCategory,
      skills: skillsArray,
      hourlyRate: Number(formRate) || 0,
      currency: 'IDR',
      rating: Number(formRating) || 5.0,
      completedProjectsCount: editingVendor ? editingVendor.completedProjectsCount : 0,
      status: formStatus,
      isVetted: formIsVetted,
      location: formLocation.trim(),
      portfolioUrl: formPortfolio.trim() || undefined,
      githubUrl: formGithub.trim() || undefined,
      contracts: editingVendor ? editingVendor.contracts : [],
      notes: formNotes.trim() || undefined,
      createdAt: editingVendor ? editingVendor.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!canManageVendors) {
      setStatusMessage(language === 'id' ? 'Anda tidak memiliki izin mengelola vendor.' : 'You do not have permission to manage vendors.');
      return;
    }
    const response = editingVendor
      ? await api.vendors.update(vendorToSave.id, vendorToSave)
      : await api.vendors.create(vendorToSave);
    if (!response.success || !response.data?.vendor) {
      setStatusMessage(response.error || (language === 'id' ? 'Vendor gagal disimpan.' : 'Failed to save vendor.'));
      return;
    }
    const savedVendor = response.data.vendor as AgencyVendor;
    setVendors(prev => editingVendor
      ? prev.map(item => item.id === savedVendor.id ? savedVendor : item)
      : [savedVendor, ...prev]);
    setIsModalOpen(false);
    setStatusMessage(language === 'id' ? 'Data vendor berhasil disimpan!' : 'Vendor profile saved successfully!');
    setTimeout(() => setStatusMessage(null), 3500);

    if (selectedVendor && selectedVendor.id === vendorToSave.id) {
      setSelectedVendor(vendorToSave);
    }
  };

  const handleDeleteVendor = (id: string, name: string) => {
    if (!canManageVendors) return;
    setDeleteTarget({ id, name });
  };

  const confirmDeleteVendor = async (id: string) => {
      void api.vendors.delete(id).then((res) => {
        if (!res.success) {
          setStatusMessage(res.error || (language === 'id' ? 'Vendor gagal dihapus.' : 'Failed to delete vendor.'));
          return;
        }
        setVendors(prev => prev.filter(item => item.id !== id));
        if (selectedVendor?.id === id) {
          setIsDrawerOpen(false);
          setSelectedVendor(null);
        }
        setStatusMessage(language === 'id' ? 'Vendor telah dihapus.' : 'Vendor deleted successfully.');
        setTimeout(() => setStatusMessage(null), 3000);
      }).catch(() => {
        setStatusMessage(language === 'id' ? 'Vendor gagal dihapus.' : 'Failed to delete vendor.');
      });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="ams-page-header flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="ams-page-title flex items-center gap-2.5"><Users className="text-accent-text shrink-0" size={22} /><span>{language === 'id' ? 'Direktori Vendor & Kontraktor' : 'Vendor & Talent Directory'}</span></h1>
          <p className="text-[13px] leading-[18px] font-sans text-muted mt-1 max-w-3xl">
            {language === 'id'
              ? 'Database mitra agensi, freelance spesialis terverifikasi, tarif per jam, dan evaluasi performa SLA.'
              : 'Database of vetted agency partners, specialized freelance contractors, hourly rates, and SLA contract ratings.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleOpenAdd}
                            disabled={!canManageVendors}
            className="min-h-10 px-4 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Plus size={15} />
            <span>{language === 'id' ? 'Tambah Vendor' : 'Add Vendor'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {statusMessage && (
        <div className="p-3 rounded-card bg-success/10 border border-success/30 text-success text-xs font-sans flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-success hover:text-fg">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        <div className="w-full h-full p-4 rounded-card bg-panel border border-line flex flex-col justify-between">
          <div className="text-[11px] font-sans text-muted normal-case tracking-normal">
            {language === 'id' ? 'Total Mitra Terdaftar' : 'Total Vetted Vendors'}
          </div>
          <div className="mt-2 text-2xl font-semibold font-sans text-fg">{vendors.length}</div>
          <div className="text-[10px] font-sans text-success mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>{vendors.filter(v => v.status === 'active').length} Active</span>
          </div>
        </div>

        <div className="w-full h-full p-4 rounded-card bg-panel border border-line flex flex-col justify-between">
          <div className="text-[11px] font-sans text-muted normal-case tracking-normal">
            {language === 'id' ? 'Spesialis Freelance' : 'Freelance Talent'}
          </div>
          <div className="mt-2 text-2xl font-semibold font-sans text-fg">
            {vendors.filter(v => v.type === 'freelancer' || v.type === 'contractor').length}
          </div>
          <div className="text-[10px] font-sans text-muted mt-1">Design, Dev & 3D</div>
        </div>

        <div className="w-full h-full p-4 rounded-card bg-panel border border-line flex flex-col justify-between">
          <div className="text-[11px] font-sans text-muted normal-case tracking-normal">
            {language === 'id' ? 'Partner Agensi' : 'Agency Partners'}
          </div>
          <div className="mt-2 text-2xl font-semibold font-sans text-fg">
            {vendors.filter(v => v.type === 'agency_partner').length}
          </div>
          <div className="text-[10px] font-sans text-info mt-1">DevOps, Cloud & Legal</div>
        </div>

        <div className="w-full h-full p-4 rounded-card bg-panel border border-line flex flex-col justify-between">
          <div className="text-[11px] font-sans text-muted normal-case tracking-normal">
            {language === 'id' ? 'Rata-rata Rating SLA' : 'Avg Performance SLA'}
          </div>
          <div className="mt-2 text-2xl font-semibold font-sans text-fg flex items-center gap-1.5">
            <span>4.9</span>
            <Star size={16} className="text-warning fill-warning" />
          </div>
          <div className="text-[10px] font-sans text-muted mt-1">From 42 verified deliverables</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="w-full p-4 rounded-card bg-panel border border-line flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-96">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'id' ? 'Cari nama, keahlian, atau email...' : 'Search name, skills, or email...'}
            className="w-full pl-9 pr-3 py-2 rounded-control bg-panel border border-line text-xs font-sans text-fg placeholder:text-muted focus:outline-none focus:border-accent min-h-10"
          />
        </div>

        <div className="flex flex-nowrap items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          <div className="w-[160px] shrink-0 lg:w-40">
            <CustomSelect
              value={selectedCategory}
              onChange={val => setSelectedCategory(val)}
              options={[
                { value: 'All', label: language === 'id' ? 'Semua Bidang' : 'All Categories' },
                { value: 'Frontend Dev', label: 'Frontend Dev' },
                { value: 'Backend Dev', label: 'Backend Dev' },
                { value: 'UI/UX Design', label: 'UI/UX Design' },
                { value: 'DevOps & Cloud', label: 'DevOps & Cloud' },
                { value: '3D & Motion', label: '3D & Motion' },
                { value: 'SEO & Copy', label: 'SEO & Copy' }
              ]}
            />
          </div>

          <div className="w-[144px] shrink-0 lg:w-36">
            <CustomSelect
              value={selectedType}
              onChange={val => setSelectedType(val)}
              options={[
                { value: 'All', label: language === 'id' ? 'Semua Tipe' : 'All Types' },
                { value: 'freelancer', label: 'Freelancer' },
                { value: 'contractor', label: 'Contractor' },
                { value: 'agency_partner', label: 'Agency Partner' }
              ]}
            />
          </div>

          <div className="w-[128px] shrink-0 lg:w-32">
            <CustomSelect
              value={statusFilter}
              onChange={val => setStatusFilter(val)}
              options={[
                { value: 'All', label: language === 'id' ? 'Semua Status' : 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'under_review', label: 'Review' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />
          </div>

          <div className="w-36">
            <CustomSelect
              value={vettedFilter}
              onChange={val => setVettedFilter(val)}
              options={[
                { value: 'All', label: language === 'id' ? 'Semua Verifikasi' : 'All Verification' },
                { value: 'vetted', label: language === 'id' ? 'Hanya Vetted' : 'Vetted Only' },
                { value: 'unvetted', label: language === 'id' ? 'Belum Vetted' : 'Unvetted' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 w-full">
        {filteredVendors.map(vendor => (
          <div
            key={vendor.id}
            className="w-full h-full p-4 rounded-card bg-panel border border-line hover:border-muted transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Header Card */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-card bg-panel border border-line flex items-center justify-center font-semibold text-sm text-fg">
                    {vendor.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-semibold text-fg group-hover:text-accent transition-colors">
                        {vendor.name}
                      </h3>
                      {(vendor.isVetted ?? true) && (
                        <span 
                          onClick={(e) => handleToggleVettedQuick(vendor, e)}
                          title={language === 'id' ? 'Mitra Terverifikasi Kapitech (Klik untuk ubah)' : 'Kapitech Vetted Talent (Click to toggle)'}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-badge text-[9px] font-sans font-semibold bg-accent/10 text-accent-text border border-accent/30 cursor-pointer hover:bg-accent/15 transition-colors"
                        >
                          <ShieldCheck size={10} />
                          <span>Vetted</span>
                        </span>
                      )}
                    </div>
                    {vendor.companyName && (
                      <p className="text-[11px] font-sans text-muted flex items-center gap-1">
                        <Building2 size={11} className="text-muted" />
                        <span>{vendor.companyName}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-badge text-[10px] font-sans capitalize ${
                      vendor.status === 'active'
                        ? 'bg-success/10 text-success border border-success/30'
                        : vendor.status === 'under_review'
                        ? 'bg-warning/10 text-warning border border-warning/30'
                        : 'bg-panel text-muted border border-line'
                    }`}
                  >
                    {vendor.status}
                  </span>
                </div>
              </div>

              {/* Category & Hourly Rate */}
              <div className="mt-4 flex items-center justify-between pb-3 border-b border-line">
                <div>
                  <span className="text-[10px] font-sans text-muted normal-case block">
                    {language === 'id' ? 'Spesialisasi' : 'Pillar'}
                  </span>
                  <span className="text-xs font-semibold text-fg mt-0.5 block">{vendor.primaryCategory}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-sans text-muted normal-case block">
                    {language === 'id' ? 'Tarif Jam' : 'Hourly Rate'}
                  </span>
                  <span className="text-xs font-sans font-semibold text-success mt-0.5 block">
                    {formatAmount(vendor.hourlyRate, currency)}/hr
                  </span>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="mt-3.5 space-y-1.5">
                <span className="text-[10px] font-sans text-muted normal-case block">
                  {language === 'id' ? 'Keahlian Inti' : 'Core Tech Stack'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {vendor.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-chip bg-panel border border-line text-[10px] font-sans text-muted"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-3.5 border-t border-line flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-sans text-warning">
                <Star size={13} className="fill-warning text-warning" />
                <span className="font-semibold">{vendor.rating.toFixed(1)}</span>
                <span className="text-[10px] text-muted">({vendor.completedProjectsCount} projects)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setIsDrawerOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-control bg-panel hover:bg-panel-hover border border-line text-xs font-sans text-fg transition-colors"
                >
                  {language === 'id' ? 'Detail' : 'View'}
                </button>
                <button
                  onClick={() => handleOpenEdit(vendor)}
                                  disabled={!canManageVendors}
                  className="p-1.5 rounded-control bg-panel hover:bg-panel-hover border border-line text-muted hover:text-fg transition-colors"
                  title="Edit Vendor"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                           disabled={!canManageVendors}
                  className="p-1.5 rounded-control bg-panel hover:bg-danger/10 border border-line text-muted hover:text-danger transition-colors"
                  title="Delete Vendor"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="w-full p-12 rounded-card bg-panel border border-line text-center">
          <Users size={32} className="mx-auto text-muted mb-3" />
          <h3 className="text-sm font-semibold text-fg">
            {language === 'id' ? 'Tidak ada vendor yang cocok' : 'No matching vendors found'}
          </h3>
          <p className="text-xs font-sans text-muted mt-1 max-w-sm mx-auto">
            {language === 'id'
              ? 'Ubah kata kunci pencarian atau tambah profil vendor baru untuk studio Kapitech.'
              : 'Try adjusting your search criteria or register a new verified vendor into the system.'}
          </p>
        </div>
      )}

      {/* Detail Slideover Drawer */}
      {isDrawerOpen && selectedVendor && (
        <Modal
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          size="lg"
          title={selectedVendor.name}
          description={selectedVendor.primaryCategory}
        >
          <div className="space-y-4 text-xs font-sans">
            <div>
              <div className="py-4 space-y-4 text-xs font-sans">
                <div>
                  <span className="text-[10px] font-sans text-muted normal-case block mb-1">
                    {language === 'id' ? 'Kontak & Lokasi' : 'Contact & Location'}
                  </span>
                  <div className="space-y-1.5 bg-panel p-3 rounded-card border border-line">
                    <div className="flex items-center gap-2 text-muted">
                      <Mail size={13} className="text-accent" />
                      <a href={`mailto:${selectedVendor.email}`} className="text-fg hover:underline">
                        {selectedVendor.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <Phone size={13} className="text-success" />
                      <span>{selectedVendor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <Globe size={13} className="text-info" />
                      <span>{selectedVendor.location}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-sans text-muted normal-case block mb-1">
                    {language === 'id' ? 'Tarif & Kontrak' : 'Rate & Contracts'}
                  </span>
                  <div className="bg-panel p-3 rounded-card border border-line flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-sans text-muted">Standard Hourly</span>
                      <p className="text-sm font-sans font-semibold text-success">
                        {formatAmount(selectedVendor.hourlyRate, currency)}/hr
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-sans text-muted">Engagement</span>
                      <p className="text-xs font-semibold text-fg capitalize">{selectedVendor.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>

                {selectedVendor.notes && (
                  <div>
                    <span className="text-[10px] font-sans text-muted normal-case block mb-1">
                      {language === 'id' ? 'Catatan Kinerja' : 'Performance Notes'}
                    </span>
                    <div className="bg-panel p-3 rounded-card border border-line text-muted leading-relaxed">
                      {selectedVendor.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  handleOpenEdit(selectedVendor);
                }}
                className="px-4 py-2 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-semibold"
              >
                {language === 'id' ? 'Edit Profil' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg" title={editingVendor ? (language === 'id' ? 'Edit Profil Vendor' : 'Edit Vendor Profile') : (language === 'id' ? 'Tambah Vendor Baru' : 'Add New Talent Vendor')} description={language === 'id' ? 'Kelola profil, keahlian, dan evaluasi SLA vendor.' : 'Manage vendor profile, skills, and SLA review.'}>
            <form onSubmit={handleSaveVendor} className="py-4 space-y-3.5 max-h-[calc(100dvh-24px)] overflow-y-auto pr-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-sans text-muted normal-case block mb-1">
                    {language === 'id' ? 'Nama Lengkap *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Dimas Pratama"
                    className="w-full px-3 py-2 rounded-control bg-panel border border-line text-xs font-sans text-fg focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-sans text-muted normal-case block mb-1">
                    {language === 'id' ? 'Nama Perusahaan / Studio' : 'Company / Studio'}
                  </label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={e => setFormCompany(e.target.value)}
                    placeholder="e.g. PixelCraft Studio"
                    className="w-full px-3 py-2 rounded-control bg-panel border border-line text-xs font-sans text-fg focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-sans text-muted normal-case block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="talent@example.com"
                    className="w-full px-3 py-2 rounded-control bg-panel border border-line text-xs font-sans text-fg focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-sans text-muted normal-case block mb-1">
                    {language === 'id' ? 'Telepon / WhatsApp' : 'Phone / WhatsApp'}
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="+62 812..."
                    className="w-full px-3 py-2 rounded-control bg-panel border border-line text-xs font-sans text-fg focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-sans text-muted normal-case block mb-1">
                    {language === 'id' ? 'Kategori Layanan' : 'Category'}
                  </label>
                  <CustomSelect
                    value={formCategory}
                    onChange={val => setFormCategory(val as any)}
                    options={[
                      { value: 'Frontend Dev', label: 'Frontend Dev' },
                      { value: 'Backend Dev', label: 'Backend Dev' },
                      { value: 'UI/UX Design', label: 'UI/UX Design' },
                      { value: 'DevOps & Cloud', label: 'DevOps & Cloud' },
                      { value: '3D & Motion', label: '3D & Motion' },
                      { value: 'SEO & Copy', label: 'SEO & Copy' }
                    ]}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-sans text-muted normal-case block mb-1">
                    {language === 'id' ? 'Tarif per Jam (IDR)' : 'Hourly Rate (IDR)'}
                  </label>
                  <input
                    type="number"
                    value={formRate}
                    onChange={e => setFormRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-control bg-panel border border-line text-xs font-sans text-fg focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-sans text-muted normal-case block mb-1">
                    {language === 'id' ? 'Tipe Kemitraan' : 'Engagement Type'}
                  </label>
                  <CustomSelect
                    value={formType}
                    onChange={val => setFormType(val as any)}
                    options={[
                      { value: 'freelancer', label: 'Freelancer' },
                      { value: 'contractor', label: 'Contractor' },
                      { value: 'agency_partner', label: 'Agency Partner' }
                    ]}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-sans text-muted normal-case block mb-1">
                    {language === 'id' ? 'Status' : 'Status'}
                  </label>
                  <CustomSelect
                    value={formStatus}
                    onChange={val => setFormStatus(val as any)}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'under_review', label: 'Under Review' },
                      { value: 'inactive', label: 'Inactive' }
                    ]}
                  />
                </div>
              </div>

              {/* Vetted Status Verification Toggle */}
              <div className="p-3 rounded-card bg-panel border border-line flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-fg flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-accent" />
                    <span>{language === 'id' ? 'Mitra Terverifikasi (Vetted)' : 'Kapitech Vetted Talent'}</span>
                  </span>
                  <p className="text-[11px] text-muted mt-0.5">
                    {language === 'id' 
                      ? 'Tandai bahwa portfolio, NDA, dan review SLA telah divalidasi oleh partner agensi.' 
                      : 'Flag that NDA, portfolio deliverables, and background check have been passed.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formIsVetted}
                  onChange={e => setFormIsVetted(e.target.checked)}
                  className="w-4 h-4 rounded bg-panel border-line text-accent focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-sans text-muted normal-case block mb-1">
                  {language === 'id' ? 'Keahlian (pisahkan koma)' : 'Skills (comma separated)'}
                </label>
                <input
                  type="text"
                  value={formSkills}
                  onChange={e => setFormSkills(e.target.value)}
                  placeholder="Next.js, Tailwind, Docker, Three.js"
                  className="w-full px-3 py-2 rounded-control bg-panel border border-line text-xs font-sans text-fg focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-[11px] font-sans text-muted normal-case block mb-1">
                  {language === 'id' ? 'Catatan & Evaluasi SLA' : 'Notes & SLA Review'}
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Reliable performance and clean deliverables..."
                  className="w-full px-3 py-2 rounded-control bg-panel border border-line text-xs font-sans text-fg focus:outline-none focus:border-accent"
                />
              </div>

              <div className="pt-4 border-t border-line flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-10 px-4 py-2 rounded-control bg-panel hover:bg-panel-hover text-fg text-xs font-semibold border border-line"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-semibold"
                >
                  {language === 'id' ? 'Simpan Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>
      </Modal>
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        size="sm"
        title={language === 'id' ? 'Hapus vendor?' : 'Delete vendor?'}
        description={language === 'id' ? `Vendor ${deleteTarget?.name || ''} akan dihapus dari direktori.` : `Vendor ${deleteTarget?.name || ''} will be removed from the directory.`}
      >
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <button type="button" onClick={() => setDeleteTarget(null)} className="min-h-10 px-4 rounded-control border border-line bg-panel text-xs text-muted">Cancel</button>
          <button type="button" onClick={() => deleteTarget && void confirmDeleteVendor(deleteTarget.id)} className="min-h-10 px-4 rounded-control bg-danger text-white text-xs font-semibold">Delete</button>
        </div>
      </Modal>
    </div>
  );
};
