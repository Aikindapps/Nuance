import React from 'react';
import { PostType, PublicationType } from '../../types/types';
import { colors, icons, images } from '../../shared/constants';
import { useTheme } from '../../contextes/ThemeContext';
import parse from 'html-react-parser';
import './static-article-view.scss'
export const StaticArticleView = (props: {
  post: PostType;
}) => {
  let post = props.post;
  let fontType = props.post.fontType;
  const darkTheme = useTheme();
  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
  };
  return (
    <div style={{ paddingRight: '15%', width: '100%' }}>
      {post?.isMembersOnly && (
        <div className='static-article-members-only'>
          <img src={icons.MEMBERS_ONLY} className='static-members-only-icon'></img>

        </div>
      )}
      <div className='title-post-info-wrapper'>
        {post.isPremium ? (
          <img
            className='static-article-view-icon'
            src={icons.NFT_LOCK_ICON}
            style={{ filter: darkTheme ? 'contrast(0.5)' : 'none' }}
          />
        ) : post.isPublication ? (
          <img
            className='static-article-view-icon'
            src={icons.PUBLICATION_ICON}
            style={{ filter: darkTheme ? 'contrast(0.5)' : 'none' }}
          />
        ) : null}
        <h1
          style={
            post.isPublication
              ? {
                fontFamily: fontType,
                color: darkOptionsAndColors.color,
              }
              : {}
          }
          className='title'
        >
          {post.title}
        </h1>
        <h2 className='subtitle'>{post.subtitle}</h2>
      </div>
      <div className='header-content-wrapper'>
        <img
          className='header-image-static-article-view'
          src={post.headerImage || (darkTheme ? images.NUANCE_LOGO : images.NUANCE_LOGO_BLACK)}
        />
        <div
          className={darkTheme ? 'dark-text' : 'text'}
          style={{ color: darkOptionsAndColors.color }}
        >
          {parse(post.content)}
        </div>
      </div>
      <div
        className='tag-links'
        style={{ justifyContent: 'start', marginTop: '50px' }}
      >
        <img
          className='tag-icon'
          src={icons.TAG}
          style={{ filter: darkTheme ? 'contrast(0.5)' : 'none' }}
        />
        {post.tags?.map((tag) => {
          return (
            <span key={tag.tagId} className='tag-link' onClick={() => { }}>
              {tag.tagName}
            </span>
          );
        })}
      </div>
    </div>
  );
};
