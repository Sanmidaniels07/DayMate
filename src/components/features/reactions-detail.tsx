'use client';
import { usePostReactions } from '@/hooks/use-feed';

export function ReactionsDetail({ postId }: { postId: string }) {
  const { data, isLoading } = usePostReactions(postId, true);
  const reactions = data?.data ?? [];

  if (isLoading) {
    return <div className="flex justify-center py-3"><span className="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>;
  }
  if (reactions.length === 0) {
    return <p className="py-2 text-center text-[13px] text-ink-faint">No reactions yet.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2 py-1">
      {reactions.map((r) => (
        <span key={r.emoji}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] ${
            r.reactedByMe ? 'border-accent bg-[var(--accent-soft)]' : 'border-[var(--hairline)]'
          }`}>
          <span className="text-[15px]">{r.emoji}</span>
          <span className="font-mono text-ink-soft">{r.count}</span>
        </span>
      ))}
    </div>
  );
}