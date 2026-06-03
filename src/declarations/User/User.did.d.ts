import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AddPublicationReturn = { 'ok' : User } |
  { 'err' : string };
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
export interface Date {
  'day' : bigint,
  'month' : bigint,
  'hour' : bigint,
  'year' : bigint,
}
export interface EmailBatchSummary {
  'id' : string,
  'nextAttemptAt' : bigint,
  'attempts' : bigint,
  'updatedAt' : bigint,
  'lastError' : string,
  'recipientCount' : bigint,
  'firstAttemptedAt' : bigint,
  'authorPrincipal' : string,
  'postId' : string,
}
export interface EmailSubscriber {
  'unsubscribedAt' : [] | [bigint],
  'verified' : boolean,
  'userId' : [] | [string],
  'createdAt' : bigint,
  'email' : string,
  'verifiedAt' : [] | [bigint],
  'authorPrincipal' : string,
}
export type Followers = [] | [[string, List]];
export type FollowersPrincipals = [] | [[string, List]];
export type GetHandleByPrincipalReturn = { 'ok' : [] | [string] } |
  { 'err' : string };
export interface GetMetricsParameters {
  'dateToMillis' : bigint,
  'granularity' : MetricsGranularity,
  'dateFromMillis' : bigint,
}
export type GetPrincipalByHandleReturn = { 'ok' : [] | [string] } |
  { 'err' : string };
export interface HourlyMetricsData {
  'updateCalls' : UpdateCallsAggregatedData,
  'canisterHeapMemorySize' : CanisterHeapMemoryAggregatedData,
  'canisterCycles' : CanisterCyclesAggregatedData,
  'canisterMemorySize' : CanisterMemoryAggregatedData,
  'timeMillis' : bigint,
}
export interface Icrc28TrustedOriginsResponse {
  'trusted_origins' : Array<string>,
}
export type List = [] | [[string, List]];
export type MetricsGranularity = { 'hourly' : null } |
  { 'daily' : null };
export type NuaBalanceResult = { 'ok' : string } |
  { 'err' : string };
export interface NumericEntity {
  'avg' : bigint,
  'max' : bigint,
  'min' : bigint,
  'first' : bigint,
  'last' : bigint,
}
export interface PublicationObject {
  'isEditor' : boolean,
  'publicationName' : string,
}
export interface PublishedArticlePayload {
  'url' : string,
  'title' : string,
  'contentHtml' : string,
  'authorAvatar' : string,
  'publishedAt' : bigint,
  'publicationDisplayName' : [] | [string],
  'publicationHandle' : [] | [string],
  'headerImage' : string,
  'authorDisplayName' : string,
  'publicationAvatar' : [] | [string],
  'authorHandle' : string,
  'isMembersOnly' : boolean,
  'subtitle' : string,
  'authorPrincipal' : string,
  'postId' : string,
}
export interface ReaderSubscriptionDetails {
  'readerSubscriptions' : Array<SubscriptionEvent>,
  'readerNotStoppedSubscriptionsWriters' : Array<WriterSubscriptionDetails>,
  'readerPrincipalId' : string,
}
export type RegisterUserReturn = { 'ok' : User } |
  { 'err' : string };
export type RemovePublicationReturn = { 'ok' : User } |
  { 'err' : string };
export type Result = { 'ok' : { 'email' : string, 'authorHandle' : string } } |
  { 'err' : string };
export type Result_1 = { 'ok' : User } |
  { 'err' : string };
export type Result_10 = { 'ok' : UserListItem } |
  { 'err' : string };
export type Result_11 = { 'ok' : Array<EmailBatchSummary> } |
  { 'err' : string };
export type Result_12 = { 'ok' : Array<UserListItem> } |
  { 'err' : string };
export type Result_13 = { 'ok' : Array<User> } |
  { 'err' : string };
export type Result_14 = { 'ok' : Array<EmailSubscriber> } |
  { 'err' : string };
export type Result_15 = { 'ok' : Array<[string, bigint]> } |
  { 'err' : string };
export type Result_16 = { 'ok' : [] | [string] } |
  { 'err' : string };
export type Result_2 = { 'ok' : string } |
  { 'err' : string };
export type Result_3 = { 'ok' : null } |
  { 'err' : string };
export type Result_4 = { 'ok' : ReaderSubscriptionDetails } |
  { 'err' : string };
export type Result_5 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_6 = { 'ok' : boolean } |
  { 'err' : string };
export type Result_7 = {
    'ok' : {
      'totalRecipients' : bigint,
      'batchesFailed' : bigint,
      'batchesSent' : bigint,
    }
  } |
  { 'err' : string };
export type Result_8 = { 'ok' : [bigint, bigint] } |
  { 'err' : string };
export type Result_9 = { 'ok' : Array<string> } |
  { 'err' : string };
export type PaymentMethod = {
    'Fiat' : { 'stripeSubscriptionId' : string, 'usdAmountCents' : string }
  } |
  { 'Token' : null };
export interface SubscriptionEvent {
  'startTime' : bigint,
  'subscriptionEventId' : string,
  'paymentMethod' : [] | [PaymentMethod],
  'endTime' : bigint,
  'subscriptionTimeInterval' : SubscriptionTimeInterval,
  'writerPrincipalId' : string,
  'paymentFee' : string,
  'isWriterSubscriptionActive' : boolean,
  'readerPrincipalId' : string,
  'stripeCancelAtPeriodEnd' : [] | [boolean],
}
export type SubscriptionTimeInterval = { 'LifeTime' : null } |
  { 'Weekly' : null } |
  { 'Monthly' : null } |
  { 'Annually' : null };
export interface SupportedStandard { 'url' : string, 'name' : string }
export interface UniquePersonProof {
  'provider' : UniquePersonProofProvider,
  'timestamp' : bigint,
}
export type UniquePersonProofProvider = { 'DecideAI' : null };
export type UpdateCallsAggregatedData = BigUint64Array | bigint[];
export interface User {
  'bio' : string,
  'socialChannels' : Array<string>,
  'followersArray' : Array<string>,
  'displayName' : string,
  'followersCount' : number,
  'nuaTokens' : number,
  'accountCreated' : string,
  'publicationsArray' : Array<PublicationObject>,
  'claimInfo' : UserClaimInfo,
  'website' : string,
  'isVerified' : boolean,
  'handle' : string,
  'followersPrincipals' : FollowersPrincipals,
  'followers' : Followers,
  'avatar' : string,
}
export interface UserClaimInfo {
  'isUserBlocked' : boolean,
  'maxClaimableTokens' : string,
  'subaccount' : [] | [Uint8Array | number[]],
  'lastClaimDate' : [] | [string],
  'isClaimActive' : boolean,
}
export interface UserListItem {
  'bio' : string,
  'socialChannelsUrls' : Array<string>,
  'principal' : string,
  'displayName' : string,
  'followersCount' : string,
  'website' : string,
  'isVerified' : boolean,
  'handle' : string,
  'fontType' : string,
  'avatar' : string,
}
export type Validate = { 'Ok' : string } |
  { 'Err' : string };
export type VerifyResult = { 'Ok' : UniquePersonProof } |
  { 'Err' : string };
export interface WriterSubscriptionDetails {
  'writerSubscriptions' : Array<SubscriptionEvent>,
  'weeklyFee' : [] | [string],
  'paymentReceiverPrincipalId' : string,
  'writerPrincipalId' : string,
  'lifeTimeFee' : [] | [string],
  'isSubscriptionActive' : boolean,
  'annuallyFee' : [] | [string],
  'monthlyFee' : [] | [string],
  'stripeAccountId' : [] | [string],
  'stripeIsActive' : boolean,
  'stripePricing' : Array<[SubscriptionTimeInterval, string, string]>,
}
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'addNuaBalance' : ActorMethod<[string], undefined>,
  'addPublication' : ActorMethod<
    [PublicationObject, string],
    AddPublicationReturn
  >,
  'adminAirDrop' : ActorMethod<[number], Result_2>,
  'adminGetDecideIdClientId' : ActorMethod<[], Result_16>,
  'adminIsDecideIdClientSecretSet' : ActorMethod<[], Result_6>,
  'adminSetDecideIdClientId' : ActorMethod<[[] | [string]], Result_3>,
  'adminSetDecideIdClientSecret' : ActorMethod<[[] | [string]], Result_3>,
  'availableCycles' : ActorMethod<[], bigint>,
  'blockUserFromClaiming' : ActorMethod<[string], Result_3>,
  'checkMyClaimNotification' : ActorMethod<[], undefined>,
  'claimRestrictedTokens' : ActorMethod<[], Result_1>,
  'clearAllMyFollowers' : ActorMethod<[], string>,
  'collectCanisterMetrics' : ActorMethod<[], undefined>,
  'createDecideIdState' : ActorMethod<[string], Result_2>,
  'deleteConfirmedLinkings' : ActorMethod<[], Result_3>,
  'deleteUser' : ActorMethod<[string], Result_5>,
  'dumpUsers' : ActorMethod<[], string>,
  'followAuthor' : ActorMethod<[string], Result_1>,
  'generateAccountIds' : ActorMethod<[], undefined>,
  'generateLowercaseHandles' : ActorMethod<[], [string, Array<string>]>,
  'getActiveUsersByRange' : ActorMethod<[Date], bigint>,
  'getAdmins' : ActorMethod<[], Result_9>,
  'getAllClaimSubaccountIndexes' : ActorMethod<[], Result_15>,
  'getAllHandles' : ActorMethod<[], Array<string>>,
  'getAllUserPrincipals' : ActorMethod<[], Result_9>,
  'getCanisterMetrics' : ActorMethod<
    [GetMetricsParameters],
    [] | [CanisterMetrics]
  >,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getCgUsers' : ActorMethod<[], Result_9>,
  'getDailyMaxRegistration' : ActorMethod<[], bigint>,
  'getDeadEmailBatches' : ActorMethod<[], Result_11>,
  'getEmailSubscribersOfAuthor' : ActorMethod<[string], Result_14>,
  'getEmailSubscribersOfPublication' : ActorMethod<[string], Result_14>,
  'getFollowersByPrincipalId' : ActorMethod<[Principal], Array<UserListItem>>,
  'getFollowersCount' : ActorMethod<[string], string>,
  'getFollowersPrincipalIdsByPrincipalId' : ActorMethod<
    [string],
    Array<string>
  >,
  'getHandleByPrincipal' : ActorMethod<[string], GetHandleByPrincipalReturn>,
  'getHandlesByAccountIdentifiers' : ActorMethod<
    [Array<string>],
    Array<string>
  >,
  'getHandlesByPrincipals' : ActorMethod<[Array<string>], Array<string>>,
  'getLastDayClaimedTokensAmount' : ActorMethod<[], bigint>,
  'getLastDayNumberOfClaimEvents' : ActorMethod<[], bigint>,
  'getLinkedPrincipal' : ActorMethod<[string], Result_2>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getMultipleUsersByPrincipalId' : ActorMethod<[Array<string>], Result_13>,
  'getMyFollowers' : ActorMethod<[], Result_12>,
  'getNuaBalance' : ActorMethod<[string], NuaBalanceResult>,
  'getNumberOfAllRegisteredUsers' : ActorMethod<[], bigint>,
  'getPendingEmailBatches' : ActorMethod<[], Result_11>,
  'getPlatformOperators' : ActorMethod<[], List>,
  'getPrincipalByHandle' : ActorMethod<[string], GetPrincipalByHandleReturn>,
  'getPrincipalsByHandles' : ActorMethod<[Array<string>], Array<string>>,
  'getRegistrationNumberLastDay' : ActorMethod<[], bigint>,
  'getTotalNumberOfClaimedTokens' : ActorMethod<[], bigint>,
  'getTrustedCanisters' : ActorMethod<[], Result_9>,
  'getUser' : ActorMethod<[], Result_1>,
  'getUserByHandle' : ActorMethod<[string], Result_1>,
  'getUserByPrincipalId' : ActorMethod<[string], Result_1>,
  'getUserFollowers' : ActorMethod<[string], Array<UserListItem>>,
  'getUserInternal' : ActorMethod<[string], [] | [User]>,
  'getUserListItemByHandle' : ActorMethod<[string], Result_10>,
  'getUsersBlockedFromClaiming' : ActorMethod<[], Result_9>,
  'getUsersByHandles' : ActorMethod<[Array<string>], Array<UserListItem>>,
  'getUsersByPrincipals' : ActorMethod<[Array<string>], Array<UserListItem>>,
  'getVerificationStatus' : ActorMethod<[string], Result_6>,
  'handleClap' : ActorMethod<[string, string], undefined>,
  'hasLettermintApiKey' : ActorMethod<[], boolean>,
  'icrc10_supported_standards' : ActorMethod<[], Array<SupportedStandard>>,
  'icrc28_trusted_origins' : ActorMethod<[], Icrc28TrustedOriginsResponse>,
  'isEmailSubscribed' : ActorMethod<[string, string], boolean>,
  'isEmailSubscribedByCaller' : ActorMethod<[string, [] | [string]], boolean>,
  'isRegistrationOpen' : ActorMethod<[], boolean>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'linkInternetIdentityConfirm' : ActorMethod<[string], Result_3>,
  'linkInternetIdentityRequest' : ActorMethod<[string, string], Result_3>,
  'migrateFollowersHashmapsFromHandlesToPrincipalIds' : ActorMethod<
    [],
    Result_8
  >,
  'notifyAuthorArticlePublished' : ActorMethod<
    [PublishedArticlePayload, Array<string>, Array<string>],
    Result_7
  >,
  'processPendingEmailBatchesNow' : ActorMethod<[], Result_2>,
  'registerAdmin' : ActorMethod<[string], Result_3>,
  'registerCanister' : ActorMethod<[string], Result_3>,
  'registerCgUser' : ActorMethod<[string], Result_3>,
  'registerPlatformOperator' : ActorMethod<[string], Result_3>,
  'registerUser' : ActorMethod<[string, string, string], RegisterUserReturn>,
  'removePoh' : ActorMethod<[string], Result_1>,
  'removePublication' : ActorMethod<
    [PublicationObject, string],
    RemovePublicationReturn
  >,
  'retryDeadEmailBatch' : ActorMethod<[string], Result_2>,
  'setDailyMaxRegistration' : ActorMethod<[bigint], Result_5>,
  'setIsClaimActive' : ActorMethod<[boolean], Result_6>,
  'setLettermintApiKey' : ActorMethod<[string], Result_3>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_5>,
  'setMaxNumberOfClaimableTokens' : ActorMethod<[bigint], Result_5>,
  'setMaxNumberOfDailyClaimableTokens' : ActorMethod<[bigint], Result_5>,
  'spendNuaBalance' : ActorMethod<[string], undefined>,
  'spendRestrictedTokensForSubscription' : ActorMethod<
    [string, bigint],
    Result_4
  >,
  'spendRestrictedTokensForTipping' : ActorMethod<
    [string, string, bigint],
    Result_3
  >,
  'subscribeToAuthorByEmail' : ActorMethod<[string, string, string], Result_2>,
  'subscribeToPublicationByEmail' : ActorMethod<
    [string, string, string, string, string],
    Result_2
  >,
  'testInstructionSize' : ActorMethod<[], string>,
  'unblockUserFromClaiming' : ActorMethod<[string], Result_3>,
  'unfollowAuthor' : ActorMethod<[string], Result_1>,
  'unregisterAdmin' : ActorMethod<[string], Result_3>,
  'unregisterCanister' : ActorMethod<[string], Result_3>,
  'unregisterCgUser' : ActorMethod<[string], Result_3>,
  'unregisterPlatformOperator' : ActorMethod<[string], Result_3>,
  'unsubscribeEmailByCaller' : ActorMethod<[string, [] | [string]], Result_2>,
  'unsubscribeEmailByToken' : ActorMethod<[string, string], Result_2>,
  'unsubscribeFromAuthorByEmail' : ActorMethod<[string, string], Result_2>,
  'updateAvatar' : ActorMethod<[string], Result_1>,
  'updateBio' : ActorMethod<[string], Result_1>,
  'updateDisplayName' : ActorMethod<[string], Result_1>,
  'updateFontType' : ActorMethod<[string], Result_1>,
  'updateHandle' : ActorMethod<
    [string, string, string, [] | [Array<string>]],
    Result_1
  >,
  'updateLastLogin' : ActorMethod<[], undefined>,
  'updateSocialLinks' : ActorMethod<[string, Array<string>], Result_1>,
  'updateUserDetails' : ActorMethod<
    [string, string, string, string, Array<string>],
    Result_1
  >,
  'validate' : ActorMethod<[any], Validate>,
  'verifyEmailSubscription' : ActorMethod<[string], Result>,
  'verifyPoh' : ActorMethod<[string, string, string], VerifyResult>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
