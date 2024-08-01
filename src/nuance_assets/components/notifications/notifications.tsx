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
import { NotificationsExtended } from '../../../../src/declarations/User/User.did';
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
  const handleNotificationClick = (notification: NotificationsExtended) => {
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

  // Type guards
  function isTipReceived(content: NotificationContent): content is { TipRecievedNotificationContent: any } {

    return 'TipRecievedNotificationContent' in content;
  }

  function isNewFollower(content: NotificationContent): content is { NewFollowerNotificationContent: any } {
    return 'NewFollowerNotificationContent' in content;
  }

  function isAuthorExpiredSubscription(content: NotificationContent): content is { AuthorExpiredSubscriptionNotificationContent: any } {
    return 'AuthorExpiredSubscriptionNotificationContent' in content;
  }

  function isNewArticle(content: NotificationContent): content is { NewArticleNotificationContent: any } {
    return 'NewArticleNotificationContent' in content;
  }

  function isPost(content: NotificationContent): content is { PostNotificationContent: any } {
    return 'PostNotificationContent' in content;
  }

  function isAuthorLosesSubscriber(content: NotificationContent): content is { AuthorLosesSubscriberNotificationContent: any } {
    return 'AuthorLosesSubscriberNotificationContent' in content;
  }

  function isFaucetClaimAvailable(content: NotificationContent): content is { FaucetClaimAvailableNotificationContent: any } {
    return 'FaucetClaimAvailableNotificationContent' in content;
  }

  function isYouUnsubscribedFromAuthor(content: NotificationContent): content is { YouUnsubscribedFromAuthorNotificationContent: any } {
    return 'YouUnsubscribedFromAuthorNotificationContent' in content;
  }

  function isAuthorGainsNewSubscriber(content: NotificationContent): content is { AuthorGainsNewSubscriberNotificationContent: any } {
    return 'AuthorGainsNewSubscriberNotificationContent' in content;
  }

  function isYouSubscribedToAuthor(content: NotificationContent): content is { YouSubscribedToAuthorNotificationContent: any } {
    return 'YouSubscribedToAuthorNotificationContent' in content;
  }

  function isNewCommentOnFollowedArticle(content: NotificationContent): content is { CommentNotificationContent: any } {
    return 'CommentNotificationContent' in content;
  }

  function isPremiumArticleSold(content: NotificationContent): content is { PremiumArticleSoldNotificationContent: any } {
    return 'PremiumArticleSoldNotificationContent' in content;
  }

  function isReaderExpiredSubscription(content: NotificationContent): content is { ReaderExpiredSubscriptionNotificationContent: any } {
    return 'ReaderExpiredSubscriptionNotificationContent' in content;
  }

  function handleUrl(handle: string, isPublication: boolean = false) {
    return (
      <a href={`/${isPublication ? "publication" : "user"}/${handle}`}>@{handle} </a>
    );
  }

  function tagHandleUrl(handle: string) {
    return (
      <a href={`/${handle}`}>@{handle} </a>
    );
  }

  function authorHandleUrl(handle: string, isPublication: boolean = false) {
    return (
      <a href={`/${isPublication ? "publication" : "user"}/${handle}`}>@{handle} </a>
    );
  }

  function articleUrl(url: string, title: string) {
    return (
      <a href={`${url}`}>{title}</a>
    );
  }

  function formatNotificationMessage(notification: NotificationsExtended) {
    const notificationTypeKey = getNotificationTypeKey(notification.notificationType);

    if (isTipReceived(notification.content)) {
      const content = notification.content.TipRecievedNotificationContent;
      const senderHandle = notification.senderHandle;
      return (
        <span>
          Excellent! {handleUrl(senderHandle!, content.recieverIsPublication)} has <b>applauded</b> +
          {content.tipAmount} {content.token} on "{articleUrl(content.postUrl, content.articleTitle)}"
        </span>
      );
    } else if (isNewFollower(notification.content)) {
      const content = notification.content.NewFollowerNotificationContent;
      const senderHandle = notification.senderHandle
      return (
        <span>
          {handleUrl(senderHandle!)} is now <b>following</b> you. Well done!
        </span>
      );
    } else if (isNewArticle(notification.content)) {
      const content = notification.content.NewArticleNotificationContent;
      const senderHandle = notification.senderHandle;
      return (
        <span>
          {authorHandleUrl(senderHandle!, content.isAuthorPublication)} posted a <b>new article</b>: "{articleUrl(content.url, content.articleTitle)}"
        </span>
      );
    } else if (isPost(notification.content)) {
      const content = notification.content.PostNotificationContent;
      const senderHandle = notification.senderHandle;
      return (
        <span>
          {authorHandleUrl(senderHandle!, content.isAuthorPublication)} posted a <b>new article</b>: "{articleUrl(content.url, content.articleTitle)}"
        </span>
      );
    } else if (isAuthorLosesSubscriber(notification.content)) {
      const content = notification.content.AuthorLosesSubscriberNotificationContent;
      const senderHandle = notification.senderHandle;
      const receiverHandle = notification.receiverHandle;
      return (
        <span>
          {content.time} - {handleUrl(senderHandle!)} has unsubscribed from {authorHandleUrl(receiverHandle!)}.
        </span>
      );
    } else if (isFaucetClaimAvailable(notification.content)) {
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
    } else if (isYouUnsubscribedFromAuthor(notification.content)) {
      const content = notification.content.YouUnsubscribedFromAuthorNotificationContent;
      const authorHandle = notification.senderHandle;
      return (
        <span>
          {content.time} - You have unsubscribed from <b className='subscription-notification-text' onClick={handleSubscriptionClick}>{authorHandle!}</b>.
        </span>
      );
    } else if (isAuthorGainsNewSubscriber(notification.content)) {
      const content = notification.content.AuthorGainsNewSubscriberNotificationContent;
      const senderHandle = notification.senderHandle;
      return (
        <span>
          🎉 You have a <b className='subscription-notification-text' onClick={handleSubscriberClick}>new subscriber</b>!
        </span>
      );
    } else if (isYouSubscribedToAuthor(notification.content)) {
      const content = notification.content.YouSubscribedToAuthorNotificationContent;
      const authorHandle = notification.senderHandle;
      return (
        <span>
          You <b className='subscription-notification-text' onClick={handleSubscriptionClick}>subscribed</b> to a writer. Enjoy!
        </span>
      );
    } else if (isNewCommentOnFollowedArticle(notification.content)) {
      const content = notification.content.CommentNotificationContent;
      const senderHandle = notification.senderHandle;
      return (
        <span>
          {handleUrl(senderHandle!, content.isAuthorPublication)} {content.isReply ? <b>replied</b> : <b>commented</b>} on "{articleUrl(content.url, content.articleTitle)}"
        </span>
      );
    } else if (isPremiumArticleSold(notification.content)) {
      const content = notification.content.PremiumArticleSoldNotificationContent;
      const senderHandle = notification.senderHandle;
      return (
        <span>
          K-ching! {handleUrl(senderHandle!, content.isAuthorPublication)} bought an <b>NFT access</b> key for your article "{articleUrl(content.url, content.articleTitle)}"
        </span>
      );
    } else if (isReaderExpiredSubscription(notification.content)) {
      const content = notification.content.ReaderExpiredSubscriptionNotificationContent;
      const authorHandle = notification.senderHandle;
      return (
        <span>
          Your subscription to <b className='subscription-notification-text' onClick={handleSubscriptionClick}>{authorHandle!}</b> has expired.
          <Button
            styleType={darkTheme ? 'primary-blue-dark' : 'primary-blue'}
            onClick={() =>
              handleResubscription(authorHandle ? authorHandle : '')
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
    } else {
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
