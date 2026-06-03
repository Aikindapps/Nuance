import React, { useState, useEffect } from 'react';
import { SubscriptionTimeInterval } from 'src/declarations/Subscription/Subscription.did';
import { useTheme } from '../../contextes/ThemeContext';
import Button from '../../UI/Button/Button';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { toast, toastError, ToastType } from '../../services/toastService';
import { openStripeInNewTab } from '../../services/stripeRedirect';
import { fetchStripeAccountStatus } from '../../services/stripeProxyService';
import { Agent } from '@dfinity/agent';
import './_stripe-subscription-settings.scss';

interface StripeSubscriptionSettingsProps {
  // the principal that owns the Stripe account.
  // personal writer: the authenticated caller's own principal.
  // publication: the publication canister id (and publicationCanisterId is also set).
  writerPrincipalId: string;
  stripeAccountId: [] | [string];
  stripeIsActive: boolean;
  stripePricing: Array<[SubscriptionTimeInterval, string, string]>;
  agent?: Agent;
  // when set, authorization runs the editor check for this publication
  publicationCanisterId?: string;
}

// LifeTime is intentionally excluded: Stripe has no one-time "lifetime" concept,
// so charging a writer's "lifetime" tier as a yearly-recurring subscription
// would mislead readers. NUA-based subscriptions still support LifeTime.
type Interval = 'Weekly' | 'Monthly' | 'Annually';
const INTERVALS: Interval[] = ['Weekly', 'Monthly', 'Annually'];

const StripeSubscriptionSettings: React.FC<StripeSubscriptionSettingsProps> = ({
  writerPrincipalId,
  stripeAccountId,
  stripeIsActive,
  stripePricing,
  agent,
  publicationCanisterId,
}) => {
  const darkTheme = useTheme();
  const { activateStripeForWriter, createStripePriceTier } = useSubscriptionStore(
    (state) => ({
      activateStripeForWriter: state.activateStripeForWriter,
      createStripePriceTier: state.createStripePriceTier,
    })
  );

  const isConnected = stripeAccountId.length > 0;

  // pre-fill USD dollar amounts from the stored cents values
  const initialPrices = (): Record<Interval, string> => {
    const result: Record<Interval, string> = {
      Weekly: '',
      Monthly: '',
      Annually: '',
    };
    for (const [interval, , cents] of stripePricing) {
      const key = Object.keys(interval)[0] as string;
      if (key === 'Weekly' || key === 'Monthly' || key === 'Annually') {
        result[key] = (Number(cents) / 100).toString();
      }
    }
    return result;
  };

  const [prices, setPrices] = useState<Record<Interval, string>>(initialPrices());
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  // whether the connected Stripe account can actually receive payments
  // (charges + transfers enabled), verified live against Stripe
  const [accountActive, setAccountActive] = useState(stripeIsActive);

  // verify the real Stripe account status on load and whenever the writer
  // returns from a Stripe tab - an account isn't usable until onboarding
  // is fully completed, even though it was created on the first click
  useEffect(() => {
    if (stripeAccountId.length === 0) {
      return;
    }
    let cancelled = false;
    const checkStatus = async () => {
      try {
        const status = await fetchStripeAccountStatus(
          writerPrincipalId,
          agent,
          publicationCanisterId
        );
        if (!cancelled) {
          setAccountActive(status.active);
        }
      } catch (_) {
        // leave the last known state on failure
      }
    };
    checkStatus();
    window.addEventListener('nuance:stripe-return', checkStatus);
    return () => {
      cancelled = true;
      window.removeEventListener('nuance:stripe-return', checkStatus);
    };
  }, [stripeAccountId, writerPrincipalId, agent, publicationCanisterId]);

  // the parent fetches subscription details asynchronously, so re-sync the
  // editable price inputs whenever the stored pricing arrives or changes
  useEffect(() => {
    const result: Record<Interval, string> = {
      Weekly: '',
      Monthly: '',
      Annually: '',
    };
    for (const [interval, , cents] of stripePricing) {
      const key = Object.keys(interval)[0] as string;
      if (key === 'Weekly' || key === 'Monthly' || key === 'Annually') {
        result[key] = (Number(cents) / 100).toString();
      }
    }
    setPrices(result);
  }, [stripePricing]);

  // reflect the stored active flag as soon as the parent fetch provides it,
  // before the live status check refines it (avoids a "Setup incomplete" flash)
  useEffect(() => {
    setAccountActive(stripeIsActive);
  }, [stripeIsActive]);

  const handleConnect = async () => {
    setConnecting(true);
    // open Stripe's hosted onboarding in a new tab so the writer keeps their place
    const opened = await openStripeInNewTab(() =>
      activateStripeForWriter(writerPrincipalId, agent, publicationCanisterId)
    );
    setConnecting(false);
    if (opened) {
      toast('Continue in the new Stripe tab…', ToastType.Plain);
    }
  };

  const handlePriceChange = (interval: Interval, value: string) => {
    setPrices((prev) => ({ ...prev, [interval]: value }));
  };

  const handleSavePrices = async () => {
    // collect the tiers that have a valid amount entered (Stripe minimum is $1.00)
    const tiersToSave = INTERVALS.filter((interval) => {
      const dollars = parseFloat(prices[interval]);
      return !isNaN(dollars) && dollars >= 1;
    });

    if (tiersToSave.length === 0) {
      toastError('Enter at least one price of $1.00 or more.');
      return;
    }

    setSaving(true);
    let successCount = 0;
    for (const interval of tiersToSave) {
      const cents = Math.round(parseFloat(prices[interval]) * 100);
      const ok = await createStripePriceTier(
        writerPrincipalId,
        interval,
        cents.toString(),
        agent,
        publicationCanisterId
      );
      if (ok) {
        successCount += 1;
      }
    }
    setSaving(false);

    if (successCount > 0) {
      toast(
        `Saved ${successCount} Stripe price${successCount > 1 ? 's' : ''}.`,
        ToastType.Success
      );
    }
  };

  return (
    <div className='stripe-subscription-settings'>
      <p className='mainTitle'>CARD PAYMENTS (STRIPE)</p>
      <p>
        Let readers subscribe with a credit or debit card. Nuance collects the
        payment and transfers your share to your connected Stripe account.
      </p>

      {!isConnected ? (
        <div className='stripe-connect-row'>
          <Button
            type='button'
            styleType={{ dark: 'navy-dark', light: 'navy' }}
            style={{ padding: '0px 16px', margin: '0px' }}
            loading={connecting}
            disabled={connecting}
            onClick={handleConnect}
          >
            Connect Stripe account
          </Button>
        </div>
      ) : (
        <>
          <div className='stripe-status-row'>
            <span
              className={`stripe-status-badge ${
                accountActive ? 'active' : 'inactive'
              }`}
            >
              {accountActive ? 'Stripe connected' : 'Setup incomplete'}
            </span>
            <button
              type='button'
              className='stripe-refresh-link'
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? 'Opening Stripe…' : 'Review / complete Stripe setup'}
            </button>
          </div>

          {accountActive ? (
            <>
              <div className='stripe-price-options'>
                <div className='stripe-price-header'>
                  <div className='stripe-header-period'>PERIOD</div>
                  <div className='stripe-header-fee'>PRICE (USD)</div>
                </div>
                {INTERVALS.map((interval) => (
                  <div className='stripe-price-option' key={interval}>
                    <div className='stripe-period'>{interval}</div>
                    <div
                      className={
                        darkTheme
                          ? 'stripe-value-container dark'
                          : 'stripe-value-container'
                      }
                    >
                      <span className='stripe-dollar'>$</span>
                      <input
                        type='number'
                        value={prices[interval]}
                        placeholder='0.00'
                        min={1}
                        step={0.01}
                        className={darkTheme ? 'dark' : ''}
                        onChange={(e) =>
                          handlePriceChange(interval, e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className='stripe-save-row'>
                <Button
                  type='button'
                  styleType={{ dark: 'navy-dark', light: 'navy' }}
                  style={{ padding: '0px 16px', margin: '0px' }}
                  loading={saving}
                  disabled={saving}
                  onClick={handleSavePrices}
                >
                  Save Stripe prices
                </Button>
              </div>
            </>
          ) : (
            <p className='stripe-setup-note'>
              Your Stripe account isn't ready to accept payments yet. Click
              "Review / complete Stripe setup" above and finish the onboarding
              steps. Once Stripe verifies your account, you'll be able to set
              prices here.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default StripeSubscriptionSettings;
