export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const PublicationObject__1 = IDL.Record({
    'isEditor' : IDL.Bool,
    'publicationName' : IDL.Text,
  });
  const PublicationObject = IDL.Record({
    'isEditor' : IDL.Bool,
    'publicationName' : IDL.Text,
  });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const Followers = IDL.Opt(IDL.Tuple(IDL.Text, List));
  const User__1 = IDL.Record({
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
    'followers' : Followers,
    'avatar' : IDL.Text,
  });
  const AddPublicationReturn = IDL.Variant({
    'ok' : User__1,
    'err' : IDL.Text,
  });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
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
    'followers' : Followers,
    'avatar' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : User, 'err' : IDL.Text });
  const Date = IDL.Record({
    'day' : IDL.Nat,
    'month' : IDL.Nat,
    'hour' : IDL.Nat,
    'year' : IDL.Nat,
  });
  const Result_4 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
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
  const GetHandleByPrincipalReturn = IDL.Variant({
    'ok' : IDL.Opt(IDL.Text),
    'err' : IDL.Text,
  });
  const Result_6 = IDL.Variant({ 'ok' : IDL.Vec(User), 'err' : IDL.Text });
  const UserListItem = IDL.Record({
    'bio' : IDL.Text,
    'socialChannelsUrls' : IDL.Vec(IDL.Text),
    'principal' : IDL.Text,
    'displayName' : IDL.Text,
    'website' : IDL.Text,
    'handle' : IDL.Text,
    'fontType' : IDL.Text,
    'avatar' : IDL.Text,
  });
  const Result_5 = IDL.Variant({
    'ok' : IDL.Vec(UserListItem),
    'err' : IDL.Text,
  });
  const NftCanisterEntry = IDL.Record({
    'handle' : IDL.Text,
    'canisterId' : IDL.Text,
  });
  const NuaBalanceResult = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const GetPrincipalByHandleReturn = IDL.Variant({
    'ok' : IDL.Opt(IDL.Text),
    'err' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const RegisterUserReturn = IDL.Variant({ 'ok' : User__1, 'err' : IDL.Text });
  const RemovePublicationReturn = IDL.Variant({
    'ok' : User__1,
    'err' : IDL.Text,
  });
  const Validate = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  return IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'addNuaBalance' : IDL.Func([IDL.Text], [], ['oneway']),
    'addPublication' : IDL.Func(
        [PublicationObject__1, IDL.Text],
        [AddPublicationReturn],
        [],
      ),
    'adminAirDrop' : IDL.Func([IDL.Float64], [Result_3], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'clearAllMyFollowers' : IDL.Func([], [IDL.Text], []),
    'collectCanisterMetrics' : IDL.Func([], [], []),
    'deleteUser' : IDL.Func([IDL.Text], [Result_2], []),
    'dumpUsers' : IDL.Func([], [IDL.Text], ['query']),
    'followAuthor' : IDL.Func([IDL.Text], [Result], []),
    'generateAccountIds' : IDL.Func([], [], []),
    'generateLowercaseHandles' : IDL.Func(
        [],
        [IDL.Text, IDL.Vec(IDL.Text)],
        [],
      ),
    'getActiveUsersByRange' : IDL.Func([Date], [IDL.Nat], ['query']),
    'getAdmins' : IDL.Func([], [Result_4], ['query']),
    'getAllHandles' : IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'getCanisterMetrics' : IDL.Func(
        [GetMetricsParameters],
        [IDL.Opt(CanisterMetrics)],
        ['query'],
      ),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getCgUsers' : IDL.Func([], [Result_4], ['query']),
    'getDailyMaxRegistration' : IDL.Func([], [IDL.Nat], ['query']),
    'getFollowersCount' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'getHandleByPrincipal' : IDL.Func(
        [IDL.Text],
        [GetHandleByPrincipalReturn],
        ['query'],
      ),
    'getHandlesByAccountIdentifiers' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [IDL.Vec(IDL.Text)],
        ['query'],
      ),
    'getHandlesByPrincipals' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [IDL.Vec(IDL.Text)],
        ['query'],
      ),
    'getMaxMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMultipleUsersByPrincipalId' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [Result_6],
        ['query'],
      ),
    'getMyFollowers' : IDL.Func([IDL.Nat32, IDL.Nat32], [Result_5], ['query']),
    'getNftCanisters' : IDL.Func([], [IDL.Vec(NftCanisterEntry)], ['query']),
    'getNuaBalance' : IDL.Func([IDL.Text], [NuaBalanceResult], ['query']),
    'getNumberOfAllRegisteredUsers' : IDL.Func([], [IDL.Nat], ['query']),
    'getPlatformOperators' : IDL.Func([], [List], ['query']),
    'getPrincipalByHandle' : IDL.Func(
        [IDL.Text],
        [GetPrincipalByHandleReturn],
        ['query'],
      ),
    'getPrincipalsByHandles' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [IDL.Vec(IDL.Text)],
        ['query'],
      ),
    'getRegistrationNumberLastDay' : IDL.Func([], [IDL.Nat], ['query']),
    'getTrustedCanisters' : IDL.Func([], [Result_4], ['query']),
    'getUser' : IDL.Func([], [Result], ['query']),
    'getUserByHandle' : IDL.Func([IDL.Text], [Result], ['query']),
    'getUserByPrincipalId' : IDL.Func([IDL.Text], [Result], ['query']),
    'getUserFollowers' : IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], []),
    'getUserInternal' : IDL.Func([IDL.Text], [IDL.Opt(User)], ['query']),
    'getUsersByHandles' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [IDL.Vec(UserListItem)],
        ['query'],
      ),
    'handleClap' : IDL.Func([IDL.Text, IDL.Text], [], ['oneway']),
    'initFollowers' : IDL.Func([IDL.Nat, IDL.Nat], [IDL.Text], []),
    'isRegistrationOpen' : IDL.Func([], [IDL.Bool], ['query']),
    'isThereEnoughMemory' : IDL.Func([], [IDL.Bool], ['query']),
    'registerAdmin' : IDL.Func([IDL.Text], [Result_1], []),
    'registerCanister' : IDL.Func([IDL.Text], [Result_1], []),
    'registerCgUser' : IDL.Func([IDL.Text], [Result_1], []),
    'registerNftCanisterId' : IDL.Func([IDL.Text], [Result_3], []),
    'registerPlatformOperator' : IDL.Func([IDL.Text], [Result_1], []),
    'registerUser' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [RegisterUserReturn],
        [],
      ),
    'removePublication' : IDL.Func(
        [PublicationObject__1, IDL.Text],
        [RemovePublicationReturn],
        [],
      ),
    'setDailyMaxRegistration' : IDL.Func([IDL.Nat], [Result_2], []),
    'setFollowersCount' : IDL.Func([], [GetHandleByPrincipalReturn], []),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_2], []),
    'spendNuaBalance' : IDL.Func([IDL.Text], [], ['oneway']),
    'testInstructionSize' : IDL.Func([], [IDL.Text], []),
    'unfollowAuthor' : IDL.Func([IDL.Text], [Result], []),
    'unregisterAdmin' : IDL.Func([IDL.Text], [Result_1], []),
    'unregisterCanister' : IDL.Func([IDL.Text], [Result_1], []),
    'unregisterCgUser' : IDL.Func([IDL.Text], [Result_1], []),
    'unregisterPlatformOperator' : IDL.Func([IDL.Text], [Result_1], []),
    'updateAvatar' : IDL.Func([IDL.Text], [Result], []),
    'updateBio' : IDL.Func([IDL.Text], [Result], []),
    'updateDisplayName' : IDL.Func([IDL.Text], [Result], []),
    'updateFontType' : IDL.Func([IDL.Text], [Result], []),
    'updateHandle' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Opt(IDL.Vec(IDL.Text))],
        [Result],
        [],
      ),
    'updateLastLogin' : IDL.Func([], [], ['oneway']),
    'updateSocialLinks' : IDL.Func([IDL.Text, IDL.Vec(IDL.Text)], [Result], []),
    'updateUserDetails' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Vec(IDL.Text)],
        [Result],
        [],
      ),
    'validate' : IDL.Func([IDL.Reserved], [Validate], []),
  });
};
export const init = ({ IDL }) => { return []; };
