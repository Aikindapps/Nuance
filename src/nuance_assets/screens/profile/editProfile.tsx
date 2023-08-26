import React, { useState, useEffect, useRef } from 'react';
import Button from '../../UI/Button/Button';
import { useNavigate } from 'react-router';
import InputField from '../../UI/InputField2/InputField2';
import { useUserStore, useAuthStore } from '../../store';
import {
  base64toBlob,
  formatDate,
  getEmbeddedImages,
  parseEmbeddedImage,
} from '../../shared/utils';
import { getNewContentId, uploadBlob } from '../../services/storageService';
import AvatarEditor from 'react-avatar-editor';
import ProfilePictureButton from '../../UI/profile-picture-button/profile-picture-button';
import { downscaleImage } from '../../components/quill-text-editor/modules/quill-image-compress/downscaleImage';
import { toast, toastError, ToastType } from '../../services/toastService';
import Loader from '../../UI/loader/Loader';
import { useTheme } from '../../ThemeContext';
import { colors, images } from '../../shared/constants';

const EditProfile = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const navigate = useNavigate();
  const { user, updateBio, updateDisplayName, updateAvatar } = useUserStore(
    (state) => ({
      user: state.user,
      updateBio: state.updateBio,
      updateDisplayName: state.updateDisplayName,
      updateAvatar: state.updateAvatar,
    })
  );

  useEffect(() => {
    if (isLoggedIn && !user) {
      navigate('/register', { replace: true });
    }
  }, [isLoggedIn, user]);

  const [displayName, setDisplayName] = useState(user?.displayName);
  const [biography, setBiography] = useState(user?.bio);

  const [avatar, setAvatar] = useState(user?.avatar || images.DEFAULT_AVATAR);
  const [avatarBlob, setAvatarBlob] = useState(new Blob());
  const [avatarMimeType, setAvatarMimeType] = useState('');
  const [avatarSize, setAvatarSize] = useState(0);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [postHtml, setPostHtml] = useState('');
  const darkTheme = useTheme();

  const onDisplayNameChange = (value: string) => {
    setDisplayName(value);
  };

  const onBiographyChange = (value: string) => {
    setBiography(value);
  };

  const editor = useRef(null);
  const [hideEditor, setHideEditor] = useState(true);
  const [canvasScaled, setCanvasScaled] = useState('');
  const [canvas, setCanvas] = useState('');

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
    setAvatarChanged(true);

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

  const onSave = async () => {
    setIsLoading(true);
    if (user?.displayName !== displayName) {
      await updateDisplayName(displayName as string);
    }

    if (user?.bio !== biography) {
      await updateBio(biography as string);
    }

    if (avatarChanged) {
      const avatarImageResult = await convertAvatarImagesToUrls(postHtml);
      try {
        if (avatarImageResult) {
          await updateAvatar(avatarImageResult.avatarUrl);
        }
      } catch (err) {
        toastError(err);
      }
    }
    setIsLoading(false);
    navigate('/my-profile');
  };

  const convertAvatarImagesToUrls = async (
    content: string
  ): Promise<{ avatarUrl: string; contentWithUrls: string } | null> => {
    let avatarUrl = avatar;
    // returns null if the header image is already a URL
    const avatarImage = parseEmbeddedImage(avatar);
    const images = getEmbeddedImages(content);

    // Validate that the blob size of every image is less than
    // the max allowed bytes for an IC ingress message (2 MB).
    // Subtract 1 KB for additional payload data.
    const maxMessageSize = 1024 * 1024 * 2 - 1024; //2096640 bytes
    let errorImageName = '';

    if ((avatarImage?.blob.size || 0) > maxMessageSize) {
      errorImageName = 'Avatar image';
    } else {
      const imageIndex = images.findIndex(
        (image) => image.blob.size > maxMessageSize
      );

      if (imageIndex > -1) {
        errorImageName = `Content image # ${imageIndex + 1}`;
      }
    }

    if (errorImageName) {
      toast(
        `${errorImageName} exceeded the maximum image size of ` +
          `${(maxMessageSize / 1024 / 1024).toFixed(3)} MBs after compression.`,
        ToastType.Error
      );

      return null;
    }

    // TODO: Remove temporary hack when parallel uploads are working without this.
    // Each call to the canister is 2 seconds, so the header image + 2 content images
    // will take 6 seconds just to get content ids, before uploading begins.
    if (avatarImage) {
      avatarImage.contentId = await getNewContentId();
    }
    for (let image of images) {
      image.contentId = await getNewContentId();
    }

    const promises = images.map((image) =>
      uploadBlob(
        image.blob,
        image.blob.size,
        image.mimeType,
        image.index.toString(),
        image.contentId
      )
    );

    if (avatarImage) {
      promises.push(
        uploadBlob(
          avatarImage.blob,
          avatarImage.blob.size,
          avatarImage.mimeType,
          '-1', // indicates header
          avatarImage.contentId
        )
      );
    }

    let storageInfo = await Promise.all(promises);

    if (avatarImage) {
      let avatarImageStorageInfo = storageInfo.find(
        (info) => info.mappingId === '-1'
      );
      if (avatarImageStorageInfo?.dataUrl) {
        avatarUrl = avatarImageStorageInfo.dataUrl;
      }
      storageInfo = storageInfo.filter((info) => info.mappingId !== '-1');
    }

    storageInfo.sort((a, b) => Number(a.mappingId) - Number(b.mappingId));

    let offset = 0;
    let c = content;
    for (const info of storageInfo) {
      const image = images.find((x) => x.index === Number(info.mappingId));
      if (image) {
        const start = image.index + offset;
        const end = start + image.length;
        const replacement = `"${info.dataUrl}"`; // could add additional attributes

        // replace base64 with url
        c = c.substring(0, start) + replacement + c.substring(end);

        offset += replacement.length - image.length;
      }
    }

    return { avatarUrl, contentWithUrls: c };
  };

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

  if (isLoading) {
    return (
      <div className='wrapper edit'>
        <div
          style={{
            width: '150px',
            height: '150px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <Loader />
        </div>
      </div>
    );
  }
  return (
    <div className='wrapper edit'>
      <p className='title'>MY PROFILE / EDIT PROFILE</p>

      <div className='image'>
        <ProfilePictureButton avatar={avatar} onChange={onAvatarChange} />
      </div>
      <div style={{ display: 'flex' }}>
        <AvatarEditor
          ref={editor}
          className={hideEditor ? 'hidden' : ''}
          image={avatar}
          borderRadius={100}
          width={150}
          height={150}
          border={50}
          scale={1.2}
        />
        {
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
        }
      </div>
      <div className='section'>
        <div className='row'>
          <div className='entry'>
            <p className='label'>ACCOUNT CREATED</p>
            <p className='value' style={{ color: darkOptionsAndColors.color }}>
              {formatDate(user?.accountCreated)}
            </p>
          </div>
          <div className='entry'>
            <p className='label'>@HANDLE</p>
            <p className='value' style={{ color: darkOptionsAndColors.color }}>
              @{user?.handle}
            </p>
          </div>
        </div>
        <div className='entry'>
          <p className='label' style={{ marginTop: '10px' }}>
            DISPLAY NAME
          </p>
          <InputField
            defaultText='Enter display name...'
            width='100%'
            height='50px'
            fontSize={'14px'}
            fontFamily='Roboto'
            fontColor={colors.editProfileInputTextColor}
            hasError={false}
            onChange={onDisplayNameChange}
            value={displayName}
            theme={darkTheme ? 'dark' : 'light'}
          ></InputField>
        </div>
      </div>
      <div className='section'>
        <div className='entry'>
          <p className='label'>BIOGRAPHY</p>
          <InputField
            defaultText='Enter biography...'
            width='100%'
            height='50px'
            fontSize={'14px'}
            fontFamily='Roboto'
            fontColor={colors.editProfileInputTextColor}
            hasError={false}
            onChange={onBiographyChange}
            value={biography}
            maxLength={161}
            theme={darkTheme ? 'dark' : 'light'}
          ></InputField>
        </div>
      </div>
      <p className='subtitle'>
        Your bio appears on your profile next to your stories. Max 160
        characters.
      </p>
      <div className='controls'>
        <Button
          style={{ width: '96px', margin: '0 16px 0 0' }}
          type='button'
          styleType='secondary-1'
          onClick={() => navigate('/my-profile')}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          type='button'
          styleType={darkTheme ? 'primary-1-dark' : 'primary-1'}
          style={{ width: '96px' }}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default EditProfile;
