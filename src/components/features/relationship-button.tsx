'use client';
import { Button } from '@/components/ui/button';
import {
  useSendRequest, useCancelRequest, useAcceptRequest, useUnfriend, type ProfileView,
} from '@/hooks/use-social';

export function RelationshipButton({ profile }: { profile: ProfileView }) {
  const r = profile.relationship;
  const send = useSendRequest(profile.username);
  const cancel = useCancelRequest(profile.username);
  const accept = useAcceptRequest(profile.username);
  const unfriend = useUnfriend(profile.username);
  if (!r) return null; // own profile

  if (r.isFriend) {
    return <Button variant="ghost" loading={unfriend.isPending} onClick={() => unfriend.mutate()}>Friends ✓</Button>;
  }
  if (r.pendingRequest?.direction === 'incoming') {
    return (
      <Button variant="celebrate" loading={accept.isPending}
        onClick={() => accept.mutate(r.pendingRequest!.requestId)}>
        Accept request
      </Button>
    );
  }
  if (r.pendingRequest?.direction === 'outgoing') {
    return (
      <Button variant="ghost" loading={cancel.isPending}
        onClick={() => cancel.mutate(r.pendingRequest!.requestId)}>
        Requested
      </Button>
    );
  }
  return <Button loading={send.isPending} onClick={() => send.mutate()}>Add friend</Button>;
}