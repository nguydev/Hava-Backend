/** Admin app settings — a single persisted document (id: 'app'). */
import type { Request, Response } from 'express';

import { ah } from '../../lib/http';
import { Setting } from '../../models/admin';

const DEFAULTS = {
  id: 'app',
  profile: {
    name: 'Operations Admin',
    email: 'ops@goodr.com',
    phone: '(800) 555-4663',
    avatar: '',
  },
  business: {
    legalName: 'GOODR HVAC Supply',
    supportEmail: 'support@goodr.com',
    supportPhone: '(800) 555-4663',
    address: '740 Industrial Pkwy, Denver, CO 80216',
    currency: 'USD',
    timezone: 'America/Denver',
  },
  zones: { Denver: true, Aurora: true, Lakewood: true, 'Highlands Ranch': true, Englewood: false },
  availability: { defaultAvailability: 'in_stock', lowStockThreshold: 5, autoAssign: false, notifyLowStock: true },
  alerts: { newOrder: true, delayedDelivery: true, lowStock: true, failedPayment: true, newContractor: false },
};

async function getOrCreate() {
  let doc = await Setting.findOne({ id: 'app' });
  if (!doc) doc = await Setting.create(DEFAULTS);
  return doc;
}

/** GET /admin/settings */
export const get = ah(async (_req: Request, res: Response) => {
  const doc = await getOrCreate();
  res.json(doc.toJSON());
});

/** PUT /admin/settings — Body: partial { business?, zones?, availability?, alerts? } (merged per-section). */
export const update = ah(async (req: Request, res: Response) => {
  const doc = await getOrCreate();
  const body = req.body ?? {};
  for (const section of ['profile', 'business', 'zones', 'availability', 'alerts'] as const) {
    if (body[section] && typeof body[section] === 'object') {
      doc.set(section, { ...(doc.get(section) ?? {}), ...body[section] });
      doc.markModified(section);
    }
  }
  doc.set('updatedAt', new Date().toISOString());
  await doc.save();
  res.json(doc.toJSON());
});
