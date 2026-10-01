import { api } from './apiClient';

export interface ContactSubmission {
  id: string;
  slug?: string;
  fullName: string;
  email: string;
  company?: string;
  phone?: string;
  services?: string[];
  budget?: string;
  message: string;
  status: 'new' | 'in-review' | 'contacted' | 'closed' | 'screening' | 'shortlisted' | 'interview' | 'hired' | 'rejected' | 'withdrawn';
  source?: string;
  type?: 'inquiry' | 'career' | 'vendor' | 'newsletter';
  positionTitle?: string;
  portfolioUrl?: string;
  specialty?: string;
  rateCard?: string;
  experienceYears?: string;
  tools?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  availability?: string;
  location?: string;
  createdAt: string;
  userAgent?: string;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  assignedTo?: string;
  internalNotes?: string;
  tags?: string[];
  starred?: boolean;
}

let submissionsCache: ContactSubmission[] | null = null;
const SUBMISSION_EVENT = 'kapitech_submission_updated';

const slugifySubmissionPart = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const createSubmissionSlug = (submission: Pick<ContactSubmission, 'id' | 'fullName' | 'company' | 'positionTitle' | 'type'>): string => {
  const scope = submission.type === 'career' ? 'job-application' : 'client-inquiry';
  const subject = submission.type === 'career'
    ? submission.positionTitle || submission.fullName
    : submission.company || submission.fullName;
  return [scope, slugifySubmissionPart(subject || 'inbox-record'), slugifySubmissionPart(submission.id)].filter(Boolean).join('-');
};

export const getSubmissionSlug = (submission: ContactSubmission): string =>
  submission.slug?.trim() || createSubmissionSlug(submission);

export const normalizeContactSubmission = (submission: ContactSubmission): ContactSubmission => ({
  ...submission,
  slug: getSubmissionSlug(submission)
});

export const DEFAULT_INBOX_SUBMISSIONS: ContactSubmission[] = [
  {
    id: 'lead_inb_001',
    fullName: 'Bambang Soediro',
    email: 'bambang.soediro@pertamina-digital.id',
    phone: '+62 811-9876-5432',
    company: 'PT Pertamina Digital Hub',
    services: ['Cloud & AI Architecture', 'Enterprise Next.js Platform'],
    budget: 'Rp 250M - Rp 500M',
    message: 'Seeking end-to-end cloud migration and real-time monitoring microservices for our downstream logistics division.',
    status: 'new',
    priority: 'urgent',
    source: 'Website Contact Form',
    type: 'inquiry',
    starred: true,
    createdAt: '2026-09-18T08:30:00.000Z'
  },
  {
    id: 'lead_inb_002',
    fullName: 'Clarissa Wijaya',
    email: 'clarissa@fintech-asia.sg',
    phone: '+65 9123 4567',
    company: 'Fintech Asia Ventures Singapore',
    services: ['Fintech Core Modernization', 'Security & Pentest'],
    budget: 'Rp 150M - Rp 250M',
    message: 'We require a SOC2/ISO compliant payment gateway integration with interactive merchant onboarding portal.',
    status: 'in-review',
    priority: 'high',
    source: 'Executive Referral',
    type: 'inquiry',
    starred: false,
    createdAt: '2026-09-17T11:15:00.000Z'
  },
  {
    id: 'lead_inb_003',
    fullName: 'Rian Hidayat',
    email: 'rian@nusantara-retail.co.id',
    phone: '+62 813-8877-6655',
    company: 'Nusantara Retail Group',
    services: ['Mobile App & PWA', 'Omnichannel POS Integration'],
    budget: 'Rp 75M - Rp 150M',
    message: 'Requesting consultation on modernizing our inventory sync across 45 stores nationwide with offline-first PWA.',
    status: 'new',
    priority: 'normal',
    source: 'Inbound Organic',
    type: 'inquiry',
    starred: false,
    createdAt: '2026-09-16T14:45:00.000Z'
  },
  {
    id: 'job_inb_001',
    fullName: 'Nadia Prameswari',
    email: 'nadia.prameswari@example.com',
    phone: '+62 812-4455-7788',
    company: '',
    message: 'Frontend engineer with agency experience, focused on React, TypeScript, performance, and design system implementation.',
    status: 'new',
    priority: 'high',
    source: 'Website Careers',
    type: 'career',
    positionTitle: 'Frontend Engineer',
    specialty: 'React / TypeScript',
    experienceYears: '4',
    tools: 'React, TypeScript, Vite, Tailwind CSS, GitHub',
    resumeUrl: 'https://example.com/resume/nadia-prameswari.pdf',
    linkedinUrl: 'https://www.linkedin.com/in/nadia-prameswari',
    portfolioUrl: 'https://nadia.dev',
    availability: '1 month notice',
    location: 'Jakarta',
    starred: true,
    createdAt: '2026-09-19T03:15:00.000Z'
  },
  {
    id: 'job_inb_002',
    fullName: 'Fajar Mahendra',
    email: 'fajar.mahendra@example.com',
    phone: '+62 813-2211-3344',
    company: '',
    message: 'Product designer with strong B2B SaaS and agency portfolio. Comfortable leading discovery, flows, and UI systems.',
    status: 'screening',
    priority: 'normal',
    source: 'Website Careers',
    type: 'career',
    positionTitle: 'UI/UX Designer',
    specialty: 'Product Design / Design Systems',
    experienceYears: '5',
    tools: 'Figma, FigJam, Adobe Illustrator, Notion',
    resumeUrl: 'https://example.com/resume/fajar-mahendra.pdf',
    linkedinUrl: 'https://www.linkedin.com/in/fajar-mahendra',
    portfolioUrl: 'https://fajarmahendra.design',
    availability: 'Immediate',
    location: 'Bandung',
    starred: false,
    createdAt: '2026-09-18T08:10:00.000Z'
  },
  {
    id: 'job_inb_003',
    fullName: 'Kevin Santoso',
    email: 'kevin.santoso@example.com',
    phone: '+62 811-6677-8899',
    company: '',
    message: 'Interested in project and account coordination roles. Experienced coordinating designers, developers, and client communication.',
    status: 'shortlisted',
    priority: 'high',
    source: 'Website Careers',
    type: 'career',
    positionTitle: 'Project Manager',
    specialty: 'Agency Operations / Client Delivery',
    experienceYears: '6',
    tools: 'Jira, Notion, Slack, Google Workspace',
    resumeUrl: 'https://example.com/resume/kevin-santoso.pdf',
    linkedinUrl: 'https://www.linkedin.com/in/kevin-santoso',
    availability: '2 weeks',
    location: 'Jakarta',
    starred: true,
    createdAt: '2026-09-17T06:40:00.000Z'
  },
  {
    id: 'job_inb_004',
    fullName: 'Alya Kurnia',
    email: 'alya.kurnia@example.com',
    phone: '+62 812-9900-1122',
    company: '',
    message: 'Motion designer with 2D animation and social content experience. Strong visual storytelling and fast turnaround in agency environments.',
    status: 'interview',
    priority: 'normal',
    source: 'Website Careers',
    type: 'career',
    positionTitle: 'Motion Designer',
    specialty: '2D Animation / Motion Design',
    experienceYears: '3',
    tools: 'After Effects, Premiere Pro, Illustrator, Blender',
    resumeUrl: 'https://example.com/resume/alya-kurnia.pdf',
    linkedinUrl: 'https://www.linkedin.com/in/alya-kurnia',
    portfolioUrl: 'https://alyakurnia.studio',
    availability: 'Immediate',
    location: 'Surabaya',
    starred: false,
    createdAt: '2026-09-16T12:25:00.000Z'
  },
  {
    id: 'job_inb_005',
    fullName: 'Rizky Adhitya',
    email: 'rizky.adhitya@example.com',
    phone: '+62 851-2233-4455',
    company: '',
    message: 'Full-stack developer with strong Node.js and PostgreSQL experience. Previously worked on ERP and internal business applications.',
    status: 'hired',
    priority: 'high',
    source: 'Website Careers',
    type: 'career',
    positionTitle: 'Full-stack Developer',
    specialty: 'Node.js / PostgreSQL',
    experienceYears: '7',
    tools: 'Node.js, Express, PostgreSQL, React, Docker',
    resumeUrl: 'https://example.com/resume/rizky-adhitya.pdf',
    linkedinUrl: 'https://www.linkedin.com/in/rizky-adhitya',
    availability: 'Immediate',
    location: 'Yogyakarta',
    starred: false,
    createdAt: '2026-09-15T09:30:00.000Z'
  }];

// Helper to get local stored submissions
export const getLocalSubmissions = (): ContactSubmission[] => {
  return submissionsCache || (submissionsCache = (import.meta.env.PROD ? [] : DEFAULT_INBOX_SUBMISSIONS).map(normalizeContactSubmission));
};

const saveLocalSubmissions = (items: ContactSubmission[]) => {
  submissionsCache = items.slice(0, 200).map(normalizeContactSubmission);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SUBMISSION_EVENT, { detail: submissionsCache }));
  }
};


/**
 * Universal submission handler for all website forms:
 * Persists to server API /api/leads/submit, which executes server-side validation
 * and dispatches notifications without exposing keys to the browser.
 */
export const submitToInbox = async (data: Omit<ContactSubmission, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; id: string }> => {
  const nowIso = new Date().toISOString();
  const result = await api.leads.submit(data);

  if (!result.success || !result.data?.id) {
    throw new Error(result.error || 'Lead submission failed.');
  }

  const record: ContactSubmission = normalizeContactSubmission({
    id: result.data.id,
    status: 'new',
    createdAt: nowIso,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    ...data
  });

  const existing = getLocalSubmissions();
  saveLocalSubmissions([record, ...existing.filter((item) => item.id !== record.id)].slice(0, 200));

  return { success: true, id: record.id };
}

/**
 * Update any submission fields
 */
export const updateSubmission = async (id: string, updates: Partial<ContactSubmission>): Promise<void> => {
  const result = await api.leads.update(id, updates);
  if (!result.success) {
    throw new Error(result.error || 'Lead update failed.');
  }

  const current = getLocalSubmissions();
  const updated = current.map(item => item.id === id ? { ...item, ...updates } : item);
  saveLocalSubmissions(updated);
}

/**
 * Update submission status
 */
export const updateSubmissionStatus = async (id: string, newStatus: ContactSubmission['status']): Promise<void> => {
  return updateSubmission(id, { status: newStatus });
};

/**
 * Delete submission
 */
export const deleteSubmission = async (id: string): Promise<void> => {
  const result = await api.leads.delete(id);
  if (!result.success) {
    throw new Error(result.error || 'Lead deletion failed.');
  }

  const filtered = getLocalSubmissions().filter(item => item.id !== id);
  saveLocalSubmissions(filtered);
}

/**
 * Server-backed subscriber with a small browser cache
 */
export const subscribeToInbox = (onUpdate: (submissions: ContactSubmission[]) => void): (() => void) => {
  const initialLocal = getLocalSubmissions();
  let localCache = [...initialLocal];

  onUpdate(localCache);

  const syncFromServer = async () => {
    try {
      const res = await api.leads.getAll();
      if (!res.success || !Array.isArray(res.data?.leads)) return;

      const serverLeads = (res.data.leads as ContactSubmission[]).map(normalizeContactSubmission);
      const mergedMap = new Map<string, ContactSubmission>();

      localCache.map(normalizeContactSubmission).forEach((lead) => mergedMap.set(lead.id, lead));
      serverLeads.forEach((lead) => mergedMap.set(lead.id, lead));

      const combined = Array.from(mergedMap.values()).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      localCache = combined;
      saveLocalSubmissions(combined);
      onUpdate(combined);
    } catch {
      // Keep the last known local/server snapshot when the network is unavailable.
    }
  };

  void syncFromServer();

  const handleLocalCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<ContactSubmission[]>;
    localCache = customEvent.detail && Array.isArray(customEvent.detail)
      ? customEvent.detail
      : getLocalSubmissions();
    onUpdate(localCache);
  };

  window.addEventListener(SUBMISSION_EVENT, handleLocalCustomEvent);

  const refreshInterval = window.setInterval(() => {
    void syncFromServer();
  }, 30000);

  return () => {
    window.clearInterval(refreshInterval);
    window.removeEventListener(SUBMISSION_EVENT, handleLocalCustomEvent);
  };
};
