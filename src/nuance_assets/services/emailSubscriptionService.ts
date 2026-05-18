import type { Agent } from '@dfinity/agent';
import { getUserActor } from './actorService';

// Email subscription service — thin wrapper around the User canister
// methods that back the "Subscribe to Email" feature.
//
// These methods live on the User canister (not a dedicated canister) so
// subscribers, tokens, and the user profile lookup all share one state
// partition. See [src/User/EmailSubscription.mo](src/User/EmailSubscription.mo)
// for the backing Motoko module.

export interface EmailSubscriber {
  email: string;
  authorPrincipal: string;
  verified: boolean;
  userId: [] | [string];
  createdAt: bigint;
  verifiedAt: [] | [bigint];
  unsubscribedAt: [] | [bigint];
}

function currentOrigin(): string {
  // Use window.location.origin so local dev hits localhost and prod hits nuance.xyz.
  return window.location.origin;
}

export async function subscribeToAuthorByEmail(
  authorHandle: string,
  email: string,
  agent?: Agent
): Promise<{ ok?: string; err?: string }> {
  const actor = (await getUserActor(agent)) as any;
  const verificationBaseUrl = `${currentOrigin()}/verify-email`;
  const res = await actor.subscribeToAuthorByEmail(
    authorHandle,
    email,
    verificationBaseUrl
  );
  return normalizeResult<string>(res);
}

export async function subscribeToPublicationByEmail(
  publicationCanisterId: string,
  publicationHandle: string,
  publicationDisplayName: string,
  email: string,
  agent?: Agent
): Promise<{ ok?: string; err?: string }> {
  const actor = (await getUserActor(agent)) as any;
  const verificationBaseUrl = `${currentOrigin()}/verify-email`;
  const res = await actor.subscribeToPublicationByEmail(
    publicationCanisterId,
    publicationHandle,
    publicationDisplayName,
    email,
    verificationBaseUrl
  );
  return normalizeResult<string>(res);
}

export async function verifyEmailSubscription(
  token: string,
  agent?: Agent
): Promise<{ ok?: { email: string; authorHandle: string }; err?: string }> {
  const actor = (await getUserActor(agent)) as any;
  const res = await actor.verifyEmailSubscription(token);
  return normalizeResult<{ email: string; authorHandle: string }>(res);
}

export async function unsubscribeEmailByToken(
  token: string,
  email: string,
  agent?: Agent
): Promise<{ ok?: string; err?: string }> {
  const actor = (await getUserActor(agent)) as any;
  const res = await actor.unsubscribeEmailByToken(token, email);
  return normalizeResult<string>(res);
}

export async function unsubscribeFromAuthorByEmail(
  authorHandle: string,
  email: string,
  agent?: Agent
): Promise<{ ok?: string; err?: string }> {
  const actor = (await getUserActor(agent)) as any;
  const res = await actor.unsubscribeFromAuthorByEmail(authorHandle, email);
  return normalizeResult<string>(res);
}

export async function isEmailSubscribed(
  authorHandle: string,
  email: string,
  agent?: Agent
): Promise<boolean> {
  const actor = (await getUserActor(agent)) as any;
  return !!(await actor.isEmailSubscribed(authorHandle, email));
}

export async function isEmailSubscribedByCaller(
  authorHandle: string,
  publicationCanisterId?: string,
  agent?: Agent
): Promise<boolean> {
  const actor = (await getUserActor(agent)) as any;
  return !!(await actor.isEmailSubscribedByCaller(
    authorHandle,
    publicationCanisterId ? [publicationCanisterId] : []
  ));
}

export async function unsubscribeEmailByCaller(
  authorHandle: string,
  publicationCanisterId?: string,
  agent?: Agent
): Promise<{ ok?: string; err?: string }> {
  const actor = (await getUserActor(agent)) as any;
  const res = await actor.unsubscribeEmailByCaller(
    authorHandle,
    publicationCanisterId ? [publicationCanisterId] : []
  );
  return normalizeResult<string>(res);
}

// Motoko Result.Result serializes to { ok } | { err } in the JS bindings.
// Normalize both shapes into a plain object so callers don't need to
// know the candid discriminator.
function normalizeResult<T>(res: any): { ok?: T; err?: string } {
  if (!res) return { err: 'Empty response from canister' };
  if ('ok' in res) return { ok: res.ok as T };
  if ('err' in res) return { err: String(res.err) };
  return { err: 'Unexpected response shape' };
}