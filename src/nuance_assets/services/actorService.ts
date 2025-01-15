import { ActorSubclass, AnonymousIdentity, HttpAgent, Identity, Agent } from '@dfinity/agent';

import { _SERVICE as UserService } from '../../declarations/User/User.did';
import {
  createActor as createUserActor,
  idlFactory as userFactory,
} from '../../declarations/User';

import { _SERVICE as PostCoreService } from '../../declarations/PostCore/PostCore.did';
import {
  createActor as createPostCoreActor,
  idlFactory as postCoreFactory,
} from '../../declarations/PostCore';

import { _SERVICE as PostBucketService } from '../../declarations/PostBucket/PostBucket.did';
import {
  //CanisterID is dynamic
  createActor as createPostBucketActor,
  idlFactory as postBucketFactory,
} from '../../declarations/PostBucket';

import { _SERVICE as PostRelationsService } from '../../declarations/PostRelations/PostRelations.did';
import {
  createActor as createPostRelationsActor,
  idlFactory as postRelationsFactory,
} from '../../declarations/PostRelations';

import { _SERVICE as SubscriptionService } from '../../declarations/Subscription/Subscription.did';
import {
  createActor as createSubscriptionActor,
  idlFactory as subscriptionFactory,
} from '../../declarations/Subscription';

import { _SERVICE as PublisherService } from '../../../Nuance-NFTs-and-Publications/src/declarations/Publisher/Publisher.did';
import {
  createActor as createPublisherActor,
  idlFactory as publisherFactory,
} from '../../../Nuance-NFTs-and-Publications/src/declarations/Publisher/';

import { _SERVICE as LedgerService } from './ledger-service/Ledger.did';
import {
  createActor as createLedgerActor,
  idlFactory as ledgerFactory,
} from './ledger-service';

import { _SERVICE as ExtService } from '../../../Nuance-NFTs-and-Publications/src/declarations/ext_v2/ext_v2.did';
import {
  createActor as createExtActor,
  idlFactory as extFactory,
} from '../../../Nuance-NFTs-and-Publications/src/declarations/ext_v2';

import { _SERVICE as ICRC1Service } from './icrc1/icrc1.did';
import {
  createActor as createIcrc1Actor,
  idlFactory as icrc1Factory,
} from './icrc1';

import { _SERVICE as IcpIndexCanisterService } from './icp-index/icp-index.did';
import {
  createActor as createIcpIndexActor,
  idlFactory as icpIndexFactory,
} from './icp-index';

import { _SERVICE as Icrc1ArchiveCanisterService } from './icrc1-archive/icrc1-archive.did';
import { createActor as createIcrc1ArchiveActor } from './icrc1-archive';

import { _SERVICE as Icrc1IndexCanisterService } from './icrc1-index/icrc1-index.did';
import { createActor as createIcrc1IndexActor } from './icrc1-index';

import { _SERVICE as SonicService } from './sonic/Sonic.did';
import { createActor as createSonicActor } from './sonic';

import { _SERVICE as StorageService } from '../../declarations/Storage/Storage.did';
import { createActor as createStorageActor } from '../../declarations/Storage';

import { _SERVICE as EmailOptInService } from '../../declarations/FastBlocks_EmailOptIn/FastBlocks_EmailOptIn.did';
import {
  createActor as createEmailOptInActor,
  idlFactory as emailOptInFactory,
} from '../../declarations/FastBlocks_EmailOptIn';

import { _SERVICE as MetricsService } from '../../declarations/Metrics/Metrics.did';
import {
  createActor as createMetricsActor,
  idlFactory as metricsFactory,
} from '../../declarations/Metrics';

import { _SERVICE as NotificationsService } from '../../declarations/Notifications/Notifications.did';
import {
  createActor as createNotificationsActor,
  idlFactory as notificationsFactory,
} from '../../declarations/Notifications';

import { useAuthStore } from '../store';

import {
  FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID as prod_fastblocks_email_opt_in_canister_id,
  METRICS_CANISTER_ID as prod_metrics_canister_id,
  NOTIFICATIONS_CANISTER_ID as prod_notifications_canister_id,
  POST_CORE_CANISTER_ID as prod_post_core_canister_id,
  POST_RELATIONS_CANISTER_ID as prod_post_relations_canister_id,
  STORAGE_CANISTER_ID as prod_storage_canister_id,
  SUBSCRIPTION_CANISTER_ID as prod_subscription_canister_id,
  USER_CANISTER_ID as prod_user_canister_id,
  KINIC_ENDPOINT_CANISTER_ID as prod_kinik_endpoint_canister_id,
  CYCLES_DISPENSER_CANISTER_ID as prod_cycles_dispenser_canister_id,
  NUANCE_ASSETS_CANISTER_ID as prod_nuance_assets_canister_id,
  NFT_FACTORY_CANISTER_ID as prod_nft_factory_canister_id,
  PUBLICATION_MANAGEMENT_CANISTER_ID as prod_publication_management_canister_id,
} from './canisterIds';

const FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID =
  process.env.FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID ||
  prod_fastblocks_email_opt_in_canister_id;
const METRICS_CANISTER_ID =
  process.env.METRICS_CANISTER_ID || prod_metrics_canister_id;
const NOTIFICATIONS_CANISTER_ID =
  process.env.NOTIFICATIONS_CANISTER_ID || prod_notifications_canister_id;
const POST_CORE_CANISTER_ID =
  process.env.POST_CORE_CANISTER_ID || prod_post_core_canister_id;
const POST_RELATIONS_CANISTER_ID =
  process.env.POST_RELATIONS_CANISTER_ID || prod_post_relations_canister_id;
const STORAGE_CANISTER_ID =
  process.env.STORAGE_CANISTER_ID || prod_storage_canister_id;
const SUBSCRIPTION_CANISTER_ID =
  process.env.SUBSCRIPTION_CANISTER_ID || prod_subscription_canister_id;
const USER_CANISTER_ID = process.env.USER_CANISTER_ID || prod_user_canister_id;
const KINIC_ENDPOINT_CANISTER_ID = process.env.KINIC_ENDPOINT_CANISTER_ID || prod_kinik_endpoint_canister_id;
const CYCLES_DISPENSER_CANISTER_ID = process.env.CYCLES_DISPENSER_CANISTER_ID || prod_cycles_dispenser_canister_id;
const NUANCE_ASSETS_CANISTER_ID = process.env.NUANCE_ASSETS_CANISTER_ID || prod_nuance_assets_canister_id;
const NFT_FACTORY_CANISTER_ID = process.env.NFT_FACTORY_CANISTER_ID || prod_nft_factory_canister_id;
const PUBLICATION_MANAGEMENT_CANISTER_ID = process.env.PUBLICATION_MANAGEMENT_CANISTER_ID || prod_publication_management_canister_id;

// export types generated by dfx
export type {
  User,
  Followers,
  PublicationObject,
} from '../../declarations/User/User.did';
export type {
  Publication,
  SocialLinksObject,
} from '../../../Nuance-NFTs-and-Publications/src/declarations/Publisher/Publisher.did';

export type {
  UserPostCounts,
  PostSaveModel,
  PostTag,
  PostTagModel,
  TagModel,
} from '../../declarations/PostCore/PostCore.did';
export type { Content } from '../../declarations/Storage/Storage.did';
export type { OperationLog } from '../../declarations/Metrics/Metrics.did';

export type {
  Notification,
  NotificationContent,
  UserNotificationSettings,
} from '../../declarations/Notifications/Notifications.did';

const isLocal: boolean =
  window.location.origin.includes('localhost') ||
  window.location.origin.includes('127.0.0.1');

// anon agent
export const getAnonAgent = async () => {
  const agent = new HttpAgent({
    host: isLocal ? 'http://localhost:8080' : 'https://icp-api.io',
    identity: new AnonymousIdentity(),
  });

  if (isLocal) {
    await agent.fetchRootKey();
  }

  return agent;
};

// export actor references generated by dfx
export async function getUserActor(agentToUse?: Agent): Promise<ActorSubclass<UserService>> {
  const agent = agentToUse || useAuthStore?.getState().agent || await getAnonAgent();

  return createUserActor(USER_CANISTER_ID as string, {
    agent
  });
}

export async function getCustomUserActor(
  identity: Identity
): Promise<ActorSubclass<UserService>> {
  return createUserActor(USER_CANISTER_ID as string, {
    agentOptions: {
      identity,
      host: isLocal ? 'http://localhost:8080' : 'https://icp-api.io',
    },
  });
}

export async function getPostCoreActor(agentToUse?: Agent): Promise<
  ActorSubclass<PostCoreService>
> {
  const agent = agentToUse || useAuthStore.getState().agent || await getAnonAgent();

  return createPostCoreActor(POST_CORE_CANISTER_ID as string, {
    agent
  });
}

export async function getPostBucketActor(
  postBucketCanisterId: string,
  agentToUse?: Agent
): Promise<ActorSubclass<PostBucketService>> {
  const agent = agentToUse || useAuthStore.getState().agent || await getAnonAgent();

  return createPostBucketActor(postBucketCanisterId as string, {
    agent
  });
}

export async function getPostRelationsActor(agentToUse?: Agent): Promise<
  ActorSubclass<PostRelationsService>
> {
  const agent = agentToUse || useAuthStore.getState().agent || await getAnonAgent();

  return createPostRelationsActor(POST_RELATIONS_CANISTER_ID as string, {
    agent
  });
}

export async function getSubscriptionActor(agentToUse?: Agent): Promise<
  ActorSubclass<SubscriptionService>
> {
  const agent = agentToUse || useAuthStore.getState().agent || await getAnonAgent();

  return createSubscriptionActor(SUBSCRIPTION_CANISTER_ID as string, {
    agent
  });
}

export async function getPublisherActor(
  canisterId: string | undefined,
  agentToUse?: Agent
): Promise<ActorSubclass<PublisherService>> {
  const agent = agentToUse || useAuthStore.getState().agent || await getAnonAgent();

  if (canisterId) {
    return createPublisherActor(canisterId as string, {
      agent
    });
  } else {
    window.location.pathname = '/';
    return createPublisherActor('' as string, {
      agent
    });
  }
}

export async function getExtActor(
  canisterId: string,
  agentToUse?: Agent
): Promise<ActorSubclass<ExtService>> {
  const agent = agentToUse || useAuthStore.getState().agent || await getAnonAgent();

  return createExtActor(canisterId as string, {
    agent
  });
}

export async function getLedgerActor(): Promise<ActorSubclass<LedgerService>> {
  var identity =
    (await useAuthStore?.getState().getIdentity()) || new AnonymousIdentity();

  return createLedgerActor('ryjl3-tyaaa-aaaaa-aaaba-cai' as string, {
    agentOptions: {
      identity,
      host: isLocal ? 'http://localhost:8080' : 'https://icp-api.io',
    },
  });
}

export async function getStorageActor(agentToUse?: Agent): Promise<
  ActorSubclass<StorageService>
> {
  const agent = agentToUse || useAuthStore.getState().agent || await getAnonAgent();

  return createStorageActor(STORAGE_CANISTER_ID as string, {
    agent
  });
}

export async function getEmailOptInActor(agentToUse?: Agent): Promise<
  ActorSubclass<EmailOptInService>
> {
  const agent = agentToUse || useAuthStore.getState().agent || await getAnonAgent();

  return createEmailOptInActor(FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID as string, {
    agent
  });
}

export async function getMetricsActor(agentToUse?: Agent): Promise<
  ActorSubclass<MetricsService>
> {
  const agent = agentToUse || useAuthStore.getState().agent || await getAnonAgent();

  return createMetricsActor(METRICS_CANISTER_ID as string, {
    agent
  });
}

export async function getNotificationsActor(agentToUse?: Agent): Promise<
  ActorSubclass<NotificationsService>
> {
  const agent = agentToUse || useAuthStore.getState().agent || await getAnonAgent();

  return createNotificationsActor(NOTIFICATIONS_CANISTER_ID as string, {
    agent
  });
}

export async function getIcrc1Actor(
  canisterId: string
): Promise<ActorSubclass<ICRC1Service>> {
  var identity =
    (await useAuthStore?.getState().getIdentity()) || new AnonymousIdentity();
  return createIcrc1Actor(canisterId as string, {
    agentOptions: {
      identity,
      host: isLocal ? 'http://localhost:8080' : 'https://icp-api.io',
    },
  });
}

//always uses anonymous 
export async function getIcrc1TokenActorAnonymous(
  canisterId: string,
  mainnet?: boolean
): Promise<ActorSubclass<ICRC1Service>> {
  const agent = await getAnonAgent();
  return createIcrc1Actor(canisterId as string, {
    agent
  });
}

//always uses anonymous identity
//works only on mainnet
export async function getSonicActor(
  canisterId: string
): Promise<ActorSubclass<SonicService>> {
  var identity = new AnonymousIdentity();
  return createSonicActor(canisterId as string, {
    agentOptions: {
      identity,
      host: 'https://icp-api.io',
    },
  });
}

//always mainnet
export async function getIcpIndexCanister(): Promise<IcpIndexCanisterService> {
  var identity = new AnonymousIdentity();
  return createIcpIndexActor('qhbym-qaaaa-aaaaa-aaafq-cai' as string, {
    agentOptions: {
      identity,
      host: 'https://icp-api.io',
    },
  });
}

//always mainnet
export async function getIcrc1ArchiveCanister(
  canisterId: string
): Promise<Icrc1ArchiveCanisterService> {
  var identity = new AnonymousIdentity();
  return createIcrc1ArchiveActor(canisterId as string, {
    agentOptions: {
      identity,
      host: 'https://icp-api.io',
    },
  });
}

//always mainnet
export async function getIcrc1IndexCanister(
  canisterId: string
): Promise<Icrc1IndexCanisterService> {
  var identity = new AnonymousIdentity();
  return createIcrc1IndexActor(canisterId as string, {
    agentOptions: {
      identity,
      host: 'https://icp-api.io',
    },
  });
}

export async function getAllCanisterIds(): Promise<string[]> {
  var canisterIds = [
    POST_CORE_CANISTER_ID,
    USER_CANISTER_ID,
    POST_RELATIONS_CANISTER_ID,
    FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID,
    STORAGE_CANISTER_ID,
    SUBSCRIPTION_CANISTER_ID,
  ];
  let postActor = await getPostCoreActor();
  let [trustedCanistersPost, bucketCanisters] = await Promise.all([
    postActor.getTrustedCanisters(),
    postActor.getBucketCanisters(),
  ]);
  if ('err' in trustedCanistersPost) {
    console.log("ERR CANISTER IDS: ", canisterIds)
    return canisterIds;
  } else {
    trustedCanistersPost.ok.forEach((canisterId) => {
      if (!canisterIds.includes(canisterId)) {
        canisterIds.push(canisterId);
      }
    });
    bucketCanisters.forEach((bucketCanisterEntry) => {
      canisterIds.push(bucketCanisterEntry[0]);
    });
    console.log("CANISTER IDS: ", canisterIds)
    return canisterIds;
  }
}

export async function logCanisterIds() {
  try {
    const result = await getAllTargetCanisterIds();
    console.log("Final Canister IDs:", result);
  } catch (error) {
    console.error("Error fetching canister IDs:", error);
  }
}

logCanisterIds();

export async function getAllTargetCanisterIds(): Promise<string[]> {
  var canisterIds = [
    POST_CORE_CANISTER_ID,
    USER_CANISTER_ID,
    POST_RELATIONS_CANISTER_ID,
    FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID,
    KINIC_ENDPOINT_CANISTER_ID,
    STORAGE_CANISTER_ID,
    SUBSCRIPTION_CANISTER_ID,
    NOTIFICATIONS_CANISTER_ID,
    '3uy7l-ayaaa-aaaaf-qakhq-cai'
  ];
  let postActor = await getPostCoreActor(await getAnonAgent());
  let [trustedCanistersPost, bucketCanisters, publicationCanisters] = await Promise.all([
    postActor.getTrustedCanisters(),
    postActor.getBucketCanisters(),
    postActor.getPublicationCanisters()
  ]);
  if ('err' in trustedCanistersPost) {
    return canisterIds;
  } else {
    trustedCanistersPost.ok.forEach((canisterId) => {
      if (!canisterIds.includes(canisterId)) {
        canisterIds.push(canisterId);
      }
    });
    bucketCanisters.forEach((bucketCanisterEntry) => {
      canisterIds.push(bucketCanisterEntry[0]);
    });
    publicationCanisters.forEach(([_, canisterId]) => {
      if (!canisterIds.includes(canisterId)) {
        canisterIds.push(canisterId);
      }
    });
    return canisterIds;
  }
}

