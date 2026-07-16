'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const { status } = useSessionStore.getState();
    if (status !== 'unknown') return;
    api<{ data: { accessToken: string; user: SessionBootUser } }>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    })
      .then((json) => {
        const { accessToken, user } = json.data;
        useSessionStore.getState().setSession(accessToken, user);
        connectSocket(); // ← revive the real-time socket for reload-restored sessions
      })
      .catch(() => useSessionStore.getState().setGuest());
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}