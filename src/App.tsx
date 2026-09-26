import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { LanguageProvider } from './lib/LanguageContext';
import { RequireAdminAuth } from './components/admin/RequireAdminAuth';

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
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const ProtectedAdminRoutes = () => (
  <RequireAdminAuth>
    <AdminLayout />
  </RequireAdminAuth>
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
              <Route path="dashboard" element={<GlobalExecutiveDashboard />} />
              <Route path="executive" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="inbox" element={<AdminInbox />} />
              <Route path="crm" element={<AdminCrm />} />
              <Route path="proposals" element={<AdminProposals />} />
              <Route path="invoicing" element={<AdminInvoicing />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="approvals" element={<AdminApprovals />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="time-logs" element={<AdminTimeLogs />} />
              <Route path="vendors" element={<AdminVendors />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="cms/projects" element={<AdminCmsProjects />} />
              <Route path="cms/services" element={<AdminCmsServices />} />
              <Route path="cms/testimonials" element={<AdminCmsTestimonials />} />
              <Route path="settings" element={<AdminSettings />} />
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