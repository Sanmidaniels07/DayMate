'use client';
import { useRef, useState, useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Trash2, Flag, X, MoreHorizontal } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  isMine: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export function PostActionsMenu({ open, onClose, isMine, onEdit, onDelete, onReport, anchorRef }: Props) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
  }, [open, anchorRef]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-opacity-25 backdrop-brightness-50 sm:bg-transparent sm:backdrop-blur-0"
            onClick={onClose}
          />

          {/* Mobile: bottom sheet — unchanged */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-[141] rounded-t-[28px] bg-[var(--surface)] p-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-float)] sm:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[var(--hairline)]" />
            <div className="flex flex-col gap-1 py-1">
              {isMine && (
                <>
                  <SheetItem icon={Pencil} label="Edit post" onClick={() => { onClose(); onEdit(); }} />
                  <SheetItem icon={Trash2} label="Delete post" danger onClick={() => { onClose(); onDelete(); }} />
                  <div className="my-1.5 h-px bg-[var(--hairline)]" />
                </>
              )}
              {!isMine && (
                <SheetItem icon={Flag} label="Report post" danger onClick={() => { onClose(); onReport(); }} />
              )}
              <SheetItem icon={X} label="Cancel" onClick={onClose} />
            </div>
          </motion.div>

          {/* Desktop: anchored dropdown, right next to the "…" that opened it */}
          {pos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'fixed', top: pos.top, right: pos.right }}
              className="z-[141] hidden w-52 origin-top-right overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] shadow-[var(--shadow-float)] sm:block"
              onClick={(e) => e.stopPropagation()}
            >
              {isMine && (
                <>
                  <DropdownItem icon={Pencil} label="Edit post" onClick={() => { onClose(); onEdit(); }} />
                  <DropdownItem icon={Trash2} label="Delete post" danger onClick={() => { onClose(); onDelete(); }} />
                  <div className="h-px bg-[var(--hairline)]" />
                </>
              )}
              {!isMine && (
                <DropdownItem icon={Flag} label="Report post" danger onClick={() => { onClose(); onReport(); }} />
              )}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

function SheetItem({ icon: Icon, label, onClick, danger }: { icon: typeof Pencil; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-medium transition-colors ${
        danger ? 'text-danger hover:bg-[var(--danger)]/5' : 'text-ink hover:bg-[var(--surface-raised)]'
      }`}>
      <Icon size={19} />
      {label}
    </button>
  );
}

function DropdownItem({ icon: Icon, label, onClick, danger }: { icon: typeof Pencil; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-4 py-3 text-left text-[14px] font-medium transition-colors ${
        danger ? 'text-danger hover:bg-[var(--danger)]/5' : 'text-ink hover:bg-[var(--surface-raised)]'
      }`}>
      <Icon size={16} />
      {label}
    </button>
  );
}