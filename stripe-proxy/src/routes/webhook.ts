import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe, fromStripeInterval, stripeTimestampToMilliseconds } from '../stripe';
import { subscriptionActor } from '../canister';

const router = Router();

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set.');
}

/**
 * POST /stripe/webhook
 * Receives Stripe events and updates the canister subscription state.
 *
 * IMPORTANT: This route must receive the RAW request body (not parsed JSON).
 * express.raw({ type: 'application/json' }) is applied in server.ts for this route only.
 *
 * Handled events:
 *   checkout.session.completed  → new subscription created
 *   invoice.paid                → subscription renewed (updates endTime)
 *   customer.subscription.deleted → subscription cancelled (sets endTime to now)
 *   invoice.payment_failed      → same as deleted for access purposes
 */
router.post('/', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;
  try {
    // req.body is a Buffer here because of express.raw() middleware in server.ts
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  console.log(`[webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(event);
        break;
      }
      case 'invoice.paid': {
        await handleInvoicePaid(event);
        break;
      }
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(event);
        break;
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event);
        break;
      }
      case 'invoice.payment_failed': {
        await handleInvoicePaymentFailed(event);
        break;
      }
      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error(`[webhook] Error processing event ${event.type}:`, err.message);
    // Still return 200 to prevent Stripe from retrying - we log the error
    // Stripe retries on non-2xx responses which could cause duplicate processing
  }

  // Always return 200 so Stripe doesn't retry
  return res.status(200).json({ received: true });
});

async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;

  const readerId = session.metadata?.readerId;
  const writerId = session.metadata?.writerId;

  if (!readerId || !writerId) {
    console.error('[webhook] checkout.session.completed missing readerId or writerId in metadata');
    return;
  }

  const stripeSubId = session.subscription as string;
  const stripeCustomerId = session.customer as string;

  if (!stripeSubId) {
    console.error('[webhook] checkout.session.completed has no subscription ID');
    return;
  }

  // Fetch subscription to get period_end and interval
  const subscription = await stripe.subscriptions.retrieve(stripeSubId);
  const periodEnd = stripeTimestampToMilliseconds(subscription.current_period_end);
  const stripeInterval = subscription.items.data[0]?.price?.recurring?.interval ?? 'month';
  const intervalVariant = fromStripeInterval(stripeInterval);
  const usdAmountCents = String(subscription.items.data[0]?.price?.unit_amount ?? 0);

  console.log(`[webhook] New subscription: reader=${readerId} writer=${writerId} sub=${stripeSubId}`);

  const result = await subscriptionActor.syncStripeSubscription(
    event.id,
    writerId,
    readerId,
    intervalVariant,
    stripeSubId,
    stripeCustomerId,
    periodEnd,
    usdAmountCents
  ) as any;

  if (result.err) {
    console.error('[webhook] syncStripeSubscription failed:', result.err);
  }
}

async function handleInvoicePaid(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  const stripeSubId = invoice.subscription as string;

  if (!stripeSubId) {
    console.log('[webhook] invoice.paid has no subscription, skipping');
    return;
  }

  // Fetch subscription for metadata and new period_end
  const subscription = await stripe.subscriptions.retrieve(stripeSubId);

  const readerId = subscription.metadata?.readerId;
  const writerId = subscription.metadata?.writerId;

  if (!readerId || !writerId) {
    console.error('[webhook] invoice.paid subscription missing readerId or writerId in metadata');
    return;
  }

  const stripeCustomerId = invoice.customer as string;
  const periodEnd = stripeTimestampToMilliseconds(subscription.current_period_end);
  const stripeInterval = subscription.items.data[0]?.price?.recurring?.interval ?? 'month';
  const intervalVariant = fromStripeInterval(stripeInterval);
  const usdAmountCents = String(invoice.amount_paid);

  console.log(`[webhook] Renewal: reader=${readerId} writer=${writerId} sub=${stripeSubId} newPeriodEnd=${subscription.current_period_end}`);

  const result = await subscriptionActor.syncStripeSubscription(
    event.id,
    writerId,
    readerId,
    intervalVariant,
    stripeSubId,
    stripeCustomerId,
    periodEnd,
    usdAmountCents
  ) as any;

  if (result.err) {
    console.error('[webhook] syncStripeSubscription (renewal) failed:', result.err);
  }
}

async function handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;

  const readerId = subscription.metadata?.readerId;
  const writerId = subscription.metadata?.writerId;

  if (!readerId || !writerId) {
    console.error('[webhook] customer.subscription.updated missing readerId or writerId in metadata');
    return;
  }

  const cancelAtPeriodEnd = subscription.cancel_at_period_end === true;
  const periodEnd = stripeTimestampToMilliseconds(subscription.current_period_end);

  console.log(
    `[webhook] Subscription updated: reader=${readerId} writer=${writerId} sub=${subscription.id} cancelAtPeriodEnd=${cancelAtPeriodEnd}`
  );

  const result = await subscriptionActor.setStripeSubscriptionCancelState(
    writerId,
    readerId,
    subscription.id,
    cancelAtPeriodEnd,
    periodEnd
  ) as any;

  if (result.err) {
    console.error('[webhook] setStripeSubscriptionCancelState failed:', result.err);
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;

  const readerId = subscription.metadata?.readerId;
  const writerId = subscription.metadata?.writerId;

  if (!readerId || !writerId) {
    console.error('[webhook] customer.subscription.deleted missing readerId or writerId in metadata');
    return;
  }

  console.log(`[webhook] Subscription cancelled: reader=${readerId} writer=${writerId} sub=${subscription.id}`);

  const result = await subscriptionActor.cancelStripeSubscription(
    event.id,
    writerId,
    readerId,
    subscription.id
  ) as any;

  if (result.err) {
    console.error('[webhook] cancelStripeSubscription failed:', result.err);
  }
}

async function handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  const stripeSubId = invoice.subscription as string;

  if (!stripeSubId) {
    console.log('[webhook] invoice.payment_failed has no subscription, skipping');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(stripeSubId);

  // Only cancel access if Stripe has given up (subscription is past_due or canceled)
  // If status is 'active', Stripe may still be retrying - don't revoke access yet
  if (subscription.status !== 'past_due' && subscription.status !== 'canceled') {
    console.log(`[webhook] invoice.payment_failed but subscription status is ${subscription.status}, skipping`);
    return;
  }

  const readerId = subscription.metadata?.readerId;
  const writerId = subscription.metadata?.writerId;

  if (!readerId || !writerId) {
    console.error('[webhook] invoice.payment_failed subscription missing readerId or writerId in metadata');
    return;
  }

  console.log(`[webhook] Payment failed (${subscription.status}): reader=${readerId} writer=${writerId}`);

  const result = await subscriptionActor.cancelStripeSubscription(
    event.id,
    writerId,
    readerId,
    subscription.id
  ) as any;

  if (result.err) {
    console.error('[webhook] cancelStripeSubscription (payment failed) failed:', result.err);
  }
}

export default router;
