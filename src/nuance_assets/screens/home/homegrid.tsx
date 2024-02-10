import React, { useState, useEffect, useContext, Suspense, lazy } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useUserStore, usePostStore } from '../../store';
import { PostType } from '../../types/types';
import { colors, icons, images } from '../../shared/constants';
import { TagModel } from 'src/nuance_assets/services/actorService';
import { slice } from 'lodash';
import { useTheme } from '../../contextes/ThemeContext';
import { Context } from '../../contextes/Context';
import { Context as ModalContext } from '../../contextes/ModalContext';
import SearchResults from '../../components/search-results/search-results';

const Header = lazy(() => import('../../components/header/header'));
const Footer = lazy(() => import('../../components/footer/footer'));
const SearchBar = lazy(() => import('../../components/search-bar/search-bar'));
const CardVertical = lazy(
  () => import('../../components/card-vertical/card-vertical')
);
const CardHorizontal = lazy(
  () => import('../../components/card-horizontal/card-horizontal')
);
const MeatBallSidebar = lazy(
  () => import('../../UI/meatball-sidebar/meatball-sidebar')
);
const Button = lazy(() => import('../../UI/Button/Button'));
const LoggedOutSidebar = lazy(
  () => import('../../components/logged-out-sidebar/logged-out-sidebar')
);
const Loader = lazy(() => import('../../UI/loader/Loader'));
const NavTabs = lazy(() => import('../../components/nav-tabs/nav-tabs'));

const HomePageGrid = () => {
  const navigate = useNavigate();
  const darkTheme = useTheme() as boolean;
  const searchPageSize = 20;
  const context = useContext(Context);
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
    getCounts,
    counts,
    getAuthor,
    author,
    searchUserResults,
    searchPublicationResults,
    searchUsers,
    searchPublications,
  } = useUserStore((state) => ({
    user: state.user,
    getUser: state.getUser,
    unregistered: state.unregistered,
    getCounts: state.getUserPostCounts,
    counts: state.userPostCounts,
    getAuthor: state.getAuthor,
    author: state.author,
    searchUserResults: state.searchUserResults,
    searchPublicationResults: state.searchPublicationResults,
    searchUsers: state.searchUsers,
    searchPublications: state.searchPublications,
  }));

  const {
    getLatestPosts,
    getMoreLatestPosts,
    latestPosts,
    moreLatestPosts,
    postsByFollowers,
    getPopularPosts,
    getPopularPostsToday,
    getPopularPostsThisWeek,
    getPopularPostsThisMonth,
    getPostsByFollowers,
    clearPostsByFollowers,
    setSearchText,
    search,
    populateTags,
    clearSearch,
    searchText,
    searchResults,
    postResults,
    searchTotalCount,
    postTotalCount,
    followTag,
    unfollowTag,
    getAllTags,
    getMyTags,
    allTags,
    myTags,
    clearSearchBar,
    isTagScreen,
  } = usePostStore((state) => ({
    clearSearchBar: state.clearSearchBar,
    isTagScreen: state.isTagScreen,
    getLatestPosts: state.getLatestPosts,
    latestPosts: state.latestPosts,
    getMoreLatestPosts: state.getMoreLatestPosts,
    moreLatestPosts: state.moreLatestPosts,
    postsByFollowers: state.postsByFollowers,
    getPostsByFollowers: state.getPostsByFollowers,
    clearPostsByFollowers: state.clearPostsByFollowers,
    getPopularPosts: state.getPopularPosts,
    getPopularPostsToday: state.getPopularPostsToday,
    getPopularPostsThisWeek: state.getPopularPostsThisWeek,
    getPopularPostsThisMonth: state.getPopularPostsThisMonth,

    setSearchText: state.setSearchText,
    search: state.search,
    populateTags: state.populateTags,
    clearSearch: state.clearSearch,
    searchText: state.searchText,
    searchResults: state.searchResults,
    postResults: state.postResults,
    searchTotalCount: state.searchTotalCount,
    postTotalCount: state.postTotalCount,
    followTag: state.followTag,
    unfollowTag: state.unfollowTag,
    getAllTags: state.getAllTags,
    getMyTags: state.getMyTags,
    myTags: state.myTags,
    allTags: state.allTags,
  }));

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastSearchPhrase, setLastSearchPhrase] = useState('');
  const [screenWidth, setScreenWidth] = useState(0);
  const [isBlur, setIsBlur] = useState(false);

  const [indexFrom, setIndexFrom] = useState(0);
  const [indexTo, setIndexTo] = useState(searchPageSize - 1);
  const [loadedSearchResults, setLoadedSearchResults] = useState<PostType[]>(
    []
  );

  const [searchedTag, setSearchedTag] = useState<TagModel>();
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isFollowingTag, setIsFollowingTag] = useState(false);
  const [updatingFollow, setUpdatingFollow] = useState(false);

  const [timeFrame, setTimeFrame] = useState('This week');
  const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);
  const timeFrames = ['Today', 'This week', 'This month', 'Ever'];
  const [searchType, setSearchType] = useState<string>('Articles');

  useEffect(() => {
    window.scrollTo(0, 0);
    clearPostsByFollowers();
    getUser();
    getAllTags();
    getMyTags();
    clearSearch();
    if (searchText) {
      handleSearch();
    } else {
      setSlice1([]);
      setSlice2([]);
      setSlice3([]);
      setPage(1);
      handlePopularTab(timeFrame);
      getLatestPosts(0, 20);
    }
  }, []);

  useEffect(() => {
    if (user) {
      getCounts(user.handle);
    }
  }, [user]);

  useEffect(() => {
    if (searchText.trim().length == 0) {
      clearSearch();
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

  useEffect(() => {
    if (searchResults?.length) {
      let updatedResults: PostType[] = [];

      if (indexFrom > 0) {
        const uniqueSearchResults = (searchResults || []).filter(
          (r: any) => !loadedSearchResults.find((lr) => lr.postId === r.postId)
        );
        updatedResults = [...loadedSearchResults, ...uniqueSearchResults];
      } else {
        updatedResults = searchResults;
      }

      setLoadedSearchResults(updatedResults);
      setIndexFrom(updatedResults.length);
      setIndexTo(updatedResults.length + searchPageSize - 1);
    }

    if (searchResults !== undefined) {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchResults]);

  useEffect(() => {
    // If the user tried to login with a child
    // component, and registerUser returned an error,
    // the user needs to register first.
    if (isLoggedIn && !user && unregistered && latestPosts) {
      navigate('/register', { replace: true });
    }
  }, [isLoggedIn, user, unregistered]);

  useEffect(
    (window.onresize = window.onload =
      () => {
        setScreenWidth(window.innerWidth);
      }),
    [screenWidth]
  );

  const resetPageIndexes = () => {
    setIndexFrom(0);
    setIndexTo(searchPageSize - 1);
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

  const handleSearch = async () => {
    setTab('search');
    let phrase = searchText.trim();
    if (phrase) {
      setLoading(true);

      setLoadedSearchResults([]);
      resetPageIndexes();

      // If search starts with #, it's a tag search like #sports
      const tags = searchTextToTag(phrase);
      let isTagSearch = tags.length > 0;
      if (isTagSearch) {
        setSearchedTag(tags[0]);
        phrase = tags[0].value;
      } else {
        setSearchedTag(undefined);
      }

      resetPageIndexes();
      await Promise.all([
        search(phrase, isTagSearch, 0, 10000, user),
        searchPublications(phrase),
        searchUsers(phrase),
      ]);

      setLastSearchPhrase(phrase); //not bound to input
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
      setSearchedTag(undefined);
      clearSearch();
    }
  };

  const loadMoreVisible = () => {
    if (slice1 && slice2) {
      switch (tab) {
        case 'popular':
          switch (timeFrame) {
            case 'Today':
              return (
                popularPostsTodayTotalCount >
                slice1.length + slice2.length + slice3.length
              );
            case 'This week':
              return (
                popularPostsThisWeekTotalCount >
                slice1.length + slice2.length + slice3.length
              );
            case 'This month':
              return (
                popularPostsThisMonthTotalCount >
                slice1.length + slice2.length + slice3.length
              );
              break;
            case 'Ever':
              return (
                popularPostsEverTotalCount >
                slice1.length + slice2.length + slice3.length
              );
          }
          break;

        default:
          return postTotalCount > slice1.length + slice2.length + slice3.length;
      }
    }
    return true;
  };

  const getUserSearchResultsWithoutPublications = () => {
    return searchUserResults?.filter((user) => {
      if (searchPublicationResults) {
        return !searchPublicationResults
          .map((v) => v.publicationHandle)
          .includes(user.handle);
      } else {
        return true;
      }
    });
  };

  const resetSearchfield = () => {
    setShowSearchResults(false);
    resetPageIndexes();
    clearSearch();
    setSearchText('');
    setIsBlur(false);
  };

  const handleClickMore = () => {
    // prevent clicks while button spinner is visible
    if (loadingMore) {
      return;
    }

    setLoadingMore(true);
    search(lastSearchPhrase, !!searchedTag, indexFrom, indexTo, user);
  };

  // Here the API will be called for search, and that is defined in the yaml.
  const onKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      setIsBlur(false);
      handleSearch();
    }
  };

  //handling click on latest articles
  const handleLatestArticlesClick = () => {
    setLoadedSearchResults([]);
    setShowSearchResults(false);
    resetPageIndexes();
    clearSearch();
    setSearchText('');
    setIsBlur(false);
  };

  const handleFollowClicked = () => {
    // prevent clicks while button spinner is visible
    if (updatingFollow) {
      return;
    }
    if (!user) {
      modalContext?.openModal('Login');
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

  // let slice1 = latestPosts?.slice(0, 10);
  // let slice2 = latestPosts?.slice(11, 21);
  const [slice1, setSlice1] = useState<PostType[]>([]);
  const [slice2, setSlice2] = useState<PostType[]>([]);
  const [slice3, setSlice3] = useState<PostType[]>([]);
  const [HGSpinner, setHGSpinner] = useState(false);
  const [tab, setTab] = useState('popular');
  const [page, setPage] = useState(1);
  //const indexSubVal = page * 10;
  const indexLength = latestPosts?.length;

  //holds popular posts
  const [popularPostsToday, setPopularPostsToday] = useState<PostType[]>([]);
  const [popularPostsThisWeek, setPopularPostsThisWeek] = useState<PostType[]>(
    []
  );
  const [popularPostsThisMonth, setPopularPostsThisMonth] = useState<
    PostType[]
  >([]);
  const [popularPosts, setPopularPosts] = useState<PostType[]>([]);
  const [popularPostsTodayTotalCount, setPopularPostsTodayTotalCount] =
    useState(0);
  const [popularPostsThisWeekTotalCount, setPopularPostsThisWeekTotalCount] =
    useState(0);
  const [popularPostsThisMonthTotalCount, setPopularPostsThisMonthTotalCount] =
    useState(0);
  const [popularPostsEverTotalCount, setPopularPostsEverTotalCount] =
    useState(0);

  useEffect(() => {
    setSlice3([]);
    setHGSpinner(false);
  }, []);

  useEffect(() => {
    if (tab === 'new') {
      if (latestPosts && page === 1) {
        setSlice1(latestPosts?.slice(0, 10));
        setSlice2(latestPosts?.slice(10, 20));
      } else if (latestPosts) setSlice3([...slice3, ...latestPosts]);
      setHGSpinner(false);
    }
  }, [latestPosts]);

  useEffect(() => {
    if (searchText && isTagScreen) handleLatestArticlesClick();
  }, []);

  useEffect(() => {
    if (tab === 'popular') {
      switch (timeFrame) {
        case 'Today':
          setSlice1(popularPostsToday.slice(0, 10));
          setSlice2(popularPostsToday.slice(10, 20));
          setSlice3(popularPostsToday.slice(20, undefined));
          break;
        case 'This week':
          setSlice1(popularPostsThisWeek.slice(0, 10));
          setSlice2(popularPostsThisWeek.slice(10, 20));
          setSlice3(popularPostsThisWeek.slice(20, undefined));
          break;
        case 'This month':
          setSlice1(popularPostsThisMonth.slice(0, 10));
          setSlice2(popularPostsThisMonth.slice(10, 20));
          setSlice3(popularPostsThisMonth.slice(20, undefined));
          break;
        case 'Ever':
          setSlice1(popularPosts.slice(0, 10));
          setSlice2(popularPosts.slice(10, 20));
          setSlice3(popularPosts.slice(20, undefined));
          break;
      }
      setHGSpinner(false);
    }
  }, [
    popularPosts,
    popularPostsThisMonth,
    popularPostsThisWeek,
    popularPostsToday,
  ]);

  useEffect(() => {
    if (tab == 'topics' && postResults) {
      if (postResults && page == 1) {
        setSlice1(postResults?.slice(0, 10));
        setSlice2(postResults?.slice(11, 22));
        setPage(page + 1);
      } else {
        setSlice3([...slice3, ...postResults]);
      }
      setHGSpinner(false);
    }
  }, [postResults]);

  useEffect(() => {
    if (tab == 'writers' && postsByFollowers) {
      if (postsByFollowers && page == 1) {
        setSlice1(postsByFollowers?.slice(0, 10));
        setSlice2(postsByFollowers?.slice(10, 20));
        setPage(page + 1);
      } else {
        setSlice3([...slice3, ...postsByFollowers]);
      }
      setHGSpinner(false);
    }
  }, [postsByFollowers]);

  useEffect(() => {
    redirect(window.location.pathname);
  }, []);
  const handleNewTab = () => {
    setTab('new');
    setPage(1);
    getLatestPosts(0, 20);
    if (latestPosts) {
      setSlice1(latestPosts?.slice(0, 10));
      setSlice2(latestPosts?.slice(10, 20));
      setSlice3([]);
    } else {
      setSlice1([]);
      setSlice2([]);
      setSlice3([]);
    }

    resetSearchfield();
  };

  const handlePopularTab = async (timeFrame: string) => {
    setTab('popular');
    setPage(1);
    switch (timeFrame) {
      case 'Today':
        setSlice1(popularPostsToday.slice(0, 10));
        setSlice2(popularPostsToday.slice(10, 20));
        setSlice3(popularPostsToday.slice(20, undefined));
        break;
      case 'This week':
        setSlice1(popularPostsThisWeek.slice(0, 10));
        setSlice2(popularPostsThisWeek.slice(10, 20));
        setSlice3(popularPostsThisWeek.slice(20, undefined));
        break;
      case 'This month':
        setSlice1(popularPostsThisMonth.slice(0, 10));
        setSlice2(popularPostsThisMonth.slice(10, 20));
        setSlice3(popularPostsThisMonth.slice(20, undefined));
        break;
      case 'Ever':
        setSlice1(popularPosts.slice(0, 10));
        setSlice2(popularPosts.slice(10, 20));
        setSlice3(popularPosts.slice(20, undefined));
        break;

      default:
        break;
    }

    let [today, thisWeek, thisMonth, ever] = await Promise.all([
      getPopularPostsToday(0, 20),
      getPopularPostsThisWeek(0, 20),
      getPopularPostsThisMonth(0, 20),
      getPopularPosts(0, 20),
    ]);
    setPopularPostsToday(today.posts);
    setPopularPostsTodayTotalCount(today.totalCount);

    setPopularPostsThisWeek(thisWeek.posts);
    setPopularPostsThisWeekTotalCount(thisWeek.totalCount);

    setPopularPostsThisMonth(thisMonth.posts);
    setPopularPostsThisMonthTotalCount(thisMonth.totalCount);

    setPopularPosts(ever.posts);
    setPopularPostsEverTotalCount(ever.totalCount);

    switch (timeFrame) {
      case 'Today':
        setSlice1(today.posts.slice(0, 10));
        setSlice2(today.posts.slice(10, 20));
        setSlice3(today.posts.slice(20, undefined));
        break;
      case 'This week':
        setSlice1(thisWeek.posts.slice(0, 10));
        setSlice2(thisWeek.posts.slice(10, 20));
        setSlice3(thisWeek.posts.slice(20, undefined));
        break;
      case 'This month':
        setSlice1(thisMonth.posts.slice(0, 10));
        setSlice2(thisMonth.posts.slice(10, 20));
        setSlice3(thisMonth.posts.slice(20, undefined));
        break;
      case 'Ever':
        setSlice1(ever.posts.slice(0, 10));
        setSlice2(ever.posts.slice(10, 20));
        setSlice3(ever.posts.slice(20, undefined));
        break;

      default:
        break;
    }

    resetSearchfield();
  };

  var postsByTopic = (myTags || []).map((tag: any) => {
    let modifiedTag = tag.tagName.toUpperCase();
    return `#${modifiedTag}`;
  });

  const handleTopicsTab = async () => {
    setTab('topics');
    setPage(1);
    if (postResults) {
      setSlice1(postResults?.slice(0, 10));
      setSlice2(postResults?.slice(10, 22));
      setSlice3([]);
    } else {
      setSlice1([]);
      setSlice2([]);
      setSlice3([]);
    }

    let tags = await getMyTags();
    let postsByTopic = (tags || []).map((tag: any) => {
      let modifiedTag = tag.tagName.toUpperCase();
      return `#${modifiedTag}`;
    });
    if (user?.followedTags) {
      populateTags(postsByTopic, 0, 22);
    }
    resetSearchfield();
  };

  const handleAuthorTab = () => {
    setTab('writers');
    if (user?.followersArray) {
      getPostsByFollowers(user?.followersArray, 0, 21);
    }
    setPage(1);
    if (postsByFollowers) {
      setSlice1(postsByFollowers?.slice(1, 10));
      setSlice2(postsByFollowers?.slice(10, 21));
      setSlice3([]);
    } else {
      setSlice1([]);
      setSlice2([]);
      setSlice3([]);
    }

    resetSearchfield();
  };

  const getMore = async () => {
    if (latestPosts) {
      setHGSpinner(true);
      //if it gets stuck
      setTimeout(() => {
        setHGSpinner(false);
      }, 5000);
      switch (tab) {
        case 'new':
          getLatestPosts((page + 1) * 10 + 1, (page + 2) * 10);
          setPage(page + 1);
          break;

        case 'writers':
          if (user) {
            if (page == 1) {
              await getPostsByFollowers(user?.followersArray, 21, 33);
            } else {
              await getPostsByFollowers(
                user?.followersArray,
                page * 10,
                page * 10 + 9
              );
            }
          }
          setPage(page + 1);
          break;

        case 'topics':
          if (page == 1) {
            await populateTags(postsByTopic, 20, 32);
          } else {
            await populateTags(postsByTopic, page * 10, page * 10 + 9);
          }
          setPage(page + 1);
          break;

        case 'popular':
          switch (timeFrame) {
            case 'Today':
              let today = await getPopularPostsToday(
                (page + 1) * 10 + 1,
                (page + 2) * 10
              );
              setPopularPostsToday([...popularPostsToday, ...today.posts]);
              setPopularPostsTodayTotalCount(today.totalCount);
              setPage(page + 1);
              break;
            case 'This week':
              let thisWeek = await getPopularPostsThisWeek(
                (page + 1) * 10 + 1,
                (page + 2) * 10
              );
              setPopularPostsThisWeek([
                ...popularPostsThisWeek,
                ...thisWeek.posts,
              ]);
              setPopularPostsThisWeekTotalCount(thisWeek.totalCount);
              setPage(page + 1);
              break;
            case 'This month':
              let thisMonth = await getPopularPostsThisMonth(
                (page + 1) * 10 + 1,
                (page + 2) * 10
              );
              setPopularPostsThisMonth([
                ...popularPostsThisMonth,
                ...thisMonth.posts,
              ]);
              setPopularPostsThisMonthTotalCount(thisMonth.totalCount);
              setPage(page + 1);
              break;
            case 'Ever':
              let ever = await getPopularPosts(
                (page + 1) * 10 + 1,
                (page + 2) * 10
              );
              setPopularPosts([...popularPosts, ...ever.posts]);
              setPopularPostsEverTotalCount(ever.totalCount);
              setPage(page + 1);
              break;
          }
          break;
      }
    }
  };
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

  //search return methods
  const getSearchSummary = () => {
    switch (searchType) {
      case 'Articles':
        return (
          <div className='search-summary'>
            <div className='search-count'>
              <span className='pipe'>|</span>
              Found {searchTotalCount}
              {searchTotalCount == 1 ? ' article ' : ' articles '}
              {searchedTag ? ' with the tag ' : ' for '}
              <span
                className='result'
                style={{ color: darkOptionsAndColors.color }}
              >
                {' '}
                '{lastSearchPhrase}'
              </span>
            </div>

            {searchedTag && (
              <div className='follow'>
                <Button
                  styleType='secondary'
                  type='button'
                  style={{ width: '152px' }}
                  onClick={handleFollowClicked}
                  icon={updatingFollow ? images.loaders.BUTTON_SPINNER : ''}
                >
                  {isFollowingTag ? 'Followed' : 'Follow this tag'}
                </Button>
              </div>
            )}
          </div>
        );
        break;
      case 'People':
        let totalCount = getUserSearchResultsWithoutPublications()?.length || 0;
        return (
          <div className='search-summary'>
            <div className='search-count'>
              <span className='pipe'>|</span>
              Found {totalCount}
              {totalCount == 1 ? ' user ' : ' users '}
              {searchedTag ? ' with the tag ' : ' for '}
              <span
                className='result'
                style={{ color: darkOptionsAndColors.color }}
              >
                {' '}
                '{lastSearchPhrase}'
              </span>
            </div>

            {searchedTag && (
              <div className='follow'>
                <Button
                  styleType='secondary'
                  type='button'
                  style={{ width: '152px' }}
                  onClick={handleFollowClicked}
                  icon={updatingFollow ? images.loaders.BUTTON_SPINNER : ''}
                >
                  {isFollowingTag ? 'Followed' : 'Follow this tag'}
                </Button>
              </div>
            )}
          </div>
        );
        break;
      case 'Publications':
        let totalCountPublications = searchPublicationResults?.length || 0;
        return (
          <div className='search-summary'>
            <div className='search-count'>
              <span className='pipe'>|</span>
              Found {totalCountPublications}
              {totalCountPublications == 1 ? ' publication ' : ' publications '}
              {searchedTag ? ' with the tag ' : ' for '}
              <span
                className='result'
                style={{ color: darkOptionsAndColors.color }}
              >
                {' '}
                '{lastSearchPhrase}'
              </span>
            </div>

            {searchedTag && (
              <div className='follow'>
                <Button
                  styleType='secondary'
                  type='button'
                  style={{ width: '152px' }}
                  onClick={handleFollowClicked}
                  icon={updatingFollow ? images.loaders.BUTTON_SPINNER : ''}
                >
                  {isFollowingTag ? 'Followed' : 'Follow this tag'}
                </Button>
              </div>
            )}
          </div>
        );
        break;

      default:
        return <></>;
        break;
    }
  };

  const getSearchResults = () => {
    switch (searchType) {
      case 'Articles':
        return (
          <div className='article-grid-horizontal'>
            {loadedSearchResults?.map((post: PostType) => (
              <CardHorizontal post={post} key={post.postId} />
            ))}
          </div>
        );
        break;
      case 'People':
        return (
          <div style={{ marginLeft: '3%' }}>
            {getUserSearchResultsWithoutPublications()?.map((user) => {
              return (
                <div className='user-search-item' key={user.handle}>
                  <Link to={'/' + user.handle}>
                    <img
                      src={user.avatar || images.DEFAULT_AVATAR}
                      className='profile-picture user-image-search'
                      style={{
                        width: '100px',
                        height: '100px',
                        transition: 'none',
                      }}
                    />
                  </Link>

                  <div className='user-search-info'>
                    <Link to={'/' + user.handle}>
                      <p className='handle'>{'@' + user.handle}</p>
                    </Link>

                    <p
                      className='display-name-search-item'
                      onClick={() => {
                        navigate('/' + user.handle);
                      }}
                    >
                      {user.displayName}
                    </p>

                    <p
                      className='bio'
                      onClick={() => {
                        navigate('/' + user.handle);
                      }}
                    >
                      {user.bio.length !== 0
                        ? user.bio
                        : 'There is no bio yet.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        );
        break;
      case 'Publications':
        return (
          <div style={{ marginLeft: '3%' }}>
            {searchPublicationResults?.map((publication) => {
              return (
                <div
                  className='user-search-item'
                  key={publication.publicationHandle}
                >
                  <Link to={'/publication/' + publication.publicationHandle}>
                    <img
                      src={publication.headerImage || images.NUANCE_LOGO}
                      className='profile-picture publication-image-search'
                    />
                  </Link>

                  <div className='user-search-info'>
                    <Link to={'/publication/' + publication.publicationHandle}>
                      <p className='handle'>
                        {'@' + publication.publicationHandle}
                      </p>
                    </Link>

                    <p
                      className='display-name-search-item'
                      onClick={() => {
                        navigate(
                          '/publication/' + publication.publicationHandle
                        );
                      }}
                    >
                      {publication.publicationTitle}
                    </p>

                    <p
                      className='bio'
                      onClick={() => {
                        navigate(
                          '/publication/' + publication.publicationHandle
                        );
                      }}
                    >
                      {publication.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        );
        break;
      default:
        return <></>;
        break;
    }
  };

  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: darkOptionsAndColors.background,
            height: '100vh',
            width: '100vw',
          }}
        >
          <Loader />
        </div>
      }
    >
      <div style={darkOptionsAndColors} className='homepage-wrapper'>
        <Header
          loggedIn={!!user}
          isArticlePage={false}
          ScreenWidth={screenWidth}
          isPublicationPage={false}
        />
        {user ? '' : context.width < 768 ? <LoggedOutSidebar /> : null}
        <div onFocus={() => setIsBlur(true)} onBlur={() => setIsBlur(false)}>
          <SearchBar
            value={searchText}
            onKeyDown={onKeyDown}
            onChange={(value) => setSearchText(value)}
          />
        </div>
        <div className={isBlur ? 'main blurred' : 'main'}>
          <div className='left'>
            {user ? (
              <div className='logged-in'>
                {/* Will call this dynamically when functionalities are implemented */}
                {/* <img className='avatar-pic' src={user?.avatar || assetPaths.DEFAULT_AVATAR} alt='' /> */}
                <img
                  className='homepage-left-background-image'
                  src={images.NUANCE_LOGO_MASK_GROUP}
                />
                <div className='left-content'>
                  <img
                    className='avatar'
                    alt=''
                    src={user?.avatar || images.DEFAULT_AVATAR}
                    style={{ color: darkOptionsAndColors.secondaryColor }}
                  />
                  <p
                    style={{ color: darkOptionsAndColors.secondaryColor }}
                    className='name'
                  >
                    {user?.displayName}
                  </p>

                  <div className='handle'>
                    <Link
                      style={{ color: darkOptionsAndColors.secondaryColor }}
                      to={`/${user?.handle}`}
                    >
                      @{user?.handle}
                    </Link>
                  </div>

                  <div
                    style={{ color: darkOptionsAndColors.secondaryColor }}
                    className='articles'
                  >
                    <h6 className='leftt'>
                      <Link
                        style={{ color: darkOptionsAndColors.secondaryColor }}
                        to='/my-profile/articles?page=published'
                      >
                        {counts?.publishedCount || 0} articles published
                      </Link>
                    </h6>
                    <h6>&nbsp;|&nbsp;</h6>
                    <h6
                      style={{ color: darkOptionsAndColors.secondaryColor }}
                      className='rightt'
                    >
                      <Link
                        style={{ color: darkOptionsAndColors.secondaryColor }}
                        to='/my-profile/articles?page=draft'
                      >
                        {counts?.draftCount || 0} articles in draft
                      </Link>
                    </h6>
                  </div>
                  <Button
                    styleType='secondary'
                    type='button'
                    style={{ width: '152px' }}
                    // icon={NONAME}
                    onClick={() => {
                      navigate('/article/new');
                    }}
                  >
                    Create new article
                  </Button>
                </div>
                <div className='left-menu'>
                  <MeatBallSidebar />
                </div>
              </div>
            ) : (
              <div className='logged-out'>
                <LoggedOutSidebar />
              </div>
            )}
          </div>
          <div className='right'>
            {loading ? (
              <Loader />
            ) : (
              <>
                <NavTabs
                  firstTab={user ? 'Writers' : ''}
                  secondTab={user ? 'Topics' : ''}
                  thirdTab='Popular'
                  fourthTab='New'
                  fifthTab={lastSearchPhrase ? 'Search' : ''}
                  onClick1={handleAuthorTab}
                  onClick2={handleTopicsTab}
                  onClick3={() => handlePopularTab(timeFrame)}
                  onClick4={handleNewTab}
                  onClick5={() => setShowSearchResults(true)}
                  tagSearched={lastSearchPhrase ? true : false}
                />
                <div className='posts'>
                  {showSearchResults ? (
                    <div className='homepage-search-results-wrapper'>
                      <SearchResults
                        term={lastSearchPhrase}
                        articles={loadedSearchResults}
                        publications={searchPublicationResults || []}
                        users={getUserSearchResultsWithoutPublications() || []}
                        counts={{
                          articlesCount: loadedSearchResults.length,
                          publicationsCount:
                            searchPublicationResults?.length || 0,
                          usersCount:
                            getUserSearchResultsWithoutPublications()?.length ||
                            0,
                        }}
                      />

                      {/*(loadedSearchResults?.length || 0) < searchTotalCount && 
                        searchType === 'Articles' && (
                          <div className='load-more-container'>
                            <Button
                              styleType='secondary'
                              style={{ width: '152px' }}
                              onClick={()=>{}}
                              icon={
                                loadingMore ? images.loaders.BUTTON_SPINNER : ''
                              }
                            >
                              <span>Load More</span>
                            </Button>
                          </div>
                            )*/}
                    </div>
                  ) : (
                    <div className='latestArticles'>
                      <p className='mainTitle'>LATEST ARTICLES</p>
                      <div className='article-grid'>
                        {tab === 'popular' &&
                        dropdownMenuOpen &&
                        !modalContext?.isModalOpen ? (
                          <div
                            className='dropdown-wrapper active'
                            style={darkOptionsAndColors}
                          >
                            <div className='dropdown-selector-wrapper'>
                              <div
                                className='dropdown-selector'
                                onClick={() =>
                                  setDropdownMenuOpen(!dropdownMenuOpen)
                                }
                              >
                                <div>{timeFrame}</div>
                                <div className='arrow a-up'></div>
                              </div>
                            </div>
                            <div
                              className='items-wrapper'
                              style={darkOptionsAndColors}
                            >
                              {timeFrames.map((time) => {
                                if (time !== timeFrame) {
                                  return (
                                    <div
                                      key={time}
                                      className='item'
                                      onClick={() => {
                                        setTimeFrame(time);
                                        handlePopularTab(time);
                                        setDropdownMenuOpen(false);
                                      }}
                                    >
                                      {time}
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          </div>
                        ) : !modalContext?.isModalOpen ? (
                          tab === 'popular' ? (
                            <div
                              className='dropdown-wrapper'
                              style={darkOptionsAndColors}
                            >
                              <div className='dropdown-selector-wrapper'>
                                <div
                                  className='dropdown-selector'
                                  onClick={() =>
                                    setDropdownMenuOpen(!dropdownMenuOpen)
                                  }
                                >
                                  <div>{timeFrame}</div>
                                  <div className='arrow a-down'></div>
                                </div>
                              </div>
                            </div>
                          ) : null
                        ) : null}
                        {slice1?.map((post: PostType) => (
                          <CardVertical post={post} key={post.postId} />
                        ))}
                      </div>

                      <div className='article-grid-horizontal'>
                        {slice2?.map((post: PostType) => (
                          <CardHorizontal post={post} key={post.postId} />
                        ))}
                      </div>
                      <div className='article-grid-horizontal'>
                        {slice3?.map((post: PostType) => (
                          <CardHorizontal post={post} key={post.postId} />
                        ))}
                      </div>
                      <div
                        className={
                          loadMoreVisible()
                            ? 'home-grid-load-more-container'
                            : 'hide'
                        }
                      >
                        <Button
                          styleType='secondary'
                          style={{ width: '152px' }}
                          onClick={() => {
                            getMore();
                          }}
                          icon={HGSpinner ? images.loaders.BUTTON_SPINNER : ''}
                        >
                          <span>Load More</span>
                        </Button>
                      </div>
                    </div>
                  )}
                  <Footer />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default HomePageGrid;
