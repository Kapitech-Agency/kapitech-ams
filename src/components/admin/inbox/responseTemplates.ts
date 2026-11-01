import { Calendar, FileText, Briefcase, Sparkles } from 'lucide-react';
import type { ContactSubmission } from '../../../lib/submissions';
import type { Language } from '../../../lib/LanguageContext';

type ResponseTemplateContext = Pick<ContactSubmission, 'fullName' | 'company' | 'services' | 'specialty'>;

/** Existing built-in content, shared with Messages. Library labels are unmerged placeholders, not contact records. */
export function getInboxResponseTemplates(language: Language, submission: ResponseTemplateContext = {
  fullName: '[Contact name]', company: '[Company]', services: ['[Requested services]'],
}) {
  const clientName = submission.fullName || 'Client';
  const companyName = submission.company ? ` (${submission.company})` : '';
  const serviceSummary = (submission.services || []).join(', ') || submission.specialty || 'Digital Transformation';

  return [
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

}
