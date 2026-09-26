/**
 * Kapitech Agency Client Directory Store
 * Centralized client records database with associated projects, invoices history,
 * feedback/testimonials, direct contact info, and lifetime value tracking.
 */

export interface AgencyClient {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  website?: string;
  location: string;
  industry: string;
  status: 'active' | 'completed' | 'lead' | 'inactive';
  totalSpend: number; // in IDR
  projectsCount: number;
  contactPersonRole: string;
  notes?: string;
  avatarUrl?: string;
  slaDailyAdSpendBudget?: number; // agreed daily ad spend SLA cap in IDR
  currentDailyAdSpend?: number; // current actual daily ad spend in IDR
  createdAt: string;
  updatedAt: string;
}

let clientsCache: AgencyClient[] | null = null;
export const CLIENT_EVENT_NAME = 'kapitech_clients_updated';

import { api } from './apiClient';

let clientServerHydrationStarted = false;

let clientServerHydrationRetryCount = 0;
let clientServerHydrationRetryTimer: number | null = null;

function scheduleClientHydrationRetry(): void {
  if (typeof window === 'undefined' || clientServerHydrationRetryTimer !== null || clientServerHydrationRetryCount >= 6) return;
  const delay = Math.min(30000, 3000 * 2 ** clientServerHydrationRetryCount);
  clientServerHydrationRetryCount += 1;
  clientServerHydrationRetryTimer = window.setTimeout(() => {
    clientServerHydrationRetryTimer = null;
    hydrateClientsFromServer();
  }, delay);
}

function hydrateClientsFromServer(): void {
  if (!import.meta.env.PROD || clientServerHydrationStarted) return;
  clientServerHydrationStarted = true;
  api.clients.getAll().then((res) => {
    if (!res.success || !Array.isArray(res.data?.clients)) {
      clientServerHydrationStarted = false;
      scheduleClientHydrationRetry();
      return;
    }
    clientServerHydrationRetryCount = 0;
    clientsCache = res.data.clients;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CLIENT_EVENT_NAME, { detail: res.data.clients }));
    }
  }).catch(() => {
    clientServerHydrationStarted = false;
    scheduleClientHydrationRetry();
  });
}

export const INITIAL_DEFAULT_CLIENTS: AgencyClient[] = [
  {
    id: 'cli_101',
    name: 'Budi Santoso',
    company: 'PT Astra Digital Ventura',
    email: 'budi.santoso@astradigital.id',
    phone: '+62 812-9988-7711',
    website: 'https://astradigital.id',
    location: 'Jakarta Selatan, Indonesia',
    industry: 'Enterprise Technology & Mobility',
    status: 'active',
    totalSpend: 183150000,
    projectsCount: 2,
    contactPersonRole: 'Head of Digital Engineering',
    notes: 'Key enterprise account. Currently deploying microservices and React architecture.',
    slaDailyAdSpendBudget: 15000000,
    currentDailyAdSpend: 11200000,
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T14:15:00Z'
  },
  {
    id: 'cli_102',
    name: 'Sarah Jenkins',
    company: 'Telkomsel Innovation Labs',
    email: 's.jenkins@telkomsel.co.id',
    phone: '+62 811-2233-4455',
    website: 'https://telkomsel.com/innovation',
    location: 'Bandung, Indonesia',
    industry: 'Telecommunications & Cloud',
    status: 'active',
    totalSpend: 126540000,
    projectsCount: 1,
    contactPersonRole: 'VP Product Innovation',
    notes: '3D WebGL Brand Experience & Interactive Design System showcase.',
    slaDailyAdSpendBudget: 10000000,
    currentDailyAdSpend: 8400000,
    createdAt: '2026-08-10T09:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z'
  },
  {
    id: 'cli_103',
    name: 'Hendra Gunawan',
    company: 'GoTo Financial Technology',
    email: 'hendra.gunawan@gotofinancial.com',
    phone: '+62 813-7788-9900',
    website: 'https://gotofinancial.com',
    location: 'Jakarta Pusat, Indonesia',
    industry: 'FinTech & Payments',
    status: 'active',
    totalSpend: 233100000,
    projectsCount: 2,
    contactPersonRole: 'Managing Director of Core Platforms',
    notes: 'High-volume transaction dashboards and merchant settlement portals.',
    slaDailyAdSpendBudget: 25000000,
    currentDailyAdSpend: 18500000,
    createdAt: '2026-07-15T11:00:00Z',
    updatedAt: '2026-09-01T15:00:00Z'
  },
  {
    id: 'cli_104',
    name: 'Jessica Halim',
    company: 'ShopeePay International',
    email: 'jessica.h@shopeepay.com',
    phone: '+62 817-4433-2211',
    website: 'https://shopeepay.co.id',
    location: 'Jakarta Barat, Indonesia',
    industry: 'E-Commerce & Digital Wallet',
    status: 'active',
    totalSpend: 105450000,
    projectsCount: 1,
    contactPersonRole: 'Engineering Operations Lead',
    notes: 'High-Throughput Payment Orchestrator & Cloud Run Backend.',
    slaDailyAdSpendBudget: 12000000,
    currentDailyAdSpend: 9800000,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-09-05T10:00:00Z'
  },
  {
    id: 'cli_105',
    name: 'Kevin Wijaya',
    company: 'Nusa Cloud Systems',
    email: 'kevin@nusacloud.id',
    phone: '+62 819-1122-3344',
    website: 'https://nusacloud.id',
    location: 'Surabaya, Indonesia',
    industry: 'Cloud Infrastructure & DevOps',
    status: 'active',
    totalSpend: 49950000,
    projectsCount: 1,
    contactPersonRole: 'Chief Technology Officer',
    notes: 'Legacy Cloud Migration & Kubernetes Architecture Sprint.',
    slaDailyAdSpendBudget: 8000000,
    currentDailyAdSpend: 7500000,
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-20T11:00:00Z'
  }
];

export const getAgencyClients = (): AgencyClient[] => {
  hydrateClientsFromServer();
  if (clientsCache) return clientsCache;
  clientsCache = import.meta.env.PROD ? [] : INITIAL_DEFAULT_CLIENTS;
  return clientsCache;
};

export const saveAgencyClient = async (client: AgencyClient): Promise<void> => {
  const current = getAgencyClients();
  const previous = [...current];
  const idx = current.findIndex(c => c.id === client.id);
  const now = new Date().toISOString();

  let updated: AgencyClient[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = { ...client, updatedAt: now };
  } else {
    updated = [{ ...client, createdAt: client.createdAt || now, updatedAt: now }, ...current];
  }

  clientsCache = updated;
  window.dispatchEvent(new CustomEvent(CLIENT_EVENT_NAME, { detail: updated }));

  const request = idx >= 0 ? api.clients.update(client.id, client) : api.clients.create(client);
  const res = await request;
  if (res.success && res.data?.success !== false) return;

  clientsCache = previous;
  window.dispatchEvent(new CustomEvent(CLIENT_EVENT_NAME, { detail: previous }));
  throw new Error(res.error || 'Client could not be saved on the server.');
};

export const deleteAgencyClient = async (id: string): Promise<void> => {
  const current = getAgencyClients();
  const previous = [...current];
  const updated = current.filter(c => c.id !== id);
  clientsCache = updated;
  window.dispatchEvent(new CustomEvent(CLIENT_EVENT_NAME, { detail: updated }));
  const res = await api.clients.delete(id);
  if (res.success && res.data?.success !== false) return;

  clientsCache = previous;
  window.dispatchEvent(new CustomEvent(CLIENT_EVENT_NAME, { detail: previous }));
  throw new Error(res.error || 'Client could not be deleted on the server.');
};
