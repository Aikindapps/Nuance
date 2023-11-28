import React, { useContext, useEffect, useState } from 'react';
import './_clap-modal.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { FaRegCopy } from 'react-icons/fa';
import { useTheme } from '../../contextes/ThemeContext';
import { IoCloseOutline } from 'react-icons/io5';
import { useAuthStore, usePostStore } from '../../store';
import Dropdown from '../../UI/dropdown/dropdown';
import QRCode from 'react-qr-code';
import { toast, toastError, ToastType } from '../../services/toastService';
import {
  SUPPORTED_TOKENS,
  SupportedTokenSymbol,
  TokenBalance,
  colors,
  images,
} from '../../shared/constants';
import Button from '../../UI/Button/Button';
import { Principal } from '@dfinity/principal';
import { LuLoader2 } from 'react-icons/lu';
import { PostType } from '../../types/types';

export const ClapModal = (props:{post: PostType}) => {
  const modalContext = useContext(ModalContext);
  const darkTheme = useTheme();

  console.log(props)

  const { userWallet, tokenBalances, fetchTokenBalances } = useAuthStore(
    (state) => ({
      userWallet: state.userWallet,
      tokenBalances: state.tokenBalances,
      fetchTokenBalances: state.fetchTokenBalances,
    })
  );

  const [selectedCurrency, setSelectedCurrency] =
    useState<SupportedTokenSymbol>(tokenBalances[0].token.symbol);

  const [inputAmount, setInputAmount] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

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

  const validateBalance = () => {
    let activeCurrency = getSelectedCurrencyBalance();
    return (
      parseFloat(inputAmount) * Math.pow(10, activeCurrency.token.decimals) +
        activeCurrency.token.fee <=
        activeCurrency.balance && parseFloat(inputAmount) > 0
    );
  };

  const getMaxAmountToTransfer = () => {
    let activeBalance = getSelectedCurrencyBalance();
    return activeBalance.balance - activeBalance.token.fee;
  };

  const validateTransfer = () => {
    let balanceValidation = validateBalance();
    return termsAccepted && balanceValidation;
  };

  const {transferICRC1Token } = usePostStore((state) => ({
    transferIcp: state.transferIcp,
    transferICRC1Token: state.transferICRC1Token,
  }));
  const [loading, setLoading] = useState(false);
  const executeTransaction = async () => {
    setLoading(true);
    try {
      let activeToken = getSelectedCurrencyBalance();
      let e8s =
        Math.pow(10, activeToken.token.decimals) * parseFloat(inputAmount);
      let response = await transferICRC1Token(
        e8s,
        'inputAddressValue',
        activeToken.token.canisterId,
        activeToken.token.fee
      );
      if ('Ok' in response) {
        toast('Tokens transferred successfully', ToastType.Success);
        modalContext?.closeModal();
      } else {
        toastError(response.Err);
      }
    } catch (error) {
      //if the call fails, toast the error
      toastError(error);
    }
    //no matter what happens, refresh the balances and set the loading false
    setLoading(false);
    fetchTokenBalances();
  };

  console.log('balances: ', tokenBalances);
  console.log(
    'input: ',
    Math.pow(10, getSelectedCurrencyBalance().token.decimals) *
      parseFloat(inputAmount)
  );
  console.log('inputAmount: ', inputAmount);

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
                  {(
                    tokenBalance.balance /
                    Math.pow(10, tokenBalance.token.decimals)
                  ).toFixed(4)}
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
          <div className='amount-input-wrapper'>
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
              max={getMaxAmountToTransfer()}
              step='0.0001'
              onChange={(e) => {
                if (loading) {
                  return;
                }
                const newValue = e.target.value;
                if (!newValue.match(/^\d*\.?\d{0,4}$/)) return;

                if (
                  newValue === '' ||
                  (parseFloat(newValue) *
                    Math.pow(10, getSelectedCurrencyBalance().token.decimals) <=
                    getMaxAmountToTransfer() &&
                    newValue.match(/^\d*\.?\d{0,4}$/))
                ) {
                  setInputAmount(newValue);
                }
              }}
              value={inputAmount}
            />
            <div className='amount-input-conversion-wrapper'>
              <div>=</div>
              <div>12 NUA</div>
              <div>|</div>
              <div>0.5 ICP</div>
              <div>|</div>
              <div>0.0024 ckBTC</div>
            </div>
          </div>
        </div>
        <div className='select-currency-wrapper'>
          <p className='clap-modal-field-text'>SELECT THE CURRENCY</p>
          <Dropdown
            items={tokenBalances.map((tokenBalance) => {
              return tokenBalance.token.symbol;
            })}
            onSelect={(selected: string) => {
              setSelectedCurrency(selected as SupportedTokenSymbol);
              setInputAmount('');
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
          <input type='checkbox' checked={termsAccepted} onChange={() => {}} />
          <p
            className='terms-text'
            style={darkTheme ? { color: colors.darkModePrimaryTextColor } : {}}
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
              !validateTransfer()
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
              if (validateTransfer()) {
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
};
