import React, { useEffect, useContext, useRef, useCallback } from 'react';
import { useState } from 'react';
import './_notifications.scss';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme, useThemeUpdate } from '../../contextes/ThemeContext';
import { Context } from '../../../nuance_assets/contextes/ModalContext';
import {
  convertSubscriptionTimeInterval,
  textToUrlSegment,
  timeAgo,
} from '../../../nuance_assets/shared/utils';
import {
  Notification,
  NotificationContent,
  UserNotificationSettings,
} from '../../../../src/declarations/Notifications/Notifications.did';
import { icons } from '../../shared/constants';
import Toggle from '../../../nuance_assets/UI/toggle/toggle';
import { colors } from '../../shared/constants';
import Button from '../../UI/Button/Button';
import { get } from 'lodash';
import { UserListItem } from 'src/nuance_assets/types/types';
import { NavigateFunction } from 'react-router-dom';
type NotificationsSidebarProps = {
  navigate: NavigateFunction;
};

const NotificationsSidebar: React.FC<NotificationsSidebarProps> = ({
  navigate,
}) => {
  const darkTheme = useTheme();
  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
  };
  const {
    user,
    getUserNotifications,
    markNotificationsAsRead,
    notifications,
    notificationsUserListItems,
    unreadNotificationCount,
    totalNotificationCount,
    markAllNotificationsAsRead,
    updateUserNotificationSettings,
    getUserNotificationSettings,
  } = useUserStore((state) => ({
    user: state.user,
    getUserNotifications: state.getUserNotifications,
    markNotificationsAsRead: state.markNotificationsAsRead,
    markAllNotificationsAsRead: state.markAllNotificationsAsRead,
    notifications: state.notifications || [],
    notificationsUserListItems: state.notificationUserListItems,
    unreadNotificationCount: state.unreadNotificationCount,
    totalNotificationCount: state.totalNotificationCount,
    updateUserNotificationSettings: state.updateUserNotificationSettings,
    getUserNotificationSettings: state.getUserNotificationSettings,
  }));

  const [currentView, setCurrentView] = useState('notifications'); // 'notifications' or 'settings'

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const modalContext = useContext(Context);

  //user notification settings
  const [notificationSettings, setNotificationSettings] =
    useState<UserNotificationSettings>();
  const [savingNotificationSettings, setSavingNotificationSettings] =
    useState(false);

  // Load more notifications
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // close modal when clicked outside
  const handleClickOutside = (e: MouseEvent) => {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
      setIsSidebarOpen(false);
      modalContext?.closeModal();
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };

  console.log("TOTAL COUNT: ", totalNotificationCount);

  // event listener to close the sidebar when clicked outside
  useEffect(() => {
    if (
      modalContext?.isModalOpen &&
      modalContext.modalType === 'Notifications'
    ) {
      document.body.classList.add('arrow-cursor');
      document.addEventListener('click', handleClickOutside, true);
    } else {
      document.body.classList.remove('arrow-cursor');
      document.removeEventListener('click', handleClickOutside, true);
    }

    return () => {
      document.body.classList.remove('arrow-cursor');
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [modalContext]);

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
  };

  const handleSettingsClick = () => {
    setCurrentView((currentView) =>
      currentView === 'settings' ? 'notifications' : 'settings'
    );
  };

  const handleNotificationsClick = () => {
    setCurrentView('notifications');
  };

  const firstLoad = async () => {
    setIsLoading(true);
    const [_, userNotificationSettings] = await Promise.all([
      getUserNotifications(0, 20, navigate),
      getUserNotificationSettings(),
    ]);
    if (userNotificationSettings) {
      setNotificationSettings(userNotificationSettings);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    firstLoad();
  }, []);
  const getUserListItemFromPrincipal = (principal: string) => {
    let listItem = notificationsUserListItems.find((userListItem) => {
      return userListItem.principal === principal;
    });
    return listItem;
  };

  const formatNotificationMessage = (notification: Notification) => {
    if (notificationsUserListItems.length === 0) {
      return;
    }
    let notificationContent = notification.content;
    if ('FaucetClaimAvailable' in notificationContent) {
      return (
        <span>
          You are allowed to request new Free NUA refill up to a total of 50
          Free NUA in your wallet!
          <Button
            className={{
              dark: 'notifications-white-button',
              light: 'notifications-navy-button',
            }}
            styleType={{ dark: 'white', light: 'navy' }}
            onClick={() => {
              navigate('/my-profile/wallet');
            }}
            loading={false}
          >
            Request Free NUA
          </Button>
        </span>
      );
    } else if ('VerifyProfile' in notificationContent) {
      return (
        <span>
          Your profile is not verified. You can verify yourself on your profile
          page.
          <Button
            className={{
              dark: 'notifications-white-button',
              light: 'notifications-navy-button',
            }}
            styleType={{ dark: 'white', light: 'navy' }}
            onClick={() => {
              navigate('/my-profile');
            }}
            loading={false}
          >
            Verify Profile
          </Button>
        </span>
      );
    } else if ('TipReceived' in notificationContent) {
      let content = notificationContent.TipReceived;
      //post related fields
      let postOwnerHandle = content.publicationPrincipalId[0]
        ? getUserListItemFromPrincipal(content.publicationPrincipalId[0])
            ?.handle
        : getUserListItemFromPrincipal(
            notification.notificationReceiverPrincipalId
          )?.handle;
      let postUrl = `/${postOwnerHandle}/${content.postId}-${
        content.bucketCanisterId
      }/${textToUrlSegment(content.postTitle)}`;
      //tipper related fields
      let tipSenderPrincipal = content.tipSenderPrincipal;
      let tipSenderHandle =
        getUserListItemFromPrincipal(tipSenderPrincipal)?.handle;

      return (
        <span>
          Excellent!{' '}
          <span
            onClick={() => {
              navigate('/user/' + tipSenderHandle);
            }}
            className='link'
          >
            {tipSenderHandle}
          </span>{' '}
          <span className='bold'>applauded</span> +
          {(Number(content.numberOfApplauds) / Math.pow(10, 8)).toFixed(0)}{' '}
          using {content.tippedTokenSymbol} on "
          <span
            onClick={() => {
              navigate(postUrl);
            }}
            className='link'
          >
            {content.postTitle.slice(0, 20)}
            {content.postTitle.length > 20 && '...'}
          </span>
          "
        </span>
      );
    } else if ('NewArticleByFollowedWriter' in notificationContent) {
      let content = notificationContent.NewArticleByFollowedWriter;
      let postWriterHandle =
        getUserListItemFromPrincipal(content.postWriterPrincipal)?.handle ||
        content.postWriterPrincipal;
      let postUrl = `/${postWriterHandle}/${content.postId}-${
        content.bucketCanisterId
      }/${textToUrlSegment(content.postTitle)}`;
      return (
        <span>
          <span
            onClick={() => {
              navigate('/user/' + postWriterHandle);
            }}
            className='link'
          >
            {postWriterHandle}
          </span>{' '}
          posted a <span className='bold'>new article: </span>"
          <span
            onClick={() => {
              navigate(postUrl);
            }}
            className='link'
          >
            {content.postTitle}
          </span>
          "
        </span>
      );
    } else if ('AuthorLosesSubscriber' in notificationContent) {
      let content = notificationContent.AuthorLosesSubscriber;
      let subscriberPrincipal = content.subscriberPrincipalId;
      let subscriberHandle =
        getUserListItemFromPrincipal(subscriberPrincipal)?.handle;
      let subscriptionTimeInterval = convertSubscriptionTimeInterval(
        content.subscriptionTimeInterval
      );
      return (
        <span>
          <span
            onClick={() => {
              navigate('/user/' + subscriberHandle);
            }}
            className='link'
          >
            {subscriberHandle}
          </span>{' '}
          has cancelled the {subscriptionTimeInterval} subscription to your
          account.
        </span>
      );
    } else if ('YouSubscribedToAuthor' in notificationContent) {
      let content = notificationContent.YouSubscribedToAuthor;
      let subscribedAccountPrincipal = content.subscribedWriterPrincipalId;
      let subscribedAccountHandle = getUserListItemFromPrincipal(
        subscribedAccountPrincipal
      )?.handle;
      let subscriptionTimeInterval = convertSubscriptionTimeInterval(
        content.subscriptionTimeInterval
      );
      return (
        <span>
          You <span className='bold'>subscribed</span> to the{' '}
          {content.isPublication ? 'publication ' : 'account '}{' '}
          {
            <span
              onClick={() => {
                if (content.isPublication) {
                  navigate('/publication/' + subscribedAccountHandle);
                } else {
                  navigate('/user/' + subscribedAccountHandle);
                }
              }}
              className='link'
            >
              {subscribedAccountHandle}
            </span>
          }{' '}
          ({subscriptionTimeInterval})
        </span>
      );
    } else if ('NewCommentOnMyArticle' in notificationContent) {
      let content = notificationContent.NewCommentOnMyArticle;
      let postOwnerHandle = getUserListItemFromPrincipal(
        notification.notificationReceiverPrincipalId
      )?.handle;
      let postUrl = `/${postOwnerHandle}/${content.postId}-${
        content.bucketCanisterId
      }/${textToUrlSegment(content.postTitle)}?comment=${content.commentId}`;
      let isReply = content.isReply;
      let commenterPrincipal = content.commenterPrincipal;
      let commenterHandle =
        getUserListItemFromPrincipal(commenterPrincipal)?.handle;
      let commentContent = content.commentContent;
      return (
        <span>
          <span
            onClick={() => {
              navigate('/user/' + commenterHandle);
            }}
            className='link'
          >
            {commenterHandle}
          </span>{' '}
          has{' '}
          <span className='bold'>
            {isReply ? 'added a reply ' : 'commented'}
          </span>{' '}
          on your article: "
          <span
            onClick={() => {
              navigate(postUrl);
            }}
            className='link'
          >
            {content.postTitle.slice(0, 20)}
            {content.postTitle.length > 20 && '...'}
          </span>
          "
        </span>
      );
    } else if ('YouUnsubscribedFromAuthor' in notificationContent) {
      let content = notificationContent.YouUnsubscribedFromAuthor;
      let subscribedAccountPrincipal = content.subscribedWriterPrincipalId;
      let subscribedAccountHandle = getUserListItemFromPrincipal(
        subscribedAccountPrincipal
      )?.handle;
      let subscriptionTimeInterval = convertSubscriptionTimeInterval(
        content.subscriptionTimeInterval
      );
      return (
        <span>
          You <span className='bold'>unsubscribed</span> from the{' '}
          {content.isPublication ? 'publication ' : 'account '}{' '}
          {
            <span
              onClick={() => {
                if (content.isPublication) {
                  navigate('/publication/' + subscribedAccountHandle);
                } else {
                  navigate('/user/' + subscribedAccountHandle);
                }
              }}
              className='link'
            >
              {subscribedAccountHandle}
            </span>
          }{' '}
          ({subscriptionTimeInterval})
        </span>
      );
    } else if ('NewFollower' in notificationContent) {
      let content = notificationContent.NewFollower;
      let followerPrincipal = content.followerPrincipalId;
      let followerHandle =
        getUserListItemFromPrincipal(followerPrincipal)?.handle;
      return (
        <span>
          <span
            onClick={() => {
              navigate('/user/' + followerHandle);
            }}
            className=''
          >
            {followerHandle}
          </span>{' '}
          is now <span className='bold'>following</span> you. Well done!
        </span>
      );
    } else if ('ReaderExpiredSubscription' in notificationContent) {
      let content = notificationContent.ReaderExpiredSubscription;
      let subscribedPrincipalId = content.subscribedWriterPrincipalId;
      let subscribedHandle = getUserListItemFromPrincipal(
        subscribedPrincipalId
      )?.handle;
      return (
        <span>
          Your{' '}
          {convertSubscriptionTimeInterval(content.subscriptionTimeInterval)}{' '}
          subscription to the account{' '}
          <span
            onClick={() => {
              if (content.isPublication) {
                navigate('/publication/' + subscribedHandle);
              } else {
                navigate('/user/' + subscribedHandle);
              }
            }}
            className='link'
          >
            {subscribedHandle}
          </span>{' '}
          has <span className='bold'>expired</span>!
        </span>
      );
    } else if ('ReplyToMyComment' in notificationContent) {
      let content = notificationContent.ReplyToMyComment;
      let replierPrincipal = content.replyCommenterPrincipal;
      let replierHandle =
        getUserListItemFromPrincipal(replierPrincipal)?.handle;
      let postOwnerHandle = getUserListItemFromPrincipal(
        content.postWriterPrincipal
      )?.handle;
      let commentUrl = `/${postOwnerHandle}/${content.postId}-${
        content.bucketCanisterId
      }/${textToUrlSegment(content.postTitle)}?comment=${
        content.replyCommentId
      }`;
      return (
        <span>
          <span className='link'>{replierHandle}</span> has{' '}
          <span className='bold'>replied</span> to your comment:
          <span
            onClick={() => {
              navigate(commentUrl);
            }}
            className='link'
          >
            {content.myCommentContent.slice(0, 20)}
          </span>
          !
        </span>
      );
    } else if ('PremiumArticleSold' in notificationContent) {
      let content = notificationContent.PremiumArticleSold;
      let purchaserPrincipal = content.purchaserPrincipal;
      let purchaserHandle =
        getUserListItemFromPrincipal(purchaserPrincipal)?.handle;
      let postOwnerHandle = content.publicationPrincipalId[0]
        ? getUserListItemFromPrincipal(content.publicationPrincipalId[0])
            ?.handle
        : getUserListItemFromPrincipal(
            notification.notificationReceiverPrincipalId
          )?.handle;
      let postUrl = `/${postOwnerHandle}/${content.postId}-${
        content.bucketCanisterId
      }/${textToUrlSegment(content.postTitle)}`;
      return (
        <span>
          K-ching!{' '}
          <span
            onClick={() => {
              navigate('/user/' + purchaserHandle);
            }}
            className='link'
          >
            {purchaserHandle}
          </span>{' '}
          bought an <span className='bold'>NFT access</span> key for your
          article: "
          <span
            onClick={() => {
              navigate(postUrl);
            }}
            className='link'
          >
            "{content.postTitle.slice(0, 20)}
            {content.postTitle.length > 20 && '...'}"
          </span>
          "
        </span>
      );
    } else if ('NewArticleByFollowedTag' in notificationContent) {
      let content = notificationContent.NewArticleByFollowedTag;
      let postWriterHandle =
        getUserListItemFromPrincipal(content.postWriterPrincipal)?.handle ||
        content.postWriterPrincipal;
      let postUrl = `/${postWriterHandle}/${content.postId}-${
        content.bucketCanisterId
      }/${textToUrlSegment(content.postTitle)}`;
      return (
        <span>
          <span
            onClick={() => {
              navigate('/user/' + postWriterHandle);
            }}
            className='link'
          >
            {postWriterHandle}
          </span>{' '}
          posted a <span className='bold'>new article: </span>"
          <span
            onClick={() => {
              navigate(postUrl);
            }}
            className='link'
          >
            {content.postTitle}
          </span>
          "
        </span>
      );
    } else if ('AuthorGainsNewSubscriber' in notificationContent) {
      let content = notificationContent.AuthorGainsNewSubscriber;
      let subscriberPrincipal = content.subscriberPrincipalId;
      let subscriberHandle =
        getUserListItemFromPrincipal(subscriberPrincipal)?.handle;

      return (
        <span>
          <span
            onClick={() => {
              navigate('/user/' + subscriberHandle);
            }}
            className='link'
          >
            {subscriberHandle}
          </span>{' '}
          has <span className='bold'>subscribed</span> to you! (
          {convertSubscriptionTimeInterval(content.subscriptionTimeInterval)})
        </span>
      );
    }
  };
  return (
    <aside
      ref={sidebarRef}
      className={`notifications-sidebar ${
        modalContext?.isSidebarOpen ? 'open' : ''
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
            className={`notification-bell ${
              currentView === 'notifications' ? 'selected' : ''
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
            className={`settings-icon ${
              currentView === 'settings' ? 'selected' : ''
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
      {currentView === 'settings' && notificationSettings ? (
        <div
          className='notification-settings'
          style={
            darkTheme ? { background: darkOptionsAndColors.background } : {}
          }
        >
          <div
            className={`notification-settings-content ${
              darkTheme ? 'dark' : ''
            }`}
          >
            <p>
              Please activate or de-activate the notifications of your choice:
            </p>
            {Object.keys(notificationSettings).map((key) => {
              if (key === 'authorGainsNewSubscriber') {
                return (
                  <div className='toggle-row'>
                    <label className={`${darkTheme ? 'dark' : ''}`}>
                      New subscribers
                    </label>
                    <Toggle
                      toggled={notificationSettings.authorGainsNewSubscriber}
                      callBack={() => {
                        setNotificationSettings({
                          ...notificationSettings,
                          authorGainsNewSubscriber:
                            !notificationSettings.authorGainsNewSubscriber,
                        });
                      }}
                    />
                  </div>
                );
              } else if (key === 'authorLosesSubscriber') {
                return (
                  <div className='toggle-row'>
                    <label className={`${darkTheme ? 'dark' : ''}`}>
                      Losing subscribers
                    </label>
                    <Toggle
                      toggled={notificationSettings.authorLosesSubscriber}
                      callBack={() => {
                        setNotificationSettings({
                          ...notificationSettings,
                          authorLosesSubscriber:
                            !notificationSettings.authorLosesSubscriber,
                        });
                      }}
                    />
                  </div>
                );
              } else if (key === 'faucetClaimAvailable') {
                return (
                  <div className='toggle-row'>
                    <label className={`${darkTheme ? 'dark' : ''}`}>
                      Losing subscribers
                    </label>
                    <Toggle
                      toggled={notificationSettings.authorLosesSubscriber}
                      callBack={() => {
                        setNotificationSettings({
                          ...notificationSettings,
                          authorLosesSubscriber:
                            !notificationSettings.authorLosesSubscriber,
                        });
                      }}
                    />
                  </div>
                );
              } else if (key === 'verifyProfile') {
                return (
                  <div className='toggle-row'>
                    <label className={`${darkTheme ? 'dark' : ''}`}>
                      Losing subscribers
                    </label>
                    <Toggle
                      toggled={notificationSettings.authorLosesSubscriber}
                      callBack={() => {
                        setNotificationSettings({
                          ...notificationSettings,
                          authorLosesSubscriber:
                            !notificationSettings.authorLosesSubscriber,
                        });
                      }}
                    />
                  </div>
                );
              } else if (key === 'newArticleByFollowedTag') {
                return (
                  <div className='toggle-row'>
                    <label className={`${darkTheme ? 'dark' : ''}`}>
                      New article on Topic I follow
                    </label>
                    <Toggle
                      toggled={notificationSettings.newArticleByFollowedTag}
                      callBack={() => {
                        setNotificationSettings({
                          ...notificationSettings,
                          newArticleByFollowedTag:
                            !notificationSettings.newArticleByFollowedTag,
                        });
                      }}
                    />
                  </div>
                );
              } else if (key === 'newArticleByFollowedWriter') {
                return (
                  <div className='toggle-row'>
                    <label className={`${darkTheme ? 'dark' : ''}`}>
                      New article on Author I follow
                    </label>
                    <Toggle
                      toggled={notificationSettings.newArticleByFollowedWriter}
                      callBack={() => {
                        setNotificationSettings({
                          ...notificationSettings,
                          newArticleByFollowedWriter:
                            !notificationSettings.newArticleByFollowedWriter,
                        });
                      }}
                    />
                  </div>
                );
              } else if (key === 'newCommentOnMyArticle') {
                return (
                  <div className='toggle-row'>
                    <label className={`${darkTheme ? 'dark' : ''}`}>
                      New comments on my articles
                    </label>
                    <Toggle
                      toggled={notificationSettings.newCommentOnMyArticle}
                      callBack={() => {
                        setNotificationSettings({
                          ...notificationSettings,
                          newCommentOnMyArticle:
                            !notificationSettings.newCommentOnMyArticle,
                        });
                      }}
                    />
                  </div>
                );
              } else if (key === 'newFollower') {
                return (
                  <div className='toggle-row'>
                    <label className={`${darkTheme ? 'dark' : ''}`}>
                      New followers
                    </label>
                    <Toggle
                      toggled={notificationSettings.newFollower}
                      callBack={() => {
                        setNotificationSettings({
                          ...notificationSettings,
                          newFollower: !notificationSettings.newFollower,
                        });
                      }}
                    />
                  </div>
                );
              } else if (key === 'premiumArticleSold') {
                return (
                  <div className='toggle-row'>
                    <label className={`${darkTheme ? 'dark' : ''}`}>
                      Premium Article Sales
                    </label>
                    <Toggle
                      toggled={notificationSettings.premiumArticleSold}
                      callBack={() => {
                        setNotificationSettings({
                          ...notificationSettings,
                          premiumArticleSold:
                            !notificationSettings.premiumArticleSold,
                        });
                      }}
                    />
                  </div>
                );
              } else if (key === 'readerExpiredSubscription') {
                return (
                  <div className='toggle-row'>
                    <label className={`${darkTheme ? 'dark' : ''}`}>
                      Expiring subscriptions
                    </label>
                    <Toggle
                      toggled={notificationSettings.readerExpiredSubscription}
                      callBack={() => {
                        setNotificationSettings({
                          ...notificationSettings,
                          readerExpiredSubscription:
                            !notificationSettings.readerExpiredSubscription,
                        });
                      }}
                    />
                  </div>
                );
              } else if (key === 'replyToMyComment') {
                return (
                  <div className='toggle-row'>
                    <label className={`${darkTheme ? 'dark' : ''}`}>
                      Reply to my comments
                    </label>
                    <Toggle
                      toggled={notificationSettings.replyToMyComment}
                      callBack={() => {
                        setNotificationSettings({
                          ...notificationSettings,
                          replyToMyComment:
                            !notificationSettings.replyToMyComment,
                        });
                      }}
                    />
                  </div>
                );
              } else if (key === 'tipReceived') {
                return (
                  <div className='toggle-row'>
                    <label className={`${darkTheme ? 'dark' : ''}`}>
                      Applauds received
                    </label>
                    <Toggle
                      toggled={notificationSettings.tipReceived}
                      callBack={() => {
                        setNotificationSettings({
                          ...notificationSettings,
                          tipReceived: !notificationSettings.tipReceived,
                        });
                      }}
                    />
                  </div>
                );
              } else if (key === 'youSubscribedToAuthor') {
                return (
                  <div className='toggle-row'>
                    <label className={`${darkTheme ? 'dark' : ''}`}>
                      Your subscriptions
                    </label>
                    <Toggle
                      toggled={notificationSettings.youSubscribedToAuthor}
                      callBack={() => {
                        setNotificationSettings({
                          ...notificationSettings,
                          youSubscribedToAuthor:
                            !notificationSettings.youSubscribedToAuthor,
                        });
                      }}
                    />
                  </div>
                );
              } else if (key === 'youUnsubscribedFromAuthor') {
                return (
                  <div className='toggle-row'>
                    <label className={`${darkTheme ? 'dark' : ''}`}>
                      Cancelling subscriptions
                    </label>
                    <Toggle
                      toggled={notificationSettings.youUnsubscribedFromAuthor}
                      callBack={() => {
                        setNotificationSettings({
                          ...notificationSettings,
                          youUnsubscribedFromAuthor:
                            !notificationSettings.youUnsubscribedFromAuthor,
                        });
                      }}
                    />
                  </div>
                );
              }
            })}
          </div>
          <Button
            className={{
              dark: 'notifications-white-button',
              light: 'notifications-navy-button',
            }}
            styleType={{ dark: 'white', light: 'navy' }}
            onClick={async () => {
              setSavingNotificationSettings(true);
              await updateUserNotificationSettings(notificationSettings);
              setSavingNotificationSettings(false);
            }}
            loading={savingNotificationSettings}
            style={{
              width: '272px',
              marginTop: '40px',
            }}
          >
            Save Notification settings
          </Button>
        </div>
      ) : (
        !isLoading && (
          <ul>
            {notifications
              .sort((n_1, n_2) => Number(n_2.timestamp) - Number(n_1.timestamp))
              .map((notification) => (
                <li
                  key={notification.id}
                  className={`notification ${darkTheme ? 'dark' : ''} ${
                    notification.read ? 'read' : ''
                  }`}
                  onClick={async () => {
                    markNotificationsAsRead([notification.id]);
                  }}
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
                        {timeAgo(new Date(parseInt(notification.timestamp)))}
                      </span>
                    </div>
                    <span
                      className={`${
                        darkTheme
                          ? 'notification-action-dark'
                          : 'notification-action'
                      } ${notification.read ? 'read' : ''}`}
                    >
                      {formatNotificationMessage(notification)}
                    </span>
                  </div>
                </li>
              ))}
            {notifications.length < totalNotificationCount && (
              <Button
                className={{
                  dark: 'notifications-load-more-button',
                  light: 'notifications-load-more-button',
                }}
                styleType={{ dark: 'white', light: 'white' }}
                onClick={async () => {
                  setIsLoadingMore(true);
                  getUserNotifications(page * 20, (page + 1) * 20, navigate);
                  setIsLoadingMore(false);
                }}
                loading={isLoadingMore}
                disabled={isLoadingMore}
              >
                Load More
              </Button>
            )}
          </ul>
        )
      )}
    </aside>
  );
};

export default NotificationsSidebar;
