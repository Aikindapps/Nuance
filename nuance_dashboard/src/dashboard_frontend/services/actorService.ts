

import { ActorSubclass, AnonymousIdentity } from '@dfinity/agent';

import { _SERVICE as PostCoreService } from '../../declarations/PostCore/PostCore.did';
import {
  canisterId as postCoreCanisterId,
  createActor as createPostCoreActor,
  idlFactory as postCoreFactory,
} from '../../declarations/PostCore';

import { _SERVICE as PostBucketService } from '../../declarations/PostBucket/PostBucket.did';
import {
  //CanisterID is dynamic
  createActor as createPostBucketActor,
  idlFactory as postBucketFactory,
} from '../../declarations/PostBucket';




import { useAuthStore } from '../store';
import { createAgent } from '@dfinity/utils';
import { Principal } from '@dfinity/principal';


export type {
  UserPostCounts,
  PostSaveModel,
  PostTag,
  PostTagModel,
  TagModel,
} from '../../declarations/PostCore/PostCore.did';


const isLocal: boolean =
  window.location.origin.includes('localhost') ||
  window.location.origin.includes('127.0.0.1');




export async function getPostCoreActor(): Promise<
  ActorSubclass<PostCoreService>
> {
  let loginMethod = useAuthStore.getState().loginMethod;
  if (loginMethod === 'bitfinity') {
    let window_any = window as any;
    return await window_any.ic.bitfinityWallet.createActor({
      canisterId: postCoreCanisterId,
      interfaceFactory: postCoreFactory,
      host: isLocal ? 'http://localhost:8081' : undefined,
    });
  }
  const state = useAuthStore.getState();
  let identity = state.identity;
    
  return createPostCoreActor(postCoreCanisterId as string, {
    agentOptions: {
      identity: identity || new AnonymousIdentity(),
      host: isLocal ? undefined : 'https://icp-api.io ',
    },
  });
}

export async function getPostBucketActor(
  
  postBucketCanisterId: string
): Promise<ActorSubclass<PostBucketService>> {

  const state = useAuthStore.getState();
  let identity = state.identity;
  
  let loginMethod = useAuthStore.getState().loginMethod;
  if (loginMethod === 'bitfinity') {
    let window_any = window as any;
    return await window_any.ic.bitfinityWallet.createActor({
      canisterId: postBucketCanisterId,
      interfaceFactory: postBucketFactory,
      host: isLocal ? 'http://localhost:8081' : undefined,
    });
  }
    console.log("identity -- actor service --", identity)
  return createPostBucketActor(postBucketCanisterId as string, {
    agentOptions: {
      identity: identity || new AnonymousIdentity(),
      host: isLocal ? undefined : 'https://icp-api.io ',
    },
  });
}

