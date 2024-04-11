import React, { useContext } from 'react';
import './modals-wrapper.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { LoginModal } from '../login-modal/login-modal';
import { WithdrawModal } from '../withdraw-modal/withdraw-modal';
import { TransferNftModal } from '../transfer-nft-modal/transfer-nft-modal';
import { DepositModal } from '../deposit-modal/deposit-modal';
import { ClapModal } from '../clap-modal/clap-modal';
import { EditArticlePremiumModal } from '../edit-article-premium-modal/edit-article-premium-modal';
import { PostType } from 'src/nuance_assets/types/types';
import NotificationsSidebar from '../notifications/notifications';
export const ModalsWrapper = () => {
  const modalContext = useContext(ModalContext);
  return (
    <div
      className='modals-wrapper'
      style={
        modalContext?.isModalOpen && modalContext?.modalType !== 'Notifications'
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
      ) : modalContext?.modalType === 'WithdrawToken' ? (
        <WithdrawModal />
      ) : modalContext?.modalType === 'WithdrawNft' &&
        modalContext.modalData?.transferNftData ? (
        <TransferNftModal post={modalContext.modalData.transferNftData} />
      ) : modalContext?.modalType === 'Deposit' ? (
        <DepositModal />
      ) : modalContext?.modalType === 'Clap' &&
        modalContext.modalData?.clappingPostData ? (
        <ClapModal post={modalContext.modalData?.clappingPostData} />
      ) : modalContext?.modalType === 'Premium article' &&
        modalContext.modalData?.premiumPostData &&
        modalContext.modalData.premiumPostOnSave &&
        modalContext.modalData.premiumPostRefreshPost &&
        modalContext.modalData.premiumPostNumberOfEditors ? (
        <EditArticlePremiumModal
          post={modalContext.modalData.premiumPostData}
          onSave={modalContext.modalData.premiumPostOnSave}
          refreshPost={modalContext.modalData.premiumPostRefreshPost}
          numberOfEditors={modalContext.modalData.premiumPostNumberOfEditors}
        />
      ) :
        modalContext?.modalType === 'Notifications' ? (
          <NotificationsSidebar />
        )
          : null}
    </div>
  );
};
