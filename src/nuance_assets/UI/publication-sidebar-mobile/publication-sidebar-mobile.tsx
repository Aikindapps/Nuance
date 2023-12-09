import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store';
import { images, icons } from '../../shared/constants';
import { useTheme } from '../../contextes/ThemeContext';

type PublicationSidebarMobileProps = {
  isSidebarToggle?: (e: any) => void;
  handle: string | undefined;
  dark?: boolean;
};

const PublicationSidebarMobile: React.FC<PublicationSidebarMobileProps> = (
  props
): JSX.Element => {
  const [shown, setShown] = useState(false);

  const CloseMenu = () => {
    setShown(false);
  };

  const ToggleMenu = () => {
    setShown(!shown);
    props.isSidebarToggle && props.isSidebarToggle(!shown);
  };

  const copyLinkToArticle = () => {
    navigator.clipboard.writeText(window.location.href);
    CloseMenu();
    props.isSidebarToggle && props.isSidebarToggle(false);
  };

  const reportArticle = () => {
    console.log('Logic for reporting publication...');
  };
  const darkTheme = useTheme();

  return (
    <div
      className='publication-sidebar-mobile'
      style={shown ? { width: '230px' } : { width: 0 }}
    >
      <img
        className='sidebar-button'
        onClick={ToggleMenu}
        src={
          shown
            ? icons.THREE_DOTS_BLUE
            : darkTheme
            ? icons.THREE_DOTS_WHITE
            : icons.THREE_DOTS
        }
        alt='sidebar-button'
      />
      {
        <div
          className='sidebar-content'
          style={shown ? { width: '230px' } : { width: 0 }}
        >
          <div
            className='left-content-sidebar'
            style={shown ? {} : { display: 'none' }}
          >
            <div className='menus'>
              <a className='links' onClick={copyLinkToArticle}>
                Copy publication link
              </a>
              <a className='links' onClick={reportArticle}>
                Report publication
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  );
};

export default PublicationSidebarMobile;
