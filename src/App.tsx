import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { LanguageProvider } from './lib/LanguageContext';
import { RequireAdminAuth } from './components/admin/RequireAdminAuth';
import { RequireModuleAccess } from './components/admin/RequireModuleAccess';

type LazyModule = { default: React.ComponentType<any> };

const lazyWithRetry = (loader: () => Promise<LazyModule>, key: string) =>
  React.lazy(async () => {
    const retryKey = 'ams-chunk-retry:' + key;
    try {
      const module = await loader();
      try { sessionStorage.removeItem(retryKey); } catch {}
      return module;
    } catch (error) {
      let alreadyRetried = false;
      try {
        alreadyRetried = sessionStorage.getItem(retryKey) === '1';
        if (!alreadyRetried) sessionStorage.setItem(retryKey, '1');
      } catch {}

      if (!alreadyRetried && typeof window !== 'undefined') {
        window.location.reload();
        return await new Promise<LazyModule>(() => {});
      }

      throw error;
    }
  });

const TasksWorkspace = lazyWithRetry(
  () => import('./components/admin/TasksWorkspace').then((m) => ({ default: m.TasksWorkspace })),
  'tasks-workspace'
);

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  props!: { children: React.ReactNode };
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-bg text-fg flex items-center justify-center p-6 font-sans">
        <section className="w-full max-w-lg rounded-card border border-line bg-panel p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-control border border-danger/25 bg-danger/10 text-danger">!</div>
          <h1 className="mt-4 text-base font-semibold">AMS failed to load</h1>
          <p className="mt-2 text-xs leading-5 text-muted">
            A frontend module failed to load. Reload the application to recover from a stale deployment asset or runtime error.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-control bg-accent px-4 text-xs font-semibold text-white"
          >
            Reload AMS
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-4 max-h-40 overflow-auto rounded-control border border-line bg-bg p-3 text-left text-[10px] text-danger">
              {this.state.error.message}
            </pre>
          )}
        </section>
      </div>
    );
  }
}

const AdminLogin = lazyWithRetry(
  () => import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })),
  'admin-login'
);

const AdminLayout = lazyWithRetry(
  () => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
  'admin-layout'
);

const GlobalExecutiveDashboard = lazyWithRetry(
  () => import('./components/admin/GlobalExecutiveDashboard').then((m) => ({ default: m.GlobalExecutiveDashboard })),
  'dashboard'
);

const AdminInbox = lazyWithRetry(
  () => import('./pages/admin/AdminInbox').then((m) => ({ default: m.AdminInbox })),
  'admin-inbox'
);

const AdminInvoicing = lazyWithRetry(
  () => import('./pages/admin/AdminInvoicing').then((m) => ({ default: m.AdminInvoicing })),
  'admin-invoicing'
);

const AdminProjects = lazyWithRetry(
  () => import('./pages/admin/AdminProjects').then((m) => ({ default: m.AdminProjects })),
  'admin-projects'
);

const AdminDocuments = lazyWithRetry(
  () => import('./pages/admin/AdminDocuments').then((m) => ({ default: m.AdminDocuments })),
  'admin-documents'
);

const AdminTeams = lazyWithRetry(
  () => import('./pages/admin/AdminTeams').then((m) => ({ default: m.AdminTeams })),
  'admin-teams'
);

const AdminVendors = lazyWithRetry(
  () => import('./pages/admin/AdminVendors').then((m) => ({ default: m.AdminVendors })),
  'admin-vendors'
);

const AdminClients = lazyWithRetry(
  () => import('./pages/admin/AdminClients').then((m) => ({ default: m.AdminClients })),
  'admin-clients'
);

const AdminClientRetainers = lazyWithRetry(
  () => import('./pages/admin/AdminClientRetainers').then((m) => ({ default: m.AdminClientRetainers })),
  'admin-client-retainers'
);

const AdminClientSlaMonitoring = lazyWithRetry(
  () => import('./pages/admin/AdminClientSlaMonitoring').then((m) => ({ default: m.AdminClientSlaMonitoring })),
  'admin-client-sla-monitoring'
);

const AdminCmsProjects = lazyWithRetry(
  () => import('./pages/admin/AdminCmsProjects').then((m) => ({ default: m.AdminCmsProjects })),
  'admin-cms-projects'
);

const AdminCmsServices = lazyWithRetry(
  () => import('./pages/admin/AdminCmsServices').then((m) => ({ default: m.AdminCmsServices })),
  'admin-cms-services'
);

const AdminCmsInsights = lazyWithRetry(
  () => import('./pages/admin/AdminCmsInsights').then((m) => ({ default: m.AdminCmsInsights })),
  'admin-cms-insights'
);

const AdminCmsTestimonials = lazyWithRetry(
  () => import('./pages/admin/AdminCmsTestimonials').then((m) => ({
    default: m.AdminCmsTestimonials
  })),
  'admin-cms-testimonials'
);

const AdminCmsCareers = lazyWithRetry(
  () => import('./pages/admin/AdminCmsCareers').then((m) => ({ default: m.AdminCmsCareers })),
  'admin-cms-careers'
);

const AdminSettings = lazyWithRetry(
  () => import('./pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })),
  'admin-settings'
);

const LoadingScreen = () => (
  <div className="min-h-screen bg-bg text-fg flex items-center justify-center p-6 font-sans">
    <div className="w-full max-w-[720px] space-y-3" role="status" aria-label="Loading AMS">
      <div className="h-7 w-48 rounded-control bg-line/70" />
      <div className="h-4 w-72 rounded-control bg-line/50" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-20 rounded-card bg-line/50" />
        <div className="h-20 rounded-card bg-line/50" />
        <div className="h-20 rounded-card bg-line/50" />
      </div>
      <div className="h-56 rounded-card bg-line/40" />
    </div>
  </div>
);

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search]);

  return null;
};

const ProtectedAdminRoutes = () => (
  <RequireAdminAuth>
    <AdminLayout />
  </RequireAdminAuth>
);

const ModuleRoute: React.FC<{
  moduleKey: string;
  moduleLabel: string;
  children: React.ReactNode;
}> = ({ moduleKey, moduleLabel, children }) => (
  <RequireModuleAccess moduleKey={moduleKey} moduleLabel={moduleLabel}>
    {children}
  </RequireModuleAccess>
);

const TeamWorkspaceRoute: React.FC = () => {
  const location = useLocation();
  const view = new URLSearchParams(location.search).get('view') || 'team-directory';
  const isVendorWorkspace = view === 'vendor-directory' || view === 'skill-matrix';
  const moduleKey = isVendorWorkspace ? 'vendors' : 'timelogs';
  const moduleLabel = isVendorWorkspace ? 'vendors' : view === 'time-logs' ? 'time logs' : 'team operations';

  return (
    <ModuleRoute moduleKey={moduleKey} moduleLabel={moduleLabel}>
      <AdminTeams />
    </ModuleRoute>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
      <LanguageProvider>
        <ScrollToTop />

        <AppErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/login" element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              <Route path="/admin" element={<ProtectedAdminRoutes />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<ModuleRoute moduleKey="dashboard" moduleLabel="the dashboard"><GlobalExecutiveDashboard /></ModuleRoute>} />
                <Route path="tasks" element={<ModuleRoute moduleKey="projects" moduleLabel="tasks"><TasksWorkspace /></ModuleRoute>} />
                <Route path="executive" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="inbox" element={<ModuleRoute moduleKey="inbox" moduleLabel="the inbox"><AdminInbox /></ModuleRoute>} />
                <Route path="crm" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="proposals" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="invoicing" element={<ModuleRoute moduleKey="invoicing" moduleLabel="invoicing"><AdminInvoicing /></ModuleRoute>} />
                <Route path="projects" element={<ModuleRoute moduleKey="projects" moduleLabel="projects"><AdminProjects /></ModuleRoute>} />
                <Route path="approvals" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="documents" element={<ModuleRoute moduleKey="documents" moduleLabel="documents"><AdminDocuments /></ModuleRoute>} />
                <Route path="team" element={<TeamWorkspaceRoute />} />
                <Route path="time-logs" element={<Navigate to="/admin/team?view=time-logs" replace />} />
                <Route path="vendors" element={<Navigate to="/admin/team?view=vendor-directory" replace />} />
                <Route path="clients" element={<Navigate to="/admin/clients/all-clients" replace />} />
                <Route path="clients/all-clients" element={<ModuleRoute moduleKey="clients" moduleLabel="clients"><AdminClients /></ModuleRoute>} />
                <Route path="clients/retainers" element={<ModuleRoute moduleKey="clients" moduleLabel="clients"><AdminClientRetainers /></ModuleRoute>} />
                <Route path="clients/sla-monitoring" element={<ModuleRoute moduleKey="clients" moduleLabel="clients"><AdminClientSlaMonitoring /></ModuleRoute>} />
                <Route path="clients/lead-accounts" element={<Navigate to="/admin/clients/all-clients" replace />} />
                <Route path="cms" element={<Navigate to="/admin/cms/projects" replace />} />
                <Route path="cms/projects" element={<ModuleRoute moduleKey="cms_projects" moduleLabel="case studies"><AdminCmsProjects /></ModuleRoute>} />
                <Route path="cms/services" element={<ModuleRoute moduleKey="services" moduleLabel="the services catalog"><AdminCmsServices /></ModuleRoute>} />
                <Route path="cms/testimonials" element={<ModuleRoute moduleKey="testimonials" moduleLabel="testimonials"><AdminCmsTestimonials /></ModuleRoute>} />
                <Route path="cms/insights" element={<ModuleRoute moduleKey="cms_insights" moduleLabel="Insights"><AdminCmsInsights /></ModuleRoute>} />
                <Route path="cms/careers" element={<ModuleRoute moduleKey="cms_projects" moduleLabel="Careers"><AdminCmsCareers /></ModuleRoute>} />
                <Route path="settings" element={<ModuleRoute moduleKey="settings" moduleLabel="settings"><AdminSettings /></ModuleRoute>} />
              </Route>

              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </Suspense>
        </AppErrorBoundary>
        </LanguageProvider>
      </MotionConfig>
    </BrowserRouter>
  );
};

export default App;