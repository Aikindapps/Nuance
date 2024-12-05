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
import {
  requestVerifiablePresentation,
  VerifiablePresentationResponse,
} from '@dfinity/verifiable-credentials/request-verifiable-presentation';

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
          // open custom link-ii-modal
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
      // handle error appropriately
    }
  };

  /* const proceedWithVerification = async (verifyPrincipal: Principal) => {
    try {
      const jwt: string = await new Promise((resolve, reject) => {
        requestVerifiablePresentation({
          onSuccess: async (verifiablePresentation: VerifiablePresentationResponse) => {
            if ('Ok' in verifiablePresentation) {
              resolve(verifiablePresentation.Ok);
            } else {
              reject(new Error(verifiablePresentation.Err));
            }
          },
          onError(err) {
            reject(new Error(err));
          },
          issuerData: {
            origin: 'https://a4tbr-q4aaa-aaaaa-qaafq-cai.localhost:5173/',
            canisterId: Principal.fromText('a4tbr-q4aaa-aaaaa-qaafq-cai'),
          },
          credentialData: {
            credentialSpec: {
              credentialType: 'VerifiedEmployee',
              arguments: {
                employerName: "DFINITY Foundation"
              },
            },
            credentialSubject: verifyPrincipal,
          },
          identityProvider: new URL('http://qhbym-qaaaa-aaaaa-aaafq-cai.localhost:8080/'),
          derivationOrigin: window.location.origin,
        });
      });

      console.log("JWT: ", jwt);

      // verify the JWT credentials
      await verifyPoh(jwt);

    } catch (error) {
      console.error('Error during PoH verification:', error);
      // handle error appropriately
    }
  }; */

  const [loading, setLoading] = useState(false);

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
        To be able claim your free NUA tokens, you need to verify your profile
        first. Please ensure that you have verified your unique personhood via
        the
        <a
          href='https://decideai.xyz/'
          target='_blank'
          rel='noopener noreferrer'
        >
          DecideAI website
        </a>
        before proceeding. If you have not done so, please follow these steps:
        <ol>
          <li>
            Go to the
            <a
              href='https://decideai.com'
              target='_blank'
              rel='noopener noreferrer'
            >
              DecideAI website
            </a>
            .
          </li>
          <li>
            Sign in using the same Internet Identity that you use to access this
            app.
          </li>
          <li>
            Follow the instructions on the DecideAI platform to complete the
            verification process.
          </li>
          <li>
            Once verified, return to this page and confirm below to proceed.
          </li>
        </ol>
      </p>
      <div className='token-amounts-and-terms-wrapper'>
        <div
          className='terms-wrapper'
          onClick={() => {
            if (loading) {
              return;
            }
          }}
        ></div>
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
