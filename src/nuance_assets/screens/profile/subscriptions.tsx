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

const Menu = ({ activeTab }: { activeTab: string }) => {
    const modalContext = React.useContext(Context);
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const openModal = () => {
        modalContext?.openModal('Subscription');
        toggleMenu();
    }

    const openCancelModal = () => {
        modalContext?.openModal('cancelSubscription');
        toggleMenu();
    }

    return (
        <div className='menu-container'>
            <img src={isOpen ? icons.THREE_DOTS_BLUE : icons.THREE_DOTS} alt="Menu" onClick={toggleMenu} />
            {isOpen && (
                <div className='menu-dropdown'>
                    {activeTab === 'expired' ? (
                        <>
                            <p>Go to publication</p>
                            <p>Go to publisher</p>
                            <p onClick={openModal}>Start publication subscription</p>
                        </>
                    ) : (
                        <>
                            <p>Go to publication</p>
                            <p>Go to publisher</p>
                            <p onClick={openCancelModal}>Cancel subscription</p>
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

    const { getMySubscriptionHistoryAsReader } = useSubscriptionStore((state) => ({
        getMySubscriptionHistoryAsReader: state.getMySubscriptionHistoryAsReader,
    }));

    useEffect(() => {
        if (!isLoggedIn || !user) {
            navigate('/register', { replace: true });
        }
    }, [isLoggedIn, user, navigate]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    useEffect(() => {
        const fetchSubscriptionHistory = async () => {
            try {
                const history = await getMySubscriptionHistoryAsReader();
                console.log('Subscription History:', history);
                if (history) {
                    setSubscriptions(history);
                }
            } catch (error) {
                console.error('Error fetching subscription history:', error);
            }
        };

        fetchSubscriptionHistory();
    }, [getMySubscriptionHistoryAsReader]);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    };

    const filteredSubscriptions = activeTab === 'active' ? subscriptions.activeSubscriptions : subscriptions.expiredSubscriptions;

    return (
        <>
            {modalContext?.modalType === 'Subscription' && modalContext?.isModalOpen && (
                <SubscriptionModal handle='Test' authorPrincipalId='' profileImage='' isPublication={true} onSubscriptionComplete={() => { }} />
            )}

            {modalContext?.modalType === 'cancelSubscription' && modalContext?.isModalOpen && (
                <CancelSubscriptionModal handle='Test' profileImage='' isPublication={false} authorPrincipalId={''} onCancelComplete={() => { }} />
            )}

            <div className='subscription-wrapper'>
                <p className='subscription-title'>SUBSCRIPTIONS</p>

                <div className='tabs'>
                    <button onClick={() => handleTabChange('active')} className={activeTab === 'active' ? 'active' : ''}>
                        Active ({subscriptions.activeSubscriptions.length})
                    </button>
                    <button onClick={() => handleTabChange('expired')} className={activeTab === 'expired' ? 'active' : ''}>
                        Expired ({subscriptions.expiredSubscriptions.length})
                    </button>
                </div>

                <div className='subscription-header'>
                    {activeTab === 'active' ?
                        "You are currently subscribed to these publications and writers. You have unlimited access to all their member content for a certain amount NUA per period that you chose to be a member." :
                        "You are no longer subscribed to these publications and writers. You can expand your membership to still have unlimited access to all their member content for a certain amount NUA per period that you choose to be a member."
                    }
                </div>

                <div className='table-container'>
                    <table className='subscription-table'>
                        <thead>
                            <tr>
                                <th>PUBLICATION</th>
                                <th></th>
                                <th>PUBLISHER</th>
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
                                    <td><img className={activeTab === "expired" ? 'subscription-avatar expired' : "subscription-avatar"} src={sub.userListItem.avatar || images.DEFAULT_AVATAR} alt="Avatar" /></td>
                                    <td>{sub.userListItem.displayName}</td>
                                    <td>@{sub.userListItem.handle}</td>
                                    <td>{formatDate(sub.subscriptionStartDate)}</td>
                                    <td>{sub.period}</td>
                                    <td>{sub.feePerPeriod} NUA</td>
                                    <td>{sub.totalFees} NUA</td>
                                    <td><Menu activeTab={activeTab} /></td>
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
