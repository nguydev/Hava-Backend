import type { Request, Response } from 'express';

import { HttpError, ah } from '../lib/http';
import { User } from '../models';

const EDITABLE = [
  'name',
  'email',
  'phone',
  'avatar',
  'company',
  'businessType',
  'address',
  'vehicle',
  'driverStatus',
  'completedDeliveries',
  'rating',
];

/** GET /profile?role= — returns the authenticated user. */
export const getProfile = ah(async (req: Request, res: Response) => {
  const user = await User.findOne({ id: req.user!.userId });
  if (!user) throw new HttpError('User not found', 404);
  res.json(user.toJSON());
});

/** PUT /profile — Body: { role, ...patch }. Updates the authenticated user. */
export const updateProfile = ah(async (req: Request, res: Response) => {
  const patch: Record<string, unknown> = {};
  for (const key of EDITABLE) {
    if (req.body?.[key] !== undefined) patch[key] = req.body[key];
  }

  const user = await User.findOneAndUpdate(
    { id: req.user!.userId },
    { $set: patch },
    { new: true },
  );
  if (!user) throw new HttpError('User not found', 404);
  res.json(user.toJSON());
});

const DEFAULT_PREFS = {
  orderUpdates: true,
  quoteUpdates: true,
  deliveryUpdates: true,
  etaUpdates: true,
  promotions: false,
  channelPush: true,
  channelEmail: true,
  channelSms: false,
};

/** GET /profile/notification-preferences — server-persisted channel/type prefs. */
export const getNotificationPreferences = ah(async (req: Request, res: Response) => {
  const user = await User.findOne({ id: req.user!.userId });
  if (!user) throw new HttpError('User not found', 404);
  res.json(user.get('notificationPreferences') ?? DEFAULT_PREFS);
});

/** PUT /profile/notification-preferences — Body: NotificationPreferences */
export const updateNotificationPreferences = ah(async (req: Request, res: Response) => {
  const prefs = { ...DEFAULT_PREFS, ...(req.body ?? {}) };
  const user = await User.findOneAndUpdate(
    { id: req.user!.userId },
    { $set: { notificationPreferences: prefs } },
    { new: true },
  );
  if (!user) throw new HttpError('User not found', 404);
  res.json(user.get('notificationPreferences'));
});
