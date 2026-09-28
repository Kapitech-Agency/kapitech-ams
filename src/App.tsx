import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { LanguageProvider } from './lib/LanguageContext';
import { RequireAdminAuth } from './components/admin/RequireAdminAuth';
import { RequireModuleAccess } from './components/admin/RequireModuleAccess';

const AdminLogin = React.lazy(() =>
  import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin }))
);

const AdminLayout = React.lazy(() =>
  import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);

const GlobalExecutiveDashboard = React.lazy(() =>
  import('./components/admin/GlobalExecutiveDashboard').then((m) => ({
    default: m.GlobalExecutiveDashboard
  }))
);

const AdminInbox = React.lazy(() =>
  import('./pages/admin/AdminInbox').then((m) => ({ default: m.AdminInbox }))
);

const AdminCrm = React.lazy(() =>
  import('./pages/admin/AdminCrm').then((m) => ({ default: m.AdminCrm }))
);

const AdminProposals = React.lazy(() =>
  import('./pages/admin/AdminProposals').then((m) => ({ default: m.AdminProposals }))
);

const AdminInvoicing = React.lazy(() =>
  import('./pages/admin/AdminInvoicing').then((m) => ({ default: m.AdminInvoicing }))
);

const AdminProjects = React.lazy(() =>
  import('./pages/admin/AdminProjects').then((m) => ({ default: m.AdminProjects }))
);

const AdminApprovals = React.lazy(() =>
  import('./pages/admin/AdminApprovals').then((m) => ({ default: m.AdminApprovals }))
);

const AdminDocuments = React.lazy(() =>
  import('./pages/admin/AdminDocuments').then((m) => ({ default: m.AdminDocuments }))
);

const AdminTimeLogs = React.lazy(() =>
  import('./pages/admin/AdminTimeLogs').then((m) => ({ default: m.AdminTimeLogs }))
);

const AdminVendors = React.lazy(() =>
  import('./pages/admin/AdminVendors').then((m) => ({ default: m.AdminVendors }))
);

const AdminClients = React.lazy(() =>
  import('./pages/admin/AdminClients').then((m) => ({ default: m.AdminClients }))
);

const AdminClientRetainers = React.lazy(() =>
  import('./pages/admin/AdminClientRetainers').then((m) => ({ default: m.AdminClientRetainers }))
);

const AdminCmsProjects = React.lazy(() =>
  import('./pages/admin/AdminCmsProjects').then((m) => ({ default: m.AdminCmsProjects }))
);

const AdminCmsServices = React.lazy(() =>
  import('./pages/admin/AdminCmsServices').then((m) => ({ default: m.AdminCmsServices }))
);

const AdminCmsTestimonials = React.lazy(() =>
  import('./pages/admin/AdminCmsTestimonials').then((m) => ({
    default: m.AdminCmsTestimonials
  }))
);

const AdminSettings = React.lazy(() =>
  import('./pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings }))
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

const App = () => {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
      <LanguageProvider>
        <ScrollToTop />

        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route path="/admin" element={<ProtectedAdminRoutes />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<ModuleRoute moduleKey="dashboard" moduleLabel="the dashboard"><GlobalExecutiveDashboard /></ModuleRoute>} />
              <Route path="executive" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="inbox" element={<ModuleRoute moduleKey="inbox" moduleLabel="the inbox"><AdminInbox /></ModuleRoute>} />
              <Route path="crm" element={<ModuleRoute moduleKey="crm" moduleLabel="CRM"><AdminCrm /></ModuleRoute>} />
              <Route path="proposals" element={<ModuleRoute moduleKey="proposals" moduleLabel="proposals"><AdminProposals /></ModuleRoute>} />
              <Route path="invoicing" element={<ModuleRoute moduleKey="invoicing" moduleLabel="invoicing"><AdminInvoicing /></ModuleRoute>} />
              <Route path="projects" element={<ModuleRoute moduleKey="projects" moduleLabel="projects"><AdminProjects /></ModuleRoute>} />
              <Route path="approvals" element={<ModuleRoute moduleKey="approvals" moduleLabel="approvals"><AdminApprovals /></ModuleRoute>} />
              <Route path="documents" element={<ModuleRoute moduleKey="documents" moduleLabel="documents"><AdminDocuments /></ModuleRoute>} />
              <Route path="time-logs" element={<ModuleRoute moduleKey="timelogs" moduleLabel="time logs"><AdminTimeLogs /></ModuleRoute>} />
              <Route path="vendors" element={<ModuleRoute moduleKey="vendors" moduleLabel="vendors"><AdminVendors /></ModuleRoute>} />
              <Route path="clients" element={<Navigate to="/admin/clients/all-clients" replace />} />
              <Route path="clients/all-clients" element={<ModuleRoute moduleKey="clients" moduleLabel="clients"><AdminClients /></ModuleRoute>} />
              <Route path="clients/retainers" element={<ModuleRoute moduleKey="clients" moduleLabel="clients"><AdminClientRetainers /></ModuleRoute>} />
              <Route path="clients/sla-monitoring" element={<ModuleRoute moduleKey="clients" moduleLabel="clients"><AdminClients /></ModuleRoute>} />
              <Route path="clients/lead-accounts" element={<ModuleRoute moduleKey="clients" moduleLabel="clients"><AdminClients /></ModuleRoute>} />
              <Route path="cms/projects" element={<ModuleRoute moduleKey="cms_projects" moduleLabel="case studies"><AdminCmsProjects /></ModuleRoute>} />
              <Route path="cms/services" element={<ModuleRoute moduleKey="services" moduleLabel="the services catalog"><AdminCmsServices /></ModuleRoute>} />
              <Route path="cms/testimonials" element={<ModuleRoute moduleKey="testimonials" moduleLabel="testimonials"><AdminCmsTestimonials /></ModuleRoute>} />
              <Route path="settings" element={<ModuleRoute moduleKey="settings" moduleLabel="settings"><AdminSettings /></ModuleRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </Suspense>
        </LanguageProvider>
      </MotionConfig>
    </BrowserRouter>
  );
};

export default App;