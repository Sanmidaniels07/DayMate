'use client';

import { useEffect, useState, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError, api } from '@/lib/api';
import { useSessionStore } from '@/stores/session';
import { connectSocket } from '@/lib/socket';

interface SessionBootUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status < 500) return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );

  const booted = useRef(false);

  useEffect(() => {
    // Strict Mode fires effects twice in dev — refresh once only, or the second
    // call re-presents the just-rotated token and trips reuse-detection (401).
    if (booted.current) return;
    booted.current = true;

    const boot = () => {
      const { status, refreshToken } = useSessionStore.getState();
      if (status !== 'unknown') return;

      api<{ data: { accessToken: string; refreshToken?: string; user: SessionBootUser } }>('/auth/refresh', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      })
        .then((json) => {
          const { accessToken, refreshToken: rotated, user } = json.data;
          useSessionStore.getState().setSession(accessToken, user, rotated);
          connectSocket();
        })
        .catch(() => useSessionStore.getState().setGuest());
    };

    if (useSessionStore.persist.hasHydrated()) {
      boot();
    } else {
      const unsub = useSessionStore.persist.onFinishHydration(boot);
      return unsub;
    }
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}