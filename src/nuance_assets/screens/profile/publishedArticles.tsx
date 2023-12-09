import React, { useEffect, useState } from 'react';
import CardDraftArticles from '../../components/card-draft-articles/card-draft-articles';
import { usePostStore, useUserStore, useAuthStore } from '../../store';
import { PostType } from '../../types/types';
import { useNavigate } from 'react-router-dom';
import Loader from '../../UI/loader/Loader';
import { useTheme } from '../../contextes/ThemeContext';
import { colors, images } from '../../shared/constants';
import Button from '../../UI/Button/Button';

const PublishedArticles = () => {
  const { user, getUser, getCounts, counts } = useUserStore((state) => ({
    user: state.user,
    getUser: state.getUser,
    getCounts: state.getUserPostCounts,
    counts: state.userPostCounts,
  }));

  const darkTheme = useTheme();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreCounter, setLoadMoreCounter] = useState(1);
  const [displayingPosts, setDisplayingPosts] = useState<PostType[]>([]);
  const navigate = useNavigate();

  const { getMyPublishedPosts } = usePostStore((state) => ({
    getMyPublishedPosts: state.getMyPublishedPosts,
  }));

  useEffect(() => {
    getUser();
    loadInitial();
  }, []);

  useEffect(() => {
    if (user) {
      getCounts(user.handle);
    }
  }, [user]);

  useEffect(() => {
    if (isLoggedIn && !user) {
      navigate('/register', { replace: true });
    }
  }, [isLoggedIn, user]);

  const loadMoreHandler = async () => {
    setLoadingMore(true);
    let posts = await getMyPublishedPosts(
      (loadMoreCounter - 1) * 20 + 20,
      19 + loadMoreCounter * 20
    );
    if (posts?.length) {
      setDisplayingPosts([...displayingPosts, ...posts]);
    }
    setLoadMoreCounter(loadMoreCounter + 1);
    setLoadingMore(false);
  };

  const loadInitial = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 5000);
    let posts = await getMyPublishedPosts(0, 19);
    if (posts?.length) {
      setDisplayingPosts(posts);
    }
    setLoading(false);
  };
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

  return (
    <div className='wrapper'>
      <p className='title'>
        PUBLISHED ARTICLES ({counts?.publishedCount || 0})
      </p>
      <div className='list-card-draft-articles'>
        {!loading ? (
          displayingPosts?.length ? (
            displayingPosts.map((post: PostType) => {
              var isEditAllowed = false;
              var userEditorPublications = user?.publicationsArray.map(
                (pub) => {
                  if (pub.isEditor) {
                    return pub.publicationName;
                  }
                }
              );
              if (
                !post.isPremium &&
                ((userEditorPublications &&
                  post.isPublication &&
                  userEditorPublications.includes(post.handle)) ||
                  !post.isPublication)
              ) {
                isEditAllowed = true;
              }
              return (
                <CardDraftArticles
                  post={post}
                  key={post.postId}
                />
              );
            })
          ) : (
            <div
              style={{
                height: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                visibility: 'hidden',
                width: '64vw',
              }}
            >
              <Loader />
            </div>
          )
        ) : (
          <div
            style={{
              height: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '50px',
              width: '64vw',
            }}
          >
            <Loader />
          </div>
        )}
        {counts &&
          !loading &&
          parseInt(counts?.publishedCount) > displayingPosts.length && (
            <div className='load-more-container'>
              <Button
                styleType='secondary'
                style={{ width: '152px' }}
                onClick={() => loadMoreHandler()}
                icon={loadingMore ? images.loaders.BUTTON_SPINNER : ''}
              >
                <span>Load More</span>
              </Button>
            </div>
          )}
      </div>
    </div>
  );
};

export default PublishedArticles;
