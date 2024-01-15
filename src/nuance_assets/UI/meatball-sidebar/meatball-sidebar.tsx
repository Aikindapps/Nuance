import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { images, icons, colors } from '../../shared/constants';
import { useUserStore } from '../../store';
import { useTheme } from '../../contextes/ThemeContext';

const MeatBallSidebar = () => {
  const navigate = useNavigate();
  const darkTheme = useTheme();

  const user = useUserStore((state) => state.user);

  const [shown, setShown] = useState(false);

  const CloseMenu = () => {
    setShown(false);
  };

  const ToggleMenu = () => {
    setShown(!shown);
  };

  return (
    <div className='meatball-menu'>
      {/* <img
        className='sidebar-button'
        onClick={ToggleMenu}
        src={shown ? icons.THREE_DOTS_BLUE : icons.THREE_DOTS}
        alt='sidebar-button'
      /> */}
      <FontAwesomeIcon
        style={
          darkTheme
            ? { color: colors.primaryBackgroundColor, cursor: 'pointer' }
            : { cursor: 'pointer' }
        }
        className='sidebar-button'
        onClick={ToggleMenu}
        icon={faEllipsis}
      />
      {
        <div
          className='sidebar-content'
          onMouseLeave={CloseMenu}
          style={shown ? { width: 230 } : { width: 0 }}
        >
          <ul style={shown ? {} : { display: 'none' }}>
            <li>
              <div className='profile'>
                <img
                  className='profile-pic'
                  src={user?.avatar || images.DEFAULT_AVATAR}
                  alt=''
                />
                <Link to={`/user/${user?.handle}`}>@{user?.handle}</Link>
              </div>
            </li>
            <Link to='/my-profile'>
              <li>My profile</li>
            </Link>
            <Link to='/'>
              <li>My draft articles</li>
            </Link>

            <Link to='/'>
              <li>My published articles</li>
            </Link>
            <Link to='/article/new'>
              <li>Create an article</li>
            </Link>
          </ul>
        </div>
      }
    </div>
  );
};

export default MeatBallSidebar;
