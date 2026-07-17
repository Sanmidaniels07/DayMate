'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Compass, MessageCircle, Bell, User, Users, Settings, LogOut, Menu, X } from 'lucide-react';
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

// The 4 items that live in the mobile tab bar itself — everything else
// (Discover, Communities, Settings) moves into the "More" sheet on mobile.
const MOBILE_PRIMARY_HREFS = new Set(['/home', '/chat', '/notifications', '/me']);
const primaryItems = ITEMS.filter((i) => MOBILE_PRIMARY_HREFS.has(i.href));
const overflowItems = ITEMS.filter((i) => !MOBILE_PRIMARY_HREFS.has(i.href));

export function AppNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
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

  const badgeFor = (href: string) =>
    href === '/notifications' ? alertCount : href === '/chat' ? chatCount : 0;
  const badgeTint = (href: string) => (href === '/notifications' ? 'bg-celebrate text-[#3a2c10]' : 'bg-accent text-[var(--ink-on-dark)]');

  return (
    <>
      {/* ---------- Desktop rail (unchanged) ---------- */}
      <nav className="fixed inset-y-0 left-0 z-40 hidden lg:block" aria-label="Primary">
        <div
          className="group/nav mx-3 my-3 flex h-[calc(100dvh-1.5rem)] w-20 flex-col items-stretch justify-start
            gap-1 overflow-hidden rounded-[28px] bg-charcoal py-4 shadow-[var(--shadow-float)]
            transition-[width] duration-300 ease-out hover:w-56"
        >
          <Link href="/home" className="mb-2 flex shrink-0 items-center gap-3 self-stretch px-4">
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
            const count = badgeFor(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full shrink-0 items-center justify-start gap-3 self-stretch rounded-[var(--radius-pill)]
                  px-3.5 py-3 transition-colors ${active ? 'bg-white/10 text-celebrate' : 'text-white/55 hover:text-white/90'}`}
              >
                <div className="relative">
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                  {count > 0 && (
                    <span className={`absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold ${badgeTint(href)}`}>
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </div>
                <span
                  className="overflow-hidden whitespace-nowrap text-sm font-medium opacity-0
                    transition-opacity delay-75 duration-200 ease-out group-hover/nav:opacity-100"
                >
                  {label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setConfirmLogout(true)}
            aria-label="Log out"
            className="mt-auto flex w-full shrink-0 items-center justify-start gap-3 self-stretch rounded-[var(--radius-pill)]
              px-3.5 py-3 text-white/55 transition-colors hover:text-danger"
          >
            <LogOut size={20} strokeWidth={2} />
            <span
              className="overflow-hidden whitespace-nowrap text-sm font-medium opacity-0
                transition-opacity delay-75 duration-200 ease-out group-hover/nav:opacity-100"
            >
              Log out
            </span>
          </button>
        </div>
      </nav>

      {/* ---------- Mobile tab bar: 4 primary items + More ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden" aria-label="Primary">
        <div className="mx-auto mb-3 flex max-w-sm items-center justify-around gap-1 rounded-[var(--radius-pill)] bg-charcoal px-2 py-2 shadow-[var(--shadow-float)]">
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const count = badgeFor(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex size-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-pill)] px-3.5 transition-colors ${
                  active ? 'bg-white/10 text-celebrate' : 'text-white/55 hover:text-white/90'
                }`}
              >
                <div className="relative">
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                  {count > 0 && (
                    <span className={`absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold ${badgeTint(href)}`}>
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium">{label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setMoreOpen(true)}
            aria-label="More"
            className="flex size-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-pill)] px-3.5 text-white/55 transition-colors hover:text-white/90"
          >
            <Menu size={20} strokeWidth={2} />
            <span className="text-[9px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* ---------- Mobile "More" sheet ---------- */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="fixed inset-0 bg-black/40" />
          <div
            className="relative w-full rounded-t-[28px] bg-[var(--surface)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-float)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--hairline)]" />
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="font-display text-[16px] font-semibold">More</p>
              <button
                onClick={() => setMoreOpen(false)}
                className="grid size-8 place-items-center rounded-full text-ink-faint transition-colors hover:bg-[var(--surface-raised)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {overflowItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-medium transition-colors ${
                      active ? 'bg-[var(--accent-soft)] text-accent' : 'text-ink hover:bg-[var(--surface-raised)]'
                    }`}
                  >
                    <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                    {label}
                  </Link>
                );
              })}

              <button
                onClick={() => { setMoreOpen(false); setConfirmLogout(true); }}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-[15px] font-medium text-danger transition-colors hover:bg-[var(--danger)]/5"
              >
                <LogOut size={20} />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

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