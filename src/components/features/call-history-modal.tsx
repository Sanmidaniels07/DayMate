'use client';
import { X, Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing, History } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useCallHistory } from '@/hooks/use-calls';
import { useSessionStore } from '@/stores/session';
import { timeAgo } from '@/lib/time';

function fmtDuration(sec: number | null) {
  if (!sec) return '';
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CallHistoryModal({ conversationId, open, onClose }: {
  conversationId: string; open: boolean; onClose: () => void;
}) {
  const meId = useSessionStore((s) => s.user?.id);
  const { data, isLoading } = useCallHistory(conversationId, open);
  const calls = data?.data ?? [];

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex h-full flex-col bg-surface">
        <header className="flex items-center gap-3 border-b border-[var(--hairline)] bg-[var(--surface-raised)] px-4 py-3.5">
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            <X size={20} />
          </button>
          <div>
            <p className="font-display text-[17px] font-semibold leading-tight">Call history</p>
            {calls.length > 0 && (
              <p className="text-[12px] text-ink-faint">{calls.length} call{calls.length > 1 ? 's' : ''}</p>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {isLoading ? (
            <div className="flex flex-col divide-y divide-[var(--hairline)]">
              <CallRowSkeleton /><CallRowSkeleton /><CallRowSkeleton /><CallRowSkeleton />
            </div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-[var(--accent-soft)] text-accent">
                <History size={26} />
              </div>
              <p className="text-[15px] font-medium">No calls yet</p>
              <p className="max-w-[220px] text-[13px] text-ink-soft">
                Voice and video calls in this conversation will show up here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--hairline)]">
              {calls.map((c, i) => (
                <CallRow key={c.id} call={c} meId={meId} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function CallRow({
  call: c, meId, index,
}: {
  call: {
    id: string; type: string; status: string; startedAt: string;
    durationSec: number | null; initiatorId?: string;
  };
  meId?: string;
  index: number;
}) {
  const missed = c.status === 'MISSED' || c.status === 'DECLINED';
  const outgoing = c.initiatorId ? c.initiatorId === meId : undefined;
  const TypeIcon = c.type === 'VIDEO' ? Video : Phone;
  const DirectionIcon = outgoing === undefined ? TypeIcon : outgoing ? PhoneOutgoing : PhoneIncoming;

  const statusColor = missed
    ? 'bg-[var(--danger)]/10 text-danger'
    : 'bg-[var(--success)]/10 text-[var(--success)]';

  const label = missed
    ? `Missed ${c.type === 'VIDEO' ? 'video call' : 'call'}`
    : outgoing === false
      ? `Incoming ${c.type === 'VIDEO' ? 'video call' : 'call'}`
      : `${c.type === 'VIDEO' ? 'Video call' : 'Call'}`;

  return (
    <div
      className="animate-slideup flex items-center gap-3 py-3.5"
      style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
    >
      <div className={`relative grid size-11 shrink-0 place-items-center rounded-full ${statusColor}`}>
        {missed ? <PhoneMissed size={19} /> : <DirectionIcon size={19} />}
        {c.type === 'VIDEO' && !missed && (
          <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-[var(--surface-raised)] text-ink-faint ring-1 ring-[var(--hairline)]">
            <Video size={9} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[15px] leading-tight ${missed ? 'font-semibold text-danger' : 'font-medium text-ink'}`}>
          {label}
        </p>
        <p className="mt-0.5 text-[13px] text-ink-faint">
          {timeAgo(c.startedAt)}
          {c.durationSec ? <> · <span className="font-mono">{fmtDuration(c.durationSec)}</span></> : ''}
        </p>
      </div>
    </div>
  );
}

function CallRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <div className="skeleton size-11 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="skeleton h-4 w-28 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    </div>
  );
}