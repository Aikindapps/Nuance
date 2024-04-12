import React, { useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../../store';
import Button from '../../UI/Button/Button';
import { colors, images } from '../../shared/constants';
import { useTheme } from '../../contextes/ThemeContext';
import { Context } from '../../contextes/Context';
import { Context as ModalContext } from '../../contextes/ModalContext';
type LoggedOutSidebarProps = {
  style?: any;
};
const LoggedOutSidebar: React.FC<LoggedOutSidebarProps> = (
  props
): JSX.Element => {
  //redirecting to register pages is handled in the HomeGrid component.
  const login = useAuthStore((state) => state.login);
  const context = useContext(Context);
  const modalContext = useContext(ModalContext);
  const loginInternal = (loginMethod: string) => {
    modalContext?.closeModal();
    login(loginMethod);
  };

  const darkTheme = useTheme();

  const [isArticleScreen, setIsArticleScreen] = useState(true);

  useEffect(() => {
    if (
      window.location.pathname == '/' ||
      window.location.pathname == '/register'
    )
      setIsArticleScreen(false);
    else setIsArticleScreen(true);
  }, [window.location.pathname]);

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
            src={images.NUANCE_LOGO_BLUE_TEXT}
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
            styleType='primary-1'
            type='button'
            style={
              darkTheme
                ? { background: colors.accentColor, width: '100%' }
                : { width: '100%' }
            }
            // icon={NONAME}
            onClick={() => loginInternal('ii')}
          >
            Log in with Internet Identity
          </Button>
        </div>
        <div className='logged-out-sidebar-button'>
          <Button
            styleType='primary-1'
            type='button'
            style={
              darkTheme
                ? { background: colors.accentColor, width: '100%' }
                : { width: '100%' }
            }
            // icon={NONAME}
            onClick={() => loginInternal('NFID')}
          >
            Log in with NFID
          </Button>
        </div>
        <div className='logged-out-sidebar-button'>
          <Button
            styleType='primary-1'
            type='button'
            style={
              darkTheme
                ? { background: colors.accentColor, width: '100%' }
                : { width: '100%' }
            }
            // icon={NONAME}
            onClick={() => loginInternal('stoic')}
          >
            Log in with Stoic
          </Button>
        </div>

        <div className='logged-out-sidebar-button'>
          <Button
            styleType='primary-1'
            type='button'
            style={
              darkTheme
                ? { background: colors.accentColor, width: '100%' }
                : { width: '100%' }
            }
            // icon={NONAME}
            onClick={() => loginInternal('bitfinity')}
          >
            Log in with Bitfinity
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
