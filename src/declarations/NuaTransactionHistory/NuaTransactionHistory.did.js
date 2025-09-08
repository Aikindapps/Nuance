export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const OperationLog = IDL.Record({
    'principal' : IDL.Text,
    'operation' : IDL.Text,
    'timestamp' : IDL.Int,
  });
  const Result_2 = IDL.Variant({
    'ok' : IDL.Vec(OperationLog),
    'err' : IDL.Text,
  });
  const HttpRequest = IDL.Record({
    'url' : IDL.Text,
    'method' : IDL.Text,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
  });
  const HttpResponse = IDL.Record({
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
    'upgrade' : IDL.Opt(IDL.Bool),
    'status_code' : IDL.Nat16,
  });
  const SupportedStandard = IDL.Record({ 'url' : IDL.Text, 'name' : IDL.Text });
  const Icrc28TrustedOriginsResponse = IDL.Record({
    'trusted_origins' : IDL.Vec(IDL.Text),
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  return IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'forceStartTimer' : IDL.Func([], [Result], []),
    'getAdmins' : IDL.Func([], [Result_3], ['query']),
    'getArchiveLedgerThreshold' : IDL.Func([], [IDL.Nat], ['query']),
    'getBalanceData' : IDL.Func(
        [],
        [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })],
        [],
      ),
    'getCacheStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'hourlyCacheSize' : IDL.Nat,
            'dailyCacheSize' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getDailyData' : IDL.Func(
        [IDL.Text, IDL.Nat],
        [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })],
        [],
      ),
    'getHourlyData' : IDL.Func(
        [IDL.Text, IDL.Nat],
        [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })],
        [],
      ),
    'getMaxMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getPlatformOperators' : IDL.Func([], [List], ['query']),
    'getPlatformOperatorsLog' : IDL.Func([], [Result_2], ['query']),
    'getRecentCacheStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'lastUpdate' : IDL.Text,
            'timerActive' : IDL.Bool,
            'lastCachedRange' : IDL.Opt(
              IDL.Record({ 'end' : IDL.Nat, 'start' : IDL.Nat })
            ),
          }),
        ],
        ['query'],
      ),
    'getTransactionData' : IDL.Func(
        [],
        [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })],
        [],
      ),
    'getUawData' : IDL.Func(
        [],
        [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })],
        [],
      ),
    'http_request' : IDL.Func([HttpRequest], [HttpResponse], ['query']),
    'http_request_update' : IDL.Func([HttpRequest], [HttpResponse], []),
    'icrc10_supported_standards' : IDL.Func(
        [],
        [IDL.Vec(SupportedStandard)],
        ['query'],
      ),
    'icrc28_trusted_origins' : IDL.Func([], [Icrc28TrustedOriginsResponse], []),
    'isThereEnoughMemory' : IDL.Func([], [IDL.Bool], ['query']),
    'processTransactionRange' : IDL.Func([IDL.Nat, IDL.Nat], [Result], []),
    'refreshRecentTransactionCache' : IDL.Func([], [Result], []),
    'setArchiveLedgerThreshold' : IDL.Func([IDL.Nat], [Result_1], []),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_1], []),
    'startRecentTransactionCache' : IDL.Func([], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
