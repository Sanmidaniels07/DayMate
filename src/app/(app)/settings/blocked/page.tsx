'use client';
import Link from 'next/link';
import { ArrowLeft, ShieldOff } from 'lucide-react';
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
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-[var(--surface-raised)] text-ink-faint">
            <ShieldOff size={24} />
          </div>
          <div>
            <p className="text-[15px] font-semibold">No blocked users</p>
            <p className="mt-1 text-[13px] text-ink-faint">People you block will show up here.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="px-1 text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
            {rows.length} blocked
          </p>
          <div className="card divide-y divide-[var(--hairline)] px-5">
            {rows.map((u) => (
              <PersonRow
                key={u.username}
                {...u}
                action={
                  <Button
                    variant="ghost"
                    className="h-9 px-4 text-[13px]"
                    loading={unblock.isPending}
                    onClick={() => unblock.mutate(u.username)}
                  >
                    Unblock
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}