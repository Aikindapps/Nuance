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
export interface NotificationContent {
  'url' : string,
  'token' : string,
  'tipAmount' : string,
  'tags' : Array<string>,
  'senderHandle' : string,
  'receiverPrincipal' : Principal,
  'comment' : string,
  'articleId' : string,
  'isReply' : boolean,
  'senderPrincipal' : Principal,
  'receiverHandle' : string,
  'articleTitle' : string,
  'authorHandle' : string,
  'authorPrincipal' : Principal,
}
export interface NotificationContent__1 {
  'url' : string,
  'token' : string,
  'tipAmount' : string,
  'tags' : Array<string>,
  'senderHandle' : string,
  'receiverPrincipal' : Principal,
  'comment' : string,
  'articleId' : string,
  'isReply' : boolean,
  'senderPrincipal' : Principal,
  'receiverHandle' : string,
  'articleTitle' : string,
  'authorHandle' : string,
  'authorPrincipal' : Principal,
}
export type NotificationType = { 'TipReceived' : null } |
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
export type NotificationType__1 = { 'TipReceived' : null } |
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
export type Result_3 = { 'ok' : Array<string> } |
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
  'getAdmins' : ActorMethod<[], Result_3>,
  'getCanisterMetrics' : ActorMethod<
    [GetMetricsParameters],
    [] | [CanisterMetrics]
  >,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getCgUsers' : ActorMethod<[], Result_3>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getPlatformOperators' : ActorMethod<[], List>,
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
