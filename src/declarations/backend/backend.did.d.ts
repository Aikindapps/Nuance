import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Icrc28TrustedOriginsResponse {
  'trusted_origins' : Array<string>,
}
export interface _SERVICE {
  'hello' : ActorMethod<[], string>,
  'hello_update' : ActorMethod<[], string>,
  'icrc28_trusted_origins' : ActorMethod<[], Icrc28TrustedOriginsResponse>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
