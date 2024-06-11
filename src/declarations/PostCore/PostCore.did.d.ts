import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface ContentResult {
  'status' : ContentStatus,
  'approvedCount' : bigint,
  'sourceId' : string,
  'violatedRules' : Array<ViolatedRules>,
  'rejectedCount' : bigint,
}
export type ContentStatus = { 'new' : null } |
  { 'approved' : null } |
  { 'rejected' : null };
export interface GetPostsByFollowers {
  'totalCount' : string,
  'posts' : Array<PostKeyProperties__1>,
}
export type List = [] | [[string, List]];
export type PopularityType = { 'month' : null } |
  { 'today' : null } |
  { 'ever' : null } |
  { 'week' : null };
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
  'isMembersOnly' : boolean,
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
export type PostModerationStatusV2 = { 'new' : null } |
  { 'approved' : null } |
  { 'rejected' : null };
export interface PostSaveModel {
  'title' : string,
  'content' : string,
  'premium' : [] | [
    { 'thumbnail' : string, 'icpPrice' : bigint, 'maxSupply' : bigint }
  ],
  'isDraft' : boolean,
  'tagIds' : Array<string>,
  'category' : string,
  'handle' : string,
  'creatorHandle' : string,
  'headerImage' : string,
  'isMembersOnly' : boolean,
  'scheduledPublishedDate' : [] | [bigint],
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
export type Result = { 'ok' : boolean } |
  { 'err' : string };
export type Result_1 = { 'ok' : null } |
  { 'err' : string };
export type Result_10 = { 'ok' : Array<[string, string]> } |
  { 'err' : string };
export type Result_2 = { 'ok' : string } |
  { 'err' : string };
export type Result_3 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_4 = { 'ok' : Post } |
  { 'err' : string };
export type Result_5 = { 'ok' : PostKeyProperties } |
  { 'err' : string };
export type Result_6 = {
    'ok' : [Array<[string, Array<string>]>, Array<[string, Array<string>]>]
  } |
  { 'err' : string };
export type Result_7 = { 'ok' : Uint8Array | number[] } |
  { 'err' : string };
export type Result_8 = { 'ok' : Array<string> } |
  { 'err' : string };
export type Result_9 = { 'ok' : TagModel } |
  { 'err' : string };
export interface TagModel {
  'id' : string,
  'value' : string,
  'createdDate' : string,
}
export interface UserPostCounts {
  'totalViewCount' : string,
  'plannedCount' : string,
  'uniqueClaps' : string,
  'draftCount' : string,
  'uniqueReaderCount' : string,
  'publishedCount' : string,
  'handle' : string,
  'premiumCount' : string,
  'submittedToReviewCount' : string,
  'totalPostCount' : string,
}
export type Validate = { 'Ok' : string } |
  { 'Err' : string };
export interface ViolatedRules { 'id' : string, 'rejectionCount' : bigint }
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'addCanisterToCyclesDispenser' : ActorMethod<
    [string, bigint, bigint],
    Result_1
  >,
  'addNewRules' : ActorMethod<[Array<string>], undefined>,
  'addPostCategory' : ActorMethod<[string, string, bigint], undefined>,
  'addPostIdToUserDebug' : ActorMethod<[string, string], Result_1>,
  'addWasmChunk' : ActorMethod<[Uint8Array | number[]], Result_1>,
  'availableCycles' : ActorMethod<[], bigint>,
  'checkViewsLast24Hours' : ActorMethod<[], undefined>,
  'clapPost' : ActorMethod<[string], undefined>,
  'copyPublicationCanisters' : ActorMethod<[string], Result_10>,
  'copyTrustedCanisters' : ActorMethod<[string], Result_8>,
  'createNewBucketCanister' : ActorMethod<[], Result_2>,
  'createTag' : ActorMethod<[string], Result_9>,
  'currentId' : ActorMethod<[], bigint>,
  'debugApplaudsHashMap' : ActorMethod<[], Array<[string, bigint]>>,
  'debugGetApplaudsHashMap' : ActorMethod<[], Array<[string, bigint]>>,
  'delete' : ActorMethod<[string], Result_3>,
  'deletePostFromUserDebug' : ActorMethod<[string, string], Result_8>,
  'deleteUserPosts' : ActorMethod<[string], Result_3>,
  'dumpIds' : ActorMethod<[], Result_1>,
  'dumpPosts' : ActorMethod<[], Result_1>,
  'dumpUserIds' : ActorMethod<[], Result_1>,
  'followTag' : ActorMethod<[string], Result_1>,
  'generateLatestPosts' : ActorMethod<[], undefined>,
  'generatePublishedDates' : ActorMethod<[], undefined>,
  'getActiveBucketCanisterId' : ActorMethod<[], Result_2>,
  'getAdmins' : ActorMethod<[], Result_8>,
  'getAllBuckets' : ActorMethod<[], Result_8>,
  'getAllNftCanisters' : ActorMethod<[], Array<[string, string]>>,
  'getAllStatusCount' : ActorMethod<[], Result_2>,
  'getAllTags' : ActorMethod<[], Array<TagModel>>,
  'getBucketCanisterIdsOfGivenHandles' : ActorMethod<
    [Array<string>],
    Array<string>
  >,
  'getBucketCanisters' : ActorMethod<[], Array<[string, string]>>,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getCgUsers' : ActorMethod<[], Result_8>,
  'getFrontendCanisterId' : ActorMethod<[], Result_2>,
  'getHistoricalPublishedArticlesData' : ActorMethod<
    [],
    Array<[string, bigint]>
  >,
  'getKinicList' : ActorMethod<[], Result_8>,
  'getLastWeekRejectedPostKeyProperties' : ActorMethod<
    [],
    Array<PostKeyProperties>
  >,
  'getLatestPosts' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getLatestTimerCall' : ActorMethod<[], [string, string]>,
  'getList' : ActorMethod<[Array<string>], Array<PostKeyProperties>>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getMoreLatestPosts' : ActorMethod<
    [number, number],
    Array<PostKeyProperties>
  >,
  'getMyAllPosts' : ActorMethod<[number, number], Array<PostKeyProperties>>,
  'getMyDailyPostsStatus' : ActorMethod<[], boolean>,
  'getMyDraftPosts' : ActorMethod<[number, number], Array<PostKeyProperties>>,
  'getMyFollowingTagsPostKeyProperties' : ActorMethod<
    [number, number],
    GetPostsByFollowers
  >,
  'getMyPlannedPosts' : ActorMethod<[number, number], Array<PostKeyProperties>>,
  'getMyPublishedPosts' : ActorMethod<
    [number, number],
    Array<PostKeyProperties>
  >,
  'getMySubmittedToReviewPosts' : ActorMethod<
    [number, number],
    Array<PostKeyProperties>
  >,
  'getMyTags' : ActorMethod<[], Array<PostTagModel__1>>,
  'getNextPostId' : ActorMethod<[], Result_2>,
  'getPlatformOperators' : ActorMethod<[], List>,
  'getPopular' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getPopularThisMonth' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getPopularThisWeek' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getPopularToday' : ActorMethod<[number, number], GetPostsByFollowers>,
  'getPostKeyProperties' : ActorMethod<[string], Result_5>,
  'getPostUrls' : ActorMethod<[], Result_2>,
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
  'getPublicationPosts' : ActorMethod<
    [number, number, string],
    Array<PostKeyProperties>
  >,
  'getTagFollowers' : ActorMethod<[string], Result_8>,
  'getTagsByUser' : ActorMethod<[string], Array<PostTag>>,
  'getTotalAmountOfTipsReceived' : ActorMethod<[], bigint>,
  'getTotalArticleViews' : ActorMethod<[], bigint>,
  'getTotalClaps' : ActorMethod<[], bigint>,
  'getTotalPostCount' : ActorMethod<[], bigint>,
  'getTrustedCanisters' : ActorMethod<[], Result_8>,
  'getUserDailyAllowedPostNumber' : ActorMethod<[], bigint>,
  'getUserPostCounts' : ActorMethod<[string], UserPostCounts>,
  'getUserPostIds' : ActorMethod<[string], Result_8>,
  'getUserPosts' : ActorMethod<[string], Array<PostKeyProperties>>,
  'getUsersPostCountsByHandles' : ActorMethod<
    [Array<string>],
    Array<UserPostCounts>
  >,
  'getViewsByRange' : ActorMethod<[RecallOptions], bigint>,
  'getWasmChunks' : ActorMethod<[], Result_7>,
  'handleModclubMigration' : ActorMethod<[string], Result_2>,
  'idQuick' : ActorMethod<[], Principal>,
  'incrementApplauds' : ActorMethod<[string, bigint], undefined>,
  'indexPopular' : ActorMethod<[], undefined>,
  'initializeCanister' : ActorMethod<[string, string, string], Result_2>,
  'initializePostCoreCanister' : ActorMethod<[], Result_2>,
  'isEditorPublic' : ActorMethod<[string, Principal], boolean>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'isWriterPublic' : ActorMethod<[string, Principal], boolean>,
  'makePostPublication' : ActorMethod<
    [string, string, string, boolean],
    undefined
  >,
  'migrateAllPublicationEditorsAndWriters' : ActorMethod<[], Result_6>,
  'migrateModclubInterface' : ActorMethod<[], Result_2>,
  'migratePremiumArticleFromOldArch' : ActorMethod<[], Result_5>,
  'modClubCallback' : ActorMethod<[ContentResult], undefined>,
  'registerAdmin' : ActorMethod<[string], Result_1>,
  'registerCanister' : ActorMethod<[string], Result_1>,
  'registerCgUser' : ActorMethod<[string], Result_1>,
  'registerPlatformOperator' : ActorMethod<[string], Result_1>,
  'registerPublisher' : ActorMethod<[], undefined>,
  'reindex' : ActorMethod<[], Result_2>,
  'removePostFromPopularityArrays' : ActorMethod<[string], undefined>,
  'removePostIdToUserDebug' : ActorMethod<[string, string], Result_1>,
  'resetWasmChunks' : ActorMethod<[], undefined>,
  'save' : ActorMethod<[PostSaveModel], Result_4>,
  'setFrontendCanisterId' : ActorMethod<[string], Result_2>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_3>,
  'setUpModClub' : ActorMethod<[string], undefined>,
  'setUserDailyAllowedPostNumber' : ActorMethod<[bigint], Result_3>,
  'simulateModClub' : ActorMethod<[string, PostModerationStatusV2], undefined>,
  'sortPopularPosts' : ActorMethod<[PopularityType], undefined>,
  'storeAllSEO' : ActorMethod<[], Result_1>,
  'testInstructionSize' : ActorMethod<[], string>,
  'unfollowTag' : ActorMethod<[string], Result_1>,
  'unregisterAdmin' : ActorMethod<[string], Result_1>,
  'unregisterCanister' : ActorMethod<[string], Result_1>,
  'unregisterCgUser' : ActorMethod<[string], Result_1>,
  'unregisterPlatformOperator' : ActorMethod<[string], Result_1>,
  'updateHandle' : ActorMethod<[string, string], Result_2>,
  'updatePostDraft' : ActorMethod<
    [string, boolean, bigint, string],
    PostKeyProperties
  >,
  'updatePublicationEditorsAndWriters' : ActorMethod<
    [string, Array<string>, Array<string>],
    Result_1
  >,
  'updateSettingsForAllBucketCanisters' : ActorMethod<[], Result_2>,
  'upgradeAllBuckets' : ActorMethod<[string, Uint8Array | number[]], Result_1>,
  'upgradeBucket' : ActorMethod<[string, Uint8Array | number[]], Result_1>,
  'validate' : ActorMethod<[any], Validate>,
  'verifyMigration' : ActorMethod<[], Result>,
  'viewPost' : ActorMethod<[string], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
