import React, { useContext, useEffect, useState } from 'react';
import {
  useAuthStore,
  usePostStore,
  useSubscriptionStore,
  useUserStore,
} from '../../store';
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
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../UI/Button/Button';
import {
  ApplaudListItem,
  ClaimTransactionHistoryItem,
  PremiumPostActivityListItem,
  SubscriptionHistoryItem,
  TransactionListItem,
  UserType,
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
    (
      | PremiumPostActivityListItem
      | ApplaudListItem
      | TransactionListItem
      | ClaimTransactionHistoryItem
      | SubscriptionHistoryItem
    )[]
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
    restrictedTokenBalance,
    fetchTokenBalances,
    sonicTokenPairs,
  } = useAuthStore((state) => ({
    getUserWallet: state.getUserWallet,
    userWallet: state.userWallet,
    tokenBalances: state.tokenBalances,
    restrictedTokenBalance: state.restrictedTokenBalance,
    fetchTokenBalances: state.fetchTokenBalances,
    sonicTokenPairs: state.sonicTokenPairs,
  }));
  const { getMySubscriptionTransactions } = useSubscriptionStore((state) => ({
    getMySubscriptionTransactions: state.getMySubscriptionTransactions,
  }));
  const {
    getOwnedNfts,
    getSellingNfts,
    getUserApplauds,
    getUserIcpTransactions,
    getUserNuaTransactions,
    getUserCkbtcTransactions,
    getUserRestrictedNuaTransactions,
  } = usePostStore((state) => ({
    getOwnedNfts: state.getOwnedNfts,
    getSellingNfts: state.getSellingNfts,
    getUserApplauds: state.getUserApplauds,
    getUserIcpTransactions: state.getUserIcpTransactions,
    getUserNuaTransactions: state.getUserNuaTransactions,
    getUserCkbtcTransactions: state.getUserCkbtcTransactions,
    getUserRestrictedNuaTransactions: state.getUserRestrictedNuaTransactions,
  }));

  const { user } = useUserStore((state) => ({
    user: state.user,
  }));

  useEffect(() => {
    fetchTokenBalances();
    populateFields();
    fetchAllActivities();
  }, [user]);

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
    let userWallet = await getUserWallet();
    var [
      sellingActivites,
      premiumPostsActivities,
      applauds,
      icpTransactions,
      nuaTransactions,
      ckBtcTransactions,
      restrictedNuaTransactions,
      subscriptionTransactions,
    ] = await Promise.all([
      getSellingNfts(userWallet.accountId),
      getOwnedNfts(userWallet.accountId),
      getUserApplauds(),
      getUserIcpTransactions(),
      getUserNuaTransactions(),
      getUserCkbtcTransactions(),
      getUserRestrictedNuaTransactions(),
      getMySubscriptionTransactions(),
    ]);
    setDisplayingActivities(
      [
        ...sellingActivites,
        ...premiumPostsActivities,
        ...applauds,
        ...icpTransactions,
        ...nuaTransactions,
        ...ckBtcTransactions,
        ...restrictedNuaTransactions,
        ...subscriptionTransactions,
      ].sort((act_1, act_2) => {
        return parseInt(act_2.date) - parseInt(act_1.date);
      })
    );
  };
  const userAllowedToClaimByDate = (user: UserType) => {
    if (user.claimInfo.lastClaimDate.length === 0) {
      return true;
    } else {
      let lastClaimDate = user.claimInfo.lastClaimDate[0] / 1000000;
      let now = new Date().getTime();
      const week = 24 * 60 * 60 * 1000 * 7;
      if (now - lastClaimDate > week) {
        return true;
      } else {
        return false;
      }
    }
  };

  const howMuchTimeLeftToClaim = (user: UserType) => {
    if (user.claimInfo.lastClaimDate.length === 0) {
      return '';
    }
    const oneMinute = 60 * 1000;
    const oneHour = 60 * oneMinute;
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;

    let lastClaimDate = user.claimInfo.lastClaimDate[0] / 1000000;
    let now = new Date().getTime();

    const diffInTime = lastClaimDate + oneWeek - now;

    const days = Math.floor(diffInTime / oneDay);
    const hours = Math.floor((diffInTime % oneDay) / oneHour);
    const minutes = Math.floor((diffInTime % oneHour) / oneMinute);

    if (days >= 1) {
      return `${days} days ${hours} hours`;
    } else {
      return `${hours} hours ${minutes} minutes`;
    }
  };

  const getStatsElement = () => {
    return (
      <div
        className='statistic-wrapper'
        style={{ marginBottom: '40px', marginTop: '5px' }}
      >
        <div className='statistic'>
          <div className='stat stat-0'>
            <p className='count-free-nua'>
              {(restrictedTokenBalance / Math.pow(10, 8)).toFixed(0)}
            </p>
            <p className='title'>Free NUA*</p>
            <p className='title'>(Nuance Token)</p>
          </div>
          {tokenBalances.map((tokenBalance, index) => {
            return (
              <div
                className={'stat stat-' + (index + 1)}
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
          <div className='stat stat-4'>
            <p className='count'>{ownedKeys}</p>
            <p className='title'>Article Keys</p>
          </div>
        </div>
      </div>
    );
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
          className={{dark: 'wallet-deposit-button', light: 'wallet-deposit-button'}}
          styleType={{dark: 'white', light: 'white'}}
          type='button'
          onClick={() => {
            modalContext?.openModal('Deposit');
          }}
        >
          Deposit to your wallet
        </Button>
        <Button
          className={{dark: 'wallet-withdraw-button-dark', light: 'wallet-withdraw-button'}}
          styleType={{dark: 'navy-dark', light: 'navy'}}
          type='button'
          onClick={() => {
            modalContext?.openModal('WithdrawToken');
          }}
        >
          Withdraw from your wallet
        </Button>
      </div>
      <div className='request-nua-wrapper'>
        <div className='request-nua-left'>
          <div className='request-nua-title'>FREE NUA TOKENS</div>
          <div
            className='request-nua-content'
            style={darkTheme ? { color: '#FFF' } : {}}
          >
            * Free Nuance Tokens are only meant to be used on Nuance before they
            become refundable. 7 days after your last request, you can request a
            refill of free new NUA up to a total of{' '}
            {(
              (user?.claimInfo.maxClaimableTokens as number) / Math.pow(10, 8)
            ).toFixed(0)}{' '}
            NUA.
          </div>
        </div>
        {user && (
          <div className='request-nua-right'>
            {user.claimInfo.isClaimActive ? (
              user.claimInfo.isUserBlocked ? (
                <div
                  className='request-nua-info'
                  style={darkTheme ? { background: '#ffffff1f' } : {}}
                >
                  You're blocked!
                </div>
              ) : userAllowedToClaimByDate(user) &&
                user.claimInfo.maxClaimableTokens <= restrictedTokenBalance ? (
                <div
                  className='request-nua-info'
                  style={darkTheme ? { background: '#ffffff1f' } : {}}
                >
                  No available free tokens to claim!
                </div>
              ) : userAllowedToClaimByDate(user) ? (
                <Button
                  className={{dark: 'wallet-deposit-button', light: 'wallet-deposit-button'}}
                  styleType={{dark: 'white', light: 'white'}}
                  type='button'
                  style={{ maxWidth: '180px', fontSize: '14px' }}
                  onClick={() => {
                    if (!user.isVerified) {
                      modalContext?.openModal('verify profile');
                    } else {
                      modalContext?.openModal('claim restricted tokens');
                    }
                  }}
                >
                  Request Free NUA
                </Button>
              ) : (
                <div
                  className='request-nua-info'
                  style={darkTheme ? { background: '#ffffff1f' } : {}}
                >
                  {howMuchTimeLeftToClaim(user)} until new request is allowed.
                </div>
              )
            ) : (
              <div
                className='request-nua-info'
                style={darkTheme ? { background: '#ffffff1f' } : {}}
              >
                Claim is not active yet.
              </div>
            )}
          </div>
        )}
      </div>
      <div className='wallet-history-text'>YOUR WALLET HISTORY</div>
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
                        {formatDate(activity.date) || ' -- '}
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
                        />
                      </div>
                    </div>
                    <div className='horizontal-divider' />
                  </div>
                );
              } else if ('isDeposit' in activity) {
                //check if the deposit/withdrawal is related to any applauding activity
                //if it is, don't display it
                let applauds: ApplaudListItem[] = [];
                const nftActivities: PremiumPostActivityListItem[] = [];
                for (const a of displayingActivities) {
                  if ('isSender' in a) {
                    applauds.push(a);
                  }
                  if ('tokenIndex' in a) {
                    nftActivities.push(a);
                  }
                }
                if (modalContext) {
                  for (const fakeApplaud of modalContext.getAllFakeApplauds()) {
                    applauds.push({
                      applauds: 0,
                      date: '',
                      tokenAmount: 0,
                      isSender: true,
                      applaudId: '',
                      currency: '',
                      postId: fakeApplaud.postId,
                      url: '',
                      handle: '',
                      title: '',
                      bucketCanisterId: fakeApplaud.bucketCanisterId,
                    });
                  }
                }
                let notIncludingSenders: string[] = [];
                let notIncludingReceivers: string[] = [];
                for (const applaud of applauds) {
                  if (applaud.isSender) {
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
                    notIncludingReceivers.push(applaud.bucketCanisterId);
                  } else {
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
                    notIncludingSenders.push(applaud.bucketCanisterId);
                  }
                }
                for (const nftActivity of nftActivities) {
                  notIncludingSenders = [
                    ...notIncludingSenders,
                    ...nftActivity.sellerAddresses,
                  ];
                  notIncludingReceivers = [
                    ...notIncludingReceivers,
                    ...nftActivity.sellerAddresses,
                  ];
                }

                if (
                  notIncludingReceivers.includes(activity.receiver) ||
                  notIncludingSenders.includes(activity.sender)
                ) {
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
                      <div
                        className='amount'
                        style={!activity.isDeposit ? { color: '#cc4747' } : {}}
                      >
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
                          ? formatDate(parseInt(activity.date).toString())
                          : ' --- '}
                      </div>
                      <div
                        onClick={() => {
                          if (activity.currency === 'ICP') {
                            window.open(
                              activity.isDeposit
                                ? 'https://dashboard.internetcomputer.org/account/' +
                                    activity.sender
                                : 'https://dashboard.internetcomputer.org/account/' +
                                    activity.receiver,
                              '_blank'
                            );
                          } else {
                            window.open(
                              activity.isDeposit
                                ? 'https://icscan.io/principal/' +
                                    activity.sender
                                : 'https://icscan.io/principal/' +
                                    activity.receiver,
                              '_blank'
                            );
                          }
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
              } else if ('claimedAmount' in activity) {
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
                        {'+ ' +
                          activity.claimedAmount / Math.pow(10, 8) +
                          ' Free NUA'}
                      </div>
                      <div
                        className='date'
                        style={{ color: darkOptionsAndColors.color }}
                      >
                        {activity.date !== ''
                          ? formatDate(parseInt(activity.date).toString())
                          : ' --- '}
                      </div>
                      <a
                        className='from'
                        style={{ color: darkOptionsAndColors.color }}
                        href='https://dashboard.internetcomputer.org/sns/rzbmc-yiaaa-aaaaq-aabsq-cai'
                        target='_blank'
                      >
                        Nuance DAO Faucet Pool
                      </a>

                      <div
                        className='key key-flex'
                        style={{ alignItems: 'start' }}
                      >
                        Free NUA drop
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
              } else if ('subscriptionFee' in activity) {
                return (
                  <div className='token-activity-wrapper' key={index}>
                    <div
                      className='token-activity-flex'
                      style={{
                        display: 'flex',
                        color: darkOptionsAndColors.color,
                      }}
                    >
                      <div
                        className='amount'
                        style={!activity.isWriter ? { color: '#cc4747' } : {}}
                      >
                        {activity.isWriter
                          ? '+ ' +
                            activity.subscriptionFee / Math.pow(10, 8) +
                            ' NUA'
                          : '- ' +
                            activity.subscriptionFee / Math.pow(10, 8) +
                            ' NUA'}
                      </div>
                      <div
                        className='date'
                        style={{ color: darkOptionsAndColors.color }}
                      >
                        {activity.date !== ''
                          ? formatDate(parseInt(activity.date).toString())
                          : ' --- '}
                      </div>
                      <Link
                        className='from'
                        style={{ color: darkOptionsAndColors.color }}
                        to={'/user/' + activity.handle}
                      >
                        @{activity.handle}
                      </Link>

                      <div
                        className='key key-flex'
                        style={{ alignItems: 'start' }}
                      >
                        {activity.isWriter ? 'New subscriber' : 'Subscribed'}
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
                      <div
                        className='amount'
                        style={activity.isSender ? { color: '#cc4747' } : {}}
                      >
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
                        )} Applause`}
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
