import { ActorSubclass, AnonymousIdentity } from '@dfinity/agent';

import { _SERVICE as PostCoreService } from '../../../../src/declarations/PostCore/PostCore.did';
import {
  createActor as createPostCoreActor,
  idlFactory as postCoreFactory,
} from '../../../../src/declarations/PostCore';

import { _SERVICE as PostBucketService } from '../../../../src/declarations/PostBucket/PostBucket.did';
import {
  //CanisterID is dynamic
  createActor as createPostBucketActor,
  idlFactory as postBucketFactory,
} from '../../../../src/declarations/PostBucket';

import { useAuthStore } from '../store';
import { createAgent } from '@dfinity/utils';
import { Principal } from '@dfinity/principal';

export type {
  UserPostCounts,
  PostSaveModel,
  PostTag,
  PostTagModel,
  TagModel,
} from '../../../../src/declarations/PostCore/PostCore.did';

export async function getPostCoreActor(
  cai: string,
  isLocal: boolean
): Promise<ActorSubclass<PostCoreService>> {
  const state = useAuthStore.getState();
  let identity = state.identity;
  return createPostCoreActor(cai as string, {
    agentOptions: {
      identity,
      host: isLocal ? undefined : 'https://icp-api.io ',
    },
  });
}

export async function getPostBucketActor(
  postBucketCanisterId: string,
  isLocal: boolean
): Promise<ActorSubclass<PostBucketService>> {
  const state = useAuthStore.getState();
  let identity = state.identity;
  return createPostBucketActor(postBucketCanisterId as string, {
    agentOptions: {
      identity: identity || new AnonymousIdentity(),
      host: isLocal ? undefined : 'https://icp-api.io ',
    },
  });
}
