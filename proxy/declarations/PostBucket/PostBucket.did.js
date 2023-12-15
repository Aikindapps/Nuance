export const idlFactory = ({ IDL }) => {
  const Comment = IDL.Rec();
  const List = IDL.Rec();
  const PostBucketType__1 = IDL.Record({
    'url' : IDL.Text,
    'bucketCanisterId' : IDL.Text,
    'title' : IDL.Text,
    'created' : IDL.Text,
    'creator' : IDL.Text,
    'modified' : IDL.Text,
    'content' : IDL.Text,
    'wordCount' : IDL.Text,
    'isPremium' : IDL.Bool,
    'publishedDate' : IDL.Text,
    'isDraft' : IDL.Bool,
    'category' : IDL.Text,
    'handle' : IDL.Text,
    'headerImage' : IDL.Text,
    'subtitle' : IDL.Text,
    'isPublication' : IDL.Bool,
    'postId' : IDL.Text,
  });
  const Result_5 = IDL.Variant({ 'ok' : PostBucketType__1, 'err' : IDL.Text });
  const Applaud = IDL.Record({
    'bucketCanisterId' : IDL.Text,
    'receivedTokenAmount' : IDL.Nat,
    'date' : IDL.Text,
    'tokenAmount' : IDL.Nat,
    'sender' : IDL.Text,
    'applaudId' : IDL.Text,
    'currency' : IDL.Text,
    'receiver' : IDL.Text,
    'numberOfApplauds' : IDL.Nat,
    'postId' : IDL.Text,
  });
  const Result_10 = IDL.Variant({ 'ok' : Applaud, 'err' : IDL.Text });
  const Result_4 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  Comment.fill(
    IDL.Record({
      'bucketCanisterId' : IDL.Text,
      'creator' : IDL.Text,
      'content' : IDL.Text,
      'commentId' : IDL.Text,
      'createdAt' : IDL.Text,
      'downVotes' : IDL.Vec(IDL.Text),
      'upVotes' : IDL.Vec(IDL.Text),
      'replies' : IDL.Vec(Comment),
      'handle' : IDL.Text,
      'repliedCommentId' : IDL.Opt(IDL.Text),
      'editedAt' : IDL.Opt(IDL.Text),
      'avatar' : IDL.Text,
      'postId' : IDL.Text,
    })
  );
  const Comment__1 = IDL.Record({
    'bucketCanisterId' : IDL.Text,
    'creator' : IDL.Text,
    'content' : IDL.Text,
    'commentId' : IDL.Text,
    'createdAt' : IDL.Text,
    'downVotes' : IDL.Vec(IDL.Text),
    'upVotes' : IDL.Vec(IDL.Text),
    'replies' : IDL.Vec(Comment),
    'handle' : IDL.Text,
    'repliedCommentId' : IDL.Opt(IDL.Text),
    'editedAt' : IDL.Opt(IDL.Text),
    'avatar' : IDL.Text,
    'postId' : IDL.Text,
  });
  const Result_9 = IDL.Variant({ 'ok' : Comment__1, 'err' : IDL.Text });
  const CommentsReturnType = IDL.Record({
    'totalNumberOfComments' : IDL.Text,
    'comments' : IDL.Vec(Comment),
  });
  const Result = IDL.Variant({ 'ok' : CommentsReturnType, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_7 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
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
  const Result_8 = IDL.Variant({ 'ok' : Metadata, 'err' : IDL.Text });
  const NftCanisterEntry = IDL.Record({
    'handle' : IDL.Text,
    'canisterId' : IDL.Text,
  });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const Result_2 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Result_6 = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  const PostTagModel = IDL.Record({ 'tagId' : IDL.Text, 'tagName' : IDL.Text });
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
  const Result_1 = IDL.Variant({ 'ok' : Post, 'err' : IDL.Text });
  const PostSaveModel = IDL.Record({
    'tagNames' : IDL.Vec(IDL.Text),
    'title' : IDL.Text,
    'creator' : IDL.Text,
    'content' : IDL.Text,
    'isPremium' : IDL.Bool,
    'isDraft' : IDL.Bool,
    'category' : IDL.Text,
    'caller' : IDL.Principal,
    'headerImage' : IDL.Text,
    'subtitle' : IDL.Text,
    'isPublication' : IDL.Bool,
    'postId' : IDL.Text,
  });
  const PostBucketType = IDL.Record({
    'url' : IDL.Text,
    'bucketCanisterId' : IDL.Text,
    'title' : IDL.Text,
    'created' : IDL.Text,
    'creator' : IDL.Text,
    'modified' : IDL.Text,
    'content' : IDL.Text,
    'wordCount' : IDL.Text,
    'isPremium' : IDL.Bool,
    'publishedDate' : IDL.Text,
    'isDraft' : IDL.Bool,
    'category' : IDL.Text,
    'handle' : IDL.Text,
    'headerImage' : IDL.Text,
    'subtitle' : IDL.Text,
    'isPublication' : IDL.Bool,
    'postId' : IDL.Text,
  });
  const SaveResult = IDL.Variant({ 'ok' : PostBucketType, 'err' : IDL.Text });
  const SaveCommentModel = IDL.Record({
    'content' : IDL.Text,
    'commentId' : IDL.Opt(IDL.Text),
    'replyToCommentId' : IDL.Opt(IDL.Text),
    'postId' : IDL.Text,
  });
  const PostSaveModelBucketMigration = IDL.Record({
    'tagNames' : IDL.Vec(IDL.Text),
    'title' : IDL.Text,
    'created' : IDL.Text,
    'creator' : IDL.Text,
    'modified' : IDL.Text,
    'content' : IDL.Text,
    'isRejected' : IDL.Bool,
    'isPremium' : IDL.Bool,
    'publishedDate' : IDL.Text,
    'isDraft' : IDL.Bool,
    'category' : IDL.Text,
    'caller' : IDL.Principal,
    'creatorHandle' : IDL.Text,
    'headerImage' : IDL.Text,
    'subtitle' : IDL.Text,
    'isPublication' : IDL.Bool,
    'postId' : IDL.Text,
  });
  const Validate = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const PostBucket = IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'addPostCategory' : IDL.Func([IDL.Text, IDL.Text], [Result_5], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'checkTipping' : IDL.Func([IDL.Text], [], []),
    'checkTippingByTokenSymbol' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [Result_10],
        [],
      ),
    'delete' : IDL.Func([IDL.Text], [Result_4], []),
    'deleteComment' : IDL.Func([IDL.Text], [Result_9], []),
    'deleteUserPosts' : IDL.Func([IDL.Text], [Result_4], []),
    'downvoteComment' : IDL.Func([IDL.Text], [Result], []),
    'dumpIds' : IDL.Func([], [Result_3], []),
    'dumpPosts' : IDL.Func([], [Result_3], []),
    'dumpUserIds' : IDL.Func([], [Result_3], []),
    'generateContent' : IDL.Func([IDL.Text], [IDL.Text], []),
    'generatePublishedDates' : IDL.Func([], [], []),
    'get' : IDL.Func([IDL.Text], [Result_5], ['query']),
    'getAdmins' : IDL.Func([], [Result_7], ['query']),
    'getAllRejected' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getApplaudById' : IDL.Func([IDL.Text], [Result_10], ['query']),
    'getBucketCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getCgUsers' : IDL.Func([], [Result_7], ['query']),
    'getComment' : IDL.Func([IDL.Text], [Result_9], ['query']),
    'getFrontendCanisterId' : IDL.Func([], [IDL.Text], ['query']),
    'getKinicList' : IDL.Func([], [Result_7], ['query']),
    'getList' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [IDL.Vec(PostBucketType__1)],
        ['query'],
      ),
    'getMaxMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMetadata' : IDL.Func([IDL.Text, IDL.Nat], [Result_8], ['query']),
    'getMyApplauds' : IDL.Func([], [IDL.Vec(Applaud)], ['query']),
    'getNftCanisters' : IDL.Func([], [IDL.Vec(NftCanisterEntry)], ['query']),
    'getPlatformOperators' : IDL.Func([], [List], ['query']),
    'getPostApplauds' : IDL.Func([IDL.Text], [IDL.Vec(Applaud)], ['query']),
    'getPostComments' : IDL.Func([IDL.Text], [Result], ['query']),
    'getPostCoreCanisterId' : IDL.Func([], [IDL.Text], ['query']),
    'getPostUrls' : IDL.Func([], [Result_2], ['query']),
    'getPostWithPublicationControl' : IDL.Func([IDL.Text], [Result_5], []),
    'getPostsByPostIds' : IDL.Func(
        [IDL.Vec(IDL.Text), IDL.Bool],
        [IDL.Vec(PostBucketType__1)],
        ['query'],
      ),
    'getPremiumArticle' : IDL.Func([IDL.Text], [Result_5], []),
    'getSubmittedForReview' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [IDL.Vec(PostBucketType__1)],
        ['query'],
      ),
    'getTotalPostCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getTrustedCanisters' : IDL.Func([], [Result_7], ['query']),
    'getUserApplaudsByPrincipal' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(Applaud)],
        ['query'],
      ),
    'getUserPosts' : IDL.Func(
        [IDL.Text, IDL.Bool],
        [IDL.Vec(PostBucketType__1)],
        ['query'],
      ),
    'initializeBucketCanister' : IDL.Func(
        [
          IDL.Vec(IDL.Text),
          IDL.Vec(IDL.Text),
          IDL.Vec(IDL.Text),
          IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
        ],
        [Result_2],
        [],
      ),
    'initializeCanister' : IDL.Func([IDL.Text, IDL.Text], [Result_2], []),
    'isBucketCanisterActivePublic' : IDL.Func([], [IDL.Bool], ['query']),
    'makeBucketCanisterNonActive' : IDL.Func([], [Result_6], []),
    'makePostPremium' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'migratePostToPublication' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Bool],
        [Result_1],
        [],
      ),
    'registerAdmin' : IDL.Func([IDL.Text], [Result_3], []),
    'registerCanister' : IDL.Func([IDL.Text], [Result_3], []),
    'registerCgUser' : IDL.Func([IDL.Text], [Result_3], []),
    'registerNftCanisterId' : IDL.Func([IDL.Text, IDL.Text], [Result_2], []),
    'registerNftCanisterIdAdminFunction' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_2],
        [],
      ),
    'registerPlatformOperator' : IDL.Func([IDL.Text], [Result_3], []),
    'reindex' : IDL.Func([], [Result_2], []),
    'rejectPostByModclub' : IDL.Func([IDL.Text], [], ['oneway']),
    'removeCommentVote' : IDL.Func([IDL.Text], [Result], []),
    'removePostCategory' : IDL.Func([IDL.Text], [Result_5], []),
    'save' : IDL.Func([PostSaveModel], [SaveResult], []),
    'saveComment' : IDL.Func([SaveCommentModel], [Result], []),
    'saveMultiple' : IDL.Func(
        [IDL.Vec(PostSaveModelBucketMigration)],
        [IDL.Vec(SaveResult)],
        [],
      ),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_4], []),
    'simulatePremiumArticle' : IDL.Func([IDL.Text, IDL.Bool], [], []),
    'storeAllSEO' : IDL.Func([], [Result_3], []),
    'storeHandlesAndPrincipals' : IDL.Func(
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        [Result_2],
        [],
      ),
    'storeSEO' : IDL.Func([IDL.Text, IDL.Bool], [Result_3], []),
    'testInstructionSize' : IDL.Func([], [IDL.Text], []),
    'unRejectPostByModclub' : IDL.Func([IDL.Text], [], ['oneway']),
    'unregisterAdmin' : IDL.Func([IDL.Text], [Result_3], []),
    'unregisterCanister' : IDL.Func([IDL.Text], [Result_3], []),
    'unregisterCgUser' : IDL.Func([IDL.Text], [Result_3], []),
    'unregisterPlatformOperator' : IDL.Func([IDL.Text], [Result_3], []),
    'updateHandle' : IDL.Func([IDL.Text, IDL.Text], [Result_2], []),
    'updatePostDraft' : IDL.Func([IDL.Text, IDL.Bool], [Result_1], []),
    'upvoteComment' : IDL.Func([IDL.Text], [Result], []),
    'validate' : IDL.Func([IDL.Reserved], [Validate], []),
  });
  return PostBucket;
};
export const init = ({ IDL }) => { return []; };
