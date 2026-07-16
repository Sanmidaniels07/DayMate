'use client';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useMyProfile, useUpdateProfile } from '@/hooks/use-settings';
import { useAutoJoin } from '@/hooks/use-communities';

const VISIBILITY = [
  { value: 'PUBLIC', label: 'Everyone' },
  { value: 'FRIENDS_ONLY', label: 'Friends' },
  { value: 'PRIVATE', label: 'Private' },
] as const;

export default function PrivacyPage() {
  const { data } = useMyProfile();
  const update = useUpdateProfile();
  const autoJoin = useAutoJoin();
  const p = data?.data;
  const set = (key: string, v: boolean | string) => update.mutate({ [key]: v });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/settings"><ArrowLeft size={22} /></Link>
        <h1 className="font-display text-[length:var(--text-title)] font-semibold">Privacy</h1>
      </div>

      <div className="card p-5">
        <p className="pb-3 text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
          Who can see my profile
        </p>
        <div className="flex gap-1 rounded-xl bg-[var(--surface-raised)] p-1">
          {VISIBILITY.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => set('visibility', value)}
              className={`flex-1 rounded-lg py-2 text-[13px] font-semibold transition-all ${
                p?.visibility === value
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-ink-soft active:opacity-60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {p && (
        <div className="flex flex-col gap-2">
          <p className="px-1 text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
            Profile details
          </p>
          <div className="card divide-y divide-[var(--hairline)] px-5">
            <Toggle label="Show my age" checked={p.showAge} onChange={(v) => set('showAge', v)} />
            <Toggle label="Show birth year" checked={p.showBirthYear} onChange={(v) => set('showBirthYear', v)} />
            <Toggle label="Show my location" checked={p.showLocation} onChange={(v) => set('showLocation', v)} />
            <Toggle label="Show when I'm online" checked={p.showOnlineStatus} onChange={(v) => set('showOnlineStatus', v)} />
          </div>
        </div>
      )}

      {p && 'autoJoinCommunities' in p && (
        <div className="flex flex-col gap-2">
          <p className="px-1 text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
            Birthday circles
          </p>
          <div className="card px-5">
            <Toggle
              label="Auto-join my birthday circles"
              description="Automatically join communities for your birthday, month, and age group."
              checked={(p as { autoJoinCommunities?: boolean }).autoJoinCommunities ?? true}
              onChange={(v) => autoJoin.mutate(v)}
            />
          </div>
        </div>
      )}
    </div>
  );
}