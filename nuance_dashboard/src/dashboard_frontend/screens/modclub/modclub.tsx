import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar/sidebar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, usePostStore } from '../../store';
import './modclub.scss';
import { IoIosRefresh } from 'react-icons/io';
import { IoIosArrowDown } from 'react-icons/io';

import {
  CanisterCyclesValue,
  PostType,
  ProposalSummaryValue,
} from '../../shared/types';
import RejectedPostCard from '../../components/rejected-post-card/rejected-post-card';

export const Modclub: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
  }));

  const { getRejectedPostsLastWeek } = usePostStore((state) => ({
    getRejectedPostsLastWeek: state.getRejectedPostsLastWeek,
  }));

  const [isLoading, setIsLoading] = useState(false);

  const [posts, setPosts] = useState<PostType[]>([]);

  const loadProposals = async () => {
    setIsLoading(true);
    let postsResponse = await getRejectedPostsLastWeek();
    setPosts(postsResponse);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
    loadProposals();
  }, [isLoggedIn]);

  return (
    <div className='page-wrapper'>
      <Sidebar />
      <div className='modclub-wrapper'>
        {posts.map((post) => {
          return <RejectedPostCard post={post} />;
        })}
      </div>
    </div>
  );
};

export default Modclub;
