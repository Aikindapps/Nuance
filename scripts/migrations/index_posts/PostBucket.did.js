const PostBucketIDL = ({ IDL }) => {
  const Comment = IDL.Rec();
  const List = IDL.Rec();
  const PostBucketType__1 = IDL.Record({
    url: IDL.Text,
    bucketCanisterId: IDL.Text,
    title: IDL.Text,
    created: IDL.Text,
    modified: IDL.Text,
    content: IDL.Text,
    wordCount: IDL.Text,
    isPremium: IDL.Bool,
    publishedDate: IDL.Text,
    nftCanisterId: IDL.Opt(IDL.Text),
    isDraft: IDL.Bool,
    creatorPrincipal: IDL.Text,
    category: IDL.Text,
    handle: IDL.Text,
    postOwnerPrincipal: IDL.Text,
    creatorHandle: IDL.Text,
    headerImage: IDL.Text,
    isMembersOnly: IDL.Bool,
    subtitle: IDL.Text,
    isPublication: IDL.Bool,
    postId: IDL.Text,
  });
  const Result_6 = IDL.Variant({ ok: PostBucketType__1, err: IDL.Text });
  const Result_3 = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
  const Applaud = IDL.Record({
    bucketCanisterId: IDL.Text,
    receivedTokenAmount: IDL.Nat,
    date: IDL.Text,
    tokenAmount: IDL.Nat,
    sender: IDL.Text,
    applaudId: IDL.Text,
    currency: IDL.Text,
    receiver: IDL.Text,
    numberOfApplauds: IDL.Nat,
    postId: IDL.Text,
  });
  const Result_11 = IDL.Variant({ ok: Applaud, err: IDL.Text });
  const Result_4 = IDL.Variant({ ok: IDL.Nat, err: IDL.Text });
  Comment.fill(
    IDL.Record({
      bucketCanisterId: IDL.Text,
      creator: IDL.Text,
      content: IDL.Text,
      commentId: IDL.Text,
      createdAt: IDL.Text,
      downVotes: IDL.Vec(IDL.Text),
      isCensored: IDL.Bool,
      upVotes: IDL.Vec(IDL.Text),
      replies: IDL.Vec(Comment),
      handle: IDL.Text,
      repliedCommentId: IDL.Opt(IDL.Text),
      editedAt: IDL.Opt(IDL.Text),
      avatar: IDL.Text,
      postId: IDL.Text,
    })
  );
  const Comment__1 = IDL.Record({
    bucketCanisterId: IDL.Text,
    creator: IDL.Text,
    content: IDL.Text,
    commentId: IDL.Text,
    createdAt: IDL.Text,
    downVotes: IDL.Vec(IDL.Text),
    isCensored: IDL.Bool,
    upVotes: IDL.Vec(IDL.Text),
    replies: IDL.Vec(Comment),
    handle: IDL.Text,
    repliedCommentId: IDL.Opt(IDL.Text),
    editedAt: IDL.Opt(IDL.Text),
    avatar: IDL.Text,
    postId: IDL.Text,
  });
  const Result_5 = IDL.Variant({ ok: Comment__1, err: IDL.Text });
  const CommentsReturnType = IDL.Record({
    totalNumberOfComments: IDL.Text,
    comments: IDL.Vec(Comment),
  });
  const Result = IDL.Variant({ ok: CommentsReturnType, err: IDL.Text });
  const Result_9 = IDL.Variant({ ok: IDL.Vec(IDL.Text), err: IDL.Text });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const Result_2 = IDL.Variant({ ok: IDL.Text, err: IDL.Text });
  const Result_10 = IDL.Variant({
    ok: IDL.Vec(Comment__1),
    err: IDL.Text,
  });
  const Result_8 = IDL.Variant({ ok: IDL.Bool, err: IDL.Text });
  const Result_7 = IDL.Variant({
    ok: IDL.Tuple(IDL.Nat, IDL.Vec(IDL.Text)),
    err: IDL.Text,
  });
  const PostTagModel = IDL.Record({ tagId: IDL.Text, tagName: IDL.Text });
  const Post = IDL.Record({
    url: IDL.Text,
    bucketCanisterId: IDL.Text,
    title: IDL.Text,
    created: IDL.Text,
    modified: IDL.Text,
    content: IDL.Text,
    views: IDL.Text,
    wordCount: IDL.Text,
    isPremium: IDL.Bool,
    publishedDate: IDL.Text,
    claps: IDL.Text,
    tags: IDL.Vec(PostTagModel),
    nftCanisterId: IDL.Opt(IDL.Text),
    isDraft: IDL.Bool,
    creatorPrincipal: IDL.Text,
    category: IDL.Text,
    handle: IDL.Text,
    creatorHandle: IDL.Text,
    headerImage: IDL.Text,
    isMembersOnly: IDL.Bool,
    subtitle: IDL.Text,
    isPublication: IDL.Bool,
    postId: IDL.Text,
  });
  const Result_1 = IDL.Variant({ ok: Post, err: IDL.Text });
  const PostSaveModel = IDL.Record({
    tagNames: IDL.Vec(IDL.Text),
    title: IDL.Text,
    content: IDL.Text,
    premium: IDL.Opt(
      IDL.Record({
        thumbnail: IDL.Text,
        icpPrice: IDL.Nat,
        editorPrincipals: IDL.Vec(IDL.Text),
        maxSupply: IDL.Nat,
      })
    ),
    isDraft: IDL.Bool,
    postOwnerPrincipalId: IDL.Text,
    category: IDL.Text,
    caller: IDL.Principal,
    handle: IDL.Text,
    creatorHandle: IDL.Text,
    headerImage: IDL.Text,
    isMembersOnly: IDL.Bool,
    scheduledPublishedDate: IDL.Opt(IDL.Int),
    subtitle: IDL.Text,
    isPublication: IDL.Bool,
    postId: IDL.Text,
  });
  const PostBucketType = IDL.Record({
    url: IDL.Text,
    bucketCanisterId: IDL.Text,
    title: IDL.Text,
    created: IDL.Text,
    modified: IDL.Text,
    content: IDL.Text,
    wordCount: IDL.Text,
    isPremium: IDL.Bool,
    publishedDate: IDL.Text,
    nftCanisterId: IDL.Opt(IDL.Text),
    isDraft: IDL.Bool,
    creatorPrincipal: IDL.Text,
    category: IDL.Text,
    handle: IDL.Text,
    postOwnerPrincipal: IDL.Text,
    creatorHandle: IDL.Text,
    headerImage: IDL.Text,
    isMembersOnly: IDL.Bool,
    subtitle: IDL.Text,
    isPublication: IDL.Bool,
    postId: IDL.Text,
  });
  const SaveResult = IDL.Variant({ ok: PostBucketType, err: IDL.Text });
  const SaveCommentModel = IDL.Record({
    content: IDL.Text,
    commentId: IDL.Opt(IDL.Text),
    replyToCommentId: IDL.Opt(IDL.Text),
    postId: IDL.Text,
  });
  const Validate = IDL.Variant({ Ok: IDL.Text, Err: IDL.Text });
  const PostBucket = IDL.Service({
    acceptCycles: IDL.Func([], [], []),
    addPostCategory: IDL.Func([IDL.Text, IDL.Text], [Result_6], []),
    addPostIdToUserDebug: IDL.Func([IDL.Text, IDL.Text], [Result_3], []),
    availableCycles: IDL.Func([], [IDL.Nat], ['query']),
    buildCommentUrl: IDL.Func([IDL.Text], [IDL.Text], ['query']),
    checkTipping: IDL.Func([IDL.Text], [], []),
    checkTippingByTokenSymbol: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text],
      [Result_11],
      []
    ),
    debugSetCreatorFieldAndAddPostIdToUser: IDL.Func(
      [IDL.Text, IDL.Text],
      [Result_6],
      []
    ),
    delete: IDL.Func([IDL.Text], [Result_4], []),
    deleteComment: IDL.Func([IDL.Text], [Result_5], []),
    deleteUserPosts: IDL.Func([IDL.Text], [Result_4], []),
    downvoteComment: IDL.Func([IDL.Text], [Result], []),
    dumpIds: IDL.Func([], [Result_3], []),
    dumpPosts: IDL.Func([], [Result_3], []),
    dumpUserIds: IDL.Func([], [Result_3], []),
    fixEmptyCreatorFields: IDL.Func([IDL.Text, IDL.Text], [Result_4], []),
    generatePublishedDates: IDL.Func([], [], []),
    getAdmins: IDL.Func([], [Result_9], ['query']),
    getAllApplauds: IDL.Func([], [IDL.Vec(Applaud)], ['query']),
    getAllNotMigratedCreatorFields: IDL.Func(
      [],
      [IDL.Vec(IDL.Text)],
      ['query']
    ),
    getAllRejected: IDL.Func(
      [],
      [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
      ['query']
    ),
    getApplaudById: IDL.Func([IDL.Text], [Result_11], ['query']),
    getBucketCanisterVersion: IDL.Func([], [IDL.Text], ['query']),
    getCanisterVersion: IDL.Func([], [IDL.Text], ['query']),
    getCgUsers: IDL.Func([], [Result_9], ['query']),
    getComment: IDL.Func([IDL.Text], [Result_5], ['query']),
    getFrontendCanisterId: IDL.Func([], [IDL.Text], ['query']),
    getKinicList: IDL.Func([], [Result_9], ['query']),
    getList: IDL.Func(
      [IDL.Vec(IDL.Text)],
      [IDL.Vec(PostBucketType__1)],
      ['query']
    ),
    getMaxMemorySize: IDL.Func([], [IDL.Nat], ['query']),
    getMemorySize: IDL.Func([], [IDL.Nat], ['query']),
    getMyApplauds: IDL.Func([], [IDL.Vec(Applaud)], ['query']),
    getNotMigratedPremiumArticlePostIds: IDL.Func(
      [],
      [IDL.Vec(IDL.Text)],
      ['query']
    ),
    getPlatformOperators: IDL.Func([], [List], ['query']),
    getPost: IDL.Func([IDL.Text], [Result_6], ['query']),
    getPostApplauds: IDL.Func([IDL.Text], [IDL.Vec(Applaud)], ['query']),
    getPostComments: IDL.Func([IDL.Text], [Result], ['query']),
    getPostCompositeQuery: IDL.Func(
      [IDL.Text],
      [Result_6],
      ['composite_query']
    ),
    getPostCoreCanisterId: IDL.Func([], [IDL.Text], ['query']),
    getPostUrls: IDL.Func([], [Result_2], ['query']),
    getPostsByPostIds: IDL.Func(
      [IDL.Vec(IDL.Text), IDL.Bool],
      [IDL.Vec(PostBucketType__1)],
      ['query']
    ),
    getPostsByPostIdsMigration: IDL.Func(
      [IDL.Vec(IDL.Text)],
      [IDL.Vec(PostBucketType__1)],
      ['query']
    ),
    getPublicationPosts: IDL.Func(
      [IDL.Vec(IDL.Text), IDL.Text],
      [IDL.Vec(PostBucketType__1)],
      ['composite_query']
    ),
    getReportedCommentIds: IDL.Func([], [IDL.Vec(IDL.Text)], []),
    getReportedComments: IDL.Func([], [Result_10], ['query']),
    getTotalPostCount: IDL.Func([], [IDL.Nat], ['query']),
    getTrustedCanisters: IDL.Func([], [Result_9], ['query']),
    getUserApplaudsByPrincipal: IDL.Func(
      [IDL.Text],
      [IDL.Vec(Applaud)],
      ['query']
    ),
    getUserPostIds: IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ['query']),
    getUserPosts: IDL.Func(
      [IDL.Text, IDL.Bool],
      [IDL.Vec(PostBucketType__1)],
      ['query']
    ),
    initializeBucketCanister: IDL.Func(
      [IDL.Vec(IDL.Text), IDL.Vec(IDL.Text), IDL.Text],
      [Result_2],
      []
    ),
    initializeCanister: IDL.Func([IDL.Text, IDL.Text], [Result_2], []),
    isBucketCanisterActivePublic: IDL.Func([], [IDL.Bool], ['query']),
    makeBucketCanisterNonActive: IDL.Func([], [Result_8], []),
    migrateCreatorsFromHandlesToPrincipals: IDL.Func([], [Result_7], []),
    migratePostToPublication: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Bool],
      [Result_1],
      []
    ),
    migratePremiumArticleFromOldArch: IDL.Func(
      [IDL.Text, IDL.Opt(IDL.Nat)],
      [Result_2],
      []
    ),
    registerAdmin: IDL.Func([IDL.Text], [Result_3], []),
    registerCanister: IDL.Func([IDL.Text], [Result_3], []),
    registerCgUser: IDL.Func([IDL.Text], [Result_3], []),
    registerPlatformOperator: IDL.Func([IDL.Text], [Result_3], []),
    reindex: IDL.Func([], [Result_2], []),
    rejectPostByModclub: IDL.Func([IDL.Text], [], ['oneway']),
    removeCommentVote: IDL.Func([IDL.Text], [Result], []),
    removePostCategory: IDL.Func([IDL.Text], [Result_6], []),
    removePostIdToUserDebug: IDL.Func([IDL.Text, IDL.Text], [Result_3], []),
    reportComment: IDL.Func([IDL.Text], [Result_2], []),
    reviewComment: IDL.Func([IDL.Text, IDL.Bool], [Result_5], []),
    save: IDL.Func([PostSaveModel], [SaveResult], []),
    saveComment: IDL.Func([SaveCommentModel], [Result], []),
    saveMultiple: IDL.Func([IDL.Vec(PostSaveModel)], [IDL.Vec(SaveResult)], []),
    setMaxMemorySize: IDL.Func([IDL.Nat], [Result_4], []),
    storeHandlesAndPrincipals: IDL.Func(
      [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
      [Result_2],
      []
    ),
    testInstructionSize: IDL.Func([], [IDL.Text], []),
    unRejectPostByModclub: IDL.Func([IDL.Text], [], ['oneway']),
    unregisterAdmin: IDL.Func([IDL.Text], [Result_3], []),
    unregisterCanister: IDL.Func([IDL.Text], [Result_3], []),
    unregisterCgUser: IDL.Func([IDL.Text], [Result_3], []),
    unregisterPlatformOperator: IDL.Func([IDL.Text], [Result_3], []),
    updateHandle: IDL.Func([IDL.Text, IDL.Text], [Result_2], []),
    updatePostDraft: IDL.Func([IDL.Text, IDL.Bool], [Result_1], []),
    upvoteComment: IDL.Func([IDL.Text], [Result], []),
    validate: IDL.Func([IDL.Reserved], [Validate], []),
  });
  return PostBucket;
};

module.exports = {
  PostBucketIDL,
};
