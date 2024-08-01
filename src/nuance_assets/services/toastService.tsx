import _toast, { Toast } from 'react-hot-toast';
import React, { useContext } from 'react';
import { Toaster } from 'react-hot-toast';
import '../components/notifications/_notifications.scss';
import {
  Notifications,
  NotificationContent,
  NotificationType,
} from './actorService';
import { } from 'src/nuance_assets/types/types';
import { Context } from '../../nuance_assets/contextes/ModalContext';
import { useTheme } from '../contextes/ThemeContext';
import { useState } from 'react';
import './../components/notifications/_notifications.scss';
import { timeAgo } from '../../nuance_assets/shared/utils';
import { icons, colors } from '../shared/constants';
import Button from '../UI/Button/Button';
import { NotificationsExtended } from '../../../src/declarations/User/User.did';


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
  message,
  toast,
}: {
  message: string;
  toast: Toast;
}) => {
  const darkTheme = useTheme();

  function getNotificationTypeKey(notificationType: NotificationType): string {
    return Object.keys(notificationType)[0];
  }

  function handleResubscription(handle: string) {
    modalContext?.openModal('Subscription');
    window.history.pushState({}, '', `/user/${handle}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  const handleSubscriptionClick = () => {
    window.location.href = '/my-profile/subscriptions';
  };
  const handleSubscriberClick = () => {
    window.location.href = '/my-profile/subscribers';
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

  function articleUrl(originalUrl: string, title: string, newHandle: string) {
    // Extract the initial part of the URL before the first slash after the handle
    const firstSlashIndex = originalUrl.indexOf('/', 1);
    const urlPrefix = originalUrl.slice(0, firstSlashIndex);

    // Construct the new URL with the fresh handle just in case handle has changed
    const updatedUrl = `/${newHandle}${originalUrl.slice(firstSlashIndex)}`;


    return (
      <a href={updatedUrl}>{title}</a>
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
          {content.tipAmount} {content.token} on "{articleUrl(content.postUrl, content.articleTitle, notification.receiverHandle)}"
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
          {authorHandleUrl(senderHandle!, content.isAuthorPublication)} posted a <b>new article</b>: "{articleUrl(content.url, content.articleTitle, senderHandle!)}"
        </span>
      );
    } else if (isPost(notification.content)) {
      const content = notification.content.PostNotificationContent;
      const senderHandle = notification.senderHandle;
      return (
        <span>
          {authorHandleUrl(senderHandle!, content.isAuthorPublication)} posted a <b>new article</b>: "{articleUrl(content.url, content.articleTitle, senderHandle!)}"
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
          {/* This button is hanging out of the div, but its just a toast, so for now leaving it out
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
        </Button> */}
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
          {handleUrl(senderHandle!, content.isAuthorPublication)} {content.isReply ? <b>replied</b> : <b>commented</b>} on "{articleUrl(content.url, content.articleTitle, senderHandle!)}"
        </span>
      );
    } else if (isPremiumArticleSold(notification.content)) {
      const content = notification.content.PremiumArticleSoldNotificationContent;
      const senderHandle = notification.senderHandle;
      return (
        <span>
          K-ching! {handleUrl(senderHandle!, content.isAuthorPublication)} bought an <b>NFT access</b> key for your article "{articleUrl(content.url, content.articleTitle, senderHandle!)}"
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
  const notifications: NotificationsExtended[] = JSON.parse(message);
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
              <div
                className='notification-details'
                onClick={() => {
                  _toast.dismiss(toast.id);
                }}
              >
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
                    {timeAgo(
                      new Date(parseInt(notification.timestamp) / 1000000)
                    )}
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
    case ToastType.Notification:
      // Use the custom component for Notification type because the styling is complicated
      _toast((t) => <CustomNotificationContent message={message} toast={t} />, {
        duration: 4000,
        position: 'top-right',
        style: {
          marginTop: '50px',
          backgroundColor: 'transparent',
          boxShadow: 'none',
          zIndex: 0,
        },
      });
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
