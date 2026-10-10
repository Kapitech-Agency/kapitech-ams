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
    summary: 'Drive high-value enterprise and mid-market client partnerships. You will identify business opportunities for our Visual Experience and Innovation Development services, conduct discovery pitches, and earn competitive uncapped commissions.',
    summaryId: 'Pimpin ekspansi kemitraan klien korporat dan pasar menengah. Anda akan mengidentifikasi peluang bisnis untuk layanan Visual Experience dan Innovation Development kami, mempresentasikan solusi, dan memperoleh komisi berbasis performa tanpa batas.',
    responsibilities: [
      'Identify and prospect prospective corporate clients, startups, and brand leaders requiring digital transformation or visual design',
      'Initiate outbound sales outreach via LinkedIn, email sequences, and high-impact discovery calls',
      'Present Kapitech Agency capabilities, pitch decks, and tailored solution proposals to key decision-makers (C-Level, VP, Directors)',
      'Negotiate scope agreements and collaborate closely with our CEO and Project Managers for seamless client onboarding',
      'Maintain accurate deal telemetry, CRM pipeline tracking, and revenue forecasting'
    ],
    responsibilitiesId: [
      'Mengidentifikasi dan memprospek calon klien perusahaan, startup, dan brand yang membutuhkan transformasi digital atau desain visual',
      'Melakukan outbound sales outreach melalui LinkedIn, email bisnis, dan discovery call terarah',
      'Mempresentasikan portofolio Kapitech Agency, proposal kustom, dan lingkup kerja kepada pengambil keputusan utama (C-Level, VP, Direktur)',
      'Membantu negosiasi kontrak kerja sama dan berkoordinasi langsung dengan CEO serta Project Manager kami',
      'Memelihara catatan pipeline prospek di CRM dan pelacakan target pendapatan secara terstruktur'
    ],
    requirements: [
      'Proven track record in B2B sales, agency business development, or software solutions partnership',
      'Strong network in technology, corporate, creative, or e-commerce sectors',
      'Outstanding verbal and written communication skills with persuasive pitching ability',
      'Self-motivated, goal-oriented mindset thriving in a performance-driven commission structure',
      'Fluency in Bahasa Indonesia and professional English proficiency'
    ],
    requirementsId: [
      'Pengalaman terbukti dalam B2B sales, kemitraan agensi digital, atau penjualan solusi perangkat lunak',
      'Memiliki jaringan luas di sektor teknologi, korporasi, retail kreatif, atau e-commerce',
      'Kemampuan komunikasi lisan dan tulisan yang persuasif serta percaya diri saat presentasi',
      'Mandiri, berorientasi pada target, dan termotivasi oleh skema komisi berbasis kinerja',
      'Fasih berbahasa Indonesia dan memiliki kemampuan bahasa Inggris bisnis yang baik'
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
    summary: 'Join our in-studio creative squad to author world-class digital interfaces, responsive design systems in Figma, and interactive user experiences for global and domestic client projects.',
    summaryId: 'Bergabunglah bersama tim kreatif di studio kami untuk merancang antarmuka digital kelas dunia, sistem desain responsif di Figma, dan pengalaman pengguna interaktif untuk klien global dan nasional.',
    responsibilities: [
      'Design pixel-perfect responsive web products and SaaS interfaces across desktop, tablet, and mobile breakpoints',
      'Architect and maintain scalable design systems, design tokens, and comprehensive component libraries in Figma',
      'Conduct user journey mapping, wireframing, interactive prototyping, and usability validation sprints',
      'Collaborate side-by-side with our Executive Creative Director and frontend engineers for flawless implementation',
      'Prepare presentation decks and articulate UX/UI rationale directly during client review sessions'
    ],
    responsibilitiesId: [
      'Merancang antarmuka web responsif dan sistem software SaaS berpresisi tinggi di seluruh breakpoint',
      'Membangun serta memelihara sistem desain modular, token desain, dan pustaka komponen di Figma',
      'Melakukan pemetaan alur pengguna, wireframing, pembuatan prototipe interaktif, dan uji usabilitas',
      'Berkolaborasi langsung di studio bersama Executive Creative Director dan frontend engineer untuk memastikan hasil koding sesuai desain',
      'Mempersiapkan deck presentasi dan menjelaskan pertimbangan desain secara objektif dalam sesi review klien'
    ],
    requirements: [
      '2+ years of professional experience in UI/UX design for web products or digital agencies',
      'Stunning design portfolio showcasing modern visual hierarchy, clean typography, and responsive UX systems',
      'Mastery of Figma, FigJam, auto-layout, component variants, and interactive prototyping',
      'Ability to work full-time on-site at our South Tangerang studio with strong collaborative energy',
      'High attention to visual craft, micro-interactions, and design-to-code feasibility'
    ],
    requirementsId: [
      '2+ tahun pengalaman profesional di bidang desain UI/UX untuk produk web atau agensi digital',
      'Portofolio desain yang kuat menunjukkan penguasaan tipografi, tata letak visual modern, dan sistem UX responsif',
      'Keahlian mendalam dalam Figma, FigJam, auto-layout, varian komponen, dan prototipe interaktif',
      'Bersedia bekerja full-time on-site (WFO) di studio Tangerang Selatan dengan semangat kolaborasi tinggi',
      'Ketelitian tinggi terhadap detail visual mikro, konsistensi brand, dan kelayakan teknis implementasi kode'
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
