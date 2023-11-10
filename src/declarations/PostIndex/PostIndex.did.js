export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const ClearIndexResult = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
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
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const IndexPostResult = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const IndexPostModel = IDL.Record({
    'oldTags' : IDL.Vec(IDL.Text),
    'newHtml' : IDL.Text,
    'oldHtml' : IDL.Text,
    'newTags' : IDL.Vec(IDL.Text),
    'postId' : IDL.Text,
  });
  const SearchResultData = IDL.Record({
    'postIds' : IDL.Vec(IDL.Text),
    'totalCount' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Validate = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  return IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'clearIndex' : IDL.Func([], [ClearIndexResult], []),
    'collectCanisterMetrics' : IDL.Func([], [], []),
    'getAdmins' : IDL.Func([], [Result_2], ['query']),
    'getCanisterMetrics' : IDL.Func(
        [GetMetricsParameters],
        [IDL.Opt(CanisterMetrics)],
        ['query'],
      ),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getCgUsers' : IDL.Func([], [Result_2], ['query']),
    'getMaxMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getPlatformOperators' : IDL.Func([], [List], ['query']),
    'getTrustedCanisters' : IDL.Func([], [Result_2], ['query']),
    'indexPost' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Vec(IDL.Text), IDL.Vec(IDL.Text)],
        [IndexPostResult],
        [],
      ),
    'indexPosts' : IDL.Func(
        [IDL.Vec(IndexPostModel)],
        [IDL.Vec(IndexPostResult)],
        [],
      ),
    'indexSize' : IDL.Func([], [IDL.Nat], ['query']),
    'isThereEnoughMemory' : IDL.Func([], [IDL.Bool], ['query']),
    'populateTags' : IDL.Func(
        [IDL.Vec(IDL.Text), IDL.Nat32, IDL.Nat32],
        [SearchResultData],
        ['query'],
      ),
    'registerAdmin' : IDL.Func([IDL.Text], [Result], []),
    'registerCanister' : IDL.Func([IDL.Text], [Result], []),
    'registerCgUser' : IDL.Func([IDL.Text], [Result], []),
    'registerPlatformOperator' : IDL.Func([IDL.Text], [Result], []),
    'search' : IDL.Func(
        [IDL.Text, IDL.Bool, IDL.Nat32, IDL.Nat32],
        [SearchResultData],
        ['query'],
      ),
    'searchWithinPublication' : IDL.Func(
        [IDL.Text, IDL.Bool, IDL.Nat32, IDL.Nat32, IDL.Vec(IDL.Text)],
        [SearchResultData],
        ['query'],
      ),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_1], []),
    'unregisterAdmin' : IDL.Func([IDL.Text], [Result], []),
    'unregisterCanister' : IDL.Func([IDL.Text], [Result], []),
    'unregisterCgUser' : IDL.Func([IDL.Text], [Result], []),
    'unregisterPlatformOperator' : IDL.Func([IDL.Text], [Result], []),
    'validate' : IDL.Func([IDL.Reserved], [Validate], []),
  });
};
export const init = ({ IDL }) => { return []; };
