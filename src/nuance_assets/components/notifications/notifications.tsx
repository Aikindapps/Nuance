import React, { useEffect, useContext } from 'react';
import { useState } from 'react';
import './_notifications.scss';
import { useUserStore } from '../../store/userStore';
import { useTheme, useThemeUpdate } from '../../contextes/ThemeContext';
import { Context } from '../../../nuance_assets/contextes/ModalContext';
import { timeAgo } from '../../../nuance_assets/shared/utils';
import { Notifications, NotificationContent, NotificationType } from '../../../../src/declarations/Notifications/Notifications.did';
import { icons } from '../../shared/constants';
import Toggle from '../../../nuance_assets/UI/toggle/toggle';
import { String, get } from 'lodash';
import { colors } from '../../shared/constants';


type NotificationsSidebarProps = {
};

const NotificationsSidebar: React.FC<NotificationsSidebarProps> = ({ }) => {

    const darkTheme = useTheme();
    const darkOptionsAndColors = {
        background: darkTheme
            ? colors.darkModePrimaryBackgroundColor
            : colors.primaryBackgroundColor,
        color: darkTheme
            ? colors.darkModePrimaryTextColor
            : colors.primaryTextColor,
    };


    // States for each of the notification settings
    const [commentsReplies, setCommentsReplies] = useState(true);
    const [applauseForMe, setApplauseForMe] = useState(true);
    const [newArticleByAuthor, setNewArticleByAuthor] = useState(true);
    const [newArticleOnTopic, setNewArticleOnTopic] = useState(true);
    const [newFollower, setNewFollower] = useState(true);


    const saveNotificationSettings = () => {
        const settings = {
            commentsReplies,
            applauseForMe,
            newArticleByAuthor,
            newArticleOnTopic,
            newFollower
        };
        // Save settings logic here...
        console.log('Settings saved:', settings);
    };

    const { getUserNotifications, markNotificationAsRead, notifications, resetNotificationCount } = useUserStore((state) => ({
        getUserNotifications: state.getUserNotifications,
        markNotificationAsRead: state.markNotificationAsRead,
        notifications: state.notifications || [],
        resetNotificationCount: state.resetNotificationCount,
    }));

    const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
    const [isSettingsSelected, setIsSettingsSelected] = useState(false);
    const [currentView, setCurrentView] = useState('notifications'); // 'notifications' or 'settings'



    //modal context
    const [isOpen, setIsOpen] = useState(false);
    const modalContext = useContext(Context);

    const openSidebar = () => {
        setIsOpen(true);
        //set notification count to 0
        resetNotificationCount();
    };

    const closeSidebar = () => {
        setIsOpen(false);
        //mark all notifications as read: TODO optimize to mark all as read at once
        notifications.forEach((notification) => {
            if (!notification.read) {
                // markNotificationAsRead([notification.id])
                //     .then(() => {
                //         getUserNotifications(0, 100, true);
                //         console.log(`Notification ${notification.id} marked as read`);
                //     })
                //     .catch((error) => {
                //         console.error(`Error marking notification as read: ${error}`);
                //     });
                console.log(`Notification ${notification.id} marked as read`);
                //need to figure out how to mark all notifications as read without 
                //marking as read on render
            }
        });
    };

    useEffect(() => {
        if (modalContext?.isModalOpen && modalContext.modalType === 'Notifications') {
            openSidebar();
        } else {
            closeSidebar();
        }
    }, [modalContext?.isModalOpen, modalContext?.modalType]);


    const handleSettingsClick = () => {
        setCurrentView(currentView => currentView === 'settings' ? 'notifications' : 'settings');
    };

    const handleNotificationsClick = () => {
        setCurrentView('notifications');
    };


    const isLoggedIn = useUserStore((state) => state.user !== null);

    //get user notifications
    useEffect(() => {
        getUserNotifications(0, 100, isLoggedIn);
        console.log('getUserNotifications');
        console.log(notifications);
    }
        , []);

    //mark notification as read
    const handleNotificationClick = (notification: Notifications) => {
        setSelectedNotificationId(notification.id);

        if (!notification.read) {
            markNotificationAsRead([notification.id])
                .then(() => {
                    getUserNotifications(0, 100, isLoggedIn);
                    console.log(`Notification ${notification.id} marked as read`);
                })
                .catch((error) => {

                    console.error(`Error marking notification as read: ${error}`);
                });
        }
    };


    function getNotificationTypeKey(notificationType: NotificationType): string {
        return Object.keys(notificationType)[0];
    }

    function formatNotificationMessage(notification: Notifications) {
        const notificationTypeKey = getNotificationTypeKey(notification.notificationType);
        let handleUrl = <a href={`/user/${notification?.content.senderHandle}`}>@{notification.content.senderHandle} </a>;
        let tagHandleUrl = <a href={`/${notification?.content.authorHandle}`}>@{notification.content.authorHandle} </a>;
        let authorHandleUrl = <a href={`/user/${notification?.content.authorHandle}`}>@{notification.content.authorHandle} </a>;
        let articleUrl = <a href={`${notification?.content.url}`}>{notification?.content.articleTitle}</a>;

        switch (notificationTypeKey) {
            case 'NewCommentOnMyArticle':
                return <span>{handleUrl} {notification.content.isReply ? <b>replied</b> : <b>commented</b>} on your article "{articleUrl}"</span>;
            case 'NewCommentOnFollowedArticle':
                return <span>{handleUrl} {notification.content.isReply ? <b>replied</b> : <b>commented</b>}  on "<a>{articleUrl}</a>"</span>;
            case 'NewArticleByFollowedWriter':
                return <span>{authorHandleUrl} posted a <b>new article</b>: "{articleUrl}"</span>;
            case 'NewArticleByFollowedTag':
                return <span>{tagHandleUrl} posted a <b>new article</b>: "{articleUrl}"</span>;
            case 'NewFollower':
                return <span>{handleUrl} is now <b>following</b> you. Well done!</span>;
            case 'TipReceived':
                return <span>Excellent! {handleUrl} has <b>applauded</b> +{notification.content.tipAmount} {notification.content.token} on "{articleUrl}"</span>;
            case 'PremiumArticleSold':
                return <span>K-ching! {handleUrl} bought an <b>NFT access</b> key for your article "{articleUrl}"</span>;
            default:
                return 'You have a new notification!';
        }
    }




    return (
        <aside className={`notifications-sidebar ${isOpen ? 'open' : ''}`} style={darkTheme ? { background: darkOptionsAndColors.background } : {}}>
            <div className='exit-icon' onClick={closeSidebar}>
                <img src={darkTheme ? icons.EXIT_NOTIFICATIONS_DARK : icons.EXIT_NOTIFICATIONS} alt="Close Notifications sidebar" />
            </div>

            <div className='notification-sidebar-header'>
                <h2>NOTIFICATIONS ({notifications?.length} NEW)</h2>
                <div className="header-right">
                    <div className={`notification-bell ${currentView === 'notifications' ? 'selected' : ''}`} onClick={handleNotificationsClick}>
                        <img src={darkTheme ? icons.NOTIFICATION_BELL_DARK : icons.NOTIFICATION_BELL} alt="Notifications" />
                    </div>

                    <div className={`settings-icon ${currentView === 'settings' ? 'selected' : ''}`} onClick={handleSettingsClick}>
                        <img src={darkTheme ? icons.SETTINGS_DARK : icons.SETTINGS} alt="Settings" />
                    </div>

                </div>
            </div>
            {currentView === 'settings' ? (
                <div className="notification-settings" style={darkTheme ? { background: darkOptionsAndColors.background } : {}}>
                    <div className={`notification-settings-content ${darkTheme ? "dark" : ""}`}>
                        <p>Please activate or de-activate the notifications of your choice:</p>
                        <div className="toggle-row">
                            <label className={`${darkTheme ? "dark" : ""}`}>Comments / Replies</label>
                            <Toggle toggled={commentsReplies} callBack={() => setCommentsReplies(!commentsReplies)} />
                        </div>
                        <div className="toggle-row">
                            <label className={`${darkTheme ? "dark" : ""}`}>Applause for me</label>
                            <Toggle toggled={applauseForMe} callBack={() => setApplauseForMe(!applauseForMe)} />
                        </div>
                        <div className="toggle-row">
                            <label className={`${darkTheme ? "dark" : ""}`}>New article from author I follow</label>
                            <Toggle toggled={newArticleByAuthor} callBack={() => setNewArticleByAuthor(!newArticleByAuthor)} />
                        </div>
                        <div className="toggle-row">
                            <label className={`${darkTheme ? "dark" : ""}`}>New article on Topic I follow</label>
                            <Toggle toggled={newArticleOnTopic} callBack={() => setNewArticleOnTopic(!newArticleOnTopic)} />
                        </div>
                        <div className="toggle-row">
                            <label className={`${darkTheme ? "dark" : ""}`}>New follower</label>
                            <Toggle toggled={newFollower} callBack={() => setNewFollower(!newFollower)} />
                        </div>
                    </div>
                    <button className={`save-notification-settings ${darkTheme ? "dark" : ""}`} onClick={saveNotificationSettings}>
                        Save Notification settings
                    </button>
                </div>


            ) : (
                <ul>
                    {notifications.map((notification) => (
                        <li key={notification.id} className={`notification ${darkTheme ? 'dark' : ''} ${notification.read ? 'read' : ''} ${selectedNotificationId === notification.id ? 'selected' : ''}`} onClick={() => handleNotificationClick(notification)}>
                            <div className="notification-details">
                                <div className='notification-top-row'>
                                    <div className='notification-icon'>
                                        {notification.read ? "" :
                                            <img src={darkTheme ? icons.NOTIFICATION_BELL_DARK : icons.NOTIFICATION_BELL} alt="Notification" />
                                        }
                                    </div>
                                    <span className="notification-timestamp">{timeAgo(new Date(parseInt(notification.timestamp) / (1000000)))}</span>
                                </div>
                                <span className={`notification-action ${notification.read ? 'read' : ''}`}>{formatNotificationMessage(notification)}</span>
                            </div>
                        </li>
                    ))}
                    <button className={`load-more ${darkTheme ? "dark" : ""}`}>Load more</button>
                </ul>
            )}

        </aside>
    );
};

export default NotificationsSidebar;