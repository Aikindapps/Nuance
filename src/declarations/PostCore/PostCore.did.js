export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_10 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'err' : IDL.Text,
  });
  const Result_8 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const TagModel = IDL.Record({
    'id' : IDL.Text,
    'value' : IDL.Text,
    'createdDate' : IDL.Text,
  });
  const Result_9 = IDL.Variant({ 'ok' : TagModel, 'err' : IDL.Text });
  const PostSaveModel = IDL.Record({
    'title' : IDL.Text,
    'content' : IDL.Text,
    'premium' : IDL.Opt(
      IDL.Record({
        'thumbnail' : IDL.Text,
        'icpPrice' : IDL.Nat,
        'maxSupply' : IDL.Nat,
      })
    ),
    'isDraft' : IDL.Bool,
    'tagIds' : IDL.Vec(IDL.Text),
    'category' : IDL.Text,
    'handle' : IDL.Text,
    'creatorHandle' : IDL.Text,
    'headerImage' : IDL.Text,
    'isMembersOnly' : IDL.Bool,
    'scheduledPublishedDate' : IDL.Opt(IDL.Int),
    'subtitle' : IDL.Text,
    'isPublication' : IDL.Bool,
    'postId' : IDL.Text,
  });
  const PostTagModel = IDL.Record({ 'tagId' : IDL.Text, 'tagName' : IDL.Text });
  const Post = IDL.Record({
    'url' : IDL.Text,
    'bucketCanisterId' : IDL.Text,
    'title' : IDL.Text,
    'created' : IDL.Text,
    'modified' : IDL.Text,
    'content' : IDL.Text,
    'views' : IDL.Text,
    'wordCount' : IDL.Text,
    'isPremium' : IDL.Bool,
    'publishedDate' : IDL.Text,
    'claps' : IDL.Text,
    'tags' : IDL.Vec(PostTagModel),
    'nftCanisterId' : IDL.Opt(IDL.Text),
    'isDraft' : IDL.Bool,
    'creatorPrincipal' : IDL.Text,
    'category' : IDL.Text,
    'handle' : IDL.Text,
    'creatorHandle' : IDL.Text,
    'headerImage' : IDL.Text,
    'isMembersOnly' : IDL.Bool,
    'subtitle' : IDL.Text,
    'isPublication' : IDL.Bool,
    'postId' : IDL.Text,
  });
  const Result_4 = IDL.Variant({ 'ok' : Post, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
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
  const PostTagModel__1 = IDL.Record({
    'tagId' : IDL.Text,
    'tagName' : IDL.Text,
  });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const Result_5 = IDL.Variant({ 'ok' : PostKeyProperties, 'err' : IDL.Text });
  const PostTag = IDL.Record({
    'tagId' : IDL.Text,
    'createdDate' : IDL.Int,
    'isActive' : IDL.Bool,
    'modifiedDate' : IDL.Int,
  });
  const UserPostCounts = IDL.Record({
    'totalViewCount' : IDL.Text,
    'plannedCount' : IDL.Text,
    'uniqueClaps' : IDL.Text,
    'draftCount' : IDL.Text,
    'uniqueReaderCount' : IDL.Text,
    'publishedCount' : IDL.Text,
    'handle' : IDL.Text,
    'premiumCount' : IDL.Text,
    'submittedToReviewCount' : IDL.Text,
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
  const Result_7 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Nat8), 'err' : IDL.Text });
  const SupportedStandard = IDL.Record({ 'url' : IDL.Text, 'name' : IDL.Text });
  const Icrc28TrustedOriginsResponse = IDL.Record({
    'trusted_origins' : IDL.Vec(IDL.Text),
  });
  const Result_6 = IDL.Variant({
    'ok' : IDL.Tuple(
      IDL.Vec(IDL.Tuple(IDL.Text, IDL.Vec(IDL.Text))),
      IDL.Vec(IDL.Tuple(IDL.Text, IDL.Vec(IDL.Text))),
    ),
    'err' : IDL.Text,
  });
  const ContentStatus = IDL.Variant({
    'new' : IDL.Null,
    'approved' : IDL.Null,
    'rejected' : IDL.Null,
  });
  const ViolatedRules = IDL.Record({
    'id' : IDL.Text,
    'rejectionCount' : IDL.Nat,
  });
  const ContentResult = IDL.Record({
    'status' : ContentStatus,
    'approvedCount' : IDL.Nat,
    'sourceId' : IDL.Text,
    'violatedRules' : IDL.Vec(ViolatedRules),
    'rejectedCount' : IDL.Nat,
  });
  const PostBucketType = IDL.Record({
    'url' : IDL.Text,
    'bucketCanisterId' : IDL.Text,
    'title' : IDL.Text,
    'created' : IDL.Text,
    'modified' : IDL.Text,
    'content' : IDL.Text,
    'wordCount' : IDL.Text,
    'isPremium' : IDL.Bool,
    'publishedDate' : IDL.Text,
    'nftCanisterId' : IDL.Opt(IDL.Text),
    'isDraft' : IDL.Bool,
    'creatorPrincipal' : IDL.Text,
    'category' : IDL.Text,
    'handle' : IDL.Text,
    'postOwnerPrincipal' : IDL.Text,
    'creatorHandle' : IDL.Text,
    'headerImage' : IDL.Text,
    'isMembersOnly' : IDL.Bool,
    'subtitle' : IDL.Text,
    'isPublication' : IDL.Bool,
    'postId' : IDL.Text,
  });
  const PostModerationStatusV2 = IDL.Variant({
    'new' : IDL.Null,
    'approved' : IDL.Null,
    'rejected' : IDL.Null,
  });
  const PopularityType = IDL.Variant({
    'month' : IDL.Null,
    'today' : IDL.Null,
    'ever' : IDL.Null,
    'week' : IDL.Null,
  });
  const Validate = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const Result = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  return IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'addCanisterToCyclesDispenser' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Nat],
        [Result_1],
        [],
      ),
    'addNewRules' : IDL.Func([IDL.Vec(IDL.Text)], [], []),
    'addPostCategory' : IDL.Func([IDL.Text, IDL.Text, IDL.Int], [], []),
    'addPostIdToUserDebug' : IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    'addWasmChunk' : IDL.Func([IDL.Vec(IDL.Nat8)], [Result_1], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'checkViewsLast24Hours' : IDL.Func([], [], []),
    'clapPost' : IDL.Func([IDL.Text], [], ['oneway']),
    'copyPublicationCanisters' : IDL.Func([IDL.Text], [Result_10], []),
    'copyTrustedCanisters' : IDL.Func([IDL.Text], [Result_8], []),
    'createNewBucketCanister' : IDL.Func([], [Result_2], []),
    'createTag' : IDL.Func([IDL.Text], [Result_9], []),
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
    'debugMembersOnlyStatusOfExistingDraftArticles' : IDL.Func(
        [],
        [Result_8],
        [],
      ),
    'debugSaveMultiplePosts' : IDL.Func(
        [IDL.Vec(PostSaveModel)],
        [IDL.Vec(Result_4)],
        [],
      ),
    'delete' : IDL.Func([IDL.Text], [Result_3], []),
    'deletePostFromUserDebug' : IDL.Func([IDL.Text, IDL.Text], [Result_8], []),
    'deleteUserPosts' : IDL.Func([IDL.Text], [Result_3], []),
    'dumpIds' : IDL.Func([], [Result_1], []),
    'dumpPosts' : IDL.Func([], [Result_1], []),
    'dumpUserIds' : IDL.Func([], [Result_1], []),
    'followTag' : IDL.Func([IDL.Text], [Result_1], []),
    'generateLatestPosts' : IDL.Func([], [], []),
    'generatePublishedDates' : IDL.Func([], [], []),
    'getActiveBucketCanisterId' : IDL.Func([], [Result_2], []),
    'getAdmins' : IDL.Func([], [Result_8], ['query']),
    'getAllBuckets' : IDL.Func([], [Result_8], []),
    'getAllNftCanisters' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getAllStatusCount' : IDL.Func([], [Result_2], []),
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
    'getCgUsers' : IDL.Func([], [Result_8], ['query']),
    'getFrontendCanisterId' : IDL.Func([], [Result_2], ['query']),
    'getHistoricalPublishedArticlesData' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Int))],
        ['query'],
      ),
    'getKinicList' : IDL.Func([], [Result_8], []),
    'getLastWeekRejectedPostKeyProperties' : IDL.Func(
        [],
        [IDL.Vec(PostKeyProperties)],
        ['query'],
      ),
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
    'getMoreArticlesFromUsers' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Text)],
        [IDL.Vec(IDL.Vec(PostKeyProperties))],
        ['query'],
      ),
    'getMoreLatestPosts' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(PostKeyProperties)],
        ['query'],
      ),
    'getMyAllPosts' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(PostKeyProperties)],
        ['query'],
      ),
    'getMyDailyPostsStatus' : IDL.Func([], [IDL.Bool], ['query']),
    'getMyDraftPosts' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(PostKeyProperties)],
        ['query'],
      ),
    'getMyFollowingTagsPostKeyProperties' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [GetPostsByFollowers],
        ['composite_query'],
      ),
    'getMyPlannedPosts' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(PostKeyProperties)],
        ['query'],
      ),
    'getMyPublishedPosts' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(PostKeyProperties)],
        ['query'],
      ),
    'getMySubmittedToReviewPosts' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(PostKeyProperties)],
        ['query'],
      ),
    'getMyTags' : IDL.Func([], [IDL.Vec(PostTagModel__1)], ['query']),
    'getNextPostId' : IDL.Func([], [Result_2], []),
    'getNextPostIdsDebug' : IDL.Func([IDL.Nat], [Result_2], []),
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
    'getPostUrls' : IDL.Func([], [Result_2], []),
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
    'getPostsByPostIdsMigration' : IDL.Func(
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
    'getPublicationPosts' : IDL.Func(
        [IDL.Nat32, IDL.Nat32, IDL.Text],
        [IDL.Vec(PostKeyProperties)],
        ['query'],
      ),
    'getTagFollowers' : IDL.Func([IDL.Text], [Result_8], []),
    'getTagsByUser' : IDL.Func([IDL.Text], [IDL.Vec(PostTag)], ['query']),
    'getTotalAmountOfTipsReceived' : IDL.Func(
        [],
        [IDL.Nat],
        ['composite_query'],
      ),
    'getTotalArticleViews' : IDL.Func([], [IDL.Nat], ['query']),
    'getTotalClaps' : IDL.Func([], [IDL.Nat], ['query']),
    'getTotalPostCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getTrustedCanisters' : IDL.Func([], [Result_8], ['query']),
    'getUserDailyAllowedPostNumber' : IDL.Func([], [IDL.Nat], ['query']),
    'getUserPostCounts' : IDL.Func([IDL.Text], [UserPostCounts], ['query']),
    'getUserPostIds' : IDL.Func([IDL.Text], [Result_8], ['query']),
    'getUserPosts' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(PostKeyProperties)],
        ['query'],
      ),
    'getUsersPostCountsByHandles' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [IDL.Vec(UserPostCounts)],
        ['query'],
      ),
    'getViewsByRange' : IDL.Func([RecallOptions], [IDL.Int], []),
    'getWasmChunks' : IDL.Func([], [Result_7], []),
    'handleModclubMigration' : IDL.Func([IDL.Text], [Result_2], []),
    'icrc10_supported_standards' : IDL.Func(
        [],
        [IDL.Vec(SupportedStandard)],
        ['query'],
      ),
    'icrc28_trusted_origins' : IDL.Func([], [Icrc28TrustedOriginsResponse], []),
    'idQuick' : IDL.Func([], [IDL.Principal], ['query']),
    'incrementApplauds' : IDL.Func([IDL.Text, IDL.Nat], [], []),
    'indexPopular' : IDL.Func([], [], []),
    'initializeCanister' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [Result_2],
        [],
      ),
    'initializePostCoreCanister' : IDL.Func([], [Result_2], []),
    'isEditorPublic' : IDL.Func(
        [IDL.Text, IDL.Principal],
        [IDL.Bool],
        ['query'],
      ),
    'isThereEnoughMemory' : IDL.Func([], [IDL.Bool], ['query']),
    'isWriterPublic' : IDL.Func(
        [IDL.Text, IDL.Principal],
        [IDL.Bool],
        ['query'],
      ),
    'makePostPublication' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Bool, IDL.Int],
        [],
        [],
      ),
    'migrateAllPublicationEditorsAndWriters' : IDL.Func([], [Result_6], []),
    'migrateModclubInterface' : IDL.Func([], [Result_2], []),
    'migratePremiumArticleFromOldArch' : IDL.Func([], [Result_5], []),
    'modClubCallback' : IDL.Func([ContentResult], [], ['oneway']),
    'refreshUserPostIds' : IDL.Func([IDL.Text], [Result_3], []),
    'registerAdmin' : IDL.Func([IDL.Text], [Result_1], []),
    'registerCanister' : IDL.Func([IDL.Text], [Result_1], []),
    'registerCgUser' : IDL.Func([IDL.Text], [Result_1], []),
    'registerPlatformOperator' : IDL.Func([IDL.Text], [Result_1], []),
    'registerPublisher' : IDL.Func([], [], []),
    'reindex' : IDL.Func([], [Result_2], []),
    'removePostFromPopularityArrays' : IDL.Func([IDL.Text], [], ['oneway']),
    'removePostIdToUserDebug' : IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    'resetWasmChunks' : IDL.Func([], [], ['oneway']),
    'save' : IDL.Func([PostSaveModel], [Result_4], []),
    'sendNewArticleNotification' : IDL.Func([PostBucketType], [], []),
    'setFrontendCanisterId' : IDL.Func([IDL.Text], [Result_2], []),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_3], []),
    'setUpModClub' : IDL.Func([IDL.Text], [], ['oneway']),
    'setUserDailyAllowedPostNumber' : IDL.Func([IDL.Nat], [Result_3], []),
    'simulateModClub' : IDL.Func([IDL.Text, PostModerationStatusV2], [], []),
    'sortPopularPosts' : IDL.Func([PopularityType], [], []),
    'storeAllSEO' : IDL.Func([], [Result_1], []),
    'testInstructionSize' : IDL.Func([], [IDL.Text], []),
    'unfollowTag' : IDL.Func([IDL.Text], [Result_1], []),
    'unregisterAdmin' : IDL.Func([IDL.Text], [Result_1], []),
    'unregisterCanister' : IDL.Func([IDL.Text], [Result_1], []),
    'unregisterCgUser' : IDL.Func([IDL.Text], [Result_1], []),
    'unregisterPlatformOperator' : IDL.Func([IDL.Text], [Result_1], []),
    'updateHandle' : IDL.Func([IDL.Text, IDL.Text], [Result_2], []),
    'updatePostDraft' : IDL.Func(
        [IDL.Text, IDL.Bool, IDL.Int, IDL.Text],
        [PostKeyProperties],
        [],
      ),
    'updatePublicationEditorsAndWriters' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Text), IDL.Vec(IDL.Text)],
        [Result_1],
        [],
      ),
    'updateSettingsForAllBucketCanisters' : IDL.Func([], [Result_2], []),
    'upgradeAllBuckets' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Nat8)],
        [Result_1],
        [],
      ),
    'upgradeBucket' : IDL.Func([IDL.Text, IDL.Vec(IDL.Nat8)], [Result_1], []),
    'validate' : IDL.Func([IDL.Reserved], [Validate], []),
    'verifyMigration' : IDL.Func([], [Result], ['query']),
    'viewPost' : IDL.Func([IDL.Text], [], ['oneway']),
  });
};
export const init = ({ IDL }) => { return []; };
