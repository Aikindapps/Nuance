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
  const UserClaimInfo = IDL.Record({
    'isUserBlocked' : IDL.Bool,
    'maxClaimableTokens' : IDL.Text,
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'lastClaimDate' : IDL.Opt(IDL.Text),
    'isClaimActive' : IDL.Bool,
  });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const FollowersPrincipals = IDL.Opt(IDL.Tuple(IDL.Text, List));
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
    'claimInfo' : UserClaimInfo,
    'website' : IDL.Text,
    'isVerified' : IDL.Bool,
    'handle' : IDL.Text,
    'followersPrincipals' : FollowersPrincipals,
    'followers' : Followers,
    'avatar' : IDL.Text,
  });
  const AddPublicationReturn = IDL.Variant({
    'ok' : User__1,
    'err' : IDL.Text,
  });
  const Result_10 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const User = IDL.Record({
    'bio' : IDL.Text,
    'socialChannels' : IDL.Vec(IDL.Text),
    'followersArray' : IDL.Vec(IDL.Text),
    'displayName' : IDL.Text,
    'followersCount' : IDL.Nat32,
    'nuaTokens' : IDL.Float64,
    'accountCreated' : IDL.Text,
    'publicationsArray' : IDL.Vec(PublicationObject),
    'claimInfo' : UserClaimInfo,
    'website' : IDL.Text,
    'isVerified' : IDL.Bool,
    'handle' : IDL.Text,
    'followersPrincipals' : FollowersPrincipals,
    'followers' : Followers,
    'avatar' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : User, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Date = IDL.Record({
    'day' : IDL.Nat,
    'month' : IDL.Nat,
    'hour' : IDL.Nat,
    'year' : IDL.Nat,
  });
  const Result_6 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
  const Result_11 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
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
  const UserListItem = IDL.Record({
    'bio' : IDL.Text,
    'socialChannelsUrls' : IDL.Vec(IDL.Text),
    'principal' : IDL.Text,
    'displayName' : IDL.Text,
    'followersCount' : IDL.Text,
    'website' : IDL.Text,
    'isVerified' : IDL.Bool,
    'handle' : IDL.Text,
    'fontType' : IDL.Text,
    'avatar' : IDL.Text,
  });
  const GetHandleByPrincipalReturn = IDL.Variant({
    'ok' : IDL.Opt(IDL.Text),
    'err' : IDL.Text,
  });
  const Result_9 = IDL.Variant({ 'ok' : IDL.Vec(User), 'err' : IDL.Text });
  const Result_8 = IDL.Variant({
    'ok' : IDL.Vec(UserListItem),
    'err' : IDL.Text,
  });
  const NuaBalanceResult = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const GetPrincipalByHandleReturn = IDL.Variant({
    'ok' : IDL.Opt(IDL.Text),
    'err' : IDL.Text,
  });
  const Result_7 = IDL.Variant({ 'ok' : UserListItem, 'err' : IDL.Text });
  const Result_4 = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  const SupportedStandard = IDL.Record({ 'url' : IDL.Text, 'name' : IDL.Text });
  const Icrc28TrustedOriginsResponse = IDL.Record({
    'trusted_origins' : IDL.Vec(IDL.Text),
  });
  const Result_5 = IDL.Variant({
    'ok' : IDL.Tuple(IDL.Nat, IDL.Nat),
    'err' : IDL.Text,
  });
  const RegisterUserReturn = IDL.Variant({ 'ok' : User__1, 'err' : IDL.Text });
  const RemovePublicationReturn = IDL.Variant({
    'ok' : User__1,
    'err' : IDL.Text,
  });
  const SubscriptionTimeInterval = IDL.Variant({
    'LifeTime' : IDL.Null,
    'Weekly' : IDL.Null,
    'Monthly' : IDL.Null,
    'Annually' : IDL.Null,
  });
  const SubscriptionEvent = IDL.Record({
    'startTime' : IDL.Int,
    'subscriptionEventId' : IDL.Text,
    'endTime' : IDL.Int,
    'subscriptionTimeInterval' : SubscriptionTimeInterval,
    'writerPrincipalId' : IDL.Text,
    'paymentFee' : IDL.Text,
    'isWriterSubscriptionActive' : IDL.Bool,
    'readerPrincipalId' : IDL.Text,
  });
  const WriterSubscriptionDetails = IDL.Record({
    'writerSubscriptions' : IDL.Vec(SubscriptionEvent),
    'weeklyFee' : IDL.Opt(IDL.Text),
    'paymentReceiverPrincipalId' : IDL.Text,
    'writerPrincipalId' : IDL.Text,
    'lifeTimeFee' : IDL.Opt(IDL.Text),
    'isSubscriptionActive' : IDL.Bool,
    'annuallyFee' : IDL.Opt(IDL.Text),
    'monthlyFee' : IDL.Opt(IDL.Text),
  });
  const ReaderSubscriptionDetails = IDL.Record({
    'readerSubscriptions' : IDL.Vec(SubscriptionEvent),
    'readerNotStoppedSubscriptionsWriters' : IDL.Vec(WriterSubscriptionDetails),
    'readerPrincipalId' : IDL.Text,
  });
  const Result_2 = IDL.Variant({
    'ok' : ReaderSubscriptionDetails,
    'err' : IDL.Text,
  });
  const Validate = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const UniquePersonProofProvider = IDL.Variant({ 'DecideAI' : IDL.Null });
  const UniquePersonProof = IDL.Record({
    'provider' : UniquePersonProofProvider,
    'timestamp' : IDL.Nat64,
  });
  const VerifyResult = IDL.Variant({
    'Ok' : UniquePersonProof,
    'Err' : IDL.Text,
  });
  return IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'addNuaBalance' : IDL.Func([IDL.Text], [], ['oneway']),
    'addPublication' : IDL.Func(
        [PublicationObject__1, IDL.Text],
        [AddPublicationReturn],
        [],
      ),
    'adminAirDrop' : IDL.Func([IDL.Float64], [Result_10], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'blockUserFromClaiming' : IDL.Func([IDL.Text], [Result_1], []),
    'checkMyClaimNotification' : IDL.Func([], [], []),
    'claimRestrictedTokens' : IDL.Func([], [Result], []),
    'clearAllMyFollowers' : IDL.Func([], [IDL.Text], []),
    'collectCanisterMetrics' : IDL.Func([], [], []),
    'deleteConfirmedLinkings' : IDL.Func([], [Result_1], []),
    'deleteUser' : IDL.Func([IDL.Text], [Result_3], []),
    'dumpUsers' : IDL.Func([], [IDL.Text], ['query']),
    'followAuthor' : IDL.Func([IDL.Text], [Result], []),
    'generateAccountIds' : IDL.Func([], [], []),
    'generateLowercaseHandles' : IDL.Func(
        [],
        [IDL.Text, IDL.Vec(IDL.Text)],
        [],
      ),
    'getActiveUsersByRange' : IDL.Func([Date], [IDL.Nat], ['query']),
    'getAdmins' : IDL.Func([], [Result_6], ['query']),
    'getAllClaimSubaccountIndexes' : IDL.Func([], [Result_11], ['query']),
    'getAllHandles' : IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'getAllUserPrincipals' : IDL.Func([], [Result_6], ['query']),
    'getCanisterMetrics' : IDL.Func(
        [GetMetricsParameters],
        [IDL.Opt(CanisterMetrics)],
        ['query'],
      ),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getCgUsers' : IDL.Func([], [Result_6], ['query']),
    'getDailyMaxRegistration' : IDL.Func([], [IDL.Nat], ['query']),
    'getFollowersByPrincipalId' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(UserListItem)],
        ['query'],
      ),
    'getFollowersCount' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'getFollowersPrincipalIdsByPrincipalId' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(IDL.Text)],
        ['query'],
      ),
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
    'getLinkedPrincipal' : IDL.Func([IDL.Text], [Result_10], ['query']),
    'getMaxMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMultipleUsersByPrincipalId' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [Result_9],
        ['query'],
      ),
    'getMyFollowers' : IDL.Func([], [Result_8], ['query']),
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
    'getTotalNumberOfClaimedTokens' : IDL.Func([], [IDL.Nat], ['query']),
    'getTrustedCanisters' : IDL.Func([], [Result_6], ['query']),
    'getUser' : IDL.Func([], [Result], ['query']),
    'getUserByHandle' : IDL.Func([IDL.Text], [Result], ['query']),
    'getUserByPrincipalId' : IDL.Func([IDL.Text], [Result], ['query']),
    'getUserFollowers' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(UserListItem)],
        ['query'],
      ),
    'getUserInternal' : IDL.Func([IDL.Text], [IDL.Opt(User)], ['query']),
    'getUserListItemByHandle' : IDL.Func([IDL.Text], [Result_7], ['query']),
    'getUsersBlockedFromClaiming' : IDL.Func([], [Result_6], ['query']),
    'getUsersByHandles' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [IDL.Vec(UserListItem)],
        ['query'],
      ),
    'getUsersByPrincipals' : IDL.Func(
        [IDL.Vec(IDL.Text)],
        [IDL.Vec(UserListItem)],
        ['query'],
      ),
    'getVerificationStatus' : IDL.Func([IDL.Text], [Result_4], ['query']),
    'handleClap' : IDL.Func([IDL.Text, IDL.Text], [], ['oneway']),
    'icrc10_supported_standards' : IDL.Func(
        [],
        [IDL.Vec(SupportedStandard)],
        ['query'],
      ),
    'icrc28_trusted_origins' : IDL.Func([], [Icrc28TrustedOriginsResponse], []),
    'isRegistrationOpen' : IDL.Func([], [IDL.Bool], ['query']),
    'isThereEnoughMemory' : IDL.Func([], [IDL.Bool], ['query']),
    'linkInternetIdentityConfirm' : IDL.Func([IDL.Text], [Result_1], []),
    'linkInternetIdentityRequest' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_1],
        [],
      ),
    'migrateFollowersHashmapsFromHandlesToPrincipalIds' : IDL.Func(
        [],
        [Result_5],
        [],
      ),
    'registerAdmin' : IDL.Func([IDL.Text], [Result_1], []),
    'registerCanister' : IDL.Func([IDL.Text], [Result_1], []),
    'registerCgUser' : IDL.Func([IDL.Text], [Result_1], []),
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
    'setDailyMaxRegistration' : IDL.Func([IDL.Nat], [Result_3], []),
    'setIsClaimActive' : IDL.Func([IDL.Bool], [Result_4], []),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_3], []),
    'setMaxNumberOfClaimableTokens' : IDL.Func([IDL.Nat], [Result_3], []),
    'spendNuaBalance' : IDL.Func([IDL.Text], [], ['oneway']),
    'spendRestrictedTokensForSubscription' : IDL.Func(
        [IDL.Text, IDL.Nat],
        [Result_2],
        [],
      ),
    'spendRestrictedTokensForTipping' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat],
        [Result_1],
        [],
      ),
    'testInstructionSize' : IDL.Func([], [IDL.Text], []),
    'unblockUserFromClaiming' : IDL.Func([IDL.Text], [Result_1], []),
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
    'verifyPoh' : IDL.Func([IDL.Text], [VerifyResult], []),
  });
};
export const init = ({ IDL }) => { return []; };
