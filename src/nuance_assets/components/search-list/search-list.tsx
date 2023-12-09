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
  setShowResults: Function;
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
    <div className='article-list'>
      <div className='rowContainer'>
        {props.searchedTag ? (
          <div
            className='button-attributes-primary-3'
            style={{
              minWidth: '75px',
              cursor: 'default',
              padding: '0 15px',
            }}
          >
            {props.lastSearchPhrase}
          </div>
        ) : (
          <Link
            to={'/publication/' + props.publicationHandle}
            className='link1'
          >
            SEARCH RESULTS
          </Link>
        )}
        <span className='span'> | </span>
        <div className='sec'>
          <Link
            to={'/publication/' + props.publicationHandle}
            className='link2'
            onClick={() => props.setShowResults()}
          >
            LATEST ARTICLES
          </Link>
        </div>
      </div>
      <div className='search-summary'>
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
              styleType='secondary'
              type='button'
              style={{ width: '152px' }}
              onClick={() => {
                props.handleFollowClicked();
              }}
              icon={props.updatingFollow ? images.loaders.BUTTON_SPINNER : ''}
            >
              {props.isFollowingTag ? 'Followed' : 'Follow this tag'}
            </Button>
          </div>
        )}
      </div>

      {props.loading ? (
        <Loader />
      ) : (
        <div className='article-grid-horizontal'>
          {props.posts.map((post: PostType) => (
            <CardHorizontal post={post} key={post.postId} />
          ))}
        </div>
      )}
      {props.totalCount > props.posts.length ? (
        <div className='load-more-container'>
          <Button
            styleType='secondary'
            style={{ width: '152px' }}
            onClick={() => props.loadMoreHandler()}
            icon={props.loadingMore ? images.loaders.BUTTON_SPINNER : ''}
          >
            <span>Load More</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default SearchList;
