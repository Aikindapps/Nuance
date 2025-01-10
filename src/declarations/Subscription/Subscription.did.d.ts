import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Icrc28TrustedOriginsResponse {
  'trusted_origins' : Array<string>,
}
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
export type Result_2 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_3 = { 'ok' : PaymentRequest } |
  { 'err' : string };
export type Result_4 = { 'ok' : null } |
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
  'acceptCycles' : ActorMethod<[], undefined>,
  'availableCycles' : ActorMethod<[], bigint>,
  'checkMyExpiredSubscriptionsNotifications' : ActorMethod<[], undefined>,
  'completeSubscriptionEvent' : ActorMethod<[string], Result_1>,
  'createPaymentRequestAsReader' : ActorMethod<
    [string, SubscriptionTimeInterval, bigint],
    Result_3
  >,
  'disperseTokensForSuccessfulSubscription' : ActorMethod<[string], Result_4>,
  'expiredNotificationsHeartbeatExternal' : ActorMethod<[], undefined>,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getLatestTimerCall' : ActorMethod<[], [string, string]>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getPaymentRequestBySubscriptionEventId' : ActorMethod<[string], Result_3>,
  'getReaderSubscriptionDetails' : ActorMethod<[], Result_1>,
  'getWriterSubscriptionDetails' : ActorMethod<[[] | [string]], Result>,
  'getWriterSubscriptionDetailsByPrincipalId' : ActorMethod<[string], Result>,
  'icrc28_trusted_origins' : ActorMethod<[], Icrc28TrustedOriginsResponse>,
  'isReaderSubscriber' : ActorMethod<[string, string], boolean>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'isWriterActivatedSubscription' : ActorMethod<[string], boolean>,
  'pendingStuckTokensHeartbeatExternal' : ActorMethod<[], undefined>,
  'pendingTokensHeartbeatExternal' : ActorMethod<[], undefined>,
  'sendNewSubscriptionNotifications' : ActorMethod<
    [SubscriptionEvent],
    undefined
  >,
  'sendStopSubscriptionNotification' : ActorMethod<[string, string], undefined>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_2>,
  'stopSubscription' : ActorMethod<[string], Result_1>,
  'updateSubscriptionDetails' : ActorMethod<
    [UpdateSubscriptionDetailsModel],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
