import _toast from 'react-hot-toast';
import React, { useContext } from 'react';
import { Toaster } from 'react-hot-toast';
import '../components/notifications/_notifications.scss';
import { Notifications, NotificationContent, NotificationType } from './actorService';
import { Context } from '../../nuance_assets/contextes/ModalContext';
import { useTheme } from '../contextes/ThemeContext';
import { useState } from 'react';
import './../components/notifications/_notifications.scss';
import { timeAgo } from '../../nuance_assets/shared/utils';
import { icons, colors } from '../shared/constants';




export enum ToastType {
  Plain,
  Success,
  Error,
  Loading,
  Notification,
}

export const RenderToaster = () => {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 6000,
        style: {
          backgroundColor: '#000000',
          color: '#ffffff',
          borderRadius: '8px',
        },
        custom: {
          duration: 6000,
          style: {
            backgroundColor: colors.primaryBackgroundColor,
            color: colors.primaryTextColor,
          },
        },
      }}
    />
  );
};

const CustomNotificationContent = ({ message }: { message: string }) => {

  const darkTheme = useTheme();

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
  const notifications: Notifications[] = JSON.parse(message);
  //if notifications modal is open, don't show the toast
  const modalContext = useContext(Context);
  if (modalContext?.isModalOpen && modalContext.modalType === 'Notifications') {
    return null;
  } else {
    return (


      <div style={{
        marginTop: '50px', // Add space from the top
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {notifications.map((notification, index) => (
          <div key={index} className={`${darkTheme ? 'dark' : ''} notification-toast`}>
            <div>
              <div className="notification-details">
                <div className='notification-top-row'>
                  <div className='notification-icon'>

                    <img src={darkTheme ? icons.NOTIFICATION_BELL_DARK : icons.NOTIFICATION_BELL} alt="Notification" />

                  </div>
                  <span className="notification-timestamp">{timeAgo(new Date(parseInt(notification.timestamp) / (1000000)))}</span>
                </div>
                <span className={`notification-action`}>{formatNotificationMessage(notification)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
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
      };
      _toast.loading(message, options);
      break;
    case ToastType.Notification:
      // Use the custom component for Notification type because the styling is complicated
      _toast.custom((t) => (
        <CustomNotificationContent message={message} />
      ), {
        duration: 6000,
        position: 'top-right',

      }
      );
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




