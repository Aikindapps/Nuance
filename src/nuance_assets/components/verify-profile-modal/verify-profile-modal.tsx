import React, { useContext, useState } from 'react';
import './_verify-profile-modal.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { useTheme } from '../../contextes/ThemeContext';
import { IoCloseOutline } from 'react-icons/io5';
import { useUserStore } from '../../store';
import { colors } from '../../shared/constants';
import Button from '../../UI/Button/Button';

export const VerifyProfileModal = () => {
  const modalContext = useContext(ModalContext);
  const darkTheme = useTheme();

  const startDecideIdVerification = useUserStore(
    (state) => state.startDecideIdVerification,
  );

  // Kicks off the DecideID OIDC flow. The store function redirects the
  // browser to id.decideai.xyz and never returns, so any code after
  // this call only runs if the redirect failed to start.
  const verifyUserHumanity = async () => {
    try {
      await startDecideIdVerification();
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
              href='https://id.decideai.xyz/'
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
