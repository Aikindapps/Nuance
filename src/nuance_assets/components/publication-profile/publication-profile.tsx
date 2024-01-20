import React, { useState } from 'react';
import { images, icons, colors } from '../../shared/constants';
import { PublicationType } from '../../types/types';
import { Tooltip } from 'react-tooltip';
import { getIconForSocialChannel } from '../../shared/utils';

type PublicationProfileProps = {
  publication: PublicationType | undefined;
  postCount: string | undefined;
  followerCount: string;
  dark: boolean;
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

  const getSocialChannelUrls = () => {
    if (props.publication) {
      if (props.publication.socialLinks.website === '') {
        return props.publication.socialLinks.socialChannels;
      } else {
        return [
          props.publication.socialLinks.website,
          ...props.publication.socialLinks.socialChannels,
        ];
      }
    } else {
      return [];
    }
  };
  return (
    <div className='publication-profile-section'>
      <div className='publication-profile-avatar-title-handle-wrapper'>
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
          style={props.dark ? { color: darkOptionsAndColors.color } : {}}
        >
          {props.publication?.publicationTitle}
        </p>
        <p
          className='handle'
          style={props.dark ? { color: darkOptionsAndColors.color } : {}}
        >
          @{props.publication?.publicationHandle}
        </p>
      </div>

      <div className='social-channels'>
        {getSocialChannelUrls().map((url, index) => {
          return (
            <div
              onClick={() => {
                let urlWithProtocol =
                  url.startsWith('https://') || url.startsWith('http://')
                    ? url
                    : 'https://' + url;
                window.open(urlWithProtocol, '_blank');
              }}
            >
              <Tooltip
                clickable={true}
                className='tooltip-wrapper'
                anchorSelect={'#social-channel-' + index}
                place='top'
                noArrow={true}
              >
                {url}
              </Tooltip>
              <img
                className='social-channel-icon'
                src={getIconForSocialChannel(url, props.dark)}
                id={'social-channel-' + index}
              />
            </div>
          );
        })}
      </div>
      <div
        className='publication-stats'
        style={props.dark ? { color: darkOptionsAndColors.color } : {}}
      >
        <div
          className='article-writer-flex'
          style={props.dark ? { color: darkOptionsAndColors.color } : {}}
        >
          <p
            className='articles-count'
            style={props.dark ? { color: darkOptionsAndColors.color } : {}}
          >
            {props.postCount + ' articles'}
          </p>
          <p
            className='small-divider'
            style={props.dark ? { color: darkOptionsAndColors.color } : {}}
          ></p>
          <p
            className='writers-count'
            style={props.dark ? { color: darkOptionsAndColors.color } : {}}
          >
            {props.publication?.writers.length + ' writers'}
          </p>
        </div>
        <p
          className='followers-count'
          style={props.dark ? { color: darkOptionsAndColors.color } : {}}
        >
          {props.followerCount + ' followers'}
        </p>
      </div>
      <p
        className='publication-description'
        style={props.dark ? { color: darkOptionsAndColors.color } : {}}
      >
        {props.publication?.description}
      </p>
    </div>
  );
};

export default PublicationProfile;
