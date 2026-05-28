# Nuance Stripe Proxy — Operations Guide

This proxy bridges Stripe and the Subscription canister. A **single deployed
instance serves both UAT and PROD** by routing on a path prefix:

```
https://<proxy-host>/uat/stripe/*    → UAT canister + Stripe test mode
https://<proxy-host>/prod/stripe/*   → PROD canister + Stripe live mode
```

Local development keeps the legacy single-env mode at `/stripe/*` — when
`PROXY_ENVS` is unset, the proxy mounts routes without an environment prefix
and reads unsuffixed env var names.

## Current deployment

- Hosting: Render.com web service (Docker, defined in `render.yaml`).
- Public URL: `https://nuance-stripe-proxy.onrender.com`
- Health endpoint: `GET /health` returns `{ "status": "ok", "service":
  "nuance-stripe-proxy", "envs": [...] }`
- Subscription canisters:
  - UAT: `szrov-tiaaa-aaaaf-qalwq-cai`
  - PROD: `s6qib-6qaaa-aaaaf-qalwa-cai`
- Proxy IC principal (must be registered as `trustedProxyPrincipal` on each
  Subscription canister):

  ```
  skj3z-bpjti-7xyq4-f4zol-5ec5d-ucyao-ytzlc-d3pqn-gffaa-fnl3h-hae
  ```

---

## 1. Local environment setup

### Prerequisites

- Node.js 20+
- dfx (matching the project version)
- A Stripe account with **Test mode** access
- The Stripe CLI for webhook forwarding

### Install and configure

```bash
cd stripe-proxy
npm install
```

Generate a local-dev IC identity for the proxy (writes `proxy-identity.json`
in `stripe-proxy/` — used only for `npm run dev`):

```bash
npm run generate-identity
```

Register the resulting principal as the trusted proxy on whichever
Subscription canister the local proxy should call (typically a local replica
deployment, or the UAT canister for end-to-end testing against IC):

```bash
dfx canister --network ic --identity <admin> \
  call <subscription-canister-id> setTrustedProxyPrincipal \
  '("<principal-from-generate-identity>")'
```

### Local `.env`

Create `stripe-proxy/.env` (gitignored) with the **single-env** variable
names (no `_UAT`/`_PROD` suffix):

```env
PORT=3001
IC_HOST=https://icp-api.io
SUBSCRIPTION_CANISTER_ID=<canister id you want to target>
PROXY_IDENTITY_JSON=<contents of proxy-identity.json, single line>
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from `stripe listen` output
STRIPE_SUCCESS_URL=http://localhost:3000
STRIPE_CANCEL_URL=http://localhost:3000
NUANCE_APPLICATION_FEE_PERCENT=10
CORS_ORIGINS=http://localhost:3000
```

When `PROXY_ENVS` is unset, the proxy mounts routes at `/stripe/*` and reads
the unsuffixed names above.

### Run

```bash
npm run dev
```

The frontend's local build defaults `STRIPE_PROXY_URL` to
`http://localhost:3001`, so no frontend configuration is needed.

### Forwarding Stripe webhooks locally

```bash
stripe listen --forward-to http://localhost:3001/stripe/webhook
```

The CLI prints a `whsec_...` — paste it into the local `.env` as
`STRIPE_WEBHOOK_SECRET` and restart the proxy.

---

## 2. UAT deployment

The Render proxy auto-deploys from pushes to the watched branch, but the IC
canisters do not. UAT canister deploys are triggered manually from GitHub
Actions.

### One-time prerequisites

- Render Blueprint service `nuance-stripe-proxy` exists (created from
  `render.yaml`).
- Render env vars set:
  - `PROXY_ENVS=uat` (or `uat,prod` once PROD is live)
  - `PROXY_IDENTITY_JSON`, `CORS_ORIGINS`, `STRIPE_SECRET_KEY_UAT`,
    `STRIPE_WEBHOOK_SECRET_UAT`, `STRIPE_SUCCESS_URL_UAT`,
    `STRIPE_CANCEL_URL_UAT`
- Stripe **Test mode** webhook endpoint exists at
  `https://nuance-stripe-proxy.onrender.com/uat/stripe/webhook`, sending:
  - `checkout.session.completed`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- GitHub Secrets `STRIPE_PROXY_URL_UAT` and `STRIPE_PROXY_URL_PROD` set
  (the PROD value can be set now even before PROD launches).

### Per-deploy procedure

1. **Verify the proxy is healthy.**

   ```bash
   curl https://nuance-stripe-proxy.onrender.com/health
   ```

   Expect `"envs": ["uat"]` (or `["uat","prod"]` once PROD is enabled).

2. **Deploy UAT canisters + frontend.** GitHub → Actions → **Deploy UAT** →
   Run workflow → pick the desired branch.

3. **Register the proxy principal on the UAT Subscription canister.** Only
   required the first time after a fresh canister deploy or after rotating
   the proxy identity:

   ```bash
   dfx canister --network ic --identity <admin> \
     call szrov-tiaaa-aaaaf-qalwq-cai setTrustedProxyPrincipal \
     '("skj3z-bpjti-7xyq4-f4zol-5ec5d-ucyao-ytzlc-d3pqn-gffaa-fnl3h-hae")'
   ```

   Verify:

   ```bash
   dfx canister --network ic call szrov-tiaaa-aaaaf-qalwq-cai \
     getTrustedProxyPrincipal
   ```

4. **Smoke test** at the UAT frontend (see §4).

### Updating proxy code only

Pushing to the branch Render is watching auto-deploys the proxy. No canister
or frontend action is needed.

---

## 3. PROD deployment

PROD uses Stripe **Live mode** (real money). The same Render service handles
both environments; PROD routes go live by adding PROD env vars and flipping
`PROXY_ENVS` to `uat,prod`.

### One-time PROD preparation

In the Stripe Dashboard, **Live mode**:

1. **Activate the account** (business details, bank info).
2. **Enable Connect**: Settings → Connect → activate.
3. **Activate the Customer billing portal**: Settings → Billing → Customer
   portal → Activate. Without this, "Manage in Stripe" fails with
   "No configuration provided".
4. **Create a webhook endpoint**:
   - URL: `https://nuance-stripe-proxy.onrender.com/prod/stripe/webhook`
   - Events: same five as UAT (`checkout.session.completed`, `invoice.paid`,
     `invoice.payment_failed`, `customer.subscription.updated`,
     `customer.subscription.deleted`).
   - Copy the signing secret (`whsec_...`).

In Render → Environment, add:

| Key | Value |
|---|---|
| `STRIPE_SECRET_KEY_PROD` | `sk_live_...` from Live mode → API keys |
| `STRIPE_WEBHOOK_SECRET_PROD` | `whsec_...` from the live webhook endpoint |
| `STRIPE_SUCCESS_URL_PROD` | PROD frontend base URL |
| `STRIPE_CANCEL_URL_PROD` | PROD frontend base URL |

Update existing Render env vars:

- `PROXY_ENVS` → `uat,prod`
- `CORS_ORIGINS` → add the PROD frontend origin(s), comma-separated

Save and let Render redeploy. Verify:

```bash
curl https://nuance-stripe-proxy.onrender.com/health
# expect "envs": ["uat","prod"]
```

### Per-deploy procedure

1. **Verify proxy health** as above.
2. **Deploy PROD canisters + frontend** using the existing PROD release
   workflows (`Prepare frontend assets PROD` plus the backend PROD deploy).
3. **Register the proxy principal on the PROD Subscription canister**:

   ```bash
   dfx canister --network ic --identity <admin> \
     call s6qib-6qaaa-aaaaf-qalwa-cai setTrustedProxyPrincipal \
     '("skj3z-bpjti-7xyq4-f4zol-5ec5d-ucyao-ytzlc-d3pqn-gffaa-fnl3h-hae")'
   ```

4. **Smoke test** at the PROD frontend (see §4) using a real card; refund
   afterward via the Stripe Dashboard.

---

## 4. Smoke test checklist (per env)

Run against the env's frontend URL.

**Writer (personal):**
- [ ] Edit profile → CARD PAYMENTS (STRIPE) panel renders.
- [ ] Click **Connect Stripe account** → new tab opens to Stripe onboarding.
- [ ] Complete onboarding (UAT: test data; PROD: real). Return → original
      tab toasts success, panel flips to "Stripe connected" + prices.
- [ ] Set a price (UAT: `$1.00+`; PROD: a real test price to refund), save → toast.

**Writer (publication):**
- [ ] Edit publication → CARD PAYMENTS (STRIPE) panel renders.
- [ ] Same connect + price flow works.

**Reader:**
- [ ] Visit the writer/publication → **Support** button visible.
- [ ] Open support modal → **Pay with card** tab visible → select tier → continue.
- [ ] Pay with `4242 4242 4242 4242` (UAT) or a real card (PROD; refund after).
- [ ] Return → toast "Subscription successful! …". Profile flips to
      **Manage Membership**.
- [ ] Open Manage Membership → details show payment method + dates + status.

**Cancel:**
- [ ] Manage Membership → **Manage in Stripe** → billing portal opens in
      new tab.
- [ ] Cancel the subscription → click "Return to Nuance" → toast on the
      original tab.
- [ ] Reopen Manage Membership → status shows
      **"Cancels on … · won't renew"**.

**Webhook health:**
- [ ] Render logs show `[uat][webhook] Received event: …` (or `[prod]`) for
      each `checkout.session.completed`, `invoice.paid`,
      `customer.subscription.updated`, etc. triggered by the test flow.

---

## 5. Render env var reference

Non-secret (committed in `render.yaml`):

| Key | Value |
|---|---|
| `PROXY_ENVS` | `uat` (single env) or `uat,prod` (both) |
| `PORT` | `3001` |
| `IC_HOST` | `https://icp-api.io` |
| `NUANCE_APPLICATION_FEE_PERCENT` | `10` |
| `SUBSCRIPTION_CANISTER_ID_UAT` | `szrov-tiaaa-aaaaf-qalwq-cai` |
| `SUBSCRIPTION_CANISTER_ID_PROD` | `s6qib-6qaaa-aaaaf-qalwa-cai` |

Secret (set in the Render UI, never committed):

**Shared:**

| Key | Source |
|---|---|
| `PROXY_IDENTITY_JSON` | Output of `npm run generate-identity-deploy` — the JSON written to `stripe-proxy/.deploy-identity.json` (delete the local file after pasting). |
| `CORS_ORIGINS` | Comma-separated frontend origins. |

**UAT (Stripe test mode):**

| Key | Source |
|---|---|
| `STRIPE_SECRET_KEY_UAT` | Test mode → Developers → API keys → `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET_UAT` | Test mode → Developers → Webhooks → endpoint signing secret `whsec_...` |
| `STRIPE_SUCCESS_URL_UAT` | UAT frontend base URL |
| `STRIPE_CANCEL_URL_UAT` | UAT frontend base URL |

**PROD (Stripe live mode):**

| Key | Source |
|---|---|
| `STRIPE_SECRET_KEY_PROD` | Live mode → Developers → API keys → `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET_PROD` | Live mode → Developers → Webhooks → endpoint signing secret `whsec_...` |
| `STRIPE_SUCCESS_URL_PROD` | PROD frontend base URL |
| `STRIPE_CANCEL_URL_PROD` | PROD frontend base URL |

GitHub Secrets (consumed by the frontend deploy workflows):

| Secret name | Value |
|---|---|
| `STRIPE_PROXY_URL_UAT`  | `https://nuance-stripe-proxy.onrender.com/uat`  |
| `STRIPE_PROXY_URL_PROD` | `https://nuance-stripe-proxy.onrender.com/prod` |

No trailing slash — the frontend appends `/stripe/<endpoint>`.

---

## 6. Rotating the proxy identity

If the deployed proxy identity is compromised or needs replacement:

```bash
cd stripe-proxy
npm run generate-identity-deploy
```

This writes `.deploy-identity.json` (mode `0600`, gitignored) and prints
only the new principal. Then:

1. Paste the file contents into Render's `PROXY_IDENTITY_JSON`.
2. Delete the local file: `rm stripe-proxy/.deploy-identity.json`.
3. Call `setTrustedProxyPrincipal` with the new principal on **both** the
   UAT and PROD Subscription canisters.
4. Render redeploys automatically with the new identity.

> The identity generator explicitly seeds `Ed25519KeyIdentity.generate()`
> with `crypto.randomBytes(32)`. Without an explicit seed,
> `@dfinity/identity` 0.20.2 defaults to an all-zeros seed and produces a
> deterministic, publicly known keypair. Do not bypass the seed.

---

## 7. Troubleshooting

- **`Canister has no update method 'X'`** — the canister isn't upgraded yet;
  run the backend deploy workflow.
- **Webhook signature verification failed** — `STRIPE_WEBHOOK_SECRET_*` on
  Render doesn't match the signing secret of the corresponding webhook
  endpoint in Stripe (rotated or wrong env).
- **`destination account needs transfers/card_payments capability`** — the
  writer's Stripe account didn't finish onboarding. They need to click
  "Review / complete Stripe setup" and finish the form.
- **CORS error from the frontend** — the frontend origin is missing from
  `CORS_ORIGINS`. Add it and let Render redeploy.
- **`getActiveSubscriptionPaymentMethod` returns `'none'` after Stripe
  checkout** — either the webhook isn't reaching the proxy (check Stripe
  Dashboard → Webhooks → recent deliveries) or the proxy log shows the
  event but a canister call failed (verify `setTrustedProxyPrincipal` was
  called with the current proxy principal).
- **Render boot fails with `Missing required env var: STRIPE_*_PROD`** —
  `PROXY_ENVS` includes `prod` but the PROD secrets aren't all set. Either
  fill the missing PROD vars or set `PROXY_ENVS=uat` temporarily.
