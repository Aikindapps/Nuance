import React, { useContext } from 'react';
import './modals-wrapper.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { LoginModal } from '../login-modal/LoginModal';
export const ModalsWrapper = () => {
  const modalContext = useContext(ModalContext);
  return (
    <div
      className='modals-wrapper'
      style={
        modalContext?.isModalOpen
          ? {
              width: '100vw',
              height: '100vh',
              position: 'fixed',
              background: 'rgba(0, 0, 0, 0.21)',
              backdropFilter: 'blur(4px)',
              top: '0',
              left: '0',
              opacity: '1',
            }
          : {}
      }
    >
      {modalContext?.modalType === 'Login' ? <LoginModal /> : null}
    </div>
  );
};
