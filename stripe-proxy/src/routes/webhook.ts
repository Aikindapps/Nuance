import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { EnvConfig } from '../envConfig';
import { fromStripeInterval, stripeTimestampToMilliseconds } from '../stripe';

/**
 * POST /stripe/webhook  (or /:env/stripe/webhook)
 * Receives Stripe events for this env and updates the canister subscription state.
 *
 * IMPORTANT: This route receives the RAW request body for Stripe signature
 * verification. The raw-body middleware is applied per-env in server.ts BEFORE
 * the JSON body parser.
 *
 * Handled events:
 *   checkout.session.completed     → new subscription created
 *   invoice.paid                   → renewal (updates endTime)
 *   customer.subscription.updated  → cancel_at_period_end / periodEnd sync
 *   customer.subscription.deleted  → subscription ended (sets endTime to now)
 *   invoice.payment_failed         → revoke if Stripe gave up retrying
 */
export const createWebhookRouter = (config: EnvConfig): Router => {
  const router = Router();
  const { stripe, subscriptionActor, webhookSecret, name: envName } = config;
  const log = (...args: any[]) => console.log(`[${envName}][webhook]`, ...args);
  const logErr = (...args: any[]) => console.error(`[${envName}][webhook]`, ...args);

  router.post('/', async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      logErr('Signature verification failed:', err.message);
      return res
        .status(400)
        .json({ error: `Webhook signature verification failed: ${err.message}` });
    }

    log(`Received event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event);
          break;
        case 'invoice.paid':
          await handleInvoicePaid(event);
          break;
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event);
          break;
        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event);
          break;
        default:
          log(`Unhandled event type: ${event.type}`);
      }
    } catch (err: any) {
      // Always return 200 so Stripe doesn't retry (avoids duplicate processing).
      logErr(`Error processing event ${event.type}:`, err.message);
    }

    return res.status(200).json({ received: true });
  });

  async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    const readerId = session.metadata?.readerId;
    const writerId = session.metadata?.writerId;

    if (!readerId || !writerId) {
      logErr('checkout.session.completed missing readerId or writerId in metadata');
      return;
    }

    const stripeSubId = session.subscription as string;
    const stripeCustomerId = session.customer as string;
    if (!stripeSubId) {
      logErr('checkout.session.completed has no subscription ID');
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(stripeSubId);
    const periodEnd = stripeTimestampToMilliseconds(subscription.current_period_end);
    const stripeInterval =
      subscription.items.data[0]?.price?.recurring?.interval ?? 'month';
    const intervalVariant = fromStripeInterval(stripeInterval);
    const usdAmountCents = String(
      subscription.items.data[0]?.price?.unit_amount ?? 0
    );

    log(`New subscription: reader=${readerId} writer=${writerId} sub=${stripeSubId}`);

    const result = (await subscriptionActor.syncStripeSubscription(
      event.id,
      writerId,
      readerId,
      intervalVariant,
      stripeSubId,
      stripeCustomerId,
      periodEnd,
      usdAmountCents
    )) as any;
    if (result.err) logErr('syncStripeSubscription failed:', result.err);
  }

  async function handleInvoicePaid(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    const stripeSubId = invoice.subscription as string;
    if (!stripeSubId) {
      log('invoice.paid has no subscription, skipping');
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(stripeSubId);
    const readerId = subscription.metadata?.readerId;
    const writerId = subscription.metadata?.writerId;
    if (!readerId || !writerId) {
      logErr('invoice.paid subscription missing readerId or writerId in metadata');
      return;
    }

    const stripeCustomerId = invoice.customer as string;
    const periodEnd = stripeTimestampToMilliseconds(subscription.current_period_end);
    const stripeInterval =
      subscription.items.data[0]?.price?.recurring?.interval ?? 'month';
    const intervalVariant = fromStripeInterval(stripeInterval);
    const usdAmountCents = String(invoice.amount_paid);

    log(
      `Renewal: reader=${readerId} writer=${writerId} sub=${stripeSubId} newPeriodEnd=${subscription.current_period_end}`
    );

    const result = (await subscriptionActor.syncStripeSubscription(
      event.id,
      writerId,
      readerId,
      intervalVariant,
      stripeSubId,
      stripeCustomerId,
      periodEnd,
      usdAmountCents
    )) as any;
    if (result.err) logErr('syncStripeSubscription (renewal) failed:', result.err);
  }

  async function handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    const readerId = subscription.metadata?.readerId;
    const writerId = subscription.metadata?.writerId;
    if (!readerId || !writerId) {
      logErr('customer.subscription.updated missing readerId or writerId in metadata');
      return;
    }

    const cancelAtPeriodEnd = subscription.cancel_at_period_end === true;
    const periodEnd = stripeTimestampToMilliseconds(subscription.current_period_end);

    log(
      `Subscription updated: reader=${readerId} writer=${writerId} sub=${subscription.id} cancelAtPeriodEnd=${cancelAtPeriodEnd}`
    );

    const result = (await subscriptionActor.setStripeSubscriptionCancelState(
      writerId,
      readerId,
      subscription.id,
      cancelAtPeriodEnd,
      periodEnd
    )) as any;
    if (result.err) logErr('setStripeSubscriptionCancelState failed:', result.err);
  }

  async function handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    const readerId = subscription.metadata?.readerId;
    const writerId = subscription.metadata?.writerId;
    if (!readerId || !writerId) {
      logErr('customer.subscription.deleted missing readerId or writerId in metadata');
      return;
    }

    log(
      `Subscription cancelled: reader=${readerId} writer=${writerId} sub=${subscription.id}`
    );

    const result = (await subscriptionActor.cancelStripeSubscription(
      event.id,
      writerId,
      readerId,
      subscription.id
    )) as any;
    if (result.err) logErr('cancelStripeSubscription failed:', result.err);
  }

  async function handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    const stripeSubId = invoice.subscription as string;
    if (!stripeSubId) {
      log('invoice.payment_failed has no subscription, skipping');
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(stripeSubId);
    if (subscription.status !== 'past_due' && subscription.status !== 'canceled') {
      log(
        `invoice.payment_failed but subscription status is ${subscription.status}, skipping`
      );
      return;
    }

    const readerId = subscription.metadata?.readerId;
    const writerId = subscription.metadata?.writerId;
    if (!readerId || !writerId) {
      logErr(
        'invoice.payment_failed subscription missing readerId or writerId in metadata'
      );
      return;
    }

    log(`Payment failed (${subscription.status}): reader=${readerId} writer=${writerId}`);

    const result = (await subscriptionActor.cancelStripeSubscription(
      event.id,
      writerId,
      readerId,
      subscription.id
    )) as any;
    if (result.err) logErr('cancelStripeSubscription (payment failed) failed:', result.err);
  }

  return router;
};
