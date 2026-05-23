import { Actor, HttpAgent } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { idlFactory } from '../declarations/Subscription/Subscription.did.js';

if (!process.env.PROXY_IDENTITY_JSON) {
  throw new Error('PROXY_IDENTITY_JSON environment variable is not set. Run npm run generate-identity first.');
}
if (!process.env.SUBSCRIPTION_CANISTER_ID) {
  throw new Error('SUBSCRIPTION_CANISTER_ID environment variable is not set.');
}
if (!process.env.IC_HOST) {
  throw new Error('IC_HOST environment variable is not set.');
}

const identity = Ed25519KeyIdentity.fromParsedJson(
  JSON.parse(process.env.PROXY_IDENTITY_JSON)
);

const agent = new HttpAgent({
  identity,
  host: process.env.IC_HOST,
});

// Fetch root key only on local replica - never on mainnet
if (process.env.IC_HOST.includes('localhost') || process.env.IC_HOST.includes('127.0.0.1')) {
  agent.fetchRootKey().catch((err) => {
    console.warn('Unable to fetch root key:', err);
  });
}

export const subscriptionActor = Actor.createActor(idlFactory, {
  agent,
  canisterId: process.env.SUBSCRIPTION_CANISTER_ID,
});

export const proxyPrincipal = identity.getPrincipal().toText();
