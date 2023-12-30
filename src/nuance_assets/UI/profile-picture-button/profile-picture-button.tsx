import React, { useEffect, useState } from 'react';
import { base64toBlob } from '../../shared/utils';
import { useUserStore, usePublisherStore } from '../../store';
import { images } from '../../shared/constants';

// // stavi na input type = file

type ProfilePictureProps = {
  avatar: string;
  onChange?: (
    imageUrl: string,
    value: Blob,
    mimeType: string,
    fileSize: number,
    e: any
  ) => void;
};

const ProfilePictureButton: React.FC<ProfilePictureProps> = (
  props: ProfilePictureProps
) => {
  const user = useUserStore((state) => state.user);
  const { publication, getPublication } = usePublisherStore((state) => ({
    getPublication: state.getPublication,
    publication: state.publication,
  }));

  const [isPublicationPage, setIsPublicationPage] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [test, setTest] = useState('');

  //if the first directory in the path is publications, then it is the publication page
  useEffect(() => {
    if (window.location.pathname.split('/')[1] === 'publication') {
      setIsPublicationPage(true);
      console.log('publication page');
    } else {
      setIsPublicationPage(false);
      console.log('not publication page');
    }
  }, []);
  const ShrinkCameraIcon = () => {
    setClicked(true);
  };
  const EnlargeCamerIcon = () => {
    setClicked(false);
  };

  const UploadPicture = (e: any) => {
    const reader = new FileReader();
    const file = e.target.files[0];
    if (file) {
      reader.readAsDataURL(file);
    }
    reader.onloadend = () => {
      if (reader.result === null) {
        throw new Error('file empty...');
      }
      const data = typeof reader.result == 'string' ? reader.result : null;
      setTest(data as string);
      let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
      if (encoded.length % 4 > 0) {
        encoded += '='.repeat(4 - (encoded.length % 4));
      }
      const blob = base64toBlob(encoded, file.type);
      props.onChange &&
        props.onChange(data as string, blob, file.type, file.size, e);
    };
  };

  return (
    <div
      onClick={ShrinkCameraIcon}
      onMouseOut={EnlargeCamerIcon}
      className='profile-picture'
    >
      <input
        id='file'
        type='file'
        style={{ display: 'none' }}
        required
        onChange={UploadPicture}
      />
      <label htmlFor='file' className='profile-picture'>
        {test ? (
          <img
            className={
              isPublicationPage ? 'publication-profile-pic' : 'uploaded-pic'
            }
            src={props.avatar}
            alt='background'
            style={!isPublicationPage ? { display: 'none' } : {}}
            onChange={UploadPicture}
          />
        ) : (
          <img src={images.PHOTO_BACKGROUND} alt='background' />
        )}
        <img
          className={
            clicked
              ? 'pic-camera-clicked'
              : isPublicationPage && publication?.avatar !== ''
              ? 'publication-pic-camera'
              : 'pic-camera'
          } //if this is a publication pic-camera needs to be publication pic camera
          style={
            !isPublicationPage && (props.avatar || user?.avatar)
              ? {
                  width: '120px',
                  borderRadius: '50%',
                  aspectRatio: '1',
                  height:'120px'
                }
              : {}
          }
          src={
            isPublicationPage
              ? publication?.avatar || images.PHOTO_CAMERA
              : props.avatar || user?.avatar || images.PHOTO_CAMERA
          }
          alt='no-profile'
        />
      </label>
    </div>
  );
};

export default ProfilePictureButton;
