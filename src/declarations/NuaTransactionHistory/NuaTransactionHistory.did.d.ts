import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface HttpRequest {
  'url' : string,
  'method' : string,
  'body' : Uint8Array | number[],
  'headers' : Array<[string, string]>,
}
export interface HttpResponse {
  'body' : Uint8Array | number[],
  'headers' : Array<[string, string]>,
  'upgrade' : [] | [boolean],
  'status_code' : number,
}
export interface Icrc28TrustedOriginsResponse {
  'trusted_origins' : Array<string>,
}
export type List = [] | [[string, List]];
export interface OperationLog {
  'principal' : string,
  'operation' : string,
  'timestamp' : bigint,
}
export type Result = { 'ok' : string } |
  { 'err' : string };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_2 = { 'ok' : Array<OperationLog> } |
  { 'err' : string };
export type Result_3 = { 'ok' : Array<string> } |
  { 'err' : string };
export interface SupportedStandard { 'url' : string, 'name' : string }
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'availableCycles' : ActorMethod<[], bigint>,
  'forceStartTimer' : ActorMethod<[], Result>,
  'getAdmins' : ActorMethod<[], Result_3>,
  'getArchiveLedgerThreshold' : ActorMethod<[], bigint>,
  'getBalanceData' : ActorMethod<[], { 'ok' : string } | { 'err' : string }>,
  'getCacheStatus' : ActorMethod<
    [],
    { 'hourlyCacheSize' : bigint, 'dailyCacheSize' : bigint }
  >,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getDailyData' : ActorMethod<
    [string, bigint],
    { 'ok' : string } |
      { 'err' : string }
  >,
  'getHourlyData' : ActorMethod<
    [string, bigint],
    { 'ok' : string } |
      { 'err' : string }
  >,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getPlatformOperators' : ActorMethod<[], List>,
  'getPlatformOperatorsLog' : ActorMethod<[], Result_2>,
  'getRecentCacheStatus' : ActorMethod<
    [],
    {
      'lastUpdate' : string,
      'timerActive' : boolean,
      'lastCachedRange' : [] | [{ 'end' : bigint, 'start' : bigint }],
    }
  >,
  'getTransactionData' : ActorMethod<
    [],
    { 'ok' : string } |
      { 'err' : string }
  >,
  'getUawData' : ActorMethod<[], { 'ok' : string } | { 'err' : string }>,
  'http_request' : ActorMethod<[HttpRequest], HttpResponse>,
  'http_request_update' : ActorMethod<[HttpRequest], HttpResponse>,
  'icrc10_supported_standards' : ActorMethod<[], Array<SupportedStandard>>,
  'icrc28_trusted_origins' : ActorMethod<[], Icrc28TrustedOriginsResponse>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'processTransactionRange' : ActorMethod<[bigint, bigint], Result>,
  'refreshRecentTransactionCache' : ActorMethod<[], Result>,
  'setArchiveLedgerThreshold' : ActorMethod<[bigint], Result_1>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_1>,
  'startRecentTransactionCache' : ActorMethod<[], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
