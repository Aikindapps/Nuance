import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore, useUserStore, usePostStore, usePublisherStore } from '../../store';
import Header from '../../components/header/header';
import Button from '../../UI/Button/Button';
import MyProfileSidebar from '../../UI/my-profile-sidebar/my-profile-sidebar';
import { PublicationObject } from 'src/nuance_assets/services/actorService';
import PublicationLink from './publicationLink';
import { useTheme } from '../../ThemeContext';
import { colors, images } from '../../shared/constants';
import { Context } from '../../Context';

const ProfileSidebar = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [screenWidth, setScreenWidth] = useState(0);
  const navigate = useNavigate();
  const [mobile, setMobile] = useState<Boolean>(false);
  const [userPublications, setUserPublications] = useState<PublicationObject[]>(
    []
  );

  //NFT feature toggle
  const nftFeatureIsLive = useContext(Context).nftFeature;
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

    const { getAllWriterDrafts, allDrafts } = usePublisherStore((state) => ({ allDrafts: state.allDrafts , getAllWriterDrafts: state.getAllWriterDrafts }));


  const { getMyTags, myTags } = usePostStore((state) => ({
    getMyTags: state.getMyTags,
    myTags: state.myTags,
  }));

  useEffect(() => {
    if (user) {
      getCounts(user.handle);
      getAllWriterDrafts(user.handle);
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

  const sidebarRoutes = nftFeatureIsLive
    ? [
        {
          title: 'My Profile',
          goto: '/my-profile',
        },
        {
          title: `Draft Articles (${counts?.draftCount || 0})`,
          goto: '/my-profile/draft',
        },
        {
          title: `Submitted for Review (${allDrafts?.length || 0})`,
          goto: '/my-profile/submitted-for-review',
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
        tokens={user?.nuaTokens}
        loading={false}
        isPublicationPage={false}
        isUserAdminScreen={true}
      />
      <div className='container'>
        {mobile ? (
          <MyProfileSidebar />
        ) : (
          <div className='sidebar'>
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
                publicationsArray={userPublications}
                dark={darkTheme}
              />
            ) : null}

            <div className='hr' />
            <Button
              styleType='secondary'
              type='button'
              style={{ width: '130px' }}
              onClick={() => {
                navigate('/article/new');
              }}
            >
              Create new article
            </Button>
          </div>
        )}

        <Outlet />
      </div>
    </div>
  );
};

export default ProfileSidebar;
