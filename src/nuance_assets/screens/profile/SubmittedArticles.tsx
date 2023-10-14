import React, { useEffect, useState } from 'react';
import { usePostStore, useUserStore, useAuthStore, usePublisherStore } from '../../store';
import CardDraftArticles from '../../components/card-draft-articles/card-draft-articles';
import { PostType } from '../../types/types';
import { useNavigate } from 'react-router-dom';
import Loader from '../../UI/loader/Loader';
import { useTheme } from '../../ThemeContext';
import { colors, images } from '../../shared/constants';
import Button from '../../UI/Button/Button';

const SubmittedArticles = () => {
  const { user, getUser } = useUserStore((state) => ({
    user: state.user,
    getUser: state.getUser,
  
  }));
  const darkTheme = useTheme();

  const { getAllWriterDrafts } = usePublisherStore((state) => ({ getAllWriterDrafts: state.getAllWriterDrafts }));

  useEffect(() => {
    getAllWriterDrafts(user?.handle || '');
    console.log('user', user);
    console.log(getAllWriterDrafts(user?.handle || ''));
  }
  , [user]);

  const { allDrafts }  = usePublisherStore((state) => ({
    allDrafts: state.allDrafts,
  }));

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (isLoggedIn && !user) {
      navigate('/register', { replace: true });
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    
    console.log('allDrafts', allDrafts);

  }
  , [allDrafts]);

  

  return (
    <div className='wrapper'>
      <p className='title'>SUBMITTED FOR REVIEW ({allDrafts?.length || 0})</p>
      <div className='article-grid-horizontal'
      style={{
        filter: 'grayscale(100%)', // Makes it grey
        pointerEvents: 'none', // Disables all pointer events like clicking
      }}
      >
        {!loading ? (
          allDrafts?.length ? (
            allDrafts.map((post: PostType) => (
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
