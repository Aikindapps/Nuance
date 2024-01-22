import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar/sidebar';
import { useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';



export const Actions: React.FC = () => {

  const navigate = useNavigate();
  const {
    isLoggedIn,
  } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
  }));

  useEffect(()=>{
    if(!isLoggedIn){
      navigate('/')
    }
  }, [isLoggedIn])
  return (
    <div className='page-wrapper'>
      <Sidebar />
      <div className='actions-wrapper'>Actions</div>
    </div>
  );
};

export default Actions;
