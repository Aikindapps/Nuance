export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const Result_4 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const Result_3 = IDL.Variant({ 'ok' : List, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Result = IDL.Variant({
    'ok' : IDL.Tuple(IDL.Text, IDL.Text),
    'err' : IDL.Text,
  });
  return IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'createNftCanister' : IDL.Func([], [Result_4], []),
    'getAdmins' : IDL.Func([], [Result_3], ['query']),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getMaxMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getPlatformOperators' : IDL.Func([], [List], ['query']),
    'getWhitelistedPublishers' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'isThereEnoughMemory' : IDL.Func([], [IDL.Bool], ['query']),
    'registerAdmin' : IDL.Func([IDL.Text], [Result_1], []),
    'registerPlatformOperator' : IDL.Func([IDL.Text], [Result_1], []),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_2], []),
    'unregisterAdmin' : IDL.Func([IDL.Text], [Result_1], []),
    'unregisterPlatformOperator' : IDL.Func([IDL.Text], [Result_1], []),
    'whitelistPublication' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
