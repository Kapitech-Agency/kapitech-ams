import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  Send, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Briefcase, 
  Sparkles 
} from 'lucide-react';
import { ContactSubmission } from '../../../lib/submissions';
import { useLanguage } from '../../../lib/LanguageContext';
import { Modal } from '../../ui/Modal';

interface CannedResponsesModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: ContactSubmission;
  onSelectTemplate?: (text: string) => void;
}

export const CannedResponsesModal: React.FC<CannedResponsesModalProps> = ({
  isOpen,
  onClose,
  submission,
  onSelectTemplate
}) => {
  const { language } = useLanguage();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const clientName = submission.fullName || 'Client';
  const companyName = submission.company ? ` (${submission.company})` : '';
  const serviceSummary = (submission.services || []).join(', ') || submission.specialty || 'Digital Transformation';

  const templates = [
    {
      key: 'discovery_call',
      title: language === 'id' ? 'Jadwal Discovery Call (15-30 Menit)' : 'Discovery Call Invitation (15-30 Mins)',
      icon: Calendar,
      category: language === 'id' ? 'Konversi Awal' : 'Early Conversion',
      subject: language === 'id' 
        ? `Kapitech Agency: Penjadwalan Discovery Call - ${submission.fullName}`
        : `Kapitech Agency: Discovery Call Schedule - ${submission.fullName}`,
      body: language === 'id'
        ? `Halo ${clientName},

Terima kasih telah menghubungi Kapitech Agency terkait kebutuhan ${serviceSummary}${companyName}.

Tim Solution Architect kami telah meninjau brief awal Anda. Kami ingin mengundang Anda ke sesi Discovery Call singkat (15-30 menit) via Google Meet untuk mendalami spesifikasi teknis, ekspektasi timeline, serta arsitektur solusi yang paling efisien.

Silakan pilih waktu yang paling sesuai untuk Anda melalui tautan kalender kami:
🔗 https://cal.com/kapitech-agency/discovery-30min

Atau jika Anda memiliki preferensi waktu lain (misal: besok jam 14:00 WIB), silakan kabari kami.

Salam hangat,
Tim Solution Architect | Kapitech Agency
https://kapitech.id`
        : `Dear ${clientName},

Thank you for reaching out to Kapitech Agency regarding your ${serviceSummary} initiative${companyName}.

Our Solution Architecture team has reviewed your preliminary project brief. We would like to invite you to an introductory 20-minute Discovery Call via Google Meet to align on technical architecture, deliverables roadmap, and timeline milestones.

Please select your preferred timeslot via our calendar:
🔗 https://cal.com/kapitech-agency/discovery-30min

Alternatively, feel free to reply with your available windows this week.

Best regards,
Lead Solution Architect | Kapitech Agency
https://kapitech.id`
    },
    {
      key: 'rfp_scoping',
      title: language === 'id' ? 'Kuesioner Detail Spesifikasi Proyek (RFP)' : 'Technical Scoping Questionnaire (RFP)',
      icon: FileText,
      category: language === 'id' ? 'Pendalaman Scope' : 'Technical Scoping',
      subject: language === 'id'
        ? `Kapitech Agency: Formulir Kebutuhan Teknis Proyek - ${submission.fullName}`
        : `Kapitech Agency: Project Scoping & Tech Specs - ${submission.fullName}`,
      body: language === 'id'
        ? `Halo ${clientName},

Terima kasih atas minat Anda bermitra dengan Kapitech Agency${companyName}.

Untuk mempersiapkan proposal teknis komprehensif beserta breakdown estimasi biaya (Fixed Milestone atau Dedicated Sprint), mohon bantuan untuk melengkapi beberapa rincian berikut:

1. Target peluncuran (Go-Live Deadline) yang diharapkan?
2. Apakah sudah ada rancangan UI/UX (Figma/Wireframe) atau dimulai dari discovery nol?
3. Integrasi pihak ketiga (Payment Gateway, ERP, CRM, AI LLM API, OAuth)?
4. Target platform prioritas (Web App, Mobile iOS/Android, atau Full-stack API)?

Anda juga dapat mengirimkan dokumen RFP atau diagram alur jika telah tersedia. Tim kami siap menindaklanjuti dalam kurun 1x24 jam kerja.

Hormat kami,
Technical Project Director | Kapitech Agency
https://kapitech.id`
        : `Dear ${clientName},

Thank you for your interest in partnering with Kapitech Agency${companyName}.

To construct an accurate technical proposal and transparent milestone breakdown (Fixed Price or Dedicated Sprint model), could you kindly provide additional context on:

1. Target Go-Live launch deadline?
2. Do you have ready Figma design assets or will this start from product discovery?
3. Required third-party integrations (Payment gateway, CRM, LLM APIs, Auth)?
4. Target production platforms (Modern Web App, Native/Cross-platform Mobile, Cloud API)?

Feel free to attach any existing PRD, wireframes, or RFP documents to this thread. We look forward to shaping your product roadmap.

Warm regards,
Technical Project Director | Kapitech Agency
https://kapitech.id`
    },
    {
      key: 'rate_card_deck',
      title: language === 'id' ? 'Kirim Portofolio & Rate Card Resmi' : 'Send Credentials Deck & Rate Card',
      icon: Sparkles,
      category: language === 'id' ? 'Komersial & Portofolio' : 'Credentials',
      subject: language === 'id'
        ? `Kapitech Agency: Kredensial Portofolio & Struktur Biaya Jasa`
        : `Kapitech Agency: Production Portfolio & Engagement Models`,
      body: language === 'id'
        ? `Halo ${clientName},

Menindaklanjuti pesan Anda terkait ${serviceSummary}, berikut kami lampirkan ringkasan kredensial Kapitech Agency dan model kerjasama kami:

• Portofolio Unggulan: https://kapitech.id/work
• Model Kerjasama: 
  - Dedicated Engineering Sprint (Tim teknis terspesialisasi)
  - Fixed-Scope Turnkey Milestone (Jaminan SLA & Garansi bug-free)
  - Retainer Maintenance & Cloud Infrastructure SLA

Kami berkomitmen menghadirkan arsitektur berskala produksi, performa Lighthouse 95+, serta desain antarmuka top-tier kelas dunia.

Kapan waktu yang tepat bagi kami untuk mendemonstrasikan live demo studi kasus relevan untuk Anda?

Salam sukses,
Client Relations | Kapitech Agency`
        : `Dear ${clientName},

Following up on your brief for ${serviceSummary}, please find our agency credentials overview and engagement models below:

• Case Studies & Live Production Work: https://kapitech.id/work
• Engagement Models:
  - Dedicated Engineering Sprint (Full-stack engineers & UI/UX designers)
  - Milestone Turnkey Delivery (Rigorous SLA & bug-free warranty)
  - Retainer Maintenance & Cloud Infrastructure Optimization

We pride ourselves on zero-compromise engineering, 95+ Lighthouse performance, and world-class product interfaces.

When would be a convenient time for a brief walkthrough of relevant case studies for your team?

Best regards,
Client Relations | Kapitech Agency`
    },
    {
      key: 'career_vendor_ack',
      title: language === 'id' ? 'Konfirmasi Lamaran / Partner Vendor' : 'Career / Vendor Partnership Acknowledgment',
      icon: Briefcase,
      category: language === 'id' ? 'Talenta & Vendor' : 'Talent & Partner',
      subject: language === 'id'
        ? `Kapitech Agency: Konfirmasi Penerimaan Profil & Portofolio`
        : `Kapitech Agency: Receipt of Profile & Collaboration Inquiry`,
      body: language === 'id'
        ? `Halo ${clientName},

Terima kasih telah mengajukan profil profesional Anda ke Kapitech Agency.

Kami telah menerima data portofolio serta rate card Anda. Tim Operasional & Talent Lead kami sedang melakukan review kompetensi teknis dan kesesuaian proyek aktif kami.

Apabila terdapat kebutuhan pipeline proyek atau posisi sprint yang selaras dengan keahlian Anda, tim kami akan menghubungi Anda secara langsung untuk tahapan interview teknis singkat.

Tetap terhubung dan salam sukses!

People & Partner Operations | Kapitech Agency
https://kapitech.id`
        : `Dear ${clientName},

Thank you for submitting your credentials to Kapitech Agency.

Our Talent & Vendor Partnership Operations team has received your submission and portfolio assets. We maintain a curated bench of elite specialists for our enterprise and venture engagements.

If an upcoming client initiative matches your skill stack and rate structure, our lead producer will reach out directly to coordinate an onboarding discussion.

Best regards,
People & Partner Operations | Kapitech Agency
https://kapitech.id`
    }
  ];

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const cleanPhoneForWhatsApp = (rawPhone?: string) => {
    if (!rawPhone) return '';
    let digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '62' + digits.substring(1);
    return digits;
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="xl"
      title={language === 'id' ? 'Template Respon Cepat Agensi' : 'Executive Canned Responses'}
      description={language === 'id' ? `Disesuaikan untuk: ${clientName}` : `Personalized for: ${clientName}`}
      footer={
        <div className="flex w-full items-center justify-between gap-3 text-xs text-muted">
          <span>{language === 'id' ? 'Format teks otomatis menyertakan identitas brief.' : 'Templates auto-merge client brief variables.'}</span>
          <button type="button" onClick={onClose} className="min-h-10 rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            {language === 'id' ? 'Tutup' : 'Close'}
          </button>
        </div>
      }
    >
        <div className="space-y-4">
          {templates.map((tpl) => {
            const Icon = tpl.icon;
            const isCopied = copiedKey === tpl.key;

            return (
              <div 
                key={tpl.key}
                className="p-4 rounded-control bg-panel border border-line hover:border-[var(--line)] transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-control bg-panel flex items-center justify-center text-accent-text shrink-0">
                      <Icon size={13} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-fg font-sans">{tpl.title}</h4>
                      <span className="text-[10px] font-sans text-muted">{tpl.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Copy Body */}
                    <button
                      onClick={() => handleCopy(tpl.key, tpl.body)}
                      className={`min-h-10 px-2.5 rounded-control text-xs font-sans transition-all flex items-center gap-1.5 border ${
                        isCopied 
                          ? 'bg-success/10 text-success border-success/30 font-semibold' 
                          : 'bg-panel text-muted border-line hover:text-fg hover:border-[var(--line)]'
                      }`}
                      title="Copy response body"
                    >
                      {isCopied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{isCopied ? (language === 'id' ? 'Tersalin' : 'Copied') : (language === 'id' ? 'Salin' : 'Copy')}</span>
                    </button>

                    {/* Email Mailto Action */}
                    <a
                      href={`mailto:${submission.email}?subject=${encodeURIComponent(tpl.subject)}&body=${encodeURIComponent(tpl.body)}`}
                      onClick={onClose}
                      className="min-h-10 px-2.5 rounded-control bg-accent hover:brightness-110 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                      title="Send via default Email Client"
                    >
                      <Send size={12} />
                      <span>Email</span>
                    </a>

                    {/* WhatsApp Action if phone available */}
                    {submission.phone && cleanPhoneForWhatsApp(submission.phone) && (
                      <a
                        href={`https://wa.me/${cleanPhoneForWhatsApp(submission.phone)}?text=${encodeURIComponent(tpl.body)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="min-h-10 px-2.5 rounded-control bg-[var(--success)] hover:brightness-110 text-white text-xs font-sans font-semibold transition-colors flex items-center gap-1.5"
                        title="Send via WhatsApp"
                      >
                        <span>WA</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Body Preview */}
                <div className="p-3 rounded-control bg-panel border border-line text-[11px] text-muted font-sans leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {tpl.body}
                </div>
              </div>
            );
          })}
        </div>
    </Modal>
  );
};
