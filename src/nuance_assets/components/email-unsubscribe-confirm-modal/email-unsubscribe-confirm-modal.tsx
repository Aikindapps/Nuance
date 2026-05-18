import React, { useContext, useState } from 'react';
import Button from '../../UI/Button/Button';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { useTheme } from '../../contextes/ThemeContext';
import { colors } from '../../shared/constants';
import { unsubscribeEmailByCaller } from '../../services/emailSubscriptionService';
import { useAuthStore } from '../../store';
import '../email-subscribe-modal/_email-subscribe-modal.scss';

type Stage = 'confirm' | 'done' | 'error';

const EmailUnsubscribeConfirmModal: React.FC = () => {
  const modalContext = useContext(ModalContext);
  const darkTheme = useTheme();
  const agent = useAuthStore((s) => s.agent);

  const authorHandle =
    modalContext?.modalData?.emailUnsubscribeAuthorHandle ?? '';
  const authorDisplayName =
    modalContext?.modalData?.emailUnsubscribeAuthorDisplayName || authorHandle;
  const publicationCanisterId =
    modalContext?.modalData?.emailUnsubscribePublicationCanisterId;
  const onConfirm = modalContext?.modalData?.emailUnsubscribeOnConfirm;

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

  const [stage, setStage] = useState<Stage>('confirm');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleClose = () => modalContext?.closeModal();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await unsubscribeEmailByCaller(
        authorHandle,
        publicationCanisterId,
        agent ?? undefined
      );
      if (res.err) {
        setErrorMsg(res.err);
        setStage('error');
      } else {
        onConfirm?.();
        setStage('done');
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

        {stage === 'confirm' && (
          <>
            <h2
              className='email-subscribe-modal-title'
              style={{ color: modalPalette.text }}
            >
              Unsubscribe from {authorDisplayName}?
            </h2>
            <p className='email-subscribe-modal-subtitle'>
              You will stop receiving email notifications when{' '}
              {authorDisplayName} publishes new articles on Nuance.
            </p>
            <div className='email-subscribe-modal-actions'>
              <Button
                type='button'
                styleType={{ dark: 'white', light: 'white' }}
                style={{ width: '120px' }}
                onClick={handleClose}
                disabled={loading}
              >
                Keep subscribed
              </Button>
              <Button
                type='button'
                styleType={{ dark: 'navy-dark', light: 'navy' }}
                style={{ width: '140px' }}
                onClick={handleConfirm}
                disabled={loading}
                loading={loading}
              >
                Unsubscribe
              </Button>
            </div>
          </>
        )}

        {stage === 'done' && (
          <>
            <h2 className='email-subscribe-modal-title'>Unsubscribed</h2>
            <p className='email-subscribe-modal-subtitle'>
              You will no longer receive email notifications from{' '}
              {authorDisplayName}.
            </p>
            <div className='email-subscribe-modal-actions single'>
              <Button
                type='button'
                styleType={{ dark: 'navy-dark', light: 'navy' }}
                style={{ width: '120px' }}
                onClick={handleClose}
              >
                Done
              </Button>
            </div>
          </>
        )}

        {stage === 'error' && (
          <>
            <h2 className='email-subscribe-modal-title'>
              Could not unsubscribe
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
                  setStage('confirm');
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

export default EmailUnsubscribeConfirmModal;