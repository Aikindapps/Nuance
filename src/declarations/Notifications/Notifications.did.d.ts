import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface GetUserNotificationsResponse {
  'notifications' : Array<Notification>,
  'totalCount' : string,
}
export interface Notification {
  'id' : string,
  'content' : NotificationContent,
  'read' : boolean,
  'timestamp' : string,
  'notificationReceiverPrincipalId' : string,
}
export type NotificationContent = { 'FaucetClaimAvailable' : null } |
  {
    'TipReceived' : {
      'bucketCanisterId' : string,
      'amountOfTokens' : string,
      'tipSenderPrincipal' : string,
      'publicationPrincipalId' : [] | [string],
      'postTitle' : string,
      'numberOfApplauds' : string,
      'tippedTokenSymbol' : string,
      'postId' : string,
    }
  } |
  {
    'NewArticleByFollowedWriter' : {
      'bucketCanisterId' : string,
      'postWriterPrincipal' : string,
      'postTitle' : string,
      'postId' : string,
    }
  } |
  {
    'AuthorLosesSubscriber' : {
      'subscriptionTimeInterval' : SubscriptionTimeInterval,
      'subscriberPrincipalId' : string,
    }
  } |
  {
    'YouSubscribedToAuthor' : {
      'amountOfTokens' : string,
      'subscriptionEndTime' : string,
      'subscriptionTimeInterval' : SubscriptionTimeInterval,
      'subscribedWriterPrincipalId' : string,
      'subscriptionStartTime' : string,
      'isPublication' : boolean,
    }
  } |
  {
    'NewCommentOnMyArticle' : {
      'bucketCanisterId' : string,
      'commentId' : string,
      'isReply' : boolean,
      'commentContent' : string,
      'postTitle' : string,
      'commenterPrincipal' : string,
      'postId' : string,
    }
  } |
  { 'VerifyProfile' : null } |
  {
    'YouUnsubscribedFromAuthor' : {
      'subscriptionTimeInterval' : SubscriptionTimeInterval,
      'subscribedWriterPrincipalId' : string,
      'isPublication' : boolean,
    }
  } |
  { 'NewFollower' : { 'followerPrincipalId' : string } } |
  {
    'ReaderExpiredSubscription' : {
      'amountOfTokens' : string,
      'subscriptionEndTime' : string,
      'subscriptionTimeInterval' : SubscriptionTimeInterval,
      'subscribedWriterPrincipalId' : string,
      'subscriptionStartTime' : string,
      'isPublication' : boolean,
    }
  } |
  {
    'ReplyToMyComment' : {
      'bucketCanisterId' : string,
      'postWriterPrincipal' : string,
      'myCommentId' : string,
      'myCommentContent' : string,
      'replyCommentContent' : string,
      'postTitle' : string,
      'replyCommenterPrincipal' : string,
      'replyCommentId' : string,
      'postId' : string,
    }
  } |
  {
    'PremiumArticleSold' : {
      'bucketCanisterId' : string,
      'amountOfTokens' : string,
      'publicationPrincipalId' : [] | [string],
      'purchasedTokenSymbol' : string,
      'purchaserPrincipal' : string,
      'postTitle' : string,
      'postId' : string,
    }
  } |
  {
    'NewArticleByFollowedTag' : {
      'bucketCanisterId' : string,
      'tagName' : string,
      'postWriterPrincipal' : string,
      'postTitle' : string,
      'postId' : string,
    }
  } |
  {
    'AuthorGainsNewSubscriber' : {
      'amountOfTokens' : string,
      'subscriptionEndTime' : string,
      'subscriptionTimeInterval' : SubscriptionTimeInterval,
      'subscriptionStartTime' : string,
      'subscriberPrincipalId' : string,
    }
  };
export type NotificationContent__1 = { 'FaucetClaimAvailable' : null } |
  {
    'TipReceived' : {
      'bucketCanisterId' : string,
      'amountOfTokens' : string,
      'tipSenderPrincipal' : string,
      'publicationPrincipalId' : [] | [string],
      'postTitle' : string,
      'numberOfApplauds' : string,
      'tippedTokenSymbol' : string,
      'postId' : string,
    }
  } |
  {
    'NewArticleByFollowedWriter' : {
      'bucketCanisterId' : string,
      'postWriterPrincipal' : string,
      'postTitle' : string,
      'postId' : string,
    }
  } |
  {
    'AuthorLosesSubscriber' : {
      'subscriptionTimeInterval' : SubscriptionTimeInterval,
      'subscriberPrincipalId' : string,
    }
  } |
  {
    'YouSubscribedToAuthor' : {
      'amountOfTokens' : string,
      'subscriptionEndTime' : string,
      'subscriptionTimeInterval' : SubscriptionTimeInterval,
      'subscribedWriterPrincipalId' : string,
      'subscriptionStartTime' : string,
      'isPublication' : boolean,
    }
  } |
  {
    'NewCommentOnMyArticle' : {
      'bucketCanisterId' : string,
      'commentId' : string,
      'isReply' : boolean,
      'commentContent' : string,
      'postTitle' : string,
      'commenterPrincipal' : string,
      'postId' : string,
    }
  } |
  { 'VerifyProfile' : null } |
  {
    'YouUnsubscribedFromAuthor' : {
      'subscriptionTimeInterval' : SubscriptionTimeInterval,
      'subscribedWriterPrincipalId' : string,
      'isPublication' : boolean,
    }
  } |
  { 'NewFollower' : { 'followerPrincipalId' : string } } |
  {
    'ReaderExpiredSubscription' : {
      'amountOfTokens' : string,
      'subscriptionEndTime' : string,
      'subscriptionTimeInterval' : SubscriptionTimeInterval,
      'subscribedWriterPrincipalId' : string,
      'subscriptionStartTime' : string,
      'isPublication' : boolean,
    }
  } |
  {
    'ReplyToMyComment' : {
      'bucketCanisterId' : string,
      'postWriterPrincipal' : string,
      'myCommentId' : string,
      'myCommentContent' : string,
      'replyCommentContent' : string,
      'postTitle' : string,
      'replyCommenterPrincipal' : string,
      'replyCommentId' : string,
      'postId' : string,
    }
  } |
  {
    'PremiumArticleSold' : {
      'bucketCanisterId' : string,
      'amountOfTokens' : string,
      'publicationPrincipalId' : [] | [string],
      'purchasedTokenSymbol' : string,
      'purchaserPrincipal' : string,
      'postTitle' : string,
      'postId' : string,
    }
  } |
  {
    'NewArticleByFollowedTag' : {
      'bucketCanisterId' : string,
      'tagName' : string,
      'postWriterPrincipal' : string,
      'postTitle' : string,
      'postId' : string,
    }
  } |
  {
    'AuthorGainsNewSubscriber' : {
      'amountOfTokens' : string,
      'subscriptionEndTime' : string,
      'subscriptionTimeInterval' : SubscriptionTimeInterval,
      'subscriptionStartTime' : string,
      'subscriberPrincipalId' : string,
    }
  };
export type Result = { 'ok' : UserNotificationSettings } |
  { 'err' : string };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_2 = { 'ok' : Array<string> } |
  { 'err' : string };
export type SubscriptionTimeInterval = { 'LifeTime' : null } |
  { 'Weekly' : null } |
  { 'Monthly' : null } |
  { 'Annually' : null };
export interface UserNotificationSettings {
  'premiumArticleSold' : boolean,
  'verifyProfile' : boolean,
  'tipReceived' : boolean,
  'authorGainsNewSubscriber' : boolean,
  'authorLosesSubscriber' : boolean,
  'youSubscribedToAuthor' : boolean,
  'newCommentOnMyArticle' : boolean,
  'replyToMyComment' : boolean,
  'youUnsubscribedFromAuthor' : boolean,
  'newFollower' : boolean,
  'readerExpiredSubscription' : boolean,
  'newArticleByFollowedWriter' : boolean,
  'newArticleByFollowedTag' : boolean,
  'faucetClaimAvailable' : boolean,
}
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'availableCycles' : ActorMethod<[], bigint>,
  'broadcastNotification' : ActorMethod<[NotificationContent__1], Result_2>,
  'createNotification' : ActorMethod<
    [string, NotificationContent__1],
    undefined
  >,
  'createNotifications' : ActorMethod<
    [Array<[string, NotificationContent__1]>],
    undefined
  >,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getUserNotificationSettings' : ActorMethod<[], UserNotificationSettings>,
  'getUserNotifications' : ActorMethod<
    [string, string],
    GetUserNotificationsResponse
  >,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'markNotificationsAsRead' : ActorMethod<[Array<string>], undefined>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_1>,
  'updateNotificationSettings' : ActorMethod<
    [UserNotificationSettings],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
