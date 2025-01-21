export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const AddCanisterModel = IDL.Record({
    'topUpAmount' : IDL.Nat,
    'minimumThreshold' : IDL.Nat,
    'isStorageBucket' : IDL.Bool,
    'canisterId' : IDL.Text,
  });
  const TopUp = IDL.Record({
    'time' : IDL.Int,
    'balanceAfter' : IDL.Nat,
    'balanceBefore' : IDL.Nat,
    'amount' : IDL.Nat,
    'canisterId' : IDL.Text,
  });
  const RegisteredCanister = IDL.Record({
    'balance' : IDL.Nat,
    'topUpAmount' : IDL.Nat,
    'topUps' : IDL.Vec(TopUp),
    'minimumThreshold' : IDL.Nat,
    'isStorageBucket' : IDL.Bool,
    'canisterId' : IDL.Text,
  });
  const Result_4 = IDL.Variant({ 'ok' : RegisteredCanister, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'ok' : TopUp, 'err' : IDL.Text });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const TimeRange = IDL.Variant({ 'day' : IDL.Nat, 'hour' : IDL.Nat });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Validate = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  return IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'addCanister' : IDL.Func([AddCanisterModel], [Result_4], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'batchRegisterAdmin' : IDL.Func([IDL.Principal], [Result_2], []),
    'batchRegisterPlatformOperator' : IDL.Func([IDL.Principal], [Result_2], []),
    'batchUnregisterAdmin' : IDL.Func([IDL.Principal], [Result_2], []),
    'batchUnregisterPlatformOperator' : IDL.Func(
        [IDL.Principal],
        [Result_2],
        [],
      ),
    'checkAllRegisteredCanisters' : IDL.Func([], [Result], []),
    'checkRegisteredCanister' : IDL.Func([IDL.Text], [Result_3], []),
    'checkStorageBucketCanisters' : IDL.Func([], [], []),
    'getAdmins' : IDL.Func([], [Result_2], ['query']),
    'getAllRegisteredCanisters' : IDL.Func(
        [],
        [IDL.Vec(RegisteredCanister)],
        ['query'],
      ),
    'getAllTopUps' : IDL.Func([], [IDL.Vec(TopUp)], ['query']),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getCgUsers' : IDL.Func([], [Result_2], ['query']),
    'getCyclesDispenserMinimumValue' : IDL.Func([], [IDL.Nat], ['query']),
    'getLatestTimerCall' : IDL.Func([], [IDL.Text, IDL.Text], ['query']),
    'getMaxMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getPlatformOperators' : IDL.Func([], [List], ['query']),
    'getRegisteredCanister' : IDL.Func([IDL.Text], [Result_4], ['query']),
    'getStatus' : IDL.Func([], [IDL.Text], ['query']),
    'getTopUp' : IDL.Func([IDL.Text], [Result_3], ['query']),
    'getTopUpsByRange' : IDL.Func([TimeRange], [IDL.Vec(TopUp)], ['query']),
    'getTrustedCanisters' : IDL.Func([], [Result_2], ['query']),
    'idQuick' : IDL.Func([], [IDL.Principal], ['query']),
    'isThereEnoughMemory' : IDL.Func([], [IDL.Bool], ['query']),
    'registerAdmin' : IDL.Func([IDL.Text], [Result], []),
    'registerCanister' : IDL.Func([IDL.Text], [Result], []),
    'registerCgUser' : IDL.Func([IDL.Text], [Result], []),
    'registerPlatformOperator' : IDL.Func([IDL.Text], [Result], []),
    'removeCanister' : IDL.Func([IDL.Text], [Result], []),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_1], []),
    'unregisterAdmin' : IDL.Func([IDL.Text], [Result], []),
    'unregisterCanister' : IDL.Func([IDL.Text], [Result], []),
    'unregisterCgUser' : IDL.Func([IDL.Text], [Result], []),
    'unregisterPlatformOperator' : IDL.Func([IDL.Text], [Result], []),
    'validate' : IDL.Func([IDL.Reserved], [Validate], []),
  });
};
export const init = ({ IDL }) => { return []; };
