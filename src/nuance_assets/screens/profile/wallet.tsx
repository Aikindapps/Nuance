import React, { useContext, useEffect, useState } from 'react';
import { useAuthStore, usePostStore, useUserStore } from '../../store';
import { toast, ToastType } from '../../services/toastService';
import { colors, icons, images } from '../../shared/constants';
import { formatDate, icpPriceToString } from '../../shared/utils';
import { AccountIdentifier } from '@dfinity/nns';
import { Principal } from '@dfinity/principal';
import { useNavigate } from 'react-router-dom';
import InputField2 from '../../UI/InputField2/InputField2';
import Button from '../../UI/Button/Button';
import { TransferNftModal } from '../../components/transfer-nft-modal/transfer-nft-modal';
import { PremiumPostActivityListItem } from '../../types/types';
import { useTheme } from '../../ThemeContext';
import { Context } from '../../Context';

const Wallet = () => {
  const [balance, setBalance] = useState<string>('0');
  const [ownedKeys, setOwnedKeys] = useState(0);
  const [soldKeys, setSoldKeys] = useState(0);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferringToken, setTransferringToken] =
    useState<PremiumPostActivityListItem>();
  const [displayingActivities, setDisplayingActivities] = useState<
    PremiumPostActivityListItem[]
  >([]);

  //NFT feature toggle
  const context = useContext(Context);
  const nftFeatureIsLive = context.nftFeature;

  const navigate = useNavigate();
  const darkTheme = useTheme();

  

  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
  };

  const { getUserWallet, userWallet } = useAuthStore((state) => ({
    getUserWallet: state.getUserWallet,
    userWallet: state.userWallet,
  }));

  const { getMyBalance, getOwnedNfts, premiumPostsActivities, getSellingNfts } =
    usePostStore((state) => ({
      getMyBalance: state.getMyBalance,
      getOwnedNfts: state.getOwnedNfts,
      premiumPostsActivities: state.premiumPostsActivities,
      getSellingNfts: state.getSellingNfts,
    }));

  const { user } = useUserStore((state) => ({
    user: state.user,
  }));

  useEffect(() => {
    handleUserBalance();
    populateFields();
    getOwnedNfts();
    handleSellingNfts();
  }, []);

  useEffect(()=>{
    if(!context.withdrawIcpModal){
      handleUserBalance();
    }
  }, [context.withdrawIcpModal])

  useEffect(() => {
    populateFields();
  }, [displayingActivities]);

  const populateFields = () => {
    var soldKeys = 0;
    var ownedKeys = 0;
    displayingActivities.forEach((activity) => {
      if (activity.ownedByUser) {
        ownedKeys += 1;
      }
      if (!activity.ownedByUser && activity.writer === user?.handle) {
        soldKeys += 1;
      }
    });
    setOwnedKeys(ownedKeys);
    setSoldKeys(soldKeys);
  };

  const handleUserBalance = async () => {
    let balance = await getMyBalance();
    if (balance) {
      setBalance(icpPriceToString(balance));
    }
  };

  const handleSellingNfts = async () => {
    var sellingActivites = await getSellingNfts();
    setDisplayingActivities(
      [...sellingActivites, ...premiumPostsActivities].sort((act_1, act_2) => {
        return parseInt(act_2.date) - parseInt(act_1.date);
      })
    );
  };

  if (!nftFeatureIsLive) {
    navigate('/');
    return <div></div>;
  }

  return (
    <div className='wrapper'>
      <p className='title'>MY WALLET</p>
      <p className='wallet-text' style={{ color: darkOptionsAndColors.color }}>
        Here you can manage your Nuance wallet. With the amount of tokens you
        can buy NFT keys that give you access to certain Nuance articles.
      </p>
      <p className='wallet-text' style={{ color: darkOptionsAndColors.color }}>
        Copy the principal id or address to send ICP to your wallet.
      </p>
      <div
        className='statistic'
        style={{ marginBottom: '40px', marginTop: '30px' }}
      >
        <div className='statistic'>
          <div className='stat'>
            <p className='stat-header'>Tokens</p>
            <p className='count'>{balance}</p>
            <p className='title'>ICP</p>
            <img
              className='transfer-icon'
              onClick={() => {
                context.setWithdrawIcpModal();
              }}
              src={icons.TRANSFER_ICON}
              style={{ filter: darkTheme ? 'contrast(0)' : 'none' }}
            ></img>
          </div>
          <div className='stat'>
            <p className='stat-header'>Owned</p>
            <p className='count'>{ownedKeys}</p>
            <p className='title'>NFT KEYS</p>
          </div>
          <div className='stat'>
            <p className='stat-header'>Sold</p>
            <p className='count'>{soldKeys}</p>
            <p className='title'>NFT KEYS</p>
          </div>
        </div>
      </div>
      <div className='address-flex'>
        <div className='address'>
          <div className='address-header'>PRINCIPAL</div>
          <div className='address-container'>
            <img
              className='copy-icon'
              src={icons.COPY_ICON}
              style={{ filter: darkTheme ? 'contrast(.6)' : '' }}
              onClick={() => {
                if (userWallet) {
                  navigator.clipboard.writeText(userWallet?.principal);
                  toast('Copied to clipboard.', ToastType.Success);
                }
              }}
            />
            <div>{userWallet?.principal}</div>
          </div>
        </div>
        <div className='address'>
          <div className='address-header'>ADDRESS</div>
          <div className='address-container'>
            <img
              className='copy-icon'
              src={icons.COPY_ICON}
              style={{ filter: darkTheme ? 'contrast(.6)' : '' }}
              onClick={() => {
                if (userWallet) {
                  navigator.clipboard.writeText(userWallet?.accountId);
                  toast('Copied to clipboard.', ToastType.Success);
                }
              }}
            />
            <div>{userWallet?.accountId}</div>
          </div>
        </div>
      </div>
      <div className='token-activities'>
        <div className='token-activities-header'>
          <div className='amount'>AMOUNT</div>
          <div className='date'>DATE</div>
          <div className='from'>FOR/FROM</div>
          <div className='article'>ARTICLE</div>
          <div className='key'>KEY</div>
          <div className='transfer'>TRANSFER</div>
        </div>
        {user && userWallet
          ? displayingActivities?.map((activity, index) => {
              let saleActivity = activity.activity;
              let available =
                ((parseFloat(activity.totalSupply) -
                  parseFloat(activity.accessKeyIndex)) /
                  parseFloat(activity.totalSupply)) *
                70;
              let sold = 70 - available;
              return (
                <div className='token-activity-wrapper' key={index}>
                  <div
                    className='token-activity-flex'
                    key={activity.tokenIdentifier}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: darkOptionsAndColors.color,
                    }}
                  >
                    <div
                      className={`amount ${
                        saleActivity.includes('-') || saleActivity === 'Sent'
                          ? 'withdraw-icp'
                          : !saleActivity.includes('+')
                          ? 'mint-transfer'
                          : ''
                      }`}
                    >
                      {saleActivity}
                    </div>
                    <div
                      className='date'
                      style={{ color: darkOptionsAndColors.color }}
                    >
                      {formatDate(activity.date) || ' -- '}
                    </div>
                    <div
                      onClick={() => {
                        navigate(`/${activity.writer}`);
                      }}
                      className='writer'
                      style={{ color: darkOptionsAndColors.color }}
                    >{`@${activity.writer}`}</div>
                    <div
                      onClick={() => {
                        navigate(activity.url);
                      }}
                      className='activity-title'
                      style={{ color: darkOptionsAndColors.color }}
                    >
                      {activity.title}
                    </div>
                    <div
                      className='key-flex'
                      style={{ color: darkOptionsAndColors.color }}
                    >
                      <div className='key-counts'>{`#${activity.accessKeyIndex} ( of ${activity.totalSupply})`}</div>
                      <div className='sold-bar'>
                        <div
                          className='sold-percentage-sold'
                          style={{
                            width: `${sold}px`,
                            background: darkTheme
                              ? colors.darkModeSecondaryButtonColor
                              : colors.primaryTextColor,
                          }}
                        />
                        <div
                          className='sold-percentage-remaining'
                          style={{ width: `${available}px` }}
                        />
                      </div>
                    </div>
                    <div
                      className='transfer-icon'
                      style={
                        activity.ownedByUser && saleActivity !== 'Minted'
                          ? { filter: darkTheme ? 'contrast(0)' : 'none' }
                          : { visibility: 'hidden' }
                      }
                    >
                      <img
                        onClick={() => {
                          setTransferringToken(activity);
                          setTransferModalOpen(true);
                        }}
                        src={icons.TRANSFER_ICON}
                      ></img>
                    </div>
                  </div>
                  <div className='horizontal-divider' />
                </div>
              );
            })
          : null}
      </div>
      {transferModalOpen && transferringToken ? (
        <TransferNftModal
          post={transferringToken}
          cancelFunction={() => {
            setTransferModalOpen(false);
          }}
        />
      ) : null}
    </div>
  );
};

export default Wallet;
