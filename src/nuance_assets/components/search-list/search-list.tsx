import React, { useState } from 'react';
import Button from '../../UI/Button/Button';
import { PostType, UserType } from '../../types/types';
import CardHorizontal from '../card-horizontal/card-horizontal';
import Loader from '../../UI/loader/Loader';
import { images, colors } from '../../shared/constants';
import { TagModel } from '../../services/actorService';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contextes/ThemeContext';

type SearchListProps = {
  posts: Array<PostType>;
  loading: boolean;
  loadingMore: boolean;
  loadMoreHandler: Function;
  totalCount: Number;
  searchedTag: TagModel | undefined;
  lastSearchPhrase: string;
  setShowResults: () => void;
  user: UserType | undefined;
  publicationName: string | undefined;
  publicationHandle: string | undefined;
  updatingFollow: boolean;
  isFollowingTag: boolean;
  handleFollowClicked: Function;
};

const SearchList: React.FC<SearchListProps> = (props): JSX.Element => {
  console.log(props);
  const darkTheme = useTheme();

  return (
    <div
      className='article-list'
      style={{
        display: 'flex',
        flexDirection: 'column',
        rowGap: '12px',
        paddingLeft: '20px',
        paddingTop: '12px',
      }}
    >
      <div className='search-results-nav-items-wrapper'>
        <div className='search-results-nav-item-selected'>SEARCH RESULTS</div>
        <span>|</span>
        <div
          className='search-results-nav-item'
          onClick={() => {
            props.setShowResults();
          }}
        >
          LATEST ARTICLES
        </div>
      </div>
      <div className='search-summary' style={{ marginLeft: '0' }}>
        <div className='search-count'>
          <span className='pipe'>|</span>
          Found {props.totalCount}
          {props.totalCount == 1 ? ' article ' : ' articles '}
          {props.searchedTag ? ' with the tag ' : ' for '}
          <span
            className='result'
            style={{
              color: darkTheme
                ? colors.darkModePrimaryTextColor
                : colors.primaryTextColor,
            }}
          >
            {' '}
            '{props.lastSearchPhrase}'
          </span>
          {' in the ' + props.publicationName + ' publication'}
        </div>

        {props.user && props.searchedTag && (
          <div className='follow'>
            <Button
              styleType={{dark: 'white', light: 'white'}}
              type='button'
              style={{ width: '152px' }}
              onClick={() => {
                props.handleFollowClicked();
              }}
              loading={props.updatingFollow}
            >
              {props.isFollowingTag ? 'Followed' : 'Follow this tag'}
            </Button>
          </div>
        )}
      </div>

      {props.loading ? (
        <Loader />
      ) : (
        <div className='article-grid-horizontal' style={{ marginLeft: '0' }}>
          {props.posts.map((post: PostType) => (
            <CardHorizontal post={post} key={post.postId} />
          ))}
        </div>
      )}
      {Number(props.totalCount) > props.posts.length ? (
        <div className='load-more-container'>
          <Button
            styleType={{dark: 'white', light: 'white'}}
            style={{ width: '152px' }}
            onClick={() => props.loadMoreHandler()}
            loading={props.loadingMore}
          >
            <span>Load More</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default SearchList;
