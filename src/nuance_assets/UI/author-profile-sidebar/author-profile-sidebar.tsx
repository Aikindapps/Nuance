import React, { useState } from 'react';
import { useAuthStore, useUserStore } from '../../store';
import Button from '../Button/Button';
import CopyProfile from '../copy-profile/copy-profile';
import ReportAuthorMenu from '../report-author/report-author';
import { icons, colors } from '../../shared/constants';
import { useTheme } from '../../ThemeContext';

const AuthorProfileSidebar = () => {
  const { isLoggedIn, login, logout } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    login: state.login,
    logout: state.logout,
  }));
  const [shown, setShown] = useState(false);
  const [shownMeatball, setShownMeatball] = useState(false);
  const [copyProfile, setCopyProfile] = useState(false);

  const author = useUserStore((state) => state.author);
  const CloseMenu = () => {
    setShown(false);
  };

  const ToggleMenu = () => {
    setShown(!shown);
  };

  const dark = useTheme();
  const darkOptionsAndColors = {
    background: dark ? colors.primaryTextColor : colors.primaryBackgroundColor,
    color: dark ? colors.primaryBackgroundColor : colors.primaryTextColor,
    threeDots: dark ? icons.THREE_DOTS_WHITE : icons.THREE_DOTS,
  };

  return (
    <div className='author-profile-sidebar '>
      <img
        className='sidebar-button'
        onClick={ToggleMenu}
        src={shown ? icons.THREE_DOTS_BLUE : darkOptionsAndColors.threeDots}
        alt='sidebar-button'
      />
      {
        <div
          className='sidebar-content'
          onMouseLeave={CloseMenu}
          style={shown ? { width: 210 } : { width: 0 }}
        >
          <div className='buttons' style={shown ? {} : { display: 'none' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <CopyProfile
                shown={copyProfile}
                setShown={setCopyProfile}
                handle={author?.handle}
                dark={dark}
              />
              <ReportAuthorMenu
                shown={shownMeatball}
                setShown={setShownMeatball}
                isPublication={false}
                dark={dark}
              />
            </div>

            <div
              className='horizontal-divider'
              style={isLoggedIn ? {} : { display: 'none' }}
            ></div>

            <div
              className='button'
              style={isLoggedIn ? { display: 'none' } : {}}
            >
              <Button
                styleType='primary-1'
                type='button'
                style={{ width: '190px' }}
                // icon={NONAME}
                onClick={() => login('ii')}
              >
                Log in with Internet Identity
              </Button>
            </div>
            <div
              className='button'
              style={isLoggedIn ? { display: 'none' } : {}}
            >
              <Button
                styleType='primary-3'
                type='button'
                style={{ width: '190px' }}
                // icon={NONAME}
                onClick={() => login('ii')}
              >
                Register with Internet Identity
              </Button>
            </div>

            <a>
              <p className='identity'>
                <a
                  href='https://smartcontracts.org/docs/ic-identity-guide/what-is-ic-identity.html'
                  target='_blank'
                >
                  What is internet identity?
                </a>
              </p>
            </a>
          </div>
        </div>
      }
    </div>
  );
};

export default AuthorProfileSidebar;
