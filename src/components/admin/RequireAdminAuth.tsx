import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { cacheAdminSession } from '../../lib/adminAuth';

import Skeleton from './Skeleton';
interface RequireAdminAuthProps {
  children: React.ReactNode;
}

export const RequireAdminAuth: React.FC<RequireAdminAuthProps> = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');

  useEffect(() => {
    let mounted = true;
    let rememberMe = false;

    const handleAuthStateChanged = () => {
      if (mounted) setStatus('unauthenticated');
    };
    window.addEventListener('kapitech_auth_state_changed', handleAuthStateChanged);

    try {
      const raw =
        sessionStorage.getItem('kapitech_admin_profile_v2') ||
        localStorage.getItem('kapitech_admin_profile_v2');
      if (raw) rememberMe = Boolean(JSON.parse(raw)?.rememberMe);
    } catch {
      rememberMe = false;
    }

    api.auth.me().then((res) => {
      if (!mounted) return;
      if (res.success && res.data?.success && res.data.user) {
        cacheAdminSession(res.data.user, rememberMe);

        const needsMfa = res.data.user.mfaEnabled !== true;
        const isMfaSetupRoute =
          location.pathname === '/admin/settings' &&
          new URLSearchParams(location.search).get('tab') === 'security';

        if (needsMfa && !isMfaSetupRoute) {
          setStatus('authenticated');
          window.location.replace('/admin/settings?tab=security&mfaRequired=1');
          return;
        }

        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
      }
    }).catch(() => {
      if (mounted) setStatus('unauthenticated');
    });

    return () => {
      mounted = false;
      window.removeEventListener('kapitech_auth_state_changed', handleAuthStateChanged);
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-bg text-fg flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-[640px] space-y-3" role="status" aria-label="Verifying server session">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return <>{children}</>;
};

export default RequireAdminAuth;
