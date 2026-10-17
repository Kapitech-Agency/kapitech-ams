/**
 * Kapitech Agency Client Directory Store
 * Centralized client records database with associated projects, invoices history,
 * feedback/testimonials, direct contact info, and lifetime value tracking.
 */

export interface AgencyClient {
  id: string;
  slug: string;
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
  activeRetainer?: boolean;
  retainerId?: string;
  retainerTier?: 'tier-1' | 'tier-2' | 'tier-3';
  retainerMonthlyValue?: number;
  retainerCommittedHours?: number;
  retainerUsedHours?: number;
  retainerOverageRate?: number;
  retainerCycle?: 'monthly' | 'quarterly' | 'annual';
  retainerRenewal?: string;
  createdAt: string;
  updatedAt: string;
}

let clientsCache: AgencyClient[] | null = null;
export const CLIENT_EVENT_NAME = 'kapitech_clients_updated';

export const createClientSlug = (company: string, id = ''): string => {
  const base = company
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `client-${id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
};

export const getAgencyClientSlug = (client: Partial<AgencyClient> & Record<string, unknown>): string => {
  const existing = String(client.slug ?? client.clientSlug ?? client.client_slug ?? '').trim();
  if (existing) return existing;

  const company = String(
    client.company ??
    client.companyName ??
    client.clientCompany ??
    client.clientName ??
    client.name ??
    ''
  ).trim();

  const id = String(client.id ?? '').trim();
  return createClientSlug(company || 'client account', id);
};

export const normalizeAgencyClient = (client: AgencyClient): AgencyClient => ({
  ...client,
  slug: getAgencyClientSlug(client as AgencyClient & Record<string, unknown>)
});

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
  if (typeof window === 'undefined' || clientServerHydrationStarted) return;
  clientServerHydrationStarted = true;
  api.clients.getAll().then((res) => {
    if (!res.success || !Array.isArray(res.data?.clients)) {
      clientServerHydrationStarted = false;
      scheduleClientHydrationRetry();
      return;
    }
    clientServerHydrationRetryCount = 0;
    clientsCache = res.data.clients.map(normalizeAgencyClient);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CLIENT_EVENT_NAME, { detail: clientsCache }));
    }
  }).catch(() => {
    clientServerHydrationStarted = false;
    scheduleClientHydrationRetry();
  });
}

export const INITIAL_DEFAULT_CLIENTS: AgencyClient[] = [];
export const getAgencyClients = (): AgencyClient[] => {
  hydrateClientsFromServer();
  if (clientsCache) return clientsCache.map(normalizeAgencyClient);
  clientsCache = [];
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
