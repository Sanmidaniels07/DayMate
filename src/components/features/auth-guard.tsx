'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/stores/session';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useSessionStore((s) => s.status);

  useEffect(() => {
    if (status === 'guest') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </main>
    );
  }
  return <>{children}</>;
}