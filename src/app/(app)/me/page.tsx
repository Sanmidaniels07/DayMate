'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMyProfile } from '@/hooks/use-settings';

export default function MePage() {
  const router = useRouter();
  const { data } = useMyProfile();

  useEffect(() => {
    if (data?.data.username) router.replace(`/u/${data.data.username}`);
  }, [data, router]);

  return (
    <div className="flex justify-center py-16">
      <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}