import React, { useContext, useEffect, useState } from 'react';
import { useAuthStore, usePostStore, useUserStore } from '../../store';
import { toast, ToastType } from '../../services/toastService';
import {
  SupportedToken,
  SupportedTokenSymbol,
  colors,
  getDecimalsByTokenSymbol,
  icons,
  images,
} from '../../shared/constants';
import {
  formatDate,
  getNuaEquivalance,
  icpPriceToString,
  toBase256,
  truncateToDecimalPlace,
} from '../../shared/utils';
import { useNavigate } from 'react-router-dom';
import Button from '../../UI/Button/Button';
import {
  ApplaudListItem,
  IcpTransactionListItem,
  PremiumPostActivityListItem,
} from '../../types/types';
import { useTheme } from '../../contextes/ThemeContext';
import { Context } from '../../contextes/Context';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { AccountIdentifier, SubAccount } from '@dfinity/ledger-icp';
import { Principal } from '@dfinity/principal';

const Wallet = () => {
  const [ownedKeys, setOwnedKeys] = useState(0);
  const [soldKeys, setSoldKeys] = useState(0);
  const [displayingActivities, setDisplayingActivities] = useState<
    (PremiumPostActivityListItem | ApplaudListItem | IcpTransactionListItem)[]
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

  const {
    getUserWallet,
    userWallet,
    tokenBalances,
    fetchTokenBalances,
    sonicTokenPairs,
  } = useAuthStore((state) => ({
    getUserWallet: state.getUserWallet,
    userWallet: state.userWallet,
    tokenBalances: state.tokenBalances,
    fetchTokenBalances: state.fetchTokenBalances,
    sonicTokenPairs: state.sonicTokenPairs,
  }));

  const {
    getOwnedNfts,
    getSellingNfts,
    getUserApplauds,
    getUserIcpTransactions,
  } = usePostStore((state) => ({
    getOwnedNfts: state.getOwnedNfts,
    getSellingNfts: state.getSellingNfts,
    getUserApplauds: state.getUserApplauds,
    getUserIcpTransactions: state.getUserIcpTransactions,
  }));

  const { user } = useUserStore((state) => ({
    user: state.user,
  }));

  useEffect(() => {
    fetchTokenBalances();
    populateFields();
    fetchAllActivities();
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
      if ('tokenIndex' in activity) {
        //this activity is an NFT activity
        if (activity.ownedByUser) {
          ownedKeys += 1;
        }
        if (!activity.ownedByUser && activity.writer === user?.handle) {
          soldKeys += 1;
        }
      }
    });
    setOwnedKeys(ownedKeys);
    setSoldKeys(soldKeys);
  };

  const fetchAllActivities = async () => {
    var [sellingActivites, premiumPostsActivities, applauds, transactions] =
      await Promise.all([
        getSellingNfts(),
        getOwnedNfts(),
        getUserApplauds(),
        getUserIcpTransactions(),
      ]);
    if (premiumPostsActivities) {
      setDisplayingActivities(
        [
          ...sellingActivites,
          ...premiumPostsActivities,
          ...applauds,
          ...transactions,
        ].sort((act_1, act_2) => {
          return parseInt(act_2.date) - parseInt(act_1.date);
        })
      );
    } else {
      setDisplayingActivities(
        [...sellingActivites, ...applauds, ...transactions].sort(
          (act_1, act_2) => {
            return parseInt(act_2.date) - parseInt(act_1.date);
          }
        )
      );
    }
  };
  const getStatsElement = () => {
    if (context.width > 768) {
      //desktop
      return (
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
                  key={tokenBalance.token.symbol}
                >
                  <p className='count'>
                    {truncateToDecimalPlace(
                      tokenBalance.balance /
                        Math.pow(10, tokenBalance.token.decimals),
                      4
                    )}
                  </p>
                  <p className='title'>{tokenBalance.token.symbol}</p>
                  {tokenBalance.token.symbol === 'NUA' ? (
                    <p className='title'>(Nuance Token)</p>
                  ) : (
                    <div className='nua-equivalance'>
                      <div className='eq'>=</div>
                      <div className='value'>
                        {(
                          getNuaEquivalance(
                            sonicTokenPairs,
                            tokenBalance.token.symbol,
                            tokenBalance.balance
                          ) / Math.pow(10, getDecimalsByTokenSymbol('NUA'))
                        ).toFixed(0) + ' NUA'}
                      </div>
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
      );
    } else {
      //mobile
      return (
        <div
          className='statictis-mobile-wrapper'
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <div className='statistic'>
            {tokenBalances.slice(0, 2).map((tokenBalance, index) => {
              return (
                <div
                  className='stat'
                  style={{
                    width: '50%',
                    borderRight: index === 0 ? '1px dashed #B2B2B2' : 'none',
                  }}
                  key={tokenBalance.token.symbol}
                >
                  <p className='count'>
                    {truncateToDecimalPlace(
                      tokenBalance.balance /
                        Math.pow(10, tokenBalance.token.decimals),
                      4
                    )}
                  </p>
                  <p className='title'>{tokenBalance.token.symbol}</p>
                  {tokenBalance.token.symbol === 'NUA' ? (
                    <p className='title'>(Nuance Token)</p>
                  ) : (
                    <div className='nua-equivalance'>
                      <div className='eq'>=</div>
                      <div className='value'>
                        {(
                          getNuaEquivalance(
                            sonicTokenPairs,
                            tokenBalance.token.symbol,
                            tokenBalance.balance
                          ) / Math.pow(10, getDecimalsByTokenSymbol('NUA'))
                        ).toFixed(0) + ' NUA'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className='horizontal-dashed-divider' />
          <div className='statistic'>
            {tokenBalances.slice(2).map((tokenBalance) => {
              return (
                <div
                  className='stat'
                  style={{
                    borderRight: '1px dashed #B2B2B2',
                    width: '50%',
                  }}
                  key={tokenBalance.token.symbol}
                >
                  <p className='count'>
                    {truncateToDecimalPlace(
                      tokenBalance.balance /
                        Math.pow(10, tokenBalance.token.decimals),
                      4
                    )}
                  </p>
                  <p className='title'>{tokenBalance.token.symbol}</p>
                  {tokenBalance.token.symbol === 'NUA' ? (
                    <p className='title'>(Nuance Token)</p>
                  ) : (
                    <div className='nua-equivalance'>
                      <div className='eq'>=</div>
                      <div className='value'>
                        {(
                          getNuaEquivalance(
                            sonicTokenPairs,
                            tokenBalance.token.symbol,
                            tokenBalance.balance
                          ) / Math.pow(10, getDecimalsByTokenSymbol('NUA'))
                        ).toFixed(0) + ' NUA'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ width: '50%' }} className='stat'>
              <p className='count'>{ownedKeys}</p>
              <p className='title'>Article Keys</p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className='wrapper'>
      <p className='title'>MY WALLET</p>
      <p className='wallet-text' style={{ color: darkOptionsAndColors.color }}>
        Here you can manage your Nuance wallet. With the amount of tokens you
        can buy NFT keys that give you access to certain Nuance articles or
        applaud authors on their work.
      </p>

      <p className='statistic-text'>CURRENTLY IN YOUR WALLET</p>
      {getStatsElement()}

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
          onClick={() => {
            modalContext?.openModal('WithdrawToken');
          }}
        >
          Withdraw from your wallet
        </Button>
      </div>
      <div className='token-activities'>
        <div className='token-activities-header'>
          <div className='amount'>AMOUNT</div>
          <div className='date'>DATE</div>
          <div className='from'>
            <div className='writer'>FOR/FROM</div>
            <div className='post-title'>ARTICLE</div>
          </div>
          <div className='key'>DESCRIPTION</div>
          <div className='transfer'>TRANSFER</div>
        </div>
        {user && userWallet
          ? displayingActivities?.map((activity, index) => {
              if ('tokenIndex' in activity) {
                //NFT activity
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
                        { formatDate(activity.date) || ' -- '}
                      </div>
                      <div
                        onClick={() => {
                          navigate(activity.url);
                        }}
                        className='from'
                        style={{ color: darkOptionsAndColors.color }}
                      >{`/@${activity.writer}/${activity.title}`}</div>

                      <div
                        className='key key-flex'
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
                        className='transfer-icon transfer'
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
              } else if ('isDeposit' in activity) {
                //check if the deposit/withdrawal is related to any applauding activity
                //if it is, don't display it
                let applauds : ApplaudListItem[] = [];
                for(const a of displayingActivities){
                  if('isSender' in a){
                    applauds.push(a);
                  }
                }
                let notIncludingSenders : string[] = []
                let notIncludingReceivers : string[] = []
                for(const applaud of applauds){
                  if(applaud.isSender){
                    notIncludingReceivers.push(
                      AccountIdentifier.fromPrincipal({
                        principal: Principal.fromText(applaud.bucketCanisterId),
                        subAccount: SubAccount.fromBytes(
                          new Uint8Array(
                            toBase256(parseInt(applaud.postId), 32)
                          )
                        ) as SubAccount,
                      }).toHex()
                    );
                  }
                  else{
                    notIncludingSenders.push(
                      AccountIdentifier.fromPrincipal({
                        principal: Principal.fromText(applaud.bucketCanisterId),
                        subAccount: SubAccount.fromBytes(
                          new Uint8Array(
                            toBase256(parseInt(applaud.postId), 32)
                          )
                        ) as SubAccount,
                      }).toHex()
                    );
                  }
                }
                if(notIncludingReceivers.includes(activity.receiver) || notIncludingSenders.includes(activity.sender)){
                  return;
                }
                return (
                  <div className='token-activity-wrapper' key={index}>
                    <div
                      className='token-activity-flex'
                      style={{
                        display: 'flex',
                        color: darkOptionsAndColors.color,
                      }}
                    >
                      <div className='amount'>
                        {activity.isDeposit
                          ? `+ ${truncateToDecimalPlace(
                              activity.amount /
                                Math.pow(
                                  10,
                                  getDecimalsByTokenSymbol(
                                    activity.currency as SupportedTokenSymbol
                                  )
                                ),
                              activity.currency === 'ckBTC' ? 4 : 2
                            )} ${activity.currency}`
                          : `- ${truncateToDecimalPlace(
                              activity.amount /
                                Math.pow(
                                  10,
                                  getDecimalsByTokenSymbol(
                                    activity.currency as SupportedTokenSymbol
                                  )
                                ),
                              activity.currency === 'ckBTC' ? 4 : 2
                            )} ${activity.currency}`}
                      </div>
                      <div
                        className='date'
                        style={{ color: darkOptionsAndColors.color }}
                      >
                        {activity.date !== ''
                          ? formatDate(
                              (parseInt(activity.date) / 1000000).toString()
                            )
                          : ' --- '}
                      </div>
                      <div
                        onClick={() => {
                          window.open(
                            'https://dashboard.internetcomputer.org/account/' +
                              activity.isDeposit
                              ? activity.sender
                              : activity.receiver,
                            '_blank'
                          );
                        }}
                        className='from'
                        style={{ color: darkOptionsAndColors.color }}
                      >
                        {activity.isDeposit
                          ? activity.sender.slice(0, 12) +
                            '...' +
                            activity.sender.slice(52)
                          : activity.receiver.slice(0, 12) +
                            '...' +
                            activity.receiver.slice(52)}
                      </div>

                      <div
                        className='key key-flex'
                        style={{ alignItems: 'start' }}
                      >
                        {activity.isDeposit ? 'Deposit' : 'Withdrawal'}
                      </div>
                      <div
                        className='transfer-icon transfer'
                        style={{ visibility: 'hidden' }}
                      >
                        <img />
                      </div>
                    </div>
                    <div className='horizontal-divider' />
                  </div>
                );
              } else {
                //tipping activity
                return (
                  <div className='token-activity-wrapper' key={index}>
                    <div
                      className='token-activity-flex'
                      style={{
                        display: 'flex',
                        color: darkOptionsAndColors.color,
                      }}
                    >
                      <div className='amount'>
                        {activity.isSender
                          ? `- ${truncateToDecimalPlace(
                              activity.tokenAmount /
                                Math.pow(
                                  10,
                                  getDecimalsByTokenSymbol(
                                    activity.currency as SupportedTokenSymbol
                                  )
                                ),
                              activity.currency === 'ckBTC' ? 4 : 2
                            )} ${activity.currency}`
                          : `+ ${truncateToDecimalPlace(
                              activity.tokenAmount /
                                Math.pow(
                                  10,
                                  getDecimalsByTokenSymbol(
                                    activity.currency as SupportedTokenSymbol
                                  )
                                ),
                              activity.currency === 'ckBTC' ? 4 : 2
                            )} ${activity.currency}`}
                      </div>
                      <div
                        className='date'
                        style={{ color: darkOptionsAndColors.color }}
                      >
                        {formatDate(activity.date) || ' -- '}
                      </div>
                      <div
                        onClick={() => {
                          navigate(activity.url);
                        }}
                        className='from'
                        style={{ color: darkOptionsAndColors.color }}
                      >{`/@${activity.handle}/${activity.title}`}</div>

                      <div
                        className='key key-flex'
                        style={{ alignItems: 'start' }}
                      >
                        {`${(activity.applauds / Math.pow(10, 8)).toFixed(
                          0
                        )} Applaud`}
                      </div>
                      <div
                        className='transfer-icon transfer'
                        style={{ visibility: 'hidden' }}
                      >
                        <img />
                      </div>
                    </div>
                    <div className='horizontal-divider' />
                  </div>
                );
              }
            })
          : null}
      </div>
    </div>
  );
};

export default Wallet;
