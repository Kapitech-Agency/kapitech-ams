import React, { useState } from 'react';
import { 
  X, 
  Check, 
  DollarSign, 
  Building2, 
  User, 
  Calendar, 
  Layers, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ContactSubmission } from '../../../lib/submissions';
import { 
  convertInquiryToCrmLead, 
  CrmStage, 
  CrmServicePillar, 
  formatIDR 
} from '../../../lib/crmStore';
import { useLanguage } from '../../../lib/LanguageContext';
import { formatAmount, getActiveCurrency, CurrencyCode } from '../../../lib/currency';
import { CustomSelect } from '../../ui/CustomSelect';
import { Modal } from '../../ui/Modal';

interface ConvertToCrmModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: ContactSubmission;
  onConverted: (leadId: string, dealValue: number) => void;
}

export const ConvertToCrmModal: React.FC<ConvertToCrmModalProps> = ({
  isOpen,
  onClose,
  submission,
  onConverted
}) => {
  const { language } = useLanguage();
  const currency: CurrencyCode = getActiveCurrency();

  // Auto-calculate smart default deal value
  const calculateDefaultValue = () => {
    if (submission.budget) {
      const b = submission.budget.toLowerCase();
      if (b.includes('25,000') || b.includes('50,000') || b.includes('100jt') || b.includes('100m')) {
        return 120000000;
      } else if (b.includes('10,000') || b.includes('25,000') || b.includes('50jt')) {
        return 75000000;
      } else if (b.includes('5,000') || b.includes('15,000') || b.includes('25jt')) {
        return 45000000;
      }
    }
    return 35000000;
  };

  const calculateDefaultPillar = (): CrmServicePillar => {
    const servicesJoined = (submission.services || []).join(' ').toLowerCase() + ' ' + (submission.specialty || '').toLowerCase();
    if (servicesJoined.includes('ui/ux') || servicesJoined.includes('design') || servicesJoined.includes('figma')) {
      return 'UI/UX Design';
    } else if (servicesJoined.includes('mobile') || servicesJoined.includes('app') || servicesJoined.includes('ios') || servicesJoined.includes('android')) {
      return 'Mobile App';
    } else if (servicesJoined.includes('brand') || servicesJoined.includes('logo') || servicesJoined.includes('identity')) {
      return 'Branding & Identity';
    } else if (servicesJoined.includes('ai') || servicesJoined.includes('cloud') || servicesJoined.includes('machine learning')) {
      return 'AI & Cloud Solutions';
    } else if (servicesJoined.includes('mvp') || servicesJoined.includes('saas') || servicesJoined.includes('prototype')) {
      return 'Digital Product MVP';
    }
    return 'Web Development';
  };

  const [dealValue, setDealValue] = useState<number>(calculateDefaultValue());
  const [stage, setStage] = useState<CrmStage>('new');
  const [pillar, setPillar] = useState<CrmServicePillar>(calculateDefaultPillar());
  const [assignedTo, setAssignedTo] = useState<string>('Lead Full-Stack Tech');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConvert = async () => {
    setIsSubmitting(true);
    try {
      const res = await convertInquiryToCrmLead(submission, dealValue, {
        stage,
        pillar,
        assignedTo
      });
      if (res.success) {
        onConverted(res.lead.id, res.lead.dealValue);
        onClose();
      }
    } catch (err) {
      console.error('Failed to convert inquiry to CRM lead:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const servicePillars: CrmServicePillar[] = [
    'Web Development',
    'UI/UX Design',
    'Mobile App',
    'Branding & Identity',
    'AI & Cloud Solutions',
    'Digital Product MVP'
  ];

  const stages: { value: CrmStage; labelId: string; labelEn: string; desc: string }[] = [
    { value: 'new', labelId: 'Lead Baru (Inbound)', labelEn: 'New Lead Inbound', desc: 'Brief masuk menunggu kualifikasi' },
    { value: 'contacted', labelId: 'Discovery Call', labelEn: 'Discovery Call', desc: 'Sudah dihubungi & dijadwalkan' },
    { value: 'proposal', labelId: 'Proposal & Scope', labelEn: 'Proposal & Scope', desc: 'RAB & Spesifikasi dikirim' },
    { value: 'negotiation', labelId: 'Negosiasi SOW', labelEn: 'Contract Negotiation', desc: 'Finalisasi kontrak & pembayaran DP' }
  ];

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      title={language === 'id' ? 'Konversi ke Agency CRM Pipeline' : 'Convert to Agency CRM Pipeline'}
      description={language === 'id' ? 'Sinkronisasi prospek klien ke sistem tracking deal agensi.' : 'Bridge inbound brief into an active sales pipeline opportunity.'}
      footer={
        <>
          <button type="button" onClick={onClose} className="min-h-10 rounded-control border border-line bg-panel px-4 text-xs font-medium text-muted transition-colors hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            {language === 'id' ? 'Batal' : 'Cancel'}
          </button>
          <button type="button" disabled={isSubmitting} onClick={handleConvert} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-accent px-4 text-xs font-semibold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <span>{language === 'id' ? 'Konfirmasi & Buat Lead CRM' : 'Confirm & Create CRM Deal'}</span>
            <ArrowRight size={14} />
          </button>
        </>
      }
    >
      <div className="space-y-5">
          
          {/* Client Summary Card */}
          <div className="p-4 rounded-control bg-panel border border-line grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-sans text-muted block mb-0.5">{language === 'id' ? 'Nama Klien' : 'Client Name'}</span>
              <span className="text-xs font-semibold text-fg flex items-center gap-1.5">
                <User size={13} className="text-accent-text" />
                {submission.fullName}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-sans text-muted block mb-0.5">{language === 'id' ? 'Perusahaan / Organisasi' : 'Company / Brand'}</span>
              <span className="text-xs font-medium text-fg flex items-center gap-1.5">
                <Building2 size={13} className="text-accent-text" />
                {submission.company || 'Individual Client'}
              </span>
            </div>
          </div>

          {/* Deal Value Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-sans text-muted flex items-center gap-1.5">
                <DollarSign size={13} className="text-accent-text" />
                <span>{language === 'id' ? 'Estimasi Nilai Kontrak (Deal Value in IDR)' : 'Estimated Deal Value (IDR)'}</span>
              </label>
              <span className="text-[11px] font-sans font-semibold text-accent-text">
                {formatAmount(dealValue, currency)}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="1000000"
                step="1000000"
                value={dealValue}
                onChange={(e) => setDealValue(Number(e.target.value) || 0)}
                className="w-full pl-4 pr-16 py-2.5 bg-panel border border-line rounded-control text-sm font-sans text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus:border-accent"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-sans text-muted">
                IDR
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {[25000000, 45000000, 75000000, 120000000, 200000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDealValue(preset)}
                  className={`px-2 py-1 rounded-control text-[10px] font-sans transition-colors border ${
                    dealValue === preset
                      ? 'bg-accent/10 text-accent-text border-accent/30 font-semibold'
                      : 'bg-panel text-muted border-line hover:text-fg'
                  }`}
                >
                  {formatIDR(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Service Pillar Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-sans text-muted flex items-center gap-1.5">
              <Layers size={13} className="text-accent-text" />
              <span>{language === 'id' ? 'Pilar Layanan Agensi' : 'Agency Service Pillar'}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {servicePillars.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPillar(p)}
                  className={`p-2.5 rounded-control border text-left text-xs font-sans transition-all ${
                    pillar === p
                      ? 'bg-accent/10 text-accent-text border-accent/30 font-semibold'
                      : 'bg-panel text-muted border-line hover:text-fg'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Target Stage Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-sans text-muted flex items-center gap-1.5">
              <Calendar size={13} className="text-accent-text" />
              <span>{language === 'id' ? 'Tahapan Awal di CRM' : 'Initial CRM Stage'}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stages.map((stg) => (
                <button
                  key={stg.value}
                  type="button"
                  onClick={() => setStage(stg.value)}
                  className={`p-3 rounded-control border text-left transition-all ${
                    stage === stg.value
                      ? 'bg-accent/10 text-accent-text border-accent/30 font-semibold'
                      : 'bg-panel text-muted border-line hover:text-fg'
                  }`}
                >
                  <div className="text-xs font-sans font-semibold">
                    {language === 'id' ? stg.labelId : stg.labelEn}
                  </div>
                  <div className="text-[10px] font-sans text-muted mt-0.5">
                    {stg.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <label className="text-xs font-sans text-muted flex items-center gap-1.5">
              <User size={13} className="text-accent-text" />
              <span>{language === 'id' ? 'Penanggung Jawab (Owner)' : 'Assigned Team Lead'}</span>
            </label>
            <CustomSelect
              value={assignedTo}
              onChange={setAssignedTo}
              className="w-full"
              size="sm"
              options={[
                { value: 'Lead Full-Stack Tech', label: 'Lead Full-Stack Tech (Engineering)' },
                { value: 'Senior UI/UX Designer', label: 'Senior UI/UX Designer (Product)' },
                { value: 'Technical Project Manager', label: 'Technical Project Manager (Delivery)' },
                { value: 'Business Director', label: 'Business Director (Account Closing)' }
              ]}
            />
          </div>

        </div>

    </Modal>
  );
};
