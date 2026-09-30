import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
// Shared module chrome renders the canonical ams-dashboard-header primitive.
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
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { api } from '../../lib/apiClient';
import { hasAdminPermission } from '../../lib/adminAuth';

import { AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminSectionTabs } from '../../components/admin/AdminModulePrimitives';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';
export const AdminVendors: React.FC = () => {
  const { t, language } = useLanguage();
  const canManageVendors = hasAdminPermission('canManageVendors');
  const canViewVendors =
    canManageVendors ||
    hasAdminPermission('canViewFinancials') ||
    hasAdminPermission('canManageProjects') ||
    hasAdminPermission('canManageKanbanTasks');
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
      setStatusMessage(language === 'id' ? 'Nama vendor dan email wajib diisi.' : 'Vendor name and email are required.');
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
    <AdminPageShell featureSlug="vendors-module">
      {/* Top Header */}
      <AdminModuleHeader
        className="mb-0"
        title={(
          <span className="flex items-center gap-2.5"><Users className="shrink-0 text-accent-text" size={22} />{language === 'id' ? 'Personel Vendor' : 'Vendor Personnel'}</span>
        )}
        description={language === 'id' ? 'Direktori personel vendor, freelance, kontraktor, dan partner operasional yang digunakan lintas project.' : 'Directory of vendor personnel, freelancers, contractors, and operational partners used across projects.'}
        actions={(
          <button type="button" onClick={handleOpenAdd} disabled={!canManageVendors} className="h-9 min-h-9 px-3.5 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:cursor-not-allowed disabled:opacity-50">
            <Plus size={15} />
            <span>{language === 'id' ? 'Tambah Vendor' : 'Add Vendor'}</span>
          </button>
        )}
      />


      <div className="min-[900px]:hidden min-w-0" data-ams-slug="team-mobile-tabs">
        <AdminSectionTabs
          ariaLabel="Team sections"
          activeKey="vendor-directory"
          items={[
            { key: 'team-directory', label: 'Team Directory', to: '/admin/team' },
            { key: 'vendor-directory', label: 'Vendor Directory', to: '/admin/vendors' },
            { key: 'capacity-allocation', label: 'Capacity & Allocation', to: '/admin/team?view=capacity-allocation' },
            { key: 'skill-matrix', label: 'Skill Matrix', to: '/admin/team?view=skill-matrix' },
            { key: 'time-logs', label: 'Time Logs', to: '/admin/time-logs' },
          ]}
        />
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
      <section aria-label="Vendor snapshot" className="rounded-card border border-line bg-panel p-4">
        <div className="mb-3 flex items-end justify-between gap-3 border-b border-line pb-3"><div><h2 className="text-sm font-semibold text-fg">{language === 'id' ? 'Ringkasan vendor' : 'Vendor snapshot'}</h2><p className="mt-1 text-xs text-muted">{language === 'id' ? 'Komposisi talent, partner, dan kualitas operasional.' : 'Talent mix, agency partners, and operational quality signals.'}</p></div><span className="text-[11px] font-medium tabular-nums text-muted">{vendors.length} total</span></div>
        <AdminMetricStrip
          className="lg:grid-cols-4"
          metrics={[
            { id: 'total', label: language === 'id' ? 'Total Mitra Terdaftar' : 'Total Vetted Vendors', value: vendors.length, context: vendors.filter(v => v.status === 'active').length + ' Active', sparkline: [vendors.filter(v => v.type === 'freelancer' || v.type === 'contractor').length, vendors.filter(v => v.type === 'agency_partner').length, vendors.length], icon: <Users size={16} strokeWidth={1.8} /> },
            { id: 'freelance', label: language === 'id' ? 'Spesialis Freelance' : 'Freelance Talent', value: vendors.filter(v => v.type === 'freelancer' || v.type === 'contractor').length, context: 'Design, Dev & 3D', sparkline: [vendors.filter(v => v.type === 'freelancer').length, vendors.filter(v => v.type === 'contractor').length, vendors.filter(v => v.type === 'freelancer' || v.type === 'contractor').length], icon: <Briefcase size={16} strokeWidth={1.8} /> },
            { id: 'agency', label: language === 'id' ? 'Partner Agensi' : 'Agency Partners', value: vendors.filter(v => v.type === 'agency_partner').length, context: 'DevOps, Cloud & Legal', sparkline: [vendors.filter(v => v.type === 'saas_vendor').length, vendors.filter(v => v.type === 'agency_partner').length, vendors.filter(v => v.type === 'freelancer').length], icon: <Building2 size={16} strokeWidth={1.8} />, toneClassName: 'text-info' },
            { id: 'sla', label: language === 'id' ? 'Rata-rata Rating SLA' : 'Avg Performance SLA', value: <span className="inline-flex items-center gap-1.5">4.9 <Star size={16} className="text-warning fill-warning" /></span>, context: 'From 42 verified deliverables', sparkline: vendors.slice(0, 8).map(v => v.rating), icon: <CheckCircle2 size={16} strokeWidth={1.8} />, toneClassName: 'text-success' }
          ]}
        />
      </section>

      {/* Filter & Search Bar */}
      <section className="w-full rounded-card bg-panel border border-line p-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between" aria-label="Vendor directory controls">
        <div className="relative w-full lg:w-96">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={language === 'id' ? 'Cari nama, keahlian, atau email...' : 'Search name, skills, or email...'}
            className="w-full h-9 min-h-9 pl-9 pr-3 rounded-control bg-bg border border-line text-xs font-sans text-fg placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-nowrap items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0 custom-scrollbar">
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
      </section>

      {/* Vendors Grid */}
      <section aria-label="Vendor directory list"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filteredVendors.map(vendor => (
          <div
            key={vendor.id}
            className="w-full h-full rounded-card border border-line bg-panel p-4 transition-[border-color,background-color] hover:border-accent/30 flex flex-col justify-between group"
          >
            <div>
              {/* Header Card */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ProfileIdentity profile={{ name: vendor.name, role: undefined, contextLabel: [vendor.primaryCategory, vendor.companyName].filter(Boolean).join(' · ') || undefined, companyEmail: vendor.email, phone: vendor.phone }} size="md" showRole={false} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">

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
      </div></section>

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
          size="xl"
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
                  <div className="space-y-1.5 bg-panel p-4 rounded-card border border-line">
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
                  <div className="bg-panel p-4 rounded-card border border-line flex items-center justify-between">
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
                    <div className="bg-panel p-4 rounded-card border border-line text-muted leading-relaxed">
                      {selectedVendor.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-end gap-2">
              <Button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  handleOpenEdit(selectedVendor);
                }}
              >
                {language === 'id' ? 'Edit Profil' : 'Edit Profile'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Modal */}
      <Drawer
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        title={editingVendor ? (language === 'id' ? 'Edit Profil Vendor' : 'Edit Vendor Profile') : (language === 'id' ? 'Tambah Vendor Baru' : 'Add New Talent Vendor')}
        description={language === 'id' ? 'Kelola profil, keahlian, dan evaluasi SLA vendor.' : 'Manage vendor profile, skills, and SLA review.'}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              {language === 'id' ? 'Batal' : 'Cancel'}
            </Button>
            <Button type="submit" form="vendor-form">
              {language === 'id' ? 'Simpan Vendor' : 'Save Vendor'}
            </Button>
          </>
        )}
      >
            <form id="vendor-form" onSubmit={handleSaveVendor} className="space-y-3.5">
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
              <div className="p-4 rounded-card bg-panel border border-line flex items-center justify-between">
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
                  className="w-4 h-4 rounded-badge bg-panel border-line text-accent focus:ring-0 focus:ring-offset-0 cursor-pointer"
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

            </form>
      </Drawer>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={language === 'id' ? 'Hapus vendor?' : 'Delete vendor?'}
        description={language === 'id' ? `Vendor ${deleteTarget?.name || ''} akan dihapus dari direktori.` : `Vendor ${deleteTarget?.name || ''} will be removed from the directory.`}
        confirmLabel={language === 'id' ? 'Hapus' : 'Delete'}
        onConfirm={() => { if (deleteTarget) void confirmDeleteVendor(deleteTarget.id); }}
      />
    </AdminPageShell>
  );
};
