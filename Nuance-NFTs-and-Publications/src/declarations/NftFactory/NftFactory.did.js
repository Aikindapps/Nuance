export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
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
  const Time = IDL.Int;
  const InitNftCanisterData = IDL.Record({
    'thumbnail' : IDL.Text,
    'initialMintingAddresses' : IDL.Vec(IDL.Text),
    'metadata' : Metadata,
    'writerPrincipal' : IDL.Principal,
    'admins' : IDL.Vec(IDL.Principal),
    'icpPrice' : IDL.Nat,
    'royalty' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat64)),
    'maxSupply' : IDL.Nat,
    'marketplaceOpen' : Time,
    'collectionName' : IDL.Text,
    'postId' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const Result = IDL.Variant({ 'ok' : List, 'err' : IDL.Text });
  return IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'createNftCanister' : IDL.Func([InitNftCanisterData], [Result_1], []),
    'getAdmins' : IDL.Func([], [Result], ['query']),
    'getAllNftCanisterIds' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getPlatformOperators' : IDL.Func([], [List], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
