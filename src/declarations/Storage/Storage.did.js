export const idlFactory = ({ IDL }) => {
  const Result_2 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
  const Result_3 = IDL.Variant({
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
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Content = IDL.Record({
    'contentId' : IDL.Text,
    'contentSize' : IDL.Nat,
    'mimeType' : IDL.Text,
    'offset' : IDL.Nat,
    'totalChunks' : IDL.Nat,
    'chunkData' : IDL.Vec(IDL.Nat8),
  });
  const Storage = IDL.Service({
    'collectCanisterMetrics' : IDL.Func([], [], []),
    'getAdmins' : IDL.Func([], [Result_2], []),
    'getAllDataCanisterIds' : IDL.Func([], [Result_3], []),
    'getCanisterMetrics' : IDL.Func(
        [GetMetricsParameters],
        [IDL.Opt(CanisterMetrics)],
        ['query'],
      ),
    'getCgUsers' : IDL.Func([], [Result_2], ['query']),
    'getNewContentId' : IDL.Func([], [Result], []),
    'registerAdmin' : IDL.Func([IDL.Text], [Result_1], []),
    'registerCgUser' : IDL.Func([IDL.Text], [Result_1], []),
    'retiredDataCanisterIdForWriting' : IDL.Func([IDL.Text], [Result_1], []),
    'unregisterAdmin' : IDL.Func([IDL.Text], [Result_1], []),
    'unregisterCgUser' : IDL.Func([IDL.Text], [Result_1], []),
    'uploadBlob' : IDL.Func([Content], [Result], []),
  });
  return Storage;
};
export const init = ({ IDL }) => { return []; };
