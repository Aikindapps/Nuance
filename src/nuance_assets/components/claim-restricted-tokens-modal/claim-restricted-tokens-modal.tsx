import React, { useContext, useEffect, useState } from 'react';
import './_claim-restricted-tokens-modal.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { useTheme } from '../../contextes/ThemeContext';
import { IoCloseOutline } from 'react-icons/io5';
import { useAuthStore, usePostStore, useUserStore } from '../../store';
import { colors, icons, images } from '../../shared/constants';
import Button from '../../UI/Button/Button';
import { LuLoader2 } from 'react-icons/lu';

export const ClaimRestrictedTokensModal = () => {
  const modalContext = useContext(ModalContext);
  const darkTheme = useTheme();

  const { restrictedTokenBalance } = useAuthStore((state) => ({
    restrictedTokenBalance: state.restrictedTokenBalance,
  }));

  const { claimTokens, user } = useUserStore((state) => ({
    claimTokens: state.claimTokens,
    user: state.user,
  }));

  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  type ClaimModalPage = 'claim' | 'congrats';

  const [page, setPage] = useState<ClaimModalPage>('claim');

  const [allowedToRequest, setAllowedToRequest] = useState(0);

  const getAllowedToRequest = () => {
    return 50 - (restrictedTokenBalance / Math.pow(10, 8));
  };



  if (page === 'claim') {
    return (
      <div
        className='claim-restricted-tokens-modal'
        style={
          darkTheme ? { background: colors.darkModePrimaryBackgroundColor } : {}
        }
      >
        <IoCloseOutline
          onClick={() => {
            if (loading) {
              return;
            }
            modalContext?.closeModal();
          }}
          style={
            loading
              ? {
                cursor: 'not-allowed',
              }
              : {}
          }
          className='close-modal-icon'
        />
        <p
          style={
            darkTheme
              ? {
                color: colors.darkModePrimaryTextColor,
              }
              : {}
          }
          className='modal-title'
        >
          Free NUA refill request
        </p>
        <p
          style={
            darkTheme
              ? {
                color: colors.darkSecondaryTextColor,
              }
              : {}
          }
          className='information-text'
        >
          You are allowed to request free NUA up until a total of {getAllowedToRequest().toFixed(0)} Free NUA in
          your wallet. These Free NUA tokens first need to be ‘spent’ on the
          Nuance platform like applauding or membership access before you can
          trade them. They will be added to your wallet immediately.
        </p>
        <div className='token-amounts-and-terms-wrapper'>
          <div className='token-amounts-wrapper'>
            <div className='amount-item'>
              <div className='title'>Currently in your wallet</div>
              <div className='amount'>
                {(restrictedTokenBalance / Math.pow(10, 8)).toFixed(0)}
              </div>
              <div className='subtitle'>Free NUA</div>
            </div>
            <div className='token-amounts-divider' />
            <div className='amount-item'>
              <div className='title'>Allowed to request</div>
              <div className='amount'>
                {'+ ' + getAllowedToRequest().toFixed(0)}
              </div>
              <div className='subtitle'>Free NUA</div>
            </div>
          </div>
          <div
            className='terms-wrapper'
            onClick={() => {
              if (loading) {
                return;
              }
              setTermsAccepted(!termsAccepted);
            }}
          >
            <input
              type='checkbox'
              className='terms-checkbox'
              checked={termsAccepted}
              onChange={() => { }}
            />
            <p
              className='terms-text'
              style={
                darkTheme ? { color: colors.darkModePrimaryTextColor } : {}
              }
            >
              I understand I have to use these NUA tokens within the Nuance
              platform before they are ready for trade.
            </p>
          </div>
          <div className='buttons-wrapper'>
            <Button
              className={{
                dark: 'claim-restricted-tokens-modal-deposit-button',
                light: 'claim-restricted-tokens-modal-deposit-button',
              }}
              styleType={{ dark: 'white', light: 'white' }}
              type='button'
              onClick={() => {
                if (loading) {
                  return;
                }
                modalContext?.closeModal();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className={{
                dark: 'claim-restricted-tokens-modal-withdraw-button-dark',
                light: 'claim-restricted-tokens-modal-withdraw-button',
              }}
              styleType={{ dark: 'navy-dark', light: 'navy' }}
              disabled={!termsAccepted}
              style={{ minWidth: '170px' }}
              type='button'
              loading={loading}
              onClick={async () => {
                if (termsAccepted && !loading) {
                  setLoading(true);
                  setAllowedToRequest(getAllowedToRequest());
                  let response = await claimTokens();
                  setLoading(false);
                  //if successful, navigate to congrats page
                  if (response) {
                    setPage('congrats');
                  }
                }
              }}
            >
              Request Free NUA
            </Button>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div
        className='claim-restricted-tokens-modal'
        style={
          darkTheme ? { background: colors.darkModePrimaryBackgroundColor } : {}
        }
      >
        <IoCloseOutline
          onClick={() => {
            if (loading) {
              return;
            }
            modalContext?.closeModal();
          }}
          className='close-modal-icon'
        />
        <p
          style={
            darkTheme
              ? {
                color: colors.darkModePrimaryTextColor,
              }
              : {}
          }
          className='modal-title'
        >
          Thank you!
        </p>
        <p
          style={
            darkTheme
              ? {
                color: colors.darkSecondaryTextColor,
              }
              : {}
          }
          className='information-text'
        >
          We have transferred the equivalent of {allowedToRequest.toFixed(0)}{' '}
          NUA to applaud from your wallet to @{user?.handle}.
        </p>
        <div className='token-amounts-and-terms-wrapper'>
          <img className='congrats-image' src={icons.APPLAUD_ICON} />
          <div className='buttons-wrapper'>
            <Button
              className={{
                dark: 'claim-restricted-tokens-modal-deposit-button',
                light: 'claim-restricted-tokens-modal-deposit-button',
              }}
              styleType={{ dark: 'white', light: 'white' }}
              type='button'
              onClick={() => {
                modalContext?.closeModal();
              }}
            >
              Ok, close
            </Button>
            <Button
              className={{
                dark: 'claim-restricted-tokens-modal-withdraw-button-dark',
                light: 'claim-restricted-tokens-modal-withdraw-button',
              }}
              styleType={{ dark: 'navy-dark', light: 'navy' }}
              type='button'
              onClick={() => {
                modalContext?.closeModal();
              }}
            >
              Go to wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }
};
