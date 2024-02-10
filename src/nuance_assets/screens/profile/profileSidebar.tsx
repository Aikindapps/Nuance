import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  useAuthStore,
  useUserStore,
  usePostStore,
  usePublisherStore,
} from '../../store';
import Header from '../../components/header/header';
import Button from '../../UI/Button/Button';
import { PublicationObject } from 'src/nuance_assets/services/actorService';
import PublicationLink from './publicationLink';
import Activity from './activity';
import { useTheme } from '../../contextes/ThemeContext';
import { colors, images, icons } from '../../shared/constants';
import { Context } from '../../contextes/Context';

const ProfileSidebar = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [screenWidth, setScreenWidth] = useState(0);
  const navigate = useNavigate();
  const [mobile, setMobile] = useState<Boolean>(false);
  const [userPublications, setUserPublications] = useState<PublicationObject[]>(
    []
  );
  const [shown, setShown] = useState(screenWidth > 1089);
  const ToggleMenu = () => {
    if (screenWidth < 1089) {

      setShown(!shown);
      shown && setShown(!shown);
    }
  };

  const CloseMenu = () => {
    if (screenWidth < 1089) {
      console.log('called');
      setShown(false);
    }
  };


  //NFT feature toggle
  const context = useContext(Context)
  const nftFeatureIsLive = context.nftFeature;
  const location = useLocation();
  const darkTheme = useTheme();

  const { user, getCounts, counts, author, getAuthor, clearAuthor } =
    useUserStore((state) => ({
      user: state.user,
      getCounts: state.getUserPostCounts,
      counts: state.userPostCounts,
      author: state.author,
      getAuthor: state.getAuthor,
      clearAuthor: state.clearAuthor,
    }));

  const {
    getMyTags,
    myTags
  } = usePostStore((state) => ({
    getMyTags: state.getMyTags,
    myTags: state.myTags,
  }));

  useEffect(() => {
    if (user) {
      getCounts(user.handle);
      getMyTags();
      setUserPublications(
        user.publicationsArray.filter((publication) => publication.isEditor)
      );
    }
  }, [user]);

  useEffect(() => {
    if (window.innerWidth < 1089) {
      setMobile(true);
    } else setMobile(false);
  }, [window.innerWidth]);

  useEffect(
    (window.onresize = window.onload =
      () => {
        if (window.innerWidth < 1089) {
          setMobile(true);
        } else {
          setMobile(false);
        }
        setScreenWidth(window.innerWidth);
      }),
    [screenWidth]
  );

  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
    secondaryColor: darkTheme
      ? colors.darkSecondaryTextColor
      : colors.primaryTextColor,
    THREE_DOTS: darkTheme ? icons.THREE_DOTS_WHITE : icons.THREE_DOTS_BLUE,
    THREE_DOTS_LIGHT_ICON: darkTheme
      ? icons.THREE_DOTS_WHITE
      : icons.THREE_DOTS,
  };


  return (
    <div
      className='profile-wrapper'
      style={{
        background: darkOptionsAndColors.background,
        color: darkOptionsAndColors.color,
      }}
    >
      <Header
        loggedIn={isLoggedIn}
        isArticlePage={true}
        ScreenWidth={screenWidth}
        isMyProfilePage={true}
        isPublicationPage={false}
        isUserAdminScreen={true}
      />
      <div className='container'>

        <div
          style={
            location.pathname.includes('publications') &&
              screenWidth > 451 &&
              screenWidth < 1089 &&
              shown
              ? {}
              : (location.pathname.includes('published') ||
                location.pathname.includes('draft')) &&
                screenWidth < 1089 &&
                shown
                ? {} : {}
          }
          className={`sidebar ${!shown ? 'not-toggled' : ''}`}
        >
          <div className='meatball-menu'>
            {screenWidth < 1089 && (
              <img
                className='sidebar-button'
                onClick={ToggleMenu}
                src={
                  shown
                    ? icons.THREE_DOTS_BLUE
                    : darkOptionsAndColors.THREE_DOTS_LIGHT_ICON
                }
                alt='sidebar-button'
              />

            )}
            {
              <div
                className='sidebar-content'
                onMouseLeave={CloseMenu}
                style={
                  shown && !location.pathname.includes('publications')
                    ? { width: 200 }
                    : shown
                      ? { width: 200 }
                      : { width: 0 }
                }

              >

                <div style={shown || screenWidth > 1089 ? {} : { display: 'none' }}>
                  <div className='sidebar-dropdown'>

                    <Link
                      style={{
                        color:
                          location.pathname === '/my-profile'
                            ? colors.accentColor
                            : darkOptionsAndColors.color,
                      }}
                      className={`route ${location.pathname === '/my-profile' && 'active'
                        }`}
                      to='/my-profile'
                    >
                      My Profile
                    </Link>
                    <Link
                      style={{
                        color:
                          location.pathname === '/my-profile/articles'
                            ? colors.accentColor
                            : darkOptionsAndColors.color,
                      }}
                      className={`route ${location.pathname === '/my-profile/articles' && 'active'
                        }`}
                      to='/my-profile/articles'
                    >
                      My Articles ({counts?.totalPostCount || 0})
                    </Link>


                    <Activity
                      dark={darkTheme}
                      followedTopicsCount={myTags?.length || 0}
                      followingCount={user?.followers.length || 0}
                      followersCount={user?.followersCount || 0}

                    />

                    {userPublications.length !== 0 ? (
                      <PublicationLink
                        dark={darkTheme}
                        publicationsArray={userPublications}
                      />
                    ) : null}

                    <Link
                      style={{
                        color:
                          location.pathname === '/my-profile/wallet'
                            ? colors.accentColor
                            : darkOptionsAndColors.color,
                      }}
                      className={`route ${location.pathname === '/my-profile/wallet' && 'active'
                        }`}
                      to='/my-profile/wallet'
                    >
                      My Wallet
                    </Link>
                    <div className='hr' />
                    <Button
                      styleType='secondary'
                      type='button'
                      style={{ width: '130px' }}
                      onClick={() => {
                        navigate('/article/new', { replace: true });
                      }}
                    >
                      Create new article
                    </Button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default ProfileSidebar;