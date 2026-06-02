import { Router, Request, Response } from 'express';
import { EnvConfig } from '../envConfig';
import { verifyAuthorization } from '../auth';

/**
 * POST /stripe/checkout  (or /:env/stripe/checkout)
 * Creates a Stripe Checkout Session for a reader to subscribe to a writer.
 * Uses destination charges so the platform takes application_fee_percent and
 * transfers the rest to the writer's Express account.
 *
 * Body: { priceId: string, writerId: string, readerId: string, nonce: string }
 */
export const createCheckoutRouter = (config: EnvConfig): Router => {
  const router = Router();
  const { stripe, subscriptionActor, applicationFeePercent, successUrl, cancelUrl } =
    config;

  router.post('/', async (req: Request, res: Response) => {
    const { priceId, writerId, readerId, nonce } = req.body;

    if (!priceId || !writerId || !readerId || !nonce) {
      return res
        .status(400)
        .json({ error: 'priceId, writerId, readerId, and nonce are required' });
    }

    try {
      await verifyAuthorization(subscriptionActor, readerId, nonce);
    } catch (err: any) {
      return res.status(401).json({ error: err.message });
    }

    try {
      const alreadySubscribed = (await subscriptionActor.isReaderSubscriber(
        writerId,
        readerId
      )) as boolean;
      if (alreadySubscribed) {
        return res.status(409).json({
          error: 'Reader already has an active subscription to this writer',
        });
      }

      const stripeAccountId = (await subscriptionActor.getStripeAccountId(
        writerId
      )) as [string] | [];
      if (stripeAccountId.length === 0) {
        return res
          .status(400)
          .json({ error: 'Writer has not completed Stripe onboarding' });
      }

      const connectedAccountId = stripeAccountId[0];

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { readerId, writerId },
        subscription_data: {
          metadata: { readerId, writerId },
          application_fee_percent: applicationFeePercent,
          transfer_data: {
            destination: connectedAccountId,
          },
        },
        success_url: `${successUrl}?stripe_checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${cancelUrl}?stripe_checkout=cancel`,
      });

      // Consume the nonce so the same authorization can't be replayed within
      // its 2-minute window to spawn additional checkout sessions.
      await subscriptionActor.consumeProxyAuthorization(readerId);

      return res.json({ url: session.url });
    } catch (err: any) {
      console.error(`[${config.name}][checkout] Error:`, err.message);
      return res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  return router;
};
