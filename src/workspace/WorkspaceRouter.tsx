import React from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { RequireAdminAuth } from '../components/admin/RequireAdminAuth';
import { getAdminSession } from '../lib/adminAuth';
import { ActionButton, StatusBadge, WorkspacePage } from './WorkspacePrimitives';
import { WorkspaceLayout } from './WorkspaceLayout';
import {
  canAccessWorkspaceRoute,
  normalizeWorkspaceRole,
  workspaceLandingPath,
  WorkspaceRole,
  WorkspaceRouteKey,
} from './workspaceAccess';
import { ExecutiveOverviewView, PersonalWorkspaceView, ActivityStreamView } from './WorkspaceDashboardViews';
import { SalesPipelineView, ClientDirectoryView, ClientOnboardingView } from './WorkspaceCrmViews';
import { ProjectHubView, TaskDeliverablesView, RetainerManagerView } from './WorkspaceProjectViews';
import { QuotationBuilderView, InvoiceLedgerView, ExpenseVendorLedgerView, ProjectProfitabilityView } from './WorkspaceFinanceViews';
import { CmsEditorialView, SystemSettingsView } from './WorkspaceGovernanceViews';

interface GuardedWorkspaceViewProps {
  routeKey: WorkspaceRouteKey;
}

const WorkspaceAccessDenied: React.FC<{ role: WorkspaceRole | null; routeKey: WorkspaceRouteKey }> = ({ role, routeKey }) => {
  const navigate = useNavigate();
  const session = getAdminSession();
  const rawRole = typeof session?.user?.role === 'string' ? session.user.role : 'not assigned';
  const destination = role ? workspaceLandingPath(role) : '/admin/dashboard';
  return (
    <WorkspacePage slug="workspace-access-denied" title="Access restricted" description="This page is not available to the active role." preview={false}>
      <section className="mx-auto grid w-full max-w-xl justify-items-center rounded-card border border-line bg-panel p-6 text-center sm:p-8" role="alert">
        <span className="flex h-10 w-10 items-center justify-center rounded-control border border-warning/25 bg-warning/10 text-warning"><span aria-hidden="true">!</span></span>
        <h2 className="mt-4 text-[15px] font-semibold text-fg">You do not have access to this workspace view.</h2>
        <p className="mt-2 text-[12px] leading-5 text-muted">The route guard blocked <span className="font-medium text-fg">{routeKey}</span>. No restricted view component was rendered.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2"><StatusBadge tone="neutral">Active role: {role || rawRole}</StatusBadge></div>
        {!role && <p className="mt-3 text-[11px] leading-5 text-muted">The current role label does not match one of the supported AMS workspace roles. Ask an administrator to map the account to Admin, Finance, PM, Creative or Freelancer.</p>}
        <ActionButton variant="primary" className="mt-5" onClick={() => navigate(destination, { replace: true })}>Return to an allowed workspace</ActionButton>
      </section>
    </WorkspacePage>
  );
};

const GuardedWorkspaceView: React.FC<GuardedWorkspaceViewProps> = ({ routeKey }) => {
  const session = getAdminSession();
  const role = normalizeWorkspaceRole(typeof session?.user?.role === 'string' ? session.user.role : null);
  if (!canAccessWorkspaceRoute(role, routeKey)) {
    return <WorkspaceAccessDenied role={role} routeKey={routeKey} />;
  }

  switch (routeKey) {
    case 'executive-overview':
      return <ExecutiveOverviewView />;
    case 'personal-workspace':
      return <PersonalWorkspaceView role={role} />;
    case 'activity-stream':
      return <ActivityStreamView />;
    case 'sales-pipeline':
      return <SalesPipelineView role={role} />;
    case 'client-directory':
      return <ClientDirectoryView />;
    case 'client-onboarding':
      return <ClientOnboardingView />;
    case 'project-hub':
      return <ProjectHubView role={role} />;
    case 'task-engine':
      return <TaskDeliverablesView role={role} />;
    case 'retainer-manager':
      return <RetainerManagerView />;
    case 'quotation-builder':
      return <QuotationBuilderView />;
    case 'invoice-ledger':
      return <InvoiceLedgerView />;
    case 'expense-ledger':
      return <ExpenseVendorLedgerView />;
    case 'project-profitability':
      return <ProjectProfitabilityView role={role} />;
    case 'cms-editorial':
      return <CmsEditorialView role={role} />;
    case 'system-settings':
      return <SystemSettingsView />;
    default:
      return <WorkspaceAccessDenied role={role} routeKey={routeKey} />;
  }
};

const WorkspaceRouteSwitch: React.FC = () => {
  const session = getAdminSession();
  const role = normalizeWorkspaceRole(typeof session?.user?.role === 'string' ? session.user.role : null);
  const landing = workspaceLandingPath(role).replace('/workspace/', '');
  return (
    <Routes>
      <Route element={<WorkspaceLayout />}>
        <Route index element={<Navigate to={landing} replace />} />
        <Route path="dashboard/overview" element={<GuardedWorkspaceView routeKey="executive-overview" />} />
        <Route path="dashboard/my-hub" element={<GuardedWorkspaceView routeKey="personal-workspace" />} />
        <Route path="dashboard/activity" element={<GuardedWorkspaceView routeKey="activity-stream" />} />
        <Route path="crm/pipeline" element={<GuardedWorkspaceView routeKey="sales-pipeline" />} />
        <Route path="crm/clients" element={<GuardedWorkspaceView routeKey="client-directory" />} />
        <Route path="crm/onboarding" element={<GuardedWorkspaceView routeKey="client-onboarding" />} />
        <Route path="projects/hub" element={<GuardedWorkspaceView routeKey="project-hub" />} />
        <Route path="projects/tasks" element={<GuardedWorkspaceView routeKey="task-engine" />} />
        <Route path="projects/retainers" element={<GuardedWorkspaceView routeKey="retainer-manager" />} />
        <Route path="finance/quotes" element={<GuardedWorkspaceView routeKey="quotation-builder" />} />
        <Route path="finance/invoices" element={<GuardedWorkspaceView routeKey="invoice-ledger" />} />
        <Route path="finance/ledger" element={<GuardedWorkspaceView routeKey="expense-ledger" />} />
        <Route path="finance/profitability" element={<GuardedWorkspaceView routeKey="project-profitability" />} />
        <Route path="cms/editorial" element={<GuardedWorkspaceView routeKey="cms-editorial" />} />
        <Route path="settings" element={<GuardedWorkspaceView routeKey="system-settings" />} />
        <Route path="*" element={<Navigate to={workspaceLandingPath(role)} replace />} />
      </Route>
    </Routes>
  );
};

export const WorkspaceRouter: React.FC = () => (
  <RequireAdminAuth>
    <WorkspaceRouteSwitch />
  </RequireAdminAuth>
);

export default WorkspaceRouter;
