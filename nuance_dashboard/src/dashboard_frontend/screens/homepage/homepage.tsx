import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar/sidebar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import './homepage.scss'
import { images } from '../../shared/constants';
export const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
  }));

  return (
    <div className='page-wrapper'>
      <Sidebar />
      <div className='homepage-wrapper'>
        <img className='nuance-flag' src={images.NUANCE_FLAG} />
        <div className='homepage-text'>Homepage of the admin dashboard</div>
        {!isLoggedIn && (
          <div className='homepage-text'>Please login or leave here!</div>
        )}
      </div>
    </div>
  );
};

export default Homepage;
