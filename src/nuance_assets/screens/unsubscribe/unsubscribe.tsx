import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';
import Loader from '../../UI/loader/Loader';
import { useTheme } from '../../contextes/ThemeContext';
import { colors } from '../../shared/constants';
import { unsubscribeEmailByToken } from '../../services/emailSubscriptionService';
import { useAuthStore } from '../../store';
import './_unsubscribe.scss';

type Status = 'loading' | 'success' | 'error';

const Unsubscribe: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const agent = useAuthStore((s) => s.agent);
  const darkTheme = useTheme();
  const loggedIn = Boolean(agent);
  const ScreenWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  // StrictMode double-invokes effects in dev; the second call would see
  // "Invalid token" after the first consumed it.
  const didCallRef = useRef(false);

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
    if (didCallRef.current) return;
    didCallRef.current = true;
    (async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing unsubscribe token.');
        return;
      }
      if (!email) {
        setStatus('error');
        setMessage('Missing email address in unsubscribe link.');
        return;
      }
      try {
        const res = await unsubscribeEmailByToken(token, email, agent ?? undefined);
        if (res.ok) {
          setStatus('success');
          setMessage(res.ok);
        } else {
          setStatus('error');
          setMessage(res.err ?? 'Unsubscribe failed.');
        }
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message ?? 'Unsubscribe failed.');
      }
    })();
  }, [token, email, agent]);

  return (
    <>
      <Helmet>
        <title>Unsubscribe — Nuance</title>
      </Helmet>
      <Header loggedIn={loggedIn} isArticlePage={false} ScreenWidth={ScreenWidth} />
      <div
        className='unsubscribe-screen'
        style={{ background: themePalette.screenBackground }}
      >
        <div
          className='unsubscribe-card'
          style={{
            background: themePalette.cardBackground,
            borderColor: themePalette.cardBorder,
          }}
        >
          {status === 'loading' && (
            <>
              <Loader />
              <p className='unsubscribe-title' style={{ color: themePalette.title }}>
                Unsubscribing…
              </p>
            </>
          )}
          {status === 'success' && (
            <>
              <h1 className='unsubscribe-title' style={{ color: themePalette.title }}>
                You're unsubscribed
              </h1>
              <p className='unsubscribe-body' style={{ color: themePalette.body }}>
                {message}
              </p>
              <Link
                to='/'
                className='unsubscribe-cta'
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
              <h1 className='unsubscribe-title' style={{ color: themePalette.title }}>
                Unsubscribe failed
              </h1>
              <p className='unsubscribe-body' style={{ color: themePalette.body }}>
                {message}
              </p>
              <Link
                to='/'
                className='unsubscribe-cta'
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

export default Unsubscribe;