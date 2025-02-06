import React, { useState, useEffect } from 'react';
import Toggle from '../../UI/toggle/toggle';
import { WriterSubscriptionDetails } from 'src/declarations/Subscription/Subscription.did';
import { useTheme } from '../../contextes/ThemeContext';
import { Context } from '../../contextes/Context';
import InputField from '../../UI/InputField2/InputField2';
import { colors, getDecimalsByTokenSymbol } from '../../shared/constants';
import RequiredFieldMessage from '../../components/required-field-message/required-field-message';
import { Principal } from '@dfinity/principal';
import {
  getPriceBetweenTokens,
  truncateToDecimalPlace,
} from '../../shared/utils';
import { useAuthStore } from '../../store';
import { useAgent, useIsInitializing } from '@nfid/identitykit/react';
import Loader from '../../UI/loader/Loader';

interface SubscriptionDetailsState extends WriterSubscriptionDetails {
  weeklyFeeEnabled: boolean;
  monthlyFeeEnabled: boolean;
  annuallyFeeEnabled: boolean;
  lifeTimeFeeEnabled: boolean;
}

interface MembershipSubscriptionProps {
  subscriptionDetails: SubscriptionDetailsState;
  setSubscriptionDetails: React.Dispatch<
    React.SetStateAction<SubscriptionDetailsState>
  >;
  updateSubscriptionDetails: () => void;
  isPublication: boolean;
  error?: boolean;
}

const MembershipSubscription: React.FC<MembershipSubscriptionProps> = ({
  subscriptionDetails,
  setSubscriptionDetails,
  updateSubscriptionDetails,
  isPublication,
  error,
}) => {
  const isLocal: boolean =
    window.location.origin.includes('localhost') ||
    window.location.origin.includes('127.0.0.1');

  const darkTheme = useTheme();
  const context = React.useContext(Context);
  const customHost = isLocal ? 'http://localhost:8080' : 'https://icp-api.io';
  const agentIk = useAgent({ host: customHost, retryTimes: 10 });
  const isInitializing = useIsInitializing();
  const [inputAddressErrorMessage, setInputAddressErrorMessage] = useState('');
  const { tokenPrices, isLoggedIn } = useAuthStore((state) => ({
    tokenPrices: state.tokenPrices,
    isLoggedIn: state.isLoggedIn,
  }));

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (isLoggedIn) {
      agentIk ? setLoading(false) : setLoading(true);
    }
  }, [agentIk, isLoggedIn]);

  const handleFeeChange = (
    type: keyof WriterSubscriptionDetails,
    value: number
  ) => {
    if (value >= 0) {
      setSubscriptionDetails((prevOptions) => ({
        ...prevOptions,
        [type]: [value],
      }));
    }
  };

  const handleToggleChange = (type: keyof SubscriptionDetailsState) => {
    setSubscriptionDetails((prevOptions) => ({
      ...prevOptions,
      [type]: !prevOptions[type],
      ...(prevOptions[type] ? { [type.replace('Enabled', '')]: [] } : {}),
    }));
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const feeTypes = [
    'weeklyFee',
    'monthlyFee',
    'annuallyFee',
    'lifeTimeFee',
  ] as const;

  if (loading || isInitializing) {
    return (
      <div className='membership-subscription'>
        <div style={{ width: '150px' }}>
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className='membership-subscription'>
      <p className='mainTitle'>MEMBERSHIP SUBSCRIPTION</p>
      <p>
        Allow readers full access to all your personal articles that are
        published for 'Members' for a periodical fee.
      </p>
      <div className='subscription-settings-options'>
        <div className='subscription-settings-header'>
          <div className='header-toggle'></div>
          <div className='header-period'>PERIOD</div>
          <div className='header-fee'>PERIODICAL FEE (IN NUA)</div>
          <div className='header-conversion'></div>
        </div>
        {feeTypes.map((type) => (
          <div
            key={type}
            className={`subscription-settings-option ${
              subscriptionDetails[`${type}Enabled`] ? 'disabled' : ''
            }`}
          >
            <div className='toggle'>
              <Toggle
                toggled={subscriptionDetails[`${type}Enabled`]}
                callBack={() =>
                  handleToggleChange(
                    `${type}Enabled` as keyof SubscriptionDetailsState
                  )
                }
              />
            </div>
            <div className='period'>
              {capitalizeFirstLetter(type.replace('Fee', ''))}
            </div>
            <div className='fee-controls'>
              <div
                className={
                  darkTheme ? 'value-container dark' : 'value-container'
                }
              >
                <input
                  type='number'
                  value={subscriptionDetails[type]?.[0] ?? ''}
                  placeholder='0 NUA'
                  onChange={(e) =>
                    handleFeeChange(type, parseFloat(e.target.value) || 0)
                  }
                  disabled={!subscriptionDetails[`${type}Enabled`]}
                  className={darkTheme ? 'dark' : ''}
                  min={1}
                />
                <div className='buttons'>
                  <button
                    className='subscription-inc-dec-button'
                    onClick={() =>
                      handleFeeChange(
                        type,
                        Number(subscriptionDetails[type]?.[0] ?? 0) + 1
                      )
                    }
                    disabled={!subscriptionDetails[`${type}Enabled`]}
                  >
                    +
                  </button>
                  <button
                    className='subscription-inc-dec-button'
                    onClick={() =>
                      handleFeeChange(
                        type,
                        Number(subscriptionDetails[type]?.[0] ?? 0) - 1
                      )
                    }
                    disabled={
                      Number(subscriptionDetails[type]?.[0] ?? 0) <= 1 ||
                      !subscriptionDetails[`${type}Enabled`]
                    }
                  >
                    -
                  </button>
                </div>
              </div>
            </div>
            <div className={darkTheme ? 'fees dark' : 'fees'}>
              ={' '}
              {truncateToDecimalPlace(
                getPriceBetweenTokens(
                  tokenPrices,
                  'NUA',
                  'ICP',
                  parseFloat(subscriptionDetails[type]?.[0] ?? '0') *
                    Math.pow(10, getDecimalsByTokenSymbol('NUA'))
                ) / Math.pow(10, getDecimalsByTokenSymbol('NUA')),
                2
              )}{' '}
              ICP |{' '}
              {truncateToDecimalPlace(
                getPriceBetweenTokens(
                  tokenPrices,
                  'NUA',
                  'ckBTC',
                  parseFloat(subscriptionDetails[type]?.[0] ?? '0') *
                    Math.pow(10, getDecimalsByTokenSymbol('NUA'))
                ) / Math.pow(10, getDecimalsByTokenSymbol('NUA')),
                2
              )}{' '}
              ckBTC |{' '}
              {truncateToDecimalPlace(
                getPriceBetweenTokens(
                  tokenPrices,
                  'NUA',
                  'ckUSDC',
                  parseFloat(subscriptionDetails[type]?.[0] ?? '0') *
                    Math.pow(10, getDecimalsByTokenSymbol('NUA'))
                ) / Math.pow(10, getDecimalsByTokenSymbol('NUA')),
                2
              )}{' '}
              USD
            </div>
          </div>
        ))}
        {isPublication &&
          (subscriptionDetails.lifeTimeFeeEnabled ||
            subscriptionDetails.annuallyFeeEnabled ||
            subscriptionDetails.monthlyFeeEnabled ||
            subscriptionDetails.weeklyFeeEnabled) && (
            <div className='subscription-payment-address'>
              <p
                className={
                  context.width < 768 ? 'mainTitle mobile-title' : 'mainTitle'
                }
              >
                PAYMENT ADDRESS
              </p>
              <InputField
                classname='input-attributes-3'
                defaultText='Principal Id to receive payments'
                width='100%'
                height='50px'
                fontSize={'14px'}
                fontFamily='Roboto'
                fontColor={colors.editProfileInputTextColor}
                hasError={false}
                onChange={(e) =>
                  setSubscriptionDetails((prevOptions) => ({
                    ...prevOptions,
                    paymentReceiverPrincipalId: e,
                  }))
                }
                value={
                  subscriptionDetails.isSubscriptionActive
                    ? subscriptionDetails.paymentReceiverPrincipalId
                    : undefined
                }
                maxLength={161}
                theme={darkTheme ? 'dark' : 'light'}
                icon={undefined}
                button={undefined}
              />
              {error && (
                <RequiredFieldMessage
                  hasError={error}
                  errorMessage={'Invalid Principal Id!'}
                />
              )}
            </div>
          )}
      </div>
    </div>
  );
};

export default MembershipSubscription;
