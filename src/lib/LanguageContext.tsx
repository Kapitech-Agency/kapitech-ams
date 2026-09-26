import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './apiClient';

export type Language = 'en' | 'id';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    'nav.work': 'Work',
    'nav.services': 'Services',
    'nav.about': 'About',
    'nav.careers': 'Careers',
    'nav.contact': 'Contact',
    'nav.startProject': 'Start a Project',

    // Hero
    'hero.badge': 'Digital Product & Engineering Agency',
    'hero.title': 'Digital product studio crafted to build & scale your business.',
    'hero.subtitle': 'Kapitech Agency designs and engineers high-performance web applications, intuitive mobile interfaces, and scalable brand identities for growing enterprises.',
    'hero.viewWork': 'Explore Portfolio',
    'hero.discuss': 'Schedule Consultation',

    // Clients
    'clients.tag': 'Selected Clients & Partners',
    'clients.title': 'Trusted by 50+ innovative companies and growing brands worldwide.',
    'clients.desc': 'We collaborate with ambitious startups, established enterprises, and global founders to deliver measurable digital impact.',

    // Services section
    'services.tag': 'What We Do',
    'services.title': 'Our core service capabilities.',
    'services.viewAll': 'Explore All Services',

    // Work section
    'work.tag': 'Selected Work',
    'work.title': 'Case studies and delivered projects.',
    'work.viewAll': 'View Full Portfolio',
    'work.details': 'Details',
    'work.caseStudy': 'View Case Study',

    // Process
    'process.tag': 'How We Work',
    'process.title': 'A structured and transparent project lifecycle.',
    'process.desc': 'Every engagement follows our clear 4-step workflow to ensure predictable timelines, clear communication, and high-quality deliverables.',

    // CTA
    'cta.tag': "Let's Collaborate",
    'cta.title': "Have a project in mind? Let's build something exceptional.",
    'cta.desc': 'Reach out to our team at Kapitech Agency to discuss your requirements, get a quote, or schedule an initial consultation.',
    'cta.button': 'Contact Kapitech',

    // Footer
    'footer.cta.tag': 'Start a New Project with Kapitech Agency',
    'footer.cta.title': 'Ready to elevate your digital presence?',
    'footer.cta.desc': 'We help ambitious brands and growing companies design, engineer, and deploy high-performing websites, mobile applications, and visual identity systems.',
    'footer.cta.button': 'Schedule a Consultation',
    'footer.about': 'Kapitech Agency (PT Kapitech Digital Indonesia) is an independent digital product agency specializing in strategic UI/UX design, modern full-stack web engineering, and scalable brand systems.',
    'footer.servicesTitle': 'Services & Capabilities',
    'footer.navTitle': 'Company & Case Studies',
    'footer.contactsTitle': 'Headquarters & Inquiries',
    'footer.clientInquiry': 'Client Inquiries',
    'footer.recruitment': 'Careers & Recruitment',
    'footer.partnerships': 'Partnerships & Press',
    'footer.phone': 'Direct Phone & WhatsApp',
    'footer.addressTitle': 'Headquarters Address',
    'footer.address': 'Linea Residence, Block G No. 5, Melati Loka Street, Paku Jaya, North Serpong, South Tangerang City, Banten 15220, Indonesia',
    'footer.rights': 'All rights reserved.',
    'footer.backToTop': 'Back to Top',

    // About
    'about.tag': 'About Kapitech Agency',
    'about.title': 'A digital agency engineered for clarity and growth.',
    'about.subtitle': 'We design and build high-performance web applications, intuitive mobile interfaces, and authentic brand systems for businesses ready to scale.',
    'about.leadership.tag': 'Executive Leadership',
    'about.leadership.title': 'The Leadership Driving Digital Innovation',
    'about.leadership.subtitle': 'Our executive team combines deep expertise across technology architecture, creative direction, agile delivery, and business growth.',
    'about.tools.tag': 'Tools & Frameworks',
    'about.tools.title': 'The modern tech stack we rely on.',
    'about.tools.subtitle': 'We leverage production-tested, industry-leading technologies to guarantee blistering speed, seamless scalability, and rock-solid stability.',
    'about.stats.projects': 'Delivered Projects',
    'about.stats.experience': 'Years Experience',
    'about.stats.craft': 'Bespoke System Architecture',

    // FAQ
    'faq.tag': 'Clear Answers',
    'faq.title': 'Frequently Asked Questions',
    'faq.subtitle': 'Common questions about working with Kapitech Agency.',
    'faq.viewMore': 'View More Questions (4 more)',
    'faq.showLess': 'Show Less Questions',

    // Careers
    'careers.tag': 'Join Our Team',
    'careers.title': 'Build the future of digital products with Kapitech.',
    'careers.subtitle': 'We are looking for passionate designers, engineers, and problem solvers who value craft, speed, and genuine client impact.',
    'careers.openRoles': 'Open Roles',
    'careers.directEmail': 'Direct recruiting inquiries:',

    // Admin Suite Navigation & Shell
    'admin.nav.dashboard': 'Dashboard Overview',
    'admin.nav.inbox': 'Leads & Inbox',
    'admin.nav.crm': 'CRM & Sales',
    'admin.nav.invoicing': 'Finance & Invoicing',
    'admin.nav.projects': 'Projects & Tasks',
    'admin.nav.vendors': 'Vendor Directory',
    'admin.nav.clients': 'Client Directory',
    'admin.nav.cmsProjects': 'CMS Case Studies',
    'admin.nav.cmsServices': 'CMS Services',
    'admin.nav.cmsTestimonials': 'CMS Testimonials',
    'admin.nav.settings': 'System Settings',
    'admin.nav.viewSite': 'View Public Website',
    'admin.nav.mainMenu': 'Main Management',
    'admin.nav.operations': 'Operations & Execution',
    'admin.nav.cms': 'Content Management',
    'admin.nav.system': 'System & Meta',
    'admin.nav.logout': 'Logout',
    'admin.nav.logoutConfirm': 'Log out from current admin session?',
    'admin.badge.principal': 'Principal Admin',

    // Admin General Actions
    'admin.action.save': 'Save Changes',
    'admin.action.cancel': 'Cancel',
    'admin.action.delete': 'Delete',
    'admin.action.edit': 'Edit',
    'admin.action.search': 'Search...',
    'admin.action.filter': 'Filter',
    'admin.action.exportCsv': 'Export CSV',
    'admin.action.add': 'Add',
    'admin.action.create': 'Create',
    'admin.action.details': 'Details',
    'admin.action.view': 'View',
    'admin.action.close': 'Close',

    // Admin Dashboard
    'admin.dash.title': 'Executive Agency Dashboard',
    'admin.dash.subtitle': 'Real-time financial telemetry, pipeline conversion metrics, and client engagement operations.',
    'admin.dash.pipelineValue': 'Total Active Pipeline',
    'admin.dash.wonRevenue': 'Closed Won Revenue',
    'admin.dash.activeInquiries': 'Total Inbound Inquiries',
    'admin.dash.liveProjects': 'Active Client Projects',
    'admin.dash.monthlyTarget': 'Annual Growth Target',
    'admin.dash.quickActions': 'Quick Execution Actions',
    'admin.dash.dealStream': 'High-Value Deal Pipeline',
    'admin.dash.auditTrail': 'Security & Action Audit Logs',
    'admin.dash.simulateLead': 'Simulate Inbound Lead',

    // Admin CRM
    'admin.crm.title': 'Agency CRM & Sales Pipeline',
    'admin.crm.subtitle': 'Track enterprise leads, deal valuations in IDR, stage conversions, and client notes.',
    'admin.crm.addDeal': 'Add New Deal',
    'admin.crm.kanbanView': 'Kanban Board',
    'admin.crm.listView': 'List View',
    'admin.crm.stage.new': 'New Lead',
    'admin.crm.stage.contacted': 'Discovery & Scoping',
    'admin.crm.stage.proposal': 'Proposal Sent',
    'admin.crm.stage.negotiation': 'Negotiation & SOW',
    'admin.crm.stage.won': 'Closed Won',
    'admin.crm.stage.lost': 'Closed Lost',

    // Admin Financials
    'admin.fin.title': 'Financials & Client Invoicing',
    'admin.fin.subtitle': 'Manage billing milestones, PPN tax calculations, expenses, and cash flow tracking.',
    'admin.fin.createInvoice': 'Create New Invoice',
    'admin.fin.recordExpense': 'Record Expense',
    'admin.fin.revenuePaid': 'Total Collected Revenue',
    'admin.fin.outstanding': 'Outstanding Invoices',
    'admin.fin.overdue': 'Overdue Invoices',
    'admin.fin.expenses': 'Total Studio Expenses',
    'admin.fin.netProfit': 'Net Operating Profit',
    'admin.fin.invoicesList': 'Client Invoices',
    'admin.fin.expensesList': 'Expense Records',

    // Admin Projects
    'admin.proj.title': 'Project & Task Execution Suite',
    'admin.proj.subtitle': 'Monitor sprint milestones, technical deliverables, and team task Kanban boards.',
    'admin.proj.createProject': 'Create Project',
    'admin.proj.addTask': 'Add Team Task',
    'admin.proj.allProjects': 'Active Client Projects',
    'admin.proj.taskBoard': 'Task Kanban Board',
    'admin.proj.milestones': 'Sprint Milestones',

    // Admin Clients
    'admin.client.title': 'Agency Client Directory',
    'admin.client.subtitle': 'Central database of active and past enterprise clients, spend history, and contacts.',
    'admin.client.addClient': 'Add New Client',
    'admin.client.totalClients': 'Total Clients',
    'admin.client.activeAccounts': 'Active Accounts',
    'admin.client.lifetimeSpend': 'Total Client Spend',
    'admin.client.searchPlaceholder': 'Search clients, company, email, industry...',
    'admin.client.colName': 'Client Name',
    'admin.client.colCompany': 'Company',
    'admin.client.colContact': 'Contact',
    'admin.client.colLocation': 'Location',
    'admin.client.colStatus': 'Status',
    'admin.client.colActions': 'Actions',

    // Admin Vendors
    'admin.vendor.title': 'Vendor & Talent Directory',
    'admin.vendor.subtitle': 'Database of vetted agency partners, specialized freelance contractors, hourly rates, and SLA contract ratings.',
    'admin.vendor.addVendor': 'Add Vendor',
    'admin.vendor.searchPlaceholder': 'Search vendors, company, skills...',
    'admin.vendor.colName': 'Vendor Name',
    'admin.vendor.colCompany': 'Company',
    'admin.vendor.colCategory': 'Category',
    'admin.vendor.colSkills': 'Skills',
    'admin.vendor.colRate': 'Hourly Rate',
    'admin.vendor.colRating': 'Rating',
    'admin.vendor.colStatus': 'Status',
    'admin.vendor.colActions': 'Actions',

    // Admin Invoicing & Fin Columns
    'admin.fin.colInvoiceNumber': 'Invoice #',
    'admin.fin.colClient': 'Client & Company',
    'admin.fin.colDates': 'Issue / Due Date',
    'admin.fin.colAmount': 'Amount',
    'admin.fin.colStatus': 'Status',
    'admin.fin.colActions': 'Actions',

    // Nav Section Headers & Titles
    'admin.nav.coreOperations': 'CORE OPERATIONS',
    'admin.nav.financeRevenue': 'FINANCE',
    'admin.nav.contentPortfolio': 'CONTENT',
    'admin.nav.administration': 'SYSTEM',
    'admin.nav.servicesCatalog': 'Services & Pricing',
    'admin.nav.caseStudies': 'Portfolio & Case Studies',
    'admin.nav.auditTrail': 'Audit Trail & Security',

    // Admin Inbox
    'admin.inbox.title': 'Protected Inbound Inbox',
    'admin.inbox.subtitle': 'Direct client submissions, inquiries, and job applications received through public forms.',
    'admin.inbox.convertToLead': 'Convert to CRM Lead',
    'admin.inbox.allSubmissions': 'All Submissions',
    'admin.inbox.unreadOnly': 'Unread Only',

    // Admin CMS
    'admin.cms.projectsTitle': 'CMS: Portfolio & Case Studies',
    'admin.cms.projectsSubtitle': 'Manage case studies, high-resolution media galleries, and technical highlights.',
    'admin.cms.servicesTitle': 'CMS: Studio Service Offerings',
    'admin.cms.servicesSubtitle': 'Configure agency core capabilities and bespoke service landing details.',
    'admin.cms.testiTitle': 'Testimonials',
    'admin.cms.testiSubtitle': 'Manage executive quotes, ratings, and client verification badges.',
    'admin.cms.uploadImage': 'Upload Image (PNG/JPG/WebP)',
    'admin.cms.dragDropImage': 'Drag and drop image here or click to browse',

    // New AMS Upgrades
    'admin.crm.currency': 'Currency',
    'admin.crm.convertToProject': 'Convert to Active Project',
    'admin.crm.quickReply': 'Quick Email Reply',
    'admin.crm.assignPic': 'Assign PIC',
    'admin.crm.reminder': 'Set Reminder',
    'admin.proj.links': 'External Workspaces (Figma / GitHub / Staging)',
    'admin.proj.priority': 'Task Priority',
    'admin.proj.priority.urgent': 'Urgent',
    'admin.proj.priority.high': 'High',
    'admin.proj.priority.medium': 'Medium',
    'admin.proj.priority.low': 'Low',
    'admin.proj.sprintProgress': 'Sprint Progress',
    'admin.fin.downloadPdf': 'Download / Print PDF',
    'admin.fin.sendReminder': 'Send Payment Reminder',
    'admin.fin.taxPPN': 'PPN (11% VAT)',
    'admin.fin.netMargin': 'Net Profit Margin',
    'admin.settings.auditTrail': 'Security Audit Trail',
    'admin.settings.auditDesc': 'Real-time record of all administrative logins, IP addresses, credential changes, and system modifications.',

    // Additional Dashboard Keys
    'admin.dash.greeting': 'Hello',
    'admin.dash.greetingSub': 'Here are the latest insights from your customer interactions.',
    'admin.dash.lastWeek': 'Last week',
    'admin.dash.thisMonth': 'This month',
    'admin.dash.last30Days': 'Last 30 days',
    'admin.dash.thisYear': 'This year',
    'admin.dash.addRequest': 'Add Request',
    'admin.dash.cardActiveProjects': 'Active Client Projects',
    'admin.dash.cardDailyResolution': 'Daily Task Resolution',
    'admin.dash.cardSatisfaction': 'Client Satisfaction Score',
    'admin.dash.vsLastWeek': 'vs last week',
    'admin.dash.weeklyVolume': 'Weekly Service Request Volume',
    'admin.dash.latestUpdates': 'Latest Updates',
    'admin.dash.today': 'Today',
    'admin.dash.yesterday': 'Yesterday',
    'admin.dash.thisWeek': 'This week',
    'admin.dash.searchActivities': 'Search activities...',
    'admin.dash.newActivitiesCount': 'new activities today',
    'admin.dash.serviceReqMonitoring': 'Service Request Monitoring',
    'admin.dash.ticketSearch': 'Ticket',
    'admin.dash.filterAll': 'All',
    'admin.dash.filterInProgress': 'In Progress',
    'admin.dash.filterReview': 'Review',
    'admin.dash.filterCompleted': 'Completed',
    'admin.dash.thReqId': 'Request ID',
    'admin.dash.thServiceType': 'Service Type',
    'admin.dash.thPriority': 'Priority',
    'admin.dash.thAssignedTo': 'Assigned To',
    'admin.dash.thStatus': 'Status',
    'admin.dash.thCreatedDate': 'Created Date',
    'admin.dash.thDueDate': 'Due Date',
    'admin.dash.thActions': 'Actions',
    'admin.dash.openProjects': 'Open Project Execution Board',
    'admin.dash.createReqTitle': 'Create New Service Request',
    'admin.dash.createReqSub': 'Add a client service delivery request into the agency queue.',
    'admin.dash.reqTitleLabel': 'Request Title',
    'admin.dash.clientContactLabel': 'Client Contact',
    'admin.dash.companyNameLabel': 'Company Name',
    'admin.dash.estHoursLabel': 'Est. Hours',
    'admin.dash.descDeliverablesLabel': 'Description / SLA Deliverables',
    'admin.dash.quickTriage': 'Quick SLA Triage',
    'admin.dash.exportReport': 'Export Report (CSV)',
    'admin.dash.newCrmLead': 'New CRM Lead',
    'admin.dash.newInvoice': 'New Client Invoice',
    'admin.dash.newSprint': 'New Project Sprint',
    'admin.dash.status.pending': 'Pending',
    'admin.dash.status.in_progress': 'In Progress',
    'admin.dash.status.review': 'Review & QA',
    'admin.dash.status.completed': 'Completed',
    'admin.dash.priority.urgent': 'Urgent',
    'admin.dash.priority.high': 'High',
    'admin.dash.priority.medium': 'Medium',
    'admin.dash.priority.low': 'Low',
    'admin.dash.slaWarning': 'Urgent SLA (<2d)',
    'admin.dash.systemSla': 'System SLA',
    'admin.dash.viewAuditLogs': 'View security logs',
    'admin.dash.executeProjects': 'Execute in Projects',
    'admin.dash.deleteConfirm': 'Delete service request?',
    'admin.dash.showingRequests': 'Showing',
    'admin.dash.ofTotal': 'of total requests',
    'admin.dash.bulkActions': 'Bulk Actions',
    'admin.dash.deleteSelected': 'Delete Selected',
    'admin.dash.markCompleted': 'Mark as Completed',
    'admin.dash.markInProgress': 'Mark as In Progress',
    'admin.dash.teamWorkload': 'Agency Team Workload',
    'admin.dash.highValueDeals': 'High-Value Deal Stream',
    'admin.dash.dealConversion': 'Deal Conversion Rate',
    'admin.dash.pipelineGross': 'Gross Pipeline Value'
  },
  id: {
    // Nav
    'nav.work': 'Portofolio',
    'nav.services': 'Layanan',
    'nav.about': 'Tentang Kami',
    'nav.careers': 'Karir',
    'nav.contact': 'Kontak',
    'nav.startProject': 'Mulai Proyek',

    // Hero
    'hero.badge': 'Agensi Produk Digital & Rekayasa Perangkat Lunak',
    'hero.title': 'Studio produk digital yang dirancang untuk membangun & mengembangkan bisnis Anda.',
    'hero.subtitle': 'Kapitech Agency merancang dan membangun aplikasi web berkinerja tinggi, antarmuka mobile intuitif, dan identitas brand terukur untuk perusahaan yang sedang berkembang.',
    'hero.viewWork': 'Lihat Portofolio',
    'hero.discuss': 'Jadwalkan Konsultasi',

    // Clients
    'clients.tag': 'Klien & Mitra Pilihan',
    'clients.title': 'Dipercaya oleh 50+ perusahaan inovatif dan brand terkemuka di seluruh dunia.',
    'clients.desc': 'Kami berkolaborasi dengan startup ambisius, perusahaan mapan, dan pendiri global untuk menghadirkan dampak digital yang terukur.',

    // Services section
    'services.tag': 'Layanan Kami',
    'services.title': 'Kemampuan & spesialisasi layanan kami.',
    'services.viewAll': 'Lihat Semua Layanan',

    // Work section
    'work.tag': 'Karya Pilihan',
    'work.title': 'Studi kasus dan proyek yang telah kami selesaikan.',
    'work.viewAll': 'Lihat Seluruh Portofolio',
    'work.details': 'Detail',
    'work.caseStudy': 'Lihat Studi Kasus',

    // Process
    'process.tag': 'Metodologi Kerja',
    'process.title': 'Siklus proyek yang terstruktur dan transparan.',
    'process.desc': 'Setiap kerja sama mengikuti alur kerja 4 tahap yang jelas untuk memastikan ketepatan waktu, komunikasi terbuka, dan hasil berkualitas tinggi.',

    // CTA
    'cta.tag': 'Mari Berkolaborasi',
    'cta.title': 'Punya rencana proyek? Mari wujudkan sesuatu yang luar biasa bersama.',
    'cta.desc': 'Hubungi tim Kapitech Agency untuk mendiskusikan kebutuhan, estimasi biaya, atau menjadwalkan konsultasi awal.',
    'cta.button': 'Hubungi Kapitech',

    // Footer
    'footer.cta.tag': 'Mulai Proyek Baru Bersama Kapitech Agency',
    'footer.cta.title': 'Siap meningkatkan kehadiran digital bisnis Anda?',
    'footer.cta.desc': 'Kami membantu brand dan bisnis merancang, membangun, dan meluncurkan website berkecepatan tinggi, aplikasi mobile, dan sistem identitas visual.',
    'footer.cta.button': 'Jadwalkan Konsultasi',
    'footer.about': 'Kapitech Agency (PT Kapitech Digital Indonesia) adalah agensi produk digital independen yang berfokus pada desain UI/UX strategis, rekayasa web modern, dan sistem brand yang terukur.',
    'footer.servicesTitle': 'Layanan & Kemampuan',
    'footer.navTitle': 'Perusahaan & Studi Kasus',
    'footer.contactsTitle': 'Kantor Pusat & Kontak',
    'footer.clientInquiry': 'Pertanyaan Klien',
    'footer.recruitment': 'Karir & Rekrutmen',
    'footer.partnerships': 'Kemitraan & Media',
    'footer.phone': 'Telepon & WhatsApp',
    'footer.addressTitle': 'Alamat Kantor Pusat',
    'footer.address': 'Linea Residence, Blok G No. 5, Jl. Melati Loka, Paku Jaya, Serpong Utara, Kota Tangerang Selatan, Banten 15220, Indonesia',
    'footer.rights': 'Hak cipta dilindungi undang-undang.',
    'footer.backToTop': 'Kembali ke Atas',

    // About
    'about.tag': 'Tentang Kapitech Agency',
    'about.title': 'Agensi digital yang dirancang untuk kejelasan dan pertumbuhan.',
    'about.subtitle': 'Kami merancang dan membangun aplikasi web berkinerja tinggi, antarmuka mobile intuitif, dan sistem identitas brand untuk bisnis yang siap bertumbuh.',
    'about.leadership.tag': 'Kepemimpinan Eksekutif',
    'about.leadership.title': 'Kepemimpinan yang Mendorong Inovasi Digital',
    'about.leadership.subtitle': 'Tim kepemimpinan kami memadukan keahlian mendalam di bidang arsitektur teknologi, arahan kreatif, manajemen agile, dan pertumbuhan bisnis.',
    'about.tools.tag': 'Alat & Kerangka Kerja',
    'about.tools.title': 'Teknologi modern yang kami andalkan.',
    'about.tools.subtitle': 'Kami memanfaatkan teknologi teruji industri untuk menjamin kecepatan maksimal, skalabilitas mulus, dan stabilitas jangka panjang.',
    'about.stats.projects': 'Proyek Selesai',
    'about.stats.experience': 'Tahun Pengalaman',
    'about.stats.craft': 'Arsitektur Sistem Khusus',

    // FAQ
    'faq.tag': 'Jawaban Jelas',
    'faq.title': 'Pertanyaan yang Sering Diajukan',
    'faq.subtitle': 'Pertanyaan umum seputar berkolaborasi dengan Kapitech Agency.',
    'faq.viewMore': 'Lihat Pertanyaan Lainnya (4 lagi)',
    'faq.showLess': 'Tampilkan Lebih Sedikit',

    // Careers
    'careers.tag': 'Bergabung Bersama Kami',
    'careers.title': 'Bangun masa depan produk digital bersama Kapitech.',
    'careers.subtitle': 'Kami mencari desainer, engineer, dan problem solver berdedikasi yang mengutamakan kualitas, kecepatan, dan dampak nyata bagi klien.',
    'careers.openRoles': 'Posisi Tersedia',
    'careers.directEmail': 'Kontak rekrutmen langsung:',

    // Admin Suite Navigation & Shell
    'admin.nav.dashboard': 'Ringkasan Dashboard',
    'admin.nav.inbox': 'Leads & Pesan Masuk',
    'admin.nav.crm': 'CRM Klien & Pipeline Penjualan',
    'admin.nav.invoicing': 'Manajemen Keuangan & Invoice',
    'admin.nav.projects': 'Proyek & Tugas',
    'admin.nav.vendors': 'Direktori Vendor',
    'admin.nav.clients': 'Direktori Klien',
    'admin.nav.cmsProjects': 'CMS Studi Kasus',
    'admin.nav.cmsServices': 'CMS Layanan',
    'admin.nav.cmsTestimonials': 'CMS Testimoni',
    'admin.nav.settings': 'Pengaturan Sistem',
    'admin.nav.viewSite': 'Lihat Website Publik',
    'admin.nav.mainMenu': 'Manajemen Utama',
    'admin.nav.operations': 'Operasional & Eksekusi',
    'admin.nav.cms': 'Manajemen Konten (CMS)',
    'admin.nav.system': 'Sistem & Pengaturan',
    'admin.nav.logout': 'Keluar Sesi',
    'admin.nav.logoutConfirm': 'Keluar dari sesi Admin Portal?',
    'admin.badge.principal': 'Admin Utama',

    // Admin General Actions
    'admin.action.save': 'Simpan Perubahan',
    'admin.action.cancel': 'Batal',
    'admin.action.delete': 'Hapus',
    'admin.action.edit': 'Edit',
    'admin.action.search': 'Cari...',
    'admin.action.filter': 'Filter',
    'admin.action.exportCsv': 'Ekspor CSV',
    'admin.action.add': 'Tambah',
    'admin.action.create': 'Buat',
    'admin.action.details': 'Detail',
    'admin.action.view': 'Lihat',
    'admin.action.close': 'Tutup',

    // Admin Dashboard
    'admin.dash.title': 'Dashboard Eksekutif Agensi',
    'admin.dash.subtitle': 'Telemetri keuangan realtime, metrik konversi pipeline, dan operasional interaksi klien.',
    'admin.dash.pipelineValue': 'Total Nilai Pipeline Aktif',
    'admin.dash.wonRevenue': 'Pendapatan Deal Berhasil (Won)',
    'admin.dash.activeInquiries': 'Total Pesan & Prospek Masuk',
    'admin.dash.liveProjects': 'Proyek Klien Aktif',
    'admin.dash.monthlyTarget': 'Target Pertumbuhan Tahunan',
    'admin.dash.quickActions': 'Aksi Cepat Eksekutif',
    'admin.dash.dealStream': 'Pipeline Deal Bernilai Tinggi',
    'admin.dash.auditTrail': 'Log Aktivitas & Audit Keamanan',
    'admin.dash.simulateLead': 'Simulasi Lead Masuk',

    // Admin CRM
    'admin.crm.title': 'CRM Agensi & Pipeline Penjualan',
    'admin.crm.subtitle': 'Pantau prospek enterprise, valuasi deal dalam IDR, konversi tahap, dan catatan klien.',
    'admin.crm.addDeal': 'Tambah Deal Baru',
    'admin.crm.kanbanView': 'Tampilan Kanban',
    'admin.crm.listView': 'Tampilan Tabel',
    'admin.crm.stage.new': 'Prospek Baru',
    'admin.crm.stage.contacted': 'Kontak Awal & Brief',
    'admin.crm.stage.proposal': 'Proposal Dikirim',
    'admin.crm.stage.negotiation': 'Negosiasi Kontrak',
    'admin.crm.stage.won': 'Deal Berhasil (Won)',
    'admin.crm.stage.lost': 'Tidak Lanjut (Lost)',

    // Admin Financials
    'admin.fin.title': 'Keuangan & Penagihan Invoice',
    'admin.fin.subtitle': 'Kelola milestone pembayaran klien, perhitungan PPN 11%, pengeluaran, dan arus kas.',
    'admin.fin.createInvoice': 'Buat Invoice Baru',
    'admin.fin.recordExpense': 'Catat Pengeluaran',
    'admin.fin.revenuePaid': 'Total Pendapatan Diterima',
    'admin.fin.outstanding': 'Tagihan Belum Dibayar',
    'admin.fin.overdue': 'Tagihan Jatuh Tempo',
    'admin.fin.expenses': 'Total Biaya Operasional',
    'admin.fin.netProfit': 'Laba Operasional Bersih',
    'admin.fin.invoicesList': 'Daftar Invoice Klien',
    'admin.fin.expensesList': 'Catatan Biaya & Beban',

    // Admin Projects
    'admin.proj.title': 'Manajemen Proyek & Eksekusi Tugas',
    'admin.proj.subtitle': 'Pantau milestone sprint, deliverable teknis, dan papan Kanban tugas tim internal.',
    'admin.proj.createProject': 'Buat Proyek Baru',
    'admin.proj.addTask': 'Tambah Tugas Tim',
    'admin.proj.allProjects': 'Daftar Proyek Klien Aktif',
    'admin.proj.taskBoard': 'Papan Kanban Tugas',
    'admin.proj.milestones': 'Milestone Sprint',

    // Admin Clients (ID)
    'admin.client.title': 'Direktori Klien Agensi',
    'admin.client.subtitle': 'Database terpusat klien aktif & sebelumnya, riwayat pengeluaran, dan kontak PIC.',
    'admin.client.addClient': 'Tambah Klien Baru',
    'admin.client.totalClients': 'Total Klien',
    'admin.client.activeAccounts': 'Akun Aktif',
    'admin.client.lifetimeSpend': 'Total Pengeluaran Klien',
    'admin.client.searchPlaceholder': 'Cari nama klien, perusahaan, email, industri...',
    'admin.client.colName': 'Nama Klien',
    'admin.client.colCompany': 'Perusahaan',
    'admin.client.colContact': 'Kontak',
    'admin.client.colLocation': 'Lokasi',
    'admin.client.colStatus': 'Status',
    'admin.client.colActions': 'Aksi',

    // Admin Vendors (ID)
    'admin.vendor.title': 'Direktori Vendor & Kontraktor',
    'admin.vendor.subtitle': 'Database mitra agensi, freelance spesialis terverifikasi, tarif per jam, dan evaluasi performa SLA.',
    'admin.vendor.addVendor': 'Tambah Vendor',
    'admin.vendor.searchPlaceholder': 'Cari nama vendor, perusahaan, keahlian...',
    'admin.vendor.colName': 'Nama Vendor',
    'admin.vendor.colCompany': 'Perusahaan',
    'admin.vendor.colCategory': 'Kategori',
    'admin.vendor.colSkills': 'Keahlian',
    'admin.vendor.colRate': 'Tarif / Jam',
    'admin.vendor.colRating': 'Rating',
    'admin.vendor.colStatus': 'Status',
    'admin.vendor.colActions': 'Aksi',

    // Admin Invoicing & Fin Columns (ID)
    'admin.fin.colInvoiceNumber': 'No. Invoice',
    'admin.fin.colClient': 'Klien & Perusahaan',
    'admin.fin.colDates': 'Tanggal / Jatuh Tempo',
    'admin.fin.colAmount': 'Nominal',
    'admin.fin.colStatus': 'Status',
    'admin.fin.colActions': 'Aksi',

    // Nav Section Headers & Titles (ID)
    'admin.nav.coreOperations': 'OPERASIONAL UTAMA',
    'admin.nav.financeRevenue': 'KEUANGAN & PENDAPATAN',
    'admin.nav.contentPortfolio': 'KONTEN & PORTOFOLIO',
    'admin.nav.administration': 'ADMINISTRASI & SISTEM',
    'admin.nav.servicesCatalog': 'Katalog Layanan & Harga',
    'admin.nav.caseStudies': 'Studi Kasus & Portofolio',
    'admin.nav.auditTrail': 'Audit Jejak & Keamanan',

    // Admin Inbox
    'admin.inbox.title': 'Pesan Masuk Terproteksi',
    'admin.inbox.subtitle': 'Formulir kontak klien, pertanyaan proyek, dan lamaran karir dari website publik.',
    'admin.inbox.convertToLead': 'Konversi ke Lead CRM',
    'admin.inbox.allSubmissions': 'Semua Pesan Masuk',
    'admin.inbox.unreadOnly': 'Belum Dibaca Saja',

    // Admin CMS
    'admin.cms.projectsTitle': 'CMS: Portofolio & Studi Kasus',
    'admin.cms.projectsSubtitle': 'Kelola studi kasus, galeri media visual beresolusi tinggi, dan sorotan teknis.',
    'admin.cms.servicesTitle': 'CMS: Layanan Spesialisasi Studio',
    'admin.cms.servicesSubtitle': 'Konfigurasi penawaran kapabilitas studio dan detail landing page layanan.',
    'admin.cms.testiTitle': 'CMS: Testimoni & Kutipan Klien',
    'admin.cms.testiSubtitle': 'Kelola kutipan eksekutif, rating bintang, dan lencana verifikasi klien.',
    'admin.cms.uploadImage': 'Unggah Gambar (PNG/JPG/WebP)',
    'admin.cms.dragDropImage': 'Tarik & lepas file gambar ke sini atau klik untuk memilih',

    // New AMS Upgrades (ID)
    'admin.crm.currency': 'Mata Uang',
    'admin.crm.convertToProject': 'Konversi ke Proyek Aktif',
    'admin.crm.quickReply': 'Balas Email Cepat',
    'admin.crm.assignPic': 'Tugaskan PIC',
    'admin.crm.reminder': 'Atur Pengingat',
    'admin.proj.links': 'Workspace Eksternal (Figma / GitHub / Staging)',
    'admin.proj.priority': 'Prioritas Tugas',
    'admin.proj.priority.urgent': 'Mendesak',
    'admin.proj.priority.high': 'Tinggi',
    'admin.proj.priority.medium': 'Sedang',
    'admin.proj.priority.low': 'Rendah',
    'admin.proj.sprintProgress': 'Progres Sprint',
    'admin.fin.downloadPdf': 'Unduh / Cetak PDF',
    'admin.fin.sendReminder': 'Kirim Pengingat Pembayaran',
    'admin.fin.taxPPN': 'PPN (11%)',
    'admin.fin.netMargin': 'Margin Laba Bersih',
    'admin.settings.auditTrail': 'Audit Jejak Keamanan',
    'admin.settings.auditDesc': 'Catatan realtime dari seluruh login admin, alamat IP, perubahan kredensial, dan modifikasi sistem.',

    // Additional Dashboard Keys (ID)
    'admin.dash.greeting': 'Halo',
    'admin.dash.greetingSub': 'Berikut wawasan telemetri dan interaksi klien terbaru untuk studio Anda.',
    'admin.dash.lastWeek': 'Minggu lalu',
    'admin.dash.thisMonth': 'Bulan ini',
    'admin.dash.last30Days': '30 hari terakhir',
    'admin.dash.thisYear': 'Tahun ini',
    'admin.dash.addRequest': 'Tambah Request',
    'admin.dash.cardActiveProjects': 'Proyek Klien Aktif',
    'admin.dash.cardDailyResolution': 'Penyelesaian Tugas Harian',
    'admin.dash.cardSatisfaction': 'Skor Kepuasan Klien',
    'admin.dash.vsLastWeek': 'vs minggu lalu',
    'admin.dash.weeklyVolume': 'Volume Permintaan Layanan Mingguan',
    'admin.dash.latestUpdates': 'Aktivitas Terbaru',
    'admin.dash.today': 'Hari ini',
    'admin.dash.yesterday': 'Kemarin',
    'admin.dash.thisWeek': 'Minggu ini',
    'admin.dash.searchActivities': 'Cari aktivitas...',
    'admin.dash.newActivitiesCount': 'aktivitas baru hari ini',
    'admin.dash.serviceReqMonitoring': 'Monitoring Permintaan Layanan',
    'admin.dash.ticketSearch': 'Tiket',
    'admin.dash.filterAll': 'Semua',
    'admin.dash.filterInProgress': 'Sedang Dikerjakan',
    'admin.dash.filterReview': 'Review & QA',
    'admin.dash.filterCompleted': 'Selesai',
    'admin.dash.thReqId': 'ID Permintaan',
    'admin.dash.thServiceType': 'Jenis Layanan',
    'admin.dash.thPriority': 'Prioritas',
    'admin.dash.thAssignedTo': 'Ditugaskan Ke',
    'admin.dash.thStatus': 'Status',
    'admin.dash.thCreatedDate': 'Tanggal Dibuat',
    'admin.dash.thDueDate': 'Batas Waktu',
    'admin.dash.thActions': 'Aksi',
    'admin.dash.openProjects': 'Buka Papan Eksekusi Proyek',
    'admin.dash.createReqTitle': 'Buat Permintaan Layanan Baru',
    'admin.dash.createReqSub': 'Tambahkan deliverable layanan klien ke dalam antrean eksekusi agensi.',
    'admin.dash.reqTitleLabel': 'Judul Permintaan',
    'admin.dash.clientContactLabel': 'Kontak Klien',
    'admin.dash.companyNameLabel': 'Nama Perusahaan',
    'admin.dash.estHoursLabel': 'Estimasi Jam',
    'admin.dash.descDeliverablesLabel': 'Deskripsi & Deliverable SLA',
    'admin.dash.quickTriage': 'Triase Cepat SLA',
    'admin.dash.exportReport': 'Ekspor Laporan (CSV)',
    'admin.dash.newCrmLead': 'Lead CRM Baru',
    'admin.dash.newInvoice': 'Invoice Klien Baru',
    'admin.dash.newSprint': 'Sprint Proyek Baru',
    'admin.dash.status.pending': 'Tertunda',
    'admin.dash.status.in_progress': 'Sedang Dikerjakan',
    'admin.dash.status.review': 'Review & QA',
    'admin.dash.status.completed': 'Selesai',
    'admin.dash.priority.urgent': 'Mendesak',
    'admin.dash.priority.high': 'Tinggi',
    'admin.dash.priority.medium': 'Sedang',
    'admin.dash.priority.low': 'Rendah',
    'admin.dash.slaWarning': 'SLA Mendesak (<2h)',
    'admin.dash.systemSla': 'SLA Sistem',
    'admin.dash.viewAuditLogs': 'Lihat log keamanan',
    'admin.dash.executeProjects': 'Eksekusi di Proyek',
    'admin.dash.deleteConfirm': 'Hapus permintaan layanan?',
    'admin.dash.showingRequests': 'Menampilkan',
    'admin.dash.ofTotal': 'dari total permintaan',
    'admin.dash.bulkActions': 'Aksi Massal',
    'admin.dash.deleteSelected': 'Hapus yang Dipilih',
    'admin.dash.markCompleted': 'Tandai Selesai',
    'admin.dash.markInProgress': 'Tandai Sedang Dikerjakan',
    'admin.dash.teamWorkload': 'Beban Kerja Tim Agensi',
    'admin.dash.highValueDeals': 'Arus Deal Bernilai Tinggi',
    'admin.dash.dealConversion': 'Tingkat Konversi Deal',
    'admin.dash.pipelineGross': 'Nilai Bruto Pipeline'
  }
};

const formatKeyFallback = (key: string): string => {
  if (!key) return '';
  // If dot notation like 'admin.client.colActions' or 'admin.dash.pipelineValue'
  const parts = key.split('.');
  let lastPart = parts[parts.length - 1];
  
  // Remove common prefixes like 'col', 'th', 'lbl', 'btn' if attached
  if (/^col[A-Z]/.test(lastPart)) {
    lastPart = lastPart.replace(/^col/, '');
  } else if (/^th[A-Z]/.test(lastPart)) {
    lastPart = lastPart.replace(/^th/, '');
  }
  
  // Convert camelCase, snake_case, or kebab-case to Title Case words
  const words = lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_\-]/g, ' ')
    .trim()
    .split(/\s+/);

  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('kapitech_lang') as Language;
    return saved === 'id' || saved === 'en' ? saved : 'en';
  });

  useEffect(() => {
    if (localStorage.getItem('kapitech_lang')) return;
    let mounted = true;
    void api.cms.getPublicSettings().then((res) => {
      if (!mounted || !res.success || !res.data?.settings) return;
      const configuredLanguage = res.data.settings.defaultLanguage;
      if (configuredLanguage === 'id' || configuredLanguage === 'en') {
        setLanguageState(configuredLanguage);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('kapitech_lang', lang);
  };

  const t = (key: string): string => {
    if (!key) return '';
    const match = translations[language]?.[key] || translations['en']?.[key];
    if (match) return match;
    return formatKeyFallback(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
