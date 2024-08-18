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

  console.log(notifications);

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
      getUserNotifications(0, 20),
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

  const getHandleFromPrincipal = (principal: string) => {
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
            styleType={darkTheme ? 'primary-blue-dark' : 'primary-blue'}
            onClick={() => {
              navigate('/my-profile/wallet');
            }}
            loading={false}
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
    } else if ('TipReceived' in notificationContent) {
      let content = notificationContent.TipReceived;
      //post related fields
      let postOwnerHandle =
        content.publicationPrincipalId.length === 0
          ? user?.handle
          : getHandleFromPrincipal(content.publicationPrincipalId[0])?.handle;
      let postUrl = `/${postOwnerHandle}/${content.postId}-${
        content.bucketCanisterId
      }/${textToUrlSegment(content.postTitle)}`;
      //tipper related fields
      let tipSenderPrincipal = content.tipSenderPrincipal;
      let tipSenderHandle = getHandleFromPrincipal(tipSenderPrincipal);

      <span>
        Excellent!{' '}
        <strong
          onClick={() => {
            navigate('/user/' + tipSenderHandle);
          }}
        >
          @{tipSenderHandle}
        </strong>{' '}
        has <b>applauded</b> +{content.numberOfApplauds} on{' '}
        {content.tippedTokenSymbol} for the article{' '}
        <strong
          onClick={() => {
            navigate(postUrl);
          }}
        >
          "{content.postTitle.slice(0, 20)}
          {content.postTitle.length > 20 && '...'}"
        </strong>
      </span>;
    } else if ('NewArticleByFollowedWriter' in notificationContent) {
      let content = notificationContent.NewArticleByFollowedWriter;
      let postWriterHandle =
        getHandleFromPrincipal(content.postWriterPrincipal)?.handle ||
        content.postWriterPrincipal;
      return (
        <span>
          <strong
            onClick={() => {
              navigate('/user/' + postWriterHandle);
            }}
          >
            @{postWriterHandle}
          </strong>{' '}
          posted a <b>new article!</b>
        </span>
      );
    } else if ('AuthorLosesSubscriber' in notificationContent) {
      let content = notificationContent.AuthorLosesSubscriber;
      let subscriberPrincipal = content.subscriberPrincipalId;
      let subscriberHandle =
        getHandleFromPrincipal(subscriberPrincipal)?.handle;
      let subscriptionTimeInterval = convertSubscriptionTimeInterval(
        content.subscriptionTimeInterval
      );
      return (
        <span>
          <strong
            onClick={() => {
              navigate('/user/' + subscriberHandle);
            }}
          >
            @{subscriberHandle}
          </strong>{' '}
          has cancelled the {subscriptionTimeInterval} subscription to your
          account.
        </span>
      );
    } else if ('YouSubscribedToAuthor' in notificationContent) {
      let content = notificationContent.YouSubscribedToAuthor;
      let subscribedAccountPrincipal = content.subscribedWriterPrincipalId;
      let subscribedAccountHandle = getHandleFromPrincipal(
        subscribedAccountPrincipal
      )?.handle;
      let subscriptionTimeInterval = convertSubscriptionTimeInterval(
        content.subscriptionTimeInterval
      );
      return (
        <span>
          You subscribed to the{' '}
          {content.isPublication ? 'publication ' : 'account '}{' '}
          {
            <strong
              onClick={() => {
                if (content.isPublication) {
                  navigate('/publication/' + subscribedAccountHandle);
                } else {
                  navigate('/user/' + subscribedAccountHandle);
                }
              }}
            >
              @{subscribedAccountHandle}
            </strong>
          }{' '}
          ({subscriptionTimeInterval})
        </span>
      );
    } else if ('NewCommentOnMyArticle' in notificationContent) {
      let content = notificationContent.NewCommentOnMyArticle;
      let postOwnerHandle = user?.handle;
      let postUrl = `/${postOwnerHandle}/${content.postId}-${
        content.bucketCanisterId
      }/${textToUrlSegment(content.postTitle)}?comment=${content.commentId}`;
      let isReply = content.isReply;
      let commenterPrincipal = content.commenterPrincipal;
      let commenterHandle = getHandleFromPrincipal(commenterPrincipal)?.handle;
      let commentContent = content.commentContent;
      return (
        <span>
          <strong
            onClick={() => {
              navigate('/user/' + commenterHandle);
            }}
          >
            @{commenterHandle}
          </strong>{' '}
          has {isReply ? 'added a reply ' : 'commented'} on your article:{' '}
          <strong
            onClick={() => {
              navigate(postUrl);
            }}
          >
            "{content.postTitle.slice(0, 20)}
            {content.postTitle.length > 20 && '...'}"
          </strong>
        </span>
      );
    } else if ('YouUnsubscribedFromAuthor' in notificationContent) {
      let content = notificationContent.YouUnsubscribedFromAuthor;
      let subscribedAccountPrincipal = content.subscribedWriterPrincipalId;
      let subscribedAccountHandle = getHandleFromPrincipal(
        subscribedAccountPrincipal
      )?.handle;
      let subscriptionTimeInterval = convertSubscriptionTimeInterval(
        content.subscriptionTimeInterval
      );
      return (
        <span>
          You unsubscribed from the{' '}
          {content.isPublication ? 'publication ' : 'account '}{' '}
          {
            <strong
              onClick={() => {
                if (content.isPublication) {
                  navigate('/publication/' + subscribedAccountHandle);
                } else {
                  navigate('/user/' + subscribedAccountHandle);
                }
              }}
            >
              @{subscribedAccountHandle}
            </strong>
          }{' '}
          ({subscriptionTimeInterval})
        </span>
      );
    } else if ('NewFollower' in notificationContent) {
      let content = notificationContent.NewFollower;
      let followerPrincipal = content.followerPrincipalId;
      let followerHandle = getHandleFromPrincipal(followerPrincipal)?.handle;
      return (
        <span>
          <strong
            onClick={() => {
              navigate('/user/' + followerHandle);
            }}
          >
            @{followerHandle}
          </strong>{' '}
          has followed you!
        </span>
      );
    } else if ('ReaderExpiredSubscription' in notificationContent) {
      let content = notificationContent.ReaderExpiredSubscription;
      let subscribedPrincipalId = content.subscribedWriterPrincipalId;
      let subscribedHandle = getHandleFromPrincipal(
        subscribedPrincipalId
      )?.handle;
      return (
        <span>
          Your{' '}
          {convertSubscriptionTimeInterval(content.subscriptionTimeInterval)}{' '}
          subscription to the account{' '}
          <strong
            onClick={() => {
              if (content.isPublication) {
                navigate('/publication/' + subscribedHandle);
              } else {
                navigate('/user/' + subscribedHandle);
              }
            }}
          >
            @{subscribedHandle}
          </strong>{' '}
          has expired!
        </span>
      );
    } else if ('ReplyToMyComment' in notificationContent) {
      let content = notificationContent.ReplyToMyComment;
      let replierPrincipal = content.replyCommenterPrincipal;
      let replierHandle = getHandleFromPrincipal(replierPrincipal)?.handle;
      let postOwnerHandle = getHandleFromPrincipal(
        content.postWriterPrincipal
      )?.handle;
      let commentUrl = `/${postOwnerHandle}/${content.postId}-${
        content.bucketCanisterId
      }/${textToUrlSegment(content.postTitle)}?comment=${
        content.replyCommentId
      }`;
      return (
        <span>
          <strong>@{replierHandle}</strong> has replied to your{' '}
          <strong
            onClick={() => {
              navigate(commentUrl);
            }}
          >
            comment
          </strong>
          !
        </span>
      );
    } else if ('PremiumArticleSold' in notificationContent) {
      let content = notificationContent.PremiumArticleSold;
      let purchaserPrincipal = content.purchaserPrincipal;
      let purchaserHandle = getHandleFromPrincipal(purchaserPrincipal)?.handle;
      let postOwnerHandle =
        content.publicationPrincipalId.length === 0
          ? user?.handle
          : getHandleFromPrincipal(content.publicationPrincipalId[0])?.handle;
      let postUrl = `/${postOwnerHandle}/${content.postId}-${
        content.bucketCanisterId
      }/${textToUrlSegment(content.postTitle)}`;
      return (
        <span>
          <strong
            onClick={() => {
              navigate('/user/' + purchaserHandle);
            }}
          >
            @{purchaserHandle}
          </strong>{' '}
          has purchased your premium article:{' '}
          <strong
            onClick={() => {
              navigate(postUrl);
            }}
          >
            "{content.postTitle.slice(0, 20)}
            {content.postTitle.length > 20 && '...'}"
          </strong>{' '}
          for {(Number(content.amountOfTokens) / Math.pow(10, 8)).toFixed(4)}{' '}
          {content.purchasedTokenSymbol}s
        </span>
      );
    } else if ('NewArticleByFollowedTag' in notificationContent) {
      let content = notificationContent.NewArticleByFollowedTag;
      let postWriterPrincipal = content.postWriterPrincipal;
      let postOwnerHandle = getHandleFromPrincipal(postWriterPrincipal)?.handle;
      let postUrl = `/${postOwnerHandle}/${content.postId}-${
        content.bucketCanisterId
      }/${textToUrlSegment(content.postTitle)}`;
      return (
        <span>
          <strong
            onClick={() => {
              navigate('/user/' + postOwnerHandle);
            }}
          >
            @{postOwnerHandle}
          </strong>{' '}
          has posted a new article in the topic ({content.tagName}) you follow:{' '}
          <strong
            onClick={() => {
              navigate(postUrl);
            }}
          >
            "{content.postTitle.slice(0, 20)}
            {content.postTitle.length > 20 && '...'}"
          </strong>
        </span>
      );
    } else if ('AuthorGainsNewSubscriber' in notificationContent) {
      let content = notificationContent.AuthorGainsNewSubscriber;
      let subscriberPrincipal = content.subscriberPrincipalId;
      let subscriberHandle =
        getHandleFromPrincipal(subscriberPrincipal)?.handle;

      return (
        <span>
          <strong
            onClick={() => {
              navigate('/user/' + subscriberHandle);
            }}
          >
            @{subscriberHandle}
          </strong>{' '}
          has subscribed you! (
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
            styleType={darkTheme ? 'primary-blue-dark' : 'primary-blue'}
            onClick={async () => {
              setSavingNotificationSettings(true);
              await updateUserNotificationSettings(notificationSettings);
              setSavingNotificationSettings(false);
            }}
            loading={savingNotificationSettings}
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
                      className={`notification-action ${
                        notification.read ? 'read' : ''
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
                onClick={async () => {
                  setIsLoadingMore(true);
                  getUserNotifications(page * 20, (page + 1) * 20);
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
