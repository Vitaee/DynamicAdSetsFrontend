import Logo from '../Logo';
import ThemeToggle from '../ThemeToggle';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useAuth } from '../../stores/auth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';

export default function Navbar() {
  const { user, logout, session } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full wt-navbar">
      <div className="container-narrow flex h-14 items-center gap-4">
        <button
          onClick={() => {
            if (session) navigate('/dashboard');
            else navigate('/');
          }}
          className="flex items-center cursor-pointer focus-ring rounded-md p-1"
          aria-label="Home"
        >
          <Logo />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="relative">
            <button onClick={() => setOpen((o) => !o)} className="rounded-full p-1 hover:bg-surface-hover cursor-pointer focus-ring">
              <Avatar name={user?.name || user?.email} />
            </button>
            <div className={cn('absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-default bg-surface-elevated shadow-md', open ? 'block' : 'hidden')}>
              <div className="px-3 py-2 text-sm text-muted font-medium">{user?.email}</div>
              <div className="border-t border-subtle" />
              <div className="p-2">
                <Button
                  variant="ghost"
                  className="w-full text-left"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
