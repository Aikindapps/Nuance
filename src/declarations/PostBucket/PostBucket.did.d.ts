import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

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
export interface NftCanisterEntry { 'handle' : string, 'canisterId' : string }
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
export interface PostBucket {
  'acceptCycles' : ActorMethod<[], undefined>,
  'addPostCategory' : ActorMethod<[string, string], Result_5>,
  'availableCycles' : ActorMethod<[], bigint>,
  'checkTipping' : ActorMethod<[string], undefined>,
  'checkTippingByTokenSymbol' : ActorMethod<
    [string, string, string],
    Result_10
  >,
  'delete' : ActorMethod<[string], Result_4>,
  'deleteComment' : ActorMethod<[string], Result_9>,
  'deleteUserPosts' : ActorMethod<[string], Result_4>,
  'downvoteComment' : ActorMethod<[string], Result>,
  'dumpIds' : ActorMethod<[], Result_3>,
  'dumpPosts' : ActorMethod<[], Result_3>,
  'dumpUserIds' : ActorMethod<[], Result_3>,
  'generateContent' : ActorMethod<[string], string>,
  'generatePublishedDates' : ActorMethod<[], undefined>,
  'getAdmins' : ActorMethod<[], Result_7>,
  'getAllRejected' : ActorMethod<[], Array<[string, string]>>,
  'getAllSubmittedForReviews' : ActorMethod<[], Result_11>,
  'getApplaudById' : ActorMethod<[string], Result_10>,
  'getBucketCanisterVersion' : ActorMethod<[], string>,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getCgUsers' : ActorMethod<[], Result_7>,
  'getComment' : ActorMethod<[string], Result_9>,
  'getFrontendCanisterId' : ActorMethod<[], string>,
  'getKinicList' : ActorMethod<[], Result_7>,
  'getList' : ActorMethod<[Array<string>], Array<PostBucketType__1>>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getMetadata' : ActorMethod<[string, bigint], Result_8>,
  'getMyApplauds' : ActorMethod<[], Array<Applaud>>,
  'getNftCanisters' : ActorMethod<[], Array<NftCanisterEntry>>,
  'getPlatformOperators' : ActorMethod<[], List>,
  'getPost' : ActorMethod<[string], Result_5>,
  'getPostApplauds' : ActorMethod<[string], Array<Applaud>>,
  'getPostComments' : ActorMethod<[string], Result>,
  'getPostCompositeQuery' : ActorMethod<[string], Result_5>,
  'getPostCoreCanisterId' : ActorMethod<[], string>,
  'getPostUrls' : ActorMethod<[], Result_2>,
  'getPostWithPublicationControl' : ActorMethod<[string], Result_5>,
  'getPostsByPostIds' : ActorMethod<
    [Array<string>, boolean],
    Array<PostBucketType__1>
  >,
  'getPremiumArticle' : ActorMethod<[string], Result_5>,
  'getPublicationPosts' : ActorMethod<
    [Array<string>, string],
    Array<PostBucketType__1>
  >,
  'getTotalPostCount' : ActorMethod<[], bigint>,
  'getTrustedCanisters' : ActorMethod<[], Result_7>,
  'getUserApplaudsByPrincipal' : ActorMethod<[string], Array<Applaud>>,
  'getUserPosts' : ActorMethod<[string, boolean], Array<PostBucketType__1>>,
  'initializeBucketCanister' : ActorMethod<
    [
      Array<string>,
      Array<string>,
      Array<string>,
      Array<[string, string]>,
      string,
      string,
      string,
      string,
    ],
    Result_2
  >,
  'initializeCanister' : ActorMethod<[string, string], Result_2>,
  'isBucketCanisterActivePublic' : ActorMethod<[], boolean>,
  'makeBucketCanisterNonActive' : ActorMethod<[], Result_6>,
  'makePostPremium' : ActorMethod<[string], boolean>,
  'migratePostToPublication' : ActorMethod<[string, string, boolean], Result_1>,
  'registerAdmin' : ActorMethod<[string], Result_3>,
  'registerCanister' : ActorMethod<[string], Result_3>,
  'registerCgUser' : ActorMethod<[string], Result_3>,
  'registerNftCanisterId' : ActorMethod<[string, string], Result_2>,
  'registerNftCanisterIdAdminFunction' : ActorMethod<
    [string, string],
    Result_2
  >,
  'registerPlatformOperator' : ActorMethod<[string], Result_3>,
  'reindex' : ActorMethod<[], Result_2>,
  'rejectPostByModclub' : ActorMethod<[string], undefined>,
  'removeCommentVote' : ActorMethod<[string], Result>,
  'removePostCategory' : ActorMethod<[string], Result_5>,
  'save' : ActorMethod<[PostSaveModel], SaveResult>,
  'saveComment' : ActorMethod<[SaveCommentModel], Result>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_4>,
  'simulatePremiumArticle' : ActorMethod<[string, boolean], undefined>,
  'storeAllSEO' : ActorMethod<[], Result_3>,
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
  'creator' : string,
  'modified' : string,
  'content' : string,
  'wordCount' : string,
  'isPremium' : boolean,
  'publishedDate' : string,
  'isDraft' : boolean,
  'category' : string,
  'handle' : string,
  'headerImage' : string,
  'subtitle' : string,
  'isPublication' : boolean,
  'postId' : string,
}
export interface PostBucketType__1 {
  'url' : string,
  'bucketCanisterId' : string,
  'title' : string,
  'created' : string,
  'creator' : string,
  'modified' : string,
  'content' : string,
  'wordCount' : string,
  'isPremium' : boolean,
  'publishedDate' : string,
  'isDraft' : boolean,
  'category' : string,
  'handle' : string,
  'headerImage' : string,
  'subtitle' : string,
  'isPublication' : boolean,
  'postId' : string,
}
export interface PostSaveModel {
  'tagNames' : Array<string>,
  'title' : string,
  'creator' : string,
  'content' : string,
  'isPremium' : boolean,
  'isDraft' : boolean,
  'postOwnerPrincipalId' : string,
  'category' : string,
  'caller' : Principal,
  'handle' : string,
  'headerImage' : string,
  'subtitle' : string,
  'isPublication' : boolean,
  'postId' : string,
}
export interface PostTagModel { 'tagId' : string, 'tagName' : string }
export type Result = { 'ok' : CommentsReturnType } |
  { 'err' : string };
export type Result_1 = { 'ok' : Post } |
  { 'err' : string };
export type Result_10 = { 'ok' : Applaud } |
  { 'err' : string };
export type Result_11 = { 'ok' : Array<[string, Array<string>]> } |
  { 'err' : string };
export type Result_2 = { 'ok' : string } |
  { 'err' : string };
export type Result_3 = { 'ok' : null } |
  { 'err' : string };
export type Result_4 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_5 = { 'ok' : PostBucketType__1 } |
  { 'err' : string };
export type Result_6 = { 'ok' : boolean } |
  { 'err' : string };
export type Result_7 = { 'ok' : Array<string> } |
  { 'err' : string };
export type Result_8 = { 'ok' : Metadata } |
  { 'err' : string };
export type Result_9 = { 'ok' : Comment__1 } |
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
