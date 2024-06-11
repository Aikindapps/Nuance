import React, { useContext, useState, useEffect } from 'react';
import { Context } from '../../contextes/ModalContext';
import { useTheme } from '../../contextes/ThemeContext';
import { images, icons, getDecimalsByTokenSymbol, SUPPORTED_TOKENS, SupportedTokenSymbol, TokenBalance, } from '../../shared/constants';
import Button from '../../UI/Button/Button';
import RequiredFieldMessage from '../../components/required-field-message/required-field-message';
import './_subscription-modal.scss';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { useAuthStore } from '../../store/authStore';
import { SubscriptionTimeInterval, WriterSubscriptionDetails } from 'src/declarations/Subscription/Subscription.did';
import { getPriceBetweenTokens, truncateToDecimalPlace } from '../../shared/utils';

interface SubscriptionModalProps {
    handle: string;
    authorPrincipalId: string;
    profileImage: string;
    isPublication: boolean;
    onSubscriptionComplete: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ handle, profileImage, isPublication, onSubscriptionComplete, authorPrincipalId }) => {
    const modalContext = useContext(Context);
    const darkTheme = useTheme();

    const [selectedOption, setSelectedOption] = useState<string>('');
    const [termsChecked, setTermsChecked] = useState<boolean>(false);
    const [termCheckWarning, setTermCheckWarning] = useState<boolean>(false);
    const [isSubscriptionComplete, setIsSubscriptionComplete] = useState<boolean>(false);
    const [sufficientBalance, setSufficientBalance] = useState<boolean>(false);
    const [conversionPrices, setConversionPrices] = useState<{ [key: string]: { icp: string, ckBTC: string } }>({
        Weekly: { icp: '0 ICP', ckBTC: '0 ckBTC' },
        Monthly: { icp: '0 ICP', ckBTC: '0 ckBTC' },
        Annually: { icp: '0 ICP', ckBTC: '0 ckBTC' },
        Lifetime: { icp: '0 ICP', ckBTC: '0 ckBTC' }
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
    const { userWallet, tokenBalances, fetchTokenBalances, sonicTokenPairs } =
        useAuthStore((state) => ({
            userWallet: state.userWallet,
            tokenBalances: state.tokenBalances,
            fetchTokenBalances: state.fetchTokenBalances,
            sonicTokenPairs: state.sonicTokenPairs,
        }));


    const { subscribeWriter, getWriterSubscriptionDetailsByPrincipalId } = useSubscriptionStore((state) => ({
        subscribeWriter: state.subscribeWriter,
        getWriterSubscriptionDetailsByPrincipalId: state.getWriterSubscriptionDetailsByPrincipalId
    }));

    const getSufficientBalance = (fee: number) => {
        fee = fee * 1e8;

        if (!termsChecked || !selectedOption) {
            return true;
        }

        var selectedCurrencyAndBalance: TokenBalance = {
            balance: 0,
            token: SUPPORTED_TOKENS[0],
        };
        tokenBalances.forEach((tokenBalance) => {
            if (tokenBalance.token.symbol === 'NUA') {
                selectedCurrencyAndBalance = tokenBalance;
            }
        });
        console.log('selectedCurrencyAndBalance', selectedCurrencyAndBalance);
        console.log('fee', fee);
        console.log('SUPPORTED_TOKENS[0].fee', SUPPORTED_TOKENS[0].fee);

        return selectedCurrencyAndBalance && selectedCurrencyAndBalance.balance >= fee + SUPPORTED_TOKENS[0].fee;
    }


    const [subscriptionDetails, setSubscriptionDetails] = useState<WriterSubscriptionDetails | null>(null);

    useEffect(() => {

        const fetchSubscriptionDetails = async () => {
            try {
                const details = await getWriterSubscriptionDetailsByPrincipalId(authorPrincipalId);

                if (details) {
                    // Convert fees from e8s to the appropriate units
                    const convertFromE8s = (fee: number | undefined) => (fee ? fee / 1e8 : 0);

                    const convertedDetails = {
                        ...details,
                        weeklyFee: details.weeklyFee.length > 0 ? [convertFromE8s(details.weeklyFee[0])] : [],
                        monthlyFee: details.monthlyFee.length > 0 ? [convertFromE8s(details.monthlyFee[0])] : [],
                        annuallyFee: details.annuallyFee.length > 0 ? [convertFromE8s(details.annuallyFee[0])] : [],
                        lifeTimeFee: details.lifeTimeFee.length > 0 ? [convertFromE8s(details.lifeTimeFee[0])] : [],
                    };

                    setSubscriptionDetails(convertedDetails as WriterSubscriptionDetails);
                }
            } catch (error) {
                console.error('Error fetching subscription details:', error);
            }
        };

        if (authorPrincipalId) {
            fetchSubscriptionDetails();
        }
    }, [authorPrincipalId]);


    useEffect(() => {
        //balance check
        setSufficientBalance(getSufficientBalance(parseFee(selectedOption)[0]));
    }
        , [selectedOption, termsChecked, tokenBalances]);

    const parseFee = (option: string) => {
        if (!subscriptionDetails) return [0];
        switch (option) {
            case 'Weekly':
                return subscriptionDetails.weeklyFee.length === 0 ? [0] : subscriptionDetails.weeklyFee;
            case 'Monthly':
                return subscriptionDetails.monthlyFee.length === 0 ? [0] : subscriptionDetails.monthlyFee;
            case 'Annually':
                return subscriptionDetails.annuallyFee.length === 0 ? [0] : subscriptionDetails.annuallyFee;
            case 'Lifetime':
                return subscriptionDetails.lifeTimeFee.length === 0 ? [0] : subscriptionDetails.lifeTimeFee;
            default:
                return [0];
        }
    };

    const updateConversionPrice = (option: string, tokenSymbol: SupportedTokenSymbol, conversionSetter: Function) => {
        const fee = parseFee(option)[0];
        const pricePerUnit = getPriceBetweenTokens(
            sonicTokenPairs,
            'NUA',
            tokenSymbol,
            fee * Math.pow(10, getDecimalsByTokenSymbol('NUA'))
        ) / Math.pow(10, getDecimalsByTokenSymbol(tokenSymbol));

        const formattedPrice = truncateToDecimalPlace(pricePerUnit, 4) + ` ${tokenSymbol}`;
        conversionSetter((prevPrices: any) => ({
            ...prevPrices,
            [option]: {
                ...prevPrices[option],
                [tokenSymbol.toLowerCase()]: formattedPrice
            }
        }));
    };

    useEffect(() => {
        if (subscriptionDetails) {
            ['Weekly', 'Monthly', 'Annually', 'Lifetime'].forEach(option => {
                updateConversionPrice(option, 'ICP', setConversionPrices);
                updateConversionPrice(option, 'ckBTC', setConversionPrices);
            });
        }
    }, [authorPrincipalId, subscriptionDetails]);

    const handleSubscription = async (fee: number[]) => {
        if (!termsChecked || !selectedOption) {
            setTermCheckWarning(true);
            return;
        }

        if (!sufficientBalance) {
            setSubscriptionError("Insufficient balance. Please top up your account.");
            return;
        }

        console.log('Subscribing to: ', handle, selectedOption, authorPrincipalId, isPublication);
        console.log('Subscribing with option: ', selectedOption);

        const subscriptionInterval: SubscriptionTimeInterval = (() => {
            switch (selectedOption) {
                case 'Weekly':
                    return { Weekly: null };
                case 'Monthly':
                    return { Monthly: null };
                case 'Annually':
                    return { Annually: null };
                case 'Lifetime':
                    return { LifeTime: null };
                default:
                    return { Weekly: null };
            }
        })();

        setIsLoading(true);
        const result = await subscribeWriter(authorPrincipalId, subscriptionInterval, fee[0] * 1e8);
        if (result) {
            setIsSubscriptionComplete(true);
            onSubscriptionComplete();
        } else {
            console.error('Subscription error:', result);
            setSubscriptionError("An error occurred during subscription. Please try again."); // Set the error message
        }
        setIsLoading(false);
    };

    const closeSubscriptionSuccess = () => {
        modalContext?.closeModal();
        onSubscriptionComplete();
        setIsSubscriptionComplete(false);
    };

    const getSubscriptionPeriodText = (option: string) => {
        switch (option) {
            case 'Weekly':
                return 'week';
            case 'Monthly':
                return 'month';
            case 'Annually':
                return 'year';
            case 'Lifetime':
                return 'lifetime';
            default:
                return 'period';
        }
    };

    const subscriptionOptions = [
        { label: 'Weekly', fee: subscriptionDetails?.weeklyFee },
        { label: 'Monthly', fee: subscriptionDetails?.monthlyFee },
        { label: 'Annually', fee: subscriptionDetails?.annuallyFee },
        { label: 'Lifetime', fee: subscriptionDetails?.lifeTimeFee },
    ];

    const hasValidOptions = subscriptionOptions.some(option => option.fee && option.fee.length > 0);

    return (
        <div className={darkTheme ? "subscription-modal dark" : "subscription-modal"}>
            {isSubscriptionComplete ? (
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
                            You have paid a {selectedOption} fee. You have unlimited access to all membership-only content for a {getSubscriptionPeriodText(selectedOption)}.
                            <br />
                            You can stop your subscription at any time.
                        </p>
                    </div>
                    <div className='subscription-buttons'>
                        <Button type='button' styleType={darkTheme ? 'primary-2-dark' : 'primary-2'} style={{ padding: "0px 16px", margin: "0px" }} onClick={() => modalContext?.closeModal()}>OK!</Button>
                        <Button type='button' styleType='secondary' style={{ padding: "0px 16px" }} onClick={() => { modalContext?.openModal('cancelSubscription') }}>Cancel subscription</Button>
                    </div>
                </>
            ) : termCheckWarning ? (
                <>
                    <div className="modal-top-row">
                        <img src={images.NUANCE_LOGO} alt="logo" className="nuance-logo-subscription" />
                        <div className='subscription-exit-icon' onClick={modalContext?.closeModal}>
                            <img src={darkTheme ? icons.EXIT_NOTIFICATIONS_DARK : icons.EXIT_NOTIFICATIONS} alt="Close modal" />
                        </div>
                    </div>
                    <h2 className='subscription-header'>Error</h2>
                    <div className="subscription-modal-content">
                        <p className='subscription-info'>
                            An error occurred while processing your subscription. Please try again.
                            <br />
                            {subscriptionError}
                        </p>
                    </div>
                    <div className='subscription-buttons'>
                        <Button type='button' styleType='secondary' style={{ padding: "0px 16px", margin: "0px" }} onClick={() => modalContext?.closeModal()}>Cancel</Button>
                        <Button type='button' styleType={darkTheme ? 'primary-2-dark' : 'primary-2'} style={{ padding: "0px 16px" }} onClick={() => setTermCheckWarning(false)}>Retry</Button>
                    </div>
                </>
            ) : (
                <>
                    <div className="modal-top-row">
                        <img src={images.NUANCE_LOGO} alt="logo" className="nuance-logo-subscription" />
                        <div className='subscription-exit-icon' onClick={modalContext?.closeModal}>
                            <img src={darkTheme ? icons.EXIT_NOTIFICATIONS_DARK : icons.EXIT_NOTIFICATIONS} alt="Close subscriptions modal" />
                        </div>
                    </div>
                    <h2 className='subscription-header'>Subscribe to {isPublication ? 'Publication' : 'User'}</h2>
                    <div className='subscribee-info'>
                        <img className='profile-image' src={profileImage} alt="profile" />
                        {isPublication &&
                            <img src={icons.PUBLICATION_ICON} alt='publication-icon' className='subscription-publication-icon' />
                        }
                        <div className='handle'><p>"{handle}"</p></div>
                    </div>

                    <div className="subscription-modal-content">
                        {hasValidOptions ? (
                            <>
                                <p className='subscription-info'>
                                    When you subscribe to this {isPublication ? "publication" : "user"} you get unlimited access to all of their membership content for a fee paid in NUA. You pay the fee per period you choose. After this period, you will receive a notification for a possible continuation.
                                </p>
                                <p className='option-label'>Please choose the duration of your membership:</p>
                                <div className="subscription-options">
                                    {subscriptionOptions.map(option => option.fee && option.fee.length > 0 && (
                                        <div className={`option-wrapper ${selectedOption === option.label ? 'selected' : ''}`} key={option.label} onClick={() => setSelectedOption(option.label)}>
                                            <div className={`option ${selectedOption === option.label ? 'selected' : ''} ${darkTheme ? "dark" : ""}`}>
                                                <div className="option-content">
                                                    <img src={selectedOption === option.label ? icons.GRADIENT_STAR : icons.NO_FILL_STAR} alt="star" className="star-icon" />
                                                    <div className="option-details">
                                                        <p className="option-title">{option.label}</p>
                                                        <p>
                                                            <strong>{option.fee} NUA</strong>
                                                        </p>
                                                        <div className={darkTheme ? 'subscription-conversions dark' : 'subscription-conversions'}>
                                                            <p>= {conversionPrices[option.label]?.icp}</p>
                                                            <p>= {conversionPrices[option.label]?.ckBTC}</p>
                                                            <p>= ?.?? USD</p>
                                                        </div>
                                                    </div>
                                                    <div className="subscription-radio-wrapper">
                                                        <input type="radio" name="subscriptionOption" checked={selectedOption === option.label} onChange={() => setSelectedOption(option.label)} className="option-radio" />
                                                        <span>Select</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                </div>

                            </>
                        ) : (
                            <p className='no-subscription-info'>
                                Please check back later. The author has not set up any subscriptions yet.
                            </p>
                        )}
                    </div>
                    <div className="subscription-modal-footer">
                        {hasValidOptions &&
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
                                <p className='terms'>I am aware of <a style={darkTheme ? { color: "white" } : {}} href='https://app.gitbook.com/o/-McG0wq9TbYHdM2GDu8k/s/-MfI7efMoHhyGJ3oojln/terms-and-conditions' target='_blank' rel='noreferrer'>terms and conditions</a>, general policy and agree to them.</p>
                            </div>
                        }
                        {termCheckWarning && <RequiredFieldMessage hasError={termCheckWarning} errorMessage="Please select an option and agree to the terms and conditions." />}
                        <div className='subscription-buttons'>
                            <Button type='button' styleType='secondary' style={{ padding: "0px 16px", margin: "0px" }} onClick={() => modalContext?.closeModal()}>Cancel</Button>
                            <Button
                                type='button'
                                styleType={darkTheme ? 'primary-2-dark' : 'primary-2'}
                                style={{ padding: "0px 16px", display: "flex", flexDirection: "row-reverse" }}
                                loading={isLoading}
                                disabled={!termsChecked || !selectedOption || isLoading || !sufficientBalance}
                                onClick={() => handleSubscription(parseFee(selectedOption))}
                            >
                                Subscribe
                            </Button>

                        </div>
                        {(!sufficientBalance) ? <RequiredFieldMessage hasError={true} errorMessage={"Please top up wallet with NUA"} /> : null}
                    </div>

                </>
            )}
        </div>
    );
}

export default SubscriptionModal;
