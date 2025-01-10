export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const Result_2 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const OperationLog = IDL.Record({
    'principal' : IDL.Text,
    'operation' : IDL.Text,
    'timestamp' : IDL.Int,
  });
  const Result_3 = IDL.Variant({
    'ok' : IDL.Vec(OperationLog),
    'err' : IDL.Text,
  });
  const Icrc28TrustedOriginsResponse = IDL.Record({
    'trusted_origins' : IDL.Vec(IDL.Text),
  });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Validate = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  return IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'getAdmins' : IDL.Func([], [Result_2], ['query']),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getMaxMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getNuanceCanisters' : IDL.Func([], [Result_2], ['query']),
    'getPlatformOperators' : IDL.Func([], [List], ['query']),
    'getPlatformOperatorsLog' : IDL.Func([], [Result_3], ['query']),
    'icrc28_trusted_origins' : IDL.Func([], [Icrc28TrustedOriginsResponse], []),
    'initNuanceCanisters' : IDL.Func([], [Result_2], []),
    'isThereEnoughMemory' : IDL.Func([], [IDL.Bool], ['query']),
    'logCommand' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'registerAdmin' : IDL.Func([IDL.Text], [Result], []),
    'registerCanister' : IDL.Func([IDL.Text], [Result], []),
    'registerPlatformOperator' : IDL.Func([IDL.Text], [Result], []),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_1], []),
    'unregisterAdmin' : IDL.Func([IDL.Text], [Result], []),
    'unregisterCanister' : IDL.Func([IDL.Text], [Result], []),
    'unregisterPlatformOperator' : IDL.Func([IDL.Text], [Result], []),
    'validate' : IDL.Func([IDL.Reserved], [Validate], []),
  });
};
export const init = ({ IDL }) => { return []; };
