import type { Request, Response } from 'express';

import { formatDate, makeDeliveryTimeline, makeOrderTimeline } from '../lib/domain';
import { HttpError, ah } from '../lib/http';
import { pushNotification } from '../lib/notify';
import { chargeCard } from '../lib/payments';
import { stripeEnabled } from '../lib/stripe';
import { Delivery, Order, Product } from '../models';

type O = Record<string, any>;

/** Fill missing order-item images from the product catalog. */
async function enrich(order: O): Promise<O> {
  const missing = (order.items ?? []).some((i: O) => !i.image);
  if (!missing) return order;
  const ids = order.items.map((i: O) => i.productId);
  const products = await Product.find({ id: { $in: ids } });
  const imageById = new Map(products.map((p) => [p.get('id'), p.get('image')]));
  return {
    ...order,
    items: order.items.map((i: O) => (i.image ? i : { ...i, image: imageById.get(i.productId) })),
  };
}

/** Next order id in the MH-#### series (>= 1060). */
async function nextOrderId(): Promise<string> {
  const orders = await Order.find({ id: /^MH-\d+$/ }, { id: 1 }).lean();
  const max = orders.reduce((m, o) => {
    const n = Number(String(o.id).slice(3));
    return Number.isFinite(n) && n > m ? n : m;
  }, 1059);
  return `MH-${max + 1}`;
}

/** GET /orders?status=&search=&page=&limit= */
export const listOrders = ah(async (req: Request, res: Response) => {
  const { status, search, page = '1', limit = '10' } = req.query as Record<string, string>;
  let items = (await Order.find()).map((d) => d.toJSON() as O);

  if (status && status !== 'All') items = items.filter((o) => o.status === status);
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(
      (o) => o.id.toLowerCase().includes(s) || o.address?.label?.toLowerCase().includes(s),
    );
  }

  // Newest first.
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const total = items.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedItems = items.slice(startIndex, startIndex + limitNum);
  const nextPage = startIndex + limitNum < total ? pageNum + 1 : null;

  const enriched = await Promise.all(paginatedItems.map(enrich));
  res.json({ items: enriched, nextPage, total });
});

/** GET /orders/:id */
export const getOrder = ah(async (req: Request, res: Response) => {
  const o = await Order.findOne({ id: req.params.id });
  if (!o) throw new HttpError('Order not found', 404);
  res.json(await enrich(o.toJSON() as O));
});

/** POST /orders — create a delivery request/order. */
export const createOrder = ah(async (req: Request, res: Response) => {
  const input = req.body ?? {};
  if (!Array.isArray(input.items) || input.items.length === 0)
    throw new HttpError('Order must contain at least one item', 400);

  const subtotal = input.items.reduce(
    (sum: number, i: O) => sum + Number(i.unitPrice) * Number(i.quantity),
    0,
  );
  const total = subtotal + (input.deliveryFee ?? 0);
  const id = await nextOrderId();

  // Real Stripe charge (test mode) for card checkout. Throws (order not created)
  // if the charge is declined, so the app surfaces the failure.
  let stripePaymentIntentId: string | null = null;
  if (input.payment?.kind === 'card' && stripeEnabled && total > 0) {
    const charge = await chargeCard({
      amountDollars: total,
      description: `Order ${id}`,
      brand: input.payment.brand,
      last4: input.payment.last4,
      metadata: { orderId: id },
    });
    stripePaymentIntentId = charge.id;
  }

  const order: O = {
    id,
    createdAt: new Date().toISOString(),
    status: 'Pending',
    items: input.items,
    subtotal,
    deliveryFee: input.deliveryFee ?? 0,
    total,
    address: input.address,
    contactName: input.contactName,
    contactPhone: input.contactPhone,
    preferredDate: input.preferredDate,
    timeWindow: input.timeWindow,
    notes: input.notes,
    liftgate: !!input.liftgate,
    sitePhotos: Array.isArray(input.sitePhotos) ? input.sitePhotos : [],
    driver: null,
    eta: null,
    timeline: makeOrderTimeline('Pending', { Pending: formatDate(new Date()) }),
    payment: input.payment
      ? {
          status: input.payment.kind === 'card' ? 'Paid' : 'Pending',
          brand: input.payment.brand,
          last4: input.payment.last4,
          method: input.payment.label,
          paidAt: input.payment.kind === 'card' ? new Date().toLocaleString() : null,
          stripePaymentIntentId,
        }
      : null,
  };

  const created = await Order.create(order);

  // Automatically create a Delivery document linked to this Order
  const isDriver = (req as any).user?.role === 'driver';
  const driverId = isDriver ? (req as any).user?.id : null;
  const driverName = isDriver ? (req as any).user?.name : null;

  await Delivery.create({
    id: `DEL-${id}`,
    orderId: id,
    driverId,
    driverName,
    status: isDriver ? 'Assigned' : 'Available',
    priority: 'Normal',
    company: 'GOODR Logistics',
    contractorName: input.contactName || 'Job Contact',
    contactPhone: input.contactPhone || '(555) 000-0000',
    jobSite: input.address?.label || input.address?.line1 || 'Job Site',
    address: input.address,
    timeWindow: input.timeWindow || 'Morning',
    scheduledDate: input.preferredDate || new Date().toLocaleDateString(),
    eta: 'Today · 2 hrs',
    distanceMi: 10.0,
    instructions: input.notes || '',
    items: input.items,
    notes: input.notes || '',
    timeline: makeDeliveryTimeline(isDriver ? 'Assigned' : 'Unassigned'),
  });

  await pushNotification({
    category: 'Order',
    title: 'Delivery request submitted',
    message: `Order #${id} was submitted and is awaiting confirmation.`,
    targetType: 'order',
    targetId: id,
  });

  res.status(201).json(await enrich(created.toJSON() as O));
});
