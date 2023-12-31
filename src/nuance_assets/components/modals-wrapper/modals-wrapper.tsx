import React, { useContext } from 'react';
import './modals-wrapper.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { LoginModal } from '../login-modal/login-modal';
import { WithdrawModal } from '../withdraw-modal/withdraw-modal';
import { TransferNftModal } from '../transfer-nft-modal/transfer-nft-modal';
import { DepositModal } from '../deposit-modal/deposit-modal';
import { ClapModal } from '../clap-modal/clap-modal';
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
      ) : null}
    </div>
  );
};
