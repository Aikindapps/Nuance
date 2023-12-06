import React, { useContext, useEffect, useState } from 'react';
import './deposit-modal.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { FaRegCopy } from 'react-icons/fa';
import { useTheme } from '../../contextes/ThemeContext';
import { IoCloseOutline } from 'react-icons/io5';
import { useAuthStore } from '../../store';
import Dropdown from '../../UI/dropdown/dropdown';
import QRCode from 'react-qr-code';
import { toast, ToastType } from '../../services/toastService';
import { SupportedTokenSymbol, colors } from '../../shared/constants';
import { truncateToDecimalPlace } from '../../shared/utils';

export const DepositModal = () => {
  const modalContext = useContext(ModalContext);
  const darkTheme = useTheme();

  const { userWallet, tokenBalances } = useAuthStore((state) => ({
    userWallet: state.userWallet,
    tokenBalances: state.tokenBalances,
  }));

  const [selectedCurrency, setSelectedCurrency] = useState(
    tokenBalances[0].token.symbol
  );

  return (
    <div
      className='deposit-modal'
      style={
        darkTheme ? { background: colors.darkModePrimaryBackgroundColor } : {}
      }
    >
      <IoCloseOutline
        onClick={() => {
          modalContext?.closeModal();
        }}
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
        Deposit tokens to this wallet
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
        Please select the right currency to get the address for depositing
        tokens to your wallet.
      </p>
      <div className='owned-tokens-wrapper'>
        <p className='deposit-modal-field-text'>CURRENTLY IN YOUR WALLET</p>
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
      <div className='select-currency-wrapper'>
        <p className='deposit-modal-field-text'>SELECT CURRENCY TO DEPOSIT</p>
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
        />
      </div>
      <div className='qr-copy-wrapper'>
        <p className='deposit-modal-field-text'>SCAN QR OR COPY ADDRESS</p>
        {userWallet && (
          <div className='values-wrapper'>
            <QRCode
              className='qr'
              value={
                selectedCurrency === 'ICP'
                  ? userWallet.accountId
                  : userWallet.principal
              }
            />
            <div
              onClick={() => {
                navigator.clipboard.writeText(
                  selectedCurrency === 'ICP'
                    ? userWallet.accountId
                    : userWallet.principal
                );
                toast('Copied to clipboard.', ToastType.Success);
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
                {selectedCurrency === 'ICP'
                  ? userWallet.accountId
                  : userWallet.principal}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
