import _toast, { Toast } from 'react-hot-toast';
import React, { useContext } from 'react';
import { Toaster } from 'react-hot-toast';
import '../components/notifications/_notifications.scss';
import { NotificationContent, Notification } from './actorService';
import { UserListItem } from 'src/nuance_assets/types/types';
import { Context } from '../../nuance_assets/contextes/ModalContext';
import { useTheme } from '../contextes/ThemeContext';
import { useState } from 'react';
import './../components/notifications/_notifications.scss';
import {
  convertSubscriptionTimeInterval,
  textToUrlSegment,
  timeAgo,
} from '../../nuance_assets/shared/utils';
import { icons, colors } from '../shared/constants';
import Button from '../UI/Button/Button';

export enum ToastType {
  Plain,
  Success,
  Error,
  Loading,
  Notification,
}

export const RenderToaster = () => {
  return <Toaster position='bottom-center' />;
};

const BlockingToastContent = ({ closeToast }: { closeToast: () => void }) => (
  <div
    style={{
      backgroundColor: '#000000',
      color: '#ffffff',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}
  >
    <div>
      <p style={{ color: '#ffffff' }}>
        We recommend disabling the "Experimental Third-Party Storage
        Partitioning" feature in Chrome if you want to use Stoic wallet to log
        in to Nuance.
      </p>
      <p style={{ color: '#ffffff' }}>
        Please type{' '}
        <strong>
          <code style={{ color: 'gray' }}>
            chrome://flags/#third-party-storage-partitioning
          </code>
        </strong>{' '}
        in your address bar to disable the setting.
      </p>
      <p style={{ color: '#ffffff' }}>
        Need more info? Visit Stoic on{' '}
        <a
          href='https://twitter.com/StoicWalletApp/status/1706317772194517482?t=bmdQiD3lp5jmjdy2OuTqsA&s=19'
          target='_blank'
          style={{ color: '#007BFF' }}
        >
          X (Twitter)
        </a>{' '}
        for more details.
      </p>
    </div>
    <button
      onClick={closeToast}
      style={{
        marginTop: '10px',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
      }}
    >
      Dismiss
    </button>
  </div>
);

export const showBlockingToast = (message: any, resolve: any) => {
  _toast.custom(
    (t) => (
      <BlockingToastContent
        closeToast={() => {
          _toast.dismiss(t.id);
          resolve(); // Resolving the promise when the toast is dismissed
        }}
      />
    ),
    {
      duration: Infinity, // Stay until dismissed
      position: 'bottom-center',
      style: { width: 'auto' },
    }
  );
};

const CustomNotificationContent = ({
  notifications,
  notificationsUserListItems,
}: {
  notifications: Notification[];
  notificationsUserListItems: UserListItem[];
}) => {
  const darkTheme = useTheme();
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
        </span>
      );
    } else if ('TipReceived' in notificationContent) {
      let content = notificationContent.TipReceived;
      //post related fields
      let postOwnerHandle =
        content.publicationPrincipalId.length === 0
          ? getHandleFromPrincipal(notification.notificationReceiverPrincipalId)
              ?.handle
          : getHandleFromPrincipal(content.publicationPrincipalId[0])?.handle;
      let postUrl = `/${postOwnerHandle}/${content.postId}-${
        content.bucketCanisterId
      }/${textToUrlSegment(content.postTitle)}`;
      //tipper related fields
      let tipSenderPrincipal = content.tipSenderPrincipal;
      let tipSenderHandle = getHandleFromPrincipal(tipSenderPrincipal);

      <span>
        Excellent! <strong>@{tipSenderHandle}</strong> has <b>applauded</b> +
        {content.numberOfApplauds} on {content.tippedTokenSymbol} for the
        article{' '}
        <strong>
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
          <strong>@{postWriterHandle}</strong> posted a <b>new article!</b>
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
          <strong>@{subscriberHandle}</strong> has cancelled the{' '}
          {subscriptionTimeInterval} subscription to your account.
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
          {<strong>@{subscribedAccountHandle}</strong>} (
          {subscriptionTimeInterval})
        </span>
      );
    } else if ('NewCommentOnMyArticle' in notificationContent) {
      let content = notificationContent.NewCommentOnMyArticle;
      let postOwnerHandle = getHandleFromPrincipal(
        notification.notificationReceiverPrincipalId
      )?.handle;
      let postUrl = `/${postOwnerHandle}/${content.postId}-${
        content.bucketCanisterId
      }/${textToUrlSegment(content.postTitle)}`;
      let isReply = content.isReply;
      let commenterPrincipal = content.commenterPrincipal;
      let commenterHandle = getHandleFromPrincipal(commenterPrincipal)?.handle;
      let commentContent = content.commentContent;
      return (
        <span>
          <strong>@{commenterHandle}</strong> has{' '}
          {isReply ? 'added a reply ' : 'commented'} on your article:{' '}
          <strong>
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
          {<strong>@{subscribedAccountHandle}</strong>} (
          {subscriptionTimeInterval})
        </span>
      );
    } else if ('NewFollower' in notificationContent) {
      let content = notificationContent.NewFollower;
      let followerPrincipal = content.followerPrincipalId;
      let followerHandle = getHandleFromPrincipal(followerPrincipal)?.handle;
      return (
        <span>
          <strong>@{followerHandle}</strong> has followed you!
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
          subscription to the account <strong>@{subscribedHandle}</strong> has
          expired!
        </span>
      );
    } else if ('ReplyToMyComment' in notificationContent) {
      let content = notificationContent.ReplyToMyComment;
      let replierPrincipal = content.replyCommenterPrincipal;
      let replierHandle = getHandleFromPrincipal(replierPrincipal)?.handle;
      let postOwnerHandle = getHandleFromPrincipal(
        content.postWriterPrincipal
      )?.handle;
      return (
        <span>
          <strong>@{replierHandle}</strong> has replied to your{' '}
          <strong>comment</strong>!
        </span>
      );
    } else if ('PremiumArticleSold' in notificationContent) {
      let content = notificationContent.PremiumArticleSold;
      let purchaserPrincipal = content.purchaserPrincipal;
      let purchaserHandle = getHandleFromPrincipal(purchaserPrincipal)?.handle;
      let postOwnerHandle =
        content.publicationPrincipalId.length === 0
          ? getHandleFromPrincipal(notification.notificationReceiverPrincipalId)
              ?.handle
          : getHandleFromPrincipal(content.publicationPrincipalId[0])?.handle;
      let postUrl = `/${postOwnerHandle}/${content.postId}-${
        content.bucketCanisterId
      }/${textToUrlSegment(content.postTitle)}`;
      return (
        <span>
          <strong>@{purchaserHandle}</strong> has purchased your premium
          article:{' '}
          <strong>
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
          <strong>@{postOwnerHandle}</strong> has posted a new article in the
          topic ({content.tagName}) you follow:{' '}
          <strong>
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
          <strong>@{subscriberHandle}</strong> has subscribed you! (
          {convertSubscriptionTimeInterval(content.subscriptionTimeInterval)})
        </span>
      );
    }
  };

  //if notifications modal is open, don't show the toast
  const modalContext = useContext(Context);
  if (modalContext?.isSidebarOpen) {
    return null;
  } else {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {notifications.map((notification, index) => (
          <div
            key={index}
            className={`${darkTheme ? 'dark' : ''} notification-toast`}
          >
            <div>
              <div className='notification-details'>
                <div className='notification-top-row'>
                  <div className='notification-icon'>
                    <img
                      src={
                        darkTheme
                          ? icons.NOTIFICATION_BELL_DARK
                          : icons.NOTIFICATION_BELL
                      }
                      alt='Notification'
                    />
                  </div>
                  <span className='notification-timestamp'>
                    {timeAgo(new Date(parseInt(notification.timestamp)))}
                  </span>
                </div>
                <span className={`notification-action`}>
                  {formatNotificationMessage(notification)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
};

export const toastError = (err: any, preText: string = ''): void => {
  if (err.message) {
    toast(preText + err.message, ToastType.Error);
  } else {
    toast(preText + err, ToastType.Error);
  }
};

export const toast = (message: string, toastType: ToastType): void => {
  let options = {};

  switch (toastType) {
    case ToastType.Success:
      options = {
        duration: 6000,
        iconTheme: {
          primary: colors.accentColor,
          secondary: colors.primaryTextColor,
        },
        style: {
          backgroundColor: '#000000',
          color: '#ffffff',
          borderRadius: '8px',
        },
      };
      _toast.success(message, options);
      break;
    case ToastType.Error:
      options = {
        duration: 6000,
        iconTheme: {
          primary: colors.errorColor,
          secondary: colors.primaryTextColor,
        },
        style: {
          backgroundColor: '#000000',
          color: '#ffffff',
          borderRadius: '8px',
        },
      };
      _toast.error(message, options);
      break;
    case ToastType.Loading:
      options = {
        duration: 3000,
        iconTheme: {
          primary: colors.accentColor,
          secondary: colors.primaryTextColor,
        },
        style: {
          backgroundColor: '#000000',
          color: '#ffffff',
          borderRadius: '8px',
        },
      };
      _toast.loading(message, options);
      break;
    default:
      _toast(message, {
        duration: 6000,
        style: {
          backgroundColor: '#000000',
          color: '#ffffff',
        },
      });
      break;
  }
};

export const toastNotification = (
  notifications: Notification[],
  userListItems: UserListItem[]
): void => {
  // Use the custom component for Notification type because the styling is complicated
  _toast(
    (t) => (
      <CustomNotificationContent
        notifications={notifications}
        notificationsUserListItems={userListItems}
      />
    ),
    {
      duration: 4000,
      position: 'top-right',
      style: {
        marginTop: '50px',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        zIndex: 0,
      },
    }
  );
};
