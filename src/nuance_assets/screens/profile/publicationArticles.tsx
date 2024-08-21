import React, { useEffect, useState, useContext } from 'react';
import { usePostStore, useUserStore, usePublisherStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { PostType } from '../../../nuance_assets/types/types';
import { colors, images } from '../../shared/constants';
import Footer from '../../components/footer/footer';
import SearchBar from '../../components/search-bar/search-bar';
import { TagModel } from '../../services/actorService';
import { Context } from '../../contextes/Context';
import EditorArticleList from '../../components/editor-article-list/editor-article-list';
import EditorSearchList from '../../components/editor-search-list/editor-search-list';
import { useTheme } from '../../contextes/ThemeContext';
import './_publication-articles.scss';
import Button from '../../UI/Button/Button';

import PublicationSubscribersTab from './publication-subscribers-tab';
import { PublisherStore } from '../../store/publisherStore';
import { UserStore } from '../../store/userStore';
import { PostStore } from '../../store/postStore';

const PublicationArticles = () => {
  const navigate = useNavigate();
  const pageSize = 20;
  const [activeTab, setActiveTab] = useState('articles'); // State to track active tab
  const [publicationHandle, setPublicationHandle] = useState<any>('');
  const [publicationDisplayName, setPublicationDisplayName] = useState<any>('');
  const [publicationHeaderImage, setPublicationHeaderImage] = useState<any>('');
  const [writersCount, setWritersCount] = useState<any>(0);
  const [articlesCount, setArticlesCount] = useState<any>(0);
  const [premiumArticlesCount, setPremiumArticlesCount] = useState<any>(0);
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
    removePublicationPostCategory,
    addPublicationPostCategory,
    updatePublicationPostDraft,
  } = usePublisherStore((state: PublisherStore) => ({
    publication: state.publication,
    getPublication: state.getPublication,
    getPublicationPosts: state.getPublicationPosts,
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
  } = useUserStore((state: UserStore) => ({
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
    getSavedPostReturnOnly,
  } = usePostStore((state: PostStore) => ({
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
    getSavedPostReturnOnly: state.getSavedPostReturnOnly,
  }));
  const context = useContext(Context);
  const featureIsLive = context.publicationFeature;

  useEffect(() => {
    setArticlesCount(writerPostCounts?.totalPostCount);
  }, [writerPostCounts]);

  useEffect(() => {
    setPremiumArticlesCount(writerPostCounts?.premiumCount);
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
      setPublicationHeaderImage(publication.headerImage);
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
    //handle the sorting
    if (showSearchResults) {
      if (sortedByPublishedDateSearchedPosts) {
        handleSortByPublishedDateSearchedPosts();
      } else {
        handleSortByModifiedDateSearchedPosts();
      }
    } else {
      if (sortedByPublishedDate) {
        handleSortByPublishedDate();
      } else {
        handleSortByModifiedDate();
      }
    }
  }, [loadingSearchResults, displayingPostsLoading]);

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
    console.log('before update');
    await updatePublicationPostDraft(postId, isDraft, publicationHandle);
    console.log('after update');
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
        return parseInt(post_2.created) - parseInt(post_1.created);
      }
      setSortedByPublishedDate(true);
      setSortedByLastModifiedDate(false);
      return parseInt(post_1.created) - parseInt(post_2.created);
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
        return parseInt(post_2.modified) - parseInt(post_1.modified);
      }
      setSortedByPublishedDate(false);
      setSortedByLastModifiedDate(true);
      return parseInt(post_1.modified) - parseInt(post_2.modified);
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
      20 + counter * 20,
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
    context.setProfileSidebarDisallowed(true);
    let posts = await getPublicationPosts(0, 20, handle);
    if (posts?.length) {
      setDisplayingPosts(posts);
    }
    context.setProfileSidebarDisallowed(false);
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
    if (loadingSearchResults || !publication) {
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
          publication.publicationHandle,
          user
        );
        setSearchLoadMoreCounter(searchLoadMoreCounter + 1);
      } else {
        searchWithinPublication(
          phrase,
          isTagSearch,
          0,
          20,
          publication.publicationHandle,
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

  const refreshPost = async (postId: string) => {
    setDisplayingPostsLoading(true);
    setLoadingSearchResults(true);
    let response = await getSavedPostReturnOnly(postId, true);
    if (response) {
      let refreshedPost = response;
      setDisplayingPosts(
        displayingPosts.map((displayingPost) => {
          if (displayingPost.postId === refreshedPost.postId) {
            return refreshedPost;
          } else {
            return displayingPost;
          }
        })
      );
    }
    setLoadingSearchResults(false);
    setDisplayingPostsLoading(false);
  };

  return (
    <div className='wrapper' style={{ rowGap: '50px' }}>
      <div
        className='publication-article-list-searchbar'
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
        className='publication-article-list-publication-and-posts-wrapper'
        style={isBlur ? { filter: 'blur(5px)' } : {}}
      >
        <div className='publication-info-wrapper'>
          <p className='display-name'>{publicationHandle}</p>
          <div className='publication-info-horizontal-flex'>
            <img className='header-image' src={publicationHeaderImage} />
            <div className='publication-info-vertical-flex'>
              <div className='name-edit-button'>
                <div style={darkOptionsAndColors} className='name'>
                  {publicationDisplayName}
                </div>
                <Button
                  styleType={{dark: 'white', light: 'white'}}
                  type='button'
                  style={
                    context.width < 1089
                      ? {
                        width: '100px',
                        height: '25px',
                        fontSize: '12px',
                        margin: '0',
                      }
                      : { width: '115px', margin: '0' }
                  }
                  onClick={() =>
                    navigate(`/publication/edit/${publicationHandle}`)
                  }
                >
                  Edit Publication
                </Button>
              </div>
              <p className='subtitle'>
                {publication?.subtitle || 'The description of the publication.'}
              </p>
              <div className='avatar-stats-wrapper'>
                <div className='avatar-handle'>
                  <img
                    className='avatar'
                    src={publicationAvatar || images.DEFAULT_AVATAR}
                  />
                  <p className='handle' style={darkOptionsAndColors}>
                    @{publicationHandle}
                  </p>
                </div>
                <div
                  className='stats'
                  style={
                    darkTheme
                      ? {
                        color: colors.darkSecondaryTextColor,
                      }
                      : {}
                  }
                >
                  <p className='stat'>{articlesCount} articles</p>
                  <p className='stat'>{writersCount} writers</p>
                  <p className='stat'>{categoriesCount} categories</p>
                  <p className='stat'>{followersCount} followers</p>
                  <p className='stat-without-border'>
                    {premiumArticlesCount} NFTs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={darkTheme ? 'tabs dark' : 'tabs'}>
          <button onClick={() => setActiveTab('articles')} className={activeTab === 'articles' ? 'active' : darkTheme ? 'dark' : ''}>Articles</button>
          <button onClick={() => setActiveTab('subscribers')} className={activeTab === 'subscribers' ? 'active' : darkTheme ? 'dark' : ''}>Subscribers</button>
        </div>
        {activeTab === 'articles' && (
          showSearchResults ? (
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
              publication={publication}
              refreshPosts={async (postId: string) => {
                await refreshPost(postId);
              }}
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
              publication={publication}
              refreshPosts={async (postId: string) => {
                await refreshPost(postId);
              }}
            />
          )
        )}
        {activeTab === 'subscribers' && <PublicationSubscribersTab publicationInfo={publication} />}
      </div>
      <Footer />
    </div>
  );
};
export default PublicationArticles;



