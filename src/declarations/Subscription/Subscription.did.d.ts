import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface PaymentRequest {
  'subscriptionEventId' : string,
  'subaccount' : Uint8Array | number[],
  'subscriptionTimeInterval' : SubscriptionTimeInterval,
  'writerPrincipalId' : string,
  'expirationDate' : bigint,
  'paymentFee' : string,
  'readerPrincipalId' : string,
}
export interface ReaderSubscriptionDetails {
  'readerSubscriptions' : Array<SubscriptionEvent>,
  'readerNotStoppedSubscriptionsWriters' : Array<WriterSubscriptionDetails>,
  'readerPrincipalId' : string,
}
export type Result = { 'ok' : WriterSubscriptionDetails } |
  { 'err' : string };
export type Result_1 = { 'ok' : ReaderSubscriptionDetails } |
  { 'err' : string };
export type Result_2 = { 'ok' : PaymentRequest } |
  { 'err' : string };
export type Result_3 = { 'ok' : null } |
  { 'err' : string };
export interface SubscriptionEvent {
  'startTime' : bigint,
  'subscriptionEventId' : string,
  'endTime' : bigint,
  'subscriptionTimeInterval' : SubscriptionTimeInterval,
  'writerPrincipalId' : string,
  'paymentFee' : string,
  'isWriterSubscriptionActive' : boolean,
  'readerPrincipalId' : string,
}
export type SubscriptionTimeInterval = { 'LifeTime' : null } |
  { 'Weekly' : null } |
  { 'Monthly' : null } |
  { 'Annually' : null };
export interface UpdateSubscriptionDetailsModel {
  'weeklyFee' : [] | [bigint],
  'lifeTimeFee' : [] | [bigint],
  'annuallyFee' : [] | [bigint],
  'monthlyFee' : [] | [bigint],
  'publicationInformation' : [] | [[Principal, string]],
}
export interface WriterSubscriptionDetails {
  'writerSubscriptions' : Array<SubscriptionEvent>,
  'weeklyFee' : [] | [string],
  'paymentReceiverPrincipalId' : string,
  'writerPrincipalId' : string,
  'lifeTimeFee' : [] | [string],
  'isSubscriptionActive' : boolean,
  'annuallyFee' : [] | [string],
  'monthlyFee' : [] | [string],
}
export interface _SERVICE {
  'checkMyExpiredSubscriptionsNotifications' : ActorMethod<[], undefined>,
  'completeSubscriptionEvent' : ActorMethod<[string], Result_1>,
  'createPaymentRequestAsReader' : ActorMethod<
    [string, SubscriptionTimeInterval, bigint],
    Result_2
  >,
  'disperseTokensForSuccessfulSubscription' : ActorMethod<[string], Result_3>,
  'expiredNotificationsHeartbeatExternal' : ActorMethod<[], undefined>,
  'getLatestTimerCall' : ActorMethod<[], [string, string]>,
  'getPaymentRequestBySubscriptionEventId' : ActorMethod<[string], Result_2>,
  'getReaderSubscriptionDetails' : ActorMethod<[], Result_1>,
  'getWriterSubscriptionDetails' : ActorMethod<[[] | [string]], Result>,
  'getWriterSubscriptionDetailsByPrincipalId' : ActorMethod<[string], Result>,
  'isReaderSubscriber' : ActorMethod<[string, string], boolean>,
  'isWriterActivatedSubscription' : ActorMethod<[string], boolean>,
  'pendingStuckTokensHeartbeatExternal' : ActorMethod<[], undefined>,
  'pendingTokensHeartbeatExternal' : ActorMethod<[], undefined>,
  'stopSubscription' : ActorMethod<[string], Result_1>,
  'updateSubscriptionDetails' : ActorMethod<
    [UpdateSubscriptionDetailsModel],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
