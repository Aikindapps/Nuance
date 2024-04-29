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
export type Followers = [] | [[string, List]];
export type FollowersPrincipals = [] | [[string, List]];
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
export interface NumericEntity {
  'avg' : bigint,
  'max' : bigint,
  'min' : bigint,
  'first' : bigint,
  'last' : bigint,
}
export interface Post {
  'url' : string,
  'bucketCanisterId' : string,
  'title' : string,
  'created' : string,
  'modified' : string,
  'content' : string,
  'views' : string,
  'wordCount' : string,
  'isPremium' : boolean,
  'publishedDate' : string,
  'claps' : string,
  'tags' : Array<PostTagModel>,
  'nftCanisterId' : [] | [string],
  'isDraft' : boolean,
  'creatorPrincipal' : string,
  'category' : string,
  'handle' : string,
  'creatorHandle' : string,
  'headerImage' : string,
  'subtitle' : string,
  'isPublication' : boolean,
  'postId' : string,
}
export interface PostTagModel { 'tagId' : string, 'tagName' : string }
export interface Publication {
  'cta' : PublicationCta,
  'categories' : Array<string>,
  'styling' : PublicationStyling,
  'created' : string,
  'modified' : string,
  'editors' : Array<string>,
  'socialLinks' : SocialLinksObject,
  'description' : string,
  'nftCanisterId' : string,
  'publicationTitle' : string,
  'publicationHandle' : string,
  'writers' : Array<string>,
  'headerImage' : string,
  'subtitle' : string,
  'avatar' : string,
}
export interface PublicationCta {
  'icon' : string,
  'link' : string,
  'ctaCopy' : string,
  'buttonCopy' : string,
}
export interface PublicationCta__1 {
  'icon' : string,
  'link' : string,
  'ctaCopy' : string,
  'buttonCopy' : string,
}
export interface PublicationObject {
  'isEditor' : boolean,
  'publicationName' : string,
}
export interface PublicationStyling {
  'primaryColor' : string,
  'logo' : string,
  'fontType' : string,
}
export interface Publisher {
  'acceptCycles' : ActorMethod<[], undefined>,
  'addEditor' : ActorMethod<[string], Result>,
  'addPublicationPostCategory' : ActorMethod<[string, string], Result_1>,
  'addWriter' : ActorMethod<[string], Result>,
  'availableCycles' : ActorMethod<[], bigint>,
  'collectCanisterMetrics' : ActorMethod<[], undefined>,
  'getAdmins' : ActorMethod<[], Result_6>,
  'getCanisterMetrics' : ActorMethod<
    [GetMetricsParameters],
    [] | [CanisterMetrics]
  >,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getCgUsers' : ActorMethod<[], Result_6>,
  'getEditorAndWriterPrincipalIds' : ActorMethod<
    [],
    [Array<string>, Array<string>]
  >,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getPlatformOperators' : ActorMethod<[], List>,
  'getPublication' : ActorMethod<[string], Result>,
  'getPublicationQuery' : ActorMethod<[string], Result>,
  'idQuick' : ActorMethod<[], Principal>,
  'initializeCanister' : ActorMethod<[string, string, string], Result_3>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'migrateEditorsWritersHandles' : ActorMethod<[], Result>,
  'registerAdmin' : ActorMethod<[string], Result_4>,
  'registerCgUser' : ActorMethod<[string], Result_4>,
  'registerPlatformOperator' : ActorMethod<[string], Result_4>,
  'registerPublication' : ActorMethod<[string, string], Result>,
  'removeEditor' : ActorMethod<[string], Result>,
  'removePublicationPostCategory' : ActorMethod<[string], Result_1>,
  'removeWriter' : ActorMethod<[string], Result>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_5>,
  'unregisterAdmin' : ActorMethod<[string], Result_4>,
  'unregisterCgUser' : ActorMethod<[string], Result_4>,
  'unregisterPlatformOperator' : ActorMethod<[string], Result_4>,
  'unregisterPublication' : ActorMethod<[], Result_3>,
  'updateEditorOrWriterHandle' : ActorMethod<[string, string], undefined>,
  'updatePublicationCta' : ActorMethod<[PublicationCta__1], Result>,
  'updatePublicationDetails' : ActorMethod<
    [
      string,
      string,
      string,
      Array<string>,
      Array<string>,
      Array<string>,
      string,
      string,
      SocialLinksObject__1,
      string,
    ],
    Result
  >,
  'updatePublicationHandle' : ActorMethod<[string], Result_2>,
  'updatePublicationPostDraft' : ActorMethod<[string, boolean], Result_1>,
  'updatePublicationStyling' : ActorMethod<[string, string, string], Result>,
  'updatePublicationWriters' : ActorMethod<[Array<string>], Result>,
}
export type Result = { 'ok' : Publication } |
  { 'err' : string };
export type Result_1 = { 'ok' : Post } |
  { 'err' : string };
export type Result_2 = { 'ok' : User } |
  { 'err' : string };
export type Result_3 = { 'ok' : string } |
  { 'err' : string };
export type Result_4 = { 'ok' : null } |
  { 'err' : string };
export type Result_5 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_6 = { 'ok' : Array<string> } |
  { 'err' : string };
export interface SocialLinksObject {
  'socialChannels' : Array<string>,
  'website' : string,
}
export interface SocialLinksObject__1 {
  'socialChannels' : Array<string>,
  'website' : string,
}
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
export interface _SERVICE extends Publisher {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
