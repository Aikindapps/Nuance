import React, { useContext, useEffect, useState } from 'react';
import Button from '../../UI/Button/Button';
import { colors, icons, images } from '../../shared/constants';
import InputField2 from '../../UI/InputField2/InputField2';
import RequiredFieldMessage from '../required-field-message/required-field-message';
import { useTheme } from '../../contextes/ThemeContext';
import './edit-article-premium-modal.scss';
import { PostType } from '../../types/types';
import {
  useAuthStore,
  usePostStore,
  usePublisherStore,
  useUserStore,
} from '../../store';
import { toastError } from '../../services/toastService';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { IoCloseOutline } from 'react-icons/io5';
import { LuLoader2 } from 'react-icons/lu';
import PremiumArticleThumbnail from '../../UI/premium-article-thumbnail/premium-article-thumbnail';
import { IoInformationCircleOutline } from 'react-icons/io5';
import { Tooltip } from 'react-tooltip';
export const EditArticlePremiumModal = (props: {
  refreshPost: (post: PostType) => Promise<void>;
  post: PostType;
  onSave: (isDraft: boolean) => Promise<PostType | undefined>;
  numberOfEditors: number;
}) => {
  const modalContext = useContext(ModalContext);
  const darkTheme = useTheme();
  const user = useUserStore((state) => state.user);

  //number of keys
  const [inputAmount, setInputAmount] = useState(0);
  //price of the keys
  const [keyPrice, setKeyPrice] = useState('');

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [headerImageUsedInNft, setHeaderImageUsedInNft] = useState('');

  const [loading, setLoading] = useState(false);

  //postStore
  const { createNftFromPremiumArticle } = usePostStore((state) => ({
    createNftFromPremiumArticle: state.createNftFromPremiumArticle,
  }));

  useEffect(() => {
    if (modalContext?.modalType === 'Premium article') {
      loadHeaderImage();
    }
  }, [modalContext?.modalType]);

  const validateNft = () => {
    try {
      return (
        headerImageUsedInNft !== '' &&
        termsAccepted &&
        parseFloat(keyPrice) > 0 &&
        inputAmount > props.numberOfEditors + 1
      );
    } catch (error) {
      return false
    }
    
  };
  console.log(keyPrice)
  const onPremiumPublish = async () => {
    setLoading(true);
    if (validateNft()) {
      //modalContext?.closeModal();
      //save the post as draft first
      let saveReturn = await props.onSave(true);
      console.log('saveReturn: ', saveReturn)
      console.log(saveReturn);
      if (saveReturn) {
        //save as draft is successful
        let pubHandle = saveReturn.handle;
        let salePrice = BigInt(Math.round(Number(keyPrice) * 100000000));
        let createNftReturn = await createNftFromPremiumArticle(
          saveReturn,
          BigInt(inputAmount),
          salePrice,
          pubHandle,
          headerImageUsedInNft
        );
        console.log('createNftREturn: ', createNftReturn)

        await props.refreshPost({
          ...saveReturn,
          isDraft: false,
          isPremium: true,
        });
      }
    }
    setLoading(false);
    modalContext?.closeModal();
  };

  const loadHeaderImage = async () => {
    //get the image from url in base64 format and resize it to use in nft asset
    let blob = await fetch(
      window.location.origin.includes('local')
        ? 'http://localhost:8081/assets/images/nuance-logo.svg'
        : props.post.headerImage
    ).then((r) => r.blob());
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = async (event) => {
      const embeddedImage = event?.target?.result as string;
      var image = new Image();
      image.src = embeddedImage; // replace with your base64 encoded image
      var newWidth = 612;
      var newHeight = 321;
      image.onload = async function () {
        var canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;

        var context = canvas.getContext('2d');
        var width = image.width;
        var height = image.height;

        if (width / height > newWidth / newHeight) {
          var scale = newHeight / height;
          var scaledWidth = scale * width;
          var x = (newWidth - scaledWidth) / 2;
          context?.drawImage(image, x, 0, scaledWidth, newHeight);
        } else {
          var scale = newWidth / width;
          var scaledHeight = scale * height;
          var y = (newHeight - scaledHeight) / 2;
          context?.drawImage(image, 0, y, newWidth, scaledHeight);
        }
        setHeaderImageUsedInNft(canvas.toDataURL());
      };
    };
  };

  return (
    <div
      className='premium-modal'
      style={
        darkTheme ? { background: colors.darkModePrimaryBackgroundColor } : {}
      }
    >
      <Tooltip
        className='tooltip-wrapper'
        id='premium-article-modal-info-tooltip'
      />
      <IoCloseOutline
        onClick={() => {
          if (loading) {
            return;
          }
          modalContext?.closeModal();
        }}
        style={
          loading
            ? {
                cursor: 'not-allowed',
              }
            : {}
        }
        className='close-modal-icon'
      />
      <p
        style={
          darkTheme
            ? {
                color: colors.darkModePrimaryTextColor,
              }
            : {}
        }
        className='modal-title'
      >
        Mint article
      </p>
      <p
        style={
          darkTheme
            ? {
                color: colors.darkSecondaryTextColor,
              }
            : {}
        }
        className='minting-article-title-text'
      >
        {`"${props.post.title}"`}
        <br />
      </p>
      {user && headerImageUsedInNft && (
        <PremiumArticleThumbnail
          post={{ ...props.post, headerImage: headerImageUsedInNft }}
          handle={props.post.creator || user.handle}
        />
      )}
      <div className='selection-input-wrapper'>
        <div className='input-amount-wrapper'>
          <p className='premium-modal-field-text'>AMOUNT OF KEYS</p>
          <div className='amount-input-wrapper'>
            <div className='input-info-wrapper'>
              <input
                className='amount-input'
                type='number'
                style={
                  darkTheme
                    ? {
                        color: colors.darkModePrimaryTextColor,
                        cursor: loading ? 'not-allowed' : '',
                      }
                    : { cursor: loading ? 'not-allowed' : '' }
                }
                placeholder={`Fill in amount of keys (min. ${
                  props.numberOfEditors + 2
                })`}
                min={0}
                max={7777}
                step='1'
                onChange={(e) => {
                  if (loading) {
                    return;
                  }

                  const value = e.target.value;
                  if (value === '') {
                    setInputAmount(0);
                  }
                  if (/^\d*$/.test(value)) {
                    if ((parseInt(value, 10) || 0) <= 10000) {
                      setInputAmount(parseInt(value, 10) || 0);
                    }
                  }
                }}
                value={inputAmount !== 0 ? inputAmount : ''}
              />
              <IoInformationCircleOutline
                data-tooltip-id='premium-article-modal-info-tooltip'
                data-tooltip-content='Note: The amount of editors who have access to the publication are automatically given a key. This is the minimum number of keys. You cannot generate revenue from the keys for editors.'
                data-tooltip-place='top'
                className='info-icon'
              />
            </div>
          </div>
        </div>

        <div className='input-amount-wrapper'>
          <p className='premium-modal-field-text'>COST PER KEY (IN ICP)</p>
          <div className='amount-input-wrapper'>
            <div className='input-info-wrapper'>
              <input
                className='amount-input'
                type='number'
                style={
                  darkTheme
                    ? {
                        color: colors.darkModePrimaryTextColor,
                        cursor: loading ? 'not-allowed' : '',
                      }
                    : { cursor: loading ? 'not-allowed' : '' }
                }
                placeholder='Amount'
                min={0}
                max={100}
                step='0.0001'
                onChange={(e) => {
                  if (loading) {
                    return;
                  }
                  const newValue = e.target.value;
                  if (!newValue.match(/^\d*\.?\d{0,4}$/)) return;
                  if (
                    newValue === '' ||
                    (parseFloat(newValue) * Math.pow(10, 8) <= 10_000_000_000 &&
                      newValue.match(/^\d*\.?\d{0,4}$/))
                  ) {
                    setKeyPrice(newValue);
                  }
                }}
                value={keyPrice}
              />
            </div>
          </div>
        </div>

        <div
          className='terms-wrapper'
          onClick={() => {
            if (loading) {
              return;
            }
            setTermsAccepted(!termsAccepted);
          }}
        >
          <input className='terms-checkbox' type='checkbox' checked={termsAccepted} onChange={() => {}} />
          <p
            className='terms-text'
            style={darkTheme ? { color: colors.darkModePrimaryTextColor } : {}}
          >
            I am aware when I mint this article, I can not change it again. I am
            aware of terms and conditions, general policy and agree to them.
          </p>
        </div>
        <div className='buttons-wrapper'>
          <Button
            styleType='deposit'
            type='button'
            onClick={() => {
              if (loading) {
                return;
              }
              modalContext?.closeModal();
            }}
            style={
              loading
                ? {
                    cursor: 'not-allowed',
                  }
                : {}
            }
          >
            Cancel
          </Button>
          <Button
            styleType={darkTheme ? 'withdraw-dark' : 'withdraw'}
            style={
              !validateNft()
                ? {
                    cursor: 'not-allowed',
                    background: 'gray',
                    borderColor: 'gray',
                  }
                : {}
            }
            type='button'
            onClick={() => {
              if (loading) {
                return;
              }
              if (validateNft()) {
                onPremiumPublish();
              }
            }}
          >
            {loading && <LuLoader2 className='button-loader-icon' />}
            Mint article
          </Button>
        </div>
      </div>
    </div>
  );
};
