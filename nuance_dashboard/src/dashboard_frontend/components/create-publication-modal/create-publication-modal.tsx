import React, { useContext, useEffect, useState } from 'react';
import './create-publication-modal.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { colors, icons, images } from '../../shared/constants';
import { IoCloseOutline } from 'react-icons/io5';
import { useAuthStore, usePostStore } from '../../store';
import Toggle from '../toggle/toggle';
import InputField from '../InputField/InputField';
import { Principal } from '@dfinity/principal';

export const CreatePublicationModal = () => {
  const modalContext = useContext(ModalContext);

  const { createPublication } = usePostStore((state) => ({
    createPublication: state.createPublication,
  }));

  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [firstEditor, setFirstEditor] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className='create-publication-modal'>
      <IoCloseOutline
        onClick={() => {
          modalContext?.closeModal();
        }}
        className='close-modal-icon'
      />
      <p className='modal-title'>Create a publication</p>
      <div className='modal-input-wrapper'>
        <div className='input-title'>Handle</div>
        <InputField
          onChange={(t) => {
            setHandle(t);
          }}
          value={handle}
          defaultText={'Handle...'}
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
        <div className='input-title'>Display name</div>
        <InputField
          onChange={(t) => {
            setDisplayName(t);
          }}
          value={displayName}
          defaultText={'Display name...'}
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
        <div className='input-title'>First editor handle</div>
        <InputField
          onChange={(t) => {
            setFirstEditor(t);
          }}
          value={firstEditor}
          defaultText={'First editor handle...'}
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
            let result = await createPublication(
              handle,
              displayName,
              firstEditor
            );
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
