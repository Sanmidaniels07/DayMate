'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, User, Shield, Bell, Ban, LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { useSessionStore } from '@/stores/session';
import { disconnectSocket } from '@/lib/socket';

const LINKS = [
  { href: '/me/edit', label: 'Edit profile', icon: User },
  { href: '/settings/privacy', label: 'Privacy', icon: Shield },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings/blocked', label: 'Blocked users', icon: Ban },
];

export default function SettingsPage() {
  const router = useRouter();
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    disconnectSocket();
    useSessionStore.getState().clearSession();
    router.replace('/login');
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[length:var(--text-title)] font-semibold">Settings</h1>
      <div className="card divide-y divide-[var(--hairline)] px-4">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 py-4">
            <Icon size={20} className="text-ink-soft" />
            <span className="flex-1 text-[15px] font-medium">{label}</span>
            <ChevronRight size={18} className="text-ink-faint" />
          </Link>
        ))}
      </div>
      <button onClick={logout}
        className="card flex items-center justify-center gap-2 py-4 text-[15px] font-semibold text-danger">
        <LogOut size={18} /> Log out
      </button>
    </div>
  );
}