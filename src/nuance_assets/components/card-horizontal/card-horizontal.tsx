import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CardVerticalProps } from '../card-vertical/types';
import { DateFormat, formatDate } from '../../shared/utils';
import { images, icons, colors } from '../../shared/constants';
import { useTheme } from '../../contextes/ThemeContext';
import { useIntersectionObserver } from '../../shared/useIntersectionObserver';

const CardHorizontal: React.FC<CardVerticalProps> = ({ post }) => {
  const navigate = useNavigate();
  const darkTheme = useTheme();
  const imgRef = useRef(null);

  const [imgSrc, setImgSrc] = useState('');

  const isIntersecting = useIntersectionObserver(imgRef, {
    rootMargin: '0px 0px 1000px 0px',
  });

  //updates imgSrc when the image is intersecting for the first time
  useEffect(() => {
    if (isIntersecting && imgSrc === '') {
      setImgSrc(post.headerImage || images.NUANCE_LOGO);
    }
  }, [isIntersecting, imgSrc, post.headerImage]);

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
    <div className='card-wrapper-horizontal'>
      <img
        ref={imgRef}
        className='main-pic-horizontal'
        src={imgSrc} // Use the state variable for image source
        alt='Article header image'
        onClick={() => navigate(post.url)}
      />
      <div className='horizontal'>
        <div className='publisher'>
          <div className='card-creator-horizontal'>
            <div className='left-card-icons'>
              <img
                className='profile-pic'
                src={post.avatar || images.DEFAULT_AVATAR}
                alt='Author image'
              />
              <div>
                {post.isPublication ? (
                  <Link
                    style={{ color: darkOptionsAndColors.secondaryColor }}
                    to={`/${post.creator}`}
                  >
                    @{post.creator}
                  </Link>
                ) : (
                  <Link
                    style={{ color: darkOptionsAndColors.color }}
                    to={`/${post.handle}`}
                  >
                    @{post.handle}
                  </Link>
                )}
              </div>
            </div>

            <div className='published-date-horizontal'>
              {post.isPublication ? (
                <div className='publication-name-icon-flex'>
                  <img
                    className='publication-icon'
                    src={
                      post.isPremium
                        ? icons.NFT_LOCK_ICON
                        : icons.PUBLICATION_ICON
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
              <div className='divider'></div>
              <p>
                {formatDate(post.publishedDate, DateFormat.NoYear) ||
                  formatDate(post.created, DateFormat.NoYear)}
              </p>
            </div>
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
    </div>
  );
};

export default CardHorizontal;
