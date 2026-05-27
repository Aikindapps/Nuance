import React, { useContext, useState, useEffect } from 'react';
import { Context } from '../../contextes/ModalContext';
import { useTheme } from '../../contextes/ThemeContext';
import { images, icons } from '../../shared/constants';
import Button from '../../UI/Button/Button';
import Loader from '../../UI/loader/Loader';
import {
  useSubscriptionStore,
  MembershipDetails,
  getPeriodBySubscriptionTimeInterval,
} from '../../store/subscriptionStore';
import { useAuthStore } from '../../store/authStore';
import { openStripeInNewTab } from '../../services/stripeRedirect';
import { toast, ToastType } from '../../services/toastService';


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
    // full membership details for this writer (null = none found, undefined = still loading)
    const [membership, setMembership] = useState<MembershipDetails | null | undefined>(undefined);

    const { userWallet } = useAuthStore((state) => ({
        userWallet: state.userWallet,
    }));

    const { stopSubscriptionAsReader, getMembershipDetailsForWriter, openStripeBillingPortal } =
        useSubscriptionStore((state) => ({
            stopSubscriptionAsReader: state.stopSubscriptionAsReader,
            getMembershipDetailsForWriter: state.getMembershipDetailsForWriter,
            openStripeBillingPortal: state.openStripeBillingPortal,
        }));

    useEffect(() => {
        const load = async () => {
            const details = await getMembershipDetailsForWriter(authorPrincipalId);
            setMembership(details);
        };
        if (authorPrincipalId) {
            load();
        }
    }, [authorPrincipalId]);

    const handleCancelSubscription = async () => {
        setIsLoading(true);
        await stopSubscriptionAsReader(authorPrincipalId);
        setIsCancelComplete(true);
        setIsLoading(false);
        onCancelComplete();
    };

    const handleManageInStripe = async () => {
        const readerId = userWallet?.principal;
        if (!readerId) {
            return;
        }
        setIsLoading(true);
        // open Stripe's hosted billing portal in a new tab so the reader keeps their place
        const opened = await openStripeInNewTab(() => openStripeBillingPortal(readerId));
        setIsLoading(false);
        if (opened) {
            toast('Continue in the new Stripe tab to manage your membership…', ToastType.Plain);
            modalContext?.closeModal();
        }
    };

    const formatDate = (ms: number) => new Date(ms).toLocaleDateString();

    // human-readable status for the membership, plus a badge color class
    const getStatus = (m: MembershipDetails): { label: string; tone: 'active' | 'ending' | 'ended' } => {
        if (m.paymentMethod === 'stripe') {
            if (!m.isActive) {
                return { label: `Ended on ${formatDate(m.endDate)}`, tone: 'ended' };
            }
            if (m.stripeCancelAtPeriodEnd) {
                return { label: `Cancels on ${formatDate(m.endDate)} · won't renew`, tone: 'ending' };
            }
            return { label: `Active · renews ${formatDate(m.endDate)}`, tone: 'active' };
        }
        // NUA: no automatic renewal
        if (!m.isActive) {
            return { label: `Expired on ${formatDate(m.endDate)}`, tone: 'ended' };
        }
        return { label: `Active until ${formatDate(m.endDate)}`, tone: 'active' };
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
                            You have stopped supporting <strong>@{handle}</strong>.
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
                    <h2 className='subscription-header'>Manage Membership</h2>
                    <div className='subscribee-info'>
                        <img className='cancel-subscription-profile-image' src={profileImage || images.DEFAULT_AVATAR} alt='profile' />
                        <img src={isPublication ? icons.STOP_SUBSCRIPTION : icons.CANCEL_SUBSCRIPTION_USER} alt='membership-icon' className='stop-subscription-publication-icon' />
                    </div>

                    {membership === undefined ? (
                        <div className='subscription-modal-content'>
                            <Loader />
                        </div>
                    ) : membership === null ? (
                        <>
                            <div className='subscription-modal-content'>
                                <p className='subscription-info'>
                                    No membership found for <strong>@{handle}</strong>.
                                </p>
                            </div>
                            <div className='subscription-modal-footer'>
                                <div className='subscription-buttons'>
                                    <Button type='button' styleType={{dark: 'navy-dark', light: 'navy'}} style={{ padding: '0px 16px', margin: '0px' }} onClick={() => modalContext?.closeModal()}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className='subscription-modal-content'>
                                <p className='subscription-info'>
                                    Your membership to the {isPublication ? 'publication of' : 'user'} <strong>@{handle}</strong>.
                                </p>
                                <div className='membership-details'>
                                    <div className='membership-detail-row'>
                                        <span className='membership-detail-label'>Payment</span>
                                        <span className='membership-detail-value'>
                                            {membership.paymentMethod === 'stripe' ? 'Card (Stripe)' : 'NUA tokens'}
                                        </span>
                                    </div>
                                    <div className='membership-detail-row'>
                                        <span className='membership-detail-label'>Plan</span>
                                        <span className='membership-detail-value'>
                                            {getPeriodBySubscriptionTimeInterval(membership.subscriptionTimeInterval)}
                                        </span>
                                    </div>
                                    <div className='membership-detail-row'>
                                        <span className='membership-detail-label'>Started</span>
                                        <span className='membership-detail-value'>{formatDate(membership.startDate)}</span>
                                    </div>
                                    <div className='membership-detail-row'>
                                        <span className='membership-detail-label'>Status</span>
                                        <span className={`membership-status-badge ${getStatus(membership).tone}`}>
                                            {getStatus(membership).label}
                                        </span>
                                    </div>
                                </div>
                                {membership.paymentMethod === 'nua' && (
                                    <p className='subscription-info membership-note'>
                                        NUA memberships do not renew automatically. Access ends on the date above.
                                    </p>
                                )}
                            </div>
                            <div className='subscription-modal-footer'>
                                <div className='subscription-buttons'>
                                    <Button type='button' styleType={{dark: 'navy-dark', light: 'navy'}} style={{ padding: '0px 16px', margin: '0px' }} onClick={() => modalContext?.closeModal()}>
                                        Close
                                    </Button>
                                    {membership.paymentMethod === 'stripe' ? (
                                        <Button type='button' styleType={{dark: 'white', light: 'white'}} style={{ padding: '0px 16px' }} onClick={handleManageInStripe} loading={isLoading} disabled={isLoading}>
                                            Manage in Stripe
                                        </Button>
                                    ) : (
                                        membership.isActive && (
                                            <Button type='button' styleType={{dark: 'white', light: 'white'}} style={{ padding: '0px 16px' }} onClick={handleCancelSubscription} loading={isLoading} disabled={isLoading}>
                                                Stop supporting
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default CancelSubscriptionModal;
