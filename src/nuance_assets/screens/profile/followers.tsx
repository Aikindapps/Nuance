import React, { useEffect, useState } from 'react';
import { usePostStore, useUserStore, useAuthStore } from '../../store';
import { colors, images } from '../../shared/constants';
import FollowAuthor from '../../components/follow-author/follow-author';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Loader from '../../UI/loader/Loader';
import { useTheme } from '../../contextes/ThemeContext';
import Button from '../../UI/Button/Button';
import { UserListItem } from 'src/nuance_assets/types/types';

const Followers = () => {
  // This component is a child of profileSidebar
  usePostStore((state) => state);
  const darkTheme = useTheme();
  const [myFollowers, setMyFollowers] = useState<UserListItem[]>([]);

  const { user, getAuthor, author, getMyFollowers } = useUserStore((state) => ({
    user: state.user,
    getAuthor: state.getAuthor,
    author: state.author,
    getUsersByHandles: state.getUsersByHandlesReturnOnly,
    getMyFollowers: state.getMyFollowers,
  }));

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const navigate = useNavigate();
  useEffect(() => {
    if (isLoggedIn && !user) {
      navigate('/register', { replace: true });
    }
  }, [isLoggedIn, user]);

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
    filter: darkTheme ? 'contrast(.5)' : 'none',
  };

  const getFollowers = async () => {
    let followers = await getMyFollowers(0, 20);
    setMyFollowers(followers);
  };

  useEffect(() => {
    getFollowers();
  }, [user]);

  return (
    <div className='wrapper'>
      <p className='title'>FOLLOWERS({user?.followersCount || 0})</p>
      <div
        className='content'
        style={{ minWidth: '100%', margin: '0', marginBottom: '10px' }}
      >
        {!myFollowers ? (
          <div
            style={{
              height: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '50px',
            }}
          >
            <Loader />
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            {myFollowers?.map((user) => {
              return (
                <div
                  className='user-search-item'
                  key={user.handle}
                  style={{ width: '100%' }}
                >
                  <Link to={'/user/' + user.handle}>
                    <img
                      src={user.avatar || images.DEFAULT_AVATAR}
                      className='profile-picture user-image-search'
                      style={{
                        width: '100px',
                        height: '100px',
                        transition: 'none',
                      }}
                    />
                  </Link>

                  <div className='user-search-info'>
                    <Link to={'/user/' + user.handle}>
                      <p className='handle'>{'@' + user.handle}</p>
                    </Link>

                    <p
                      className='display-name-search-item'
                      onClick={() => {
                        navigate('/user/' + user.handle);
                      }}
                    >
                      {user.displayName}
                    </p>

                    <p
                      className='bio'
                      onClick={() => {
                        navigate('/user/' + user.handle);
                      }}
                    >
                      {user.bio.length !== 0
                        ? user.bio
                        : 'There is no bio yet.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Followers;
