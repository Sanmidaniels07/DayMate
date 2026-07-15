import { create } from 'zustand';
import type { Call } from '@/hooks/use-calls';
import type { CallSession } from '@/lib/webrtc';

type Phase = 'idle' | 'ringing-out' | 'ringing-in' | 'connecting' | 'active' | 'ended';

interface CallState {
  phase: Phase;
  call: Call | null;
  session: CallSession | null;
  isCaller: boolean;
  set: (partial: Partial<CallState>) => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  phase: 'idle',
  call: null,
  session: null,
  isCaller: false,
  set: (partial) => set(partial),
  reset: () => set({ phase: 'idle', call: null, session: null, isCaller: false }),
}));