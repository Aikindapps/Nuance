import React, { useEffect, useState } from 'react';
import { usePostStore, useUserStore, useAuthStore } from '../../store';
import CardDraftArticles from '../../components/card-draft-articles/card-draft-articles';
import { PostType } from '../../types/types';
import { useNavigate } from 'react-router-dom';
import Loader from '../../UI/loader/Loader';
import { useTheme } from '../../contextes/ThemeContext';
import { colors, images } from '../../shared/constants';
import Button from '../../UI/Button/Button';

const DraftArticles = () => {
  const { user, getUser, getCounts, counts } = useUserStore((state) => ({
    user: state.user,
    getUser: state.getUser,
    getCounts: state.getUserPostCounts,
    counts: state.userPostCounts,
  }));
  const darkTheme = useTheme();

  const { getMyDraftPosts, myDraftPosts } = usePostStore((state) => ({
    getMyDraftPosts: state.getMyDraftPosts,
    myDraftPosts: state.myDraftPosts,
  }));

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreCounter, setLoadMoreCounter] = useState(1);
  const [displayingPosts, setDisplayingPosts] = useState<PostType[]>([]);
  const navigate = useNavigate();

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
    let posts = await getMyDraftPosts(
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
    let posts = await getMyDraftPosts(0, 19);
    if (posts?.length) {
      setDisplayingPosts(posts);
    }
    setLoading(false);
  };

  return (
    <div className='wrapper'>
      <p className='title'>DRAFT ARTICLES ({counts?.draftCount || 0})</p>
      <div className='list-card-draft-articles'>
        {!loading ? (
          displayingPosts?.length ? (
            displayingPosts.map((post: PostType) => (
              <CardDraftArticles
                post={post}
                key={post.postId}
              />
            ))
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
              width: '64vw',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '50px',
            }}
          >
            <Loader />
          </div>
        )}
        {counts &&
          !loading &&
          parseInt(counts?.draftCount) > displayingPosts.length && (
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

export default DraftArticles;
