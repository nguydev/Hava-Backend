import type { Request, Response } from 'express';

import { makeDeliveryTimeline, makeOrderTimeline, type DeliveryStatus } from '../lib/domain';
import { HttpError, ah } from '../lib/http';
import { pushNotification } from '../lib/notify';
import { Delivery, Order } from '../models';

type D = Record<string, any>;

const ACTIVE = ['Assigned', 'Accepted', 'En Route', 'Arrived'];
const STATUSES = ['Assigned', 'Accepted', 'En Route', 'Arrived', 'Delivered', 'Issue Reported'];

/** Mirror delivery progress onto the linked contractor order. */
async function syncOrderFromDelivery(d: D): Promise<void> {
  const order = await Order.findOne({ id: d.orderId });
  if (!order) return;
  if (d.status === 'En Route' || d.status === 'Arrived') {
    order.set('status', 'Out for Delivery');
    if (d.eta) order.set('eta', `Today · ${d.eta}`);
    order.set('timeline', makeOrderTimeline('Out for Delivery'));
    order.markModified('timeline');
    order.markModified('eta');
  } else if (d.status === 'Delivered') {
    order.set('status', 'Delivered');
    if (d.proofOfDelivery) {
      order.set('proofOfDelivery', d.proofOfDelivery);
      order.markModified('proofOfDelivery');
    }
    order.set('eta', d.completedAt ? `Delivered · ${d.completedAt}` : 'Delivered');
    order.set('timeline', makeOrderTimeline('Delivered'));
    order.markModified('timeline');
    order.markModified('eta');
  } else {
    return;
  }
  await order.save();
}

/** GET /deliveries?scope=today|history|available|all */
export const listDeliveries = ah(async (req: Request, res: Response) => {
  const scope = (req.query.scope as string) || 'all';
  const userId = (req as any).user?.id;
  const items = (await Delivery.find()).map((d) => d.toJSON() as D);

  if (scope === 'available') {
    return res.json(
      items.filter((d) => !d.driverId || d.status === 'Available' || d.status === 'Unassigned'),
    );
  }
  if (scope === 'today') {
    return res.json(
      items.filter((d) => {
        const isUserDelivery = !d.driverId || !userId || d.driverId === userId;
        return ACTIVE.includes(d.status) && isUserDelivery;
      }),
    );
  }
  if (scope === 'history') {
    return res.json(
      items.filter((d) => {
        const isUserDelivery = !d.driverId || !userId || d.driverId === userId;
        return !ACTIVE.includes(d.status) && d.status !== 'Available' && isUserDelivery;
      }),
    );
  }
  res.json(items);
});

/** POST /deliveries — Body: { jobSite, address, items, priority, notes } */
export const createDelivery = ah(async (req: Request, res: Response) => {
  const input = req.body ?? {};
  const id = `DEL-${Date.now().toString().slice(-6)}`;
  const userId = (req as any).user?.id || 'u-driver';
  const userName = (req as any).user?.name || 'Driver';

  const d = await Delivery.create({
    id,
    orderId: input.orderId || `ORD-${id}`,
    status: 'Assigned',
    priority: input.priority || 'Normal',
    company: input.company || 'GOODR Logistics',
    contractorName: input.contactName || userName,
    contactPhone: input.contactPhone || '(555) 019-2831',
    jobSite: input.jobSite || input.address?.label || 'Custom Job Site',
    address: input.address || {
      id: 'addr-custom',
      label: 'Job Site',
      line1: input.dropoff || '100 Main St',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
      contactName: userName,
      contactPhone: '(555) 019-2831',
    },
    timeWindow: input.timeWindow || 'Morning (8AM-12PM)',
    scheduledDate: input.preferredDate || new Date().toLocaleDateString(),
    eta: 'Today · 1.5 hrs',
    distanceMi: 8.4,
    instructions: input.notes || 'Handle with care',
    items: input.items || [
      { productId: 'custom', name: 'Courier Freight', brand: 'GOODR', quantity: 1, unitPrice: 0 },
    ],
    notes: input.notes || '',
    timeline: makeDeliveryTimeline('Assigned'),
    driverId: userId,
    driverName: userName,
  });

  res.status(201).json(d.toJSON());
});

/** POST /deliveries/:id/claim — Body: {} */
export const claimDelivery = ah(async (req: Request, res: Response) => {
  const delivery = await Delivery.findOne({ id: req.params.id });
  if (!delivery) throw new HttpError('Delivery not found', 404);

  const userId = (req as any).user?.id || 'u-driver';
  const userName = (req as any).user?.name || 'Driver';

  delivery.set('driverId', userId);
  delivery.set('driverName', userName);
  delivery.set('status', 'Assigned');
  delivery.set('timeline', makeDeliveryTimeline('Assigned'));
  await delivery.save();

  if (delivery.get('orderId')) {
    const order = await Order.findOne({ id: delivery.get('orderId') });
    if (order) {
      order.set('driver', { id: userId, name: userName });
      order.set('status', 'Confirmed');
      await order.save();
    }
  }

  await pushNotification({
    category: 'Delivery',
    title: 'Delivery claimed',
    message: `You claimed delivery #${delivery.get('id')}.`,
    targetType: 'delivery',
    targetId: delivery.get('id'),
    roles: ['driver'],
  });

  res.json(delivery.toJSON());
});

/** GET /deliveries/:id */
export const getDelivery = ah(async (req: Request, res: Response) => {
  const d = await Delivery.findOne({ id: req.params.id });
  if (!d) throw new HttpError('Delivery not found', 404);
  res.json(d.toJSON());
});

/** PATCH /deliveries/:id/status — Body: { status } */
export const updateDeliveryStatus = ah(async (req: Request, res: Response) => {
  const { status } = req.body ?? {};
  if (!STATUSES.includes(status)) throw new HttpError('Invalid delivery status', 400);

  const update: D = { status, timeline: makeDeliveryTimeline(status) };
  if (status === 'Delivered') update.completedAt = new Date().toLocaleString();

  const d = await Delivery.findOneAndUpdate({ id: req.params.id }, { $set: update }, { new: true });
  if (!d) throw new HttpError('Delivery not found', 404);

  await syncOrderFromDelivery(d.toJSON() as D);

  // Notify the contractor of delivery progress (push to contractors).
  const progressMsg: Record<string, string> = {
    'En Route': 'is out for delivery',
    Arrived: 'has arrived at the job site',
    Delivered: 'has been delivered',
  };
  if (progressMsg[status]) {
    await pushNotification({
      category: status === 'Delivered' ? 'Delivery' : 'Driver',
      title: status === 'Delivered' ? 'Order delivered' : 'Delivery update',
      message: `Order #${d.get('id')} ${progressMsg[status]}.`,
      targetType: 'order',
      targetId: d.get('id'),
      roles: ['contractor'],
    });
  }

  res.json(d.toJSON());
});

/** PATCH /deliveries/:id/eta — Body: { eta, note? } */
export const updateDeliveryEta = ah(async (req: Request, res: Response) => {
  const { eta, note } = req.body ?? {};
  if (!eta) throw new HttpError('ETA is required', 400);

  const current = await Delivery.findOne({ id: req.params.id });
  if (!current) throw new HttpError('Delivery not found', 404);

  let status = (current.get('status') ?? 'Assigned') as DeliveryStatus;
  if (status === 'Assigned' || status === 'Accepted') status = 'En Route';

  const update: D = { eta, status, timeline: makeDeliveryTimeline(status) };
  if (note) update.notes = note;

  const d = await Delivery.findOneAndUpdate({ id: req.params.id }, { $set: update }, { new: true });

  await syncOrderFromDelivery(d!.toJSON() as D);
  await pushNotification({
    category: 'ETA',
    title: 'ETA updated',
    message: `Order #${d!.get('id')} ETA updated to ${eta}.`,
    targetType: 'order',
    targetId: d!.get('id'),
    roles: ['contractor'],
  });

  res.json(d!.toJSON());
});

/** POST /deliveries/:id/proof — Body: { recipientName, notes?, photos[] } */
export const submitProofOfDelivery = ah(async (req: Request, res: Response) => {
  const { recipientName, notes, photos } = req.body ?? {};
  if (!recipientName) throw new HttpError('Recipient name is required', 400);
  if (!Array.isArray(photos) || photos.length === 0)
    throw new HttpError('Add at least one delivery photo', 400);

  const { signature } = req.body ?? {};
  const signedAt = new Date().toLocaleString();
  const proof = { photos, recipientName, notes, signedAt, signature: signature ?? null };
  const update: D = {
    proofOfDelivery: proof,
    status: 'Delivered',
    completedAt: signedAt,
    timeline: makeDeliveryTimeline('Delivered'),
  };

  const d = await Delivery.findOneAndUpdate({ id: req.params.id }, { $set: update }, { new: true });
  if (!d) throw new HttpError('Delivery not found', 404);

  await syncOrderFromDelivery(d.toJSON() as D);
  await pushNotification({
    category: 'Delivery',
    title: 'Order delivered',
    message: `Order #${d.get('id')} was delivered with photo proof.`,
    targetType: 'order',
    targetId: d.get('id'),
    roles: ['contractor'],
  });
  res.status(201).json(d.toJSON());
});

/** POST /deliveries/:id/issue — Body: { type, notes, photos? } */
export const reportDeliveryIssue = ah(async (req: Request, res: Response) => {
  const { type, notes, photos } = req.body ?? {};
  if (!type || !notes) throw new HttpError('Issue type and notes are required', 400);

  const issue = {
    type,
    notes,
    photos: Array.isArray(photos) ? photos : [],
    reportedAt: new Date().toLocaleString(),
  };
  const update: D = {
    issue,
    status: 'Issue Reported',
    timeline: makeDeliveryTimeline('Issue Reported'),
  };

  const d = await Delivery.findOneAndUpdate({ id: req.params.id }, { $set: update }, { new: true });
  if (!d) throw new HttpError('Delivery not found', 404);

  await pushNotification({
    category: 'Delivery',
    title: 'Delivery issue reported',
    message: `An issue was reported on order #${d.get('id')}: ${type}.`,
    targetType: 'order',
    targetId: d.get('id'),
    roles: ['contractor'],
  });
  res.status(201).json(d.toJSON());
});
