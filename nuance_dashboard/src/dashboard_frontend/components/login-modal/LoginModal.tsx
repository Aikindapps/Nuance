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

  const [isLocal, setIsLocal] = useState(false);

  const [postCoreCanisterId, setPostCoreCanisterId] = useState(
    '322sd-3iaaa-aaaaf-qakgq-cai'
  );
  const [metricsCanisterId, setMetricsCanisterId] = useState(
    'xjlvo-hyaaa-aaaam-qbcga-cai'
  );

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
      verifyPrincipalId(metricsCanisterId)
    );
  };

  const {
    isLoggedIn,
    logout,
    login,
    getIdentity,
    init,
    principalString,
    identity,
  } = useAuthStore((state) => ({
    init: state.init,
    isLoggedIn: state.isLoggedIn,
    login: state.login,
    logout: state.logout,
    getIdentity: state.getIdentity,
    principalString: state.principalString,
    identity: state.identity,
  }));

  const { setupEnvironment } = usePostStore((state) => ({
    setupEnvironment: state.setupEnvironment,
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
          {'Advanced options - Not for Nick :)'}
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
          login(isLocal);
          await getIdentity();
          await setupEnvironment(isLocal, postCoreCanisterId, metricsCanisterId);
          modalContext?.closeModal();
        }}
        disabled={!verifyLogin()}
      >
        Login
      </button>
    </div>
  );
};
