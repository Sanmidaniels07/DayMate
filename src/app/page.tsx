'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/stores/session';

export default function RootPage() {
  const router = useRouter();
  const status = useSessionStore((s) => s.status);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/home');
    else if (status === 'guest') router.replace('/login');
  }, [status, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </main>
  );
}