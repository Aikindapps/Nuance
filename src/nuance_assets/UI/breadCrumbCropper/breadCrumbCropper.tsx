import React, { useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';
import { icons } from '../../shared/constants';

type BreadCrumbCropperProps = {
  onCrop: (croppedImage: string) => void;
  currentImage: string;
  screenWidth: number;
};

const BreadCrumbCropper: React.FC<BreadCrumbCropperProps> = ({
  onCrop,
  currentImage,
  screenWidth,
}) => {
  const editor = useRef<AvatarEditor>(null);
  const [breadcrumbLogo, setBreadcrumbLogo] = useState('');
  const [canvas, setCanvas] = useState('');
  const [canvasScaled, setCanvasScaled] = useState('');
  const [hideEditor, setHideEditor] = useState(true);

  const onBreadcrumbLogoChange = (e: any) => {
    setHideEditor(false);
    setBreadcrumbLogo(URL.createObjectURL(e.target.files[0]));
  };

  return (
    <div style={{ display: 'grid' }}>
      <div id='breadcrumb' style={{ marginTop: '50px' }}>
        <p
          className={screenWidth < 768 ? 'mainTitle mobile-title' : 'mainTitle'}
        >
          BREADCRUMB LOGO(208*66)
        </p>
      </div>

      <input
        id='file3'
        type='file'
        style={{ display: 'none' }}
        required={true}
        onChange={onBreadcrumbLogoChange}
      />

      {breadcrumbLogo.length ? (
        <label htmlFor='file3' className='uploaded-pic'>
          <img
            className='breadcrumb-pic'
            src={breadcrumbLogo}
            alt='background'
          />
        </label>
      ) : (
        <label htmlFor='file3'>
          <div className='breadcrumb-upload'>
            <img
              src={currentImage ? currentImage : icons.UPLOAD_PICTURE}
              alt='background'
            />
          </div>
        </label>
      )}

      <AvatarEditor
        ref={editor}
        className={hideEditor ? 'hidden' : ''}
        image={breadcrumbLogo}
        width={208}
        height={66}
        border={50}
        scale={1.2}
        backgroundColor='white'
      />

      {
        <button
          className={hideEditor ? 'hidden' : 'editor-button'}
          onClick={() => {
            if (editor.current) {
              const currentImage = editor.current.getImage();
              const currentImageScaledToCanvas = editor.current
                .getImageScaledToCanvas()
                .toDataURL('image/jpeg', 1.0);

              if (currentImage && currentImageScaledToCanvas) {
                setCanvas(currentImage.toDataURL());
                setCanvasScaled(currentImageScaledToCanvas);
                setBreadcrumbLogo(currentImageScaledToCanvas);
                setHideEditor(true);
                onCrop(currentImageScaledToCanvas); // Pass the cropped image back to the parent component.
              }
            }
          }}
        >
          Crop
        </button>
      }
    </div>
  );
};

export default BreadCrumbCropper;
