'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError, api } from '@/lib/api';
import { useSessionStore } from '@/stores/session';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // sockets keep truth fresh; polling is the fallback, not the plan
            retry: (failureCount, error) => {
              // Never retry 4xx — a 404 is an answer, not a flake.
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
    api<{ data: { accessToken: string; user: never } }>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    })
      .then((json) => {
        const { accessToken, user } = json.data as { accessToken: string; user: SessionBootUser };
        useSessionStore.getState().setSession(accessToken, user);
      })
      .catch(() => useSessionStore.getState().setGuest());
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

interface SessionBootUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}