import { Router, Request, Response } from 'express';
import { EnvConfig } from '../envConfig';

/**
 * POST /stripe/account-status  (or /:env/stripe/account-status)
 * Checks the live Stripe Express account status for a writer and syncs the
 * canister's stripeIsActive flag to reflect whether the account can actually
 * receive payments (charges enabled + transfers capability active).
 *
 * Body: { writerId: string }
 *
 * No nonce auth needed: this only ever syncs the canister to Stripe's real
 * state, and the canister write itself is gated to the trusted proxy principal.
 */
export const createAccountStatusRouter = (config: EnvConfig): Router => {
  const router = Router();
  const { stripe, subscriptionActor } = config;

  router.post('/', async (req: Request, res: Response) => {
    const { writerId } = req.body;

    if (!writerId) {
      return res.status(400).json({ error: 'writerId is required' });
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
