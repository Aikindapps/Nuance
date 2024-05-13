import React, { useEffect, useState } from 'react';
import { useUserStore, useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contextes/ThemeContext';
import { images, icons } from '../../shared/constants';
import './_subscriptions.scss';
import { Context } from '../../contextes/ModalContext';
import SubscriptionModal from '../../components/subscription-modal/subscription-modal';



const Menu = ({ activeTab }: any) => {
    const modalContext = React.useContext(Context);
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const openModal = () => {
        modalContext?.openModal('Subscription');
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
                            <p>Cancel subscription</p>
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
    const [subscriptions, setSubscriptions] = useState([
        { id: 1, name: "Okapion Foodies", publisher: "@foodcompany", subscribedSince: "10-02-2022", period: "Month", fee: "1 NUA", totalFees: "21 NUA", status: 'active' },
        { id: 2, name: "Mac Twain", publisher: "@marctwain", subscribedSince: "10-02-2022", period: "Week", fee: "1 NUA", totalFees: "1 NUA", status: 'active' },
        { id: 3, name: "Sports United", publisher: "@elcoolio", subscribedSince: "10-02-2022", period: "Week", fee: "1 NUA", totalFees: "4 NUA", status: 'expired' },
    ]);

    useEffect(() => {
        if (!isLoggedIn || !user) {
            navigate('/register', { replace: true });
        }
    }, [isLoggedIn, user, navigate]);

    const handleTabChange = (tab: any) => {
        setActiveTab(tab);
    };

    const filteredSubscriptions = subscriptions.filter(sub => sub.status === activeTab);

    return (
        <>
            {modalContext?.modalType === 'Subscription' && modalContext?.isModalOpen && (
                <SubscriptionModal handle='Test' profileImage='' isPublication={true} onSubscriptionComplete={() => { }} />
            )
            }
            <div className='subscription-wrapper'>

                <p className='subscription-title'>SUBSCRIPTIONS</p>

                <div className='tabs'>
                    <button onClick={() => handleTabChange('active')} className={activeTab === 'active' ? 'active' : ''}>Active ({subscriptions.filter(sub => sub.status === 'active').length})</button>
                    <button onClick={() => handleTabChange('expired')} className={activeTab === 'expired' ? 'active' : ''}>Expired ({subscriptions.filter(sub => sub.status === 'expired').length})</button>
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
                                <th></th>
                                <th>PUBLICATION</th>
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
                                <tr key={sub.id}>
                                    <td><img className={activeTab === "expired" ? 'subscription-avatar expired' : "subscription-avatar"} src={images.DEFAULT_AVATAR} alt="Avatar" /></td>
                                    <td>{sub.name}</td>
                                    <td>{sub.publisher}</td>
                                    <td>{sub.subscribedSince}</td>
                                    <td>{sub.period}</td>
                                    <td>{sub.fee}</td>
                                    <td>{sub.totalFees}</td>
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
