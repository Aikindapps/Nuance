import { Router, Request, Response } from 'express';
import { EnvConfig } from '../envConfig';
import { verifyAuthorization } from '../auth';

/**
 * POST /stripe/onboard  (or /:env/stripe/onboard in multi-env mode)
 * Creates a Stripe Express account for a writer (or reuses an existing one)
 * and returns the onboarding URL.
 *
 * Body: { writerId: string, nonce: string }
 *
 * Flow:
 * 1. Frontend calls authorizeForProxy[AsEditor](nonce) on the canister (IC-authenticated)
 * 2. Frontend calls this endpoint with writerId + nonce
 * 3. Proxy verifies the authorization via canister query
 * 4. Creates / re-uses a Stripe Express account with card_payments + transfers requested
 * 5. Stores the account ID on the canister (new accounts only)
 * 6. Consumes the nonce on the canister (new accounts only)
 * 7. Returns a Stripe-hosted onboarding URL
 */
export const createOnboardRouter = (config: EnvConfig): Router => {
  const router = Router();
  const { stripe, subscriptionActor, successUrl, cancelUrl } = config;

  router.post('/', async (req: Request, res: Response) => {
    const { writerId, nonce } = req.body;

    if (!writerId || !nonce) {
      return res.status(400).json({ error: 'writerId and nonce are required' });
    }

    try {
      await verifyAuthorization(subscriptionActor, writerId, nonce);
    } catch (err: any) {
      return res.status(401).json({ error: err.message });
    }

    try {
      // Reuse an existing connected account if the writer already has one, so
      // re-running onboarding can fix/complete capabilities instead of orphaning accounts.
      const existing = (await subscriptionActor.getStripeAccountId(writerId)) as
        | [string]
        | [];
      const existingId = existing[0];
      let accountId: string;

      if (existingId) {
        accountId = existingId;
        // ensure card_payments + transfers are requested (Stripe requires both
        // for the destination-charge model we use)
        await stripe.accounts.update(accountId, {
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
      } else {
        const account = await stripe.accounts.create({
          type: 'express',
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          metadata: { writerId },
        });
        accountId = account.id;

        const updateResult = (await subscriptionActor.updateStripeAccount(
          writerId,
          accountId
        )) as any;
        if (updateResult.err) {
          await stripe.accounts.del(accountId);
          return res
            .status(500)
            .json({ error: `Canister update failed: ${updateResult.err}` });
        }

        await subscriptionActor.consumeProxyAuthorization(writerId);
      }

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        type: 'account_onboarding',
        refresh_url: `${cancelUrl}?stripe_onboard=refresh`,
        return_url: `${successUrl}?stripe_onboard=complete`,
      });

      return res.json({ url: accountLink.url });
    } catch (err: any) {
      console.error(`[${config.name}][onboard] Error:`, err.message);
      return res
        .status(500)
        .json({ error: `Failed to create Stripe account: ${err.message}` });
    }
  });

  return router;
};
