export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({
    'ok' : IDL.Tuple(IDL.Text, IDL.Text),
    'err' : IDL.Text,
  });
  const Result_5 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const Result_4 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Nat8), 'err' : IDL.Text });
  const PublicationObject = IDL.Record({
    'isEditor' : IDL.Bool,
    'publicationName' : IDL.Text,
  });
  const Followers = IDL.Opt(IDL.Tuple(IDL.Text, List));
  const User = IDL.Record({
    'bio' : IDL.Text,
    'followersArray' : IDL.Vec(IDL.Text),
    'displayName' : IDL.Text,
    'nuaTokens' : IDL.Float64,
    'accountCreated' : IDL.Text,
    'publicationsArray' : IDL.Vec(PublicationObject),
    'handle' : IDL.Text,
    'followers' : Followers,
    'avatar' : IDL.Text,
  });
  const RegisterUserReturn = IDL.Variant({ 'ok' : User, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Management = IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'addWasmChunk' : IDL.Func([IDL.Vec(IDL.Nat8)], [Result], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'createPublication' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [Result_3],
        [],
      ),
    'getAdmins' : IDL.Func([], [Result_5], ['query']),
    'getAllPublisherIds' : IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getMaxMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getPlatformOperators' : IDL.Func([], [List], ['query']),
    'getPublishers' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getWasmChunks' : IDL.Func([], [Result_4], []),
    'idQuick' : IDL.Func([], [IDL.Principal], ['query']),
    'initManagementCanister' : IDL.Func([], [RegisterUserReturn], []),
    'initializeCanister' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [Result_1],
        [],
      ),
    'isThereEnoughMemory' : IDL.Func([], [IDL.Bool], ['query']),
    'registerAdmin' : IDL.Func([IDL.Text], [Result], []),
    'registerExistingPublisher' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_3],
        [],
      ),
    'registerPlatformOperator' : IDL.Func([IDL.Text], [Result], []),
    'registerPublisherCanisters' : IDL.Func([], [], []),
    'resetWasmChunks' : IDL.Func([], [], ['oneway']),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_2], []),
    'unregisterAdmin' : IDL.Func([IDL.Text], [Result], []),
    'unregisterPlatformOperator' : IDL.Func([IDL.Text], [Result], []),
    'updateSettingsForAllBucketCanisters' : IDL.Func([], [Result_1], []),
    'upgradeAllBuckets' : IDL.Func([IDL.Text, IDL.Vec(IDL.Nat8)], [Result], []),
    'upgradeBucket' : IDL.Func([IDL.Text, IDL.Vec(IDL.Nat8)], [Result], []),
  });
  return Management;
};
export const init = ({ IDL }) => { return []; };
