import { ActorSubclass } from '@dfinity/agent';

/**
 * Verifies that principalId authorized this proxy request within the last 2 minutes
 * by checking the nonce they stored on the canister via authorizeForProxy
 * (or authorizeForProxyAsEditor for publications).
 * Throws if not authorized.
 */
export async function verifyAuthorization(
  subscriptionActor: ActorSubclass<any>,
  principalId: string,
  nonce: string
): Promise<void> {
  if (!principalId || !nonce) {
    throw new Error('principalId and nonce are required');
  }

  const isAuthorized = (await subscriptionActor.checkProxyAuthorization(
    principalId,
    nonce
  )) as boolean;

  if (!isAuthorized) {
    throw new Error(
      'Unauthorized: nonce is invalid or has expired. Call authorizeForProxy on the canister first.'
    );
  }
}
