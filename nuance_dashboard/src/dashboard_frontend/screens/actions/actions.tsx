import React, { useContext, useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar/sidebar';
import { useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { Context as ModalContext } from '../../contextes/ModalContext';

import './actions.scss';

export const Actions: React.FC = () => {
  const navigate = useNavigate();

  const modalContext = useContext(ModalContext);

  const { isLoggedIn } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
  }));

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn]);
  return (
    <div className='page-wrapper'>
      <Sidebar />
      <div className='actions-wrapper'>
        <div>Just read below.</div>
        <div className='action-cards-wrapper'>
          <div
            onClick={() => {
              modalContext?.openModal('Update handle');
            }}
            className='action'
          >
            Update an individual user handle
          </div>
          <div
            onClick={() => {
              modalContext?.openModal('Update publication handle');
            }}
            className='action'
          >
            Update a publication handle
          </div>
          <div
            onClick={() => {
              modalContext?.openModal('Create Publication');
            }}
            className='action'
          >
            Create publication
          </div>
        </div>
      </div>
    </div>
  );
};

export default Actions;
