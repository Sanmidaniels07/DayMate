'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Users, Compass } from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PersonRow } from '@/components/features/person-row';
import {
  useIncomingRequests, useOutgoingRequests, useFriends,
  useFollowers, useFollowing, useRespondToRequest, useCancelRequest,
} from '@/hooks/use-social';

export default function ConnectionsPage() {
  const [tab, setTab] = useState('requests');
  const incoming = useIncomingRequests();
  const incomingCount = incoming.data?.data.length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-[length:var(--text-title)] font-semibold">Connections</h1>
        <p className="mt-1 text-[15px] text-ink-soft">Your people, requests, and network.</p>
      </header>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'requests', label: 'Requests', badge: incomingCount || undefined },
          { key: 'friends', label: 'Friends' },
          { key: 'network', label: 'Network' },
        ]}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="card px-2 sm:px-4"
        >
          {tab === 'requests' && <RequestsTab />}
          {tab === 'friends' && <FriendsTab />}
          {tab === 'network' && <NetworkTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function RequestsTab() {
  const incoming = useIncomingRequests();
  const outgoing = useOutgoingRequests();
  const { accept, decline } = useRespondToRequest();
  const inRows = incoming.data?.data ?? [];
  const outRows = outgoing.data?.data ?? [];

  if (inRows.length === 0 && outRows.length === 0) {
    return <Empty icon={<UserPlus size={22} />} text="No pending requests." />;
  }

  return (
    <div className="divide-y divide-[var(--hairline)]">
      {inRows.length > 0 && (
        <p className="px-3 pt-4 pb-1 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
          Incoming · {inRows.length}
        </p>
      )}
      {inRows.map((r) => {
        const p = r.user;
        if (!p) return null;
        return (
          <div key={r.requestId} className="px-3">
            <PersonRow {...p}
              action={
                <div className="flex gap-2">
                  <Button variant="celebrate" className="h-9 px-4 text-[13px]"
                    loading={accept.isPending} onClick={() => accept.mutate(r.requestId)}>Accept</Button>
                  <Button variant="ghost" className="h-9 px-3 text-[13px]"
                    loading={decline.isPending} onClick={() => decline.mutate(r.requestId)}>Decline</Button>
                </div>
              }
            />
          </div>
        );
      })}

      {outRows.length > 0 && (
        <p className="px-3 pt-4 pb-1 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
          Sent · {outRows.length}
        </p>
      )}
      {outRows.map((r) => {
        const p = r.user;
        if (!p) return null;
        return (
          <div key={r.requestId} className="px-3">
            <PersonRow {...p} subtitle="Request sent" action={<CancelButton requestId={r.requestId} username={p.username} />} />
          </div>
        );
      })}
    </div>
  );
}

function CancelButton({ requestId, username }: { requestId: string; username: string }) {
  const cancel = useCancelRequest(username);
  return (
    <Button variant="ghost" className="h-9 px-3 text-[13px]"
      loading={cancel.isPending} onClick={() => cancel.mutate(requestId)}>Cancel</Button>
  );
}

function FriendsTab() {
  const { data } = useFriends();
  const rows = data?.data ?? [];
  if (rows.length === 0) return <Empty icon={<Users size={22} />} text="No friends yet — Discover is a good place to start." />;
  return (
    <div className="divide-y divide-[var(--hairline)]">
      {rows.map((f) => <div key={f.username} className="px-3"><PersonRow {...f} /></div>)}
    </div>
  );
}

function NetworkTab() {
  const followers = useFollowers();
  const following = useFollowing();
  const fr = followers.data?.data ?? [];
  const fg = following.data?.data ?? [];
  return (
    <div>
      <p className="px-3 pt-4 pb-1 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
        Following · {fg.length}
      </p>
      <div className="divide-y divide-[var(--hairline)]">
        {fg.map((f) => <div key={f.username} className="px-3"><PersonRow {...f} /></div>)}
        {fg.length === 0 && <Empty icon={<Compass size={20} />} text="Not following anyone yet." compact />}
      </div>
      <p className="px-3 mt-4 pb-1 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
        Followers · {fr.length}
      </p>
      <div className="divide-y divide-[var(--hairline)]">
        {fr.map((f) => <div key={f.username} className="px-3"><PersonRow {...f} /></div>)}
        {fr.length === 0 && <Empty icon={<Compass size={20} />} text="No followers yet." compact />}
      </div>
    </div>
  );
}

function Empty({ icon, text, compact }: { icon: React.ReactNode; text: string; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-2 text-center ${compact ? 'py-6' : 'py-12'}`}>
      <div className="grid size-11 place-items-center rounded-2xl"
        style={{ background: 'linear-gradient(135deg, var(--blob-lavender), var(--accent-soft))' }}>
        {icon}
      </div>
      <p className="text-[14px] text-ink-soft">{text}</p>
    </div>
  );
}