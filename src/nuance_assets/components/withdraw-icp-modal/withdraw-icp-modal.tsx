import React, { useContext, useEffect, useState } from 'react';
import './_withdraw-icp-modal.scss';
import { Context } from '../../Context';
import Button from '../../UI/Button/Button';
import { colors, icons, images } from '../../shared/constants';
import LoggedOutSidebar from '../logged-out-sidebar/logged-out-sidebar';
import { useTheme } from '../../ThemeContext';
import InputField2 from '../../UI/InputField2/InputField2';
import RequiredFieldMessage from '../required-field-message/required-field-message';
import { toast, toastError, ToastType } from '../../services/toastService';
import { usePostStore } from '../../store';
export const WithdrawIcpModal = () => {
  const context = useContext(Context);

  const [receiver, setReceiver] = useState('');
  const [requiredError, setRequiredError] = useState(false);
  const [modalPage, setModalPage] = useState('user-input');
  const [amountOfIcp, setAmountOfIcp] = useState('');
  const [balance, setBalance] = useState<bigint>();
  const [loading, setLoading] = useState(false);

  const icpDecimals = 100000000;

  const clearAllFields = () => {
    setReceiver('');
    setRequiredError(false);
    setModalPage('user-input');
    setAmountOfIcp('');
  };

  const { getMyBalance, transferIcp } = usePostStore((state) => ({
    transferIcp: state.transferIcp,
    getMyBalance: state.getMyBalance,
  }));

  const handleUserBalance = async () => {
    try {
      let balance = await getMyBalance();
      setBalance(balance);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    handleUserBalance();
    if (context.withdrawIcpModal) {
      document.body.style.overflow = 'hidden';
    }
    if (!context.withdrawIcpModal) {
      document.body.style.overflow = 'unset';
    }
  }, [context.withdrawIcpModal]);

  const darkTheme = useTheme();
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
    borderColor: darkTheme ? 'rgb(2, 195, 161)' : '#00113e',
  };

  return (
    <div
      style={
        context.withdrawIcpModal
          ? {
              width: '100%',
              height: '100%',
              top: '0',
              left: '0',
              backdropFilter: 'blur(4px)',
            }
          : {}
      }
      className='withdraw-modal'
    >
      {context.withdrawIcpModal && modalPage === 'user-input' && (
        <div className='withdraw-modal-content' style={darkOptionsAndColors}>
          <p className='withdraw-title' style={darkOptionsAndColors}>
            Withdraw Internet Computer Tokens (ICP)
          </p>
          <p className='withdraw-text' style={darkOptionsAndColors}>
            Please enter the recipient address and amount that you wish to send
            below.
          </p>
          <div className='address-input'>
            <p
              className='address-header'
              style={{
                color: darkOptionsAndColors.color,
              }}
            >
              Receiver:
            </p>
            <div className='input-wrapper'>
              <InputField2
                value={receiver}
                width='100%'
                height='24px'
                defaultText='Address'
                fontSize='16px'
                fontFamily='Georgia'
                fontColor={colors.primaryTextColor}
                onChange={(e) => {
                  setReceiver(e);
                }}
                theme={darkTheme ? 'dark' : 'light'}
                hasError={false}
              ></InputField2>
              <RequiredFieldMessage hasError={requiredError} />
            </div>
          </div>
          <div className='amount-fee-flex'>
            <div className='address-input'>
              <p
                className='address-header'
                style={{
                  color: darkOptionsAndColors.color,
                }}
              >
                Amount of ICP:
              </p>
              <div className='input-wrapper'>
                <InputField2
                  value={amountOfIcp}
                  width='100%'
                  height='24px'
                  defaultText='Amount'
                  fontSize='16px'
                  fontFamily='Georgia'
                  fontColor={colors.primaryTextColor}
                  onChange={(e) => {
                    setAmountOfIcp(e);
                  }}
                  theme={darkTheme ? 'dark' : 'light'}
                  hasError={false}
                ></InputField2>
              </div>
            </div>
            <div className='address-input'>
              <p
                className='address-header'
                style={{
                  color: darkOptionsAndColors.color,
                }}
              >
                Fee:
              </p>
              <div className='input-wrapper'>
                <InputField2
                  value={'0.0001'}
                  width='100%'
                  height='24px'
                  defaultText='Address'
                  fontSize='16px'
                  fontFamily='Georgia'
                  fontColor={colors.primaryTextColor}
                  theme={darkTheme ? 'dark' : 'light'}
                  hasError={false}
                ></InputField2>
              </div>
            </div>
          </div>

          <div className='buttons-flex'>
            <Button
              disabled={false}
              type='button'
              styleType='secondary-NFT'
              style={{ width: '140px', marginLeft: '5px', marginRight: '5px' }}
              onClick={() => {
                clearAllFields();
                context.setWithdrawIcpModal();
              }}
            >
              Cancel
            </Button>{' '}
            <Button
              disabled={false}
              type='button'
              styleType={darkTheme ? 'primary-1-dark' : 'primary-1'}
              style={{ width: '140px', marginLeft: '5px', marginRight: '5px' }}
              onClick={() => {
                console.log(balance);
                if (receiver.length) {
                  setRequiredError(false);
                  var amount = BigInt(0);
                  try {
                    amount = BigInt(parseFloat(amountOfIcp) * icpDecimals);
                  } catch (error) {
                    toastError('Please give a valid amount!');
                    return;
                  }
                  console.log(amount);
                  if (balance && amount + BigInt(10000) <= balance) {
                    setModalPage('review-transaction');
                  } else {
                    toastError('Unsufficient balance!');
                    return;
                  }
                } else {
                  setRequiredError(true);
                }
              }}
            >
              Review
            </Button>{' '}
          </div>
        </div>
      )}
      {context.withdrawIcpModal && modalPage === 'review-transaction' && (
        <div className='withdraw-modal-content' style={darkOptionsAndColors}>
          <p className='withdraw-title' style={darkOptionsAndColors}>
            Withdraw Internet Computer Tokens (ICP)
          </p>
          <img
            className='nuance-logo'
            src={
              loading
                ? darkTheme
                  ? images.loaders.NUANCE_LOADER_DARK
                  : images.loaders.NUANCE_LOADER
                : images.NUANCE_LOGO_UNSUFFICIENT_BALANCE
            }
          />
          <div className='review-transaction-flex'>
            <p className='review-value' style={darkOptionsAndColors}>
              Amount:
            </p>
            <p className='review-value' style={darkOptionsAndColors}>
              {amountOfIcp + ' ICP'}
            </p>
          </div>
          <div className='review-transaction-flex'>
            <p
              className='review-value'
              style={{ ...darkOptionsAndColors, marginRight: '10px' }}
            >
              To:
            </p>
            <p className='review-value' style={darkOptionsAndColors}>
              {receiver.slice(0, 32) + '...'}
            </p>
          </div>
          <div className='buttons-flex'>
            <Button
              disabled={loading}
              type='button'
              styleType='secondary-NFT'
              style={{ width: '140px', marginLeft: '5px', marginRight: '5px' }}
              onClick={() => {
                setModalPage('user-input');
              }}
            >
              Back
            </Button>{' '}
            <Button
              disabled={loading}
              type='button'
              styleType={darkTheme ? 'primary-1-dark' : 'primary-1'}
              style={{ width: '140px', marginLeft: '5px', marginRight: '5px' }}
              onClick={async () => {
                setLoading(true);
                try {
                  let transferReturn = await transferIcp(
                    BigInt(parseFloat(amountOfIcp) * icpDecimals),
                    receiver
                  );
                  if ('Err' in transferReturn) {
                    toastError(transferReturn.Err);
                  } else {
                    toast('Success!', ToastType.Success);
                    clearAllFields();
                    context.setWithdrawIcpModal();
                  }
                } catch (error) {
                  toastError(error);
                }
                setLoading(false);
              }}
            >
              Execute
            </Button>{' '}
          </div>
        </div>
      )}
    </div>
  );
};
