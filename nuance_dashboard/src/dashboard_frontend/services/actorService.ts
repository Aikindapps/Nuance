import { ActorSubclass, AnonymousIdentity } from '@dfinity/agent';

import { _SERVICE as PostCoreService } from '../../../../src/declarations/PostCore/PostCore.did';
import {
  createActor as createPostCoreActor,
  idlFactory as postCoreFactory,
} from '../../../../src/declarations/PostCore';

import { _SERVICE as UserService } from '../../../../src/declarations/User/User.did';
import { createActor as createUserActor } from '../../../../src/declarations/User';

import { _SERVICE as PublicationManagementService } from '../../../../Nuance-NFTs-and-Publications/src/declarations/PublicationManagement/PublicationManagement.did';
import { createActor as createPublicationManagementActor } from '../../../../Nuance-NFTs-and-Publications/src/declarations/PublicationManagement';

import { _SERVICE as CyclesDispenserService } from '../../../../src/declarations/CyclesDispenser/CyclesDispenser.did';
import { createActor as createCyclesDispenserActor } from '../../../../src/declarations/CyclesDispenser';

import { _SERVICE as PublicationService } from '../../../../Nuance-NFTs-and-Publications/src/declarations/Publisher/Publisher.did';
import { createActor as createPublicationActor } from '../../../../Nuance-NFTs-and-Publications/src/declarations/Publisher';

import { _SERVICE as PostBucketService } from '../../../../src/declarations/PostBucket/PostBucket.did';
import {
  //CanisterID is dynamic
  createActor as createPostBucketActor,
  idlFactory as postBucketFactory,
} from '../../../../src/declarations/PostBucket';

import { _SERVICE as SnsRootService } from './sns-root/sns-root.did';
import {
  //CanisterID is dynamic
  createActor as createSnsRootActor,
} from './sns-root';

import { _SERVICE as SnsGovernanceService } from './sns-governance/sns-governance.did';
import {
  //CanisterID is dynamic
  createActor as createSnsGovernanceActor,
} from './sns-governance';

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

export async function getUserActor(
  cai: string,
  isLocal: boolean
): Promise<ActorSubclass<UserService>> {
  const state = useAuthStore.getState();
  let identity = state.identity;
  return createUserActor(cai as string, {
    agentOptions: {
      identity: identity || new AnonymousIdentity(),
      host: isLocal ? undefined : 'https://icp-api.io',
    },
  });
}

export async function getPublicationManagementActor(
  cai: string,
  isLocal: boolean
): Promise<ActorSubclass<PublicationManagementService>> {
  const state = useAuthStore.getState();
  let identity = state.identity;
  return createPublicationManagementActor(cai as string, {
    agentOptions: {
      identity: identity || new AnonymousIdentity(),
      host: isLocal ? undefined : 'https://icp-api.io',
    },
  });
}

export async function getPublicationActor(
  cai: string,
  isLocal: boolean
): Promise<ActorSubclass<PublicationService>> {
  const state = useAuthStore.getState();
  let identity = state.identity;
  return createPublicationActor(cai as string, {
    agentOptions: {
      identity: identity || new AnonymousIdentity(),
      host: isLocal ? undefined : 'https://icp-api.io',
    },
  });
}

export async function getCyclesDispenserActor(
  cai: string,
  isLocal: boolean
): Promise<ActorSubclass<CyclesDispenserService>> {
  const state = useAuthStore.getState();
  let identity = state.identity;
  return createCyclesDispenserActor(cai as string, {
    agentOptions: {
      identity: identity || new AnonymousIdentity(),
      host: isLocal ? undefined : 'https://icp-api.io',
    },
  });
}

export async function getSnsRootActor(): Promise<
  ActorSubclass<SnsRootService>
> {
  return createSnsRootActor('rzbmc-yiaaa-aaaaq-aabsq-cai', {
    agentOptions: {
      identity: new AnonymousIdentity(),
      host: 'https://icp-api.io',
    },
  });
}

export async function getSnsGovernanceActor(): Promise<
  ActorSubclass<SnsGovernanceService>
> {
  return createSnsGovernanceActor('rqch6-oaaaa-aaaaq-aabta-cai', {
    agentOptions: {
      identity: new AnonymousIdentity(),
      host: 'https://icp-api.io',
    },
  });
}
