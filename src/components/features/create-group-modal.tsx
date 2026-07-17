'use client';
import { useState } from 'react';
import { X, Check, Search, Users, UsersRound } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { useFriends } from '@/hooks/use-social';
import { useCreateGroup } from '@/hooks/use-chat';
import { toast } from '@/components/ui/toast';

export function CreateGroupModal({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: (conversationId: string) => void;
}) {
  const { data } = useFriends();
  const create = useCreateGroup();
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');

  const friends = data?.data ?? [];
  const filtered = q
    ? friends.filter((f) =>
        f.displayName.toLowerCase().includes(q.toLowerCase()) ||
        f.username.toLowerCase().includes(q.toLowerCase()))
    : friends;

  const selectedFriends = friends.filter((f) => selected.has(f.username));

  const toggle = (username: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(username) ? n.delete(username) : n.add(username);
      return n;
    });

  const reset = () => { setTitle(''); setSelected(new Set()); setQ(''); };

  const submit = () => {
    if (!title.trim() || selected.size === 0) return;
    create.mutate(
      { title: title.trim(), usernames: [...selected] },
      {
        onSuccess: (res) => { reset(); onCreated(res.data.id); },
        onError: () => toast.error('Could not create the group.'),
      },
    );
  };

  const canSubmit = title.trim().length > 0 && selected.size > 0;

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }}>
      <div className="flex h-full flex-col bg-surface">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-[var(--hairline)] px-4 py-3">
          <button
            onClick={() => { reset(); onClose(); }}
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-[var(--surface-raised)]"
          >
            <X size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[17px] font-semibold leading-tight">New group</p>
            <p className="text-[12px] text-ink-faint">
              {selected.size === 0 ? 'Name it and add friends' : `${selected.size} friend${selected.size === 1 ? '' : 's'} selected`}
            </p>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Group identity */}
          <div className="flex items-center gap-3 border-b border-[var(--hairline)] px-4 py-4">
            <motion.div
              animate={{ scale: title.trim() ? 1 : 0.94 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--celebrate-soft)] to-[var(--accent-soft)]"
            >
              {title.trim() ? (
                <span className="font-display text-[18px] font-semibold text-ink/70">
                  {title.trim().slice(0, 1).toUpperCase()}
                </span>
              ) : (
                <Users size={22} className="text-[#8a6410]" />
              )}
            </motion.div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Group name"
              maxLength={60}
              className="h-11 flex-1 bg-transparent text-[16px] font-medium outline-none placeholder:text-ink-faint placeholder:font-normal"
            />
            {title.length > 0 && (
              <span className="shrink-0 text-[11px] text-ink-faint">{title.length}/60</span>
            )}
          </div>

          {/* Selected members — avatar stack + scrollable chips */}
          <AnimatePresence initial={false}>
            {selected.size > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-b border-[var(--hairline)]"
              >
                <div className="flex items-center gap-3 px-4 pt-3">
                  <div className="flex shrink-0 -space-x-2.5">
                    {selectedFriends.slice(0, 4).map((f) => (
                      <div key={f.username} className="rounded-full ring-2 ring-[var(--surface)]">
                        <BlobAvatar name={f.displayName} tint={f.blobTint} avatarUrl={f.avatarUrl} size={28} />
                      </div>
                    ))}
                  </div>
                  {selected.size > 4 && (
                    <span className="text-[12px] font-medium text-ink-faint">+{selected.size - 4} more</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 px-4 py-3">
                  {selectedFriends.map((f) => (
                    <motion.button
                      key={f.username}
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      onClick={() => toggle(f.username)}
                      className="flex items-center gap-1.5 rounded-full bg-accent/10 py-1 pl-1 pr-2.5 text-[13px] font-medium text-accent transition-colors hover:bg-accent/15"
                    >
                      <BlobAvatar name={f.displayName} tint={f.blobTint} avatarUrl={f.avatarUrl} size={22} />
                      {f.displayName}
                      <X size={13} />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="flex items-center gap-2 border-b border-[var(--hairline)] px-4 py-2.5">
            <Search size={16} className="shrink-0 text-ink-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search friends"
              className="h-8 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-faint"
            />
            {q.length > 0 && (
              <button
                onClick={() => setQ('')}
                className="grid size-6 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-[var(--surface-raised)]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Friend list */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14 text-center">
                <div className="grid size-12 place-items-center rounded-2xl bg-[var(--surface-raised)] text-ink-faint">
                  <UsersRound size={22} />
                </div>
                <p className="text-[14px] text-ink-faint">
                  {friends.length === 0 ? 'Add some friends first.' : 'No friends match your search.'}
                </p>
              </div>
            ) : (
              filtered.map((f, i) => {
                const on = selected.has(f.username);
                return (
                  <motion.button
                    key={f.username}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 10) * 0.02, duration: 0.15 }}
                    onClick={() => toggle(f.username)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-2.5 py-2.5 text-left transition-colors ${
                      on
                        ? 'border-accent/30 bg-[var(--accent-soft)]'
                        : 'border-transparent hover:bg-[var(--surface-raised)]'
                    }`}
                  >
                    <BlobAvatar name={f.displayName} tint={f.blobTint} avatarUrl={f.avatarUrl} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold leading-tight">{f.displayName}</p>
                      <p className="truncate text-[13px] text-ink-faint">@{f.username}</p>
                    </div>
                    <motion.span
                      animate={{ scale: on ? 1 : 0.8, opacity: on ? 1 : 0.35 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                        on ? 'border-accent bg-accent text-white' : 'border-[var(--hairline)]'
                      }`}
                    >
                      {on && <Check size={14} />}
                    </motion.span>
                  </motion.button>
                );
              })
            )}
          </div>

          {/* Create */}
          <div className="border-t border-[var(--hairline)] p-4">
            <Button onClick={submit} loading={create.isPending} disabled={!canSubmit} className="w-full">
              {canSubmit
                ? `Create group · ${selected.size}`
                : !title.trim()
                ? 'Name your group to continue'
                : 'Add at least one friend'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}