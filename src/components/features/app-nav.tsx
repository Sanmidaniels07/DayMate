'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Compass, MessageCircle, Bell, User, Users, Settings, LogOut } from 'lucide-react';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useNotificationSocket } from '@/hooks/use-notification-socket';
import { useUnreadChats } from '@/hooks/use-chat';
import { usePresenceSocket } from '@/hooks/use-presence';
import { useState } from 'react';
import { disconnectSocket } from '@/lib/socket';
import { useSessionStore } from '@/stores/session';
import { api } from '@/lib/api';
import { ConfirmModal } from '@/components/ui/confirm-modal';

const ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/me', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const doLogout = async () => {
    setLoggingOut(true);
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    disconnectSocket();
    useSessionStore.getState().clearSession();
    router.replace('/login');
  };

  useNotificationSocket();
  usePresenceSocket();

  const unread = useUnreadCount();
  const alertCount = unread.data?.data.count ?? 0;
  const chatUnread = useUnreadChats();
  const chatCount = chatUnread.data?.data.total ?? 0;

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 lg:inset-y-0 lg:right-auto lg:bottom-auto"
        aria-label="Primary"
      >
        <div
          className="group/nav mx-auto mb-3 flex max-w-sm items-center justify-around gap-1 rounded-[var(--radius-pill)]
            bg-charcoal px-2 py-2 shadow-[var(--shadow-float)] transition-[width] duration-300 ease-out
            lg:mx-3 lg:my-3 lg:h-[calc(100dvh-1.5rem)] lg:w-20 lg:max-w-none lg:flex-col lg:items-stretch lg:justify-start
            lg:gap-1 lg:overflow-hidden lg:rounded-[28px] lg:py-4 lg:hover:w-56"
        >
          <Link
            href="/home"
            className="mb-2 hidden shrink-0 items-center gap-3 self-stretch px-4 lg:flex"
          >
            <span className="flex size-8 shrink-0 items-center justify-center font-display text-xl font-bold text-celebrate">
              D
            </span>
            <span
              className="overflow-hidden whitespace-nowrap font-display text-lg font-semibold text-white/90
                opacity-0 transition-opacity delay-75 duration-200 ease-out group-hover/nav:opacity-100"
            >
              DayMate
            </span>
          </Link>

          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex size-12 shrink-0 items-center justify-center gap-3 self-stretch rounded-[var(--radius-pill)]
                  px-3.5 transition-colors lg:w-full lg:justify-start ${
                    active ? 'bg-white/10 text-celebrate' : 'text-white/55 hover:text-white/90'
                  }`}
              >
                <div className="relative">
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                  {href === '/notifications' && alertCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-celebrate px-1 text-[9px] font-bold text-[#3a2c10]">
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  )}
                  {href === '/chat' && chatCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-[var(--ink-on-dark)]">
                      {chatCount > 9 ? '9+' : chatCount}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium lg:hidden">{label}</span>
                <span
                  className="hidden overflow-hidden whitespace-nowrap text-sm font-medium opacity-0
                    transition-opacity delay-75 duration-200 ease-out group-hover/nav:opacity-100 lg:inline-block"
                >
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Logout — pinned to the bottom of the rail on desktop, inline on mobile */}
          <button
            onClick={() => setConfirmLogout(true)}
            aria-label="Log out"
            className="flex size-12 shrink-0 items-center justify-center gap-3 self-stretch rounded-[var(--radius-pill)]
              px-3.5 text-white/55 transition-colors hover:text-danger lg:mt-auto lg:w-full lg:justify-start"
          >
            <div className="relative">
              <LogOut size={20} strokeWidth={2} />
            </div>
            <span className="text-[9px] font-medium lg:hidden">Logout</span>
            <span
              className="hidden overflow-hidden whitespace-nowrap text-sm font-medium opacity-0
                transition-opacity delay-75 duration-200 ease-out group-hover/nav:opacity-100 lg:inline-block"
            >
              Log out
            </span>
          </button>
        </div>
      </nav>

      <ConfirmModal
        open={confirmLogout}
        title="Log out?"
        message="You'll need to sign back in to access your account."
        confirmLabel="Log out"
        cancelLabel="Stay"
        danger
        loading={loggingOut}
        onConfirm={doLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}