import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores/auth';
import { useEffect } from 'react';
import type { ReactElement } from 'react';
import Spinner from '../ui/Spinner';

export default function RequireAuth({ children }: { children: ReactElement }) {
  const { session, status, hydrateProfile, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (session && status === 'idle') {
      hydrateProfile().catch(() => {
        logout();
      });
    }
  }, [session, status]);

  if (!session) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner size={28} />
      </div>
    );
  }
  return children;
}
