/**
 * Push delivery via Expo's push service. Because the mobile app is Expo-based,
 * devices register an Expo push token (ExponentPushToken[...]) and Expo relays
 * to FCM (Android) / APNs (iOS) using the project's credentials configured in
 * EAS — so the backend needs no Firebase secret to send.
 */
import { PushToken } from '../models';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export const isExpoToken = (t: unknown): t is string =>
  typeof t === 'string' && (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['));

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/** Send to explicit Expo tokens. Never throws — push is best-effort. */
export async function sendExpoPush(tokens: string[], payload: PushPayload): Promise<{ sent: number }> {
  const valid = Array.from(new Set(tokens.filter(isExpoToken)));
  if (valid.length === 0) return { sent: 0 };

  const messages = valid.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: 'default',
  }));

  try {
    // Expo accepts up to 100 messages per request.
    for (let i = 0; i < messages.length; i += 100) {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages.slice(i, i + 100)),
      });
    }
    return { sent: valid.length };
  } catch (err) {
    console.error('[push] send failed:', err);
    return { sent: 0 };
  }
}

/**
 * Send to registered devices, optionally filtered by role
 * (e.g. only contractors, only drivers). Best-effort.
 */
export async function pushToUsers(
  payload: PushPayload,
  opts: { roles?: string[] } = {},
): Promise<{ sent: number }> {
  const filter = opts.roles?.length ? { role: { $in: opts.roles } } : {};
  const rows = await PushToken.find(filter, { token: 1 }).lean();
  return sendExpoPush(rows.map((r: any) => r.token), payload);
}
