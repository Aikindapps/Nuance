import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePostStore, useUserStore } from '../../store';
import { images, icons, colors } from '../../shared/constants';
import { PostType } from '../../types/types';
import { useTheme } from '../../contextes/ThemeContext';
import './_card-published-articles.scss';
import { DateFormat, formatDate } from '../../shared/utils';
import { Tooltip } from 'react-tooltip';
import Badge from '../../UI/badge/badge';
import { Context } from '../../contextes/Context';
import { PiHandsClappingLight } from 'react-icons/pi';
import { PiPencilSimpleThin } from 'react-icons/pi';
import GradientMdVerified from '../../UI/verified-icon/verified-icon';

interface CardVerticalProps {
  post: PostType;
}

const CardPublishedArticles: React.FC<CardVerticalProps> = ({ post }) => {
  const navigate = useNavigate();
  const dark = useTheme();
  const context = useContext(Context);

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

  return (
    <div className='card-published-articles-wrapper'>
      <Link className='card-published-articles-image-wrapper' to={post.url}>
        <img
          className='card-published-articles-image'
          src={post.headerImage !== '' ? post.headerImage : (dark ? images.NUANCE_LOGO : images.NUANCE_LOGO_BLACK)}
        />
      </Link>

      <div className='card-published-articles-right-wrapper'>
        <div className='card-published-articles-actions-wrapper'>
          <div className='card-published-articles-writer'>
            <img
              className='card-published-articles-writer-avatar'
              src={post.avatar || images.DEFAULT_AVATAR}
              style={post.isVerified ? {
                background: "linear-gradient(to bottom, #1FDCBD, #23F295)",
                padding: "0.05em",
              } : {borderRadius: "50%"}}
            />
            <Link
              className='card-published-articles-handle'
              style={dark ? { color: '#999' } : {}}
              to={
                post.isPublication
                  ? '/user/' + post.creatorHandle
                  : '/user/' + post.handle
              }
            >
              @{post.isPublication ? post.creatorHandle : post.handle}
            </Link>
            {post.isVerified && <div className='verified-badge'><GradientMdVerified width={'12'} height={'12'} /></div>}
          </div>
          <div className='card-published-articles-actions-right'>
            {post.isPublication ? (
              <div className='card-published-articles-right-publication'>
                {post.isPremium ? (
                  <img
                    src={icons.NFT_ICON}
                    className='card-published-articles-action-icon-pointer'
                  />
                ) : (
                  <img
                    src={icons.PUBLICATION_ICON}
                    className='card-published-articles-action-icon-pointer'
                  />
                )}
                <Link
                  to={'/publication/' + post.handle}
                  style={
                    dark
                      ? {
                        color: darkOptionsAndColors.secondaryColor,
                      }
                      : {}
                  }
                  className='card-published-articles-right-publication-text'
                >
                  In{' ' + post.handle}
                </Link>
              </div>
            ) : post.isMembersOnly ? (
              <div className='card-published-articles-right-publication'>
                <img
                  className='card-published-articles-action-icon-pointer members'
                  src={
                    icons.MEMBERS_ONLY
                  }
                  style={{
                    filter: dark ? 'contrast(.6)' : '',
                  }}
                />
              </div>
            ) : null}
            <div className='card-published-articles-right-action-wrapper'>
              <PiHandsClappingLight
                className={
                  dark
                    ? 'card-published-articles-action-icon-pointer-dark'
                    : 'card-published-articles-action-icon-pointer'
                }
              />
              <div
                style={
                  dark
                    ? {
                      color: darkOptionsAndColors.secondaryColor,
                    }
                    : {}
                }
                className='card-published-articles-right-action-text'
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
              className='card-published-articles-date'
            >
              {formatDate(post.publishedDate, DateFormat.NoYear) ||
                formatDate(post.created, DateFormat.NoYear)}
            </div>
          </div>
        </div>
        <Link className='card-published-articles-title-wrapper' to={post.url}>
          <div
            style={
              dark
                ? {
                  color: darkOptionsAndColors.color,
                }
                : {}
            }
            className='card-published-articles-title'
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
          className='card-published-articles-subtitle'
        >
          {post.subtitle.length > 100
            ? post.subtitle.slice(0, 97) + '...'
            : post.subtitle}
        </div>
      </div>
    </div>
  );
};

export default CardPublishedArticles;
