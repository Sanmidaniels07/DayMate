"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Phone, Video } from "lucide-react";
import {
  useMessages,
  useSendMessage,
  useMarkRead,
  useConversationDetail,
  type Message,
} from "@/hooks/use-chat";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useTyping } from "@/hooks/use-typing";
import { useChatMedia } from "@/hooks/use-chat-media";
import { useInitiateCall } from "@/hooks/use-calls";
import { useSessionStore } from "@/stores/session";
import { useCallStore } from "@/stores/call";
import { BlobAvatar } from "@/components/ui/blob-avatar";
import { PresenceAvatar } from "@/components/ui/presence-avatar";
import { TypingDots } from "@/components/features/typing-dots";

export function ChatThread({
  conversationId,
  onClose,
}: {
  conversationId: string;
  onClose: () => void;
}) {
  const meId = useSessionStore((s) => s.user?.id);

  const messages = useMessages(conversationId);
  const send = useSendMessage(conversationId);

  useChatSocket(conversationId);

  const { typingUsers, onInput } = useTyping(conversationId);
  const { sendMedia } = useChatMedia(conversationId);
  const markRead = useMarkRead(conversationId);
  const detail = useConversationDetail(conversationId);
  const initiate = useInitiateCall();

  const [text, setText] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  const rows = messages.data?.pages.flatMap((p) => p.data) ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [rows[0]?.id]);

  useEffect(() => {
    if (rows.length) {
      markRead.mutate();
    }
  }, [rows[0]?.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    const body = text.trim();

    if (!body) return;

    setText("");

    send.mutate(body);
  };

  const startCall = (type: "VOICE" | "VIDEO") => {
    initiate.mutate(
      {
        conversationId,
        type,
      },
      {
        onSuccess: ({ data }) =>
          useCallStore.getState().set({
            phase: "ringing-out",
            call: data.call,
            isCaller: true,
          }),
      },
    );
  };

  const otherParticipant = detail.data?.data.participants.find((p) => p.userId !== meId);
  const other = otherParticipant?.user.profile;
  const otherLastRead = otherParticipant?.lastReadAt;

  const myNewest = rows.find((m) => m.senderId === meId);
  const seen = otherLastRead && myNewest && new Date(otherLastRead) >= new Date(myNewest.createdAt);

  return (
    <div className="flex h-full flex-col bg-canvas">
      <header className="flex items-center gap-3 border-b border-[var(--hairline)] bg-surface/80 px-4 py-3 backdrop-blur">
        <button
          onClick={onClose}
          className="grid size-9 place-items-center rounded-full hover:bg-black/[0.04]"
        >
          <ArrowLeft size={22} />
        </button>

        {other && (
          <PresenceAvatar
            userId={otherParticipant?.userId}
            name={other.displayName}
            tint={other.blobTint}
            avatarUrl={other.avatarUrl}
            size={38}
          />
        )}
        <p className="truncate font-semibold">{other?.displayName ?? "Conversation"}</p>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => startCall("VOICE")}
            className="grid size-10 place-items-center rounded-full hover:bg-black/5"
          >
            <Phone size={19} />
          </button>

          <button
            onClick={() => startCall("VIDEO")}
            className="grid size-10 place-items-center rounded-full hover:bg-black/5"
          >
            <Video size={19} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col-reverse overflow-y-auto px-4 py-5">
        <div ref={bottomRef} />

        {seen && (
          <div className="flex justify-end">
            <p className="text-[11px] text-ink-faint">Seen</p>
          </div>
        )}

        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <TypingDots />
          </div>
        )}

        {rows.map((message) => {
          const mine = message.senderId === meId;

          return (
            <div
              key={message.id}
              className={`flex w-full mb-3 ${
                mine ? "justify-end" : "justify-start"
              }`}
            >
              <Bubble message={message} mine={mine} />
            </div>
          );
        })}

        {messages.hasNextPage && (
          <button
            onClick={() => messages.fetchNextPage()}
            className="mx-auto my-3 text-[13px] text-accent"
          >
            Load earlier messages
          </button>
        )}
      </div>

      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-t border-[var(--hairline)] bg-surface px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))]"
      >
        <label className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-black/5">
          <ImagePlus size={20} />

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (file) {
                sendMedia(file, "image");
              }
            }}
          />
        </label>

        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onInput();
          }}
          placeholder="Message..."
          className="h-11 flex-1 rounded-full border border-[var(--hairline)] bg-[var(--surface-raised)] px-4 outline-none focus:border-accent"
        />

        <button
          type="submit"
          disabled={!text.trim()}
          className="grid size-11 place-items-center rounded-full bg-accent text-[var(--ink-on-dark)] disabled:opacity-40"
        >
          ↑
        </button>
      </form>
    </div>
  );
}

function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;

  if (message.deletedAt) {
    return (
      <div className="max-w-[70%] rounded-2xl bg-black/5 px-4 py-2 italic">
        Message deleted
      </div>
    );
  }

  if (message.type === "IMAGE" && message.mediaUrl) {
    return (
      <div className="max-w-[70%]">
        <img
          src={`https://res.cloudinary.com/${CLOUD}/image/upload/c_limit,w_700/${message.mediaUrl}`}
          className="rounded-2xl"
        />
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      {!mine && (
        <BlobAvatar
          size={30}
          name={message.sender.profile?.displayName ?? "?"}
          tint={message.sender.profile?.blobTint}
          avatarUrl={message.sender.profile?.avatarUrl}
        />
      )}

      <div
        className={`max-w-md rounded-2xl px-4 py-2 ${
          mine
            ? "bg-accent text-white"
            : "border border-[var(--hairline)] bg-white"
        }`}
      >
        {message.body}
      </div>
    </div>
  );
}