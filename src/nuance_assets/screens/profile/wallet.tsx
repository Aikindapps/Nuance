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
import { useTheme } from '../../contextes/ThemeContext';
import { Context } from '../../contextes/Context';
import { Context as ModalContext } from '../../contextes/ModalContext';

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
  const modalContext = useContext(ModalContext);

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

  const { getUserWallet, userWallet, tokenBalances,fetchTokenBalances} = useAuthStore((state) => ({
    getUserWallet: state.getUserWallet,
    userWallet: state.userWallet,
    tokenBalances: state.tokenBalances,
    fetchTokenBalances: state.fetchTokenBalances
    
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
    fetchTokenBalances();
    populateFields();
    getOwnedNfts();
    handleSellingNfts();
  }, []);

  useEffect(() => {
    if (!(modalContext?.modalType === 'WithdrawToken')) {
      fetchTokenBalances();
    }
  }, [modalContext?.modalType]);

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

  const handleSellingNfts = async () => {
    var sellingActivites = await getSellingNfts();
    setDisplayingActivities(
      [...sellingActivites, ...premiumPostsActivities].sort((act_1, act_2) => {
        return parseInt(act_2.date) - parseInt(act_1.date);
      })
    );
  };

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
      <p className='statistic-text'>CURRENTLY IN YOUR WALLET</p>
      <div
        className='statistic'
        style={{ marginBottom: '40px', marginTop: '5px' }}
      >
        <div className='statistic'>
          {tokenBalances.map((tokenBalance) => {
            return (
              <div
                className='stat'
                style={{ borderRight: '1px dashed #B2B2B2' }}
              >
                <p className='count'>
                  {(
                    tokenBalance.balance /
                    Math.pow(10, tokenBalance.token.decimals)
                  ).toFixed(2)}
                </p>
                <p className='title'>{tokenBalance.token.symbol}</p>
                {tokenBalance.token.symbol === 'NUA' ? (
                  <p className='title'>(Nuance Token)</p>
                ) : (
                  <div className='nua-equivalance'>
                    <div className='eq'>=</div>
                    <div className='value'>4 NUA</div>
                  </div>
                )}
              </div>
            );
          })}
          <div className='stat'>
            <p className='count'>{ownedKeys}</p>
            <p className='title'>Article Keys</p>
          </div>
        </div>
      </div>

      <div className='deposit-withdraw-buttons-wrapper'>
        <Button
          styleType='deposit'
          type='button'
          onClick={() => {
            modalContext?.openModal('Deposit');
          }}
        >
          Deposit to your wallet
        </Button>
        <Button
          styleType={darkTheme ? 'withdraw-dark' : 'withdraw'}
          type='button'
          onClick={() => {}}
        >
          Withdraw from your wallet
        </Button>
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
                          modalContext?.openModal('WithdrawNft', {
                            transferNftData: activity,
                          });
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
    </div>
  );
};

export default Wallet;
