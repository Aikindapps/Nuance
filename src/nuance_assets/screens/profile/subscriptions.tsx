import React, { useEffect, useState } from 'react';
import { useUserStore, useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contextes/ThemeContext';
import { images, icons } from '../../shared/constants';
import './_subscriptions.scss';
import { Context } from '../../contextes/ModalContext';
import SubscriptionModal from '../../components/subscription-modal/subscription-modal';
import CancelSubscriptionModal from '../../components/cancel-subscription-modal/cancel-subscription-modal';
import { useSubscriptionStore, ReaderSubscriptionDetailsConverted, SubscribedWriterItem, ExpiredSubscriptionItem } from '../../store/subscriptionStore';
import { Link } from 'react-router-dom';



const Menu = ({
    activeTab,
    subscription,
    openSubscriptionModal,
    openCancelSubscriptionModal,
}: {
    activeTab: string;
    subscription: SubscribedWriterItem | ExpiredSubscriptionItem;
    openSubscriptionModal: (subscription: SubscribedWriterItem | ExpiredSubscriptionItem) => void;
    openCancelSubscriptionModal: (subscription: SubscribedWriterItem | ExpiredSubscriptionItem) => void;
}) => {
    const darkTheme = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleOpenSubscriptionModal = () => {
        openSubscriptionModal(subscription);
        toggleMenu();
    };

    const handleOpenCancelSubscriptionModal = () => {
        openCancelSubscriptionModal(subscription);
        toggleMenu();
    };

    if ('subscriptionEndDate' in subscription) {
        console.log(`Subscription End Date: ${new Date(subscription.subscriptionEndDate)}`);
        console.log(`Current Date: ${new Date()}`);
    }

    return (
        <div className='menu-container'>
            <img src={isOpen ? icons.THREE_DOTS_BLUE : icons.THREE_DOTS} alt="Menu" onClick={toggleMenu} />
            {isOpen && (
                <div className='menu-dropdown'>
                    {activeTab === 'expired' ? (
                        <>
                            <Link to={`/${subscription.isPublication ? "publication" : "user"}/${subscription.userListItem.handle}`} onClick={toggleMenu}>
                                <p>Go to {subscription.isPublication ? "publication" : "user profile"}</p>
                            </Link>
                            {'subscriptionEndDate' in subscription && subscription.subscriptionEndDate < Date.now() && (
                                <p onClick={handleOpenSubscriptionModal}>
                                    Start {subscription.isPublication && " publication "} subscription
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <Link to={`/${subscription.isPublication ? "publication" : "user"}/${subscription.userListItem.handle}`} onClick={toggleMenu}>
                                <p>Go to {subscription.isPublication ? "publication" : "user profile"}</p>
                            </Link>
                            <p onClick={handleOpenCancelSubscriptionModal}>Cancel subscription</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};



const Subscriptions = () => {
    const modalContext = React.useContext(Context);
    const user = useUserStore((state) => state.user);
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const navigate = useNavigate();
    const darkTheme = useTheme();

    const [activeTab, setActiveTab] = useState('active');
    const [subscriptions, setSubscriptions] = useState<{ activeSubscriptions: SubscribedWriterItem[], expiredSubscriptions: ExpiredSubscriptionItem[] }>({ activeSubscriptions: [], expiredSubscriptions: [] });
    const [selectedSubscription, setSelectedSubscription] = useState({} as SubscribedWriterItem | ExpiredSubscriptionItem);
    const [modalType, setModalType] = useState('');
    const [principalId, setPrincipalId] = useState('');

    const { getMySubscriptionHistoryAsReader } = useSubscriptionStore((state) => ({
        getMySubscriptionHistoryAsReader: state.getMySubscriptionHistoryAsReader,
    }));


    const { getPrincipalByHandle } = useUserStore((state) => ({
        getPrincipalByHandle: state.getPrincipalByHandle,
    }));

    useEffect(() => {
        if (!isLoggedIn || !user) {
            navigate('/register', { replace: true });
        }
    }, [isLoggedIn, user, navigate]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const fetchSubscriptionHistory = async () => {
        try {
            const history = await getMySubscriptionHistoryAsReader();
            if (history) {
                setSubscriptions(history);
            }
        } catch (error) {
            console.error('Error fetching subscription history:', error);
        }
    };

    useEffect(() => {

        fetchSubscriptionHistory();
    }, [getMySubscriptionHistoryAsReader]);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    };

    const filteredSubscriptions = activeTab === 'active' ? subscriptions.activeSubscriptions : subscriptions.expiredSubscriptions;

    const openSubscriptionModal = async (subscription: any) => {
        const principalId = await getPrincipalByHandle(subscription.userListItem.handle);
        setSelectedSubscription(subscription);
        setPrincipalId(principalId || '');
        setModalType('Subscription');
        modalContext?.openModal('Subscription');
    };

    const openCancelSubscriptionModal = async (subscription: any) => {
        const principalId = await getPrincipalByHandle(subscription.userListItem.handle);
        setSelectedSubscription(subscription);
        setPrincipalId(principalId || '');
        setModalType('cancelSubscription');
        modalContext?.openModal('cancelSubscription');
    };

    return (
        <>
            {modalType === 'Subscription' && modalContext?.isModalOpen && selectedSubscription && (
                <SubscriptionModal
                    handle={selectedSubscription?.userListItem.handle || ''}
                    authorPrincipalId={principalId || ''}
                    profileImage={selectedSubscription.userListItem.avatar}
                    isPublication={selectedSubscription.isPublication}
                    onSubscriptionComplete={() => { fetchSubscriptionHistory(); }}
                />
            )}

            {modalType === 'cancelSubscription' && modalContext?.isModalOpen && selectedSubscription && (
                <CancelSubscriptionModal
                    handle={selectedSubscription.userListItem.handle || ''}
                    profileImage={selectedSubscription.userListItem.avatar}
                    isPublication={selectedSubscription.isPublication}
                    authorPrincipalId={principalId || ''}
                    onCancelComplete={() => { fetchSubscriptionHistory(); }}
                />
            )}

            <div className={darkTheme ? 'subscription-wrapper dark' : 'subscription-wrapper'}>
                <p className='subscription-title'>SUBSCRIPTIONS</p>

                <div className='tabs'>
                    <button onClick={() => handleTabChange('active')} className={activeTab === 'active' ? 'active' : darkTheme ? 'dark' : ''}>
                        Active ({subscriptions.activeSubscriptions.length})
                    </button>
                    <button onClick={() => handleTabChange('expired')} className={activeTab === 'expired' ? 'active' : darkTheme ? 'dark' : ''}>
                        Expired ({subscriptions.expiredSubscriptions.length})
                    </button>
                </div>

                <div className={darkTheme ? 'subscription-header dark' : 'subscription-header'}>
                    {activeTab === 'active' ?
                        "You are currently subscribed to these publications and writers. You have unlimited access to all their member content for a certain amount NUA per period that you chose to be a member." :
                        "You are no longer subscribed to these publications and writers. You can expand your membership to still have unlimited access to all their member content for a certain amount NUA per period that you choose to be a member."
                    }
                </div>

                <div className='table-container'>
                    <table className='subscription-table'>
                        <thead>
                            <tr>
                                <th style={{ width: "10px" }}>PUBLISHER</th>
                                <th></th>
                                <th>SUBSCRIBED SINCE</th>
                                <th>PERIOD</th>
                                <th>FEE PER PERIOD</th>
                                <th>TOTAL FEES</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubscriptions.map((sub) => (
                                <tr key={sub.subscriptionStartDate}>
                                    <td><Link to={`/${sub.isPublication ? "publication" : "user"}/${sub.userListItem.handle}`}><img className={activeTab === "expired" ? 'subscription-avatar expired' : "subscription-avatar"} src={sub.userListItem.avatar || images.DEFAULT_AVATAR} alt="Avatar" /> </Link></td>
                                    <td><Link to={`/${sub.isPublication ? "publication" : "user"}/${sub.userListItem.handle}`}>@{sub.userListItem.handle}</Link></td>
                                    <td>{formatDate(sub.subscriptionStartDate)}</td>
                                    <td>{sub.period}</td>
                                    <td>{sub.feePerPeriod / 1e8} NUA</td>
                                    <td>{sub.totalFees / 1e8} NUA</td>
                                    <td>
                                        <Menu
                                            activeTab={activeTab}
                                            subscription={sub}
                                            openSubscriptionModal={openSubscriptionModal}
                                            openCancelSubscriptionModal={openCancelSubscriptionModal}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default Subscriptions;