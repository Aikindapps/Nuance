import { Router, Request, Response } from 'express';
import { stripe, APPLICATION_FEE_PERCENT } from '../stripe';
import { subscriptionActor } from '../canister';
import { verifyAuthorization } from '../auth';

const router = Router();

/**
 * POST /stripe/checkout
 * Creates a Stripe Checkout Session for a reader to subscribe to a writer.
 * Uses destination charges so the platform takes application_fee_percent and
 * transfers the rest to the writer's Express account.
 *
 * Body: { priceId: string, writerId: string, readerId: string, nonce: string }
 */
router.post('/', async (req: Request, res: Response) => {
  const { priceId, writerId, readerId, nonce } = req.body;

  if (!priceId || !writerId || !readerId || !nonce) {
    return res.status(400).json({ error: 'priceId, writerId, readerId, and nonce are required' });
  }

  try {
    await verifyAuthorization(readerId, nonce);
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }

  try {
    // Guard: check if reader already has an active subscription to this writer
    const alreadySubscribed = await subscriptionActor.isReaderSubscriber(writerId, readerId) as boolean;
    if (alreadySubscribed) {
      return res.status(409).json({ error: 'Reader already has an active subscription to this writer' });
    }

    const stripeAccountId = await subscriptionActor.getStripeAccountId(writerId) as [string] | [];
    if (stripeAccountId.length === 0) {
      return res.status(400).json({ error: 'Writer has not completed Stripe onboarding' });
    }

    const connectedAccountId = stripeAccountId[0];

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      // metadata on the session is available in checkout.session.completed webhook
      metadata: { readerId, writerId },
      subscription_data: {
        // metadata on the subscription is available in invoice.paid webhook
        metadata: { readerId, writerId },
        application_fee_percent: APPLICATION_FEE_PERCENT,
        transfer_data: {
          destination: connectedAccountId,
        },
      },
      success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });

    return res.json({ url: session.url });
  } catch (err: any) {
    console.error('[checkout] Error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

export default router;
