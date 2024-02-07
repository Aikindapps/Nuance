import React, { useContext, useEffect, useState } from 'react';
import './update-publication-handle-modal.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { colors, icons, images } from '../../shared/constants';
import { IoCloseOutline } from 'react-icons/io5';
import { useAuthStore, usePostStore } from '../../store';
import Toggle from '../toggle/toggle';
import InputField from '../InputField/InputField';
import { Principal } from '@dfinity/principal';

export const UpdatePublicationHandleModal = () => {
  const modalContext = useContext(ModalContext);

  const { updateHandle } = usePostStore((state) => ({
    updateHandle: state.updatePublicationHandle,
  }));

  const [oldHandle, setOldHandle] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className='update-publication-handle-modal'>
      <IoCloseOutline
        onClick={() => {
          modalContext?.closeModal();
        }}
        className='close-modal-icon'
      />
      <p className='modal-title'>Update the handle of publication</p>
      <div className='modal-input-wrapper'>
        <div className='input-title'>Existing handle</div>
        <InputField
          onChange={(t) => {
            setOldHandle(t);
          }}
          value={oldHandle}
          defaultText={'Existing handle...'}
          width={'100%'}
          height={'40px'}
          fontSize={'14px'}
          fontFamily={''}
          fontColor={''}
          hasError={false}
          classname='input-attributes-3'
        />
      </div>
      <div className='modal-input-wrapper'>
        <div className='input-title'>New handle</div>
        <InputField
          onChange={(t) => {
            setNewHandle(t);
          }}
          value={newHandle}
          defaultText={'New handle...'}
          width={'100%'}
          height={'40px'}
          fontSize={'14px'}
          fontFamily={''}
          fontColor={''}
          hasError={false}
          classname='input-attributes-3'
        />
      </div>
      {isLoading ? (
        <div>Processing...</div>
      ) : (
        <button
          onClick={async () => {
            setIsLoading(true);
            let result = await updateHandle(oldHandle, newHandle);
            if (result) {
              modalContext?.closeModal();
            }
            setIsLoading(false);
          }}
        >
          Execute
        </button>
      )}
    </div>
  );
};
