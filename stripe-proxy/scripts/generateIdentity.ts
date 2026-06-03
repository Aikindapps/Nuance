/**
 * Generates a new Ed25519 IC identity keypair for use as the proxy bridge identity.
 *
 * Run once:  npm run generate-identity
 *
 * Output:
 *   - The full JSON (set as PROXY_IDENTITY_JSON env var, keep secret)
 *   - The derived IC principal (set as trustedProxyPrincipal in the canister via setTrustedProxyPrincipal)
 */
import { Ed25519KeyIdentity } from '@dfinity/identity';

const identity = Ed25519KeyIdentity.generate();
const principal = identity.getPrincipal().toText();
const json = JSON.stringify(identity.toJSON());

console.log('\n=== Nuance Stripe Proxy Identity ===\n');
console.log('IC Principal (set this via setTrustedProxyPrincipal on the canister):');
console.log(principal);
console.log('\nPROXY_IDENTITY_JSON (add this to your .env file, KEEP SECRET):');
console.log(json);
console.log('\n====================================\n');
