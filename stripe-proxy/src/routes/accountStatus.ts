import { Router, Request, Response } from 'express';
import { EnvConfig } from '../envConfig';
import { verifyAuthorization } from '../auth';

/**
 * POST /stripe/account-status  (or /:env/stripe/account-status)
 * Checks the live Stripe Express account status for a writer and syncs the
 * canister's stripeIsActive flag to reflect whether the account can actually
 * receive payments (charges enabled + transfers capability active).
 *
 * Body: { writerId: string, nonce: string }
 *
 * Nonce auth: same pattern as the other routes. Without it, any caller who
 * knows a writerId could trigger a stripe.accounts.retrieve + canister write.
 * CORS is the only protection against browser callers, so a non-browser caller
 * would otherwise be unrestricted.
 */
export const createAccountStatusRouter = (config: EnvConfig): Router => {
  const router = Router();
  const { stripe, subscriptionActor } = config;

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
      const stripeAccountId = (await subscriptionActor.getStripeAccountId(
        writerId
      )) as [string] | [];

      if (stripeAccountId.length === 0) {
        return res.json({ connected: false, active: false });
      }

      const account = await stripe.accounts.retrieve(stripeAccountId[0]);

      const transfersActive = account.capabilities?.transfers === 'active';
      const active = account.charges_enabled === true && transfersActive;

      const result = (await subscriptionActor.setStripeAccountActive(
        writerId,
        active
      )) as any;
      if (result.err) {
        console.error(
          `[${config.name}][account-status] setStripeAccountActive failed:`,
          result.err
        );
      }

      // Consume the nonce so the same authorization can't be replayed within
      // its 2-minute window.
      await subscriptionActor.consumeProxyAuthorization(writerId);

      return res.json({
        connected: true,
        active,
        chargesEnabled: account.charges_enabled === true,
        transfersActive,
        detailsSubmitted: account.details_submitted === true,
        payoutsEnabled: account.payouts_enabled === true,
      });
    } catch (err: any) {
      console.error(`[${config.name}][account-status] Error:`, err.message);
      return res
        .status(500)
        .json({ error: `Failed to fetch account status: ${err.message}` });
    }
  });

  return router;
};
