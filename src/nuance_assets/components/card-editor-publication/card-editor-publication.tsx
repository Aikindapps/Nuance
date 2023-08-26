import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DateFormat, formatDate } from '../../shared/utils';
import { images, icons, colors } from '../../shared/constants';
import { propTypes } from 'react-bootstrap/esm/Image';
import { CardEditorPublicationProps } from './types';
import { Toggle } from '../../UI/toggle/toggle';
import { Row, Col, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faLock } from '@fortawesome/free-solid-svg-icons';
import { PostType } from '../../../nuance_assets/types/types';
import { usePostStore, usePublisherStore } from '../../../nuance_assets/store';
import { icon } from '@fortawesome/fontawesome-svg-core';
import { toastError } from '../../services/toastService';
import { useTheme } from '../../ThemeContext';

const CardEditorPublication: React.FC<CardEditorPublicationProps> = ({
  post,
  toggleHandler,
  categories,
  categoryChangeHandler,
}) => {
  const [isToggled, setIsToggled] = useState(!post.isDraft);
  const [isLoading, setIsLoading] = useState(false);
  const [handleSelection, setHandleSelection] = useState(post.category);
  const navigate = useNavigate();
  const darkTheme = useTheme();

  const handleCategoryChange = async (post: PostType, e: string) => {
    setIsLoading(true);
    setHandleSelection(e);
    await categoryChangeHandler(post, e);
    setIsLoading(false);
  };

  const getCategoriesWithNoCategory = () => {
    if (post.category === '') {
      return categories;
    } else {
      var categoriesWithoutSelected: any[] = [];
      categories.map((category: string) => {
        if (category !== post.category) {
          categoriesWithoutSelected = [...categoriesWithoutSelected, category];
        }
      });
      return ['', ...categoriesWithoutSelected];
    }
  };

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
    <div
      className={isLoading ? 'blurred' : ''}
      style={!isToggled ? { opacity: '0.5' } : {}}
    >
      <Row
        style={{
          marginBottom: '20px',
          alignItems: 'center',
          textAlign: 'center',
          color: colors.primaryTextColor,
        }}
      >
        <Col>
          <Toggle
            toggled={isToggled}
            callBack={async () => {
              if (!isLoading) {
                if (post.isPremium) {
                  toastError('Premium article can not be unpublished');
                } else {
                  setIsToggled(!isToggled);
                  setIsLoading(true);
                  await toggleHandler(post.postId, isToggled);
                  setIsLoading(false);
                }
              }
            }}
          />
        </Col>
        <Col sm={2}>
          <div
            style={{ display: 'flex' }}
            onClick={() => {
              if (!isLoading && !post.isPremium) {
                navigate(`/article/edit/${post.postId}`);
              }
            }}
          >
            <img
              className='main-pic-editor'
              src={post.headerImage || images.NUANCE_LOGO}
              alt='Article header image'
            />
            {post.isPremium ? (
              <img
                style={{
                  marginLeft: '10px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: colors.darkerBorderColor,
                  alignSelf: 'start',
                  filter: darkOptionsAndColors.filter,
                }}
                src={icons.NFT_LOCK_ICON}
              />
            ) : (
              <FontAwesomeIcon
                style={{
                  marginLeft: '10px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: colors.darkerBorderColor,
                }}
                icon={faPencil}
              />
            )}
          </div>
        </Col>
        <Col style={{ marginLeft: '5%' }}>
          <Link style={{ color: darkOptionsAndColors.color }} to={post.url}>
            {post.title}
          </Link>
        </Col>
        <Col
          style={{ fontWeight: 'bold', color: darkOptionsAndColors.color }}
          className='article-text'
        >
          @{post.creator}
        </Col>
        <Col
          style={{
            textDecoration: 'underline',
            textAlign: 'center',
            color: darkOptionsAndColors.color,
          }}
          className='article-text'
        >
          <Form.Select
            style={{
              border: 'none',
              borderBottom: `1px solid ${colors.accentColor}`,
              marginBottom: '20px',
              boxShadow: 'none',
              color: colors.darkerBorderColor,
              marginTop: '20px',
              backgroundColor: 'transparent',
            }}
            aria-label='Default select example'
            value={handleSelection}
            onChange={(e) => {
              if (!isLoading) {
                handleCategoryChange(post, e.target.value);
              }
            }}
          >
            <option key={post.postId}>{post.category}</option>
            {getCategoriesWithNoCategory().map((category: any) => {
              return <option key={category}>{category}</option>;
            })}
          </Form.Select>
        </Col>
        <Col style={{ color: darkOptionsAndColors.color }}>
          {formatDate(post.created, DateFormat.Number)}
        </Col>
        <Col style={{ color: darkOptionsAndColors.color }}>
          {formatDate(post.modified, DateFormat.Number)}
        </Col>
      </Row>
    </div>
  );
};

export default CardEditorPublication;
