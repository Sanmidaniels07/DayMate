import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  username: string | null;
  hasProfile: boolean;
  onboardingComplete?: boolean;
  onboardingStep?: number;
}

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  status: "unknown" | "authenticated" | "guest";
  setSession: (token: string, user: SessionUser, refreshToken?: string) => void;
  clearSession: () => void;
  setGuest: () => void;
  setUsername: (username: string) => void;
  setOnboardingComplete: (value: boolean) => void;
  setOnboardingStep: (step: number) => void;
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
          refreshToken: refreshToken ?? s.refreshToken,
        })),
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          status: "guest",
        }),
      setGuest: () => set({ status: "guest" }),
      setUsername: (username) =>
        set((s) =>
          s.user ? { user: { ...s.user, username, hasProfile: true } } : s,
        ),
      setOnboardingComplete: (
        value, 
      ) =>
        set((s) =>
          s.user ? { user: { ...s.user, onboardingComplete: value } } : s,
        ),
      setOnboardingStep: (step) =>
        set((s) =>
          s.user
            ? {
                user: {
                  ...s.user,
                  onboardingStep: Math.max(s.user.onboardingStep ?? 1, step),
                },
              }
            : s,
        ),
    }),
    {
      name: "bday-auth",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ refreshToken: s.refreshToken }),
    },
  ),
);
