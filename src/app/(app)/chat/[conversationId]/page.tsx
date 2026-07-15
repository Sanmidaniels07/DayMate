'use client';
import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, Phone, Video } from 'lucide-react';
import { useMessages, useSendMessage, useMarkRead, useConversationDetail, type Message } from '@/hooks/use-chat';
import { useChatSocket } from '@/hooks/use-chat-socket';
import { useTyping } from '@/hooks/use-typing';
import { useChatMedia } from '@/hooks/use-chat-media';
import { useInitiateCall } from '@/hooks/use-calls';
import { useSessionStore } from '@/stores/session';
import { useCallStore } from '@/stores/call';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { TypingDots } from '@/components/features/typing-dots';

export default function ThreadPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);
  const meId = useSessionStore((s) => s.user?.id);
  const messages = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  useChatSocket(conversationId); // the live bridge

  const { typingUsers, onInput } = useTyping(conversationId);
  const { sendMedia, uploading } = useChatMedia(conversationId);
  const markRead = useMarkRead(conversationId);
  const detail = useConversationDetail(conversationId);
  const initiate = useInitiateCall();

  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const rows = messages.data?.pages.flatMap((p) => p.data) ?? [];

  // Auto-scroll to newest on new message (rows[0] is newest — we render reversed).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rows[0]?.id]);

  // Mark read on open and when new messages arrive while looking.
  useEffect(() => {
    if (rows.length > 0) markRead.mutate();
  }, [rows[0]?.id]); // eslint-disable-line

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    send.mutate(body);
  };

  const startCall = (type: 'VOICE' | 'VIDEO') => {
    initiate.mutate({ conversationId, type }, {
      onSuccess: ({ data }) => useCallStore.getState().set({ phase: 'ringing-out', call: data.call, isCaller: true }),
    });
  };

  const otherLastRead = detail.data?.data.participants.find((p) => p.userId !== meId)?.lastReadAt;
  const myNewest = rows.find((m) => m.senderId === meId);
  const seen = otherLastRead && myNewest && new Date(otherLastRead) >= new Date(myNewest.createdAt);

  return (
    <div className="fixed inset-0 flex flex-col bg-canvas lg:pl-24">
      <header className="flex items-center gap-3 border-b border-[var(--hairline)] bg-surface/80 px-4 py-3 backdrop-blur">
        <Link href="/chat" className="lg:hidden"><ArrowLeft size={22} /></Link>
        <p className="font-semibold">Conversation</p>
        <div className="ml-auto flex gap-1">
          <button onClick={() => startCall('VOICE')} className="grid size-10 place-items-center rounded-full hover:bg-black/[0.04]"><Phone size={19} /></button>
          <button onClick={() => startCall('VIDEO')} className="grid size-10 place-items-center rounded-full hover:bg-black/[0.04]"><Video size={19} /></button>
        </div>
      </header>

      <div className="flex flex-1 flex-col-reverse gap-1 overflow-y-auto px-4 py-4">
        <div ref={bottomRef} />
        {seen && <p className="self-end pr-1 text-[11px] text-ink-faint">Seen</p>}
        {typingUsers.size > 0 && <TypingDots />}
        {rows.map((m) => <Bubble key={m.id} message={m} mine={m.senderId === meId} />)}
        {messages.hasNextPage && (
          <button onClick={() => messages.fetchNextPage()}
            className="mx-auto my-2 text-[13px] text-accent">Load earlier</button>
        )}
      </div>

      <form onSubmit={submit}
        className="flex items-center gap-2 border-t border-[var(--hairline)] bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <label className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-ink-soft hover:bg-black/[0.04]">
          <ImagePlus size={20} />
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) sendMedia(f, 'image'); }} />
        </label>
        <input value={text}
          onChange={(e) => { setText(e.target.value); onInput(); }}
          placeholder="Message…"
          className="h-11 flex-1 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--surface-raised)] px-4 text-[15px] outline-none focus:border-accent" />
        <button type="submit" disabled={!text.trim()}
          className="grid size-11 place-items-center rounded-full bg-accent text-[var(--ink-on-dark)] disabled:opacity-40">↑</button>
      </form>
    </div>
  );
}

function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  if (message.deletedAt) {
    return (
      <div className={`max-w-[75%] ${mine ? 'self-end' : 'self-start'}`}>
        <p className="rounded-2xl bg-black/[0.04] px-4 py-2 text-[14px] italic text-ink-faint">Message deleted</p>
      </div>
    );
  }

  if (message.type === 'IMAGE' && message.mediaUrl && !message.deletedAt) {
    const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
    return (
      <div className={`max-w-[70%] ${mine ? 'self-end' : 'self-start'}`}>
        <img src={`https://res.cloudinary.com/${CLOUD}/image/upload/c_limit,w_600/${message.mediaUrl}`}
          alt="" className="rounded-2xl" loading="lazy" />
      </div>
    );
  }

  return (
    <div className={`flex max-w-[78%] items-end gap-2 ${mine ? 'self-end flex-row-reverse' : 'self-start'}`}>
      {!mine && (
        <BlobAvatar name={message.sender.profile?.displayName ?? '?'} tint={message.sender.profile?.blobTint}
          avatarUrl={message.sender.profile?.avatarUrl} size={28} />
      )}
      <div className={`rounded-2xl px-4 py-2 text-[15px] leading-relaxed ${
        mine ? 'bg-accent text-[var(--ink-on-dark)]' : 'bg-[var(--surface-raised)] border border-[var(--hairline)]'
      }`}>
        {message.body}
        {message.editedAt && <span className="ml-1.5 text-[11px] opacity-60">edited</span>}
      </div>
    </div>
  );
}