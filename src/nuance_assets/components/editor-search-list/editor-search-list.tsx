import React, { useState } from 'react';
import Button from '../../UI/Button/Button';
import { PostType, UserType } from '../../types/types';
import CardHorizontal from '../card-horizontal/card-horizontal';
import Loader from '../../UI/loader/Loader';
import { colors, images } from '../../shared/constants';
import { TagModel } from '../../services/actorService';
import { Link } from 'react-router-dom';
import CardEditorPublication from '../card-editor-publication/card-editor-publication';
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Row, Col } from 'react-bootstrap';
import { useTheme } from '../../ThemeContext';

type EditorSearchListProps = {
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
  categoryChangeHandler: Function;
  categories: Array<string>;
  toggleHandler: Function;
  handleSortByPublishedDate: Function;
  sortedByPublishedDate: boolean;
  handleSortByModifiedDate: Function;
  sortedByLastModifiedDate: boolean;
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
        <div>
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
                props.handleSortByPublishedDate();
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
                  icon={props.sortedByPublishedDate ? faArrowUp : faArrowDown}
                />
              </span>
              &nbsp;Published
            </Col>
            <Col
              onClick={() => {
                props.handleSortByModifiedDate();
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
                  icon={
                    props.sortedByLastModifiedDate ? faArrowUp : faArrowDown
                  }
                />
              </span>
              &nbsp;Modified
            </Col>
          </Row>
          {props.posts.map((post: PostType) => (
            <CardEditorPublication
              categoryChangeHandler={props.categoryChangeHandler}
              categories={props.categories}
              key={post.postId}
              post={post}
              toggleHandler={props.toggleHandler}
              isLoading={false}
            />
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

export default EditorSearchList;
