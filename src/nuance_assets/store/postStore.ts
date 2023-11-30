import create, { GetState, SetState, StateCreator, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast, toastError, ToastType } from '../services/toastService';
import { ErrorType, getErrorType } from '../services/errorService';
import { useAuthStore, usePublisherStore, useUserStore } from './';
import {
  PostType,
  UserType,
  NftCanisterEntry,
  LockTokenReturn,
  PremiumPostActivityListItem,
  PremiumArticleOwners,
  PremiumArticleOwner,
} from '../types/types';
import {
  getPostIndexActor,
  getPostCoreActor,
  getPostBucketActor,
  getUserActor,
  User,
  PostSaveModel,
  PostTag,
  PostTagModel,
  TagModel,
  getPublisherActor,
  getExtActor,
  getLedgerActor,
  getIcrc1Actor,
} from '../services/actorService';
import { AccountIdentifier, LedgerCanister } from '@dfinity/nns';
import { TransferResult as Icrc1TransferResult } from '../services/icrc1/icrc1.did';
import { TransferResult } from '../services/ledger-service/Ledger.did';
import { downscaleImage } from '../components/quill-text-editor/modules/quill-image-compress/downscaleImage';
import { Metadata, Transaction } from '../services/ext-service/ext_v2.did';
import { getFieldsFromMetadata, icpPriceToString, toBase256 } from '../shared/utils';
import { Principal } from '@dfinity/principal';
import { PostKeyProperties } from '../../declarations/PostCore/PostCore.did';
import {
  Comment,
  PostBucketType,
  PostBucketType__1,
  SaveCommentModel,
} from '../../../src/declarations/PostBucket/PostBucket.did';
import Comments from '../components/comments/comments';
import { SupportedTokenSymbol } from '../shared/constants';
global.fetch = fetch;

const Err = 'err';
const Unexpected = 'Unexpected error: ';
const ArticleNotFound = 'Article not found';

// fetch and merge author avatars into a list of posts
const mergeAuthorAvatars = async (posts: PostType[]): Promise<PostType[]> => {
  var authorHandles = posts.map((p) => {
    if (p.creator) {
      return p.creator.toLowerCase();
    } else {
      return p.handle.toLowerCase();
    }
  });

  posts.forEach((p) => {
    if (p.isPublication) {
      authorHandles = [...authorHandles, p.handle];
    }
  });

  const authors = await (await getUserActor()).getUsersByHandles(authorHandles);

  return posts.map((p) => {
    const author = authors.find((a) => {
      if (p.isPublication) {
        return a.handle.toLowerCase() === p.creator?.toLowerCase();
      } else {
        return a.handle.toLowerCase() === p.handle.toLowerCase();
      }
    });
    if (author) {
      if (p.isPublication) {
        const publicationAsUser = authors.find((a) => {
          return p.handle.toLowerCase() === a.handle.toLowerCase();
        });
        if (publicationAsUser) {
          return {
            ...p,
            avatar: author.avatar,
            displayName: publicationAsUser.displayName,
            fontType: publicationAsUser.fontType,
          };
        }
      }
      return { ...p, avatar: author.avatar };
    }

    return p;
  });
};

async function mergeCommentsWithUsers(comments: Comment[]): Promise<Comment[]> {
  const usersCache: Map<string, User> = new Map();

  async function fetchUser(principalId: string): Promise<User> {
    let user = usersCache.get(principalId);
    if (!user) {
      const userResult = await (
        await getUserActor()
      ).getUserByPrincipalId(principalId);
      if ('err' in userResult) throw new Error(userResult.err);
      user = userResult.ok;
      usersCache.set(principalId, user);
    }
    return user;
  }

  async function addUserDetails(comment: Comment): Promise<Comment> {
    const user = await fetchUser(comment.creator);
    comment.avatar = user.avatar;
    comment.handle = user.handle;
    return comment;
  }

  // Enrich comments with user details and handle replies.
  const enrichComments = async (
    commentsToEnrich: Comment[]
  ): Promise<Comment[]> => {
    return Promise.all(
      commentsToEnrich.map(async (comment) => {
        comment = await addUserDetails(comment);
        if (comment.replies && comment.replies.length > 0) {
          comment.replies = await enrichComments(comment.replies);
        }
        return comment;
      })
    );
  };

  return enrichComments(comments);
}

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

const isUserEditor = (publicationHandle: string, user?: UserType) => {
  var result = false;
  user?.publicationsArray.forEach((pubObj) => {
    if (pubObj.publicationName === publicationHandle && pubObj.isEditor) {
      result = true;
    }
  });
  return result;
};

const fetchPostsByBuckets = async (
  coreReturns: PostKeyProperties[],
  includeDraft: boolean
) => {
  let bucketsMap = new Map<string, PostKeyProperties[]>();
  let postIdToKeyPropertiesMap = new Map<string, PostKeyProperties>();
  coreReturns.forEach((keyProperties) => {
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
      let bucketActor = await getPostBucketActor(bucketCanisterId);
      promises.push(
        bucketActor.getPostsByPostIds(
          keyProperties.map((keyProperty) => {
            return keyProperty.postId;
          }),
          includeDraft
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
      return { ...bucketType } as PostType;
    }
  });
};

const handleError = (err: any, preText?: string) => {
  const errorType = getErrorType(err);

  if (errorType == ErrorType.SessionTimeOut) {
    useAuthStore?.getState().logout();
    window.location.href = '/timed-out';
  } else {
    toastError(err, preText);
  }
};

export interface PostStore {
  count: bigint | undefined;
  post: PostType | undefined;
  author: User | undefined;
  deletedPostId: string | undefined;
  savedPost: PostType | undefined;
  userPosts: PostType[] | undefined;
  myDraftPosts: PostType[] | undefined;
  myPublishedPosts: PostType[] | undefined;
  submittedForReviewPosts: PostType[] | undefined;
  claps: string | undefined;
  isTagScreen: boolean;
  userPostIds: Array<string> | undefined;

  searchText: string;
  searchResults: PostType[] | undefined;
  postResults: PostType[] | undefined;
  searchTotalCount: number;
  wordCount: string;
  postTotalCount: number;
  postTotalCountToday: number;
  postTotalCountThisWeek: number;
  postTotalCountThisMonth: number;
  latestPosts: PostType[] | undefined;
  moreLatestPosts: PostType[] | undefined;
  postsByFollowers: PostType[] | undefined;
  popularPosts: PostType[] | undefined;
  popularPostsToday: PostType[] | undefined;
  popularPostsThisWeek: PostType[] | undefined;
  popularPostsThisMonth: PostType[] | undefined;
  publicationPost: PostType | undefined;
  getPublicationPostError: string | undefined;
  postWithPublicationControl: PostType | undefined;
  getPostWithPublicationControlError: string | undefined;

  postsByCategory: PostType[] | undefined;
  postsByCategoryTotalCount: Number;

  nftCanistersEntries: NftCanisterEntry[];
  ownedPremiumPosts: string[];
  premiumPostsActivities: PremiumPostActivityListItem[];
  ownersOfPremiumArticle: PremiumArticleOwners | undefined;
  userBalance: bigint | undefined;

  getPostError: string | undefined;
  getSavedPostError: string | undefined;

  getPremiumPostError: string | undefined;

  allTags: TagModel[] | undefined;
  myTags: PostTagModel[] | undefined;
  tagsByUser: PostTag[] | undefined;
  comments: Comment[] | [];
  totalNumberOfComments: number;

  savePost: (post: PostSaveModel) => Promise<PostType | undefined>;
  makePostPremium: (postId: string) => Promise<void>;
  getSavedPost: (postId: string) => Promise<void>;
  getSavedPostReturnOnly: (postId: string) => Promise<PostType | undefined>;
  clearSavedPost: () => Promise<void>;
  clearSavedPostError: () => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  getTotalPostCount: () => Promise<void>;
  getPost: (
    handle: string,
    postId: string,
    bucketCanisterId?: string
  ) => Promise<void>;
  clearPost: () => void;
  clearUserPosts: () => void;
  //clearPostError: () => Promise<void>;
  getUserPosts: (handle: string) => Promise<PostType[] | undefined>;
  getUserPostIds: (handle: string) => Promise<void>;
  getMyDraftPosts: (
    indexFrom: number,
    indexTo: number
  ) => Promise<PostType[] | undefined>;
  getMyPublishedPosts: (
    indexFrom: number,
    indexTo: number
  ) => Promise<PostType[] | undefined>;
  getLatestPosts: (indexFrom: number, indexTo: number) => Promise<void>;
  getMoreLatestPosts: (indexFrom: number, indexTo: number) => Promise<void>;
  getPostsByFollowers: (
    followers: Array<string>,
    indexFrom: number,
    indexTo: number
  ) => Promise<PostType[] | undefined>;
  getPostsByCategory: (
    handle: string,
    category: string,
    indexFrom: number,
    indexTo: number
  ) => Promise<PostType[] | undefined>;
  getSubmittedForReviewPosts: (handles: string[]) => Promise<void>;
  clearPostsByCategory: () => void;
  clearPostsByFollowers: () => void;
  clapPost: (postId: string) => Promise<void>;
  clearSearchBar: (isTagScreen: boolean) => void;
  getPopularPosts: (indexFrom: number, indexTo: number) => Promise<void>;
  getPopularPostsToday: (indexFrom: number, indexTo: number) => Promise<void>;
  getPopularPostsThisWeek: (
    indexFrom: number,
    indexTo: number
  ) => Promise<void>;
  getPopularPostsThisMonth: (
    indexFrom: number,
    indexTo: number
  ) => Promise<void>;
  getPublicationPost: (
    postId: string,
    publicationHandle: string
  ) => Promise<void>;
  createNftFromPremiumArticle: (
    post: PostType,
    totalSuppy: bigint,
    salePrice: bigint,
    handle: string
  ) => Promise<PostType | undefined>;
  clerGetPublicationPostError: () => Promise<void>;
  getSavedPostWithControlPublication: (postId: string) => Promise<void>;
  getPostWithPublicationControl: (
    handle: string,
    postId: string,
    bucketCanisterId?: string
  ) => Promise<void>;
  getPremiumPost: (
    handle: string,
    postId: string,
    bucketCanisterId?: string
  ) => Promise<void>;
  getSavedPremiumPost: (postId: string) => Promise<void>;
  setSearchText: (searchText: string) => void;
  search: (
    phrase: string,
    isTagSearch: boolean,
    indexFrom: number,
    indexTo: number,
    user: UserType | undefined
  ) => Promise<void>;
  searchWithinPublication: (
    phrase: string,
    isTagSearch: boolean,
    indexFrom: number,
    indexTo: number,
    searchingPostIds: Array<string>,
    user: UserType | undefined
  ) => Promise<void>;
  populateTags: (
    tags: Array<string>,
    indexFrom: number,
    indexTo: number
  ) => Promise<void>;
  clearSearch: () => void;
  getWordCount: (postId: string) => Promise<void>;
  clearWordCount: () => void;
  getAllTags: () => Promise<void>;
  getMyTags: () => Promise<PostTagModel[] | undefined>;
  getTagsByUser: (userId: string) => Promise<void>;
  followTag: (tag: string) => Promise<void>;
  unfollowTag: (tag: string) => Promise<void>;
  getOwnersOfPost: (postId: string) => Promise<void>;
  getOwnersOfPremiumArticleReturnOnly: (
    postId: string
  ) => Promise<PremiumArticleOwners | undefined>;
  lockToken: (
    tokenId: string,
    price: bigint,
    canisterId: string,
    buyerAccountId: string | undefined
  ) => Promise<LockTokenReturn>;
  getMyBalance: () => Promise<bigint | undefined>;
  transferIcp: (amount: bigint, receiver: string) => Promise<TransferResult>;
  transferICRC1Token: (
    amount: number,
    receiver: string,
    canisterId: string,
    fee: number,
    subaccountIndex?: number
  ) => Promise<Icrc1TransferResult>;
  checkTipping: (postId: string, bucketCanisterId: string) => Promise<void>;
  checkTippingByTokenSymbol: (
    postId: string,
    tokenSymbol: SupportedTokenSymbol,
    bucketCanisterId: string
  ) => Promise<void>;
  settleToken: (
    tokenId: string,
    canisterId: string,
    handle: string
  ) => Promise<string>;
  migratePostToPublication: (
    postId: string,
    publicationHandle: string,
    isDraft: boolean
  ) => Promise<PostType | undefined>;

  getOwnedNfts: () => Promise<void>;
  getSellingNfts: () => Promise<PremiumPostActivityListItem[]>;
  transferNft: (
    tokenIdentifier: string,
    senderAccount: string,
    receiverAccount: string,
    canisterId: string
  ) => Promise<string>;

  getUserDailyPostStatus: () => Promise<boolean>;
  getPostComments: (postId: string, bucketCanisterId: string) => Promise<void>;
  saveComment: (
    commentModel: SaveCommentModel,
    bucketCanisterId: string,
    edited: Boolean,
    handle: string,
    avatar: string,
    comment?: Comment
  ) => Promise<void>;
  upVoteComment: (commentId: string, bucketCanisterId: string) => Promise<void>;
  downVoteComment: (
    commentId: string,
    bucketCanisterId: string
  ) => Promise<void>;
  deleteComment: (commentId: string, bucketCanisterId: string) => Promise<void>;
  removeCommentVote: (
    commentId: string,
    bucketCanisterId: string
  ) => Promise<void>;

  clearAll: () => void;
}

// proxies calls to the app canister and caches the results
const createPostStore: StateCreator<PostStore> | StoreApi<PostStore> = (
  set,
  get
) => ({
  count: undefined,
  post: undefined,
  author: undefined,
  deletedPostId: undefined,
  savedPost: undefined,
  userPosts: undefined,
  userPostIds: undefined,
  myDraftPosts: undefined,
  myPublishedPosts: undefined,
  submittedForReviewPosts: undefined,
  claps: undefined,
  ClearSearchBar: false,
  isTagScreen: false,
  postWithPublicationControl: undefined,
  getPostWithPublicationControlError: undefined,

  searchText: '',
  searchResults: undefined,
  postResults: undefined,
  searchTotalCount: 0,
  postTotalCount: 0,
  postTotalCountToday: 0,
  postTotalCountThisWeek: 0,
  postTotalCountThisMonth: 0,
  wordCount: '0',
  latestPosts: undefined,
  moreLatestPosts: undefined,
  postsByFollowers: undefined,
  morePostsByFollowers: undefined,
  popularPosts: undefined,
  popularPostsToday: undefined,
  popularPostsThisWeek: undefined,
  popularPostsThisMonth: undefined,

  postsByCategory: undefined,
  postsByCategoryTotalCount: 0,

  getPostError: undefined,
  getSavedPostError: undefined,
  publicationPost: undefined,
  getPublicationPostError: undefined,
  getPremiumPostError: undefined,
  ownersOfPremiumArticle: undefined,
  userBalance: undefined,

  allTags: undefined,
  myTags: undefined,
  tagsByUser: undefined,
  nftCanistersEntries: [],
  ownedPremiumPosts: [],
  premiumPostsActivities: [],
  comments: [],
  totalNumberOfComments: 0,

  getPostComments: async (
    postId: string,
    bucketCanisterId: string
  ): Promise<void> => {
    try {
      const result = await (
        await getPostBucketActor(bucketCanisterId)
      ).getPostComments(postId);
      if (Err in result) {
        toastError(result.err);
      } else {
        mergeCommentsWithUsers(result.ok.comments)
          .then((enrichedComments) => {
            set({
              comments: enrichedComments,
              totalNumberOfComments: parseInt(result.ok.totalNumberOfComments),
            });
          })
          .catch((error) => {
            console.error(error);
          });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  saveComment: async (
    commentModel: SaveCommentModel,
    bucketCanisterId: string,
    edited: Boolean,
    handle: string,
    avatar: string,
    comment?: Comment
  ): Promise<void> => {
    // Generate a temporary ID for the new comment
    const tempId = Date.now().toString();

    // Create a new comment object with the temporary ID and other properties
    let newComment = {
      creator: 'TEMP',
      handle: handle,
      avatar: avatar,
      postId: commentModel.postId,
      content: commentModel.content,
      commentId: comment ? comment.commentId : tempId,
      createdAt: comment ? comment.createdAt : '0',
      downVotes: comment ? comment.downVotes : ([] as string[]),
      upVotes: comment ? comment.upVotes : ([] as string[]),
      replies: comment ? (comment.replies as Comment[]) : ([] as Comment[]),
      repliedCommentId: [],
      editedAt: comment ? comment.editedAt : [],
    } as Comment;

    // Optimistically update the state with the new comment before backend updates

    function findAndUpdateComment(
      comments: Comment[],
      commentId: string,
      updateFn: (comment: Comment) => Comment
    ): Comment[] {
      return comments.map((comment) => {
        if (comment.commentId === commentId) {
          return updateFn(comment);
        } else if (comment.replies) {
          return {
            ...comment,
            replies: findAndUpdateComment(comment.replies, commentId, updateFn),
          };
        }
        return comment;
      });
    }

    const replyToCommentId =
      commentModel.replyToCommentId && commentModel.replyToCommentId.length > 0
        ? commentModel.replyToCommentId[0]
        : undefined;
    const actualCommentId =
      commentModel.commentId && commentModel.commentId.length > 0
        ? commentModel.commentId[0]
        : undefined;

    if (replyToCommentId === undefined) {
      if (actualCommentId) {
        set((state) => ({
          comments: findAndUpdateComment(
            state.comments,
            actualCommentId,
            (oldComment) => ({
              ...oldComment,
              ...newComment,
              commentId: comment?.commentId || tempId,
            })
          ),
        }));
      } else {
        set((state) => ({ comments: [newComment, ...state.comments] }));
      }
    } else {
      set((state) => ({
        comments: findAndUpdateComment(
          state.comments,
          replyToCommentId,
          (comment) => ({
            ...comment,
            replies: [newComment, ...comment.replies],
          })
        ),
      }));
    }

    try {
      const result = await (
        await getPostBucketActor(bucketCanisterId)
      ).saveComment(commentModel);
      if (Err in result) {
        // If there is an error, revert the optimistic update
        set((state) => ({
          comments: state.comments.filter(
            (comment) => comment.commentId !== tempId
          ),
        }));
        toastError(result.err);
      } else {
        if (
          edited ||
          (commentModel.commentId && commentModel.commentId.length > 0)
        ) {
          toast(
            'The changes on your comment have been saved.',
            ToastType.Success
          );
          set((state) => ({
            comments: state.comments.map((comment) =>
              comment.commentId === tempId ? { ...comment } : comment
            ),
          }));
          mergeCommentsWithUsers(result.ok.comments)
            .then((enrichedComments) => {
              set({
                comments: enrichedComments,
                totalNumberOfComments: parseInt(
                  result.ok.totalNumberOfComments
                ),
              });
            })
            .catch((error) => {
              console.error(error);
            });
        } else {
          mergeCommentsWithUsers(result.ok.comments)
            .then((enrichedComments) => {
              set({
                comments: enrichedComments,
                totalNumberOfComments: parseInt(
                  result.ok.totalNumberOfComments
                ),
              });
            })
            .catch((error) => {
              console.error(error);
            });
          toast('You posted a comment!', ToastType.Success);
        }
      }
    } catch (err) {
      // If there is an exception, revert the optimistic update and handle the error
      set((state) => ({
        comments: state.comments.filter(
          (comment) => comment.commentId !== tempId
        ),
      }));
      handleError(err, Unexpected);
    }
  },

  upVoteComment: async (
    commentId: string,
    bucketCanisterId: string
  ): Promise<void> => {
    try {
      const result = await (
        await getPostBucketActor(bucketCanisterId)
      ).upvoteComment(commentId);
      if (Err in result) {
        toastError(result.err);
      } else {
        mergeCommentsWithUsers(result.ok.comments)
          .then((enrichedComments) => {
            set({
              comments: enrichedComments,
              totalNumberOfComments: parseInt(result.ok.totalNumberOfComments),
            });
          })
          .catch((error) => {
            console.error(error);
          });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  downVoteComment: async (
    commentId: string,
    bucketCanisterId: string
  ): Promise<void> => {
    try {
      const result = await (
        await getPostBucketActor(bucketCanisterId)
      ).downvoteComment(commentId);
      if (Err in result) {
        toastError(result.err);
      } else {
        mergeCommentsWithUsers(result.ok.comments)
          .then((enrichedComments) => {
            set({
              comments: enrichedComments,
              totalNumberOfComments: parseInt(result.ok.totalNumberOfComments),
            });
          })
          .catch((error) => {
            console.error(error);
          });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  deleteComment: async (
    commentId: string,
    bucketCanisterId: string
  ): Promise<void> => {
    try {
      const result = await (
        await getPostBucketActor(bucketCanisterId)
      ).deleteComment(commentId);
      if (Err in result) {
        toastError(result.err);
      } else {
        //set({ comments: result.ok });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  removeCommentVote: async (
    commentId: string,
    bucketCanisterId: string
  ): Promise<void> => {
    try {
      const result = await (
        await getPostBucketActor(bucketCanisterId)
      ).removeCommentVote(commentId);
      if (Err in result) {
        toastError(result.err);
      } else {
        mergeCommentsWithUsers(result.ok.comments)
          .then((enrichedComments) => {
            set({
              comments: enrichedComments,
              totalNumberOfComments: parseInt(result.ok.totalNumberOfComments),
            });
          })
          .catch((error) => {
            console.error(error);
          });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  clearSearchBar(isTagScreen) {
    set((state) => {
      state.isTagScreen = isTagScreen;
    });
  },

  savePost: async (post: PostSaveModel): Promise<PostType | undefined> => {
    try {
      const result = await (await getPostCoreActor()).save(post);
      if (Err in result) {
        toastError(result.err);
      } else {
        set({ savedPost: result.ok as PostType });
        return result.ok;
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getSavedPost: async (postId: string): Promise<void> => {
    try {
      const coreActor = await getPostCoreActor();
      const coreReturn = await coreActor.getPostKeyProperties(postId);
      if (Err in coreReturn) {
        set({ getSavedPostError: coreReturn.err });
        toastError(coreReturn.err);
      } else {
        let bucketCanisterId = coreReturn.ok.bucketCanisterId;
        let bucketActor = await getPostBucketActor(bucketCanisterId);
        const bucketReturn = await bucketActor.get(postId);
        if (Err in bucketReturn) {
          set({ getSavedPostError: bucketReturn.err });
          toastError(bucketReturn.err);
        } else {
          const savedPost = {
            ...bucketReturn.ok,
            ...coreReturn.ok,
          } as PostType;
          set({ savedPost, getSavedPostError: undefined });
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getSavedPostReturnOnly: async (
    postId: string
  ): Promise<PostType | undefined> => {
    try {
      const coreActor = await getPostCoreActor();
      const coreReturn = await coreActor.getPostKeyProperties(postId);
      if (Err in coreReturn) {
        toastError(coreReturn.err);
      } else {
        let bucketCanisterId = coreReturn.ok.bucketCanisterId;
        let bucketActor = await getPostBucketActor(bucketCanisterId);
        const bucketReturn = await bucketActor.get(postId);
        if (Err in bucketReturn) {
          //bucket canister returned an error -> it may be a publication post or unauthorized call
          //check if it's a publication post
          const bucketPublicationReturn =
            await bucketActor.getPostWithPublicationControl(postId);
          if (Err in bucketPublicationReturn) {
            toastError(bucketPublicationReturn.err);
          } else {
            //if here, it's a draft publication post and an editor wants to edit it
            //just return the post
            const savedPost = {
              ...bucketPublicationReturn.ok,
              ...coreReturn.ok,
            } as PostType;
            return savedPost;
          }
        } else {
          //if here, it's not a publication post -> check if the post is premium
          //if it's not, just return the post
          //if it's a premium post, fetch the full post by getPremiumArticle and then return the post
          let user = useUserStore.getState().user;
          let bucketResult = bucketReturn.ok;

          if (
            user?.handle === bucketResult.handle ||
            user?.handle === bucketResult.creator ||
            isUserEditor(bucketResult.handle, user)
          ) {
            if (bucketResult.isPremium) {
              let bucketPremiumReturn = await bucketActor.getPremiumArticle(
                postId
              );
              if (Err in bucketPremiumReturn) {
                //this will not happen unless the writer doesn't have the access lkey
                toastError(bucketPremiumReturn.err);
              } else {
                //full post is fetched -> get the fontType of the publication and return the post
                var fontType = '';
                let publicationAsUser = await (
                  await getUserActor()
                ).getUsersByHandles([bucketPremiumReturn.ok.handle]);
                if (publicationAsUser.length !== 0) {
                  fontType = publicationAsUser[0].fontType;
                }

                const savedPost = {
                  ...bucketPremiumReturn.ok,
                  ...coreReturn.ok,
                  fontType,
                } as PostType;
                return savedPost;
              }
            } else {
              const savedPost = {
                ...bucketResult,
                ...coreReturn.ok,
              } as PostType;
              return savedPost;
            }
          }
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
    return;
  },

  getSavedPremiumPost: async (postId: string): Promise<void> => {
    try {
      const coreActor = await getPostCoreActor();
      const coreReturn = await coreActor.getPostKeyProperties(postId);
      if (Err in coreReturn) {
        set({ getSavedPostError: coreReturn.err });
        toastError(coreReturn.err);
      } else {
        let bucketCanisterId = coreReturn.ok.bucketCanisterId;
        let bucketActor = await getPostBucketActor(bucketCanisterId);
        const bucketReturn = await bucketActor.getPremiumArticle(postId);
        if (Err in bucketReturn) {
          set({ getSavedPostError: bucketReturn.err });
          toastError(bucketReturn.err);
        } else {
          const savedPost = {
            ...bucketReturn.ok,
            ...coreReturn.ok,
          } as PostType;
          set({ savedPost, getSavedPostError: undefined });
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  makePostPremium: async (postId: string): Promise<void> => {
    try {
      const coreActor = await getPostCoreActor();
      const coreReturn = await coreActor.getPostKeyProperties(postId);
      if (Err in coreReturn) {
        set({ getSavedPostError: coreReturn.err });
        toastError(coreReturn.err);
      } else {
        let bucketCanisterId = coreReturn.ok.bucketCanisterId;
        let bucketActor = await getPostBucketActor(bucketCanisterId);
        const bucketReturn = await bucketActor.makePostPremium(postId);
        if (!bucketReturn) {
          toastError('Failed to make post premium');
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getSavedPostWithControlPublication: async (postId: string): Promise<void> => {
    try {
      const coreActor = await getPostCoreActor();
      const coreReturn = await coreActor.getPostKeyProperties(postId);

      if (Err in coreReturn) {
        set({ getSavedPostError: coreReturn.err });
        toastError(coreReturn.err);
      } else {
        let bucketCanisterId = coreReturn.ok.bucketCanisterId;
        let bucketActor = await getPostBucketActor(bucketCanisterId);
        let bucketReturn = await bucketActor.get(postId);

        if (Err in bucketReturn) {
          const publicationResult =
            await bucketActor.getPostWithPublicationControl(postId);

          if (Err in publicationResult) {
            set({ getSavedPostError: publicationResult.err });
            toastError(publicationResult.err);
          } else {
            const publicationPost = {
              ...publicationResult.ok,
              ...coreReturn.ok,
            } as PostType;
            set({ savedPost: publicationPost, getSavedPostError: undefined });
          }
        } else {
          const savedPost = {
            ...bucketReturn.ok,
            ...coreReturn.ok,
          } as PostType;
          set({
            savedPost,
            getSavedPostError: undefined,
            getPublicationPostError: undefined,
            publicationPost: undefined,
          });
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  clearSavedPost: async (): Promise<void> => {
    set({ savedPost: undefined, publicationPost: undefined });
  },

  clearSavedPostError: async (): Promise<void> => {
    set({ getSavedPostError: undefined });
  },

  getPublicationPost: async (
    postId: string,
    publicationHandle: string
  ): Promise<void> => {
    try {
      const canisterId = await usePublisherStore
        .getState()
        .getCanisterIdByHandle(publicationHandle);
      const result = await (
        await getPublisherActor(canisterId)
      ).getPublicationPost(postId);
      if (Err in result) {
        set({ getPublicationPostError: result.err });
        toastError(result.err);
      } else {
        const publicationPost = result.ok as PostType;
        set({ publicationPost, getPublicationPostError: undefined });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  clerGetPublicationPostError: async () => {
    set({ getPublicationPostError: undefined });
  },

  createNftFromPremiumArticle: async (
    post: PostType,
    totalSuppy: bigint,
    salePrice: bigint,
    handle: string
  ): Promise<PostType | undefined> => {
    try {
      if (!post.headerImage.length) {
        toastError('NFT article can not be created without an header image!');
        return;
      }

      const canisterId = await usePublisherStore
        .getState()
        .getCanisterIdByHandle(handle);

      //get the image from url in base64 format and resize it to use in nft asset
      let blob = await fetch(post.headerImage).then((r) => r.blob());
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = async (event) => {
        const embeddedImage = event?.target?.result as string;
        var image = new Image();
        image.src = embeddedImage; // replace with your base64 encoded image
        var newWidth = 612;
        var newHeight = 321;
        image.onload = async function () {
          var canvas = document.createElement('canvas');
          canvas.width = newWidth;
          canvas.height = newHeight;

          var context = canvas.getContext('2d');
          var width = image.width;
          var height = image.height;

          if (width / height > newWidth / newHeight) {
            var scale = newHeight / height;
            var scaledWidth = scale * width;
            var x = (newWidth - scaledWidth) / 2;
            context?.drawImage(image, x, 0, scaledWidth, newHeight);
          } else {
            var scale = newWidth / width;
            var scaledHeight = scale * height;
            var y = (newHeight - scaledHeight) / 2;
            context?.drawImage(image, 0, y, newWidth, scaledHeight);
          }
          const result = await (
            await getPublisherActor(canisterId)
          ).createNftFromPremiumArticle(
            post.postId,
            totalSuppy,
            salePrice,
            canvas.toDataURL('image/jpeg', 0.9)
          );
          if (Err in result) {
            toastError(result.err);
          } else {
            toast(
              'Premium article is created successfully.',
              ToastType.Success
            );
            //since createNftFromArticle is successful, we can query the post by get method in Post canister
            let bucketCanisterId = post.bucketCanisterId;
            let bucketActor = await getPostBucketActor(bucketCanisterId);
            let coreActor = await getPostCoreActor();

            let [coreReturn, bucketReturn] = await Promise.all([
              coreActor.getPostKeyProperties(post.postId),
              bucketActor.getPremiumArticle(post.postId),
            ]);

            await get().getOwnedNfts();
            if (Err in coreReturn || Err in bucketReturn) {
              if (Err in bucketReturn) {
                toastError(bucketReturn.err);
              } else if (Err in coreReturn) {
                toastError(coreReturn.err);
              }
            } else {
              set({ savedPost: { ...coreReturn.ok, ...bucketReturn.ok } });
              return { ...coreReturn.ok, ...bucketReturn.ok };
            }
          }
        };
      };
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  deletePost: async (postId: string): Promise<void> => {
    try {
      const result = await (await getPostCoreActor()).delete(postId);
      if (Err in result) {
        toastError(result.err);
      } else {
        set({ deletedPostId: postId });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getTotalPostCount: async (): Promise<void> => {
    try {
      const count = await (await getPostCoreActor()).getTotalPostCount();
      set({ count });
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getPost: async (
    handle: string,
    postId: string,
    bucketCanisterId?: string
  ): Promise<void> => {
    try {
      // parallel requests for author and posts
      // fetch the post's author for the avatar
      // also used to verify the author in the url
      if (bucketCanisterId) {
        let [authorResult, coreReturn, bucketReturn] = await Promise.all([
          (await getUserActor()).getUserByHandle(handle.toLowerCase()),
          (await getPostCoreActor()).getPostKeyProperties(postId),
          (await getPostBucketActor(bucketCanisterId)).get(postId),
        ]);

        if (Err in authorResult) {
          set({ getPostError: `User not found for @${handle}` });
          toastError(authorResult.err);
        } else if (Err in coreReturn) {
          set({ getPostError: ArticleNotFound });
          toastError(coreReturn.err);
        } else {
          if (Err in bucketReturn) {
            set({ getPostError: bucketReturn.err });
            toastError(bucketReturn.err);
          } else {
            const post = { ...bucketReturn.ok, ...coreReturn.ok } as PostType;
            const author = authorResult.ok as User;
            if (author.handle !== post.handle) {
              set({ getPostError: `Article not found for @${handle}` });
            } else {
              set({ post, author, getPostError: undefined });
            }
            // fire and forget (increments view count for post)
            (await getPostCoreActor()).viewPost(postId);
            //fire and forget - updates the last interaction time of the user
            (await getUserActor()).updateLastLogin();
          }
        }
        return;
      }

      let [authorResult, coreReturn] = await Promise.all([
        (await getUserActor()).getUserByHandle(handle.toLowerCase()),
        (await getPostCoreActor()).getPostKeyProperties(postId),
      ]);

      if (Err in authorResult) {
        set({ getPostError: `User not found for @${handle}` });
        toastError(authorResult.err);
      } else if (Err in coreReturn) {
        set({ getPostError: ArticleNotFound });
        toastError(coreReturn.err);
      } else {
        let bucketCanisterId = coreReturn.ok.bucketCanisterId;
        let bucketActor = await getPostBucketActor(bucketCanisterId);
        let postResult = await bucketActor.get(postId);
        if (Err in postResult) {
          set({ getPostError: postResult.err });
          toastError(postResult.err);
        } else {
          const post = { ...postResult.ok, ...coreReturn.ok } as PostType;
          const author = authorResult.ok as User;
          if (author.handle !== post.handle) {
            set({ getPostError: `Article not found for @${handle}` });
          } else {
            set({ post, author, getPostError: undefined });
          }
          // fire and forget (increments view count for post)
          (await getPostCoreActor()).viewPost(postId);
          //fire and forget - updates the last interaction time of the user
          (await getUserActor()).updateLastLogin();
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getPremiumPost: async (
    handle: string,
    postId: string,
    bucketCanisterId?: string
  ): Promise<void> => {
    try {
      // parallel requests for author and posts
      // fetch the post's author for the avatar
      // also used to verify the author in the url
      if (bucketCanisterId) {
        let [authorResult, coreReturn, bucketReturn] = await Promise.all([
          (await getUserActor()).getUserByHandle(handle.toLowerCase()),
          (await getPostCoreActor()).getPostKeyProperties(postId),
          (
            await getPostBucketActor(bucketCanisterId)
          ).getPremiumArticle(postId),
        ]);
        if (Err in authorResult) {
          set({ getPostError: `User not found for @${handle}` });
          toastError(authorResult.err);
        } else if (Err in coreReturn) {
          set({ getPostError: ArticleNotFound });
          toastError(coreReturn.err);
        } else {
          if (Err in bucketReturn) {
            set({ getPostError: bucketReturn.err });
          } else {
            const post = { ...bucketReturn.ok, ...coreReturn.ok } as PostType;
            const author = authorResult.ok as User;
            if (author.handle !== post.handle) {
              set({ getPostError: `Article not found for @${handle}` });
            } else {
              set({ post, author, getPostError: undefined });
            }
            // fire and forget (increments view count for post)
            (await getPostCoreActor()).viewPost(postId);
            //fire and forget - updates the last interaction time of the user
            (await getUserActor()).updateLastLogin();
          }
        }
        return;
      }

      let [authorResult, coreReturn] = await Promise.all([
        (await getUserActor()).getUserByHandle(handle.toLowerCase()),
        (await getPostCoreActor()).getPostKeyProperties(postId),
      ]);

      if (Err in authorResult) {
        set({ getPostError: `User not found for @${handle}` });
        toastError(authorResult.err);
      } else if (Err in coreReturn) {
        set({ getPostError: ArticleNotFound });
        toastError(coreReturn.err);
      } else {
        let bucketCanisterId = coreReturn.ok.bucketCanisterId;
        let bucketActor = await getPostBucketActor(bucketCanisterId);
        let postResult = await bucketActor.getPremiumArticle(postId);
        if (Err in postResult) {
          set({ getPostError: postResult.err });
        } else {
          const post = { ...postResult.ok, ...coreReturn.ok } as PostType;
          const author = authorResult.ok as User;
          if (author.handle !== post.handle) {
            set({ getPostError: `Article not found for @${handle}` });
          } else {
            set({ post, author, getPostError: undefined });
          }
          // fire and forget (increments view count for post)
          (await getPostCoreActor()).viewPost(postId);
          //fire and forget - updates the last interaction time of the user
          (await getUserActor()).updateLastLogin();
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getPostWithPublicationControl: async (
    handle: string,
    postId: string,
    bucketCanisterId?: string
  ): Promise<void> => {
    try {
      // parallel requests for author and posts
      // fetch the post's author for the avatar
      // also used to verify the author in the url

      if (bucketCanisterId) {
        let [authorResult, coreReturn, bucketReturn] = await Promise.all([
          (await getUserActor()).getUserByHandle(handle.toLowerCase()),
          (await getPostCoreActor()).getPostKeyProperties(postId),
          (await getPostBucketActor(bucketCanisterId)).get(postId),
        ]);
        if (Err in authorResult) {
          set({ getPostError: `User not found for @${handle}` });
          toastError(authorResult.err);
        } else {
          if (Err in coreReturn) {
            set({ getPostError: coreReturn.err });
            toastError(coreReturn.err);
          } else {
            if (Err in bucketReturn) {
              if (bucketReturn.err === 'RejectedByModerators') {
                set({ getPostError: 'Post is rejected by the moderators.' });
                toastError(bucketReturn.err);
                return;
              }
              const canisterId = await usePublisherStore
                .getState()
                .getCanisterIdByHandle(handle);
              let publicationPostResult = await (
                await getPublisherActor(canisterId)
              ).getPublicationPost(postId);
              if (Err in publicationPostResult) {
                set({
                  getPostError: ArticleNotFound,
                  getPostWithPublicationControlError: publicationPostResult.err,
                });
                toastError(publicationPostResult.err);
              } else {
                const post = publicationPostResult.ok;
                const author = authorResult.ok;
                set({
                  post: { ...post },
                  author: author,
                  getPostError: undefined,
                  getPostWithPublicationControlError: undefined,
                });
              }
            } else {
              const post = { ...bucketReturn.ok, ...coreReturn.ok } as PostType;
              const author = authorResult.ok as User;
              if (author.handle !== post.handle) {
                set({ getPostError: `Article not found for @${handle}` });
              } else {
                set({ post, author, getPostError: undefined });
              }
              // fire and forget (increments view count for post)
              (await getPostCoreActor()).viewPost(postId);
              //fire and forget - updates the last interaction time of the user
              (await getUserActor()).updateLastLogin();
            }
          }
        }

        return;
      }

      let [authorResult, coreReturn] = await Promise.all([
        (await getUserActor()).getUserByHandle(handle.toLowerCase()),
        (await getPostCoreActor()).getPostKeyProperties(postId),
      ]);

      if (Err in authorResult) {
        set({ getPostError: `User not found for @${handle}` });
        toastError(authorResult.err);
      } else {
        if (Err in coreReturn) {
          set({ getPostError: coreReturn.err });
          toastError(coreReturn.err);
        } else {
          let bucketCanisterId = coreReturn.ok.bucketCanisterId;
          let bucketActor = await getPostBucketActor(bucketCanisterId);
          let postResult = await bucketActor.get(postId);
          if (Err in postResult) {
            const canisterId = await usePublisherStore
              .getState()
              .getCanisterIdByHandle(handle);
            let publicationPostResult = await (
              await getPublisherActor(canisterId)
            ).getPublicationPost(postId);
            if (Err in publicationPostResult) {
              set({
                getPostError: ArticleNotFound,
                getPostWithPublicationControlError: publicationPostResult.err,
              });
              toastError(publicationPostResult.err);
            } else {
              const post = publicationPostResult.ok;
              const author = authorResult.ok;
              set({
                post: { ...post },
                author: author,
                getPostError: undefined,
                getPostWithPublicationControlError: undefined,
              });
            }
          } else {
            const post = { ...postResult.ok, ...coreReturn.ok } as PostType;
            const author = authorResult.ok as User;
            if (author.handle !== post.handle) {
              set({ getPostError: `Article not found for @${handle}` });
            } else {
              set({ post, author, getPostError: undefined });
            }
            // fire and forget (increments view count for post)
            (await getPostCoreActor()).viewPost(postId);
            //fire and forget - updates the last interaction time of the user
            (await getUserActor()).updateLastLogin();
          }
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  clearPost: (): void => {
    set({ post: undefined, author: undefined });
  },

  getUserPosts: async (handle: string): Promise<PostType[] | undefined> => {
    try {
      const coreActor = await getPostCoreActor();
      const coreReturn = await coreActor.getUserPosts(handle.toLowerCase());
      const userPosts = await fetchPostsByBuckets(coreReturn, false);

      set({ userPosts });

      const postsWithAvatars = await mergeAuthorAvatars(userPosts);

      set({ userPosts: postsWithAvatars });
      return postsWithAvatars;
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  clearUserPosts: (): void => {
    set({ userPosts: undefined });
  },

  migratePostToPublication: async (
    postId: string,
    publicationHandle: string,
    isDraft: boolean
  ): Promise<PostType | undefined> => {
    try {
      const coreActor = await getPostCoreActor();
      const coreReturn = await coreActor.getPostKeyProperties(postId);
      if (Err in coreReturn) {
        set({ getSavedPostError: coreReturn.err });
      } else {
        let bucketCanisterId = coreReturn.ok.bucketCanisterId;
        let bucketActor = await getPostBucketActor(bucketCanisterId);
        const result = await bucketActor.migratePostToPublication(
          postId,
          publicationHandle,
          isDraft
        );
        if (Err in result) {
          set({ getSavedPostError: result.err });
          toastError(result.err);
        } else {
          const savedPost = result.ok as PostType;
          set({ savedPost, getSavedPostError: undefined });
          return savedPost;
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getWordCount: async (postId: string): Promise<void> => {
    //TODO needs new logic
    set({ wordCount: '0' });
  },
  clearWordCount: (): void => {
    set({ wordCount: '0' });
  },

  getUserPostIds: async (handle: string): Promise<void> => {
    try {
      const result = await (
        await getPostCoreActor()
      ).getUserPostIds(handle.toLowerCase());
      if (Err in result) {
        toastError(result.err);
      } else {
        set({ userPostIds: result.ok });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getPostsByFollowers: async (
    followers: Array<string>,
    indexFrom: number,
    indexTo: number
  ): Promise<PostType[] | undefined> => {
    try {
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getPostsByFollowers(
        followers.map((handle) => {
          return handle.toLowerCase();
        }),
        indexFrom,
        indexTo
      );

      let posts = await fetchPostsByBuckets(keyProperties.posts, false);
      const totalCount = keyProperties.totalCount;

      if (posts?.length) {
        const postsWithAvatars = await mergeAuthorAvatars(posts);
        set({
          postsByFollowers: postsWithAvatars,
          postTotalCount: Number(totalCount) || 0,
        });
        return postsWithAvatars;
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getSubmittedForReviewPosts: async (handles: string[]): Promise<void> => {
    try {
      let postCoreCanister = await getPostCoreActor();
      let bucketCanisterIds =
        await postCoreCanister.getBucketCanisterIdsOfGivenHandles(handles);
      let promises: Promise<PostBucketType[]>[] = [];
      for (const bucketCanisterId of bucketCanisterIds) {
        let bucketActor = await getPostBucketActor(bucketCanisterId);
        promises.push(bucketActor.getSubmittedForReview(handles));
      }
      let results = (await Promise.all(promises)).flat(1);
      set({
        submittedForReviewPosts: results.map((postBucketReturn) => {
          return { ...postBucketReturn, views: '0', claps: '0', tags: [] };
        }),
      });
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getPostsByCategory: async (
    handle: string,
    category: string,
    indexFrom: number,
    indexTo: number
  ): Promise<PostType[] | undefined> => {
    try {
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getPostsByCategory(
        handle.toLowerCase(),
        category,
        indexFrom,
        indexTo
      );

      let posts = await fetchPostsByBuckets(keyProperties.posts, false);
      const totalCount = keyProperties.totalCount;

      if (posts?.length) {
        const postsWithAvatars = await mergeAuthorAvatars(posts);
        set({
          postsByFollowers: postsWithAvatars,
          postsByCategoryTotalCount: Number(totalCount) || 0,
        });
        return postsWithAvatars;
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  clearPostsByCategory: () => {
    set({ postsByCategory: undefined, postsByCategoryTotalCount: 0 });
  },

  clearPostsByFollowers: () => {
    set({ postsByFollowers: [] });
  },

  getPopularPosts: async (
    indexFrom: number,
    indexTo: number
  ): Promise<void> => {
    try {
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getPopular(indexFrom, indexTo);

      let posts = await fetchPostsByBuckets(keyProperties.posts, false);
      const totalCount = keyProperties.totalCount;

      if (posts?.length) {
        const postsWithAvatars = await mergeAuthorAvatars(posts);
        var existingPopularPosts = get().popularPosts;

        let addingPopularPosts = postsWithAvatars.filter((post) => {
          var valid = true;
          existingPopularPosts?.forEach((existingPost) => {
            if (existingPost.postId === post.postId) {
              valid = false;
            }
          });
          return valid;
        });
        if (existingPopularPosts) {
          set({
            popularPosts: [...existingPopularPosts, ...addingPopularPosts],
            postTotalCount: Number(totalCount) || 0,
          });
        } else {
          set({
            popularPosts: addingPopularPosts,
            postTotalCount: Number(totalCount) || 0,
          });
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },
  getPopularPostsToday: async (
    indexFrom: number,
    indexTo: number
  ): Promise<void> => {
    try {
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getPopularToday(indexFrom, indexTo);

      let posts = await fetchPostsByBuckets(keyProperties.posts, false);
      const totalCount = keyProperties.totalCount;

      if (posts?.length) {
        const postsWithAvatars = await mergeAuthorAvatars(posts);
        var existingPopularPosts = get().popularPostsToday;

        let addingPopularPosts = postsWithAvatars.filter((post) => {
          var valid = true;
          existingPopularPosts?.forEach((existingPost) => {
            if (existingPost.postId === post.postId) {
              valid = false;
            }
          });
          return valid;
        });
        if (existingPopularPosts) {
          set({
            popularPostsToday: [...existingPopularPosts, ...addingPopularPosts],
            postTotalCountToday: Number(totalCount) || 0,
          });
        } else {
          set({
            popularPostsToday: addingPopularPosts,
            postTotalCountToday: Number(totalCount) || 0,
          });
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },
  getPopularPostsThisWeek: async (
    indexFrom: number,
    indexTo: number
  ): Promise<void> => {
    try {
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getPopularThisWeek(
        indexFrom,
        indexTo
      );

      let posts = await fetchPostsByBuckets(keyProperties.posts, false);
      const totalCount = keyProperties.totalCount;

      if (posts?.length) {
        const postsWithAvatars = await mergeAuthorAvatars(posts);
        var existingPopularPosts = get().popularPostsThisWeek;
        let addingPopularPosts = postsWithAvatars.filter((post) => {
          var valid = true;
          existingPopularPosts?.forEach((existingPost) => {
            if (existingPost.postId === post.postId) {
              valid = false;
            }
          });
          return valid;
        });
        if (existingPopularPosts) {
          set({
            popularPostsThisWeek: [
              ...existingPopularPosts,
              ...addingPopularPosts,
            ],
            postTotalCountThisWeek: Number(totalCount) || 0,
          });
        } else {
          set({
            popularPostsThisWeek: addingPopularPosts,
            postTotalCountThisWeek: Number(totalCount) || 0,
          });
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },
  getPopularPostsThisMonth: async (
    indexFrom: number,
    indexTo: number
  ): Promise<void> => {
    try {
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getPopularThisMonth(
        indexFrom,
        indexTo
      );

      let posts = await fetchPostsByBuckets(keyProperties.posts, false);
      const totalCount = keyProperties.totalCount;

      if (posts?.length) {
        const postsWithAvatars = await mergeAuthorAvatars(posts);
        var existingPopularPosts = get().popularPostsThisMonth;

        let addingPopularPosts = postsWithAvatars.filter((post) => {
          var valid = true;
          existingPopularPosts?.forEach((existingPost) => {
            if (existingPost.postId === post.postId) {
              valid = false;
            }
          });
          return valid;
        });
        if (existingPopularPosts) {
          set({
            popularPostsThisMonth: [
              ...existingPopularPosts,
              ...addingPopularPosts,
            ],
            postTotalCountThisMonth: Number(totalCount) || 0,
          });
        } else {
          set({
            popularPostsThisMonth: addingPopularPosts,
            postTotalCountThisMonth: Number(totalCount) || 0,
          });
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getMyDraftPosts: async (
    indexFrom: number,
    indexTo: number
  ): Promise<PostType[] | undefined> => {
    try {
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getMyPosts(
        true, //includeDraft
        false, //includePublished
        indexFrom,
        indexTo
      );
      const myDraftPosts = await fetchPostsByBuckets(keyProperties, true);
      set({ myDraftPosts });

      const postsWithAvatars = await mergeAuthorAvatars(myDraftPosts);
      set({ myDraftPosts: postsWithAvatars });

      return myDraftPosts;
    } catch (err: any) {
      handleError(err, Unexpected);
    }
  },

  getMyPublishedPosts: async (
    indexFrom: number,
    indexTo: number
  ): Promise<PostType[] | undefined> => {
    try {
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getMyPosts(
        false, //includeDraft
        true, //includePublished
        indexFrom,
        indexTo
      );
      const myPublishedPosts = await fetchPostsByBuckets(keyProperties, false);
      set({ myPublishedPosts });

      const postsWithAvatars = await mergeAuthorAvatars(myPublishedPosts);
      set({ myPublishedPosts: postsWithAvatars });

      return myPublishedPosts;
    } catch (err: any) {
      handleError(err, Unexpected);
    }
  },

  getLatestPosts: async (indexFrom, indexTo): Promise<void> => {
    try {
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getLatestPosts(indexFrom, indexTo);
      let posts = await fetchPostsByBuckets(keyProperties.posts, false);
      const totalCount = keyProperties.totalCount;

      if (posts?.length) {
        const postsWithAvatars = await mergeAuthorAvatars(posts);
        set({
          latestPosts: postsWithAvatars,
          postTotalCount: Number(totalCount) || 0,
        });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  //get more latest posts similar to load more search results

  getMoreLatestPosts: async (indexFrom, indexTo): Promise<void> => {
    try {
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getMoreLatestPosts(
        indexFrom,
        indexTo
      );
      let moreLatestPosts = await fetchPostsByBuckets(keyProperties, false);

      moreLatestPosts = moreLatestPosts.sort(
        (a, b) => Number(b.postId) - Number(a.postId)
      );

      const postsWithAvatars = await mergeAuthorAvatars(moreLatestPosts);

      set({ moreLatestPosts: postsWithAvatars });
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  setSearchText: (searchText: string): void => {
    set({ searchText });
  },

  search: async (
    phrase: string,
    isTagSearch: boolean,
    indexFrom: number,
    indexTo: number,
    user: UserType | undefined
  ): Promise<void> => {
    try {
      const actor = await getPostIndexActor();
      const results = await actor.search(
        phrase,
        isTagSearch,
        indexFrom,
        indexTo
      );

      const postIds = results.postIds;
      if (results.totalCount === 'Search term is too long') {
        toastError('Search term is too long');
      }
      if (postIds?.length) {
        const coreActor = await getPostCoreActor();
        const keyProperties = await coreActor.getList(postIds);
        const posts = await fetchPostsByBuckets(keyProperties, false);

        if (posts?.length) {
          var draftCounter = 0;
          const postsWithAvatars = await mergeAuthorAvatars(
            posts.filter((post) => {
              if (post.isDraft) {
                if (post.isPublication) {
                  const userPublications = user?.publicationsArray.map(
                    (publicationObj) => {
                      if (publicationObj.isEditor) {
                        return publicationObj.publicationName;
                      }
                    }
                  );
                  const result = userPublications?.includes(post.handle);
                  if (!result) {
                    draftCounter = draftCounter + 1;
                  }
                  return result;
                } else {
                  const result = post.handle === user?.handle;
                  if (!result) {
                    draftCounter = draftCounter + 1;
                  }
                  return result;
                }
              } else {
                return true;
              }
            })
          );
          set({
            searchTotalCount: Number(results.totalCount || 0) - draftCounter,
            searchResults: postsWithAvatars,
          });
          return;
        }
      }

      set({
        searchTotalCount: 0,
        searchResults: [],
      });
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  searchWithinPublication: async (
    phrase: string,
    isTagSearch: boolean,
    indexFrom: number,
    indexTo: number,
    searchingPostIds: Array<string>,
    user: UserType | undefined
  ): Promise<void> => {
    try {
      const actor = await getPostIndexActor();
      const results = await actor.searchWithinPublication(
        phrase,
        isTagSearch,
        indexFrom,
        indexTo,
        searchingPostIds
      );
      const postIds = results.postIds;
      if (postIds?.length) {
        const coreActor = await getPostCoreActor();
        const keyProperties = await coreActor.getList(postIds);
        const posts = await fetchPostsByBuckets(keyProperties, false);

        if (posts?.length) {
          var draftCounter = 0;
          const postsWithAvatars = await mergeAuthorAvatars(
            posts.filter((post) => {
              if (post.isDraft) {
                if (post.isPublication) {
                  const userPublications = user?.publicationsArray.map(
                    (publicationObj) => {
                      if (publicationObj.isEditor) {
                        return publicationObj.publicationName;
                      }
                    }
                  );
                  const result = userPublications?.includes(post.handle);
                  if (!result) {
                    draftCounter = draftCounter + 1;
                  }
                  return result;
                } else {
                  const result = post.handle === user?.handle;
                  if (!result) {
                    draftCounter = draftCounter + 1;
                  }
                  return result;
                }
              } else {
                return true;
              }
            })
          );
          set({
            searchTotalCount: Number(results.totalCount || 0) - draftCounter,
            searchResults: postsWithAvatars,
          });
          return;
        }
      }

      set({
        searchTotalCount: 0,
        searchResults: [],
      });
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  populateTags: async (
    tags: Array<string>,
    indexFrom: number,
    indexTo: number
  ): Promise<void> => {
    try {
      const actor = await getPostIndexActor();
      const results = await actor.populateTags(tags, indexFrom, indexTo);
      const postIds = results.postIds;

      if (postIds?.length) {
        const coreActor = await getPostCoreActor();
        const keyProperties = await coreActor.getList(postIds);
        const posts = await fetchPostsByBuckets(keyProperties, true);

        if (posts?.length) {
          const postsWithAvatars = await mergeAuthorAvatars(posts);
          set({
            postTotalCount: Number(results.totalCount || 0),
            postResults: postsWithAvatars,
          });
          return;
        }
      }

      set({
        postTotalCount: 0,
        postResults: [],
      });
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  clearSearch: (): void => {
    set({ searchText: '', searchResults: undefined });
  },

  getAllTags: async (): Promise<void> => {
    try {
      if (!(get().allTags || []).length) {
        const allTags = await (await getPostCoreActor()).getAllTags();
        allTags.sort((a, b) => a.value.localeCompare(b.value));
        set({ allTags });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getMyTags: async (): Promise<PostTagModel[] | undefined> => {
    try {
      const myTags = await (await getPostCoreActor()).getMyTags();
      set({ myTags });
      return myTags;
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getTagsByUser: async (userId: string): Promise<void> => {
    try {
      const tagsByUser = await (await getPostCoreActor()).getTagsByUser(userId);
      set({ tagsByUser });
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  followTag: async (tagId: string): Promise<void> => {
    try {
      const result = await (await getPostCoreActor()).followTag(tagId);
      if (Err in result) {
        toastError(result.err);
      } else {
        await get().getMyTags();
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  clapPost: async (postId: string): Promise<void> => {
    try {
      const result = await (await getPostCoreActor()).clapPost(postId);
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  unfollowTag: async (tagId: string): Promise<void> => {
    try {
      const result = await (await getPostCoreActor()).unfollowTag(tagId);
      if (Err in result) {
        toastError(result.err);
      } else {
        await get().getMyTags();
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },
  getOwnersOfPremiumArticleReturnOnly: async (
    postId: string
  ): Promise<PremiumArticleOwners | undefined> => {
    try {
      const coreActor = await getPostCoreActor();
      const result = await coreActor.getPostKeyProperties(postId);
      if (Err in result) {
        toastError(result.err);
      } else {
        let post = result.ok;
        let publisherCanisterId = await usePublisherStore
          .getState()
          .getCanisterIdByHandle(post.handle);
        let publisherActor = await getPublisherActor(publisherCanisterId);
        let premiumArticleInformationResult =
          await publisherActor.getPremiumArticleInfo(postId);
        if (Err in premiumArticleInformationResult) {
          toastError(premiumArticleInformationResult.err);
        } else {
          try {
            let premiumArticleInformation = premiumArticleInformationResult.ok;
            let sellerAccount = premiumArticleInformation.sellerAccount;
            let extActor = await getExtActor(
              premiumArticleInformation.nftCanisterId
            );
            let registry = await extActor.getRegistry();
            let tokenIndexStart = parseInt(
              premiumArticleInformation.tokenIndexStart
            );
            let tokenIndexEnd =
              tokenIndexStart + parseInt(premiumArticleInformation.totalSupply);
            let registry_filtered = registry.filter((registryElement) => {
              return (
                registryElement[0] >= tokenIndexStart &&
                registryElement[0] < tokenIndexEnd &&
                registryElement[1] !== sellerAccount
              );
            });
            let account_ids = registry_filtered.map((registryElement) => {
              return registryElement[1];
            });
            let userActor = await getUserActor();
            let account_ids_to_handles =
              await userActor.getHandlesByAccountIdentifiers(account_ids);

            var owners_list: PremiumArticleOwner[] = [];
            var i = 0;
            while (i < registry_filtered.length) {
              let handle = account_ids_to_handles[i];
              let account_id = registry_filtered[i][1];
              let accessKeyIndex = (
                registry_filtered[i][0] -
                tokenIndexStart +
                1
              ).toString();
              owners_list.push({
                handle: handle,
                accountId: account_id,
                accessKeyIndex: accessKeyIndex,
              });
              i += 1;
            }
            let premiumArticleOwners: PremiumArticleOwners = {
              postId: postId,
              totalSupply: premiumArticleInformation.totalSupply,
              available: (
                parseInt(premiumArticleInformation.totalSupply) -
                registry_filtered.length
              ).toString(),
              ownersList: owners_list,
            };

            return premiumArticleOwners;
          } catch (err) {
            handleError(err, Unexpected);
          }
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },
  getOwnersOfPost: async (postId: string): Promise<void> => {
    try {
      const coreActor = await getPostCoreActor();
      const result = await coreActor.getPostKeyProperties(postId);
      if (Err in result) {
        toastError(result.err);
      } else {
        let post = result.ok;
        let publisherCanisterId = await usePublisherStore
          .getState()
          .getCanisterIdByHandle(post.handle);
        let publisherActor = await getPublisherActor(publisherCanisterId);
        let premiumArticleInformationResult =
          await publisherActor.getPremiumArticleInfo(postId);
        if (Err in premiumArticleInformationResult) {
          toastError(premiumArticleInformationResult.err);
        } else {
          try {
            let premiumArticleInformation = premiumArticleInformationResult.ok;
            let sellerAccount = premiumArticleInformation.sellerAccount;
            let extActor = await getExtActor(
              premiumArticleInformation.nftCanisterId
            );
            let registry = await extActor.getRegistry();
            let tokenIndexStart = parseInt(
              premiumArticleInformation.tokenIndexStart
            );
            let tokenIndexEnd =
              tokenIndexStart + parseInt(premiumArticleInformation.totalSupply);
            let registry_filtered = registry.filter((registryElement) => {
              return (
                registryElement[0] >= tokenIndexStart &&
                registryElement[0] < tokenIndexEnd &&
                registryElement[1] !== sellerAccount
              );
            });
            let account_ids = registry_filtered.map((registryElement) => {
              return registryElement[1];
            });
            let userActor = await getUserActor();
            let account_ids_to_handles =
              await userActor.getHandlesByAccountIdentifiers(account_ids);

            var owners_list: PremiumArticleOwner[] = [];
            var i = 0;
            while (i < registry_filtered.length) {
              let handle = account_ids_to_handles[i];
              let account_id = registry_filtered[i][1];
              let accessKeyIndex = (
                registry_filtered[i][0] -
                tokenIndexStart +
                1
              ).toString();
              owners_list.push({
                handle: handle,
                accountId: account_id,
                accessKeyIndex: accessKeyIndex,
              });
              i += 1;
            }
            let premiumArticleOwners: PremiumArticleOwners = {
              postId: postId,
              totalSupply: premiumArticleInformation.totalSupply,
              available: (
                parseInt(premiumArticleInformation.totalSupply) -
                registry_filtered.length
              ).toString(),
              ownersList: owners_list,
            };

            set({ ownersOfPremiumArticle: premiumArticleOwners });
          } catch (err) {
            handleError(err, Unexpected);
          }
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },
  getSellingNfts: async (): Promise<PremiumPostActivityListItem[]> => {
    const nftCanistersEntries = await (
      await getPostCoreActor()
    ).getNftCanisters();
    set({ nftCanistersEntries: nftCanistersEntries });
    let userActor = await getUserActor();

    let userWallet = await useAuthStore.getState().getUserWallet();
    let userHandle = useUserStore.getState().user?.handle || '';
    let userPrincipal = userWallet.principal;
    let userAccountId = userWallet.accountId;

    let publicationCanisterIds = await userActor.getPrincipalsByHandles(
      nftCanistersEntries.map((entry) => entry.handle)
    );

    let userSellingArticlesInformations = (
      await Promise.all(
        publicationCanisterIds.map(async (cai) => {
          let publisherActor = await getPublisherActor(cai);
          let informations =
            await publisherActor.getPremiumArticleInformationsByWriterHandle(
              userHandle
            );

          //fire and forget disperse icp methods
          informations.forEach((information) => {
            publisherActor.disperseIcpGainedFromPost(information.postId);
          });
          return informations;
        })
      )
    ).flat();

    let userControlledSellerAccounts = userSellingArticlesInformations.map(
      (information) => {
        return information.sellerAccount;
      }
    );

    //get transactions of each NFT canister
    let transactions = await Promise.all(
      nftCanistersEntries.map(async (canisterEntry) => {
        return {
          canisterId: canisterEntry.canisterId,
          handle: canisterEntry.handle,
          transactions: await (
            await getExtActor(canisterEntry.canisterId)
          ).transactions(),
        };
      })
    );

    //holds all the user transactions
    //key: nft canister id, value: transaction
    var userTransactions: Map<string, Transaction[]> = new Map();

    transactions.forEach((canister_transactions) => {
      let nft_canister_id = canister_transactions.canisterId;
      canister_transactions.transactions.forEach((transaction) => {
        if (userControlledSellerAccounts.includes(transaction.seller)) {
          let existingTransactions = userTransactions.get(nft_canister_id);
          if (existingTransactions) {
            userTransactions.set(nft_canister_id, [
              ...existingTransactions,
              transaction,
            ]);
          } else {
            userTransactions.set(nft_canister_id, [transaction]);
          }
        }
      });
    });
    var postActivityListItems: PremiumPostActivityListItem[] = [];

    //this user selling some articles
    for (const entry of nftCanistersEntries) {
      let canisterId = entry.canisterId;
      let user_transactions = userTransactions.get(canisterId);
      let sellingArticlesInformations = userSellingArticlesInformations.filter(
        (information) => {
          return information.nftCanisterId === canisterId;
        }
      );
      if (user_transactions?.length) {
        let coreActor = await getPostCoreActor();
        var postIds = sellingArticlesInformations.map((inf) => {
          return inf.postId;
        });
        let keyPropertiesReturn = await coreActor.getPostsByPostIds(postIds);
        let postsReturn = await fetchPostsByBuckets(keyPropertiesReturn, false);
        sellingArticlesInformations.forEach(async (information) => {
          let currentPost = postsReturn.find((post) => {
            return post.postId === information.postId;
          });
          let indexStart = parseInt(information.tokenIndexStart);

          if (user_transactions) {
            user_transactions.forEach((transaction) => {
              if (transaction.seller === information.sellerAccount) {
                postActivityListItems.push({
                  postId: information.postId,
                  title: currentPost?.title || '',
                  url: currentPost?.url || '',
                  writer: currentPost?.creator || '',
                  accessKeyIndex: (transaction.token - indexStart).toString(),
                  tokenIndex: transaction.token.toString(),
                  ownedByUser: false,
                  canisterId: canisterId,
                  date: Math.round(
                    Number(transaction.time) / 1000000
                  ).toString(),
                  totalSupply: information.totalSupply.toString(),
                  activity: '+ ' + icpPriceToString(transaction.price) + ' ICP',
                  userAccountId: userAccountId,
                });
              }
            });
          }
        });
      }
    }
    return postActivityListItems;
  },
  getOwnedNfts: async (): Promise<void> => {
    try {
      const nftCanistersEntries = await (
        await getPostCoreActor()
      ).getNftCanisters();
      set({ nftCanistersEntries: nftCanistersEntries });

      let userWallet = await useAuthStore.getState().getUserWallet();
      let userAccountId = userWallet.accountId;

      //get user owned tokens from each NFT canister
      let user_tokens = await Promise.all(
        nftCanistersEntries.map(async (canisterEntry) => {
          return {
            canisterId: canisterEntry.canisterId,
            handle: canisterEntry.handle,
            ownedTokens: await (
              await getExtActor(canisterEntry.canisterId)
            ).tokens_ext_metadata(userAccountId),
          };
        })
      );
      //holds the owned postIds
      var ownedPostIds: string[] = [];
      //holds the owned token indexes by canister ids of NFT canisters
      //key: Nft canister id, value: [TokenIndex, Metadata]
      var ownedTokens: Map<string, [number, Metadata, string][]> = new Map();

      user_tokens.forEach((user_tokens_return) => {
        if (!(Err in user_tokens_return.ownedTokens)) {
          let owned_tokens = user_tokens_return.ownedTokens.ok;
          let nft_canister_id = user_tokens_return.canisterId;
          owned_tokens.forEach((token) => {
            let existingIndexes = ownedTokens.get(
              user_tokens_return.canisterId
            );
            if (existingIndexes) {
              ownedTokens.set(nft_canister_id, [
                ...existingIndexes,
                [token[0], token[2], token[3]],
              ]);
            } else {
              ownedTokens.set(nft_canister_id, [
                [token[0], token[2], token[3]],
              ]);
            }
            let metadata = token[2];
            if ('nonfungible' in metadata) {
              let postId = metadata.nonfungible.asset;
              if (!ownedPostIds.includes(postId)) {
                ownedPostIds.push(postId);
              }
            }
          });
        }
      });

      set({ ownedPremiumPosts: ownedPostIds });

      //get transactions of each NFT canister
      let transactions = await Promise.all(
        nftCanistersEntries.map(async (canisterEntry) => {
          return {
            canisterId: canisterEntry.canisterId,
            handle: canisterEntry.handle,
            transactions: await (
              await getExtActor(canisterEntry.canisterId)
            ).transactions(),
          };
        })
      );

      //holds all the user transactions
      //key: nft canister id, value: transaction
      var userTransactions: Map<string, Transaction[]> = new Map();

      transactions.forEach((canister_transactions) => {
        let nft_canister_id = canister_transactions.canisterId;
        canister_transactions.transactions.forEach((transaction) => {
          if (
            transaction.buyer === userAccountId ||
            transaction.seller === userAccountId
          ) {
            let existingTransactions = userTransactions.get(nft_canister_id);
            if (existingTransactions) {
              userTransactions.set(nft_canister_id, [
                ...existingTransactions,
                transaction,
              ]);
            } else {
              userTransactions.set(nft_canister_id, [transaction]);
            }
          }
        });
      });

      var postActivityListItems: PremiumPostActivityListItem[] = [];

      //only reader
      nftCanistersEntries.forEach((entry) => {
        let owned_tokens = ownedTokens.get(entry.canisterId);
        if (owned_tokens) {
          owned_tokens.forEach((token) => {
            let tokenId = token[2];
            let tokenIndex = token[0];
            let canisterId = entry.canisterId;
            var [
              postId,
              accessKeyIndex,
              date,
              writer,
              title,
              totalSupply,
              url,
            ] = getFieldsFromMetadata(token[1]);
            var activity = '';
            let user_transactions = userTransactions.get(canisterId);
            if (user_transactions?.length) {
              //sort from newest to oldest
              let user_transactions_newest = user_transactions.reverse();

              var iter = 0;

              while (iter < user_transactions_newest.length) {
                let transaction = user_transactions_newest[iter];
                if (
                  transaction.token === tokenIndex &&
                  transaction.buyer === userAccountId
                ) {
                  activity =
                    '- ' + icpPriceToString(transaction.price) + ' ICP';
                  date = Math.round(
                    Number(transaction.time) / 1000000
                  ).toString();
                  break;
                }
                iter += 1;
              }
            }
            if (activity === '') {
              activity = 'Received';
            }
            postActivityListItems.push({
              postId: postId,
              title: title,
              url: url,
              writer: writer,
              accessKeyIndex: accessKeyIndex,
              tokenIndex: tokenIndex.toString(),
              ownedByUser: true,
              canisterId: canisterId,
              date: date,
              totalSupply: totalSupply,
              activity: activity,
              userAccountId: userAccountId,
              tokenIdentifier: tokenId,
            });
          });
        }
      });

      set({ premiumPostsActivities: postActivityListItems });
    } catch (error) {
      console.log(error);
    }
  },

  getMyBalance: async (): Promise<bigint | undefined> => {
    let ledgerActor = await getLedgerActor();
    let authStore = useAuthStore?.getState();
    if (authStore.loginMethod === 'bitfinity') {
      let window_any = window as any;

      let principal =
        (await window_any.ic.bitfinityWallet.getPrincipal()) as Principal;
      let userAccountId = AccountIdentifier.fromPrincipal({
        principal,
      });
      let balance = await ledgerActor.account_balance({
        account: userAccountId.toNumbers(),
      });
      return balance.e8s;
    }
    let identity = await authStore.getIdentity();
    if (identity) {
      let userAccountId = AccountIdentifier.fromPrincipal({
        principal: identity.getPrincipal(),
      });
      let balance = await ledgerActor.account_balance({
        account: userAccountId.toNumbers(),
      });
      return balance.e8s;
    }
  },

  lockToken: async (
    tokenId: string,
    price: bigint,
    canisterId: string,
    buyerAccountId: string | undefined
  ): Promise<LockTokenReturn> => {
    let authStore = useAuthStore?.getState();
    let identity = await authStore.getIdentity();
    let isLoggedIn = authStore.isLoggedIn;
    if (isLoggedIn && identity) {
      let ledgerActor = await getLedgerActor();
      let extActor = await getExtActor(canisterId);
      let userAccountId: AccountIdentifier;
      if (buyerAccountId) {
        userAccountId = AccountIdentifier.fromHex(buyerAccountId);
      } else {
        userAccountId = AccountIdentifier.fromPrincipal({
          principal: identity.getPrincipal(),
          subAccount: undefined,
        });
      }

      let balance = await ledgerActor.account_balance({
        account: userAccountId.toNumbers(),
      });

      //check if the account id is anonymous
      if (
        userAccountId.toHex() ===
        '1c7a48ba6a562aa9eaa2481a9049cdf0433b9738c992d698c31d8abf89cadc79'
      ) {
        return {
          err: 'Please refresh the page and try again.',
          balance: balance.e8s,
        };
      }
      if (balance.e8s <= price) {
        //balance is unsufficient
        return {
          err: 'Unsufficient balance',
          balance: balance.e8s,
        };
      }
      let sellerAccount = await extActor.lock(
        tokenId,
        price,
        userAccountId.toHex(),
        new Uint8Array()
      );
      if (Err in sellerAccount) {
        if ('InvalidToken' in sellerAccount.err) {
          return {
            balance: balance.e8s,
            err: `Invalid token`,
          };
        } else {
          return {
            balance: balance.e8s,
            err: sellerAccount.err.Other,
          };
        }
      } else {
        return {
          balance: balance.e8s,
          sellerAccountId: sellerAccount.ok,
        };
      }
    } else {
      return {
        err: 'login',
      };
    }
  },
  checkTipping : async (postId: string, bucketCanisterId: string): Promise<void> => {
    try {
      await (await getPostBucketActor(bucketCanisterId)).checkTipping(postId);
    } catch (error) {
      console.log(error)
    }
  },

  checkTippingByTokenSymbol : async (postId: string, tokenSymbol: SupportedTokenSymbol, bucketCanisterId: string): Promise<void> => {
    try {
      let response = await(
        await getPostBucketActor(bucketCanisterId)
      ).checkTippingByTokenSymbol(postId, tokenSymbol, '');
      console.log(response);
    } catch (error) {
      console.log(error)
    }
  },

  transferICRC1Token: async (
    amount: number,
    receiver: string,
    canisterId: string,
    fee: number,
    subaccountIndex?: number
  ): Promise<Icrc1TransferResult> => {
    let tokenActor = await getIcrc1Actor(canisterId);
    return await tokenActor.icrc1_transfer({
      to: {
        owner: Principal.fromText(receiver),
        subaccount: subaccountIndex ? [toBase256(subaccountIndex, 32)] : [],
      },
      fee: [BigInt(fee)],
      memo: [],
      from_subaccount: [],
      created_at_time: [],
      amount: BigInt(amount),
    });
  },
  transferIcp: async (
    amount: bigint,
    receiver: string
  ): Promise<TransferResult> => {
    let ledgerActor = await getLedgerActor();
    let receiverAccount = AccountIdentifier.fromHex(receiver).toNumbers();
    return await ledgerActor.transfer({
      to: receiverAccount,
      fee: { e8s: BigInt(10000) },
      memo: BigInt(0),
      amount: { e8s: amount },
      from_subaccount: [],
      created_at_time: [],
    });
  },

  transferNft: async (
    tokenIdentifier: string,
    senderAccount: string,
    receiverAccount: string,
    canisterId: string
  ): Promise<string> => {
    let extActor = await getExtActor(canisterId);

    try {
      let result = await extActor.ext_transfer({
        to: { address: receiverAccount },
        token: tokenIdentifier,
        notify: false,
        from: { address: senderAccount },
        memo: new Uint8Array(0),
        subaccount: [],
        amount: BigInt(1),
      });
      if ('ok' in result) {
        await get().getOwnedNfts();
        return 'Success';
      } else {
        return 'Error';
      }
    } catch (error) {
      handleError(error, Unexpected);
      return 'Error';
    }
  },

  settleToken: async (
    tokenId: string,
    canisterId: string,
    handle: string
  ): Promise<string> => {
    const publisherCanisterId = await usePublisherStore
      .getState()
      .getCanisterIdByHandle(handle);
    let publisherActor = await getPublisherActor(publisherCanisterId);

    let extActor = await getExtActor(canisterId);
    let settleResult = await extActor.settle(tokenId);

    if (Err in settleResult) {
      toastError(settleResult.err);
      return 'error';
    } else {
      //will remove this line after we go live on ic because toniq will handle this by calling external_heartbeat method
      extActor.heartbeat_disbursements().then(() => {
        console.log('disbursed');
        publisherActor.disperseIcpTimerMethod().then(() => {
          console.log('dispersed');
        });
      });
      toast('Success!', ToastType.Success);
      return 'success';
    }
  },

  getUserDailyPostStatus: async (): Promise<boolean> => {
    return await (await getPostCoreActor()).getMyDailyPostsStatus();
  },

  clearAll: (): void => {
    set({}, true);
  },
});

export const usePostStore = create<PostStore>(
  persist(
    (set, get, api) => ({
      ...createPostStore(
        set as SetState<PostStore>,
        get as GetState<PostStore>,
        api as StoreApi<PostStore>
      ),
    }),
    {
      name: 'postStore',
      getStorage: () => sessionStorage,
    }
  )
);
