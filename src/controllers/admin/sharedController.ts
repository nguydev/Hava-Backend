/**
 * Admin controllers for domains SHARED with the mobile app. These read/write the
 * same collections the app uses, adapting between shapes so both stay in sync.
 */
import type { Request, Response } from 'express';

import {
  ADMIN_STATUS_TO_CANONICAL,
  PR_STATUS_TO_QUOTE,
  adminCategoryToCanonical,
  adminProductToCanonical,
  categoryToAdmin,
  orderToAdmin,
  productToAdmin,
  quoteToPricingRequest,
} from '../../lib/adapters';
import { formatDate, makeDeliveryTimeline, makeOrderTimeline } from '../../lib/domain';
import { HttpError, ah } from '../../lib/http';
import { pushNotification } from '../../lib/notify';
import { Category, Delivery, Order, Product, Quote } from '../../models';
import { Driver } from '../../models/admin';

/** Human phrase for an admin order status (for contractor-facing messages). */
const ADMIN_STATUS_PHRASE: Record<string, string> = {
  new: 'received',
  assigned: 'confirmed & scheduled',
  picked_up: 'being prepared',
  in_transit: 'out for delivery',
  delivered: 'delivered',
  completed: 'completed',
  delayed: 'delayed',
  cancelled: 'cancelled',
};

type Any = Record<string, any>;

/* -------------------------------- Products -------------------------------- */

export const listProducts = ah(async (_req: Request, res: Response) => {
  const rows = await Product.find();
  res.json(rows.map((p) => productToAdmin(p.toJSON())));
});

export const createProduct = ah(async (req: Request, res: Response) => {
  const a = req.body ?? {};
  if (!a.name || !a.model) throw new HttpError('Name and model are required', 400);
  const canonical = adminProductToCanonical(a);
  const doc = await Product.findOneAndUpdate(
    { id: a.id ?? `p-${Date.now()}` },
    { $set: { ...canonical, id: a.id ?? `p-${Date.now()}`, specs: [] } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  res.status(201).json(productToAdmin(doc!.toJSON()));
});

export const updateProduct = ah(async (req: Request, res: Response) => {
  const existing = await Product.findOne({ id: req.params.id });
  if (!existing) throw new HttpError('Product not found', 404);

  const canonical = adminProductToCanonical(req.body ?? {});

  // Record a price-history entry when the price actually changes.
  if ('price' in canonical && canonical.price !== existing.get('price')) {
    const history = [...(existing.get('priceHistory') ?? [])];
    history.unshift({ at: new Date().toISOString(), price: canonical.price, by: 'Admin' });
    canonical.priceHistory = history.slice(0, 50);
  }

  const doc = await Product.findOneAndUpdate({ id: req.params.id }, { $set: canonical }, { new: true });
  res.json(productToAdmin(doc!.toJSON()));
});

/** GET /admin/products/:id/price-history — [{ at, price, by }] newest first. */
export const getProductPriceHistory = ah(async (req: Request, res: Response) => {
  const doc = await Product.findOne({ id: req.params.id });
  if (!doc) throw new HttpError('Product not found', 404);
  res.json(doc.get('priceHistory') ?? []);
});

export const removeProduct = ah(async (req: Request, res: Response) => {
  await Product.deleteOne({ id: req.params.id });
  res.json({ id: req.params.id });
});

/* ------------------------------- Categories ------------------------------- */

export const listCategories = ah(async (_req: Request, res: Response) => {
  const rows = await Category.find();
  res.json(rows.map((c) => categoryToAdmin(c.toJSON())));
});

export const createCategory = ah(async (req: Request, res: Response) => {
  const a = req.body ?? {};
  if (!a.name) throw new HttpError('Name is required', 400);
  const id = a.id ?? `cat-${Date.now()}`;
  const doc = await Category.findOneAndUpdate(
    { id },
    { $set: { ...adminCategoryToCanonical(a), id } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  res.status(201).json(categoryToAdmin(doc!.toJSON()));
});

export const updateCategory = ah(async (req: Request, res: Response) => {
  const doc = await Category.findOneAndUpdate(
    { id: req.params.id },
    { $set: adminCategoryToCanonical(req.body ?? {}) },
    { new: true },
  );
  if (!doc) throw new HttpError('Category not found', 404);
  res.json(categoryToAdmin(doc.toJSON()));
});

export const removeCategory = ah(async (req: Request, res: Response) => {
  await Category.deleteOne({ id: req.params.id });
  res.json({ id: req.params.id });
});

/* --------------------------------- Orders --------------------------------- */

async function deliveryFor(orderId: string) {
  return Delivery.findOne({ orderId });
}

export const listOrders = ah(async (_req: Request, res: Response) => {
  const [orders, deliveries] = await Promise.all([Order.find(), Delivery.find()]);
  const byOrderId = new Map(deliveries.map((d) => [d.get('orderId'), d]));
  const rows = orders.map((o) => {
    const oj = o.toJSON() as Any;
    const dj = byOrderId.get(oj.id)?.toJSON();
    return orderToAdmin(oj, dj);
  });
  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(rows);
});

export const getOrder = ah(async (req: Request, res: Response) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) throw new HttpError('Order not found', 404);
  const delivery = await deliveryFor(String(req.params.id));
  res.json(orderToAdmin(order.toJSON(), delivery?.toJSON()));
});

export const updateOrder = ah(async (req: Request, res: Response) => {
  const patch = req.body ?? {};
  const order = await Order.findOne({ id: req.params.id });
  if (!order) throw new HttpError('Order not found', 404);
  const delivery = await deliveryFor(String(req.params.id));

  if ('adminNotes' in patch) order.set('notes', patch.adminNotes);
  if ('eta' in patch) {
    order.set('eta', patch.eta);
    if (delivery) delivery.set('eta', patch.eta);
  }

  if (('driverId' in patch || 'driver' in patch) && patch.driver) {
    const drv = patch.driverId ? await Driver.findOne({ id: patch.driverId }) : null;
    order.set('driver', {
      id: patch.driverId ?? drv?.get('id') ?? null,
      name: patch.driver,
      phone: drv?.get('phone') ?? '',
      vehicle: drv?.get('vehicle') ?? '',
      rating: drv?.get('onTimeRate') ? drv.get('onTimeRate') / 20 : undefined,
    });
    order.markModified('driver');
  }

  if ('status' in patch) {
    const map = ADMIN_STATUS_TO_CANONICAL[patch.status];
    if (map?.order) {
      order.set('status', map.order);
      order.set('timeline', makeOrderTimeline(map.order as any));
      order.markModified('timeline');
    }
    if (map?.delivery && delivery) {
      delivery.set('status', map.delivery);
      delivery.set('timeline', makeDeliveryTimeline(map.delivery as any));
      delivery.markModified('timeline');
      if (map.delivery === 'Delivered') delivery.set('completedAt', new Date().toLocaleString());
    }
    if (patch.status === 'cancelled') order.set('eta', null);
  }

  await order.save();
  if (delivery) await delivery.save();

  // New driver assignment → notify drivers.
  if (('driverId' in patch || 'driver' in patch) && patch.driver) {
    await pushNotification({
      category: 'Delivery',
      title: 'New delivery assignment',
      message: `You've been assigned delivery #${order.get('id')}.`,
      targetType: 'delivery',
      targetId: order.get('id'),
      roles: ['driver'],
    });
  }
  // Status change → notify the contractor of order progress.
  if ('status' in patch && ADMIN_STATUS_PHRASE[patch.status]) {
    await pushNotification({
      category: 'Order',
      title: 'Order update',
      message: `Order #${order.get('id')} is now ${ADMIN_STATUS_PHRASE[patch.status]}.`,
      targetType: 'order',
      targetId: order.get('id'),
      roles: ['contractor'],
    });
  }

  res.json(orderToAdmin(order.toJSON(), delivery?.toJSON()));
});

/* ---------------------------- Pricing Requests ---------------------------- */
/* Backed by the mobile `quotes` collection (contractor equipment requests). */

export const listPricingRequests = ah(async (_req: Request, res: Response) => {
  const rows = await Quote.find();
  res.json(rows.map((q) => quoteToPricingRequest(q.toJSON())));
});

export const updatePricingRequest = ah(async (req: Request, res: Response) => {
  const patch = req.body ?? {};
  const quote = await Quote.findOne({ id: req.params.id });
  if (!quote) throw new HttpError('Pricing request not found', 404);

  if ('status' in patch && PR_STATUS_TO_QUOTE[patch.status]) {
    quote.set('status', PR_STATUS_TO_QUOTE[patch.status]);
  }
  if ('adminNotes' in patch) quote.set('supplierResponse', patch.adminNotes);
  if ('quotedPrice' in patch) quote.set('quotedPrice', patch.quotedPrice);
  quote.set('updatedAt', formatDate(new Date()));
  await quote.save();

  // Quote priced/approved → notify the contractor it's ready.
  if (patch.status === 'quoted' || patch.status === 'approved') {
    await pushNotification({
      category: 'Quote',
      title: 'Your quote is ready',
      message: `Quote ${quote.get('id')} has been ${patch.status === 'approved' ? 'approved' : 'quoted'}.`,
      targetType: 'quote',
      targetId: quote.get('id'),
      roles: ['contractor'],
    });
  }

  res.json(quoteToPricingRequest(quote.toJSON()));
});
