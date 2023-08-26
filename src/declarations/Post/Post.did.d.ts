import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type CanisterCyclesAggregatedData = BigUint64Array | bigint[];
export type CanisterHeapMemoryAggregatedData = BigUint64Array | bigint[];
export type CanisterMemoryAggregatedData = BigUint64Array | bigint[];
export interface CanisterMetrics { 'data' : CanisterMetricsData }
export type CanisterMetricsData = { 'hourly' : Array<HourlyMetricsData> } |
  { 'daily' : Array<DailyMetricsData> };
export interface ContentResult { 'status' : ContentStatus, 'sourceId' : string }
export type ContentStatus = { 'approved' : null } |
  { 'rejected' : null } |
  { 'reviewRequired' : null };
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
export interface GetPostsByFollowers {
  'totalCount' : string,
  'posts' : Array<Post__1>,
}
export interface HourlyMetricsData {
  'updateCalls' : UpdateCallsAggregatedData,
  'canisterHeapMemorySize' : CanisterHeapMemoryAggregatedData,
  'canisterCycles' : CanisterCyclesAggregatedData,
  'canisterMemorySize' : CanisterMemoryAggregatedData,
  'timeMillis' : bigint,
}
export type Metadata = {
    'fungible' : {
      'decimals' : number,
      'metadata' : [] | [MetadataContainer],
      'name' : string,
      'symbol' : string,
    }
  } |
  {
    'nonfungible' : {
      'thumbnail' : string,
      'asset' : string,
      'metadata' : [] | [MetadataContainer],
      'name' : string,
    }
  };
export type MetadataContainer = { 'blob' : Uint8Array | number[] } |
  { 'data' : Array<MetadataValue> } |
  { 'json' : string };
export type MetadataValue = [
  string,
  { 'nat' : bigint } |
    { 'blob' : Uint8Array | number[] } |
    { 'nat8' : number } |
    { 'text' : string },
];
export type MetricsGranularity = { 'hourly' : null } |
  { 'daily' : null };
export interface NftCanisterEntry { 'handle' : string, 'canisterId' : string }
export interface NumericEntity {
  'avg' : bigint,
  'max' : bigint,
  'min' : bigint,
  'first' : bigint,
  'last' : bigint,
}
export interface Post {
  'url' : string,
  'title' : string,
  'created' : string,
  'creator' : string,
  'modified' : string,
  'content' : string,
  'views' : string,
  'isPremium' : boolean,
  'publishedDate' : string,
  'claps' : string,
  'tags' : Array<PostTagModel>,
  'isDraft' : boolean,
  'category' : string,
  'handle' : string,
  'headerImage' : string,
  'subtitle' : string,
  'isPublication' : boolean,
  'postId' : string,
}
export interface PostMigrationType {
  'url' : string,
  'title' : string,
  'created' : string,
  'creator' : string,
  'modified' : string,
  'content' : string,
  'isRejected' : boolean,
  'views' : string,
  'wordCount' : bigint,
  'isPremium' : boolean,
  'publishedDate' : string,
  'claps' : string,
  'tags' : Array<PostTagModel>,
  'isDraft' : boolean,
  'category' : string,
  'caller' : string,
  'handle' : string,
  'headerImage' : string,
  'subtitle' : string,
  'isPublication' : boolean,
  'postId' : string,
}
export type PostModerationStatus = { 'approved' : null } |
  { 'rejected' : null } |
  { 'reviewRequired' : null };
export interface PostSaveModel {
  'title' : string,
  'creator' : string,
  'content' : string,
  'isPremium' : boolean,
  'isDraft' : boolean,
  'tagIds' : Array<string>,
  'category' : string,
  'headerImage' : string,
  'subtitle' : string,
  'isPublication' : boolean,
  'postId' : string,
}
export interface PostTag {
  'tagId' : string,
  'createdDate' : bigint,
  'isActive' : boolean,
  'modifiedDate' : bigint,
}
export interface PostTagModel { 'tagId' : string, 'tagName' : string }
export interface PostTagModel__1 { 'tagId' : string, 'tagName' : string }
export interface Post__1 {
  'url' : string,
  'title' : string,
  'created' : string,
  'creator' : string,
  'modified' : string,
  'content' : string,
  'views' : string,
  'isPremium' : boolean,
  'publishedDate' : string,
  'claps' : string,
  'tags' : Array<PostTagModel>,
  'isDraft' : boolean,
  'category' : string,
  'handle' : string,
  'headerImage' : string,
  'subtitle' : string,
  'isPublication' : boolean,
  'postId' : string,
}
export type RecallOptions = { 'sixtydays' : null } |
  { 'today' : null } |
  { 'thisWeek' : null } |
  { 'thisYear' : null } |
  { 'allTime' : null } |
  { 'ninetydays' : null } |
  { 'thisMonth' : null };
export type Result = { 'ok' : Post } |
  { 'err' : string };
export type Result_1 = { 'ok' : string } |
  { 'err' : string };
export type Result_2 = { 'ok' : null } |
  { 'err' : string };
export type Result_3 = { 'ok' : Array<[string, bigint]> } |
  { 'err' : string };
export type Result_4 = { 'ok' : Array<string> } |
  { 'err' : string };
export type Result_5 = {
    'ok' : [Array<PostMigrationType>, Array<[string, string]>]
  } |
  { 'err' : string };
export type Result_6 = { 'ok' : Metadata } |
  { 'err' : string };
export type Result_7 = {
    'ok' : [Array<[string, bigint]>, Array<[string, PostModerationStatus]>]
  } |
  { 'err' : string };
export type Result_8 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_9 = { 'ok' : TagModel } |
  { 'err' : string };
export interface Rule { 'id' : string, 'description' : string }
export type SaveResult = { 'ok' : Post__1 } |
  { 'err' : string };
export interface TagModel {
  'id' : string,
  'value' : string,
  'createdDate' : string,
}
export type UpdateCallsAggregatedData = BigUint64Array | bigint[];
export interface UserPostCounts {
  'totalViewCount' : string,
  'uniqueClaps' : string,
  'draftCount' : string,
  'uniqueReaderCount' : string,
  'publishedCount' : string,
  'handle' : string,
  'totalPostCount' : string,
}
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'addNewRules' : ActorMethod<[Array<string>], undefined>,
  'addPostCategory' : ActorMethod<[string, string], Result>,
  'availableCycles' : ActorMethod<[], bigint>,
  'clapPost' : ActorMethod<[string], undefined>,
  'collectCanisterMetrics' : ActorMethod<[], undefined>,
  'copyPostsFromHandleToPublication' : ActorMethod<[string, string], Result_1>,
  'createTag' : ActorMethod<[string], Result_9>,
  'currentId' : ActorMethod<[], bigint>,
  'delete' : ActorMethod<[string], Result_8>,
  'deleteUserPosts' : ActorMethod<[string], Result_8>,
  'dumpIds' : ActorMethod<[], Result_2>,
  'dumpPosts' : ActorMethod<[], Result_2>,
  'dumpUserIds' : ActorMethod<[], Result_2>,
  'followTag' : ActorMethod<[string], Result_2>,
  'generateAccountIds' : ActorMethod<[], undefined>,
  'generateContent' : ActorMethod<[string], string>,
  'generateLatestPosts' : ActorMethod<[], undefined>,
  'generateLowercaseHandles' : ActorMethod<[], [string, Array<string>]>,
  'generatePublishedDates' : ActorMethod<[], undefined>,
  'generateWordCounts' : ActorMethod<[], undefined>,
  'get' : ActorMethod<[string], Result>,
  'getAdmins' : ActorMethod<[], Result_4>,
  'getAllModerationStatus' : ActorMethod<[], Result_7>,
  'getAllTags' : ActorMethod<[], Array<TagModel>>,
  'getCanisterMetrics' : ActorMethod<
    [GetMetricsParameters],
    [] | [CanisterMetrics]
  >,
  'getCgUsers' : ActorMethod<[], Result_4>,
  'getKinicList' : ActorMethod<[], Result_4>,
  'getLatestPosts' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getList' : ActorMethod<[Array<string>], Array<Post>>,
  'getMetadata' : ActorMethod<[string, bigint], Result_6>,
  'getMoreLatestPosts' : ActorMethod<[number, number], Array<Post>>,
  'getMyPosts' : ActorMethod<[boolean, boolean, number, number], Array<Post>>,
  'getMyTags' : ActorMethod<[], Array<PostTagModel__1>>,
  'getNftCanisters' : ActorMethod<[], Array<NftCanisterEntry>>,
  'getPopular' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getPopularThisMonth' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getPopularThisWeek' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getPopularToday' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getPostUrls' : ActorMethod<[], Result_1>,
  'getPostWithPublicationControl' : ActorMethod<[string], Result>,
  'getPostsByCategory' : ActorMethod<
    [string, string, number, number],
    GetPostsByFollowers
  >,
  'getPostsByFollowers' : ActorMethod<
    [Array<string>, number, number],
    GetPostsByFollowers
  >,
  'getPostsByPostIds' : ActorMethod<[Array<string>], Array<Post>>,
  'getPostsMigration' : ActorMethod<[bigint, bigint], Result_5>,
  'getPremiumArticle' : ActorMethod<[string], Result>,
  'getRegisteredRules' : ActorMethod<[], Array<Rule>>,
  'getSEOStorageErrors' : ActorMethod<[], Array<string>>,
  'getTagsByUser' : ActorMethod<[string], Array<PostTag>>,
  'getTotalArticleViews' : ActorMethod<[], bigint>,
  'getTotalPostCount' : ActorMethod<[], bigint>,
  'getTrustedCanisters' : ActorMethod<[], Result_4>,
  'getUserPostCounts' : ActorMethod<[string], UserPostCounts>,
  'getUserPostIds' : ActorMethod<[string], Result_4>,
  'getUserPosts' : ActorMethod<[string], Array<Post>>,
  'getViewsByRange' : ActorMethod<[RecallOptions], bigint>,
  'getViewsHistoryHashmap' : ActorMethod<[], Result_3>,
  'getWordCount' : ActorMethod<[string], bigint>,
  'indexPopular' : ActorMethod<[], undefined>,
  'latestPostsMigration' : ActorMethod<[], undefined>,
  'linkWritersToPublicationPosts' : ActorMethod<[], Result_1>,
  'makePostPremium' : ActorMethod<[string], boolean>,
  'migratePostToPublication' : ActorMethod<[string, string, boolean], Result>,
  'migratePostsFromFastblocks' : ActorMethod<[string, string], Result_1>,
  'modClubCallback' : ActorMethod<[ContentResult], undefined>,
  'registerAdmin' : ActorMethod<[string], Result_2>,
  'registerCanister' : ActorMethod<[string], Result_2>,
  'registerCgUser' : ActorMethod<[string], Result_2>,
  'registerNftCanisterId' : ActorMethod<[string], Result_1>,
  'registerNftCanisterIdAdminFunction' : ActorMethod<
    [string, string],
    Result_1
  >,
  'registerPublisher' : ActorMethod<[], undefined>,
  'reindex' : ActorMethod<[], Result_1>,
  'removeExistingRules' : ActorMethod<[Array<string>], undefined>,
  'removePostCategory' : ActorMethod<[string], Result>,
  'save' : ActorMethod<[PostSaveModel], SaveResult>,
  'setUpModClub' : ActorMethod<[string], undefined>,
  'simulateModClub' : ActorMethod<[string, PostModerationStatus], undefined>,
  'simulatePremiumArticle' : ActorMethod<[string, boolean], undefined>,
  'storeAllSEO' : ActorMethod<[bigint, bigint], Result_2>,
  'storeSEO' : ActorMethod<[string, boolean], Result_2>,
  'testInstructionSize' : ActorMethod<[], string>,
  'unfollowTag' : ActorMethod<[string], Result_2>,
  'unregisterAdmin' : ActorMethod<[string], Result_2>,
  'unregisterCanister' : ActorMethod<[string], Result_2>,
  'unregisterCgUser' : ActorMethod<[string], Result_2>,
  'updateHandle' : ActorMethod<[string, string], Result_1>,
  'updatePostDraft' : ActorMethod<[string, boolean], Result>,
  'viewPost' : ActorMethod<[string], undefined>,
  'x' : ActorMethod<[], Array<string>>,
}
