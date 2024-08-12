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
import SubscriptionCta from '../../components/subscription-cta/subscription-cta';
import SubscriptionModal from '../../components/subscription-modal/subscription-modal';
import { Context as ModalContext } from '../../contextes/ModalContext';
import CancelSubscriptionModal from '../../components/cancel-subscription-modal/cancel-subscription-modal';
import {
  ReaderSubscriptionDetailsConverted,
  WriterSubscriptionDetailsConverted,
  useSubscriptionStore,
} from '../../store/subscriptionStore';
import { searchTextToTag } from '../../shared/utils';

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

  const modalContext = useContext(ModalContext);

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

  const {
    getPublication,
    publication,
    clearAll,
    getPublicationError,
    getCanisterIdByHandle,
  } = usePublisherStore((state) => ({
    getPublication: state.getPublication,
    publication: state.publication,
    clearAll: state.clearAll,
    getPublicationError: state.getPublicationError,
    getCanisterIdByHandle: state.getCanisterIdByHandle,
  }));

  const {
    getPostsByFollowers,
    clearPostsByFollowers,
    searchWithinPublication,
    getAllTags,
    myTags,
    followTag,
    unfollowTag,
  } = usePostStore((state) => ({
    getPostsByFollowers: state.getPostsByFollowers,
    clearPostsByFollowers: state.clearPostsByFollowers,
    searchWithinPublication: state.searchWithinPublication,
    getAllTags: state.getAllTags,
    myTags: state.myTags,
    followTag: state.followTag,
    unfollowTag: state.unfollowTag,
  }));

  const {
    getMySubscriptionHistoryAsReader,
    getWriterSubscriptionDetailsByPrincipalId,
  } = useSubscriptionStore((state) => ({
    getMySubscriptionHistoryAsReader: state.getMySubscriptionHistoryAsReader,
    getWriterSubscriptionDetailsByPrincipalId:
      state.getWriterSubscriptionDetailsByPrincipalId,
  }));

  const featureIsLive = useContext(Context).publicationFeature;
  const refEmailOptIn = useRef<HTMLDivElement>(null);

  const [screenWidth, setScreenWidth] = useState(0);
  const [publicationHandle, setPublicationHandle] = useState('');
  const [publicationCanisterId, setPublicationCanisterId] = useState('');
  const [loadMoreCounter, setLoadMoreCounter] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copyPublication, setCopyPublication] = useState(false);
  const [reportAuthor, setReportAuthor] = useState(false);
  const [isSidebarToggled, setSidebarToggle] = useState(false);
  const [loadingPublication, setLoadingPublication] = useState(true);
  const [publicationDoesNotExist, setPublicationDoesNotExist] = useState(false);
  const [isBlur, setIsBlur] = useState(false);
  const [loadingSearchResults, setLoadingSearchResults] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoadMoreCounter, setSearchLoadMoreCounter] = useState(0);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [lastSearchPhrase, setLastSearchPhrase] = useState('');
  const [searchTotalCount, setSearchTotalCount] = useState(0);
  const [allTags, setAllTags] = useState<TagModel[]>([]);
  const [searchedTag, setSearchedTag] = useState<TagModel>();
  const [searchedPosts, setSearchedPosts] = useState<PostType[]>([]);
  const [updatingFollow, setUpdatingFollow] = useState(false);
  const [isFollowingTag, setIsFollowingTag] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

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

  const [isExpiring, setIsExpiring] = useState<boolean>(false);

  const handleSubscriptionComplete = () => {
    setSidebarToggle(false);
  };

  const handleCancelSubscription = () => {
    console.log('cancel');
  };

  useEffect(() => {
    const fetchSubscriptionHistory = async () => {
      if (isLoggedIn) {
        try {
          let history = await getMySubscriptionHistoryAsReader();

          if (history) {
            let isSubscribed = history.activeSubscriptions.some(
              (subscription) => {
                return subscription.userListItem.handle === author?.handle;
              }
            );

            if (!isSubscribed) {
              isSubscribed = history.expiredSubscriptions.some(
                (subscription) => {
                  return (
                    subscription.userListItem.handle === author?.handle &&
                    subscription.subscriptionEndDate > Date.now()
                  );
                }
              );
            }

            setSubscribed(isSubscribed);
          }
        } catch (error) {
          console.log('Error getting subscription history', error);
        }
      }
    };

    fetchSubscriptionHistory();
  }, [
    isLoggedIn,
    author?.handle,
    user?.handle,
    handleSubscriptionComplete,
    handleCancelSubscription,
  ]);

  const [hasValidSubscriptionOptions, setHasValidSubscriptionOptions] =
    useState<boolean>(false);
  //get subscription details
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (publicationCanisterId) {
        try {
          let subscriptionDetails =
            await getWriterSubscriptionDetailsByPrincipalId(
              publicationCanisterId
            );
          if (
            (subscriptionDetails &&
              subscriptionDetails?.weeklyFee.length > 0) ||
            (subscriptionDetails &&
              subscriptionDetails?.monthlyFee.length > 0) ||
            (subscriptionDetails &&
              subscriptionDetails?.annuallyFee.length > 0) ||
            (subscriptionDetails && subscriptionDetails?.lifeTimeFee.length > 0)
          ) {
            setHasValidSubscriptionOptions(true);
          } else {
            setHasValidSubscriptionOptions(false);
          }
        } catch (error) {
          console.log('Error fetching subscription details', error);
        }
      }
    };
    fetchSubscriptionDetails();
  }, [publicationCanisterId]);

  function checkExpiringSubscriptions(
    subscriptionHistory: ReaderSubscriptionDetailsConverted,
    authorHandle: string
  ) {
    const currentTime = Date.now();
    const { expiredSubscriptions } = subscriptionHistory;

    const isExpiring = expiredSubscriptions.some((subscription) => {
      return (
        subscription.userListItem.handle === authorHandle &&
        subscription.subscriptionEndDate > currentTime
      );
    });

    return isExpiring;
  }

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
    getCanisterIdByHandle(handleName).then((canisterId) => {
      setPublicationCanisterId(canisterId || '');
    });
  }, []);

  useEffect(
    (window.onresize = window.onload =
      () => {
        setScreenWidth(window.innerWidth);
      }),
    [screenWidth]
  );

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
    let posts = (
      await getPostsByFollowers(
        [publicationHandle],
        (loadMoreCounter - 1) * 8 + 8,
        8 + loadMoreCounter * 8
      )
    ).posts;
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
    }, 5000);
    let posts = (await getPostsByFollowers([handle], 0, 8)).posts;
    if (posts?.length) {
      setDisplayingPosts(posts);
    }
    setInitialPostsLoading(false);
  };

  const onKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      setIsBlur(false);
      scrollToSearch();
      handleSearch();
    }
  };

  const handleSearch = async () => {
    if (loadingSearchResults || !publication) {
      return;
    }
    if (
      searchTotalCount <= searchedPosts.length &&
      lastSearchPhrase === searchText &&
      showSearchResults
    ) {
      return;
    }
    setLoadingSearchResults(true);
    let all_tags: TagModel[] = [];
    //load the allTags only once
    if (allTags.length === 0) {
      all_tags = await getAllTags();
      setAllTags(all_tags);
    } else {
      all_tags = allTags;
    }
    let phrase = searchText.trim();
    // If search starts with #, it's a tag search like #sports
    const tags = searchTextToTag(phrase, all_tags);
    let isTagSearch = tags.length > 0;
    if (isTagSearch) {
      //setSearchedTag(tags[0]);
      phrase = tags[0].value;
    } else {
      //setSearchedTag(undefined);
    }
    if (phrase) {
      let { totalCount, posts } = await searchWithinPublication(
        phrase,
        isTagSearch,
        searchLoadMoreCounter * 20,
        (searchLoadMoreCounter + 1) * 20,
        publication.publicationHandle,
        undefined
      );
      setLastSearchPhrase(searchText);
      setSearchLoadMoreCounter(searchLoadMoreCounter + 1);
      setSearchTotalCount(totalCount);
      if (lastSearchPhrase === searchText) {
        setSearchedPosts([...searchedPosts, ...posts]);
      } else {
        setSearchedPosts(posts);
      }

      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
      setSearchedTag(undefined);
    }
    setLoadingSearchResults(false);
  };

  const closeMenus = () => {
    setSidebarToggle(false);
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
          style={{ margin: '20px auto 50px auto' }}
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
                        display: 'none',
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
              {!subscribed && hasValidSubscriptionOptions && isLoggedIn && (
                <div className='Subscription-container'>
                  <SubscriptionCta onOpen={() => closeMenus()} />
                </div>
              )}

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
          {modalContext?.isModalOpen &&
            modalContext?.modalType === 'Subscription' && (
              <SubscriptionModal
                handle={publication?.publicationHandle}
                authorPrincipalId={publicationCanisterId}
                profileImage={publication?.avatar}
                isPublication={true}
                onSubscriptionComplete={() => {
                  handleSubscriptionComplete();
                }}
              />
            )}

          {modalContext?.isModalOpen &&
            modalContext?.modalType === 'cancelSubscription' && (
              <CancelSubscriptionModal
                handle={publication?.publicationHandle}
                profileImage={publication?.avatar}
                isPublication={true}
                onCancelComplete={() => {
                  handleSubscriptionComplete();
                }}
                authorPrincipalId={publicationCanisterId}
              />
            )}

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
                loadMoreHandler={handleSearch}
                totalCount={searchTotalCount}
                searchedTag={searchedTag}
                lastSearchPhrase={lastSearchPhrase}
                setShowResults={() => {
                  setShowSearchResults(false);
                  setLoadMoreCounter(0);
                  setSearchText('');
                  setSearchedPosts([]);
                }}
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
      </div>
    </div>
  );
}

export default PublicationLanding;
