/** Shared Stripe charge helper used by checkout and invoice payment. */
import { HttpError } from './http';
import { stripe, testPaymentMethodFor, toCents } from './stripe';

export interface ChargeResult {
  id: string;
  status: string;
  amount: number;
  brand?: string;
  last4?: string;
}

/**
 * Create and confirm a PaymentIntent in one call (test mode).
 *
 * In production the card is collected + confirmed client-side with the Stripe
 * SDK; here we confirm server-side with a Stripe shared test PaymentMethod so
 * the whole flow works end-to-end without the native card UI. Real charges show
 * up in the Stripe test dashboard.
 */
export async function chargeCard(opts: {
  amountDollars: number;
  description: string;
  brand?: string;
  last4?: string;
  metadata?: Record<string, string>;
}): Promise<ChargeResult> {
  if (!stripe) throw new HttpError('Payments are not configured', 503);

  const intent = await stripe.paymentIntents.create({
    amount: toCents(opts.amountDollars),
    currency: 'usd',
    description: opts.description,
    payment_method: testPaymentMethodFor(opts.brand),
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    metadata: opts.metadata ?? {},
  });

  if (intent.status !== 'succeeded') {
    throw new HttpError(`Payment ${intent.status}. Please try another card.`, 402);
  }

  return {
    id: intent.id,
    status: intent.status,
    amount: intent.amount,
    brand: opts.brand,
    last4: opts.last4,
  };
}
