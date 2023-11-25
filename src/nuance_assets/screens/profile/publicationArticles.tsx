import React, { useEffect, useState, useContext } from 'react';
import { usePostStore, useUserStore, usePublisherStore } from '../../store';
import { images } from '../../shared/constants';
import { useNavigate } from 'react-router-dom';
import { PostType } from '../../../nuance_assets/types/types';
import { Row, Col } from 'react-bootstrap';
import { colors } from '../../shared/constants';
import Button from '../../UI/Button/Button';
import Footer from '../../components/footer/footer';
import SearchBar from '../../components/search-bar/search-bar';
import { TagModel } from '../../services/actorService';
import { Context } from '../../contextes/Context';
import EditorArticleList from '../../components/editor-article-list/editor-article-list';
import EditorSearchList from '../../components/editor-search-list/editor-search-list';
import { useTheme } from '../../contextes/ThemeContext';

const PublicationArticles = () => {
  const navigate = useNavigate();
  const pageSize = 20;
  const [publicationHandle, setPublicationHandle] = useState<any>('');
  const [publicationDisplayName, setPublicationDisplayName] = useState<any>('');
  const [writersCount, setWritersCount] = useState<any>(0);
  const [articlesCount, setArticlesCount] = useState<any>(0);
  const [categoriesCount, setCategoriesCount] = useState<any>(0);
  const [followersCount, setFollowersCount] = useState<any>('0');
  const [displayingPosts, setDisplayingPosts] = useState<PostType[]>([]);
  const [publicationAvatar, setPublicationAvatar] = useState<any>('');
  const [sortedByPublishedDate, setSortedByPublishedDate] = useState(true);
  const [sortedByLastModifiedDate, setSortedByLastModifiedDate] =
    useState(false);
  const [loadMoreCounter, setLoadMoreCounter] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categories, setCategories] = useState<any>([]);
  const [publicationPostIds, setPublicationPostIds] = useState<string[]>([]);
  const [isBlur, setIsBlur] = useState(false);
  const [loadingSearchResults, setLoadingSearchResults] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoadMoreCounter, setSearchLoadMoreCounter] = useState(0);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [lastSearchPhrase, setLastSearchPhrase] = useState('');
  const [searchedTag, setSearchedTag] = useState<TagModel>();
  const [searchedPosts, setSearchedPosts] = useState<PostType[]>([]);
  const [
    sortedByPublishedDateSearchedPosts,
    setSortedByPublishedDateSearchedPosts,
  ] = useState(true);
  const [
    sortedByLastModifiedDateSearchedPosts,
    setSortedByLastModifiedDateSearchedPosts,
  ] = useState(false);
  const [userIsNotEditor, setUserIsNotEditor] = useState(false);
  const [displayingPostsLoading, setDisplayingPostsLoading] = useState(false);
  const darkTheme = useTheme();

  const {
    publication,
    getPublication,
    getPublicationPosts,
    savePublicationPost,
    removePublicationPostCategory,
    addPublicationPostCategory,
    updatePublicationPostDraft,
  } = usePublisherStore((state) => ({
    publication: state.publication,
    getPublication: state.getPublication,
    getPublicationPosts: state.getPublicationPosts,
    savePublicationPost: state.savePublicationPost,
    removePublicationPostCategory: state.removePublicationPostCategory,
    addPublicationPostCategory: state.addPublicationPostCategory,
    updatePublicationPostDraft: state.updatePublicationPostDraft,
  }));

  const {
    writerPostCounts,
    getWriterPostCounts,
    getUserFollowersCount,
    userFollowersCount,
    user,
  } = useUserStore((state) => ({
    userPostCounts: state.userPostCounts,
    getWriterPostCounts: state.getWriterPostCounts,
    writerPostCounts: state.writerPostCounts,
    getUserFollowersCount: state.getUserFollowersCount,
    userFollowersCount: state.userFollowersCount,
    user: state.user,
  }));

  const {
    searchText,
    setSearchText,
    searchWithinPublication,
    searchResults,
    searchTotalCount,
    clearSearch,
    getAllTags,
    allTags,
    userPostIds,
    getUserPostIds,
  } = usePostStore((state) => ({
    searchText: state.searchText,
    setSearchText: state.setSearchText,
    searchWithinPublication: state.searchWithinPublication,
    searchResults: state.searchResults,
    searchTotalCount: state.searchTotalCount,
    clearSearch: state.clearSearch,
    getAllTags: state.getAllTags,
    allTags: state.allTags,
    userPostIds: state.userPostIds,
    getUserPostIds: state.getUserPostIds,
  }));
  const context = useContext(Context);
  const featureIsLive = context.publicationFeature;

  useEffect(() => {
    setArticlesCount(writerPostCounts?.totalPostCount);
  }, [writerPostCounts]);

  useEffect(() => {
    setFollowersCount(userFollowersCount);
  }, [userFollowersCount]);

  useEffect(() => {
    if (publication) {
      setCategories(publication?.categories);
      setWritersCount(publication?.writers.length);
      setCategoriesCount(publication?.categories.length);
      setPublicationDisplayName(publication?.publicationTitle);
      setPublicationAvatar(publication?.avatar);
    }

    let lowCasePublicationEditors = publication?.editors.map(
      (editor: string) => {
        return editor.toLowerCase();
      }
    );
    if (
      lowCasePublicationEditors?.includes(
        user?.handle.toLowerCase() as string
      ) == false
    ) {
      setUserIsNotEditor(true);
    }
  }, [publication]);

  useEffect(() => {
    if (userPostIds) {
      setPublicationPostIds(userPostIds);
    }
  }, [userPostIds]);

  const getPublicationHandleFromUrl = () => {
    return window.location.pathname.substring(
      window.location.pathname.lastIndexOf('/') + 1
    );
  };

  useEffect(() => {
    setDisplayingPosts([]);
    const handleName = getPublicationHandleFromUrl();
    setPublicationHandle(handleName);
    getPublication(handleName);
    getWriterPostCounts(handleName);
    getUserFollowersCount(handleName);
    getUserPostIds(handleName);
    loadInitial(handleName);
    getAllTags();
    setShowSearchResults(false);
    clearSearch();
  }, [window.location.pathname]);

  const toggleHandler = async (postId: string, isDraft: boolean) => {
    await updatePublicationPostDraft(postId, isDraft, publicationHandle);
  };
  const categoryChangeHandler = async (
    post: PostType,
    selectedCategory: string
  ) => {
    if (selectedCategory === '') {
      await removePublicationPostCategory(post.postId, publicationHandle);
    } else {
      await addPublicationPostCategory(
        post.postId,
        selectedCategory,
        publicationHandle
      );
    }
  };

  const handleSortByPublishedDate = () => {
    const sorted = displayingPosts.sort((post_1: any, post_2: any) => {
      if (sortedByPublishedDate) {
        setSortedByPublishedDate(false);
        setSortedByLastModifiedDate(false);
        return parseInt(post_1.created) - parseInt(post_2.created);
      }
      setSortedByPublishedDate(true);
      setSortedByLastModifiedDate(false);
      return parseInt(post_2.created) - parseInt(post_1.created);
    });
    if (sorted.length && getPublicationHandleFromUrl() === sorted[0].handle) {
      setDisplayingPosts([...sorted]);
    }
  };

  const handleSortByModifiedDate = () => {
    const sorted = displayingPosts.sort((post_1: any, post_2: any) => {
      if (sortedByLastModifiedDate) {
        setSortedByPublishedDate(false);
        setSortedByLastModifiedDate(false);
        return parseInt(post_1.modified) - parseInt(post_2.modified);
      }
      setSortedByPublishedDate(false);
      setSortedByLastModifiedDate(true);
      return parseInt(post_2.modified) - parseInt(post_1.modified);
    });
    if (sorted.length && getPublicationHandleFromUrl() === sorted[0].handle) {
      setDisplayingPosts([...sorted]);
    }
  };

  const handleSortByPublishedDateSearchedPosts = () => {
    const sorted = searchedPosts.sort((post_1: any, post_2: any) => {
      if (sortedByPublishedDateSearchedPosts) {
        setSortedByPublishedDateSearchedPosts(false);
        setSortedByLastModifiedDateSearchedPosts(false);
        return parseInt(post_1.created) - parseInt(post_2.created);
      }
      setSortedByPublishedDateSearchedPosts(true);
      setSortedByLastModifiedDateSearchedPosts(false);
      return parseInt(post_2.created) - parseInt(post_1.created);
    });
    setSearchedPosts([...sorted]);
  };

  const handleSortByModifiedDateSearchedPosts = () => {
    const sorted = searchedPosts.sort((post_1: any, post_2: any) => {
      if (sortedByLastModifiedDateSearchedPosts) {
        setSortedByPublishedDateSearchedPosts(false);
        setSortedByLastModifiedDateSearchedPosts(false);
        return parseInt(post_1.modified) - parseInt(post_2.modified);
      }
      setSortedByPublishedDateSearchedPosts(false);
      setSortedByLastModifiedDateSearchedPosts(true);
      return parseInt(post_2.modified) - parseInt(post_1.modified);
    });
    setSearchedPosts([...sorted]);
  };

  const loadMoreHandler = async () => {
    setLoadingMore(true);
    let counter =
      displayingPosts.length === 0 ? loadMoreCounter - 1 : loadMoreCounter;
    let posts = await getPublicationPosts(
      (counter - 1) * 20 + 20,
      19 + counter * 20,
      publicationHandle
    );
    if (posts?.length) {
      setDisplayingPosts([...displayingPosts, ...posts]);
    }
    setLoadMoreCounter(counter + 1);
    setLoadingMore(false);
  };

  const loadInitial = async (handle: string) => {
    setDisplayingPostsLoading(true);
    context.setProfileSidebarDisallowed(true)
    let posts = await getPublicationPosts(0, 19, handle);
    if (posts?.length) {
      setDisplayingPosts(posts);
    }
    context.setProfileSidebarDisallowed(false)
    setDisplayingPostsLoading(false);
  };

  const onKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      if (searchText == '') {
        return;
      }
      setIsBlur(false);
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
  useEffect(() => {
    if (searchResults) {
      if (
        !sortedByLastModifiedDateSearchedPosts ||
        !sortedByPublishedDateSearchedPosts
      ) {
        if (sortedByLastModifiedDateSearchedPosts) {
          setSearchedPosts([
            ...searchResults.sort((post_1: any, post_2: any) => {
              return parseInt(post_2.modified) - parseInt(post_1.modified);
            }),
            ...searchedPosts,
          ]);
        } else {
          setSearchedPosts([
            ...searchResults.sort((post_1: any, post_2: any) => {
              return parseInt(post_2.created) - parseInt(post_1.created);
            }),
            ...searchedPosts,
          ]);
        }
      } else {
        setSearchedPosts(searchResults);
      }
      setLoadingSearchResults(false);
      setSearchLoadingMore(false);
    }
  }, [searchResults]);

  useEffect(() => {
    if (searchText !== lastSearchPhrase) {
      setSearchLoadMoreCounter(0);
    }
  }, [searchText]);

  if (featureIsLive == false || userIsNotEditor) {
    return (
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
            : userIsNotEditor
            ? 'You are not an Editor of this publication so you are unauthorized to view this page'
            : 'You are unauthorized to view this page'}
        </h2>
      </div>
    );
  }
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
    <div className='wrapper'>
      <div
        style={{ marginTop: '-50px' }}
        onFocus={() => setIsBlur(true)}
        onBlur={() => setIsBlur(false)}
      >
        <SearchBar
          value={searchText}
          onKeyDown={onKeyDown}
          onChange={(value) => setSearchText(value)}
        />
      </div>
      <div style={isBlur ? { filter: 'blur(5px)' } : {}}>
        <Row style={{ marginBottom: '50px', alignItems: 'center' }}>
          <Col sm={9}>
            <div style={{ marginLeft: '20px' }}>
              <div style={{ marginLeft: '10px' }}>
                <p
                  style={{
                    color: colors.darkerBorderColor,
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                >
                  {publicationDisplayName}
                </p>
              </div>
              <div
                style={{
                  color: darkOptionsAndColors.color,
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                <span style={{ color: darkOptionsAndColors.color }}>
                  <img
                    style={{
                      width: '35px',
                      padding: '5px',
                      borderRadius: '50%',
                    }}
                    src={`${publicationAvatar}` || images.DEFAULT_AVATAR}
                  />
                </span>
                <span style={{ color: darkOptionsAndColors.color }}>@</span>
                {publicationHandle}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: '12px',
                  color: colors.primaryTextColor,
                  margin: '10px 10px ',
                }}
              >
                <small style={{ color: darkOptionsAndColors.color }}>
                  {articlesCount} articles
                </small>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <small style={{ color: darkOptionsAndColors.color }}>
                  {writersCount} writers
                </small>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <small style={{ color: darkOptionsAndColors.color }}>
                  {categoriesCount} categories
                </small>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <small style={{ color: darkOptionsAndColors.color }}>
                  {followersCount} followers
                </small>
              </div>
            </div>
          </Col>
          <Col style={{ marginLeft: 'calc(100% - 160px)' }}>
            <Button
              styleType='secondary'
              type='button'
              style={{ width: '115px' }}
              onClick={() => navigate(`/publication/edit/${publicationHandle}`)}
            >
              Edit Publication
            </Button>
          </Col>
        </Row>

        {showSearchResults ? (
          <EditorSearchList
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
            categoryChangeHandler={categoryChangeHandler}
            categories={categories}
            toggleHandler={toggleHandler}
            sortedByLastModifiedDate={sortedByLastModifiedDateSearchedPosts}
            sortedByPublishedDate={sortedByPublishedDateSearchedPosts}
            handleSortByModifiedDate={handleSortByModifiedDateSearchedPosts}
            handleSortByPublishedDate={handleSortByPublishedDateSearchedPosts}
          />
        ) : (
          <EditorArticleList
            displayingPosts={displayingPosts}
            displayingPostsLoading={displayingPostsLoading}
            categoryChangeHandler={categoryChangeHandler}
            categories={categories}
            toggleHandler={toggleHandler}
            articlesCount={articlesCount}
            handleLoadMore={loadMoreHandler}
            loadingMore={loadingMore}
            handleSortByModifiedDate={handleSortByModifiedDate}
            handleSortByPublishedDate={handleSortByPublishedDate}
            sortedByLastModifiedDate={sortedByLastModifiedDate}
            sortedByPublishedDate={sortedByPublishedDate}
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PublicationArticles;