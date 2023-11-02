import React, { useState, useEffect, useContext } from 'react';
import { useUserStore, usePostStore, usePublisherStore } from '../../store';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../Button/Button';
import { icons, colors } from '../../shared/constants';
import { PublicationObject } from '../../types/types';
import PublicationLink from '../../screens/profile/publicationLink';
import { useTheme } from '../../ThemeContext';
import { Context } from '../../Context';

type MyProfileSidebarProps = {
  isSidebarToggle?: (e: any) => void;
  id?: String;
  handle?: String;
};

const MyProfileSidebar: React.FC<MyProfileSidebarProps> = (
  props
): JSX.Element => {
  const navigate = useNavigate();
  const [shown, setShown] = useState(false);
  const [userPublications, setUserPublications] = useState<PublicationObject[]>(
    []
  );
  const [screenWidth, setScreenWidth] = useState(0);

  const location = useLocation();

  //NFT feature toggle
  const context = useContext(Context);
  const nftFeatureIsLive = context.nftFeature;

  const { user, getCounts, counts } = useUserStore((state) => ({
    user: state.user,
    getCounts: state.getUserPostCounts,
    counts: state.userPostCounts,
  }));

  const { getAllWriterDrafts, allDrafts } = usePublisherStore((state) => ({ allDrafts: state.allDrafts, getAllWriterDrafts: state.getAllWriterDrafts }));

  const { getMyTags, myTags } = usePostStore((state) => ({
    getMyTags: state.getMyTags,
    myTags: state.myTags,
  }));

  useEffect(() => {
    if (user) {
      getCounts(user.handle);
      getMyTags();
      setUserPublications(
        user.publicationsArray.filter((pub) => {
          return pub.isEditor;
        })
      );
    }
  }, [user]);

  useEffect(
    (window.onresize = window.onload =
      () => {
        setScreenWidth(window.innerWidth);
      }),
    [screenWidth]
  );

  const CloseMenu = () => {
    console.log('called');
    setShown(false);
  };

  const ToggleMenu = () => {
    console.log('here');
    setShown(!shown);
    props.isSidebarToggle && props.isSidebarToggle(!shown);
  };

  const getPaddingLeft = () => {
    if (screenWidth < 280) {
      return { paddingLeft: '95vw' };
    } else if (screenWidth < 313) {
      return { paddingLeft: '85vw' };
    } else if (screenWidth < 380) {
      return { paddingLeft: '80vw' };
    } else if (screenWidth < 480) {
      return { paddingLeft: '65vw' };
    } else if (screenWidth < 580) {
      return { paddingLeft: '55vw' };
    } else if (screenWidth < 680) {
      return { paddingLeft: '45vw' };
    } else if (screenWidth < 714) {
      return { paddingLeft: '40vw' };
    } else if (screenWidth < 880) {
      return { paddingLeft: '35vw' };
    } else if (screenWidth < 980) {
      return { paddingLeft: '30vw' };
    } else if (screenWidth < 1089) {
      return { paddingLeft: '25vw' };
    }
  };

  const sidebarRoutes = nftFeatureIsLive
    ? [
        {
          title: 'My Profile',
          goto: '/my-profile',
        },
        {
        title: `Submitted for Review (${allDrafts?.length || 0})`,
        goto: '/my-profile/submitted-for-review',
        },
        {
          title: `Draft Articles (${counts?.draftCount || 0})`,
          goto: '/my-profile/draft',
        },
        {
          title: `Published Articles (${counts?.publishedCount || 0})`,
          goto: '/my-profile/published',
        },
        {
          title: `Followed Topics (${myTags?.length || 0})`,
          goto: '/my-profile/topics',
        },
        {
          title: `Following (${user?.followersArray.length || 0})`,
          goto: '/my-profile/following',
        },
        {
          title: `Followers (${user?.followersCount || 0})`,
          goto: '/my-profile/followers',
        },
        {
          title: 'My wallet',
          goto: '/my-profile/wallet',
        },
      ]
    : [
        {
          title: 'My Profile',
          goto: '/my-profile',
        },
        {
          title: `Draft Articles (${counts?.draftCount || 0})`,
          goto: '/my-profile/draft',
        },
        {
          title: `Published Articles (${counts?.publishedCount || 0})`,
          goto: '/my-profile/published',
        },
        {
          title: `Followed Topics (${myTags?.length || 0})`,
          goto: '/my-profile/topics',
        },
        {
          title: `Following (${user?.followersArray.length || 0})`,
          goto: '/my-profile/following',
        },
      ];
  const darkTheme = useTheme();
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
      style={
        location.pathname.includes('publications') &&
        screenWidth > 451 &&
        screenWidth < 774 &&
        shown
          ? { paddingLeft: '30%' }
          : (location.pathname.includes('published') ||
              location.pathname.includes('draft')) &&
            screenWidth < 1089 &&
            shown
          ? getPaddingLeft()
          : {}
      }
      className={`sidebar ${!shown ? 'not-toggled' : ''}`}
    >
      <div className='meatball-menu'>
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
        {
          <div
            className='sidebar-content'
            onMouseLeave={CloseMenu}
            style={
              shown && !location.pathname.includes('publications')
                ? { width: 230 }
                : shown
                ? {}
                : { width: 0 }
            }
          >
            <div style={shown ? {} : { display: 'none' }}>
              <div className='sidebar-dropdown'>
                {sidebarRoutes.map((route) => {
                  return (
                    <Link
                      style={{
                        background: darkOptionsAndColors.background,
                        color:
                          location.pathname === route?.goto
                            ? colors.accentColor
                            : darkOptionsAndColors.color,
                      }}
                      className={`route ${
                        location.pathname === route?.goto && 'active'
                      }`}
                      key={route?.goto}
                      to={route?.goto}
                    >
                      {route?.title}
                    </Link>
                  );
                })}
                {userPublications.length !== 0 ? (
                  <PublicationLink
                    dark={darkTheme}
                    publicationsArray={userPublications}
                  />
                ) : null}
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
  );
};

export default MyProfileSidebar;
