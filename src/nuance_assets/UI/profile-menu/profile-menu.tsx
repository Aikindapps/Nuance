import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { icons, colors } from '../../shared/constants';
import { useTheme } from '../../ThemeContext';

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
  const ref = React.createRef<HTMLDivElement>();

  const darkTheme = useTheme();
  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
  };

  const CloseMenu = () => {
    props.setShown(false);
  };
  // const [user, setUser] = useState<UserType | null | undefined>(null);
  const [ProfilePic, setProfilePic] = useState(icons.USER);

  useEffect(() => {
    if (props.isUserAdminScreen && props.shown) {
      setProfilePic(darkTheme ? icons.USER_BLUE : icons.USER_BLUE);
    }
    if (props.isUserAdminScreen && !props.shown) {
      setProfilePic(darkTheme ? icons.USER : icons.USER_BLUE);
    }
    if (!props.isUserAdminScreen && props.shown) {
      setProfilePic(darkTheme ? icons.USER_BLUE : icons.USER_BLUE);
    }
    if (!props.isUserAdminScreen && !props.shown) {
      setProfilePic(darkTheme ? icons.USER_BLUE : icons.USER);
    }
  }, [props.shown, props.isUserAdminScreen, darkTheme]);

  const MouseOver = () => {
    setProfilePic(icons.USER_HOVER);
  };
  const MouseDown = () => {
    setProfilePic(icons.USER_DOWN);
  };
  const MouseLeave = () => {
    setProfilePic(icons.USER);
  };

  const onLogOut = () => {
    logout();
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
        src={ProfilePic}
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
                height: 235,
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
          <Link to='/my-profile/draft'>
            <li style={{ color: darkOptionsAndColors.color }}>
              My draft articles
            </li>
          </Link>
          <Link to='/my-profile/published'>
            <li style={{ color: darkOptionsAndColors.color }}>
              My published articles
            </li>
          </Link>
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
