import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Icrc28TrustedOriginsResponse {
  'trusted_origins' : Array<string>,
}
export type PaymentMethod = {
    'Fiat' : { 'stripeSubscriptionId' : string, 'usdAmountCents' : string }
  } |
  { 'Token' : null };
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
export type Result_1 = { 'ok' : null } |
  { 'err' : string };
export type Result_2 = { 'ok' : ReaderSubscriptionDetails } |
  { 'err' : string };
export type Result_3 = { 'ok' : string } |
  { 'err' : string };
export type Result_4 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_5 = { 'ok' : PaymentRequest } |
  { 'err' : string };
export interface SubscriptionEvent {
  'startTime' : bigint,
  'subscriptionEventId' : string,
  'paymentMethod' : [] | [PaymentMethod],
  'endTime' : bigint,
  'subscriptionTimeInterval' : SubscriptionTimeInterval,
  'stripeCancelAtPeriodEnd' : [] | [boolean],
  'writerPrincipalId' : string,
  'paymentFee' : string,
  'isWriterSubscriptionActive' : boolean,
  'readerPrincipalId' : string,
}
export type SubscriptionTimeInterval = { 'LifeTime' : null } |
  { 'Weekly' : null } |
  { 'Monthly' : null } |
  { 'Annually' : null };
export interface SupportedStandard { 'url' : string, 'name' : string }
export interface UpdateSubscriptionDetailsModel {
  'weeklyFee' : [] | [bigint],
  'lifeTimeFee' : [] | [bigint],
  'annuallyFee' : [] | [bigint],
  'monthlyFee' : [] | [bigint],
  'publicationInformation' : [] | [[Principal, string]],
}
export interface WriterSubscriptionDetails {
  'stripeAccountId' : [] | [string],
  'writerSubscriptions' : Array<SubscriptionEvent>,
  'weeklyFee' : [] | [string],
  'paymentReceiverPrincipalId' : string,
  'writerPrincipalId' : string,
  'lifeTimeFee' : [] | [string],
  'stripePricing' : Array<[SubscriptionTimeInterval, string, string]>,
  'isSubscriptionActive' : boolean,
  'annuallyFee' : [] | [string],
  'stripeIsActive' : boolean,
  'monthlyFee' : [] | [string],
}
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'authorizeForProxy' : ActorMethod<[string], undefined>,
  'authorizeForProxyAsEditor' : ActorMethod<[string, string], Result_1>,
  'availableCycles' : ActorMethod<[], bigint>,
  'cancelStripeSubscription' : ActorMethod<
    [string, string, string, string],
    Result_1
  >,
  'checkMyExpiredSubscriptionsNotifications' : ActorMethod<[], undefined>,
  'checkProxyAuthorization' : ActorMethod<[string, string], boolean>,
  'completeSubscriptionEvent' : ActorMethod<[string], Result_2>,
  'consumeProxyAuthorization' : ActorMethod<[string], undefined>,
  'createPaymentRequestAsReader' : ActorMethod<
    [string, SubscriptionTimeInterval, bigint],
    Result_5
  >,
  'deactivateStripeAccount' : ActorMethod<[string], Result>,
  'disperseTokensForSuccessfulSubscription' : ActorMethod<[string], Result_1>,
  'expiredNotificationsHeartbeatExternal' : ActorMethod<[], undefined>,
  'getAuthorActivePaidSubscriberPrincipalIds' : ActorMethod<
    [string],
    Array<string>
  >,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getLatestTimerCall' : ActorMethod<[], [string, string]>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getPaymentRequestBySubscriptionEventId' : ActorMethod<[string], Result_5>,
  'getReaderSubscriptionDetails' : ActorMethod<[], Result_2>,
  'getStripeAccountId' : ActorMethod<[string], [] | [string]>,
  'getStripeCustomerId' : ActorMethod<[string], [] | [string]>,
  'getTrustedProxyPrincipal' : ActorMethod<[], string>,
  'getWriterSubscriptionDetails' : ActorMethod<[[] | [string]], Result>,
  'getWriterSubscriptionDetailsByPrincipalId' : ActorMethod<[string], Result>,
  'icrc10_supported_standards' : ActorMethod<[], Array<SupportedStandard>>,
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
  'setMaxMemorySize' : ActorMethod<[bigint], Result_4>,
  'setStripeAccountActive' : ActorMethod<[string, boolean], Result>,
  'setStripeSubscriptionCancelState' : ActorMethod<
    [string, string, string, boolean, bigint],
    Result_1
  >,
  'setTrustedProxyPrincipal' : ActorMethod<[string], Result_3>,
  'stopSubscription' : ActorMethod<[string], Result_2>,
  'syncStripeSubscription' : ActorMethod<
    [
      string,
      string,
      string,
      SubscriptionTimeInterval,
      string,
      string,
      bigint,
      string,
    ],
    Result_1
  >,
  'updateStripeAccount' : ActorMethod<[string, string], Result>,
  'updateStripePriceTier' : ActorMethod<
    [string, SubscriptionTimeInterval, string, string],
    Result
  >,
  'updateSubscriptionDetails' : ActorMethod<
    [UpdateSubscriptionDetailsModel],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
