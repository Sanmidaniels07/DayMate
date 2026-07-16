'use client';
import { useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import {
  X, ShieldAlert, Flag, Lock, ChevronRight,
  MessageSquareWarning, EyeOff, Skull, Copyright, UserX, HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useReport, REPORT_REASONS, type ReportTargetType } from '@/hooks/use-reports';

interface Props {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  onClose: () => void;
}

const REASON_META: Record<string, { icon: typeof Flag; description: string }> = {
  SPAM: { icon: MessageSquareWarning, description: 'Repetitive, unwanted, or promotional content' },
  HARASSMENT: { icon: UserX, description: 'Targeted abuse, bullying, or threats' },
  HATE_SPEECH: { icon: ShieldAlert, description: 'Attacks based on identity or protected traits' },
  NUDITY: { icon: EyeOff, description: 'Sexual or explicit content' },
  VIOLENCE: { icon: Skull, description: 'Graphic violence or incitement to harm' },
  IMPERSONATION: { icon: Copyright, description: 'Pretending to be someone else' },
  OTHER: { icon: HelpCircle, description: 'Something else not listed here' },
};
const FALLBACK_META = { icon: Flag, description: 'Report this for review' };

const overlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const panel: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.15 } },
};

export function ReportModal({ targetType, targetId, targetLabel, onClose }: Props) {
  const report = useReport();
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');

  const submit = () => {
    if (!reason) return;
    report.mutate(
      { targetType, targetId, reason, details: details.trim() || undefined },
      {
        onSuccess: (res) => {
          toast.success(res.data.duplicate ? 'Already reported — thanks.' : 'Report submitted. Thank you.');
          onClose();
        },
        onError: () => toast.error('Could not submit. Try again.'),
      },
    );
  };

  const needsDetails = reason === 'OTHER';
  const detailsValid = !needsDetails || details.trim().length >= 10;

  return (
    <AnimatePresence>
      <motion.div
        variants={overlay}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 z-[150] flex items-end justify-center bg-opacity-25 backdrop-brightness-50 p-4 sm:items-center"
        onClick={onClose}
      >
        <motion.div
          variants={panel}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="card flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden p-0 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[var(--hairline)] sm:hidden" />

         
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4 sm:pt-6">
            <div className="relative flex flex-col items-center pb-5 text-center">
              <div className="relative mb-3 grid size-16 place-items-center">
                <motion.span
                  initial={{ scale: 0.6, opacity: 0.5 }}
                  animate={{ scale: [0.6, 1.35], opacity: [0.35, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full bg-[var(--danger)]/20"
                />
                <motion.div
                  initial={{ scale: 0.7, rotate: -8, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.4, ease: 'backOut', delay: 0.05 }}
                  className="relative grid size-14 place-items-center rounded-2xl bg-[var(--danger)]/10 text-danger shadow-sm"
                >
                  <ShieldAlert size={26} strokeWidth={1.8} />
                </motion.div>
              </div>

              <button
                onClick={onClose}
                className="absolute right-0 top-0 grid size-8 place-items-center rounded-full text-ink-faint transition-colors hover:bg-[var(--surface-raised)]"
              >
                <X size={18} />
              </button>

              <h2 className="font-display text-[19px] font-semibold leading-tight">
                Report {targetLabel}
              </h2>
              <p className="mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-ink-faint">
                Help us understand what&apos;s wrong. Your report stays between you and our team.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map((r, i) => {
                const meta = REASON_META[r.key] ?? FALLBACK_META;
                const Icon = meta.icon;
                const selected = reason === r.key;
                return (
                  <motion.button
                    key={r.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.03, duration: 0.2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setReason(r.key)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      selected
                        ? 'border-accent bg-[var(--accent-soft)]'
                        : 'border-[var(--hairline)] hover:bg-[var(--surface-raised)]'
                    }`}
                  >
                    <div
                      className={`grid size-9 shrink-0 place-items-center rounded-xl transition-colors ${
                        selected ? 'bg-accent text-white' : 'bg-[var(--surface-raised)] text-ink-soft'
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold leading-tight">{r.label}</p>
                      <p className="mt-0.5 truncate text-[12px] text-ink-faint">{meta.description}</p>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`shrink-0 transition-all ${selected ? 'text-accent' : 'text-ink-faint/40'}`}
                    />
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {needsDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Please describe the issue…"
                    rows={3}
                    maxLength={1000}
                    className={`w-full resize-none rounded-xl border bg-[var(--surface-raised)] px-4 py-3 text-[14px] outline-none transition-colors ${
                      details.length > 0 && !detailsValid
                        ? 'border-[var(--danger)]/50 focus:border-danger'
                        : 'border-[var(--hairline)] focus:border-accent'
                    }`}
                  />
                  <div className="mt-1.5 flex items-center justify-between px-0.5">
                    <p className={`text-[11px] ${!detailsValid && details.length > 0 ? 'text-danger' : 'text-ink-faint'}`}>
                      {details.length > 0 && !detailsValid ? 'At least 10 characters required' : ' '}
                    </p>
                    <p className="text-[11px] text-ink-faint">{details.length}/1000</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-[var(--surface-raised)] px-4 py-3">
              <Lock size={14} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-[12px] leading-relaxed text-ink-faint">
                {targetLabel} won&apos;t be notified who filed this report. Our team reviews every
                submission and takes action based on our community guidelines.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 border-t border-[var(--hairline)] px-6 py-4">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={submit}
              loading={report.isPending}
              disabled={!reason || !detailsValid}
              variant="danger"
              className="flex-[2]"
            >
              Submit report
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}