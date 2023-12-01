import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  useAuthStore,
  useUserStore,
  usePostStore,
  usePublisherStore,
} from '../../store';
import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';
import Loader from '../../UI/loader/Loader';
import { images, colors, icons } from '../../shared/constants';
import CopyPublication from '../../UI/copy-publication/copy-publication';
import ReportAuthorMenu from '../../UI/report-author/report-author';
import FollowAuthor from '../../components/follow-author/follow-author';
import PublicationCategoriesMenu from '../../components/publication-categories-menu/publication-categories-menu';
import ArticleList from '../../components/article-list/article-list';
import PublicationProfile from '../../components/publication-profile/publication-profile';
import PublicationSidebarMobile from '../../UI/publication-sidebar-mobile/publication-sidebar-mobile';
import { Context } from '../../contextes/Context';
import { PostType } from '../../types/types';
import { TagModel } from '../../services/actorService';
import ArticleListCategoryLanding from '../../components/article-list-category-landing/article-list-category-landing';
import './_category-landing.scss';
import { useTheme } from '../../contextes/ThemeContext';

function CategoryLanding() {
  const ref = useRef<any>(null);
  const scrollToSearch = () => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const darkTheme = useTheme();
  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
  };

  const { isLoggedIn, redirect, redirectScreen } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    redirect: state.redirect,
    redirectScreen: state.redirectScreen,
  }));

  const {
    user,
    getUser,
    unregistered,
    getUserPostCounts,
    userPostCounts,
    getUserFollowersCount,
    userFollowersCount,
  } = useUserStore((state) => ({
    user: state.user,
    getUser: state.getUser,
    unregistered: state.unregistered,
    getUserPostCounts: state.getUserPostCounts,
    userPostCounts: state.userPostCounts,
    getAuthor: state.getAuthor,
    author: state.author,
    followers: state.followers,
    userFollowersCount: state.userFollowersCount,
    getUserFollowersCount: state.getUserFollowersCount,
  }));

  const { getPublication, publication } = usePublisherStore((state) => ({
    getPublication: state.getPublication,
    publication: state.publication,
  }));

  const {
    getPostsByCategory,
    postsByCategory,
    clearPostsByCategory,
    postsByCategoryTotalCount,
  } = usePostStore((state) => ({
    getPostsByCategory: state.getPostsByCategory,
    postsByCategory: state.postsByCategory,
    clearPostsByCategory: state.clearPostsByCategory,
    postsByCategoryTotalCount: state.postsByCategoryTotalCount,
  }));

  const featureIsLive = useContext(Context).publicationFeature;

  const [screenWidth, setScreenWidth] = useState(0);
  const [publicationHandle, setPublicationHandle] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryNameNotTrimmed, setCategoryNameNotTrimmed] = useState('');
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadMoreCounter, setLoadMoreCounter] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copyPublication, setCopyPublication] = useState(false);
  const [reportAuthor, setReportAuthor] = useState(false);
  const [isSidebarToggled, setSidebarToggle] = useState(false);
  const [loadingPublication, setLoadingPublication] = useState(true);
  const [publicationDoesNotExist, setPublicationDoesNotExist] = useState(false);
  const [displayingPosts, setDisplayingPosts] = useState<PostType[]>([]);

  useEffect(() => {
    //Check if publication exists
    const current_location = window.location.pathname;
    if (
      publication !== undefined &&
      publication?.publicationHandle.toLowerCase() !==
      current_location
        .substring(13, current_location.lastIndexOf('/'))
        .toLowerCase()
    ) {
      setPublicationDoesNotExist(true);
    }
  }, [publication]);

  useEffect(() => {
    //Check if publication loading
    if (publication !== undefined) {
      setLoadingPublication(false);
    }
  }, [publication]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const current_location = window.location.pathname;

    const handleName = current_location.substring(
      13,
      current_location.lastIndexOf('/')
    );
    const categoryName = current_location.substring(
      current_location.lastIndexOf('/') + 1
    );
    getUser();
    setPublicationHandle(handleName);
    setCategoryName(categoryName);
    getPublication(handleName);
    getUserPostCounts(handleName);
    getUserFollowersCount(handleName);
    loadInitial(handleName, categoryName);
    clearPostsByCategory();
  }, []);

  useEffect(
    (window.onresize = window.onload =
      () => {
        setScreenWidth(window.innerWidth);
      }),
    [screenWidth]
  );

  useEffect(() => {
    clearAll();
    window.scrollTo(0, 0);
    const current_location = window.location.pathname;
    const categoryName = current_location.substring(
      current_location.lastIndexOf('/') + 1
    );
    setCategoryName(categoryName);
    loadInitial(publicationHandle, categoryName);
  }, [window.location.pathname]);

  useEffect(() => {
    var controller = true;
    publication?.categories.forEach((categoryFullName) => {
      if (trim_category_name(categoryFullName) === categoryName) {
        setCategoryNameNotTrimmed(categoryFullName);
        controller = false;
      }
    });
    if (controller) {
      setCategoryNameNotTrimmed(categoryName);
    }
  }, [categoryName]);

  const clearAll = () => {
    setCategoryName('');
    setLoadMoreCounter(1);
    setLoadingMore(false);
    setPublicationDoesNotExist(false);
    setDisplayingPosts([]);
    setPostsLoading(true);
    clearPostsByCategory();
  };

  const loadMoreHandler = async () => {
    setLoadingMore(true);
    let posts = await getPostsByCategory(
      publicationHandle,
      categoryName,
      (loadMoreCounter - 1) * 8 + 8,
      7 + loadMoreCounter * 8
    );
    if (posts?.length) {
      setDisplayingPosts([...displayingPosts, ...posts]);
    }
    setLoadMoreCounter(loadMoreCounter + 1);
    setLoadingMore(false);
  };

  const loadInitial = async (handle: string, category: string) => {
    setPostsLoading(true);
    setTimeout(() => {
      setPostsLoading(false);
    }, 5000);
    let posts = await getPostsByCategory(handle, category, 0, 7);
    if (posts?.length) {
      setDisplayingPosts(posts);
    }
    setPostsLoading(false);
  };

  const trim_category_name = (name: string) => {
    return name
      .split('')
      .map((char) => {
        if (char === ' ') {
          return '-';
        } else {
          return char.toLowerCase();
        }
      })
      .join('');
  };

  const getMarginLeft = () => {
    if (isSidebarToggled && screenWidth < 271) {
      return { marginLeft: '80vw' };
    } else if (isSidebarToggled && screenWidth < 291) {
      return { marginLeft: '60vw' };
    } else if (isSidebarToggled && screenWidth < 311) {
      return { marginLeft: '52vw' };
    } else if (isSidebarToggled && screenWidth < 335) {
      return { marginLeft: '40vw' };
    } else if (isSidebarToggled && screenWidth < 363) {
      return { marginLeft: '32vw' };
    } else if (isSidebarToggled && screenWidth < 383) {
      return { marginLeft: '24vw' };
    } else if (isSidebarToggled && screenWidth < 433) {
      return { marginLeft: '16vw' };
    }
    return {};
  };

  if (
    publicationDoesNotExist ||
    publication?.categories.length == 0 ||
    loadingPublication ||
    featureIsLive == false
  ) {
    return (
      <div style={{ background: darkOptionsAndColors.background }}>
        <Header
          loggedIn={isLoggedIn}
          isArticlePage={false}
          ScreenWidth={screenWidth}
          tokens={user?.nuaTokens}
          loading={false}
          isPublicationPage={true}
        />

        {loadingPublication ? (
          <div className='publication-loader'>
            <Loader />
          </div>
        ) : (
          <div style={{ display: 'block', margin: '0 auto', width: '700px' }}>
            <h2
              style={{
                marginTop: '50px',
                color: colors.darkerBorderColor,
                textAlign: 'center',
              }}
            >
              {featureIsLive == false
                ? 'This feature is not yet live! Stay tuned...'
                : 'This category or publication no longer exists or you have entered the wrong handle!'}
            </h2>
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ background: darkOptionsAndColors.background }}>
      <Header
        loggedIn={!!user}
        isArticlePage={false}
        ScreenWidth={screenWidth}
        tokens={user?.nuaTokens}
        loading={false}
        isPublicationPage={true}
        category={categoryNameNotTrimmed}
        publication={publication}
      />
      <div className={'publication-landing-wrapper'}>
        <div
          className={
            isSidebarToggled ? 'left scrolled category-left-scrolled' : 'left'
          }
        >
          <div className='left-content' style={{ marginTop: '88px' }}>
            <div className='link-report'>
              <div style={{ alignItems: 'flex-end' }}>
                {screenWidth <= 1089 ? (
                  <PublicationSidebarMobile
                    handle={publication?.publicationHandle}
                    isSidebarToggle={setSidebarToggle}
                  />
                ) : null}
              </div>
            </div>
            <div className='left-sidebar'>
              {screenWidth > 1089 ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignSelf: 'end',
                    marginBottom: '10px',
                  }}
                >
                  <CopyPublication
                    shown={copyPublication}
                    setShown={setCopyPublication}
                    handle={publication?.publicationHandle}
                    dark={darkTheme}
                  />
                  <ReportAuthorMenu
                    shown={reportAuthor}
                    setShown={setReportAuthor}
                    isPublication={true}
                    dark={darkTheme}
                  />
                </div>
              ) : null}
              <div className='publication-categories'>
                <PublicationCategoriesMenu
                  displayName={publication?.publicationTitle}
                  categories={publication?.categories}
                  selectedCategory={categoryName}
                  publicationHandle={publicationHandle}
                  color={publication?.styling.primaryColor}
                  dark={darkTheme}
                />
              </div>
              <PublicationProfile
                publication={publication}
                postCount={userPostCounts?.publishedCount}
                followerCount={userFollowersCount}
                dark={darkTheme}
              />
              <div className='follow-publication-button'>
                <FollowAuthor
                  AuthorHandle={publication?.publicationHandle || ''}
                  Followers={user?.followersArray || undefined}
                  user={user?.handle || ''}
                  isPublication={true}
                  primaryColor={publication?.styling.primaryColor}
                />
              </div>
            </div>
          </div>
        </div>
        <div className='right'>
          <div className='header-image-container' style={{ marginTop: '80px' }}>
            <img
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
              src={`${publication?.headerImage}`}
            />
            <div className='nuance-publication'>A NUANCE PUBLICATION</div>
            <div className='publication-name-category'>
              {publication?.publicationTitle}
            </div>
            <div className='publication-handle-category'>
              <span>
                <img
                  style={{ width: '35px', padding: '5px', borderRadius: '50%' }}
                  src={`${publication?.avatar}` || images.DEFAULT_AVATAR}
                />
                <img
                  src={icons.PUBLICATION_ICON}
                  alt='publication-icon'
                  className='publication-header-icon'
                />

              </span>
              <span className='at-handle'>@</span>
              {publication?.publicationHandle}
            </div>
          </div>
          <div ref={ref}>
            <ArticleListCategoryLanding
              loading={postsLoading}
              posts={displayingPosts}
              loadMoreHandler={loadMoreHandler}
              loadingMore={loadingMore}
              totalPostCount={userPostCounts?.publishedCount}
              categoryPostCount={postsByCategoryTotalCount}
              categoryName={categoryNameNotTrimmed}
              writersCount={publication?.writers.length}
              validCategory={publication?.categories.includes(
                categoryNameNotTrimmed
              )}
              publicationHandle={publicationHandle}
            />
          </div>
          <div className='footer'>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryLanding;
