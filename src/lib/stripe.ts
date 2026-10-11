import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY || '';

/** Shared Stripe client (test mode). Null if no key is configured. */
export const stripe = key ? new Stripe(key) : null;

export const stripeEnabled = !!stripe;

export const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';

/** Dollars → integer cents (Stripe amounts are in the currency's minor unit). */
export const toCents = (dollars: number): number => Math.round(dollars * 100);

/** Map a stored card brand to a Stripe shared test PaymentMethod. */
export function testPaymentMethodFor(brand?: string): string {
  switch (brand) {
    case 'mastercard':
      return 'pm_card_mastercard';
    case 'amex':
      return 'pm_card_amex';
    case 'discover':
      return 'pm_card_discover';
    default:
      return 'pm_card_visa';
  }
}
