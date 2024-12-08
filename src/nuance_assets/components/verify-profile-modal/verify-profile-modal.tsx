import React, { useContext, useEffect, useState } from 'react';
import './_verify-profile-modal.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { useTheme } from '../../contextes/ThemeContext';
import { IoCloseOutline } from 'react-icons/io5';
import { useAuthStore, usePostStore, useUserStore } from '../../store';
import { colors, icons, images } from '../../shared/constants';
import Button from '../../UI/Button/Button';
import { LuLoader2 } from 'react-icons/lu';
import { Principal } from '@dfinity/principal';

export const VerifyProfileModal = () => {
  const modalContext = useContext(ModalContext);
  const darkTheme = useTheme();

  const { user, getLinkedPrincipal, verifyPoh, proceedWithVerification } =
    useUserStore((state) => ({
      user: state.user,
      getLinkedPrincipal: state.getLinkedPrincipal,
      verifyPoh: state.verifyPoh,
      proceedWithVerification: state.proceedWithVerification,
    }));

  const { loginMethod, getUserWallet } = useAuthStore((state) => ({
    loginMethod: state.loginMethod,
    getUserWallet: state.getUserWallet,
  }));

  const verifyUserHumanity = async () => {
    try {
      const userWallet = getUserWallet();

      const currentLoginMethod = loginMethod;
      let principalToUse: Principal;

      if (currentLoginMethod === 'ii') {
        // user is logged in via II
        principalToUse = Principal.fromText((await userWallet).principal);
        await proceedWithVerification(principalToUse);
      } else {
        // user is not logged in via II
        // check if they have linked II principal
        const linkedPrincipalResult = await getLinkedPrincipal(
          (
            await userWallet
          ).principal
        );

        if (linkedPrincipalResult === undefined) {
          // no linked II principal
          // open link ii
          modalContext?.openModal('link ii');
          return;
        } else {
          // user has linked II principal
          principalToUse = Principal.fromText(linkedPrincipalResult);
          await proceedWithVerification(principalToUse);
        }
      }
    } catch (error) {
      console.error('Error during PoH verification:', error);
    }
  };

  const [loading, setLoading] = useState(false);

  return (
    <div
      className='verify-profile-modal'
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
        Verify Profile
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
        Please ensure that you have verified your unique personhood via
        <a
          href='https://decideai.xyz/'
          target='_blank'
          rel='noopener noreferrer'
        >
          DecideAI
        </a>
        before proceeding. If you have not done so, please follow these steps:
        <ol>
          <li>
            Go to
            <a
              href='https://decideai.com'
              target='_blank'
              rel='noopener noreferrer'
            >
              DecideAI.
            </a>
          </li>
          <li>
            Sign in using the same Internet Identity that you use to access
            Nuance.
            <p
              style={
                darkTheme
                  ? {
                      color: colors.darkSecondaryTextColor,
                    }
                  : {}
              }
              className='note-text'
            >
              Note: If you are not logged in via Internet Identity and have
              linked an Internet Identity to your Nuance account, please sign in
              with the linked Internet Identity.
            </p>
          </li>
          <li>
            Follow the instructions on the DecideAI platform to complete the
            verification process.
          </li>
          <li>Once verified, return to this page and proceed.</li>
        </ol>
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
        You can claim your Free NUA tokens after you have verified yourself.
      </p>
      <div className='verify-profile-wrapper'>
        <div
          className='verify-wrapper'
          onClick={() => {
            if (loading) {
              return;
            }
          }}
        ></div>
        <div className='buttons-wrapper'>
          <Button
            className={{
              dark: 'verify-profile-modal-cancel-button',
              light: 'verify-profile-modal-cancel-button',
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
              dark: 'verify-profile-modal-ok-button-dark',
              light: 'verify-profile-modal-ok-button',
            }}
            styleType={{ dark: 'navy-dark', light: 'navy' }}
            type='button'
            loading={loading}
            onClick={() => {
              setLoading(true);
              verifyUserHumanity();
              setLoading(false);
              if (!loading) {
                modalContext?.closeModal();
              }
            }}
          >
            Verify Profile
          </Button>
        </div>
      </div>
    </div>
  );
};
