import create, { GetState, SetState, StateCreator, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast, toastError, ToastType } from '../services/toastService';
// import { ErrorType, getErrorType } from '../../../../src/nuance_assets/services/errorService';
// import { useAuthStore } from './authStore';
import { getPostBucketActor, getPostCoreActor } from '../services/actorService';
// import { Principal } from '@dfinity/principal';
// import { PostKeyProperties } from '../../../../src/declarations/PostCore/PostCore.did';
import {
  Comment,
  SaveCommentModel,
} from '../../../../src/declarations/PostBucket/PostBucket.did';

global.fetch = fetch;

const Err = 'err';

export interface PostStore {
  comments: Comment[];
  isLocal: boolean;
  postCoreCanisterId: string;
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
    metricsCanisterId: string
  ) => Promise<void>;
  clearAll: () => void;
}

const createPostStore: StateCreator<PostStore> = (set, get) => ({
  comments: [],
  postBucketCanisterIds: [],
  postCoreCanisterId: '322sd-3iaaa-aaaaf-qakgq-cai',
  metricsCanisterId: '322sd-3iaaa-aaaaf-qakgq-cai',
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

  setupEnvironment: async (
    isLocal: boolean,
    postCoreCanisterId: string,
    metricsCanisterId: string
  ): Promise<void> => {
    let postCoreActor = await getPostCoreActor(postCoreCanisterId, isLocal);
    try {
      let bucketCanisterIds = (await postCoreActor.getBucketCanisters()).map(
        (v) => v[0]
      );
      set({
        postBucketCanisterIds: bucketCanisterIds,
        postCoreCanisterId,
        metricsCanisterId,
      });
    } catch (error) {
      toastError(error);
    }
  },

  clearAll: () => {
    set({
      comments: [],
      postBucketCanisterIds: [],
      postCoreCanisterId: '322sd-3iaaa-aaaaf-qakgq-cai',
      metricsCanisterId: '322sd-3iaaa-aaaaf-qakgq-cai',
    });
  },
});

export const usePostStore = create(
  persist(createPostStore, {
    name: 'postStore',
    getStorage: () => sessionStorage,
  })
);
