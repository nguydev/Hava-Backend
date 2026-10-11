import type { Request, Response } from 'express';

import { HttpError, ah } from '../lib/http';
import { publishableKey, stripe, stripeEnabled, toCents } from '../lib/stripe';

/** GET /payments/config — publishable key + whether Stripe is enabled. */
export const getConfig = ah(async (_req: Request, res: Response) => {
  res.json({ enabled: stripeEnabled, publishableKey });
});

/**
 * POST /payments/create-intent — Body: { amount, currency?, description?, metadata? }
 * `amount` is in dollars. Returns a client_secret for the Stripe SDK (the
 * production/native flow: the client collects the card and confirms this intent).
 */
export const createIntent = ah(async (req: Request, res: Response) => {
  if (!stripe) throw new HttpError('Payments are not configured', 503);
  const { amount, currency = 'usd', description, metadata } = req.body ?? {};
  if (typeof amount !== 'number' || amount <= 0)
    throw new HttpError('A valid amount is required', 400);

  const intent = await stripe.paymentIntents.create({
    amount: toCents(amount),
    currency,
    description,
    automatic_payment_methods: { enabled: true },
    metadata: metadata ?? {},
  });

  res.json({ id: intent.id, clientSecret: intent.client_secret, publishableKey });
});
