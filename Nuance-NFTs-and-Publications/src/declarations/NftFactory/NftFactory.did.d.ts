import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type List = [] | [[string, List]];
export type Result = { 'ok' : [string, string] } |
  { 'err' : string };
export type Result_1 = { 'ok' : null } |
  { 'err' : string };
export type Result_2 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_3 = { 'ok' : List } |
  { 'err' : string };
export type Result_4 = { 'ok' : string } |
  { 'err' : string };
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'availableCycles' : ActorMethod<[], bigint>,
  'createNftCanister' : ActorMethod<[], Result_4>,
  'getAdmins' : ActorMethod<[], Result_3>,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getPlatformOperators' : ActorMethod<[], List>,
  'getWhitelistedPublishers' : ActorMethod<[], Array<[string, string]>>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'registerAdmin' : ActorMethod<[string], Result_1>,
  'registerPlatformOperator' : ActorMethod<[string], Result_1>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_2>,
  'unregisterAdmin' : ActorMethod<[string], Result_1>,
  'unregisterPlatformOperator' : ActorMethod<[string], Result_1>,
  'whitelistPublication' : ActorMethod<[string, string], Result>,
}
