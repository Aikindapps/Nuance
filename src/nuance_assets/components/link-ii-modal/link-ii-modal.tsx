import React, { useContext, useEffect, useState } from 'react';
import './_link-ii-modal.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { useTheme } from '../../contextes/ThemeContext';
import { IoCloseOutline } from 'react-icons/io5';
import { useAuthStore, usePostStore, useUserStore } from '../../store';
import { colors, icons, images } from '../../shared/constants';
import Button from '../../UI/Button/Button';
import { LuLoader2 } from 'react-icons/lu';
import { toastError } from '../../services/toastService';

export const LinkIIModal = () => {
  const modalContext = useContext(ModalContext);
  const darkTheme = useTheme();

  const { user, proceedWithVerification } = useUserStore((state) => ({
    user: state.user,
    proceedWithVerification: state.proceedWithVerification,
  }));

  const { requestLinkInternetIdentity } = useAuthStore((state) => ({
    requestLinkInternetIdentity: state.requestLinkInternetIdentity
  }));

  const handleProceed = async () => {
    // start the linking process
    const iiPrincipal = await requestLinkInternetIdentity();

    if (!iiPrincipal) {
      toastError('Verification requires linking Internet Identity.');
      return;
    }

    // proceed with verification
    await proceedWithVerification(iiPrincipal);
  };

  const [loading, setLoading] = useState(false);

  return (
    <div
      className='link-ii-modal'
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
        Link Internet Identity
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
        You must link your Internet Identity to your Nuance account to confirm
        your unique identity. If you registered using another method, you will
        need to create and link an Internet Identity to your Nuance account
        before proceeding.
      </p>
      <div className='link-ii-wrapper'>
        <div
          className='link-wrapper'
          onClick={() => {
            if (loading) {
              return;
            }
          }}
        ></div>
        <div className='buttons-wrapper'>
          <Button
            className={{
              dark: 'link-ii-cancel-button',
              light: 'link-ii-cancel-button',
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
              dark: 'link-ii-link-button-dark',
              light: 'link-ii-link-button',
            }}
            styleType={{ dark: 'navy-dark', light: 'navy' }}
            type='button'
            loading={loading}
            onClick={() => {
              setLoading(true);
              handleProceed();
              setLoading(false);
              if (!loading) {
                modalContext?.closeModal();
              }
            }}
          >
            Link Internet Identity
          </Button>
        </div>
      </div>
    </div>
  );
};
