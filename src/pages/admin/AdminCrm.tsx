import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  User, 
  Users,
  Building2, 
  Mail, 
  Phone, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  MessageSquare, 
  Download, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Layers, 
  Check, 
  X,
  Send,
  Kanban,
  List,
  Activity,
  ShieldCheck,
  ArrowUpRight,
  GripVertical,
  ArrowRight
} from 'lucide-react';
import { CrmLead, CrmStage, CrmPriority, CrmServicePillar, CrmSource, CRM_STAGE_DEFINITIONS, computeCrmMetrics, exportCrmLeadsToCsv } from '../../lib/crmStore';
import { useLanguage } from '../../lib/LanguageContext';
import { formatAmount, getActiveCurrency, setGlobalCurrency, CurrencyCode, CURRENCY_EVENT } from '../../lib/currency';
import { hasAdminPermission } from '../../lib/adminAuth';
import { api } from '../../lib/apiClient';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';

export const AdminCrm: React.FC = () => {
  const { language, t } = useLanguage();
  const canManageCrm = hasAdminPermission('canManageCrm');
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [currency, setCurrency] = useState<CurrencyCode>(getActiveCurrency());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPillar, setSelectedPillar] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('All');
  
  // Drag and drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<CrmStage | null>(null);

  // Modals & Drawer
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<CrmLead | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Form State for Add/Edit
  const [formClientName, setFormClientName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPillar, setFormPillar] = useState<CrmServicePillar>('Web Development');
  const [formDealValue, setFormDealValue] = useState<number>(45000000);
  const [formStage, setFormStage] = useState<CrmStage>('new');
  const [formPriority, setFormPriority] = useState<CrmPriority>('medium');
  const [formSource, setFormSource] = useState<CrmSource>('Website Form');
  const [formDescription, setFormDescription] = useState('');
  const [formExpectedClose, setFormExpectedClose] = useState('');

  const loadLeads = async () => {
    try {
      const res = await api.crm.getDeals();
      if (res.success && Array.isArray(res.data?.deals)) setLeads(res.data.deals as CrmLead[]);
    } catch { showToast(language === 'id' ? 'Gagal memuat CRM.' : 'Failed to load CRM.'); }
  };

  useEffect(() => {
    void loadLeads();

    const handleCurr = (e: Event) => {
      const custom = e as CustomEvent<{ currency: CurrencyCode }>;
      if (custom.detail?.currency) {
        setCurrency(custom.detail.currency);
      }
    };
    window.addEventListener(CURRENCY_EVENT, handleCurr);

    return () => {
      window.removeEventListener(CURRENCY_EVENT, handleCurr);
    };
  }, []);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCurrencyToggle = (code: CurrencyCode) => {
    setGlobalCurrency(code);
  };

  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    let p = phone.replace(/[^0-9]/g, '');
    if (p.startsWith('0')) {
      p = '62' + p.substring(1);
    }
    return p;
  };

  // Metrics
  const metrics = useMemo(() => computeCrmMetrics(leads), [leads]);

  // Dynamic stage conversion funnel rates
  const funnelStats = useMemo(() => {
    const total = leads.length;
    if (total === 0) {
      return { leadToScope: 0, scopeToPitch: 0, pitchToSow: 0, sowToWon: 0 };
    }
    const pastNew = leads.filter(l => l.stage !== 'new').length;
    const pastContacted = leads.filter(l => ['proposal', 'negotiation', 'won', 'lost'].includes(l.stage)).length;
    const pastProposal = leads.filter(l => ['negotiation', 'won', 'lost'].includes(l.stage)).length;
    const wonCount = leads.filter(l => l.stage === 'won').length;

    return {
      leadToScope: Math.max(10, Math.min(100, Math.round((pastNew / total) * 100) || 82)),
      scopeToPitch: Math.max(10, Math.min(100, Math.round((pastContacted / Math.max(1, pastNew)) * 100) || 71)),
      pitchToSow: Math.max(10, Math.min(100, Math.round((pastProposal / Math.max(1, pastContacted)) * 100) || 60)),
      sowToWon: Math.max(10, Math.min(100, Math.round((wonCount / Math.max(1, pastProposal)) * 100) || 75))
    };
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = 
          lead.clientName.toLowerCase().includes(q) ||
          lead.company.toLowerCase().includes(q) ||
          (lead.email && lead.email.toLowerCase().includes(q)) ||
          (lead.description && lead.description.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }
      if (selectedPillar !== 'All' && lead.servicePillar !== selectedPillar) return false;
      if (selectedPriority !== 'All' && lead.priority !== selectedPriority) return false;
      if (selectedStageFilter !== 'All' && lead.stage !== selectedStageFilter) return false;
      return true;
    });
  }, [leads, searchQuery, selectedPillar, selectedPriority, selectedStageFilter]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragOverColumn = (e: React.DragEvent, stageKey: CrmStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageKey) {
      setDragOverStage(stageKey);
    }
  };

  const handleDragLeaveColumn = () => {
    setDragOverStage(null);
  };

  const handleDropOnColumn = (e: React.DragEvent, stageKey: CrmStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      handleStageChange(leadId, stageKey);
    }
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const handleStageChange = async (leadId: string, newStage: CrmStage) => {
    if (!canManageCrm) {
      showToast(language === 'id' ? 'Anda tidak memiliki izin mengelola CRM.' : 'You do not have CRM permission.');
      return;
    }
    const res = await api.crm.updateDeal(leadId, { stage: newStage });
    if (!res.success) { showToast(res.error || (language === 'id' ? 'Tahap deal gagal diperbarui.' : 'Failed to update deal stage.')); return; }
    await loadLeads();
    const stageDef = CRM_STAGE_DEFINITIONS.find(s => s.key === newStage);
    const stageName = language === 'id' ? (stageDef?.labelId || newStage) : (stageDef?.label || newStage);
    showToast(language === 'id' ? `Tahap deal diperbarui ke ${stageName}` : `Lead stage updated to ${stageName}`);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, stage: newStage } : null);
    }
  };

  const handleConvertToProject = async (lead: CrmLead) => {
    if (!canManageCrm) {
      showToast(language === 'id' ? 'Anda tidak memiliki izin mengelola CRM.' : 'You do not have CRM permission.');
      return;
    }
    try {
      const res = await api.crm.convertWonDeal(lead.id);
      if (!res.success) {
        showToast(res.error || (language === 'id' ? 'Konversi deal gagal.' : 'Deal conversion failed.'));
        return;
      }
      showToast(
        res.data?.replayed
          ? (language === 'id' ? 'Konversi deal sudah pernah diproses.' : 'This deal conversion was already processed.')
          : (language === 'id'
            ? 'Deal berhasil dikonversi melalui workflow server.'
            : 'Deal converted through the server workflow.')
      );
    } catch {
      showToast(language === 'id' ? 'Konversi deal gagal.' : 'Deal conversion failed.');
    }
  };
  const handleOpenLeadDrawer = (lead: CrmLead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const handleOpenAddModal = (initialStage: CrmStage = 'new') => {
    setEditingLead(null);
    setFormClientName('');
    setFormCompany('');
    setFormEmail('');
    setFormPhone('');
    setFormPillar('Web Development');
    setFormDealValue(45000000);
    setFormStage(initialStage);
    setFormPriority('medium');
    setFormSource('Website Form');
    setFormDescription('');
    setFormExpectedClose('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (lead: CrmLead) => {
    setEditingLead(lead);
    setFormClientName(lead.clientName);
    setFormCompany(lead.company);
    setFormEmail(lead.email || '');
    setFormPhone(lead.phone || '');
    setFormPillar(lead.servicePillar);
    setFormDealValue(lead.dealValue);
    setFormStage(lead.stage);
    setFormPriority(lead.priority);
    setFormSource(lead.source);
    setFormDescription(lead.description || '');
    setFormExpectedClose(lead.expectedCloseDate || '');
    setIsAddModalOpen(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCrm) return;
    if (!formClientName.trim() || !formCompany.trim()) {
      showToast(language === 'id' ? 'Nama klien dan perusahaan wajib diisi.' : 'Client name and company are required.');
      return;
    }

    const leadData: CrmLead = {
      id: editingLead ? editingLead.id : 'lead_' + Date.now().toString(36),
      clientName: formClientName,
      company: formCompany,
      email: formEmail,
      phone: formPhone,
      servicePillar: formPillar,
      dealValue: Number(formDealValue) || 0,
      stage: formStage,
      priority: formPriority,
      source: formSource,
      description: formDescription,
      expectedCloseDate: formExpectedClose,
      assignedTo: editingLead ? editingLead.assignedTo : 'Principal Tech Lead',
      notes: editingLead ? editingLead.notes : [],
      createdAt: editingLead ? editingLead.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = editingLead ? await api.crm.updateDeal(leadData.id, leadData) : await api.crm.createDeal(leadData);
    if (!res.success) { showToast(res.error || (language === 'id' ? 'Deal gagal disimpan.' : 'Deal could not be saved.')); return; }
    await loadLeads();
    setIsAddModalOpen(false);
    showToast(editingLead ? (language === 'id' ? 'Data prospek berhasil diperbarui.' : 'Deal updated successfully.') : (language === 'id' ? 'Deal prospek baru berhasil dibuat.' : 'New deal created successfully.'));
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!canManageCrm) return;
    setDeleteTarget({ id, name });
  };

  const confirmDeleteLead = async (id: string) => {
    if (!canManageCrm) return;
    const res = await api.crm.deleteDeal(id);
    if (!res.success) { showToast(res.error || 'Delete failed.'); setDeleteTarget(null); return; }
    await loadLeads();
    if (selectedLead && selectedLead.id === id) { setIsDrawerOpen(false); setSelectedLead(null); }
    setDeleteTarget(null);
    showToast(language === 'id' ? 'Data deal telah dihapus.' : 'Deal removed from CRM.');
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCrm || !selectedLead || !newNoteText.trim()) return;

    const nextNotes = [...(selectedLead.notes || []), { id: `note_${Date.now().toString(36)}`, text: newNoteText.trim(), type: 'note', createdAt: new Date().toISOString() }];
    const res = await api.crm.updateDeal(selectedLead.id, { notes: nextNotes });
    if (!res.success) { showToast(res.error || (language === 'id' ? 'Catatan gagal disimpan.' : 'Note could not be saved.')); return; }
    await loadLeads();
    setNewNoteText('');
    const updated = leads.find(l => l.id === selectedLead.id);
    if (updated) setSelectedLead(updated);
    showToast(language === 'id' ? 'Catatan aktivitas ditambahkan.' : 'Activity note added.');
  };

  const getPriorityBadge = (priority: CrmPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded bg-danger/10 text-danger border border-danger/30 text-[9px] font-sans font-semibold normal-case">Urgent</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/30 text-[9px] font-sans font-semibold normal-case">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-badge bg-info/10 text-info border border-info/30 text-[9px] font-sans font-semibold normal-case">Medium</span>;
      case 'low':
      default:
        return <span className="px-2 py-0.5 rounded bg-panel-hover text-muted border border-line text-[9px] font-sans font-semibold normal-case">Low</span>;
    }
  };

  const getPillarColor = (pillar: CrmServicePillar) => {
    switch (pillar) {
      case 'Web Development':
        return 'text-accent-text bg-accent/10 border-accent/30';
      case 'Mobile App':
        return 'text-info bg-info/10 border-info/30';
      case 'UI/UX Design':
        return 'text-info bg-info/10 border-info/30';
      case 'Branding & Identity':
        return 'text-warning bg-warning/10 border-warning/30';
      case 'AI & Cloud Solutions':
        return 'text-success bg-success/10 border-success/30';
      case 'Digital Product MVP':
        return 'text-info bg-info/10 border-info/30';
      default:
        return 'text-muted bg-panel/50 border-line';
    }
  };

  return (
    <>
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm" title={language === 'id' ? 'Hapus prospek?' : 'Delete lead?'} description={language === 'id' ? `Prospek ${deleteTarget?.name || ''} akan dihapus dari CRM.` : `Lead ${deleteTarget?.name || ''} will be removed from CRM.`}>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <button type="button" onClick={() => setDeleteTarget(null)} className="min-h-10 px-4 rounded-control border border-line bg-panel text-xs text-muted">Cancel</button>
          <button type="button" onClick={() => deleteTarget && void confirmDeleteLead(deleteTarget.id)} disabled={!canManageCrm} className="px-3.5 py-2 rounded-control bg-danger text-white text-xs font-semibold">Delete</button>
        </div>
      </Modal>
      <div className="ams-leads-page space-y-6 pb-8">
      
      <header className="ams-dashboard-header mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Kapitech AMS</span>
            <span aria-hidden="true">/</span>
            <span className="text-fg">CRM</span>
          </div>
          <h1 className="mt-2 text-xl font-semibold leading-7 tracking-[-0.01em] text-fg">{t('admin.crm.title')}</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
            {language === 'id'
              ? 'Kelola pipeline prospek, tahapan deal, nilai peluang, dan follow-up tim dalam satu workspace.'
              : 'Manage lead pipeline, deal stages, opportunity value, and team follow-up from one workspace.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="flex h-10 items-center rounded-control border border-line bg-transparent p-0.5" aria-label="Currency">
            <button type="button" onClick={() => handleCurrencyToggle('IDR')} aria-pressed={currency === 'IDR'} className={"min-h-9 rounded-control px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " + (currency === 'IDR' ? 'bg-accent text-white' : 'text-muted hover:bg-bg hover:text-fg')}>IDR</button>
            <button type="button" onClick={() => handleCurrencyToggle('USD')} aria-pressed={currency === 'USD'} className={"min-h-9 rounded-control px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " + (currency === 'USD' ? 'bg-accent text-white' : 'text-muted hover:bg-bg hover:text-fg')}>USD</button>
          </div>
          <button type="button" onClick={() => exportCrmLeadsToCsv(filteredLeads)} className="ams-action inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-line bg-transparent px-3 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" title={t('admin.action.exportCsv')}>
            <Download size={14} />
            <span>{t('admin.action.exportCsv')}</span>
          </button>
          {canManageCrm && (
            <>
              <button type="button" onClick={() => handleOpenAddModal('new')} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control bg-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              <Plus size={14} />
              <span>{t('admin.crm.addDeal')}</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Toast Alert */}
      {statusMessage && (
        <div className="p-3 rounded-card bg-success/10 border border-success/30 text-success text-xs font-sans flex items-center gap-2 animate-in fade-in duration-300">
          <Check size={15} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. Enterprise CRM KPI Funnel & Metrics Bar */}
      <div className="ams-crm-kpi grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Active Pipeline Card */}
        <div className="lg:col-span-4 bg-panel border border-line p-4 rounded-card flex flex-col justify-between group hover:border-line transition-all">
          <div>
            <div className="flex items-center justify-between text-muted mb-3">
              <span className="text-xs font-sans normal-case tracking-normal font-semibold">
                {language === 'id' ? 'Pipeline Aktif' : 'Active Pipeline'}
              </span>
              <div className="w-8 h-8 rounded-control bg-success/10 border border-success/30 flex items-center justify-center text-success">
                <Layers size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-sans font-semibold text-fg tracking-[-0.01em] break-words font-sans">
              {formatAmount(metrics.totalPipelineValue, currency)}
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-line text-[11px] font-sans">
            <span className="text-muted">
              {metrics.activeDealsCount} {language === 'id' ? 'Prospek Aktif' : 'Active Deals'}
            </span>
            <span className="text-success font-semibold flex items-center gap-1">
              <TrendingUp size={12} />
              <span>{language === 'id' ? 'Tertimbang:' : 'Weighted:'} {formatAmount(metrics.weightedPipelineValue, currency, true)}</span>
            </span>
          </div>
        </div>

        {/* Closed Won Card */}
        <div className="lg:col-span-3 bg-panel border border-line p-5 sm:p-6 rounded-card flex flex-col justify-between group hover:border-line transition-all">
          <div>
            <div className="flex items-center justify-between text-muted mb-3">
              <span className="text-xs font-sans normal-case tracking-normal font-semibold">
                {language === 'id' ? 'Closed Won (Q3)' : 'Closed Won (Q3)'}
              </span>
              <div className="w-8 h-8 rounded-control bg-success/10 border border-success/30 flex items-center justify-center text-success">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-sans font-semibold text-success tracking-[-0.01em] break-words font-sans">
              {formatAmount(metrics.totalWonValue, currency)}
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-line text-[11px] font-sans">
            <span className="text-muted">
              {language === 'id' ? 'Win Rate:' : 'Win Rate:'}
            </span>
            <span className="text-fg font-semibold font-sans">
              {metrics.winRate}% ({metrics.wonDealsCount} of {metrics.totalDeals} closed)
            </span>
          </div>
        </div>

        {/* Stage Conversion Funnel */}
        <div className="md:col-span-2 lg:col-span-5 bg-panel border border-line p-5 sm:p-6 rounded-card flex flex-col justify-between group hover:border-line transition-all">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-sans normal-case tracking-normal font-semibold flex items-center gap-2 text-fg">
              <Activity size={14} className="text-danger" />
              <span>{language === 'id' ? 'Corong Konversi Tahapan' : 'Stage Conversion Funnel'}</span>
            </span>
            <span className="text-[10px] font-sans px-2 py-0.5 rounded-badge bg-panel text-muted border border-line">
              Lead → Won Conversion
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 my-auto py-2">
            <div className="bg-bg border border-line rounded-control p-2.5 text-center">
              <div className="text-[10px] font-sans text-muted truncate">Lead→Scope</div>
              <div className="text-sm font-semibold font-sans text-fg mt-0.5">{funnelStats.leadToScope}%</div>
            </div>
            <div className="bg-panel border border-line rounded-card p-2 text-center">
              <div className="text-[10px] font-sans text-muted truncate">Scope→Pitch</div>
              <div className="text-sm font-semibold font-sans text-fg mt-0.5">{funnelStats.scopeToPitch}%</div>
            </div>
            <div className="bg-panel border border-line rounded-card p-2 text-center">
              <div className="text-[10px] font-sans text-muted truncate">Pitch→SOW</div>
              <div className="text-sm font-semibold font-sans text-fg mt-0.5">{funnelStats.pitchToSow}%</div>
            </div>
            <div className="bg-success/10 border border-success/20 rounded-control p-2.5 text-center">
              <div className="text-[10px] font-sans text-success truncate">SOW→Won</div>
              <div className="text-sm font-semibold font-sans text-success mt-0.5">{funnelStats.sowToWon}%</div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-line text-[11px] font-sans">
            <span className="text-muted">
              {language === 'id' ? 'Rata-rata Deal:' : 'Avg Deal:'} {formatAmount(metrics.avgDealSize, currency, true)}
            </span>
            <span className="text-muted">
              {language === 'id' ? 'Proposal & Negosiasi:' : 'Proposal & SOW:'} <span className="text-info font-semibold">{formatAmount(metrics.negotiationValue, currency, true)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & View Mode Switcher */}
      <div className="ams-crm-toolbar flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-panel border border-line p-3 sm:p-4 rounded-card">
        <div className="flex flex-row items-center gap-2.5 flex-1 min-w-0 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <div className="relative shrink-0 w-[240px] sm:flex-1 sm:min-w-0 sm:w-auto sm:max-w-none lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'id' ? 'Cari prospek, perusahaan, atau kata kunci...' : 'Search leads, companies, or keywords...'}
              className="w-full pl-9 pr-3.5 py-2 rounded-control bg-panel border border-line text-xs text-fg placeholder-muted focus:outline-none focus:border-accent font-sans min-h-10"
            />
          </div>

          <CustomSelect
            className="shrink-0 w-[180px] sm:w-auto"
            value={selectedPillar}
            onChange={(val) => setSelectedPillar(val)}
            options={[
              { value: 'All', label: language === 'id' ? 'Semua Pilar Layanan' : 'All Pillars' },
              { value: 'Web Development', label: 'Web Development' },
                            { value: 'UI/UX Design', label: 'UI/UX Design' },
              { value: 'Branding & Identity', label: 'Branding & Identity' },
              { value: 'AI & Cloud Solutions', label: 'AI & Cloud Solutions' },
              { value: 'Digital Product MVP', label: 'Digital Product MVP' }
            ]}
          />

          <CustomSelect
            className="shrink-0 w-[160px] sm:w-auto"
            value={selectedPriority}
            onChange={(val) => setSelectedPriority(val)}
            options={[
              { value: 'All', label: language === 'id' ? 'Semua Prioritas' : 'All Priorities' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' }
            ]}
          />
        </div>

        <div className="flex items-center gap-1 bg-bg p-1 rounded-card border border-line self-stretch lg:self-auto shrink-0">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-control text-xs font-sans font-semibold transition-all min-h-10 ${
              viewMode === 'kanban'
                ? 'bg-panel text-fg border border-line'
                : 'text-muted hover:text-fg'
            }`}
          >
            <Kanban size={13} />
            <span>{t('admin.crm.kanbanView')}</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-control text-xs font-sans font-semibold transition-all min-h-10 ${
              viewMode === 'list'
                ? 'bg-panel text-fg border border-line'
                : 'text-muted hover:text-fg'
            }`}
          >
            <List size={13} />
            <span>{t('admin.crm.listView')}</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN VIEW: KANBAN BOARD OR LIST TABLE */}
      {viewMode === 'kanban' ? (
        <div className="ams-kanban-scroll overflow-x-auto pb-4 overscroll-x-contain scrollbar-thin">
          <div className="flex gap-3 min-w-[1400px] min-[1280px]:min-w-full items-start">
            
            {CRM_STAGE_DEFINITIONS.map((stageDef) => {
              const stageLeads = filteredLeads.filter(l => l.stage === stageDef.key);
              const stageSum = stageLeads.reduce((acc, l) => acc + (l.dealValue || 0), 0);
              const isOver = dragOverStage === stageDef.key;

              return (
                <div 
                  key={stageDef.key}
                  onDragOver={(e) => {
                    if (canManageCrm) handleDragOverColumn(e, stageDef.key);
                  }}
                  onDragLeave={canManageCrm ? handleDragLeaveColumn : undefined}
                  onDrop={(e) => {
                    if (canManageCrm) handleDropOnColumn(e, stageDef.key);
                  }}
                  className={`bg-panel border rounded-card flex flex-col flex-1 min-w-[280px] max-w-[340px] shrink-0 transition-all ${
                    isOver ? 'border-accent ring-2 ring-accent/30 bg-accent/5' : 'border-line'
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-line flex items-center justify-between bg-panel rounded-t-[12px]">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          stageDef.key === 'won' ? 'bg-success' :
                          stageDef.key === 'new' ? 'bg-info' :
                          stageDef.key === 'negotiation' ? 'bg-series-3' :
                          stageDef.key === 'proposal' ? 'bg-accent' :
                          stageDef.key === 'contacted' ? 'bg-warning' : 'bg-muted'
                        }`} />
                        <h3 className="text-xs font-semibold font-sans text-fg truncate">
                          {language === 'id' ? stageDef.labelId : stageDef.label}
                        </h3>
                        <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-panel text-muted border border-line shrink-0">
                          {stageLeads.length}
                        </span>
                      </div>
                      <div className="text-[11px] font-sans text-success font-semibold mt-1">
                        {formatAmount(stageSum, currency, true)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenAddModal(stageDef.key)}
                      disabled={!canManageCrm}
                      title={!canManageCrm ? 'Requires CRM permission' : `Add deal to ${stageDef.labelId}`}
                      className="min-h-10 min-w-10 p-1.5 rounded-control bg-panel hover:bg-panel-hover text-muted hover:text-fg border border-line transition-colors flex items-center justify-center shrink-0"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Column Cards Stream */}
                  <div className="p-3 space-y-3 overflow-y-auto flex-1 max-h-[calc(100dvh-320px)] min-h-[180px] scrollbar-thin">
                    {stageLeads.length === 0 ? (
                      <div className="py-8 text-center text-muted text-[11px] font-sans border border-dashed border-line rounded-card">
                        {language === 'id' ? 'Tarik deal ke sini' : 'Drop deals here'}
                      </div>
                    ) : (
                      stageLeads.map((lead) => {
                        const isDragging = draggedLeadId === lead.id;

                        return (
                          <div
                            key={lead.id}
                            draggable={canManageCrm}
                            onDragStart={canManageCrm ? (e) => handleDragStart(e, lead.id) : undefined}
                            onClick={() => handleOpenLeadDrawer(lead)}
                            className={`draggable-card kanban-card bg-panel border hover:border-muted rounded-card p-3 cursor-pointer transition-colors group relative ${
                              isDragging ? 'opacity-40 scale-95 border-accent border-dashed' : 'border-line'
                            }`}
                          >
                            {/* Top Card Info */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className={`text-[9px] font-sans px-2 py-0.5 rounded border font-semibold truncate max-w-[130px] ${getPillarColor(lead.servicePillar)}`}>
                                {lead.servicePillar}
                              </span>
                              <div className="flex items-center gap-1">
                                {getPriorityBadge(lead.priority)}
                                <div className={`text-muted ${canManageCrm ? 'cursor-grab' : 'cursor-default'}`} data-drag-handle>
                                  <GripVertical size={13} />
                                </div>
                              </div>
                            </div>

                            {/* Client & Company */}
                            <h4 className="text-xs font-semibold text-fg font-sans leading-snug group-hover:text-danger transition-colors line-clamp-1">
                              {lead.clientName}
                            </h4>
                            <p className="text-[11px] text-muted font-sans truncate mb-2.5">
                              {lead.company}
                            </p>

                            {/* Deal Value & Source */}
                            <div className="flex items-center justify-between text-xs font-sans pb-2.5 mb-2.5 border-t border-line pt-2">
                              <span className="text-success font-semibold font-sans text-sm tracking-[-0.01em]">
                                {formatAmount(lead.dealValue, currency)}
                              </span>
                              <span className="text-[10px] text-muted font-sans px-1.5 py-0.5 rounded bg-panel border border-line shrink-0">
                                {lead.source}
                              </span>
                            </div>

                            {/* Card Bottom: Quick Actions */}
                            <div className="flex items-center justify-between gap-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
                              {/* Left: Won / Project status action */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {lead.stage !== 'won' && lead.stage !== 'lost' && (
                                  <button
                                    onClick={() => handleStageChange(lead.id, 'won')}
                                    disabled={!canManageCrm}
                                    title={language === 'id' ? 'Tandai Deal Dimenangkan (Won)' : 'Mark deal as Won'}
                                    className="h-10 sm:h-7 min-h-10 sm:min-h-0 px-2.5 rounded-control bg-success/10 hover:bg-success/15 text-success border border-success/30 text-[10px] font-semibold font-sans transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap"
                                  >
                                    <Check size={11} className="text-success" />
                                    <span>Won</span>
                                  </button>
                                )}
                                {lead.stage === 'won' && (
                                  <button
                                    onClick={() => handleConvertToProject(lead)}
                                    disabled={!canManageCrm}
                                    title={language === 'id' ? 'Konversi ke Proyek Aktif' : 'Convert deal to Agency Project'}
                                    className="h-10 sm:h-7 min-h-10 sm:min-h-0 px-2.5 rounded-control bg-accent/20 hover:bg-accent/40 text-danger border border-accent/30 text-[10px] font-semibold font-sans transition-colors flex items-center gap-1 whitespace-nowrap"
                                  >
                                    <Layers size={11} />
                                    <span>Project</span>
                                  </button>
                                )}
                                {lead.stage === 'lost' && (
                                  <span className="text-[10px] font-sans text-muted px-2 py-1 rounded bg-panel border border-line whitespace-nowrap">
                                    Closed Lost
                                  </span>
                                )}
                              </div>

                              {/* Right: Quick actions (WhatsApp + Inspect) */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {lead.phone && (
                                  <a
                                    href={`https://wa.me/${cleanPhone(lead.phone)}?text=Halo%20${encodeURIComponent(lead.clientName)},%20kami%20dari%20tim%20Kapitech%20Agency...`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={language === 'id' ? 'Kirim Pesan WhatsApp' : 'Send WhatsApp message'}
                                    className="min-h-10 min-w-10 rounded-control bg-panel hover:bg-success/10 text-muted hover:text-success border border-line hover:border-success/30 transition-all flex items-center justify-center shrink-0"
                                  >
                                    <Send size={11} />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleOpenLeadDrawer(lead)}
                                  title={language === 'id' ? 'Lihat profil lead & catatan' : 'Inspect lead profile & notes'}
                                  className="h-10 sm:h-7 min-h-10 sm:min-h-0 px-2.5 rounded-control bg-panel hover:bg-panel text-muted hover:text-fg border border-line text-[10px] font-sans transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap"
                                >
                                  <span>Inspect</span>
                                  <ArrowUpRight size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LIST VIEW: Mobile Cards + Desktop Table */
        <div className="space-y-3">
          {/* Mobile Card Stream (Zero Horizontal Scrolling) */}
          <div className="md:hidden space-y-3">
            {filteredLeads.length === 0 ? (
              <div className="bg-panel border border-line rounded-card p-8 text-center text-muted font-sans text-xs">
                {language === 'id' ? 'Tidak ada deal yang cocok.' : 'No matching leads found.'}
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => handleOpenLeadDrawer(lead)}
                  className="bg-panel hover:bg-panel border border-line hover:border-line rounded-card p-4 space-y-3 transition-all cursor-pointer"
                >
                  {/* Header: Client, Company & Stage */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-fg text-base font-sans">{lead.clientName}</div>
                      <div className="text-xs text-muted font-sans">{lead.company}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-control bg-panel border border-line text-[11px] font-sans text-fg shrink-0 font-semibold">
                      {language === 'id'
                        ? (CRM_STAGE_DEFINITIONS.find(s => s.key === lead.stage)?.labelId || lead.stage)
                        : (CRM_STAGE_DEFINITIONS.find(s => s.key === lead.stage)?.label || lead.stage)}
                    </span>
                  </div>

                  {/* Pillar & Priority Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-sans px-2.5 py-1 rounded-control border font-semibold ${getPillarColor(lead.servicePillar)}`}>
                      {lead.servicePillar}
                    </span>
                    {getPriorityBadge(lead.priority)}
                    {lead.source && (
                      <span className="text-[10px] font-sans text-muted bg-panel px-2 py-0.5 rounded border border-line">
                        {lead.source}
                      </span>
                    )}
                  </div>

                  {/* Value & Actions Footer */}
                  <div className="pt-2 border-t border-line flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-sans normal-case text-muted">Deal Value</div>
                      <div className="font-semibold text-success font-sans text-base">
                        {formatAmount(lead.dealValue, currency)}
                      </div>
                      {lead.expectedCloseDate && (
                        <div className="text-[10px] font-sans text-muted">
                          Target: {lead.expectedCloseDate}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {lead.stage === 'won' && (
                        <button
                          onClick={() => handleConvertToProject(lead)}
                          disabled={!canManageCrm}
                          title="Create project"
                          className="w-10 h-10 rounded-control bg-success/10 text-success hover:bg-success/15 border border-success/30 flex items-center justify-center min-h-10 min-w-10"
                        >
                          <Layers size={13} />
                        </button>
                      )}
                      {lead.phone && (
                        <a
                          href={`https://wa.me/${cleanPhone(lead.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-control bg-panel text-success hover:bg-success/15 border border-line hover:border-success/30 flex items-center justify-center min-h-10 min-w-10"
                          title="WhatsApp client"
                        >
                          <Send size={13} />
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenEditModal(lead)}
                        disabled={!canManageCrm}
                        className="w-10 h-10 rounded-control bg-panel text-muted hover:text-fg border border-line flex items-center justify-center min-h-10 min-w-10"
                        title="Edit deal"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id, lead.clientName)}
                        disabled={!canManageCrm}
                        className="w-9 h-9 rounded-control bg-panel text-muted hover:text-danger border border-line hover:border-danger/40 flex items-center justify-center min-h-10 min-w-10"
                        title="Delete deal"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-panel border border-line rounded-card overflow-hidden">
            <div className="ams-table-scroll overflow-x-auto">
              <table className="ams-table w-full text-left text-xs font-sans">
                <thead className="bg-panel text-muted border-b border-line normal-case text-[10px] tracking-normal">
                  <tr>
                    <th className="py-3 px-4">{language === 'id' ? 'Klien & Perusahaan' : 'Client & Company'}</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Pilar Layanan' : 'Service Pillar'}</th>
                    <th className="py-3 px-4 text-right">{language === 'id' ? 'Nilai Deal' : 'Deal Value'}</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Tahap Pipeline' : 'Pipeline Stage'}</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Prioritas' : 'Priority'}</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Sumber' : 'Source'}</th>
                    <th className="py-3 px-4">{language === 'id' ? 'Target Closing' : 'Target Close'}</th>
                    <th className="py-3 px-4 text-right">{language === 'id' ? 'Aksi' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted font-sans">
                        {language === 'id' ? 'Tidak ada deal yang cocok.' : 'No matching leads found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => handleOpenLeadDrawer(lead)}
                        className="hover:bg-panel transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-fg font-sans text-sm">
                            {lead.clientName}
                          </div>
                          <div className="text-[11px] text-muted">
                            {lead.company}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-sans px-2 py-0.5 rounded border font-semibold ${getPillarColor(lead.servicePillar)}`}>
                            {lead.servicePillar}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-semibold text-success font-sans text-sm font-sans">
                          {formatAmount(lead.dealValue, currency)}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-panel border border-line text-[11px] text-fg">
                            {language === 'id'
                              ? (CRM_STAGE_DEFINITIONS.find(s => s.key === lead.stage)?.labelId || lead.stage)
                              : (CRM_STAGE_DEFINITIONS.find(s => s.key === lead.stage)?.label || lead.stage)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {getPriorityBadge(lead.priority)}
                        </td>

                        <td className="py-3 px-4 text-muted">
                          {lead.source}
                        </td>

                        <td className="py-3 px-4 text-muted">
                          {lead.expectedCloseDate || '-'}
                        </td>

                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {lead.stage === 'won' && (
                              <button
                                onClick={() => handleConvertToProject(lead)}
                                disabled={!canManageCrm}
                                title="Create project"
                                className="w-9 h-9 rounded-control bg-success/10 text-success hover:bg-success/15 border border-success/30 flex items-center justify-center transition-colors min-h-10 min-w-10"
                              >
                                <Layers size={13} />
                              </button>
                            )}
                            {lead.phone && (
                              <a
                                href={`https://wa.me/${cleanPhone(lead.phone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-control bg-panel text-success hover:bg-success/15 border border-line hover:border-success/30 flex items-center justify-center transition-colors min-h-10 min-w-10"
                                title="WhatsApp client"
                              >
                                <Send size={13} />
                              </a>
                            )}
                            <button
                              onClick={() => handleOpenEditModal(lead)}
                              disabled={!canManageCrm}
                              className="w-10 h-10 rounded-control bg-panel text-muted hover:text-fg border border-line flex items-center justify-center transition-colors min-h-10 min-w-10"
                              title="Edit deal"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id, lead.clientName)}
                              disabled={!canManageCrm}
                              className="w-9 h-9 rounded-control bg-panel text-muted hover:text-danger border border-line hover:border-danger/40 flex items-center justify-center transition-colors min-h-10 min-w-10"
                              title="Delete deal"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. CLIENT & DEAL PROFILE DRAWER */}
      {isDrawerOpen && selectedLead && (
        <Modal
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          size="lg"
          title={selectedLead.clientName}
          description={selectedLead.company}
        >
          <div className="space-y-6 text-xs font-sans">
            
            <div className="space-y-6">
              {/* Deal Value & Stage Selector Widget */}
              <div className="p-4 rounded-card bg-panel border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] text-muted normal-case tracking-normal font-semibold">
                    {language === 'id' ? 'Valuasi Prospek' : 'Deal Valuation'}
                  </div>
                  <div className="text-2xl font-semibold font-sans text-success font-sans">
                    {formatAmount(selectedLead.dealValue, currency)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{language === 'id' ? 'Tahap:' : 'Stage:'}</span>
                  <CustomSelect value={selectedLead.stage} onChange={(value) => handleStageChange(selectedLead.id, value as CrmStage)} options={CRM_STAGE_DEFINITIONS.map(s => ({ value: s.key, label: language === 'id' ? s.labelId : s.label }))} disabled={!canManageCrm} />
                </div>
              </div>

              {/* Client Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-card bg-panel border border-line">
                  <div className="flex items-center gap-1.5 text-muted mb-1">
                    <Mail size={13} className="text-danger" />
                    <span>{language === 'id' ? 'Email Klien' : 'Client Email'}</span>
                  </div>
                  <a 
                    href={`mailto:${selectedLead.email}`}
                    className="text-fg hover:text-danger transition-colors break-all block"
                  >
                    {selectedLead.email || '-'}
                  </a>
                </div>

                <div className="p-3 rounded-card bg-panel border border-line">
                  <div className="flex items-center justify-between text-muted mb-1">
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-danger" />
                      <span>WhatsApp / Phone</span>
                    </div>
                    {selectedLead.phone && (
                      <a
                        href={`https://wa.me/${cleanPhone(selectedLead.phone)}?text=Halo%20${encodeURIComponent(selectedLead.clientName)},%20kami%20dari%20Kapitech%20Agency...`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-success hover:underline flex items-center gap-0.5"
                      >
                        <span>Chat WA</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <div className="text-fg">
                    {selectedLead.phone || '-'}
                  </div>
                </div>
              </div>

              {/* Scope Description */}
              <div>
                <label className="block text-muted normal-case tracking-normal mb-2 font-semibold text-[11px]">
                  {language === 'id' ? 'Deskripsi Scope & Catatan Klien' : 'Project Scope & Acceptance Notes'}
                </label>
                <div className="p-4 rounded-card bg-panel border border-line text-muted leading-relaxed font-sans text-xs">
                  {selectedLead.description || (language === 'id' ? 'Belum ada catatan scope proyek.' : 'No detailed scope notes provided.')}
                </div>
              </div>

              {/* Activity Log / Notes Stream */}
              <div>
                <label className="block text-muted normal-case tracking-normal mb-2 font-semibold text-[11px]">
                  {language === 'id' ? 'Riwayat Aktivitas & Catatan Meeting' : 'Activity Timeline & Meeting Notes'}
                </label>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder={language === 'id' ? 'Catat ringkasan meeting atau jadwal follow-up...' : 'Log call, meeting summary, or follow-up note...'}
                    className="flex-1 px-3.5 py-2 bg-panel border border-line rounded-control text-xs text-fg placeholder-muted focus:outline-none focus:border-accent font-sans min-h-10"
                  />
                  <button
                    type="submit"
                    disabled={!canManageCrm}
                    className="px-3.5 py-2 rounded-control bg-accent hover:bg-accent text-fg text-xs font-sans font-semibold transition-colors flex items-center gap-1 shrink-0 min-h-10"
                  >
                    <Plus size={13} />
                    <span>{language === 'id' ? 'Catat' : 'Log'}</span>
                  </button>
                </form>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {selectedLead.notes && selectedLead.notes.length > 0 ? (
                    selectedLead.notes.slice().reverse().map((note) => (
                      <div key={note.id} className="p-3 rounded-card bg-panel border border-line text-xs">
                        <div className="flex items-center justify-between text-[10px] text-muted mb-1">
                          <span className="text-danger font-semibold">{note.author}</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-fg leading-snug">{note.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-muted">
                      {language === 'id' ? 'Belum ada catatan aktivitas.' : 'No activity notes logged yet.'}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Drawer Bottom Action Buttons */}
            <div className="pt-5 border-t border-line flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(selectedLead)}
                  disabled={!canManageCrm}
                  className="px-3.5 py-2 rounded-control bg-panel hover:bg-panel text-fg border border-line text-xs transition-colors flex items-center gap-1.5 min-h-10"
                >
                  <Edit3 size={13} />
                  <span>{t('admin.action.edit')}</span>
                </button>
                <button
                  onClick={() => handleDeleteLead(selectedLead.id, selectedLead.clientName)}
                  disabled={!canManageCrm}
                  className="p-2 rounded-card bg-panel hover:bg-danger/15 text-muted hover:text-danger border border-line hover:border-danger/30 transition-colors min-h-10 min-w-[40px] flex items-center justify-center"
                  title="Delete deal"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {selectedLead.stage === 'won' && (
                <button
                  onClick={() => handleConvertToProject(selectedLead)}
                  disabled={!canManageCrm}
                  className="px-4 py-2 rounded-control bg-accent hover:bg-accent-hover text-white font-semibold text-xs flex items-center gap-1.5 min-h-10"
                >
                  <Layers size={13} />
                  <span>{t('admin.crm.convertToProject')}</span>
                </button>
              )}
            </div>

          </div>
        </Modal>
      )}

      {/* 6. CREATE / EDIT DEAL MODAL */}
      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} size="lg" title={editingLead ? (language === 'id' ? 'Edit Data Prospek' : 'Edit CRM Deal') : t('admin.crm.addDeal')} description={language === 'id' ? 'Kelola detail deal dan scope kebutuhan klien.' : 'Manage deal details and client scope.'}>
            <form onSubmit={handleSaveLead} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted mb-1 font-semibold">{language === 'id' ? 'Nama PIC Klien *' : 'Client PIC Name *'}</label>
                  <input
                    type="text"
                    required
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    placeholder="e.g. Adrian Wicaksono"
                    className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent min-h-10"
                  />
                </div>
                <div>
                  <label className="block text-muted mb-1 font-semibold">{language === 'id' ? 'Nama Perusahaan / Brand *' : 'Company Name *'}</label>
                  <input
                    type="text"
                    required
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="e.g. Bank Mandiri FinTech Division"
                    className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent min-h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="adrian@company.com"
                    className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent min-h-10"
                  />
                </div>
                <div>
                  <label className="block text-muted mb-1 font-semibold">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+62 812-3456-7890"
                    className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent min-h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-muted mb-1 font-semibold">{language === 'id' ? 'Pilar Layanan' : 'Service Pillar'}</label>
                  <CustomSelect value={formPillar} onChange={(value) => setFormPillar(value as CrmServicePillar)} options={[{value:'Web Development',label:'Web Development'},{value:'UI/UX Design',label:'UI/UX Design'},{value:'Branding & Identity',label:'Branding & Identity'},{value:'AI & Cloud Solutions',label:'AI & Cloud Solutions'},{value:'Digital Product MVP',label:'Digital Product MVP'}]} />
                </div>

                <div>
                  <label className="block text-muted mb-1 font-semibold">{language === 'id' ? 'Nilai Deal (IDR)' : 'Deal Value (IDR)'}</label>
                  <input
                    type="number"
                    value={formDealValue}
                    onChange={(e) => setFormDealValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent min-h-10"
                  />
                </div>

                <div>
                  <label className="block text-muted mb-1 font-semibold">{language === 'id' ? 'Tahap' : 'Stage'}</label>
                  <CustomSelect value={formStage} onChange={(value) => setFormStage(value as CrmStage)} options={CRM_STAGE_DEFINITIONS.map(s => ({ value: s.key, label: language === 'id' ? s.labelId : s.label }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted mb-1 font-semibold">{language === 'id' ? 'Prioritas' : 'Priority'}</label>
                  <CustomSelect value={formPriority} onChange={(value) => setFormPriority(value as CrmPriority)} options={[{value:'low',label:'Low'},{value:'medium',label:'Medium'},{value:'high',label:'High'},{value:'urgent',label:'Urgent'}]} />
                </div>

                <div>
                  <label className="block text-muted mb-1 font-semibold">{language === 'id' ? 'Target Tanggal Closing' : 'Target Close Date'}</label>
                  <input
                    type="date"
                    value={formExpectedClose}
                    onChange={(e) => setFormExpectedClose(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent min-h-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted mb-1 font-semibold">{language === 'id' ? 'Ringkasan / Scope Kebutuhan' : 'Brief / Project Scope'}</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={language === 'id' ? 'Kebutuhan teknis, ekspektasi timeline, catatan budget...' : 'Requirements, tech stack expectations, budget notes...'}
                  className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent font-sans text-xs min-h-10"
                />
              </div>

              <div className="pt-4 border-t border-line flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="min-h-10 px-4 rounded-control bg-panel text-muted hover:text-fg border border-line text-xs font-sans font-medium transition-colors"
                >
                  {t('admin.action.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!canManageCrm}
                  className="min-h-10 px-5 rounded-control bg-accent text-white font-sans font-semibold text-xs hover:bg-accent transition-colors"
                >
                  {editingLead ? (language === 'id' ? 'Simpan Perubahan' : 'Update Deal') : (language === 'id' ? 'Buat Deal' : 'Save Deal')}
                </button>
              </div>
            </form>
      </Modal>

      </div>
    </>
  );
};
export default AdminCrm;