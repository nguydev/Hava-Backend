import type { Request, Response } from 'express';

import { HttpError, ah } from '../lib/http';
import { Notification } from '../models';

/** GET /notifications — newest first. */
export const listNotifications = ah(async (_req: Request, res: Response) => {
  const items = await Notification.find().sort({ seq: -1 });
  res.json(items.map((n) => n.toJSON()));
});

/** PATCH /notifications/:id/read */
export const markNotificationRead = ah(async (req: Request, res: Response) => {
  const n = await Notification.findOneAndUpdate(
    { id: req.params.id },
    { $set: { read: true } },
    { new: true },
  );
  if (!n) throw new HttpError('Notification not found', 404);
  res.json(n.toJSON());
});

/** PATCH /notifications/read-all */
export const markAllNotificationsRead = ah(async (_req: Request, res: Response) => {
  await Notification.updateMany({}, { $set: { read: true } });
  const items = await Notification.find().sort({ seq: -1 });
  res.json(items.map((n) => n.toJSON()));
});
