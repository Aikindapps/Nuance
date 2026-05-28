import { Router, Request, Response } from 'express';
import { EnvConfig } from '../envConfig';
import { verifyAuthorization } from '../auth';

/**
 * POST /stripe/billing-portal  (or /:env/stripe/billing-portal)
 * Creates a Stripe Customer Portal session so the reader can manage or cancel
 * their Stripe subscription.
 *
 * Body: { readerId: string, nonce: string }
 */
export const createBillingPortalRouter = (config: EnvConfig): Router => {
  const router = Router();
  const { stripe, subscriptionActor, cancelUrl } = config;

  router.post('/', async (req: Request, res: Response) => {
    const { readerId, nonce } = req.body;

    if (!readerId || !nonce) {
      return res.status(400).json({ error: 'readerId and nonce are required' });
    }

    try {
      await verifyAuthorization(subscriptionActor, readerId, nonce);
    } catch (err: any) {
      return res.status(401).json({ error: err.message });
    }

    try {
      const stripeCustomerId = (await subscriptionActor.getStripeCustomerId(
        readerId
      )) as [string] | [];
      if (stripeCustomerId.length === 0) {
        return res
          .status(404)
          .json({ error: 'No Stripe subscription found for this reader' });
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId[0],
        return_url: `${cancelUrl}?stripe_billing=return`,
      });

      return res.json({ url: portalSession.url });
    } catch (err: any) {
      console.error(`[${config.name}][billing-portal] Error:`, err.message);
      return res
        .status(500)
        .json({ error: 'Failed to create billing portal session' });
    }
  });

  return router;
};
