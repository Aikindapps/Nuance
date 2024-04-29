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
    'subtitle' : IDL.Text,
    'isPublication' : IDL.Bool,
    'postId' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'ok' : Post, 'err' : IDL.Text });
  const Result_6 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
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
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const Result_3 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Result_4 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_5 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
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
  const FollowersPrincipals = IDL.Opt(IDL.Tuple(IDL.Text, List));
  const Followers = IDL.Opt(IDL.Tuple(IDL.Text, List));
  const User = IDL.Record({
    'bio' : IDL.Text,
    'socialChannels' : IDL.Vec(IDL.Text),
    'followersArray' : IDL.Vec(IDL.Text),
    'displayName' : IDL.Text,
    'followersCount' : IDL.Nat32,
    'nuaTokens' : IDL.Float64,
    'accountCreated' : IDL.Text,
    'publicationsArray' : IDL.Vec(PublicationObject),
    'website' : IDL.Text,
    'handle' : IDL.Text,
    'followersPrincipals' : FollowersPrincipals,
    'followers' : Followers,
    'avatar' : IDL.Text,
  });
  const Result_2 = IDL.Variant({ 'ok' : User, 'err' : IDL.Text });
  const Publisher = IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'addEditor' : IDL.Func([IDL.Text], [Result], []),
    'addPublicationPostCategory' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_1],
        [],
      ),
    'addWriter' : IDL.Func([IDL.Text], [Result], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'collectCanisterMetrics' : IDL.Func([], [], []),
    'getAdmins' : IDL.Func([], [Result_6], ['query']),
    'getCanisterMetrics' : IDL.Func(
        [GetMetricsParameters],
        [IDL.Opt(CanisterMetrics)],
        ['query'],
      ),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getCgUsers' : IDL.Func([], [Result_6], ['query']),
    'getEditorAndWriterPrincipalIds' : IDL.Func(
        [],
        [IDL.Vec(IDL.Text), IDL.Vec(IDL.Text)],
        ['query'],
      ),
    'getMaxMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getPlatformOperators' : IDL.Func([], [List], ['query']),
    'getPublication' : IDL.Func([IDL.Text], [Result], []),
    'getPublicationQuery' : IDL.Func([IDL.Text], [Result], ['query']),
    'idQuick' : IDL.Func([], [IDL.Principal], []),
    'initializeCanister' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [Result_3],
        [],
      ),
    'isThereEnoughMemory' : IDL.Func([], [IDL.Bool], ['query']),
    'migrateEditorsWritersHandles' : IDL.Func([], [Result], []),
    'registerAdmin' : IDL.Func([IDL.Text], [Result_4], []),
    'registerCgUser' : IDL.Func([IDL.Text], [Result_4], []),
    'registerPlatformOperator' : IDL.Func([IDL.Text], [Result_4], []),
    'registerPublication' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'removeEditor' : IDL.Func([IDL.Text], [Result], []),
    'removePublicationPostCategory' : IDL.Func([IDL.Text], [Result_1], []),
    'removeWriter' : IDL.Func([IDL.Text], [Result], []),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_5], []),
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
