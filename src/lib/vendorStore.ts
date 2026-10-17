import { api } from './apiClient';
import { toSlug } from './slug';


/**
 * Kapitech Agency Vendor & Contractor Directory Store
 * Database of vetted freelancers, agency partners, hourly rates, skills, and contract statuses.
 */

export type VendorType = 'freelancer' | 'agency_partner' | 'contractor' | 'saas_vendor';
export type VendorStatus = 'active' | 'under_review' | 'inactive' | 'blacklisted';

export interface VendorContract {
  id: string;
  slug?: string;
  title: string;
  startDate: string;
  endDate?: string;
  rateType: 'hourly' | 'project' | 'monthly_retainer';
  rateAmount: number; // in IDR
  currency: 'IDR' | 'USD';
  status: 'active' | 'expired' | 'terminated';
}

const normalizeVendorContracts = (contracts: VendorContract[] | undefined): VendorContract[] =>
  (Array.isArray(contracts) ? contracts : []).map((contract) => ({
    ...contract,
    slug: toSlug(contract.slug || contract.title || contract.id, 'vendor-contract-record')
  }));

export interface AgencyVendor {
  id: string;
  slug?: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  type: VendorType;
  primaryCategory: 'Frontend Dev' | 'Backend Dev' | 'UI/UX Design' | 'DevOps & Cloud' | 'SEO & Copy' | '3D & Motion' | 'Legal & Accounting';
  skills: string[];
  hourlyRate: number; // in IDR
  currency: 'IDR' | 'USD';
  rating: number; // 1 to 5
  completedProjectsCount: number;
  status: VendorStatus;
  isVetted?: boolean; // Vetted agency partner indicator
  location: string;
  portfolioUrl?: string;
  githubUrl?: string;
  contracts: VendorContract[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

let vendorsCache: AgencyVendor[] | null = null;
export const VENDOR_EVENT_NAME = 'kapitech_vendors_updated';

let vendorServerHydrationStarted = false;

let vendorServerHydrationRetryCount = 0;
let vendorServerHydrationRetryTimer: number | null = null;

function scheduleVendorHydrationRetry(): void {
  if (typeof window === 'undefined' || vendorServerHydrationRetryTimer !== null || vendorServerHydrationRetryCount >= 6) return;
  const delay = Math.min(30000, 3000 * 2 ** vendorServerHydrationRetryCount);
  vendorServerHydrationRetryCount += 1;
  vendorServerHydrationRetryTimer = window.setTimeout(() => {
    vendorServerHydrationRetryTimer = null;
    hydrateVendorsFromServer();
  }, delay);
}

function hydrateVendorsFromServer(): void {
  if (typeof window === 'undefined' || vendorServerHydrationStarted) return;
  vendorServerHydrationStarted = true;
  api.vendors.getAll().then((res) => {
    if (!res.success || !Array.isArray(res.data?.vendors)) {
      vendorServerHydrationStarted = false;
      scheduleVendorHydrationRetry();
      return;
    }
    vendorServerHydrationRetryCount = 0;
    vendorsCache = res.data.vendors.map((vendor) => ({ ...vendor, slug: toSlug(vendor.slug || vendor.companyName || vendor.name || vendor.id, 'vendor-record'), contracts: normalizeVendorContracts(vendor.contracts) }));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(VENDOR_EVENT_NAME));
  }).catch(() => {
    vendorServerHydrationStarted = false;
    scheduleVendorHydrationRetry();
  });
}

export function getAgencyVendors(): AgencyVendor[] {
  hydrateVendorsFromServer();
  if (vendorsCache) return vendorsCache;
  vendorsCache = [];
  return vendorsCache;
}

export async function saveAgencyVendor(vendor: AgencyVendor): Promise<void> {
  const current = getAgencyVendors();
  const previous = [...current];
  const idx = current.findIndex(v => v.id === vendor.id);
  let updated: AgencyVendor[];

  if (idx >= 0) {
    updated = [...current];
    updated[idx] = { ...vendor, updatedAt: new Date().toISOString() };
  } else {
    updated = [{
      ...vendor,
      createdAt: vendor.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, ...current];
  }

  vendorsCache = updated;
  window.dispatchEvent(new Event(VENDOR_EVENT_NAME));

  const request = idx >= 0
    ? api.vendors.update(vendor.id, vendor)
    : api.vendors.create(vendor);
  const res = await request;

  if (res.success && res.data?.success !== false) return;

  vendorsCache = previous;
  window.dispatchEvent(new Event(VENDOR_EVENT_NAME));
  throw new Error(res.error || 'Vendor could not be saved on the server.');
}

export async function deleteAgencyVendor(id: string): Promise<void> {
  const current = getAgencyVendors();
  const previous = [...current];
  const updated = current.filter(v => v.id !== id);

  vendorsCache = updated;
  window.dispatchEvent(new Event(VENDOR_EVENT_NAME));

  const res = await api.vendors.delete(id);
  if (res.success && res.data?.success !== false) return;

  vendorsCache = previous;
  window.dispatchEvent(new Event(VENDOR_EVENT_NAME));
  throw new Error(res.error || 'Vendor could not be deleted on the server.');
}
