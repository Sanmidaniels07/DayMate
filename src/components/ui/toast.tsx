'use client';
import { create } from 'zustand';
import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: ToastKind; message: string }

interface ToastStore {
  toasts: Toast[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  push: (kind, message) =>
    set((s) => ({ toasts: [...s.toasts, { id: Date.now() + Math.random(), kind, message }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience — call from anywhere: toast.success('Saved'). */
export const toast = {
  success: (m: string) => useToast.getState().push('success', m),
  error: (m: string) => useToast.getState().push('error', m),
  info: (m: string) => useToast.getState().push('info', m),
};

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const COLORS = { success: 'var(--success)', error: 'var(--danger)', info: 'var(--accent)' };

export function ToastViewport() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[200] flex flex-col items-center gap-2 px-4 lg:bottom-6">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} onDone={() => dismiss(t.id)} />)}
    </div>
  );
}

function ToastItem({ toast: t, onDone }: { toast: Toast; onDone: () => void }) {
  const Icon = ICONS[t.kind];
  useEffect(() => {
    const timer = setTimeout(onDone, 3500);
    return () => clearTimeout(timer);
  }, [onDone]);
  return (
    <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-charcoal px-4 py-3 text-white shadow-[var(--shadow-float)] animate-[slideup_0.25s_ease]">
      <Icon size={20} style={{ color: COLORS[t.kind] }} />
      <p className="text-[14px]">{t.message}</p>
    </div>
  );
}