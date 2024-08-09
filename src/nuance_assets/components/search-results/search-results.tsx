import React, { useEffect, useState } from 'react';
import { useAuthStore, usePostStore, useUserStore } from '../../store';
import { PostType, PublicationType, UserListItem } from '../../types/types';
import { icons, colors, images } from '../../shared/constants';
import './_search-results.scss';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../contextes/ThemeContext';
import SelectionItem from '../../UI/selection-item/selection-item';
import CardPublishedArticles from '../card-published-articles/card-published-articles';
import UserListElement from '../user-list-item/user-list-item';
import { levenshteinDistance } from '../../store/userStore';
import Dropdown from '../../UI/dropdown/dropdown';
import { TagModel } from '../../../declarations/PostCore/PostCore.did';
import { searchTextToTag } from '../../shared/utils';
import Loader from '../../UI/loader/Loader';
import Button from '../../UI/Button/Button';

type Counts = {
  articlesCount: number;
  publicationsCount: number;
  usersCount: number;
};

type FilterType = 'Articles' | 'People' | 'Publications' | 'All';
type SortType = 'Most recent' | 'Relevance';
export const SearchResults = (props: {
  term: string;
  articles: PostType[];
  publications: PublicationType[];
  users: UserListItem[];
  counts: Counts;
  allTags: TagModel[];
  loadMoreArticles: () => Promise<void>;
}) => {
  const darkTheme = useTheme();

  const [selectedFilterType, setSelectedFilterType] =
    useState<FilterType>('All');

  const [sortType, setSortType] = useState<SortType>('Relevance');

  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  //userStore
  const { isLoggedIn } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
  }));

  //postStore
  const { followTag, myTags, unfollowTag } = usePostStore((state) => ({
    followTag: state.followTag,
    myTags: state.myTags,
    unfollowTag: state.unfollowTag,
  }));

  const isTagSearch = () => {
    if (!props.term.startsWith('#')) {
      return false;
    }
    let phrase = props.term.trim();

    // If search starts with #, it's a tag search like #sports
    const tags = searchTextToTag('#' + phrase, props.allTags);
    let isTagSearch = tags.length > 0;
    if (isTagSearch) {
      //setSearchedTag(tags[0]);
      return tags[0].id;
    }
  };

  const [followTagLoading, setFollowTagLoading] = useState(false);

  const getDisplayingUiElement = (
    element: PostType | PublicationType | UserListItem
  ) => {
    if ('postId' in element) {
      //article
      return (
        <CardPublishedArticles key={'post-' + element.postId} post={element} />
      );
    } else if ('publicationHandle' in element) {
      //publication
      return (
        <UserListElement
          key={'publication-' + element.publicationHandle}
          isPublication={true}
          handle={element.publicationHandle}
          displayName={element.publicationTitle}
          avatar={element.avatar}
          articlesCount={element.postCounts?.publishedCount}
          followersCount={'0'}
          bio={element.subtitle}
        />
      );
    } else {
      //user
      return (
        <UserListElement
          key={'user-' + element.handle}
          isPublication={false}
          handle={element.handle}
          displayName={element.displayName}
          avatar={element.avatar}
          followersCount={element.followersCount}
          bio={element.bio}
          articlesCount={element.postCounts?.publishedCount}
        />
      );
    }
  };

  const getDisplayingElements = (): (
    | PublicationType
    | UserListItem
    | PostType
  )[] => {
    switch (selectedFilterType) {
      case 'All':
        //elements = [...props.articles, ...props.publications, ...props.users];
        switch (sortType) {
          case 'Most recent':
            //sort the articles by date on top of the list
            //sort the publications/users by relevance
            let articles = Array.from(props.articles); //copy the articles into another array first
            let articlesSorted = articles.sort((article_1, article_2) => {
              return parseInt(article_2.created) - parseInt(article_1.created);
            });
            let publicationsAndUsers = [...props.publications, ...props.users];
            publicationsAndUsers = publicationsAndUsers.sort(
              (element_1, element_2) => {
                let comparing_text_1 =
                  'publicationHandle' in element_1
                    ? element_1.publicationHandle
                    : element_1.handle;
                let comparing_text_2 =
                  'publicationHandle' in element_2
                    ? element_2.publicationHandle
                    : element_2.handle;
                return (
                  levenshteinDistance(comparing_text_1, props.term) -
                  levenshteinDistance(comparing_text_2, props.term)
                );
              }
            );
            return [...articlesSorted, ...publicationsAndUsers];

          case 'Relevance':
            return [
              ...props.articles,
              ...props.publications,
              ...props.users,
            ].sort((element_1, element_2) => {
              if ('postId' in element_1 && 'postId' in element_2) {
                //both articles
                //keep the current placement
                let first_el_index = props.articles.findIndex((post) => {
                  return post.postId === element_1.postId;
                });
                let second_el_index = props.articles.findIndex((post) => {
                  return post.postId === element_2.postId;
                });
                return first_el_index - second_el_index;
              }
              let comparing_text_1 =
                'postId' in element_1
                  ? element_1.title
                  : 'publicationHandle' in element_1
                  ? element_1.publicationHandle
                  : element_1.handle;
              let comparing_text_2 =
                'postId' in element_2
                  ? element_2.title
                  : 'publicationHandle' in element_2
                  ? element_2.publicationHandle
                  : element_2.handle;
              return (
                levenshteinDistance(comparing_text_1, props.term) -
                levenshteinDistance(comparing_text_2, props.term)
              );
            });
        }

      case 'Articles':
        if (sortType === 'Most recent') {
          let articles = Array.from(props.articles);
          return articles.sort((article_1, article_2) => {
            return parseInt(article_2.created) - parseInt(article_1.created);
          });
        } else {
          return props.articles;
        }

      case 'People':
        return props.users.sort((user_1, user_2) => {
          return (
            levenshteinDistance(user_1.handle, props.term) -
            levenshteinDistance(user_2.handle, props.term)
          );
        });
      case 'Publications':
        return props.publications.sort((user_1, user_2) => {
          return (
            levenshteinDistance(user_1.publicationHandle, props.term) -
            levenshteinDistance(user_2.publicationHandle, props.term)
          );
        });
    }
  };
  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.primaryTextColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
    buttonBackgroundColor: darkTheme
      ? colors.accentColor
      : colors.primaryTextColor,
  };

  return (
    <div className='search-results-wrapper'>
      <div className='search-results-info-wrapper'>
        {isTagSearch() ? (
          <div className='search-results-text'>
            Results for the tag {props.term}{' '}
            {isLoggedIn &&
              (myTags
                ?.map((tag) => tag.tagId)
                .includes(isTagSearch() as string) ? (
                <span
                  className='follow-the-tag'
                  onClick={async () => {
                    setFollowTagLoading(true);
                    let tagId = isTagSearch();
                    if (tagId) {
                      await unfollowTag(tagId);
                    }
                    setFollowTagLoading(false);
                  }}
                  style={followTagLoading ? { cursor: 'not-allowed' } : {}}
                >
                  {followTagLoading && (
                    <img
                      className='spinner'
                      src={images.loaders.NUANCE_LOADER}
                    />
                  )}
                  Unollow the tag
                </span>
              ) : (
                <span
                  className='follow-the-tag'
                  onClick={async () => {
                    setFollowTagLoading(true);
                    let tagId = isTagSearch();
                    if (tagId) {
                      await followTag(tagId);
                    }
                    setFollowTagLoading(false);
                  }}
                  style={followTagLoading ? { cursor: 'not-allowed' } : {}}
                >
                  {followTagLoading && (
                    <img
                      className='spinner'
                      src={images.loaders.NUANCE_LOADER}
                    />
                  )}
                  Follow the tag
                </span>
              ))}
          </div>
        ) : (
          <div className='search-results-text'>{`Results for '${props.term}'`}</div>
        )}

        <div className='search-results-filter-sort-wrapper'>
          <div className='search-results-filter-elements'>
            <SelectionItem
              isSelected={selectedFilterType === 'Articles'}
              text={`Articles (${props.counts.articlesCount})`}
              callBack={() => {
                setSelectedFilterType('Articles');
              }}
            />
            <SelectionItem
              isSelected={selectedFilterType === 'People'}
              text={`People (${props.counts.usersCount})`}
              callBack={() => {
                setSelectedFilterType('People');
              }}
            />
            <SelectionItem
              isSelected={selectedFilterType === 'Publications'}
              text={`Publications (${props.counts.publicationsCount})`}
              callBack={() => {
                setSelectedFilterType('Publications');
              }}
            />
            <SelectionItem
              isSelected={selectedFilterType === 'All'}
              text={`All (${
                props.counts.articlesCount +
                props.counts.usersCount +
                props.counts.publicationsCount
              })`}
              callBack={() => {
                setSelectedFilterType('All');
              }}
            />
          </div>
          <Dropdown
            className='desktop-only-flex'
            uniqueId={'search-results-dropdown-menu'}
            style={{
              alignSelf: 'end',
              width: '120px',
              height: '27px',
              top: '0',
              position: 'absolute',
              right: '0',
            }}
            selectedTextStyle={{ fontSize: '14px', fontWeight: '400' }}
            items={['Relevance', 'Most recent']}
            onSelect={(item: string) => {
              setSortType(item as SortType);
            }}
            drodownItemsWrapperStyle={{
              top: '28px',
              rowGap: 0,
              minWidth: '120px',
            }}
            arrowWidth={12}
          />
          <Dropdown
            className='mobile-only-flex'
            uniqueId={'search-results-dropdown-menu-mobile'}
            style={{
              width: '120px',
              height: '27px',
            }}
            selectedTextStyle={{ fontSize: '14px', fontWeight: '400' }}
            items={['Relevance', 'Most recent']}
            onSelect={(item: string) => {
              setSortType(item as SortType);
            }}
            drodownItemsWrapperStyle={{
              top: '28px',
              rowGap: 0,
              minWidth: '120px',
            }}
            arrowWidth={12}
          />
        </div>
      </div>
      <div className='article-list-items-wrapper'>
        {getDisplayingElements().map((element, index) =>
          getDisplayingUiElement(element)
        )}
      </div>
      {/* Display the load more icon if there're more articles */}
      {props.counts.articlesCount > props.articles.length &&
        (selectedFilterType === 'All' || selectedFilterType === 'Articles') && (
          <Button
            styleType='secondary'
            style={
              darkTheme
                ? {
                    backgroundColor: darkOptionsAndColors.buttonBackgroundColor,
                    width: '152px',
                    marginBottom: '56px',
                  }
                : { width: '152px', marginBottom: '56px' }
            }
            onClick={async () => {
              setLoadMoreLoading(true);
              await props.loadMoreArticles();
              setLoadMoreLoading(false);
            }}
            icon={loadMoreLoading ? images.loaders.BUTTON_SPINNER : ''}
            dark={darkTheme}
          >
            <span>Load More</span>
          </Button>
        )}
    </div>
  );
};

export default SearchResults;
