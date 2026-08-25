'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSessionStore } from '@/stores/session';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useSessionStore((s) => s.status);
  const onboardingComplete = useSessionStore((s) => s.user?.onboardingComplete);

  useEffect(() => {
    if (status === 'guest') {
      router.replace('/login');
      return;
    }

    if (status === 'authenticated') {
      // Not finished onboarding → must be on /onboarding
      if (onboardingComplete === false && pathname !== '/onboarding') {
        router.replace('/onboarding');
        return;
      }

      // Already finished → keep them out of /onboarding
      if (onboardingComplete === true && pathname === '/onboarding') {
        router.replace('/home');
      }
    }
  }, [status, onboardingComplete, pathname, router]);

  if (status !== 'authenticated') {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </main>
    );
  }

  return <>{children}</>;
}