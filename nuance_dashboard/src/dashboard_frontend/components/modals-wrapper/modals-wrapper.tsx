import React, { useContext } from 'react';
import './modals-wrapper.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { LoginModal } from '../login-modal/LoginModal';
import { UpdateHandleModal } from '../update-handle-modal/update-handle-modal';
import { UpdatePublicationHandleModal } from '../update-publication-handle-modal/update-handle-modal';
import { CreatePublicationModal } from '../create-publication-modal/create-publication-modal';
import { ViewRejectedPostModal } from '../view-rejected-post-modal/view-rejected-post-modal';
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
      {modalContext?.modalType === 'Login' ? (
        <LoginModal />
      ) : modalContext?.modalType === 'Update handle' ? (
        <UpdateHandleModal />
      ) : modalContext?.modalType === 'Update publication handle' ? (
        <UpdatePublicationHandleModal />
      ) : modalContext?.modalType === 'Create Publication' ? (
        <CreatePublicationModal />
      ) : modalContext?.modalType === 'View rejected post' &&
        modalContext.modalData?.post ? (
        <ViewRejectedPostModal post={modalContext.modalData.post} />
      ) : null}
    </div>
  );
};
