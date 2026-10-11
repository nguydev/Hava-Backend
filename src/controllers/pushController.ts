import type { Request, Response } from 'express';

import { HttpError, ah } from '../lib/http';
import { isExpoToken, sendExpoPush } from '../lib/push';
import { PushToken } from '../models';

/** POST /push/register — Body: { token, platform? }. Upserts the caller's device token. */
export const register = ah(async (req: Request, res: Response) => {
  const { token, platform } = req.body ?? {};
  if (!isExpoToken(token)) throw new HttpError('A valid Expo push token is required', 400);

  await PushToken.findOneAndUpdate(
    { token },
    {
      $set: {
        token,
        userId: req.user!.userId,
        role: req.user!.role,
        platform: platform ?? null,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  res.status(201).json({ ok: true });
});

/** POST /push/unregister — Body: { token }. Removes a device token (e.g. on logout). */
export const unregister = ah(async (req: Request, res: Response) => {
  const { token } = req.body ?? {};
  if (token) await PushToken.deleteOne({ token });
  res.json({ ok: true });
});

/** POST /push/test — sends a test notification to the caller's registered devices. */
export const test = ah(async (req: Request, res: Response) => {
  const rows = await PushToken.find({ userId: req.user!.userId }, { token: 1 }).lean();
  const result = await sendExpoPush(
    rows.map((r: any) => r.token),
    { title: 'GOODR', body: 'Push notifications are working 🎉', data: { type: 'test' } },
  );
  res.json({ registeredDevices: rows.length, ...result });
});
