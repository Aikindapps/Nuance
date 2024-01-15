import create, { GetState, SetState, StateCreator, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast, toastError, ToastType } from '../services/toastService';
// import { ErrorType, getErrorType } from '../../../../src/nuance_assets/services/errorService';
// import { useAuthStore } from './authStore';
import { getPostBucketActor} from '../services/actorService';
// import { Principal } from '@dfinity/principal';
// import { PostKeyProperties } from '../../../../src/declarations/PostCore/PostCore.did';
import {
  Comment,
  SaveCommentModel,
} from '../../declarations/PostBucket/PostBucket.did';

global.fetch = fetch;


const Err = 'err';


function separateIds(input: string) {
  // Split the input string by the '-' character
  let parts = input.split('-');

  // The first part is the post ID
  let postId = parts[0];

  // The rest of the parts make up the canister ID
  let canisterId = parts.slice(1).join('-');
  // Return the IDs in an object
  return { postId, canisterId };
}




export interface PostStore {
  comments: Comment[];
  totalNumberOfComments: number;
  deleteComment: (commentId: string, bucketCanisterId: string) => Promise<void>;
  reviewComment: (commentId: string, bucketCanisterId: string, isViolatingRules: boolean) => Promise<void>;
  clearAll: () => void;
}

const createPostStore: StateCreator<PostStore> = (set, get) => ({
  comments: [],
  totalNumberOfComments: 0,

  deleteComment: async (commentId: string, bucketCanisterId: string): Promise<void> => {
    try {
      const actor = await getPostBucketActor(bucketCanisterId);
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

  reviewComment: async (commentId: string, bucketCanisterId: string, isViolatingRules: boolean): Promise<void> => {
    try {
      const actor = await getPostBucketActor(bucketCanisterId);
      const result = await actor.reviewComment(commentId, isViolatingRules);
      if ('err' in result) {
        toastError(result.err);
      } else {
        toast("Comment reviewed!", ToastType.Success);
      }
    } catch (err) {
      toastError('Error reviewing comment' + err);
      console.error(err);
    }
  },

  clearAll: () => {
    set({ comments: [], totalNumberOfComments: 0 });
  },
});

export const usePostStore = create(
  persist(
    createPostStore,
    {
      name: 'postStore',
      getStorage: () => sessionStorage,
    }
  )
);
