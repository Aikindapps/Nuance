import _toast, { Toast } from 'react-hot-toast';
import React, { useContext } from 'react';
import { Toaster } from 'react-hot-toast';
import '../components/notifications/_notifications.scss';
import { UserListItem } from 'src/nuance_assets/types/types';
import { Context } from '../../nuance_assets/contextes/ModalContext';
import { useTheme } from '../contextes/ThemeContext';
import './../components/notifications/_notifications.scss';
import {
  convertSubscriptionTimeInterval,
  textToUrlSegment,
  timeAgo,
} from '../../nuance_assets/shared/utils';
import { icons, colors } from '../shared/constants';
import { Notification } from '../../declarations/Notifications/Notifications.did';
import Button from '../UI/Button/Button';
import { Link, NavigateFunction } from 'react-router-dom';

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
  navigate,
}: {
  notifications: Notification[];
  notificationsUserListItems: UserListItem[];
  navigate: NavigateFunction;
}) => {
  const darkTheme = useTheme();
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
          <Link to={`/my-profile/wallet`}>
            <Button
              styleType={{ dark: 'navy-dark', light: 'navy' }}
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
          </Link>
        </span>
      );
    } else if ('VerifyProfile' in notificationContent) {
      return (
        <span>
          Your profile is not verified. You can verify yourself on your profile
          page.
          <Link to={`/my-profile`}>
            <Button
              styleType={{ dark: 'navy-dark', light: 'navy' }}
              loading={false}
              style={{
                display: 'flex',
                flexDirection: 'row-reverse',
                marginTop: '10px',
                float: 'right',
              }}
            >
              Verify Profile
            </Button>
          </Link>
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
          <Link to={`/user/${tipSenderHandle}`} className='link'>
            {tipSenderHandle}
          </Link>{' '}
          <span className='bold'>applauded</span> +
          {(Number(content.numberOfApplauds) / Math.pow(10, 8)).toFixed(0)}{' '}
          using {content.tippedTokenSymbol} on "
          <Link to={postUrl} className='link'>
            {content.postTitle.slice(0, 20)}
            {content.postTitle.length > 20 && '...'}
          </Link>
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
          <Link to={`/user/${postWriterHandle}`} className='link'>
            {postWriterHandle}
          </Link>{' '}
          posted a <span className='bold'>new article: </span>"
          <Link to={postUrl} className='link'>
            {content.postTitle}
          </Link>
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
          <Link to={`/user/${subscriberHandle}`} className='link'>
            {subscriberHandle}
          </Link>{' '}
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
            <Link
              to={
                content.isPublication
                  ? `/publication/${subscribedAccountHandle}`
                  : `/user/${subscribedAccountHandle}`
              }
              className='link'
            >
              {subscribedAccountHandle}
            </Link>
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
          <Link to={`/user/'${commenterHandle}`} className='link'>
            {commenterHandle}
          </Link>{' '}
          has{' '}
          <span className='bold'>
            {isReply ? 'added a reply ' : 'commented'}
          </span>{' '}
          on your article: "
          <Link to={postUrl} className='link'>
            {content.postTitle.slice(0, 20)}
            {content.postTitle.length > 20 && '...'}
          </Link>
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
            <Link
              to={
                content.isPublication
                  ? `/publication/${subscribedAccountHandle}`
                  : `/user/${subscribedAccountHandle}`
              }
              className='link'
            >
              {subscribedAccountHandle}
            </Link>
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
          <Link to={`/user/${followerHandle}`} className=''>
            {followerHandle}
          </Link>{' '}
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
          <Link
            to={
              content.isPublication
                ? `/publication/${subscribedHandle}`
                : `/user/${subscribedHandle}`
            }
            className='link'
          >
            {subscribedHandle}
          </Link>{' '}
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
          <Link to={commentUrl} className='link'>
            {content.myCommentContent.slice(0, 20)}
          </Link>
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
          <Link to={`/user/${purchaserHandle}`} className='link'>
            {purchaserHandle}
          </Link>{' '}
          bought an <span className='bold'>NFT access</span> key for your
          article: "
          <Link to={postUrl} className='link'>
            "{content.postTitle.slice(0, 20)}
            {content.postTitle.length > 20 && '...'}"
          </Link>
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
          <Link to={`/user/${postWriterHandle}`} className='link'>
            {postWriterHandle}
          </Link>{' '}
          posted a <span className='bold'>new article: </span>"
          <Link to={postUrl} className='link'>
            {content.postTitle}
          </Link>
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
          <Link to={`/user/${subscriberHandle}`} className='link'>
            {subscriberHandle}
          </Link>{' '}
          has <span className='bold'>subscribed</span> to you! (
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
                <span
                  className={
                    darkTheme
                      ? 'notification-action-dark'
                      : `notification-action`
                  }
                >
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
  userListItems: UserListItem[],
  navigate: NavigateFunction
): void => {
  // Use the custom component for Notification type because the styling is complicated
  _toast(
    (t) => (
      <CustomNotificationContent
        notifications={notifications}
        notificationsUserListItems={userListItems}
        navigate={navigate}
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
