'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { useNotificationPrefs, useUpdatePrefs } from '@/hooks/use-settings';
import { enablePush } from '@/hooks/use-push';

export default function NotifSettingsPage() {
  const { data } = useNotificationPrefs();
  const update = useUpdatePrefs();
  const p = data?.data;
  const [pushState, setPushState] = useState<string>('');
  const set = (key: string, v: boolean) => update.mutate({ [key]: v });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/settings"><ArrowLeft size={22} /></Link>
        <h1 className="font-display text-[length:var(--text-title)] font-semibold">Notifications</h1>
      </div>

      <div className="card flex flex-col gap-2 p-5">
        <p className="text-[15px] font-medium">Push notifications</p>
        <p className="text-[13px] text-ink-soft">Get alerts even when DayMate is closed.</p>
        <Button variant="ghost" className="mt-2 self-start"
          onClick={async () => setPushState(await enablePush())}>
          {pushState === 'granted' ? 'Enabled ✓' : pushState === 'denied' ? 'Blocked in browser' : 'Enable push'}
        </Button>
      </div>

      {p && (
        <div className="card divide-y divide-[var(--hairline)] px-5">
          <Toggle label="Messages" checked={p.pushMessages} onChange={(v) => set('pushMessages', v)} />
          <Toggle label="Calls" checked={p.pushCalls} onChange={(v) => set('pushCalls', v)} />
          <Toggle label="Birthdays" checked={p.pushBirthdays} onChange={(v) => set('pushBirthdays', v)} />
          <Toggle label="Friends & social" checked={p.pushSocial} onChange={(v) => set('pushSocial', v)} />
          <Toggle label="Email: birthday digest" checked={p.emailBirthdayDigest} onChange={(v) => set('emailBirthdayDigest', v)} />
          <Toggle label="Email: friend requests" checked={p.emailFriendRequests} onChange={(v) => set('emailFriendRequests', v)} />
        </div>
      )}
    </div>
  );
}