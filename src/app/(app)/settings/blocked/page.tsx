'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PersonRow } from '@/components/features/person-row';
import { useBlockedUsers, useUnblock } from '@/hooks/use-settings';

export default function BlockedPage() {
  const { data } = useBlockedUsers();
  const unblock = useUnblock();
  const rows = data?.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/settings"><ArrowLeft size={22} /></Link>
        <h1 className="font-display text-[length:var(--text-title)] font-semibold">Blocked</h1>
      </div>
      {rows.length === 0 ? (
        <div className="card p-10 text-center text-ink-soft">You haven&apos;t blocked anyone.</div>
      ) : (
        <div className="card px-5">
          {rows.map((u) => (
            <PersonRow key={u.username} {...u}
              action={<Button variant="ghost" className="h-9 px-4 text-[13px]"
                loading={unblock.isPending} onClick={() => unblock.mutate(u.username)}>Unblock</Button>} />
          ))}
        </div>
      )}
    </div>
  );
}