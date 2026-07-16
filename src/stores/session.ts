import { create } from "zustand";

interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  username?: string;
}

interface SessionState {
  accessToken: string | null;
  user: SessionUser | null;
  status: "unknown" | "authenticated" | "guest";
  setSession: (token: string, user: SessionUser) => void;
  clearSession: () => void;
  setGuest: () => void;
  setUsername: (username: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  user: null,
  status: "unknown",
  setSession: (accessToken, user) =>
    set({ accessToken, user, status: "authenticated" }),
  clearSession: () => set({ accessToken: null, user: null, status: "guest" }),
  setGuest: () => set({ status: "guest" }),
  setUsername: (username) =>
    set((s) => (s.user ? { user: { ...s.user, username } } : s)),
}));
