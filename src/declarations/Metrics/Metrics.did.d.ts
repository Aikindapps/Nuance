import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Icrc28TrustedOriginsResponse {
  'trusted_origins' : Array<string>,
}
export type List = [] | [[string, List]];
export interface OperationLog {
  'principal' : string,
  'operation' : string,
  'timestamp' : bigint,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_2 = { 'ok' : Array<string> } |
  { 'err' : string };
export type Result_3 = { 'ok' : Array<OperationLog> } |
  { 'err' : string };
export interface SupportedStandard { 'url' : string, 'name' : string }
export type Validate = { 'Ok' : string } |
  { 'Err' : string };
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'availableCycles' : ActorMethod<[], bigint>,
  'getAdmins' : ActorMethod<[], Result_2>,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getNuanceCanisters' : ActorMethod<[], Result_2>,
  'getPlatformOperators' : ActorMethod<[], List>,
  'getPlatformOperatorsLog' : ActorMethod<[], Result_3>,
  'icrc10_supported_standards' : ActorMethod<[], Array<SupportedStandard>>,
  'icrc28_trusted_origins' : ActorMethod<[], Icrc28TrustedOriginsResponse>,
  'initNuanceCanisters' : ActorMethod<[], Result_2>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'logCommand' : ActorMethod<[string, string], Result>,
  'registerAdmin' : ActorMethod<[string], Result>,
  'registerCanister' : ActorMethod<[string], Result>,
  'registerPlatformOperator' : ActorMethod<[string], Result>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_1>,
  'unregisterAdmin' : ActorMethod<[string], Result>,
  'unregisterCanister' : ActorMethod<[string], Result>,
  'unregisterPlatformOperator' : ActorMethod<[string], Result>,
  'validate' : ActorMethod<[any], Validate>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
