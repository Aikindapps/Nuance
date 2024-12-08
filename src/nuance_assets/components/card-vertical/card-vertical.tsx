import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CardVerticalProps } from './types';
import { DateFormat, formatDate } from '../../shared/utils';
import { images, icons, colors } from '../../shared/constants';
import { useTheme } from '../../contextes/ThemeContext';
import './_card-vertical.scss';
import { useIntersectionObserver } from '../../shared/useIntersectionObserver';
import GradientMdVerified from '../../UI/verified-icon/verified-icon';

const CardVertical: React.FC<CardVerticalProps> = ({ post }) => {
  const navigate = useNavigate();
  const darkTheme = useTheme();
  const imgRef = useRef(null);

  const [imgSrc, setImgSrc] = useState('');

  const isIntersecting = useIntersectionObserver(imgRef, {
    rootMargin: '0px 0px 1000px 0px',
  });

  // updates imgSrc when the image is intersecting for the first time
  // or when changing dark mode option if its using default header image
  useEffect(() => {
    if (
      (isIntersecting && imgSrc === '') ||
      imgSrc == images.NUANCE_LOGO ||
      imgSrc == images.NUANCE_LOGO_BLACK
    ) {
      setImgSrc(
        post.headerImage ||
          (darkTheme ? images.NUANCE_LOGO : images.NUANCE_LOGO_BLACK)
      );
    }
  }, [isIntersecting, imgSrc, post.headerImage, darkTheme]);

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
    <div className='card-wrapper'>
      <img
        ref={imgRef}
        className='main-pic'
        src={imgSrc} // Use the state variable for image source
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
                    style={{ color: darkOptionsAndColors.secondaryColor }}
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

        <div className='published-date-vertical'>
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
                className='publication-name-vertical'
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
          ) : post.isMembersOnly ? (
            <img
              className='subscription-icon'
              src={icons.MEMBERS_ONLY}
              style={{
                filter: darkTheme ? 'contrast(.6)' : '',
              }}
            />
          ) : null}
          <div className='divider' />
          <p>
            {formatDate(post.publishedDate, DateFormat.NoYear) ||
              formatDate(post.created, DateFormat.NoYear)}
          </p>
        </div>
      </div>
      <div className='article-text'>
        <Link to={post.url}>
          <h2
            style={
              post.fontType && post.fontType !== 'default'
                ? { fontFamily: post.fontType }
                : {}
            }
            ref={(node) => {
              if (node && darkTheme) {
                node.style.setProperty(
                  'background',
                  colors.primaryTextColor,
                  'important'
                );
                node.style.setProperty(
                  'color',
                  colors.primaryBackgroundColor,
                  'important'
                );
              }
              if (node && !darkTheme) {
                node.style.setProperty(
                  'background',
                  colors.primaryBackgroundColor,
                  'important'
                );
                node.style.setProperty(
                  'color',
                  colors.primaryTextColor,
                  'important'
                );
              }
            }}
          >
            {post.title}
          </h2>
        </Link>
        <p>{post.subtitle}</p>
      </div>
    </div>
  );
};

export default CardVertical;
