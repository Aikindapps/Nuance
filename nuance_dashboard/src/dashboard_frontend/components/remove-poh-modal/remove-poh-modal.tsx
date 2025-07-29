import React, { useContext, useEffect, useState } from 'react';
import './remove-poh-modal.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { colors, icons, images } from '../../shared/constants';
import { IoCloseOutline } from 'react-icons/io5';
import { useAuthStore, usePostStore } from '../../store';
import Toggle from '../toggle/toggle';
import InputField from '../InputField/InputField';
import { Principal } from '@dfinity/principal';

export const RemovePohModal = () => {
  const modalContext = useContext(ModalContext);

  const { removePoh } = usePostStore((state) => ({
    removePoh: state.removePoh,
  }));

  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className='remove-poh-modal'>
      <IoCloseOutline
        onClick={() => {
          modalContext?.closeModal();
        }}
        className='close-modal-icon'
      />
      <p className='modal-title'>Remove PoH of a user</p>
      <div className='modal-input-wrapper'>
        <div className='input-title'>Handle</div>
        <InputField
          onChange={(t) => {
            setHandle(t);
          }}
          value={handle}
          defaultText={'Handle to remove...'}
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
            let result = await removePoh(handle);
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
