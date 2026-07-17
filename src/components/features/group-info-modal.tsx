'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users, UserPlus, LogOut, Crown, Search, ShieldOff, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { useConversationDetail, useAddGroupMember, useRemoveGroupMember, useLeaveGroup } from '@/hooks/use-chat';
import { useFriends } from '@/hooks/use-social';
import { useSessionStore } from '@/stores/session';
import { toast } from '@/components/ui/toast';

export function GroupInfoModal({ conversationId, open, onClose, onLeft }: {
  conversationId: string; open: boolean; onClose: () => void; onLeft: () => void;
}) {
  const meId = useSessionStore((s) => s.user?.id);
  const detail = useConversationDetail(conversationId);
  const friends = useFriends();
  const add = useAddGroupMember(conversationId);
  const remove = useRemoveGroupMember(conversationId);
  const leave = useLeaveGroup();
  const [adding, setAdding] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [removingUsername, setRemovingUsername] = useState<string | null>(null);

  const convo = detail.data?.data;
  const participants = convo?.participants ?? [];
  const meAdmin = participants.find((p) => p.userId === meId)?.isAdmin ?? false;
  const memberUsernames = new Set(participants.map((p) => p.user.profile?.username).filter(Boolean));

  const addable = (friends.data?.data ?? []).filter((f) => !memberUsernames.has(f.username));
  const filteredAddable = addQuery
    ? addable.filter((f) =>
        f.displayName.toLowerCase().includes(addQuery.toLowerCase()) ||
        f.username.toLowerCase().includes(addQuery.toLowerCase()))
    : addable;

  const doLeave = () => {
    leave.mutate(conversationId, {
      onSuccess: () => onLeft(),
      onError: () => toast.error('Could not leave the group.'),
    });
  };

  const doRemove = (username: string) => {
    remove.mutate(username, {
      onSuccess: () => setRemovingUsername(null),
      onError: () => toast.error('Could not remove member.'),
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex h-full flex-col bg-surface">
        <header className="flex items-center gap-3 border-b border-[var(--hairline)] px-4 py-3">
          <button
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-[var(--surface-raised)]"
          >
            <X size={20} />
          </button>
          <p className="font-display text-[17px] font-semibold">Group info</p>
        </header>

        {detail.isLoading ? (
          <InfoSkeleton />
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Group identity */}
            <div className="flex flex-col items-center gap-3 border-b border-[var(--hairline)] px-4 py-7 text-center">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="grid size-20 place-items-center rounded-[28px] bg-gradient-to-br from-[var(--celebrate-soft)] to-[var(--accent-soft)] shadow-sm ring-1 ring-black/[0.03]"
              >
                <Users size={32} strokeWidth={1.6} className="text-[#8a6410]" />
              </motion.div>
              <div>
                <p className="font-display text-xl font-semibold">{convo?.title ?? 'Group'}</p>
                <p className="mt-1 rounded-full bg-[var(--surface-raised)] px-3 py-1 text-[12px] font-medium text-ink-faint">
                  {participants.length} member{participants.length === 1 ? '' : 's'}
                </p>
              </div>

              {/* Avatar stack preview */}
              <div className="flex -space-x-2.5 pt-1">
                {participants.slice(0, 6).map((pt) => (
                  <div key={pt.userId} className="rounded-full ring-2 ring-[var(--surface)]">
                    <BlobAvatar
                      name={pt.user.profile?.displayName ?? ''}
                      tint={pt.user.profile?.blobTint}
                      avatarUrl={pt.user.profile?.avatarUrl}
                      size={30}
                    />
                  </div>
                ))}
                {participants.length > 6 && (
                  <div className="grid size-[30px] place-items-center rounded-full bg-[var(--surface-raised)] text-[11px] font-semibold text-ink-faint ring-2 ring-[var(--surface)]">
                    +{participants.length - 6}
                  </div>
                )}
              </div>
            </div>

            {/* Add member (admin only) */}
            {meAdmin && (
              <div className="border-b border-[var(--hairline)] px-2 py-2">
                <button
                  onClick={() => setAdding((v) => !v)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[var(--surface-raised)]"
                >
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)]">
                    <UserPlus size={20} className="text-accent" />
                  </div>
                  <span className="flex-1 text-[15px] font-semibold text-accent">Add members</span>
                  <motion.span animate={{ rotate: adding ? 45 : 0 }} className="text-accent">
                    <X size={16} className={adding ? '' : 'rotate-45'} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {adding && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2 rounded-xl bg-[var(--surface-raised)] px-3 py-2 mx-2 mb-2">
                        <Search size={15} className="shrink-0 text-ink-faint" />
                        <input
                          value={addQuery}
                          onChange={(e) => setAddQuery(e.target.value)}
                          placeholder="Search friends"
                          autoFocus
                          className="h-6 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
                        />
                      </div>

                      <div className="px-2 pb-2">
                        {filteredAddable.length === 0 ? (
                          <p className="py-4 text-center text-[13px] text-ink-faint">
                            {addable.length === 0 ? 'All your friends are already here.' : 'No matches.'}
                          </p>
                        ) : (
                          filteredAddable.map((f) => (
                            <button
                              key={f.username}
                              onClick={() => add.mutate(f.username)}
                              disabled={add.isPending}
                              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[var(--surface-raised)] disabled:opacity-50"
                            >
                              <BlobAvatar name={f.displayName} tint={f.blobTint} avatarUrl={f.avatarUrl} size={36} />
                              <span className="flex-1 truncate text-[14px] font-medium">{f.displayName}</span>
                              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[12px] font-semibold text-accent">
                                Add
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Member list */}
            <div className="px-2 py-2">
              <p className="px-3 py-2 text-[12px] font-semibold uppercase tracking-wider text-ink-faint">Members</p>
              {participants.map((pt) => {
                const prof = pt.user.profile;
                if (!prof) return null;
                const isMe = pt.userId === meId;
                const isConfirmingThis = removingUsername === prof.username;
                return (
                  <div
                    key={pt.userId}
                    className={`rounded-2xl transition-colors ${isConfirmingThis ? 'bg-[var(--danger)]/5' : ''}`}
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <BlobAvatar name={prof.displayName} tint={prof.blobTint} avatarUrl={prof.avatarUrl} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-[15px] font-semibold leading-tight">
                          {isMe ? 'You' : prof.displayName}
                          {pt.isAdmin && (
                            <span className="flex items-center gap-0.5 rounded-full bg-[var(--celebrate-soft)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a6410]">
                              <Crown size={10} /> Admin
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[13px] text-ink-faint">@{prof.username}</p>
                      </div>
                      {meAdmin && !isMe && !isConfirmingThis && (
                        <button
                          onClick={() => setRemovingUsername(prof.username)}
                          className="rounded-full px-3 py-1.5 text-[13px] font-medium text-danger transition-colors hover:bg-[var(--danger)]/10"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {isConfirmingThis && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden px-3"
                        >
                          <div className="flex items-center gap-2 rounded-xl bg-[var(--surface)] px-3 py-2.5 mb-2">
                            <p className="flex-1 text-[13px] text-ink-soft">
                              Remove {prof.displayName} from the group?
                            </p>
                            <button
                              onClick={() => setRemovingUsername(null)}
                              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-ink-soft hover:bg-[var(--surface-raised)]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => doRemove(prof.username)}
                              disabled={remove.isPending}
                              className="rounded-full bg-danger px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                            >
                              {remove.isPending ? 'Removing…' : 'Remove'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Leave */}
            <div className="mt-auto border-t border-[var(--hairline)] p-4">
              <AnimatePresence mode="wait" initial={false}>
                {!confirmLeave ? (
                  <motion.div key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Button variant="danger" onClick={() => setConfirmLeave(true)} className="w-full">
                      <LogOut size={16} /> Leave group
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="flex flex-col gap-3 rounded-2xl bg-[var(--danger)]/5 p-4"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" />
                      <p className="text-[13px] leading-relaxed text-ink-soft">
                        You&apos;ll stop receiving messages from this group and won&apos;t see new activity.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setConfirmLeave(false)} className="flex-1">
                        Stay
                      </Button>
                      <Button variant="danger" onClick={doLeave} loading={leave.isPending} className="flex-1">
                        Leave
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function InfoSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col items-center gap-3 border-b border-[var(--hairline)] px-4 py-7">
        <div className="skeleton size-20 rounded-[28px]" />
        <div className="skeleton h-5 w-32 rounded" />
        <div className="skeleton h-3.5 w-20 rounded-full" />
      </div>
      <div className="flex flex-col gap-2 px-3 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-1">
            <div className="skeleton size-11 shrink-0 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-3.5 w-28 rounded" />
              <div className="skeleton mt-1.5 h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}