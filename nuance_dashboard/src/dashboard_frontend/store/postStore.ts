import create, { GetState, SetState, StateCreator, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  toast,
  toastError,
  toastSuccess,
  ToastType,
} from '../services/toastService';
// import { ErrorType, getErrorType } from '../../../../src/nuance_assets/services/errorService';
// import { useAuthStore } from './authStore';
import {
  getCyclesDispenserActor,
  getPostBucketActor,
  getPostCoreActor,
  getPublicationActor,
  getPublicationManagementActor,
  getSnsGovernanceActor,
  getSnsRootActor,
  getUserActor,
} from '../services/actorService';
// import { Principal } from '@dfinity/principal';
// import { PostKeyProperties } from '../../../../src/declarations/PostCore/PostCore.did';
import {
  Applaud,
  Comment,
  PostBucketType,
  SaveCommentModel,
} from '../../../../src/declarations/PostBucket/PostBucket.did';
import { useAuthStore } from './authStore';
import {
  CommentType,
  MetricsValue,
  PostType,
  ProposalSummaryValue,
} from '../shared/types';
import { RegisteredCanister } from '../../../../src/declarations/CyclesDispenser/CyclesDispenser.did';
import { GetSnsCanistersSummaryResponse } from '../services/sns-root/sns-root.did';
import { PostKeyProperties } from '../../../../src/declarations/PostCore/PostCore.did';

global.fetch = fetch;

const Err = 'err';

function areUint8ArraysEqual(
  arr1: Uint8Array | number[] | undefined,
  arr2: Uint8Array | number[] | undefined
): boolean {
  if (!arr1 || !arr2) {
    return false;
  }
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
}

const isKnownNeuron = (
  knownNeurons: (Uint8Array | number[] | undefined)[],
  neuron: Uint8Array | number[] | undefined
) => {
  return (
    knownNeurons.filter((known_neuron) => {
      return areUint8ArraysEqual(known_neuron, neuron);
    }).length !== 0
  );
};

const fetchPostsByBuckets = async (
  coreReturns: PostKeyProperties[],
  isLocal: boolean
) => {
  let bucketsMap = new Map<string, PostKeyProperties[]>();
  let postIdToKeyPropertiesMap = new Map<string, PostKeyProperties>();
  let filteredCoreReturns = coreReturns.filter(
    (c) => c.bucketCanisterId !== ''
  );
  filteredCoreReturns.forEach((keyProperties) => {
    let existing = bucketsMap.get(keyProperties.bucketCanisterId);
    if (existing) {
      bucketsMap.set(keyProperties.bucketCanisterId, [
        ...existing,
        keyProperties,
      ]);
    } else {
      bucketsMap.set(keyProperties.bucketCanisterId, [keyProperties]);
    }
    postIdToKeyPropertiesMap.set(keyProperties.postId, keyProperties);
  });

  let promises: Promise<PostBucketType[]>[] = [];

  for (let bucketCanisterId of bucketsMap.keys()) {
    let keyProperties = bucketsMap.get(bucketCanisterId);
    if (keyProperties) {
      let bucketActor = await getPostBucketActor(bucketCanisterId, isLocal);
      promises.push(
        bucketActor.getPostsByPostIds(
          keyProperties.map((keyProperty) => {
            return keyProperty.postId;
          }),
          false
        )
      );
    }
  }

  let resultsArray = (await Promise.all(promises)).flat(1);
  return resultsArray.map((bucketType) => {
    let keyProperties = postIdToKeyPropertiesMap.get(bucketType.postId);
    if (keyProperties) {
      return { ...keyProperties, ...bucketType } as PostType;
    } else {
      //should never happen
      return { ...bucketType, views: '0', tags: [], claps: '0' } as PostType;
    }
  });
};

export interface PostStore {
  comments: Comment[];
  isLocal: boolean;
  postCoreCanisterId: string;
  frontendCanisterId: string;
  userCanisterId: string;
  publicationManagementCanisterId: string;
  cyclesDispenserCanisterId: string;
  postBucketCanisterIds: string[];
  metricsCanisterId: string;
  deleteComment: (commentId: string, bucketCanisterId: string) => Promise<void>;
  reviewComment: (
    commentId: string,
    bucketCanisterId: string,
    isViolatingRules: boolean
  ) => Promise<void>;
  setupEnvironment: (
    isLocal: boolean,
    postCoreCanisterId: string,
    metricsCanisterId: string,
    userCanisterId: string,
    publicationManagementCanisterId: string,
    cyclesDispenserCanisterId: string,
    userPrincipalId: string
  ) => Promise<void>;
  updateUserHandle: (oldHandle: string, newHandle: string) => Promise<boolean>;
  updatePublicationHandle: (
    oldHandle: string,
    newHandle: string
  ) => Promise<boolean>;
  createPublication: (
    handle: string,
    name: string,
    firstEditorHandle: string
  ) => Promise<boolean>;
  getAllReportedComments: () => Promise<CommentType[]>;
  getMetrics: () => Promise<MetricsValue[]>;
  getDappCanisters: () => Promise<[RegisteredCanister[], string]>;
  getSnsCanisters: () => Promise<GetSnsCanistersSummaryResponse | undefined>;
  getProposals: () => Promise<ProposalSummaryValue[] | undefined>;
  getRejectedPostsLastWeek: () => Promise<PostType[]>;
  getPost: (
    bucketCanisterId: string,
    postId: string
  ) => Promise<PostBucketType | undefined>;
  getHistoricalData: () => Promise<{
    posts: [string, bigint][];
    applauds: Applaud[];
  }>;
  clearAll: () => void;
}

const createPostStore: StateCreator<PostStore> = (set, get) => ({
  comments: [],
  postBucketCanisterIds: [],
  postCoreCanisterId: '4vm7k-tyaaa-aaaah-aq4wq-cai',
  userCanisterId: 'wlam3-raaaa-aaaap-qpmaa-cai',
  publicationManagementCanisterId: 'kq23y-aiaaa-aaaaf-qajmq-cai',
  cyclesDispenserCanisterId: 'y6ydp-7aaaa-aaaaj-azwyq-cai',
  metricsCanisterId: '4vm7k-tyaaa-aaaah-aq4wq-cai',
  frontendCanisterId: 't6unq-pqaaa-aaaai-q3nqa-cai',
  isLocal: false,

  deleteComment: async (
    commentId: string,
    bucketCanisterId: string
  ): Promise<void> => {
    try {
      const actor = await getPostBucketActor(bucketCanisterId, get().isLocal);
      const result = await actor.deleteComment(commentId);
      if ('err' in result) {
        toastError(result.err);
      } else {
        // Update comments state if necessary
        // set({ comments: updatedComments });
      }
    } catch (err) {
      toastError('Error deleting comment');
      console.error(err);
    }
  },

  reviewComment: async (
    commentId: string,
    bucketCanisterId: string,
    isViolatingRules: boolean
  ): Promise<void> => {
    try {
      const actor = await getPostBucketActor(bucketCanisterId, get().isLocal);
      const result = await actor.reviewComment(commentId, isViolatingRules);
      if ('err' in result) {
        toastError(result.err);
      } else {
        toast('Comment reviewed!', ToastType.Success);
      }
    } catch (err) {
      toastError('Error reviewing comment' + err);
      console.error(err);
    }
  },

  getAllReportedComments: async (): Promise<CommentType[]> => {
    let bucketCanisterIds = get().postBucketCanisterIds;
    console.log('buckets: ', bucketCanisterIds);
    let promises = [];
    for (const bucketCanisterId of bucketCanisterIds) {
      let bucketActor = await getPostBucketActor(
        bucketCanisterId,
        get().isLocal
      );
      promises.push(bucketActor.getReportedComments());
    }
    try {
      let responses = await Promise.all(promises);
      console.log('responses: ', responses);
      let comments: Comment[] = [];
      for (const response of responses) {
        if (!(Err in response)) {
          comments = [...comments, ...response.ok];
        }
      }
      let postIds = comments.map((c) => c.postId);
      let postCoreActor = await getPostCoreActor(
        get().postCoreCanisterId,
        get().isLocal
      );
      let keyProperties = await postCoreActor.getPostsByPostIds(postIds);

      let result = comments.map((comment) => {
        let filtered = keyProperties.filter((postKeyProperty) => {
          return postKeyProperty.postId === comment.postId;
        });
        if (filtered.length !== 0) {
          return { ...comment, post: filtered[0] };
        } else {
          return {
            ...comment,
            post: {
              bucketCanisterId: comment.bucketCanisterId,
              created: comment.createdAt,
              principal: '',
              modified: comment.createdAt,
              views: '',
              publishedDate: '',
              claps: '',
              tags: [],
              isDraft: false,
              category: '',
              handle: '',
              postId: comment.postId,
            },
          };
        }
      });

      return result;
    } catch (error) {
      toastError(error);
      return [];
    }
  },

  updateUserHandle: async (
    oldHandle: string,
    newHandle: string
  ): Promise<boolean> => {
    try {
      let userActor = await getUserActor(get().userCanisterId, get().isLocal);

      //backend method handles the error messaging
      let response = await userActor.updateHandle(
        oldHandle,
        newHandle,
        get().postCoreCanisterId,
        []
      );
      if (Err in response) {
        toastError(response.err);
        return false;
      } else {
        toastSuccess('Success');
        return true;
      }
    } catch (error) {
      toastError(error);
      return false;
    }
  },

  updatePublicationHandle: async (
    oldHandle: string,
    newHandle: string
  ): Promise<boolean> => {
    try {
      let postCoreActor = await getPostCoreActor(
        get().postCoreCanisterId,
        get().isLocal
      );

      //get the canister id of the publication canister
      let allPublicationCanisters =
        await postCoreActor.getPublicationCanisters();
      let filtered = allPublicationCanisters.filter((entry) => {
        return entry[0].toLowerCase() === oldHandle.toLowerCase();
      });
      if (filtered.length === 0) {
        toastError('Publication with the given handle not found.');
        return false;
      }
      //publication found
      let publicationCanisterId = filtered[0][1];
      let publicationCanister = await getPublicationActor(
        publicationCanisterId,
        get().isLocal
      );
      //backend method handles the error messaging
      let response = await publicationCanister.updatePublicationHandle(
        newHandle
      );
      if (Err in response) {
        toastError(response.err);
        return false;
      } else {
        toastSuccess('Success');
        return true;
      }
    } catch (error) {
      toastError(error);
      return false;
    }
  },

  createPublication: async (
    publicationHandle: string,
    name: string,
    firstEditorHandle: string
  ): Promise<boolean> => {
    try {
      let userActor = await getUserActor(get().userCanisterId, get().isLocal);

      //check if the given handle already exists
      let responsePublicationHandle = await userActor.getPrincipalByHandle(
        publicationHandle.toLowerCase()
      );
      if (!(Err in responsePublicationHandle)) {
        //that handle already exists
        toastError('Given publication handle is already taken');
        return false;
      }
      //check if the given editor handle exists
      let responseEditorHandle = await userActor.getPrincipalByHandle(
        firstEditorHandle.toLowerCase()
      );
      if (Err in responseEditorHandle) {
        //that handle doesn't exist
        toastError('Given editor handle not found.');
        return false;
      }

      //everything looks correct
      //create the publication
      let publicationManagementActor = await getPublicationManagementActor(
        get().publicationManagementCanisterId,
        get().isLocal
      );
      let createPublicationResponse =
        await publicationManagementActor.createPublication(
          publicationHandle,
          name,
          firstEditorHandle.toLowerCase()
        );
      if (Err in createPublicationResponse) {
        toastError(createPublicationResponse.err);
        return false;
      } else {
        toastSuccess('Success!');
        return true;
      }
    } catch (error) {
      toastError(error);
      return false;
    }
  },

  getMetrics: async (): Promise<MetricsValue[]> => {
    let userActor = await getUserActor(get().userCanisterId, get().isLocal);
    let postCoreActor = await getPostCoreActor(
      get().postCoreCanisterId,
      get().isLocal
    );
    let [
      activeUsersResponseLastDay,
      activeUsersResponseLastWeek,
      activeUsersResponseLastMonth,
      activeUsersResponse3Months,
      activeUsersResponse6Months,
      allRegisteredNumberResponse,
      createdPostsPerHourResponse,
      viewedPostsPerHourResponse,
      numberofAllPosts,
    ] = await Promise.all([
      userActor.getActiveUsersByRange({
        day: BigInt(1),
        month: BigInt(0),
        hour: BigInt(0),
        year: BigInt(0),
      }),
      userActor.getActiveUsersByRange({
        day: BigInt(7),
        month: BigInt(0),
        hour: BigInt(0),
        year: BigInt(0),
      }),
      userActor.getActiveUsersByRange({
        day: BigInt(0),
        month: BigInt(1),
        hour: BigInt(0),
        year: BigInt(0),
      }),
      userActor.getActiveUsersByRange({
        day: BigInt(0),
        month: BigInt(3),
        hour: BigInt(0),
        year: BigInt(0),
      }),
      userActor.getActiveUsersByRange({
        day: BigInt(0),
        month: BigInt(6),
        hour: BigInt(0),
        year: BigInt(0),
      }),
      userActor.getNumberOfAllRegisteredUsers(),
      postCoreActor.getPostsPerHourLast24Hours(),
      postCoreActor.getPostViewsPerHourLast24Hours(),
      postCoreActor.getTotalPostCount(),
    ]);

    let allApplaudsData = (
      await Promise.all(
        get().postBucketCanisterIds.map(async (postBucketCanisterId) => {
          return (
            await getPostBucketActor(postBucketCanisterId, get().isLocal)
          ).getAllApplauds();
        })
      )
    ).flat(1);

    let applaudsMap = new Map<string, number>();
    applaudsMap.set('NUA', 0);
    applaudsMap.set('ckBTC', 0);
    applaudsMap.set('ICP', 0);
    for (const applaud of allApplaudsData) {
      let n = applaudsMap.get(applaud.currency) || 0;
      applaudsMap.set(applaud.currency, n + Number(applaud.numberOfApplauds));
    }
    let applaudsMetricsValues = Array.from(applaudsMap).map((value) => {
      return {
        value: parseInt((value[1] / Math.pow(10, 8)).toFixed(0)),
        name: `Total Applauds (${value[0]})`,
      };
    });

    return [
      {
        value: Number(activeUsersResponseLastDay),
        name: 'Active Users Last Day',
      },
      {
        value: Number(activeUsersResponseLastWeek),
        name: 'Active Users Last Week',
      },
      {
        value: Number(activeUsersResponseLastMonth),
        name: 'Active Users Last Month',
      },
      {
        value: Number(activeUsersResponse3Months),
        name: 'Active Users Last 3 Months',
      },
      {
        value: Number(activeUsersResponse6Months),
        name: 'Active Users Last 6 Months',
      },
      {
        value: Number(allRegisteredNumberResponse),
        name: 'Registered Users',
      },
      {
        value: Number(createdPostsPerHourResponse[0]),
        name: 'Created Posts Today',
      },
      {
        value: Number(viewedPostsPerHourResponse[0]),
        name: 'Viewed Posts Today',
      },
      {
        value: Number(numberofAllPosts),
        name: 'Total number of posts',
      },
      ...applaudsMetricsValues,
    ];
  },

  getHistoricalData: async (): Promise<{
    posts: [string, bigint][];
    applauds: Applaud[];
  }> => {
    try {
      let postCoreActor = await getPostCoreActor(
        get().postCoreCanisterId,
        get().isLocal
      );
      let publishedPostsHistoricalData =
        await postCoreActor.getHistoricalPublishedArticlesData();

      let allApplaudsData = (
        await Promise.all(
          get().postBucketCanisterIds.map(async (postBucketCanisterId) => {
            return (
              await getPostBucketActor(postBucketCanisterId, get().isLocal)
            ).getAllApplauds();
          })
        )
      ).flat(1);

      return {
        posts: publishedPostsHistoricalData,
        applauds: allApplaudsData,
      };
    } catch (error) {
      toastError(error);
      return {
        posts: [],
        applauds: [],
      };
    }
  },

  getDappCanisters: async (): Promise<[RegisteredCanister[], string]> => {
    let cyclesDispenserActor = await getCyclesDispenserActor(
      get().cyclesDispenserCanisterId,
      get().isLocal
    );
    let response = await Promise.all([
      cyclesDispenserActor.getAllRegisteredCanisters(),
      cyclesDispenserActor.getStatus(),
    ]);
    return response;
  },

  getSnsCanisters: async (): Promise<
    GetSnsCanistersSummaryResponse | undefined
  > => {
    try {
      let SnsRootCanister = await getSnsRootActor();
      let response = await SnsRootCanister.get_sns_canisters_summary({
        update_canister_list: [],
      });
      return response;
    } catch (error) {
      toastError(error);
    }
  },

  getProposals: async (): Promise<ProposalSummaryValue[] | undefined> => {
    let governanceActor = await getSnsGovernanceActor();
    let proposals = (
      await governanceActor.list_proposals({
        include_reward_status: [],
        before_proposal: [],
        limit: 10000,
        exclude_type: [],
        include_status: [],
      })
    ).proposals;

    const known_neuron_0: number[] = [
      217, 171, 173, 231, 1, 13, 248, 58, 52, 18, 150, 147, 61, 116, 221, 172,
      219, 230, 2, 93, 208, 89, 176, 13, 69, 144, 220, 158, 210, 115, 58, 199,
    ];

    const known_neuron_1: number[] = [
      160, 227, 136, 155, 64, 107, 118, 134, 100, 6, 25, 100, 141, 132, 141, 90,
      13, 128, 15, 43, 90, 122, 42, 68, 255, 124, 218, 123, 45, 38, 65, 49,
    ];

    const known_neurons = [
      new Uint8Array(known_neuron_0),
      new Uint8Array(known_neuron_1),
    ];

    return [
      {
        description: 'All proposals from unknown neurons',
        number: proposals.filter((proposal) => {
          return (
            Number(proposal.decided_timestamp_seconds) !== 0 &&
            !isKnownNeuron(known_neurons, proposal.proposer[0]?.id)
          );
        }).length,
        isRed: false,
      },
      {
        description: 'All proposals from known neurons',
        number: proposals.filter((proposal) => {
          return (
            Number(proposal.decided_timestamp_seconds) !== 0 &&
            isKnownNeuron(known_neurons, proposal.proposer[0]?.id)
          );
        }).length,
        isRed: false,
      },
      {
        description: 'Active proposals from unknown neurons',
        number: proposals.filter((proposal) => {
          return (
            Number(proposal.decided_timestamp_seconds) === 0 &&
            !isKnownNeuron(known_neurons, proposal.proposer[0]?.id)
          );
        }).length,
        isRed:
          proposals.filter((proposal) => {
            return (
              Number(proposal.decided_timestamp_seconds) === 0 &&
              !isKnownNeuron(known_neurons, proposal.proposer[0]?.id)
            );
          }).length !== 0,
      },
      {
        description: 'Active proposals from known neurons',
        number: proposals.filter((proposal) => {
          return (
            Number(proposal.decided_timestamp_seconds) === 0 &&
            isKnownNeuron(known_neurons, proposal.proposer[0]?.id)
          );
        }).length,
        isRed: false,
      },
    ];
  },

  getRejectedPostsLastWeek: async (): Promise<PostType[]> => {
    try {
      let postCoreActor = await getPostCoreActor(
        get().postCoreCanisterId,
        get().isLocal
      );
      let keyProperties =
        await postCoreActor.getLastWeekRejectedPostKeyProperties();
      return await fetchPostsByBuckets(keyProperties, get().isLocal);
    } catch (error) {
      toastError(error);
      return [];
    }
  },

  getPost: async (
    bucketCanisterId: string,
    postId: string
  ): Promise<PostBucketType | undefined> => {
    try {
      let bucketActor = await getPostBucketActor(
        bucketCanisterId,
        get().isLocal
      );
      let response = await bucketActor.getPostCompositeQuery(postId);
      if (!(Err in response)) {
        return response.ok;
      } else {
        toastError(response.err);
      }
    } catch (error) {
      toastError(error);
    }
  },

  setupEnvironment: async (
    isLocal: boolean,
    postCoreCanisterId: string,
    metricsCanisterId: string,
    userCanisterId: string,
    publicationManagementCanisterId: string,
    cyclesDispenserCanisterId: string,
    userPrincipalId: string
  ): Promise<void> => {
    console.log('userPrincipalId from setup', userPrincipalId);
    let postCoreActor = await getPostCoreActor(postCoreCanisterId, isLocal);
    try {
      let [bucketResponse, frontendCanisterIdResponse] = await Promise.all([
        postCoreActor.getBucketCanisters(),
        postCoreActor.getFrontendCanisterId(),
      ]);
      let bucketCanisterIds = bucketResponse.map((v) => v[0]);
      if (!(Err in frontendCanisterIdResponse)) {
        set({
          postBucketCanisterIds: bucketCanisterIds,
          postCoreCanisterId,
          metricsCanisterId,
          frontendCanisterId: frontendCanisterIdResponse.ok,
          userCanisterId,
          publicationManagementCanisterId,
          cyclesDispenserCanisterId,
          isLocal,
        });
      }
    } catch (error) {
      toastError(error);
    }
  },

  clearAll: () => {
    set({
      comments: [],
      postBucketCanisterIds: [],
      postCoreCanisterId: '4vm7k-tyaaa-aaaah-aq4wq-cai',
      metricsCanisterId: '4vm7k-tyaaa-aaaah-aq4wq-cai',
      userCanisterId: 'wlam3-raaaa-aaaap-qpmaa-cai',
      publicationManagementCanisterId: 'kq23y-aiaaa-aaaaf-qajmq-cai',
      cyclesDispenserCanisterId: 'y6ydp-7aaaa-aaaaj-azwyq-cai',
      isLocal: false,
    });
  },
});

export const usePostStore = create(
  persist(createPostStore, {
    name: 'postStore',
    getStorage: () => sessionStorage,
  })
);
