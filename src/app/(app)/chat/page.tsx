'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useConversations, type Conversation } from '@/hooks/use-chat';
import { useSessionStore } from '@/stores/session';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { timeAgo } from '@/lib/time';

export default function ChatListPage() {
  const { data, isLoading } = useConversations();
  const meId = useSessionStore((s) => s.user?.id);
  const convos = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[length:var(--text-title)] font-semibold">Messages</h1>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spin /></div>
      ) : convos.length === 0 ? (
        <div className="card p-10 text-center text-ink-soft">
          No conversations yet. Message a friend from their profile.
        </div>
      ) : (
        <div className="card divide-y divide-[var(--hairline)] px-4">
          {convos.map((c) => <ConversationRow key={c.id} convo={c} meId={meId} />)}
        </div>
      )}
    </div>
  );
}

function ConversationRow({ convo, meId }: { convo: Conversation; meId?: string }) {
  const other = convo.type === 'DIRECT'
    ? convo.participants.find((p) => p.userId !== meId)?.user.profile
    : null;
  const title = convo.type === 'GROUP' ? (convo.title ?? 'Group') : (other?.displayName ?? 'Unknown');
  const preview = convo.latestMessage
    ? convo.latestMessage.type === 'TEXT'
      ? convo.latestMessage.body
      : `Sent ${convo.latestMessage.type.toLowerCase().replace('_', ' ')}`
    : 'No messages yet';

  return (
    <Link href={`/chat/${convo.id}`} className="flex items-center gap-3 py-3">
      <BlobAvatar name={title} tint={other?.blobTint} avatarUrl={other?.avatarUrl} size={48} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[15px] font-semibold leading-tight">{title}</p>
          {convo.lastMessageAt && (
            <span className="shrink-0 text-[12px] text-ink-faint">{timeAgo(convo.lastMessageAt)}</span>
          )}
        </div>
        <p className="truncate text-[13px] text-ink-soft">{preview}</p>
      </div>
    </Link>
  );
}

function Spin() {
  return <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />;
}