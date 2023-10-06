import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type CanisterCyclesAggregatedData = BigUint64Array | bigint[];
export type CanisterHeapMemoryAggregatedData = BigUint64Array | bigint[];
export type CanisterMemoryAggregatedData = BigUint64Array | bigint[];
export interface CanisterMetrics { 'data' : CanisterMetricsData }
export type CanisterMetricsData = { 'hourly' : Array<HourlyMetricsData> } |
  { 'daily' : Array<DailyMetricsData> };
export interface Content {
  'contentId' : string,
  'contentSize' : bigint,
  'mimeType' : string,
  'offset' : bigint,
  'totalChunks' : bigint,
  'chunkData' : Uint8Array | number[],
}
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
export type List = [] | [[string, List]];
export type MetricsGranularity = { 'hourly' : null } |
  { 'daily' : null };
export interface NumericEntity {
  'avg' : bigint,
  'max' : bigint,
  'min' : bigint,
  'first' : bigint,
  'last' : bigint,
}
export type Result = { 'ok' : string } |
  { 'err' : string };
export type Result_1 = { 'ok' : null } |
  { 'err' : string };
export type Result_2 = { 'ok' : Uint8Array | number[] } |
  { 'err' : string };
export type Result_3 = { 'ok' : Array<string> } |
  { 'err' : string };
export type Result_4 = { 'ok' : [Array<Principal>, Array<string>] } |
  { 'err' : string };
export interface Storage {
  'acceptCycles' : ActorMethod<[], undefined>,
  'addWasmChunk' : ActorMethod<[Uint8Array | number[]], Result_1>,
  'availableCycles' : ActorMethod<[], bigint>,
  'collectCanisterMetrics' : ActorMethod<[], undefined>,
  'getAdmins' : ActorMethod<[], Result_3>,
  'getAllDataCanisterIds' : ActorMethod<[], Result_4>,
  'getCanisterMetrics' : ActorMethod<
    [GetMetricsParameters],
    [] | [CanisterMetrics]
  >,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getCgUsers' : ActorMethod<[], Result_3>,
  'getNewContentId' : ActorMethod<[], Result>,
  'getPlatformOperators' : ActorMethod<[], List>,
  'getWasmChunks' : ActorMethod<[], Result_2>,
  'idQuick' : ActorMethod<[], Principal>,
  'registerAdmin' : ActorMethod<[string], Result_1>,
  'registerCgUser' : ActorMethod<[string], Result_1>,
  'registerPlatformOperator' : ActorMethod<[string], Result_1>,
  'resetWasmChunks' : ActorMethod<[], undefined>,
  'retiredDataCanisterIdForWriting' : ActorMethod<[string], Result_1>,
  'unregisterAdmin' : ActorMethod<[string], Result_1>,
  'unregisterCgUser' : ActorMethod<[string], Result_1>,
  'unregisterPlatformOperator' : ActorMethod<[string], Result_1>,
  'upgradeAllBuckets' : ActorMethod<[string, Uint8Array | number[]], Result_1>,
  'upgradeBucket' : ActorMethod<[string, Uint8Array | number[]], Result_1>,
  'uploadBlob' : ActorMethod<[Content], Result>,
  'validate' : ActorMethod<[any], Validate>,
}
export type UpdateCallsAggregatedData = BigUint64Array | bigint[];
export type Validate = { 'Ok' : string } |
  { 'Err' : string };
export interface _SERVICE extends Storage {}
