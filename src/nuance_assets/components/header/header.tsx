import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import MeatBallMenu from '../../UI/meatball-menu/meatball-menu';
import ProfileMenu from '../../UI/profile-menu/profile-menu';
import SearchModal from '../search-modal/search-modal';
import { colors, icons, images } from '../../shared/constants';
import { useAuthStore, usePostStore, useUserStore } from '../../store';
import { PublicationStylingObject, PublicationType } from '../../types/types';
import { trim_category_name } from '../../shared/utils';
import { useTheme, useThemeUpdate } from '../../contextes/ThemeContext';
import { Context } from '../../contextes/Context';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { GoTriangleDown } from 'react-icons/go';

import './_header.scss';
import { get } from 'lodash';

type HeaderProps = {
  loggedIn: boolean;
  isArticlePage: boolean;
  ScreenWidth: number;
  isReadArticlePage?: boolean;
  isMyProfilePage?: boolean;
  isPublicationPage?: boolean;
  category?: string;
  postTitle?: String;
  publication?: PublicationType | undefined;
  isUserAdminScreen?: boolean;
  transparentBackground?: boolean;
};

const Header: React.FC<HeaderProps> = (props): JSX.Element => {
  const [shownMeatball, setShownMeatball] = useState(false);
  const [shownProfile, setShownProfile] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const darkTheme = window.location.pathname !== '/' && useTheme();
  const toggleTheme = useThemeUpdate();
  const context = useContext(Context);
  const modalContext = useContext(ModalContext);
  const location = useLocation();
  const navigate = useNavigate();

  const NotificationsModalOpen =
    modalContext?.isModalOpen && modalContext.modalType === 'Notifications';
  const getNotificationIconStyle = () => {
    if (NotificationsModalOpen) {
      if (darkTheme) {
        if (props.isUserAdminScreen) {
          return {
            background: colors.primaryTextColor,
            color: colors.primaryBackgroundColor,
            padding: '2px',
          };
        } else {
          return {
            background: colors.primaryBackgroundColor,
            color: colors.primaryTextColor,
            padding: '2px',
          };
        }
      } else {
        if (props.isUserAdminScreen) {
          return {
            background: colors.primaryBackgroundColor,
            color: colors.primaryTextColor,
            padding: '2px',
          };
        } else {
          return {
            background: colors.primaryTextColor,
            color: colors.primaryBackgroundColor,
            padding: '2px',
          };
        }
      }
    } else {
      if (darkTheme) {
        if (props.isUserAdminScreen) {
          return {
            background: 'transparent',
            color: colors.primaryTextColor,
          };
        } else {
          return {
            background: 'transparent',
            color: colors.primaryBackgroundColor,
          };
        }
      } else {
        if (props.isUserAdminScreen) {
          return {
            background: 'transparent',
            color: colors.primaryBackgroundColor,
          };
        } else {
          return {
            background: 'transparent',
            color: colors.primaryTextColor,
          };
        }
      }
    }
  };

  const getNotificationIconTriangleStyle = () => {
    if (NotificationsModalOpen) {
      if (darkTheme) {
        if (props.isUserAdminScreen) {
          return {
            color: colors.primaryTextColor,
          };
        } else {
          return {
            color: colors.primaryBackgroundColor,
          };
        }
      } else {
        if (props.isUserAdminScreen) {
          return {
            color: colors.primaryBackgroundColor,
          };
        } else {
          return {
            color: colors.primaryTextColor,
          };
        }
      }
    }
  };

  const toggleNotificationsModal = () => {
    if (
      modalContext?.isModalOpen &&
      modalContext.modalType === 'Notifications'
    ) {
      modalContext.closeModal();
      markAllNotificationsAsRead();
    } else {
      modalContext?.openModal('Notifications');
    }
  };

  const { clearSearchBar, isTagScreen, getOwnedNfts, nftCanisters } =
    usePostStore((state) => ({
      clearSearchBar: state.clearSearchBar,
      isTagScreen: state.isTagScreen,
      getOwnedNfts: state.getOwnedNfts,
      nftCanisters: state.nftCanistersEntries,
    }));

  const { verifyBitfinityWallet, updateLastLogin } = useAuthStore((state) => ({
    verifyBitfinityWallet: state.verifyBitfinityWallet,
    updateLastLogin: state.updateLastLogin,
  }));

  const clearSearch = () => {
    if (window.location.pathname === '/') {
      clearSearchBar(true);
      window.location.reload();
    }
  };

  const {
    user,
    unreadNotificationCount,
    markAllNotificationsAsRead,
    resetUnreadNotificationCount,
    getUserNotifications,
    checkMyClaimNotification,
  } = useUserStore((state) => ({
    user: state.user,
    unreadNotificationCount: state.unreadNotificationCount,
    resetUnreadNotificationCount: state.resetUnreadNotificationCount,
    markAllNotificationsAsRead: state.markAllNotificationsAsRead,
    getUserNotifications: state.getUserNotifications,
    checkMyClaimNotification: state.checkMyClaimNotification,
  }));

  useEffect(() => {
    verifyBitfinityWallet();
    updateLastLogin();
    setInterval(() => {
      getUserNotifications(0, 20, navigate);
    }, 10000);
    setInterval(() => {
      checkMyClaimNotification();
    }, 10000);
  }, []);

  const getLogoOrBreadCrumb = () => {
    if (props.isPublicationPage) {
      if (props.ScreenWidth < 768) {
        return (
          <div className='breadcrumb-flex'>
            <Link to='/'>
              <img
                className='icon'
                onClick={clearSearch}
                src={images.NUANCE_LOGO}
                alt=''
              />
            </Link>
            {props.publication?.styling.logo.length ? (
              <div className='breadcrumb-flex'>
                <div
                  className='breadcrumb-arrow-mobile'
                  style={{ marginLeft: '5px' }}
                ></div>
                <Link
                  to={'/publication/' + props.publication?.publicationHandle}
                >
                  <img
                    className='icon brand-logo'
                    onClick={clearSearch}
                    src={props.publication?.styling?.logo}
                    alt=''
                  />
                </Link>
              </div>
            ) : null}

            {props.publication?.styling.logo.length &&
            props.postTitle?.length ? (
              <div className='breadcrumb-flex'>
                <div className='breadcrumb-arrow-mobile' />
                <div
                  style={{
                    fontSize: '12px',
                    color: darkOptionsAndColors.color,
                  }}
                  className='category-element'
                >
                  ...
                </div>
              </div>
            ) : null}
          </div>
        );
      } else {
        return (
          <div className='breadcrumb-flex'>
            <Link to='/'>
              <img
                className='icon'
                onClick={clearSearch}
                src={images.NUANCE_LOGO}
                alt=''
              />
            </Link>
            {props.publication?.styling.logo.length ? (
              <div className='breadcrumb-flex'>
                <div
                  className='breadcrumb-arrow'
                  style={{ marginLeft: '5px' }}
                ></div>
                <Link
                  to={'/publication/' + props.publication?.publicationHandle}
                >
                  <img
                    className='icon brand-logo'
                    onClick={clearSearch}
                    src={props.publication?.styling?.logo}
                    alt=''
                  />
                </Link>
              </div>
            ) : null}

            {props.publication?.styling.logo.length &&
            props.category?.length &&
            props.category ? (
              <div className='breadcrumb-flex'>
                <div className='breadcrumb-arrow' />
                <Link
                  to={`/publication/${
                    props.publication?.publicationHandle
                  }/${trim_category_name(props.category)}`}
                >
                  <div
                    className='category-element'
                    style={{ color: darkOptionsAndColors.color }}
                  >
                    {props.category}
                  </div>
                </Link>
              </div>
            ) : null}
            {props.publication?.styling.logo.length &&
            props.postTitle?.length ? (
              <div className='breadcrumb-flex'>
                <div className='breadcrumb-arrow' />
                <div className='category-element'>...</div>
              </div>
            ) : null}
          </div>
        );
      }
    } else {
      if (props.loggedIn == false && props.ScreenWidth < 768) {
        return (
          <Link to='/'>
            <img
              className='icon'
              onClick={clearSearch}
              src={images.NUANCE_LOGO}
              alt=''
            />
          </Link>
        );
      } else {
        return (
          <Link to='/'>
            <img
              className='icon'
              onClick={clearSearch}
              src={images.NUANCE_LOGO}
              alt=''
            />
          </Link>
        );
      }
    }
  };

  const darkOptionsAndColors = {
    background:
      darkTheme && !props.isUserAdminScreen
        ? colors.darkModePrimaryBackgroundColor
        : props.isUserAdminScreen
        ? darkTheme
          ? colors.primaryBackgroundColor
          : colors.darkModePrimaryBackgroundColor
        : darkTheme
        ? colors.darkModePrimaryBackgroundColor
        : colors.primaryBackgroundColor,
    color:
      darkTheme && !props.isUserAdminScreen
        ? colors.darkModePrimaryTextColor
        : props.isUserAdminScreen
        ? darkTheme
          ? colors.darkModePrimaryTextColor
          : colors.primaryTextColor
        : colors.primaryTextColor,
    secondaryColor: darkTheme
      ? colors.darkSecondaryTextColor
      : colors.primaryTextColor,
  };

  return (
    <div
      className='header-wrapper'
      style={
        props.isUserAdminScreen
          ? {
              backgroundColor: darkTheme
                ? colors.primaryBackgroundColor
                : colors.primaryTextColor,
            }
          : {}
      }
    >
      {modalOpen && (
        <SearchModal
          setOpenModal={setModalOpen}
          screenWidth={props.ScreenWidth}
        />
      )}
      {getLogoOrBreadCrumb()}
      <div className='right-icons'>
        {location.pathname === '/' && (
          <a
            className='about-nuance-text'
            target='_blank'
            href='https://wiki.nuance.xyz/'
          >
            About Nuance
          </a>
        )}
        {props.isArticlePage && props.ScreenWidth < 768 ? (
          <>
            <img
              className='header-icon1'
              onClick={() => {
                setModalOpen(true);
              }}
              src={icons.SEARCH_WHITE}
            />{' '}
            {
              props.isMyProfilePage ? '' : '' //<img className='header-icon2' src={icons.NOTIFICATION} />
            }
          </>
        ) : (
          ''
        )}
        <div className='dark-mode-toggle'>
          <img
            className='dark-mode-icon'
            onClick={toggleTheme}
            src={
              darkTheme && !props.isUserAdminScreen
                ? icons.DARK_MODE_TOGGLE_WHITE
                : darkTheme
                ? props.isUserAdminScreen
                  ? icons.DARK_MODE_TOGGLE
                  : icons.DARK_MODE_TOGGLE_WHITE
                : props.isUserAdminScreen
                ? icons.DARK_MODE_TOGGLE_WHITE
                : icons.DARK_MODE_TOGGLE
            }
          />
        </div>

        {props.isReadArticlePage ? (
          <img
            src={darkTheme ? icons.SEARCH_WHITE : icons.SEARCH_BLACK}
            style={{ marginRight: '10px' }}
            onClick={() => {
              setModalOpen(true);
            }}
          ></img>
        ) : (
          ''
        )}

        {props.loggedIn && user && (
          <div
            className='notification-icon-wrapper'
            style={getNotificationIconStyle()}
            onClick={toggleNotificationsModal}
          >
            <IoMdNotificationsOutline
              style={getNotificationIconStyle()}
              className='notification-header-icon'
            />

            {NotificationsModalOpen && (
              <GoTriangleDown
                style={getNotificationIconTriangleStyle()}
                className='triangle'
              />
            )}
            {unreadNotificationCount > 0 ? (
              <span
                className='notification-count'
                onClick={toggleNotificationsModal}
              >
                {unreadNotificationCount}
              </span>
            ) : (
              ''
            )}
          </div>
        )}

        {props.loggedIn && user ? (
          <ProfileMenu
            shown={shownProfile}
            isArticle={props.isArticlePage}
            setShown={setShownProfile}
            setShownMeatball={setShownMeatball}
            screenWidth={props.ScreenWidth}
            isUserAdminScreen={props.isUserAdminScreen}
          />
        ) : (
          ''
        )}

        <MeatBallMenu
          shown={shownMeatball}
          isArticle={props.isArticlePage}
          setShown={setShownMeatball}
          setShownProfile={setShownProfile}
          isUserAdminScreen={props.isUserAdminScreen}
        />
      </div>
    </div>
  );
};

export default Header;
