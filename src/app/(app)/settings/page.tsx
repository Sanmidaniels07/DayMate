'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, User, Shield, Bell, Ban, LogOut, Flag } from 'lucide-react';
import { api } from '@/lib/api';
import { useSessionStore } from '@/stores/session';
import { disconnectSocket } from '@/lib/socket';
import { useMyProfile } from '@/hooks/use-settings';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { label } from 'framer-motion/client';

const GROUPS = [
  {
    label: 'Account',
    links: [{ href: '/me/edit', label: 'Edit profile', icon: User }],
  },
  {
    label: 'Privacy & safety',
    links: [
      { href: '/settings/privacy', label: 'Privacy', icon: Shield },
      { href: '/settings/blocked', label: 'Blocked users', icon: Ban },
    ],
  },
  {
    label: 'Preferences',
    links: [{ href: '/settings/notifications', label: 'Notifications', icon: Bell }],
  },
  
  {
    label: 'My Reports',
    
    links: [{href: '/settings/reports', label: 'My reports', icon: Flag }],

  }

];

export default function SettingsPage() {
  const router = useRouter();
  const { data } = useMyProfile();
  const p = data?.data;

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    disconnectSocket();
    useSessionStore.getState().clearSession();
    router.replace('/login');
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[length:var(--text-title)] font-semibold">Settings</h1>

      {/* Profile snapshot */}
      <Link
        href="/me/edit"
        className="card flex items-center gap-3 p-4 transition-colors active:bg-[var(--surface-raised)]"
      >
        <BlobAvatar name={p?.displayName ?? ''} tint={p?.blobTint} avatarUrl={p?.avatarUrl} size={52} />
        <div className="flex-1 min-w-0">
          <p className="truncate text-[15px] font-semibold">{p?.displayName ?? 'Your profile'}</p>
          <p className="truncate text-[13px] text-ink-faint">@{p?.username}</p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-ink-faint" />
      </Link>

      {GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          <p className="px-1 text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
            {group.label}
          </p>
          <div className="card divide-y divide-[var(--hairline)] px-4">
            {group.links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 py-3.5 transition-opacity active:opacity-60"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--surface-raised)] text-ink-soft">
                  <Icon size={18} />
                </div>
                <span className="flex-1 text-[15px] font-medium">{label}</span>
                <ChevronRight size={18} className="text-ink-faint" />
              </Link>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={logout}
        className="card flex items-center justify-center gap-2 py-4 text-[15px] font-semibold text-danger transition-opacity active:opacity-70"
      >
        <LogOut size={18} /> Log out
      </button>
    </div>
  );
}