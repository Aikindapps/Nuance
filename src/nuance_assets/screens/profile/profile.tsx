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
import { PostType, PublicationObject } from '../../types/types';
import { Context } from '../../contextes/Context';
import { useTheme } from '../../contextes/ThemeContext';
import { get } from 'lodash';
import LoggedOutSidebar from '../../components/logged-out-sidebar/logged-out-sidebar';

const Profile = () => {
  const [shownMeatball, setShownMeatball] = useState(false);
  const [copyProfile, setCopyProfile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreCounter, setLoadMoreCounter] = useState(1);
  const [displayingPosts, setDisplayingPosts] = useState<PostType[]>([]);
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

  const {
    getAuthor,
    author,
    clearAuthor,
    getCounts,
    counts,
    getUsersByHandles,
    usersByHandles,
    getUserFollowersCount,
    userFollowersCount,
  } = useUserStore((state) => ({
    getAuthor: state.getAuthor,
    author: state.author,
    clearAuthor: state.clearAuthor,
    getCounts: state.getUserPostCounts,
    counts: state.userPostCounts,
    getUsersByHandles: state.getUsersByHandles,
    usersByHandles: state.usersByHandles,
    getUserFollowersCount: state.getUserFollowersCount,
    userFollowersCount: state.userFollowersCount,
  }));

  const { getPostsByFollowers } = usePostStore((state) => ({
    getPostsByFollowers: state.getPostsByFollowers,
  }));

  const load = () => {
    if (handle) {
      getAuthor(handle);
      loadInitial(handle);
      getUserFollowersCount(handle);
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

  const loadInitial = async (handle: string) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 5000);
    let posts = await getPostsByFollowers([handle], 0, 19);
    if (posts?.length) {
      setDisplayingPosts(posts);
    }
    setLoading(false);
  };

  useEffect(() => {
    redirect(window.location.pathname);
  }, [author]);

  useEffect(
    (window.onresize = window.onload =
      () => {
        setScreenWidth(window.innerWidth);
      }),
    [screenWidth]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    clearAuthor();
    load();
  }, []);

  useEffect(() => {
    if (author) {
      getCounts(author.handle);
    }
  }, [author]);

  useEffect(() => {
    getUsersByHandles(
      (user?.publicationsArray || []).map(
        (publication: PublicationObject) => publication.publicationName
      )
    );
  }, []);

  useEffect(() => {
    load();
    getUsersByHandles(
      (user?.publicationsArray || []).map(
        (publication: PublicationObject) => publication.publicationName
      )
    );
  }, [handle]);
  const context = useContext(Context);
  const featureIsLive = context.publicationFeature;

  //for customizing linkify npm package
  const componentDecorator = (href: any, text: any, key: any) => (
    <a href={href} key={key} target='_blank' rel='noopener noreferrer'>
      {text}
    </a>
  );

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
        ScreenWidth={screenWidth}
        isPublicationPage={false}
      />
      <div
        className='profile-author-wrapper'
        style={{ background: darkOptionsAndColors.background }}
      >
        <div className='profile-sidebar'>
          <div className='wrapper'>
            {screenWidth < 768 ? (
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
                <div
                  className='horizontal-divider'
                  style={isLoggedIn ? { width: '17vw' } : {}}
                ></div>
                {!isLoggedIn && <LoggedOutSidebar style={{ width: '265px' }} />}
              </div>
            )}
          </div>
        </div>

        <div className='container' style={{ width: '75%' }}>
          <div className='author-wrapper'>
            <p className='titles'>AUTHOR PROFILE</p>

            <div className='content'>
              <img
                src={author?.avatar || images.DEFAULT_AVATAR}
                alt='background'
                className='profile-picture'
              />
              <p className='name' style={{ color: darkOptionsAndColors.color }}>
                {author?.displayName}
              </p>
              <p
                className='username'
                style={{ color: darkOptionsAndColors.color }}
              >
                @{author?.handle}
              </p>
              <Linkify componentDecorator={componentDecorator}>
                <p
                  className='description'
                  style={{ color: darkOptionsAndColors.color }}
                >
                  {author?.bio}
                </p>
              </Linkify>

              <FollowAuthor
                AuthorHandle={author?.handle || ''}
                Followers={user?.followersArray || undefined}
                user={user?.handle || ''}
                isPublication={false}
              />
            </div>


            <div className='statistic'>
              <div className='stat'>
                <p className='count'>{counts?.totalPostCount || 0}</p>
                <p className='title'>Articles</p>
              </div>
              <div className='stat'>
                <p className='count'>{counts?.totalViewCount || 0}</p>
                <p className='title'>Article Views</p>
              </div>
              <div className='stat'>
                <p className='count'>{counts?.uniqueClaps || 0}</p>
                <p className='title'>Claps</p>
              </div>
              <div className='stat'>
                <p className='count'>{userFollowersCount || 0}</p>
                <p className='title'>Followers</p>
              </div>
            </div>
            {(user?.publicationsArray.length || [].length) > 0 &&
              featureIsLive ? (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '100px',
                  marginBottom: '100px',
                }}
              >
                <p style={{ color: darkOptionsAndColors.color }}>
                  Linked as writer to the following Publications:
                </p>
                <br></br>
                <ul
                  style={{
                    listStyleType: 'none',
                  }}
                >
                  {(user?.publicationsArray || []).map((publication) => {
                    let avatar = '';
                    usersByHandles?.forEach((user) => {
                      if (user.handle == publication.publicationName) {
                        avatar = user.avatar;
                      }
                    });
                    return (
                      <li
                        key={publication.publicationName}
                        style={{ color: darkOptionsAndColors.color }}
                      >
                        <Row>
                          <Col>
                            <Link
                              to={`/${publication.publicationName}`}
                              style={{ color: darkOptionsAndColors.color }}
                            >
                              <p style={{ color: darkOptionsAndColors.color }}>
                                <img
                                  style={{ width: '30px' }}
                                  src={avatar || images.DEFAULT_AVATAR}
                                />
                                &nbsp; @{publication.publicationName}
                              </p>
                            </Link>
                          </Col>
                          <Col>
                            {publication.isEditor ? (
                              <p style={{ color: darkOptionsAndColors.color }}>
                                Editor
                              </p>
                            ) : (
                              <p style={{ color: darkOptionsAndColors.color }}>
                                Writer
                              </p>
                            )}
                          </Col>
                        </Row>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            <div style={{ marginTop: '50px' }}>
              <p className='pub-art'>
                PUBLISHED ARTICLES ({counts?.publishedCount || 0})
              </p>

              {screenWidth > 768 ? (
                <div
                  className='article-grid-horizontal'
                  style={{ margin: '50px -42px 50px 0' }}
                >
                  {(displayingPosts || []).map((post: any) => (
                    <CardHorizontal post={post} key={post.postId} />
                  ))}
                  {counts &&
                    !loading &&
                    parseInt(counts?.publishedCount) >
                    displayingPosts.length && (
                      <div className='load-more-container'>
                        <Button
                          styleType='secondary'
                          style={{ width: '152px' }}
                          onClick={() => loadMoreHandler()}
                          icon={
                            loadingMore ? images.loaders.BUTTON_SPINNER : ''
                          }
                        >
                          <span>Load More</span>
                        </Button>
                      </div>
                    )}
                  <Footer />
                </div>
              ) : (
                <div className='article-grid' style={{ margin: '0 0 0 -8px' }}>
                  {(displayingPosts || []).map((post: any) => (
                    <CardVertical post={post} key={post.postId} />
                  ))}
                  {counts &&
                    !loading &&
                    parseInt(counts?.publishedCount) >
                    displayingPosts.length && (
                      <div className='load-more-container'>
                        <Button
                          styleType='secondary'
                          style={{ width: '152px' }}
                          onClick={() => loadMoreHandler()}
                          icon={
                            loadingMore ? images.loaders.BUTTON_SPINNER : ''
                          }
                        >
                          <span>Load More</span>
                        </Button>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
