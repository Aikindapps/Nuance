import React from 'react';
import './_user-list-item.scss';
import { icons, images } from '../../shared/constants';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contextes/ThemeContext';

export const UserListElement = (props: {
  isPublication: boolean;
  handle: string;
  displayName: string;
  avatar: string;
  articlesCount?: string;
  followersCount: string;
  bio: string;
}) => {
  const dark = useTheme();

  const getClassnameWithTheme = (input: string) => {
    if (dark) {
      return input + '-dark';
    }
    return input;
  };

  return (
    <div className='user-list-item-wrapper'>
      <Link
        to={
          props.isPublication
            ? '/publication/' + props.handle
            : '/user/' + props.handle
        }
        className='user-list-item-avatar-wrapper'
      >
        <img
          className='user-list-item-avatar'
          src={
            props.avatar || dark ? icons.PROFILE_ICON_DARK : icons.PROFILE_ICON
          }
        />
        {props.isPublication && (
          <img
            className='user-list-item-publication-icon'
            src={icons.PUBLICATION_ICON}
          />
        )}
      </Link>

      <div className='user-list-item-right'>
        <div className='user-list-item-handle-counts'>
          <Link
            to={
              props.isPublication
                ? '/publication/' + props.handle
                : '/user/' + props.handle
            }
            className={getClassnameWithTheme('user-list-item-handle')}
          >
            @{props.handle}
          </Link>
          <div className='user-list-item-counts'>
            <div className={getClassnameWithTheme('user-list-item-count')}>{`${
              props.articlesCount || 0
            } Articles`}</div>
            <div>|</div>
            <div
              className={getClassnameWithTheme('user-list-item-count')}
            >{`${props.followersCount} Followers`}</div>
          </div>
        </div>
        <Link
          to={
            props.isPublication
              ? '/publication/' + props.handle
              : '/user/' + props.handle
          }
          className={getClassnameWithTheme('user-list-item-name')}
        >
          {props.displayName}
        </Link>
        <div className={getClassnameWithTheme('user-list-item-bio')}>
          {props.bio || 'There is no bio yet.'}
        </div>
      </div>
    </div>
  );
};

export default UserListElement;
