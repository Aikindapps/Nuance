import React, { useContext, useEffect, useState } from 'react';
import { validate as validateEmail } from 'email-validator';
import Button from '../../UI/Button/Button';
import InputField2 from '../../UI/InputField2/InputField2';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { useTheme } from '../../contextes/ThemeContext';
import { colors } from '../../shared/constants';
import {
  subscribeToAuthorByEmail,
  subscribeToPublicationByEmail,
} from '../../services/emailSubscriptionService';
import { useAuthStore } from '../../store';
import './_email-subscribe-modal.scss';

// Three-state modal:
//   1. "input"   — email field + submit
//   2. "sent"    — "check your inbox" success screen
//   3. "error"   — user-facing error from the backend
//
// We keep this state local — no global store — because the flow is
// single-use per author-page visit.
type Stage = 'input' | 'sent' | 'error';

const EmailSubscribeModal: React.FC = () => {
  const modalContext = useContext(ModalContext);
  const darkTheme = useTheme();
  const agent = useAuthStore((s) => s.agent);

  const authorHandle =
    modalContext?.modalData?.emailSubscribeAuthorHandle ?? '';
  const authorDisplayName =
    modalContext?.modalData?.emailSubscribeAuthorDisplayName || authorHandle;
  const publicationCanisterId =
    modalContext?.modalData?.emailSubscribePublicationCanisterId ?? '';
  const isPublicationTarget = publicationCanisterId.length > 0;

  const modalTheme = darkTheme ? 'dark' : 'light';
  const modalPalette = darkTheme
    ? {
        background: colors.darkModePrimaryBackgroundColor,
        text: colors.darkModePrimaryTextColor,
        muted: colors.darkSecondaryTextColor,
        border: colors.darkModeDarkerBorderColor,
      }
    : {
        background: colors.primaryBackgroundColor,
        text: colors.primaryTextColor,
        muted: colors.tagTextColor,
        border: colors.darkerBorderColor,
      };

  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<Stage>('input');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showEmailError, setShowEmailError] = useState(false);

  useEffect(() => {
    if (!email) setShowEmailError(false);
  }, [email]);

  const handleClose = () => modalContext?.closeModal();

  const handleSubmit = async () => {
    if (!validateEmail(email)) {
      setShowEmailError(true);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = isPublicationTarget
        ? await subscribeToPublicationByEmail(
            publicationCanisterId,
            authorHandle,
            authorDisplayName,
            email,
            agent ?? undefined
          )
        : await subscribeToAuthorByEmail(
            authorHandle,
            email,
            agent ?? undefined
          );
      if (res.err) {
        setErrorMsg(res.err);
        setStage('error');
      } else {
        setStage('sent');
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Something went wrong. Please try again.');
      setStage('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        darkTheme ? 'email-subscribe-modal dark' : 'email-subscribe-modal light'
      }
      style={{ background: 'rgba(0, 0, 0, 0.45)' }}
    >
      <div
        className='email-subscribe-modal-content'
        style={{
          background: modalPalette.background,
          color: modalPalette.text,
          borderColor: modalPalette.border,
        }}
      >
        <button
          className='email-subscribe-modal-close'
          onClick={handleClose}
          aria-label='Close'
          style={{ color: modalPalette.muted }}
        >
          <span aria-hidden='true'>&times;</span>
        </button>

        {stage === 'input' && (
          <>
            <h2
              className='email-subscribe-modal-title'
              style={{ color: modalPalette.text }}
            >
              Subscribe to {authorDisplayName}
            </h2>
            <p className='email-subscribe-modal-subtitle'>
              Enter your email to get a new message every time{' '}
              {authorDisplayName} publishes on Nuance. We'll send you a
              confirmation link — you're only subscribed once you click it.
            </p>

            <label
              className='email-subscribe-modal-label'
              style={{ color: modalPalette.muted }}
            >
              Email address
            </label>
            <InputField2
              classname='email-subscribe-modal-input'
              width='100%'
              height='24px'
              defaultText='you@domain.com'
              fontSize='16px'
              fontFamily='Roboto'
              theme={modalTheme}
              fontColor={modalPalette.text}
              borderColor={modalPalette.border}
              hasError={showEmailError}
              value={email}
              onChange={(v: string) => setEmail(v)}
            />
            {showEmailError && (
              <p
                className='email-subscribe-modal-error-inline'
                style={{ color: colors.errorColor }}
              >
                Please enter a valid email address.
              </p>
            )}

            <div className='email-subscribe-modal-actions'>
              <Button
                type='button'
                styleType={{ dark: 'white', light: 'white' }}
                style={{ width: '120px' }}
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type='button'
                styleType={{ dark: 'navy-dark', light: 'navy' }}
                style={{ width: '160px' }}
                onClick={handleSubmit}
                disabled={loading}
                loading={loading}
              >
                Send verification
              </Button>
            </div>
          </>
        )}

        {stage === 'sent' && (
          <>
            <h2 className='email-subscribe-modal-title'>Check your inbox</h2>
            <p className='email-subscribe-modal-subtitle'>
              We just sent a verification link to <strong>{email}</strong>.
              Click it to confirm — the link is valid for 24 hours.
            </p>
            <div className='email-subscribe-modal-actions single'>
              <Button
                type='button'
                styleType={{ dark: 'navy-dark', light: 'navy' }}
                style={{ width: '160px' }}
                onClick={handleClose}
              >
                Got it
              </Button>
            </div>
          </>
        )}

        {stage === 'error' && (
          <>
            <h2 className='email-subscribe-modal-title'>
              Couldn't send a confirmation link
            </h2>
            <p className='email-subscribe-modal-subtitle'>{errorMsg}</p>
            <div className='email-subscribe-modal-actions'>
              <Button
                type='button'
                styleType={{ dark: 'white', light: 'white' }}
                style={{ width: '120px' }}
                onClick={handleClose}
              >
                Close
              </Button>
              <Button
                type='button'
                styleType={{ dark: 'navy-dark', light: 'navy' }}
                style={{ width: '120px' }}
                onClick={() => {
                  setErrorMsg('');
                  setStage('input');
                }}
              >
                Try again
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailSubscribeModal;
