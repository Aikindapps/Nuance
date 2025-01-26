import React, { useState, useEffect, useRef } from 'react';
import ProfilePictureButton from '../../UI/profile-picture-button/profile-picture-button';
import InputField from '../../UI/InputField/InputField';
import Button from '../../UI/Button/Button';
import Footer from '../../components/footer/footer';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useUserStore } from '../../store';
import { getNewContentId, uploadBlob } from '../../services/storageService';
import Loader from '../../UI/loader/Loader';
import { downscaleImage } from '../../components/quill-text-editor/modules/quill-image-compress/downscaleImage.js';
import { parseEmbeddedImage } from '../../shared/utils';
import RequiredFieldMessage from '../../components/required-field-message/required-field-message';
import { images } from '../../shared/constants';
import AvatarEditor from 'react-avatar-editor';
import LoggedOutSidebar from '../../components/logged-out-sidebar/logged-out-sidebar';
import { getUserActor } from 'src/nuance_assets/services/actorService';
import toast from 'react-hot-toast';
import { toastError } from '../../services/toastService';
import { useAuth } from '@nfid/identitykit/react';

const LoginRegistration = () => {
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarMimeType, setAvatarMimeType] = useState('');
  const [avatarSize, setAvatarSize] = useState(0);

  const [termCheck, setTermCheck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationAllowed, setRegistrationAllowed] = useState(false);
  const navigate = useNavigate();

  // all warning messages
  const [firstSave, setFirstSave] = useState(false);
  // field warnings
  const [handleWarning, setHandleWarning] = useState(false);
  const [displayNameWarning, setDisplayNameWarning] = useState(false);
  const [termCeckWarning, setTermCeckWarning] = useState(false);

  const registrationError = useAuthStore((state) => state.registrationError);

  const [canvas, setCanvas] = useState('');
  const [canvasScaled, setCanvasScaled] = useState('');
  const [hideEditor, setHideEditor] = useState(true);

  const { disconnect } = useAuth();
  const { agent: agentToBeUsed } = useAuthStore((state) => ({
    agent: state.agent,
  }));

  const { getUser, user, unregistered, createUser, isRegistrationAllowed } =
    useUserStore((state) => ({
      user: state.user,
      unregistered: state.unregistered,
      createUser: state.registerUser,
      getUser: state.getUser,
      isRegistrationAllowed: state.isRegistrationOpen,
    }));

  const { clearLoginMethod, isLoggedIn, redirectScreen, logout } = useAuthStore(
    (state) => ({
      clearLoginMethod: state.clearLoginMethod,
      isLoggedIn: state.isLoggedIn,
      redirectScreen: state.redirectScreen,
      logout: state.logout,
    })
  );

  useEffect(() => {
    if (user) {
      setLoading(false);
      goToRedirect();
    } else if (unregistered || registrationError) {
      setLoading(false);
    }
  }, [user, unregistered, registrationError]);

  useEffect(() => {
    handleRegistrationLimit();
    getUser(agentToBeUsed);
  }, []);

  useEffect(() => {
    setHandleWarning(firstSave && handle.trim() === '');
  }, [handle, firstSave]);

  useEffect(() => {
    setDisplayNameWarning(firstSave && displayName.trim() === '');
  }, [displayName, firstSave]);

  useEffect(() => {
    setTermCeckWarning(firstSave && termCheck === false);
  }, [termCheck, firstSave]);

  const handleRegistrationLimit = async () => {
    let isAllowed = await isRegistrationAllowed(agentToBeUsed);
    if (!isAllowed) {
      toastError(
        'Daily user registration limit exceeded. You are being redirected to the home page.'
      );
      setTimeout(() => {
        handleCancel();
      }, 2000);
    }
    setRegistrationAllowed(isAllowed);
  };
  console.log(registrationAllowed);
  const onHandleChange = (value: string) => {
    setHandle(value);
    // console.log('value: ', value);
  };
  const onDisplayNameChange = (value: string) => {
    setDisplayName(value);
    // console.log('value: ', value);
  };
  const onAvatarChange = (
    imageUrl: string,
    value: Blob,
    mimeType: string,
    fileSize: number,
    e: any
  ) => {
    setAvatar(imageUrl);
    setAvatarMimeType(mimeType);
    setAvatarSize(fileSize);
    setHideEditor(false);

    const reader = new FileReader();
    if (e.target.files[0]) {
      reader.readAsDataURL(e.target.files[0]);
    }
    reader.onload = async (event) => {
      const embeddedImage = event?.target?.result as string;
      const dataUrlCompressed = await downscaleImage(
        embeddedImage,
        1000, // max width
        1000, // max height
        'image/jpeg', // all images converted to jpeg
        [], // keepImageTypes
        [], // ignoreImageTypes
        0.9, // image quality
        console
      );

      setAvatar(dataUrlCompressed);
    };
  };

  const onCheckboxChange = (e: any) => {
    setTermCheck(e.target.checked);
  };
  const goToRedirect = () => {
    navigate(redirectScreen, { replace: true });
  };

  const handleCancel = async () => {
    clearLoginMethod();
    await disconnect();
    logout();
    window.location.pathname = redirectScreen;
  };

  function validate() {
    setFirstSave(true);
    const isValid =
      handle.trim() !== '' && displayName.trim() !== '' && termCheck;
    return isValid;
  }

  const onRegister = async () => {
    const isValid = validate();
    if (!isValid) {
      return;
    }

    setLoading(true);

    //if handle exists already (or error) spinner won't get stuck
    setTimeout(() => {
      setLoading(false);
    }, 10000);

    // parse compressed base64
    const avatarImage = parseEmbeddedImage(avatar);

    // upload image blob and header info to storage canister if the avatar image exists
    if (avatarImage) {
      avatarImage.contentId = await getNewContentId();

      const storageInfo = await uploadBlob(
        avatarImage.blob,
        avatarImage.blob.size,
        avatarImage.mimeType,
        '-1', // indicates header
        avatarImage.contentId
      );

      // create user with avatar url pointing to image in storage canister
      createUser(handle, displayName, storageInfo.dataUrl, agentToBeUsed);
    } else {
      createUser(handle, displayName, '', agentToBeUsed);
    }
  };

  const editor = useRef(null);
  const [imageURL, setImgURL] = useState('');

  // const getImageUrl = async () => {
  //   //@ts-ignore
  //   const dataUrl = editor.getImage().toDataURL();
  //   const result = await fetch(dataUrl);
  //   const blob = await result.blob();

  //   setImgURL(await getImageUrl());
  //   return window.URL.createObjectURL(blob);
  // };

  return (
    <div className='login-wrapper'>
      {isLoggedIn ? (
        <div
          className='left'
          style={
            registrationAllowed
              ? {}
              : {
                  filter: 'grayscale(2)',
                  cursor: 'not-allowed',
                  pointerEvents: 'none',
                }
          }
        >
          <h1>Nice to meet you!</h1>
          <ProfilePictureButton avatar={avatar} onChange={onAvatarChange} />
          <div>
            <AvatarEditor
              ref={editor}
              //className='preview'
              //style=
              className={hideEditor ? 'hidden' : ''}
              image={avatar}
              borderRadius={100}
              width={150}
              height={150}
              border={50}
              scale={1.2}
            />
            <button
              className={hideEditor ? 'hidden' : 'editor-button'}
              onClick={() => {
                if (editor) {
                  // This returns a HTMLCanvasElement, it can be made into a data URL or a blob,
                  // drawn on another canvas, or added to the DOM.
                  //@ts-ignore
                  setCanvas(editor.current.getImage().toDataURL());

                  // If you want the image resized to the canvas size (also a HTMLCanvasElement)
                  setCanvasScaled(
                    editor.current
                      //@ts-ignore
                      ?.getImageScaledToCanvas()
                      .toDataURL('image/jpeg', 1.0)
                  );
                  setAvatar(
                    editor.current
                      //@ts-ignore
                      ?.getImageScaledToCanvas()
                      .toDataURL('image/jpeg', 1.0)
                  );
                  setHideEditor(true);
                }
              }}
            >
              Crop
            </button>
          </div>

          {loading && (
            <div className='mobile-loader'>
              <Loader />
            </div>
          )}

          <div className={`reg-form${loading && ' loading'}`}>
            <div className='input'>
              <p className='text'>Your @handle (cannot be changed)</p>
              <InputField
                handle={true}
                onChange={onHandleChange}
                hasError={handleWarning}
                inactive={!registrationAllowed}
              />
            </div>
            <div style={{ position: 'relative', top: '-10px' }}>
              <RequiredFieldMessage hasError={handleWarning} />
            </div>

            <div className='input'>
              <p className='text'>Your display name (can be changed)</p>
              <InputField
                handle={false}
                onChange={onDisplayNameChange}
                hasError={displayNameWarning}
                inactive={!registrationAllowed}
              />
            </div>
            <div style={{ position: 'relative', top: '-10px' }}>
              <RequiredFieldMessage hasError={displayNameWarning} />
            </div>

            <div className='terms'>
              <input
                type='checkbox'
                className='checkbox'
                onChange={onCheckboxChange}
              />
              <p className='terms'>Accept the terms and conditions</p>
            </div>
            <div style={{ position: 'relative', top: '-30px' }}>
              <RequiredFieldMessage hasError={termCeckWarning} />
            </div>
            <div className='buttons'>
              <Button
                type='button'
                styleType={{ dark: 'white', light: 'white' }}
                style={{ width: '96px' }}
                onClick={async () => {
                  await handleCancel();
                }}
              >
                Cancel
              </Button>
              <Button
                type='button'
                styleType={{ dark: 'navy', light: 'navy' }}
                style={{ width: '96px', alignSelf: 'center' }}
                onClick={onRegister}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <LoggedOutSidebar />
        </div>
      )}
      <div className='dividerr'></div>
      <div className='right'>
        <h1>
          Inspire a world’s generation. <br></br> Start writing!
        </h1>
        {loading ? (
          <div
            style={{
              margin: '50px 0 50px 20px',
            }}
          >
            <Loader />
          </div>
        ) : (
          <div className='flag-div'>
            <img src={images.NUANCE_FLAG} className='flag' />
          </div>
        )}
        <Footer />
      </div>
    </div>
  );
};

export default LoginRegistration;
