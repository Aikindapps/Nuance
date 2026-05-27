import { Agent } from '@dfinity/agent';
import { getSubscriptionActor } from './actorService';

// Base URL of the off-chain Stripe proxy bridge.
// Defaults to the local proxy; overridden at build time via STRIPE_PROXY_URL.
const STRIPE_PROXY_URL = process.env.STRIPE_PROXY_URL || 'http://localhost:3001';

// A fresh random nonce is stored on the canister via authorizeForProxy before
// each proxy call. The proxy verifies it through checkProxyAuthorization, which
// proves the IC-authenticated caller approved this specific action.
const generateNonce = (): string => {
  return `${crypto.randomUUID()}-${Date.now()}`;
};

// Stores a nonce on the canister, then POSTs to the given proxy endpoint with
// that nonce included in the body.
// - Personal writer/reader: the nonce is stored under the caller's own principal
//   via authorizeForProxy (the principal the proxy verifies == the IC caller).
// - Publication: pass `publicationCanisterId`; the nonce is stored under the
//   publication id via authorizeForProxyAsEditor, which verifies the caller is an
//   editor. The proxy then verifies against the publication id (the writerId).
const authorizeAndPost = async <T>(
  endpoint: string,
  body: Record<string, unknown>,
  agent?: Agent,
  publicationCanisterId?: string
): Promise<T> => {
  const nonce = generateNonce();
  const subscriptionActor = await getSubscriptionActor(agent);
  if (publicationCanisterId) {
    // editor proves editorship to the canister, which stores the nonce under
    // the publication id so the proxy can verify it against the writerId
    const res = await subscriptionActor.authorizeForProxyAsEditor(
      publicationCanisterId,
      nonce
    );
    if ('err' in res) {
      throw new Error(res.err);
    }
  } else {
    await subscriptionActor.authorizeForProxy(nonce);
  }

  const response = await fetch(`${STRIPE_PROXY_URL}/stripe/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, nonce }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || `Stripe proxy request to ${endpoint} failed`);
  }
  return data as T;
};

// Creates a Stripe Express account for the writer and returns the onboarding URL.
// For a personal writer, `writerId` is the caller's own principal.
// For a publication, `writerId` is the publication canister id and
// `publicationCanisterId` must be passed so authorization runs the editor check.
export const onboardWriter = async (
  writerId: string,
  agent?: Agent,
  publicationCanisterId?: string
): Promise<{ url: string }> => {
  return authorizeAndPost<{ url: string }>('onboard', { writerId }, agent, publicationCanisterId);
};

// Creates a recurring Stripe Price for the writer at the given interval/amount.
export const createPriceTier = async (
  writerId: string,
  interval: 'Weekly' | 'Monthly' | 'Annually' | 'LifeTime',
  usdAmountCents: string,
  agent?: Agent,
  publicationCanisterId?: string
): Promise<{ priceId: string; interval: string; usdAmountCents: string }> => {
  return authorizeAndPost(
    'create-price',
    { writerId, interval, usdAmountCents },
    agent,
    publicationCanisterId
  );
};

// Creates a Stripe Checkout Session for a reader to subscribe and returns its URL.
// `readerId` must be the IC-authenticated caller's own principal.
export const createCheckoutSession = async (
  priceId: string,
  writerId: string,
  readerId: string,
  agent?: Agent
): Promise<{ url: string }> => {
  return authorizeAndPost<{ url: string }>(
    'checkout',
    { priceId, writerId, readerId },
    agent
  );
};

// Creates a Stripe billing portal session so the reader can manage/cancel.
export const createBillingPortalSession = async (
  readerId: string,
  agent?: Agent
): Promise<{ url: string }> => {
  return authorizeAndPost<{ url: string }>('billing-portal', { readerId }, agent);
};

export type StripeAccountStatus = {
  connected: boolean;
  active: boolean;
  chargesEnabled?: boolean;
  transfersActive?: boolean;
  detailsSubmitted?: boolean;
  payoutsEnabled?: boolean;
};

// Checks the writer's live Stripe account status and syncs the canister's
// active flag. No nonce needed: it only mirrors Stripe's real state.
export const fetchStripeAccountStatus = async (
  writerId: string
): Promise<StripeAccountStatus> => {
  const response = await fetch(`${STRIPE_PROXY_URL}/stripe/account-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ writerId }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Stripe account status request failed');
  }
  return data as StripeAccountStatus;
};
