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
import { useAuthStore } from './authStore';
import { CommentType } from '../shared/types';

global.fetch = fetch;

const Err = 'err';

export interface PostStore {
  comments: Comment[];
  isLocal: boolean;
  postCoreCanisterId: string;
  frontendCanisterId: string;
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
    userPrincipalId: string
  ) => Promise<void>;
  getAllReportedComments: () => Promise<CommentType[]>
  clearAll: () => void;
}

const createPostStore: StateCreator<PostStore> = (set, get) => ({
  comments: [],
  postBucketCanisterIds: [],
  postCoreCanisterId: '322sd-3iaaa-aaaaf-qakgq-cai',
  metricsCanisterId: '322sd-3iaaa-aaaaf-qakgq-cai',
  frontendCanisterId: '',
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

  getAllReportedComments: async () : Promise<CommentType[]> => {
    let bucketCanisterIds = get().postBucketCanisterIds;
    console.log('buckets: ', bucketCanisterIds)
    let promises = [];
    for(const bucketCanisterId of bucketCanisterIds){
      let bucketActor = await  getPostBucketActor(bucketCanisterId, get().isLocal);
      promises.push(bucketActor.getReportedComments());
    };
    try {
      let responses = await Promise.all(promises)
      console.log('responses: ', responses)
      let comments : Comment[] = []
      for(const response of responses){
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

      let result = comments.map((comment)=>{
        let filtered = keyProperties.filter((postKeyProperty)=>{
          return postKeyProperty.postId === comment.postId
        })
        if(filtered.length !== 0){
          return { ...comment, post: filtered[0] };
        }
        else{
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
      })
      
      return result
    } catch (error) {
      toastError(error);
      return []
    }
  },

  setupEnvironment: async (
    isLocal: boolean,
    postCoreCanisterId: string,
    metricsCanisterId: string,
    userPrincipalId: string
  ): Promise<void> => {
    console.log('userPrincipalId from setup', userPrincipalId)
    let postCoreActor = await getPostCoreActor(postCoreCanisterId, isLocal);
    try {
      let [bucketResponse, frontendCanisterIdResponse] = await Promise.all([
        postCoreActor.getBucketCanisters(),
        postCoreActor.getFrontendCanisterId()
      ])
      let bucketCanisterIds = bucketResponse.map((v) => v[0]);
      if(!(Err in frontendCanisterIdResponse)){
        set({
          postBucketCanisterIds: bucketCanisterIds,
          postCoreCanisterId,
          metricsCanisterId,
          frontendCanisterId: frontendCanisterIdResponse.ok,
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
      postCoreCanisterId: '322sd-3iaaa-aaaaf-qakgq-cai',
      metricsCanisterId: '322sd-3iaaa-aaaaf-qakgq-cai',
      isLocal: false
    });
  },
});

export const usePostStore = create(
  persist(createPostStore, {
    name: 'postStore',
    getStorage: () => sessionStorage,
  })
);
