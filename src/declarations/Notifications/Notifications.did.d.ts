import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type CanisterCyclesAggregatedData = BigUint64Array | bigint[];
export type CanisterHeapMemoryAggregatedData = BigUint64Array | bigint[];
export type CanisterMemoryAggregatedData = BigUint64Array | bigint[];
export interface CanisterMetrics { 'data' : CanisterMetricsData }
export type CanisterMetricsData = { 'hourly' : Array<HourlyMetricsData> } |
  { 'daily' : Array<DailyMetricsData> };
export interface DailyMetricsData {
  'updateCalls' : bigint,
  'canisterHeapMemorySize' : NumericEntity,
  'canisterCycles' : NumericEntity,
  'canisterMemorySize' : NumericEntity,
  'timeMillis' : bigint,
}
export interface GetMetricsParameters {
  'dateToMillis' : bigint,
  'granularity' : MetricsGranularity,
  'dateFromMillis' : bigint,
}
export interface HourlyMetricsData {
  'updateCalls' : UpdateCallsAggregatedData,
  'canisterHeapMemorySize' : CanisterHeapMemoryAggregatedData,
  'canisterCycles' : CanisterCyclesAggregatedData,
  'canisterMemorySize' : CanisterMemoryAggregatedData,
  'timeMillis' : bigint,
}
export type List = [] | [[string, List]];
export type MetricsGranularity = { 'hourly' : null } |
  { 'daily' : null };
export type NotificationContent = {
    'TipRecievedNotificationContent' : {
      'token' : string,
      'postUrl' : string,
      'recieverIsPublication' : boolean,
      'tipAmount' : string,
      'receiverPrincipal' : Principal,
      'articleId' : string,
      'senderPrincipal' : Principal,
      'articleTitle' : string,
    }
  } |
  {
    'NewFollowerNotificationContent' : {
      'followerPrincipal' : Principal,
      'followerUrl' : string,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'AuthorExpiredSubscriptionNotificationContent' : {
      'time' : string,
      'subscriberPrincipal' : Principal,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'NewArticleNotificationContent' : {
      'url' : string,
      'tags' : Array<string>,
      'articleId' : string,
      'isAuthorPublication' : boolean,
      'articleTitle' : string,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'PostNotificationContent' : {
      'url' : string,
      'tags' : Array<string>,
      'receiverPrincipal' : Principal,
      'articleId' : string,
      'isAuthorPublication' : boolean,
      'articleTitle' : string,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'CommentNotificationContent' : {
      'url' : string,
      'tags' : Array<string>,
      'comment' : string,
      'articleId' : string,
      'isReply' : boolean,
      'isAuthorPublication' : boolean,
      'articleTitle' : string,
      'commenterPrincipal' : Principal,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'AuthorLosesSubscriberNotificationContent' : {
      'time' : string,
      'subscriberPrincipal' : Principal,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'FaucetClaimAvailableNotificationContent' : {
      'receiverPrincipal' : Principal,
    }
  } |
  {
    'YouUnsubscribedFromAuthorNotificationContent' : {
      'time' : string,
      'subscriberPrincipal' : Principal,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'AuthorGainsNewSubscriberNotificationContent' : {
      'time' : string,
      'subscriberPrincipal' : Principal,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'YouSubscribedToAuthorNotificationContent' : {
      'time' : string,
      'subscriberPrincipal' : Principal,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'PremiumArticleSoldNotificationContent' : {
      'url' : string,
      'purchaserPrincipal' : Principal,
      'articleId' : string,
      'isAuthorPublication' : boolean,
      'articleTitle' : string,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'ReaderExpiredSubscriptionNotificationContent' : {
      'time' : string,
      'subscriberPrincipal' : Principal,
      'authorPrincipal' : Principal,
    }
  };
export type NotificationContent__1 = {
    'TipRecievedNotificationContent' : {
      'token' : string,
      'postUrl' : string,
      'recieverIsPublication' : boolean,
      'tipAmount' : string,
      'receiverPrincipal' : Principal,
      'articleId' : string,
      'senderPrincipal' : Principal,
      'articleTitle' : string,
    }
  } |
  {
    'NewFollowerNotificationContent' : {
      'followerPrincipal' : Principal,
      'followerUrl' : string,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'AuthorExpiredSubscriptionNotificationContent' : {
      'time' : string,
      'subscriberPrincipal' : Principal,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'NewArticleNotificationContent' : {
      'url' : string,
      'tags' : Array<string>,
      'articleId' : string,
      'isAuthorPublication' : boolean,
      'articleTitle' : string,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'PostNotificationContent' : {
      'url' : string,
      'tags' : Array<string>,
      'receiverPrincipal' : Principal,
      'articleId' : string,
      'isAuthorPublication' : boolean,
      'articleTitle' : string,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'CommentNotificationContent' : {
      'url' : string,
      'tags' : Array<string>,
      'comment' : string,
      'articleId' : string,
      'isReply' : boolean,
      'isAuthorPublication' : boolean,
      'articleTitle' : string,
      'commenterPrincipal' : Principal,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'AuthorLosesSubscriberNotificationContent' : {
      'time' : string,
      'subscriberPrincipal' : Principal,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'FaucetClaimAvailableNotificationContent' : {
      'receiverPrincipal' : Principal,
    }
  } |
  {
    'YouUnsubscribedFromAuthorNotificationContent' : {
      'time' : string,
      'subscriberPrincipal' : Principal,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'AuthorGainsNewSubscriberNotificationContent' : {
      'time' : string,
      'subscriberPrincipal' : Principal,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'YouSubscribedToAuthorNotificationContent' : {
      'time' : string,
      'subscriberPrincipal' : Principal,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'PremiumArticleSoldNotificationContent' : {
      'url' : string,
      'purchaserPrincipal' : Principal,
      'articleId' : string,
      'isAuthorPublication' : boolean,
      'articleTitle' : string,
      'authorPrincipal' : Principal,
    }
  } |
  {
    'ReaderExpiredSubscriptionNotificationContent' : {
      'time' : string,
      'subscriberPrincipal' : Principal,
      'authorPrincipal' : Principal,
    }
  };
export type NotificationType = { 'UnknownNotificationType' : null } |
  { 'FaucetClaimAvailable' : null } |
  { 'TipReceived' : null } |
  { 'NewArticleByFollowedWriter' : null } |
  { 'AuthorLosesSubscriber' : null } |
  { 'YouSubscribedToAuthor' : null } |
  { 'AuthorExpiredSubscription' : null } |
  { 'NewCommentOnMyArticle' : null } |
  { 'YouUnsubscribedFromAuthor' : null } |
  { 'NewFollower' : null } |
  { 'ReaderExpiredSubscription' : null } |
  { 'PremiumArticleSold' : null } |
  { 'NewCommentOnFollowedArticle' : null } |
  { 'NewArticleByFollowedTag' : null } |
  { 'AuthorGainsNewSubscriber' : null };
export type NotificationType__1 = { 'UnknownNotificationType' : null } |
  { 'FaucetClaimAvailable' : null } |
  { 'TipReceived' : null } |
  { 'NewArticleByFollowedWriter' : null } |
  { 'AuthorLosesSubscriber' : null } |
  { 'YouSubscribedToAuthor' : null } |
  { 'AuthorExpiredSubscription' : null } |
  { 'NewCommentOnMyArticle' : null } |
  { 'YouUnsubscribedFromAuthor' : null } |
  { 'NewFollower' : null } |
  { 'ReaderExpiredSubscription' : null } |
  { 'PremiumArticleSold' : null } |
  { 'NewCommentOnFollowedArticle' : null } |
  { 'NewArticleByFollowedTag' : null } |
  { 'AuthorGainsNewSubscriber' : null };
export interface Notifications {
  'id' : string,
  'content' : NotificationContent__1,
  'notificationType' : NotificationType,
  'read' : boolean,
  'timestamp' : string,
}
export interface NumericEntity {
  'avg' : bigint,
  'max' : bigint,
  'min' : bigint,
  'first' : bigint,
  'last' : bigint,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_2 = { 'ok' : [Array<Notifications>, bigint] } |
  { 'err' : string };
export type Result_3 = { 'ok' : UserNotificationSettings } |
  { 'err' : string };
export type Result_4 = { 'ok' : Array<string> } |
  { 'err' : string };
export type UpdateCallsAggregatedData = BigUint64Array | bigint[];
export interface UserNotificationSettings {
  'premiumArticleSold' : boolean,
  'tipReceived' : boolean,
  'authorGainsNewSubscriber' : boolean,
  'authorExpiredSubscription' : boolean,
  'authorLosesSubscriber' : boolean,
  'newCommentOnFollowedArticle' : boolean,
  'youSubscribedToAuthor' : boolean,
  'newCommentOnMyArticle' : boolean,
  'youUnsubscribedFromAuthor' : boolean,
  'newFollower' : boolean,
  'readerExpiredSubscription' : boolean,
  'newArticleByFollowedWriter' : boolean,
  'newArticleByFollowedTag' : boolean,
  'faucetClaimAvailable' : boolean,
  'expiredSubscription' : boolean,
}
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'availableCycles' : ActorMethod<[], bigint>,
  'collectCanisterMetrics' : ActorMethod<[], undefined>,
  'createNotification' : ActorMethod<
    [NotificationType__1, NotificationContent],
    Result
  >,
  'createNotifications' : ActorMethod<
    [Array<[NotificationType__1, NotificationContent]>],
    Result
  >,
  'disperseBulkSubscriptionNotifications' : ActorMethod<
    [Array<[NotificationType__1, NotificationContent]>],
    Result
  >,
  'getAdmins' : ActorMethod<[], Result_4>,
  'getCanisterMetrics' : ActorMethod<
    [GetMetricsParameters],
    [] | [CanisterMetrics]
  >,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getCgUsers' : ActorMethod<[], Result_4>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getPlatformOperators' : ActorMethod<[], List>,
  'getUserNotificationSettings' : ActorMethod<[], Result_3>,
  'getUserNotifications' : ActorMethod<[string, string], Result_2>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'markNotificationAsRead' : ActorMethod<[Array<string>], Result>,
  'newArticle' : ActorMethod<[NotificationContent], Result>,
  'registerCgUser' : ActorMethod<[string], Result>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_1>,
  'unregisterCgUser' : ActorMethod<[string], Result>,
  'updateUserNotificationSettings' : ActorMethod<
    [UserNotificationSettings],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
