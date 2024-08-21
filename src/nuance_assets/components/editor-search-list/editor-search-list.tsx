import React, { useState } from 'react';
import Button from '../../UI/Button/Button';
import { PostType, PublicationType, UserType } from '../../types/types';
import CardHorizontal from '../card-horizontal/card-horizontal';
import Loader from '../../UI/loader/Loader';
import { colors, images } from '../../shared/constants';
import { TagModel } from '../../services/actorService';
import { Link } from 'react-router-dom';
import CardEditorPublication from '../card-editor-publication/card-editor-publication';
import './_editor-search-list.scss';
import { useTheme } from '../../contextes/ThemeContext';

type EditorSearchListProps = {
  posts: Array<PostType>;
  loading: boolean;
  loadingMore: boolean;
  loadMoreHandler: Function;
  totalCount: number;
  searchedTag: TagModel | undefined;
  lastSearchPhrase: string;
  setShowResults: Function;
  user: UserType | undefined;
  publicationName: string | undefined;
  publicationHandle: string | undefined;
  categoryChangeHandler: Function;
  categories: Array<string>;
  toggleHandler: Function;
  handleSortByPublishedDate: Function;
  sortedByPublishedDate: boolean;
  handleSortByModifiedDate: Function;
  sortedByLastModifiedDate: boolean;
  publication: PublicationType | undefined;
  refreshPosts: (postId: string) => Promise<void>;
  dark?: boolean;
};

const EditorSearchList: React.FC<EditorSearchListProps> = (
  props
): JSX.Element => {
  const darkTheme = useTheme();

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
    filter: darkTheme ? 'contrast(.5)' : 'none',
  };

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
            to={'/my-profile/publications/' + props.publicationHandle}
            className='link1'
          >
            SEARCH RESULTS
          </Link>
        )}
        <span className='span'> | </span>
        <div className='sec'>
          <Link
            to={'/my-profile/publications/' + props.publicationHandle}
            className='link2'
            onClick={() => props.setShowResults()}
          >
            ALL ARTICLES
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
            style={{ color: darkOptionsAndColors.color }}
          >
            {' '}
            '{props.lastSearchPhrase}'
          </span>
          {' in the ' + props.publicationName + ' publication'}
        </div>
      </div>

      {props.loading ? (
        <Loader />
      ) : (
        <div className='editor-search-list-wrapper'>
          <div className='titles'>
            <p className='title-general title-published'>PUBLISHED</p>
            <p className='title-general title-article'>ARTICLE</p>
            <p className='title-general title-writer'>WRITER</p>
            <p className='title-general title-category'>CATEGORY</p>
            <p className='title-general title-applause'>APPLAUSE</p>
            <p
              className='title-general title-published-date'
              onClick={() => {
                props.handleSortByPublishedDate();
              }}
            >
              PUBLISHED DATE
            </p>
            <p
              className='title-general title-modified'
              onClick={() => {
                props.handleSortByModifiedDate();
              }}
            >
              MODIFIED
            </p>
            <p className='title-general title-keys-sold'>KEYS SOLD</p>
          </div>
          {props.posts.map((post: PostType) => (
            <CardEditorPublication
              categoryChangeHandler={props.categoryChangeHandler}
              categories={props.categories}
              key={post.postId}
              post={post}
              toggleHandler={props.toggleHandler}
              isLoading={false}
              publication={props.publication}
              refreshPosts={props.refreshPosts}
            />
          ))}
        </div>
      )}
      {props.totalCount > props.posts.length ? (
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

export default EditorSearchList;
