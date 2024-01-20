import React, { useState, useEffect, useRef } from 'react';
import { colors, images, icons } from '../../shared/constants';
import InputField2 from '../../UI/InputField2/InputField2';
import RequiredFieldMessage from '../../components/required-field-message/required-field-message';
import { useUserStore } from '../../store';
import Button from '../../UI/Button/Button';
import { validate } from 'email-validator';
import API from '../../shared/API';

type EmailOptInProps = {
  mobile?: boolean;
  publictionHandle?: string;
};

const EmailOptIn: React.FC<EmailOptInProps> = (props): JSX.Element => {
  const [emailAddress, setEmailAddress] = useState('');
  const [emailOptInSuccess, setEmailOptInSuccess] = useState(false);
  const [emailAddressWarning, setemailAddressWarning] = useState(false);
  const [firstSave, setFirstSave] = useState(false);
  const [loading, setLoading] = useState(false);

  const onEmailAddressChange = (value: string) => {
    setEmailAddress(value);
  };

  const getAPIKey = () => {
    if (props.publictionHandle == 'FastBlocks') {
      return process.env.FASTBLOCKS_MAILERLITE_API_KEY;
    }
  };

  const { createEmailOptInAddress } = useUserStore((state) => ({
    createEmailOptInAddress: state.createEmailOptInAddress,
  }));

  useEffect(() => {
    setemailAddressWarning(firstSave && emailAddress === '');
  }, [emailAddress, firstSave]);

  useEffect(() => {
    setemailAddressWarning(firstSave && !validate(emailAddress));
  }, [emailAddress, firstSave]);
  const onEmailOptIn = async () => {
    setFirstSave(true);
    const isValid = validateEmail(emailAddress);
    if (!isValid) {
      return;
    }

    setLoading(true);
    setEmailOptInSuccess(false);

    setTimeout(() => {
      setLoading(false);
    }, 7000);

    try {
      await createEmailOptInAddress(emailAddress as string);
      setEmailOptInSuccess(true);
      API.Post(
        `https://connect.mailerlite.com/api/subscribers/`,
        {
          email: emailAddress as string,
        },
        getAPIKey()
      ).then((res) => console.log(res));
    } catch (err) {
      setEmailOptInSuccess(false);
      throw new Error(
        'There was an error processing your sign-up request...Please try again later!!!'
      );
    }
  };

  function validateEmail(emailAddress: string) {
    const isValid =
      !loading &&
      emailAddress.trim() !== '' &&
      !emailAddressWarning &&
      validate(emailAddress);
    return isValid;
  }
  return (
    <div className='email-opt-in-flex'>
      <img
        src={icons.EMAIL_OPT_IN}
        alt='background'
        className={'img-email-sign-up-logged-in'}
      />
      <div
        className={
          props.mobile === true
            ? emailOptInSuccess
              ? 'email-sign-up-success-mobile'
              : 'hide'
            : emailOptInSuccess
            ? 'email-sign-up-success'
            : 'hide'
        }
        //style={{ display: emailOptInSuccess ? 'inline' : 'none' }}
      >
        <p className='email-sign-up-success-label-1-logged-in'>Almost there!</p>
        <br></br>
        <p className='email-sign-up-success-label-2-logged-in'>
          To verify your subscription to FastBlocks News, be sure to check our
          message in your inbox and click “confirm.”
        </p>
        <img
          src={icons.EMAIL_OPT_IN_SUCCESS}
          alt='background'
          className={'img-email-sign-up-success-logged-in'}
          style={{ display: emailOptInSuccess ? 'inline' : 'none' }}
        />
      </div>

      <div
        className={'email-sign-up'}
        style={{ display: emailOptInSuccess ? 'none' : 'inline' }}
      >
        Get all the latest crypto news on-chain. Sign up below and never miss an
        article!
      </div>
      {props.mobile == false ? (
        <div
          className={'email-sign-up-2'}
          style={{ display: emailOptInSuccess ? 'none' : 'inline' }}
        >
          FastBlocks is the first fully-on-chain news source covering crypto and
          Web3. Sign up for email reminders and make the switch to a truly
          decentralized news source.
        </div>
      ) : null}
      <br></br>
      <div
        className={'input'}
        style={{ display: emailOptInSuccess ? 'none' : 'inline' }}
      >
        <label className='email-address-label'>E-MAIL ADDRESS</label>

        <InputField2
          classname='input-attributes2'
          width='100%'
          height='24px'
          defaultText='E-mail address'
          fontSize='22px'
          fontFamily='Roboto'
          fontColor={colors.FBprimaryTextColor}
          borderColor={colors.FBdarkerBorderColor}
          hasError={emailAddressWarning}
          value={emailAddress}
          onChange={onEmailAddressChange}
        ></InputField2>
      </div>
      <div style={{ position: 'relative', top: '-10px' }}>
        <RequiredFieldMessage hasError={emailAddressWarning} />
      </div>
      <br></br>
      <Button
        type='button'
        styleType='email-opt-in'
        style={{
          width: '100%',
          display: emailOptInSuccess ? 'none' : 'inline',
        }}
        onClick={onEmailOptIn}
      >
        Get it!
      </Button>
    </div>
  );
};

export default EmailOptIn;
