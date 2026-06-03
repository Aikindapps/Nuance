/**
 * Generates a new Ed25519 IC identity for the deployed proxy.
 * Writes the JSON to .deploy-identity.json (gitignored) so the secret never
 * passes through stdout. Prints only the principal.
 *
 * IMPORTANT: explicitly seeds Ed25519KeyIdentity.generate() with
 * crypto.randomBytes(32). Without an explicit seed, @dfinity/identity 0.20.2
 * defaults to an all-zeros seed, producing a deterministic (and publicly
 * known) keypair - unusable for production.
 *
 * Run: npm run generate-identity-deploy
 */
import { Ed25519KeyIdentity } from '@dfinity/identity';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const seed = crypto.randomBytes(32);
const identity = Ed25519KeyIdentity.generate(seed);
const principal = identity.getPrincipal().toText();
const json = JSON.stringify(identity.toJSON());

const outPath = path.resolve(__dirname, '..', '.deploy-identity.json');
fs.writeFileSync(outPath, json, { mode: 0o600 });

console.log('\n=== Nuance Stripe Proxy Deployment Identity ===\n');
console.log('IC Principal (set as trustedProxyPrincipal on UAT + PROD canisters):');
console.log(principal);
console.log('\nFull identity JSON written (mode 0600) to:');
console.log(outPath);
console.log('\n>> Copy that file\'s contents into the Render env var PROXY_IDENTITY_JSON, then delete the file.');
console.log('================================================\n');
