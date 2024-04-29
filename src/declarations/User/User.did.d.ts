import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AddPublicationReturn = { 'ok' : User__1 } |
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
export interface PublicationObject__1 {
  'isEditor' : boolean,
  'publicationName' : string,
}
export type RegisterUserReturn = { 'ok' : User__1 } |
  { 'err' : string };
export type RemovePublicationReturn = { 'ok' : User__1 } |
  { 'err' : string };
export type Result = { 'ok' : User } |
  { 'err' : string };
export type Result_1 = { 'ok' : null } |
  { 'err' : string };
export type Result_2 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_3 = { 'ok' : [bigint, bigint] } |
  { 'err' : string };
export type Result_4 = { 'ok' : UserListItem } |
  { 'err' : string };
export type Result_5 = { 'ok' : Array<string> } |
  { 'err' : string };
export type Result_6 = { 'ok' : Array<UserListItem> } |
  { 'err' : string };
export type Result_7 = { 'ok' : Array<User> } |
  { 'err' : string };
export type Result_8 = { 'ok' : string } |
  { 'err' : string };
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
  'website' : string,
  'handle' : string,
  'followersPrincipals' : FollowersPrincipals,
  'followers' : Followers,
  'avatar' : string,
}
export interface UserListItem {
  'bio' : string,
  'socialChannelsUrls' : Array<string>,
  'principal' : string,
  'displayName' : string,
  'followersCount' : string,
  'website' : string,
  'handle' : string,
  'fontType' : string,
  'avatar' : string,
}
export interface User__1 {
  'bio' : string,
  'socialChannels' : Array<string>,
  'followersArray' : Array<string>,
  'displayName' : string,
  'followersCount' : number,
  'nuaTokens' : number,
  'accountCreated' : string,
  'publicationsArray' : Array<PublicationObject>,
  'website' : string,
  'handle' : string,
  'followersPrincipals' : FollowersPrincipals,
  'followers' : Followers,
  'avatar' : string,
}
export type Validate = { 'Ok' : string } |
  { 'Err' : string };
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'addNuaBalance' : ActorMethod<[string], undefined>,
  'addPublication' : ActorMethod<
    [PublicationObject__1, string],
    AddPublicationReturn
  >,
  'adminAirDrop' : ActorMethod<[number], Result_8>,
  'availableCycles' : ActorMethod<[], bigint>,
  'clearAllMyFollowers' : ActorMethod<[], string>,
  'collectCanisterMetrics' : ActorMethod<[], undefined>,
  'deleteUser' : ActorMethod<[string], Result_2>,
  'dumpUsers' : ActorMethod<[], string>,
  'followAuthor' : ActorMethod<[string], Result>,
  'generateAccountIds' : ActorMethod<[], undefined>,
  'generateLowercaseHandles' : ActorMethod<[], [string, Array<string>]>,
  'getActiveUsersByRange' : ActorMethod<[Date], bigint>,
  'getAdmins' : ActorMethod<[], Result_5>,
  'getAllHandles' : ActorMethod<[], Array<string>>,
  'getCanisterMetrics' : ActorMethod<
    [GetMetricsParameters],
    [] | [CanisterMetrics]
  >,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getCgUsers' : ActorMethod<[], Result_5>,
  'getDailyMaxRegistration' : ActorMethod<[], bigint>,
  'getFollowersCount' : ActorMethod<[string], string>,
  'getHandleByPrincipal' : ActorMethod<[string], GetHandleByPrincipalReturn>,
  'getHandlesByAccountIdentifiers' : ActorMethod<
    [Array<string>],
    Array<string>
  >,
  'getHandlesByPrincipals' : ActorMethod<[Array<string>], Array<string>>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getMultipleUsersByPrincipalId' : ActorMethod<[Array<string>], Result_7>,
  'getMyFollowers' : ActorMethod<[], Result_6>,
  'getNuaBalance' : ActorMethod<[string], NuaBalanceResult>,
  'getNumberOfAllRegisteredUsers' : ActorMethod<[], bigint>,
  'getPlatformOperators' : ActorMethod<[], List>,
  'getPrincipalByHandle' : ActorMethod<[string], GetPrincipalByHandleReturn>,
  'getPrincipalsByHandles' : ActorMethod<[Array<string>], Array<string>>,
  'getRegistrationNumberLastDay' : ActorMethod<[], bigint>,
  'getTrustedCanisters' : ActorMethod<[], Result_5>,
  'getUser' : ActorMethod<[], Result>,
  'getUserByHandle' : ActorMethod<[string], Result>,
  'getUserByPrincipalId' : ActorMethod<[string], Result>,
  'getUserFollowers' : ActorMethod<[string], Array<UserListItem>>,
  'getUserInternal' : ActorMethod<[string], [] | [User]>,
  'getUserListItemByHandle' : ActorMethod<[string], Result_4>,
  'getUsersByHandles' : ActorMethod<[Array<string>], Array<UserListItem>>,
  'handleClap' : ActorMethod<[string, string], undefined>,
  'isRegistrationOpen' : ActorMethod<[], boolean>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'migrateFollowersHashmapsFromHandlesToPrincipalIds' : ActorMethod<
    [],
    Result_3
  >,
  'registerAdmin' : ActorMethod<[string], Result_1>,
  'registerCanister' : ActorMethod<[string], Result_1>,
  'registerCgUser' : ActorMethod<[string], Result_1>,
  'registerPlatformOperator' : ActorMethod<[string], Result_1>,
  'registerUser' : ActorMethod<[string, string, string], RegisterUserReturn>,
  'removePublication' : ActorMethod<
    [PublicationObject__1, string],
    RemovePublicationReturn
  >,
  'setDailyMaxRegistration' : ActorMethod<[bigint], Result_2>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_2>,
  'spendNuaBalance' : ActorMethod<[string], undefined>,
  'testInstructionSize' : ActorMethod<[], string>,
  'unfollowAuthor' : ActorMethod<[string], Result>,
  'unregisterAdmin' : ActorMethod<[string], Result_1>,
  'unregisterCanister' : ActorMethod<[string], Result_1>,
  'unregisterCgUser' : ActorMethod<[string], Result_1>,
  'unregisterPlatformOperator' : ActorMethod<[string], Result_1>,
  'updateAvatar' : ActorMethod<[string], Result>,
  'updateBio' : ActorMethod<[string], Result>,
  'updateDisplayName' : ActorMethod<[string], Result>,
  'updateFontType' : ActorMethod<[string], Result>,
  'updateHandle' : ActorMethod<
    [string, string, string, [] | [Array<string>]],
    Result
  >,
  'updateLastLogin' : ActorMethod<[], undefined>,
  'updateSocialLinks' : ActorMethod<[string, Array<string>], Result>,
  'updateUserDetails' : ActorMethod<
    [string, string, string, string, Array<string>],
    Result
  >,
  'validate' : ActorMethod<[any], Validate>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
