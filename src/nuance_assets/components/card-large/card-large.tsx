import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CardLargeProps } from './types';
import { DateFormat, formatDate } from '../../shared/utils';
import { images, icons, colors } from '../../shared/constants';
import { useTheme } from '../../contextes/ThemeContext';
import GradientMdVerified from '../../UI/verified-icon/verified-icon';

const CardLarge: React.FC<CardLargeProps> = ({ post }) => {
  const navigate = useNavigate();
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
  };

  return (
    <div className='card-wrapper-large'>
      <img
        className='main-pic-large'
        src={post.headerImage || (darkTheme ? images.NUANCE_LOGO : images.NUANCE_LOGO_BLACK)}
        alt='Article header image'
        onClick={() => {
          navigate(post.url);
        }}
      />

      <div className='publisher'>
        <div className='card-creator'>
          {post && (
            <>
              <img
                className='profile-pic'
                src={post.avatar || images.DEFAULT_AVATAR}
                alt='Author image'
                style={post.isVerified ? {
                  background: "linear-gradient(to bottom, #1FDCBD, #23F295)",
                  padding: "0.1em",
                } : {borderRadius: "50%"}}
              />
              <div>
                {post.isPublication ? (
                  <Link
                    style={{ color: darkOptionsAndColors.color }}
                    to={`/user/${post.creatorHandle}`}
                  >
                    @{post.creatorHandle}
                  </Link>
                ) : (
                  <Link
                    style={{ color: darkOptionsAndColors.color }}
                    to={`/user/${post.handle}`}
                  >
                    @{post.handle}
                  </Link>
                )}
              </div>
              {post.isVerified && <div className='verified-badge'><GradientMdVerified width={'12'} height={'12'} /></div>}
            </>
          )}
        </div>

        <div className='published-date-large'>
          {post.isPublication ? (
            <div className='publication-name-icon-flex'>
              <img
                className='publication-icon'
                src={
                  post.isPremium ? icons.NFT_LOCK_ICON : icons.PUBLICATION_ICON
                }
                style={{
                  filter: darkTheme ? 'contrast(.6)' : '',
                }}
              />
              <p
                className='publication-name-horizontal'
                onClick={() => {
                  if (location.pathname === '/publication/' + post.handle) {
                    window.scroll(0, 0);
                  } else {
                    navigate('/publication/' + post.handle);
                  }
                }}
              >
                {'In ' + post.handle}
              </p>
            </div>
          ) : null}
          <div className='divider-large' />
          <p>{formatDate(post.publishedDate, DateFormat.NoYear) || formatDate(post.created, DateFormat.NoYear)}</p>
        </div>
      </div>
      <div className='article-text'>
        <Link to={post.url}>
          <h2
            style={
              post.fontType && post.fontType !== 'default'
                ? {
                  fontFamily: post.fontType,
                  color: darkOptionsAndColors.color,
                }
                : { color: darkOptionsAndColors.color }
            }
          >
            {post.title}
          </h2>
        </Link>
        <p>{post.subtitle}</p>
      </div>
    </div>
  );
};

export default CardLarge;
