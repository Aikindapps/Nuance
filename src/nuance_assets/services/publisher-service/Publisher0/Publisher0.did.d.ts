import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type AccountIdentifier = string;
export type AccountIdentifier__1 = string;
export type Balance = bigint;
export type CanisterCyclesAggregatedData = BigUint64Array | bigint[];
export type CanisterHeapMemoryAggregatedData = BigUint64Array | bigint[];
export type CanisterMemoryAggregatedData = BigUint64Array | bigint[];
export interface CanisterMetrics { 'data': CanisterMetricsData }
export type CanisterMetricsData = { 'hourly': Array<HourlyMetricsData> } |
{ 'daily': Array<DailyMetricsData> };
export type CommonError = { 'InvalidToken': TokenIdentifier } |
{ 'Other': string };
export interface CreateNftFromArticleResponse {
  'tokenIndexes': Uint32Array | number[],
  'transferResponses': Array<TransferResponse>,
}
export interface DailyMetricsData {
  'updateCalls': bigint,
  'canisterHeapMemorySize': NumericEntity,
  'canisterCycles': NumericEntity,
  'canisterMemorySize': NumericEntity,
  'timeMillis': bigint,
}
export type Followers = [] | [[string, List]];
export interface GetMetricsParameters {
  'dateToMillis': bigint,
  'granularity': MetricsGranularity,
  'dateFromMillis': bigint,
}
export interface GetPremiumArticleInfoReturn {
  'writerHandle': string,
  'totalSupply': string,
  'nftCanisterId': string,
  'tokenIndexStart': string,
  'sellerAccount': string,
  'postId': string,
}
export interface HourlyMetricsData {
  'updateCalls': UpdateCallsAggregatedData,
  'canisterHeapMemorySize': CanisterHeapMemoryAggregatedData,
  'canisterCycles': CanisterCyclesAggregatedData,
  'canisterMemorySize': CanisterMemoryAggregatedData,
  'timeMillis': bigint,
}
export type List = [] | [[string, List]];
export type MetricsGranularity = { 'hourly': null } |
{ 'daily': null };
export interface NftCanisterInformation {
  'nuanceSharePercentage': string,
  'nuanceShareAddress': string,
  'marketplaceRoyaltyPercentage': string,
  'marketplaceRoyaltyAddress': string,
  'canisterId': string,
}
export interface NumericEntity {
  'avg': bigint,
  'max': bigint,
  'min': bigint,
  'first': bigint,
  'last': bigint,
}
export interface Post {
  'url': string,
  'bucketCanisterId': string,
  'title': string,
  'created': string,
  'creator': string,
  'modified': string,
  'content': string,
  'views': string,
  'wordCount': string,
  'isPremium': boolean,
  'publishedDate': string,
  'claps': string,
  'tags': Array<PostTagModel>,
  'isDraft': boolean,
  'category': string,
  'handle': string,
  'headerImage': string,
  'subtitle': string,
  'isPublication': boolean,
  'postId': string,
}
export type PostCrossCanisterReturn = { 'ok': Post__1 } |
{ 'err': string };
export interface PostSaveModel {
  'title': string,
  'creator': string,
  'content': string,
  'isPremium': boolean,
  'isDraft': boolean,
  'tagIds': Array<string>,
  'category': string,
  'headerImage': string,
  'subtitle': string,
  'isPublication': boolean,
  'postId': string,
}
export interface PostTagModel { 'tagId': string, 'tagName': string }
export interface Post__1 {
  'url': string,
  'bucketCanisterId': string,
  'title': string,
  'created': string,
  'creator': string,
  'modified': string,
  'content': string,
  'views': string,
  'wordCount': string,
  'isPremium': boolean,
  'publishedDate': string,
  'claps': string,
  'tags': Array<PostTagModel>,
  'isDraft': boolean,
  'category': string,
  'handle': string,
  'headerImage': string,
  'subtitle': string,
  'isPublication': boolean,
  'postId': string,
}
export interface Publication {
  'cta': PublicationCta,
  'categories': Array<string>,
  'styling': PublicationStyling,
  'created': string,
  'modified': string,
  'editors': Array<string>,
  'socialLinks': SocialLinksObject,
  'description': string,
  'publicationTitle': string,
  'publicationHandle': string,
  'writers': Array<string>,
  'headerImage': string,
  'subtitle': string,
  'avatar': string,
}
export interface PublicationCta {
  'icon': string,
  'link': string,
  'ctaCopy': string,
  'buttonCopy': string,
}
export interface PublicationCta__1 {
  'icon': string,
  'link': string,
  'ctaCopy': string,
  'buttonCopy': string,
}
export interface PublicationObject {
  'isEditor': boolean,
  'publicationName': string,
}
export interface PublicationStyling {
  'primaryColor': string,
  'logo': string,
  'fontType': string,
}
export interface Publisher {
  'acceptCycles': ActorMethod<[], undefined>,
  'addEditor': ActorMethod<[string], Result>,
  'addNftCanister': ActorMethod<[string], undefined>,
  'addPublicationPostCategory': ActorMethod<[string, string], Result_1>,
  'addWriter': ActorMethod<[string], Result>,
  'availableCycles': ActorMethod<[], bigint>,
  'collectCanisterMetrics': ActorMethod<[], undefined>,
  'createNftCanister': ActorMethod<[bigint, AccountIdentifier], Result_3>,
  'createNftFromPremiumArticle': ActorMethod<
    [string, bigint, bigint, string],
    Result_10
  >,
  'debugRemoveNftCanister': ActorMethod<[], undefined>,
  'disperseIcpGainedFromPost': ActorMethod<[string], Result_3>,
  'disperseIcpTimerMethod': ActorMethod<[], undefined>,
  'getAccountIdByPostIdPublic': ActorMethod<[string], string>,
  'getAdmins': ActorMethod<[], Result_9>,
  'getCanisterMetrics': ActorMethod<
    [GetMetricsParameters],
    [] | [CanisterMetrics]
  >,
  'getCgUsers': ActorMethod<[], Result_9>,
  'getNftCanisterInformation': ActorMethod<[], NftCanisterInformation>,
  'getPremiumArticleInfo': ActorMethod<[string], Result_8>,
  'getPremiumArticleInformationsByWriterHandle': ActorMethod<
    [string],
    Array<GetPremiumArticleInfoReturn>
  >,
  'getPublication': ActorMethod<[string], Result>,
  'getPublicationPost': ActorMethod<[string], Result_1>,
  'getPublicationPosts': ActorMethod<
    [boolean, boolean, number, number],
    Array<Post>
  >,
  'getPublicationQuery': ActorMethod<[string], Result>,
  'getWritersDrafts': ActorMethod<[], Array<Post>>,
  'idQuick': ActorMethod<[], Principal>,
  'listAllTokens': ActorMethod<[string], Array<Result_7>>,
  'migrateEditorsWritersHandles': ActorMethod<[], Result>,
  'publicationPost': ActorMethod<[PostSaveModel], PostCrossCanisterReturn>,
  'registerAdmin': ActorMethod<[string], Result_4>,
  'registerCgUser': ActorMethod<[string], Result_4>,
  'registerPublication': ActorMethod<[string, string], Result>,
  'removeEditor': ActorMethod<[string], Result>,
  'removePublicationPostCategory': ActorMethod<[string], Result_1>,
  'removeWriter': ActorMethod<[string], Result>,
  'setNftCanisterRoyalty': ActorMethod<[bigint, AccountIdentifier], Result_6>,
  'setNuanceAddress': ActorMethod<[AccountIdentifier], Result_5>,
  'setNuanceSharePercentage': ActorMethod<[bigint], Result_3>,
  'unregisterAdmin': ActorMethod<[string], Result_4>,
  'unregisterCgUser': ActorMethod<[string], Result_4>,
  'unregisterPublication': ActorMethod<[], Result_3>,
  'updatePublicationCta': ActorMethod<[PublicationCta__1], Result>,
  'updatePublicationDetails': ActorMethod<
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
  'updatePublicationHandle': ActorMethod<[string], Result_2>,
  'updatePublicationPostDraft': ActorMethod<[string, boolean], Result_1>,
  'updatePublicationStyling': ActorMethod<[string, string, string], Result>,
  'updatePublicationWriters': ActorMethod<[Array<string>], Result>,
}
export type Result = { 'ok': Publication } |
{ 'err': string };
export type Result_1 = { 'ok': Post } |
{ 'err': string };
export type Result_10 = { 'ok': CreateNftFromArticleResponse } |
{ 'err': string };
export type Result_2 = { 'ok': User } |
{ 'err': string };
export type Result_3 = { 'ok': string } |
{ 'err': string };
export type Result_4 = { 'ok': null } |
{ 'err': string };
export type Result_5 = { 'ok': AccountIdentifier } |
{ 'err': string };
export type Result_6 = { 'ok': [bigint, AccountIdentifier] } |
{ 'err': string };
export type Result_7 = { 'ok': null } |
{ 'err': CommonError };
export type Result_8 = { 'ok': GetPremiumArticleInfoReturn } |
{ 'err': string };
export type Result_9 = { 'ok': Array<string> } |
{ 'err': string };
export interface SocialLinksObject {
  'twitter': string,
  'website': string,
  'distrikt': string,
  'dscvr': string,
}
export interface SocialLinksObject__1 {
  'twitter': string,
  'website': string,
  'distrikt': string,
  'dscvr': string,
}
export type TokenIdentifier = string;
export type TokenIndex = number;
export type TransferResponse = { 'ok': Balance } |
{
  'err': { 'CannotNotify': AccountIdentifier__1 } |
  { 'InsufficientBalance': null } |
  { 'InvalidToken': TokenIdentifier } |
  { 'Rejected': null } |
  { 'Unauthorized': AccountIdentifier__1 } |
  { 'Other': string }
};
export type UpdateCallsAggregatedData = BigUint64Array | bigint[];
export interface User {
  'bio': string,
  'followersArray': Array<string>,
  'displayName': string,
  'nuaTokens': number,
  'accountCreated': string,
  'publicationsArray': Array<PublicationObject>,
  'handle': string,
  'followers': Followers,
  'avatar': string,
}
export interface _SERVICE extends Publisher { }
