import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAdminSession } from '../../lib/adminAuth';
import {
  canAccessAmsRoute,
  getAmsHomePath,
  getAmsRole,
  getDeniedRouteRedirect,
} from '../../lib/amsNavigationAccess';

interface AmsRoleRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Navigation and route-level guard for the five AMS workspace roles.
 * RequireAdminAuth runs first and refreshes the cached profile from /api/auth/me.
 * API authorization remains server-enforced; this guard controls the client route tree.
 */
export const AmsRoleRouteGuard: React.FC<AmsRoleRouteGuardProps> = ({ children }) => {
  const location = useLocation();
  const role = getAmsRole(getAdminSession()?.user?.role);

  if (canAccessAmsRoute(role, location.pathname, location.search)) {
    return <>{children}</>;
  }

  const redirect = getDeniedRouteRedirect(role, location.pathname, location.search) || getAmsHomePath(role);
  const currentLocation = location.pathname + location.search + location.hash;

  if (redirect === currentLocation) {
    return <Navigate to={getAmsHomePath(role)} replace />;
  }

  return <Navigate to={redirect} replace state={{ deniedPath: currentLocation }} />;
};

export default AmsRoleRouteGuard;
