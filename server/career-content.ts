export interface CareerPosition {
  id: string;
  slug: string;
  title: string;
  titleId: string;
  department: string;
  departmentId: string;
  location: string;
  locationId: string;
  type: string;
  typeId: string;
  workplace: string;
  workplaceId: string;
  badge: string;
  badgeId: string;
  summary: string;
  summaryId: string;
  responsibilities: string[];
  responsibilitiesId: string[];
  requirements: string[];
  requirementsId: string[];
  compensation: string;
  compensationId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const defaultTimestamp = '';

export const DEFAULT_CAREER_POSITIONS: CareerPosition[] = [
  {
    id: 'bdr-partnership',
    slug: 'bdr-partnership',
    title: 'Business Development Representative (BDR)',
    titleId: 'Business Development Representative (BDR)',
    department: 'Business & Partnerships',
    departmentId: 'Bisnis & Kemitraan',
    location: 'South Tangerang & Remote',
    locationId: 'Tangerang Selatan & Remote',
    type: 'Commission Based • Contract Freelancer Partnership',
    typeId: 'Commission Based • Contract Freelancer Partnership',
    workplace: 'Hybrid',
    workplaceId: 'Hybrid',
    badge: 'High Commission + Bonus',
    badgeId: 'Komisi Tinggi + Bonus',
    summary: 'Drive high-value enterprise and mid-market client partnerships. Identify business opportunities for Visual Experience and Innovation Development services, conduct discovery pitches, and earn competitive uncapped commissions.',
    summaryId: 'Pimpin ekspansi kemitraan klien korporat dan pasar menengah. Identifikasi peluang bisnis untuk layanan Visual Experience dan Innovation Development, presentasikan solusi, dan peroleh komisi berbasis performa tanpa batas.',
    responsibilities: [
      'Identify and prospect corporate clients, startups, and brand leaders requiring digital transformation or visual design.',
      'Initiate outbound outreach via LinkedIn, email sequences, and discovery calls.',
      'Present Kapitech capabilities, pitch decks, and tailored proposals to key decision-makers.',
      'Negotiate scope agreements and coordinate with the CEO and Project Managers for client onboarding.',
      'Maintain CRM pipeline tracking and revenue forecasting.'
    ],
    responsibilitiesId: [
      'Mengidentifikasi calon klien perusahaan, startup, dan brand yang membutuhkan transformasi digital atau desain visual.',
      'Melakukan outreach melalui LinkedIn, email bisnis, dan discovery call.',
      'Mempresentasikan kapabilitas Kapitech, pitch deck, dan proposal kepada pengambil keputusan.',
      'Membantu negosiasi ruang lingkup kerja dan berkoordinasi dengan CEO serta Project Manager.',
      'Memelihara pipeline CRM dan pencatatan proyeksi pendapatan.'
    ],
    requirements: [
      'Experience in B2B sales, agency business development, or software solutions partnerships.',
      'A strong network in technology, corporate, creative, or e-commerce sectors.',
      'Strong written and verbal communication with persuasive pitching skills.',
      'Self-motivated and comfortable with a performance-driven commission structure.',
      'Fluent Bahasa Indonesia and professional English.'
    ],
    requirementsId: [
      'Pengalaman di B2B sales, business development agensi, atau kemitraan solusi software.',
      'Memiliki jaringan di sektor teknologi, korporasi, kreatif, atau e-commerce.',
      'Komunikasi lisan dan tulisan yang baik serta kemampuan presentasi persuasif.',
      'Mandiri dan nyaman bekerja dengan skema komisi berbasis performa.',
      'Fasih Bahasa Indonesia dan memiliki kemampuan Bahasa Inggris profesional.'
    ],
    compensation: 'Uncapped Deal Commissions + Milestone Performance Bonuses',
    compensationId: 'Komisi Proyek Tanpa Batas + Bonus Pencapaian Milestone',
    isPublished: true,
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp
  },
  {
    id: 'ui-ux-product-designer',
    slug: 'ui-ux-product-designer',
    title: 'UI/UX & Product Designer',
    titleId: 'UI/UX & Product Designer',
    department: 'Design & Visual Experience',
    departmentId: 'Desain & Visual Experience',
    location: 'Kapitech Studio, South Tangerang',
    locationId: 'Studio Kapitech, Tangerang Selatan',
    type: 'Full Time',
    typeId: 'Full Time',
    workplace: 'WFO (Work From Office)',
    workplaceId: 'WFO (Work From Office)',
    badge: 'Full Time • On-site Studio',
    badgeId: 'Full Time • Studio On-site',
    summary: 'Join our in-studio creative team to design polished digital interfaces, responsive Figma design systems, and interactive user experiences for client projects.',
    summaryId: 'Bergabung dengan tim kreatif di studio kami untuk merancang antarmuka digital, sistem desain responsif di Figma, dan pengalaman pengguna interaktif untuk proyek klien.',
    responsibilities: [
      'Design responsive web products and SaaS interfaces across desktop, tablet, and mobile.',
      'Build and maintain scalable design systems, tokens, and component libraries in Figma.',
      'Conduct user journey mapping, wireframing, prototyping, and usability validation.',
      'Collaborate with creative directors and frontend engineers to ensure accurate implementation.',
      'Prepare presentation decks and explain design rationale during client reviews.'
    ],
    responsibilitiesId: [
      'Merancang produk web responsif dan antarmuka SaaS untuk desktop, tablet, dan mobile.',
      'Membangun dan memelihara design system, token, serta pustaka komponen di Figma.',
      'Melakukan pemetaan perjalanan pengguna, wireframe, prototipe, dan validasi usabilitas.',
      'Berkolaborasi dengan creative director dan frontend engineer untuk memastikan implementasi akurat.',
      'Mempersiapkan deck presentasi dan menjelaskan pertimbangan desain saat review klien.'
    ],
    requirements: [
      'At least 2 years of UI/UX design experience for web products or digital agencies.',
      'A strong portfolio demonstrating visual hierarchy, typography, and responsive UX.',
      'Confident with Figma, FigJam, auto-layout, component variants, and prototyping.',
      'Able to work full-time on-site at the South Tangerang studio.',
      'Strong attention to detail, micro-interactions, and design-to-code feasibility.'
    ],
    requirementsId: [
      'Minimal 2 tahun pengalaman UI/UX untuk produk web atau agensi digital.',
      'Portofolio yang menunjukkan hierarki visual, tipografi, dan UX responsif.',
      'Menguasai Figma, FigJam, auto-layout, varian komponen, dan prototipe.',
      'Bersedia bekerja full-time on-site di studio Tangerang Selatan.',
      'Teliti terhadap detail visual, micro-interaction, dan kelayakan implementasi desain.'
    ],
    compensation: 'Competitive Monthly Salary + Health Coverage + Project Performance Bonuses',
    compensationId: 'Gaji Pokok Kompetitif + Asuransi Kesehatan + Bonus Kinerja Proyek',
    isPublished: true,
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp
  }
];

const cleanText = (value: unknown, maxLength: number): string =>
  String(value ?? '').trim().slice(0, maxLength);

const cleanList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.slice(0, 12).map(item => cleanText(item, 500)).filter(Boolean)
    : [];

export function slugifyCareerPosition(value: unknown): string {
  return cleanText(value, 180)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function normalizeCareerPosition(input: unknown, fallback: Partial<CareerPosition> = {}): CareerPosition {
  const source = input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const get = (key: keyof CareerPosition, maxLength = 4000) =>
    cleanText(source[key] !== undefined ? source[key] : fallback[key], maxLength);
  const title = get('title', 200);
  const id = get('id', 120) || slugifyCareerPosition(title) || `job_${Date.now()}`;
  const slug = slugifyCareerPosition(source.slug !== undefined ? source.slug : fallback.slug) || slugifyCareerPosition(title) || id;

  return {
    id,
    slug,
    title,
    titleId: get('titleId', 200),
    department: get('department', 160),
    departmentId: get('departmentId', 160),
    location: get('location', 200),
    locationId: get('locationId', 200),
    type: get('type', 160),
    typeId: get('typeId', 160),
    workplace: get('workplace', 120),
    workplaceId: get('workplaceId', 120),
    badge: get('badge', 120),
    badgeId: get('badgeId', 120),
    summary: get('summary', 1200),
    summaryId: get('summaryId', 1200),
    responsibilities: cleanList(source.responsibilities !== undefined ? source.responsibilities : fallback.responsibilities),
    responsibilitiesId: cleanList(source.responsibilitiesId !== undefined ? source.responsibilitiesId : fallback.responsibilitiesId),
    requirements: cleanList(source.requirements !== undefined ? source.requirements : fallback.requirements),
    requirementsId: cleanList(source.requirementsId !== undefined ? source.requirementsId : fallback.requirementsId),
    compensation: get('compensation', 240),
    compensationId: get('compensationId', 240),
    isPublished: source.isPublished !== undefined ? Boolean(source.isPublished) : fallback.isPublished !== false,
    createdAt: get('createdAt', 40),
    updatedAt: get('updatedAt', 40)
  };
}
