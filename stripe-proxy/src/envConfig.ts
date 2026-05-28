import Stripe from 'stripe';
import { Actor, ActorSubclass, HttpAgent, Identity } from '@dfinity/agent';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { idlFactory } from '../declarations/Subscription/Subscription.did.js';

// Per-environment configuration loaded at startup. One proxy process can serve
// multiple environments (e.g. UAT + PROD) — each gets its own EnvConfig with
// its own Stripe client (test vs live), canister actor, webhook secret, etc.
export type EnvConfig = {
  name: string;
  stripe: Stripe;
  subscriptionActor: ActorSubclass<any>;
  webhookSecret: string;
  successUrl: string;
  cancelUrl: string;
  applicationFeePercent: number;
};

const DEFAULT_APP_FEE_PERCENT = 10;

// Reads `${key}_<ENV>` when env is set, else falls back to `${key}` (legacy
// single-env mode used for local dev).
const envVar = (key: string, env?: string): string | undefined => {
  if (env) {
    const suffixed = process.env[`${key}_${env.toUpperCase()}`];
    if (suffixed !== undefined && suffixed !== '') {
      return suffixed;
    }
    return undefined;
  }
  return process.env[key];
};

const requireEnvVar = (key: string, env?: string): string => {
  const value = envVar(key, env);
  if (!value) {
    const fullKey = env ? `${key}_${env.toUpperCase()}` : key;
    throw new Error(`Missing required env var: ${fullKey}`);
  }
  return value;
};

// Single shared identity across envs. The same proxy principal must be set as
// trustedProxyPrincipal on every Subscription canister this proxy serves.
let cachedIdentity: Ed25519KeyIdentity | null = null;
const getProxyIdentity = (): Ed25519KeyIdentity => {
  if (cachedIdentity) {
    return cachedIdentity;
  }
  const json = process.env.PROXY_IDENTITY_JSON;
  if (!json) {
    throw new Error(
      'PROXY_IDENTITY_JSON environment variable is not set. Run npm run generate-identity first.'
    );
  }
  cachedIdentity = Ed25519KeyIdentity.fromParsedJson(JSON.parse(json));
  return cachedIdentity;
};

const buildSubscriptionActor = (
  canisterId: string,
  icHost: string,
  identity: Identity
): ActorSubclass<any> => {
  const agent = new HttpAgent({ identity, host: icHost });
  // fetchRootKey is required (and only safe) on the local replica
  if (icHost.includes('localhost') || icHost.includes('127.0.0.1')) {
    agent.fetchRootKey().catch((err) => {
      console.warn(`[envConfig] fetchRootKey failed for ${icHost}:`, err);
    });
  }
  return Actor.createActor(idlFactory, { agent, canisterId });
};

// Loads an EnvConfig either for a specific env (multi-env mode) or with
// legacy unsuffixed vars (single-env mode for local dev).
export const loadEnvConfig = (env?: string): EnvConfig => {
  const identity = getProxyIdentity();
  const icHost = envVar('IC_HOST', env) ?? process.env.IC_HOST ?? 'http://localhost:8080';
  const stripeSecret = requireEnvVar('STRIPE_SECRET_KEY', env);
  const webhookSecret = requireEnvVar('STRIPE_WEBHOOK_SECRET', env);
  const canisterId = requireEnvVar('SUBSCRIPTION_CANISTER_ID', env);
  const successUrl = requireEnvVar('STRIPE_SUCCESS_URL', env);
  const cancelUrl = requireEnvVar('STRIPE_CANCEL_URL', env);
  const appFeeRaw =
    envVar('NUANCE_APPLICATION_FEE_PERCENT', env) ??
    process.env.NUANCE_APPLICATION_FEE_PERCENT;
  const applicationFeePercent = appFeeRaw ? Number(appFeeRaw) : DEFAULT_APP_FEE_PERCENT;

  return {
    name: env ?? 'default',
    stripe: new Stripe(stripeSecret, { apiVersion: '2023-10-16' }),
    subscriptionActor: buildSubscriptionActor(canisterId, icHost, identity),
    webhookSecret,
    successUrl,
    cancelUrl,
    applicationFeePercent,
  };
};

// Reads the comma-separated PROXY_ENVS list. Empty/unset means legacy single-env mode.
export const getConfiguredEnvs = (): string[] => {
  const value = process.env.PROXY_ENVS;
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};
