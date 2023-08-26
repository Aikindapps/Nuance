import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

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
  'addPostCategory' : ActorMethod<[string, string], Result_4>,
  'availableCycles' : ActorMethod<[], bigint>,
  'delete' : ActorMethod<[string], Result_3>,
  'deleteUserPosts' : ActorMethod<[string], Result_3>,
  'dumpIds' : ActorMethod<[], Result_2>,
  'dumpPosts' : ActorMethod<[], Result_2>,
  'dumpUserIds' : ActorMethod<[], Result_2>,
  'generateContent' : ActorMethod<[string], string>,
  'generatePublishedDates' : ActorMethod<[], undefined>,
  'get' : ActorMethod<[string], Result_4>,
  'getAdmins' : ActorMethod<[], Result_6>,
  'getAllRejected' : ActorMethod<[], Array<[string, string]>>,
  'getBucketCanisterVersion' : ActorMethod<[], string>,
  'getCgUsers' : ActorMethod<[], Result_6>,
  'getFrontendCanisterId' : ActorMethod<[], string>,
  'getKinicList' : ActorMethod<[], Result_6>,
  'getList' : ActorMethod<[Array<string>], Array<PostBucketType__1>>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getMetadata' : ActorMethod<[string, bigint], Result_7>,
  'getNftCanisters' : ActorMethod<[], Array<NftCanisterEntry>>,
  'getPostCoreCanisterId' : ActorMethod<[], string>,
  'getPostUrls' : ActorMethod<[], Result_1>,
  'getPostWithPublicationControl' : ActorMethod<[string], Result_4>,
  'getPostsByPostIds' : ActorMethod<
    [Array<string>, boolean],
    Array<PostBucketType__1>
  >,
  'getPremiumArticle' : ActorMethod<[string], Result_4>,
  'getTotalPostCount' : ActorMethod<[], bigint>,
  'getTrustedCanisters' : ActorMethod<[], Result_6>,
  'getUserPosts' : ActorMethod<[string, boolean], Array<PostBucketType__1>>,
  'initializeBucketCanister' : ActorMethod<
    [
      Array<string>,
      Array<string>,
      Array<string>,
      Array<[string, string]>,
      string,
      string,
    ],
    Result_1
  >,
  'isBucketCanisterActivePublic' : ActorMethod<[], boolean>,
  'makeBucketCanisterNonActive' : ActorMethod<[], Result_5>,
  'makePostPremium' : ActorMethod<[string], boolean>,
  'migratePostToPublication' : ActorMethod<[string, string, boolean], Result>,
  'registerAdmin' : ActorMethod<[string], Result_2>,
  'registerCanister' : ActorMethod<[string], Result_2>,
  'registerCgUser' : ActorMethod<[string], Result_2>,
  'registerNftCanisterId' : ActorMethod<[string, string], Result_1>,
  'registerNftCanisterIdAdminFunction' : ActorMethod<
    [string, string],
    Result_1
  >,
  'reindex' : ActorMethod<[], Result_1>,
  'rejectPostByModclub' : ActorMethod<[string], undefined>,
  'removePostCategory' : ActorMethod<[string], Result_4>,
  'save' : ActorMethod<[PostSaveModel], SaveResult>,
  'saveMultiple' : ActorMethod<
    [Array<PostSaveModelBucketMigration>],
    Array<SaveResult>
  >,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_3>,
  'simulatePremiumArticle' : ActorMethod<[string, boolean], undefined>,
  'storeAllSEO' : ActorMethod<[], Result_2>,
  'storeHandlesAndPrincipals' : ActorMethod<
    [Array<[string, string]>],
    Result_1
  >,
  'storeSEO' : ActorMethod<[string, boolean], Result_2>,
  'testInstructionSize' : ActorMethod<[], string>,
  'unRejectPostByModclub' : ActorMethod<[string], undefined>,
  'unregisterAdmin' : ActorMethod<[string], Result_2>,
  'unregisterCanister' : ActorMethod<[string], Result_2>,
  'unregisterCgUser' : ActorMethod<[string], Result_2>,
  'updateHandle' : ActorMethod<[string, string], Result_1>,
  'updatePostDraft' : ActorMethod<[string, boolean], Result>,
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
  'category' : string,
  'caller' : Principal,
  'headerImage' : string,
  'subtitle' : string,
  'isPublication' : boolean,
  'postId' : string,
}
export interface PostSaveModelBucketMigration {
  'tagNames' : Array<string>,
  'title' : string,
  'created' : string,
  'creator' : string,
  'modified' : string,
  'content' : string,
  'isRejected' : boolean,
  'isPremium' : boolean,
  'publishedDate' : string,
  'isDraft' : boolean,
  'category' : string,
  'caller' : Principal,
  'creatorHandle' : string,
  'headerImage' : string,
  'subtitle' : string,
  'isPublication' : boolean,
  'postId' : string,
}
export interface PostTagModel { 'tagId' : string, 'tagName' : string }
export type Result = { 'ok' : Post } |
  { 'err' : string };
export type Result_1 = { 'ok' : string } |
  { 'err' : string };
export type Result_2 = { 'ok' : null } |
  { 'err' : string };
export type Result_3 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_4 = { 'ok' : PostBucketType__1 } |
  { 'err' : string };
export type Result_5 = { 'ok' : boolean } |
  { 'err' : string };
export type Result_6 = { 'ok' : Array<string> } |
  { 'err' : string };
export type Result_7 = { 'ok' : Metadata } |
  { 'err' : string };
export type SaveResult = { 'ok' : PostBucketType } |
  { 'err' : string };
export interface _SERVICE extends PostBucket {}
