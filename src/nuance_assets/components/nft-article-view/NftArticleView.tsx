import React from 'react';
import { PostType, PublicationType } from '../../types/types';
import { colors, icons, images } from '../../shared/constants';
import { useTheme } from '../../ThemeContext';
import parse from 'html-react-parser';
import './nft-article-view.scss'
export const NftArticleView = (props: {
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
    <div style={{ paddingRight: '15%', width:'100%' }}>
      <div className='title-post-info-wrapper'>
        {post.isPremium ? (
          <img
            className='nft-lock-icon'
            src={icons.NFT_LOCK_ICON}
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
          className='header-image-nft-view'
          src={post.headerImage || images.NUANCE_LOGO}
        />
        <div
          className={darkTheme ? 'text-dark' : 'text'}
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
            <span key={tag.tagId} className='tag-link' onClick={() => {}}>
              {tag.tagName}
            </span>
          );
        })}
      </div>
    </div>
  );
};
