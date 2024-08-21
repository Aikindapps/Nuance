import React, { useContext, useEffect, useState } from 'react';
import Button from '../../UI/Button/Button';
import { colors, icons, images } from '../../shared/constants';
import { number, string } from 'prop-types';
import {
  PostType,
  PremiumArticleSaleInformation,
  UserWallet,
} from '../../types/types';
import './_premium-article-info.scss';
import RequiredFieldMessage from '../required-field-message/required-field-message';
import { usePostStore } from '../../store/postStore';
import { Link, useNavigate } from 'react-router-dom';
import { usePublisherStore } from '../../store/publisherStore';
import { useAuthStore } from '../../store/authStore';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { toast, toastError, ToastType } from '../../services/toastService';
import { useTheme } from '../../contextes/ThemeContext';
import { Context } from '../../contextes/Context';
import { useUserStore } from '../../store';
import { tokenIdentifier } from '../../shared/ext-utils';
import { FaRegCopy } from 'react-icons/fa';

type PremiumArticleInfoProps = {
  post: PostType | undefined;
  refreshPost: () => Promise<void>;
};
export const PremiumArticleInfo: React.FC<PremiumArticleInfoProps> = (
  props
): JSX.Element => {
  const [userAccepted, setUserAccepted] = useState(false);
  const [openingBuyScreen, setOpeningBuyScreen] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [userWallet, setUserWallet] = useState<UserWallet | undefined>(
    undefined
  );

  const [marketplacePurchaseLoading, setMarketplacePurchaseLoading] =
    useState(false);

  const navigate = useNavigate();
  const darkTheme = useTheme();

  const context = useContext(Context);
  const modalContext = useContext(ModalContext);

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

  const getUserWalletAndBalance = async () => {
    let userBalance = await getMyBalance();
    let userWallet = await getUserWallet();
    if (userBalance !== undefined && userWallet.principal.length !== 0) {
      return { userBalance, userWallet };
    }
  };

  const { getUserWallet, isLoggedIn } = useAuthStore((state) => ({
    getUserWallet: state.getUserWallet,
    isLoggedIn: state.isLoggedIn,
  }));

  const { lockToken, transferIcp, settleToken, getOwnedNfts, getMyBalance } =
    usePostStore((state) => ({
      lockToken: state.lockToken,
      transferIcp: state.transferIcp,
      settleToken: state.settleToken,
      getOwnedNfts: state.getOwnedNfts,
      getMyBalance: state.getMyBalance,
    }));

  if (!props.post || !props.post.premiumArticleSaleInfo) {
    return <div />;
  }

  type PremiumArticleModalPageType =
    | 'locked'
    | 'buy'
    | 'unsufficient'
    | 'congrats'
    | 'sold out';
  const [modalPage, setModalPage] = useState<PremiumArticleModalPageType>(
    props.post.premiumArticleSaleInfo.totalSupply >
      props.post.premiumArticleSaleInfo.currentSupply
      ? 'locked'
      : 'sold out'
  );
  const handleOpenBuyScreen = async () => {
    setOpeningBuyScreen(true);
    let walletAndBalance = await getUserWalletAndBalance();
    if (walletAndBalance) {
      setUserBalance(Number(walletAndBalance.userBalance));
      setUserWallet(walletAndBalance.userWallet);
      setModalPage('buy');
      setUserAccepted(false);
    }
    setOpeningBuyScreen(false);
  };

  const handleMarketplacePurchase = async () => {
    setMarketplacePurchaseLoading(true);
    let articleSaleInfo = props.post?.premiumArticleSaleInfo;
    if (articleSaleInfo && userWallet) {
      let lockResponse = await lockToken(
        tokenIdentifier(
          articleSaleInfo.nftCanisterId,
          articleSaleInfo.tokenIndex
        ),
        BigInt(articleSaleInfo.price_e8s),
        articleSaleInfo.nftCanisterId,
        userWallet.accountId
      );
      if (lockResponse) {
        //lock successful
        //transfer the ICPs
        let transferResponse = await transferIcp(
          BigInt(articleSaleInfo.price_e8s),
          lockResponse
        );
        if ('Ok' in transferResponse) {
          let settleResponse = await settleToken(
            tokenIdentifier(
              articleSaleInfo.nftCanisterId,
              articleSaleInfo.tokenIndex
            ),
            articleSaleInfo.nftCanisterId
          );
          if (settleResponse) {
            setModalPage('congrats');
          }
        } else {
          toastError(transferResponse.Err);
        }
      }
    }
    setMarketplacePurchaseLoading(false);
  };
  switch (modalPage) {
    case 'locked':
      return (
        <div style={darkOptionsAndColors} className='buy-nft-modal'>
          <div className='buy-nft-modal-content'>
            <img
              className='buy-nft-modal-logo'
              src={images.NUANCE_LOGO_NFT}
              style={{ filter: darkTheme ? 'contrast(0.5)' : 'none' }}
            />
            <div className='buy-nft-modal-article-info-wrapper'>
              <div
                className='buy-nft-modal-article-info-title'
                style={{ marginBottom: '0' }}
              >
                This article is locked.
              </div>
              <div className='buy-nft-modal-article-info-title'>
                {`There are ${
                  props.post.premiumArticleSaleInfo.totalSupply -
                  props.post.premiumArticleSaleInfo.currentSupply
                } of ${
                  props.post.premiumArticleSaleInfo.totalSupply
                } NFT keys available.`}
              </div>
              <div className='buy-nft-modal-article-info-centered'>
                This article can only be read when you own an NFT key. Use your
                Nuance wallet to purchase this key for{' '}
                <span style={{ fontWeight: 'bold' }}>
                  {props.post.premiumArticleSaleInfo.priceReadable} ICP
                </span>{' '}
              </div>
            </div>
            <div
              onClick={() => {
                window.open(
                  'https://wiki.nuance.xyz/nuance/how-do-premium-articles-work/article-nft-revenue-split',
                  '_blank'
                );
              }}
              className='buy-nft-modal-how-it-works'
            >
              {'> How does NFT access work?'}
            </div>
            <div className='buy-nft-modal-buttons-wrapper'>
              <Button
                loading={openingBuyScreen}
                type='button'
                styleType={{dark: 'navy-dark', light: 'navy'}}
                style={{
                  width: '120px',
                }}
                onClick={() => {
                  if (isLoggedIn) {
                    handleOpenBuyScreen();
                  } else {
                    modalContext?.openModal('Login');
                  }
                }}
              >
                Buy now
              </Button>
            </div>
          </div>
        </div>
      );
    case 'buy':
      return (
        <div style={darkOptionsAndColors} className='buy-nft-modal'>
          <div className='buy-nft-modal-content'>
            <Button
              type='button'
              className={{dark: 'premium-article-cancel-button', light: 'premium-article-cancel-button'}}
              styleType={{dark: 'white', light: 'white'}}
              onClick={() => {
                if (!marketplacePurchaseLoading) {
                  setModalPage('locked');
                }
              }}
            >
              Cancel
            </Button>
            <img
              className='buy-nft-modal-logo'
              src={images.NUANCE_LOGO_NFT}
              style={{ filter: darkTheme ? 'contrast(0.5)' : 'none' }}
            />
            <div className='buy-nft-modal-article-info-wrapper'>
              <div className='buy-nft-modal-article-info-title'>
                You are buying
              </div>
              <div className='buy-nft-modal-article-info'>{`1 NFT access key (out of ${props.post?.premiumArticleSaleInfo?.totalSupply}) to the article:`}</div>
              <div className='buy-nft-modal-article-info'>{`"${props.post?.title}"`}</div>
              <div className='buy-nft-modal-article-info'>
                by @
                <span className='buy-nft-modal-article-info-bold'>
                  {props.post?.creatorHandle}
                </span>
              </div>
              <div className='buy-nft-modal-cost-wrapper'>
                <div>Total Cost</div>
                <div>
                  {props.post?.premiumArticleSaleInfo?.priceReadable + ' ICP'}
                </div>
              </div>
              <div className='buy-nft-modal-conditions-wrapper'>
                <input
                  className='buy-nft-modal-checkbox'
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
                <div>
                  I accept the{' '}
                  <span className='buy-nft-modal-conditions-underline'>
                    terms and conditions
                  </span>
                </div>
              </div>
            </div>
            <div className='buy-nft-modal-buttons-wrapper'>
              <Button
                type='button'
                styleType={{dark: 'white', light: 'white'}}
                style={{
                  width: '120px',
                }}
                onClick={() => {
                  if (!marketplacePurchaseLoading) {
                    navigate('/my-profile/wallet');
                  }
                }}
              >
                My Wallet
              </Button>
              <Button
                loading={marketplacePurchaseLoading}
                type='button'
                styleType={{dark: 'navy-dark', light: 'navy'}}
                disabled={!userAccepted}
                style={ {width: '120px'} }
                onClick={() => {
                  if (
                    userBalance >
                      (props.post?.premiumArticleSaleInfo
                        ?.price_e8s as number) &&
                    !marketplacePurchaseLoading
                  ) {
                    handleMarketplacePurchase();
                  } else if (!marketplacePurchaseLoading) {
                    //unsufficient funds
                    setModalPage('unsufficient');
                  }
                }}
              >
                Buy now
              </Button>
            </div>
          </div>
        </div>
      );
    case 'unsufficient':
      return (
        <div style={darkOptionsAndColors} className='buy-nft-modal'>
          <div className='buy-nft-modal-content'>
            <img
              className='buy-nft-modal-logo'
              src={images.NUANCE_LOGO_UNSUFFICIENT_BALANCE}
              style={{ filter: darkTheme ? 'contrast(0.5)' : 'none' }}
            />
            <div className='buy-nft-modal-article-info-wrapper'>
              <div
                style={{ color: '#AE0000' }}
                className='buy-nft-modal-article-info-title'
              >
                Sorry, you do not have enough ICP in your wallet!
              </div>
              <div className='buy-nft-modal-article-required-balance-wrapper'>
                <div className='value-wrapper'>
                  <div className='buy-nft-modal-article-info'>Required:</div>
                  <div className='buy-nft-modal-article-info'>
                    {props.post.premiumArticleSaleInfo.priceReadable + ' ICP'}
                  </div>
                </div>
                <div className='value-wrapper'>
                  <div className='buy-nft-modal-article-info'>
                    In your wallet:
                  </div>
                  <div className='buy-nft-modal-article-info'>
                    {(userBalance / Math.pow(10, 8)).toFixed(4) + ' ICP'}
                  </div>
                </div>
              </div>
              <div className='buy-nft-modal-article-info-centered'>
                Please transfer more ICP tokens to your wallet and try again.
                Copy your address to send ICP to your wallet.
              </div>
            </div>
            <div
              onClick={() => {
                if (userWallet) {
                  navigator.clipboard.writeText(userWallet.accountId);
                  toast('Copied to clipboard.', ToastType.Success);
                }
              }}
              style={
                darkTheme
                  ? {
                      borderColor: colors.darkerBorderColor,
                    }
                  : {}
              }
              className='address-value-wrapper'
            >
              <FaRegCopy
                className='copy-icon'
                style={
                  darkTheme
                    ? {
                        color: colors.darkModePrimaryTextColor,
                      }
                    : {}
                }
              />
              <p
                className='address-value'
                style={
                  darkTheme
                    ? {
                        color: colors.darkSecondaryTextColor,
                      }
                    : {}
                }
              >
                {userWallet?.accountId}
              </p>
            </div>
            <div className='buy-nft-modal-buttons-wrapper'>
              <Button
                type='button'
                styleType={{dark: 'white', light: 'white'}}
                style={{
                  width: '120px',
                }}
                onClick={() => {
                  setModalPage('locked');
                }}
              >
                Cancel
              </Button>
              <Button
                loading={marketplacePurchaseLoading}
                type='button'
                styleType={{dark: 'navy-dark', light: 'navy'}}
                style={{ width: '120px' }}
                onClick={async () => {
                  navigate('/my-profile/wallet');
                }}
              >
                My Wallet
              </Button>
            </div>
          </div>
        </div>
      );
    case 'congrats':
      return (
        <div style={darkOptionsAndColors} className='buy-nft-modal'>
          <div className='buy-nft-modal-content'>
            <img
              className='buy-nft-modal-logo'
              src={images.NUANCE_LOGO_NFT}
              style={{ filter: darkTheme ? 'contrast(0.5)' : 'none' }}
            />
            <div className='buy-nft-modal-article-info-wrapper'>
              <div className='buy-nft-modal-article-info-title'>
                Congratulations!
              </div>
              <div
                style={{ alignSelf: 'center' }}
                className='buy-nft-modal-article-info'
              >{`You now have NFT access key #${props.post.premiumArticleSaleInfo.tokenIndex} (out of ${props.post.premiumArticleSaleInfo.totalSupply}) to:`}</div>
              <div
                style={{ alignSelf: 'center' }}
                className='buy-nft-modal-article-info'
              >{`"${props.post?.title}"`}</div>
              <div
                style={{ alignSelf: 'center' }}
                className='buy-nft-modal-article-info'
              >
                by @
                <span className='buy-nft-modal-article-info-bold'>
                  {props.post?.creatorHandle}
                </span>
              </div>
            </div>
            <div className='buy-nft-modal-buttons-wrapper'>
              <Button
                type='button'
                styleType={{dark: 'white', light: 'white'}}
                style={{
                  width: '120px',
                }}
                onClick={() => {
                  if (!marketplacePurchaseLoading) {
                    navigate('/my-profile/wallet');
                  }
                }}
              >
                My Wallet
              </Button>
              <Button
                loading={marketplacePurchaseLoading}
                type='button'
                styleType={{dark: 'navy-dark', light: 'navy'}}
                style={{ width: '120px' }}
                onClick={async () => {
                  await props.refreshPost();
                }}
              >
                Read Article
              </Button>
            </div>
          </div>
        </div>
      );
    case 'sold out':
      return (
        <div style={darkOptionsAndColors} className='buy-nft-modal'>
          <div className='buy-nft-modal-content'>
            <img
              className='buy-nft-modal-logo'
              src={images.NUANCE_LOGO_UNSUFFICIENT_BALANCE}
              style={{ filter: darkTheme ? 'contrast(0.5)' : 'none' }}
            />
            <div className='buy-nft-modal-article-info-wrapper'>
              <div
                style={{ color: '#AE0000' }}
                className='buy-nft-modal-article-info-title'
              >
                Sorry, this article is sold out!
              </div>
              <div
                style={{ alignSelf: 'center' }}
                className='buy-nft-modal-article-info-centered'
              >
                It might be available on the secondary market on toniq{' '}
                <span
                  className='buy-nft-modal-how-it-works'
                  onClick={() => {
                    window.open(
                      'https://toniq.io/marketplace/nuance-' +
                        props.post?.postId,
                      '_blank'
                    );
                  }}
                >
                  here
                </span>
                .
              </div>
            </div>
            <div className='buy-nft-modal-buttons-wrapper'>
              <Button
                type='button'
                styleType={{dark: 'white', light: 'white'}}
                style={{
                  width: '120px',
                }}
                onClick={() => {
                  setModalPage('locked');
                }}
              >
                Cancel
              </Button>
              <Button
                loading={marketplacePurchaseLoading}
                type='button'
                styleType={{dark: 'navy-dark', light: 'navy'}}
                style={{ width: '120px' }}
                onClick={async () => {
                  navigate('/my-profile/wallet');
                }}
              >
                My Wallet
              </Button>
            </div>
          </div>
        </div>
      );
  }
};
