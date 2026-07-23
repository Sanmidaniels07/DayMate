'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Users, LogOut } from 'lucide-react';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useSessionStore } from '@/stores/session';
import { disconnectSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import { ConfirmModal } from '@/components/ui/confirm-modal';

const TAGLINES = [
  'find your birthday people',
  'someone shares your day',
  'the circle that shares your cake',
  'connect by the day you were born',
  'your people, your date, your vibe',
];

function NavIconLink({
  href, label, icon: Icon, badge,
}: { href: string; label: string; icon: typeof Bell; badge?: number }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Link
        href={href}
        aria-label={label}
        className={`grid size-9 shrink-0 place-items-center rounded-full transition-colors sm:size-10 ${
          active ? 'bg-[var(--accent-soft)] text-accent' : 'text-ink-soft hover:bg-[var(--accent-soft)] hover:text-accent'
        }`}
      >
        <div className="relative">
          <Icon size={18} strokeWidth={active ? 2.4 : 2} className="sm:size-5" />
          {!!badge && badge > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-celebrate px-1 text-[9px] font-bold text-[#3a2c10]">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </div>
      </Link>
      <NavTooltip show={hovered} label={label} />
    </div>
  );
}

function NavIconButton({
  label, icon: Icon, onClick, danger,
}: { label: string; icon: typeof Bell; onClick: () => void; danger?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button
        onClick={onClick}
        aria-label={label}
        className={`grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors sm:size-10 ${
          danger ? 'hover:bg-[var(--danger)]/10 hover:text-danger' : 'hover:bg-[var(--accent-soft)] hover:text-accent'
        }`}
      >
        <Icon size={18} className="sm:size-5" />
      </button>
      <NavTooltip show={hovered} label={label} />
    </div>
  );
}

function NavTooltip({ show, label }: { show: boolean; label: string }) {
  // Tooltips are a hover affordance — meaningless (and just extra DOM) on touch,
  // so only render them on pointer devices, and only once actually hovered.
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, y: -4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none absolute right-1/2 top-full z-40 mt-2 hidden translate-x-1/2 whitespace-nowrap rounded-full bg-charcoal px-3 py-1.5 text-[12px] font-medium text-white shadow-[var(--shadow-float)] sm:block"
        >
          {label}
          <span className="absolute -top-1 right-1/2 size-2 translate-x-1/2 rotate-45 bg-charcoal" />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function TopNav() {
  const [line, setLine] = useState(0);
  const alerts = useUnreadCount();
  const alertCount = alerts.data?.data.count ?? 0;
  const router = useRouter();

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const doLogout = async () => {
    setLoggingOut(true);
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    disconnectSocket();
    useSessionStore.getState().clearSession();
    router.replace('/login');
  };

  useEffect(() => {
    const t = setInterval(() => setLine((l) => (l + 1) % TAGLINES.length), 3800);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--hairline)] bg-surface/85 px-3 py-2.5 backdrop-blur-md sm:gap-3 sm:px-4 lg:px-8">
        <Link href="/home" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="relative grid size-9 shrink-0 place-items-center rounded-2xl bg-charcoal sm:size-10">
            <svg width="22" height="22" viewBox="0 0 44 44" fill="none" aria-hidden className="sm:h-[26px] sm:w-[26px]">
              <motion.circle
                cx="22" cy="22" r="20" fill="none" stroke="var(--celebrate)" strokeWidth="2.5"
                strokeLinecap="round" strokeDasharray="126"
                initial={{ strokeDashoffset: 126 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.path
                d="M15 13 H23 Q31 13 31 22 Q31 31 23 31 H15 Z" fill="none"
                stroke="#F7F6F2" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
                strokeDasharray="70"
                initial={{ strokeDashoffset: 70 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.circle
                cx="22" cy="22" r="3" fill="var(--celebrate)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, r: [3, 4.5, 3] }}
                transition={{
                  opacity: { duration: 0.4, delay: 1.3 },
                  r: { duration: 2.6, delay: 1.7, repeat: Infinity, ease: 'easeInOut' },
                }}
              />
            </svg>
          </span>

          <span className="flex min-w-0 flex-col leading-none">
            <span className="font-display text-[17px] font-semibold tracking-[-0.02em] sm:text-[21px]">
              Day<span className="italic text-celebrate">Mate</span>
            </span>
            {/* Tagline: hidden below sm — the thing most likely to force overflow */}
            <span className="relative mt-0.5 hidden h-4 min-w-[220px] overflow-hidden sm:block">
              <motion.span
                key={line}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute left-0 top-0 whitespace-nowrap text-[11px] leading-4 text-ink-faint"
              >
                {TAGLINES[line]}
              </motion.span>
            </span>
          </span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <NavIconLink href="/notifications" label="Notifications" icon={Bell} badge={alertCount} />
          <NavIconLink href="/connections" label="Connections" icon={Users} />
          <div className="mx-0.5 h-6 w-px bg-[var(--hairline)] sm:mx-1" />
          <NavIconButton label="Log out" icon={LogOut} danger onClick={() => setConfirmLogout(true)} />
        </div>
      </header>

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