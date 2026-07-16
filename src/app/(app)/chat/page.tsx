"use client";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import {
  useConversations,
  useUnreadChats,
  useOpenDm,
  type Conversation,
} from "@/hooks/use-chat";
import { useSessionStore } from "@/stores/session";
import { BlobAvatar } from "@/components/ui/blob-avatar";
import { timeAgo } from "@/lib/time";
import { fadeUp, stagger } from "@/components/ui/motion";
import { Modal } from "@/components/ui/modal";
import { ChatThread } from "./chat-thread";

function ChatListInner() {
  const router = useRouter();
  const withUser = useSearchParams().get("with");
  const openDm = useOpenDm();
  const { data, isLoading } = useConversations();
  const meId = useSessionStore((s) => s.user?.id);
  const unread = useUnreadChats();
  const counts = unread.data?.data.byConversation ?? {};
  const convos = data?.data ?? [];

  const [activeThread, setActiveThread] = useState<string | null>(null);


  const handleClose = () => {
  console.log("Closing modal");
  setActiveThread(null);
};

  useEffect(() => {
    if (!withUser) return;
    openDm.mutate(withUser, {
      onSuccess: (res) => setActiveThread(res.data.id),
      onError: () => {},
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withUser]);

  if (withUser && openDm.isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <span className="size-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-[14px] text-ink-soft">Opening conversation…</p>
      </div>
    );
  }

  return (
    <>
     <Modal open={!!activeThread} onClose={handleClose}>
  {activeThread && (
    <ChatThread
      conversationId={activeThread}
      onClose={handleClose}
    />
  )}
</Modal>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-5"
      >
        <motion.header variants={fadeUp}>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
            Your conversations
          </p>
          <h1 className="mt-1 font-display text-[length:var(--text-title)] font-semibold tracking-[-0.01em]">
            Messages
          </h1>
        </motion.header>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : convos.length === 0 ? (
          <motion.div
            variants={fadeUp}
            className="card flex flex-col items-center gap-3 p-12 text-center"
          >
            <div className="grid size-14 place-items-center rounded-full bg-[var(--accent-soft)]">
              <MessageCircle size={26} className="text-accent" />
            </div>
            <p className="font-display text-lg font-semibold">
              No conversations yet
            </p>
            <p className="max-w-xs text-[14px] text-ink-soft">
              Head to a friend&apos;s profile and tap Message to start your
              first chat.
            </p>
            <Link
              href="/discover"
              className="mt-1 rounded-[var(--radius-pill)] bg-accent px-5 py-2.5 text-[14px] font-semibold text-[var(--ink-on-dark)]"
            >
              Find people
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={fadeUp}
            className="card divide-y divide-[var(--hairline)] px-2 sm:px-3"
          >
            {convos.map((c) => (
              <ConversationRow
                key={c.id}
                convo={c}
                meId={meId}
                unread={counts[c.id] ?? 0}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

function ConversationRow({
  convo,
  meId,
  unread,
}: {
  convo: Conversation;
  meId?: string;
  unread: number;
}) {
  const other =
    convo.type === "DIRECT"
      ? convo.participants.find((p) => p.userId !== meId)?.user.profile
      : null;
  const title =
    convo.type === "GROUP"
      ? (convo.title ?? "Group")
      : (other?.displayName ?? "Unknown");
  const isMedia = convo.latestMessage && convo.latestMessage.type !== "TEXT";
  const preview = convo.latestMessage
    ? isMedia
      ? `📎 ${convo.latestMessage.type.toLowerCase().replace("_", " ")}`
      : convo.latestMessage.body
    : "No messages yet";
  const hasUnread = unread > 0;

  return (
    <Link
      href={`/chat/${convo.id}`}
      className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-black/[0.02]"
    >
      <BlobAvatar
        name={title}
        tint={other?.blobTint}
        avatarUrl={other?.avatarUrl}
        size={52}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={`truncate text-[15px] leading-tight ${hasUnread ? "font-bold text-ink" : "font-semibold"}`}
          >
            {title}
          </p>
          {convo.lastMessageAt && (
            <span
              className={`shrink-0 text-[12px] ${hasUnread ? "font-semibold text-accent" : "text-ink-faint"}`}
            >
              {timeAgo(convo.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={`truncate text-[13px] ${hasUnread ? "text-ink" : "text-ink-soft"}`}
          >
            {preview}
          </p>
          {hasUnread && (
            <span className="ml-2 grid min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-[var(--ink-on-dark)]">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ChatListPage() {
  return (
    <Suspense fallback={null}>
      <ChatListInner />
    </Suspense>
  );
}
