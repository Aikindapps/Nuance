import { toast, ToastType } from './toastService';

const RETURN_KEY = 'nuance_stripe_return';

export type StripeReturnKind =
  | 'onboard'
  | 'onboard_incomplete'
  | 'checkout'
  | 'checkout_cancel'
  | 'billing';

// Opens Stripe in a new browser tab so the user keeps their place in the app.
// Must be called directly from a click handler: the synchronous window.open is
// treated as a user gesture (avoids popup blockers), and the async URL fetch
// happens after the blank tab is already open.
// Returns true if a tab/navigation was opened, false if the URL couldn't be created.
export async function openStripeInNewTab(
  getUrl: () => Promise<string | void>
): Promise<boolean> {
  const tab = window.open('', '_blank');
  if (tab) {
    tab.document.write(
      '<!doctype html><title>Stripe</title><body style="font-family:sans-serif;padding:24px;color:#444">Opening Stripe…</body>'
    );
  }
  const url = await getUrl();
  if (!url) {
    tab?.close();
    return false;
  }
  if (tab) {
    tab.location.href = url;
  } else {
    // popup was blocked - fall back to same-tab navigation so the flow still works
    window.location.href = url;
  }
  return true;
}

// Detects whether this page load is a return from Stripe (via query params set
// on the Stripe success/cancel/return URLs).
function detectReturnKind(): StripeReturnKind | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get('stripe_onboard') === 'complete') return 'onboard';
  if (params.get('stripe_onboard') === 'refresh') return 'onboard_incomplete';
  if (params.get('stripe_checkout') === 'cancel') return 'checkout_cancel';
  if (params.get('stripe_checkout') === 'success' || params.has('session_id')) return 'checkout';
  if (params.get('stripe_billing') === 'return') return 'billing';
  return null;
}

// Removes Stripe query params from the URL without reloading the page.
function stripStripeParams() {
  const url = new URL(window.location.href);
  ['stripe_onboard', 'stripe_checkout', 'stripe_billing', 'session_id'].forEach((p) =>
    url.searchParams.delete(p)
  );
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}

function showReturnToast(kind: StripeReturnKind) {
  switch (kind) {
    case 'onboard':
      toast('Stripe setup complete. Card payments are being enabled.', ToastType.Success);
      break;
    case 'onboard_incomplete':
      toast('Stripe setup was not finished. You can resume it anytime.', ToastType.Plain);
      break;
    case 'checkout':
      toast('Subscription successful! Your membership is now active.', ToastType.Success);
      break;
    case 'checkout_cancel':
      toast('Checkout canceled. You have not been charged.', ToastType.Plain);
      break;
    case 'billing':
      toast('Returned from Stripe. Any changes will appear shortly.', ToastType.Success);
      break;
  }
}

// Call once at app startup.
// - If this tab is a Stripe return tab, it signals the original app tab (via a
//   storage event) and closes itself. If the browser blocks the close, it shows
//   the toast here as a fallback.
// - Otherwise it listens for that signal and shows the success toast, plus
//   dispatches a `nuance:stripe-return` window event so views can refetch.
// Returns a cleanup function.
export function initStripeReturnHandler(): () => void {
  const kind = detectReturnKind();

  if (kind) {
    // This tab just came back from Stripe.
    stripStripeParams();
    // Notify any other app tab (storage events work across tabs regardless of COOP).
    try {
      localStorage.setItem(RETURN_KEY, JSON.stringify({ kind, ts: Date.now() }));
    } catch (_) {}
    // Confirm in this tab too: auto-close is usually blocked by Stripe's
    // Cross-Origin-Opener-Policy, so this tab will most likely stay open.
    showReturnToast(kind);
    window.dispatchEvent(new CustomEvent('nuance:stripe-return', { detail: { kind } }));
    // Best-effort close; expected to be refused by the browser after the
    // cross-origin Stripe round trip, in which case the user closes it manually.
    window.close();
    return () => {};
  }

  // Normal app tab - listen for a return signal from a Stripe tab.
  const onStorage = (e: StorageEvent) => {
    if (e.key === RETURN_KEY && e.newValue) {
      try {
        const { kind: returnedKind } = JSON.parse(e.newValue) as { kind: StripeReturnKind };
        showReturnToast(returnedKind);
        window.dispatchEvent(
          new CustomEvent('nuance:stripe-return', { detail: { kind: returnedKind } })
        );
      } catch (_) {}
      localStorage.removeItem(RETURN_KEY);
    }
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
