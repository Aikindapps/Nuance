import { Router, Request, Response } from 'express';
import { EnvConfig } from '../envConfig';
import { toStripeInterval } from '../stripe';
import { verifyAuthorization } from '../auth';

/**
 * POST /stripe/create-price  (or /:env/stripe/create-price)
 * Creates a Stripe Price for a writer and stores the priceId + usdAmountCents
 * in the canister.
 *
 * Body: {
 *   writerId: string,
 *   interval: 'Weekly' | 'Monthly' | 'Annually' | 'LifeTime',
 *   usdAmountCents: string,  // e.g. "500" for $5.00
 *   nonce: string
 * }
 */
export const createCreatePriceRouter = (config: EnvConfig): Router => {
  const router = Router();
  const { stripe, subscriptionActor } = config;

  router.post('/', async (req: Request, res: Response) => {
    const { writerId, interval, usdAmountCents, nonce } = req.body;

    if (!writerId || !interval || !usdAmountCents || !nonce) {
      return res.status(400).json({
        error: 'writerId, interval, usdAmountCents, and nonce are required',
      });
    }

    const amountCents = parseInt(usdAmountCents, 10);
    if (isNaN(amountCents) || amountCents < 100) {
      return res.status(400).json({
        error: 'usdAmountCents must be a number >= 100 (minimum $1.00)',
      });
    }

    try {
      await verifyAuthorization(subscriptionActor, writerId, nonce);
    } catch (err: any) {
      return res.status(401).json({ error: err.message });
    }

    try {
      const stripeAccountId = (await subscriptionActor.getStripeAccountId(
        writerId
      )) as [string] | [];
      if (stripeAccountId.length === 0) {
        return res
          .status(400)
          .json({ error: 'Writer has not completed Stripe onboarding yet' });
      }

      const stripeInterval = toStripeInterval(interval);

      // Prices are created on the PLATFORM account (destination charge model).
      // application_fee_percent is set at checkout session creation, not here.
      const price = await stripe.prices.create({
        unit_amount: amountCents,
        currency: 'usd',
        recurring: { interval: stripeInterval },
        product_data: {
          name: `Nuance subscription - ${writerId}`,
          metadata: { writerId, interval },
        },
        metadata: { writerId, interval },
      });

      const intervalVariant = { [interval]: null };
      const updateResult = (await subscriptionActor.updateStripePriceTier(
        writerId,
        intervalVariant,
        price.id,
        usdAmountCents
      )) as any;

      if (updateResult.err) {
        return res
          .status(500)
          .json({ error: `Canister update failed: ${updateResult.err}` });
      }

      return res.json({ priceId: price.id, interval, usdAmountCents });
    } catch (err: any) {
      console.error(`[${config.name}][create-price] Error:`, err.message);
      return res.status(500).json({ error: 'Failed to create Stripe price' });
    }
  });

  return router;
};
