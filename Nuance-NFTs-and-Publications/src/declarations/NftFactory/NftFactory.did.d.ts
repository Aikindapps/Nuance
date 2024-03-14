import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface InitNftCanisterData {
  'thumbnail' : string,
  'initialMintingAddresses' : Array<string>,
  'metadata' : Metadata,
  'writerPrincipal' : Principal,
  'admins' : Array<Principal>,
  'icpPrice' : bigint,
  'royalty' : Array<[string, bigint]>,
  'maxSupply' : bigint,
  'marketplaceOpen' : Time,
  'collectionName' : string,
  'postId' : string,
}
export type List = [] | [[string, List]];
export type Metadata = {
    'fungible' : {
      'decimals' : number,
      'metadata' : [] | [MetadataContainer],
      'name' : string,
      'symbol' : string,
    }
  } |
  {
    'nonfungible' : {
      'thumbnail' : string,
      'asset' : string,
      'metadata' : [] | [MetadataContainer],
      'name' : string,
    }
  };
export type MetadataContainer = { 'blob' : Uint8Array | number[] } |
  { 'data' : Array<MetadataValue> } |
  { 'json' : string };
export type MetadataValue = [
  string,
  { 'nat' : bigint } |
    { 'blob' : Uint8Array | number[] } |
    { 'nat8' : number } |
    { 'text' : string },
];
export type Result = { 'ok' : List } |
  { 'err' : string };
export type Result_1 = { 'ok' : string } |
  { 'err' : string };
export type Time = bigint;
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'availableCycles' : ActorMethod<[], bigint>,
  'createNftCanister' : ActorMethod<[InitNftCanisterData], Result_1>,
  'getAdmins' : ActorMethod<[], Result>,
  'getAllNftCanisterIds' : ActorMethod<[], Array<[string, string]>>,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getPlatformOperators' : ActorMethod<[], List>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
