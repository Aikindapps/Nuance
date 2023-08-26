import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

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
export interface NftCanisterEntry { 'handle' : string, 'canisterId' : string }
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
export type Result_3 = { 'ok' : string } |
  { 'err' : string };
export type Result_4 = { 'ok' : Array<string> } |
  { 'err' : string };
export type Result_5 = { 'ok' : Array<UserListItem> } |
  { 'err' : string };
export type UpdateCallsAggregatedData = BigUint64Array | bigint[];
export interface User {
  'bio' : string,
  'followersArray' : Array<string>,
  'displayName' : string,
  'followersCount' : number,
  'nuaTokens' : number,
  'accountCreated' : string,
  'publicationsArray' : Array<PublicationObject>,
  'handle' : string,
  'followers' : Followers,
  'avatar' : string,
}
export interface UserListItem {
  'bio' : string,
  'principal' : string,
  'displayName' : string,
  'handle' : string,
  'fontType' : string,
  'avatar' : string,
}
export interface User__1 {
  'bio' : string,
  'followersArray' : Array<string>,
  'displayName' : string,
  'followersCount' : number,
  'nuaTokens' : number,
  'accountCreated' : string,
  'publicationsArray' : Array<PublicationObject>,
  'handle' : string,
  'followers' : Followers,
  'avatar' : string,
}
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'addNuaBalance' : ActorMethod<[string], undefined>,
  'addPublication' : ActorMethod<
    [PublicationObject__1, string],
    AddPublicationReturn
  >,
  'adminAirDrop' : ActorMethod<[number], Result_3>,
  'availableCycles' : ActorMethod<[], bigint>,
  'clearAllMyFollowers' : ActorMethod<[], string>,
  'collectCanisterMetrics' : ActorMethod<[], undefined>,
  'deleteUser' : ActorMethod<[string], Result_2>,
  'dumpUsers' : ActorMethod<[], string>,
  'followAuthor' : ActorMethod<[string], Result>,
  'generateAccountIds' : ActorMethod<[], undefined>,
  'generateLowercaseHandles' : ActorMethod<[], [string, Array<string>]>,
  'getActiveUsersByRange' : ActorMethod<[Date], bigint>,
  'getAdmins' : ActorMethod<[], Result_4>,
  'getAllHandles' : ActorMethod<[], Array<string>>,
  'getCanisterMetrics' : ActorMethod<
    [GetMetricsParameters],
    [] | [CanisterMetrics]
  >,
  'getCgUsers' : ActorMethod<[], Result_4>,
  'getDailyMaxRegistration' : ActorMethod<[], bigint>,
  'getFollowersCount' : ActorMethod<[string], string>,
  'getHandleByPrincipal' : ActorMethod<[string], GetHandleByPrincipalReturn>,
  'getHandlesByAccountIdentifiers' : ActorMethod<
    [Array<string>],
    Array<string>
  >,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getMyFollowers' : ActorMethod<[number, number], Result_5>,
  'getNftCanisters' : ActorMethod<[], Array<NftCanisterEntry>>,
  'getNuaBalance' : ActorMethod<[string], NuaBalanceResult>,
  'getNumberOfAllRegisteredUsers' : ActorMethod<[], bigint>,
  'getPrincipalByHandle' : ActorMethod<[string], GetPrincipalByHandleReturn>,
  'getPrincipalsByHandles' : ActorMethod<[Array<string>], Array<string>>,
  'getRegistrationNumberLastDay' : ActorMethod<[], bigint>,
  'getTrustedCanisters' : ActorMethod<[], Result_4>,
  'getUser' : ActorMethod<[], Result>,
  'getUserByHandle' : ActorMethod<[string], Result>,
  'getUserByPrincipalId' : ActorMethod<[string], Result>,
  'getUserFollowers' : ActorMethod<[string], Array<string>>,
  'getUserInternal' : ActorMethod<[string], [] | [User]>,
  'getUsersByHandles' : ActorMethod<[Array<string>], Array<UserListItem>>,
  'handleClap' : ActorMethod<[string, string], undefined>,
  'initFollowers' : ActorMethod<[bigint, bigint], string>,
  'isRegistrationOpen' : ActorMethod<[], boolean>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'registerAdmin' : ActorMethod<[string], Result_1>,
  'registerCanister' : ActorMethod<[string], Result_1>,
  'registerCgUser' : ActorMethod<[string], Result_1>,
  'registerNftCanisterId' : ActorMethod<[string], Result_3>,
  'registerUser' : ActorMethod<[string, string, string], RegisterUserReturn>,
  'removePublication' : ActorMethod<
    [PublicationObject__1, string],
    RemovePublicationReturn
  >,
  'setDailyMaxRegistration' : ActorMethod<[bigint], Result_2>,
  'setFollowersCount' : ActorMethod<[], GetHandleByPrincipalReturn>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_2>,
  'spendNuaBalance' : ActorMethod<[string], undefined>,
  'testInstructionSize' : ActorMethod<[], string>,
  'unfollowAuthor' : ActorMethod<[string], Result>,
  'unregisterAdmin' : ActorMethod<[string], Result_1>,
  'unregisterCanister' : ActorMethod<[string], Result_1>,
  'unregisterCgUser' : ActorMethod<[string], Result_1>,
  'updateAvatar' : ActorMethod<[string], Result>,
  'updateBio' : ActorMethod<[string], Result>,
  'updateDisplayName' : ActorMethod<[string], Result>,
  'updateFontType' : ActorMethod<[string], Result>,
  'updateHandle' : ActorMethod<
    [string, string, string, [] | [Array<string>]],
    Result
  >,
  'updateLastLogin' : ActorMethod<[], undefined>,
}
