import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../contextes/ThemeContext';
import { colors, icons } from '../../shared/constants';
import { useAuthStore } from '../../store';

type MeatBallMenuProps = {
  shown: boolean;
  isArticle: Boolean;
  setShown: React.Dispatch<React.SetStateAction<boolean>>;
  setShownProfile: React.Dispatch<React.SetStateAction<boolean>>;
  isUserAdminScreen?: Boolean;
};

const MeatBallMenu: React.FC<MeatBallMenuProps> = (props): JSX.Element => {
  const navigate = useNavigate();
  const darkTheme = useTheme();

  const CloseMenu = () => {
    props.setShown(false);
  };

  const ref = useRef<HTMLDivElement>(null);

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  useEffect(() => {
    const checkIfClickedOutside = (e: { target: any }) => {
      // If the menu is open and the clicked target is not within the menu,
      // then close the menu
      if (props.shown && ref.current && !ref.current.contains(e.target)) {
        CloseMenu();
      }
    };

    document.addEventListener('mousedown', checkIfClickedOutside);
    document.addEventListener('keydown', (e) => {
      if (props.shown && e.key == 'Escape') {
        CloseMenu();
      }
    });

    return () => {
      // Cleanup the event listener
      document.removeEventListener('mousedown', checkIfClickedOutside);
    };
  }, [props.shown]);

  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
  };

  return (
    <div className={'meatball-menu'} ref={ref}>
      {/* <img
        onClick={() => {
          props.setShown(!props.shown);
          props.setShownProfile(false);
        }}
        src={
          props.shown
            ? icons.THREE_DOTS_BLUE
            : props.isArticle
            ? icons.THREE_DOTS_WHITE
            : icons.THREE_DOTS
        }
        alt='meatball-menu'
        style={{ cursor: 'pointer' }}
      /> */}
      <FontAwesomeIcon
        icon={faEllipsis}
        style={{
          color:
            window.location.pathname === '/'
              ? colors.primaryTextColor
              : props.isUserAdminScreen
              ? darkTheme
                ? colors.primaryTextColor
                : colors.darkModePrimaryTextColor
              : darkOptionsAndColors.color,
        }}
        onClick={() => {
          props.setShown(!props.shown);
          props.setShownProfile(false);
        }}
      />

      <div
        className='drop-down-content'
        // onMouseLeave={CloseMenu}
        style={
          props.shown
            ? {
                height: isLoggedIn ? '250px' : '290px',
                boxShadow: '0px 2px 10px 5px rgba(117, 117, 117, 0.08)',
                color: darkTheme
                  ? colors.primaryBackgroundColor
                  : colors.primaryTextColor,
                backgroundColor: darkTheme ? colors.primaryTextColor : '',
              }
            : { background: darkOptionsAndColors.background, display: 'none' }
        }
      >
        <ul style={props.shown ? darkOptionsAndColors : { display: 'none' }}>
          {!isLoggedIn && (
            <a
              href={`${window.location.origin}/register`}
              style={darkOptionsAndColors}
            >
              <li style={darkOptionsAndColors}>Login/register</li>
            </a>
          )}
          <a
            href='https://aikin.gitbook.io/nuance/'
            target='_blank'
            style={darkOptionsAndColors}
          >
            <li style={darkOptionsAndColors}>Wiki</li>
          </a>
          <a
            href='https://twitter.com/nuancedapp'
            target='_blank'
            style={darkOptionsAndColors}
          >
            <li style={darkOptionsAndColors}>Twitter</li>
          </a>
          <a
            href='https://discord.gg/zeQ79Rg3Gg'
            target='_blank'
            style={darkOptionsAndColors}
          >
            <li style={darkOptionsAndColors}>Discord</li>
          </a>
          <div
            className='horizontal-divider'
            style={darkOptionsAndColors}
          ></div>
          <a
            href='https://wiki.nuance.xyz/nuance/content-rules'
            target='_blank'
            style={darkOptionsAndColors}
          >
            <li style={darkOptionsAndColors}>Content rules</li>
          </a>
          <a
            href='https://wiki.nuance.xyz/nuance/terms-and-conditions'
            target='_blank'
            style={darkOptionsAndColors}
          >
            <li style={darkOptionsAndColors}>Terms & Conditions</li>
          </a>
          <a
            href='https://wiki.nuance.xyz/nuance/privacy-policy'
            target='_blank'
            style={darkOptionsAndColors}
          >
            <li style={darkOptionsAndColors}>Privacy Policy</li>
          </a>
        </ul>
      </div>
    </div>
  );
};

export default MeatBallMenu;
