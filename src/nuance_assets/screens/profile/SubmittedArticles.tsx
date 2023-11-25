import React, { useEffect, useState } from 'react';
import {
  usePostStore,
  useUserStore,
  useAuthStore,
  usePublisherStore,
} from '../../store';
import CardDraftArticles from '../../components/card-draft-articles/card-draft-articles';
import { PostType } from '../../types/types';
import { useNavigate } from 'react-router-dom';
import Loader from '../../UI/loader/Loader';
import { useTheme } from '../../contextes/ThemeContext';
import { colors, images } from '../../shared/constants';
import Button from '../../UI/Button/Button';

const SubmittedArticles = () => {
  const { user, getUser } = useUserStore((state) => ({
    user: state.user,
    getUser: state.getUser,
  }));
  const { submittedForReviewPosts, getSubmittedForReviewPosts } = usePostStore(
    (state) => ({
      submittedForReviewPosts: state.submittedForReviewPosts,
      getSubmittedForReviewPosts: state.getSubmittedForReviewPosts,
    })
  );
  const darkTheme = useTheme();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchPosts = async () => {
    if (user) {
      setLoading(true);
      await getSubmittedForReviewPosts(
        user.publicationsArray.map((obj) => obj.publicationName)
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  useEffect(() => {
    if (isLoggedIn && !user) {
      navigate('/register', { replace: true });
    }
  }, [isLoggedIn, user]);

  return (
    <div className='wrapper'>
      <p className='title'>
        SUBMITTED FOR REVIEW ({submittedForReviewPosts?.length || 0})
      </p>
      <div
        className='article-grid-horizontal'
        style={{
          filter: loading ? 'none' : 'grayscale(100%)', // Makes it grey
          pointerEvents: 'none', // Disables all pointer events like clicking
        }}
      >
        {!loading ? (
          submittedForReviewPosts?.length ? (
            submittedForReviewPosts.map((post: PostType) => (
              <CardDraftArticles
                dark={darkTheme}
                post={post}
                key={post.postId}
                isPublicationPost={true}
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
      </div>
    </div>
  );
};

export default SubmittedArticles;
