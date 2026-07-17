"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Clock, ImagePlus, Mic, MoreVertical, Paperclip, Pencil, Phone, Send, Trash2, Users, Video, X } from "lucide-react";
import {
  useMessages,
  useSendMessage,
  useMarkRead,
  useConversationDetail,
  useDeleteMessage,
  useEditMessage,
  type Message,
} from "@/hooks/use-chat";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useTyping } from "@/hooks/use-typing";
import { useChatMedia } from "@/hooks/use-chat-media";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { useInitiateCall } from "@/hooks/use-calls";
import { useSessionStore } from "@/stores/session";
import { useCallStore } from "@/stores/call";
import { BlobAvatar } from "@/components/ui/blob-avatar";
import { PresenceAvatar } from "@/components/ui/presence-avatar";
import { TypingDots } from "@/components/features/typing-dots";
import { GroupInfoModal } from "@/components/features/group-info-modal";
import { CallHistoryModal } from "@/components/features/call-history-modal";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

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
  const del = useDeleteMessage(conversationId);
  const edit = useEditMessage(conversationId);

  useChatSocket(conversationId);

  const { typingUsers, onInput } = useTyping(conversationId);
  const { sendMedia, uploading } = useChatMedia(conversationId);
  const voice = useVoiceRecorder();
  const markRead = useMarkRead(conversationId);
  const detail = useConversationDetail(conversationId);
  const initiate = useInitiateCall();

  const [text, setText] = useState("");
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);

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

  const saveEdit = () => {
    if (!editing || !editing.body.trim()) return;
    edit.mutate({ messageId: editing.id, body: editing.body.trim() }, { onSuccess: () => setEditing(null) });
  };

  const sendVoice = async () => {
    const { blob, duration } = await voice.stop();
    if (blob) await sendMedia(blob, "voice_note", duration);
  };

  const onMediaFile = (e: React.ChangeEvent<HTMLInputElement>, kind: "audio" | "video") => {
    const f = e.target.files?.[0];
    if (f) sendMedia(f, kind);
    e.target.value = "";
  };

  const otherParticipant = detail.data?.data.participants.find((p) => p.userId !== meId);
  const other = otherParticipant?.user.profile;
  const otherLastRead = otherParticipant?.lastReadAt;

  const myNewest = rows.find((m) => m.senderId === meId);
  const seen = otherLastRead && myNewest && new Date(otherLastRead) >= new Date(myNewest.createdAt);

  const isGroup = detail.data?.data.type === 'GROUP';
  const memberCount = detail.data?.data.participants.length ?? 0;

  return (
    <div className="flex h-full flex-col bg-canvas">
      <header className="flex items-center gap-3 border-b border-[var(--hairline)] bg-surface/80 px-4 py-3 backdrop-blur">
        <button
          onClick={onClose}
          className="grid size-9 place-items-center rounded-full hover:bg-black/[0.04]"
        >
          <ArrowLeft size={22} />
        </button>

  {isGroup ? (
    <button onClick={() => setShowInfo(true)} className="flex min-w-0 items-center gap-3">
      <div className="grid size-9 place-items-center rounded-full bg-[var(--celebrate-soft)]">
        <Users size={18} className="text-[#8a6410]" />
      </div>
      <div className="min-w-0 text-left">
        <p className="truncate font-semibold leading-tight">{detail.data?.data.title ?? 'Group'}</p>
        <p className="text-[11px] text-ink-faint">{memberCount} members</p>
      </div>
    </button>
  ) : (
    <>
      {other && <PresenceAvatar userId={otherParticipant?.userId} name={other.displayName}
        tint={other.blobTint} avatarUrl={other.avatarUrl} size={38} />}
      <p className="truncate font-semibold">{other?.displayName ?? 'Conversation'}</p>
    </>
  )}
        <div className="ml-auto flex gap-1">
          {!isGroup && (
            <button
              onClick={() => setShowCallHistory(true)}
              className="grid size-10 place-items-center rounded-full hover:bg-black/5"
              aria-label="Call history"
            >
              <Clock size={18} />
            </button>
          )}
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

        {rows.map((message) => (
          <MessageRow
            key={message.id}
            message={message}
            mine={message.senderId === meId}
            isGroup={isGroup}
            onEdit={() => setEditing({ id: message.id, body: message.body ?? "" })}
            onDelete={() => del.mutate(message.id)}
          />
        ))}

        {messages.hasNextPage && (
          <button
            onClick={() => messages.fetchNextPage()}
            className="mx-auto my-3 text-[13px] text-accent"
          >
            Load earlier messages
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2 border-t border-[var(--hairline)] bg-surface px-4 py-3">
          <Pencil size={16} className="shrink-0 text-accent" />
          <input
            value={editing.body}
            autoFocus
            onChange={(e) => setEditing({ ...editing, body: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
            className="h-11 flex-1 rounded-full border border-[var(--hairline)] bg-[var(--surface-raised)] px-4 outline-none focus:border-accent"
          />
          <button onClick={() => setEditing(null)} className="grid size-11 place-items-center rounded-full hover:bg-black/5">
            <X size={20} />
          </button>
          <button
            onClick={saveEdit}
            disabled={!editing.body.trim() || edit.isPending}
            className="grid size-11 place-items-center rounded-full bg-accent text-white disabled:opacity-40"
          >
            <Check size={20} />
          </button>
        </div>
      ) : voice.recording ? (
        <div className="flex items-center gap-3 border-t border-[var(--hairline)] bg-surface px-4 py-3">
          <button onClick={voice.cancel} className="grid size-11 place-items-center rounded-full text-danger hover:bg-[var(--danger)]/5">
            <Trash2 size={20} />
          </button>
          <div className="flex flex-1 items-center gap-2">
            <span className="size-2.5 animate-pulse rounded-full bg-danger" />
            <span className="font-mono text-[15px]">
              {Math.floor(voice.seconds / 60)}:{String(voice.seconds % 60).padStart(2, "0")}
            </span>
            <span className="text-[13px] text-ink-faint">Recording…</span>
          </div>
          <button onClick={sendVoice} className="grid size-11 place-items-center rounded-full bg-accent text-white">
            <Send size={18} />
          </button>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="flex items-center gap-1.5 border-t border-[var(--hairline)] bg-surface px-3 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))]"
        >
          <label className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-black/5">
            <ImagePlus size={19} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) sendMedia(file, "image");
                e.target.value = "";
              }}
            />
          </label>

          <label className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-black/5">
            <Paperclip size={19} />
            <input
              type="file"
              accept="video/*,audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                onMediaFile(e, f.type.startsWith("video") ? "video" : "audio");
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

          {text.trim() ? (
            <button
              type="submit"
              className="grid size-11 place-items-center rounded-full bg-accent text-[var(--ink-on-dark)]"
            >
              ↑
            </button>
          ) : (
            <button
              type="button"
              onClick={voice.start}
              className="grid size-11 place-items-center rounded-full bg-accent text-white"
            >
              <Mic size={19} />
            </button>
          )}
        </form>
      )}

      {isGroup && (
        <GroupInfoModal conversationId={conversationId} open={showInfo}
          onClose={() => setShowInfo(false)} onLeft={() => { setShowInfo(false); onClose(); }} />
      )}

      <CallHistoryModal conversationId={conversationId} open={showCallHistory} onClose={() => setShowCallHistory(false)} />
    </div>
  );
}


function MessageRow({
  message, mine, isGroup, onEdit, onDelete,
}: {
  message: Message; mine: boolean; isGroup: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;

  const isText = !message.deletedAt && message.type !== "IMAGE" && message.type !== "VOICE_NOTE"
    && message.type !== "AUDIO" && message.type !== "VIDEO";
  const msAge = Date.now() - new Date(message.createdAt).getTime();
  const withinEditWindow = msAge < EDIT_WINDOW_MS;
  const canEdit = mine && isText && withinEditWindow;
  const minutesLeft = Math.max(0, Math.ceil((EDIT_WINDOW_MS - msAge) / 60000));
  const isAudio = message.type === "VOICE_NOTE" || message.type === "AUDIO";

  const mediaSrc = message.mediaUrl
    ? message.type === "IMAGE"
      ? `https://res.cloudinary.com/${CLOUD}/image/upload/${message.mediaUrl}`
      : isAudio
        ? `https://res.cloudinary.com/${CLOUD}/video/upload/f_mp3/${message.mediaUrl}` // f_mp3 for audio
        : `https://res.cloudinary.com/${CLOUD}/video/upload/${message.mediaUrl}`        // video
    : null;

  const openMenu = () => { if (mine && !message.deletedAt) setMenuOpen(true); };

  return (
    <div className={`relative mb-3 flex w-full ${mine ? "justify-end" : "justify-start"}`}>
      {message.deletedAt ? (
        <div className="max-w-[70%] rounded-2xl bg-black/5 px-4 py-2 text-[14px] italic text-ink-faint">
          Message deleted
        </div>
      ) : message.type === "IMAGE" && mediaSrc ? (
        <button onClick={openMenu} className="max-w-[70%]">
          <img src={mediaSrc} alt="" className="rounded-2xl" loading="lazy" />
        </button>
      ) : isAudio && mediaSrc ? (
        <div className={`relative max-w-[70%] rounded-2xl px-3 py-2 ${mine ? "bg-accent" : "border border-[var(--hairline)] bg-white"}`}>
          <audio controls src={mediaSrc} className="h-10 w-56" />
          {mine && (
            <button
              onClick={openMenu}
              aria-label="Message options"
              className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-charcoal text-white"
            >
              <MoreVertical size={13} />
            </button>
          )}
        </div>
      ) : message.type === "VIDEO" && mediaSrc ? (
        <div className="relative max-w-[75%]">
          <video controls src={mediaSrc} className="rounded-2xl" />
          {mine && (
            <button
              onClick={openMenu}
              aria-label="Message options"
              className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-black/60 text-white"
            >
              <MoreVertical size={15} />
            </button>
          )}
        </div>
      ) : (
        <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
          {!mine && (
            <BlobAvatar
              size={30}
              name={message.sender.profile?.displayName ?? "?"}
              tint={message.sender.profile?.blobTint}
              avatarUrl={message.sender.profile?.avatarUrl}
            />
          )}
          <button
            onClick={openMenu}
            disabled={!mine}
            className={`max-w-md rounded-2xl px-4 py-2 text-left ${
              mine ? "bg-accent text-white" : "border border-[var(--hairline)] bg-white"
            } ${mine ? "cursor-pointer" : "cursor-default"}`}
          >
            {isGroup && !mine && (
              <span className="mb-0.5 block text-[11px] font-medium opacity-70">
                {message.sender.profile?.displayName}
              </span>
            )}
            {message.body}
            {message.editedAt && <span className="ml-1.5 text-[11px] opacity-60">edited</span>}
          </button>
        </div>
      )}

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className={`absolute bottom-full z-40 mb-1 min-w-[160px] overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface-raised)] shadow-[var(--shadow-float)] ${mine ? "right-0" : "left-0"}`}>
            {canEdit && (
              <button
                onClick={() => { setMenuOpen(false); onEdit(); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[14px] hover:bg-black/[0.03]"
              >
                <Pencil size={15} /> Edit
                <span className="ml-auto text-[11px] text-ink-faint">{minutesLeft}m left</span>
              </button>
            )}
            <button
              onClick={() => { setMenuOpen(false); onDelete(); }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[14px] text-danger hover:bg-[var(--danger)]/5"
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}