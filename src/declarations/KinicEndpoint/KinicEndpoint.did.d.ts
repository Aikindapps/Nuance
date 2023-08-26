import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type CanisterCyclesAggregatedData = BigUint64Array | bigint[];
export type CanisterHeapMemoryAggregatedData = BigUint64Array | bigint[];
export type CanisterMemoryAggregatedData = BigUint64Array | bigint[];
export interface CanisterMetrics { 'data' : CanisterMetricsData }
export type CanisterMetricsData = { 'hourly' : Array<HourlyMetricsData> } |
  { 'daily' : Array<DailyMetricsData> };
export interface DailyMetricsData {
  'updateCalls' : bigint,
  'canisterHeapMemorySize' : NumericEntity,
  'canisterCycles' : NumericEntity,
  'canisterMemorySize' : NumericEntity,
  'timeMillis' : bigint,
}
export interface GetMetricsParameters {
  'dateToMillis' : bigint,
  'granularity' : MetricsGranularity,
  'dateFromMillis' : bigint,
}
export interface HourlyMetricsData {
  'updateCalls' : UpdateCallsAggregatedData,
  'canisterHeapMemorySize' : CanisterHeapMemoryAggregatedData,
  'canisterCycles' : CanisterCyclesAggregatedData,
  'canisterMemorySize' : CanisterMemoryAggregatedData,
  'timeMillis' : bigint,
}
export type KinicReturn = { 'ok' : Array<string> } |
  { 'err' : string };
export type MetricsGranularity = { 'hourly' : null } |
  { 'daily' : null };
export interface NumericEntity {
  'avg' : bigint,
  'max' : bigint,
  'min' : bigint,
  'first' : bigint,
  'last' : bigint,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_2 = { 'ok' : Array<string> } |
  { 'err' : string };
export type UpdateCallsAggregatedData = BigUint64Array | bigint[];
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'availableCycles' : ActorMethod<[], bigint>,
  'collectCanisterMetrics' : ActorMethod<[], undefined>,
  'getAdmins' : ActorMethod<[], Result_2>,
  'getCanisterMetrics' : ActorMethod<
    [GetMetricsParameters],
    [] | [CanisterMetrics]
  >,
  'getCgUsers' : ActorMethod<[], Result_2>,
  'getKinicUrlList' : ActorMethod<[], KinicReturn>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getTrustedPrincipals' : ActorMethod<[], Result_2>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'registerAdmin' : ActorMethod<[string], Result>,
  'registerCgUser' : ActorMethod<[string], Result>,
  'registerPrincipal' : ActorMethod<[string], Result>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_1>,
  'unregisterAdmin' : ActorMethod<[string], Result>,
  'unregisterCgUser' : ActorMethod<[string], Result>,
  'unregisterPrincipal' : ActorMethod<[string], Result>,
}
