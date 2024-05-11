import React, { useContext, useState } from 'react';
import { Context } from '../../contextes/ModalContext';
import { useTheme } from '../../contextes/ThemeContext';
import { images, icons, colors } from '../../shared/constants';
import Button from '../../UI/Button/Button';
import RequiredFieldMessage from '../../components/required-field-message/required-field-message';

// Props interface
interface SubscriptionModalProps {
    handle: string;
    profileImage: string;
    isPublication: boolean;
    onSubscriptionComplete: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ handle, profileImage, isPublication, onSubscriptionComplete }) => {
    const modalContext = useContext(Context);
    const { darkTheme } = useTheme();
    const [selectedOption, setSelectedOption] = useState<string>('');
    const [termsChecked, setTermsChecked] = useState<boolean>(false);
    const [termCheckWarning, setTermCheckWarning] = useState<boolean>(false);
    const [isSubscriptionComplete, setIsSubscriptionComplete] = useState<boolean>(false);

    const handleSubscription = () => {
        // Check if the terms and conditions are agreed and an option is selected
        if (!termsChecked || !selectedOption) {
            setTermCheckWarning(true);
            return;
        }
        console.log('Subscribing with option: ', selectedOption);
        setIsSubscriptionComplete(true);
        onSubscriptionComplete();
    };


    const closeSubscriptionSuccess = () => {
        modalContext?.closeModal
        onSubscriptionComplete();
        setIsSubscriptionComplete(false);
    };

    return (
        <div className="subscription-modal">
            {isSubscriptionComplete ?
                (
                    <>
                        <div className="modal-top-row">
                            <img src={images.NUANCE_LOGO} alt="logo" className="nuance-logo-subscription" />
                            <div className='subscription-exit-icon' onClick={modalContext?.closeModal}>
                                <img src={darkTheme ? icons.EXIT_NOTIFICATIONS_DARK : icons.EXIT_NOTIFICATIONS} alt="Close modal" />
                            </div>
                        </div>
                        <h2 className='subscription-header'>Yes!</h2>
                        <div className='subscription-success-info'>
                            <img className='success-icon' src={icons.GRADIENT_PUBLICATION_SUCCESS_ICON} alt="success" />
                        </div>
                        <div className="subscription-success-content">
                            <p className='subscription-success-info'>
                                You are now subscribed to <strong>@{handle}</strong>.
                                <br />

                                You have unlimited access to all its content for 1 NUA per month. You pay a monthly fee.
                                <br />

                                You can stop your subscription  per month.
                            </p>
                        </div>
                        <div className='subscription-buttons'>
                            <Button type='button' styleType='primary-2' style={{ padding: "0px 16px", margin: "0px" }} onClick={() => modalContext?.closeModal()}>OK!</Button>
                            <Button type='button' styleType='secondary' style={{ padding: "0px 16px" }} onClick={() => { console.log("redirect") }}>Cancel subscription</Button>
                        </div>

                    </>


                )
                : (
                    <>
                        <div className="modal-top-row">
                            <img src={images.NUANCE_LOGO} alt="logo" className="nuance-logo-subscription" />
                            <div className='subscription-exit-icon' onClick={modalContext?.closeModal}>
                                <img src={darkTheme ? icons.EXIT_NOTIFICATIONS_DARK : icons.EXIT_NOTIFICATIONS} alt="Close subscriptions modal" />
                            </div>
                        </div>
                        <h2 className='subscription-header'>Subscribe to {isPublication ? 'Publication' : 'User'} </h2>
                        <div className='subscribee-info'>
                            <img className='profile-image' src={profileImage} alt="profile" />
                            <img src={icons.PUBLICATION_ICON} alt='publication-icon' className='subscription-publication-icon' />
                            <div className='handle'><p>"{handle}"</p></div>
                        </div>
                        <div className="subscription-modal-content">
                            <p className='subscription-info'>
                                When you subscribe to this publication you get unlimited access to all its membership content for a NUA fee. You pay the fee per period you choose. After this period, you will receive a notification for a possible continuation.
                                <p className='option-label'>Please choose the duration of your membership:</p>
                            </p>
                            <div className="subscription-options">
                                {['Weekly', 'Monthly', 'Annually', 'Lifetime'].map(option => (
                                    <div className={`option-wrapper ${selectedOption === option ? 'selected' : ''}`} key={option} onClick={() => setSelectedOption(option)}>
                                        <div className={`option ${selectedOption === option ? 'selected' : ''}`}>
                                            <div className="option-content">
                                                <img src={selectedOption === option ? icons.GRADIENT_STAR : icons.NO_FILL_STAR} alt="star" className="star-icon" />
                                                <div className="option-details">
                                                    <p className="option-title">{option}</p>
                                                    <p>{option === 'Weekly' ? <strong>0.3 NUA</strong> : option === 'Monthly' ? <strong>1 NUA</strong> : option === 'Annually' ? <strong>6 NUA</strong> : <strong>12 NUA</strong>}</p>
                                                    <div className='subscription-conversions'>
                                                        <p>= 0.01 ICP</p>
                                                        <p>= 0.01 ckBTC</p>
                                                        <p>= 0.01 USD</p>
                                                    </div>
                                                </div>
                                                <div className="subscription-radio-wrapper">
                                                    <input type="radio" name="subscriptionOption" checked={selectedOption === option} onChange={() => setSelectedOption(option)} className="option-radio" />
                                                    <span>Select</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="subscription-modal-footer">
                            <div className='subscription-terms'>
                                <input
                                    type='checkbox'
                                    className='checkbox'
                                    checked={termsChecked}
                                    onChange={() => {
                                        setTermsChecked(!termsChecked);
                                        setTermCheckWarning(false);
                                    }}
                                />
                                <p className='terms'>I am aware of <a href='https://app.gitbook.com/o/-McG0wq9TbYHdM2GDu8k/s/-MfI7efMoHhyGJ3oojln/terms-and-conditions' target='_blank' rel='noreferrer'>terms and conditions</a>, general policy and agree to them.</p>
                            </div>
                            {termCheckWarning && <RequiredFieldMessage hasError={termCheckWarning} errorMessage="Please select an option and agree to the terms and conditions." />}
                            <div className='subscription-buttons'>
                                <Button type='button' styleType='secondary' style={{ padding: "0px 16px", margin: "0px" }} onClick={() => modalContext?.closeModal()}>Cancel</Button>
                                <Button type='button' styleType='primary-2' style={{ padding: "0px 16px" }} disabled={!termsChecked || !selectedOption} onClick={handleSubscription}>Subscribe</Button>
                            </div>
                        </div>
                    </>
                )}
        </div>
    );
};

export default SubscriptionModal;
