import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface AddCanisterModel {
  'topUpAmount' : bigint,
  'minimumThreshold' : bigint,
  'canisterId' : string,
}
export interface RegisteredCanister {
  'balance' : bigint,
  'topUpAmount' : bigint,
  'topUps' : Array<TopUp>,
  'minimumThreshold' : bigint,
  'canisterId' : string,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_2 = { 'ok' : Array<string> } |
  { 'err' : string };
export type Result_3 = { 'ok' : TopUp } |
  { 'err' : string };
export type Result_4 = { 'ok' : RegisteredCanister } |
  { 'err' : string };
export type TimeRange = { 'day' : bigint } |
  { 'hour' : bigint };
export interface TopUp {
  'time' : bigint,
  'balanceAfter' : bigint,
  'balanceBefore' : bigint,
  'amount' : bigint,
  'canisterId' : string,
}
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'addCanister' : ActorMethod<[AddCanisterModel], Result_4>,
  'availableCycles' : ActorMethod<[], bigint>,
  'checkAllRegisteredCanisters' : ActorMethod<[], Result>,
  'checkRegisteredCanister' : ActorMethod<[string], Result_3>,
  'getAdmins' : ActorMethod<[], Result_2>,
  'getAllRegisteredCanisters' : ActorMethod<[], Array<RegisteredCanister>>,
  'getAllTopUps' : ActorMethod<[], Array<TopUp>>,
  'getCgUsers' : ActorMethod<[], Result_2>,
  'getCyclesDispenserMinimumValue' : ActorMethod<[], bigint>,
  'getLatestTimerCall' : ActorMethod<[], [string, string]>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getRegisteredCanister' : ActorMethod<[string], Result_4>,
  'getStatus' : ActorMethod<[], string>,
  'getTopUp' : ActorMethod<[string], Result_3>,
  'getTopUpsByRange' : ActorMethod<[TimeRange], Array<TopUp>>,
  'getTrustedCanisters' : ActorMethod<[], Result_2>,
  'idQuick' : ActorMethod<[], Principal>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'registerAdmin' : ActorMethod<[string], Result>,
  'registerCanister' : ActorMethod<[string], Result>,
  'registerCgUser' : ActorMethod<[string], Result>,
  'removeCanister' : ActorMethod<[string], Result>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_1>,
  'unregisterAdmin' : ActorMethod<[string], Result>,
  'unregisterCanister' : ActorMethod<[string], Result>,
  'unregisterCgUser' : ActorMethod<[string], Result>,
}
