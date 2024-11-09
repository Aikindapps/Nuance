import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface IndexPostModel {
  'title' : string,
  'content' : string,
  'tags' : Array<string>,
  'subtitle' : string,
  'postId' : string,
}
export type Result = { 'ok' : bigint } |
  { 'err' : string };
export interface SearchByTagsResponse {
  'postIds' : Array<string>,
  'totalCount' : string,
}
export interface _SERVICE {
  'acceptCycles' : ActorMethod<[], undefined>,
  'availableCycles' : ActorMethod<[], bigint>,
  'debug_print_everything' : ActorMethod<[], undefined>,
  'getCanisterVersion' : ActorMethod<[], string>,
  'getMaxMemorySize' : ActorMethod<[], bigint>,
  'getMemorySize' : ActorMethod<[], bigint>,
  'getRelatedPosts' : ActorMethod<[string], Array<string>>,
  'indexPost' : ActorMethod<[IndexPostModel], undefined>,
  'indexPosts' : ActorMethod<[Array<IndexPostModel>], undefined>,
  'isThereEnoughMemory' : ActorMethod<[], boolean>,
  'removePost' : ActorMethod<[string], undefined>,
  'searchByTag' : ActorMethod<[string], Array<string>>,
  'searchByTagWithinPublication' : ActorMethod<[string, string], Array<string>>,
  'searchByTags' : ActorMethod<
    [Array<string>, number, number],
    SearchByTagsResponse
  >,
  'searchPost' : ActorMethod<[string], Array<string>>,
  'searchPublicationPosts' : ActorMethod<[string, string], Array<string>>,
  'setMaxMemorySize' : ActorMethod<[bigint], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
