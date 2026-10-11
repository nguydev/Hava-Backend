import { Notification } from '../models';
import { pushToUsers } from './push';

/**
 * Insert a notification at the top of the feed (highest seq = newest) AND fire a
 * device push to registered users. Push is best-effort — it never blocks or
 * fails the in-app notification.
 */
export async function pushNotification(fields: {
  category: string;
  title: string;
  message: string;
  time?: string;
  targetType?: 'order' | 'quote' | 'delivery';
  targetId?: string;
  /** Restrict the device push to these roles (default: everyone). */
  roles?: string[];
}) {
  const { roles, ...notif } = fields;
  const top = await Notification.findOne().sort({ seq: -1 }).lean();
  const seq = (top?.seq ?? 0) + 1;
  const doc = await Notification.create({
    id: `n-${Date.now()}`,
    read: false,
    time: 'Just now',
    ...notif,
    seq,
  });

  // Best-effort device push (do not await the network in the request path).
  void pushToUsers(
    {
      title: notif.title,
      body: notif.message,
      data: { category: notif.category, targetType: notif.targetType, targetId: notif.targetId },
    },
    { roles },
  ).catch((e) => console.error('[push] pushToUsers failed:', e));

  return doc;
}
