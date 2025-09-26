import Navbar from './Navbar';
import { useAuth } from '../../stores/auth';
import AppHeader from '../navigation/AppHeader';
import { useLocation } from 'react-router-dom';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const authed = !!session && !!user;
  const { pathname } = useLocation();
  const hideHeader = pathname.startsWith('/onboarding') || pathname.startsWith('/oauth');
  return (
    <div className="min-h-screen bg-surface">
      {authed && <Navbar />}
      {authed && !hideHeader && <AppHeader />}
      <main>{children}</main>
    </div>
  );
}
