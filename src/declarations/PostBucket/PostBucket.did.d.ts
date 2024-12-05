import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Applaud {
  'bucketCanisterId' : string,
  'receivedTokenAmount' : bigint,
  'date' : string,
  'tokenAmount' : bigint,
  'sender' : string,
  'applaudId' : string,
  'currency' : string,
  'receiver' : string,
  'numberOfApplauds' : bigint,
  'postId' : string,
}
export interface Comment {
  'bucketCanisterId' : string,
  'creator' : string,
  'content' : string,
  'commentId' : string,
  'createdAt' : string,
  'downVotes' : Array<string>,
  'isCensored' : boolean,
  'isVerified' : boolean,
  'upVotes' : Array<string>,
  'replies' : Array<Comment>,
  'handle' : string,
  'repliedCommentId' : [] | [string],
  'editedAt' : [] | [string],
  'avatar' : string,
  'postId' : string,
}
export interface Comment__1 {
  'bucketCanisterId' : string,
  'creator' : string,
  'content' : string,
  'commentId' : string,
  'createdAt' : string,
  'downVotes' : Array<string>,
  'isCensored' : boolean,
  'isVerified' : boolean,
  'upVotes' : Array<string>,
  'replies' : Array<Comment>,
  'handle' : string,
  'repliedCommentId' : [] | [string],
  'editedAt' : [] | [string],
  'avatar' : string,
  'postId' : string,
}
export interface CommentsReturnType {
  'totalNumberOfComments' : string,
  'comments' : Array<Comment>,
}
export type List = [] | [[string, List]];
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
export interface PostBucket {
  'acceptCycles' : ActorMethod<[], undefined>,
  'addPostCategory' : ActorMethod<[string, string], Result_6>,
  'addPostIdToUserDebug' : ActorMethod<[string, string], Result_3>,
  'availableCycles' : ActorMethod<[], bigint>,
  'buildCommentUrl' : ActorMethod<[string], string>,
  'checkTipping' : ActorMethod<[string], undefined>,
  'checkTippingByTokenSymbol' : ActorMethod<
    [string, string, string],
    Result_11
  >,
  'debugSetCreatorFieldAndAddPostIdToUser' : ActorMethod<
    [string, string],
    Result_6
  >,
  'delete' : ActorMethod<[string], Result_4>,
  'deleteComment' : ActorMethod<[string], Result_5>,
  'deleteUserPosts' : ActorMethod<[string], Result_4>,
  'downvoteComment' : ActorMethod<[string], Result>,
  'dumpIds' : ActorMethod<[], Result_3>,
  'dumpPosts' : ActorMethod<[], Result_3>,
  'dumpUserIds' : ActorMethod<[], Result_3>,
  'fixEmptyCreatorFields' : ActorMethod<[string, string], Result_4>,
  'generatePublishedDates' : ActorMethod<[], undefined>,
  'getAdmins' : ActorMethod<[], Result_9>,
  'getAllApplauds' : ActorMethod<[], Array<Applaud>>,
  'getAllNotMigratedCreatorFields' : ActorMethod<[], Array<string>>,
  'getAllRejected' : ActorMethod<[], Array<[string, string]>>,
  'getApplaudById' : ActorMethod<[string], Result_11>,
  'getBucketCanisterVersion' : ActorMethod<[], string>,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getCgUsers' : ActorMethod<[], Result_9>,
  'getComment' : ActorMethod<[string], Result_5>,
  'getFrontendCanisterId' : ActorMethod<[], string>,
  'getKinicList' : ActorMethod<[], Result_9>,
  'getList' : ActorMethod<[Array<string>], Array<PostBucketType__1>>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getMyApplauds' : ActorMethod<[], Array<Applaud>>,
  'getNotMigratedPremiumArticlePostIds' : ActorMethod<[], Array<string>>,
  'getPlatformOperators' : ActorMethod<[], List>,
  'getPost' : ActorMethod<[string], Result_6>,
  'getPostApplauds' : ActorMethod<[string], Array<Applaud>>,
  'getPostComments' : ActorMethod<[string], Result>,
  'getPostCompositeQuery' : ActorMethod<[string], Result_6>,
  'getPostCoreCanisterId' : ActorMethod<[], string>,
  'getPostUrls' : ActorMethod<[], Result_2>,
  'getPostsByPostIds' : ActorMethod<
    [Array<string>, boolean],
    Array<PostBucketType__1>
  >,
  'getPostsByPostIdsMigration' : ActorMethod<
    [Array<string>],
    Array<PostBucketType__1>
  >,
  'getPublicationPosts' : ActorMethod<
    [Array<string>, string],
    Array<PostBucketType__1>
  >,
  'getReportedCommentIds' : ActorMethod<[], Array<string>>,
  'getReportedComments' : ActorMethod<[], Result_10>,
  'getTotalPostCount' : ActorMethod<[], bigint>,
  'getTrustedCanisters' : ActorMethod<[], Result_9>,
  'getUserApplaudsByPrincipal' : ActorMethod<[string], Array<Applaud>>,
  'getUserPostIds' : ActorMethod<[string], Array<string>>,
  'getUserPosts' : ActorMethod<[string, boolean], Array<PostBucketType__1>>,
  'initializeBucketCanister' : ActorMethod<
    [Array<string>, Array<string>, string],
    Result_2
  >,
  'initializeCanister' : ActorMethod<[string, string], Result_2>,
  'isBucketCanisterActivePublic' : ActorMethod<[], boolean>,
  'makeBucketCanisterNonActive' : ActorMethod<[], Result_8>,
  'migrateCreatorsFromHandlesToPrincipals' : ActorMethod<[], Result_7>,
  'migratePostToPublication' : ActorMethod<[string, string, boolean], Result_1>,
  'migratePremiumArticleFromOldArch' : ActorMethod<
    [string, [] | [bigint]],
    Result_2
  >,
  'registerAdmin' : ActorMethod<[string], Result_3>,
  'registerCanister' : ActorMethod<[string], Result_3>,
  'registerCgUser' : ActorMethod<[string], Result_3>,
  'registerPlatformOperator' : ActorMethod<[string], Result_3>,
  'reindex' : ActorMethod<[], Result_2>,
  'rejectPostByModclub' : ActorMethod<[string], undefined>,
  'removeCommentVote' : ActorMethod<[string], Result>,
  'removePostCategory' : ActorMethod<[string], Result_6>,
  'removePostIdToUserDebug' : ActorMethod<[string, string], Result_3>,
  'reportComment' : ActorMethod<[string], Result_2>,
  'reviewComment' : ActorMethod<[string, boolean], Result_5>,
  'save' : ActorMethod<[PostSaveModel], SaveResult>,
  'saveComment' : ActorMethod<[SaveCommentModel], Result>,
  'saveMultiple' : ActorMethod<[Array<PostSaveModel>], Array<SaveResult>>,
  'sendNewCommentNotification' : ActorMethod<[string], undefined>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_4>,
  'storeHandlesAndPrincipals' : ActorMethod<
    [Array<[string, string]>],
    Result_2
  >,
  'testInstructionSize' : ActorMethod<[], string>,
  'unRejectPostByModclub' : ActorMethod<[string], undefined>,
  'unregisterAdmin' : ActorMethod<[string], Result_3>,
  'unregisterCanister' : ActorMethod<[string], Result_3>,
  'unregisterCgUser' : ActorMethod<[string], Result_3>,
  'unregisterPlatformOperator' : ActorMethod<[string], Result_3>,
  'updateHandle' : ActorMethod<[string, string], Result_2>,
  'updatePostDraft' : ActorMethod<[string, boolean], Result_1>,
  'upvoteComment' : ActorMethod<[string], Result>,
  'validate' : ActorMethod<[any], Validate>,
}
export interface PostBucketType {
  'url' : string,
  'bucketCanisterId' : string,
  'title' : string,
  'created' : string,
  'modified' : string,
  'content' : string,
  'wordCount' : string,
  'isPremium' : boolean,
  'publishedDate' : string,
  'nftCanisterId' : [] | [string],
  'isDraft' : boolean,
  'creatorPrincipal' : string,
  'category' : string,
  'handle' : string,
  'postOwnerPrincipal' : string,
  'creatorHandle' : string,
  'headerImage' : string,
  'isMembersOnly' : boolean,
  'subtitle' : string,
  'isPublication' : boolean,
  'postId' : string,
}
export interface PostBucketType__1 {
  'url' : string,
  'bucketCanisterId' : string,
  'title' : string,
  'created' : string,
  'modified' : string,
  'content' : string,
  'wordCount' : string,
  'isPremium' : boolean,
  'publishedDate' : string,
  'nftCanisterId' : [] | [string],
  'isDraft' : boolean,
  'creatorPrincipal' : string,
  'category' : string,
  'handle' : string,
  'postOwnerPrincipal' : string,
  'creatorHandle' : string,
  'headerImage' : string,
  'isMembersOnly' : boolean,
  'subtitle' : string,
  'isPublication' : boolean,
  'postId' : string,
}
export interface PostSaveModel {
  'tagNames' : Array<string>,
  'title' : string,
  'content' : string,
  'premium' : [] | [
    {
      'thumbnail' : string,
      'icpPrice' : bigint,
      'editorPrincipals' : Array<string>,
      'maxSupply' : bigint,
    }
  ],
  'isDraft' : boolean,
  'postOwnerPrincipalId' : string,
  'category' : string,
  'caller' : Principal,
  'handle' : string,
  'creatorHandle' : string,
  'headerImage' : string,
  'isMembersOnly' : boolean,
  'scheduledPublishedDate' : [] | [bigint],
  'subtitle' : string,
  'isPublication' : boolean,
  'postId' : string,
}
export interface PostTagModel { 'tagId' : string, 'tagName' : string }
export type Result = { 'ok' : CommentsReturnType } |
  { 'err' : string };
export type Result_1 = { 'ok' : Post } |
  { 'err' : string };
export type Result_10 = { 'ok' : Array<Comment__1> } |
  { 'err' : string };
export type Result_11 = { 'ok' : Applaud } |
  { 'err' : string };
export type Result_2 = { 'ok' : string } |
  { 'err' : string };
export type Result_3 = { 'ok' : null } |
  { 'err' : string };
export type Result_4 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_5 = { 'ok' : Comment__1 } |
  { 'err' : string };
export type Result_6 = { 'ok' : PostBucketType__1 } |
  { 'err' : string };
export type Result_7 = { 'ok' : [bigint, Array<string>] } |
  { 'err' : string };
export type Result_8 = { 'ok' : boolean } |
  { 'err' : string };
export type Result_9 = { 'ok' : Array<string> } |
  { 'err' : string };
export interface SaveCommentModel {
  'content' : string,
  'commentId' : [] | [string],
  'replyToCommentId' : [] | [string],
  'postId' : string,
}
export type SaveResult = { 'ok' : PostBucketType } |
  { 'err' : string };
export type Validate = { 'Ok' : string } |
  { 'Err' : string };
export interface _SERVICE extends PostBucket {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
