import { Router, Request, Response } from 'express';
import { stripe } from '../stripe';
import { subscriptionActor } from '../canister';
import { verifyAuthorization } from '../auth';

const router = Router();

/**
 * POST /stripe/onboard
 * Creates a Stripe Express account for a writer and returns the onboarding URL.
 *
 * Body: { writerId: string, nonce: string }
 *
 * Flow:
 * 1. Frontend calls authorizeForProxy(nonce) on canister (IC-authenticated)
 * 2. Frontend calls this endpoint with writerId + nonce
 * 3. Proxy verifies authorization via canister query
 * 4. Creates Stripe Express account
 * 5. Updates canister with account ID
 * 6. Consumes the nonce (one-time use for this high-value operation)
 * 7. Returns Stripe onboarding URL
 */
router.post('/', async (req: Request, res: Response) => {
  const { writerId, nonce } = req.body;

  if (!writerId || !nonce) {
    return res.status(400).json({ error: 'writerId and nonce are required' });
  }

  try {
    await verifyAuthorization(writerId, nonce);
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }

  try {
    // Reuse an existing connected account if the writer already has one, so that
    // re-running onboarding can fix/complete capabilities instead of orphaning accounts.
    const existing = await subscriptionActor.getStripeAccountId(writerId) as [string] | [];
    const existingId = existing[0];
    let accountId: string;

    if (existingId) {
      accountId = existingId;
      // ensure the capabilities required for destination charges are requested
      // (Stripe requires card_payments alongside transfers)
      await stripe.accounts.update(accountId, {
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
    } else {
      // Create a Stripe Express account for the writer with the capabilities
      // required for destination charges (card_payments + transfers)
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { writerId },
      });
      accountId = account.id;

      // Store the Stripe account ID in the canister
      const updateResult = await subscriptionActor.updateStripeAccount(writerId, accountId) as any;
      if (updateResult.err) {
        // Canister rejected - clean up the Stripe account
        await stripe.accounts.del(accountId);
        return res.status(500).json({ error: `Canister update failed: ${updateResult.err}` });
      }

      // Consume the nonce - prevents replay for this high-value operation
      await subscriptionActor.consumeProxyAuthorization(writerId);
    }

    // Generate Stripe onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${process.env.STRIPE_CANCEL_URL}?stripe_onboard=refresh`,
      return_url: `${process.env.STRIPE_SUCCESS_URL}?stripe_onboard=complete`,
    });

    return res.json({ url: accountLink.url });
  } catch (err: any) {
    console.error('[onboard] Error:', err.message);
    return res.status(500).json({ error: `Failed to create Stripe account: ${err.message}` });
  }
});

export default router;
