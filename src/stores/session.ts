import { create } from 'zustand';

interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface SessionState {
  accessToken: string | null;
  user: SessionUser | null;
  status: 'unknown' | 'authenticated' | 'guest';
  setSession: (token: string, user: SessionUser) => void;
  clearSession: () => void;
  setGuest: () => void;
}

/**
 * The access token lives HERE — in memory — and nowhere else. Never
 * localStorage (XSS-readable), never a cookie we set (the refresh token's
 * httpOnly cookie is the only persistence, and the browser owns it).
 * Page reload → token gone → the boot refresh (FE1.4) restores the
 * session from the cookie. Amnesia by design.
 */
export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  user: null,
  status: 'unknown',
  setSession: (accessToken, user) => set({ accessToken, user, status: 'authenticated' }),
  clearSession: () => set({ accessToken: null, user: null, status: 'guest' }),
  setGuest: () => set({ status: 'guest' }),
}));