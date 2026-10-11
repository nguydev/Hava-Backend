import type { Request, Response } from 'express';

import { HttpError, ah } from '../lib/http';
import { pushNotification } from '../lib/notify';
import { chargeCard } from '../lib/payments';
import { stripeEnabled } from '../lib/stripe';
import { Invoice, PaymentMethod } from '../models';

type PM = Record<string, any>;

function detectBrand(cardNumber: string): string {
  const n = String(cardNumber).replace(/\D/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^6/.test(n)) return 'discover';
  return 'card';
}

async function nextPmId(): Promise<string> {
  const rows = await PaymentMethod.find({ id: /^pm-\d+$/ }, { id: 1 }).lean();
  const max = rows.reduce((m, p) => {
    const n = Number(String(p.id).slice(3));
    return Number.isFinite(n) && n > m ? n : m;
  }, 99);
  return `pm-${max + 1}`;
}

/** GET /billing/payment-methods */
export const listPaymentMethods = ah(async (_req: Request, res: Response) => {
  const rows = await PaymentMethod.find();
  res.json(rows.map((p) => p.toJSON()));
});

/** POST /billing/payment-methods — Body: AddPaymentMethodInput */
export const addPaymentMethod = ah(async (req: Request, res: Response) => {
  const input: PM = req.body ?? {};
  if (!input.number || !input.holder) throw new HttpError('Card details are required', 400);

  const digits = String(input.number).replace(/\D/g, '');
  const count = await PaymentMethod.countDocuments();
  const isDefault = !!input.isDefault || count === 0;

  if (isDefault) await PaymentMethod.updateMany({}, { $set: { isDefault: false } });

  const created = await PaymentMethod.create({
    id: await nextPmId(),
    brand: detectBrand(input.number),
    last4: digits.slice(-4),
    expMonth: input.expMonth,
    expYear: input.expYear,
    holder: input.holder,
    isDefault,
  });

  res.status(201).json(created.toJSON());
});

/** DELETE /billing/payment-methods/:id — keeps a default if one remains. */
export const deletePaymentMethod = ah(async (req: Request, res: Response) => {
  const removed = await PaymentMethod.findOne({ id: req.params.id });
  await PaymentMethod.deleteOne({ id: req.params.id });

  if (removed?.get('isDefault')) {
    const remaining = await PaymentMethod.find();
    if (remaining.length > 0 && !remaining.some((p) => p.get('isDefault'))) {
      await PaymentMethod.updateOne({ id: remaining[0].get('id') }, { $set: { isDefault: true } });
    }
  }

  res.json({ id: req.params.id });
});

/** PATCH /billing/payment-methods/:id/default — returns the full list. */
export const setDefaultPaymentMethod = ah(async (req: Request, res: Response) => {
  const all = await PaymentMethod.find();
  await Promise.all(
    all.map((p) =>
      PaymentMethod.updateOne(
        { id: p.get('id') },
        { $set: { isDefault: p.get('id') === req.params.id } },
      ),
    ),
  );
  const rows = await PaymentMethod.find();
  res.json(rows.map((p) => p.toJSON()));
});

/** GET /billing/invoices */
export const listInvoices = ah(async (_req: Request, res: Response) => {
  const rows = await Invoice.find();
  res.json(rows.map((i) => i.toJSON()));
});

/** POST /billing/invoices/:id/pay — charges the invoice via Stripe (test mode). */
export const payInvoice = ah(async (req: Request, res: Response) => {
  const inv = await Invoice.findOne({ id: req.params.id });
  if (!inv) throw new HttpError('Invoice not found', 404);
  if (inv.get('status') === 'Paid') return res.json(inv.toJSON());

  // Default card (for brand/last4) → real Stripe charge in test mode.
  const defaultCard = await PaymentMethod.findOne({ isDefault: true });
  let stripePaymentIntentId: string | null = null;

  if (stripeEnabled) {
    const charge = await chargeCard({
      amountDollars: inv.get('amount') ?? 0,
      description: `Invoice ${inv.get('id')} — ${inv.get('description')}`,
      brand: defaultCard?.get('brand') ?? undefined,
      last4: defaultCard?.get('last4') ?? undefined,
      metadata: { invoiceId: inv.get('id'), orderId: inv.get('orderId') ?? '' },
    });
    stripePaymentIntentId = charge.id; // only reached if status === 'succeeded'
  }

  inv.set('status', 'Paid');
  inv.set('paidAt', new Date().toLocaleDateString());
  inv.set('stripePaymentIntentId', stripePaymentIntentId);
  await inv.save();

  await pushNotification({
    category: 'System',
    title: 'Payment received',
    message: `Invoice ${inv.get('id')} for ${inv.get('description')} has been paid.`,
  });

  res.json(inv.toJSON());
});
