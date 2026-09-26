/**
 * CMS Data Store & Content Management Engine for Kapitech Agency
 * Manages Services & Solutions, Portfolio / Case Studies, Client Testimonials, and Site Meta.
 * Synchronizes with Server API (/api/cms/*) with resilient client cache.
 */

import { allProjects, ProjectItem } from '../data/projectsData';
import { allSolutionsAndServices, ServiceItemData } from '../data/servicesData';
import { api } from './apiClient';

export interface TestimonialItem {
  id: string;
  quote: string;
  quoteId: string;
  author: string;
  role: string;
  company: string;
  location: string;
  rating?: number;
  avatar?: string;
  isPublished?: boolean;
}

export interface SiteMetaSettings {
  siteTitle: string;
  siteDescription: string;
  contactReceiverEmail: string;
  defaultLanguage: 'en' | 'id';
  enableLiveChat: boolean;
  enableSoundAlerts: boolean;
  maintenanceMode: boolean;
}

let cmsServicesCache: ServiceItemData[] | null = null;
let cmsProjectsCache: ProjectItem[] | null = null;
let cmsTestimonialsCache: TestimonialItem[] | null = null;
let cmsSettingsCache: SiteMetaSettings | null = null;
export const CMS_EVENT_KEY = 'kapitech_cms_updated';

const cmsHydrationRetryState: Record<'services' | 'projects' | 'testimonials' | 'settings', { count: number; timer: number | null }> = {
  services: { count: 0, timer: null },
  projects: { count: 0, timer: null },
  testimonials: { count: 0, timer: null },
  settings: { count: 0, timer: null }
};

function scheduleCmsHydrationRetry(type: 'services' | 'projects' | 'testimonials' | 'settings', retry: () => void): void {
  if (typeof window === 'undefined') return;
  const state = cmsHydrationRetryState[type];
  if (state.timer !== null || state.count >= 6) return;
  const delay = Math.min(30000, 3000 * 2 ** state.count);
  state.count += 1;
  state.timer = window.setTimeout(() => {
    state.timer = null;
    retry();
  }, delay);
}

function markCmsHydrationSuccess(type: 'services' | 'projects' | 'testimonials' | 'settings'): void {
  cmsHydrationRetryState[type].count = 0;
}


export const defaultTestimonials: TestimonialItem[] = [
  {
    id: 't_01',
    quote: "Kapitech built our real estate portal from scratch using Next.js. The page load speed is blazing fast and our inbound lead conversions increased by 45% within the first month.",
    quoteId: "Kapitech membangun portal real estate kami dari nol menggunakan Next.js. Kecepatan loading halamannya luar biasa cepat dan konversi prospek kami meningkat 45% dalam bulan pertama.",
    author: "Marcus Thorne",
    role: "Managing Director",
    company: "Lumina Real Estate",
    location: "Jakarta, Indonesia",
    rating: 5,
    isPublished: true
  },
  {
    id: 't_02',
    quote: "Their design team has an exceptional eye for modern typography and layout. They delivered a cohesive brand identity and a stunning web experience that elevated our firm completely.",
    quoteId: "Tim desain mereka memiliki keahlian luar biasa dalam tipografi dan tata letak modern. Mereka menghadirkan identitas brand yang sangat kohesif dan pengalaman web yang memukau.",
    author: "Sarah Chen",
    role: "Creative Director",
    company: "Aura Creative Studio",
    location: "Singapore",
    rating: 5,
    isPublished: true
  },
  {
    id: 't_03',
    quote: "Working with Kapitech on our mobile banking interface was seamless. They simplified complex account journeys and delivered pixel-perfect Figma specs ready for our dev squad.",
    quoteId: "Bekerja dengan Kapitech untuk antarmuka mobile banking sangat lancar. Mereka menyederhanakan alur pengguna yang kompleks dan menyerahkan spesifikasi Figma yang presisi untuk tim developer kami.",
    author: "David Miller",
    role: "Head of Product",
    company: "Nexus Fintech",
    location: "Hong Kong",
    rating: 5,
    isPublished: true
  },
  {
    id: 't_04',
    quote: "The solar energy monitoring dashboard Kapitech engineered gave our operations team instant visibility across 40+ solar farms with zero lag. Highly dependable engineering.",
    quoteId: "Dashboard monitoring energi surya yang dikembangkan Kapitech memberi tim operasi kami visibilitas langsung di lebih dari 40 ladang surya tanpa lag. Rekayasa yang sangat andal.",
    author: "Elena Rodriguez",
    role: "Operations VP",
    company: "Solaris CleanTech",
    location: "Melbourne, Australia",
    rating: 5,
    isPublished: true
  },
  {
    id: 't_05',
    quote: "Our headless Shopify migration handled our flash sale traffic peaks without a hitch. Checkout conversion increased by 38%. Kapitech delivers genuine business results.",
    quoteId: "Migrasi Shopify headless kami menangani lonjakan traffic flash sale tanpa hambatan. Konversi checkout meningkat sebesar 38%. Kapitech memberikan hasil bisnis nyata.",
    author: "Julian Vane",
    role: "Founder & CEO",
    company: "Vivid Commerce",
    location: "Jakarta, Indonesia",
    rating: 5,
    isPublished: true
  },
  {
    id: 't_06',
    quote: "Clear milestones, proactive communication, and zero technical fluff. Kapitech is our go-to partner whenever we need to launch a new digital product on a tight timeline.",
    quoteId: "Milestone yang jelas, komunikasi proaktif, dan tanpa basa-basi teknis. Kapitech adalah mitra andalan kami setiap kali kami perlu meluncurkan produk digital baru dalam jadwal ketat.",
    author: "Michael Kross",
    role: "Chief Technology Officer",
    company: "Kross Cloud Systems",
    location: "Kuala Lumpur, Malaysia",
    rating: 5,
    isPublished: true
  }
];

export const defaultSiteMeta: SiteMetaSettings = {
  siteTitle: 'Kapitech — High-End Digital Experience & Engineering Studio',
  siteDescription: 'Leading design & engineering studio crafting bespoke digital products, brand identities, and high-performance web systems.',
  contactReceiverEmail: 'kapitechagency@gmail.com',
  defaultLanguage: 'id',
  enableLiveChat: true,
  enableSoundAlerts: true,
  maintenanceMode: false
};

function notifyCmsUpdate(type: 'services' | 'projects' | 'testimonials' | 'settings') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CMS_EVENT_KEY, { detail: { type } }));
  }
}

// -------------------------------------------------------------
// 1. Services & Solutions CMS Manager
// -------------------------------------------------------------

export function getCmsServices(): ServiceItemData[] {
  if (cmsServicesCache) return cmsServicesCache;
  cmsServicesCache = allSolutionsAndServices;
  return cmsServicesCache;
}

export async function fetchServerCmsServices(): Promise<ServiceItemData[]> {
  try {
    const res = await api.cms.getServices();
    if (res.success && Array.isArray(res.data?.services)) {
      markCmsHydrationSuccess('services');
      const serverServices = res.data.services;
      cmsServicesCache = serverServices;
      notifyCmsUpdate('services');
      return serverServices;
    }
  } catch (err) {
    console.debug('Failed to fetch services from server:', err);
  }
  scheduleCmsHydrationRetry('services', () => { void fetchServerCmsServices(); });
  return getCmsServices();
}

export async function saveCmsService(service: ServiceItemData): Promise<{ success: boolean; service: ServiceItemData }> {
  const current = getCmsServices();
  const existing = current.find((s) => (
    ((service as any).id && String((s as any).id || '') === String((service as any).id)) ||
    s.slug === service.slug
  ));
  const exists = Boolean(existing);
  const targetId = String((existing as any)?.id || (service as any).id || '');
  const res = exists && targetId
    ? await api.cms.updateService(targetId, service)
    : await api.cms.createService(service);

  if (!res.success || !res.data?.service) {
    throw new Error(res.error || 'CMS service could not be saved on the server.');
  }

  const serverService = res.data.service as ServiceItemData;
  const updated = exists
    ? current.map((s) => String((s as any).id || '') === String((existing as any)?.id || targetId) ? serverService : s)
    : [serverService, ...current];

  cmsServicesCache = updated;
  notifyCmsUpdate('services');
  return { success: true, service: serverService };
}

export async function deleteCmsService(slug: string): Promise<boolean> {
  const current = getCmsServices();
  const existing = current.find((s) => s.slug === slug || (s as any).id === slug);
  const targetId = String((existing as any)?.id || slug);
  const res = await api.cms.deleteService(targetId);
  if (!res.success) throw new Error(res.error || 'CMS service could not be deleted on the server.');
  cmsServicesCache = current.filter((s) => s.slug !== slug && String((s as any).id || '') !== targetId);
  notifyCmsUpdate('services');
  return true;
}

// -------------------------------------------------------------
// 2. Projects CMS Manager
// -------------------------------------------------------------

export function getCmsProjects(): ProjectItem[] {
  return cmsProjectsCache || (cmsProjectsCache = allProjects);
}

export async function fetchServerCmsProjects(): Promise<ProjectItem[]> {
  try {
    const res = await api.cms.getProjects();
    if (res.success && Array.isArray(res.data?.projects)) {
      markCmsHydrationSuccess('projects');
      const serverProjects = res.data.projects;
      cmsProjectsCache = serverProjects;
      notifyCmsUpdate('projects');
      return serverProjects;
    }
  } catch (err) {
    console.debug('Failed to fetch projects from server:', err);
  }
  scheduleCmsHydrationRetry('projects', () => { void fetchServerCmsProjects(); });
  return getCmsProjects();
}

export async function saveCmsProject(project: ProjectItem): Promise<{ success: boolean; project: ProjectItem }> {
  const current = getCmsProjects();
  const exists = current.some(p => p.id === project.id);
  const res = exists
    ? await api.cms.updateProject(project.id, project)
    : await api.cms.createProject(project);

  if (!res.success || !res.data?.project) {
    throw new Error(res.error || 'CMS project could not be saved on the server.');
  }

  const serverProject = res.data.project as ProjectItem;
  const updated = exists
    ? current.map(p => p.id === project.id ? serverProject : p)
    : [serverProject, ...current];

  cmsProjectsCache = updated;
  notifyCmsUpdate('projects');
  return { success: true, project: serverProject };
}

export async function deleteCmsProject(id: string): Promise<boolean> {
  const res = await api.cms.deleteProject(id);
  if (!res.success) throw new Error(res.error || 'CMS project could not be deleted on the server.');
  cmsProjectsCache = getCmsProjects().filter(p => p.id !== id);
  notifyCmsUpdate('projects');
  return true;
}

export function resetCmsProjectsToDefault() {
  cmsProjectsCache = allProjects;
  notifyCmsUpdate('projects');
}

// -------------------------------------------------------------
// 3. Testimonials CMS Manager
// -------------------------------------------------------------

export function getCmsTestimonials(): TestimonialItem[] {
  return cmsTestimonialsCache || (cmsTestimonialsCache = defaultTestimonials);
}

export async function fetchServerCmsTestimonials(): Promise<TestimonialItem[]> {
  try {
    const res = await api.cms.getTestimonials();
    if (res.success && Array.isArray(res.data?.testimonials)) {
      markCmsHydrationSuccess('testimonials');
      const serverT = res.data.testimonials;
      if (serverT.length > 0) {
        cmsTestimonialsCache = serverT;
        notifyCmsUpdate('testimonials');
        return serverT;
      }
      // Keep the curated public fallback when the CMS is reachable but has no records.
      return getCmsTestimonials();
    }
  } catch (err) {
    console.debug('Failed to fetch testimonials from server:', err);
  }
  scheduleCmsHydrationRetry('testimonials', () => { void fetchServerCmsTestimonials(); });
  return getCmsTestimonials();
}

export async function saveCmsTestimonial(testimonial: TestimonialItem): Promise<{ success: boolean; testimonial: TestimonialItem }> {
  const current = getCmsTestimonials();
  const exists = current.some(t => t.id === testimonial.id);
  const res = exists
    ? await api.cms.updateTestimonial(testimonial.id, testimonial)
    : await api.cms.createTestimonial(testimonial);

  if (!res.success || !res.data?.testimonial) {
    throw new Error(res.error || 'CMS testimonial could not be saved on the server.');
  }

  const serverTestimonial = res.data.testimonial as TestimonialItem;
  const updated = exists
    ? current.map(t => t.id === testimonial.id ? serverTestimonial : t)
    : [serverTestimonial, ...current];

  cmsTestimonialsCache = updated;
  notifyCmsUpdate('testimonials');
  return { success: true, testimonial: serverTestimonial };
}

export async function deleteCmsTestimonial(id: string): Promise<boolean> {
  const res = await api.cms.deleteTestimonial(id);
  if (!res.success) throw new Error(res.error || 'CMS testimonial could not be deleted on the server.');
  cmsTestimonialsCache = getCmsTestimonials().filter(t => t.id !== id);
  notifyCmsUpdate('testimonials');
  return true;
}

// -------------------------------------------------------------
// 4. Site Meta & Configuration Manager
// -------------------------------------------------------------

export function getCmsSiteMeta(): SiteMetaSettings {
  return cmsSettingsCache || (cmsSettingsCache = { ...defaultSiteMeta });
}

export async function fetchServerCmsSiteMeta(): Promise<SiteMetaSettings> {
  try {
    const res = await api.cms.getSettings();
    if (res.success && res.data?.settings) {
      markCmsHydrationSuccess('settings');
      const s = { ...defaultSiteMeta, ...res.data.settings };
      cmsSettingsCache = s;
      notifyCmsUpdate('settings');
      return s;
    }
  } catch (err) {
    console.debug('Failed to fetch site settings from server:', err);
  }
  scheduleCmsHydrationRetry('settings', () => { void fetchServerCmsSiteMeta(); });
  return getCmsSiteMeta();
}

export async function saveCmsSiteMeta(settings: Partial<SiteMetaSettings>): Promise<SiteMetaSettings> {
  const current = getCmsSiteMeta();
  const candidate = { ...current, ...settings };
  const allowed: SiteMetaSettings = {
    siteTitle: candidate.siteTitle,
    siteDescription: candidate.siteDescription,
    contactReceiverEmail: candidate.contactReceiverEmail,
    defaultLanguage: candidate.defaultLanguage,
    enableLiveChat: candidate.enableLiveChat,
    enableSoundAlerts: candidate.enableSoundAlerts,
    maintenanceMode: candidate.maintenanceMode
  };

  const res = await api.cms.updateSettings(allowed);
  if (!res.success || !res.data?.settings) {
    throw new Error(res.error || 'CMS site settings could not be saved on the server.');
  }

  const serverSettings = { ...defaultSiteMeta, ...res.data.settings } as SiteMetaSettings;
  cmsSettingsCache = serverSettings;
  notifyCmsUpdate('settings');
  return serverSettings;
}