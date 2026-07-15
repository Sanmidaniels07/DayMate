'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useMyProfile, useUpdateProfile } from '@/hooks/use-settings';

export default function PrivacyPage() {
  const { data } = useMyProfile();
  const update = useUpdateProfile();
  const p = data?.data;
  const set = (key: string, v: boolean | string) => update.mutate({ [key]: v });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/settings"><ArrowLeft size={22} /></Link>
        <h1 className="font-display text-[length:var(--text-title)] font-semibold">Privacy</h1>
      </div>

      <div className="card px-5">
        <p className="pt-4 text-[13px] font-semibold uppercase tracking-wide text-ink-faint">Who can see my profile</p>
        <div className="flex flex-col gap-2 py-3">
          {(['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE'] as const).map((v) => (
            <button key={v} onClick={() => set('visibility', v)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-[15px] ${
                p?.visibility === v ? 'border-accent bg-[var(--accent-soft)]' : 'border-[var(--hairline)]'
              }`}>
              {v === 'PUBLIC' ? 'Everyone' : v === 'FRIENDS_ONLY' ? 'Friends only' : 'Private'}
              {p?.visibility === v && <span className="text-accent">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {p && (
        <div className="card divide-y divide-[var(--hairline)] px-5">
          <Toggle label="Show my age" checked={p.showAge} onChange={(v) => set('showAge', v)} />
          <Toggle label="Show birth year" checked={p.showBirthYear} onChange={(v) => set('showBirthYear', v)} />
          <Toggle label="Show my location" checked={p.showLocation} onChange={(v) => set('showLocation', v)} />
          <Toggle label="Show when I'm online" checked={p.showOnlineStatus} onChange={(v) => set('showOnlineStatus', v)} />
        </div>
      )}
    </div>
  );
}