'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger, loading, onConfirm, onCancel,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[150] bg-opacity-25 backdrop-brightness-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <div className="fixed inset-0 z-[151] flex items-center justify-center p-4">
            <motion.div
              className="card w-full max-w-sm p-6"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-display text-lg font-semibold">{title}</h2>
              {message && <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{message}</p>}
              <div className="mt-6 flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={onCancel} disabled={loading}>
                  {cancelLabel}
                </Button>
                <Button
                  variant={danger ? 'danger' : 'primary'}
                  className="flex-1"
                  onClick={onConfirm}
                  loading={loading}
                >
                  {confirmLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}