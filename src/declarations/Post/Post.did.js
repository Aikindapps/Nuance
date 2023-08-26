export const idlFactory = ({ IDL }) => {
  const PostTagModel = IDL.Record({ 'tagId' : IDL.Text, 'tagName' : IDL.Text });
  const Post = IDL.Record({
    'url' : IDL.Text,
    'title' : IDL.Text,
    'created' : IDL.Text,
    'creator' : IDL.Text,
    'modified' : IDL.Text,
    'content' : IDL.Text,
    'views' : IDL.Text,
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
  const Result = IDL.Variant({ 'ok' : Post, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const TagModel = IDL.Record({
    'id' : IDL.Text,
    'value' : IDL.Text,
    'createdDate' : IDL.Text,
  });
  const Result_9 = IDL.Variant({ 'ok' : TagModel, 'err' : IDL.Text });
  const Result_8 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_4 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
  const PostModerationStatus = IDL.Variant({
    'approved' : IDL.Null,
    'rejected' : IDL.Null,
    'reviewRequired' : IDL.Null,
  });
  const Result_7 = IDL.Variant({
    'ok' : IDL.Tuple(
      IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
      IDL.Vec(IDL.Tuple(IDL.Text, PostModerationStatus)),
    ),
    'err' : IDL.Text,
  });
  const MetricsGranularity = IDL.Variant({
    'hourly' : IDL.Null,
    'daily' : IDL.Null,
  });
  const GetMetricsParameters = IDL.Record({
    'dateToMillis' : IDL.Nat,
    'granularity' : MetricsGranularity,
    'dateFromMillis' : IDL.Nat,
  });
  const UpdateCallsAggregatedData = IDL.Vec(IDL.Nat64);
  const CanisterHeapMemoryAggregatedData = IDL.Vec(IDL.Nat64);
  const CanisterCyclesAggregatedData = IDL.Vec(IDL.Nat64);
  const CanisterMemoryAggregatedData = IDL.Vec(IDL.Nat64);
  const HourlyMetricsData = IDL.Record({
    'updateCalls' : UpdateCallsAggregatedData,
    'canisterHeapMemorySize' : CanisterHeapMemoryAggregatedData,
    'canisterCycles' : CanisterCyclesAggregatedData,
    'canisterMemorySize' : CanisterMemoryAggregatedData,
    'timeMillis' : IDL.Int,
  });
  const NumericEntity = IDL.Record({
    'avg' : IDL.Nat64,
    'max' : IDL.Nat64,
    'min' : IDL.Nat64,
    'first' : IDL.Nat64,
    'last' : IDL.Nat64,
  });
  const DailyMetricsData = IDL.Record({
    'updateCalls' : IDL.Nat64,
    'canisterHeapMemorySize' : NumericEntity,
    'canisterCycles' : NumericEntity,
    'canisterMemorySize' : NumericEntity,
    'timeMillis' : IDL.Int,
  });
  const CanisterMetricsData = IDL.Variant({
    'hourly' : IDL.Vec(HourlyMetricsData),
    'daily' : IDL.Vec(DailyMetricsData),
  });
  const CanisterMetrics = IDL.Record({ 'data' : CanisterMetricsData });
  const Post__1 = IDL.Record({
    'url' : IDL.Text,
    'title' : IDL.Text,
    'created' : IDL.Text,
    'creator' : IDL.Text,
    'modified' : IDL.Text,
    'content' : IDL.Text,
    'views' : IDL.Text,
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
  const GetPostsByFollowers = IDL.Record({
    'totalCount' : IDL.Text,
    'posts' : IDL.Vec(Post__1),
  });
  const MetadataValue = IDL.Tuple(
    IDL.Text,
    IDL.Variant({
      'nat' : IDL.Nat,
      'blob' : IDL.Vec(IDL.Nat8),
      'nat8' : IDL.Nat8,
      'text' : IDL.Text,
    }),
  );
  const MetadataContainer = IDL.Variant({
    'blob' : IDL.Vec(IDL.Nat8),
    'data' : IDL.Vec(MetadataValue),
    'json' : IDL.Text,
  });
  const Metadata = IDL.Variant({
    'fungible' : IDL.Record({
      'decimals' : IDL.Nat8,
      'metadata' : IDL.Opt(MetadataContainer),
      'name' : IDL.Text,
      'symbol' : IDL.Text,
    }),
    'nonfungible' : IDL.Record({
      'thumbnail' : IDL.Text,
      'asset' : IDL.Text,
      'metadata' : IDL.Opt(MetadataContainer),
      'name' : IDL.Text,
    }),
  });
  const Result_6 = IDL.Variant({ 'ok' : Metadata, 'err' : IDL.Text });
  const PostTagModel__1 = IDL.Record({
    'tagId' : IDL.Text,
    'tagName' : IDL.Text,
  });
  const NftCanisterEntry = IDL.Record({
    'handle' : IDL.Text,
    'canisterId' : IDL.Text,
  });
  const PostMigrationType = IDL.Record({
    'url' : IDL.Text,
    'title' : IDL.Text,
    'created' : IDL.Text,
    'creator' : IDL.Text,
    'modified' : IDL.Text,
    'content' : IDL.Text,
    'isRejected' : IDL.Bool,
    'views' : IDL.Text,
    'wordCount' : IDL.Nat,
    'isPremium' : IDL.Bool,
    'publishedDate' : IDL.Text,
    'claps' : IDL.Text,
    'tags' : IDL.Vec(PostTagModel),
    'isDraft' : IDL.Bool,
    'category' : IDL.Text,
    'caller' : IDL.Text,
    'handle' : IDL.Text,
    'headerImage' : IDL.Text,
    'subtitle' : IDL.Text,
    'isPublication' : IDL.Bool,
    'postId' : IDL.Text,
  });
  const Result_5 = IDL.Variant({
    'ok' : IDL.Tuple(
      IDL.Vec(PostMigrationType),
      IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    ),
    'err' : IDL.Text,
  });
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
  const Result_3 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
    'err' : IDL.Text,
  });
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
  const SaveResult = IDL.Variant({ 'ok' : Post__1, 'err' : IDL.Text });
  return IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'addNewRules' : IDL.Func([IDL.Vec(IDL.Text)], [], []),
    'addPostCategory' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'clapPost' : IDL.Func([IDL.Text], [], ['oneway']),
    'collectCanisterMetrics' : IDL.Func([], [], []),
    'copyPostsFromHandleToPublication' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_1],
        [],
      ),
    'createTag' : IDL.Func([IDL.Text], [Result_9], []),
    'currentId' : IDL.Func([], [IDL.Nat], ['query']),
    'delete' : IDL.Func([IDL.Text], [Result_8], []),
    'deleteUserPosts' : IDL.Func([IDL.Text], [Result_8], []),
    'dumpIds' : IDL.Func([], [Result_2], []),
    'dumpPosts' : IDL.Func([], [Result_2], []),
    'dumpUserIds' : IDL.Func([], [Result_2], []),
    'followTag' : IDL.Func([IDL.Text], [Result_2], []),
    'generateAccountIds' : IDL.Func([], [], []),
    'generateContent' : IDL.Func([IDL.Text], [IDL.Text], []),
    'generateLatestPosts' : IDL.Func([], [], []),
    'generateLowercaseHandles' : IDL.Func(
        [],
        [IDL.Text, IDL.Vec(IDL.Text)],
        [],
      ),
    'generatePublishedDates' : IDL.Func([], [], []),
    'generateWordCounts' : IDL.Func([], [], []),
    'get' : IDL.Func([IDL.Text], [Result], ['query']),
    'getAdmins' : IDL.Func([], [Result_4], ['query']),
    'getAllModerationStatus' : IDL.Func([], [Result_7], []),
    'getAllTags' : IDL.Func([], [IDL.Vec(TagModel)], ['query']),
    'getCanisterMetrics' : IDL.Func(
        [GetMetricsParameters],
        [IDL.Opt(CanisterMetrics)],
        ['query'],
      ),
    'getCgUsers' : IDL.Func([], [Result_4], ['query']),
    'getKinicList' : IDL.Func([], [Result_4], ['query']),
    'getLatestPosts' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [GetPostsByFollowers],
        ['query'],
      ),
    'getList' : IDL.Func([IDL.Vec(IDL.Text)], [IDL.Vec(Post)], ['query']),
    'getMetadata' : IDL.Func([IDL.Text, IDL.Nat], [Result_6], ['query']),
    'getMoreLatestPosts' : IDL.Func(
        [IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Post)],
        ['query'],
      ),
    'getMyPosts' : IDL.Func(
        [IDL.Bool, IDL.Bool, IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Post)],
        ['query'],
      ),
    'getMyTags' : IDL.Func([], [IDL.Vec(PostTagModel__1)], ['query']),
    'getNftCanisters' : IDL.Func([], [IDL.Vec(NftCanisterEntry)], ['query']),
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
    'getPostUrls' : IDL.Func([], [Result_1], []),
    'getPostWithPublicationControl' : IDL.Func([IDL.Text], [Result], []),
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
        [IDL.Vec(Post)],
        ['query'],
      ),
    'getPostsMigration' : IDL.Func([IDL.Nat, IDL.Nat], [Result_5], []),
    'getPremiumArticle' : IDL.Func([IDL.Text], [Result], []),
    'getRegisteredRules' : IDL.Func([], [IDL.Vec(Rule)], []),
    'getSEOStorageErrors' : IDL.Func([], [IDL.Vec(IDL.Text)], []),
    'getTagsByUser' : IDL.Func([IDL.Text], [IDL.Vec(PostTag)], ['query']),
    'getTotalArticleViews' : IDL.Func([], [IDL.Nat], ['query']),
    'getTotalPostCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getTrustedCanisters' : IDL.Func([], [Result_4], ['query']),
    'getUserPostCounts' : IDL.Func([IDL.Text], [UserPostCounts], ['query']),
    'getUserPostIds' : IDL.Func([IDL.Text], [Result_4], ['query']),
    'getUserPosts' : IDL.Func([IDL.Text], [IDL.Vec(Post)], ['query']),
    'getViewsByRange' : IDL.Func([RecallOptions], [IDL.Int], ['query']),
    'getViewsHistoryHashmap' : IDL.Func([], [Result_3], ['query']),
    'getWordCount' : IDL.Func([IDL.Text], [IDL.Nat], ['query']),
    'indexPopular' : IDL.Func([], [], []),
    'latestPostsMigration' : IDL.Func([], [], []),
    'linkWritersToPublicationPosts' : IDL.Func([], [Result_1], []),
    'makePostPremium' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'migratePostToPublication' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Bool],
        [Result],
        [],
      ),
    'migratePostsFromFastblocks' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_1],
        [],
      ),
    'modClubCallback' : IDL.Func([ContentResult], [], ['oneway']),
    'registerAdmin' : IDL.Func([IDL.Text], [Result_2], []),
    'registerCanister' : IDL.Func([IDL.Text], [Result_2], []),
    'registerCgUser' : IDL.Func([IDL.Text], [Result_2], []),
    'registerNftCanisterId' : IDL.Func([IDL.Text], [Result_1], []),
    'registerNftCanisterIdAdminFunction' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_1],
        [],
      ),
    'registerPublisher' : IDL.Func([], [], []),
    'reindex' : IDL.Func([], [Result_1], []),
    'removeExistingRules' : IDL.Func([IDL.Vec(IDL.Text)], [], []),
    'removePostCategory' : IDL.Func([IDL.Text], [Result], []),
    'save' : IDL.Func([PostSaveModel], [SaveResult], []),
    'setUpModClub' : IDL.Func([IDL.Text], [], ['oneway']),
    'simulateModClub' : IDL.Func([IDL.Text, PostModerationStatus], [], []),
    'simulatePremiumArticle' : IDL.Func([IDL.Text, IDL.Bool], [], []),
    'storeAllSEO' : IDL.Func([IDL.Nat, IDL.Nat], [Result_2], []),
    'storeSEO' : IDL.Func([IDL.Text, IDL.Bool], [Result_2], []),
    'testInstructionSize' : IDL.Func([], [IDL.Text], []),
    'unfollowTag' : IDL.Func([IDL.Text], [Result_2], []),
    'unregisterAdmin' : IDL.Func([IDL.Text], [Result_2], []),
    'unregisterCanister' : IDL.Func([IDL.Text], [Result_2], []),
    'unregisterCgUser' : IDL.Func([IDL.Text], [Result_2], []),
    'updateHandle' : IDL.Func([IDL.Text, IDL.Text], [Result_1], []),
    'updatePostDraft' : IDL.Func([IDL.Text, IDL.Bool], [Result], []),
    'viewPost' : IDL.Func([IDL.Text], [], ['oneway']),
    'x' : IDL.Func([], [IDL.Vec(IDL.Text)], []),
  });
};
export const init = ({ IDL }) => { return []; };
