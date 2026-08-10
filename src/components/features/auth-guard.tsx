'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSessionStore } from '@/stores/session';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useSessionStore((s) => s.status);
  const hasProfile = useSessionStore((s) => s.user?.hasProfile);

  useEffect(() => {
    if (status === 'guest') router.replace('/login');
    if (status === 'authenticated' && hasProfile === false && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [status, hasProfile, pathname, router]);

  if (status !== 'authenticated') {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </main>
    );
  }
  return <>{children}</>;
}