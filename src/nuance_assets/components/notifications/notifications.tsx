import React, { useEffect, useContext, useRef, useCallback } from 'react';
import { useState } from 'react';
import './_notifications.scss';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme, useThemeUpdate } from '../../contextes/ThemeContext';
import { Context } from '../../../nuance_assets/contextes/ModalContext';
import { timeAgo } from '../../../nuance_assets/shared/utils';
import {
  Notifications,
  NotificationContent,
  NotificationType,
} from '../../../../src/declarations/Notifications/Notifications.did';
import { icons } from '../../shared/constants';
import Toggle from '../../../nuance_assets/UI/toggle/toggle';
import { colors } from '../../shared/constants';
import Button from '../../UI/Button/Button';
import { get } from 'lodash';

type NotificationsSidebarProps = {};

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
  const [premiumArticleSold, setPremiumArticleSold] = useState(true);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);

  const saveNotificationSettings = () => {
    setIsSettingsSaving(true);
    const settings = {
      newCommentOnMyArticle: commentsReplies,
      newCommentOnFollowedArticle: commentsReplies,
      newArticleByFollowedWriter: newArticleByAuthor,
      newArticleByFollowedTag: newArticleOnTopic,
      newFollower: newFollower,
      tipReceived: applauseForMe,
      premiumArticleSold: premiumArticleSold,
      authorGainsNewSubscriber: false,
      authorLosesSubscriber: false,
      youSubscribedToAuthor: false,
      youUnsubscribedFromAuthor: false,
      authorExpiredSubscription: false,
      readerExpiredSubscription: false,
      expiredSubscription: false,
      faucetClaimAvailable: false,
    };

    try {
      updateUserNotificationSettings(settings).then(() => {
        setIsSettingsSaving(false);
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setIsSettingsSaving(false);
    }
  };

  const {
    user,
    getUserNotifications,
    markNotificationAsRead,
    notifications,
    resetUnreadNotificationCount,
    unreadNotificationCount,
    loadMoreNotifications,
    totalNotificationCount,
    markAllNotificationsAsRead,
    updateUserNotificationSettings,
    getUserNotificationSettings,
  } = useUserStore((state) => ({
    user: state.user,
    getUserNotifications: state.getUserNotifications,
    markNotificationAsRead: state.markNotificationAsRead,
    markAllNotificationsAsRead: state.markAllNotificationsAsRead,
    notifications: state.notifications || [],
    unreadNotificationCount: state.unreadNotificationCount,
    resetUnreadNotificationCount: state.resetUnreadNotificationCount,
    loadMoreNotifications: state.loadMoreNotifications,
    totalNotificationCount: state.totalNotificationCount,
    updateUserNotificationSettings: state.updateUserNotificationSettings,
    getUserNotificationSettings: state.getUserNotificationSettings,
  }));

  const { isLoggedIn } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
  }));

  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null);
  const [currentView, setCurrentView] = useState('notifications'); // 'notifications' or 'settings'

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const modalContext = useContext(Context);

  // Load more notifications
  const [currentFrom, setCurrentFrom] = useState(0);
  const [currentTo, setCurrentTo] = useState(9);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMore = () => {
    if (!isLoadingMore) {
      setIsLoadingMore(true);

      // Calculate new indices
      const newFrom = currentTo + 1;
      const newTo = currentTo + 10; // Load next 10 notifications

      // Fetch more notifications
      loadMoreNotifications(newFrom, newTo)
        .then(() => {
          // Update state based on successful fetch
          setCurrentFrom(newFrom);
          setCurrentTo(newTo);
          setIsLoadingMore(false);
        })
        .catch((error) => {
          console.error('Error loading more notifications:', error);
          setIsLoadingMore(false);
        });
    }
  };

  useEffect(() => {
    const fetchNotifications = () => {
      if (
        isLoggedIn &&
        !isSidebarOpen &&
        !modalContext?.isSidebarOpen &&
        user
      ) {
        getUserNotifications(0, currentTo, isLoggedIn);
      }
    };

    fetchNotifications();

    const intervalId = setInterval(fetchNotifications, 30000);

    return () => clearInterval(intervalId);
  }, [isLoggedIn, isSidebarOpen, modalContext?.isSidebarOpen, user]);

  //get user notification settings
  async function populateUserNotificationSettings() {
    if (isLoggedIn) {

      const settings = await getUserNotificationSettings();
      try {
        setCommentsReplies(get(settings, 'newCommentOnMyArticle', true));
        setApplauseForMe(get(settings, 'tipReceived', true));
        setNewArticleByAuthor(get(settings, 'newArticleByFollowedWriter', true));
        setNewArticleOnTopic(get(settings, 'newArticleByFollowedTag', true));
        setNewFollower(get(settings, 'newFollower', true));
        setPremiumArticleSold(get(settings, 'premiumArticleSold', true));
      } catch (error) {
        console.error('Error populating user notification settings:', error);
      }
    }
  }


  useEffect(() => {
    if (user) {
      //initial settings, on login/load
      populateUserNotificationSettings();
    }
  }, [user]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);

    //toggle notification modal
    if (
      modalContext?.isModalOpen &&
      modalContext.modalType === 'Notifications'
    ) {
      modalContext.closeModal();
      //mark all notifications as read
      markAllNotificationsAsRead();
    } else {
      modalContext?.openModal('Notifications');
    }
    setCurrentFrom(0);
    setCurrentTo(9);
  };

  //when context changes, reset load more
  useEffect(() => {
    setCurrentFrom(0);
    setCurrentTo(9);
  }, [modalContext]);

  const handleSettingsClick = () => {
    setCurrentView((currentView) =>
      currentView === 'settings' ? 'notifications' : 'settings'
    );
  };

  const handleNotificationsClick = () => {
    setCurrentView('notifications');
  };

  //mark notification as read
  const handleNotificationClick = (notification: Notifications) => {
    setSelectedNotificationId(notification.id);

    if (!notification.read) {
      markNotificationAsRead([notification.id])
        .then(() => {
          getUserNotifications(0, currentTo, isLoggedIn);
          console.log(`Notification ${notification.id} marked as read`);
        })
        .catch((error) => {
          console.error(`Error marking notification as read: ${error}`);
        });
    }
  };

  const handleSubscriptionClick = () => {
    window.location.href = '/my-profile/subscriptions';
  };
  const handleSubscriberClick = () => {
    window.location.href = '/my-profile/subscribers';
  }

  function getNotificationTypeKey(notificationType: NotificationType): string {
    return Object.keys(notificationType)[0];
  }

  function handleResubscription(handle: string) {
    modalContext?.openModal('Subscription');
    window.history.pushState({}, '', `/user/${handle}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  function formatNotificationMessage(notification: Notifications) {
    const notificationTypeKey = getNotificationTypeKey(
      notification.notificationType
    );
    let handleUrl = (
      <a href={`/user/${notification?.content.senderHandle}`}>
        @{notification.content.senderHandle}{' '}
      </a>
    );
    let tagHandleUrl = (
      <a href={`/${notification?.content.authorHandle}`}>
        @{notification.content.authorHandle}{' '}
      </a>
    );
    let authorHandleUrl = (
      <a href={`/user/${notification?.content.authorHandle}`}>
        @{notification.content.authorHandle}{' '}
      </a>
    );
    let articleUrl = (
      <a href={`${notification?.content.url}`}>
        {notification?.content.articleTitle}
      </a>
    );

    switch (notificationTypeKey) {
      case 'NewCommentOnMyArticle':
        return (
          <span>
            {handleUrl}{' '}
            {notification.content.isReply ? <b>replied</b> : <b>commented</b>}{' '}
            on your article "{articleUrl}"
          </span>
        );
      case 'NewCommentOnFollowedArticle':
        return (
          <span>
            {handleUrl}{' '}
            {notification.content.isReply ? <b>replied</b> : <b>commented</b>}{' '}
            on "<a>{articleUrl}</a>"
          </span>
        );
      case 'NewArticleByFollowedWriter':
        return (
          <span>
            {authorHandleUrl} posted a <b>new article</b>: "{articleUrl}"
          </span>
        );
      case 'NewArticleByFollowedTag':
        return (
          <span>
            {tagHandleUrl} posted a <b>new article</b>: "{articleUrl}"
          </span>
        );
      case 'NewFollower':
        return (
          <span>
            {handleUrl} is now <b>following</b> you. Well done!
          </span>
        );
      case 'TipReceived':
        return (
          <span>
            Excellent! {handleUrl} has <b>applauded</b> +
            {notification.content.tipAmount} {notification.content.token} on "
            {articleUrl}"
          </span>
        );
      case 'PremiumArticleSold':
        return (
          <span>
            K-ching!{' '}
            {notification.content.senderHandle != '' ? handleUrl : 'Someone'}{' '}
            bought an <b>NFT access</b> key for your article "{articleUrl}"
          </span>
        );
      case 'AuthorGainsNewSubscriber':
        return (

          <span>
            🎉 You have a <b className='subscription-notification-text' onClick={handleSubscriberClick}>new subscriber</b>!
          </span>
        );
      case 'YouSubscribedToAuthor':
        return (

          <span>
            You <b className='subscription-notification-text' onClick={handleSubscriptionClick}>subscribed</b> to a writer. Enjoy!
          </span>
        );
      case 'readerExpiredSubscription':
        return (
          <span>
            Your subscription to {authorHandleUrl} has expired.
            <Button
              styleType={darkTheme ? 'primary-blue-dark' : 'primary-blue'}
              onClick={() =>
                handleResubscription(notification.content.authorHandle)
              }
              loading={false}
              dark={darkTheme}
              style={{
                display: 'flex',
                flexDirection: 'row-reverse',
                marginTop: '10px',
                float: 'right',
              }}
            >
              Extend now
            </Button>
          </span>
        );
      case 'FaucetClaimAvailable':
        return (
          <span>
            You are allowed to request new Free NUA refill up to a total of 50
            Free NUA in your wallet!
            <Button
              styleType={darkTheme ? 'primary-blue-dark' : 'primary-blue'}
              onClick={() => {
                window.location.pathname = '/my-profile/wallet';
              }}
              loading={false}
              dark={darkTheme}
              style={{
                display: 'flex',
                flexDirection: 'row-reverse',
                marginTop: '10px',
                float: 'right',
              }}
            >
              Request Free NUA
            </Button>
          </span>
        );
      default:
        return 'You have a new notification!';
    }
  }

  return (
    <aside
      ref={sidebarRef}
      className={`notifications-sidebar ${modalContext?.isSidebarOpen ? 'open' : ''
        }`}
      style={darkTheme ? { background: darkOptionsAndColors.background } : {}}
    >
      <div className='exit-icon' onClick={toggleSidebar}>
        <img
          src={
            darkTheme ? icons.EXIT_NOTIFICATIONS_DARK : icons.EXIT_NOTIFICATIONS
          }
          alt='Close Notifications sidebar'
        />
      </div>

      <div className='notification-sidebar-header'>
        <h2>NOTIFICATIONS ({unreadNotificationCount} NEW)</h2>
        <div className='header-right'>
          <div
            className={`notification-bell ${currentView === 'notifications' ? 'selected' : ''
              }`}
            onClick={handleNotificationsClick}
          >
            <img
              src={
                darkTheme
                  ? icons.NOTIFICATION_BELL_DARK
                  : icons.NOTIFICATION_BELL
              }
              alt='Notifications'
            />
          </div>

          <div
            className={`settings-icon ${currentView === 'settings' ? 'selected' : ''
              }`}
            onClick={handleSettingsClick}
          >
            <img
              src={darkTheme ? icons.SETTINGS_DARK : icons.SETTINGS}
              alt='Settings'
            />
          </div>
        </div>
      </div>
      {currentView === 'settings' ? (
        <div
          className='notification-settings'
          style={
            darkTheme ? { background: darkOptionsAndColors.background } : {}
          }
        >
          <div
            className={`notification-settings-content ${darkTheme ? 'dark' : ''
              }`}
          >
            <p>
              Please activate or de-activate the notifications of your choice:
            </p>
            <div className='toggle-row'>
              <label className={`${darkTheme ? 'dark' : ''}`}>
                Comments / Replies
              </label>
              <Toggle
                toggled={commentsReplies}
                callBack={() => setCommentsReplies(!commentsReplies)}
              />
            </div>
            <div className='toggle-row'>
              <label className={`${darkTheme ? 'dark' : ''}`}>
                Applause for me
              </label>
              <Toggle
                toggled={applauseForMe}
                callBack={() => setApplauseForMe(!applauseForMe)}
              />
            </div>
            <div className='toggle-row'>
              <label className={`${darkTheme ? 'dark' : ''}`}>
                New article from author I follow
              </label>
              <Toggle
                toggled={newArticleByAuthor}
                callBack={() => setNewArticleByAuthor(!newArticleByAuthor)}
              />
            </div>
            <div className='toggle-row'>
              <label className={`${darkTheme ? 'dark' : ''}`}>
                New article on Topic I follow
              </label>
              <Toggle
                toggled={newArticleOnTopic}
                callBack={() => setNewArticleOnTopic(!newArticleOnTopic)}
              />
            </div>
            <div className='toggle-row'>
              <label className={`${darkTheme ? 'dark' : ''}`}>
                New follower
              </label>
              <Toggle
                toggled={newFollower}
                callBack={() => setNewFollower(!newFollower)}
              />
            </div>
            <div className='toggle-row'>
              <label className={`${darkTheme ? 'dark' : ''}`}>
                Premium Article Sold
              </label>
              <Toggle
                toggled={premiumArticleSold}
                callBack={() => setPremiumArticleSold(!premiumArticleSold)}
              />
            </div>
          </div>
          <Button
            styleType={darkTheme ? 'primary-blue-dark' : 'primary-blue'}
            onClick={saveNotificationSettings}
            loading={isSettingsSaving}
            dark={darkTheme}
            style={{
              width: '272px',
              marginTop: '40px',
              display: 'flex',
              flexDirection: 'row-reverse',
            }}
          >
            Save Notification settings
          </Button>
        </div>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`notification ${darkTheme ? 'dark' : ''} ${notification.read ? 'read' : ''
                } ${selectedNotificationId === notification.id ? 'selected' : ''
                }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className='notification-details'>
                <div className='notification-top-row'>
                  <div className='notification-icon'>
                    {notification.read ? (
                      ''
                    ) : (
                      <img
                        src={
                          darkTheme
                            ? icons.NOTIFICATION_BELL_DARK
                            : icons.NOTIFICATION_BELL
                        }
                        alt='Notification'
                      />
                    )}
                  </div>
                  <span className='notification-timestamp'>
                    {timeAgo(
                      new Date(parseInt(notification.timestamp) / 1000000)
                    )}
                  </span>
                </div>
                <span
                  className={`notification-action ${notification.read ? 'read' : ''
                    }`}
                >
                  {formatNotificationMessage(notification)}
                </span>
              </div>
            </li>
          ))}
          {notifications.length < totalNotificationCount && (
            <Button
              styleType={'load-more'}
              onClick={loadMore}
              loading={isLoadingMore}
              primaryColor={colors.accentColor}
              dark={darkTheme}
              disabled={isLoadingMore}
            >
              Load More
            </Button>
          )}
        </ul>
      )}
    </aside>
  );
};

export default NotificationsSidebar;
