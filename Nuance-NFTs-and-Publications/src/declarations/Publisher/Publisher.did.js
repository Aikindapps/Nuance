export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const PublicationCta = IDL.Record({
    'icon' : IDL.Text,
    'link' : IDL.Text,
    'ctaCopy' : IDL.Text,
    'buttonCopy' : IDL.Text,
  });
  const PublicationStyling = IDL.Record({
    'primaryColor' : IDL.Text,
    'logo' : IDL.Text,
    'fontType' : IDL.Text,
  });
  const SocialLinksObject = IDL.Record({
    'socialChannels' : IDL.Vec(IDL.Text),
    'website' : IDL.Text,
  });
  const Publication = IDL.Record({
    'cta' : PublicationCta,
    'categories' : IDL.Vec(IDL.Text),
    'styling' : PublicationStyling,
    'created' : IDL.Text,
    'modified' : IDL.Text,
    'editors' : IDL.Vec(IDL.Text),
    'socialLinks' : SocialLinksObject,
    'description' : IDL.Text,
    'nftCanisterId' : IDL.Text,
    'publicationTitle' : IDL.Text,
    'publicationHandle' : IDL.Text,
    'writers' : IDL.Vec(IDL.Text),
    'headerImage' : IDL.Text,
    'subtitle' : IDL.Text,
    'avatar' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : Publication, 'err' : IDL.Text });
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
  const AccountIdentifier = IDL.Text;
  const Result_3 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const TokenIndex = IDL.Nat32;
  const Balance = IDL.Nat;
  const AccountIdentifier__1 = IDL.Text;
  const TokenIdentifier = IDL.Text;
  const TransferResponse = IDL.Variant({
    'ok' : Balance,
    'err' : IDL.Variant({
      'CannotNotify' : AccountIdentifier__1,
      'InsufficientBalance' : IDL.Null,
      'InvalidToken' : TokenIdentifier,
      'Rejected' : IDL.Null,
      'Unauthorized' : AccountIdentifier__1,
      'Other' : IDL.Text,
    }),
  });
  const CreateNftFromArticleResponse = IDL.Record({
    'tokenIndexes' : IDL.Vec(TokenIndex),
    'transferResponses' : IDL.Vec(TransferResponse),
  });
  const Result_11 = IDL.Variant({
    'ok' : CreateNftFromArticleResponse,
    'err' : IDL.Text,
  });
  const Result_10 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
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
  const NftCanisterInformation = IDL.Record({
    'nuanceSharePercentage' : IDL.Text,
    'nuanceShareAddress' : IDL.Text,
    'marketplaceRoyaltyPercentage' : IDL.Text,
    'marketplaceRoyaltyAddress' : IDL.Text,
    'canisterId' : IDL.Text,
  });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const GetPremiumArticleInfoReturn = IDL.Record({
    'writerHandle' : IDL.Text,
    'totalSupply' : IDL.Text,
    'nftCanisterId' : IDL.Text,
    'tokenIndexStart' : IDL.Text,
    'sellerAccount' : IDL.Text,
    'postId' : IDL.Text,
  });
  const Result_9 = IDL.Variant({
    'ok' : GetPremiumArticleInfoReturn,
    'err' : IDL.Text,
  });
  const CommonError = IDL.Variant({
    'InvalidToken' : TokenIdentifier,
    'Other' : IDL.Text,
  });
  const Result_8 = IDL.Variant({ 'ok' : IDL.Null, 'err' : CommonError });
  const Result_4 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_7 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Result_6 = IDL.Variant({
    'ok' : IDL.Tuple(IDL.Nat, AccountIdentifier),
    'err' : IDL.Text,
  });
  const Result_5 = IDL.Variant({ 'ok' : AccountIdentifier, 'err' : IDL.Text });
  const PublicationCta__1 = IDL.Record({
    'icon' : IDL.Text,
    'link' : IDL.Text,
    'ctaCopy' : IDL.Text,
    'buttonCopy' : IDL.Text,
  });
  const SocialLinksObject__1 = IDL.Record({
    'socialChannels' : IDL.Vec(IDL.Text),
    'website' : IDL.Text,
  });
  const PublicationObject = IDL.Record({
    'isEditor' : IDL.Bool,
    'publicationName' : IDL.Text,
  });
  const Followers = IDL.Opt(IDL.Tuple(IDL.Text, List));
  const User = IDL.Record({
    'bio' : IDL.Text,
    'followersArray' : IDL.Vec(IDL.Text),
    'displayName' : IDL.Text,
    'followersCount' : IDL.Nat32,
    'nuaTokens' : IDL.Float64,
    'accountCreated' : IDL.Text,
    'publicationsArray' : IDL.Vec(PublicationObject),
    'handle' : IDL.Text,
    'followers' : Followers,
    'avatar' : IDL.Text,
  });
  const Result_2 = IDL.Variant({ 'ok' : User, 'err' : IDL.Text });
  const Publisher = IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'addEditor' : IDL.Func([IDL.Text], [Result], []),
    'addNftCanister' : IDL.Func([IDL.Text], [], []),
    'addPublicationPostCategory' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_1],
        [],
      ),
    'addWriter' : IDL.Func([IDL.Text], [Result], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'collectCanisterMetrics' : IDL.Func([], [], []),
    'createNftCanister' : IDL.Func(
        [IDL.Nat, AccountIdentifier],
        [Result_3],
        [],
      ),
    'createNftFromPremiumArticle' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Nat, IDL.Text],
        [Result_11],
        [],
      ),
    'debugRemoveNftCanister' : IDL.Func([], [], []),
    'disperseIcpGainedFromPost' : IDL.Func([IDL.Text], [Result_3], []),
    'disperseIcpTimerMethod' : IDL.Func([], [], []),
    'getAccountIdByPostIdPublic' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'getAdmins' : IDL.Func([], [Result_10], ['query']),
    'getCanisterMetrics' : IDL.Func(
        [GetMetricsParameters],
        [IDL.Opt(CanisterMetrics)],
        ['query'],
      ),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getCgUsers' : IDL.Func([], [Result_10], ['query']),
    'getEditorAndWriterPrincipalIds' : IDL.Func(
        [],
        [IDL.Vec(IDL.Text), IDL.Vec(IDL.Text)],
        ['query'],
      ),
    'getMaxMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getNftCanisterInformation' : IDL.Func(
        [],
        [NftCanisterInformation],
        ['query'],
      ),
    'getPlatformOperators' : IDL.Func([], [List], ['query']),
    'getPremiumArticleInfo' : IDL.Func([IDL.Text], [Result_9], ['query']),
    'getPremiumArticleInformationsByWriterHandle' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(GetPremiumArticleInfoReturn)],
        ['query'],
      ),
    'getPublication' : IDL.Func([IDL.Text], [Result], []),
    'getPublicationPost' : IDL.Func([IDL.Text], [Result_1], []),
    'getPublicationPosts' : IDL.Func(
        [IDL.Bool, IDL.Bool, IDL.Nat32, IDL.Nat32],
        [IDL.Vec(Post)],
        [],
      ),
    'getPublicationQuery' : IDL.Func([IDL.Text], [Result], ['query']),
    'getWritersDrafts' : IDL.Func([], [IDL.Vec(Post)], []),
    'idQuick' : IDL.Func([], [IDL.Principal], []),
    'initializeCanister' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [Result_3],
        [],
      ),
    'isThereEnoughMemory' : IDL.Func([], [IDL.Bool], ['query']),
    'listAllTokens' : IDL.Func([IDL.Text], [IDL.Vec(Result_8)], []),
    'migrateEditorsWritersHandles' : IDL.Func([], [Result], []),
    'registerAdmin' : IDL.Func([IDL.Text], [Result_4], []),
    'registerCgUser' : IDL.Func([IDL.Text], [Result_4], []),
    'registerPlatformOperator' : IDL.Func([IDL.Text], [Result_4], []),
    'registerPublication' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'removeEditor' : IDL.Func([IDL.Text], [Result], []),
    'removePublicationPostCategory' : IDL.Func([IDL.Text], [Result_1], []),
    'removeWriter' : IDL.Func([IDL.Text], [Result], []),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_7], []),
    'setNftCanisterRoyalty' : IDL.Func(
        [IDL.Nat, AccountIdentifier],
        [Result_6],
        [],
      ),
    'setNuanceAddress' : IDL.Func([AccountIdentifier], [Result_5], []),
    'setNuanceSharePercentage' : IDL.Func([IDL.Nat], [Result_3], []),
    'unregisterAdmin' : IDL.Func([IDL.Text], [Result_4], []),
    'unregisterCgUser' : IDL.Func([IDL.Text], [Result_4], []),
    'unregisterPlatformOperator' : IDL.Func([IDL.Text], [Result_4], []),
    'unregisterPublication' : IDL.Func([], [Result_3], []),
    'updateEditorOrWriterHandle' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'updatePublicationCta' : IDL.Func([PublicationCta__1], [Result], []),
    'updatePublicationDetails' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Vec(IDL.Text),
          IDL.Vec(IDL.Text),
          IDL.Vec(IDL.Text),
          IDL.Text,
          IDL.Text,
          SocialLinksObject__1,
          IDL.Text,
        ],
        [Result],
        [],
      ),
    'updatePublicationHandle' : IDL.Func([IDL.Text], [Result_2], []),
    'updatePublicationPostDraft' : IDL.Func(
        [IDL.Text, IDL.Bool],
        [Result_1],
        [],
      ),
    'updatePublicationStyling' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [Result],
        [],
      ),
    'updatePublicationWriters' : IDL.Func([IDL.Vec(IDL.Text)], [Result], []),
  });
  return Publisher;
};
export const init = ({ IDL }) => { return []; };
