export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_9 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'err' : IDL.Text,
  });
  const Result_7 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const TagModel = IDL.Record({
    'id' : IDL.Text,
    'value' : IDL.Text,
    'createdDate' : IDL.Text,
  });
  const Result_8 = IDL.Variant({ 'ok' : TagModel, 'err' : IDL.Text });
  const PostModerationStatus = IDL.Variant({
    'approved' : IDL.Null,
    'rejected' : IDL.Null,
    'reviewRequired' : IDL.Null,
  });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const PostTagModel = IDL.Record({ 'tagId' : IDL.Text, 'tagName' : IDL.Text });
  const PostKeyProperties__1 = IDL.Record({
    'bucketCanisterId' : IDL.Text,
    'created' : IDL.Text,
    'principal' : IDL.Text,
    'modified' : IDL.Text,
    'views' : IDL.Text,
    'publishedDate' : IDL.Text,
    'claps' : IDL.Text,
    'tags' : IDL.Vec(PostTagModel),
    'isDraft' : IDL.Bool,
    'category' : IDL.Text,
    'handle' : IDL.Text,
    'postId' : IDL.Text,
  });
  const GetPostsByFollowers = IDL.Record({
    'totalCount' : IDL.Text,
    'posts' : IDL.Vec(PostKeyProperties__1),
  });
  const PostKeyProperties = IDL.Record({
    'bucketCanisterId' : IDL.Text,
    'created' : IDL.Text,
    'principal' : IDL.Text,
    'modified' : IDL.Text,
    'views' : IDL.Text,
    'publishedDate' : IDL.Text,
    'claps' : IDL.Text,
    'tags' : IDL.Vec(PostTagModel),
    'isDraft' : IDL.Bool,
    'category' : IDL.Text,
    'handle' : IDL.Text,
    'postId' : IDL.Text,
  });
  const PostTagModel__1 = IDL.Record({
    'tagId' : IDL.Text,
    'tagName' : IDL.Text,
  });
  const NftCanisterEntry = IDL.Record({
    'handle' : IDL.Text,
    'canisterId' : IDL.Text,
  });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const Result_5 = IDL.Variant({ 'ok' : PostKeyProperties, 'err' : IDL.Text });
  const Rule = IDL.Record({ 'id' : IDL.Text, 'description' : IDL.Text });
  const PostTag = IDL.Record({
    'tagId' : IDL.Text,
    'createdDate' : IDL.Int,
    'isActive' : IDL.Bool,
    'modifiedDate' : IDL.Int,
  });
  const UserPostCounts = IDL.Record({
    'totalViewCount' : IDL.Text,
    'uniqueClaps' : IDL.Text,
    'draftCount' : IDL.Text,
    'uniqueReaderCount' : IDL.Text,
    'publishedCount' : IDL.Text,
    'handle' : IDL.Text,
    'totalPostCount' : IDL.Text,
  });
  const RecallOptions = IDL.Variant({
    'sixtydays' : IDL.Null,
    'today' : IDL.Null,
    'thisWeek' : IDL.Null,
    'thisYear' : IDL.Null,
    'allTime' : IDL.Null,
    'ninetydays' : IDL.Null,
    'thisMonth' : IDL.Null,
  });
  const Result_6 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Nat8), 'err' : IDL.Text });
  const Result_4 = IDL.Variant({ 'ok' : IDL.Vec(Result_5), 'err' : IDL.Text });
  const ContentStatus = IDL.Variant({
    'approved' : IDL.Null,
    'rejected' : IDL.Null,
    'reviewRequired' : IDL.Null,
  });
  const ContentResult = IDL.Record({
    'status' : ContentStatus,
    'sourceId' : IDL.Text,
  });
  const PostSaveModel = IDL.Record({
    'title' : IDL.Text,
    'creator' : IDL.Text,
    'content' : IDL.Text,
    'isPremium' : IDL.Bool,
    'isDraft' : IDL.Bool,
    'tagIds' : IDL.Vec(IDL.Text),
    'category' : IDL.Text,
    'headerImage' : IDL.Text,
    'subtitle' : IDL.Text,
    'isPublication' : IDL.Bool,
    'postId' : IDL.Text,
  });
  const Post = IDL.Record({
    'url' : IDL.Text,
    'bucketCanisterId' : IDL.Text,
    'title' : IDL.Text,
    'created' : IDL.Text,
    'creator' : IDL.Text,
    'modified' : IDL.Text,
    'content' : IDL.Text,
    'views' : IDL.Text,
    'wordCount' : IDL.Text,
    'isPremium' : IDL.Bool,
    'publishedDate' : IDL.Text,
    'claps' : IDL.Text,
    'tags' : IDL.Vec(PostTagModel),
    'isDraft' : IDL.Bool,
    'category' : IDL.Text,
    'handle' : IDL.Text,
    'headerImage' : IDL.Text,
    'subtitle' : IDL.Text,
    'isPublication' : IDL.Bool,
    'postId' : IDL.Text,
  });
  const Result_3 = IDL.Variant({ 'ok' : Post, 'err' : IDL.Text });
  const PopularityType = IDL.Variant({
    'month' : IDL.Null,
    'today' : IDL.Null,
    'ever' : IDL.Null,
    'week' : IDL.Null,
  });
  const Validate = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  return IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'addCanisterToCyclesDispenser' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Nat],
        [Result],
        [],
      ),
    'addNewRules' : IDL.Func([IDL.Vec(IDL.Text)], [], []),
    'addPostCategory' : IDL.Func([IDL.Text, IDL.Text, IDL.Int], [], []),
    'addWasmChunk' : IDL.Func([IDL.Vec(IDL.Nat8)], [Result], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'checkViewsLast24Hours' : IDL.Func([], [], []),
    'clapPost' : IDL.Func([IDL.Text], [], ['oneway']),
    'copyPublicationCanisters' : IDL.Func([IDL.Text], [Result_9], []),
    'copyTrustedCanisters' : IDL.Func([IDL.Text], [Result_7], []),
    'createNewBucketCanister' : IDL.Func([], [Result_1], []),
    'createTag' : IDL.Func([IDL.Text], [Result_8], []),
    'currentId' : IDL.Func([], [IDL.Nat], ['query']),
    'debugApplaudsHashMap' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat))],
        ['query'],
      ),
    'debugGetApplaudsHashMap' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat))],
        ['query'],
      ),
    'debugGetModeration' : IDL.Func(
        [],
        [
          IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
          IDL.Vec(IDL.Tuple(IDL.Text, PostModerationStatus)),
        ],
        ['query'],
      ),
    'delete' : IDL.Func([IDL.Text], [Result_2], []),
    'deletePostFromUserDebug' : IDL.Func([IDL.Text, IDL.Text], [Result_7], []),
    'deleteUserPosts' : IDL.Func([IDL.Text], [Result_2], []),
    'dumpIds' : IDL.Func([], [Result], []),
    'dumpPosts' : IDL.Func([], [Result], []),
    'dumpUserIds' : IDL.Func([], [Result], []),
    'followTag' : IDL.Func([IDL.Text], [Result], []),
    'generateLatestPosts' : IDL.Func([], [], []),
    'generatePublishedDates' : IDL.Func([], [], []),
    'getActiveBucketCanisterId' : IDL.Func([], [Result_1], []),
    'getAdmins' : IDL.Func([], [Result_7], ['query']),
    'getAllBuckets' : IDL.Func([], [Result_7], []),
    'getAllTags' : IDL.Func([], [IDL.Vec(TagModel)], ['query']),
    'getBucketCanisterIdsOfGivenHandles' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [IDL.Vec(IDL.Text)],
        ['query'],
      ),
    'getBucketCanisters' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getCgUsers' : IDL.Func([], [Result_7], ['query']),
    'getFrontendCanisterId' : IDL.Func([], [Result_1], ['query']),
    'getKinicList' : IDL.Func([], [Result_7], []),
    'getLatestPosts' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [GetPostsByFollowers],
        ['query'],
      ),
    'getLatestTimerCall' : IDL.Func([], [IDL.Text, IDL.Text], ['query']),
    'getList' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [IDL.Vec(PostKeyProperties)],
        ['query'],
      ),
    'getMaxMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMoreLatestPosts' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(PostKeyProperties)],
        ['query'],
      ),
    'getMyDailyPostsStatus' : IDL.Func([], [IDL.Bool], ['query']),
    'getMyPosts' : IDL.Func(
        [IDL.Bool, IDL.Bool, IDL.Nat32, IDL.Nat32],
        [IDL.Vec(PostKeyProperties)],
        ['query'],
      ),
    'getMyTags' : IDL.Func([], [IDL.Vec(PostTagModel__1)], ['query']),
    'getNextPostId' : IDL.Func([], [Result_1], []),
    'getNftCanisters' : IDL.Func([], [IDL.Vec(NftCanisterEntry)], ['query']),
    'getPlatformOperators' : IDL.Func([], [List], ['query']),
    'getPopular' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [GetPostsByFollowers],
        ['query'],
      ),
    'getPopularThisMonth' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [GetPostsByFollowers],
        ['query'],
      ),
    'getPopularThisWeek' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [GetPostsByFollowers],
        ['query'],
      ),
    'getPopularToday' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [GetPostsByFollowers],
        ['query'],
      ),
    'getPostKeyProperties' : IDL.Func([IDL.Text], [Result_5], ['query']),
    'getPostUrls' : IDL.Func([], [Result_1], []),
    'getPostViewsPerHourLast24Hours' : IDL.Func(
        [],
        [IDL.Nat, IDL.Vec(IDL.Tuple(IDL.Nat, IDL.Nat))],
        ['query'],
      ),
    'getPostsByCategory' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat32, IDL.Nat32],
        [GetPostsByFollowers],
        ['query'],
      ),
    'getPostsByFollowers' : IDL.Func(
        [IDL.Vec(IDL.Text), IDL.Nat32, IDL.Nat32],
        [GetPostsByFollowers],
        ['query'],
      ),
    'getPostsByPostIds' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [IDL.Vec(PostKeyProperties)],
        ['query'],
      ),
    'getPostsPerHourLast24Hours' : IDL.Func(
        [],
        [IDL.Nat, IDL.Vec(IDL.Tuple(IDL.Int, IDL.Nat))],
        ['query'],
      ),
    'getPublicationCanisters' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getRegisteredRules' : IDL.Func([], [IDL.Vec(Rule)], []),
    'getTagsByUser' : IDL.Func([IDL.Text], [IDL.Vec(PostTag)], ['query']),
    'getTotalArticleViews' : IDL.Func([], [IDL.Nat], ['query']),
    'getTotalClaps' : IDL.Func([], [IDL.Nat], ['query']),
    'getTotalPostCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getTrustedCanisters' : IDL.Func([], [Result_7], ['query']),
    'getUserDailyAllowedPostNumber' : IDL.Func([], [IDL.Nat], ['query']),
    'getUserPostCounts' : IDL.Func([IDL.Text], [UserPostCounts], ['query']),
    'getUserPostIds' : IDL.Func([IDL.Text], [Result_7], ['query']),
    'getUserPosts' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(PostKeyProperties)],
        ['query'],
      ),
    'getViewsByRange' : IDL.Func([RecallOptions], [IDL.Int], []),
    'getWasmChunks' : IDL.Func([], [Result_6], []),
    'handleModclubMigration' : IDL.Func([IDL.Text], [Result_1], []),
    'idQuick' : IDL.Func([], [IDL.Principal], ['query']),
    'incrementApplauds' : IDL.Func([IDL.Text, IDL.Nat], [], []),
    'indexPopular' : IDL.Func([], [], []),
    'initializeCanister' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [Result_1],
        [],
      ),
    'initializePostCoreCanister' : IDL.Func([], [Result_1], []),
    'isThereEnoughMemory' : IDL.Func([], [IDL.Bool], ['query']),
    'makePostPublication' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Bool],
        [],
        [],
      ),
    'migratePostsFromOldPostCanister' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Nat],
        [Result_4],
        [],
      ),
    'modClubCallback' : IDL.Func([ContentResult], [], ['oneway']),
    'modClubCallbackDebug' : IDL.Func([ContentResult], [IDL.Text], []),
    'registerAdmin' : IDL.Func([IDL.Text], [Result], []),
    'registerCanister' : IDL.Func([IDL.Text], [Result], []),
    'registerCgUser' : IDL.Func([IDL.Text], [Result], []),
    'registerNftCanisterId' : IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    'registerPlatformOperator' : IDL.Func([IDL.Text], [Result], []),
    'registerPublisher' : IDL.Func([], [], []),
    'reindex' : IDL.Func([], [Result_1], []),
    'removeExistingRules' : IDL.Func([IDL.Vec(IDL.Text)], [], []),
    'resetWasmChunks' : IDL.Func([], [], ['oneway']),
    'save' : IDL.Func([PostSaveModel], [Result_3], []),
    'setFrontendCanisterId' : IDL.Func([IDL.Text], [Result_1], []),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_2], []),
    'setUpModClub' : IDL.Func([IDL.Text], [], ['oneway']),
    'setUserDailyAllowedPostNumber' : IDL.Func([IDL.Nat], [Result_2], []),
    'simulateModClub' : IDL.Func([IDL.Text, PostModerationStatus], [], []),
    'sortPopularPosts' : IDL.Func([PopularityType], [], []),
    'storeAllSEO' : IDL.Func([], [Result], []),
    'testInstructionSize' : IDL.Func([], [IDL.Text], []),
    'unfollowTag' : IDL.Func([IDL.Text], [Result], []),
    'unregisterAdmin' : IDL.Func([IDL.Text], [Result], []),
    'unregisterCanister' : IDL.Func([IDL.Text], [Result], []),
    'unregisterCgUser' : IDL.Func([IDL.Text], [Result], []),
    'unregisterPlatformOperator' : IDL.Func([IDL.Text], [Result], []),
    'updateHandle' : IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    'updatePostDraft' : IDL.Func(
        [IDL.Text, IDL.Bool, IDL.Int, IDL.Text],
        [PostKeyProperties],
        [],
      ),
    'upgradeAllBuckets' : IDL.Func([IDL.Text, IDL.Vec(IDL.Nat8)], [Result], []),
    'upgradeBucket' : IDL.Func([IDL.Text, IDL.Vec(IDL.Nat8)], [Result], []),
    'validate' : IDL.Func([IDL.Reserved], [Validate], []),
    'viewPost' : IDL.Func([IDL.Text], [], ['oneway']),
  });
};
export const init = ({ IDL }) => { return []; };
