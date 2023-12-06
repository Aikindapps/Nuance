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
import SearchBar from '../../components/search-bar/search-bar';
import Loader from '../../UI/loader/Loader';
import { images, colors, icons } from '../../shared/constants';
import './publication-landing.scss';
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
import SearchList from '../../components/search-list/search-list';
import EmailOptIn from '../../components/email-opt-in/email-opt-in';
import { useTheme } from '../../contextes/ThemeContext';
import { Helmet } from 'react-helmet';

function PublicationLanding() {
  const darkTheme = useTheme();
  const ref = useRef<any>(null);
  const scrollToSearch = () => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    getAuthor,
    author,
    followers,
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

  const { getPublication, publication, clearAll, getPublicationError } =
    usePublisherStore((state) => ({
      getPublication: state.getPublication,
      publication: state.publication,
      clearAll: state.clearAll,
      getPublicationError: state.getPublicationError,
    }));

  const {
    getPostsByFollowers,
    postsByFollowers,
    clearPostsByFollowers,
    searchText,
    setSearchText,
    searchWithinPublication,
    searchResults,
    searchTotalCount,
    clearSearch,
    getAllTags,
    allTags,
    myTags,
    followTag,
    unfollowTag,
  } = usePostStore((state) => ({
    getPostsByFollowers: state.getPostsByFollowers,
    postsByFollowers: state.postsByFollowers,
    clearPostsByFollowers: state.clearPostsByFollowers,
    searchText: state.searchText,
    setSearchText: state.setSearchText,
    searchWithinPublication: state.searchWithinPublication,
    searchResults: state.searchResults,
    searchTotalCount: state.searchTotalCount,
    clearSearch: state.clearSearch,
    getAllTags: state.getAllTags,
    allTags: state.allTags,
    myTags: state.myTags,
    followTag: state.followTag,
    unfollowTag: state.unfollowTag,
  }));

  const featureIsLive = useContext(Context).publicationFeature;
  const refEmailOptIn = useRef<HTMLDivElement>(null);

  const [screenWidth, setScreenWidth] = useState(0);
  const [publicationHandle, setPublicationHandle] = useState('');
  const [loadMoreCounter, setLoadMoreCounter] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copyPublication, setCopyPublication] = useState(false);
  const [reportAuthor, setReportAuthor] = useState(false);
  const [isSidebarToggled, setSidebarToggle] = useState(false);
  const [loadingPublication, setLoadingPublication] = useState(true);
  const [publicationDoesNotExist, setPublicationDoesNotExist] = useState(false);
  const [publicationPostIds, setPublicationPostIds] = useState<string[]>([]);
  const [isBlur, setIsBlur] = useState(false);
  const [loadingSearchResults, setLoadingSearchResults] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoadMoreCounter, setSearchLoadMoreCounter] = useState(0);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [lastSearchPhrase, setLastSearchPhrase] = useState('');
  const [searchedTag, setSearchedTag] = useState<TagModel>();
  const [searchedPosts, setSearchedPosts] = useState<PostType[]>([]);
  const [updatingFollow, setUpdatingFollow] = useState(false);
  const [isFollowingTag, setIsFollowingTag] = useState(false);
  const [EmailOptInScroll, setEmailOptInScroll] = useState(true);

  const [displayingPosts, setDisplayingPosts] = useState<PostType[]>([]);
  const [initialPostsLoading, setInitialPostsLoading] = useState(false);

  useEffect(() => {
    //Check if publication exists
    if (getPublicationError && !loadingPublication) {
      setPublicationDoesNotExist(true);
    }
  }, [getPublicationError]);

  useEffect(() => {
    //Check if publication loading
    if (publication !== undefined) {
      setLoadingPublication(false);
    }
  }, [publication]);

  const getPublicationHandleFromUrl = () => {
    if (
      window.location.pathname.includes('subscription') &&
      window.location.pathname.includes('FastBlocks')
    ) {
      if (screenWidth > 1089) {
        refEmailOptIn.current?.scrollIntoView({ behavior: 'smooth' });
      }
      return 'FastBlocks';
    } else {
      return window.location.pathname.substring(
        window.location.pathname.lastIndexOf('/') + 1
      );
    }
  };


  useEffect(() => {
    window.scrollTo(0, 0);
    const handleName = getPublicationHandleFromUrl();
    clearAll();
    getUser();
    setPublicationHandle(handleName);
    getPublication(handleName);
    getAuthor(handleName);
    getUserPostCounts(handleName);
    getUserFollowersCount(handleName);
    loadInitial(handleName);
    clearPostsByFollowers();
    getAllTags();
    clearSearch();
  }, []);

  useEffect(
    (window.onresize = window.onload =
      () => {
        setScreenWidth(window.innerWidth);
      }),
    [screenWidth]
  );

  useEffect(() => {
    if (searchResults) {
      setSearchedPosts([...searchedPosts, ...searchResults]);
      setLoadingSearchResults(false);
      setSearchLoadingMore(false);
    }
  }, [searchResults]);

  useEffect(() => {
    if (searchText !== lastSearchPhrase) {
      setSearchLoadMoreCounter(0);
    }
  }, [searchText]);

  useEffect(() => {
    if (searchedTag) {
      const found = myTags?.find((t: any) => t.tagId === searchedTag?.id);
      setIsFollowingTag(!!found);
    } else {
      setIsFollowingTag(false);
    }
  }, [searchedTag, myTags]);

  useEffect(() => {
    setUpdatingFollow(false);
  }, [myTags]);

  const loadMoreHandler = async () => {
    setLoadingMore(true);
    let posts = await getPostsByFollowers(
      [publicationHandle],
      (loadMoreCounter - 1) * 8 + 8,
      7 + loadMoreCounter * 8
    );
    if (posts?.length) {
      setDisplayingPosts([...displayingPosts, ...posts]);
    }
    setLoadMoreCounter(loadMoreCounter + 1);
    setLoadingMore(false);
  };

  const loadInitial = async (handle: string) => {
    setInitialPostsLoading(true);
    setTimeout(() => {
      setInitialPostsLoading(false);
    }, 5000)
    let posts = await getPostsByFollowers([handle], 0, 7);
    if (posts?.length) {
      setDisplayingPosts(posts);
    }
    setInitialPostsLoading(false);
  };

  const onKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      setIsBlur(false);
      scrollToSearch();
      setLoadingSearchResults(true);
      handleSearch(false);
    }
  };

  const searchTextToTag = (s: string) => {
    const tagNames = [...s.matchAll(/#[^#]+/gm)].map((x) =>
      x[0].trim().replace(/ +/g, ' ')
    );
    let validTagNames: TagModel[] = [];
    for (const tagName of tagNames) {
      if (tagName.startsWith('#') && tagName.length > 1) {
        const found = allTags?.find(
          (t: any) =>
            t.value.toUpperCase() === tagName.substring(1).toUpperCase()
        );
        if (found) {
          validTagNames.push(found);
        }
      }
    }
    return validTagNames;
  };

  const handleSearch = async (loadingMore: boolean) => {
    if (loadingSearchResults) {
      return;
    }
    if (!loadingMore) {
      setSearchedPosts([]);
    }
    let phrase = searchText.trim();
    if (phrase) {
      // If search starts with #, it's a tag search like #sports
      const tags = searchTextToTag(phrase);
      let isTagSearch = tags.length > 0;
      if (isTagSearch) {
        setSearchedTag(tags[0]);
        phrase = tags[0].value;
      } else {
        setSearchedTag(undefined);
      }
      if (loadingMore) {
        searchWithinPublication(
          phrase,
          isTagSearch,
          searchLoadMoreCounter * 20,
          (searchLoadMoreCounter + 1) * 20,
          publicationPostIds,
          user
        );
        setSearchLoadMoreCounter(searchLoadMoreCounter + 1);
      } else {
        searchWithinPublication(
          phrase,
          isTagSearch,
          0,
          20,
          publicationPostIds,
          user
        );
        setSearchLoadMoreCounter(1);
      }
      setLastSearchPhrase(searchText);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
      setSearchedTag(undefined);
      clearSearch();
    }
  };

  const handleSearchMore = () => {
    setSearchLoadingMore(true);
    handleSearch(true);
  };

  const handleShowSearchResults = () => {
    clearSearch();
    setShowSearchResults(false);
  };

  const handleFollowClicked = () => {
    // prevent clicks while button spinner is visible
    if (updatingFollow) {
      return;
    }

    if (searchedTag) {
      setUpdatingFollow(true);
      if (isFollowingTag) {
        unfollowTag(searchedTag.id);
      } else {
        followTag(searchedTag.id);
      }
    }

    // remove button spinner after 5 seconds
    // in case the canister returns an error
    setTimeout(() => {
      setUpdatingFollow(false);
    }, 10000);
  };

  if (publicationDoesNotExist || loadingPublication || featureIsLive == false) {
    return (
      <div>
        <Header
          loggedIn={isLoggedIn}
          isArticlePage={false}
          ScreenWidth={screenWidth}
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
                : 'This publication no longer exists or you have entered the wrong handle!'}
            </h2>
          </div>
        )}
      </div>
    );
  }

  if (
    !publication?.publicationHandle ||
    publication.publicationHandle.toLowerCase() !==
    getPublicationHandleFromUrl().toLowerCase()
  ) {
    return (
      <div style={{ background: darkOptionsAndColors.background }}>
        <Header
          loggedIn={isLoggedIn}
          isArticlePage={false}
          ScreenWidth={screenWidth}
          isPublicationPage={true}
        />
        <div className='publication-loader'>
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: darkOptionsAndColors.background,
        color: darkOptionsAndColors.color,
      }}
    >
      <Header
        loggedIn={!!user}
        isArticlePage={false}
        ScreenWidth={screenWidth}
        isPublicationPage={true}
        publication={publication}
      />
      <div onFocus={() => setIsBlur(true)} onBlur={() => setIsBlur(false)}>
        <SearchBar
          value={searchText}
          onKeyDown={onKeyDown}
          onChange={(value) => setSearchText(value)}
          color={publication?.styling.primaryColor}
        />
      </div>
      <div
        className={
          isBlur
            ? 'publication-landing-wrapper blurred'
            : 'publication-landing-wrapper'
        }
      >
        <div className={isSidebarToggled ? 'left scrolled' : 'left'}>
          <div className='left-content'>
            {publication?.styling.logo.length ? (
              <img
                style={
                  !isSidebarToggled && screenWidth <= 1089
                    ? {
                      marginRight: '180px',
                      width: '150px',
                      height: '47.5px',
                    }
                    : {
                      marginRight: '15px',
                      width: '150px',
                      height: '47.5px',
                    }
                }
                className='brand-logo-left'
                src={publication?.styling.logo}
              />
            ) : null}
            <div className='link-report'>
              <div style={{ alignItems: 'flex-end' }}>
                {screenWidth <= 1089 ? (
                  <PublicationSidebarMobile
                    handle={publication?.publicationHandle}
                    isSidebarToggle={setSidebarToggle}
                    dark={darkTheme}
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
                    marginBottom: '32px',
                    marginTop: '32px',
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

              <div className='publication-email-opt-in' ref={refEmailOptIn}>
                {/* Change to FB handle when FB publication is established */}
                {screenWidth > 1089 && publicationHandle == 'FastBlocks' ? (
                  <EmailOptIn
                    mobile={screenWidth < 1089}
                    publictionHandle={publicationHandle}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className='right'>
          <div className='header-image-container'>
            <img src={`${publication?.headerImage}`} className='header-img' />

            <div className='nuance-publication'>A NUANCE PUBLICATION</div>
            <div className='publication-name'>
              {publication?.publicationTitle}
            </div>
            <div className='publication-subtitle'>{publication?.subtitle}</div>
            <div className='publication-handle'>
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
            {showSearchResults ? (
              <SearchList
                posts={searchedPosts}
                loading={loadingSearchResults}
                loadingMore={searchLoadingMore}
                loadMoreHandler={handleSearchMore}
                totalCount={searchTotalCount}
                searchedTag={searchedTag}
                lastSearchPhrase={lastSearchPhrase}
                setShowResults={handleShowSearchResults}
                user={user}
                publicationName={publication?.publicationTitle}
                publicationHandle={publication?.publicationHandle}
                isFollowingTag={isFollowingTag}
                updatingFollow={updatingFollow}
                handleFollowClicked={handleFollowClicked}
              />
            ) : (
              <ArticleList
                displayingPosts={displayingPosts}
                loading={initialPostsLoading}
                loadMoreHandler={loadMoreHandler}
                loadingMore={loadingMore}
                categoryName={'LATEST'}
                totalPostCount={userPostCounts?.publishedCount}
                mobile={screenWidth < 1089}
                screenwidth={screenWidth}
                publicationName={publication?.publicationTitle}
                emailOptInRef={refEmailOptIn}
                publication={publication}
              />
            )}
          </div>
          <div className='footer'>
            <Footer />
          </div>
        </div>
      </div >
    </div >
  );
}

export default PublicationLanding;
