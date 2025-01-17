import React, { useContext, useEffect, useState } from 'react';
import './_login-modal.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { colors, icons, images } from '../../shared/constants';
import { IoCloseOutline } from 'react-icons/io5';
import { useAuthStore, usePostStore } from '../../store';
import Toggle from '../toggle/toggle';
import InputField from '../InputField/InputField';
import { Principal } from '@dfinity/principal';
export const LoginModal = () => {
  const modalContext = useContext(ModalContext);

  const [advancedLoginOptions, setAdvancedLoginOptions] = useState(false);

  const [isLocal, setIsLocal] = useState(
    window.location.hostname.includes('local')
  );

  const [postCoreCanisterId, setPostCoreCanisterId] = useState(
    '4vm7k-tyaaa-aaaah-aq4wq-cai'
  );
  const [metricsCanisterId, setMetricsCanisterId] = useState(
    'a5asx-niaaa-aaaac-aacxq-cai'
  );

  const [userCanisterId, setUserCanisterId] = useState(
    'wlam3-raaaa-aaaap-qpmaa-cai'
  );

  const [publicationManagementCanisterId, setPublicationManagementCanisterId] =
    useState('zvibj-naaaa-aaaae-qaira-cai');

    const [cyclesDispenserCanisterId, setCyclesDispenserCanisterId] =
    useState('y6ydp-7aaaa-aaaaj-azwyq-cai');

  const verifyPrincipalId = (t: string) => {
    try {
      return Principal.fromText(t).toText() === t;
    } catch (error) {
      return false;
    }
  };

  const verifyLogin = () => {
    return (
      verifyPrincipalId(postCoreCanisterId) &&
      verifyPrincipalId(metricsCanisterId) &&
      verifyPrincipalId(userCanisterId) &&
      verifyPrincipalId(publicationManagementCanisterId) &&
      verifyPrincipalId(cyclesDispenserCanisterId)
    );
  };

  const { login, getIdentity } = useAuthStore((state) => ({
    login: state.login,
    getIdentity: state.getIdentity,
  }));

  return (
    <div className='login-modal'>
      <IoCloseOutline
        onClick={() => {
          modalContext?.closeModal();
        }}
        className='close-modal-icon'
      />
      <p className='modal-title'>Start admining!</p>
      <p className='information-text'>
        If you're not an admin, get out of here! You won't be able to do
        anything even if you login!
      </p>
      <div className='toggle-wrapper'>
        <Toggle
          toggled={advancedLoginOptions}
          callBack={() => {
            setAdvancedLoginOptions(!advancedLoginOptions);
          }}
        />
        <div className='toggle-text'>
          {'Advanced options - Especially for Nick :)'}
        </div>
      </div>
      {advancedLoginOptions && (
        <div className='advanced-login'>
          <InputField
            onChange={(cai) => {
              setPostCoreCanisterId(cai);
            }}
            value={postCoreCanisterId}
            defaultText={'PostCore canister id'}
            width={'100%'}
            height={'40px'}
            fontSize={'14px'}
            fontFamily={''}
            fontColor={''}
            hasError={!verifyPrincipalId(postCoreCanisterId)}
            classname='input-attributes-3'
          />
          <InputField
            onChange={(cai) => {
              setMetricsCanisterId(cai);
            }}
            value={metricsCanisterId}
            defaultText={'Metrics canister id'}
            width={'100%'}
            height={'40px'}
            fontSize={'14px'}
            fontFamily={''}
            fontColor={''}
            hasError={!verifyPrincipalId(metricsCanisterId)}
            classname='input-attributes-3'
          />
          <InputField
            onChange={(cai) => {
              setUserCanisterId(cai);
            }}
            value={userCanisterId}
            defaultText={'User canister id'}
            width={'100%'}
            height={'40px'}
            fontSize={'14px'}
            fontFamily={''}
            fontColor={''}
            hasError={!verifyPrincipalId(userCanisterId)}
            classname='input-attributes-3'
          />
          <InputField
            onChange={(cai) => {
              setPublicationManagementCanisterId(cai);
            }}
            value={publicationManagementCanisterId}
            defaultText={'PublicationManagement canister id'}
            width={'100%'}
            height={'40px'}
            fontSize={'14px'}
            fontFamily={''}
            fontColor={''}
            hasError={!verifyPrincipalId(publicationManagementCanisterId)}
            classname='input-attributes-3'
          />
           <InputField
            onChange={(cai) => {
              setCyclesDispenserCanisterId(cai);
            }}
            value={cyclesDispenserCanisterId}
            defaultText={'CyclesDispenser canister id'}
            width={'100%'}
            height={'40px'}
            fontSize={'14px'}
            fontFamily={''}
            fontColor={''}
            hasError={!verifyPrincipalId(cyclesDispenserCanisterId)}
            classname='input-attributes-3'
          />
          <div className='is-local-flex'>
            <input
              type='checkbox'
              checked={isLocal}
              onChange={() => {
                setIsLocal(!isLocal);
              }}
            />
            <div>Is local</div>
          </div>
        </div>
      )}
      <button
        style={
          !verifyLogin()
            ? {
                cursor: 'not-allowed',
                background: 'gray',
                borderColor: 'gray',
              }
            : {}
        }
        onClick={async () => {
          await login(
            isLocal,
            postCoreCanisterId,
            metricsCanisterId,
            userCanisterId,
            publicationManagementCanisterId,
            cyclesDispenserCanisterId
          );
          await getIdentity();
          modalContext?.closeModal();
        }}
        disabled={!verifyLogin()}
      >
        Login
      </button>
    </div>
  );
};
