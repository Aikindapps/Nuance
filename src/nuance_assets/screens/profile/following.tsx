import React, { useEffect, useState } from 'react';
import { usePostStore, useUserStore, useAuthStore } from '../../store';
import { colors, images } from '../../shared/constants';
import FollowAuthor from '../../components/follow-author/follow-author';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Loader from '../../UI/loader/Loader';
import { useTheme } from '../../ThemeContext';

const Following = () => {
  // This component is a child of profileSidebar

  usePostStore((state) => state);
  const darkTheme = useTheme();

  const { user, getAuthor, author, getUsersByHandles } = useUserStore((state) => ({
    user: state.user,
    getAuthor: state.getAuthor,
    author: state.author,
    getUsersByHandles: state.getUsersByHandlesReturnOnly
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

  const [followersList, setFollowersList] = useState(
    user?.followersArray?.map((follower) => (
      <div className='list-container wrapper' key={follower}>
        <li className='follower-container'>
          <FollowAuthor
            AuthorHandle={follower}
            Followers={user.followersArray}
            user={user.handle}
            isPublication={false}
          >
            {' '}
          </FollowAuthor>
          <div className='follower-handle'>
            <Link
              to={`/${follower}`}
              className='handle'
              style={{ color: darkOptionsAndColors.color }}
            >
              @{follower}
            </Link>
          </div>
          <img
            src={images.DEFAULT_AVATAR}
            alt='background'
            className='followers-list-image'
          />
        </li>
      </div>
    ))
  );

  const fetchFollowers = async () => {
    if(user){
      let userListItems = await getUsersByHandles(user.followersArray);
      if(userListItems){
        let mergedWithAvatar = userListItems.map((follower) => (
          <div className='list-container wrapper' key={follower.handle}>
            <li className='follower-container'>
              <FollowAuthor
                AuthorHandle={user.handle}
                Followers={user.followersArray}
                user={user.handle}
                isPublication={false}
              >
                {' '}
              </FollowAuthor>
              <div className='follower-handle'>
                <Link
                  to={`/${follower.handle}`}
                  className='handle'
                  style={{ color: darkOptionsAndColors.color }}
                >
                  @{follower.handle}
                </Link>
              </div>
              <img
                src={follower.avatar || images.DEFAULT_AVATAR}
                alt='background'
                className='followers-list-image'
              />
            </li>
          </div>
        ));
        setFollowersList(mergedWithAvatar)
      }
    }
  }

  useEffect(()=>{
    fetchFollowers()
  }, [])

  useEffect(()=>{
    fetchFollowers()
  }, [user])

  return (
    <div className='wrapper'>
      <p className='title'>FOLLOWING({user?.followersArray.length || 0})</p>
      <div className='content'>
        {followersList ? (
          followersList.length === 0 ? (
            <div
              style={{
                height: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '50px',
                visibility: 'hidden',
              }}
            >
              <Loader />
            </div>
          ) : (
            <ul>{followersList}</ul>
          )
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default Following;
