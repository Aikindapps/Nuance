import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_2 = { 'ok' : Array<string> } |
  { 'err' : string };
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'availableCycles' : ActorMethod<[], bigint>,
  'createEmailOptInAddress' : ActorMethod<[string], Result>,
  'dumpOptInEmailAddress' : ActorMethod<[], string>,
  'getAdmins' : ActorMethod<[], Result_2>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'registerAdmin' : ActorMethod<[string], Result>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_1>,
  'unregisterAdmin' : ActorMethod<[string], Result>,
}
