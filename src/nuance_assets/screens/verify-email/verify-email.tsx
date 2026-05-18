import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';
import Loader from '../../UI/loader/Loader';
import { useTheme } from '../../contextes/ThemeContext';
import { colors } from '../../shared/constants';
import { verifyEmailSubscription } from '../../services/emailSubscriptionService';
import { useAuthStore } from '../../store';
import './_verify-email.scss';

// Landing page for verification links in outbound emails. Reads `?token=`
// from the URL, calls the User canister's verifyEmailSubscription, and
// renders one of three states: loading / success / error.
//
// We don't require the user to be logged in to verify — the token is the
// only thing that matters.
type Status = 'loading' | 'success' | 'error';

const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [handle, setHandle] = useState('');
  const agent = useAuthStore((s) => s.agent);
  const darkTheme = useTheme();
  const loggedIn = Boolean(agent);
  const ScreenWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  // Guards against React StrictMode double-invoking this effect in dev.
  // Without it, the first call consumes the token and the second call
  // sees "Invalid or expired" — which then wins the UI state.
  const didVerifyRef = useRef(false);

  const themePalette = darkTheme
    ? {
        screenBackground: colors.darkModePrimaryBackgroundColor,
        cardBackground: colors.darkModePrimaryBackgroundColor,
        cardBorder: colors.darkModeDarkerBorderColor,
        title: colors.darkModePrimaryTextColor,
        body: colors.darkSecondaryTextColor,
        ctaBackground: colors.darkModeAccentColor,
        ctaForeground: colors.darkModePrimaryBackgroundColor,
      }
    : {
        screenBackground: colors.primaryBackgroundColor,
        cardBackground: colors.primaryBackgroundColor,
        cardBorder: colors.darkerBorderColor,
        title: colors.primaryTextColor,
        body: colors.tagTextColor,
        ctaBackground: colors.primaryButtonColor,
        ctaForeground: colors.primaryBackgroundColor,
      };

  useEffect(() => {
    if (didVerifyRef.current) return;
    didVerifyRef.current = true;
    (async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token.');
        return;
      }
      try {
        const res = await verifyEmailSubscription(token, agent ?? undefined);
        if (res.ok) {
          setStatus('success');
          setHandle(res.ok.authorHandle);
          setMessage(
            `You're now subscribed to email updates${
              res.ok.authorHandle ? ` from ${res.ok.authorHandle}` : ''
            }.`
          );
        } else {
          setStatus('error');
          setMessage(res.err ?? 'Verification failed.');
        }
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message ?? 'Verification failed.');
      }
    })();
  }, [token, agent]);

  return (
    <>
      <Helmet>
        <title>Verify email — Nuance</title>
      </Helmet>
      <Header loggedIn={loggedIn} isArticlePage={false} ScreenWidth={ScreenWidth} />
      <div
        className='verify-email-screen'
        style={{ background: themePalette.screenBackground }}
      >
        <div
          className='verify-email-card'
          style={{
            background: themePalette.cardBackground,
            borderColor: themePalette.cardBorder,
          }}
        >
          {status === 'loading' && (
            <>
              <Loader />
              <p
                className='verify-email-title'
                style={{ color: themePalette.title }}
              >
                Verifying your email…
              </p>
            </>
          )}
          {status === 'success' && (
            <>
              <h1 className='verify-email-title' style={{ color: themePalette.title }}>
                You're subscribed
              </h1>
              <p className='verify-email-body' style={{ color: themePalette.body }}>
                {message}
              </p>
              <Link
                to='/'
                className='verify-email-cta'
                style={{
                  background: themePalette.ctaBackground,
                  color: themePalette.ctaForeground,
                }}
              >
                Return home
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className='verify-email-title' style={{ color: themePalette.title }}>
                Verification failed
              </h1>
              <p className='verify-email-body' style={{ color: themePalette.body }}>
                {message}
              </p>
              <Link
                to='/'
                className='verify-email-cta'
                style={{
                  background: themePalette.ctaBackground,
                  color: themePalette.ctaForeground,
                }}
              >
                Return home
              </Link>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default VerifyEmail;