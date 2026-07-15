'use client';
import { useState } from 'react';
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
      <h1 className="font-display text-[length:var(--text-title)] font-semibold">Connections</h1>
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'requests', label: 'Requests', badge: incomingCount || undefined },
          { key: 'friends', label: 'Friends' },
          { key: 'network', label: 'Network' },
        ]}
      />
      <div className="card px-5">
        {tab === 'requests' && <RequestsTab />}
        {tab === 'friends' && <FriendsTab />}
        {tab === 'network' && <NetworkTab />}
      </div>
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
    return <Empty text="No pending requests." />;
  }
  return (
    <div className="divide-y divide-[var(--hairline)]">
      {inRows.map((r) => {
        const p = r.requester?.profile;
        if (!p) return null;
        return (
          <PersonRow key={r.id} {...p}
            action={
              <div className="flex gap-2">
                <Button variant="celebrate" className="h-9 px-4 text-[13px]"
                  loading={accept.isPending} onClick={() => accept.mutate(r.id)}>Accept</Button>
                <Button variant="ghost" className="h-9 px-3 text-[13px]"
                  loading={decline.isPending} onClick={() => decline.mutate(r.id)}>Decline</Button>
              </div>
            } />
        );
      })}
      {outRows.map((r) => {
        const p = r.addressee?.profile;
        if (!p) return null;
        return <PersonRow key={r.id} {...p} subtitle="Request sent"
          action={<CancelButton requestId={r.id} username={p.username} />} />;
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
  if (rows.length === 0) return <Empty text="No friends yet — Discover is a good place to start." />;
  return (
    <div className="divide-y divide-[var(--hairline)]">
      {rows.map((f) => <PersonRow key={f.username} {...f} />)}
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
      <p className="pt-4 pb-1 text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
        Following · {fg.length}
      </p>
      <div className="divide-y divide-[var(--hairline)]">
        {fg.map((f) => <PersonRow key={f.username} {...f} />)}
        {fg.length === 0 && <Empty text="Not following anyone yet." />}
      </div>
      <p className="mt-4 pb-1 text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
        Followers · {fr.length}
      </p>
      <div className="divide-y divide-[var(--hairline)]">
        {fr.map((f) => <PersonRow key={f.username} {...f} />)}
        {fr.length === 0 && <Empty text="No followers yet." />}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-10 text-center text-[14px] text-ink-soft">{text}</p>;
}