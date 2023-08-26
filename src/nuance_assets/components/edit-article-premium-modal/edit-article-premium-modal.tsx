import React, { useState } from 'react';
import Button from '../../UI/Button/Button';
import { colors, icons, images } from '../../shared/constants';
import InputField2 from '../../UI/InputField2/InputField2';
import RequiredFieldMessage from '../required-field-message/required-field-message';
import { useTheme } from '../../ThemeContext';
import './edit-article-premium-modal.scss';
import { PostType } from '../../types/types';
import { usePostStore, usePublisherStore } from '../../store';
import { toastError } from '../../services/toastService';

export const EditArticlePremiumModal = (props: {
  setPremiumModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  refreshPost: (post: PostType) => Promise<void>;
  post: PostType;
  publicationHandle: string;
  onSave: (isDraft: boolean) => Promise<PostType | undefined>;
}) => {
  //publisherStore
  const { getPublication } = usePublisherStore((state) => ({
    getPublication: state.getPublicationReturnOnly,
  }));
  //postStore
  const { createNftFromPremiumArticle } = usePostStore((state) => ({
    createNftFromPremiumArticle: state.createNftFromPremiumArticle,
  }));
  //dark theme
  const darkTheme = useTheme();
  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
  };

  const [nftKeys, setNftKeys] = useState('');
  const [nftKeysWarning, setNftKeysWarning] = useState(false);
  const onNftKeysChange = (value: string) => {
    setNftKeysWarning(false);
    setNftKeys(value);
  };

  const [nftCost, setNftCost] = useState('');
  const [nftCostWarning, setNftCostWarning] = useState(false);
  const onNFTCostChange = (value: string) => {
    setNftCostWarning(false);
    setNftCost(value);
  };

  const [termsCheck, setTermsCheck] = useState(false);
  const [termsCheckWarning, setTermsCheckWarning] = useState(false);
  const onTermsCheckChange = (value: boolean) => {
    setTermsCheckWarning(false);
    setTermsCheck(value);
  };

  const [loading, setLoading] = useState(false);

  const validateNft = async () => {
    //check the input fields first
    if (!termsCheck) {
      setTermsCheckWarning(true);
      return false;
    }
    var nftCount: bigint | undefined = undefined;
    var salePrice: bigint | undefined = undefined;

    //try to convert the inputs to bigInt and if that returns an error, terminate the process and give an error
    try {
      nftCount = BigInt(Number(nftKeys));
      console.log(nftCount);
    } catch (err) {
      toastError('Invalid number of NFT keys.');
      setNftKeysWarning(true);
      return false;
    }
    try {
      salePrice = BigInt(Number(nftCost) * 100000000);
    } catch (err) {
      toastError('Invalid cost per key.');
      setNftCostWarning(true);
      return false;
    }
    if (salePrice === BigInt(0)) {
      toastError('Sale price can not be 0');
      setNftCostWarning(true);
      return false;
    }

    if (props.post.headerImage === '') {
      toastError('Header image can not be empty.');
      return false;
    }
    if (nftCount === BigInt(0)) {
      toastError('Number of keys can not be 0.');
      return false;
    }
    //if here, everything is cool -> check the number of editors in the publication
    let publication = await getPublication(props.publicationHandle);
    if (publication) {
      let minimum = publication.editors.length + 1;
      if (nftCount < BigInt(minimum)) {
        toastError(
          'Number of NFTs can not be lower than ' + minimum.toString()
        );
        return false;
      }
      return true;
    } else {
      toastError('Publication not found.');
      return false;
    }
  };

  const onPremiumPublish = async () => {
    setLoading(true);
    if (await validateNft()) {
      //if the validation passes, close the modal
      props.setLoading(true);
      props.setPremiumModalOpen(false);
      //save the post as draft first
      let saveReturn = await props.onSave(true);
      if (saveReturn) {
        //save as draft is successful
        let pubHandle = saveReturn.handle;
        let salePrice = BigInt(Number(nftCost) * 100000000);
        let createNftReturn = await createNftFromPremiumArticle(
          saveReturn,
          BigInt(nftKeys),
          salePrice,
          pubHandle
        );

        await props.refreshPost({
          ...saveReturn,
          isDraft: false,
          isPremium: true,
        });
      }
    }
    setLoading(false);
  };

  return (
    <div className='premium-modal'>
      <div
        className='premium-modal-content'
        style={{
          background: darkOptionsAndColors.background,
        }}
      >
        <Button
          disabled={loading}
          type='button'
          styleType='secondary-NFT'
          style={{ width: '96px' }}
          onClick={() => {
            props.setPremiumModalOpen(false);
          }}
        >
          Cancel
        </Button>
        <div className='modal-inner-container'>
          <img
            className='modal-NFT-logo'
            src={
              loading
                ? darkTheme
                  ? images.loaders.NUANCE_LOADER_DARK
                  : images.loaders.NUANCE_LOADER
                : icons.NUANCE_NFT_LG
            }
            style={{ filter: darkTheme ? 'contrast(.5)' : 'none' }}
          ></img>
          <div
            className='modal-content-block'
            style={{
              background: darkOptionsAndColors.background,
              opacity: loading ? '0' : '1',
            }}
          >
            <p
              className='modal-inner-text'
              style={{
                color: darkOptionsAndColors.color,
              }}
            >
              You are about to limit access to this article by creating NFT
              access keys. Only readers that bought a key can access the
              article.
            </p>
            <p
              className='modal-inner-text'
              style={{
                color: darkOptionsAndColors.color,
              }}
            >
              Set the amount of NFT keys and cost per key in ICP
            </p>
            <div className='modal-inputs-container'>
              <div className='modal-inputs'>
                <p className='NFT-number-of-keys'>NUMBER OF KEYS</p>
                <InputField2
                  width='50%'
                  height='24px'
                  defaultText='0'
                  fontSize='16px'
                  fontFamily='Georgia'
                  fontColor={colors.primaryTextColor}
                  hasError={nftKeysWarning}
                  value={nftKeys}
                  onChange={onNftKeysChange}
                  isNaturalNumberInput={true}
                  theme={darkTheme ? 'dark' : 'light'}
                ></InputField2>
                <div
                  style={{
                    position: 'relative',
                    top: '0px',
                    width: '10px',
                  }}
                >
                  {
                    <RequiredFieldMessage
                      hasError={nftKeysWarning}
                      NFTModal={true}
                      //errorMessage={"Must be greater than number of editors"}
                    />
                  }
                </div>
              </div>
              <div className='modal-inputs'>
                <p className='NFT-number-of-keys'>COST PER KEY</p>
                <InputField2
                  width='50%'
                  height='24px'
                  defaultText='0'
                  fontSize='16px'
                  fontFamily='Georgia'
                  fontColor={colors.primaryTextColor}
                  hasError={nftCostWarning}
                  value={nftCost as string}
                  onChange={onNFTCostChange}
                  isFloatInput={true}
                  theme={darkTheme ? 'dark' : 'light'}
                ></InputField2>
                <div style={{ position: 'relative', top: '0px' }}>
                  {
                    <RequiredFieldMessage
                      hasError={nftCostWarning}
                      NFTModal={true}
                    />
                  }
                </div>
              </div>
              <div className='ICP-units'>
                <p className='modal-inner-text'>ICP</p>
              </div>
            </div>
            <p
              className='modal-inner-text'
              style={{ color: darkOptionsAndColors.color }}
            >
              NOTE: after creating NFT access keys you can never change the
              article.
            </p>
            <div className='NFT-terms-and-conditions'>
              <input
                className='NFT-terms-and-conditions-checkbox'
                type='checkbox'
                id='terms'
                name='terms'
                value='terms'
                onChange={(e) => onTermsCheckChange(e.target.checked)}
              />
              <p
                className='NFT-terms-and-conditions-text'
                style={{
                  color: darkOptionsAndColors.color,
                }}
              >
                I accept the{' '}
                <a
                  href='https://wiki.nuance.xyz/nuance/terms-and-conditions'
                  style={{
                    color: darkOptionsAndColors.color,
                    textDecoration: 'underline',
                  }}
                >
                  terms and conditions
                </a>
                <div style={{ position: 'relative', top: '0px' }}>
                  {
                    <RequiredFieldMessage
                      hasError={termsCheckWarning}
                      NFTModal={true}
                    />
                  }
                </div>
              </p>
            </div>
          </div>

          <Button
            disabled={loading}
            type='button'
            styleType={darkTheme ? 'primary-1-dark' : 'primary-1'}
            style={{ width: '170px', opacity: loading ? '0' : '1' }}
            onClick={async () => {
              await onPremiumPublish();
            }}
          >
            Create NFT access keys
          </Button>
        </div>
      </div>
    </div>
  );
};
