'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useMyReports } from '@/hooks/use-reports';
import { timeAgo } from '@/lib/time';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-[var(--celebrate-soft)] text-[#8a6410]',
  REVIEWING: 'bg-[var(--accent-soft)] text-accent',
  RESOLVED: 'bg-[var(--success)]/12 text-[var(--success)]',
  DISMISSED: 'bg-black/[0.05] text-ink-faint',
};
const REASON_LABEL: Record<string, string> = {
  HARASSMENT: 'Harassment', SPAM: 'Spam', INAPPROPRIATE_CONTENT: 'Inappropriate content',
  FAKE_PROFILE: 'Fake profile', UNDERAGE_USER: 'Underage user', SCAM_OR_FRAUD: 'Scam or fraud', OTHER: 'Other',
};

export default function MyReportsPage() {
  const { data, isLoading } = useMyReports();
  const reports = data?.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/settings"><ArrowLeft size={22} /></Link>
        <h1 className="font-display text-[length:var(--text-title)] font-semibold">My reports</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : reports.length === 0 ? (
        <div className="card p-10 text-center text-ink-soft">You haven&apos;t filed any reports.</div>
      ) : (
        <div className="card divide-y divide-[var(--hairline)] px-5">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 py-3.5">
              <div className="min-w-0">
                <p className="text-[14px] font-medium">
                  {REASON_LABEL[r.reason] ?? r.reason} · <span className="text-ink-faint">{r.targetType.toLowerCase()}</span>
                </p>
                <p className="text-[12px] text-ink-faint">{timeAgo(r.createdAt)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[r.status] ?? ''}`}>
                {r.status.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}