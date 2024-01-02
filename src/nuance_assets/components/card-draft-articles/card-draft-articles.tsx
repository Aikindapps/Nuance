import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePostStore, useUserStore } from '../../store';
import { images, icons, colors } from '../../shared/constants';
import { PostType } from '../../types/types';
import { useTheme } from '../../contextes/ThemeContext';
import './_card-draft-articles.scss';
import { DateFormat, formatDate } from '../../shared/utils';
import { Tooltip } from 'react-tooltip';
import Badge from '../../UI/badge/badge';
import { Context } from '../../contextes/Context';

interface CardVerticalProps {
  post: PostType;
}

const CardDraftArticles: React.FC<CardVerticalProps> = ({ post }) => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const [screenWidth, setScreenWidth] = useState(0);
  const dark = useTheme();
  const context = useContext(Context)

  const darkOptionsAndColors = {
    background: dark
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: dark ? colors.darkModePrimaryTextColor : colors.primaryTextColor,
    secondaryColor: dark
      ? colors.darkSecondaryTextColor
      : colors.primaryTextColor,
    filter: dark ? 'contrast(.5)' : 'none',
  };

  useEffect(
    (window.onresize = window.onload =
      () => {
        setScreenWidth(window.innerWidth);
      }),
    [screenWidth]
  );

  const isUserEditor = () => {
    let postHandle = post.handle;
    let result = false;
    user?.publicationsArray.forEach((val) => {
      if (val.publicationName === postHandle) {
        result = true;
      }
    });
    return result;
  };

  const getEditStatus = () => {
    if (post.isPremium) {
      return 'Premium';
    } else {
      if (post.isPublication) {
        if (post.isDraft) {
          return "Submitted for review"
        } else {
          return "Published publication"
        }
      } else {
        if (post.isDraft) {
          return 'Draft';
        } else {
          return 'Published';
        }
      }
    }
  };

  const getPostStatus = () => {
    if(post.isDraft){
      if(post.isPublication){
        return 'Submitted for review'
      }
      else{
        return 'Draft'
      }
    }
    else{
      return 'Published'
    }
  }

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
    <div className='card-draft-articles-wrapper'>
      <Link className='card-draft-articles-image-wrapper' to={post.url}>
        <img
          className='card-draft-articles-image'
          src={post.headerImage !== '' ? post.headerImage : images.NUANCE_LOGO}
        />
      </Link>

      <div className='card-draft-articles-right-wrapper'>
        <div className='card-draft-articles-actions-wrapper'>
          <div className='card-draft-articles-actions-left'>
            <Link to={'/article/edit/' + post.postId}>
              {getEditStatus() === 'Premium' ? (
                <img
                  className='card-draft-articles-action-icon-pointer'
                  src={icons.NFT_ICON}
                />
              ) : getEditStatus() === 'Draft' ||
                getEditStatus() === 'Published' ? (
                <img
                  className='card-draft-articles-action-icon-pointer'
                  src={dark ? icons.EDIT_WHITE : icons.EDIT}
                />
              ) : (
                <img
                  className='card-draft-articles-action-icon-pointer'
                  src={icons.PUBLICATION_ICON}
                />
              )}
            </Link>
          </div>
          <div className='card-draft-articles-actions-right'>
            {context.width > 600 && (
              <Badge status={getPostStatus()} dark={dark} />
            )}
            <div className={'card-draft-articles-right-action-wrapper'}>
              <img
                className='card-draft-articles-action-icon-pointer'
                src={dark ? icons.CLAP_WHITE_2 : icons.CLAP_BLACK}
                id={'card-draft-article-tooltip-' + post.postId}
              />
              <div
                style={
                  dark
                    ? {
                        color: darkOptionsAndColors.secondaryColor,
                      }
                    : {}
                }
                className='card-draft-articles-right-action-text'
              >
                {post.claps}
              </div>
            </div>
            <div
              style={
                dark
                  ? {
                      color: darkOptionsAndColors.secondaryColor,
                    }
                  : {}
              }
              className='card-draft-articles-date'
            >
              {formatDate(post.publishedDate, DateFormat.NoYear) ||
                formatDate(post.created, DateFormat.NoYear)}
            </div>
          </div>
        </div>
        <Link className='card-draft-articles-title-wrapper' to={post.url}>
          <div
            style={
              dark
                ? {
                    color: darkOptionsAndColors.color,
                  }
                : {}
            }
            className='card-draft-articles-title'
          >
            {post.title.length > 55
              ? post.title.slice(0, 52) + '...'
              : post.title}
          </div>
        </Link>
        <div
          style={
            dark
              ? {
                  color: darkOptionsAndColors.secondaryColor,
                }
              : {}
          }
          className='card-draft-articles-subtitle'
        >
          {post.subtitle.length > 100
            ? post.subtitle.slice(0, 97) + '...'
            : post.subtitle}
        </div>
      </div>
      <Tooltip
        clickable={true}
        className='tooltip-wrapper'
        anchorSelect={'#card-draft-article-tooltip-' + post.postId}
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
          <p className='tooltip-inside-text'>No applause yet.</p>
        )}
      </Tooltip>
    </div>
  );
};

export default CardDraftArticles;
