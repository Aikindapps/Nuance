import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface ContentResult { 'status' : ContentStatus, 'sourceId' : string }
export type ContentStatus = { 'approved' : null } |
  { 'rejected' : null } |
  { 'reviewRequired' : null };
export interface GetPostsByFollowers {
  'totalCount' : string,
  'posts' : Array<PostKeyProperties__1>,
}
export type List = [] | [[string, List]];
export interface NftCanisterEntry { 'handle' : string, 'canisterId' : string }
export type PopularityType = { 'month' : null } |
  { 'today' : null } |
  { 'ever' : null } |
  { 'week' : null };
export interface Post {
  'url' : string,
  'bucketCanisterId' : string,
  'title' : string,
  'created' : string,
  'creator' : string,
  'modified' : string,
  'content' : string,
  'views' : string,
  'wordCount' : string,
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
export interface PostKeyProperties {
  'bucketCanisterId' : string,
  'created' : string,
  'principal' : string,
  'modified' : string,
  'views' : string,
  'publishedDate' : string,
  'claps' : string,
  'tags' : Array<PostTagModel>,
  'isDraft' : boolean,
  'category' : string,
  'handle' : string,
  'postId' : string,
}
export interface PostKeyProperties__1 {
  'bucketCanisterId' : string,
  'created' : string,
  'principal' : string,
  'modified' : string,
  'views' : string,
  'publishedDate' : string,
  'claps' : string,
  'tags' : Array<PostTagModel>,
  'isDraft' : boolean,
  'category' : string,
  'handle' : string,
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
export type RecallOptions = { 'sixtydays' : null } |
  { 'today' : null } |
  { 'thisWeek' : null } |
  { 'thisYear' : null } |
  { 'allTime' : null } |
  { 'ninetydays' : null } |
  { 'thisMonth' : null };
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : string } |
  { 'err' : string };
export type Result_2 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_3 = { 'ok' : Post } |
  { 'err' : string };
export type Result_4 = { 'ok' : Array<Result_5> } |
  { 'err' : string };
export type Result_5 = { 'ok' : PostKeyProperties } |
  { 'err' : string };
export type Result_6 = { 'ok' : Uint8Array | number[] } |
  { 'err' : string };
export type Result_7 = { 'ok' : Array<string> } |
  { 'err' : string };
export type Result_8 = { 'ok' : TagModel } |
  { 'err' : string };
export type Result_9 = { 'ok' : Array<[string, string]> } |
  { 'err' : string };
export interface Rule { 'id' : string, 'description' : string }
export interface TagModel {
  'id' : string,
  'value' : string,
  'createdDate' : string,
}
export interface UserPostCounts {
  'totalViewCount' : string,
  'uniqueClaps' : string,
  'draftCount' : string,
  'uniqueReaderCount' : string,
  'publishedCount' : string,
  'handle' : string,
  'totalPostCount' : string,
}
export type Validate = { 'Ok' : string } |
  { 'Err' : string };
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'addCanisterToCyclesDispenser' : ActorMethod<
    [string, bigint, bigint],
    Result
  >,
  'addNewRules' : ActorMethod<[Array<string>], undefined>,
  'addPostCategory' : ActorMethod<[string, string, bigint], undefined>,
  'addWasmChunk' : ActorMethod<[Uint8Array | number[]], Result>,
  'availableCycles' : ActorMethod<[], bigint>,
  'checkViewsLast24Hours' : ActorMethod<[], undefined>,
  'clapPost' : ActorMethod<[string], undefined>,
  'copyPublicationCanisters' : ActorMethod<[string], Result_9>,
  'copyTrustedCanisters' : ActorMethod<[string], Result_7>,
  'createNewBucketCanister' : ActorMethod<[], Result_1>,
  'createTag' : ActorMethod<[string], Result_8>,
  'currentId' : ActorMethod<[], bigint>,
  'debugGetModeration' : ActorMethod<
    [],
    [Array<[string, bigint]>, Array<[string, PostModerationStatus]>]
  >,
  'delete' : ActorMethod<[string], Result_2>,
  'deletePostFromUserDebug' : ActorMethod<[string, string], Result_7>,
  'deleteUserPosts' : ActorMethod<[string], Result_2>,
  'dumpIds' : ActorMethod<[], Result>,
  'dumpPosts' : ActorMethod<[], Result>,
  'dumpUserIds' : ActorMethod<[], Result>,
  'followTag' : ActorMethod<[string], Result>,
  'generateLatestPosts' : ActorMethod<[], undefined>,
  'generatePublishedDates' : ActorMethod<[], undefined>,
  'getActiveBucketCanisterId' : ActorMethod<[], Result_1>,
  'getAdmins' : ActorMethod<[], Result_7>,
  'getAllBuckets' : ActorMethod<[], Result_7>,
  'getAllTags' : ActorMethod<[], Array<TagModel>>,
  'getBucketCanisters' : ActorMethod<[], Array<[string, string]>>,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getCgUsers' : ActorMethod<[], Result_7>,
  'getFrontendCanisterId' : ActorMethod<[], Result_1>,
  'getKinicList' : ActorMethod<[], Result_7>,
  'getLatestPosts' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getLatestTimerCall' : ActorMethod<[], [string, string]>,
  'getList' : ActorMethod<[Array<string>], Array<PostKeyProperties>>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getMoreLatestPosts' : ActorMethod<
    [number, number],
    Array<PostKeyProperties>
  >,
  'getMyDailyPostsStatus' : ActorMethod<[], boolean>,
  'getMyPosts' : ActorMethod<
    [boolean, boolean, number, number],
    Array<PostKeyProperties>
  >,
  'getMyTags' : ActorMethod<[], Array<PostTagModel__1>>,
  'getNextPostId' : ActorMethod<[], Result_1>,
  'getNftCanisters' : ActorMethod<[], Array<NftCanisterEntry>>,
  'getPlatformOperators' : ActorMethod<[], List>,
  'getPopular' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getPopularThisMonth' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getPopularThisWeek' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getPopularToday' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getPostKeyProperties' : ActorMethod<[string], Result_5>,
  'getPostUrls' : ActorMethod<[], Result_1>,
  'getPostViewsPerHourLast24Hours' : ActorMethod<
    [],
    [bigint, Array<[bigint, bigint]>]
  >,
  'getPostsByCategory' : ActorMethod<
    [string, string, number, number],
    GetPostsByFollowers
  >,
  'getPostsByFollowers' : ActorMethod<
    [Array<string>, number, number],
    GetPostsByFollowers
  >,
  'getPostsByPostIds' : ActorMethod<[Array<string>], Array<PostKeyProperties>>,
  'getPostsPerHourLast24Hours' : ActorMethod<
    [],
    [bigint, Array<[bigint, bigint]>]
  >,
  'getPublicationCanisters' : ActorMethod<[], Array<[string, string]>>,
  'getRegisteredRules' : ActorMethod<[], Array<Rule>>,
  'getTagsByUser' : ActorMethod<[string], Array<PostTag>>,
  'getTotalArticleViews' : ActorMethod<[], bigint>,
  'getTotalClaps' : ActorMethod<[], bigint>,
  'getTotalPostCount' : ActorMethod<[], bigint>,
  'getTrustedCanisters' : ActorMethod<[], Result_7>,
  'getUserDailyAllowedPostNumber' : ActorMethod<[], bigint>,
  'getUserPostCounts' : ActorMethod<[string], UserPostCounts>,
  'getUserPostIds' : ActorMethod<[string], Result_7>,
  'getUserPosts' : ActorMethod<[string], Array<PostKeyProperties>>,
  'getViewsByRange' : ActorMethod<[RecallOptions], bigint>,
  'getWasmChunks' : ActorMethod<[], Result_6>,
  'handleModclubMigration' : ActorMethod<[string], Result_1>,
  'idQuick' : ActorMethod<[], Principal>,
  'indexPopular' : ActorMethod<[], undefined>,
  'initializeCanister' : ActorMethod<[string, string, string], Result_1>,
  'initializePostCoreCanister' : ActorMethod<[], Result_1>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'makePostPublication' : ActorMethod<
    [string, string, string, boolean],
    undefined
  >,
  'migratePostsFromOldPostCanister' : ActorMethod<
    [string, bigint, bigint],
    Result_4
  >,
  'modClubCallback' : ActorMethod<[ContentResult], undefined>,
  'modClubCallbackDebug' : ActorMethod<[ContentResult], string>,
  'registerAdmin' : ActorMethod<[string], Result>,
  'registerCanister' : ActorMethod<[string], Result>,
  'registerCgUser' : ActorMethod<[string], Result>,
  'registerNftCanisterId' : ActorMethod<[string, string], Result_1>,
  'registerPlatformOperator' : ActorMethod<[string], Result>,
  'registerPublisher' : ActorMethod<[], undefined>,
  'reindex' : ActorMethod<[], Result_1>,
  'removeExistingRules' : ActorMethod<[Array<string>], undefined>,
  'resetWasmChunks' : ActorMethod<[], undefined>,
  'save' : ActorMethod<[PostSaveModel], Result_3>,
  'setFrontendCanisterId' : ActorMethod<[string], Result_1>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_2>,
  'setUpModClub' : ActorMethod<[string], undefined>,
  'setUserDailyAllowedPostNumber' : ActorMethod<[bigint], Result_2>,
  'simulateModClub' : ActorMethod<[string, PostModerationStatus], undefined>,
  'sortPopularPosts' : ActorMethod<[PopularityType], undefined>,
  'storeAllSEO' : ActorMethod<[], Result>,
  'testInstructionSize' : ActorMethod<[], string>,
  'unfollowTag' : ActorMethod<[string], Result>,
  'unregisterAdmin' : ActorMethod<[string], Result>,
  'unregisterCanister' : ActorMethod<[string], Result>,
  'unregisterCgUser' : ActorMethod<[string], Result>,
  'unregisterPlatformOperator' : ActorMethod<[string], Result>,
  'updateHandle' : ActorMethod<[string, string], Result_1>,
  'updatePostDraft' : ActorMethod<
    [string, boolean, bigint, string],
    PostKeyProperties
  >,
  'upgradeAllBuckets' : ActorMethod<[string, Uint8Array | number[]], Result>,
  'upgradeBucket' : ActorMethod<[string, Uint8Array | number[]], Result>,
  'validate' : ActorMethod<[any], Validate>,
  'viewPost' : ActorMethod<[string], undefined>,
}
