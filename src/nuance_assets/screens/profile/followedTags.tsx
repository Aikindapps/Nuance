import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Loader from '../../UI/loader/Loader';
import { colors } from '../../shared/constants';
import { usePostStore, useUserStore, useAuthStore } from '../../store';

const FollowedTags = () => {
  const navigate = useNavigate();
  // This component is a child of profileSidebar
  // which already calls getMyTags.
  const myTags = usePostStore((state) => state.myTags);
  const tagState = usePostStore((state) => state);

  const { clearSearchBar, isTagScreen } = usePostStore((state) => ({
    clearSearchBar: state.clearSearchBar,
    isTagScreen: state.isTagScreen,
  }));

  const setSearchText = usePostStore((state) => state.setSearchText);
  const [tagHover, setTagHover] = useState({ id: '', hover: false });
  const [tagsToRender, setTagsToRender] = useState(myTags);

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { user } = useUserStore((state) => ({
    user: state.user,
  }));

  const searchTag = (tag: string) => {
    setSearchText('#' + tag);
    clearSearchBar(false);
    navigate('/', { replace: true });
  };

  const deleteValue = (tagId: string) => {
    setTagsToRender((tagsToRender || []).filter((tag) => tag.tagId !== tagId));
    tagState.unfollowTag(tagId);
  };

  const hoverStyles = {
    backgroundColor: colors.highlightTwo,
    color: colors.primaryBackgroundColor,
  };

  const insideHoverStyles = {
    borderRadius: '5px',
    backgroundColor: colors.highlightTwo,
    color: colors.primaryBackgroundColor,
    padding: '10px 16px',
    marginLeft: '15px',
    marginBottom: '15px',
    fontSize: '10px',
    cursor: 'pointer',
  };

  useEffect(() => {
    if (isLoggedIn && !user) {
      navigate('/register', { replace: true });
    }
  }, [isLoggedIn, user]);

  return (
    <div className='wrapper'>
      <p className='title'>FOLLOWED TOPICS ({myTags?.length || 0})</p>

      <div
        className='tag-links'
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          marginTop: '20px',
        }}
      >
        {tagsToRender ? (
          tagsToRender.length === 0 ? (
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
            tagsToRender.map((tag) => {
              return (
                <div
                  style={
                    tagHover.hover == true && tag.tagId == tagHover.id
                      ? hoverStyles
                      : {}
                  }
                  key={tag.tagId}
                  id={tag.tagId}
                  className='tags-token'
                >
                  <span
                    style={
                      tagHover.hover == true && tag.tagId == tagHover.id
                        ? insideHoverStyles
                        : {
                            borderRadius: '5px',
                            color: colors.tagTextColor,
                            padding: '10px 16px',
                            marginLeft: '15px',
                            marginBottom: '15px',
                            fontSize: '10px',
                            cursor: 'pointer',
                          }
                    }
                    onMouseOver={() =>
                      setTagHover({ id: tag.tagId, hover: true })
                    }
                    onMouseLeave={() =>
                      setTagHover({ id: tag.tagId, hover: false })
                    }
                    onClick={() => searchTag(tag.tagName)}
                  >
                    {tag.tagName}
                  </span>
                  <i
                    onClick={() => deleteValue(tag.tagId)}
                    className='remove-btn'
                  >
                    x
                  </i>
                </div>
              );
            })
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

export default FollowedTags;
