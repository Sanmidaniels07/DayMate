'use client';
import { useEffect } from 'react';
import { getSocket, SocketEvents } from '@/lib/socket';
import { useCallStore } from '@/stores/call';
import { useIceServers } from '@/hooks/use-calls';
import { CallSession } from '@/lib/webrtc';
import type { Call } from '@/hooks/use-calls';
import { CallOverlay } from './call-overlay';

export function CallManager() {
  const { phase, set, reset } = useCallStore();
  const ice = useIceServers();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onIncoming = ({ call }: { call: Call }) => {
      if (useCallStore.getState().phase !== 'idle') return; // busy: ignore (backend also guards)
      set({ phase: 'ringing-in', call, isCaller: false });
    };
    const onSignal = async ({ data }: { data: Parameters<CallSession['handleSignal']>[0] }) => {
      const s = useCallStore.getState().session;
      if (s) await s.handleSignal(data);
    };
    const onAnswered = () => {
      if (useCallStore.getState().isCaller) set({ phase: 'connecting' });
    };
    const onEnded = () => {
      useCallStore.getState().session?.hangup();
      set({ phase: 'ended' });
      setTimeout(() => reset(), 1500);
    };

    socket.on(SocketEvents.CALL_INCOMING, onIncoming);
    socket.on(SocketEvents.CALL_SIGNAL, onSignal);
    socket.on(SocketEvents.CALL_ANSWERED, onAnswered);
    socket.on(SocketEvents.CALL_DECLINED, onEnded);
    socket.on(SocketEvents.CALL_ENDED, onEnded);
    return () => {
      socket.off(SocketEvents.CALL_INCOMING, onIncoming);
      socket.off(SocketEvents.CALL_SIGNAL, onSignal);
      socket.off(SocketEvents.CALL_ANSWERED, onAnswered);
      socket.off(SocketEvents.CALL_DECLINED, onEnded);
      socket.off(SocketEvents.CALL_ENDED, onEnded);
    };
  }, [set, reset]);

  if (phase === 'idle') return null;
  return <CallOverlay iceServers={ice.data?.data.iceServers ?? []} />;
}