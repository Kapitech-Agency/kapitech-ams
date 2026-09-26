import { api } from './apiClient';

export interface ContactSubmission {
  id: string;
  fullName: string;
  email: string;
  company?: string;
  phone?: string;
  services?: string[];
  budget?: string;
  message: string;
  status: 'new' | 'in-review' | 'contacted' | 'closed';
  source?: string;
  type?: 'inquiry' | 'career' | 'vendor' | 'newsletter';
  positionTitle?: string;
  portfolioUrl?: string;
  specialty?: string;
  rateCard?: string;
  experienceYears?: string;
  tools?: string;
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
  }
];

// Helper to get local stored submissions
export const getLocalSubmissions = (): ContactSubmission[] => {
  return submissionsCache || (submissionsCache = (import.meta.env.PROD ? [] : DEFAULT_INBOX_SUBMISSIONS));
};

const saveLocalSubmissions = (items: ContactSubmission[]) => {
  submissionsCache = items.slice(0, 200);
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

  const record: ContactSubmission = {
    id: result.data.id,
    status: 'new',
    createdAt: nowIso,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    ...data
  };

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

      const serverLeads = res.data.leads;
      const mergedMap = new Map<string, ContactSubmission>();

      localCache.forEach((lead) => mergedMap.set(lead.id, lead));
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
