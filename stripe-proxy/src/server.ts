import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { EnvConfig, getConfiguredEnvs, loadEnvConfig } from './envConfig';
import { createOnboardRouter } from './routes/onboard';
import { createAccountStatusRouter } from './routes/accountStatus';
import { createCreatePriceRouter } from './routes/createPrice';
import { createCheckoutRouter } from './routes/checkout';
import { createBillingPortalRouter } from './routes/billingPortal';
import { createWebhookRouter } from './routes/webhook';

const app = express();
const PORT = process.env.PORT ?? 3001;

// CORS — tighten via CORS_ORIGINS=https://uat.host,https://prod.host in production.
const corsOrigins = process.env.CORS_ORIGINS;
if (corsOrigins) {
  app.use(
    cors({
      origin: corsOrigins
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    })
  );
} else {
  app.use(cors());
}

// PROXY_ENVS=uat,prod  → multi-env mode, routes mounted at /<env>/stripe/*
// (empty)              → legacy single-env mode, routes at /stripe/*
const envs = getConfiguredEnvs();
const multiEnv = envs.length > 0;

// IMPORTANT: the webhook route must receive the RAW request body for Stripe
// signature verification. Mount express.raw() for the webhook paths BEFORE
// express.json() so the body parser doesn't consume the buffer.
if (multiEnv) {
  for (const env of envs) {
    app.use(`/${env}/stripe/webhook`, express.raw({ type: 'application/json' }));
  }
} else {
  app.use('/stripe/webhook', express.raw({ type: 'application/json' }));
}

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'nuance-stripe-proxy',
    envs: multiEnv ? envs : ['default'],
  });
});

const mountRoutes = (basePath: string, config: EnvConfig) => {
  app.use(`${basePath}/stripe/onboard`, createOnboardRouter(config));
  app.use(`${basePath}/stripe/account-status`, createAccountStatusRouter(config));
  app.use(`${basePath}/stripe/create-price`, createCreatePriceRouter(config));
  app.use(`${basePath}/stripe/checkout`, createCheckoutRouter(config));
  app.use(`${basePath}/stripe/billing-portal`, createBillingPortalRouter(config));
  app.use(`${basePath}/stripe/webhook`, createWebhookRouter(config));
};

if (multiEnv) {
  for (const env of envs) {
    const config = loadEnvConfig(env);
    mountRoutes(`/${env}`, config);
  }
} else {
  // legacy single-env mode (local dev) - reads STRIPE_* without suffix
  const config = loadEnvConfig();
  mountRoutes('', config);
}

app.listen(PORT, () => {
  console.log(`Nuance Stripe proxy running on port ${PORT}`);
  if (multiEnv) {
    for (const env of envs) {
      console.log(`  /${env}/stripe/* → ${env.toUpperCase()} env`);
    }
  } else {
    console.log('  /stripe/* → default env (local single-env mode)');
  }
});

export default app;
