import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const APPLICATION_FEE_PERCENT = Number(process.env.NUANCE_APPLICATION_FEE_PERCENT ?? '10');

/** Maps our SubscriptionTimeInterval variant to Stripe's recurring interval string */
export function toStripeInterval(interval: string): Stripe.PriceCreateParams.Recurring.Interval {
  switch (interval) {
    case 'Weekly':
      return 'week';
    case 'Monthly':
      return 'month';
    case 'Annually':
      return 'year';
    case 'LifeTime':
      // Stripe has no "lifetime" concept - use year with a very long duration as a product
      // For lifetime, create a one-time price instead of recurring
      return 'year';
    default:
      throw new Error(`Unknown subscription interval: ${interval}`);
  }
}

/** Maps Stripe's recurring interval string back to our canister variant */
export function fromStripeInterval(interval: string): { [key: string]: null } {
  switch (interval) {
    case 'week':
      return { Weekly: null };
    case 'month':
      return { Monthly: null };
    case 'year':
      return { Annually: null };
    default:
      return { Monthly: null };
  }
}

/**
 * Converts Stripe's Unix timestamp (seconds) to milliseconds as bigint.
 * The canister stores all times via U.epochTime() which is milliseconds,
 * so periodEnd must be in the same unit.
 * bigint is required because Candid Int maps to bigint in @dfinity/agent.
 */
export function stripeTimestampToMilliseconds(unixSeconds: number): bigint {
  return BigInt(unixSeconds) * BigInt(1_000);
}
