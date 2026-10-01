import React from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminSession, isMasterAdministrator } from '../../lib/adminAuth';
import { useRbacRole } from '../../lib/rbacEngine';

interface RequireModuleAccessProps {
  moduleKey: string;
  moduleLabel?: string;
  children: React.ReactNode;
}

export const RequireModuleAccess: React.FC<RequireModuleAccessProps> = ({
  moduleKey,
  moduleLabel = 'this page',
  children
}) => {
  const session = getAdminSession();
  const { isAllowed } = useRbacRole(
    session?.user?.stakeholderType,
    session?.user?.division,
    session?.user?.role,
    session?.user?.permissions
  );

  if (session?.user && isMasterAdministrator(session.user)) return <>{children}</>;
  if (isAllowed(moduleKey)) return <>{children}</>;

  return (
    <div className="flex min-h-[320px] items-center justify-center py-10">
      <section
        className="w-full max-w-lg rounded-card border border-line bg-panel p-6 text-center"
        aria-labelledby="ams-access-denied-title"
      >
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-control border border-danger/20 bg-danger/10 text-danger">
          <ShieldAlert size={18} aria-hidden="true" />
        </div>
        <h1 id="ams-access-denied-title" className="mt-4 text-base font-semibold text-fg">
          You don't have access to {moduleLabel}.
        </h1>
        <p className="mt-2 text-xs leading-5 text-muted">
          This module is restricted by your current AMS access policy.
        </p>
        <Link
          to="/admin/dashboard"
          className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-accent px-3 text-xs font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to dashboard
        </Link>
      </section>
    </div>
  );
};

export default RequireModuleAccess;
