import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  username: string | null;
}

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;   // ← persisted fallback for cross-domain
  user: SessionUser | null;
  status: "unknown" | "authenticated" | "guest";
  setSession: (token: string, user: SessionUser, refreshToken?: string) => void;
  clearSession: () => void;
  setGuest: () => void;
  setUsername: (username: string) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      status: "unknown",
      setSession: (accessToken, user, refreshToken) =>
        set((s) => ({
          accessToken,
          user,
          status: "authenticated",
          refreshToken: refreshToken ?? s.refreshToken, // keep existing if not provided
        })),
      clearSession: () =>
        set({ accessToken: null, refreshToken: null, user: null, status: "guest" }),
      setGuest: () => set({ status: "guest" }),
      setUsername: (username) =>
        set((s) => (s.user ? { user: { ...s.user, username } } : s)),
    }),
    {
      name: "bday-auth",
      storage: createJSONStorage(() => sessionStorage),
      // Only the refresh token survives reload — NOT accessToken/user/status.
      partialize: (s) => ({ refreshToken: s.refreshToken }),
    },
  ),
);