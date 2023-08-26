import React, { useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../../store';
import Button from '../../UI/Button/Button';
import { colors, images } from '../../shared/constants';
import { useTheme } from '../../ThemeContext';
import { Context } from '../../Context';

type LoggedOutProps = {
  responsiveElement: Boolean;
};

const LoggedOutSidebar: React.FC<LoggedOutProps> = (props): JSX.Element => {
  //redirecting to register pages is handled in the HomeGrid component.
  const login = useAuthStore((state) => state.login);
  const context = useContext(Context)
  const loginInternal = (loginMethod: string) => {
    if(context.showModal){
      context.setModal();
    }
    login(loginMethod)
  };

  const darkTheme = useTheme();

  let nameOfClass;
  {
    props.responsiveElement
      ? (nameOfClass = 'logged-out-responsive')
      : (nameOfClass = 'logged-out');
  }

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
    <div className='wrapper'>
      <div className={nameOfClass}>
        <img
          className={isArticleScreen || context.showModal ? 'hide' : ''}
          src={images.NUANCE_LOGO_BLUE_TEXT}
          style={{
            filter: darkOptionsAndColors.filter,
          }}
        />
        <h1 className={isArticleScreen || context.showModal ? 'hide' : ''}>
          Blogging to the people!
        </h1>
        {props.responsiveElement ? (
          <>
            <p
              style={{
                color: darkOptionsAndColors.color,
              }}
              className={isArticleScreen || context.showModal ? 'hide' : ''}
            >
              Nuance is the world's first blogging platform built entirely on
              blockchain.
            </p>
            <p
              style={{ color: darkOptionsAndColors.color }}
              className={isArticleScreen || context.showModal ? 'hide' : ''}
            >
              Built on, and for, the new Web.
            </p>
          </>
        ) : (
          <div className={isArticleScreen || context.showModal ? 'hide' : ''}>
            <p style={{ color: darkOptionsAndColors.color }}>
              Nuance is the world's first blogging platform built entirely on
              blockchain.
            </p>
            <p style={{ color: darkOptionsAndColors.color }}>
              Built on, and for, the new Web.
            </p>
          </div>
        )}

        <div className='buttons'>
          <div className='button'>
            <Button
              styleType='primary-1'
              type='button'
              style={
                darkTheme
                  ? { background: colors.accentColor, width: '265px' }
                  : { width: '265px' }
              }
              // icon={NONAME}
              onClick={() => loginInternal('ii')}
            >
              Log in with Internet Identity
            </Button>
          </div>
          <div className='button'>
            <Button
              styleType='primary-1'
              type='button'
              style={
                darkTheme
                  ? { background: colors.accentColor, width: '265px' }
                  : { width: '265px' }
              }
              // icon={NONAME}
              onClick={() => loginInternal('NFID')}
            >
              Log in with NFID
            </Button>
          </div>
          <div className='button'>
            <Button
              styleType='primary-1'
              type='button'
              style={
                darkTheme
                  ? { background: colors.accentColor, width: '265px' }
                  : { width: '265px' }
              }
              // icon={NONAME}
              onClick={() => loginInternal('stoic')}
            >
              Log in with Stoic
            </Button>
          </div>

          <div className='button'>
            <Button
              styleType='primary-1'
              type='button'
              style={
                darkTheme
                  ? { background: colors.accentColor, width: '265px' }
                  : { width: '265px' }
              }
              // icon={NONAME}
              onClick={() => loginInternal('bitfinity')}
            >
              Log in with Bitfinity
            </Button>
          </div>

          {props.responsiveElement ? (
            <a>
              <p style={{ color: darkOptionsAndColors.color }}>
                Learn about Nuance
              </p>
            </a>
          ) : (
            <p
              className='identity'
              style={{ color: darkOptionsAndColors.color }}
            >
              <a
                href='https://smartcontracts.org/docs/ic-identity-guide/what-is-ic-identity.html'
                target='_blank'
                style={{ color: darkOptionsAndColors.color }}
              >
                What is internet identity?
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoggedOutSidebar;
