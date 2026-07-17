'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BellRing } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useNotificationPrefs, useUpdatePrefs } from '@/hooks/use-settings';
import { enablePush, disablePush, isPushEnabled } from '@/hooks/use-push';

export default function NotifSettingsPage() {
  const { data } = useNotificationPrefs();
  const update = useUpdatePrefs();
  const p = data?.data;
  const set = (key: string, v: boolean) => update.mutate({ [key]: v });

  const [pushOn, setPushOn] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  // Read the real subscription state on load (survives reloads)
  useEffect(() => {
    isPushEnabled().then(setPushOn);
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') setBlocked(true);
  }, []);

  const togglePush = async () => {
    if (blocked) return;
    setBusy(true);
    try {
      if (pushOn) {
        await disablePush();
        setPushOn(false);
      } else {
        const result = await enablePush();
        if (result === 'granted') setPushOn(true);
        else if (result === 'denied') setBlocked(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/settings"><ArrowLeft size={22} /></Link>
        <h1 className="font-display text-[length:var(--text-title)] font-semibold">Notifications</h1>
      </div>

      <div className="card flex items-center gap-4 p-5">
        <div className={`grid size-11 shrink-0 place-items-center rounded-full ${
          pushOn ? 'bg-[var(--success)]/12 text-[var(--success)]' : 'bg-[var(--accent-soft)] text-accent'
        }`}>
          <BellRing size={20} />
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-semibold">Push notifications</p>
          <p className="text-[13px] text-ink-soft">
            {blocked
              ? 'Blocked in your browser settings.'
              : pushOn
              ? 'On — you\u2019ll get alerts even when DayMate is closed.'
              : 'Get alerts even when DayMate is closed.'}
          </p>
        </div>
        <button
          onClick={togglePush}
          disabled={busy || blocked}
          className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
            blocked
              ? 'bg-[var(--surface-raised)] text-danger'
              : pushOn
              ? 'bg-[var(--surface-raised)] text-ink-soft border border-[var(--hairline)]'
              : 'bg-accent text-white active:opacity-80'
          }`}
        >
          {busy ? '…' : blocked ? 'Blocked' : pushOn ? 'Disable' : 'Enable'}
        </button>
      </div>

      {p && (
        <>
          <div className="flex flex-col gap-2">
            <p className="px-1 text-[12px] font-semibold uppercase tracking-wider text-ink-faint">Push</p>
            <div className="card divide-y divide-[var(--hairline)] px-5">
              <Toggle label="Messages" checked={p.pushMessages} onChange={(v) => set('pushMessages', v)} />
              <Toggle label="Calls" checked={p.pushCalls} onChange={(v) => set('pushCalls', v)} />
              <Toggle label="Birthdays" checked={p.pushBirthdays} onChange={(v) => set('pushBirthdays', v)} />
              <Toggle label="Friends & social" checked={p.pushSocial} onChange={(v) => set('pushSocial', v)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="px-1 text-[12px] font-semibold uppercase tracking-wider text-ink-faint">Email</p>
            <div className="card divide-y divide-[var(--hairline)] px-5">
              <Toggle label="Birthday digest" checked={p.emailBirthdayDigest} onChange={(v) => set('emailBirthdayDigest', v)} />
              <Toggle label="Friend requests" checked={p.emailFriendRequests} onChange={(v) => set('emailFriendRequests', v)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}