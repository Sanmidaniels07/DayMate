import type { Notification } from '@/hooks/use-notifications';

export function notificationHref(n: Notification): string {
  switch (n.entityType) {
    case 'post': return `/post/${n.entityId}`;
    case 'conversation': return `/chat/${n.entityId}`;
    case 'user': return n.actor?.profile ? `/u/${n.actor.profile.username}` : '/connections';
    case 'friendRequest': return '/connections';
    default: return '/notifications';
  }
}