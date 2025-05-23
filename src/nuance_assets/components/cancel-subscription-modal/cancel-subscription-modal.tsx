import React, { useContext, useState } from 'react';
import { Context } from '../../contextes/ModalContext';
import { useTheme } from '../../contextes/ThemeContext';
import { images, icons, colors } from '../../shared/constants';
import Button from '../../UI/Button/Button';
import Loader from '../../UI/loader/Loader';
import { useSubscriptionStore } from '../../store/subscriptionStore';


interface SubscriptionModalProps {
    handle: string;
    profileImage: string;
    isPublication: boolean;
    onCancelComplete: () => void;
    authorPrincipalId: string;
}

const CancelSubscriptionModal: React.FC<SubscriptionModalProps> = ({
    handle,
    profileImage,
    isPublication,
    onCancelComplete,
    authorPrincipalId,
}) => {
    const modalContext = useContext(Context);
    const darkTheme = useTheme();
    const [isCancelComplete, setIsCancelComplete] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { stopSubscriptionAsReader } = useSubscriptionStore((state) => ({
        stopSubscriptionAsReader: state.stopSubscriptionAsReader,
    }));

    const handleCancelSubscription = async () => {
        setIsLoading(true);
        await stopSubscriptionAsReader(authorPrincipalId);
        setIsCancelComplete(true);
        setIsLoading(false);
        onCancelComplete();
    };

    return (
        <div className={darkTheme ? 'subscription-modal dark' : 'subscription-modal'}>
            {isCancelComplete ? (
                <>
                    <div className='modal-top-row'>
                        <img src={darkTheme ? images.NUANCE_LOGO : images.NUANCE_LOGO_BLACK} alt='logo' className='nuance-logo-subscription' />
                        <div className='subscription-exit-icon' onClick={modalContext?.closeModal}>
                            <img src={darkTheme ? icons.EXIT_NOTIFICATIONS_DARK : icons.EXIT_NOTIFICATIONS} alt='Close modal' />
                        </div>
                    </div>
                    <h2 className='subscription-header'>You stopped!</h2>
                    <div className='subscription-success-info'>
                        <img className='success-icon' src={icons.CANCEL_SUBSCRIPTION_SUCCESS} alt='success' />
                    </div>
                    <div className='subscription-success-content'>
                        <p className='subscription-success-info'>
                            You have canceled your subscription to <strong>@{handle}</strong>.
                            <br />
                        </p>
                    </div>
                    <div className='subscription-buttons'>
                        <Button type='button' styleType={{dark: 'white', light: 'white'}} style={{ padding: '0px 16px', margin: '0px' }} onClick={() => modalContext?.closeModal()}>
                            OK!
                        </Button>
                        <Button type='button' styleType={{dark: 'navy-dark', light: 'navy'}} style={{ padding: '0px 16px' }} onClick={() => { modalContext?.openModal('Subscription'); }}>
                            Undo cancellation
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <div className='modal-top-row'>
                        <img src={darkTheme ? images.NUANCE_LOGO : images.NUANCE_LOGO_BLACK} alt='logo' className='nuance-logo-subscription' />
                        <div className='subscription-exit-icon' onClick={modalContext?.closeModal}>
                            <img src={darkTheme ? icons.EXIT_NOTIFICATIONS_DARK : icons.EXIT_NOTIFICATIONS} alt='Close subscriptions modal' />
                        </div>
                    </div>
                    <h2 className='subscription-header'>Stop subscription to {isPublication ? 'Publication' : 'User'}</h2>
                    <div className='subscribee-info'>
                        <img className='cancel-subscription-profile-image' src={profileImage || images.DEFAULT_AVATAR} alt='profile' />
                        <img src={isPublication ? icons.STOP_SUBSCRIPTION : icons.CANCEL_SUBSCRIPTION_USER} alt='stop-subscription-icon' className='stop-subscription-publication-icon' />
                    </div>
                    <div className='subscription-modal-content'>
                        <p className='subscription-info'>
                            You are about to cancel your subscription to the {isPublication ? 'publication of' : 'user'} <strong>@{handle}</strong>. <br /> <br />
                            You will no longer have unlimited access to all its content. Effective from the expiration of your subscription. <br /> <br />
                            Is that what you want?
                        </p>
                    </div>
                    <div className='subscription-modal-footer'>
                        {isLoading && <Loader />} {/* Display loader when loading */}
                        <div className='subscription-buttons'>
                            <Button type='button' styleType={{dark: 'navy-dark', light: 'navy'}} style={{ padding: '0px 16px', margin: '0px' }} onClick={() => modalContext?.closeModal()}>
                                Keep subscription
                            </Button>
                            <Button type='button' styleType={{dark: 'white', light: 'white'}} style={{ padding: '0px 16px' }} onClick={handleCancelSubscription} disabled={isLoading}>
                                Stop Subscription
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CancelSubscriptionModal;
