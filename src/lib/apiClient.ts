/**
 * Centralized API Client for Kapitech AMS
 * Seamlessly interfaces with the Express backend on /api
 */

const LEGACY_TOKEN_STORAGE_KEY = 'kapitech_session_token';

export function getSessionToken(): null {
  return null;
}

export function setSessionToken(_token: string, _remember: boolean = true): void {
  // Server sessions are kept in an HttpOnly cookie and are not exposed to JavaScript.
}

export function clearSessionToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
}

function readCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const prefix = `${name}=`;
  const part = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return part ? decodeURIComponent(part.slice(prefix.length)) : '';
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const UNKNOWN_MUTATION_OUTCOME_ERROR = 'The server response was not received. The operation may have completed; check its current status before retrying.';
const UNKNOWN_UPLOAD_OUTCOME_ERROR = 'The upload result could not be confirmed. Check the document list before retrying to avoid duplicate or orphaned files.';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  const controller = new AbortController();
  const method = String(options.method || 'GET').toUpperCase();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (MUTATING_METHODS.has(method)) {
      const csrfToken = readCookie('kapi_csrf');
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;
    const res = await fetch(url, {
      ...options,
      method,
      headers,
      credentials: 'same-origin',
      signal: options.signal || controller.signal
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        clearSessionToken();
        sessionStorage.removeItem('kapitech_admin_profile_v2');
        localStorage.removeItem('kapitech_admin_profile_v2');
        window.dispatchEvent(new Event('kapitech_auth_state_changed'));
      }

      const safeError =
        res.status === 401
          ? 'Your session expired. Refresh and try again.'
          : res.status === 403
            ? (typeof json.error === 'string' && json.error.trim()
                ? json.error
                : "You don't have access to this action.")
            : res.status >= 500
              ? (typeof json.error === 'string' && json.error.trim()
                  ? json.error
                  : `The AMS server returned an error (HTTP ${res.status}). Check service and database health.`)
              : json.error || 'The request could not be completed. Check your input and try again.';

      return {
        success: false,
        data: json as T,
        error: safeError,
        status: res.status
      };
    }

    return {
      success: true,
      data: json
    };
  } catch (err: any) {
    const error = MUTATING_METHODS.has(method)
      ? UNKNOWN_MUTATION_OUTCOME_ERROR
      : err?.name === 'AbortError'
        ? 'Request timed out. Please try again.'
        : (err?.message || 'Network request failed');
    return { success: false, error };
  } finally {
    window.clearTimeout(timeout);
  }
}

async function apiBinaryRequest<T = any>(
  endpoint: string,
  body: Blob,
  contentType: string = 'application/octet-stream'
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60000);
  try {
    const headers: Record<string, string> = {
      'Content-Type': contentType || 'application/octet-stream'
    };
    const csrfToken = readCookie('kapi_csrf');
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

    const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body,
      credentials: 'same-origin',
      signal: controller.signal
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        clearSessionToken();
        sessionStorage.removeItem('kapitech_admin_profile_v2');
        localStorage.removeItem('kapitech_admin_profile_v2');
        window.dispatchEvent(new Event('kapitech_auth_state_changed'));
      }
      const safeError =
        res.status === 401
          ? 'Your session expired. Refresh and try again.'
          : res.status === 403
            ? (typeof json.error === 'string' && json.error.trim()
                ? json.error
                : "You don't have access to this action.")
            : res.status >= 500
              ? (typeof json.error === 'string' && json.error.trim()
                  ? json.error
                  : `The AMS server returned an error (HTTP ${res.status}). Check service and database health.`)
              : json.error || 'The upload could not be completed. Check the file and try again.';
      return { success: false, error: safeError, status: res.status };
    }
    return { success: true, data: json };
  } catch {
    return {
      success: false,
      error: UNKNOWN_UPLOAD_OUTCOME_ERROR
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export const api = {
  // Auth
  auth: {
    login: (body: { identifier: string; password: string; rememberMe?: boolean }) =>
      apiRequest<{ success: boolean; requiresMfa?: boolean; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    firebaseLogin: (body: { idToken: string; rememberMe?: boolean }) =>
      apiRequest<{ success: boolean; requiresMfa?: boolean; provider?: string; user: any }>('/api/auth/firebase-login', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
    me: () => apiRequest<{ success: boolean; user: any }>('/api/auth/me'),
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    verifyPassword: (password: string) =>
      apiRequest<{ success: boolean }>('/api/auth/verify-password', {
        method: 'POST',
        body: JSON.stringify({ password })
      }),
    mfaVerify: (code: string, trustDevice = false) =>
      apiRequest<{ success: boolean; user: any }>('/api/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code, trustDevice })
      }),
    mfaSetupStart: () =>
      apiRequest<{ success: boolean; secret: string; otpAuthUri: string }>('/api/auth/mfa/setup/start', {
        method: 'POST'
      }),
    mfaSetupVerify: (code: string) =>
      apiRequest<{ success: boolean; mfaEnabled: boolean; mfaRecoveryCodes?: string[] }>('/api/auth/mfa/setup/verify', {
        method: 'POST',
        body: JSON.stringify({ code })
      }),
    mfaDisable: (currentPassword: string, code: string) =>
      apiRequest<{ success: boolean; mfaEnabled: boolean }>('/api/auth/mfa/disable', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, code })
      }),
    getUsers: () => apiRequest<{ success: boolean; users: any[] }>('/api/auth/users'),
    getTaskAssignees: () => apiRequest<{ success: boolean; assignees: Array<{ id: string; name: string; username: string; role: string; division: string }> }>('/api/auth/task-assignees'),
    createUser: (userData: any) =>
      apiRequest('/api/auth/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      }),
    updateUser: (id: string, updates: any) =>
      apiRequest<{ success: boolean; user: any }>(`/api/auth/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    deleteUser: (id: string) => apiRequest(`/api/auth/users/${id}`, { method: 'DELETE' })
  },

  // Leads
  leads: {
    submit: (lead: any) =>
      apiRequest('/api/leads/submit', {
        method: 'POST',
        body: JSON.stringify(lead)
      }),
    getAll: () => apiRequest<{ success: boolean; leads: any[] }>('/api/leads'),
    update: (id: string, updates: any) =>
      apiRequest(`/api/leads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    delete: (id: string) => apiRequest(`/api/leads/${id}`, { method: 'DELETE' }),
    convertToClient: (id: string) => apiRequest<{ success: boolean; client: any; lead: any; replayed: boolean; created: boolean }>(`/api/leads/${id}/convert-to-client`, { method: 'POST' }),
    convert: (id: string) => apiRequest(`/api/leads/${id}/convert`, { method: 'POST' })
  },

  // CRM
  crm: {
    getDeals: () => apiRequest<{ success: boolean; deals: any[] }>('/api/crm/deals'),
    createDeal: (deal: any) =>
      apiRequest('/api/crm/deals', {
        method: 'POST',
        body: JSON.stringify(deal)
      }),
    updateDeal: (id: string, updates: any) =>
      apiRequest(`/api/crm/deals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    deleteDeal: (id: string) => apiRequest(`/api/crm/deals/${id}`, { method: 'DELETE' }),
    convertWonDeal: (id: string) => apiRequest<{ success: boolean; replayed: boolean; client: any; project: any; invoice: any }>(`/api/crm/deals/${id}/convert-to-project`, {
      method: 'POST'
    })
  },

  // Clients
  clients: {
    getAll: () => apiRequest<{ success: boolean; clients: any[] }>('/api/clients'),
    create: (client: any) =>
      apiRequest('/api/clients', {
        method: 'POST',
        body: JSON.stringify(client)
      }),
    update: (id: string, updates: any) =>
      apiRequest(`/api/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    addRetainerHours: (id: string, hours: number) =>
      apiRequest<{ success: boolean; client: any }>(`/api/clients/${id}/retainer-hours`, {
        method: 'POST',
        body: JSON.stringify({ hours })
      }),
    getInteractions: (id: string) => apiRequest<{ success: boolean; interactions: any[] }>(`/api/clients/${encodeURIComponent(id)}/interactions`),
    createInteraction: (id: string, interaction: Record<string, unknown>) =>
      apiRequest<{ success: boolean; interaction: any }>(`/api/clients/${encodeURIComponent(id)}/interactions`, {
        method: 'POST',
        body: JSON.stringify(interaction)
      }),
    delete: (id: string) => apiRequest(`/api/clients/${id}`, { method: 'DELETE' })
  },

  // Client contracts & statements of work
  contracts: {
    getAll: () => apiRequest<{ success: boolean; contracts: any[] }>('/api/contracts'),
    create: (contract: Record<string, unknown>) =>
      apiRequest<{ success: boolean; contract: any }>('/api/contracts', {
        method: 'POST',
        body: JSON.stringify(contract)
      }),
    update: (id: string, updates: Record<string, unknown>) =>
      apiRequest<{ success: boolean; contract: any }>(`/api/contracts/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    transition: (id: string, status: string, notes = '') =>
      apiRequest<{ success: boolean; contract: any }>(`/api/contracts/${encodeURIComponent(id)}/transition`, {
        method: 'POST',
        body: JSON.stringify({ status, notes })
      }),
    delete: (id: string) =>
      apiRequest<{ success: boolean; message?: string }>(`/api/contracts/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },

  // Projects
  projects: {
    getAll: () => apiRequest<{ success: boolean; projects: any[] }>('/api/projects'),
    create: (proj: any) =>
      apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify(proj)
      }),
    update: (id: string, updates: any) =>
      apiRequest(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    delete: (id: string) => apiRequest(`/api/projects/${id}`, { method: 'DELETE' })
  },

  // Finance & Invoices
  finance: {
    getInvoices: () => apiRequest<{ success: boolean; invoices: any[] }>('/api/finance/invoices'),
    createInvoice: (inv: any) =>
      apiRequest('/api/finance/invoices', {
        method: 'POST',
        body: JSON.stringify(inv)
      }),
    updateInvoice: (id: string, updates: any) =>
      apiRequest(`/api/finance/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    payInvoice: (id: string, payment: { amount: number; date?: string; method?: string; settlementAccountCode?: '1000' | '1010' | '1100' | '1200'; reference?: string; notes?: string; idempotencyKey?: string }) =>
      apiRequest(`/api/finance/invoices/${id}/pay`, {
        method: 'POST',
        body: JSON.stringify(payment)
      }),
    deleteInvoice: (id: string) => apiRequest(`/api/finance/invoices/${id}`, { method: 'DELETE' }),
    getExpenses: () => apiRequest<{ success: boolean; expenses: any[] }>('/api/finance/expenses'),
    createExpense: (exp: any) =>
      apiRequest('/api/finance/expenses', {
        method: 'POST',
        body: JSON.stringify(exp)
      }),
    recordExpensePayment: (id: string, payment: any) =>
      apiRequest(`/api/finance/expenses/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify(payment)
      }),
    deleteExpense: (id: string, version?: number) =>
      apiRequest(`/api/finance/expenses/${id}`, {
        method: 'DELETE',
        body: version == null ? undefined : JSON.stringify({ version })
      }),
    getMetrics: (currency?: string) => apiRequest<{ success: boolean; metrics: any }>('/api/finance/metrics' + (currency ? `?currency=${encodeURIComponent(currency)}` : '')),
    getProjectProfitability: () => apiRequest<{ success: boolean; projects: Array<{ projectId: string; projectName: string; clientName: string; projectStatus: string; currency: string; budget: number | null; invoiced: number; collected: number; outstanding: number; recordedCosts: number; contribution: number; marginPercent: number | null }> }>('/api/finance/project-profitability'),
    workbookList: (type: string, filters: { period?: string; projectId?: string; includeArchived?: boolean } = {}) => {
      const params = new URLSearchParams();
      if (filters.period) params.set('period', filters.period);
      if (filters.projectId) params.set('projectId', filters.projectId);
      if (filters.includeArchived) params.set('includeArchived', 'true');
      const query = params.toString();
      return apiRequest<{ success: boolean; records: any[] }>(`/api/finance/workbook/${encodeURIComponent(type)}${query ? '?' + query : ''}`);
    },
    workbookCreate: (type: string, payload: Record<string, unknown>) =>
      apiRequest<{ success: boolean; record: any }>(`/api/finance/workbook/${encodeURIComponent(type)}`, {
        method: 'POST',
        body: JSON.stringify({ payload })
      }),
    workbookSyncJournalDrafts: () =>
      apiRequest<{
        success: boolean;
        summary?: { created: number; updated: number; alreadyPresent: number; skipped: number; closedPeriodSkipped: number; failed: number; candidates: number };
        skippedSources?: Array<{ sourceType: string; sourceId: string; reason: string }>;
        failedSources?: Array<{ sourceType: string; sourceId: string; reason: string }>;
        error?: string;
      }>('/api/finance/workbook/journal-drafts/sync', {
        method: 'POST',
        body: JSON.stringify({})
      }),
    workbookUpdate: (type: string, id: string, payload: Record<string, unknown>, version: number) =>
      apiRequest<{ success: boolean; record: any }>(`/api/finance/workbook/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({ payload, version })
      }),
    workbookApprove: (type: string, id: string, notes = '', action: 'approve' | 'post' = 'approve') =>
      apiRequest<{ success: boolean; record: any }>(`/api/finance/workbook/${encodeURIComponent(type)}/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes, action })
      }),
    workbookDelete: (type: string, id: string, version: number) =>
      apiRequest<{ success: boolean; record: any }>(`/api/finance/workbook/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        body: JSON.stringify({ version })
      }),
    workbookClosePeriod: (period: string) =>
      apiRequest<{ success: boolean; record: any }>(`/api/finance/workbook/periods/${encodeURIComponent(period)}/close`, {
        method: 'POST',
        body: JSON.stringify({})
      })
  },

  // Vendors
  vendors: {
    getAll: () => apiRequest<{ success: boolean; vendors: any[] }>('/api/vendors'),
    create: (ven: any) =>
      apiRequest('/api/vendors', {
        method: 'POST',
        body: JSON.stringify(ven)
      }),
    update: (id: string, updates: any) =>
      apiRequest(`/api/vendors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    delete: (id: string) => apiRequest(`/api/vendors/${id}`, { method: 'DELETE' })
  },

  // CMS
  cms: {
    getPublicSettings: () => apiRequest<{
      success: boolean;
      settings: {
        siteTitle: string;
        siteDescription: string;
        defaultLanguage: 'id' | 'en';
        maintenanceMode: boolean;
      };
    }>('/api/cms/public-settings'),
    getServices: () => apiRequest<{ success: boolean; services: any[] }>('/api/cms/services'),
    createService: (srv: any) =>
      apiRequest('/api/cms/services', {
        method: 'POST',
        body: JSON.stringify(srv)
      }),
    updateService: (id: string, updates: any) =>
      apiRequest(`/api/cms/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    deleteService: (id: string) => apiRequest(`/api/cms/services/${id}`, { method: 'DELETE' }),

    getProjects: () => apiRequest<{ success: boolean; projects: any[] }>('/api/cms/projects'),
    createProject: (proj: any) =>
      apiRequest('/api/cms/projects', {
        method: 'POST',
        body: JSON.stringify(proj)
      }),
    updateProject: (id: string, updates: any) =>
      apiRequest(`/api/cms/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    deleteProject: (id: string) => apiRequest(`/api/cms/projects/${id}`, { method: 'DELETE' }),

    getTestimonials: () => apiRequest<{ success: boolean; testimonials: any[] }>('/api/cms/testimonials'),
    getCareers: () => apiRequest<{ success: boolean; positions: any[] }>('/api/cms/careers'),
    createCareer: (position: any) =>
      apiRequest('/api/cms/careers', { method: 'POST', body: JSON.stringify(position) }),
    updateCareer: (id: string, updates: any) =>
      apiRequest(`/api/cms/careers/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(updates) }),
    deleteCareer: (id: string) =>
      apiRequest(`/api/cms/careers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    getInsights: (params: Record<string, string | number | boolean | undefined> = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') query.set(key, String(value));
      });
      return apiRequest<{ success: boolean; insights: any[]; meta?: { total: number; page: number; pageSize: number; totalPages: number } }>(
        '/api/cms/insights' + (query.toString() ? '?' + query.toString() : '')
      );
    },
    getInsightBySlug: (slug: string, language?: 'id' | 'en') =>
      apiRequest<{ success: boolean; insight: any }>(
        '/api/cms/insights/' + encodeURIComponent(slug) + (language ? '?language=' + language : '')
      ),
    createInsight: (insight: any) =>
      apiRequest('/api/cms/insights', { method: 'POST', body: JSON.stringify(insight) }),
    updateInsight: (id: string, updates: any) =>
      apiRequest('/api/cms/insights/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(updates) }),
    deleteInsight: (id: string) =>
      apiRequest('/api/cms/insights/' + encodeURIComponent(id), { method: 'DELETE' }),
    getInsightCategories: (language?: 'id' | 'en') =>
      apiRequest<{ success: boolean; categories: any[] }>(
        '/api/cms/insight-categories' + (language ? '?language=' + language : '')
      ),
    createInsightCategory: (category: any) =>
      apiRequest('/api/cms/insight-categories', { method: 'POST', body: JSON.stringify(category) }),
    deleteInsightCategory: (id: string) =>
      apiRequest('/api/cms/insight-categories/' + encodeURIComponent(id), { method: 'DELETE' }),
    getInsightAuthors: () =>
      apiRequest<{ success: boolean; authors: any[] }>('/api/cms/insight-authors'),
    createInsightAuthor: (author: any) =>
      apiRequest('/api/cms/insight-authors', { method: 'POST', body: JSON.stringify(author) }),
    deleteInsightAuthor: (id: string) =>
      apiRequest('/api/cms/insight-authors/' + encodeURIComponent(id), { method: 'DELETE' }),
    getInsightTags: (language?: 'id' | 'en') =>
      apiRequest<{ success: boolean; tags: any[] }>(
        '/api/cms/insight-tags' + (language ? '?language=' + language : '')
      ),
    createTestimonial: (t: any) =>
      apiRequest('/api/cms/testimonials', {
        method: 'POST',
        body: JSON.stringify(t)
      }),
    updateTestimonial: (id: string, updates: any) =>
      apiRequest(`/api/cms/testimonials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    deleteTestimonial: (id: string) => apiRequest(`/api/cms/testimonials/${id}`, { method: 'DELETE' }),

    getSettings: () => apiRequest<{ success: boolean; settings: any }>('/api/cms/settings'),
    updateSettings: (settings: any) =>
      apiRequest('/api/cms/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      })
  },

  // Audit Logs
  auditLogs: {
    getAll: () => apiRequest<{ success: boolean; logs: any[] }>('/api/audit-logs'),
    integrity: () => apiRequest<{ success: boolean; integrity: { valid: boolean; checked: number; brokenAt?: string } }>('/api/audit-logs/integrity')
  },

  // System / Backup
  system: {
    getBackups: () => apiRequest<{
      success: boolean;
      backups: Array<{ createdAt: string; sizeBytes: number }>;
      retention: number;
      encryptedAtRest?: boolean;
      privateDocumentEncryption?: boolean;
      provider?: string;
      configured?: boolean;
      retentionDays?: number;
      rpoMinutes?: number;
      rtoMinutes?: number;
      restoreVerified?: boolean;
      restoreVerifiedAt?: string | null;
    }>('/api/system/backups'),
    createBackup: () => apiRequest<{ success: boolean; backup: { createdAt: string; sizeBytes: number } }>('/api/system/backups', { method: 'POST' }),
    backupIntegrity: () => apiRequest<{ success: boolean; integrity: { valid: boolean; checkedAt: string; latestName?: string; reason?: string } }>('/api/system/backups/integrity'),
    securityStatus: () => apiRequest<{
      success: boolean;
      status: {
        encryptionAtRest: boolean;
        privateDocumentEncryption: boolean;
        mfaRequired: boolean;
        activeUserCount: number;
        mfaEnabledCount: number;
        mfaCoveragePercent: number;
        backupCount: number;
        latestBackupAt: string | null;
        latestBackupAgeMinutes: number | null;
        backupFresh: boolean;
        backupIntegrity: { valid: boolean; checkedAt: string; latestName?: string; reason?: string };
      };
    }>('/api/system/security/status'),
    productionReadiness: () => apiRequest<{ success: boolean; productionReady: boolean; gates: Record<string, boolean>; status: any }>('/api/system/production-readiness')
  },

  // Notifications
  notifications: {
    getSettings: () => apiRequest<{ success: boolean; settings: any }>('/api/notifications/settings'),
    updateSettings: (settings: any) =>
      apiRequest('/api/notifications/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      }),
    getAll: () => apiRequest<{ success: boolean; notifications: any[] }>('/api/notifications'),
    markRead: (id: string) => apiRequest(`/api/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => apiRequest('/api/notifications/mark-all-read', { method: 'POST' })
  },

  // Proposals & Quotations
  proposals: {
    getAll: () => apiRequest<{ success: boolean; proposals: any[] }>('/api/crm/proposals'),
    create: (proposal: any) =>
      apiRequest('/api/crm/proposals', {
        method: 'POST',
        body: JSON.stringify(proposal)
      }),
    update: (id: string, updates: any) =>
      apiRequest(`/api/crm/proposals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    approve: (id: string) => apiRequest(`/api/crm/proposals/${id}/approve`, { method: 'POST' }),
    convertToInvoice: (id: string) => apiRequest(`/api/crm/proposals/${id}/convert-to-invoice`, { method: 'POST' }),
    delete: (id: string) => apiRequest(`/api/crm/proposals/${id}`, { method: 'DELETE' })
  },

  // Tasks & Execution
  tasks: {
    getAll: () => apiRequest<{ success: boolean; tasks: any[] }>('/api/projects/tasks'),
    create: (task: any) =>
      apiRequest('/api/projects/tasks', {
        method: 'POST',
        body: JSON.stringify(task)
      }),
    update: (id: string, updates: any) =>
      apiRequest(`/api/projects/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    delete: (id: string) => apiRequest(`/api/projects/tasks/${id}`, { method: 'DELETE' })
  },

  // Time Tracking
  timeLogs: {
    getOptions: () => apiRequest<{ success: boolean; projects: Array<{ id: string; name: string; tasks: Array<{ id: string; title: string }> }> }>('/api/projects/timelog-options'),
    getAll: () => apiRequest<{ success: boolean; timeLogs: any[] }>('/api/projects/timelogs'),
    create: (log: any) =>
      apiRequest('/api/projects/timelogs', {
        method: 'POST',
        body: JSON.stringify(log)
      }),
    delete: (id: string) => apiRequest(`/api/projects/timelogs/${id}`, { method: 'DELETE' })
  },

  // Approvals
  approvals: {
    getAll: () => apiRequest<{ success: boolean; approvals: any[] }>('/api/approvals'),
    create: (appr: any) =>
      apiRequest('/api/approvals', {
        method: 'POST',
        body: JSON.stringify(appr)
      }),
    action: (id: string, action: 'Approve' | 'Reject' | 'Request Changes', notes?: string) =>
      apiRequest(`/api/approvals/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, notes })
      })
  },

  // Documents
  documents: {
    getAll: () => apiRequest<{ success: boolean; documents: any[] }>('/api/documents'),
    create: (doc: any) =>
      apiRequest('/api/documents', {
        method: 'POST',
        body: JSON.stringify(doc)
      }),
    uploadContent: (id: string, file: Blob) =>
      apiBinaryRequest<{ success: boolean; document: any }>(
        `/api/documents/${encodeURIComponent(id)}/content`,
        file,
        file.type || 'application/octet-stream'
      ),
    delete: (id: string) => apiRequest(`/api/documents/${id}`, { method: 'DELETE' })
  },

  // Global Search
  search: {
    query: (q: string) => apiRequest<{ success: boolean; results: any[] }>(`/api/search?q=${encodeURIComponent(q)}`)
  },

  // Executive Dashboard & Today at Kapitech
  dashboard: {
    getOverview: () => apiRequest<{
      success: boolean;
      todayAtKapitech: any;
      financials: any;
      attentionItems: any[];
      recentActivity: any[];
      metrics?: any;
      pipelineByStage?: any[];
      projects?: any[];
    }>('/api/dashboard/overview')
  },
  executive: {
    getOverview: () => apiRequest<{
      success: boolean;
      todayAtKapitech: any;
      financials: any;
      attentionItems: any[];
      recentActivity: any[];
      metrics?: any;
      pipelineByStage?: any[];
      projects?: any[];
    }>('/api/executive/overview')
  },

  // AI Assist
  ai: {
    generate: (prompt: string, context?: string) =>
      apiRequest<{ success: boolean; result: string }>('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, context })
      })
  },

  // Migration
  migration: {
    importLocal: (data: any) =>
      apiRequest('/api/migration/import-local', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  }
};
