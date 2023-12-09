import React, { useContext, useEffect, useState } from 'react';
import Button from '../../UI/Button/Button';
import { colors, icons, images } from '../../shared/constants';
import { number, string } from 'prop-types';
import { PostType, PremiumArticleSaleInformation } from '../../types/types';
import './_premium-article-info.scss';
import RequiredFieldMessage from '../required-field-message/required-field-message';
import { usePostStore } from '../../store/postStore';
import { useNavigate } from 'react-router-dom';
import { usePublisherStore } from '../../store/publisherStore';
import { useAuthStore } from '../../store/authStore';
import {Context as ModalContext} from '../../contextes/ModalContext'
import { toast, toastError, ToastType } from '../../services/toastService';
import { useTheme } from '../../contextes/ThemeContext';
import { Context } from '../../contextes/Context';
import { useUserStore } from '../../store';

type PremiumArticleInfoProps = {
  availableCount: string;
  totalSupply: string;
  salePrice: string;
  loading: boolean;
  post: PostType | undefined;
  saleInfo: PremiumArticleSaleInformation | undefined;
  user: string | undefined;
};
export const PremiumArticleInfo: React.FC<PremiumArticleInfoProps> = (
  props
): JSX.Element => {
  const [modalPage, setModalPage] = useState('locked');
  const [checkboxError, setCheckBoxError] = useState(false);
  const [userAccepted, setUserAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState(BigInt(0));
  const navigate = useNavigate();
  const darkTheme = useTheme();

  const context = useContext(Context);
  const modalContext = useContext(ModalContext)

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

  const getUserBalance = async () => {
    let userBalance = await getMyBalance();
    await getUserWallet();
    if (userBalance) {
      setUserBalance(userBalance);
    }
    setLoading(false);
  };

  const { getPremiumArticleInfo } = usePublisherStore((state) => ({
    getPremiumArticleInfo: state.getPremiumArticleInfo,
  }));

  const { getUserWallet, userWallet } = useAuthStore((state) => ({
    getUserWallet: state.getUserWallet,
    userWallet: state.userWallet,
  }));

  const validateCheckBox = () => {
    if (checkboxError) {
      if (userAccepted) {
        setCheckBoxError(false);
        return true;
      } else {
        return false;
      }
    } else {
      if (!userAccepted) {
        setCheckBoxError(true);
        return false;
      }
      return true;
    }
  };

  const { lockToken, transferIcp, settleToken, getOwnedNfts, getMyBalance } =
    usePostStore((state) => ({
      lockToken: state.lockToken,
      transferIcp: state.transferIcp,
      settleToken: state.settleToken,
      getOwnedNfts: state.getOwnedNfts,
      getMyBalance: state.getMyBalance,
    }));
  const { user } = useUserStore((state) => ({
    user: state.user,
  }));

  useEffect(() => {
    getUserBalance();
  }, []);
  useEffect(() => {
    getUserBalance();
  }, [user]);

  const handleMarketplacePurchase = async () => {
    if (props.saleInfo) {
      let price = BigInt(props.saleInfo.cheapestPrice);
      setLoading(true);
      //control user balance
      if (userBalance <= price) {
        setModalPage('unsufficient');
        setLoading(false);
      } else {
        console.log('lock token: ' + userWallet?.accountId);
        let sellerAccountReturn = await lockToken(
          props.saleInfo.cheapestTokenIdentifier,
          price,
          props.saleInfo.nftCanisterId,
          userWallet?.accountId
        );
        console.log(sellerAccountReturn);
        if (sellerAccountReturn.err) {
          switch (sellerAccountReturn.err) {
            case 'Unsufficient balance':
              setModalPage('unsufficient');
              setLoading(false);
              break;
            case 'login':
              setLoading(false);
              navigate('/register');
              break;
            default:
              if (props.post) {
                await getPremiumArticleInfo(
                  props.post?.postId,
                  props.post?.handle
                );
              }
              toastError(sellerAccountReturn.err);
              setLoading(false);
              break;
          }
        } else if (sellerAccountReturn.sellerAccountId) {
          let transferReturn = await transferIcp(
            BigInt(props.saleInfo.cheapestPrice),
            sellerAccountReturn.sellerAccountId
          );

          if ('Ok' in transferReturn && props.post) {
            let settleResult = await settleToken(
              props.saleInfo.cheapestTokenIdentifier,
              props.saleInfo.nftCanisterId,
              props.post?.handle
            );
            switch (settleResult) {
              case 'success':
                await getOwnedNfts();

                setLoading(false);
                setModalPage('congratulations');
                break;
              case 'error':
                if (props.post) {
                  await getPremiumArticleInfo(
                    props.post?.postId,
                    props.post?.handle
                  );
                }
                setLoading(false);
                break;
            }
          } else {
            setLoading(false);
            toastError('Unable to transfer the ICP');
          }
        }
      }
    }
  };

  if (loading || props.loading) {
    return (
      <div
        className='nft-modal'
        style={{
          background: darkOptionsAndColors.background,
          color: darkOptionsAndColors.color,
        }}
      >
        <div className='nft-modal-content'>
          <img
            className='nuance-nft-logo'
            src={
              darkTheme
                ? images.loaders.NUANCE_LOADER_DARK
                : images.loaders.NUANCE_LOADER
            }
            style={{ position: 'absolute', top: '10px' }}
          />
        </div>
      </div>
    );
  }
  if (props.availableCount === '0') {
    return (
      <div className='nft-modal'>
        <div
          className='nft-modal-content'
          style={{
            background: darkOptionsAndColors.background,
            color: darkOptionsAndColors.color,
          }}
        >
          <img
            className='nuance-nft-logo'
            src={images.NUANCE_LOGO_UNSUFFICIENT_BALANCE}
            style={{ filter: darkTheme ? 'contrast(0.5)' : 'none' }}
          />
          <div className='text-wrapper'>
            <div
              className='nft-modal-text'
              style={{
                background: darkOptionsAndColors.background,
                color: darkOptionsAndColors.color,
              }}
            >
              {`There is no NFT keys available for this article.`}
            </div>
          </div>
          <div className='text-wrapper'>
            <span
              className='nft-modal-text-2'
              style={{
                background: darkOptionsAndColors.background,
                color: darkOptionsAndColors.color,
              }}
            >
              {`Sorry this NFT is sold out - it might be available on the secondary market on toniq in ${props.post?.handle} collection.`}
            </span>
          </div>
          <div className='text-wrapper'>
            <span onClick={()=>{
              window.open(
                `https://toniq.io/marketplace/nuance-` +
                  props.post?.handle.toLowerCase(),
                '_blank'
              );
            }} className='how-it-works'>
              {'\n>See the collection in toniq'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  if (modalPage === 'locked') {
    return (
      <div className='nft-modal'>
        <div
          className='nft-modal-content'
          style={{
            background: darkOptionsAndColors.background,
            color: darkOptionsAndColors.color,
          }}
        >
          <img
            className='nuance-nft-logo'
            src={images.NUANCE_LOGO_NFT}
            style={{ filter: darkTheme ? 'contrast(0.5)' : 'none' }}
          />
          <div className='text-wrapper'>
            <div
              className='nft-modal-text'
              style={{
                background: darkOptionsAndColors.background,
                color: darkOptionsAndColors.color,
              }}
            >
              This article is locked.
            </div>
            <div
              className='nft-modal-text'
              style={{
                background: darkOptionsAndColors.background,
                color: darkOptionsAndColors.color,
              }}
            >
              {`There are ${props.availableCount} of ${props.totalSupply} NFT keys available.`}
            </div>
          </div>
          <div className='text-wrapper'>
            <span
              className='nft-modal-text-2'
              style={{
                background: darkOptionsAndColors.background,
                color: darkOptionsAndColors.color,
              }}
            >
              {`This article can only be read when you own an NFT key. Use your wallet to purchase this key for `}
            </span>
            <span
              style={{ fontWeight: 'bold', color: darkOptionsAndColors.color }}
            >{`${
              //parseFloat(premiumSalePrice) / 100000000
              props.salePrice
            } ICP.\n`}</span>
          </div>
          <div className='button-flex'>
            <span onClick={(()=>{
              window.open(
                'https://wiki.nuance.xyz/nuance/how-do-premium-articles-work/article-nft-revenue-split',
                '_blank'
              );
            })} className='how-it-works'>
              {'\n> How does NFT access work?'}
            </span>
            <Button
              disabled={false}
              type='button'
              styleType={darkTheme ? 'primary-1-dark' : 'primary-1'}
              style={{ width: '170px', marginBottom: '20px' }}
              onClick={() => {
                if (props.user) {
                  setModalPage('buy');
                  setUserAccepted(false);
                } else {
                  modalContext?.openModal('Login')
                }
              }}
            >
              Buy the NFT key
            </Button>{' '}
          </div>
        </div>
      </div>
    );
  } else if (modalPage === 'buy') {
    return (
      <div className='nft-modal'>
        <div
          className='nft-modal-content'
          style={{
            background: darkOptionsAndColors.background,
            color: darkOptionsAndColors.color,
          }}
        >
          <img
            className='nuance-nft-logo'
            src={images.NUANCE_LOGO_NFT}
            style={{ filter: darkTheme ? 'contrast(0.5)' : 'none' }}
          />
          <Button
            disabled={false}
            type='button'
            styleType='secondary-NFT'
            style={{
              width: '120px',
              marginLeft: '10px',
              top: '20px',
              right: '20px',
              position: 'absolute',
            }}
            onClick={() => {
              setModalPage('locked');
            }}
          >
            Cancel
          </Button>

          <div className='text-wrapper'>
            <div
              className='nft-modal-text'
              style={{
                color: darkOptionsAndColors.color,
              }}
            >
              You are buying:
            </div>
          </div>
          <div className='text-wrapper-sale-info'>
            <span
              className='nft-sale-text'
              style={{
                color: darkOptionsAndColors.color,
              }}
            >
              {`1 NFT access key (out of ${props.totalSupply}) to the article:`}
            </span>
          </div>
          <div className='text-wrapper-sale-info'>
            <span
              className='nft-sale-text'
              style={{
                color: darkOptionsAndColors.color,
              }}
            >{`"${props.post?.title}"`}</span>
          </div>
          <div className='text-wrapper-sale-info'>
            <span
              className='nft-sale-text'
              style={{
                color: darkOptionsAndColors.color,
              }}
            >{`by @`}</span>
            <span
              className='nft-sale-text'
              style={{ fontWeight: 'bold', color: darkOptionsAndColors.color }}
            >
              {`${
                props.post?.isPublication
                  ? props.post?.creator
                  : props.post?.handle
              }`}
            </span>
          </div>
          <div className='total-cost-flex'>
            <div
              style={{
                color: darkOptionsAndColors.color,
              }}
            >
              Total Cost
            </div>
            <div
              style={{
                color: darkOptionsAndColors.color,
              }}
            >
              {props.salePrice + ' ICP'}
            </div>
          </div>
          <div className='horizontal-divider'></div>
          <div
            className='NFT-terms-and-conditions'
            style={{
              color: darkOptionsAndColors.color,
            }}
          >
            <input
              className='NFT-terms-and-conditions-checkbox'
              type='checkbox'
              id='terms'
              name='terms'
              value='terms'
              onChange={() => {
                setUserAccepted(!userAccepted);
              }}
              style={{
                color: darkOptionsAndColors.color,
              }}
            />
            <p
              className='NFT-terms-and-conditions-text'
              style={{
                color: darkOptionsAndColors.color,
              }}
            >
              I accept the{' '}
              <span
                style={{
                  textDecoration: 'underline',
                  color: darkOptionsAndColors.color,
                }}
                onClick={() => {
                  window.open(
                    'https://wiki.nuance.xyz/nuance/terms-and-conditions',
                    '_blank'
                  );
                }}
              >
                terms and conditions
              </span>
              <div style={{ position: 'relative', top: '0px' }}>
                {<RequiredFieldMessage hasError={checkboxError} />}
              </div>
            </p>
          </div>
          <div className='buttons-flex'>
            <Button
              disabled={false}
              type='button'
              styleType='secondary-NFT'
              style={{ width: '120px', marginLeft: '5px', marginRight: '5px' }}
              onClick={() => {
                navigate('/my-profile/wallet');
              }}
            >
              My wallet
            </Button>{' '}
            <Button
              disabled={false}
              type='button'
              styleType={darkTheme ? 'primary-1-dark' : 'primary-1'}
              style={{ width: '120px', marginLeft: '5px', marginRight: '5px' }}
              onClick={() => {
                if (validateCheckBox()) {
                  console.log('buy logic');
                  handleMarketplacePurchase();
                }
              }}
            >
              Buy now
            </Button>{' '}
          </div>
        </div>
      </div>
    );
  } else if (modalPage === 'congratulations') {
    return (
      <div className='nft-modal'>
        <div
          className='nft-modal-content'
          style={{
            background: darkOptionsAndColors.background,
            color: darkOptionsAndColors.color,
          }}
        >
          <img
            className='nuance-nft-logo'
            src={images.NUANCE_LOGO_NFT_PURCHASED}
            style={{ filter: darkTheme ? 'contrast(0.5)' : 'none' }}
          />
          <div className='text-wrapper'>
            <div
              className='nft-modal-text'
              style={{
                color: darkOptionsAndColors.color,
              }}
            >
              Congratulations!
            </div>
          </div>
          <div className='text-wrapper-congratulations'>
            <span
              className='nft-congratulations-text'
              style={{
                color: darkOptionsAndColors.color,
              }}
            >
              {`You now have NFT access key #${
                props.saleInfo &&
                parseInt(props.saleInfo?.cheapesTokenAccesKeyIndex) + 1
              } (out of ${props.saleInfo?.totalSupply}) to:`}
            </span>
          </div>
          <div className='text-wrapper-congratulations'>
            <span
              className='nft-congratulations-text'
              style={{
                color: darkOptionsAndColors.color,
              }}
            >{`"${props.post?.title}"`}</span>
          </div>
          <div className='text-wrapper-congratulations'>
            <span
              className='nft-congratulations-text'
              style={{
                color: darkOptionsAndColors.color,
              }}
            >{`by @`}</span>
            <span
              className='nft-congratulations-text'
              style={{ fontWeight: 'bold', color: darkOptionsAndColors.color }}
            >
              {`${
                props.post?.isPublication
                  ? props.post?.creator
                  : props.post?.handle
              }`}
            </span>
          </div>
          <div className='buttons-flex'>
            <Button
              disabled={false}
              type='button'
              styleType='secondary-NFT'
              style={{ width: '120px', marginLeft: '5px', marginRight: '5px' }}
              onClick={() => {
                navigate('/my-profile/wallet');
              }}
            >
              My wallet
            </Button>{' '}
            <Button
              disabled={false}
              type='button'
              styleType={darkTheme ? 'primary-1-dark' : 'primary-1'}
              style={{ width: '120px', marginLeft: '5px', marginRight: '5px' }}
              onClick={() => {
                window.location.reload();
              }}
            >
              Read article
            </Button>{' '}
          </div>
        </div>
      </div>
    );
  } else if (modalPage === 'unsufficient') {
    return (
      <div className='nft-modal'>
        <div
          className='nft-modal-content'
          style={{
            background: darkOptionsAndColors.background,
            color: darkOptionsAndColors.color,
          }}
        >
          <img
            className='nuance-nft-logo'
            src={images.NUANCE_LOGO_UNSUFFICIENT_BALANCE}
          />
          <div className='text-wrapper-unsufficient-balance'>
            <div
              className='nft-modal-text'
              style={{ color: darkOptionsAndColors.color }}
            >
              Sorry, you do not have enough ICP in your wallet!
            </div>
          </div>
          <div className='icp-balance-flex'>
            <div className='required'>
              <div style={{ color: darkOptionsAndColors.color }}>Required:</div>
              <div style={{ color: darkOptionsAndColors.color }}>
                {props.salePrice + '  ICP'}
              </div>
            </div>
            <div className='in-wallet'>
              <div style={{ color: darkOptionsAndColors.color }}>
                In your wallet:
              </div>
              <div style={{ color: darkOptionsAndColors.color }}>
                {Number((userBalance * BigInt(100)) / BigInt(100000000)) / 100 +
                  '  ICP'}
              </div>
            </div>
          </div>
          <div className='text-wrapper-unsufficient-balance'>
            <span
              className='nft-modal-text-2'
              style={{ color: darkOptionsAndColors.color }}
            >
              {`Please transfer more ICP tokens to your wallet and try again. Copy your principal or address to send ICP to your wallet.`}
            </span>
          </div>
          <div className='address-flex'>
            <div className='address'>
              <div className='address-header'>YOUR PRINCIPAL ID</div>
              <div className='address-container'>
                <img
                  className='copy-icon'
                  src={icons.COPY_ICON}
                  onClick={() => {
                    if (userWallet) {
                      navigator.clipboard.writeText(userWallet?.principal);
                      toast('Copied to clipboard.', ToastType.Success);
                    }
                  }}
                  style={{ filter: darkTheme ? 'contrast(0.5)' : 'none' }}
                />
                <div>{userWallet?.principal.slice(0, 25) + '...'}</div>
              </div>
            </div>
            <div className='address'>
              <div className='address-header'>YOUR ADDRESS</div>
              <div className='address-container'>
                <img
                  className='copy-icon'
                  src={icons.COPY_ICON}
                  onClick={() => {
                    if (userWallet) {
                      navigator.clipboard.writeText(userWallet?.accountId);
                      toast('Copied to clipboard.', ToastType.Success);
                    }
                  }}
                  style={{ filter: darkTheme ? 'contrast(0.5)' : 'none' }}
                />
                <div>{userWallet?.accountId.slice(0, 25) + '...'}</div>
              </div>
            </div>
          </div>
          <div className='buttons-flex'>
            <Button
              disabled={false}
              type='button'
              styleType='secondary-NFT'
              style={{ width: '120px', marginLeft: '5px', marginRight: '5px' }}
              onClick={() => {
                setUserAccepted(false);
                setModalPage('locked');
              }}
            >
              Cancel
            </Button>{' '}
            <Button
              disabled={false}
              type='button'
              styleType={darkTheme ? 'primary-1-dark' : 'primary-1'}
              style={{ width: '120px', marginLeft: '5px', marginRight: '5px' }}
              onClick={() => {
                navigate('/my-profile/wallet');
              }}
            >
              My wallet
            </Button>{' '}
          </div>
        </div>
      </div>
    );
  }
  return <div />;
};
