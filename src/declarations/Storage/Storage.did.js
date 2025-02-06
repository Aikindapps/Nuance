export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
  const Result_4 = IDL.Variant({
    'ok' : IDL.Tuple(IDL.Vec(IDL.Principal), IDL.Vec(IDL.Text)),
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
  const Result = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const Result_2 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Nat8), 'err' : IDL.Text });
  const SupportedStandard = IDL.Record({ 'url' : IDL.Text, 'name' : IDL.Text });
  const Icrc28TrustedOriginsResponse = IDL.Record({
    'trusted_origins' : IDL.Vec(IDL.Text),
  });
  const Content = IDL.Record({
    'contentId' : IDL.Text,
    'contentSize' : IDL.Nat,
    'mimeType' : IDL.Text,
    'offset' : IDL.Nat,
    'totalChunks' : IDL.Nat,
    'chunkData' : IDL.Vec(IDL.Nat8),
  });
  const Validate = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const Storage = IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'addStorageBucket' : IDL.Func([IDL.Text], [Result_1], []),
    'addWasmChunk' : IDL.Func([IDL.Vec(IDL.Nat8)], [Result_1], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'collectCanisterMetrics' : IDL.Func([], [], []),
    'getAdmins' : IDL.Func([], [Result_3], ['query']),
    'getAllDataCanisterIds' : IDL.Func([], [Result_4], []),
    'getCanisterMetrics' : IDL.Func(
        [GetMetricsParameters],
        [IDL.Opt(CanisterMetrics)],
        ['query'],
      ),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getCgUsers' : IDL.Func([], [Result_3], ['query']),
    'getNewContentId' : IDL.Func([], [Result], []),
    'getPlatformOperators' : IDL.Func([], [List], ['query']),
    'getWasmChunks' : IDL.Func([], [Result_2], []),
    'icrc10_supported_standards' : IDL.Func(
        [],
        [IDL.Vec(SupportedStandard)],
        ['query'],
      ),
    'icrc28_trusted_origins' : IDL.Func([], [Icrc28TrustedOriginsResponse], []),
    'idQuick' : IDL.Func([], [IDL.Principal], ['query']),
    'registerAdmin' : IDL.Func([IDL.Text], [Result_1], []),
    'registerCgUser' : IDL.Func([IDL.Text], [Result_1], []),
    'registerPlatformOperator' : IDL.Func([IDL.Text], [Result_1], []),
    'resetWasmChunks' : IDL.Func([], [], ['oneway']),
    'retiredDataCanisterIdForWriting' : IDL.Func([IDL.Text], [Result_1], []),
    'unregisterAdmin' : IDL.Func([IDL.Text], [Result_1], []),
    'unregisterCgUser' : IDL.Func([IDL.Text], [Result_1], []),
    'unregisterPlatformOperator' : IDL.Func([IDL.Text], [Result_1], []),
    'upgradeAllBuckets' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Nat8)],
        [Result_1],
        [],
      ),
    'upgradeBucket' : IDL.Func([IDL.Text, IDL.Vec(IDL.Nat8)], [Result_1], []),
    'uploadBlob' : IDL.Func([Content], [Result], []),
    'validate' : IDL.Func([IDL.Reserved], [Validate], []),
  });
  return Storage;
};
export const init = ({ IDL }) => { return []; };
