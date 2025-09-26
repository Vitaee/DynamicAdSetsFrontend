import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types/auth';
import { apiRegister, apiLogin, apiProfile } from '../api/auth';
import { clearTokens, setAccessToken, setRefreshToken } from '../lib/tokenStorage';

type Session = { accessToken: string; refreshToken: string } | null;

type AuthState = {
  user: AuthUser | null;
  session: Session;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  error?: string | null;
  register: (input: { name: string; companyName?: string; email: string; password: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  hydrateProfile: () => Promise<void>;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      status: 'idle',
      error: null,
      async register(input) {
        set({ status: 'loading', error: null });
        const { name, email, password } = input;
        const res = await apiRegister({ name, email, password });
        setAccessToken(res.token); setRefreshToken(res.refreshToken);
        set({ user: res.user, session: { accessToken: res.token, refreshToken: res.refreshToken }, status: 'authenticated' });
      },
      async login(input) {
        set({ status: 'loading', error: null });
        const res = await apiLogin(input);
        setAccessToken(res.token); setRefreshToken(res.refreshToken);
        set({ user: res.user, session: { accessToken: res.token, refreshToken: res.refreshToken }, status: 'authenticated' });
      },
      logout() {
        clearTokens();
        set({ user: null, session: null, status: 'idle' });
      },
      async hydrateProfile() {
        try {
          const { session } = get();
          if (!session) return;
          set({ status: 'loading' });
          const res = await apiProfile();
          set({ user: res.user, status: 'authenticated' });
        } catch (e) {
          // If authentication fails (401/403), clear invalid tokens
          if ((e as { status?: number })?.status === 401 || (e as { status?: number })?.status === 403) {
            clearTokens();
            set({ user: null, session: null, status: 'idle', error: null });
            return;
          }
          set({ status: 'error', error: e instanceof Error ? e.message : 'Profile load failed' });
        }
      },
    }),
    {
      name: 'wt:auth',
      partialize: (s) => ({ session: s.session, user: s.user }),
    }
  )
);
