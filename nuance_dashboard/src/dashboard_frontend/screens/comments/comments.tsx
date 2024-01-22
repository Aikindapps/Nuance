import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar/sidebar';
import { useAuthStore, usePostStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { Comment } from '../../../../../src/declarations/PostBucket/PostBucket.did';
import './comments.scss'
import CommentCard from '../../components/comment-card/comment-card';
import { CommentType } from '../../shared/types';

export const Comments: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false)
  const [displayingComments, setDisplayingComments] = useState<CommentType[]>([]);

  const { isLoggedIn } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
  }));

  const { getAllReportedComments, isLocal } = usePostStore((state) => ({
    getAllReportedComments: state.getAllReportedComments,
    isLocal: state.isLocal,
  }));

  const firstLoad = async () => {
    setLoading(true)
    let comments = await getAllReportedComments();
    setDisplayingComments(comments)
    setLoading(false)
  };

  console.log('isLocal: ', isLocal);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    } else {
      firstLoad();
    }
  }, [isLoggedIn]);

  return (
    <div className='page-wrapper'>
      <Sidebar />
      {loading ? (
        <div className='loading-wrapper'>Loading...</div>
      ) : displayingComments.length !== 0 ? (
        <div className='comments-wrapper'>
          {displayingComments.map((c) => (
            <CommentCard comment={c} callbackRefresh={firstLoad} />
          ))}
        </div>
      ) : (
        <div className='loading-wrapper'>
          Nothing to display here. Everyone plays nice or no one uses our app :(
        </div>
      )}
    </div>
  );
};

export default Comments;
