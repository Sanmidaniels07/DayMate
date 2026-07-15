'use client';
import { api } from '@/lib/api';

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function enablePush(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const { data: key } = await api<{ data: { enabled: boolean; publicKey: string | null } }>(
    '/notifications/push/public-key',
  );
  if (!key.enabled || !key.publicKey) return 'unsupported';

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key.publicKey),
  });

  const json = sub.toJSON();
  await api('/notifications/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
    }),
  });
  return 'granted';
}