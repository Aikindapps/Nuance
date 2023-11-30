import React, { useContext, useEffect, useState } from 'react';
import './_withdraw-modal.scss';
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
import InputField2 from '../../UI/InputField2/InputField2';
import Button from '../../UI/Button/Button';
import { Principal } from '@dfinity/principal';
import RequiredFieldMessage from '../required-field-message/required-field-message';
import { LuLoader2 } from 'react-icons/lu';
import { getNuaEquivalance, getPriceBetweenTokens } from '../../shared/utils';

export const WithdrawModal = () => {
  const modalContext = useContext(ModalContext);
  const darkTheme = useTheme();

  const { userWallet, tokenBalances, fetchTokenBalances, sonicTokenPairs } =
    useAuthStore((state) => ({
      userWallet: state.userWallet,
      tokenBalances: state.tokenBalances,
      fetchTokenBalances: state.fetchTokenBalances,
      sonicTokenPairs: state.sonicTokenPairs,
    }));

  const [selectedCurrency, setSelectedCurrency] = useState(
    tokenBalances[0].token.symbol
  );

  const [inputAddressValue, setInputAddressValue] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (inputAddressValue !== '') {
      if (selectedCurrency === 'ICP') {
        validateAddress(true);
      } else {
        validatePrincipal(true);
      }
    } else {
      setInputAddressErrorMessage('');
    }
  }, [inputAddressValue]);

  const [inputAddressErrorMessage, setInputAddressErrorMessage] = useState('');

  const isHex = (h: string) => {
    var regexp = /^[0-9a-fA-F]+$/;
    return regexp.test(h);
  };
  const validateAddress = (handleErrorMessage: boolean) => {
    if (userWallet?.accountId === inputAddressValue && handleErrorMessage) {
      setInputAddressErrorMessage('You can not use your own address here.');
      return false;
    }
    let validation =
      isHex(inputAddressValue) && inputAddressValue.length === 64;
    if (validation) {
      if (handleErrorMessage) {
        setInputAddressErrorMessage('');
      }
      return true;
    } else {
      if (handleErrorMessage) {
        setInputAddressErrorMessage('Invalid address!');
      }
      return false;
    }
  };
  const validatePrincipal = (handleErrorMessage: boolean) => {
    if (userWallet?.principal === inputAddressValue && handleErrorMessage) {
      setInputAddressErrorMessage(
        'You can not use your own principal id here.'
      );
      return false;
    }
    try {
      let validation =
        inputAddressValue === Principal.fromText(inputAddressValue).toText();
      if (validation) {
        if (handleErrorMessage) {
          setInputAddressErrorMessage('');
        }
        return true;
      } else {
        if (handleErrorMessage) {
          setInputAddressErrorMessage('Invalid principal id!');
        }
        return false;
      }
    } catch (e) {
      if (handleErrorMessage) {
        setInputAddressErrorMessage('Invalid principal id!');
      }
      return false;
    }
  };

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
        activeCurrency.balance &&
      activeCurrency.balance &&
      parseFloat(inputAmount) > 0
    );
  };

  const getMaxAmountToTransfer = () => {
    let activeBalance = getSelectedCurrencyBalance();
    if(activeBalance.balance === 0){
      return 0;
    }
    return activeBalance.balance - activeBalance.token.fee;
  };

  const validateTransfer = (handleErrorMessage: boolean) => {
    let addressValidation =
      selectedCurrency === 'ICP'
        ? validateAddress(handleErrorMessage)
        : validatePrincipal(handleErrorMessage);
    let balanceValidation = validateBalance();
    return termsAccepted && addressValidation && balanceValidation;
  };

  const { transferIcp, transferICRC1Token } = usePostStore((state) => ({
    transferIcp: state.transferIcp,
    transferICRC1Token: state.transferICRC1Token,
  }));
  const [loading, setLoading] = useState(false);
  const executeTransaction = async () => {
    setLoading(true);
    try {
      if (selectedCurrency === 'ICP') {
        let e8s =
          Math.pow(10, getSelectedCurrencyBalance().token.decimals) *
          parseFloat(inputAmount);
        let response = await transferIcp(BigInt(e8s), inputAddressValue);
        if ('Ok' in response) {
          toast('Tokens transferred successfully', ToastType.Success);
          modalContext?.closeModal();
        } else {
          toastError(response.Err);
        }
      } else {
        let activeToken = getSelectedCurrencyBalance();
        let e8s =
          Math.pow(10, activeToken.token.decimals) * parseFloat(inputAmount);
        let response = await transferICRC1Token(
          e8s,
          inputAddressValue,
          activeToken.token.canisterId,
          activeToken.token.fee
        );
        if ('Ok' in response) {
          toast('Tokens transferred successfully', ToastType.Success);
          modalContext?.closeModal();
        } else {
          toastError(response.Err);
        }
      }
    } catch (error) {
      //if the call fails, toast the error
      toastError(error);
    }
    //no matter what happens, refresh the balances and set the loading false
    setLoading(false);
    fetchTokenBalances();
  };

  const getInputAmount = () => {
    if (inputAmount === '') {
      return '0';
    } else {
      return inputAmount;
    }
  };

  return (
    <div
      className='withdraw-modal'
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
        Withdraw from wallet
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
        Please select the right currency and amount that you want to withdraw
        from your wallet.
      </p>
      <div className='owned-tokens-wrapper'>
        <p className='withdraw-modal-field-text'>CURRENTLY IN YOUR WALLET</p>
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
        <div className='select-currency-wrapper'>
          <p className='withdraw-modal-field-text'>SELECT THE CURRENCY</p>
          <Dropdown
            items={tokenBalances.map((tokenBalance) => {
              return tokenBalance.token.symbol;
            })}
            onSelect={(selected: string) => {
              setSelectedCurrency(selected as SupportedTokenSymbol);
              setInputAddressErrorMessage('');
              setInputAddressValue('');
              setInputAmount('');
            }}
            icons={tokenBalances.map((tokenBalance) => {
              return tokenBalance.token.logo;
            })}
            nonActive={loading}
          />
        </div>
        <div className='input-address-wrapper'>
          <p className='withdraw-modal-field-text'>RECEIVER</p>
          <div className='input-wrapper'>
            <InputField2
              width='100%'
              height='28px'
              style={{
                height: '28px',
                marginBottom: '-30px',
                cursor: loading ? 'not-allowed' : '',
              }}
              defaultText={
                selectedCurrency === 'ICP' ? 'Address' : 'Principal ID'
              }
              fontSize='14px'
              fontFamily='Georgia'
              fontColor={colors.primaryTextColor}
              hasError={inputAddressErrorMessage !== ''}
              value={inputAddressValue}
              onChange={(i: string) => {
                if (loading) {
                  return;
                }
                setInputAddressValue(i);
              }}
              theme={darkTheme ? 'dark' : 'light'}
            />
            {inputAddressErrorMessage !== '' && (
              <RequiredFieldMessage
                hasError={inputAddressErrorMessage !== ''}
                errorMessage={inputAddressErrorMessage}
              />
            )}
          </div>
        </div>
        <div className='input-amount-wrapper'>
          <p className='withdraw-modal-field-text'>SELECT YOUR AMOUNT OF</p>
          <div className='amount-input-wrapper'>
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
                      Math.pow(
                        10,
                        getSelectedCurrencyBalance().token.decimals
                      ) <=
                      getMaxAmountToTransfer() &&
                      newValue.match(/^\d*\.?\d{0,4}$/))
                  ) {
                    setInputAmount(newValue);
                  }
                }}
                value={inputAmount}
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
                  setInputAmount(
                    (
                      getMaxAmountToTransfer() /
                      Math.pow(10, getSelectedCurrencyBalance().token.decimals)
                    ).toFixed(4)
                  );
                }}
              >
                MAX
              </div>
            </div>

            <div className='amount-input-conversion-wrapper'>
              <div>=</div>
              <div>
                {(
                  getNuaEquivalance(
                    sonicTokenPairs,
                    selectedCurrency,
                    parseFloat(getInputAmount()) * Math.pow(10, 8)
                  ) / Math.pow(10, 8)
                ).toFixed(2) + ' NUA'}
              </div>
              <div>|</div>
              <div>
                {(
                  getPriceBetweenTokens(
                    sonicTokenPairs,
                    selectedCurrency,
                    'ICP',
                    parseFloat(getInputAmount()) * Math.pow(10, 8)
                  ) / Math.pow(10, 8)
                ).toFixed(2) + ' ICP'}
              </div>
              <div>|</div>
              <div>
                {(
                  getPriceBetweenTokens(
                    sonicTokenPairs,
                    selectedCurrency,
                    'ckBTC',
                    parseFloat(getInputAmount()) * Math.pow(10, 8)
                  ) / Math.pow(10, 8)
                ).toFixed(4) + ' ckBTC'}
              </div>
            </div>
          </div>
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
              !validateTransfer(false)
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
              if (validateTransfer(true)) {
                executeTransaction();
              }
            }}
          >
            {loading && <LuLoader2 className='button-loader-icon' />}
            Withdraw
          </Button>
        </div>
      </div>
    </div>
  );
};
