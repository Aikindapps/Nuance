import React, { useState, useEffect, useContext, Suspense, lazy } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Header from '../../components/header/header';
import './homepage.scss';
import { colors, images } from '../../shared/constants';
import { useAuthStore, usePostStore, useUserStore } from '../../store';
import Button from '../../UI/Button/Button';
import { Tooltip } from 'react-tooltip';
import { getIconForSocialChannel, searchTextToTag } from '../../shared/utils';
import { useTheme } from '../../contextes/ThemeContext';
import { Context as ModalContext } from '../../contextes/ModalContext';
import SearchBar from '../../components/search-bar/search-bar';
import queryString from 'query-string';
import { PostType, PublicationType, UserListItem } from '../../types/types';
import CardVertical from '../../components/card-vertical/card-vertical';
import CardPublishedArticles from '../../components/card-published-articles/card-published-articles';
import { TagModel } from '../../../declarations/PostCore/PostCore.did';
import Loader from '../../UI/loader/Loader';
import SearchResults from '../../components/search-results/search-results';
import Dropdown from '../../UI/dropdown/dropdown';

const HomePage = () => {
  //darkTheme
  const darkTheme = useTheme();
  //modal context
  const modalContext = useContext(ModalContext);
  //navigate
  const navigate = useNavigate();
  //location
  const location = useLocation();

  const [screenWidth, setScreenWidth] = useState(0);
  useEffect(
    (window.onresize = window.onload =
      () => {
        setScreenWidth(window.innerWidth);
      }),
    [screenWidth]
  );

  //authStore
  const { isLoggedIn, login } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    login: state.login,
  }));
  //userStore
  const { user, searchUsers, searchPublications, getCounts, counts } =
    useUserStore((state) => ({
      user: state.user,
      searchUsers: state.searchUsers,
      searchPublications: state.searchPublications,
      getCounts: state.getUserPostCounts,
      counts: state.userPostCounts,
    }));
  //postStore
  const {
    getPostsByFollowers,
    getFollowingTagsPosts,
    getPopularPosts,
    getPopularPostsToday,
    getPopularPostsThisWeek,
    getPopularPostsThisMonth,
    getLatestPosts,
    getAllTags,
    search,
  } = usePostStore((state) => ({
    getPostsByFollowers: state.getPostsByFollowers,
    getFollowingTagsPosts: state.getFollowingTagsPosts,
    getPopularPosts: state.getPopularPosts,
    getPopularPostsToday: state.getPopularPostsToday,
    getPopularPostsThisWeek: state.getPopularPostsThisWeek,
    getPopularPostsThisMonth: state.getPopularPostsThisMonth,
    getLatestPosts: state.getLatestPosts,
    getAllTags: state.getAllTags,
    search: state.search,
  }));

  const [selectedTab, setSelectedTab] = useState(
    isLoggedIn || window.location.search !== '' ? 'Articles' : 'About'
  );

  //features in about tab
  const features_left = [
    {
      title: 'Following',
      content:
        'Following writers, publications and topics ensures you never miss an article',
    },
    {
      title: 'Subscription',
      content:
        'A subscription to publications provides unlimited access to all premium content',
    },
    {
      title: 'Publications',
      content:
        'Publications provide a branded landing page showcasing your articles - including a concierge migration service',
    },
    {
      title: 'Premium Articles',
      content: 'Publish Premium articles behind an NFT gated firewall',
    },
  ];
  const features_right = [
    {
      title: 'Notifications',
      content:
        'Get notifications regarding your community so you are always in the loop',
    },
    {
      title: 'Tipping',
      content:
        'Show appreciation with "applause" and tip writers in NUA, ckBTC and ICP',
    },
    {
      title: 'Commenting',
      content: 'Article commenting to engage the community around an article',
    },
    {
      title: 'Social',
      content: 'Social links to cross-pollinate your audience',
    },
  ];
  //topics in about tab
  const topics = [
    'BITCOIN',
    'ICP',
    'CRYPTO',
    'DDDM',
    'INTERNET IDENTITY',
    'RIPPLE',
  ];

  const onKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      setIsBlur(false);
      setTab('search');
      setPage(0);
      navigate(`?tab=search&phrase=${encodeURIComponent(searchText)}&page=0`, {
        replace: true,
      });
      loadSearchResults(searchText);
      //scrollToSearch();
      //setLoadingSearchResults(true);
      //handleSearch(false);
    }
  };

  //url from state

  useEffect(() => {
    getStateFromUrl();
  }, []);

  const getStateFromUrl = () => {
    const queryParams = queryString.parse(location.search);
    let navigationUrl = '';
    if ('tab' in queryParams && typeof queryParams.tab === 'string') {
      if (
        queryParams.tab === 'writers' ||
        queryParams.tab === 'topics' ||
        queryParams.tab === 'popular' ||
        queryParams.tab === 'new' ||
        queryParams.tab === 'search'
      ) {
        setTab(queryParams.tab);
        if (queryParams.tab !== 'popular') {
          navigationUrl += '?tab=' + queryParams.tab;
        }
      }
    }
    let search_text: string | undefined = undefined;
    let search_tag: string | undefined = undefined;
    if (queryParams.tab === 'search') {
      if ('phrase' in queryParams && typeof queryParams.phrase === 'string') {
        let decodedSearchText = decodeURIComponent(queryParams.phrase);
        setSearchText(decodedSearchText);
        search_text = decodeURIComponent(queryParams.phrase);
        if (queryParams.phrase.length !== 0) {
          if (navigationUrl.length === 0) {
            navigationUrl += '?phrase=' + queryParams.phrase;
          } else {
            navigationUrl += '&phrase=' + queryParams.phrase;
          }
        }
      } else if ('tag' in queryParams && typeof queryParams.tag === 'string') {
        let decodedSearchTag = decodeURIComponent(queryParams.tag);
        if (decodedSearchTag.startsWith('#')) {
          setSearchText(decodedSearchTag);
          search_tag = decodedSearchTag;
        } else {
          setSearchText('#' + decodedSearchTag);
          search_tag = '#' + decodedSearchTag;
        }

        if (queryParams.tag.length !== 0) {
          if (navigationUrl.length === 0) {
            navigationUrl += '?tag=' + queryParams.tag;
          } else {
            navigationUrl += '&tag=' + queryParams.tag;
          }
        }
      }
    }

    let page = 0;
    if ('page' in queryParams && typeof queryParams.page === 'string') {
      try {
        setPage(parseInt(queryParams.page));
        page = parseInt(queryParams.page);
        if (parseInt(queryParams.page) !== 0) {
          if (navigationUrl.length === 0) {
            navigationUrl += '?page=' + parseInt(queryParams.page);
          } else {
            navigationUrl += '&page=' + parseInt(queryParams.page);
          }
        }
      } catch (error) {}
    }
    loadWritersPosts(page, true);
    loadFollowingTagsPosts(page, true);
    loadPopularPostsToday(page, true);
    loadPopularPostsThisWeek(page, true);
    loadPopularPostsThisMonth(page, true);
    loadPopularPostsEver(page, true);
    loadLatestPosts(page, true);
    if (search_text) {
      loadSearchResults(search_text);
    }
    if (search_tag) {
      loadSearchResults(search_tag);
    }
    navigate('/' + navigationUrl, { replace: true });
  };

  useEffect(() => {
    if (user) {
      getCounts(user.handle);
    }
  }, [user]);

  //tabs
  type TabType = 'writers' | 'topics' | 'popular' | 'new' | 'search';
  const [tab, setTab] = useState<TabType>('popular');

  //page
  const [page, setPage] = useState(0);

  //writers posts
  const [writersPosts, setWritersPosts] = useState<PostType[]>([]);
  const [writersPostCount, setWritersPostCount] = useState(0);
  const loadWritersPosts = async (page: number, initial: boolean) => {
    const start = initial ? 0 : page * 15;
    const end = (page + 1) * 15;
    const { posts, totalCount } = await getPostsByFollowers(
      user?.followersArray || [],
      start,
      end
    );
    if (initial) {
      setWritersPosts(posts);
    } else {
      setWritersPosts([...writersPosts, ...posts]);
    }
    setWritersPostCount(totalCount);
  };

  //following tags posts
  const [followingTagsPosts, setFollowingTagsPosts] = useState<PostType[]>([]);
  const [followingTagsPostsCount, setFollowingTagsPostsCount] = useState(0);
  const loadFollowingTagsPosts = async (page: number, initial: boolean) => {
    const start = initial ? 0 : page * 15;
    const end = (page + 1) * 15;
    const { posts, totalCount } = await getFollowingTagsPosts(start, end);
    if (initial) {
      setFollowingTagsPosts(posts);
    } else {
      setFollowingTagsPosts([...followingTagsPosts, ...posts]);
    }

    setFollowingTagsPostsCount(totalCount);
  };

  //POPULAR POSTS
  type PopularFilterType = 'Today' | 'This week' | 'This month' | 'Ever';
  const popularFiltersArray: PopularFilterType[] = [
    'Today',
    'This week',
    'This month',
    'Ever',
  ];
  const [popularFilter, setPopularFilter] =
    useState<PopularFilterType>('This week');
  //popular posts today
  const [todayPosts, setTodayPosts] = useState<PostType[]>([]);
  const [todayPostCount, setTodayPostCount] = useState(0);
  const loadPopularPostsToday = async (page: number, initial: boolean) => {
    const start = initial ? 0 : page * 15;
    const end = (page + 1) * 15;
    const { posts, totalCount } = await getPopularPostsToday(start, end);
    if (initial) {
      setTodayPosts(posts);
    } else {
      setTodayPosts([...todayPosts, ...posts]);
    }

    setTodayPostCount(totalCount);
  };
  //popular posts this week
  const [thisWeekPosts, setThisWeekPosts] = useState<PostType[]>([]);
  const [thisWeekPostCount, setThisWeekPostCount] = useState(0);
  const loadPopularPostsThisWeek = async (page: number, initial: boolean) => {
    const start = initial ? 0 : page * 15;
    const end = (page + 1) * 15;
    const { posts, totalCount } = await getPopularPostsThisWeek(start, end);
    if (initial) {
      setThisWeekPosts(posts);
    } else {
      setThisWeekPosts([...thisWeekPosts, ...posts]);
    }

    setThisWeekPostCount(totalCount);
  };
  //popular posts this month
  const [thisMonthPosts, setThisMonthPosts] = useState<PostType[]>([]);
  const [thisMonthPostsCount, setThisMonthPostCount] = useState(0);
  const loadPopularPostsThisMonth = async (page: number, initial: boolean) => {
    const start = initial ? 0 : page * 15;
    const end = (page + 1) * 15;
    const { posts, totalCount } = await getPopularPostsThisMonth(start, end);
    if (initial) {
      setThisMonthPosts(posts);
    } else {
      setThisMonthPosts([...thisMonthPosts, ...posts]);
    }

    setThisMonthPostCount(totalCount);
  };
  //popular posts ever
  const [everPopularPosts, setEverPopularPosts] = useState<PostType[]>([]);
  const [everPopularPostCount, setEverPopularPostCount] = useState(0);
  const loadPopularPostsEver = async (page: number, initial: boolean) => {
    const start = initial ? 0 : page * 15;
    const end = (page + 1) * 15;
    const { posts, totalCount } = await getPopularPosts(start, end);
    if (initial) {
      setEverPopularPosts(posts);
    } else {
      setEverPopularPosts([...everPopularPosts, ...posts]);
    }

    setEverPopularPostCount(totalCount);
  };

  //latest posts
  const [latestPosts, setLatestPosts] = useState<PostType[]>([]);
  const [latestPostsPostCount, setLatestPostsPostCount] = useState(0);
  const loadLatestPosts = async (page: number, initial: boolean) => {
    const start = initial ? 0 : page * 15;
    const end = (page + 1) * 15;
    const { posts, totalCount } = await getLatestPosts(start, end);
    if (initial) {
      setLatestPosts(posts);
    } else {
      setLatestPosts([...latestPosts, ...posts]);
    }

    setLatestPostsPostCount(totalCount);
  };

  //load search results
  const [searchText, setSearchText] = useState('');
  const [lastSearchTerm, setLastSearchTerm] = useState('');
  console.log(lastSearchTerm);
  const [isBlur, setIsBlur] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [allTags, setAllTags] = useState<TagModel[]>([]);
  const [searchPostResults, setSearchPostResults] = useState<PostType[]>([]);
  const [searchPostResultsTotalCount, setSearchPostResultsTotalCount] =
    useState(0);
  const [searchUserResults, setSearchUserResults] = useState<UserListItem[]>(
    []
  );
  const [searchPublicationResults, setSearchPublicationResults] = useState<
    PublicationType[]
  >([]);
  const loadSearchResults = async (searchText: string) => {
    setSearchLoading(true);
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
    //if tag search, use tag instead of phrase
    if (isTagSearch) {
      navigate(`?tab=search&tag=${encodeURIComponent(searchText)}&page=0`, {
        replace: true,
      });
    }
    let [{ totalCount, posts }, publications, users] = await Promise.all([
      search(phrase, isTagSearch, 0, 10000, user),
      searchPublications(phrase),
      searchUsers(phrase),
    ]);
    setSearchPostResults(posts);
    setSearchPostResultsTotalCount(totalCount);
    setSearchPublicationResults(publications);
    setSearchUserResults(users);
    if (isTagSearch) {
      setLastSearchTerm('#' + phrase);
    } else {
      setLastSearchTerm(phrase);
    }
    setSearchLoading(false);
  };

  //load more
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const loadMoreHandler = async () => {
    setLoadMoreLoading(true);
    switch (tab) {
      case 'new':
        await loadLatestPosts(page + 1, false);
        break;
      case 'popular':
        switch (popularFilter) {
          case 'Ever':
            await loadPopularPostsEver(page + 1, false);
            break;
          case 'This month':
            await loadPopularPostsThisMonth(page + 1, false);
            break;
          case 'This week':
            await loadPopularPostsThisWeek(page + 1, false);
            break;
          case 'Today':
            await loadPopularPostsToday(page + 1, false);
            break;
        }
        break;
      case 'search':
        break;
      case 'topics':
        await loadFollowingTagsPosts(page + 1, false);
        break;
      case 'writers':
        await loadWritersPosts(page + 1, false);
        break;
    }
    setPage(page + 1);
    const queryParams = queryString.parse(location.search);
    queryParams.page = (page + 1).toString();
    navigate(`?${queryString.stringify(queryParams)}`);
    setLoadMoreLoading(false);
  };

  //displaying posts
  const getDisplayingPosts = () => {
    switch (tab) {
      case 'new':
        return latestPosts;
      case 'popular':
        switch (popularFilter) {
          case 'Ever':
            return everPopularPosts;
          case 'This month':
            return thisMonthPosts;
          case 'This week':
            return thisWeekPosts;
          case 'Today':
            return todayPosts;
        }
      case 'search':
        return [];
      case 'topics':
        return followingTagsPosts;
      case 'writers':
        return writersPosts;
    }
  };

  const getDisplayingPostsTotalCount = () => {
    switch (tab) {
      case 'new':
        return latestPostsPostCount;
      case 'popular':
        switch (popularFilter) {
          case 'Ever':
            return everPopularPostCount;
          case 'This month':
            return thisMonthPostsCount;
          case 'This week':
            return thisWeekPostCount;
          case 'Today':
            return todayPostCount;
        }
      case 'search':
        return 0;
      case 'topics':
        return followingTagsPostsCount;
      case 'writers':
        return writersPostCount;
    }
  };

  //mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  //dark theme
  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.primaryTextColor
      : colors.primaryBackgroundColor,
    color: darkTheme ? colors.primaryBackgroundColor : colors.primaryTextColor,
    filter: darkTheme
      ? `drop-shadow(1px 1px 40px ${colors.darkModeAccentColor} ) drop-shadow(1px 1px 40px ${colors.primaryBackgroundColor} )`
      : 'none',
    secondaryButtonColor: darkTheme
      ? colors.darkModeSecondaryButtonColor
      : colors.accentColor,
    buttonBackgroundColor: darkTheme
      ? colors.accentColor
      : colors.primaryTextColor,
  };

  return (
    <div className='homepage'>
      <Header
        loggedIn={isLoggedIn}
        isArticlePage={false}
        ScreenWidth={screenWidth}
        isPublicationPage={false}
        transparentBackground={true}
      />

      <div className='join-revolution'>
        <div className='join-revolution-container'>
          <div className='left'>
            <div className='nuance-logo-blue-text'>
              <img
                className='image-container'
                src={images.NUANCE_LOGO_BLUE_TEXT}
              />
            </div>
            <div className='buttons-wrapper'>
              <div
                className={
                  selectedTab === 'About'
                    ? darkTheme
                      ? 'button'
                      : 'button selected'
                    : darkTheme
                    ? 'button selected'
                    : 'button'
                }
                onClick={() => {
                  setSelectedTab('About');
                }}
              >
                About Nuance
              </div>
              <div
                className={
                  selectedTab === 'Articles'
                    ? darkTheme
                      ? 'button'
                      : 'button selected'
                    : darkTheme
                    ? 'button selected'
                    : 'button'
                }
                onClick={() => {
                  setSelectedTab('Articles');
                }}
              >
                Articles
              </div>
            </div>
          </div>
          {!isLoggedIn && (
            <div className='right'>
              <div className='title'>
                Join the on-chain blogging revolution!
              </div>
              <div className='login-options'>
                <div className='title'>Login with:</div>
                <div className='login-option-wrapper'>
                  <Button
                    styleType='primary-1'
                    type='button'
                    style={{ width: '176px', margin: '0' }}
                    onClick={() => {
                      login('ii');
                    }}
                  >
                    Internet Identity
                  </Button>
                  <a
                    className='login-info-text'
                    href={'https://internetcomputer.org/internet-identity'}
                    target='_blank'
                  >
                    You’re not hardcore unless you live hardcore
                  </a>
                </div>
                <div className='login-option-wrapper'>
                  <Button
                    styleType='primary-1'
                    type='button'
                    style={{ width: '176px', margin: '0' }}
                    onClick={() => {
                      login('NFID');
                    }}
                  >
                    Google
                  </Button>
                  <a
                    className='login-info-text'
                    href={'https://learn.nfid.one/'}
                    target='_blank'
                  >
                    Enhanced with cryptography by NFID
                  </a>
                </div>
                <div
                  onClick={() => {
                    modalContext?.openModal('Login');
                  }}
                  className='other-options'
                >
                  Other options?
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className='join-revolution-mobile'>
        <div className='nuance-logo-blue-text'>
          <img className='image-container' src={images.NUANCE_LOGO_BLUE_TEXT} />
        </div>
        {!isLoggedIn && (
          <div className='login-options-mobile-wrapper'>
            <div className='title'>Join the on-chain blogging revolution!</div>
            <div className='login-options'>
              <div className='title'>Login with:</div>
              <div className='login-option-wrapper'>
                <Button
                  styleType='primary-1'
                  type='button'
                  style={{ width: '176px', margin: '0' }}
                  onClick={() => {
                    login('ii');
                  }}
                >
                  Internet Identity
                </Button>
                <a
                  className='login-info-text'
                  href={'https://internetcomputer.org/internet-identity'}
                  target='_blank'
                >
                  You’re not hardcore unless you live hardcore
                </a>
              </div>
              <div className='login-option-wrapper'>
                <Button
                  styleType='primary-1'
                  type='button'
                  style={{ width: '176px', margin: '0' }}
                  onClick={() => {
                    login('NFID');
                  }}
                >
                  Google
                </Button>
                <a
                  className='login-info-text'
                  href={'https://learn.nfid.one/'}
                  target='_blank'
                >
                  Enhanced with cryptography by NFID
                </a>
              </div>
              <div
                onClick={() => {
                  modalContext?.openModal('Login');
                }}
                className='other-options'
              >
                Other options?
              </div>
            </div>
          </div>
        )}
        <div className='buttons-wrapper'>
          <div
            className={
              selectedTab === 'About'
                ? darkTheme
                  ? 'button'
                  : 'button selected'
                : darkTheme
                ? 'button selected'
                : 'button'
            }
            onClick={() => {
              setSelectedTab('About');
            }}
          >
            About Nuance
          </div>
          <div
            className={
              selectedTab === 'Articles'
                ? darkTheme
                  ? 'button'
                  : 'button selected'
                : darkTheme
                ? 'button selected'
                : 'button'
            }
            onClick={() => {
              setSelectedTab('Articles');
            }}
          >
            Articles
          </div>
        </div>
      </div>
      {selectedTab === 'About' && (
        <div className='about-nuance-wrapper'>
          <div className='welcome-to-blogging'>
            <div className='title'>
              The world's first blogging platform built entirely on-chain!
            </div>
            <img className='image' src={images.WELCOME_TO_BLOGGING} />
            <div className='colorful-divider' />
          </div>
          <div className='read-write-earn-money'>
            <div
              className='title'
              style={darkTheme ? { color: darkOptionsAndColors.color } : {}}
            >
              Read, write and earn
            </div>
            <div className='content'>
              <span>
                Nuance is the world's first publishing platform powered entirely
                by blockchain technology. Nuance offers writers the opportunity
                to govern the platform upon which they create content.
                Minimizing platform risk and empowering creators like never
                before.
              </span>
              <span>
                By harnessing the power of blockchain, Nuance applies the
                benefits of Web 3 to a Medium-style content hosting platform.
                This includes anonymity, self-sovereignty, censorship
                resistance, community governance, and tokenization. Ensuring a
                decentralized and secure environment for writers and readers
                alike. alike.
              </span>
            </div>
          </div>
          {!isLoggedIn && (
            <div className='login-buttons-wrapper'>
              <Button
                style={
                  darkTheme
                    ? {
                        width: '224px',
                        backgroundColor:
                          darkOptionsAndColors.buttonBackgroundColor,
                        color: darkOptionsAndColors.background,
                      }
                    : { width: '224px' }
                }
                styleType='primary-1'
                onClick={() => {
                  login('NFID');
                }}
              >
                Login with Google
              </Button>

              <Button
                style={
                  darkTheme
                    ? {
                        width: '224px',
                        backgroundColor:
                          darkOptionsAndColors.buttonBackgroundColor,
                        color: darkOptionsAndColors.background,
                      }
                    : { width: '224px' }
                }
                styleType='primary-1'
                onClick={() => {
                  login('ii');
                }}
              >
                Login with Internet Identity
              </Button>
            </div>
          )}
          {!isLoggedIn && (
            <div className='login-button-mobile'>
              <Button
                style={
                  darkTheme
                    ? {
                        width: '185px',
                        backgroundColor:
                          darkOptionsAndColors.buttonBackgroundColor,
                        color: darkOptionsAndColors.background,
                      }
                    : { width: '185px' }
                }
                styleType='primary-1'
                onClick={() => {
                  modalContext?.openModal('Login');
                }}
              >
                Login with your wallet
              </Button>
            </div>
          )}
          <div className='trending-topics'>
            <div className='title'>Trending Topics</div>
            <div className='topics-wrapper'>
              {topics.map((topic) => {
                return <div className='topic'>{topic}</div>;
              })}
            </div>
          </div>
          <div className='high-tech'>
            <div className='left'>
              <div
                className='title'
                style={darkTheme ? { color: darkOptionsAndColors.color } : {}}
              >
                High tech made easy
              </div>
              <div className='content'>
                <span>
                  Nuance prioritizes user experience, offering a sleek UX,
                  invisible technology, smooth performance, search indexing, and
                  familiar features such as login with Google and custom
                  domains. This ensures that users enjoy all the conveniences
                  they're accustomed to in Web 2 while benefiting from the
                  transformative capabilities of blockchain technology.
                </span>
              </div>
            </div>
            <img className='right-image' src={images.HIGH_TECH_IMAGE} />
          </div>
          {!isLoggedIn && (
            <div className='login-buttons-wrapper'>
              <Button
                style={
                  darkTheme
                    ? {
                        width: '224px',
                        backgroundColor:
                          darkOptionsAndColors.buttonBackgroundColor,
                        color: darkOptionsAndColors.background,
                      }
                    : { width: '224px' }
                }
                styleType='primary-1'
                onClick={() => {
                  login('NFID');
                }}
              >
                Login with Google
              </Button>

              <Button
                style={
                  darkTheme
                    ? {
                        width: '224px',
                        backgroundColor:
                          darkOptionsAndColors.buttonBackgroundColor,
                        color: darkOptionsAndColors.background,
                      }
                    : { width: '224px' }
                }
                styleType='primary-1'
                onClick={() => {
                  login('ii');
                }}
              >
                Login with Internet Identity
              </Button>
            </div>
          )}
          {!isLoggedIn && (
            <div className='login-button-mobile'>
              <Button
                style={
                  darkTheme
                    ? {
                        width: '185px',
                        backgroundColor:
                          darkOptionsAndColors.buttonBackgroundColor,
                        color: darkOptionsAndColors.background,
                      }
                    : { width: '185px' }
                }
                styleType='primary-1'
                onClick={() => {
                  modalContext?.openModal('Login');
                }}
              >
                Login with your wallet
              </Button>
            </div>
          )}
          <div className='features-wrapper'>
            <div className='title'>Features</div>
            <div className='features-content-wrapper'>
              <div className='features-left'>
                <img
                  className='mask-group'
                  src={images.NUANCE_LOGO_MASK_GROUP}
                />
                {features_left.map((feature) => {
                  return (
                    <div className='feature'>
                      <div
                        className='title'
                        style={
                          darkTheme ? { color: darkOptionsAndColors.color } : {}
                        }
                      >
                        {feature.title}
                      </div>
                      <div className='content'>{feature.content}</div>
                    </div>
                  );
                })}
              </div>
              <div className='features-right'>
                {features_right.map((feature) => {
                  return (
                    <div className='feature'>
                      <div
                        className='title'
                        style={
                          darkTheme ? { color: darkOptionsAndColors.color } : {}
                        }
                      >
                        {feature.title}
                      </div>
                      <div className='content'>{feature.content}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {!isLoggedIn && (
            <div className='login-buttons-wrapper'>
              <Button
                style={
                  darkTheme
                    ? {
                        width: '224px',
                        backgroundColor:
                          darkOptionsAndColors.buttonBackgroundColor,
                        color: darkOptionsAndColors.background,
                      }
                    : { width: '224px' }
                }
                styleType='primary-1'
                onClick={() => {
                  login('NFID');
                }}
              >
                Login with Google
              </Button>

              <Button
                style={
                  darkTheme
                    ? {
                        width: '224px',
                        backgroundColor:
                          darkOptionsAndColors.buttonBackgroundColor,
                        color: darkOptionsAndColors.background,
                      }
                    : { width: '224px' }
                }
                styleType='primary-1'
                onClick={() => {
                  login('ii');
                }}
              >
                Login with Internet Identity
              </Button>
            </div>
          )}
          {!isLoggedIn && (
            <div className='login-button-mobile'>
              <Button
                style={
                  darkTheme
                    ? {
                        width: '185px',
                        backgroundColor:
                          darkOptionsAndColors.buttonBackgroundColor,
                        color: darkOptionsAndColors.background,
                      }
                    : { width: '185px' }
                }
                styleType='primary-1'
                onClick={() => {
                  modalContext?.openModal('Login');
                }}
              >
                Login with your wallet
              </Button>
            </div>
          )}
          <div className='monetize-wrapper'>
            <div className='left'>
              <div className='title'>Monetize your writing effort</div>
              <div className='content'>
                <span>
                  One key feature of Nuance is its ability to enable writers to
                  form a direct financial relationship with their readers
                  without the platform risk.
                </span>
                <span
                  style={
                    darkTheme
                      ? {
                          color: darkOptionsAndColors.color,
                        }
                      : {}
                  }
                >
                  With Nuance, writers can monetize their content in ways not
                  possible on traditional web2 platforms.
                  <li>Real time tips in crypto</li>
                  <li>NFT gated paywalls</li>
                  <li>Subscriptions</li>
                </span>
              </div>
            </div>
            <img className='monetize-image' src={images.MONETIZE_IMAGE} />
          </div>
          <div className='monetize-wrapper-mobile'>
            <img className='monetize-image' src={images.MONETIZE_IMAGE} />
            <div className='content-inside'>
              <div className='title'>Monetize your writing effort</div>
              <div className='content'>
                One key feature of Nuance is its ability to enable writers to
                form a direct financial relationship with their readers without
                the platform risk.
              </div>
            </div>
            <div className='content-outside'>
              With Nuance, writers can monetize their content in ways not
              possible on traditional web2 platforms.
              <li>Real time tips in crypto</li>
              <li>NFT gated paywalls</li>
              <li>Subscriptions</li>
            </div>
          </div>
          {!isLoggedIn && (
            <div className='start-writing'>
              <div className='title'>Start writing now!</div>
              <div className='login-buttons-wrapper'>
                <Button
                  style={
                    darkTheme
                      ? {
                          width: '224px',
                          backgroundColor:
                            darkOptionsAndColors.buttonBackgroundColor,
                          color: darkOptionsAndColors.background,
                        }
                      : { width: '224px' }
                  }
                  styleType='primary-1'
                  onClick={() => {
                    login('NFID');
                  }}
                >
                  Login with Google
                </Button>

                <Button
                  style={
                    darkTheme
                      ? {
                          width: '224px',
                          backgroundColor:
                            darkOptionsAndColors.buttonBackgroundColor,
                          color: darkOptionsAndColors.background,
                        }
                      : { width: '224px' }
                  }
                  styleType='primary-1'
                  onClick={() => {
                    login('ii');
                  }}
                >
                  Login with Internet Identity
                </Button>
              </div>
            </div>
          )}
          {!isLoggedIn && (
            <div className='login-button-mobile'>
              <Button
                style={
                  darkTheme
                    ? {
                        width: '185px',
                        backgroundColor:
                          darkOptionsAndColors.buttonBackgroundColor,
                        color: darkOptionsAndColors.background,
                      }
                    : { width: '185px' }
                }
                styleType='primary-1'
                onClick={() => {
                  modalContext?.openModal('Login');
                }}
              >
                Login with your wallet
              </Button>
            </div>
          )}
          <div className='start-a-movement'>
            <div className='left'>
              <div
                className='title'
                style={darkTheme ? { color: darkOptionsAndColors.color } : {}}
              >
                Start building your web3 audience today!
              </div>
              <div className='content'>
                <span>
                  Nuance provides a publication feature that enables projects
                  and writers to have their own branding, a landing page, and
                  writer management features, allowing teams to establish their
                  own unique presence and identity on the platform.
                </span>
                <span>
                  Log in with Google or Internet Identity (or Stoic or
                  Bitfinity) and Join Nuance today to experience the future of
                  online blogging. Where creators are empowered, content is
                  secure, and communities thrive.
                </span>
              </div>
            </div>
            <img className='right-image' src={images.START_ON_CHAIN_IMAGE} />
          </div>
          <div className='end-colorful-divider'></div>
        </div>
      )}

      {selectedTab === 'Articles' && (
        <div className='articles-section-wrapper'>
          {isLoggedIn && user ? (
            <div className='left'>
              <div className='user-info'>
                <img
                  className='avatar'
                  src={user.avatar || images.DEFAULT_AVATAR}
                />
                <div className='display-name'>{user.displayName}</div>
                <Link
                  to='/my-profile'
                  className='handle'
                  style={darkTheme ? { color: darkOptionsAndColors.color } : {}}
                >
                  @{user.handle}
                </Link>
              </div>
              {(user.website.length !== 0 ||
                user.socialChannels.length !== 0) && (
                <div className='social-channels'>
                  {[user.website, ...user.socialChannels].map((url, index) => {
                    return (
                      <div
                        key={index}
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
                          anchorSelect={'#my-social-channel-' + index}
                          place='top'
                          noArrow={true}
                        >
                          {url}
                        </Tooltip>
                        <img
                          className='social-channel-icon'
                          src={getIconForSocialChannel(url, darkTheme)}
                          id={'my-social-channel-' + index}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                className='articles'
                style={
                  darkTheme
                    ? {
                        color: darkOptionsAndColors.color,
                      }
                    : {}
                }
              >
                <Link
                  to={'/my-profile/articles?page=published'}
                  style={
                    darkTheme
                      ? {
                          color: darkOptionsAndColors.color,
                        }
                      : {}
                  }
                >{`${counts?.publishedCount || 0} articles published`}</Link>
                <div>|</div>
                <Link
                  to={'/my-profile/articles?page=draft'}
                  style={
                    darkTheme
                      ? {
                          color: darkOptionsAndColors.color,
                        }
                      : {}
                  }
                >{`${counts?.draftCount || 0} articles in draft`}</Link>
              </div>
              <Button
                styleType='secondary'
                type='button'
                style={
                  darkTheme
                    ? {
                        backgroundColor:
                          darkOptionsAndColors.buttonBackgroundColor,
                        width: '146px',
                        margin: '0',
                      }
                    : {
                        width: '146px',
                        margin: '0',
                      }
                }
                onClick={() => {
                  navigate('/article/new');
                }}
              >
                Create new article
              </Button>
            </div>
          ) : (
            <div className='left'>
              <img
                className='blue-logo'
                style={{ filter: darkOptionsAndColors.filter }}
                src={images.NUANCE_LOGO_BLUE_TEXT}
              />
              <div className='blogging-to-the-people'>
                Blogging to the people!
              </div>
              <div
                className='content'
                style={darkTheme ? { color: darkOptionsAndColors.color } : {}}
              >
                <div>
                  Nuance is a blockhain blog platform empowering writers all
                  over the world.
                </div>
                <div>Become a writer and share your knowledge unlimited!</div>
                <div>Login with:</div>
              </div>
              <div className='login-options'>
                <div className='login-option-wrapper'>
                  <Button
                    styleType='primary-1'
                    type='button'
                    style={
                      darkTheme
                        ? {
                            backgroundColor:
                              darkOptionsAndColors.buttonBackgroundColor,
                            color: darkOptionsAndColors.background,
                            width: '176px',
                            margin: '0',
                          }
                        : { width: '176px', margin: '0' }
                    }
                    onClick={() => {
                      login('ii');
                    }}
                  >
                    Internet Identity
                  </Button>
                  <a
                    className='login-info-text'
                    href={'https://internetcomputer.org/internet-identity'}
                    target='_blank'
                  >
                    You’re not hardcore unless you live hardcore
                  </a>
                </div>
                <div className='login-option-wrapper'>
                  <Button
                    styleType='primary-1'
                    type='button'
                    style={
                      darkTheme
                        ? {
                            backgroundColor:
                              darkOptionsAndColors.buttonBackgroundColor,
                            color: darkOptionsAndColors.background,
                            width: '176px',
                            margin: '0',
                          }
                        : { width: '176px', margin: '0' }
                    }
                    onClick={() => {
                      login('NFID');
                    }}
                  >
                    Google
                  </Button>
                  <a
                    className='login-info-text'
                    href={'https://learn.nfid.one/'}
                    target='_blank'
                  >
                    Enhanced with cryptography by NFID
                  </a>
                </div>
                <div
                  onClick={() => {
                    modalContext?.openModal('Login');
                  }}
                  className='other-options'
                >
                  Other options?
                </div>
              </div>
            </div>
          )}
          {isLoggedIn && user ? (
            <div
              className='left-mobile'
              style={mobileMenuOpen ? { minWidth: '202px' } : {}}
            >
              <div
                className='menu-button'
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
              >
                <div
                  className={`burger-menu-icon ${
                    mobileMenuOpen ? 'active' : ''
                  }`}
                >
                  {[0, 0, 0].map(() => (
                    <span
                      style={{ backgroundColor: darkOptionsAndColors.color }}
                    ></span>
                  ))}
                </div>
              </div>
              <div
                className='user-info'
                style={mobileMenuOpen ? {} : { display: 'none' }}
              >
                <img
                  className='avatar'
                  src={user.avatar || images.DEFAULT_AVATAR}
                />
                <div className='display-name'>{user.displayName}</div>
                <Link
                  to='/my-profile'
                  className='handle'
                  style={darkTheme ? { color: darkOptionsAndColors.color } : {}}
                >
                  @{user.handle}
                </Link>
              </div>
              {(user.website.length !== 0 ||
                user.socialChannels.length !== 0) && (
                <div
                  className='social-channels'
                  style={mobileMenuOpen ? {} : { display: 'none' }}
                >
                  {[user.website, ...user.socialChannels].map((url, index) => {
                    return (
                      <div
                        key={index}
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
                          anchorSelect={'#my-social-channel-' + index}
                          place='top'
                          noArrow={true}
                        >
                          {url}
                        </Tooltip>
                        <img
                          className='social-channel-icon'
                          src={getIconForSocialChannel(url, darkTheme)}
                          id={'my-social-channel-' + index}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                className='articles'
                style={mobileMenuOpen ? {} : { display: 'none' }}
              >
                <Link
                  to={'/my-profile/articles?page=published'}
                  style={
                    darkTheme
                      ? {
                          color: darkOptionsAndColors.color,
                        }
                      : {}
                  }
                >{`${counts?.publishedCount || 0} articles published`}</Link>
                <div>|</div>
                <Link
                  to={'/my-profile/articles?page=draft'}
                  style={
                    darkTheme
                      ? {
                          color: darkOptionsAndColors.color,
                        }
                      : {}
                  }
                >{`${counts?.draftCount || 0} articles in draft`}</Link>
              </div>
              <Button
                styleType='secondary'
                type='button'
                style={
                  darkTheme
                    ? {
                        backgroundColor:
                          darkOptionsAndColors.buttonBackgroundColor,
                        width: '146px',
                        margin: '0',
                        display: mobileMenuOpen ? '' : 'none',
                      }
                    : {
                        width: '146px',
                        margin: '0',
                        display: mobileMenuOpen ? '' : 'none',
                      }
                }
                onClick={() => {
                  navigate('/article/new');
                }}
              >
                Create new article
              </Button>
            </div>
          ) : (
            <div
              className='left-mobile'
              style={mobileMenuOpen ? { minWidth: '202px' } : {}}
            >
              <div
                className='menu-button'
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
              >
                <div
                  className={`burger-menu-icon ${
                    mobileMenuOpen ? 'active' : ''
                  }`}
                >
                  {[0, 0, 0].map(() => (
                    <span
                      style={{ backgroundColor: darkOptionsAndColors.color }}
                    ></span>
                  ))}
                </div>
              </div>
              <div
                className='blogging-to-the-people'
                style={mobileMenuOpen ? {} : { display: 'none' }}
              >
                Blogging to the people!
              </div>
              <div
                className='content'
                style={
                  darkTheme
                    ? {
                        color: darkOptionsAndColors.color,
                        display: mobileMenuOpen ? 'flex' : 'none',
                      }
                    : { display: mobileMenuOpen ? 'flex' : 'none' }
                }
              >
                <div>
                  Nuance is a blockhain blog platform empowering writers all
                  over the world.
                </div>
                <div>Become a writer and share your knowledge unlimited!</div>
                <div>Login with:</div>
              </div>
              <div
                className='login-options'
                style={mobileMenuOpen ? {} : { display: 'none' }}
              >
                <div className='login-option-wrapper'>
                  <Button
                    styleType='primary-1'
                    type='button'
                    style={
                      darkTheme
                        ? {
                            backgroundColor:
                              darkOptionsAndColors.buttonBackgroundColor,
                            color: darkOptionsAndColors.background,
                            width: '176px',
                            margin: '0',
                          }
                        : { width: '176px', margin: '0' }
                    }
                    onClick={() => {
                      login('ii');
                    }}
                  >
                    Internet Identity
                  </Button>
                  <a
                    className='login-info-text'
                    href={'https://internetcomputer.org/internet-identity'}
                    target='_blank'
                  >
                    You’re not hardcore unless you live hardcore
                  </a>
                </div>
                <div className='login-option-wrapper'>
                  <Button
                    styleType='primary-1'
                    type='button'
                    style={
                      darkTheme
                        ? {
                            backgroundColor:
                              darkOptionsAndColors.buttonBackgroundColor,
                            color: darkOptionsAndColors.background,
                            width: '176px',
                            margin: '0',
                          }
                        : { width: '176px', margin: '0' }
                    }
                    onClick={() => {
                      login('NFID');
                    }}
                  >
                    Google
                  </Button>
                  <a
                    className='login-info-text'
                    href={'https://learn.nfid.one/'}
                    target='_blank'
                  >
                    Enhanced with cryptography by NFID
                  </a>
                </div>
                <div
                  onClick={() => {
                    modalContext?.openModal('Login');
                  }}
                  className='other-options'
                >
                  Other options?
                </div>
              </div>
            </div>
          )}
          <div className='right'>
            <img className='mask-group' src={images.NUANCE_LOGO_MASK_GROUP} />
            <div
              className='searchbar-wrapper'
              onFocus={() => setIsBlur(true)}
              onBlur={() => setIsBlur(false)}
            >
              <SearchBar
                value={searchText}
                onKeyDown={onKeyDown}
                onChange={(value) => setSearchText(value)}
              />
            </div>
            <div
              className='tabs-and-grid-wrapper'
              style={isBlur ? { filter: 'blur(2px)' } : {}}
            >
              <div className='tabs'>
                <div className='left-items'>
                  {isLoggedIn && (
                    <div
                      onClick={() => {
                        setTab('writers');
                        setSearchText('');
                        setPage(0);
                        loadWritersPosts(0, true);
                        navigate(`?tab=writers&page=0`, { replace: true });
                      }}
                      className={tab === 'writers' ? 'item-selected' : 'item'}
                      style={
                        darkTheme ? { color: darkOptionsAndColors.color } : {}
                      }
                    >
                      Writers
                    </div>
                  )}
                  {isLoggedIn && (
                    <div
                      onClick={() => {
                        setTab('topics');
                        setSearchText('');
                        setPage(0);
                        loadFollowingTagsPosts(0, true);
                        navigate(`?tab=topics&page=0`, { replace: true });
                      }}
                      style={
                        darkTheme ? { color: darkOptionsAndColors.color } : {}
                      }
                      className={tab === 'topics' ? 'item-selected' : 'item'}
                    >
                      Topics
                    </div>
                  )}
                  <div
                    onClick={() => {
                      setTab('popular');
                      setSearchText('');
                      setPage(0);
                      switch (popularFilter) {
                        case 'Ever':
                          loadPopularPostsEver(0, true);
                          break;
                        case 'This month':
                          loadPopularPostsThisMonth(0, true);
                          break;
                        case 'This week':
                          loadPopularPostsThisWeek(0, true);
                          break;
                        case 'Today':
                          loadPopularPostsToday(0, true);
                          break;
                      }
                      navigate(`?tab=popular&page=0`, { replace: true });
                    }}
                    style={
                      darkTheme ? { color: darkOptionsAndColors.color } : {}
                    }
                    className={tab === 'popular' ? 'item-selected' : 'item'}
                  >
                    Popular
                  </div>
                  <div
                    onClick={() => {
                      setTab('new');
                      setSearchText('');
                      setPage(0);
                      loadLatestPosts(0, true);
                      navigate(`?tab=new&page=0`, { replace: true });
                    }}
                    style={
                      darkTheme ? { color: darkOptionsAndColors.color } : {}
                    }
                    className={tab === 'new' ? 'item-selected' : 'item'}
                  >
                    New
                  </div>
                </div>
                {tab === 'search' && (
                  <div
                    className='search-item'
                    style={
                      darkTheme ? { color: darkOptionsAndColors.color } : {}
                    }
                  >
                    Search Results
                  </div>
                )}
              </div>
              {tab === 'popular' && (
                <Dropdown
                  style={{
                    alignSelf: 'end',
                    width: '120px',
                    height: '27px',
                    top: '50px',
                    position: 'absolute',
                    right: '0',
                  }}
                  selectedTextStyle={{ fontSize: '14px', fontWeight: '400' }}
                  drodownItemsWrapperStyle={{
                    rowGap: '0',
                    top: '29px',
                  }}
                  items={popularFiltersArray}
                  onSelect={(item) => {
                    setPopularFilter(item as PopularFilterType);
                    setPage(0);
                    const queryParams = queryString.parse(location.search);
                    queryParams.page = '0';
                    navigate(`?${queryString.stringify(queryParams)}`);
                  }}
                  uniqueId={'homepage-popular-filter-menu'}
                  selected={popularFilter}
                />
              )}
              {tab !== 'search' && (
                <div className='homepage-vertical-grid'>
                  {getDisplayingPosts()
                    .slice(0, 10)
                    .map((post) => {
                      return <CardVertical key={post.postId} post={post} />;
                    })}
                </div>
              )}
              {tab !== 'search' && (
                <div className='homepage-horizontal-flex'>
                  {getDisplayingPosts()
                    .slice(10)
                    .map((post) => {
                      return (
                        <CardPublishedArticles post={post} key={post.postId} />
                      );
                    })}
                </div>
              )}
              {tab === 'search' &&
                (searchLoading ? (
                  <Loader />
                ) : (
                  <div className='search-results-wrapper'>
                    <SearchResults
                      term={lastSearchTerm}
                      articles={searchPostResults}
                      publications={searchPublicationResults}
                      users={searchUserResults}
                      counts={{
                        articlesCount: searchPostResults.length,
                        publicationsCount: searchPublicationResults.length,
                        usersCount: searchUserResults.length,
                      }}
                      allTags={allTags}
                    />
                  </div>
                ))}
              {getDisplayingPostsTotalCount() > getDisplayingPosts().length && (
                <Button
                  styleType='secondary'
                  style={
                    darkTheme
                      ? {
                          backgroundColor:
                            darkOptionsAndColors.buttonBackgroundColor,
                          width: '152px',
                          marginBottom: '56px',
                        }
                      : { width: '152px', marginBottom: '56px' }
                  }
                  onClick={() => {
                    loadMoreHandler();
                  }}
                  icon={loadMoreLoading ? images.loaders.BUTTON_SPINNER : ''}
                  dark={darkTheme}
                >
                  <span>Load More</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;