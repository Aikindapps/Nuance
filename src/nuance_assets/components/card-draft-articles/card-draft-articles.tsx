import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../../store';
import { DateFormat, formatDate } from '../../shared/utils';
import { images, icons, colors } from '../../shared/constants';
import { PostType } from 'src/nuance_assets/types/types';

interface CardVerticalProps {
  post: PostType;
  isPremium?: boolean;
  isPublicationPost?: boolean;
  dark?: boolean;
}

const CardDraftArticles: React.FC<CardVerticalProps> = ({
  post,
  isPremium,
  isPublicationPost,
  dark,
}) => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const [screenWidth, setScreenWidth] = useState(0);

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

  const isPremiumOrPublication = isPremium || isPublicationPost;

  useEffect(
    (window.onresize = window.onload =
      () => {
        setScreenWidth(window.innerWidth);
      }),
    [screenWidth]
  );

  const getStyleOfSpan = () => {
    if (screenWidth < 1089) {
      return { marginRight: '5px', alignSelf: 'center' };
    } else {
      return { marginRight: '5px' };
    }
  };

  return (
    <div
      className='card-wrapper-horizontal draft-article-wrapper'
      style={isPremium ? { filter: 'grayscale(100%)' } : {}}
    >
      <img
        className='main-pic-horizontal'
        src={post.headerImage || images.NUANCE_LOGO}
        alt='Article header image'
        onClick={() => navigate(post.url)}
      />
      <div className='horizontal'>
        <div className='publisher'>
          <div
            style={
              screenWidth < 1089 && isPremiumOrPublication
                ? { width: '50vw', justifyContent: 'end' }
                : isPremiumOrPublication
                ? { justifyContent: 'end' }
                : {}
            }
            className='card-creator-horizontal'
          >
            {user && isPremium ? (
              <>
                <div
                  className='left-card-icons'
                >
                  <Link to={`/article/edit/${post.postId}`}>
                    <img
                      className='profile-pic pencil-icon'
                      src={icons.NFT_LOCK_ICON}
                      style={{
                        borderRadius: '0',
                        filter: darkOptionsAndColors.filter,
                      }}
                      alt=''
                    />
                  </Link>
                </div>
              </>
            ) : user && isPublicationPost ? (
              <>
                <div
                  className='left-card-icons'
                >
                  <img
                    className='profile-pic pencil-icon'
                    style={{
                      borderRadius: '0',
                      filter: darkOptionsAndColors.filter,
                    }}
                    src={icons.PUBLICATION_ICON}
                    alt=''
                  />
                </div>
              </>
            ) : user ? (
              <>
                <div className='left-card-icons'>
                  <Link to={`/article/edit/${post.postId}`}>
                    <img
                      className='profile-pic pencil-icon'
                      style={{ filter: darkOptionsAndColors.filter }}
                      src={icons.EDIT}
                      alt=''
                    />
                  </Link>
                </div>
              </>
            ) : null}
            <div style={{ display: 'flex' }} className='published-date'>
              <span style={getStyleOfSpan()}>|</span>
              <p>{formatDate(post.modified, DateFormat.NoYear)}</p>
            </div>
          </div>
        </div>
        <div className='article-text'>
          <Link to={post.url}>
            <h2 style={{ color: darkOptionsAndColors.color }}>{post.title}</h2>
          </Link>
          <p>{post.subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default CardDraftArticles;
