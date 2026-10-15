import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAdminSession } from '../../lib/adminAuth';
import {
  canAccessAmsRoute,
  getAmsHomePath,
  getAmsRole,
  getDeniedRouteRedirect,
} from '../../lib/amsNavigationAccess';

interface RequireModuleAccessProps {
  moduleKey: string;
  moduleLabel?: string;
  children: React.ReactNode;
}

/**
 * Route-level policy adapter. The parent AmsRoleRouteGuard redirects before
 * rendering the shell; this guard keeps each lazy module protected as well.
 * Server-side API permissions remain authoritative for data and mutations.
 */
export const RequireModuleAccess: React.FC<RequireModuleAccessProps> = ({
  moduleKey,
  moduleLabel = 'this page',
  children,
}) => {
  const location = useLocation();
  const session = getAdminSession();
  const role = getAmsRole(session?.user?.role);
  const params = new URLSearchParams(location.search);

  // MFA self-enrolment is a self-service exception, not general Settings access.
  const isRequiredMfaEnrollmentRoute = Boolean(session?.user)
    && session?.user?.mfaEnabled !== true
    && location.pathname === '/admin/settings'
    && params.get('tab') === 'security';

  if (isRequiredMfaEnrollmentRoute || canAccessAmsRoute(role, location.pathname, location.search)) {
    return <>{children}</>;
  }

  const destination = getDeniedRouteRedirect(role, location.pathname, location.search) || getAmsHomePath(role);
  return (
    <Navigate
      to={destination}
      replace
      state={{ deniedModule: moduleKey, deniedLabel: moduleLabel, deniedPath: location.pathname + location.search }}
    />
  );
};

export default RequireModuleAccess;
