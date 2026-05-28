# Nuance Stripe Proxy — Deployment Guide

This proxy bridges Stripe and the Subscription canister. A **single deployed
instance serves both UAT and PROD** by routing on a path prefix:

```
https://<proxy-host>/uat/stripe/*    → UAT canister + Stripe test mode
https://<proxy-host>/prod/stripe/*   → PROD canister + Stripe live mode
```

Local dev keeps the legacy single-env mode at `/stripe/*` — no developer
disruption.

---

## TL;DR — what's already prepared in this repo

- Multi-env proxy code: `PROXY_ENVS=uat,prod` flips on prefixed routes.
- `Dockerfile` + `render.yaml` for Render.com.
- `STRIPE_PROXY_URL` wired into both UAT and PROD frontend workflows.
- One fresh Ed25519 identity generated (principal below).

## TL;DR — what you do tomorrow

1. **Create Render service** (pulls from this repo via `render.yaml`).
2. **Set the secret env vars** in Render UI (list below).
3. **Run two `setTrustedProxyPrincipal` admin calls** (UAT + PROD canisters).
4. **Add two webhook endpoints in Stripe** (test mode + live mode).
5. **Add the GitHub Secrets** the workflows now reference.
6. **Click "Deploy UAT"** in GitHub Actions → smoke test.
7. **Click PROD workflow** → smoke test.

---

## 1. The proxy identity (already generated)

A fresh Ed25519 identity has been generated. Two artifacts:

- **Principal** (public, set on both canisters):

  ```
  skj3z-bpjti-7xyq4-f4zol-5ec5d-ucyao-ytzlc-d3pqn-gffaa-fnl3h-hae
  ```

- **Full identity JSON** (private — never commit, never paste into chat):

  ```
  stripe-proxy/.deploy-identity.json
  ```

  File mode `0600`, listed in `.gitignore`. After you paste its contents
  into Render's `PROXY_IDENTITY_JSON` secret, **delete the local file**.

If you ever need a new one:

```bash
cd stripe-proxy
npm run generate-identity-deploy
```

---

## 2. Render.com setup (one-time)

Render reads `stripe-proxy/render.yaml` as a Blueprint. Two paths:

**Option A — Blueprint flow (recommended).**
1. Render Dashboard → **New +** → **Blueprint** → connect this GitHub repo.
2. Render parses `render.yaml` and creates a `nuance-stripe-proxy` web service
   (Docker, plan `starter`, region `oregon`, autoDeploy on).
3. Render asks for the values of every `sync: false` env var. Fill them in
   (list below).
4. First deploy starts automatically.

**Option B — Manual web service.**
1. New + → Web Service → connect repo → set Docker, build context `./stripe-proxy`.
2. Add every env var manually.

Either way, after the first deploy, the URL Render gives you (e.g.
`https://nuance-stripe-proxy.onrender.com`) is your `<proxy-host>`.
Optional: CNAME a friendlier hostname (`stripe-proxy.nuance.xyz`) to it.

### Health check

`GET https://<proxy-host>/health` →

```json
{ "status": "ok", "service": "nuance-stripe-proxy", "envs": ["uat", "prod"] }
```

---

## 3. Render env vars

Non-secret (already in `render.yaml`):

| Key | Value |
|---|---|
| `PROXY_ENVS` | `uat,prod` |
| `PORT` | `3001` |
| `IC_HOST` | `https://icp-api.io` |
| `NUANCE_APPLICATION_FEE_PERCENT` | `10` |
| `SUBSCRIPTION_CANISTER_ID_UAT` | `szrov-tiaaa-aaaaf-qalwq-cai` |
| `SUBSCRIPTION_CANISTER_ID_PROD` | `s6qib-6qaaa-aaaaf-qalwa-cai` |

Secret (`sync: false` — paste in Render UI):

**Shared:**
| Key | Source |
|---|---|
| `PROXY_IDENTITY_JSON` | Contents of `stripe-proxy/.deploy-identity.json` |
| `CORS_ORIGINS` | Comma-separated frontend origins, e.g. `https://uat.nuance.xyz,https://nuance.xyz` |

**UAT (Stripe test mode):**
| Key | Source |
|---|---|
| `STRIPE_SECRET_KEY_UAT` | Stripe Dashboard → **Test mode** → Developers → API keys → secret key `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET_UAT` | Stripe Dashboard → **Test mode** → Developers → Webhooks → the endpoint you create in §4 → signing secret `whsec_...` |
| `STRIPE_SUCCESS_URL_UAT` | UAT frontend base URL, e.g. `https://uat.nuance.xyz` |
| `STRIPE_CANCEL_URL_UAT` | UAT frontend base URL, e.g. `https://uat.nuance.xyz` |

**PROD (Stripe live mode):**
| Key | Source |
|---|---|
| `STRIPE_SECRET_KEY_PROD` | Stripe Dashboard → **Live mode** → Developers → API keys → secret key `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET_PROD` | Stripe Dashboard → **Live mode** → Developers → Webhooks → the endpoint you create in §4 → signing secret `whsec_...` |
| `STRIPE_SUCCESS_URL_PROD` | PROD frontend base URL, e.g. `https://nuance.xyz` |
| `STRIPE_CANCEL_URL_PROD` | PROD frontend base URL, e.g. `https://nuance.xyz` |

---

## 4. Stripe Dashboard configuration

Same Stripe organization for both envs; toggle between **Test mode** and
**Live mode** in the dashboard header.

### Required, both modes

- **Connect** enabled (Settings → Connect → activate). Required for Express
  accounts and destination charges.
- **Customer billing portal** activated (Settings → Billing → Customer
  portal → Activate). Without it, "Manage in Stripe" returns "No
  configuration provided."

### Webhook endpoints (one per mode)

In **Test mode** → Developers → Webhooks → **Add endpoint**:
- Endpoint URL: `https://<proxy-host>/uat/stripe/webhook`
- Events to send:
  - `checkout.session.completed`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Save → copy the signing secret (`whsec_...`) → set as `STRIPE_WEBHOOK_SECRET_UAT`.

In **Live mode** → repeat with URL `https://<proxy-host>/prod/stripe/webhook`
and store the secret as `STRIPE_WEBHOOK_SECRET_PROD`.

---

## 5. GitHub Secrets

The frontend workflows pull `STRIPE_PROXY_URL` from secrets. Add these in
GitHub → Settings → Secrets and variables → Actions:

| Secret name | Value |
|---|---|
| `STRIPE_PROXY_URL_UAT`  | `https://<proxy-host>/uat`  |
| `STRIPE_PROXY_URL_PROD` | `https://<proxy-host>/prod` |

Note the **no trailing slash**: the frontend appends `/stripe/<endpoint>`.

---

## 6. Canister admin steps (after the canister deploy completes)

The Subscription canister code is already deployed by the existing
backend workflows. The one-time admin step is registering the proxy
principal on each canister. Use your admin identity.

### UAT

```bash
dfx canister --network ic --identity <admin> \
  call szrov-tiaaa-aaaaf-qalwq-cai setTrustedProxyPrincipal \
  '("skj3z-bpjti-7xyq4-f4zol-5ec5d-ucyao-ytzlc-d3pqn-gffaa-fnl3h-hae")'
```

### PROD

```bash
dfx canister --network ic --identity <admin> \
  call s6qib-6qaaa-aaaaf-qalwa-cai setTrustedProxyPrincipal \
  '("skj3z-bpjti-7xyq4-f4zol-5ec5d-ucyao-ytzlc-d3pqn-gffaa-fnl3h-hae")'
```

Verify either with:

```bash
dfx canister --network ic call <canister-id> getTrustedProxyPrincipal
```

---

## 7. Day-of runbook

Order matters: backend canister → proxy live → frontend.

1. **Deploy UAT backend + frontend** — GitHub Actions → run `Deploy UAT`.
2. **Run UAT admin call** (§6) once.
3. **Verify Render proxy is up** — `GET https://<proxy-host>/health`.
4. **UAT smoke test** (§8).
5. **Deploy PROD** — run the PROD workflow.
6. **Run PROD admin call** (§6) once.
7. **PROD smoke test** (§8).

The Render proxy auto-deploys on pushes to main and serves both envs
continuously — no separate deploy step.

---

## 8. Smoke test checklist (per env)

Use the env's frontend URL (UAT or PROD).

**Writer (personal):**
- [ ] Edit profile → CARD PAYMENTS (STRIPE) panel renders.
- [ ] Click **Connect Stripe account** → new tab opens to Stripe onboarding.
- [ ] Complete onboarding (UAT: test data; PROD: real). Return → original
      tab toasts success, panel flips to "Stripe connected" + prices.
- [ ] Set a price (UAT: `$1.00+`; PROD: a real test price you'll refund), save → toast.

**Writer (publication):**
- [ ] Edit publication → CARD PAYMENTS (STRIPE) panel renders.
- [ ] Same connect + price flow works.

**Reader:**
- [ ] Visit the writer/publication → **Support** button visible.
- [ ] Open support modal → **Pay with card** tab visible → select tier → continue.
- [ ] Pay with `4242 4242 4242 4242` (UAT) or a real card (PROD; refund after).
- [ ] Return → toast "Subscription successful! …". Profile flips to **Manage Membership**.
- [ ] Open Manage Membership → details show payment method + dates + status.

**Cancel:**
- [ ] Manage Membership → **Manage in Stripe** → billing portal opens in new tab.
- [ ] Cancel the subscription → click "Return to Nuance" → toast on the original tab.
- [ ] Reopen Manage Membership → status shows **"Cancels on … · won't renew"**.

**Webhook health:**
- [ ] Render logs show `[uat][webhook] Received event: …` (or `[prod]`) for
      each `checkout.session.completed`, `invoice.paid`,
      `customer.subscription.updated`, etc. that you triggered.

---

## 9. Local dev (unchanged)

Your local `stripe-proxy/.env` keeps its current shape (no `_UAT`/`_PROD`
suffix). When `PROXY_ENVS` is unset, the proxy mounts routes at `/stripe/*`
and `npm run dev` works exactly like before. The frontend's local build
defaults `STRIPE_PROXY_URL` to `http://localhost:3001`.

---

## Troubleshooting

- **`Canister has no update method 'X'`** → canister isn't upgraded yet; run
  the backend workflow.
- **Webhook signature verification failed** → wrong `STRIPE_WEBHOOK_SECRET_*`
  on Render, or the secret was rotated in Stripe.
- **`destination account needs transfers/card_payments capability`** →
  the writer's Stripe account didn't finish onboarding. They need to click
  "Review / complete Stripe setup" and finish the form.
- **CORS error from frontend** → add the frontend origin to Render's
  `CORS_ORIGINS` and redeploy (Render → Manual Deploy or wait for autodeploy).
- **`getActiveSubscriptionPaymentMethod` etc. returns `'none'` after Stripe
  checkout** → either the webhook isn't reaching the proxy (check Stripe
  Dashboard → Webhooks → recent deliveries) or the proxy log shows the
  event but a canister call failed (check `setTrustedProxyPrincipal` ran).
