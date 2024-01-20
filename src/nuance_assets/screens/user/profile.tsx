import React, { useState, useEffect, useContext } from 'react';
import { Helmet } from 'react-helmet';
import { useAuthStore, useUserStore, usePostStore } from '../../store';
import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';
import Button from '../../UI/Button/Button';
import CardHorizontal from '../../components/card-horizontal/card-horizontal';
import ReportAuthorMenu from '../../UI/report-author/report-author';
import CopyProfile from '../../UI/copy-profile/copy-profile';
import CardVertical from '../../components/card-vertical/card-vertical';
import AuthorProfileSidebar from '../../UI/author-profile-sidebar/author-profile-sidebar';
import { useParams } from 'react-router-dom';
import { images, colors } from '../../shared/constants';
import FollowAuthor from '../../components/follow-author/follow-author';
import Linkify from 'react-linkify';
import { Link } from 'react-router-dom';
import { Row, Col } from 'react-bootstrap';
import { PostType, PublicationObject, UserType } from '../../types/types';
import { Context } from '../../contextes/Context';
import { useTheme } from '../../contextes/ThemeContext';
import { get } from 'lodash';
import LoggedOutSidebar from '../../components/logged-out-sidebar/logged-out-sidebar';
import { UserPostCounts } from '../../../declarations/PostCore/PostCore.did';
import './_profile.scss';
import { getIconForSocialChannel } from '../../shared/utils';
import CardPublishedArticles from '../../components/card-published-articles/card-published-articles';
import { Tooltip } from 'react-tooltip';
const Profile = () => {
  const [shownMeatball, setShownMeatball] = useState(false);
  const [copyProfile, setCopyProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreCounter, setLoadMoreCounter] = useState(1);
  const [author, setAuthor] = useState<UserType | undefined>();
  const [displayingPosts, setDisplayingPosts] = useState<PostType[]>([]);
  const [userPostCounts, setUserPostCounts] = useState<
    UserPostCounts | undefined
  >();
  const { handle } = useParams();
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
    secondaryButtonColor: darkTheme
      ? colors.darkModeSecondaryButtonColor
      : colors.accentColor,
  };

  const { redirect, redirectScreen, isLoggedIn, login } = useAuthStore(
    (state) => ({
      isLoggedIn: state.isLoggedIn,
      login: state.login,
      redirect: state.redirect,
      redirectScreen: state.redirectScreen,
    })
  );
  const user = useUserStore((state) => state.user);

  const { getAuthor, getUserPostCounts } = useUserStore((state) => ({
    getAuthor: state.getAuthor,
    getUserPostCounts: state.getUserPostCounts,
  }));

  const { getPostsByFollowers } = usePostStore((state) => ({
    getPostsByFollowers: state.getPostsByFollowers,
  }));

  const load = async () => {
    if (handle) {
      setLoading(true);
      let [authorResponse, posts, userPostCounts] = await Promise.all([
        getAuthor(handle),
        getPostsByFollowers([handle], 0, 19),
        getUserPostCounts(handle),
      ]);
      //if author exists, set the value
      if (authorResponse) {
        setAuthor(authorResponse);
      }
      //if there's any post, set the displaying posts
      console.log('posts here: ', posts);
      if (posts) {
        setDisplayingPosts(posts);
      }

      //set the user post counts
      if (userPostCounts) {
        setUserPostCounts(userPostCounts);
      }

      setLoading(false);
    }
  };

  const loadMoreHandler = async () => {
    setLoadingMore(true);
    if (handle) {
      let posts = await getPostsByFollowers(
        [handle],
        (loadMoreCounter - 1) * 20 + 20,
        19 + loadMoreCounter * 20
      );
      if (posts?.length) {
        setDisplayingPosts([...displayingPosts, ...posts]);
      }
      setLoadMoreCounter(loadMoreCounter + 1);
    }

    setLoadingMore(false);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
  }, []);

  const getSocialChannelUrls = () => {
    if (author) {
      if (author.website === '') {
        return author.socialChannels;
      } else {
        return [author.website, ...author.socialChannels];
      }
    } else {
      return [];
    }
  };

  const context = useContext(Context);

  return (
    <div>
      <Helmet>
        <link
          rel='canonical'
          href={'https://nuance.xyz' + window.location.pathname}
        />

        {/* HTML Meta Tags */}
        <title>{`${author?.displayName || 'writer'} - Nuance Profile`}</title>
        <meta name='description' content={author?.bio} />

        {/* Google / Search Engine Tags */}
        <meta
          itemProp='name'
          content={`${author?.displayName} - Nuance Profile`}
        />
        <meta itemProp='description' content={author?.bio} />
        <meta
          itemProp='image'
          content={author?.avatar || images.DEFAULT_AVATAR}
        />

        {/* Facebook Meta Tags */}
        <meta property='og:url' content={window.location.href} />
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content={`${author?.displayName} - Nuance Profile`}
        />
        <meta property='og:description' content={author?.bio} />
        <meta
          property='og:image'
          content={author?.avatar || images.DEFAULT_AVATAR}
        />

        {/* Twitter Meta Tags */}
        <meta
          name='twitter:card'
          content={author?.avatar || images.DEFAULT_AVATAR}
        />
        <meta
          name='twitter:title'
          content={`${author?.displayName} - Nuance Profile`}
        />
        <meta name='twitter:description' content={author?.bio} />
        <meta
          name='twitter:image'
          content={author?.avatar || images.DEFAULT_AVATAR}
        />
      </Helmet>
      <Header
        loggedIn={isLoggedIn}
        isArticlePage={false}
        ScreenWidth={context.width}
        isPublicationPage={false}
      />
      <div className='user-profile-wrapper'>
        <div className='profile-author-wrapper'>
          <div className='profile-sidebar'>
            <div className='wrapper'>
              {context.width < 768 ? (
                <div className='left-profile-menu'>
                  <AuthorProfileSidebar />
                </div>
              ) : (
                <div className='logged-out' style={{ alignItems: 'flex-end' }}>
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
                      dark={darkTheme}
                    />
                    <ReportAuthorMenu
                      shown={shownMeatball}
                      setShown={setShownMeatball}
                      isPublication={false}
                      dark={darkTheme}
                    />
                  </div>
                  <div className='horizontal-divider' style={{}}></div>
                  {!isLoggedIn && (
                    <LoggedOutSidebar style={{ width: '265px' }} />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className='container'>
            <div className='author-wrapper'>
              <p className='titles'>AUTHOR PROFILE</p>

              <div className='content'>
                <img
                  src={author?.avatar || images.DEFAULT_AVATAR}
                  alt='background'
                  className='profile-picture'
                />
                <p className='name'>{author?.displayName}</p>
                <p
                  style={
                    darkTheme
                      ? {
                          color: darkOptionsAndColors.color,
                        }
                      : {}
                  }
                  className='username'
                >
                  @{author?.handle}
                </p>
                <div className='social-channels'>
                  {getSocialChannelUrls().map((url, index) => {
                    return (
                      <div
                        onClick={() => {
                          let urlWithProtocol =
                            url.startsWith('https://') ||
                            url.startsWith('http://')
                              ? url
                              : 'https://' + url;
                          window.open(urlWithProtocol, '_blank');
                        }}
                      >
                        <Tooltip
                          clickable={true}
                          className='tooltip-wrapper'
                          anchorSelect={'#social-channel-' + index}
                          place='top'
                          noArrow={true}
                        >
                          {url}
                        </Tooltip>
                        <img
                          className='social-channel-icon'
                          src={getIconForSocialChannel(url, darkTheme)}
                          id={'social-channel-' + index}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className='description' style={
                    darkTheme
                      ? {
                          color: darkOptionsAndColors.secondaryColor,
                        }
                      : {}
                  }>{author?.bio}</p>

                <FollowAuthor
                  AuthorHandle={author?.handle || ''}
                  Followers={user?.followersArray || undefined}
                  user={user?.handle || ''}
                  isPublication={false}
                />
              </div>

              <div className='statistic-wrapper'>
                <div className='statistic'>
                  <div className='stat'>
                    <p className='count'>
                      {userPostCounts?.publishedCount || 0}
                    </p>
                    <p className='title'>Articles</p>
                  </div>
                  <div className='stat'>
                    <p className='count'>
                      {userPostCounts?.totalViewCount || 0}
                    </p>
                    <p className='title'>Article Views</p>
                  </div>
                </div>
                <div className='statistic-horizontal-divider' />
                <div className='statistic'>
                  <div className='stat'>
                    <p className='count'>{userPostCounts?.uniqueClaps || 0}</p>
                    <p className='title'>Applauds</p>
                  </div>
                  <div className='stat'>
                    <p className='count'>{author?.followersCount || 0}</p>
                    <p className='title'>Followers</p>
                  </div>
                </div>
              </div>

              <div className='published-articles'>
                <p className='published-articles-title'>
                  PUBLISHED ARTICLES ({userPostCounts?.publishedCount || 0})
                </p>
                <div className='article-list-items-wrapper'>
                  {displayingPosts.map((post: any) => (
                    <CardPublishedArticles post={post} key={post.postId} />
                  ))}
                </div>

                {userPostCounts &&
                  !loading &&
                  parseInt(userPostCounts?.publishedCount) >
                    displayingPosts.length && (
                    <div className='load-more-container'>
                      <Button
                        styleType='secondary'
                        style={{ width: '152px' }}
                        onClick={() => loadMoreHandler()}
                        icon={loadingMore ? images.loaders.BUTTON_SPINNER : ''}
                      >
                        <span>Load More</span>
                      </Button>
                    </div>
                  )}
              </div>
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
