import { api } from './apiClient';

/**
 * Kapitech Agency Vendor & Contractor Directory Store
 * Database of vetted freelancers, agency partners, hourly rates, skills, and contract statuses.
 */

export type VendorType = 'freelancer' | 'agency_partner' | 'contractor' | 'saas_vendor';
export type VendorStatus = 'active' | 'under_review' | 'inactive' | 'blacklisted';

export interface VendorContract {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  rateType: 'hourly' | 'project' | 'monthly_retainer';
  rateAmount: number; // in IDR
  currency: 'IDR' | 'USD';
  status: 'active' | 'expired' | 'terminated';
}

export interface AgencyVendor {
  id: string;
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
  if (!import.meta.env.PROD || vendorServerHydrationStarted) return;
  vendorServerHydrationStarted = true;
  api.vendors.getAll().then((res) => {
    if (!res.success || !Array.isArray(res.data?.vendors)) {
      vendorServerHydrationStarted = false;
      scheduleVendorHydrationRetry();
      return;
    }
    vendorServerHydrationRetryCount = 0;
    vendorsCache = res.data.vendors;
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(VENDOR_EVENT_NAME));
  }).catch(() => {
    vendorServerHydrationStarted = false;
    scheduleVendorHydrationRetry();
  });
}

const defaultVendors: AgencyVendor[] = [
  {
    id: 'ven_001',
    name: 'Dimas Pratama',
    companyName: 'PixelCraft Motion Studio',
    email: 'dimas@pixelcraft.id',
    phone: '+62 812-4455-8899',
    type: 'contractor',
    primaryCategory: '3D & Motion',
    skills: ['Three.js', 'Spline 3D', 'After Effects', 'GLTF Optimization', 'Framer Motion'],
    hourlyRate: 450000,
    currency: 'IDR',
    rating: 4.9,
    completedProjectsCount: 14,
    status: 'active',
    isVetted: true,
    location: 'Bandung, Indonesia',
    portfolioUrl: 'https://pixelcraft.id',
    contracts: [
      {
        id: 'cnt_01',
        title: 'Q3 3D Asset Creation Retainer',
        startDate: '2026-07-01',
        endDate: '2026-09-30',
        rateType: 'monthly_retainer',
        rateAmount: 18000000,
        currency: 'IDR',
        status: 'active'
      }
    ],
    notes: 'Exceptional 3D real estate configurator deliverables with minimal supervision.',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z'
  },
  {
    id: 'ven_002',
    name: 'Elena Rostova',
    companyName: 'CloudScale DevOps Ltd',
    email: 'elena@cloudscale.io',
    phone: '+44 20 7946 0992',
    type: 'agency_partner',
    primaryCategory: 'DevOps & Cloud',
    skills: ['Kubernetes', 'Terraform', 'AWS ECS', 'Cloudflare Workers', 'PostgreSQL HA'],
    hourlyRate: 950000,
    currency: 'IDR',
    rating: 5.0,
    completedProjectsCount: 9,
    status: 'active',
    location: 'London / Remote',
    portfolioUrl: 'https://cloudscale.io',
    githubUrl: 'https://github.com/cloudscale-io',
    contracts: [
      {
        id: 'cnt_02',
        title: 'Infrastructure Automation Master SOW',
        startDate: '2026-05-10',
        endDate: '2026-11-10',
        rateType: 'hourly',
        rateAmount: 950000,
        currency: 'IDR',
        status: 'active'
      }
    ],
    notes: 'Handles high-concurrency database migration for enterprise fintech clients.',
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-08-15T15:00:00.000Z'
  },
  {
    id: 'ven_003',
    name: 'Rian Syahputra',
    companyName: 'CodeVertex Lab',
    email: 'rian@codevertex.dev',
    phone: '+62 857-1122-3344',
    type: 'freelancer',
    primaryCategory: 'Backend Dev',
    skills: ['Golang', 'Node.js', 'gRPC', 'Redis BullMQ', 'Docker'],
    hourlyRate: 350000,
    currency: 'IDR',
    rating: 4.8,
    completedProjectsCount: 8,
    status: 'active',
    location: 'Jakarta, Indonesia',
    githubUrl: 'https://github.com/riansyahputra',
    contracts: [
      {
        id: 'cnt_03',
        title: 'Fintech API Gateway Microservice',
        startDate: '2026-08-01',
        endDate: '2026-09-15',
        rateType: 'project',
        rateAmount: 25000000,
        currency: 'IDR',
        status: 'active'
      }
    ],
    notes: 'Reliable backend specialist. Fast turnaround on async queue simulations.',
    createdAt: '2026-04-12T09:00:00.000Z',
    updatedAt: '2026-08-25T11:00:00.000Z'
  },
  {
    id: 'ven_004',
    name: 'Sarah Wijaya',
    email: 'sarah.ux@gmail.com',
    phone: '+62 813-8899-0011',
    type: 'freelancer',
    primaryCategory: 'UI/UX Design',
    skills: ['Figma Design Systems', 'User Research', 'Interactive Prototyping', 'WCAG AA Accessibility'],
    hourlyRate: 300000,
    currency: 'IDR',
    rating: 4.7,
    completedProjectsCount: 11,
    status: 'active',
    location: 'Yogyakarta, Indonesia',
    portfolioUrl: 'https://dribbble.com/sarahwijaya',
    contracts: [],
    notes: 'Great at fast wireframing and design token architecture.',
    createdAt: '2026-02-20T14:00:00.000Z',
    updatedAt: '2026-08-10T16:00:00.000Z'
  }
];

export function getAgencyVendors(): AgencyVendor[] {
  hydrateVendorsFromServer();
  if (vendorsCache) return vendorsCache;
  vendorsCache = import.meta.env.PROD ? [] : defaultVendors;
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
