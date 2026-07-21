"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Clock, ImagePlus, Mic, MoreVertical, Paperclip, Pencil, Phone, RotateCw, Send, Trash2, Users, Video, X, MessageCircleHeart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useMessages,
  useSendMessage,
  useMarkRead,
  useConversationDetail,
  useDeleteMessage,
  useEditMessage,
  removeMessage,
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
import { ApiError } from '@/lib/api';
import { toast } from '@/components/ui/toast';

const EDIT_WINDOW_MS = 15 * 60 * 1000;

export function ChatThread({
  conversationId,
  onClose,
}: {
  conversationId: string;
  onClose: () => void;
}) {
  const meId = useSessionStore((s) => s.user?.id);
  const qc = useQueryClient();

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


  const retrySend = (failedId: string, body: string) => {
    removeMessage(qc, conversationId, failedId);
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
        onError: (err) => {
          const msg =
            err instanceof ApiError && err.status === 409
              ? err.message
              : "Could not start the call. Please try again.";
          toast.error(msg);
        },
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
    <div className="relative flex h-full flex-col overflow-hidden bg-[var(--canvas)]">
      {/* Ambient wash behind everything — barely-there warmth */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          background:
            'radial-gradient(ellipse 600px 300px at 20% 0%, var(--accent-soft), transparent 60%), radial-gradient(ellipse 400px 250px at 100% 100%, var(--celebrate-soft), transparent 55%)',
        }}
      />

      {/* Header — gradient, presence glow */}
      <header className="relative z-10 flex items-center gap-3 border-b border-[var(--hairline)] px-4 py-3 backdrop-blur-md"
        style={{ background: 'linear-gradient(180deg, var(--surface) 0%, rgba(255,255,255,0.7) 100%)' }}>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-[var(--accent-soft)] hover:text-accent"
        >
          <ArrowLeft size={22} />
        </motion.button>

        {isGroup ? (
          <button onClick={() => setShowInfo(true)} className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl shadow-sm"
              style={{ background: 'linear-gradient(135deg, var(--blob-blush), var(--celebrate))' }}>
              <Users size={18} className="text-white" />
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
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">{other?.displayName ?? 'Conversation'}</p>
              {typingUsers.size > 0 && (
                <p className="text-[11px] font-medium text-accent">typing…</p>
              )}
            </div>
          </>
        )}
        <div className="ml-auto flex gap-1">
          {!isGroup && (
            <button
              onClick={() => setShowCallHistory(true)}
              className="grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-[var(--accent-soft)] hover:text-accent"
              aria-label="Call history"
            >
              <Clock size={18} />
            </button>
          )}
          <button
            onClick={() => startCall("VOICE")}
            className="grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-[var(--accent-soft)] hover:text-accent"
          >
            <Phone size={19} />
          </button>

          <button
            onClick={() => startCall("VIDEO")}
            className="grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-[var(--accent-soft)] hover:text-accent"
          >
            <Video size={19} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="relative z-10 flex flex-1 flex-col-reverse overflow-y-auto px-4 py-5">
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

        {rows.length === 0 && !messages.isLoading && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="grid size-16 place-items-center rounded-full"
              style={{ background: 'linear-gradient(135deg, var(--blob-powder), var(--accent-soft))' }}>
              <MessageCircleHeart size={26} className="text-accent" />
            </div>
            <div>
              <p className="font-display text-[17px] font-semibold">Say hello 👋</p>
              <p className="mt-1 max-w-[220px] text-[13px] text-ink-soft">
                This is the start of your conversation{other ? ` with ${other.displayName.split(' ')[0]}` : ''}.
              </p>
            </div>
          </div>
        )}

        {rows.map((message, i) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <MessageRow
              message={message}
              mine={message.senderId === meId}
              isGroup={isGroup}
              onEdit={() => setEditing({ id: message.id, body: message.body ?? "" })}
              onDelete={() => del.mutate(message.id)}
              onRetry={() => retrySend(message.id, message.body ?? "")}
            />
          </motion.div>
        ))}

        {messages.hasNextPage && (
          <button
            onClick={() => messages.fetchNextPage()}
            className="mx-auto my-3 rounded-full bg-[var(--accent-soft)] px-4 py-1.5 text-[13px] font-medium text-accent transition-colors hover:bg-[var(--accent)]/20"
          >
            Load earlier messages
          </button>
        )}
      </div>

      {/* Composer */}
      {editing ? (
        <div className="relative z-10 flex items-center gap-2 border-t border-[var(--hairline)] bg-surface px-4 py-3">
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
            className="grid size-11 place-items-center rounded-full text-white shadow-sm disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--charcoal))' }}
          >
            <Check size={20} />
          </button>
        </div>
      ) : voice.recording ? (
        <div className="relative z-10 flex items-center gap-3 border-t border-[var(--hairline)] bg-surface px-4 py-3">
          <button onClick={voice.cancel} className="grid size-11 place-items-center rounded-full text-danger hover:bg-[var(--danger)]/5">
            <Trash2 size={20} />
          </button>
          <div className="flex flex-1 items-center gap-2">
            <motion.span className="size-2.5 rounded-full bg-danger"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            <span className="font-mono text-[15px]">
              {Math.floor(voice.seconds / 60)}:{String(voice.seconds % 60).padStart(2, "0")}
            </span>
            <span className="text-[13px] text-ink-faint">Recording…</span>
          </div>
          <button onClick={sendVoice} className="grid size-11 place-items-center rounded-full text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--charcoal))' }}>
            <Send size={18} />
          </button>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="relative z-10 flex items-center gap-1.5 border-t border-[var(--hairline)] bg-surface px-3 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))]"
        >
          <label className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-ink-soft transition-colors hover:bg-[var(--accent-soft)] hover:text-accent">
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

          <label className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-ink-soft transition-colors hover:bg-[var(--accent-soft)] hover:text-accent">
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
            className="h-11 flex-1 rounded-full border border-[var(--hairline)] bg-[var(--surface-raised)] px-4 outline-none transition-colors focus:border-accent"
          />

          <motion.button whileTap={{ scale: 0.88 }}
            type={text.trim() ? "submit" : "button"}
            onClick={!text.trim() ? voice.start : undefined}
            className="grid size-11 place-items-center rounded-full text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--charcoal))' }}
          >
            {text.trim() ? <Send size={17} /> : <Mic size={19} />}
          </motion.button>
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
  message, mine, isGroup, onEdit, onDelete, onRetry,
}: {
  message: Message; mine: boolean; isGroup: boolean;
  onEdit: () => void; onDelete: () => void; onRetry: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;

  const isText = !message.deletedAt && message.type !== "IMAGE" && message.type !== "VOICE_NOTE"
    && message.type !== "AUDIO" && message.type !== "VIDEO";
  const msAge = Date.now() - new Date(message.createdAt).getTime();
  const withinEditWindow = msAge < EDIT_WINDOW_MS;

  const isStoryReply = !!message.replyToStoryId;


  const canEdit = mine && isText && withinEditWindow && !message.pending && !message.failed;
  const canDelete = mine && !message.pending && !message.failed;
  const minutesLeft = Math.max(0, Math.ceil((EDIT_WINDOW_MS - msAge) / 60000));
  const isAudio = message.type === "VOICE_NOTE" || message.type === "AUDIO";

  const mediaSrc = message.mediaUrl
    ? message.pending
      ? message.mediaUrl
      : message.type === "IMAGE"
        ? `https://res.cloudinary.com/${CLOUD}/image/upload/${message.mediaUrl}`
        : isAudio
          ? `https://res.cloudinary.com/${CLOUD}/video/upload/f_mp3/${message.mediaUrl}`
          : `https://res.cloudinary.com/${CLOUD}/video/upload/${message.mediaUrl}`
    : null;

  const openMenu = () => { if (mine && !message.deletedAt && !message.pending && !message.failed) setMenuOpen(true); };

  // Soft, directional bubble shape — a gentle "tail" corner instead of uniform rounding
  const bubbleShape = mine
    ? "rounded-2xl rounded-br-md"
    : "rounded-2xl rounded-bl-md";

  return (
    <div className={`relative mb-3 flex w-full flex-col ${mine ? "items-end" : "items-start"}`}>
      
       {isStoryReply && !message.deletedAt && (
        <div className={`mb-1 flex items-center gap-1.5 px-1 text-[11px] ${mine ? "flex-row-reverse" : ""}`}>
          <div className="grid size-4 place-items-center rounded-full"
            style={{ background: 'linear-gradient(135deg, var(--celebrate), var(--accent))' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <path d="M4 12 L20 4 L14 20 L11 13 L4 12 Z" />
            </svg>
          </div>
          <span className="font-medium text-ink-faint">
            {mine ? 'Replied to their story' : 'Replied to your story'}
          </span>
        </div>
      )}
      <div className="flex w-full" style={{ justifyContent: mine ? "flex-end" : "flex-start" }}>
        {message.deletedAt ? (
          <div className={`max-w-[70%] ${bubbleShape} bg-black/5 px-4 py-2 text-[14px] italic text-ink-faint`}>
            Message deleted
          </div>
        ) : message.failed ? (
          <button
            onClick={onRetry}
            className={`flex max-w-[70%] items-center gap-2 ${bubbleShape} border border-[var(--danger)]/30 bg-[var(--danger)]/5 px-4 py-2 text-left`}
          >
            <span className="text-[15px] text-ink">{message.body}</span>
            <RotateCw size={14} className="shrink-0 text-danger" />
          </button>
        ) : message.type === "IMAGE" && mediaSrc ? (
          <button onClick={openMenu} className={`max-w-[70%] overflow-hidden rounded-2xl shadow-sm ${message.pending ? "opacity-60" : ""}`}>
            <img src={mediaSrc} alt="" className="rounded-2xl" loading="lazy" />
          </button>
        ) : isAudio && mediaSrc ? (
          <div className={`relative max-w-[70%] ${bubbleShape} px-3 py-2 shadow-sm ${message.pending ? "opacity-60" : ""} ${mine ? "text-white" : "border border-[var(--hairline)] bg-white"}`}
            style={mine ? { background: 'linear-gradient(135deg, var(--accent), var(--charcoal))' } : undefined}>
            <audio controls src={mediaSrc} className="h-10 w-56" />
            {mine && !message.pending && (
              <button
                onClick={openMenu}
                aria-label="Message options"
                className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-charcoal text-white shadow"
              >
                <MoreVertical size={13} />
              </button>
            )}
          </div>
        ) : message.type === "VIDEO" && mediaSrc ? (
          <div className={`relative max-w-[75%] overflow-hidden rounded-2xl shadow-sm ${message.pending ? "opacity-60" : ""}`}>
            <video controls src={mediaSrc} className="rounded-2xl" />
            {mine && !message.pending && (
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
          <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""} ${message.pending ? "opacity-60" : ""}`}>
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
              disabled={!mine || !!message.pending}
              className={`max-w-md ${bubbleShape} px-4 py-2.5 text-left shadow-sm ${
                mine ? "text-white" : "border border-[var(--hairline)] bg-white"
              } ${mine && !message.pending ? "cursor-pointer" : "cursor-default"}`}
              style={mine ? { background: 'linear-gradient(135deg, var(--accent), var(--charcoal))' } : undefined}
            >
              {isGroup && !mine && (
                <span className="mb-0.5 block text-[11px] font-medium opacity-70">
                  {message.sender.profile?.displayName}
                </span>
              )}
              <span className="text-[15px] leading-relaxed">{message.body}</span>
              {message.editedAt && <span className="ml-1.5 text-[11px] opacity-60">edited</span>}
            </button>
          </div>
        )}
      </div>

      {(message.pending || message.failed) && (
        <p className={`mt-1 px-1 text-[11px] ${message.failed ? "text-danger" : "text-ink-faint"}`}>
          {message.failed ? "Failed to send · tap to retry" : "Sending…"}
        </p>
      )}

      <AnimatePresence>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute bottom-full z-40 mb-1 min-w-[160px] overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] shadow-[var(--shadow-float)] ${mine ? "right-0" : "left-0"}`}
            >
              {canEdit && (
                <button
                  onClick={() => { setMenuOpen(false); onEdit(); }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[14px] hover:bg-[var(--accent-soft)]"
                >
                  <Pencil size={15} /> Edit
                  <span className="ml-auto text-[11px] text-ink-faint">{minutesLeft}m left</span>
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[14px] text-danger hover:bg-[var(--danger)]/5"
                >
                  <Trash2 size={15} /> Delete
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}