import { subscriptionActor } from './canister';

/**
 * Verifies that the given principalId authorized the proxy request within the last 2 minutes
 * using the nonce they stored via authorizeForProxy() on the canister.
 * Throws if not authorized.
 */
export async function verifyAuthorization(principalId: string, nonce: string): Promise<void> {
  if (!principalId || !nonce) {
    throw new Error('principalId and nonce are required');
  }

  const isAuthorized = await subscriptionActor.checkProxyAuthorization(principalId, nonce) as boolean;

  if (!isAuthorized) {
    throw new Error('Unauthorized: nonce is invalid or has expired. Call authorizeForProxy on the canister first.');
  }
}
