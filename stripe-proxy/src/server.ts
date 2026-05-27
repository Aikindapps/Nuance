import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import onboardRouter from './routes/onboard';
import accountStatusRouter from './routes/accountStatus';
import createPriceRouter from './routes/createPrice';
import checkoutRouter from './routes/checkout';
import billingPortalRouter from './routes/billingPortal';
import webhookRouter from './routes/webhook';

const app = express();
const PORT = process.env.PORT ?? 3001;

// CORS - tighten allowed origins in production
app.use(cors());

// IMPORTANT: the webhook route must receive the raw Buffer body for Stripe signature verification.
// Apply express.raw() BEFORE express.json() and mount it on the specific webhook path only.
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

// All other routes get the normal JSON body parser
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nuance-stripe-proxy' });
});

// Stripe routes
app.use('/stripe/onboard', onboardRouter);
app.use('/stripe/account-status', accountStatusRouter);
app.use('/stripe/create-price', createPriceRouter);
app.use('/stripe/checkout', checkoutRouter);
app.use('/stripe/billing-portal', billingPortalRouter);
app.use('/stripe/webhook', webhookRouter);

app.listen(PORT, () => {
  console.log(`Nuance Stripe proxy running on port ${PORT}`);
  console.log(`Webhook endpoint: POST /stripe/webhook`);
});

export default app;
