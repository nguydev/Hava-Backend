import type { Request, Response } from 'express';

import { ah } from '../../lib/http';
import { pushNotification } from '../../lib/notify';
import { PushToken } from '../../models';
import { AdminNotification } from '../../models/admin';

/** Audience string → device-push role filter (undefined = everyone). */
function rolesForAudience(audience: string): string[] | undefined {
  const a = audience.toLowerCase();
  if (a.includes('contractor')) return ['contractor'];
  if (a.includes('driver')) return ['driver'];
  return undefined;
}

/** Real reach = registered devices matching the audience. */
async function computeReach(roles: string[] | undefined): Promise<number> {
  return PushToken.countDocuments(roles ? { role: { $in: roles } } : {});
}

/** GET /admin/notifications — broadcast history, newest first. */
export const list = ah(async (_req: Request, res: Response) => {
  const rows = await AdminNotification.find().sort({ at: -1 });
  res.json(rows.map((n) => n.toJSON()));
});

/**
 * POST /admin/notifications — send/schedule a broadcast.
 * A "sent" broadcast also drops a notification into the mobile app's feed so
 * app users actually receive it (admin ↔ app sync).
 */
export const create = ah(async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const id = body.id ?? `n-${Date.now()}`;
  const roles = rolesForAudience(String(body.audience ?? ''));

  const doc = await AdminNotification.findOneAndUpdate(
    { id },
    { $set: { ...body, id, reach: await computeReach(roles) } }, // real reach, not client-supplied
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  if (doc!.get('status') === 'sent') {
    await pushNotification({
      category: 'System',
      title: doc!.get('title') ?? '',
      message: doc!.get('body') ?? '',
      roles,
    });
  }

  res.status(201).json(doc!.toJSON());
});

/** DELETE /admin/notifications/:id */
export const remove = ah(async (req: Request, res: Response) => {
  await AdminNotification.deleteOne({ id: req.params.id });
  res.json({ id: req.params.id });
});
