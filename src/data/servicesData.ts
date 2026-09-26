export interface ServiceItemData {
  slug: string;
  type: 'solution' | 'service';
  category: 'Solutions' | 'Branding' | 'Design' | 'Development';
  title: string;
  navSubtitle: string;
  navSubtitleId: string;
  heroHeadline: string;
  heroHeadlineId: string;
  heroSubtitle: string;
  heroSubtitleId: string;
  badge: string;
  badgeId: string;
  metrics: Array<{ value: string; label: string; labelId: string }>;
  testimonial: {
    quote: string;
    quoteId: string;
    highlight: string;
    highlightId: string;
    author: string;
    role: string;
    company: string;
    avatar: string;
  };
  caseStudySlugs: string[];
  problemsSolutions: Array<{
    problemTitle: string;
    problemTitleId: string;
    problemDesc: string;
    problemDescId: string;
    solutionTitle: string;
    solutionTitleId: string;
    solutionDesc: string;
    solutionDescId: string;
  }>;
  capabilities: Array<{
    title: string;
    titleId: string;
    desc: string;
    descId: string;
  }>;
  processStages: Array<{
    stageNumber: string;
    stageName: string;
    stageNameId: string;
    stageDesc: string;
    stageDescId: string;
    deliverables: string[];
    deliverablesId: string[];
  }>;
  businessOutcomes: {
    heading: string;
    headingId: string;
    benefits: string[];
    benefitsId: string[];
  };
  tools: string[];
  faqs: Array<{
    q: string;
    qId: string;
    a: string;
    aId: string;
  }>;
}

export const allSolutionsAndServices: ServiceItemData[] = [
  // ==========================================
  // SOLUTIONS (3)
  // ==========================================
  {
    slug: 'mvp-design',
    type: 'solution',
    category: 'Solutions',
    title: 'MVP DESIGN',
    navSubtitle: 'For enterprise ecosystems',
    navSubtitleId: 'Untuk ekosistem enterprise & startup',
    heroHeadline: 'MVP design & clickable product prototyping company',
    heroHeadlineId: 'Studio desain produk MVP & prototipe interaktif siap uji',
    heroSubtitle: 'Turn complex product ideas into investor-ready, high-converting digital MVPs in 2-4 weeks with our battle-tested product design frameworks.',
    heroSubtitleId: 'Ubah ide produk digital kompleks menjadi MVP interaktif siap presentasi investor dan siap uji pengguna dalam 2-4 minggu dengan standar desain kelas dunia.',
    badge: 'High Impact Solution',
    badgeId: 'Solusi Dampak Tinggi',
    metrics: [
      { value: '50+', label: 'Digital Products Launched', labelId: 'Produk Digital Sukses Rilis' },
      { value: '2-4 Wks', label: 'Average MVP Delivery', labelId: 'Rata-rata Waktu Serah Terima' },
      { value: '$10M+', label: 'Capital Raised by Clients', labelId: 'Total Modal Diraih Klien' }
    ],
    testimonial: {
      quote: 'Kapitech team knew how to turn our raw concept into an undeniable visual product. We were deeply impressed by how fast they understood our competitive landscape.',
      quoteId: 'Tim Kapitech tahu persis bagaimana mengubah konsep mentah kami menjadi produk visual yang tak terbantahkan. Kami sangat terkesan dengan kecepatan pemahaman pasar mereka.',
      highlight: 'visual product',
      highlightId: 'produk visual',
      author: 'Mohamed Shegow',
      role: 'CEO & Co-Founder',
      company: 'Sinta Health',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['kross-cloud-security', 'zenora-health-suite', 'orbit-cloud-platform'],
    problemsSolutions: [
      {
        problemTitle: 'Slow Time-to-Market',
        problemTitleId: 'Waktu Peluncuran Lambat',
        problemDesc: 'Traditional development cycles take 6+ months just to test basic market assumptions with high burn rates.',
        problemDescId: 'Pengembangan tradisional memakan waktu 6+ bulan hanya untuk menguji asumsi dasar pasar dengan biaya operasional tinggi.',
        solutionTitle: 'Rapid 14-Day Sprint Validation',
        solutionTitleId: 'Validasi Sprint Cepat 14 Hari',
        solutionDesc: 'We build high-fidelity, interactive prototypes in Figma with realistic micro-flows to test with real users immediately.',
        solutionDescId: 'Kami membangun prototipe interaktif beresolusi tinggi di Figma dengan alur realistis untuk segera divalidasi langsung ke pengguna nyata.'
      },
      {
        problemTitle: 'Unconvincing Investor Pitches',
        problemTitleId: 'Presentasi Investor Kurang Menarik',
        problemDesc: 'Static slides fail to convey software mechanics, resulting in lukewarm investor engagement and lost term sheets.',
        problemDescId: 'Slide statis gagal menunjukkan cara kerja perangkat lunak, menyebabkan investor kurang antusias dan kehilangan peluang pendanaan.',
        solutionTitle: 'Clickable Live Demos',
        solutionTitleId: 'Demo Interaktif Siap Presentasi',
        solutionDesc: 'Hand investors a tangible, clickable experience on mobile or desktop that validates product-market fit on the spot.',
        solutionDescId: 'Beri investor pengalaman langsung yang dapat diklik di ponsel atau laptop untuk membuktikan kesiapan produk secara nyata.'
      },
      {
        problemTitle: 'Messy Handoff to Engineers',
        problemTitleId: 'Serah Terima Desain ke Developer Kacau',
        problemDesc: 'Incomplete specs and lack of design tokens cause developer confusion, technical debt, and delayed launches.',
        problemDescId: 'Spesifikasi tidak lengkap dan ketiadaan token desain menimbulkan kebingungan developer, utang teknis, dan keterlambatan rilis.',
        solutionTitle: 'Tokenized Design-to-Code Specs',
        solutionTitleId: 'Spesifikasi Token Desain Siap Koding',
        solutionDesc: 'Auto-layout components, responsive variants, typography scales, and token exports ready for React / Next.js.',
        solutionDescId: 'Komponen auto-layout, variasi responsif, skala tipografi, dan token CSS/Tailwind yang siap dieksekusi langsung oleh tim engineer.'
      }
    ],
    capabilities: [
      { title: 'Rapid User Journey Mapping', titleId: 'Pemetaan Alur Pengguna Singkat', desc: 'Identify core friction points and outline the fastest path to user value.', descId: 'Identifikasi titik hambatan dan rancang rute tercepat bagi pengguna mencapai nilai produk.' },
      { title: 'Interactive High-Fidelity UI', titleId: 'UI Interaktif Resolusi Tinggi', desc: 'Sleek dark and light interfaces designed with mathematical optical balance.', descId: 'Antarmuka gelap dan terang modern yang dirancang dengan harmoni optik matematis.' },
      { title: 'Usability Testing & Feedback Loops', titleId: 'Uji Keterpakaian & Umpan Balik', desc: 'Structured testing sessions with target personas to refine UX before writing code.', descId: 'Sesi pengujian terstruktur dengan target persona sebelum satu baris kode pun ditulis.' },
      { title: 'Modular Figma Design Tokens', titleId: 'Token Desain Figma Modular', desc: 'Atomic design system ready to scale into a multi-tiered SaaS application.', descId: 'Sistem desain atomik yang siap diskalakan menjadi aplikasi SaaS multi-tier.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Discovery & Core Scope',
        stageNameId: 'Riset & Ruang Lingkup Inti',
        stageDesc: 'We distill your product vision into the top 20% of features that deliver 80% of user value.',
        stageDescId: 'Kami menyaring visi produk Anda menjadi 20% fitur inti terpenting yang menghasilkan 80% nilai bagi pengguna.',
        deliverables: ['Product Scope Matrix', 'User Persona Archetypes', 'Core User Flow Diagrams'],
        deliverablesId: ['Matriks Ruang Lingkup Produk', 'Arketipe Persona Pengguna', 'Diagram Alur Pengguna Inti']
      },
      {
        stageNumber: '02',
        stageName: 'Wireframing & UX Architecture',
        stageNameId: 'Wireframing & Arsitektur UX',
        stageDesc: 'Low-fidelity layout blueprints to establish information hierarchy, navigation, and conversion paths.',
        stageDescId: 'Cetak biru tata letak awal untuk memvalidasi hierarki informasi, navigasi, dan titik konversi.',
        deliverables: ['Full Screen Wireframes', 'Information Architecture Map', 'Click-Through Concept Flow'],
        deliverablesId: ['Wireframe Layar Lengkap', 'Peta Arsitektur Informasi', 'Alur Konsep Navigasi']
      },
      {
        stageNumber: '03',
        stageName: 'High-Fidelity Visual Design',
        stageNameId: 'Desain Visual High-Fidelity',
        stageDesc: 'Pixel-perfect UI design, micro-interactions, responsive states, and cohesive component kits.',
        stageDescId: 'Desain UI berpresisi tinggi, mikro-interaksi, status responsif, dan kit komponen yang konsisten.',
        deliverables: ['Desktop & Mobile Hi-Fi Mockups', 'Interactive Figma Prototype', 'Design System Tokens'],
        deliverablesId: ['Mockup Hi-Fi Desktop & Mobile', 'Prototipe Figma Interaktif', 'Token Sistem Desain']
      },
      {
        stageNumber: '04',
        stageName: 'Testing & Developer Hand-off',
        stageNameId: 'Uji Pengguna & Serah Terima Koding',
        stageDesc: 'User feedback integration, edge-case audit, and full hand-off package for engineering sprint kickoff.',
        stageDescId: 'Integrasi masukan pengguna, audit kasus tepi (edge cases), dan paket lengkap untuk tim engineer.',
        deliverables: ['Usability Test Report', 'Redline Developer Specs', 'Exported Vector & Media Assets'],
        deliverablesId: ['Laporan Uji Keterpakaian', 'Spesifikasi Developer Siap Koding', 'Paket Aset Vektor & Media']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Secure pre-seed, seed, or Series A funding with an undeniable live prototype',
        'Cut product development costs by up to 45% by validating UX before coding',
        'Acquire early alpha/beta waitlist users with high-converting preview flows',
        'Accelerate engineering velocity with crystal-clear design tokens and specs'
      ],
      benefitsId: [
        'Raih pendanaan pre-seed, seed, atau Series A dengan prototipe interaktif meyakinkan',
        'Hemat biaya pengembangan hingga 45% dengan memvalidasi UX sebelum koding dimulai',
        'Dapatkan pengguna pendaftar awal (waitlist alpha/beta) dengan alur konversi tinggi',
        'Akselerasi kecepatan tim developer dengan token desain dan spesifikasi yang sangat jelas'
      ]
    },
    tools: ['Figma', 'FigJam', 'Spline 3D', 'Miro', 'Protopie'],
    faqs: [
      {
        q: 'How long does an MVP Design project take from kickoff to completion?',
        qId: 'Berapa lama pengerjaan proyek Desain MVP dari awal hingga selesai?',
        a: 'A typical MVP design cycle takes between 2 to 4 weeks depending on the complexity of the core user flows and number of key screens (typically 15-30 screens).',
        aId: 'Siklus desain MVP standar memakan waktu 2 hingga 4 minggu tergantung kompleksitas alur pengguna dan jumlah layar utama (biasanya 15-30 layar).'
      },
      {
        q: 'Will the final Figma file be ready for our in-house developers?',
        qId: 'Apakah file Figma final sudah siap untuk tim developer internal kami?',
        a: 'Yes, absolutely. We use strict Auto-Layout, standardized component naming, variable color/typography tokens, and responsive break-point states so developers can inspect and copy code properties seamlessly.',
        aId: 'Ya, tentu saja. Kami menggunakan Auto-Layout ketat, penamaan komponen terstandar, token warna/tipografi, dan varian layar responsif sehingga developer dapat langsung mengimplementasikannya.'
      },
      {
        q: 'Can Kapitech also build the backend and frontend code for our MVP?',
        qId: 'Apakah Kapitech juga dapat mengembangkan kode backend dan frontend MVP kami?',
        a: 'Yes! We offer full-cycle MVP Development using modern TypeScript, Next.js, Node.js, and cloud database architectures to turn your design prototype into a live production software.',
        aId: 'Ya! Kami menyediakan layanan Pengembangan MVP Full-Stack menggunakan TypeScript, Next.js, Node.js, dan database cloud untuk mengubah prototipe desain menjadi aplikasi aktif di server produksi.'
      }
    ]
  },

  {
    slug: 'product-redesign',
    type: 'solution',
    category: 'Solutions',
    title: 'PRODUCT REDESIGN',
    navSubtitle: 'For SMEs & enterprises',
    navSubtitleId: 'Untuk UKM & korporasi berkembang',
    heroHeadline: 'Strategic product redesign & UX overhaul company',
    heroHeadlineId: 'Perusahaan redesain produk digital & modernisasi UX strategis',
    heroSubtitle: 'Elevate retention, eliminate churn, and modernize legacy software interfaces into high-impact digital experiences that dominate modern markets.',
    heroSubtitleId: 'Tingkatkan retensi pengguna, hilangkan friksi alur konversi, dan modernisasi software lama Anda menjadi pengalaman digital superior berstandar global.',
    badge: 'Conversion & Growth Solution',
    badgeId: 'Solusi Pertumbuhan & Konversi',
    metrics: [
      { value: '+42%', label: 'Average Conversion Lift', labelId: 'Peningkatan Rata-rata Konversi' },
      { value: '-65%', label: 'User Task Completion Time', labelId: 'Pengurangan Waktu Selesai Tugas' },
      { value: '99.8%', label: 'WCAG Accessibility Score', labelId: 'Skor Aksesibilitas Web WCAG' }
    ],
    testimonial: {
      quote: 'Redesigning our core platform with Kapitech doubled our customer renewal rate. Their meticulous UX audit uncovered friction points we had overlooked for years.',
      quoteId: 'Mendesain ulang platform utama kami bersama Kapitech melipatgandakan tingkat pembaruan langganan klien. Audit UX mereka yang teliti menemukan titik friksi yang terlewatkan selama bertahun-tahun.',
      highlight: 'doubled customer renewal',
      highlightId: 'melipatgandakan langganan',
      author: 'Zachary Schenkler',
      role: 'Founder & CEO',
      company: 'Solstice Enterprise Systems',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['lumina-property-portal', 'nexus-fintech-app', 'vivid-headless-commerce'],
    problemsSolutions: [
      {
        problemTitle: 'High User Drop-off & Churn',
        problemTitleId: 'Tingkat Drop-off & Churn Tinggi',
        problemDesc: 'Confusing legacy navigation and cluttered forms cause new signups to abandon before completing key onboarding tasks.',
        problemDescId: 'Navigasi lama yang membingungkan dan formulir berantakan membuat pengguna baru keluar sebelum menyelesaikan pendaftaran.',
        solutionTitle: 'Streamlined Frictionless UX',
        solutionTitleId: 'UX Mulus Tanpa Hambatan',
        solutionDesc: 'We restructure user journeys, apply progressive disclosure, and eliminate cognitive overload to drive record conversions.',
        solutionDescId: 'Kami menata ulang alur pengguna, menerapkan progressive disclosure, dan menghilangkan beban kognitif untuk meningkatkan konversi.'
      },
      {
        problemTitle: 'Outdated Visual Identity',
        problemTitleId: 'Identitas Visual Ketinggalan Zaman',
        problemDesc: 'Competitors look modern and sleek while your interface appears dated, eroding trust with enterprise buyers.',
        problemDescId: 'Kompetitor tampil modern dan elegan sementara antarmuka Anda tampak usang, mengikis kepercayaan calon klien enterprise.',
        solutionTitle: 'Modern Luxury Design System',
        solutionTitleId: 'Sistem Desain Modern Berkelas',
        solutionDesc: 'Fresh dark/light palettes, crisp typography hierarchy, subtle motion tokens, and refined micro-interactions.',
        solutionDescId: 'Palet warna gelap/terang modern, hierarki tipografi tajam, token animasi halus, dan mikro-interaksi berpresisi tinggi.'
      },
      {
        problemTitle: 'Inconsistent UI Elements',
        problemTitleId: 'Elemen UI Tidak Konsisten',
        problemDesc: 'Years of ad-hoc feature patches result in 10 different button styles, conflicting fonts, and broken responsiveness.',
        problemDescId: 'Penambahan fitur bertahun-tahun tanpa standar menghasilkan 10 gaya tombol berbeda dan tampilan mobile yang rusak.',
        solutionTitle: 'Unified Design System Standard',
        solutionTitleId: 'Standarisasi Sistem Desain Terpadu',
        solutionDesc: 'A cohesive, centralized component library built with Figma Auto-Layout 5.0 and rigorous accessibility standards.',
        solutionDescId: 'Pustaka komponen terpusat yang kohesif dibangun dengan Figma Auto-Layout dan standar aksesibilitas internasional.'
      }
    ],
    capabilities: [
      { title: 'Comprehensive Heuristic UX Audit', titleId: 'Audit Heuristik UX Menyeluruh', desc: 'Identify drop-offs, accessibility gaps, and usability bottlenecks across all screen sizes.', descId: 'Identifikasi titik drop-off, celah aksesibilitas, dan hambatan navigasi di semua perangkat.' },
      { title: 'Conversion Funnel Optimization', titleId: 'Optimasi Corong Konversi', desc: 'Redesign checkout, signup, and dashboard workflows to maximize revenue per user.', descId: 'Redesain alur checkout, pendaftaran, dan dashboard untuk memaksimalkan retensi dan omzet.' },
      { title: 'Accessibility (WCAG 2.1 AA) Compliance', titleId: 'Kepatuhan Aksesibilitas WCAG 2.1 AA', desc: 'High-contrast typography, color-blind friendly scales, and focus states.', descId: 'Tipografi kontras tinggi, palet ramah buta warna, dan indikator fokus navigasi keyboard.' },
      { title: 'Migration & Staging Playbooks', titleId: 'Panduan Migrasi & Staging', desc: 'Step-by-step rollout strategy to minimize disruption for existing power users.', descId: 'Strategi rilis bertahap untuk menjaga kenyamanan pengguna setia saat pembaruan diluncurkan.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Diagnostic & Analytics Audit',
        stageNameId: 'Audit Diagnostik & Analitik Data',
        stageDesc: 'Quantitative session recording review, funnel analysis, and heuristic evaluation of the current system.',
        stageDescId: 'Evaluasi kuantitatif data analitik, analisis corong konversi, dan evaluasi heuristik sistem lama.',
        deliverables: ['UX Friction Heatmap Report', 'Competitor Benchmark Matrix', 'Priority Action Roadmap'],
        deliverablesId: ['Laporan Titik Hambatan UX', 'Matriks Komparasi Kompetitor', 'Roadmap Prioritas Perbaikan']
      },
      {
        stageNumber: '02',
        stageName: 'Architecture & Workflow Overhaul',
        stageNameId: 'Restrukturisasi Arsitektur & Alur Kerja',
        stageDesc: 'Streamlining navigation hierarchy, simplifying forms, and restructuring complex data views.',
        stageDescId: 'Menyederhanakan hierarki navigasi, merampingkan formulir, dan menata tampilan data analitik.',
        deliverables: ['Refactored Information Architecture', 'Optimized Flow Wireframes', 'Core View Prototypes'],
        deliverablesId: ['Arsitektur Informasi yang Disederhanakan', 'Wireframe Alur Optimal', 'Prototipe Tampilan Utama']
      },
      {
        stageNumber: '03',
        stageName: 'Aesthetic Modernization & UI Kit',
        stageNameId: 'Modernisasi Estetika & Kit UI',
        stageDesc: 'Applying modern visual polish, clean typography, tactile feedback states, and full responsive views.',
        stageDescId: 'Penerapan estetika visual modern, tipografi bersih, mikro-interaksi, dan tampilan responsif lengkap.',
        deliverables: ['Production-Grade High-Fi Screens', 'Complete Tokenized Design System', 'Dark & Light Mode Variants'],
        deliverablesId: ['Desain Layar Hi-Fi Standar Produksi', 'Sistem Desain Berbasis Token', 'Varian Tema Gelap & Terang']
      },
      {
        stageNumber: '04',
        stageName: 'Validation & Hand-off Support',
        stageNameId: 'Validasi & Dukungan Serah Terima',
        stageDesc: 'A/B test planning, usability verification, and developer hand-off with technical QA.',
        stageDescId: 'Perencanaan A/B testing, verifikasi keterpakaian, dan pendampingan serah terima teknis ke developer.',
        deliverables: ['A/B Testing Framework', 'Interactive Figma Prototype', 'Design QA Sign-Off Checklist'],
        deliverablesId: ['Panduan A/B Testing', 'Prototipe Figma Interaktif', 'Daftar Periksa QA Desain']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Boost customer lifetime value and user engagement across your core platform',
        'Cut customer support tickets by up to 50% through intuitive self-serve workflows',
        'Command premium pricing and outshine modern industry competitors',
        'Establish a future-proof design foundation that scales smoothly for years'
      ],
      benefitsId: [
        'Tingkatkan nilai masa hidup pelanggan (LTV) dan engagement di seluruh platform',
        'Pangkas tiket bantuan teknis pelanggan hingga 50% melalui alur mandiri yang intuitif',
        'Posisikan produk pada harga premium dan ungguli para kompetitor industri',
        'Bangun fondasi sistem desain masa depan yang siap berkembang untuk tahun-tahun mendatang'
      ]
    },
    tools: ['Figma', 'Hotjar', 'Google Analytics 4', 'Mixpanel', 'Miro'],
    faqs: [
      {
        q: 'Will a redesign alienate our existing loyal users?',
        qId: 'Apakah redesain akan membingungkan pengguna setia kami?',
        a: 'We design with familiar mental models in mind. Our progressive transition strategies and usability testing ensure that power users adapt immediately while finding their workflows faster and easier.',
        aId: 'Kami merancang dengan model mental yang familiar. Strategi transisi bertahap dan pengujian keterpakaian memastikan pengguna setia dapat beradaptasi langsung dengan alur kerja yang lebih cepat.'
      },
      {
        q: 'Can you redesign our product in phases rather than all at once?',
        qId: 'Bisakah redesain dilakukan secara bertahap daripada sekaligus?',
        a: 'Yes, we frequently structure redesigns in modular phases starting with high-impact core funnels (e.g. Onboarding, Checkout, Dashboard) before moving to secondary views.',
        aId: 'Ya, kami sering menyusun redesain secara bertahap mulai dari alur dengan dampak bisnis tertinggi (misalnya Onboarding, Checkout, Dashboard) sebelum masuk ke halaman sekunder.'
      }
    ]
  },

  {
    slug: 'team-extension',
    type: 'solution',
    category: 'Solutions',
    title: 'TEAM EXTENSION',
    navSubtitle: 'For existing companies',
    navSubtitleId: 'Untuk perusahaan dengan tim internal',
    heroHeadline: 'Dedicated senior design & engineering team extension',
    heroHeadlineId: 'Ekspansi tim desainer & engineer senior terdedikasi',
    heroSubtitle: 'Embed battle-tested, high-caliber product designers, motion specialists, and full-stack engineers into your sprints with zero hiring overhead.',
    heroSubtitleId: 'Integrasikan desainer produk, spesialis animasi, dan engineer full-stack berpengalaman langsung ke alur kerja sprint tim internal Anda tanpa kerumitan rekrutmen.',
    badge: 'Dedicated Talent Model',
    badgeId: 'Model Talenta Terdedikasi',
    metrics: [
      { value: '48 Hrs', label: 'Talent Onboarding Speed', labelId: 'Kecepatan Onboarding Talenta' },
      { value: '100%', label: 'Timezone Synchronized', labelId: 'Sinkronisasi Zona Waktu Penuh' },
      { value: 'Top 3%', label: 'Vetted Senior Specialists', labelId: 'Spesialis Senior Terkurasi' }
    ],
    testimonial: {
      quote: 'Kapitech is not just a contract vendor, but a true extension of our core team. They push our product velocity forward every single sprint with impeccable design standards.',
      quoteId: 'Kapitech bukan sekadar vendor lepas, melainkan perpanjangan nyata dari tim inti kami. Mereka mempercepat siklus rilis produk kami di setiap sprint dengan standar desain tanpa cela.',
      highlight: 'extension of our core team',
      highlightId: 'perpanjangan dari tim inti kami',
      author: 'Ola Olusoga',
      role: 'VP of Digital Experience',
      company: 'Enterprise Cloud Technologies',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['zenora-health-suite', 'orbit-cloud-platform', 'kross-cloud-security'],
    problemsSolutions: [
      {
        problemTitle: 'Hiring is Painfully Slow & Expensive',
        problemTitleId: 'Rekrutmen Lambat & Biaya Tinggi',
        problemDesc: 'Sourcing, interviewing, and onboarding senior product designers takes 3-5 months with high recruiter fees and overhead.',
        problemDescId: 'Mencari, mewawancarai, dan melatih desainer senior memakan waktu 3-5 bulan dengan biaya perantara dan beban gaji tetap yang tinggi.',
        solutionTitle: 'Instant 48-Hour Deployment',
        solutionTitleId: 'Penempatan Instan dalam 48 Jam',
        solutionDesc: 'Get pre-vetted senior designers and engineers integrated into your Slack, Jira, and Figma within 48 hours.',
        solutionDescId: 'Dapatkan spesialis senior terkurasi yang siap terhubung ke Slack, Jira, dan Figma tim Anda dalam waktu 48 jam.'
      },
      {
        problemTitle: 'Internal Team is Overloaded',
        problemTitleId: 'Tim Internal Kelebihan Beban Kerja',
        problemDesc: 'Product roadmaps stall when your in-house team is bogged down by urgent maintenance and cannot take on new feature sprints.',
        problemDescId: 'Roadmap produk terhenti ketika tim internal terjebak pada pemeliharaan rutin dan tidak sempat mengeksekusi fitur baru.',
        solutionTitle: 'Scalable Sprint Reinforcement',
        solutionTitleId: 'Akselerasi Kapasitas Sprint Skalabel',
        solutionDesc: 'Dedicated experts who absorb backlog tickets, design new modules, and ship production-ready assets continuously.',
        solutionDescId: 'Talenta berdedikasi yang menangani antrean backlog, merancang modul baru, dan menghasilkan aset siap produksi secara konsisten.'
      },
      {
        problemTitle: 'Inconsistent Freelancer Quality',
        problemTitleId: 'Kualitas Freelancer Tidak Konsisten',
        problemDesc: 'Freelancers often lack enterprise context, miss deadlines, and disappear when critical bugs arise.',
        problemDescId: 'Freelancer sering kali kurang memahami konteks korporat, meleset dari tenggat waktu, dan sulit dihubungi saat terjadi kendala.',
        solutionTitle: 'Managed Agency Accountability & SLA',
        solutionTitleId: 'Akuntabilitas Agensi Bergaransi SLA',
        solutionDesc: 'Backed by Kapitech’s senior creative directors and technical leadership with strict quality guarantees and backup coverage.',
        solutionDescId: 'Didukung supervisi Creative Director dan Tech Lead senior Kapitech dengan jaminan kualitas dan kontinuitas kerja terjamin.'
      }
    ],
    capabilities: [
      { title: 'Full-Time Dedicated Allocation', titleId: 'Alokasi Penuh Waktu Berdedikasi', desc: '100% focused on your product, attending daily standups, and collaborating live in your workflow.', descId: 'Fokus 100% pada produk Anda, menghadiri standup harian, dan berkolaborasi langsung di sistem kerja Anda.' },
      { title: 'Seamless Toolchain Integration', titleId: 'Integrasi Alat Kerja Fleksibel', desc: 'We work inside your Figma teams, Jira/Linear boards, Slack channels, and GitHub repos.', descId: 'Kami bekerja langsung di dalam workspace Figma, board Jira/Linear, Slack, dan repositori GitHub Anda.' },
      { title: 'Senior Creative Director Oversight', titleId: 'Supervisi Creative Director Senior', desc: 'Every deliverable is reviewed internally by our directors to maintain world-class standards.', descId: 'Setiap hasil kerja ditinjau secara internal oleh direktur kreatif kami untuk menjaga standar kelas dunia.' },
      { title: 'Flexible Month-to-Month Retainer', titleId: 'Sistem Retainer Bulanan Fleksibel', desc: 'Scale capacity up or down as your product roadmap and funding cycles evolve.', descId: 'Tingkatkan atau sesuaikan kapasitas tim sesuai fase roadmap produk dan siklus pendanaan Anda.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Needs Assessment & Matching',
        stageNameId: 'Analisis Kebutuhan & Pencocokan Talenta',
        stageDesc: 'We evaluate your stack, product roadmap, and required skill sets to match you with the ideal dedicated specialists.',
        stageDescId: 'Kami meninjau tech stack, roadmap produk, dan keahlian yang dibutuhkan untuk memilih spesialis terbaik untuk Anda.',
        deliverables: ['Talent Skill Matrix', 'Onboarding Roadmap', 'Sprint Integration Plan'],
        deliverablesId: ['Matriks Keterampilan Talenta', 'Roadmap Onboarding', 'Rencana Integrasi Sprint']
      },
      {
        stageNumber: '02',
        stageName: 'Workspace Setup & Kickoff',
        stageNameId: 'Pengaturan Workspace & Kickoff',
        stageDesc: 'Access provisioning, tooling integration (Figma/Slack/Jira), and initial product alignment workshop.',
        stageDescId: 'Pemberian akses kerja, integrasi alat kolaborasi (Figma/Slack/Jira), dan workshop penyelarasan visi produk.',
        deliverables: ['Active Toolchain Access', 'Design System Sync', 'Sprint Backlog Allocation'],
        deliverablesId: ['Akses Alat Kolaborasi Aktif', 'Sinkronisasi Sistem Desain', 'Alokasi Backlog Sprint']
      },
      {
        stageNumber: '03',
        stageName: 'Active Sprint Execution',
        stageNameId: 'Eksekusi Sprint Aktif & Harian',
        stageDesc: 'Daily standups, continuous design iterations, clickable prototyping, and direct developer hand-offs.',
        stageDescId: 'Standup harian, iterasi desain cepat, pembuatan prototipe, dan serah terima teknis langsung ke developer.',
        deliverables: ['Daily Shipped Design Assets', 'Sprint Demo Prototypes', 'Weekly Velocity Reports'],
        deliverablesId: ['Aset Desain Selesai Harian', 'Prototipe Demo Sprint', 'Laporan Kecepatan Mingguan']
      },
      {
        stageNumber: '04',
        stageName: 'Review & Roadmap Scaling',
        stageNameId: 'Evaluasi Berkala & Skalabilitas',
        stageDesc: 'Monthly performance retrospectives, design debt audits, and scaling roadmap adjustments.',
        stageDescId: 'Retrospeksi performa bulanan, audit utang desain, dan penyesuaian kapasitas tim sesuai kebutuhan.',
        deliverables: ['Monthly Retrospective Report', 'Design System Governance Log', 'Next Sprint Capacity Forecast'],
        deliverablesId: ['Laporan Retrospeksi Bulanan', 'Log Tata Kelola Sistem Desain', 'Prakiraan Kapasitas Sprint Berikutnya']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Triple your sprint output without taking on long-term payroll liabilities',
        'Eliminate recruitment lead time and onboard senior talent in 48 hours',
        'Maintain pixel-perfect UI/UX consistency across all product verticals',
        'Gain strategic insights and design director oversight at no extra cost'
      ],
      benefitsId: [
        'Lipat tigakan output sprint Anda tanpa beban kewajiban penggajian jangka panjang',
        'Hilangkan masa tunggu rekrutmen dan integrasikan talenta senior dalam 48 jam',
        'Jaga konsistensi standar UI/UX berpresisi tinggi di semua lini modul produk',
        'Dapatkan wawasan strategis dan supervisi Creative Director tanpa biaya tambahan'
      ]
    },
    tools: ['Figma', 'Slack', 'Linear', 'Jira', 'GitHub', 'Notion'],
    faqs: [
      {
        q: 'What is the minimum contract commitment for Team Extension?',
        qId: 'Berapa komitmen kontrak minimum untuk layanan Team Extension?',
        a: 'Our team extension engagements typically start with a 1-month trial retainer, after which clients usually scale to ongoing 3-to-12 month sprint commitments.',
        aId: 'Kerja sama Team Extension kami biasanya dimulai dengan komitmen retainer uji coba 1 bulan, yang kemudian dapat diperpanjang secara fleksibel untuk periode 3 hingga 12 bulan.'
      },
      {
        q: 'Do the dedicated talents attend our daily team standups?',
        qId: 'Apakah talenta terdedikasi menghadiri standup harian tim kami?',
        a: 'Yes, absolutely. They operate as embedded members of your in-house team, joining your daily morning standups, sprint planning, and retrospective sessions via Google Meet, Zoom, or Slack.',
        aId: 'Ya, tentu saja. Mereka beroperasi sebagai anggota tim internal Anda, menghadiri standup harian, sprint planning, dan sesi evaluasi via Google Meet, Zoom, atau Slack.'
      }
    ]
  },

  // ==========================================
  // BRANDING SERVICES (5)
  // ==========================================
  {
    slug: 'pitch-deck',
    type: 'service',
    category: 'Branding',
    title: 'Pitch Deck',
    navSubtitle: 'Get visuals that raise capital',
    navSubtitleId: 'Visual presentasi memukau untuk menggalang modal',
    heroHeadline: 'Pitch deck design company & investor presentation studio',
    heroHeadlineId: 'Perusahaan desain pitch deck investor & presentasi modal ventura',
    heroSubtitle: 'Deliver an effective, undeniable presentation of your company to venture capital investors, institutional partners, and enterprise clients with our executive-grade deck design services.',
    heroSubtitleId: 'Sajikan presentasi bisnis yang kuat dan meyakinkan kepada investor modal ventura, mitra institusi, dan dewan direksi dengan layanan desain pitch deck eksekutif kami.',
    badge: 'Fundraising Specialist',
    badgeId: 'Spesialis Penggalangan Dana',
    metrics: [
      { value: '100+', label: 'Decks Crafted for Founders', labelId: 'Pitch Deck Berhasil Dibuat' },
      { value: '$100M+', label: 'Combined Capital Raised', labelId: 'Total Modal Berhasil Diraih' },
      { value: '5.0', label: 'Average Founder Rating', labelId: 'Rating Kepuasan Klien' }
    ],
    testimonial: {
      quote: 'Kapitech designed a deck that made our complex deep-tech infrastructure instantly clear to tier-1 venture partners. We closed our oversubscribed seed round in 3 weeks.',
      quoteId: 'Kapitech merancang deck yang membuat infrastruktur teknologi kami yang rumit menjadi sangat mudah dipahami oleh partner modal ventura top-tier. Kami menutup putaran pendanaan dalam 3 minggu.',
      highlight: 'instantly clear to tier-1 partners',
      highlightId: 'sangat mudah dipahami partner top-tier',
      author: 'Kirill Onasenko',
      role: 'CEO & Co-Founder',
      company: 'BlockDB Networks',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['lumina-property-portal', 'zenora-health-suite', 'nexus-fintech-app'],
    problemsSolutions: [
      {
        problemTitle: 'Text-Heavy, Boring Slides',
        problemTitleId: 'Slide Penuh Teks & Membosankan',
        problemDesc: 'Investors review 50+ decks daily. Dense paragraphs and bullet points get skimmed and discarded within 30 seconds.',
        problemDescId: 'Investor meninjau 50+ deck setiap hari. Paragraf padat dan poin membosankan akan dilewati dalam 30 detik pertama.',
        solutionTitle: 'Visual Storytelling & Data Infographics',
        solutionTitleId: 'Storytelling Visual & Infografis Data',
        solutionDesc: 'We turn dense metrics, market data, and tech architecture into crystal-clear, unforgettable visual storylines.',
        solutionDescId: 'Kami mengubah data metrik, peluang pasar (TAM/SAM), dan arsitektur teknis menjadi alur visual yang tajam dan tak terlupakan.'
      },
      {
        problemTitle: 'Unclear Financial & Market Visuals',
        problemTitleId: 'Visualisasi Keuangan & Pasar Kabur',
        problemDesc: 'Spreadsheet screenshots look unpolished and fail to highlight your true unit economics and scalability trajectory.',
        problemDescId: 'Tangkapan layar spreadsheet tampak amatir dan gagal menonjolkan unit ekonomi serta proyeksi pertumbuhan bisnis Anda.',
        solutionTitle: 'Custom Vector Charts & Models',
        solutionTitleId: 'Grafik Vektor & Model Finansial Kustom',
        solutionDesc: 'Polished, custom financial visualizers that command credibility and highlight clear paths to profitability.',
        solutionDescId: 'Visualisasi finansial berkelas eksekutif yang membangun kredibilitas tinggi dan memperjelas jalur profitabilitas.'
      },
      {
        problemTitle: 'Inflexible Formats for Presenting',
        problemTitleId: 'Format File Kaku & Sulit Diedit',
        problemDesc: 'Locked PDFs prevent you from tweaking valuation numbers and metrics before crucial partner meetings.',
        problemDescId: 'File PDF terkunci membuat Anda tidak bisa memperbarui angka valuasi atau metrik sebelum pertemuan krusial.',
        solutionTitle: 'Fully Editable Master Decks',
        solutionTitleId: 'Master Deck Interaktif yang Mudah Diedit',
        solutionDesc: 'Delivered in your format of choice: Figma, Keynote, Google Slides, or PowerPoint with dynamic asset libraries.',
        solutionDescId: 'Diserahkan dalam format pilihan Anda: Figma, Keynote, Google Slides, atau PowerPoint dengan komponen dinamis.'
      }
    ],
    capabilities: [
      { title: 'Investor Narrative & Storyboarding', titleId: 'Narasi Investor & Storyboard', desc: 'Craft a compelling narrative arc from market problem to unique moat and traction.', descId: 'Susun alur cerita memukau mulai dari masalah pasar, solusi unik, hingga traksi dan moat bisnis.' },
      { title: 'Data & Financial Visualization', titleId: 'Visualisasi Data & Finansial', desc: 'Bespoke charts for TAM/SAM/SOM, cohort retention, and revenue projections.', descId: 'Grafik kustom untuk TAM/SAM/SOM, retensi kohort pengguna, dan proyeksi pendapatan.' },
      { title: 'One-Pager Executive Teasers', titleId: 'Teaser Eksekutif 1 Halaman (One-Pager)', desc: 'High-converting summary sheets for cold email intros and investor warm leads.', descId: 'Lembar ringkasan berkonversi tinggi untuk email pengantar dan prospek investor hangat.' },
      { title: 'Interactive Web Pitch Decks', titleId: 'Pitch Deck Web Interaktif', desc: 'Animated browser-based presentation links with visitor viewing analytics.', descId: 'Tautan presentasi web interaktif dengan analitik pelacakan pembacaan investor.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Story Architecture & Script Review',
        stageNameId: 'Struktur Cerita & Tinjauan Naskah',
        stageDesc: 'Reviewing your pitch script, identifying your unique competitive edge, and establishing a 15-20 slide structure.',
        stageDescId: 'Meninjau naskah presentasi, membedah keunggulan kompetitif, dan menyusun kerangka 15-20 slide.',
        deliverables: ['Pitch Storyline Outline', 'Slide-by-Slide Content Matrix'],
        deliverablesId: ['Kerangka Alur Cerita Pitch', 'Matriks Konten Per Slide']
      },
      {
        stageNumber: '02',
        stageName: 'Visual Concept & Style Direction',
        stageNameId: 'Konsep Visual & Arah Gaya Desain',
        stageDesc: 'Developing 2 distinct creative directions for cover, problem, and traction slides matching your brand tone.',
        stageDescId: 'Membuat 2 arah konsep visual berbeda untuk cover, masalah, dan traksi yang selaras dengan karakter brand Anda.',
        deliverables: ['Moodboards & Style Tiles', 'Sample Concept Slides'],
        deliverablesId: ['Moodboard & Tipografi', 'Sampel Konsep Slide Utama']
      },
      {
        stageNumber: '03',
        stageName: 'Full Deck Production & Data Design',
        stageNameId: 'Produksi Penuh & Desain Data',
        stageDesc: 'Designing all slides with custom infographics, 3D product renders, clean typography, and visual hierarchy.',
        stageDescId: 'Mendesain seluruh slide dengan infografis kustom, render produk 3D, tipografi bersih, dan hierarki visual kuat.',
        deliverables: ['Full 15-25 Slide Hi-Fi Deck', 'Custom Chart Vector Assets'],
        deliverablesId: ['Deck Lengkap 15-25 Slide Hi-Fi', 'Aset Vektor Grafik Finansial']
      },
      {
        stageNumber: '04',
        stageName: 'Final Master Handoff & One-Pager',
        stageNameId: 'Serah Terima Master & One-Pager',
        stageDesc: 'Editable presentation files in Keynote/PowerPoint/Figma, PDF export, and a branded 1-page executive teaser.',
        stageDescId: 'File master yang dapat diedit di Keynote/PowerPoint/Figma, ekspor PDF resolusi cetak, dan teaser 1 halaman.',
        deliverables: ['Editable Master File', 'Optimized PDF Presentation', 'Executive One-Pager Teaser'],
        deliverablesId: ['File Master Dapat Diedit', 'PDF Presentasi Teroptimasi', 'Teaser Eksekutif 1 Halaman']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Command instant respect and attention in high-stakes venture capital meetings',
        'Articulate complex technical advantages in seconds with clear visual metaphors',
        'Equip your founding team with a modular deck easy to adapt for different partners',
        'Close funding rounds faster with high-impact executive storytelling'
      ],
      benefitsId: [
        'Raih respek dan perhatian instan dalam pertemuan krusial bersama modal ventura',
        'Jelaskan keunggulan teknis yang kompleks dalam hitungan detik lewat metafora visual',
        'Bekali tim founder dengan deck modular yang mudah disesuaikan untuk berbagai mitra',
        'Tutup putaran pendanaan lebih cepat dengan storytelling eksekutif berstandar tinggi'
      ]
    },
    tools: ['Figma', 'Keynote', 'PowerPoint', 'Adobe Illustrator', 'Photoshop'],
    faqs: [
      {
        q: 'Can you help us refine the copy and slide narrative, or only the visuals?',
        qId: 'Bisakah Anda membantu menyempurnakan naskah dan narasi slide, atau hanya visual saja?',
        a: 'We do both! We provide end-to-end support including content editing, narrative pacing, and executive storytelling alongside world-class visual design.',
        aId: 'Kami melakukan keduanya! Kami memberikan dukungan menyeluruh mulai dari penyuntingan konten, ritme narasi presentasi, hingga desain visual berstandar global.'
      },
      {
        q: 'What is the turnaround time for an investor deck?',
        qId: 'Berapa lama waktu pengerjaan sebuah investor pitch deck?',
        a: 'Standard pitch deck projects take 1 to 2 weeks. We also offer expedited 5-day sprints for founders with imminent partner meetings.',
        aId: 'Proyek pitch deck standar memakan waktu 1 hingga 2 minggu. Kami juga menyediakan opsi sprint kilat 5 hari bagi founder yang memiliki jadwal pertemuan mendesak.'
      }
    ]
  },

  {
    slug: 'brand-identity',
    type: 'service',
    category: 'Branding',
    title: 'Brand Identity',
    navSubtitle: 'Build trust with design',
    navSubtitleId: 'Bangun kepercayaan pelanggan melalui desain terpadu',
    heroHeadline: 'Strategic brand identity & visual ecosystem agency',
    heroHeadlineId: 'Agensi identitas brand strategis & ekosistem visual terpadu',
    heroSubtitle: 'Build undeniable authority, market distinction, and lasting customer trust through unified visual guidelines, bespoke typography, and coherent brand ecosystems.',
    heroSubtitleId: 'Bangun otoritas pasar yang tak terbantahkan dan kepercayaan pelanggan melalui pedoman visual komprehensif, tipografi kustom, dan ekosistem brand yang konsisten.',
    badge: 'Brand Architecture',
    badgeId: 'Arsitektur Brand',
    metrics: [
      { value: '50+ Pg', label: 'Brand Guidelines Manual', labelId: 'Pedoman Brandbook Komprehensif' },
      { value: '100%', label: 'Vector Asset Scalability', labelId: 'Skalabilitas Aset Vektor Penuh' },
      { value: '3-5 Wks', label: 'Complete Identity Delivery', labelId: 'Waktu Pengerjaan Total' }
    ],
    testimonial: {
      quote: 'The brand identity Kapitech created for us positioned our tech startup alongside multi-billion dollar enterprise competitors from day one.',
      quoteId: 'Identitas brand yang diciptakan Kapitech memposisikan startup teknologi kami sejajar dengan kompetitor korporat bernilai miliaran dolar sejak hari pertama.',
      highlight: 'positioned alongside enterprise competitors',
      highlightId: 'sejajar dengan kompetitor korporat',
      author: 'Aura Creative Director',
      role: 'Managing Partner',
      company: 'Aura Media Group',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['aura-brand-guidelines', 'vivid-headless-commerce', 'lumina-property-portal'],
    problemsSolutions: [
      {
        problemTitle: 'Fragmented Visual Appearance',
        problemTitleId: 'Tampilan Visual Tidak Konsisten',
        problemDesc: 'Different colors, mismatched fonts, and inconsistent layouts across web, social, and print make your business look amateur.',
        problemDescId: 'Warna berbeda-beda, font tidak serasi, dan tata letak tidak konsisten di web, media sosial, dan materi cetak membuat bisnis tampak amatir.',
        solutionTitle: 'Unified Design Guidelines & Tokens',
        solutionTitleId: 'Pedoman Desain Terpadu & Token Warna',
        solutionDesc: 'A comprehensive brand manual covering color mathematics, typography scales, spacing rules, and asset usage.',
        solutionDescId: 'Buku pedoman brand manual lengkap yang mencakup formula warna, skala tipografi, aturan spasi, dan panduan penggunaan aset.'
      },
      {
        problemTitle: 'Generic Look-Alike Brand',
        problemTitleId: 'Tampilan Merek Terlalu Pasaran',
        problemDesc: 'Using stock templates leaves your brand indistinguishable from hundreds of competitors in your space.',
        problemDescId: 'Penggunaan template pasaran membuat brand Anda tidak memiliki pembeda dari ratusan kompetitor lainnya.',
        solutionTitle: 'Distinctive Bespoke Visual Identity',
        solutionTitleId: 'Identitas Visual Kustom & Berkarakter',
        solutionDesc: 'Unique geometric marks, custom typographic pairings, and atmospheric color hierarchies crafted for your niche.',
        solutionDescId: 'Simbol geometris orisinal, kombinasi tipografi elegan, dan palet warna kontras yang dirancang khusus untuk industri Anda.'
      }
    ],
    capabilities: [
      { title: 'Brand Strategy & Positioning', titleId: 'Strategi & Positioning Brand', desc: 'Define your core brand pillars, tone of voice, and competitive differentiation.', descId: 'Tentukan pilar utama brand, karakter suara (tone of voice), dan diferensiasi pasar.' },
      { title: 'Typography Hierarchy & Pairing', titleId: 'Hierarki & Pasangan Tipografi', desc: 'Pair distinctive display type with hyper-readable body fonts across all platforms.', descId: 'Kombinasi font judul berkarakter kuat dengan font isi yang nyaman dibaca di semua layar.' },
      { title: 'Color Psychology & Accessibility', titleId: 'Psikologi Warna & Aksesibilitas', desc: 'Mathematical palette creation passing strict WCAG AA contrast standards.', descId: 'Pembuatan palet warna terhitung yang lulus standar kontras aksesibilitas WCAG AA.' },
      { title: 'Corporate Collateral & Social Kits', titleId: 'Materi Korporat & Kit Media Sosial', desc: 'Business cards, letterheads, invoice templates, and reusable social post templates.', descId: 'Kartu nama resmi, kop surat, template invoice, dan template konten media sosial.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Brand Discovery & Market Positioning',
        stageNameId: 'Riset Brand & Positioning Pasar',
        stageDesc: 'Auditing your competitors, analyzing target demographics, and establishing the strategic creative brief.',
        stageDescId: 'Audit kompetitor, analisis demografi target pasar, dan penyusunan brief kreatif strategis.',
        deliverables: ['Brand Positioning Blueprint', 'Creative Direction Moodboards'],
        deliverablesId: ['Cetak Biru Positioning Brand', 'Moodboard Arah Kreatif']
      },
      {
        stageNumber: '02',
        stageName: 'Visual Identity & System Design',
        stageNameId: 'Desain Identitas Visual & Sistem',
        stageDesc: 'Developing the core visual identity: logo mark, typography system, color palette, and layout grids.',
        stageDescId: 'Mengembangkan identitas visual inti: lambang logo, sistem tipografi, palet warna, dan grid tata letak.',
        deliverables: ['Primary & Secondary Marks', 'Color Palette & Typography Specs'],
        deliverablesId: ['Logo Utama & Varian Sekunder', 'Spesifikasi Palet Warna & Font']
      },
      {
        stageNumber: '03',
        stageName: 'Collateral & Digital Asset Production',
        stageNameId: 'Produksi Materi Korporat & Aset Digital',
        stageDesc: 'Designing stationery, social media templates, email signatures, and corporate presentation templates.',
        stageDescId: 'Mendesain perlengkapan kantor, template media sosial, tanda tangan email, dan template presentasi.',
        deliverables: ['Corporate Stationery Kit', 'Social Media Template Library'],
        deliverablesId: ['Paket Alat Tulis Kantor Resmi', 'Pustaka Template Media Sosial']
      },
      {
        stageNumber: '04',
        stageName: 'Brand Guidelines Manual Handoff',
        stageNameId: 'Penyerahan Buku Pedoman Brandbook',
        stageDesc: 'Compiling the 50+ page brand manual and delivering all master vector assets in multiple formats.',
        stageDescId: 'Menyusun buku pedoman brandbook 50+ halaman dan menyerahkan seluruh aset master vektor siap pakai.',
        deliverables: ['50+ Page Digital Brand Guidelines', 'Complete Master Asset Archive'],
        deliverablesId: ['Buku Pedoman Brandbook Digital', 'Arsip Lengkap Aset Vektor Master']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Command higher pricing power with an unmistakably premium brand appearance',
        'Ensure 100% brand consistency across all digital and print touchpoints',
        'Equip your internal design and marketing teams with clear rules that save time',
        'Create immediate brand recall and recognition in your industry'
      ],
      benefitsId: [
        'Tingkatkan daya tawar harga dengan citra merek yang sangat prestisius',
        'Pastikan 100% konsistensi visual di seluruh media digital dan cetak',
        'Bekali tim internal dengan panduan jelas yang menghemat waktu produksi konten',
        'Ciptakan daya ingat dan pengenalan merek yang kuat di benak pelanggan'
      ]
    },
    tools: ['Adobe Illustrator', 'Photoshop', 'InDesign', 'Figma'],
    faqs: [
      {
        q: 'What is included in the Brand Guidelines manual?',
        qId: 'Apa saja yang termasuk dalam buku pedoman Brand Guidelines?',
        a: 'The manual includes clear rules for logo usage, clear space, minimum sizing, improper uses, primary and secondary color formulas (HEX, RGB, CMYK, Pantone), typographic pairings, photographic styling, and digital UI application examples.',
        aId: 'Manual mencakup aturan penggunaan logo, jarak aman, ukuran minimum, larangan modifikasi, formula warna (HEX, RGB, CMYK, Pantone), hierarki font, gaya fotografi, dan contoh penerapan di UI digital.'
      }
    ]
  },

  {
    slug: 'logo-design',
    type: 'service',
    category: 'Branding',
    title: 'Logo Design',
    navSubtitle: 'Become unforgettable',
    navSubtitleId: 'Tampil ikonik dan mudah diingat oleh audiens Anda',
    heroHeadline: 'Iconic logo design & bespoke typographic logomarks',
    heroHeadlineId: 'Desain logo ikonik & logotipe tipografi kustom',
    heroSubtitle: 'Distinctive, timeless, and mathematically balanced logomarks engineered for seamless scalability across app icons, billboards, and high-contrast digital interfaces.',
    heroSubtitleId: 'Simbol logo berkarakter kuat, tak lekang oleh waktu, dan seimbang secara optik untuk tampil tajam di ikon aplikasi mobile hingga billboard raksasa.',
    badge: 'Visual Trademark',
    badgeId: 'Simbol Ikonik',
    metrics: [
      { value: '3 Distinct', label: 'Creative Directions', labelId: 'Arah Konsep Kreatif' },
      { value: '100%', label: 'Copyright Ownership Transfer', labelId: 'Kepemilikan Hak Cipta Penuh' },
      { value: 'SVG / Vector', label: 'Infinite Resolution Formats', labelId: 'Format Vektor Resolusi Tak Terbatas' }
    ],
    testimonial: {
      quote: 'The logo Kapitech designed captured the essence of our clean-tech platform in a single, timeless symbol. It scales beautifully from mobile favicons to physical hardware.',
      quoteId: 'Logo yang dirancang Kapitech merangkum esensi teknologi energi bersih kami dalam satu simbol yang abadi. Tampil tajam dari favicon ponsel hingga perangkat keras fisik.',
      highlight: 'timeless symbol',
      highlightId: 'simbol yang abadi',
      author: 'Solaris CleanTech Team',
      role: 'Founder',
      company: 'Solaris Energy',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['solaris-cleantech-dashboard', 'orbit-cloud-platform', 'nexus-fintech-app'],
    problemsSolutions: [
      {
        problemTitle: 'Unscalable, Pixelated Marks',
        problemTitleId: 'Logo Pecah & Sulit Diskalakan',
        problemDesc: 'Logos created without proper vector mathematics become blurry on mobile devices and unusable on dark backgrounds.',
        problemDescId: 'Logo yang dibuat tanpa perhitungan matematis vektor akan tampak buram di ponsel dan tidak terbaca di latar gelap.',
        solutionTitle: 'Pixel-Perfect Geometric Vector Marks',
        solutionTitleId: 'Simbol Vektor Geometris Berpresisi Piksel',
        solutionDesc: 'Precision grid construction tested at 16px favicon scale and 4K display resolutions in light and dark modes.',
        solutionDescId: 'Konstruksi grid presisi yang diuji dari ukuran favicon 16px hingga layar 4K dalam mode terang dan gelap.'
      }
    ],
    capabilities: [
      { title: '3 Unique Concept Options', titleId: '3 Opsi Konsep Orisinal', desc: 'Distinct metaphorical angles for your executive team to choose from.', descId: 'Sudut pandang metafora visual berbeda untuk dipilih oleh tim eksekutif Anda.' },
      { title: 'Dark & Light Contrast Optimizations', titleId: 'Optimasi Kontras Terang & Gelap', desc: 'Custom optical weights for seamless legibility on black and white backdrops.', descId: 'Ketebalan optik kustom agar terbaca sempurna di latar belakang hitam maupun putih.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Concept Ideation & Sketching',
        stageNameId: 'Ideasi Konsep & Sketsa Awal',
        stageDesc: 'Exploring hundreds of pencil sketches to find metaphorical visual anchors.',
        stageDescId: 'Eksplorasi ratusan sketsa tangan untuk menemukan jangkar visual metafora bisnis Anda.',
        deliverables: ['Concept Sketchbook', 'Mood Matrix'],
        deliverablesId: ['Buku Sketsa Konsep', 'Matriks Arah Visual']
      },
      {
        stageNumber: '02',
        stageName: 'Vector Refinement & Presentation',
        stageNameId: 'Penyempurnaan Vektor & Presentasi',
        stageDesc: 'Building 3 distinct directions in vector grids with real-world application mockups.',
        stageDescId: 'Membangun 3 konsep berbeda pada grid vektor beserta mockup penerapan di dunia nyata.',
        deliverables: ['3 Concept Presentation Decks'],
        deliverablesId: ['3 Konsep Presentasi Logo']
      },
      {
        stageNumber: '03',
        stageName: 'Iteration & Master Export',
        stageNameId: 'Iterasi & Ekspor Master File',
        stageDesc: 'Refining the selected mark and exporting in all standard color variants and vector formats.',
        stageDescId: 'Menyempurnakan konsep terpilih dan mengekspor seluruh varian warna dan format vektor.',
        deliverables: ['Full Master Vector Suite (AI, EPS, SVG, PNG, PDF)'],
        deliverablesId: ['Paket Lengkap File Master Vektor']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Own a trademarkable, iconic brand mark that stands out in your market',
        'Ensure crisp visual reproduction across all digital and physical mediums',
        'Receive 100% intellectual property transfer documentation'
      ],
      benefitsId: [
        'Miliki simbol logo ikonik yang siap didaftarkan hak merek (HAKI)',
        'Jamin tampilan visual yang tajam di semua media cetak maupun digital',
        'Terima dokumen alih hak cipta intelektual kepemilikan penuh 100%'
      ]
    },
    tools: ['Adobe Illustrator', 'Figma', 'Vectorizer Pro'],
    faqs: [
      {
        q: 'Do I get the source files with full ownership?',
        qId: 'Apakah saya mendapatkan file sumber dengan hak milik penuh?',
        a: 'Yes, you receive all editable master source files (AI, EPS, SVG, high-res PNG, PDF) along with full copyright ownership.',
        aId: 'Ya, Anda menerima seluruh file master sumber yang dapat diedit (AI, EPS, SVG, PNG resolusi tinggi, PDF) beserta surat kepemilikan hak cipta penuh.'
      }
    ]
  },

  {
    slug: 'graphic-design',
    type: 'service',
    category: 'Branding',
    title: 'Graphic Design',
    navSubtitle: 'Illustrations, Icons, Social media',
    navSubtitleId: 'Ilustrasi kustom, ikonografi, dan materi media sosial',
    heroHeadline: 'Custom graphic design, bespoke vector illustration & icon systems',
    heroHeadlineId: 'Desain grafis kustom, ilustrasi vektor & sistem ikonografi bermerek',
    heroSubtitle: 'Elevate your marketing campaigns, digital products, and physical branding with custom-crafted vector illustrations, bespoke icon sets, and high-converting marketing visuals.',
    heroSubtitleId: 'Tingkatkan performa kampanye pemasaran dan produk digital Anda dengan ilustrasi vektor kustom, set ikon bermerek, dan visual promosi berdaya konversi tinggi.',
    badge: 'Visual Assets Studio',
    badgeId: 'Studio Aset Visual',
    metrics: [
      { value: '40+', label: 'Branded Vector Icons', labelId: 'Ikon Vektor Bermerek' },
      { value: '20+', label: 'Custom Illustrations', labelId: 'Ilustrasi Kustom' },
      { value: '100%', label: 'Vector Resolution', labelId: 'Resolusi Vektor 100%' }
    ],
    testimonial: {
      quote: 'The bespoke illustration library Kapitech created simplified our complex fintech mechanics into delightful visuals that boosted user signups by 30%.',
      quoteId: 'Pustaka ilustrasi kustom buatan Kapitech menyederhanakan cara kerja fintech kami menjadi visual menarik yang meningkatkan pendaftaran pengguna sebesar 30%.',
      highlight: 'simplified complex mechanics',
      highlightId: 'menyederhanakan cara kerja rumit',
      author: 'Nexus Fintech Growth Lead',
      role: 'Head of Growth',
      company: 'Nexus Finance',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['nexus-fintech-app', 'vivid-headless-commerce', 'aura-brand-guidelines'],
    problemsSolutions: [
      {
        problemTitle: 'Overused Stock Graphics',
        problemTitleId: 'Grafis Stok Pasaran yang Membosankan',
        problemDesc: 'Stock illustrations look generic and make your product look like every other competitor.',
        problemDescId: 'Ilustrasi stok terlihat pasaran dan membuat produk Anda tampak biasa saja seperti kompetitor lain.',
        solutionTitle: 'Bespoke Brand Illustration Library',
        solutionTitleId: 'Pustaka Ilustrasi Kustom Khusus Brand',
        solutionDesc: 'Custom visual metaphors drawn in your brand palette with unique character and tech elements.',
        solutionDescId: 'Metafora visual orisinal yang digambar dengan palet warna brand Anda dan karakter unik.'
      }
    ],
    capabilities: [
      { title: 'Custom 2D/3D Illustrations', titleId: 'Ilustrasi 2D/3D Kustom', desc: 'Tailored artwork for hero sections, empty states, and feature cards.', descId: 'Karya visual khusus untuk hero section, empty state, dan kartu fitur.' },
      { title: 'Bespoke Icon Systems', titleId: 'Sistem Ikon Khusus', desc: 'Pixel-aligned icons matching your typographic stroke weight.', descId: 'Ikon berpresisi piksel yang selaras dengan ketebalan garis font Anda.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Style Framing & Metaphor Selection',
        stageNameId: 'Penentuan Gaya & Pemilihan Metafora',
        stageDesc: 'Defining the visual language and sketching key character/product concepts.',
        stageDescId: 'Menentukan bahasa visual dan membuat sketsa konsep karakter/produk utama.',
        deliverables: ['Illustration Style Board'],
        deliverablesId: ['Papan Gaya Ilustrasi']
      },
      {
        stageNumber: '02',
        stageName: 'Vector Execution & Asset Library',
        stageNameId: 'Eksekusi Vektor & Pustaka Aset',
        stageDesc: 'Crafting all scenes, empty states, and icon sets in SVG format.',
        stageDescId: 'Mengerjakan seluruh adegan visual, empty state, dan set ikon dalam format SVG.',
        deliverables: ['Exported SVG/Figma Asset Library'],
        deliverablesId: ['Pustaka Aset SVG/Figma Siap Pakai']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Differentiate your digital product with proprietary visual assets',
        'Increase marketing CTR and social engagement with high-craft visuals'
      ],
      benefitsId: [
        'Bedakan produk digital Anda dengan aset visual orisinal milik sendiri',
        'Tingkatkan CTR iklan dan interaksi media sosial dengan visual berkelas'
      ]
    },
    tools: ['Adobe Illustrator', 'Photoshop', 'Figma'],
    faqs: [
      {
        q: 'Can these illustrations be animated for web with Lottie or CSS?',
        qId: 'Bisakah ilustrasi ini dianimasikan untuk web dengan Lottie atau CSS?',
        a: 'Yes, all vector layers are cleanly named and organized, making them 100% ready for Lottie, Rive, or CSS keyframe animations.',
        aId: 'Ya, seluruh layer vektor tertata rapi dan terorganisir, sehingga 100% siap dianimasikan menggunakan Lottie, Rive, atau CSS.'
      }
    ]
  },

  {
    slug: 'rebranding',
    type: 'service',
    category: 'Branding',
    title: 'Rebranding',
    navSubtitle: 'Rebrand to grow and convert',
    navSubtitleId: 'Rebranding untuk memicu pertumbuhan dan konversi baru',
    heroHeadline: 'Strategic corporate rebranding & visual transformation agency',
    heroHeadlineId: 'Agensi transformasi visual & rebranding korporat strategis',
    heroSubtitle: 'Revitalize your market position, conquer new enterprise verticals, and shed outdated perception with an end-to-end brand transformation.',
    heroSubtitleId: 'Revitalisasi posisi pasar Anda, jangkau segmen enterprise baru, dan ubah persepsi lama dengan transformasi brand menyeluruh.',
    badge: 'Enterprise Evolution',
    badgeId: 'Evolusi Korporat',
    metrics: [
      { value: '100%', label: 'Brand Alignment', labelId: 'Penyelarasan Merek Penuh' },
      { value: '4-8 Wks', label: 'Full Transformation Cycle', labelId: 'Siklus Transformasi Total' },
      { value: '+60%', label: 'Inbound Enterprise Inquiries', labelId: 'Peningkatan Prospek Enterprise' }
    ],
    testimonial: {
      quote: 'Our rebrand with Kapitech marked our transition from an early-stage startup to an enterprise market leader. The feedback from clients has been phenomenal.',
      quoteId: 'Rebranding bersama Kapitech menandai transisi kami dari startup tahap awal menjadi pemimpin pasar korporat. Respons dari klien sangat luar biasa.',
      highlight: 'transition to enterprise market leader',
      highlightId: 'transisi menjadi pemimpin pasar',
      author: 'Kross Cloud Leadership',
      role: 'Chief Marketing Officer',
      company: 'Kross Security Systems',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['kross-cloud-security', 'aura-brand-guidelines', 'lumina-property-portal'],
    problemsSolutions: [
      {
        problemTitle: 'Brand Outgrown by Business Scale',
        problemTitleId: 'Brand Tertinggal oleh Skala Bisnis',
        problemDesc: 'Your company has expanded, but your original visual identity still looks like a scrappy initial prototype.',
        problemDescId: 'Perusahaan Anda telah berkembang pesat, namun identitas visual lama masih tampak seperti produk uji coba awal.',
        solutionTitle: 'Total Brand Revitalization',
        solutionTitleId: 'Revitalisasi Brand Menyeluruh',
        solutionDesc: 'We overhaul the visual footprint to reflect your true enterprise capability, maturity, and market leadership.',
        solutionDescId: 'Kami merombak total identitas visual untuk mencerminkan kematangan dan kepemimpinan pasar bisnis Anda.'
      }
    ],
    capabilities: [
      { title: 'Brand Equity & Perception Audit', titleId: 'Audit Persepsi & Ekuitas Merek', desc: 'Assess current market sentiment and define gaps to bridge.', descId: 'Evaluasi persepsi pasar saat ini dan petakan celah yang harus dijembatani.' },
      { title: 'Complete Asset Migration Plan', titleId: 'Rencana Migrasi Aset Menyeluruh', desc: 'Checklist and rollout playbook for seamless transition across all platforms.', descId: 'Daftar periksa dan panduan peluncuran untuk transisi mulus di semua saluran.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Perception Audit & Strategy',
        stageNameId: 'Audit Persepsi & Strategi Baru',
        stageDesc: 'Benchmarking against tier-1 global competitors and defining the new positioning.',
        stageDescId: 'Analisis komparatif terhadap kompetitor global dan perumusan positioning baru.',
        deliverables: ['Rebranding Strategy Blueprint'],
        deliverablesId: ['Cetak Biru Strategi Rebranding']
      },
      {
        stageNumber: '02',
        stageName: 'Design System Overhaul',
        stageNameId: 'Perombakan Sistem Desain',
        stageDesc: 'Rebuilding the logo, color space, typography, and marketing touchpoints.',
        stageDescId: 'Membangun ulang logo, formula warna, tipografi, dan seluruh media pemasaran.',
        deliverables: ['Complete New Brand Ecosystem'],
        deliverablesId: ['Ekosistem Brand Baru Terpadu']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Close high-ticket enterprise deals with renewed market credibility',
        'Unify company culture and energize your team around a modern vision'
      ],
      benefitsId: [
        'Raih kontrak enterprise bernilai tinggi dengan kredibilitas pasar yang baru',
        'Satukan budaya internal dan segarkan motivasi tim dengan visi modern'
      ]
    },
    tools: ['Adobe Creative Cloud', 'Figma', 'Miro'],
    faqs: [
      {
        q: 'How do you ensure we don’t lose our existing brand recognition?',
        qId: 'Bagaimana memastikan kami tidak kehilangan pengenalan merek yang sudah ada?',
        a: 'We carefully audit your existing brand equity, retaining core recognizable elements while modernizing the geometry, typography, and digital presence.',
        aId: 'Kami mengaudit nilai historis brand Anda, mempertahankan elemen pengenal inti sambil memodernisasi bentuk geometris, font, dan representasi digitalnya.'
      }
    ]
  },

  // ==========================================
  // DESIGN SERVICES (5)
  // ==========================================
  {
    slug: 'ui-ux-design',
    type: 'service',
    category: 'Design',
    title: 'UI/UX Design',
    navSubtitle: 'Web product and interface design',
    navSubtitleId: 'Desain antarmuka web dan aplikasi mobile terpadu',
    heroHeadline: 'High-conversion UI/UX design studio for web & mobile apps',
    heroHeadlineId: 'Studio desain UI/UX berkonversi tinggi untuk web & aplikasi mobile',
    heroSubtitle: 'We combine optical precision, strict ergonomics, and user psychology to design intuitive, high-performance interfaces that maximize engagement and user retention.',
    heroSubtitleId: 'Kami menggabungkan presisi optik, ergonomi akses, dan psikologi pengguna untuk merancang antarmuka intuitif berkecepatan tinggi yang memaksimalkan retensi.',
    badge: 'Interface Excellence',
    badgeId: 'Keunggulan Antarmuka',
    metrics: [
      { value: '50+', label: 'SaaS Platforms Designed', labelId: 'Platform SaaS Dirancang' },
      { value: '98%', label: 'Client Satisfaction Score', labelId: 'Tingkat Kepuasan Klien' },
      { value: 'Sub-3s', label: 'User Task Velocity', labelId: 'Kecepatan Selesai Tugas Pengguna' }
    ],
    testimonial: {
      quote: 'The UX architecture Kapitech built for our cloud management portal reduced onboarding time by 60%. Their Figma design systems are pristine and a joy for developers.',
      quoteId: 'Arsitektur UX yang dibangun Kapitech untuk portal cloud kami memangkas waktu onboarding hingga 60%. Sistem desain Figma mereka sangat rapi dan memudahkan developer.',
      highlight: 'reduced onboarding time by 60%',
      highlightId: 'memangkas waktu onboarding 60%',
      author: 'Orbit Dynamics Lead Engineer',
      role: 'VP of Product',
      company: 'Orbit Cloud',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['orbit-cloud-platform', 'zenora-health-suite', 'nexus-fintech-app'],
    problemsSolutions: [
      {
        problemTitle: 'Cluttered, Confusing Interfaces',
        problemTitleId: 'Antarmuka Berantakan & Membingungkan',
        problemDesc: 'Complex feature bloat overwhelms users, leading to high abandonment and constant support requests.',
        problemDescId: 'Penumpukan fitur yang rumit membingungkan pengguna, menyebabkan tingginya pembatalan transaksi dan keluhan.',
        solutionTitle: 'Structured Information Architecture',
        solutionTitleId: 'Arsitektur Informasi Terstruktur & Rapi',
        solutionDesc: 'Clean progressive disclosure, clear visual hierarchy, and intuitive mental models that guide users effortlessly.',
        solutionDescId: 'Prinsip progressive disclosure, hierarki visual tegas, dan alur navigasi intuitif yang membimbing pengguna dengan mudah.'
      }
    ],
    capabilities: [
      { title: 'Full Design System Architecture', titleId: 'Arsitektur Sistem Desain Lengkap', desc: 'Tokenized color, typography, elevation, and component libraries.', descId: 'Pustaka token warna, tipografi, elevasi, dan komponen modular.' },
      { title: 'Interactive High-Fidelity Prototypes', titleId: 'Prototipe Interaktif Resolusi Tinggi', desc: 'Clickable realistic previews simulating end-state micro-interactions.', descId: 'Pratinjau realistis yang dapat diklik untuk menyimulasikan seluruh mikro-interaksi.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'User Research & Journey Mapping',
        stageNameId: 'Riset Pengguna & Pemetaan Alur',
        stageDesc: 'Mapping personas, user stories, and conversion funnels.',
        stageDescId: 'Pemetaan persona, user stories, dan alur konversi utama.',
        deliverables: ['User Flow Maps', 'UX Wireframes'],
        deliverablesId: ['Peta Alur Pengguna', 'Wireframe UX']
      },
      {
        stageNumber: '02',
        stageName: 'High-Fidelity UI & Tokenization',
        stageNameId: 'Desain UI Hi-Fi & Tokenisasi',
        stageDesc: 'Designing all responsive states with centralized design tokens.',
        stageDescId: 'Mendesain seluruh layar responsif dengan token desain terpusat.',
        deliverables: ['Figma UI Kit', 'Interactive Prototype'],
        deliverablesId: ['Kit UI Figma', 'Prototipe Interaktif']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Dramatically improve user adoption and daily active engagement',
        'Accelerate engineering sprints with crystal-clear design-to-code tokens'
      ],
      benefitsId: [
        'Tingkatkan adopsi pengguna dan tingkat keaktifan harian secara drastis',
        'Akselerasi siklus sprint developer dengan token desain siap pakai'
      ]
    },
    tools: ['Figma', 'FigJam', 'Spline 3D', 'Miro', 'Protopie'],
    faqs: [
      {
        q: 'Do you design for both web dashboards and mobile screens?',
        qId: 'Apakah Anda mendesain untuk dashboard web dan layar mobile sekaligus?',
        a: 'Yes, every project includes desktop, tablet, and mobile viewport responsive variations designed with strict auto-layout.',
        aId: 'Ya, setiap proyek mencakup variasi responsif desktop, tablet, dan mobile yang dirancang dengan auto-layout ketat.'
      }
    ]
  },

  {
    slug: 'website-design',
    type: 'service',
    category: 'Design',
    title: 'Website Design',
    navSubtitle: 'Custom websites & landings',
    navSubtitleId: 'Desain website kustom dan landing page berkonversi',
    heroHeadline: 'Bespoke corporate website & high-converting landing page design',
    heroHeadlineId: 'Desain website korporat kustom & landing page berkonversi tinggi',
    heroSubtitle: 'Custom-crafted marketing websites that captivate visitors, establish undeniable authority, and convert traffic into qualified inbound inquiries.',
    heroSubtitleId: 'Desain website pemasaran kustom yang memikat pengunjung, membangun otoritas bisnis, dan mengubah trafik menjadi prospek penjualan nyata.',
    badge: 'Web Aesthetics',
    badgeId: 'Estetika Web',
    metrics: [
      { value: '50+', label: 'Corporate Websites Shipped', labelId: 'Website Korporat Sukses Rilis' },
      { value: '100%', label: 'Responsive Viewports', labelId: 'Responsif di Semua Perangkat' },
      { value: '98+', label: 'Design Polish Score', labelId: 'Standar Kualitas Visual' }
    ],
    testimonial: {
      quote: 'Our new website designed by Kapitech immediately elevated our brand perception and doubled our inbound qualified leads in the first 30 days.',
      quoteId: 'Website baru kami buatan Kapitech langsung mengangkat citra merek dan melipatgandakan prospek penjualan berkualitas dalam 30 hari pertama.',
      highlight: 'doubled inbound qualified leads',
      highlightId: 'melipatgandakan prospek berkualitas',
      author: 'Lumina Property Director',
      role: 'Head of Marketing',
      company: 'Lumina Realty',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['lumina-property-portal', 'solaris-cleantech-dashboard', 'vivid-headless-commerce'],
    problemsSolutions: [
      {
        problemTitle: 'Cookie-Cutter Website Templates',
        problemTitleId: 'Template Website Pasaran yang Kaku',
        problemDesc: 'Generic WordPress templates fail to reflect your unique capabilities and slow down page speed.',
        problemDescId: 'Template pasaran gagal mencerminkan keunikan bisnis Anda dan membuat loading website lambat.',
        solutionTitle: 'Bespoke Visual Architecture',
        solutionTitleId: 'Arsitektur Visual Kustom Berkelas',
        solutionDesc: 'Custom layout grids, tailored typography, atmospheric dark/light schemes, and focused CTA flows.',
        solutionDescId: 'Grid tata letak kustom, tipografi terkurasi, skema visual elegan, dan alur CTA yang terarah.'
      }
    ],
    capabilities: [
      { title: 'Interactive Hero Sections', titleId: 'Bagian Utama (Hero) Interaktif', desc: 'Engaging visual entry points with kinetic typography and subtle 3D depth.', descId: 'Tampilan awal memikat dengan tipografi kinetik dan efek kedalaman 3D halus.' },
      { title: 'Conversion Funnel Layouts', titleId: 'Tata Letak Corong Konversi', desc: 'Strategic placement of proof points, testimonials, and contact triggers.', descId: 'Penempatan strategis bukti sosial, testimoni, dan tombol pemicu kontak.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Wireframe & Content Hierarchy',
        stageNameId: 'Wireframe & Hierarki Konten',
        stageDesc: 'Structuring page flows for maximum conversion and storytelling.',
        stageDescId: 'Menyusun alur halaman untuk konversi maksimal dan storytelling yang kuat.',
        deliverables: ['Full Page Wireframes'],
        deliverablesId: ['Wireframe Halaman Lengkap']
      },
      {
        stageNumber: '02',
        stageName: 'High-Fidelity Mockups & Motion',
        stageNameId: 'Mockup Hi-Fi & Konsep Animasi',
        stageDesc: 'Designing responsive screens for all viewports in Figma.',
        stageDescId: 'Mendesain seluruh layar responsif untuk semua resolusi di Figma.',
        deliverables: ['Figma Master UI File', 'Exported Web Assets'],
        deliverablesId: ['File Master UI Figma', 'Aset Web Teroptimasi']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Attract and convert tier-1 enterprise clients with a modern digital flagship',
        'Ensure lightning-fast mobile responsiveness across all smartphone screens'
      ],
      benefitsId: [
        'Pikat dan konversi klien korporat kelas atas dengan website berstandar global',
        'Jamin responsivitas secepat kilat di semua layar smartphone'
      ]
    },
    tools: ['Figma', 'Photoshop', 'Adobe Illustrator'],
    faqs: [
      {
        q: 'Can you also develop the website after designing it?',
        qId: 'Bisakah Anda juga mengoding website ini setelah desain selesai?',
        a: 'Yes, our engineering team builds custom websites with Next.js, TypeScript, and Tailwind CSS with sub-second page load times.',
        aId: 'Ya, tim engineer kami dapat langsung membangunnya dengan Next.js, TypeScript, dan Tailwind CSS dengan kecepatan muat sub-1 detik.'
      }
    ]
  },

  {
    slug: 'website-redesign',
    type: 'service',
    category: 'Design',
    title: 'Website Redesign',
    navSubtitle: 'Modern look, higher impact',
    navSubtitleId: 'Tampilan modern berkelas dengan dampak bisnis lebih besar',
    heroHeadline: 'Modern corporate website redesign & digital transformation',
    heroHeadlineId: 'Redesain website korporat modern & transformasi digital',
    heroSubtitle: 'Upgrade dated corporate websites into high-speed, modern digital flagships that command market leadership and turn passive traffic into qualified sales opportunities.',
    heroSubtitleId: 'Perbarui website lama yang kaku menjadi representasi digital mutakhir berkecepatan tinggi yang memimpin pasar dan mengonversi pengunjung menjadi prospek bisnis.',
    badge: 'Modernization Suite',
    badgeId: 'Modernisasi Total',
    metrics: [
      { value: '+55%', label: 'Average Lead Volume', labelId: 'Peningkatan Volume Prospek' },
      { value: '100%', label: 'SEO Authority Preserved', labelId: 'Peringkat SEO Terjaga Penuh' },
      { value: 'Sub-1s', label: 'Page Load Speed', labelId: 'Kecepatan Muat Halaman' }
    ],
    testimonial: {
      quote: 'Redesigning our website with Kapitech transformed our online presence. Our bounce rate dropped by 45% and enterprise client inquiries doubled within two months.',
      quoteId: 'Mendesain ulang website kami bersama Kapitech mengubah representasi online kami. Bounce rate turun 45% dan pertanyaan dari klien korporat meningkat dua kali lipat.',
      highlight: 'bounce rate dropped by 45%',
      highlightId: 'bounce rate turun 45%',
      author: 'Vivid E-Commerce Director',
      role: 'Managing Director',
      company: 'Vivid Retail',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['vivid-headless-commerce', 'lumina-property-portal', 'solaris-cleantech-dashboard'],
    problemsSolutions: [
      {
        problemTitle: 'Dated Appearance Eroding Trust',
        problemTitleId: 'Tampilan Usang Mengikis Kepercayaan',
        problemDesc: 'An outdated website gives the false impression that your services or technology are equally behind the times.',
        problemDescId: 'Website yang tampak kuno memberi kesan bahwa layanan dan teknologi perusahaan Anda juga tertinggal zaman.',
        solutionTitle: 'Executive Modern Visual Aesthetic',
        solutionTitleId: 'Estetika Visual Eksekutif Modern',
        solutionDesc: 'High-contrast typography, crisp geometric cards, subtle lighting accents, and intuitive navigation hierarchy.',
        solutionDescId: 'Tipografi kontras tinggi, kartu geometris tajam, aksen pencahayaan halus, dan navigasi intuitif.'
      }
    ],
    capabilities: [
      { title: 'SEO-Preserving Architecture', titleId: 'Arsitektur Mempertahankan SEO', desc: 'Maintain all established organic rankings and Google domain authority.', descId: 'Pertahankan seluruh peringkat organik Google dan otoritas domain yang sudah ada.' },
      { title: 'Mobile Usability Overhaul', titleId: 'Perombakan Keterpakaian Mobile', desc: 'Rebuilt from the ground up for seamless smartphone performance.', descId: 'Dibangun ulang dari dasar untuk kenyamanan navigasi maksimal di layar smartphone.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Site Audit & Content Strategy',
        stageNameId: 'Audit Website & Strategi Konten',
        stageDesc: 'Analyzing analytics drop-offs and restructuring key pages.',
        stageDescId: 'Menganalisis data drop-off dan menata ulang halaman utama.',
        deliverables: ['Site Audit Report', 'New Information Architecture'],
        deliverablesId: ['Laporan Audit Website', 'Arsitektur Informasi Baru']
      },
      {
        stageNumber: '02',
        stageName: 'Redesign Mockups & Comparison',
        stageNameId: 'Mockup Redesain & Komparasi',
        stageDesc: 'Designing modernized views with side-by-side comparison with the legacy site.',
        stageDescId: 'Mendesain tampilan baru dengan perbandingan langsung terhadap website lama.',
        deliverables: ['Figma Redesign Mockups', 'Interactive Prototype'],
        deliverablesId: ['Mockup Redesain Figma', 'Prototipe Interaktif']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Transform your website into your company’s highest-performing sales rep',
        'Cut bounce rates and extend session duration across all visitor demographics'
      ],
      benefitsId: [
        'Ubah website Anda menjadi saluran penjualan berkinerja tertinggi',
        'Turunkan bounce rate dan perpanjang durasi kunjungan pengguna di website'
      ]
    },
    tools: ['Figma', 'Google Lighthouse', 'Hotjar'],
    faqs: [
      {
        q: 'Will a website redesign hurt our existing Google search rankings?',
        qId: 'Apakah redesain website akan merusak peringkat pencarian Google kami?',
        a: 'No. We map all legacy URLs with strict 301 redirects, preserve meta titles/descriptions, and improve Core Web Vitals to boost your search rankings.',
        aId: 'Tidak. Kami memetakan seluruh URL lama dengan redirect 301 rapi, mempertahankan meta tag, dan meningkatkan skor Core Web Vitals untuk menaikkan peringkat SEO Anda.'
      }
    ]
  },

  {
    slug: 'product-ux-ui-audit',
    type: 'service',
    category: 'Design',
    title: 'Product UX/UI Audit',
    navSubtitle: 'Insights that drive results',
    navSubtitleId: 'Wawasan mendalam berbasis data untuk hasil nyata',
    heroHeadline: 'Comprehensive UX/UI heuristic audit & conversion bottleneck analysis',
    heroHeadlineId: 'Audit heuristik UX/UI komprehensif & analisis hambatan konversi',
    heroSubtitle: 'Uncover where users drop off, get confused, or abandon transactions. We deliver a detailed 40+ page diagnostic report with actionable wireframe fixes to maximize ROI.',
    heroSubtitleId: 'Temukan penyebab pengguna keluar atau membatalkan transaksi. Kami memberikan laporan diagnostik detail 40+ halaman beserta solusi wireframe konkret untuk mendongkrak ROI.',
    badge: 'Diagnostic Intelligence',
    badgeId: 'Intelijen Diagnostik',
    metrics: [
      { value: '40+ Pg', label: 'Detailed Heuristic Report', labelId: 'Laporan Heuristik Mendalam' },
      { value: '1-2 Wks', label: 'Audit Turnaround Time', labelId: 'Waktu Pengerjaan Cepat' },
      { value: '+35%', label: 'Typical Funnel Improvement', labelId: 'Rata-rata Peningkatan Konversi' }
    ],
    testimonial: {
      quote: 'Kapitech’s UX audit was eye-opening. Their quick-win recommendations fixed three major checkout bottlenecks within 10 days, generating an immediate 28% revenue lift.',
      quoteId: 'Audit UX dari Kapitech membuka mata kami. Rekomendasi perbaikan cepat mereka menyelesaikan 3 hambatan checkout dalam 10 hari dan menaikkan omzet sebesar 28%.',
      highlight: 'immediate 28% revenue lift',
      highlightId: 'kenaikan omzet 28% langsung',
      author: 'Zenora Product Analytics Lead',
      role: 'Director of Analytics',
      company: 'Zenora Health',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['zenora-health-suite', 'orbit-cloud-platform', 'nexus-fintech-app'],
    problemsSolutions: [
      {
        problemTitle: 'Unknown Revenue Leaks',
        problemTitleId: 'Kebocoran Omzet yang Tidak Diketahui Penyebabnya',
        problemDesc: 'Analytics shows high traffic, but conversion rates remain stagnant without a clear explanation.',
        problemDescId: 'Analitik menunjukkan trafik tinggi, namun angka konversi penjualan tetap stagnan tanpa alasan yang jelas.',
        solutionTitle: 'In-Depth Friction Analysis',
        solutionTitleId: 'Analisis Titik Hambatan Mendalam',
        solutionDesc: 'Heuristic evaluation, accessibility review, and visual wireframe recommendations for immediate implementation.',
        solutionDescId: 'Evaluasi heuristik, tinjauan aksesibilitas, dan rekomendasi wireframe visual untuk perbaikan cepat.'
      }
    ],
    capabilities: [
      { title: 'Heuristic Usability Evaluation', titleId: 'Evaluasi Keterpakaian Heuristik', desc: '10 Nielsen-Norman usability principles applied across all key views.', descId: 'Penerapan 10 prinsip keterpakaian Nielsen-Norman di seluruh alur halaman utama.' },
      { title: 'Quick-Win Prioritization Matrix', titleId: 'Matriks Prioritas Perbaikan Cepat', desc: 'Separating low-effort high-impact fixes from longer-term structural shifts.', descId: 'Pemisahan perbaikan cepat berdaya hasil tinggi dari penataan ulang struktural jangka panjang.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Data Gathering & Heuristic Review',
        stageNameId: 'Pengumpulan Data & Tinjauan Heuristik',
        stageDesc: 'Reviewing session recordings, analytics drop-offs, and evaluating UI against industry benchmarks.',
        stageDescId: 'Meninjau rekaman sesi pengguna, data drop-off, dan membandingkan UI terhadap standar industri.',
        deliverables: ['Diagnostic Issue Log'],
        deliverablesId: ['Daftar Masalah Diagnostik']
      },
      {
        stageNumber: '02',
        stageName: 'Report Delivery & Video Walkthrough',
        stageNameId: 'Penyerahan Laporan & Video Presentasi',
        stageDesc: 'Delivering the 40+ page audit report with annotated screens, wireframe fixes, and executive presentation.',
        stageDescId: 'Menyerahkan laporan audit 40+ halaman dengan anotasi layar, rekomendasi wireframe, dan presentasi video.',
        deliverables: ['40+ Page Diagnostic Audit Report', 'Executive Video Walkthrough'],
        deliverablesId: ['Laporan Audit Diagnostik 40+ Halaman', 'Video Presentasi Penjelasan Temuan']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Pinpoint and eliminate hidden conversion bottlenecks across your product',
        'Arm your product and engineering team with clear, prioritized design tasks'
      ],
      benefitsId: [
        'Temukan dan hilangkan titik kebocoran konversi yang tersembunyi',
        'Bekali tim produk dan developer dengan daftar tugas perbaikan terprioritas'
      ]
    },
    tools: ['Figma', 'Miro', 'Hotjar', 'Google Analytics 4'],
    faqs: [
      {
        q: 'What do we need to provide before the audit starts?',
        qId: 'Apa saja yang perlu kami sediakan sebelum audit dimulai?',
        a: 'We only need access to your staging/live environment, target user persona descriptions, and optional analytics view access if available.',
        aId: 'Kami hanya membutuhkan akses ke lingkungan staging/live Anda, deskripsi target persona pengguna, dan akses data analitik (opsional).'
      }
    ]
  },

  // ==========================================
  // DEVELOPMENT SERVICES (5)
  // ==========================================
  {
    slug: 'web-development',
    type: 'service',
    category: 'Development',
    title: 'Web Development',
    navSubtitle: 'Front-End & Back-End Development',
    navSubtitleId: 'Pengembangan Front-End & Back-End berkualitas tinggi',
    heroHeadline: 'Production-grade full-stack web development & cloud engineering',
    heroHeadlineId: 'Pengembangan web full-stack standar produksi & rekayasa cloud',
    heroSubtitle: 'Clean, maintainable, and strictly-typed web architectures engineered with modern TypeScript, Next.js, Node.js, and resilient PostgreSQL databases.',
    heroSubtitleId: 'Arsitektur web terstruktur rapi, teruji, dan bertipe ketat menggunakan TypeScript, Next.js, Node.js, dan database PostgreSQL yang tangguh.',
    badge: 'Full-Stack Engineering',
    badgeId: 'Rekayasa Full-Stack',
    metrics: [
      { value: '100%', label: 'Strict TypeScript Coverage', labelId: 'Cakupan TypeScript Ketat' },
      { value: '95+', label: 'Core Web Vitals Score', labelId: 'Skor Core Web Vitals' },
      { value: '99.9%', label: 'Uptime SLA Reliability', labelId: 'Keandalan Uptime SLA' }
    ],
    testimonial: {
      quote: 'Kapitech engineered our web platform with incredible technical discipline. The code is modular, blazing fast, and easily scaled across multiple server regions.',
      quoteId: 'Kapitech merekayasa platform web kami dengan disiplin teknis luar biasa. Kodenya modular, sangat cepat, dan mudah diskalakan ke berbagai region server.',
      highlight: 'incredible technical discipline',
      highlightId: 'disiplin teknis luar biasa',
      author: 'Kross Cloud Lead Architect',
      role: 'Chief Technology Officer',
      company: 'Kross Systems',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['kross-cloud-security', 'orbit-cloud-platform', 'vivid-headless-commerce'],
    problemsSolutions: [
      {
        problemTitle: 'Bloated, Slow Codebases',
        problemTitleId: 'Kode Lambat & Sulit Dipelihara',
        problemDesc: 'Spaghetti code and outdated frameworks lead to slow page loads, security vulnerabilities, and high hosting costs.',
        problemDescId: 'Kode tidak terstruktur dan framework usang menyebabkan website lambat, rentan keamanan, dan boros biaya server.',
        solutionTitle: 'Modern Next.js / TypeScript Architecture',
        solutionTitleId: 'Arsitektur Modern Next.js / TypeScript',
        solutionDesc: 'Server-side rendering, static generation, automatic code splitting, and strict type safety.',
        solutionDescId: 'Server-side rendering, static generation, pemisahan kode otomatis, dan keamanan tipe data ketat.'
      }
    ],
    capabilities: [
      { title: 'Serverless & Edge API Architecture', titleId: 'Arsitektur API Serverless & Edge', desc: 'Ultra-fast API response times with global caching and resilient error handling.', descId: 'Waktu respons API super cepat dengan caching global dan penanganan error tangguh.' },
      { title: 'Automated CI/CD Pipelines', titleId: 'Pipeline CI/CD Otomatis', desc: 'Zero-downtime automated deployments via GitHub Actions and cloud infrastructure.', descId: 'Deployment otomatis tanpa downtime melalui GitHub Actions dan infrastruktur cloud.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Technical Architecture & Schema',
        stageNameId: 'Arsitektur Teknis & Skema Database',
        stageDesc: 'Designing data models, API endpoints, and selecting optimal cloud infrastructure.',
        stageDescId: 'Merancang model data, endpoint API, dan memilih infrastruktur cloud terbaik.',
        deliverables: ['Technical Spec Doc', 'Database Schema Models'],
        deliverablesId: ['Dokumen Spesifikasi Teknis', 'Model Skema Database']
      },
      {
        stageNumber: '02',
        stageName: 'Sprint Development & QA Testing',
        stageNameId: 'Pengembangan Sprint & Uji QA',
        stageDesc: 'Writing clean, modular code with continuous integration testing.',
        stageDescId: 'Menulis kode bersih dan modular disertai pengujian otomatis.',
        deliverables: ['Live Staging Environment', 'Automated Test Suite'],
        deliverablesId: ['Server Staging Aktif', 'Paket Pengujian Otomatis']
      },
      {
        stageNumber: '03',
        stageName: 'Production Deployment & SLA',
        stageNameId: 'Peluncuran Produksi & Garansi SLA',
        stageDesc: 'DNS setup, SSL certificate hardening, CDN caching, and 100% source code transfer.',
        stageDescId: 'Konfigurasi DNS, penguatan SSL, caching CDN global, dan serah terima source code 100%.',
        deliverables: ['Production Live Deployment', 'Source Code Repository Transfer'],
        deliverablesId: ['Aplikasi Live di Server Produksi', 'Transfer Repositori Source Code Penuh']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Deploy a high-performance web product capable of handling millions of requests',
        'Own 100% of your source code and documentation with zero vendor lock-in'
      ],
      benefitsId: [
        'Miliki platform web berkinerja tinggi yang siap menangani jutaan permintaan',
        'Kuasai 100% source code dan dokumentasi teknis tanpa keterikatan vendor'
      ]
    },
    tools: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
    faqs: [
      {
        q: 'Do you hand over full ownership of the source code?',
        qId: 'Apakah kami mendapatkan kepemilikan penuh source code?',
        a: 'Yes, 100%. We transfer the entire GitHub repository, documentation, deployment scripts, and credentials directly to your organization.',
        aId: 'Ya, 100%. Kami mentransfer seluruh repositori GitHub, dokumentasi, script deployment, dan kredensial langsung ke organisasi Anda.'
      }
    ]
  },

  {
    slug: 'mvp-development',
    type: 'service',
    category: 'Development',
    title: 'MVP Development',
    navSubtitle: 'MVPs that attract funding',
    navSubtitleId: 'MVP tangguh siap pakai untuk menarik pendanaan investor',
    heroHeadline: 'Rapid MVP web application development for funded startups',
    heroHeadlineId: 'Pengembangan aplikasi web MVP cepat untuk startup visioner',
    heroSubtitle: 'Launch your functional, production-ready minimum viable product in 3-6 weeks with clean architecture, user auth, database persistence, and payment gateways.',
    heroSubtitleId: 'Luncurkan produk minimum fungsional siap produksi dalam 3-6 minggu dengan arsitektur bersih, sistem login, database cloud, dan gateway pembayaran.',
    badge: 'Rapid Launch',
    badgeId: 'Peluncuran Kilat',
    metrics: [
      { value: '3-6 Wks', label: 'Kickoff to Live Launch', labelId: 'Kickoff Hingga Rilis Live' },
      { value: '100%', label: 'Production Security Hardening', labelId: 'Keamanan Standar Produksi' },
      { value: '$10M+', label: 'Raised Post-Launch', labelId: 'Modal Diraih Pasca Rilis' }
    ],
    testimonial: {
      quote: 'Kapitech built our entire MVP in just 4 weeks. The clean architecture allowed us to onboard our first 10,000 users without a single server hiccup.',
      quoteId: 'Kapitech membangun seluruh MVP kami hanya dalam 4 minggu. Arsitektur bersihnya membuat kami dapat menampung 10.000 pengguna pertama tanpa gangguan server.',
      highlight: 'entire MVP in 4 weeks',
      highlightId: 'seluruh MVP dalam 4 minggu',
      author: 'Mohamed Shegow',
      role: 'CEO',
      company: 'Sinta Health',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['zenora-health-suite', 'kross-cloud-security', 'orbit-cloud-platform'],
    problemsSolutions: [
      {
        problemTitle: 'Slow, Over-Engineered First Builds',
        problemTitleId: 'Pembangunan Awal yang Lambat & Terlalu Rumit',
        problemDesc: 'Trying to build every feature on day one burns through budget before validating customer demand.',
        problemDescId: 'Mencoba membuat semua fitur sekaligus di hari pertama menghabiskan modal sebelum memvalidasi minat pasar.',
        solutionTitle: 'Laser-Focused Core MVP Scope',
        solutionTitleId: 'Fokus Tajam pada Fitur Inti MVP',
        solutionDesc: 'We engineer the essential 20% of features that validate product-market fit and impress seed investors.',
        solutionDescId: 'Kami merekayasa 20% fitur inti terpenting yang membuktikan kecocokan produk dengan pasar dan memikat investor.'
      }
    ],
    capabilities: [
      { title: 'Secure Authentication & Roles', titleId: 'Otentikasi Aman & Hak Akses', desc: 'OAuth, magic links, email login, and role-based access control (RBAC).', descId: 'OAuth, magic link, login email, dan kontrol hak akses berbasis peran (RBAC).' },
      { title: 'Payment & Subscription Billing', titleId: 'Integrasi Pembayaran & Langganan', desc: 'Stripe, Midtrans, or PayPal integrations with webhook handlers.', descId: 'Integrasi Stripe, Midtrans, atau PayPal dengan webhook otomatis.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Scope Freezing & Architecture',
        stageNameId: 'Pembekuan Ruang Lingkup & Arsitektur',
        stageDesc: 'Locking down the essential milestone features for rapid delivery.',
        stageDescId: 'Mengunci fitur utama untuk serah terima cepat dalam milestone terukur.',
        deliverables: ['MVP Milestone Roadmap'],
        deliverablesId: ['Roadmap Milestone MVP']
      },
      {
        stageNumber: '02',
        stageName: 'Build & Deploy',
        stageNameId: 'Pembangunan & Deployment',
        stageDesc: 'Rapid full-stack coding with live staging demos every week.',
        stageDescId: 'Koding full-stack cepat dengan demo server staging aktif setiap minggu.',
        deliverables: ['Live Production MVP Application'],
        deliverablesId: ['Aplikasi MVP Aktif di Produksi']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Get to market months ahead of competitors with a live functional web software',
        'Validate unit economics and user willingness to pay with real transactions'
      ],
      benefitsId: [
        'Masuk ke pasar berbulan-bulan lebih cepat dari kompetitor dengan software fungsional',
        'Validasi unit ekonomi dan kesediaan pengguna membayar dengan transaksi nyata'
      ]
    },
    tools: ['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Vercel'],
    faqs: [
      {
        q: 'Can the MVP codebase support scaling after we raise funding?',
        qId: 'Bisakah kode MVP ini diskalakan setelah kami meraih pendanaan?',
        a: 'Yes, we use modular enterprise-grade TypeScript architecture designed specifically so future engineering teams can build on top of it effortlessly.',
        aId: 'Ya, kami menggunakan arsitektur TypeScript modular berstandar korporat yang dirancang khusus agar tim developer masa depan dapat menambah fitur dengan mudah.'
      }
    ]
  },

  {
    slug: 'landing-page',
    type: 'service',
    category: 'Development',
    title: 'Landing page',
    navSubtitle: 'High-converting website',
    navSubtitleId: 'Landing page berkonversi tinggi dan berkecepatan instan',
    heroHeadline: 'High-speed, conversion-optimized landing page engineering',
    heroHeadlineId: 'Rekayasa landing page berkecepatan tinggi & konversi optimal',
    heroSubtitle: 'Ultra-fast, mobile-optimized landing pages with fluid micro-animations, lead capture integrations, and sub-second load times engineered to maximize marketing ROI.',
    heroSubtitleId: 'Landing page berkecepatan ultra-tinggi yang dioptimalkan untuk perangkat mobile, dilengkapi animasi mikro halus, routing prospek, dan waktu muat instan.',
    badge: 'Conversion Engine',
    badgeId: 'Mesin Konversi',
    metrics: [
      { value: 'Sub-1s', label: 'Load Time', labelId: 'Waktu Muat Halaman' },
      { value: '99+', label: 'Google Lighthouse Score', labelId: 'Skor Google Lighthouse' },
      { value: '1-2 Wks', label: 'Turnaround Time', labelId: 'Waktu Pengerjaan Cepat' }
    ],
    testimonial: {
      quote: 'The landing page Kapitech built for our campaign doubled our conversion rate compared to our previous agency’s work while loading almost instantaneously on 4G mobile networks.',
      quoteId: 'Landing page buatan Kapitech melipatgandakan tingkat konversi kampanye kami dibanding agensi sebelumnya dan langsung terbuka instan di jaringan 4G ponsel.',
      highlight: 'doubled conversion rate',
      highlightId: 'melipatgandakan konversi',
      author: 'Vivid Retail Marketing Lead',
      role: 'Growth Marketing Manager',
      company: 'Vivid Retail',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['vivid-headless-commerce', 'lumina-property-portal', 'solaris-cleantech-dashboard'],
    problemsSolutions: [
      {
        problemTitle: 'Slow Landing Pages Burning Ad Spend',
        problemTitleId: 'Landing Page Lambat Menghanguskan Anggaran Iklan',
        problemDesc: 'Every extra second of load time cuts conversion rates by 20%, wasting valuable ad budget.',
        problemDescId: 'Setiap detik keterlambatan waktu muat memotong angka konversi hingga 20%, membuang anggaran iklan Anda.',
        solutionTitle: 'Sub-Second Next.js Performance',
        solutionTitleId: 'Kinerja Sub-Detik Berbasis Next.js',
        solutionDesc: 'Edge caching, compressed media assets, and zero layout shift delivering near-instant page renders.',
        solutionDescId: 'Edge caching, kompresi aset gambar modern, dan zero layout shift untuk tampilan instan.'
      }
    ],
    capabilities: [
      { title: 'WhatsApp & CRM Routing', titleId: 'Routing Otomatis WhatsApp & CRM', desc: 'Direct form routing to WhatsApp, HubSpot, Salesforce, or Google Sheets.', descId: 'Routing otomatis formulir ke WhatsApp, HubSpot, Salesforce, atau Google Sheets.' },
      { title: 'Meta & Google Pixel Setup', titleId: 'Setup Tag Meta & Google Pixel', desc: 'Accurate event tracking for conversions, lead forms, and button clicks.', descId: 'Pelacakan konversi presisi untuk iklan Meta, Google Tag Manager, dan GA4.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Copy & Conversion Flow',
        stageNameId: 'Naskah & Alur Konversi',
        stageDesc: 'Structuring persuasive headline copy and CTA funnels.',
        stageDescId: 'Menyusun naskah persuasif dan alur tombol tindakan (CTA).',
        deliverables: ['Conversion Wireframe'],
        deliverablesId: ['Wireframe Konversi']
      },
      {
        stageNumber: '02',
        stageName: 'Code & Launch',
        stageNameId: 'Koding & Peluncuran',
        stageDesc: 'Next.js build with pixel-perfect responsive execution.',
        stageDescId: 'Membangun dengan Next.js dan styling Tailwind responsif sempurna.',
        deliverables: ['Live Production Landing Page'],
        deliverablesId: ['Landing Page Live di Server Produksi']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Maximize ROI from Google Ads, Meta Ads, and influencer campaigns',
        'Capture leads directly to your sales team’s WhatsApp and CRM instantly'
      ],
      benefitsId: [
        'Maksimalkan ROI dari iklan Google Ads, Meta Ads, dan kampanye digital',
        'Terima prospek langsung ke WhatsApp dan CRM tim sales secara instan'
      ]
    },
    tools: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'Vercel'],
    faqs: [
      {
        q: 'Can we integrate forms directly with our WhatsApp?',
        qId: 'Bisakah formulir diintegrasikan langsung dengan WhatsApp kami?',
        a: 'Yes, we configure seamless 1-click WhatsApp routing with pre-filled message templates alongside automatic email notifications.',
        aId: 'Ya, kami menyediakan routing 1-klik ke WhatsApp dengan template pesan otomatis beserta notifikasi email instan.'
      }
    ]
  },

  {
    slug: 'corporate-websites',
    type: 'service',
    category: 'Development',
    title: 'Corporate Websites',
    navSubtitle: 'Built for scale and trust',
    navSubtitleId: 'Dibangun untuk skala besar dan kredibilitas korporat',
    heroHeadline: 'Enterprise-grade corporate website development & headless CMS',
    heroHeadlineId: 'Pengembangan website korporat skala enterprise & CMS headless',
    heroSubtitle: 'Secure, multilingual, and SEO-dominant enterprise web platforms equipped with user-friendly headless CMS for seamless marketing team updates.',
    heroSubtitleId: 'Portal website korporat multi-bahasa yang aman, berperingkat SEO tinggi, dan dilengkapi CMS headless untuk kemudahan tim pemasaran memperbarui konten.',
    badge: 'Enterprise Architecture',
    badgeId: 'Arsitektur Korporat',
    metrics: [
      { value: 'Multilingual', label: 'ID & EN Dynamic Localization', labelId: 'Dukungan Multi-Bahasa Dinamis' },
      { value: '99.99%', label: 'Cloudflare Uptime SLA', labelId: 'Keandalan Uptime Cloudflare' },
      { value: 'Headless', label: 'Content Management System', labelId: 'Sistem Manajemen Konten Mandiri' }
    ],
    testimonial: {
      quote: 'Kapitech built our national corporate portal with flawless security, dynamic language switching, and intuitive CMS controls for our communication team.',
      quoteId: 'Kapitech membangun portal korporat nasional kami dengan keamanan tanpa cela, fitur multi-bahasa dinamis, dan kontrol CMS yang sangat mudah bagi tim humas kami.',
      highlight: 'flawless security & dynamic localization',
      highlightId: 'keamanan tanpa cela & multi-bahasa',
      author: 'Solaris Corporate Affairs',
      role: 'Director of Corporate Communications',
      company: 'Solaris CleanTech',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['solaris-cleantech-dashboard', 'kross-cloud-security', 'lumina-property-portal'],
    problemsSolutions: [
      {
        problemTitle: 'Vulnerable & Clunky Legacy CMS',
        problemTitleId: 'CMS Lama yang Rentan & Lambat',
        problemDesc: 'Traditional WordPress installs get hacked, run slow, and break with every plugin update.',
        problemDescId: 'Instalasi WordPress konvensional rentan peretasan, berjalan lambat, dan sering rusak saat plugin diperbarui.',
        solutionTitle: 'Modern Decoupled Headless CMS',
        solutionTitleId: 'CMS Headless Modern yang Aman & Cepat',
        solutionDesc: 'Zero security vulnerability surface, instant static generation, and intuitive visual editing for non-technical staff.',
        solutionDescId: 'Permukaan keamanan tanpa celah, rendering statis instan, dan editor visual mudah bagi staf non-teknis.'
      }
    ],
    capabilities: [
      { title: 'Multilingual Architecture', titleId: 'Arsitektur Multi-Bahasa Terintegrasi', desc: 'Native locale routing for Indonesian and English with full SEO parity.', descId: 'Routing bahasa asli untuk Bahasa Indonesia dan Inggris dengan kepatuhan SEO penuh.' },
      { title: 'Career & Investor Portals', titleId: 'Portal Karir & Hubungan Investor', desc: 'Integrated job vacancy boards, press releases, and annual financial report downloads.', descId: 'Modul lowongan kerja terintegrasi, siaran pers, dan unduhan laporan tahunan korporat.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: 'Corporate Architecture & Schema',
        stageNameId: 'Arsitektur Korporat & Skema SEO',
        stageDesc: 'Structuring multi-page taxonomy, schema markup, and headless content models.',
        stageDescId: 'Menyusun taksonomi multi-halaman, schema markup SEO, dan model konten CMS.',
        deliverables: ['Content Model Schema', 'URL Taxonomy Map'],
        deliverablesId: ['Skema Model Konten', 'Peta Taksonomi URL']
      },
      {
        stageNumber: '02',
        stageName: 'Full-Stack Build & CMS Integration',
        stageNameId: 'Pembangunan Full-Stack & Integrasi CMS',
        stageDesc: 'Next.js frontend connected to Sanity/Strapi headless backend with SSL security.',
        stageDescId: 'Frontend Next.js terhubung ke CMS Sanity/Strapi dengan sertifikat SSL resmi.',
        deliverables: ['Production Corporate Website', 'CMS Staff Training Guide'],
        deliverablesId: ['Website Korporat Siap Rilis', 'Panduan Penggunaan CMS untuk Tim Internal']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Establish undeniable market leadership and corporate credibility with global clients',
        'Empower non-technical marketing staff to publish blog posts and news in seconds'
      ],
      benefitsId: [
        'Bangun kepemimpinan pasar dan kredibilitas korporat di mata klien global',
        'Beri kemudahan staf humas dan pemasaran menerbitkan berita dan lowongan kerja dalam hitungan detik'
      ]
    },
    tools: ['Next.js', 'TypeScript', 'Sanity CMS', 'Tailwind CSS', 'Cloudflare'],
    faqs: [
      {
        q: 'Can our internal marketing team easily edit content without writing code?',
        qId: 'Bisakah tim marketing kami mengedit konten tanpa menulis kode?',
        a: 'Yes, we configure an intuitive visual dashboard where your team can update text, upload images, manage job postings, and publish news effortlessly.',
        aId: 'Ya, kami menyediakan dashboard visual intuitif di mana tim Anda dapat memperbarui teks, mengunggah foto, mengelola lowongan kerja, dan menerbitkan berita dengan sangat mudah.'
      }
    ]
  },

  {
    slug: 'wow-websites',
    type: 'service',
    category: 'Development',
    title: 'WOW Websites',
    navSubtitle: 'Professional, scalable, fast website',
    navSubtitleId: 'Website profesional, terukur, sangat cepat, dan memukau',
    heroHeadline: 'Experiential 3D websites, WebGL canvas & kinetic web engineering',
    heroHeadlineId: 'Website 3D interaktif, kanvas WebGL & rekayasa web kinetik memukau',
    heroSubtitle: 'Award-winning experiential websites combining 3D interactive canvases, fluid WebGL physics, and kinetic scroll choreography with blistering-fast sub-second performance.',
    heroSubtitleId: 'Website interaktif berstandar internasional yang memadukan kanvas 3D, efek fisika WebGL, dan koreografi scroll kinetik dengan kecepatan muat sub-1 detik.',
    badge: 'Awwwards Caliber',
    badgeId: 'Standar Kelas Dunia',
    metrics: [
      { value: '60 FPS', label: 'Silky Smooth Animation Rate', labelId: 'Tingkat Animasi Halus 60 FPS' },
      { value: 'WebGL / 3D', label: 'Interactive Canvases', labelId: 'Kanvas 3D Interaktif' },
      { value: 'Sub-1s', label: 'Global CDN Delivery', labelId: 'Distribusi CDN Global' }
    ],
    testimonial: {
      quote: 'The 3D interactive experience Kapitech engineered for our product drop generated viral buzz across social media and broke all our previous sales records.',
      quoteId: 'Pengalaman interaktif 3D buatan Kapitech untuk peluncuran produk kami menjadi viral di media sosial dan memecahkan semua rekor penjualan sebelumnya.',
      highlight: 'generated viral buzz',
      highlightId: 'menjadi viral & rekor penjualan',
      author: 'Orbit Dynamics Creative Director',
      role: 'Creative Director',
      company: 'Orbit Studios',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
    },
    caseStudySlugs: ['orbit-cloud-platform', 'lumina-property-portal', 'vivid-headless-commerce'],
    problemsSolutions: [
      {
        problemTitle: 'Forgettable, Flat Websites',
        problemTitleId: 'Website Datar yang Mudah Dilupakan',
        problemDesc: 'Standard flat web layouts fail to generate emotional impact for visionary luxury brands and creative products.',
        problemDescId: 'Tata letak datar standar gagal menciptakan kesan mendalam bagi brand mewah dan produk kreatif visioner.',
        solutionTitle: 'Kinetic 3D & Micro-Interaction Symphony',
        solutionTitleId: 'Simfoni Animasi 3D & Mikro-Interaksi Kinetik',
        solutionDesc: 'Custom Spline 3D scenes, smooth cursor physics, and kinetic scroll choreography that leave users in awe.',
        solutionDescId: 'Adegan 3D Spline kustom, efek fisika kursor halus, dan animasi scroll kinetik yang memukau setiap pengunjung.'
      }
    ],
    capabilities: [
      { title: 'Interactive Spline / Three.js 3D Models', titleId: 'Model 3D Interaktif Spline / Three.js', desc: 'Rotatable, light-reactive 3D objects embedded smoothly inside web pages.', descId: 'Objek 3D interaktif yang merespons cahaya dan kursor langsung di dalam halaman web.' },
      { title: 'Kinetic Scroll Choreography', titleId: 'Koreografi Animasi Scroll Kinetik', desc: 'Precision GSAP and Framer Motion keyframes synchronized to user scrolling.', descId: 'Animasi GSAP dan Framer Motion berpresisi tinggi yang tersinkronisasi dengan guliran layar.' }
    ],
    processStages: [
      {
        stageNumber: '01',
        stageName: '3D Scene Conception & Modeling',
        stageNameId: 'Konseptualisasi Adegan 3D & Modeling',
        stageDesc: 'Modeling optimized lightweight 3D assets and crafting the motion storyboard.',
        stageDescId: 'Membuat model 3D berbobot ringan yang teroptimasi dan menyusun storyboard animasi.',
        deliverables: ['3D Asset Prototypes', 'Motion Storyboard'],
        deliverablesId: ['Prototipe Aset 3D', 'Storyboard Animasi']
      },
      {
        stageNumber: '02',
        stageName: 'WebGL Integration & Performance QA',
        stageNameId: 'Integrasi WebGL & QA Performa 60 FPS',
        stageDesc: 'Coding interactive shaders, optimizing textures, and ensuring 60 FPS on mobile devices.',
        stageDescId: 'Mengoding shader interaktif, mengoptimasi tekstur, dan menjamin 60 FPS di perangkat mobile.',
        deliverables: ['Production Interactive WOW Experience'],
        deliverablesId: ['Pengalaman Web WOW Siap Rilis']
      }
    ],
    businessOutcomes: {
      heading: 'Business outcomes you will achieve:',
      headingId: 'Hasil bisnis nyata yang akan Anda capai:',
      benefits: [
        'Command viral social buzz and industry recognition with an unforgettable digital flagship',
        'Engage visitors with high-tech interaction states without sacrificing load speed'
      ],
      benefitsId: [
        'Raih pengakuan industri dan potensi viral di media sosial dengan website berkelas seni tinggi',
        'Pikat pengunjung dengan interaksi 3D mutakhir tanpa mengorbankan kecepatan muat'
      ]
    },
    tools: ['Three.js', 'Spline 3D', 'Next.js', 'GSAP', 'Tailwind CSS'],
    faqs: [
      {
        q: 'Will a 3D website run smoothly on mobile phones?',
        qId: 'Apakah website 3D akan berjalan lancar di ponsel mobile?',
        a: 'Yes. We rigorously compress 3D geometry and implement intelligent device fallback shaders so mobile users get 60 FPS smooth performance with zero lag.',
        aId: 'Ya. Kami mengompresi geometri 3D secara cermat dan menerapkan fallback shader pintar sehingga pengguna mobile tetap merasakan performa halus 60 FPS tanpa jeda.'
      }
    ]
  }
];

export const getServiceBySlug = (slug: string): ServiceItemData | undefined => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('kapitech_cms_services_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const match = parsed.find((s: ServiceItemData) => s.slug === slug);
          if (match) return match;
        }
      }
    } catch {
      // ignore
    }
  }
  return allSolutionsAndServices.find(s => s.slug === slug);
};
