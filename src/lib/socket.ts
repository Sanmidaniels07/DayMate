import { io, type Socket } from 'socket.io-client';
import { useSessionStore } from '@/stores/session';

/** The C2 event contract, mirrored. Keep in sync with the backend's events.ts. */
export const SocketEvents = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_EDITED: 'message:edited',
  MESSAGE_DELETED: 'message:deleted',
  CONVERSATION_NEW: 'conversation:new',
  CONVERSATION_READ: 'conversation:read',
  TYPING_STARTED: 'typing:started',
  TYPING_STOPPED: 'typing:stopped',
  PRESENCE_CHANGED: 'presence:changed',
  NOTIFICATION_NEW: 'notification:new',
  CALL_INCOMING: 'call:incoming',
  CALL_ANSWERED: 'call:answered',
  CALL_DECLINED: 'call:declined',
  CALL_ENDED: 'call:ended',
  CALL_SIGNAL: 'call:signal',
  CLIENT_TYPING_START: 'client:typing:start',
  CLIENT_TYPING_STOP: 'client:typing:stop',
  CLIENT_CALL_SIGNAL: 'client:call:signal',
} as const;

let socket: Socket | null = null;

/** Connect (or reconnect with a fresh token). Called after login/refresh. */
export function connectSocket(): Socket {
  const token = useSessionStore.getState().accessToken;
  if (!token) throw new Error('connectSocket called without a session');

  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(process.env.NEXT_PUBLIC_API_URL!, {
    path: '/socket.io',
    auth: { token },
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}

export function getSocket(): Socket | null {
  return socket;
}