import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Followers = [] | [[string, List]];
export type List = [] | [[string, List]];
export interface Management {
  'acceptCycles' : ActorMethod<[], undefined>,
  'addWasmChunk' : ActorMethod<[Uint8Array | number[]], Result>,
  'availableCycles' : ActorMethod<[], bigint>,
  'createPublication' : ActorMethod<[string, string, string], Result_3>,
  'getAdmins' : ActorMethod<[], Result_6>,
  'getAllPublisherIds' : ActorMethod<[], Array<string>>,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getPlatformOperators' : ActorMethod<[], List>,
  'getPublishers' : ActorMethod<[], Array<[string, string]>>,
  'getWasmChunks' : ActorMethod<[], Result_5>,
  'idQuick' : ActorMethod<[], Principal>,
  'initManagementCanister' : ActorMethod<[], RegisterUserReturn>,
  'initializeCanister' : ActorMethod<[string, string, string], Result_1>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'refreshEditorsWritersHandles' : ActorMethod<[], Result_4>,
  'registerAdmin' : ActorMethod<[string], Result>,
  'registerExistingPublisher' : ActorMethod<[string, string], Result_3>,
  'registerPlatformOperator' : ActorMethod<[string], Result>,
  'registerPublisherCanisters' : ActorMethod<[], undefined>,
  'resetWasmChunks' : ActorMethod<[], undefined>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result_2>,
  'unregisterAdmin' : ActorMethod<[string], Result>,
  'unregisterPlatformOperator' : ActorMethod<[string], Result>,
  'updateSettingsForAllBucketCanisters' : ActorMethod<[], Result_1>,
  'upgradeAllBuckets' : ActorMethod<[string, Uint8Array | number[]], Result>,
  'upgradeBucket' : ActorMethod<[string, Uint8Array | number[]], Result>,
}
export interface PublicationObject {
  'isEditor' : boolean,
  'publicationName' : string,
}
export type RegisterUserReturn = { 'ok' : User } |
  { 'err' : string };
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : string } |
  { 'err' : string };
export type Result_2 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_3 = { 'ok' : [string, string] } |
  { 'err' : string };
export type Result_4 = { 'ok' : [Array<string>, Array<string>] } |
  { 'err' : string };
export type Result_5 = { 'ok' : Uint8Array | number[] } |
  { 'err' : string };
export type Result_6 = { 'ok' : Array<string> } |
  { 'err' : string };
export interface User {
  'bio' : string,
  'followersArray' : Array<string>,
  'displayName' : string,
  'nuaTokens' : number,
  'accountCreated' : string,
  'publicationsArray' : Array<PublicationObject>,
  'handle' : string,
  'followers' : Followers,
  'avatar' : string,
}
export interface _SERVICE extends Management {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
