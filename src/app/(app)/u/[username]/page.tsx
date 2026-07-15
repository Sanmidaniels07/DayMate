'use client';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { Button } from '@/components/ui/button';
import { RelationshipButton } from '@/components/features/relationship-button';
import { useProfile, useToggleFollow } from '@/hooks/use-social';
import { MONTHS } from '@/lib/months';

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();
  const { data, isLoading, error } = useProfile(username);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>;
  }
  if (error || !data) {
    return <div className="card p-10 text-center text-ink-soft">This profile isn&apos;t available.</div>;
  }
  const p = data.data;
  const follow = useToggleFollow(p.username, p.relationship?.isFollowing ?? false);

  return (
    <div className="flex flex-col gap-5">
      <div className="card overflow-hidden">
        {/* Tinted banner echoing their blob */}
        <div className="h-24" style={{ background: `var(--blob-${p.blobTint ?? 'powder'})` }} />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between">
            <div className="rounded-full ring-4 ring-[var(--surface)]">
              <BlobAvatar name={p.displayName} tint={p.blobTint} avatarUrl={p.avatarUrl} size={80} />
            </div>
            {p.isOwner ? (
              <Button variant="ghost" onClick={() => router.push('/me/edit')}>Edit profile</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" className="px-4"
                  loading={follow.isPending} onClick={() => follow.mutate()}>
                  {p.relationship?.isFollowing ? 'Following' : 'Follow'}
                </Button>
                <RelationshipButton profile={p} />
              </div>
            )}
          </div>

          <h1 className="mt-3 text-[22px] font-semibold leading-tight">{p.displayName}</h1>
          <p className="text-[14px] text-ink-faint">@{p.username}</p>
          {p.bio && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{p.bio}</p>}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-soft">
            <span className="flex items-center gap-1.5">
              🎂 {MONTHS[p.birthMonth - 1]} {p.birthDay}
            </span>
            {p.city && <span>📍 {p.city}{p.country ? `, ${p.country}` : ''}</span>}
            {p.ageBracket && <span className="font-mono text-ink-faint">{p.ageBracket}</span>}
          </div>
        </div>
      </div>

      {!p.isOwner && p.relationship?.isFriend && (
        <Link href={`/chat?with=${p.username}`}>
          <Button variant="primary" className="w-full">Message</Button>
        </Link>
      )}
    </div>
  );
}

function Spinner() {
  return <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />;
}