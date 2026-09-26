/**
 * Kapitech Agency CRM Data Store
 * Handles Lead & Pipeline Management, Deal Valuations in IDR, Activity Timelines,
 * Notes, and Direct Submissions <-> CRM conversion synchronization.
 */

import { ContactSubmission, getLocalSubmissions } from './submissions';
import { api } from './apiClient';

export type CrmStage = 'new' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type CrmPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CrmServicePillar = 
  | 'Web Development' 
  | 'UI/UX Design' 
  | 'Mobile App' 
  | 'Branding & Identity' 
  | 'AI & Cloud Solutions' 
  | 'Digital Product MVP';

export type CrmSource = 
  | 'Website Form' 
  | 'WhatsApp Direct' 
  | 'Referral' 
  | 'LinkedIn / Outreach' 
  | 'Event / Partner' 
  | 'CSV Import';

export interface CrmNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  type?: 'note' | 'call' | 'meeting' | 'proposal_sent' | 'whatsapp' | 'stage_change';
}

export interface CrmDocumentItem {
  id: string;
  title: string;
  status: 'draft' | 'sent' | 'signed' | 'approved';
  updatedAt: string;
}

export interface CrmLead {
  id: string;
  clientName: string;
  company: string;
  email: string;
  phone: string;
  servicePillar: CrmServicePillar;
  dealValue: number; // in IDR
  stage: CrmStage;
  priority: CrmPriority;
  source: CrmSource;
  description: string;
  inquiryId?: string; // reference to contact submission
  expectedCloseDate?: string;
  assignedTo: string;
  notes: CrmNote[];
  documents?: CrmDocumentItem[];
  createdAt: string;
  updatedAt: string;
}

let crmCache: CrmLead[] | null = null;
export const CRM_EVENT_NAME = 'kapitech_crm_updated';

let crmServerHydrationStarted = false;

function normalizeServerDeal(deal: any): CrmLead {
  return {
    id: String(deal.id),
    clientName: String(deal.clientName || deal.name || 'Prospective Client'),
    company: String(deal.company || deal.clientCompany || ''),
    email: String(deal.email || ''),
    phone: String(deal.phone || ''),
    servicePillar: (deal.servicePillar || deal.service || 'Web Development') as CrmServicePillar,
    dealValue: Number(deal.value ?? deal.dealValue) || 0,
    stage: (
      deal.stage === 'lead' ? 'new' :
      deal.stage === 'discovery' ? 'contacted' :
      (deal.stage || 'new')
    ) as CrmStage,
    priority: (deal.priority || 'medium') as CrmPriority,
    source: (deal.source || 'Website Form') as CrmSource,
    description: String(deal.description || deal.notes || ''),
    inquiryId: deal.inquiryId,
    expectedCloseDate: deal.expectedCloseDate,
    assignedTo: String(deal.assignedTo || deal.owner || 'Unassigned'),
    notes: Array.isArray(deal.notes) ? deal.notes : [],
    documents: Array.isArray(deal.documents) ? deal.documents : [],
    createdAt: String(deal.createdAt || new Date().toISOString()),
    updatedAt: String(deal.updatedAt || deal.createdAt || new Date().toISOString())
  };
}

let crmServerHydrationRetryCount = 0;
let crmServerHydrationRetryTimer: number | null = null;

function scheduleCrmHydrationRetry(): void {
  if (typeof window === 'undefined' || crmServerHydrationRetryTimer !== null || crmServerHydrationRetryCount >= 6) return;
  const delay = Math.min(30000, 3000 * 2 ** crmServerHydrationRetryCount);
  crmServerHydrationRetryCount += 1;
  crmServerHydrationRetryTimer = window.setTimeout(() => {
    crmServerHydrationRetryTimer = null;
    hydrateCrmFromServer();
  }, delay);
}

function hydrateCrmFromServer(): void {
  if (!import.meta.env.PROD || crmServerHydrationStarted) return;
  crmServerHydrationStarted = true;
  api.crm.getDeals().then((res) => {
    if (!res.success || !Array.isArray(res.data?.deals)) {
      crmServerHydrationStarted = false;
      scheduleCrmHydrationRetry();
      return;
    }
    crmServerHydrationRetryCount = 0;
    const serverLeads = res.data.deals.map(normalizeServerDeal);
    crmCache = serverLeads;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CRM_EVENT_NAME, { detail: serverLeads }));
    }
  }).catch(() => {
    crmServerHydrationStarted = false;
    scheduleCrmHydrationRetry();
  });
}


export const CRM_STAGE_DEFINITIONS: {
  key: CrmStage;
  label: string;
  labelId: string;
  color: string;
  borderColor: string;
  bgLight: string;
  probability: number;
}[] = [
  {
    key: 'new',
    label: 'New Inbound Lead',
    labelId: 'Prospek Baru',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgLight: 'bg-rose-950/20',
    probability: 0.1
  },
  {
    key: 'contacted',
    label: 'Initial Contact & Scoping',
    labelId: 'Kontak Awal & Brief',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgLight: 'bg-amber-950/20',
    probability: 0.3
  },
  {
    key: 'proposal',
    label: 'Proposal & Pitch Sent',
    labelId: 'Proposal Dikirim',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgLight: 'bg-blue-950/20',
    probability: 0.6
  },
  {
    key: 'negotiation',
    label: 'Negotiation & SOW',
    labelId: 'Negosiasi Kontrak',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgLight: 'bg-purple-950/20',
    probability: 0.8
  },
  {
    key: 'won',
    label: 'Closed Won',
    labelId: 'Deal Berhasil (Won)',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgLight: 'bg-emerald-950/20',
    probability: 1.0
  },
  {
    key: 'lost',
    label: 'Closed Lost',
    labelId: 'Tidak Lanjut (Lost)',
    color: 'text-[var(--muted)]',
    borderColor: 'border-[var(--line)]',
    bgLight: 'bg-[var(--panel)]',
    probability: 0.0
  }
];

export const INITIAL_DEFAULT_LEADS: CrmLead[] = [
  {
    id: 'lead_101',
    clientName: 'Reza Pratama',
    company: 'Bank Central Asia (BCA Digital)',
    email: 'reza.pratama@bcadigital.co.id',
    phone: '+62 812-3344-5566',
    servicePillar: 'AI & Cloud Solutions',
    dealValue: 380000000,
    stage: 'negotiation',
    priority: 'urgent',
    source: 'Referral',
    description: 'Cloud microservices architecture and high-security transactional auth flow for next-gen wealth app.',
    expectedCloseDate: '2026-09-30',
    assignedTo: 'Lead Full-Stack Tech',
    notes: [
      {
        id: 'note_1',
        author: 'Principal Admin',
        text: 'Met with Enterprise Architecture board. Final Master Services Agreement (MSA) under legal review.',
        createdAt: '2026-09-12T14:30:00Z',
        type: 'meeting'
      }
    ],
    createdAt: '2026-08-25T10:00:00Z',
    updatedAt: '2026-09-12T14:30:00Z'
  },
  {
    id: 'lead_102',
    clientName: 'Dian Sastro',
    company: 'Alam Sutera Realty & Urban Space',
    email: 'dian.sastro@alamsutera.com',
    phone: '+62 813-8899-0011',
    servicePillar: 'UI/UX Design',
    dealValue: 195000000,
    stage: 'proposal',
    priority: 'high',
    source: 'Website Form',
    description: '3D WebGL Virtual Tour & Luxury Township Interactive Unit Configurator.',
    expectedCloseDate: '2026-10-15',
    assignedTo: 'Creative Director',
    notes: [
      {
        id: 'note_2',
        author: 'Growth Manager',
        text: 'Pitch deck sent. Client requested a live prototype demo next Tuesday.',
        createdAt: '2026-09-10T11:00:00Z',
        type: 'proposal_sent'
      }
    ],
    createdAt: '2026-09-02T09:00:00Z',
    updatedAt: '2026-09-10T11:00:00Z'
  },
  {
    id: 'lead_103',
    clientName: 'Michael Chen',
    company: 'FinTech Pacific Singapore',
    email: 'm.chen@pacificfin.sg',
    phone: '+65 9123-4567',
    servicePillar: 'Web Development',
    dealValue: 320000000,
    stage: 'contacted',
    priority: 'high',
    source: 'LinkedIn / Outreach',
    description: 'Multi-currency settlement dashboard with automated SWIFT and BI-FAST orchestration.',
    expectedCloseDate: '2026-10-30',
    assignedTo: 'Technical Lead',
    notes: [
      {
        id: 'note_3',
        author: 'Principal Admin',
        text: 'Initial technical discovery call completed. Scoping document is being compiled.',
        createdAt: '2026-09-08T15:00:00Z',
        type: 'call'
      }
    ],
    createdAt: '2026-09-05T08:30:00Z',
    updatedAt: '2026-09-08T15:00:00Z'
  },
  {
    id: 'lead_104',
    clientName: 'Rian Hidayat',
    company: 'Logistik Nusantara Decacorn',
    email: 'rian@logistiknusantara.id',
    phone: '+62 817-6655-4433',
    servicePillar: 'Digital Product MVP',
    dealValue: 145000000,
    stage: 'new',
    priority: 'medium',
    source: 'WhatsApp Direct',
    description: 'Driver fleet management real-time tracking portal with geolocation clustering.',
    expectedCloseDate: '2026-11-10',
    assignedTo: 'Operations Lead',
    notes: [
      {
        id: 'note_4',
        author: 'Principal Admin',
        text: 'Inbound WhatsApp inquiry qualified. Scheduled discovery call for Thursday.',
        createdAt: '2026-09-14T09:15:00Z',
        type: 'whatsapp'
      }
    ],
    createdAt: '2026-09-14T09:00:00Z',
    updatedAt: '2026-09-14T09:15:00Z'
  },
  {
    id: 'lead_105',
    clientName: 'Budi Santoso',
    company: 'PT Astra Digital Ventura',
    email: 'budi.santoso@astradigital.id',
    phone: '+62 812-9988-7711',
    servicePillar: 'Web Development',
    dealValue: 183150000,
    stage: 'won',
    priority: 'high',
    source: 'Referral',
    description: 'Enterprise React & Node.js Microservices Architecture Implementation.',
    expectedCloseDate: '2026-08-01',
    assignedTo: 'Lead Full-Stack Tech',
    notes: [
      {
        id: 'note_5',
        author: 'Executive Partner',
        text: 'Deal closed! SOW signed and kickoff down payment settled.',
        createdAt: '2026-08-01T10:00:00Z',
        type: 'stage_change'
      }
    ],
    createdAt: '2026-07-20T08:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z'
  }
];

export const getCmsLeads = (): CrmLead[] => {
  hydrateCrmFromServer();
  if (crmCache) return crmCache;
  if (import.meta.env.PROD) {
    crmCache = [];
  } else {
    crmCache = INITIAL_DEFAULT_LEADS;
  }
  return crmCache;
};

export const saveCrmLead = async (lead: CrmLead): Promise<void> => {
  const current = getCmsLeads();
  const previous = [...current];
  const existingIdx = current.findIndex(l => l.id === lead.id);
  const now = new Date().toISOString();

  const updated = existingIdx >= 0
    ? current.map((item, index) => index === existingIdx ? { ...lead, updatedAt: now } : item)
    : [{ ...lead, createdAt: lead.createdAt || now, updatedAt: now }, ...current];

  crmCache = updated;
  window.dispatchEvent(new CustomEvent(CRM_EVENT_NAME, { detail: updated }));

  const payload = {
    ...lead,
    value: lead.dealValue,
    probability: lead.stage === 'won' ? 100 : lead.stage === 'lost' ? 0 : (lead.priority === 'urgent' ? 75 : lead.priority === 'high' ? 60 : 40)
  };
  const request = existingIdx >= 0
    ? api.crm.updateDeal(lead.id, payload)
    : api.crm.createDeal(payload);
  const res = await request;

  if (res.success && res.data?.success !== false) return;

  crmCache = previous;
  window.dispatchEvent(new CustomEvent(CRM_EVENT_NAME, { detail: previous }));
  throw new Error(res.error || 'CRM deal could not be saved on the server.');
};


export const deleteCrmLead = async (id: string): Promise<void> => {
  const current = getCmsLeads();
  const previous = [...current];
  const filtered = current.filter(l => l.id !== id);
  crmCache = filtered;
  window.dispatchEvent(new CustomEvent(CRM_EVENT_NAME, { detail: filtered }));

  const res = await api.crm.deleteDeal(id);
  if (res.success && res.data?.success !== false) return;

  crmCache = previous;
  window.dispatchEvent(new CustomEvent(CRM_EVENT_NAME, { detail: previous }));
  throw new Error(res.error || 'CRM deal could not be deleted on the server.');
};


export const updateLeadStage = async (id: string, newStage: CrmStage): Promise<void> => {
  const current = getCmsLeads();
  const lead = current.find(l => l.id === id);
  if (!lead) return;

  const oldStage = lead.stage;
  const stageDef = CRM_STAGE_DEFINITIONS.find(s => s.key === newStage);

  const stageNote: CrmNote = {
    id: 'note_' + Date.now().toString(36),
    author: 'Principal Admin',
    text: `Tahap deal dipindahkan dari '${oldStage.toUpperCase()}' ke '${stageDef?.label || newStage.toUpperCase()}'.`,
    createdAt: new Date().toISOString(),
    type: 'stage_change'
  };

  const updated: CrmLead = {
    ...lead,
    stage: newStage,
    notes: [stageNote, ...(lead.notes || [])],
    updatedAt: new Date().toISOString()
  };

  await saveCrmLead(updated);
};

export const addLeadNote = async (leadId: string, text: string, type: CrmNote['type'] = 'note'): Promise<void> => {
  const current = getCmsLeads();
  const lead = current.find(l => l.id === leadId);
  if (!lead) return;

  const newNote: CrmNote = {
    id: 'note_' + Date.now().toString(36),
    author: 'Principal Admin',
    text,
    createdAt: new Date().toISOString(),
    type
  };

  const updated: CrmLead = {
    ...lead,
    notes: [newNote, ...(lead.notes || [])],
    updatedAt: new Date().toISOString()
  };

  await saveCrmLead(updated);
};

/**
 * Check if an inbox submission is already converted to a CRM Lead
 */
export const isSubmissionConverted = (inquiryId: string): boolean => {
  const current = getCmsLeads();
  return current.some(l => l.inquiryId === inquiryId);
};

/**
 * Convert any ContactSubmission directly into a high-value CRM Lead
 */
export const convertInquiryToCrmLead = async (
  submission: ContactSubmission,
  customValue?: number,
  options?: {
    stage?: CrmStage;
    pillar?: CrmServicePillar;
    assignedTo?: string;
  }
): Promise<{ success: boolean; lead: CrmLead }> => {
  const existing = getCmsLeads().find(l => l.inquiryId === submission.id);
  if (existing) {
    return { success: true, lead: existing };
  }

  // Parse estimated budget to IDR
  let estimatedValue = customValue || 35000000; // default Rp 35.000.000
  if (submission.budget && !customValue) {
    const b = submission.budget.toLowerCase();
    if (b.includes('25,000') || b.includes('50,000') || b.includes('100jt') || b.includes('100m')) {
      estimatedValue = 120000000;
    } else if (b.includes('10,000') || b.includes('25,000') || b.includes('50jt')) {
      estimatedValue = 75000000;
    } else if (b.includes('5,000') || b.includes('15,000') || b.includes('25jt')) {
      estimatedValue = 45000000;
    }
  }

  // Map service
  let pillar: CrmServicePillar = options?.pillar || 'Web Development';
  if (!options?.pillar) {
    const servicesJoined = (submission.services || []).join(' ').toLowerCase() + ' ' + (submission.specialty || '').toLowerCase();
    if (servicesJoined.includes('ui/ux') || servicesJoined.includes('design') || servicesJoined.includes('figma')) {
      pillar = 'UI/UX Design';
    } else if (servicesJoined.includes('mobile') || servicesJoined.includes('app') || servicesJoined.includes('ios') || servicesJoined.includes('android')) {
      pillar = 'Mobile App';
    } else if (servicesJoined.includes('brand') || servicesJoined.includes('logo') || servicesJoined.includes('identity')) {
      pillar = 'Branding & Identity';
    } else if (servicesJoined.includes('ai') || servicesJoined.includes('cloud') || servicesJoined.includes('machine learning')) {
      pillar = 'AI & Cloud Solutions';
    } else if (servicesJoined.includes('mvp') || servicesJoined.includes('saas') || servicesJoined.includes('prototype')) {
      pillar = 'Digital Product MVP';
    }
  }

  const newLead: CrmLead = {
    id: 'crm_' + Date.now().toString(36),
    clientName: submission.fullName,
    company: submission.company || submission.positionTitle || 'Individual Client',
    email: submission.email,
    phone: submission.phone || '',
    servicePillar: pillar,
    dealValue: estimatedValue,
    stage: options?.stage || 'new',
    priority: estimatedValue >= 75000000 ? 'urgent' : estimatedValue >= 45000000 ? 'high' : 'medium',
    source: submission.source === 'Admin Simulated Live Lead' ? 'Referral' : 'Website Form',
    description: submission.message,
    inquiryId: submission.id,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assignedTo: options?.assignedTo || 'Lead Full-Stack Tech',
    notes: [
      {
        id: 'n_conv_' + Date.now().toString(36),
        author: 'System',
        text: `Lead dikonversi dari Inbound Inbox Form (${submission.type || 'inquiry'}). Pesan awal: "${submission.message.substring(0, 100)}..."`,
        createdAt: new Date().toISOString(),
        type: 'note'
      }
    ],
    documents: [],
    createdAt: submission.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await saveCrmLead(newLead);
  return { success: true, lead: newLead };
};

/**
 * Format IDR currency cleanly
 * e.g. Rp 75.000.000
 */
export const formatIDR = (value: number): string => {
  return 'Rp ' + (value || 0).toLocaleString('id-ID');
};

/**
 * Format short IDR for charts/badges
 * e.g. Rp 75M (Juta)
 */
export const formatShortIDR = (value: number): string => {
  if (value >= 1000000000) {
    return 'Rp ' + (value / 1000000000).toFixed(1) + 'M'; // Miliar
  }
  if (value >= 1000000) {
    return 'Rp ' + (value / 1000000).toFixed(0) + ' Jt'; // Juta
  }
  if (value >= 1000) {
    return 'Rp ' + (value / 1000).toFixed(0) + ' Rb';
  }
  return 'Rp ' + value;
};

/**
 * Compute key agency CRM metrics
 */
export const computeCrmMetrics = (leads: CrmLead[]) => {
  const totalDeals = leads.length;
  
  // Total pipeline value across active non-lost deals
  const activeDeals = leads.filter(l => l.stage !== 'lost');
  const totalPipelineValue = activeDeals.reduce((sum, l) => sum + (l.dealValue || 0), 0);

  // Won value
  const wonDeals = leads.filter(l => l.stage === 'won');
  const totalWonValue = wonDeals.reduce((sum, l) => sum + (l.dealValue || 0), 0);

  // In Negotiation & Proposal
  const inNegotiation = leads.filter(l => l.stage === 'negotiation' || l.stage === 'proposal');
  const negotiationValue = inNegotiation.reduce((sum, l) => sum + (l.dealValue || 0), 0);

  // Weighted pipeline value based on probability
  const weightedPipelineValue = leads.reduce((sum, l) => {
    const stageDef = CRM_STAGE_DEFINITIONS.find(s => s.key === l.stage);
    const prob = stageDef ? stageDef.probability : 0.2;
    return sum + ((l.dealValue || 0) * prob);
  }, 0);

  // Conversion / Win Rate
  const completedDeals = wonDeals.length + leads.filter(l => l.stage === 'lost').length;
  const winRate = completedDeals > 0 
    ? Math.round((wonDeals.length / completedDeals) * 100) 
    : totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;

  // Average deal size
  const avgDealSize = activeDeals.length > 0
    ? Math.round(totalPipelineValue / activeDeals.length)
    : 0;

  return {
    totalDeals,
    activeDealsCount: activeDeals.length,
    wonDealsCount: wonDeals.length,
    totalPipelineValue,
    totalWonValue,
    negotiationValue,
    weightedPipelineValue,
    winRate,
    avgDealSize
  };
};

/**
 * Export CRM dataset to clean CSV format
 */
export const exportCrmLeadsToCsv = (leads: CrmLead[]): void => {
  const headers = ['ID', 'Client Name', 'Company', 'Email', 'Phone', 'Service Pillar', 'Deal Value (IDR)', 'Stage', 'Priority', 'Source', 'Expected Close Date', 'Created At'];
  const rows = leads.map(l => [
    `"${l.id}"`,
    `"${(l.clientName || '').replace(/"/g, '""')}"`,
    `"${(l.company || '').replace(/"/g, '""')}"`,
    `"${l.email || ''}"`,
    `"${l.phone || ''}"`,
    `"${l.servicePillar || ''}"`,
    l.dealValue || 0,
    `"${l.stage}"`,
    `"${l.priority}"`,
    `"${l.source}"`,
    `"${l.expectedCloseDate || ''}"`,
    `"${l.createdAt}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kapitech_agency_crm_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
