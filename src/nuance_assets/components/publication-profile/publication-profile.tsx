import React, { useState } from 'react';
import { images, icons, colors } from '../../shared/constants';
import { PublicationType } from '../../types/types';

type PublicationProfileProps = {
  publication: PublicationType | undefined;
  postCount: string | undefined;
  followerCount: string;
  dark?: boolean;
};

const PublicationProfile: React.FC<PublicationProfileProps> = (
  props
): JSX.Element => {
  const darkOptionsAndColors = {
    background: props.dark
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: props.dark
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
    secondaryColor: props.dark
      ? colors.darkSecondaryTextColor
      : colors.primaryTextColor,
  };
  return (
    <div className='publication-profile-section'>
      <div className='publication-avatar'>
        <img
          src={props.publication?.avatar || images.DEFAULT_AVATAR}
          alt='background'
          className='publication-logo'
        />
        <img
          src={icons.PUBLICATION_ICON}
          alt='publication-icon'
          className='publication-icon'
        />
      </div>
      <p
        className='publication-title'
        style={{ color: darkOptionsAndColors.color }}
      >
        {props.publication?.publicationTitle}
      </p>
      <p
        className='handle'
        style={{ color: darkOptionsAndColors.secondaryColor }}
      >
        @{props.publication?.publicationHandle}
      </p>
      <div
        className='publication-stats'
        style={{ color: darkOptionsAndColors.color }}
      >
        <div
          className='article-writer-flex'
          style={{ color: darkOptionsAndColors.color }}
        >
          <p
            className='articles-count'
            style={{ color: darkOptionsAndColors.color }}
          >
            {props.postCount + ' articles'}
          </p>
          <p
            className='small-divider'
            style={{ color: darkOptionsAndColors.color }}
          ></p>
          <p
            className='writers-count'
            style={{ color: darkOptionsAndColors.color }}
          >
            {props.publication?.writers.length + ' writers'}
          </p>
        </div>
        <p
          className='followers-count'
          style={{ color: darkOptionsAndColors.color }}
        >
          {props.followerCount + ' followers'}
        </p>
      </div>
      <p
        className='publication-description'
        style={{ color: darkOptionsAndColors.secondaryColor }}
      >
        {props.publication?.description}
      </p>
    </div>
  );
};

export default PublicationProfile;
