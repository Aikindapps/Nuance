import React, { useState } from 'react';
import Button from '../../UI/Button/Button';
import { PostType, PublicationType, UserType } from '../../types/types';
import CardHorizontal from '../card-horizontal/card-horizontal';
import Loader from '../../UI/loader/Loader';
import { colors, images } from '../../shared/constants';
import { TagModel } from '../../services/actorService';
import { Link } from 'react-router-dom';
import CardEditorPublication from '../card-editor-publication/card-editor-publication';
import { Col, Row } from 'react-bootstrap';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './_editor-article-list.scss';
type EditorArticleListProps = {
  displayingPosts: Array<PostType>;
  displayingPostsLoading: boolean;
  categoryChangeHandler: Function;
  categories: Array<string>;
  toggleHandler: Function;
  articlesCount: number;
  handleLoadMore: Function;
  loadingMore: boolean;
  handleSortByPublishedDate: Function;
  sortedByPublishedDate: boolean;
  handleSortByModifiedDate: Function;
  sortedByLastModifiedDate: boolean;
  publication: PublicationType | undefined;
  refreshPosts: (postId: string) => Promise<void>;
  dark?: boolean;
};

const EditorArticleList: React.FC<EditorArticleListProps> = ({
  categoryChangeHandler,
  displayingPosts,
  displayingPostsLoading,
  categories,
  toggleHandler,
  articlesCount,
  handleLoadMore,
  loadingMore,
  handleSortByPublishedDate,
  sortedByPublishedDate,
  handleSortByModifiedDate,
  sortedByLastModifiedDate,
  refreshPosts,
  publication,
  dark,
}): JSX.Element => {
  const darkOptionsAndColors = {
    background: dark
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: dark ? colors.darkModePrimaryTextColor : colors.primaryTextColor,
    secondaryColor: dark
      ? colors.darkSecondaryTextColor
      : colors.primaryTextColor,
  };
  return (
    <div className='editor-article-list-wrapper'>
      <div className='titles'>
        <p className='title-general title-published'>PUBLISHED</p>
        <p className='title-general title-article'>ARTICLE</p>
        <p className='title-general title-writer'>WRITER</p>
        <p className='title-general title-category'>CATEGORY</p>
        <p className='title-general title-applause'>APPLAUSE</p>
        <p
          className='title-general title-published-date'
          onClick={() => {
            handleSortByPublishedDate();
          }}
        >
          PUBLISHED DATE
        </p>
        <p
          className='title-general title-modified'
          onClick={() => {
            handleSortByModifiedDate();
          }}
        >
          MODIFIED
        </p>
        <p className='title-general title-keys-sold'>KEYS SOLD</p>
      </div>
      {!displayingPostsLoading ? (
        displayingPosts.map((post: PostType) => (
          <CardEditorPublication
            categoryChangeHandler={categoryChangeHandler}
            categories={categories}
            key={post.postId}
            post={post}
            toggleHandler={toggleHandler}
            isLoading={false}
            publication={publication}
            refreshPosts={refreshPosts}
          />
        ))
      ) : (
        <div
          style={{
            width: '100%',
            height: '50vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Loader />
        </div>
      )}
      {articlesCount > displayingPosts.length ? (
        <div className='load-more-container'>
          <Button
            styleType={{dark: 'white', light: 'white'}}
            style={{ width: '152px' }}
            onClick={() => handleLoadMore()}
            loading={loadingMore}
          >
            <span>Load More</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default EditorArticleList;
