import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { LanguageProvider } from './lib/LanguageContext';
import { RequireAdminAuth } from './components/admin/RequireAdminAuth';
import { RequireModuleAccess } from './components/admin/RequireModuleAccess';
import { AmsRoleRouteGuard } from './components/admin/AmsRoleRouteGuard';
import { AmsNavigationPlaceholder } from './components/admin/AmsNavigationPlaceholder';

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

const AdminFinanceWorkspace = lazyWithRetry(
  () => import('./pages/admin/AdminFinanceWorkspace').then((m) => ({ default: m.AdminFinanceWorkspace })),
  'admin-finance-workspace'
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

const AdminInvoicing = lazyWithRetry(
  () => import('./pages/admin/AdminInvoicing').then((m) => ({ default: m.AdminInvoicing })),
  'admin-proposals'
);

const AdminTimeLogs = lazyWithRetry(
  () => import('./pages/admin/AdminTimeLogs').then((m) => ({ default: m.AdminTimeLogs })),
  'admin-time-logs'
);

const AdminContracts = lazyWithRetry(
  () => import('./pages/admin/AdminContracts').then((m) => ({ default: m.AdminContracts })),
  'admin-contracts'
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

const AdminApprovals = lazyWithRetry(
  () => import('./pages/admin/AdminApprovals').then((m) => ({ default: m.AdminApprovals })),
  'admin-approvals'
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
    <AmsRoleRouteGuard>
      <AdminLayout />
    </AmsRoleRouteGuard>
  </RequireAdminAuth>
);

const ModuleLoadingFallback = () => (
  <div className="min-h-[320px] min-w-0 space-y-5 p-4 sm:p-6" role="status" aria-label="Loading module">
    <div className="space-y-2">
      <div className="h-5 w-44 max-w-full rounded-control bg-line/60" />
      <div className="h-3 w-64 max-w-full rounded-control bg-line/40" />
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-20 rounded-card border border-line bg-panel p-4">
          <div className="h-3 w-20 rounded-control bg-line/50" />
          <div className="mt-4 h-5 w-14 rounded-control bg-line/40" />
        </div>
      ))}
    </div>
    <div className="rounded-card border border-line bg-panel p-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="h-4 w-36 rounded-control bg-line/50" />
        <div className="h-8 w-24 rounded-control bg-line/40" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="grid grid-cols-3 gap-3">
            <div className="h-3 rounded-control bg-line/40" />
            <div className="h-3 rounded-control bg-line/30" />
            <div className="h-3 rounded-control bg-line/30" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

class ModuleRouteErrorBoundary extends React.Component<
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
      <div className="mx-4 my-6 rounded-card border border-danger/25 bg-danger/5 p-5 sm:mx-6" role="alert">
        <h2 className="text-sm font-semibold text-fg">This section could not be loaded</h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          The rest of AMS is still available. Reload this section to try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex min-h-9 items-center justify-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg transition-colors hover:bg-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Reload section
        </button>
        {import.meta.env.DEV && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-control border border-line bg-bg p-3 text-left text-[10px] text-danger">
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}

const ModuleRoute: React.FC<{
  moduleKey: string;
  moduleLabel: string;
  children: React.ReactNode;
}> = ({ moduleKey, moduleLabel, children }) => (
  <ModuleRouteErrorBoundary>
    <RequireModuleAccess moduleKey={moduleKey} moduleLabel={moduleLabel}>
      <Suspense fallback={<ModuleLoadingFallback />}>
        {children}
      </Suspense>
    </RequireModuleAccess>
  </ModuleRouteErrorBoundary>
);

const TeamWorkspaceRoute: React.FC = () => {
  const location = useLocation();
  const requestedView = new URLSearchParams(location.search).get('view');

  // Retain old URLs while moving each workspace to its own module route.
  if (location.pathname === '/admin/team' && requestedView === 'vendor-directory') return <Navigate to="/admin/vendors" replace />;
  if (location.pathname === '/admin/team' && requestedView === 'skill-matrix') return <Navigate to="/admin/vendors?view=skill-matrix" replace />;
  if (location.pathname === '/admin/team' && requestedView === 'time-logs') return <Navigate to="/admin/time-logs" replace />;

  return (
    <ModuleRoute moduleKey="timelogs" moduleLabel="Team">
      <AdminTeams />
    </ModuleRoute>
  );
};

const VendorWorkspaceRoute: React.FC = () => {
  const location = useLocation();
  const showSkillMatrix = new URLSearchParams(location.search).get('view') === 'skill-matrix';
  return showSkillMatrix ? (
    <ModuleRoute moduleKey="vendors" moduleLabel="Vendors">
      <AdminTeams />
    </ModuleRoute>
  ) : (
    <ModuleRoute moduleKey="vendors" moduleLabel="Vendors">
      <AdminVendors />
    </ModuleRoute>
  );
};

const DashboardWorkspaceRoute: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  if (params.get('view') === 'tasks') {
    const taskScope = params.get('taskscope');
    const destination = taskScope && taskScope !== 'all'
      ? '/admin/tasks?taskscope=' + encodeURIComponent(taskScope)
      : '/admin/tasks';
    return <Navigate to={destination} replace />;
  }
  return (
    <ModuleRoute moduleKey="dashboard" moduleLabel="Dashboard">
      <GlobalExecutiveDashboard />
    </ModuleRoute>
  );
};


const LegacyInvoicingRedirect: React.FC = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const destination = query.get('finance') === 'vendor-payments'
    ? '/admin/finance?tab=accounts-payable'
    : '/admin/finance?tab=revenue';
  return <Navigate to={destination} replace />;
};

const LegacyQuotationRedirect: React.FC = () => {
  const location = useLocation();
  return (
    <Navigate
      to={{ pathname: '/admin/finance/quotations', search: location.search, hash: location.hash }}
      replace
    />
  );
};

const InboxWorkspaceRoute: React.FC = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);

  // The old job-applications Inbox view now opens the single owning Careers workspace.
  if (query.get('view') === 'jobs') {
    return <Navigate to={{ pathname: '/admin/cms/careers', search: '?tab=applicants' }} replace />;
  }

  return <AdminInbox />;
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
              <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/my-hub" element={<Navigate to="/admin/tasks?taskscope=my" replace />} />
              <Route path="/tasks" element={<Navigate to="/admin/tasks?taskscope=my" replace />} />
              <Route path="/crm" element={<Navigate to="/admin/clients/all-clients" replace />} />
              <Route path="/projects" element={<Navigate to="/admin/projects" replace />} />
              <Route path="/finance" element={<Navigate to="/admin/finance" replace />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              <Route path="/admin" element={<ProtectedAdminRoutes />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardWorkspaceRoute />} />
                <Route path="navigation/live-activity" element={<ModuleRoute moduleKey="dashboard" moduleLabel="Live Activity Stream"><AmsNavigationPlaceholder kind="activity" /></ModuleRoute>} />
                <Route path="navigation/release-readiness" element={<ModuleRoute moduleKey="settings" moduleLabel="Release Readiness Telemetry Gate"><AmsNavigationPlaceholder kind="readiness" /></ModuleRoute>} />
                <Route path="tasks" element={<ModuleRoute moduleKey="projects" moduleLabel="tasks"><TasksWorkspace /></ModuleRoute>} />
                <Route path="executive" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="inbox" element={<ModuleRoute moduleKey="inbox" moduleLabel="the inbox"><InboxWorkspaceRoute /></ModuleRoute>} />
                <Route path="crm" element={<Navigate to="/admin/clients/all-clients" replace />} />
                <Route path="proposals" element={<LegacyQuotationRedirect />} />
                <Route path="contracts" element={<ModuleRoute moduleKey="clients" moduleLabel="contracts"><AdminContracts /></ModuleRoute>} />
                <Route path="finance" element={<ModuleRoute moduleKey="invoicing" moduleLabel="finance"><AdminFinanceWorkspace /></ModuleRoute>} />
                <Route path="finance/quotations" element={<ModuleRoute moduleKey="invoicing" moduleLabel="quotations"><AdminInvoicing embeddedView="quotations" /></ModuleRoute>} />
                <Route path="invoicing" element={<LegacyInvoicingRedirect />} />
                <Route path="projects" element={<ModuleRoute moduleKey="projects" moduleLabel="projects"><AdminProjects /></ModuleRoute>} />
                <Route path="approvals" element={<ModuleRoute moduleKey="approvals" moduleLabel="Approvals"><AdminApprovals /></ModuleRoute>} />
                <Route path="documents" element={<ModuleRoute moduleKey="documents" moduleLabel="documents"><AdminDocuments /></ModuleRoute>} />
                <Route path="team" element={<TeamWorkspaceRoute />} />
                <Route path="time-logs" element={<ModuleRoute moduleKey="timelogs" moduleLabel="Time"><AdminTimeLogs /></ModuleRoute>} />
                <Route path="vendors" element={<VendorWorkspaceRoute />} />
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