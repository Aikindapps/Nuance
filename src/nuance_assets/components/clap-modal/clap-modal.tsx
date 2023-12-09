import React, { useContext, useEffect, useState } from 'react';
import './_clap-modal.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { useTheme } from '../../contextes/ThemeContext';
import { IoCloseOutline } from 'react-icons/io5';
import { useAuthStore, usePostStore } from '../../store';
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
import { getNuaEquivalance, getPriceBetweenTokens, toBase256, truncateToDecimalPlace } from '../../shared/utils';
import RequiredFieldMessage from '../required-field-message/required-field-message';

export const ClapModal = (props: { post: PostType }) => {
  const modalContext = useContext(ModalContext);
  const darkTheme = useTheme();
  const { userWallet, tokenBalances, fetchTokenBalances, sonicTokenPairs } =
    useAuthStore((state) => ({
      userWallet: state.userWallet,
      tokenBalances: state.tokenBalances,
      fetchTokenBalances: state.fetchTokenBalances,
      sonicTokenPairs: state.sonicTokenPairs,
    }));

  const [selectedCurrency, setSelectedCurrency] =
    useState<SupportedTokenSymbol>(tokenBalances[0].token.symbol);

  const [inputAmount, setInputAmount] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  //page 0 -> input page
  //page 1 -> congratulations page
  const [page, setPage] = useState(0)

  const getSelectedCurrencyBalance = () => {
    var selectedCurrencyAndBalance: TokenBalance = {
      balance: 0,
      token: SUPPORTED_TOKENS[0],
    };
    tokenBalances.forEach((tokenBalance) => {
      if (tokenBalance.token.symbol === selectedCurrency) {
        selectedCurrencyAndBalance = tokenBalance;
      }
    });
    return selectedCurrencyAndBalance;
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
    if(maxAmountOfApplauds === -1){
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

  const { transferICRC1Token, checkTippingByTokenSymbol } = usePostStore((state) => ({
    transferIcp: state.transferIcp,
    transferICRC1Token: state.transferICRC1Token,
    checkTippingByTokenSymbol: state.checkTippingByTokenSymbol
  }));
  const [loading, setLoading] = useState(false);

  const executeTransaction = async () => {
    setLoading(true)
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
      let transfer_response = await transferICRC1Token(
        tokensToSend,
        props.post.bucketCanisterId,
        activeCurrencyAndBalance.token.canisterId,
        activeCurrencyAndBalance.token.fee,
        parseInt(props.post.postId)
      );
      if ('Ok' in transfer_response) {
        //just close the modal for now
        setPage(1);
      }
      else{
        console.log(transfer_response.Err);
      }
      //fire and forget
      checkTippingByTokenSymbol(
        props.post.postId,
        selectedCurrency,
        props.post.bucketCanisterId
      );
    } catch (error) {
      console.log(error)
    }
    //refresh the balances for any case
    fetchTokenBalances();
    setLoading(false);
  };
  if(page === 0){
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
          <span className='read-more'>Read More</span>
        </p>
        <div className='owned-tokens-wrapper'>
          <p className='clap-modal-field-text'>CURRENTLY IN YOUR WALLET</p>
          <div className='statistic'>
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
                <div>
                  {truncateToDecimalPlace(
                    getPriceBetweenTokens(
                      sonicTokenPairs,
                      'NUA',
                      'NUA',
                      inputAmount *
                        Math.pow(10, getDecimalsByTokenSymbol('NUA'))
                    ) / Math.pow(10, getDecimalsByTokenSymbol('NUA')),
                    4
                  ) + ' NUA'}
                </div>
                <div>|</div>
                <div>
                  {truncateToDecimalPlace(
                    getPriceBetweenTokens(
                      sonicTokenPairs,
                      'NUA',
                      'ICP',
                      inputAmount *
                        Math.pow(10, getDecimalsByTokenSymbol('NUA'))
                    ) / Math.pow(10, getDecimalsByTokenSymbol('ICP')),
                    4
                  ) + ' ICP'}
                </div>
                <div>|</div>
                <div>
                  {truncateToDecimalPlace(
                    getPriceBetweenTokens(
                      sonicTokenPairs,
                      'NUA',
                      'ckBTC',
                      inputAmount *
                        Math.pow(10, getDecimalsByTokenSymbol('NUA'))
                    ) / Math.pow(10, getDecimalsByTokenSymbol('ckBTC')),
                    4
                  ) + ' ckBTC'}
                </div>
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
              items={tokenBalances.map((tokenBalance) => {
                return tokenBalance.token.symbol;
              })}
              onSelect={(selected: string) => {
                setSelectedCurrency(selected as SupportedTokenSymbol);
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
                  executeTransaction();
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
  }
  else{
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
              inputAmount
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
                inputAmount
              );
            }}
          >
            Close
          </Button>
          <Button
            styleType={darkTheme ? 'withdraw-dark' : 'withdraw'}
            type='button'
            onClick={() => {
              window.location.href = '/my-profile/wallet'
            }}
          >
            Go to wallet
          </Button>
        </div>
      </div>
    );
  }
  
};
