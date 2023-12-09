import React, { useState } from 'react';
import Button from '../../UI/Button/Button';
import { PostType, UserType } from '../../types/types';
import CardHorizontal from '../card-horizontal/card-horizontal';
import Loader from '../../UI/loader/Loader';
import { colors, images } from '../../shared/constants';
import { TagModel } from '../../services/actorService';
import { Link } from 'react-router-dom';
import CardEditorPublication from '../card-editor-publication/card-editor-publication';
import { Col, Row } from 'react-bootstrap';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Row
        className='headerRow'
        style={{
          color: colors.darkerBorderColor,
          textTransform: 'uppercase',
          fontSize: '12px',
          marginBottom: '25px',
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        <Col>Live</Col>
        <Col sm={2}>Article</Col>
        <Col>&nbsp;</Col>
        <Col>Author</Col>
        <Col style={{ textAlign: 'right' }}>Category</Col>
        <Col
          sm={2}
          onClick={() => {
            handleSortByPublishedDate();
          }}
        >
          <span>
            <FontAwesomeIcon
              style={{
                marginLeft: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                color: colors.darkerBorderColor,
              }}
              icon={sortedByPublishedDate ? faArrowUp : faArrowDown}
            />
          </span>
          &nbsp;Published
        </Col>
        <Col
          onClick={() => {
            handleSortByModifiedDate();
          }}
        >
          <span>
            <FontAwesomeIcon
              style={{
                marginLeft: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                color: colors.darkerBorderColor,
              }}
              icon={sortedByLastModifiedDate ? faArrowUp : faArrowDown}
            />
          </span>
          &nbsp;Modified
        </Col>
      </Row>
      {!displayingPostsLoading ? (
        displayingPosts.map((post: PostType) => (
          <CardEditorPublication
            categoryChangeHandler={categoryChangeHandler}
            categories={categories}
            key={post.postId}
            post={post}
            toggleHandler={toggleHandler}
            isLoading={false}
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
      {articlesCount > displayingPosts.length && !displayingPostsLoading ? (
        <Button
          styleType='secondary'
          style={{ width: '152px' }}
          onClick={() => handleLoadMore()}
          icon={loadingMore ? images.loaders.BUTTON_SPINNER : ''}
        >
          <span>Load More</span>
        </Button>
      ) : null}
    </div>
  );
};

export default EditorArticleList;
