import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';
import Loader from '../../UI/loader/Loader';
import { useTheme } from '../../contextes/ThemeContext';
import { colors } from '../../shared/constants';
import { useAuthStore, useUserStore } from '../../store';
import '../verify-email/_verify-email.scss';

// Landing page hit by the DecideID OIDC redirect_uri. Reads
// `?code=&state=` from the query string and hands them to the user
// store, which validates state and asks the User canister to exchange
// the code for a userinfo response.
//
// The user must already be logged in to Nuance when they hit this page
// (the canister side is `shared ({ caller })` and rejects anonymous).
// We don't block on that here — the store call will surface a clear
// error if so.
type Status = 'loading' | 'success' | 'error';

const DecideIdCallback: React.FC = () => {
  const [params] = useSearchParams();
  const code = params.get('code') ?? '';
  const state = params.get('state') ?? '';
  const errParam = params.get('error');
  const errDescParam = params.get('error_description');

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  const darkTheme = useTheme();
  const agent = useAuthStore((s) => s.agent);
  const loggedIn = Boolean(agent);
  const completeDecideIdVerification = useUserStore(
    (s) => s.completeDecideIdVerification,
  );
  const ScreenWidth = typeof window !== 'undefined' ? window.innerWidth : 0;

  // Guard against React StrictMode's double-effect: the canister
  // burns the `state` on first call, so a second one would always
  // fail with "Invalid or expired state".
  const didRunRef = useRef(false);

  const palette = darkTheme
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
    if (didRunRef.current) return;
    didRunRef.current = true;

    (async () => {
      if (errParam) {
        setStatus('error');
        setMessage(errDescParam ?? errParam);
        return;
      }
      if (!code || !state) {
        setStatus('error');
        setMessage('Missing code or state in the callback URL.');
        return;
      }

      const result = await completeDecideIdVerification(code, state);
      if (result.ok) {
        setStatus('success');
        setMessage('Your DecideID proof of humanity is now linked to your Nuance profile.');
      } else {
        setStatus('error');
        setMessage(result.error);
      }
    })();
  }, [code, state, errParam, errDescParam, completeDecideIdVerification]);

  return (
    <>
      <Helmet>
        <title>Verifying — Nuance</title>
      </Helmet>
      <Header loggedIn={loggedIn} isArticlePage={false} ScreenWidth={ScreenWidth} />
      <div
        className='verify-email-screen'
        style={{ background: palette.screenBackground }}
      >
        <div
          className='verify-email-card'
          style={{
            background: palette.cardBackground,
            borderColor: palette.cardBorder,
          }}
        >
          {status === 'loading' && (
            <>
              <Loader />
              <p className='verify-email-title' style={{ color: palette.title }}>
                Confirming your DecideID verification…
              </p>
            </>
          )}
          {status === 'success' && (
            <>
              <h1 className='verify-email-title' style={{ color: palette.title }}>
                You're verified
              </h1>
              <p className='verify-email-body' style={{ color: palette.body }}>
                {message}
              </p>
              <Link
                to='/my-profile'
                className='verify-email-cta'
                style={{
                  background: palette.ctaBackground,
                  color: palette.ctaForeground,
                }}
              >
                Go to my profile
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className='verify-email-title' style={{ color: palette.title }}>
                Verification failed
              </h1>
              <p className='verify-email-body' style={{ color: palette.body }}>
                {message}
              </p>
              <Link
                to='/my-profile'
                className='verify-email-cta'
                style={{
                  background: palette.ctaBackground,
                  color: palette.ctaForeground,
                }}
              >
                Return to profile
              </Link>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DecideIdCallback;