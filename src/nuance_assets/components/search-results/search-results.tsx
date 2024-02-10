import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../store';
import { PostType, PublicationType, UserListItem } from '../../types/types';
import { icons, colors } from '../../shared/constants';
import { usePostStore } from '../../store';
import './_search-results.scss';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../contextes/ThemeContext';
import SelectionItem from '../../UI/selection-item/selection-item';
import CardPublishedArticles from '../card-published-articles/card-published-articles';
import UserListElement from '../user-list-item/user-list-item';
import { levenshteinDistance } from '../../store/userStore';
import Dropdown from '../../UI/dropdown/dropdown';

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
}) => {
  const darkTheme = useTheme();

  const [selectedFilterType, setSelectedFilterType] =
    useState<FilterType>('All');

  const [sortType, setSortType] = useState<SortType>('Relevance');

  const getDisplayingUiElement = (
    element: PostType | PublicationType | UserListItem,
    key: number
  ) => {
    if ('postId' in element) {
      //article
      return <CardPublishedArticles key={key} post={element} />;
    } else if ('publicationHandle' in element) {
      //publication
      return (
        <UserListElement
          key={key}
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
          key={key}
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
            let articlesSorted = props.articles.sort((article_1, article_2) => {
              return parseInt(article_1.created) - parseInt(article_2.created);
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
        return props.articles.sort((article_1, article_2) => {
          if (sortType === 'Most recent') {
            return parseInt(article_1.created) - parseInt(article_2.created);
          } else {
            return (
              levenshteinDistance(article_1.title, props.term) -
              levenshteinDistance(article_2.title, props.term)
            );
          }
        });

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
  };

  return (
    <div className='search-results-wrapper'>
      <div className='search-results-info-wrapper'>
        <div className='search-results-text'>{`Results for '${props.term}'`}</div>
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
            items={['Relevance', 'Most recent']}
            onSelect={(item: string) => {
              setSortType(item as SortType);
            }}
            style={{ width: '100px', height: '25px', position:'absolute', right:'0', bottom:'0' }}
            selectedTextStyle={{ fontSize: '12px', fontWeight: '400' }}
            drodownItemsWrapperStyle={{ top: '28px', rowGap: 0, minWidth:'120px'}}
            arrowWidth={12}
          />
        </div>
      </div>
      <div className='article-list-items-wrapper'>
        {getDisplayingElements().map((element, index) =>
          getDisplayingUiElement(element, index)
        )}
      </div>
    </div>
  );
};

export default SearchResults;
