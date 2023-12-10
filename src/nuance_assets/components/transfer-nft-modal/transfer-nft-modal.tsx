import React, { useContext, useEffect, useState } from 'react';
import Button from '../../UI/Button/Button';
import { colors, icons, images } from '../../shared/constants';
import { PostType, PremiumPostActivityListItem } from '../../types/types';
import './_transfer-nft-modal.scss';
import RequiredFieldMessage from '../required-field-message/required-field-message';

import { toast, toastError, ToastType } from '../../services/toastService';
import InputField2 from '../../UI/InputField2/InputField2';
import { usePostStore } from '../../store/postStore';
import { useTheme } from '../../contextes/ThemeContext';
import {Context as ModalContext} from '../../contextes/ModalContext';
type TransferNftModalProps = {
  post: PremiumPostActivityListItem;
};
export const TransferNftModal: React.FC<TransferNftModalProps> = (
  props
): JSX.Element => {
  const [modalPage, setModalPage] = useState('user-input');
  const [loading, setLoading] = useState(false);
  const [requiredError, setRequiredError] = useState(false);
  const darkTheme = useTheme();
  const modalContext = useContext(ModalContext);

  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
    secondaryColor: darkTheme
      ? colors.darkSecondaryTextColor
      : colors.primaryTextColor,
  };

  const handleTransfer = async () => {
    setLoading(true);
    if(props.post.tokenIdentifier){
      let transferReturn = await transferNft(
        props.post.tokenIdentifier,
        props.post.userAccountId,
        receiver,
        props.post.canisterId
      );
      switch (transferReturn) {
        case 'Success':
          toast('Success', ToastType.Success);
          modalContext?.closeModal();
          break;

        default:
          toastError('An error occured while trying to transfer the NFT');
          setModalPage('user-input');
          break;
      }
    }
    
  };

  const { transferNft } = usePostStore((state) => ({
    transferNft: state.transferNft,
  }));

  const [receiver, setReceiver] = useState('');

  if (modalPage === 'user-input') {
    return (
        <div
          className='transfer-modal'
          style={{
            background: darkOptionsAndColors.background,
            color: darkOptionsAndColors.color,
          }}
        >
          <img
            className='nuance-logo'
            src={images.NUANCE_LOGO_UNSUFFICIENT_BALANCE}
          />
          <p className='warning-text'>
            {`You're about to transfer your article access key. You will not be able to see the content of the article if you proceed!`}
          </p>
          <p
            className='address-header'
            style={{
              color: darkOptionsAndColors.color,
            }}
          >
            Receiver address:
          </p>
          <div className='input-wrapper'>
            <InputField2
              value={receiver}
              width='100%'
              height='24px'
              defaultText='Address'
              fontSize='16px'
              fontFamily='Georgia'
              fontColor={colors.primaryTextColor}
              onChange={(e) => {
                console.log(receiver);
                setReceiver(e);
              }}
              theme={darkTheme ? 'dark' : 'light'}
              hasError={false}
            ></InputField2>
            <RequiredFieldMessage hasError={requiredError} />
          </div>
          <div className='buttons-flex'>
            <Button
              disabled={false}
              type='button'
              styleType='secondary-NFT'
              style={{ width: '140px', marginLeft: '5px', marginRight: '5px' }}
              onClick={() => {
                modalContext?.closeModal();
              }}
            >
              Cancel
            </Button>{' '}
            <Button
              disabled={false}
              type='button'
              styleType={darkTheme ? 'primary-1-dark' : 'primary-1'}
              style={{ width: '140px', marginLeft: '5px', marginRight: '5px' }}
              onClick={() => {
                if (receiver.length) {
                  setRequiredError(false);
                  setModalPage('review-transaction');
                } else {
                  setRequiredError(true);
                }
              }}
            >
              Review transaction
            </Button>{' '}
          </div>
        </div>
    );
  } else if (modalPage === 'review-transaction') {
    return (
        <div
          className='transfer-modal'
          style={{
            background: darkOptionsAndColors.background,
            color: darkOptionsAndColors.color,
          }}
        >
          <img
            className='nuance-logo'
            src={
              loading
                ? darkTheme
                  ? images.loaders.NUANCE_LOADER_DARK
                  : images.loaders.NUANCE_LOADER
                : images.NUANCE_LOGO_UNSUFFICIENT_BALANCE
            }
          />

          <p
            className='warning-text'
            style={loading ? { visibility: 'hidden' } : {}}
          >
            {`Please review the transaction details below. It's irreversible. If you give wrong address, you may lose your assets!`}
          </p>
          <p
            className='review-transaction'
            style={
              loading
                ? { visibility: 'hidden' }
                : { color: darkOptionsAndColors.color }
            }
          >{`From:`}</p>
          <p
            className='review-transaction review-address'
            style={
              loading
                ? { visibility: 'hidden' }
                : { color: darkOptionsAndColors.color }
            }
          >
            {props.post.userAccountId}
          </p>
          <p
            className='review-transaction'
            style={
              loading
                ? { visibility: 'hidden' }
                : { color: darkOptionsAndColors.color }
            }
          >{`To:`}</p>
          <p
            className='review-transaction review-address'
            style={
              loading
                ? { visibility: 'hidden' }
                : { color: darkOptionsAndColors.color }
            }
          >
            {receiver}
          </p>
          <div
            className='buttons-flex'
            style={loading ? { visibility: 'hidden' } : {}}
          >
            <Button
              disabled={loading}
              type='button'
              styleType='secondary-NFT'
              style={{
                width: '140px',
                marginLeft: '5px',
                marginRight: '5px',
              }}
              onClick={() => {
                setModalPage('user-input');
              }}
            >
              Back
            </Button>{' '}
            <Button
              disabled={loading}
              type='button'
              styleType={darkTheme ? 'primary-1-dark' : 'primary-1'}
              style={{
                width: '140px',
                marginLeft: '5px',
                marginRight: '5px',
              }}
              onClick={async () => {
                await handleTransfer();
              }}
            >
              Confirm transaction
            </Button>{' '}
          </div>
        </div>
    );
  }
  return <div />;
};
