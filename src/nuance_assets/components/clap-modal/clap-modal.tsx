import React, { useContext, useEffect, useState } from 'react';
import './_clap-modal.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { useTheme } from '../../contextes/ThemeContext';
import { IoCloseOutline } from 'react-icons/io5';
import { useAuthStore, usePostStore, useUserStore } from '../../store';
import Dropdown from '../../UI/dropdown/dropdown';
import {
  SUPPORTED_TOKENS,
  SupportedTokenSymbol,
  TokenBalance,
  colors,
  getDecimalsByTokenSymbol,
  icons,
  images,
} from '../../shared/constants';
import Button from '../../UI/Button/Button';
import { LuLoader2 } from 'react-icons/lu';
import { PostType } from '../../types/types';
import {
  getNuaEquivalance,
  getPriceBetweenTokens,
  toBase256,
  truncateToDecimalPlace,
} from '../../shared/utils';
import RequiredFieldMessage from '../required-field-message/required-field-message';

export const ClapModal = (props: { post: PostType }) => {
  const modalContext = useContext(ModalContext);
  const darkTheme = useTheme();
  const {
    userWallet,
    tokenBalances,
    fetchTokenBalances,
    sonicTokenPairs,
    restrictedTokenBalance,
  } = useAuthStore((state) => ({
    userWallet: state.userWallet,
    tokenBalances: state.tokenBalances,
    fetchTokenBalances: state.fetchTokenBalances,
    sonicTokenPairs: state.sonicTokenPairs,
    restrictedTokenBalance: state.restrictedTokenBalance,
  }));
  const { spendRestrictedTokensForTipping } = useUserStore((state) => ({
    spendRestrictedTokensForTipping: state.spendRestrictedTokensForTipping,
  }));

  const [selectedCurrency, setSelectedCurrency] =
    useState<SupportedTokenSymbol>(tokenBalances[0].token.symbol);

  const [inputAmount, setInputAmount] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  //page 0 -> input page
  //page 1 -> congratulations page
  const [page, setPage] = useState(0);

  const getSelectedCurrencyBalance = () => {
    var selectedCurrencyAndBalance: TokenBalance = {
      balance: 0,
      token: SUPPORTED_TOKENS[0],
    };
    tokenBalances.forEach((tokenBalance) => {
      if (tokenBalance.token.symbol === selectedCurrency) {
        if (selectedCurrency === 'NUA') {
          selectedCurrencyAndBalance = {
            balance: tokenBalance.balance + restrictedTokenBalance,
            token: tokenBalance.token,
          };
        } else {
          selectedCurrencyAndBalance = tokenBalance;
        }
      }
    });
    return selectedCurrencyAndBalance;
  };

  const getConversionPrice = (tokenSymbol: SupportedTokenSymbol) => {
    const pricePerUnit =
      getPriceBetweenTokens(
        sonicTokenPairs,
        'NUA',
        tokenSymbol,
        inputAmount * Math.pow(10, getDecimalsByTokenSymbol('NUA'))
      ) / Math.pow(10, getDecimalsByTokenSymbol(tokenSymbol));

    const formattedPrice =
      truncateToDecimalPlace(pricePerUnit, 4) + ` ${tokenSymbol}`;

    return formattedPrice;
  };

  const getMaxAmountToApplaud = () => {
    let activeBalance = getSelectedCurrencyBalance();
    let availableBalance = activeBalance.balance - activeBalance.token.fee;
    let nuaEquivalance = getNuaEquivalance(
      sonicTokenPairs,
      activeBalance.token.symbol,
      availableBalance
    );
    let maxAmountOfApplauds = Math.floor(
      nuaEquivalance / Math.pow(10, getDecimalsByTokenSymbol('NUA'))
    );
    if (maxAmountOfApplauds === -1) {
      return 0;
    }
    return maxAmountOfApplauds >= 10000 ? 10000 : maxAmountOfApplauds;
  };

  const validateApplaud = () => {
    return (
      inputAmount > 0 &&
      inputAmount <= 10000 &&
      inputAmount <= getMaxAmountToApplaud() &&
      termsAccepted
    );
  };

  const { transferICRC1Token, checkTippingByTokenSymbol } = usePostStore(
    (state) => ({
      transferIcp: state.transferIcp,
      transferICRC1Token: state.transferICRC1Token,
      checkTippingByTokenSymbol: state.checkTippingByTokenSymbol,
    })
  );
  const [loading, setLoading] = useState(false);
  const executeTransaction = async () => {
    setLoading(true);
    let activeCurrencyAndBalance = getSelectedCurrencyBalance();
    let tokensToSend = Math.floor(
      getPriceBetweenTokens(
        sonicTokenPairs,
        'NUA',
        activeCurrencyAndBalance.token.symbol,
        inputAmount * Math.pow(10, getDecimalsByTokenSymbol('NUA'))
      )
    );
    try {
      //if NUA transaction, check if there's any existing restricted nua
      //if there's any, use the restricted first
      let isTransferSuccessful = false;
      let error = '';
      if (activeCurrencyAndBalance.token.symbol === 'NUA') {
        //applauds in NUA
        let availableRestrictedNuaBalance =
          restrictedTokenBalance - Math.pow(10, 5);
        if (availableRestrictedNuaBalance > 0) {
          //there're some restricted NUA which can be used in applaud
          if (tokensToSend <= availableRestrictedNuaBalance) {
            //restricted balance is sufficient for the applaud
            //use it
            let transfer_response = await spendRestrictedTokensForTipping(
              props.post.postId,
              props.post.bucketCanisterId,
              tokensToSend
            );
            if (transfer_response) {
              //transfer is successful
              isTransferSuccessful = true;
            }
          } else {
            //the worst scenario
            //use both restricted and regular NUA
            let [restrictedResponse, regularResponse] = await Promise.all([
              spendRestrictedTokensForTipping(
                props.post.postId,
                props.post.bucketCanisterId,
                availableRestrictedNuaBalance
              ),
              transferICRC1Token(
                tokensToSend - availableRestrictedNuaBalance,
                props.post.bucketCanisterId,
                activeCurrencyAndBalance.token.canisterId,
                activeCurrencyAndBalance.token.fee,
                parseInt(props.post.postId)
              ),
            ]);
            if ('Ok' in regularResponse || restrictedResponse) {
              isTransferSuccessful = true;
            }
          }
        } else {
          //there is no available nua to use in applaud
          //simply transfer the tokens
          let transfer_response = await transferICRC1Token(
            tokensToSend,
            props.post.bucketCanisterId,
            activeCurrencyAndBalance.token.canisterId,
            activeCurrencyAndBalance.token.fee,
            parseInt(props.post.postId)
          );
          if ('Ok' in transfer_response) {
            //transfer is successful
            isTransferSuccessful = true;
          } else {
            error = transfer_response.Err.toString();
          }
        }
      } else {
        //not NUA token, simply send the tokens to the receiver account
        let transfer_response = await transferICRC1Token(
          tokensToSend,
          props.post.bucketCanisterId,
          activeCurrencyAndBalance.token.canisterId,
          activeCurrencyAndBalance.token.fee,
          parseInt(props.post.postId)
        );
        if ('Ok' in transfer_response) {
          //transfer is successful
          isTransferSuccessful = true;
        } else {
          error = transfer_response.Err.toString();
        }
      }
      if (isTransferSuccessful) {
        //just close the modal for now
        setPage(2);
      } else {
        console.log(error);
      }
      //fire and forget
      checkTippingByTokenSymbol(
        props.post.postId,
        selectedCurrency,
        props.post.bucketCanisterId
      );
    } catch (error) {
      console.log(error);
    }
    //refresh the balances for any case
    fetchTokenBalances();
    setLoading(false);
  };

  const getAmountWithCurrency = () => {
    let activeCurrencyAndBalance = getSelectedCurrencyBalance();
    let tokensToSend = Math.floor(
      getPriceBetweenTokens(
        sonicTokenPairs,
        'NUA',
        activeCurrencyAndBalance.token.symbol,
        inputAmount * Math.pow(10, getDecimalsByTokenSymbol('NUA'))
      )
    );
    if (activeCurrencyAndBalance.token.symbol === 'NUA') {
      return (
        (
          tokensToSend / Math.pow(10, activeCurrencyAndBalance.token.decimals)
        ).toFixed(0) +
        ' ' +
        activeCurrencyAndBalance.token.symbol
      );
    } else {
      return (
        (
          tokensToSend / Math.pow(10, activeCurrencyAndBalance.token.decimals)
        ).toFixed(4) +
        ' ' +
        activeCurrencyAndBalance.token.symbol
      );
    }
  };

  const getTokensToSend = () => {
    let activeCurrencyAndBalance = getSelectedCurrencyBalance();
    let tokensToSend = Math.floor(
      getPriceBetweenTokens(
        sonicTokenPairs,
        'NUA',
        activeCurrencyAndBalance.token.symbol,
        inputAmount * Math.pow(10, getDecimalsByTokenSymbol('NUA'))
      )
    );
    return tokensToSend;
  };

  const getPaymentState = () => {
    let activeCurrencyAndBalance = getSelectedCurrencyBalance();
    let tokensToSend = Math.floor(
      getPriceBetweenTokens(
        sonicTokenPairs,
        'NUA',
        activeCurrencyAndBalance.token.symbol,
        inputAmount * Math.pow(10, getDecimalsByTokenSymbol('NUA'))
      )
    );
    if (activeCurrencyAndBalance.token.symbol === 'NUA') {
      //applauds in NUA
      let availableRestrictedNuaBalance =
        restrictedTokenBalance - Math.pow(10, 5);
      if (availableRestrictedNuaBalance > 0) {
        //there're some restricted NUA which can be used in applaud
        if (tokensToSend <= availableRestrictedNuaBalance) {
          return 'only restricted';
        } else {
          return 'both';
        }
      } else {
        return 'regular';
      }
    } else {
      return 'regular';
    }
  };

  if (page === 0) {
    return (
      <div
        className='clap-modal'
        style={
          darkTheme ? { background: colors.darkModePrimaryBackgroundColor } : {}
        }
      >
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
          Start applauding!
        </p>
        <p
          style={
            darkTheme
              ? {
                  color: colors.darkSecondaryTextColor,
                }
              : {}
          }
          className='information-text'
        >
          By applauding this article, you are tipping the writer with a fragment
          of your wallet. One clap is the equivalent of one Nuance Tokens (NUA).
          <br />
          <span
            onClick={() => {
              window.open(
                'https://wiki.nuance.xyz/nuance/how-to-tip-applaud-a-writer',
                '_blank'
              );
            }}
            className='read-more'
          >
            Read More
          </span>
        </p>
        <div className='owned-tokens-wrapper'>
          <p className='clap-modal-field-text'>CURRENTLY IN YOUR WALLET</p>
          <div className='statistic'>
            <div className='stat'>
              <p className='count-free-nua'>
                {(restrictedTokenBalance / Math.pow(10, 8)).toFixed(0)}
              </p>
              <p className='title'>Free NUA</p>
            </div>
            {tokenBalances.map((tokenBalance, index) => {
              return (
                <div
                  className='stat'
                  key={index}
                  style={
                    index < tokenBalances.length - 1
                      ? { borderRight: '1px dashed #B2B2B2' }
                      : {}
                  }
                >
                  <p className='count'>
                    {truncateToDecimalPlace(
                      tokenBalance.balance /
                        Math.pow(10, tokenBalance.token.decimals),
                      4
                    )}
                  </p>
                  <p className='title'>{tokenBalance.token.symbol}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className='selection-input-wrapper'>
          <div className='input-amount-wrapper'>
            <p className='clap-modal-field-text'>YOUR APPLAUD AMOUNT</p>
            <div
              style={
                inputAmount > getMaxAmountToApplaud() && inputAmount !== 0
                  ? {
                      marginBottom: '-12px',
                    }
                  : {}
              }
              className='amount-input-wrapper'
            >
              <div className='input-max-wrapper'>
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
                  max={10000}
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
                <div
                  className='withdraw-modal-max-button'
                  style={
                    darkTheme
                      ? {
                          color: colors.darkModePrimaryTextColor,
                        }
                      : {}
                  }
                  onClick={() => {
                    setInputAmount(getMaxAmountToApplaud());
                  }}
                >
                  MAX
                </div>
              </div>
              <div className='amount-input-conversion-wrapper'>
                <div>=</div>
                <div>{getConversionPrice('NUA')}</div>
                <div>|</div>
                <div>{getConversionPrice('ICP')}</div>
                <div>|</div>
                <div>{getConversionPrice('ckBTC')}</div>
              </div>
            </div>
            {inputAmount > getMaxAmountToApplaud() && inputAmount !== 0 && (
              <RequiredFieldMessage
                hasError={true}
                errorMessage='Not enough currency in your wallet'
              />
            )}
          </div>
          <div className='select-currency-wrapper'>
            <p className='clap-modal-field-text'>SELECT THE CURRENCY</p>
            <Dropdown
              uniqueId={'clap-modal-dropdown-menu'}
              items={tokenBalances.map((tokenBalance) => {
                if (tokenBalance.token.symbol === 'NUA') {
                  return 'NUA (Free NUA first)';
                } else {
                  return tokenBalance.token.symbol;
                }
              })}
              onSelect={(selected: string) => {
                if (selected.startsWith('NUA')) {
                  setSelectedCurrency('NUA');
                } else {
                  setSelectedCurrency(selected as SupportedTokenSymbol);
                }
              }}
              icons={tokenBalances.map((tokenBalance) => {
                return tokenBalance.token.logo;
              })}
              nonActive={loading}
            />
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
            <input
              type='checkbox'
              checked={termsAccepted}
              onChange={() => {}}
            />
            <p
              className='terms-text'
              style={
                darkTheme ? { color: colors.darkModePrimaryTextColor } : {}
              }
            >
              I am aware of the general policy and agree to transfer amount of
              tokens.
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
                !validateApplaud()
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
                if (validateApplaud()) {
                  setPage(1);
                  //executeTransaction();
                }
              }}
            >
              {loading && <LuLoader2 className='button-loader-icon' />}
              Applaud
            </Button>
          </div>
        </div>
      </div>
    );
  } else if (page === 1) {
    return (
      <div
        className='clap-modal'
        style={
          darkTheme ? { background: colors.darkModePrimaryBackgroundColor } : {}
        }
      >
        <IoCloseOutline
          onClick={() => {
            if (loading) {
              return;
            }
            modalContext?.closeModal();
            modalContext?.createFakeApplaud(
              props.post.postId,
              parseInt(props.post.claps),
              inputAmount,
              props.post.bucketCanisterId
            );
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
          Confirmation
        </p>
        <p
          style={
            darkTheme
              ? {
                  color: colors.darkSecondaryTextColor,
                }
              : {}
          }
          className='information-text'
        >
          Almost there...
          <br />
          <br />
          You chose to applaud{' '}
          <span style={{ fontWeight: 'bolder' }}>
            {getAmountWithCurrency()}
          </span>
          <br />
          <br />
        </p>

        {selectedCurrency === 'NUA' ? (
          <div
            className='owned-tokens-wrapper'
            style={{ alignItems: 'center', rowGap: '0' }}
          >
            <p className='clap-modal-field-text'>CURRENTLY IN YOUR WALLET</p>
            <div className='statistic' style={{ justifyContent: 'center' }}>
              <div className='stat'>
                <p className='count-free-nua'>
                  {(restrictedTokenBalance / Math.pow(10, 8)).toFixed(0)}
                </p>
                <p className='title'>Free NUA</p>
              </div>
              {tokenBalances.map((tokenBalance, index) => {
                if (tokenBalance.token.symbol === selectedCurrency) {
                  return (
                    <div className='stat' key={index}>
                      <p className='count'>
                        {truncateToDecimalPlace(
                          tokenBalance.balance /
                            Math.pow(10, tokenBalance.token.decimals),
                          4
                        )}
                      </p>
                      <p className='title'>{tokenBalance.token.symbol}</p>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        ) : (
          <div
            className='owned-tokens-wrapper'
            style={{ alignItems: 'center' }}
          >
            <p className='clap-modal-field-text'>CURRENTLY IN YOUR WALLET</p>
            <div className='statistic'>
              {tokenBalances.map((tokenBalance, index) => {
                if (tokenBalance.token.symbol === selectedCurrency) {
                  return (
                    <div className='stat' key={index}>
                      <p className='count'>
                        {truncateToDecimalPlace(
                          tokenBalance.balance /
                            Math.pow(10, tokenBalance.token.decimals),
                          4
                        )}
                      </p>
                      <p className='title'>{tokenBalance.token.symbol}</p>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        )}
        {getPaymentState() === 'regular' ? (
          <p
            style={
              darkTheme
                ? {
                    color: colors.darkSecondaryTextColor,
                  }
                : {}
            }
            className='information-text'
          >
            For this transaction,{' '}
            <span style={{ fontWeight: 'bolder' }}>
              {getAmountWithCurrency()}
            </span>{' '}
            will be transferred from your wallet.
            <br />
            <br />
            Are you sure?
          </p>
        ) : getPaymentState() === 'only restricted' ? (
          <p
            style={
              darkTheme
                ? {
                    color: colors.darkSecondaryTextColor,
                  }
                : {}
            }
            className='information-text'
          >
            For this transaction,{' '}
            <span style={{ fontWeight: 'bolder' }}>
              {(getTokensToSend() / Math.pow(10, 8)).toFixed(4)} Free NUA
            </span>{' '}
            will be transferred from your wallet.
            <br />
            <br />
            Are you sure?
          </p>
        ) : (
          <p
            style={
              darkTheme
                ? {
                    color: colors.darkSecondaryTextColor,
                  }
                : {}
            }
            className='information-text'
          >
            Since you have currently{' '}
            <span style={{ fontWeight: 'bolder' }}>
              {(restrictedTokenBalance / Math.pow(10, 8)).toFixed(4)} Free NUA
            </span>{' '}
            left, the remaining{' '}
            <span style={{ fontWeight: 'bolder' }}>
              {(
                (getTokensToSend() - restrictedTokenBalance) /
                Math.pow(10, 8)
              ).toFixed(4)}{' '}
              NUA
            </span>{' '}
            will be paid with your regular NUA amount.
            <br />
            <br />
            Is that OK?
          </p>
        )}

        <div className='buttons-wrapper'>
          <Button
            styleType='deposit'
            type='button'
            onClick={() => {
              if (loading) {
                return;
              }
              setPage(0);
            }}
            style={
              loading
                ? { cursor: 'not-allowed', textWrap: 'nowrap' }
                : { textWrap: 'nowrap' }
            }
          >
            Go back to amount
          </Button>
          <Button
            styleType={darkTheme ? 'withdraw-dark' : 'withdraw'}
            type='button'
            style={
              loading
                ? {
                    cursor: 'not-allowed',
                    background: 'gray',
                    borderColor: 'gray',
                    textWrap: 'nowrap',
                  }
                : { textWrap: 'nowrap' }
            }
            onClick={() => {
              if (loading) {
                return;
              }
              if (validateApplaud()) {
                executeTransaction();
              }
            }}
          >
            Yes, applaud
            {loading && <LuLoader2 className='button-loader-icon' />}
          </Button>
        </div>
      </div>
    );
  } else {
    return (
      <div
        className='clap-modal'
        style={
          darkTheme ? { background: colors.darkModePrimaryBackgroundColor } : {}
        }
      >
        <IoCloseOutline
          onClick={() => {
            if (loading) {
              return;
            }
            modalContext?.closeModal();
            modalContext?.createFakeApplaud(
              props.post.postId,
              parseInt(props.post.claps),
              inputAmount,
              props.post.bucketCanisterId
            );
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
          Thank you!
        </p>
        <p
          style={
            darkTheme
              ? {
                  color: colors.darkSecondaryTextColor,
                }
              : {}
          }
          className='information-text'
        >
          {`We have transferred the equivalent of ${inputAmount} applaud from your wallet.`}
        </p>
        <img className='congratulations-image' src={icons.CLAP_ICON} />
        <div className='buttons-wrapper'>
          <Button
            styleType='deposit'
            type='button'
            onClick={() => {
              modalContext?.closeModal();
              modalContext?.createFakeApplaud(
                props.post.postId,
                parseInt(props.post.claps),
                inputAmount,
                props.post.bucketCanisterId
              );
            }}
          >
            Close
          </Button>
          <Button
            styleType={darkTheme ? 'withdraw-dark' : 'withdraw'}
            type='button'
            onClick={() => {
              window.location.href = '/my-profile/wallet';
            }}
          >
            Go to wallet
          </Button>
        </div>
      </div>
    );
  }
};
