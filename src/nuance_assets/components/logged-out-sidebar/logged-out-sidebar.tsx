import React, { useContext, useEffect, useState } from 'react';
import { useAuthStore, useUserStore } from '../../store';
import Button from '../../UI/Button/Button';
import { colors, images } from '../../shared/constants';
import { useTheme } from '../../contextes/ThemeContext';
import { Context } from '../../contextes/Context';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { useAuth, useIsInitializing } from '@nfid/identitykit/react';
import { authChannel } from '../../store/authStore';
import { InternetIdentity, NFIDW, Plug, MockedSigner } from '@nfid/identitykit';
import { Usergeek } from 'usergeek-ic-js';
import { isMobile } from 'react-device-detect';
import { toastError } from '../../services/toastService';
type LoggedOutSidebarProps = {
  style?: any;
};
const LoggedOutSidebar: React.FC<LoggedOutSidebarProps> = (
  props
): JSX.Element => {
  //redirecting to register pages is handled in the HomeGrid component.
  const {
    agent,
    identity,
    isLoggedIn,
    isInitialized,
    getUserWallet,
    fetchTokenBalances,
  } = useAuthStore((state) => ({
    agent: state.agent,
    identity: state.identity,
    isLoggedIn: state.isLoggedIn,
    isInitialized: state.isInitialized,
    getUserWallet: state.getUserWallet,
    fetchTokenBalances: state.fetchTokenBalances,
  }));
  const context = useContext(Context);
  const modalContext = useContext(ModalContext);

  const isLocal: boolean =
    window.location.origin.includes('localhost') ||
    window.location.origin.includes('127.0.0.1');

  const isInitializing = useIsInitializing();
  const { connect } = useAuth();

  const darkTheme = useTheme();

  const [isArticleScreen, setIsArticleScreen] = useState(true);

  const connectFunction = (id: string) => {
    if (isInitializing) {
      return;
    }
    connect(id);
    authChannel.postMessage({ type: 'login', date: new Date() });
    modalContext?.closeModal();
  };

  useEffect(() => {
    if (
      window.location.pathname == '/' ||
      window.location.pathname == '/register'
    )
      setIsArticleScreen(false);
    else setIsArticleScreen(true);
  }, [window.location.pathname]);

  useEffect(() => {
    const executeFetchTokenBalances = async () => {
      if (!agent && !isLoggedIn && !isInitializing) {
        return;
      }
      // we know the user is connected
      if (agent && !isInitializing) {
        const loggedUser = await useUserStore.getState().getUser(agent);

        if (loggedUser === undefined && !isInitialized && !isInitializing) {
          useAuthStore.setState({ isInitialized: true });
          window.location.href = '/register';
        } else {
          //user fetched successfully, get the token balances
          await getUserWallet();
          await fetchTokenBalances();
        }
      }

      // track session with usergeek
      Usergeek.setPrincipal(identity?.getPrincipal());
      Usergeek.trackSession();
      Usergeek.flush();
    };

    executeFetchTokenBalances();
  }, [agent, isInitializing]);

  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.primaryTextColor
      : colors.primaryBackgroundColor,
    color: darkTheme ? colors.primaryBackgroundColor : colors.primaryTextColor,
    filter: darkTheme
      ? `drop-shadow(1px 1px 40px ${colors.darkModeAccentColor} ) drop-shadow(1px 1px 40px ${colors.primaryBackgroundColor} )`
      : 'none',
    secondaryButtonColor: darkTheme
      ? colors.darkModeSecondaryButtonColor
      : colors.accentColor,
  };

  return (
    <div className={'logged-out-sidebar-wrapper'} style={props.style}>
      {!(isArticleScreen || modalContext?.isModalOpen) && (
        <div className='logged-out-sidebar-nuance-info'>
          <img
            className='nuance-logo-blue'
            src={
              darkTheme
                ? images.NUANCE_LOGO_BLUE_TEXT
                : images.NUANCE_LOGO_BLACK_TEXT
            }
            style={{
              filter: darkOptionsAndColors.filter,
            }}
          />
          <h1 className='blogging-to-the-people-light'>
            Blogging to the people!
          </h1>
          <p style={{ color: darkOptionsAndColors.color }}>
            Nuance is the world's first blogging platform built entirely on
            blockchain.
          </p>
          <p style={{ color: darkOptionsAndColors.color }}>
            Built on, and for, the new Web.
          </p>
          <div></div>
        </div>
      )}

      <div className='logged-out-sidebar-buttons'>
        <div className='logged-out-sidebar-button'>
          <Button
            className={{ dark: 'logged-out-navy-button-dark', light: '' }}
            styleType={{ dark: 'navy-dark', light: 'navy' }}
            type='button'
            style={{ width: '100%' }}
            //icon={InternetIdentity.icon}
            onClick={() => {
              connectFunction(InternetIdentity.id);
              useAuthStore.setState({ loginMethod: 'ii' });
            }}
          >
            Log in with Internet Identity
          </Button>
        </div>
        <div className='logged-out-sidebar-button'>
          <Button
            className={{ dark: 'logged-out-navy-button-dark', light: '' }}
            styleType={{ dark: 'navy-dark', light: 'navy' }}
            type='button'
            style={{ width: '100%' }}
            //icon={NFIDW.icon}
            onClick={() => {
              if (!isLocal) {
                connectFunction(NFIDW.id);
                useAuthStore.setState({ loginMethod: 'NFID' });
              } else {
                connectFunction(MockedSigner.id);
                useAuthStore.setState({ loginMethod: 'mocked' });
              }
            }}
          >
            Log in with {isLocal ? 'Mocked Signer' : 'NFID'}
          </Button>
        </div>

        <div className='logged-out-sidebar-button'>
          <Button
            className={{ dark: 'logged-out-navy-button-dark', light: '' }}
            styleType={{ dark: 'navy-dark', light: 'navy' }}
            type='button'
            style={{ width: '100%' }}
            //icon={Plug.icon}
            onClick={() => {
              if (!isMobile) {
                connectFunction(Plug.id);
                useAuthStore.setState({ loginMethod: 'plug' });
              } else {
                toastError(
                  'Plug login is not available on mobile devices. Please use a desktop browser or another login method.'
                );
              }
            }}
          >
            Log in with Plug
          </Button>
        </div>

        <a
          className='logged-out-sidebar-identity'
          href='https://internetcomputer.org/internet-identity'
          target='_blank'
          style={darkTheme ? { color: 'white' } : {}}
        >
          What is internet identity?
        </a>
      </div>
    </div>
  );
};

export default LoggedOutSidebar;
