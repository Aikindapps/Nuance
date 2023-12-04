import React, { useEffect, useState } from 'react';
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
import { useTheme } from '../../contextes/ThemeContext';
import './_card-editor-publication.scss';
import Dropdown from '../../UI/dropdown/dropdown';
import { Tooltip } from 'react-tooltip';
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
      return ['', ...categories];
    } else {
      var categoriesWithoutSelected: any[] = [];
      categories.map((category: string) => {
        if (category !== post.category) {
          categoriesWithoutSelected = [...categoriesWithoutSelected, category];
        }
      });
      return [post.category, ...categoriesWithoutSelected, ''];
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

  const { getApplaudedHandles } = usePostStore((state) => ({
    getApplaudedHandles: state.getApplaudedHandles,
  }));

  const [applaudedHandles, setApplaudedHandles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchApplaudedHandles = async () => {
    setLoading(true);
    let handles = await getApplaudedHandles(post.postId, post.bucketCanisterId);
    setApplaudedHandles(handles);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplaudedHandles();
  }, []);

  return (
    <div
      className={
        isLoading
          ? 'blurred card-editor-publication-wrapper'
          : 'card-editor-publication-wrapper'
      }
      style={!isToggled ? { opacity: '0.5' } : {}}
    >
      <div className='field-published field-general'>
        {post.isPremium ? (
          <img className='nft-icon' src={icons.NFT_ICON} />
        ) : (
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
        )}
      </div>
      <Link
        className='field-article field-general'
        to={'/article/edit/' + post.postId}
      >
        <img
          className='article-image'
          src={post.headerImage || images.NUANCE_LOGO}
        />
        <p className='article-title'>{post.title}</p>
      </Link>
      <Link
        to={'/' + post.creator || post.handle}
        className='field-writer field-general'
      >
        @{post.creator || post.handle}
      </Link>
      <div className='field-category field-general'>
        <Dropdown
          selectedTextStyle={{ fontSize: '14px', fontWeight: '400' }}
          drodownItemsWrapperStyle={{
            maxHeight: '100px',
            overflowY: 'scroll',
            top: '29px',
          }}
          style={{ height: '24px' }}
          items={getCategoriesWithNoCategory().map((val) => '/' + val)}
          nonActive={isLoading}
          onSelect={(item) => {
            if (!isLoading) {
              handleCategoryChange(post, item.slice(1));
            }
          }}
        />
      </div>

      <div
        className='field-applause field-general'
        id={'card-editor-article-tooltip-' + post.postId}
      >
        <img className='clap-icon-card-editor' src={icons.CLAP_BLACK} />
        <p className='clap-count'>{post.claps}</p>
      </div>
      <div className='field-published-date field-general'>
        {formatDate(post.publishedDate, DateFormat.WithYear) ||
          formatDate(post.created, DateFormat.WithYear)}
      </div>
      <div className='field-modified field-general'>
        {formatDate(post.modified, DateFormat.WithYear) ||
          formatDate(post.created, DateFormat.WithYear)}
      </div>
      <Tooltip
        clickable={true}
        className='tooltip-wrapper'
        anchorSelect={'#card-editor-article-tooltip-' + post.postId}
        place='top'
        noArrow={true}
      >
        {loading ? (
          <p className='tooltip-inside-text'>Loading...</p>
        ) : applaudedHandles.length > 0 ? (
          applaudedHandles.map((handle, index) => {
            if (index === applaudedHandles.length - 1 && index < 10) {
              //last element
              return (
                <Link to={'/' + handle}>
                  <p key={handle} className='tooltip-inside-handle'>
                    {'@' + handle + ' applauded this article.'}
                  </p>
                </Link>
              );
            } else if (index === 10) {
              //there are more than 10, this is last
              return (
                <Link to={'/' + handle}>
                  <p key={handle} className='tooltip-inside-handle'>
                    {'@' +
                      handle +
                      ' +' +
                      (applaudedHandles.length - index - 1) +
                      ' applauded this article.'}
                  </p>
                </Link>
              );
            } else if (index < 10) {
              return (
                <Link to={'/' + handle}>
                  <p key={handle} className='tooltip-inside-handle'>
                    {'@' + handle + ', '}
                  </p>
                </Link>
              );
            }
          })
        ) : (
          <p className='tooltip-inside-text'>No applaud yet.</p>
        )}
      </Tooltip>
    </div>
  );
};

export default CardEditorPublication;
