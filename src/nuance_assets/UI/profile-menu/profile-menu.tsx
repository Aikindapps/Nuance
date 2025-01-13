import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore, useUserStore } from '../../store';
import { icons, colors } from '../../shared/constants';
import { useTheme } from '../../contextes/ThemeContext';
import { useAuth } from '@nfid/identitykit/react';

type ProfileMenuProps = {
  shown: boolean;
  isArticle: Boolean;
  screenWidth: Number;
  setShown: React.Dispatch<React.SetStateAction<boolean>>;
  setShownMeatball: React.Dispatch<React.SetStateAction<boolean>>;
  isUserAdminScreen?: Boolean;
};

const ProfileMenu: React.FC<ProfileMenuProps> = (props): JSX.Element => {
  const logout = useAuthStore((state) => state.logout);
  const ref = useRef<HTMLDivElement>(null);

  const darkTheme = useTheme();
  const darkThemeHomepage = useTheme() && window.location.pathname !== '/';
  const { disconnect } = useAuth();

  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
  };

  const { user } = useUserStore((state) => ({
    user: state.user,
  }));

  const CloseMenu = () => {
    props.setShown(false);
  };
  // const [user, setUser] = useState<UserType | null | undefined>(null);
  const [ProfilePic, setProfilePic] = useState(icons.USER);

  useEffect(() => {
    if (props.isUserAdminScreen && props.shown) {
      setProfilePic(
        darkThemeHomepage ? icons.USER_WHITE_DARK : icons.USER_BLUE
      );
    }
    if (props.isUserAdminScreen && !props.shown) {
      setProfilePic(darkThemeHomepage ? icons.USER : icons.USER_BLUE);
    }
    if (!props.isUserAdminScreen && props.shown) {
      setProfilePic(
        darkThemeHomepage ? icons.USER_WHITE_DARK : icons.USER_BLUE
      );
    }
    if (!props.isUserAdminScreen && !props.shown) {
      setProfilePic(darkThemeHomepage ? icons.USER_WHITE_DARK : icons.USER);
    }
  }, [props.shown, props.isUserAdminScreen, darkTheme]);

  const getUserIcon = () => {
    if (props.isUserAdminScreen) {
      if (darkThemeHomepage) {
        return icons.USER;
      } else {
        return icons.USER_WHITE_DARK;
      }
    } else {
      if (darkThemeHomepage) {
        return icons.USER_WHITE_DARK;
      } else {
        return icons.USER;
      }
    }
  };

  const onLogOut = () => {
    logout();
    disconnect();
    window.location.href = '/';
  };

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

  // useEffect(() => {
  //   // setUser(getUser());
  // }, []);
  return (
    <div className='meatball-menu' ref={ref}>
      <img
        onClick={() => {
          props.setShown(!props.shown);
          props.setShownMeatball(false);
        }}
        // style={{ backgroundColor: props.shown ? '#F5F5F5' : 'transparent' }}
        src={getUserIcon()}
        alt=''
        // onMouseOver={MouseOver}
        // onMouseDown={MouseDown}
        // onMouseLeave={MouseLeave}
      />

      <div
        className='drop-down-content-menu'
        // onMouseLeave={CloseMenu}
        style={
          props.shown
            ? {
                height:
                  (user
                    ? 5 +
                      user?.publicationsArray.filter((val) => val.isEditor)
                        .length
                    : 180) * 36,
                boxShadow: '0px 2px 10px 5px rgba(117, 117, 117, 0.08)',
                background: darkOptionsAndColors.background,
                color: darkOptionsAndColors.color,
              }
            : { background: darkOptionsAndColors.background, height: 0 }
        }
      >
        <ul
          className='alignment'
          style={props.shown ? {} : { display: 'none' }}
        >
          <Link to='/my-profile'>
            <li style={{ color: darkOptionsAndColors.color }}>My profile</li>
          </Link>
          <Link to='/my-profile/wallet'>
            <li style={{ color: darkOptionsAndColors.color }}>My wallet</li>
          </Link>
          <Link to='/my-profile/articles'>
            <li style={{ color: darkOptionsAndColors.color }}>My articles</li>
          </Link>
          {user?.publicationsArray
            .filter((val) => val.isEditor)
            .map((publication, index) => {
              return (
                <Link
                  key={index}
                  to={`/my-profile/publications/${publication.publicationName}`}
                >
                  <li style={{ color: darkOptionsAndColors.color }}>
                    {publication.publicationName}
                  </li>
                </Link>
              );
            })}
          <Link to='/article/new'>
            <li style={{ color: darkOptionsAndColors.color }}>
              Create an article
            </li>
          </Link>
          <div className='horizontal-divider'></div>
          <a>
            <span onClick={onLogOut}>
              <li style={{ color: darkOptionsAndColors.color }}>Log out</li>
            </span>
          </a>
        </ul>
      </div>
    </div>
  );
};

export default ProfileMenu;
