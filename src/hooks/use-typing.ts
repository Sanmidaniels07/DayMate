"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket, SocketEvents } from "@/lib/socket";

export function useTyping(conversationId: string) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const stopTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const lastStart = useRef(0);
  const expiryTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    const onStart = ({
      conversationId: cid,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (cid !== conversationId) return;
      setTypingUsers((s) => new Set(s).add(userId));
      const timers = expiryTimers.current;
      clearTimeout(timers.get(userId));
      timers.set(
        userId,
        setTimeout(() => {
          setTypingUsers((s) => {
            const n = new Set(s);
            n.delete(userId);
            return n;
          });
        }, 5000),
      );
    };
    const onStop = ({
      conversationId: cid,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      if (cid !== conversationId) return;
      setTypingUsers((s) => {
        const n = new Set(s);
        n.delete(userId);
        return n;
      });
    };

    socket.on(SocketEvents.TYPING_STARTED, onStart);
    socket.on(SocketEvents.TYPING_STOPPED, onStop);
    return () => {
      socket.off(SocketEvents.TYPING_STARTED, onStart);
      socket.off(SocketEvents.TYPING_STOPPED, onStop);
      expiryTimers.current.forEach(clearTimeout);
    };
  }, [conversationId]);

  // ---- Outgoing: emit my typing ----
  const onInput = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    const now = Date.now();
    // Throttle "start" to once per 3s; refresh "stop" debounce each keystroke.
    if (now - lastStart.current > 3000) {
      socket.emit(SocketEvents.CLIENT_TYPING_START, { conversationId });
      lastStart.current = now;
    }
    clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      socket.emit(SocketEvents.CLIENT_TYPING_STOP, { conversationId });
      lastStart.current = 0;
    }, 2500);
  }, [conversationId]);

  return { typingUsers, onInput };
}
