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
  ApplaudListItem,
  TransactionListItem,
  UserListItem,
  ClaimTransactionHistoryItem,
  MoreFromThisAuthor,
} from '../types/types';
import {
  getPostRelationsActor,
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
  getIcpIndexCanister,
  getIcrc1TokenActorAnonymous,
  getIcrc1IndexCanister,
  getIcrc1ArchiveCanister,
} from '../services/actorService';
import { AccountIdentifier, LedgerCanister } from '@dfinity/ledger-icp';
import {
  Result as Icrc1TransferResult,
  TransactionRange,
  Transfer,
} from '../services/icrc1/icrc1.did';
import { Transaction as ArchiveTransaction } from '../services/icrc1-archive/icrc1-archive.did';
import { TransferResult } from '../services/ledger-service/Ledger.did';
import { downscaleImage } from '../components/quill-text-editor/modules/quill-image-compress/downscaleImage';
import { Metadata, Transaction } from '../services/ext-service/ext_v2.did';
import {
  areUint8ArraysEqual,
  getFieldsFromMetadata,
  icpPriceToString,
  toBase256,
} from '../shared/utils';
import { Principal } from '@dfinity/principal';
import { PostKeyProperties } from '../../declarations/PostCore/PostCore.did';
import {
  Applaud,
  Comment,
  PostBucketType,
  PostBucketType__1,
  SaveCommentModel,
} from '../../../src/declarations/PostBucket/PostBucket.did';
import Comments from '../components/comments/comments';
import {
  NUA_CANISTER_ID,
  SupportedTokenSymbol,
  ckBTC_CANISTER_ID,
  ckBTC_INDEX_CANISTER_ID,
} from '../shared/constants';
import { canisterId as userCanisterId } from '../../declarations/User';
import { canisterId as subscriptionCanisterId } from '../../declarations/Subscription';
import { Agent } from '@dfinity/agent';
global.fetch = fetch;

const Err = 'err';
const Unexpected = 'Unexpected error: ';
const ArticleNotFound = 'Article not found';
type GetPopularReturnType = { posts: PostType[]; totalCount: number };

const isLocal: boolean =
  window.location.origin.includes('localhost') ||
  window.location.origin.includes('127.0.0.1');

// fetch and merge author avatars into a list of posts
const mergeAuthorAvatars = async (posts: PostType[]): Promise<PostType[]> => {
  var authorHandles = posts.map((p) => {
    if (p.creatorHandle) {
      return p.creatorHandle.toLowerCase();
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
        return a.handle.toLowerCase() === p.creatorHandle.toLowerCase();
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
      return { ...p, avatar: author.avatar, isVerified: author.isVerified };
    }

    return p;
  });
};

const getAllPrincipalIdsInComments = (comments: Comment[]) => {
  let creators: Set<string> = new Set();
  comments.forEach((comment) => {
    creators.add(comment.creator);
    if (comment.replies.length > 0) {
      let replyPrincipals = getAllPrincipalIdsInComments(comment.replies);
      replyPrincipals.forEach(replyPrincipal => {
        creators.add(replyPrincipal)
      })
    }
  });
  return Array.from(creators);
};

const enrichComments = (
  comments: Comment[],
  userListItemsMap: Map<string, UserListItem>
): Comment[] => {
  let result: Comment[] = [];
  for (const comment of comments) {
    let userListItem = userListItemsMap.get(comment.creator) as UserListItem;
    if (comment.replies.length === 0) {
      //no reply, just update the avatar and handle fields
      result.push({
        ...comment,
        avatar: userListItem.avatar,
        handle: userListItem.handle,
        isVerified: userListItem.isVerified,
      });
    } else {
      result.push({
        ...comment,
        avatar: userListItem.avatar,
        handle: userListItem.handle,
        isVerified: userListItem.isVerified,
        replies: enrichComments(comment.replies, userListItemsMap),
      });
    }
  }
  return result;
};

async function mergeCommentsWithUsers(comments: Comment[]): Promise<Comment[]> {
  const usersCache = new Map<string, UserListItem>();

  let allPrincipalIds = getAllPrincipalIdsInComments(comments);
  let userActor = await getUserActor();
  let userListItems = await userActor.getUsersByPrincipals(allPrincipalIds);
  for (const userListItem of userListItems) {
    usersCache.set(userListItem.principal, userListItem);
  }
  //now, rebuild the comments array
  let result = enrichComments(comments, usersCache);
  return result;
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
    let keyProperties = postIdToKeyPropertiesMap.get(
      bucketType.postId
    ) as PostKeyProperties;
    return { ...keyProperties, ...bucketType } as PostType;
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
  myAllPosts: PostType[] | undefined;
  submittedForReviewPosts: PostType[] | undefined;
  plannedPosts: PostType[] | undefined;
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

  savePost: (post: PostSaveModel, agent?: Agent) => Promise<PostType | undefined>;
  getSavedPost: (postId: string) => Promise<void>;
  getSavedPostReturnOnly: (
    postId: string,
    includePremiumInfo?: boolean
  ) => Promise<PostType | undefined>;
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
  getMyAllPosts: (
    indexFrom: number,
    indexTo: number
  ) => Promise<PostType[] | undefined>;
  getMySubmittedForReviewPosts: (
    indexFrom: number,
    indexTo: number
  ) => Promise<PostType[] | undefined>;
  getMyPlannedPosts: (
    indexFrom: number,
    indexTo: number
  ) => Promise<PostType[] | undefined>;
  getLatestPosts: (
    indexFrom: number,
    indexTo: number,
    agent?: Agent
  ) => Promise<{
    posts: PostType[];
    totalCount: number;
  }>;
  getMoreLatestPosts: (indexFrom: number, indexTo: number) => Promise<void>;
  getPostsByFollowers: (
    followers: Array<string>,
    indexFrom: number,
    indexTo: number,
    agent?: Agent
  ) => Promise<{ posts: PostType[]; totalCount: number }>;
  getPostsByCategory: (
    handle: string,
    category: string,
    indexFrom: number,
    indexTo: number
  ) => Promise<PostType[] | undefined>;
  clearPostsByCategory: () => void;
  clearPostsByFollowers: () => void;
  clapPost: (postId: string) => Promise<void>;
  clearSearchBar: (isTagScreen: boolean) => void;
  getPopularPosts: (
    indexFrom: number,
    indexTo: number,
    agent?: Agent
  ) => Promise<GetPopularReturnType>;
  getPopularPostsToday: (
    indexFrom: number,
    indexTo: number,
    agent?: Agent
  ) => Promise<GetPopularReturnType>;
  getPopularPostsThisWeek: (
    indexFrom: number,
    indexTo: number,
    agent?: Agent
  ) => Promise<GetPopularReturnType>;
  getPopularPostsThisMonth: (
    indexFrom: number,
    indexTo: number,
    agent?: Agent
  ) => Promise<GetPopularReturnType>;
  clerGetPublicationPostError: () => Promise<void>;
  setSearchText: (searchText: string) => void;
  search: (
    phrase: string,
    isTagSearch: boolean,
    indexFrom: number,
    indexTo: number,
    user: UserType | undefined
  ) => Promise<{ totalCount: number; posts: PostType[] }>;
  searchWithinPublication: (
    phrase: string,
    isTagSearch: boolean,
    indexFrom: number,
    indexTo: number,
    publicationHandle: string,
    user: UserType | undefined
  ) => Promise<{ totalCount: number; posts: PostType[] }>;
  getFollowingTagsPosts: (
    indexStart: number,
    indexEnd: number
  ) => Promise<{
    posts: PostType[];
    totalCount: number;
  }>;
  clearSearch: () => void;
  getWordCount: (postId: string) => Promise<void>;
  clearWordCount: () => void;
  getAllTags: () => Promise<TagModel[]>;
  getMyTags: () => Promise<PostTagModel[] | undefined>;
  getTagsByUser: (userId: string) => Promise<void>;
  followTag: (tag: string) => Promise<void>;
  unfollowTag: (tag: string) => Promise<void>;
  getOwnersOfPremiumArticleReturnOnly: (
    postId: string
  ) => Promise<PremiumArticleOwners | undefined>;
  lockToken: (
    tokenId: string,
    price: bigint,
    canisterId: string,
    buyerAccountId: string
  ) => Promise<string | undefined>;
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
  getApplaudedHandles: (
    postId: string,
    bucketCanisterId: string
  ) => Promise<string[]>;
  getUserApplauds: (agent?: Agent) => Promise<ApplaudListItem[]>;
  getUserIcpTransactions: () => Promise<TransactionListItem[]>;
  getUserNuaTransactions: () => Promise<TransactionListItem[]>;
  getUserCkbtcTransactions: () => Promise<TransactionListItem[]>;
  getUserRestrictedNuaTransactions: () => Promise<
    ClaimTransactionHistoryItem[]
  >;
  settleToken: (
    tokenId: string,
    canisterId: string
  ) => Promise<string | undefined>;
  migratePostToPublication: (
    postId: string,
    publicationHandle: string,
    isDraft: boolean
  ) => Promise<PostType | undefined>;

  getOwnedNfts: (
    userAccountId: string,
    agent?: Agent
  ) => Promise<PremiumPostActivityListItem[]>;
  getSellingNfts: (
    userAccountId: string,
    agent?: Agent
  ) => Promise<PremiumPostActivityListItem[]>;
  transferNft: (
    tokenIdentifier: string,
    senderAccount: string,
    receiverAccount: string,
    canisterId: string
  ) => Promise<string>;

  getUserDailyPostStatus: () => Promise<boolean>;
  getPostComments: (
    postId: string,
    bucketCanisterId: string
  ) => Promise<[Comment[], number]>;
  getMoreFromThisAuthor: (post: PostType) => Promise<MoreFromThisAuthor>;
  getRelatedArticles: (post: string) => Promise<PostType[]>;
  saveComment: (
    commentModel: SaveCommentModel,
    bucketCanisterId: string,
    edited: boolean
  ) => Promise<[Comment[], number] | undefined>;
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
  reportComment: (commentId: string, bucketCanisterId: string) => Promise<void>;
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
  myAllPosts: undefined,
  submittedForReviewPosts: undefined,
  plannedPosts: undefined,
  claps: undefined,
  ClearSearchBar: false,
  isTagScreen: false,

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
  ): Promise<[Comment[], number]> => {
    try {
      const result = await (
        await getPostBucketActor(bucketCanisterId)
      ).getPostComments(postId);
      if (Err in result) {
        toastError(result.err);
      } else {
        let commentsWithUsers = await mergeCommentsWithUsers(
          result.ok.comments
        );
        return [commentsWithUsers, parseInt(result.ok.totalNumberOfComments)];
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
    return [[], 0];
  },

  getMoreFromThisAuthor: async (
    post: PostType
  ): Promise<MoreFromThisAuthor> => {
    try {
      let postCoreActor = await getPostCoreActor();
      if (post.isPublication) {
        let result = await postCoreActor.getMoreArticlesFromUsers(post.postId, [
          post.creatorHandle.toLowerCase(),
          post.handle.toLowerCase(),
        ]);
        let posts = await fetchPostsByBuckets(
          [...result[0], ...result[1]],
          false
        );
        return {
          authorArticles: posts.slice(0, result[0].length),
          publicationArticles: posts.slice(result[0].length),
        };
      } else {
        let result = await postCoreActor.getMoreArticlesFromUsers(post.postId, [
          post.handle.toLowerCase(),
        ]);
        let posts = await fetchPostsByBuckets(result[0], false);
        return {
          authorArticles: posts,
          publicationArticles: [],
        };
      }
    } catch (err) {
      handleError(err, Unexpected);
      return {
        authorArticles: [],
        publicationArticles: [],
      };
    }
  },

  getRelatedArticles: async (postId: string): Promise<PostType[]> => {
    try {
      let postCoreActor = await getPostCoreActor();
      let postRelationsActor = await getPostRelationsActor();
      let postIds = await postRelationsActor.getRelatedPosts(postId);
      //remove the post's itself from the array
      postIds = postIds.filter((pId) => {
        return postId !== pId;
      });
      //use the first 50 elements only
      postIds = postIds.slice(0, 50);
      //get the key properties
      let keyProperties = await postCoreActor.getPostsByPostIds(postIds);
      let posts = await fetchPostsByBuckets(keyProperties.slice(0, 5), false);
      return posts;
    } catch (err) {
      handleError(err, Unexpected);
      return [];
    }
  },

  reportComment: async (
    commentId: string,
    bucketCanisterId: string
  ): Promise<void> => {
    try {
      toast('Reporting comment...', ToastType.Loading);
      const result = await (
        await getPostBucketActor(bucketCanisterId)
      ).reportComment(commentId);
      if (Err in result) {
        toastError(result.err);
      } else {
        toast('Comment reported!', ToastType.Success);
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  saveComment: async (
    commentModel: SaveCommentModel,
    bucketCanisterId: string,
    edited: boolean
  ): Promise<[Comment[], number] | undefined> => {
    try {
      const result = await (
        await getPostBucketActor(bucketCanisterId)
      ).saveComment(commentModel);
      if (Err in result) {
        toastError(result.err);
      } else {
        //merge the comments with the users
        let mergedComments = await mergeCommentsWithUsers(result.ok.comments);
        //toast the messages
        if (
          edited ||
          (commentModel.commentId && commentModel.commentId.length > 0)
        ) {
          toast(
            'The changes on your comment have been saved.',
            ToastType.Success
          );
        } else {
          toast('You posted a comment!', ToastType.Success);
        }
        //return the new comments
        return [mergedComments, parseInt(result.ok.totalNumberOfComments)];
      }
    } catch (err) {
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

  savePost: async (post: PostSaveModel, agent?: Agent): Promise<PostType | undefined> => {
    try {
      const result = await (await getPostCoreActor(agent)).save(post);
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
        const bucketReturn = await bucketActor.getPostCompositeQuery(postId);
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
    postId: string,
    includePremiumInfo?: boolean
  ): Promise<PostType | undefined> => {
    try {
      const coreActor = await getPostCoreActor();
      const coreReturn = await coreActor.getPostKeyProperties(postId);
      if (Err in coreReturn) {
        toastError(coreReturn.err);
      } else {
        let bucketCanisterId = coreReturn.ok.bucketCanisterId;
        let bucketActor = await getPostBucketActor(bucketCanisterId);
        const bucketReturn = await bucketActor.getPostCompositeQuery(postId);
        if (Err in bucketReturn) {
          handleError(bucketReturn.err);
        } else {
          let user = useUserStore.getState().user;
          let bucketResult = bucketReturn.ok;
          if (
            user?.handle === bucketResult.handle ||
            user?.handle === bucketResult.creatorHandle ||
            isUserEditor(bucketResult.handle, user)
          ) {
            let savedPost = {
              ...bucketResult,
              ...coreReturn.ok,
            } as PostType;
            if (
              includePremiumInfo &&
              savedPost.nftCanisterId &&
              savedPost.nftCanisterId.length !== 0
            ) {
              let nftCanisterId = savedPost.nftCanisterId[0];
              let extActor = await getExtActor(nftCanisterId);
              let response = await extActor.getAvailableToken();
              savedPost = {
                ...savedPost,
                premiumArticleSaleInfo: {
                  tokenIndex:
                    response.availableTokenIndex.length !== 0
                      ? response.availableTokenIndex[0]
                      : 0,
                  totalSupply: Number(response.maxSupply),
                  nftCanisterId,
                  currentSupply: Number(response.currentSupply),
                  price_e8s: Number(response.price),
                  priceReadable: (
                    Number(response.price) / Math.pow(10, 8)
                  ).toFixed(4),
                },
              };
            }
            return savedPost;
          }
        }
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
    return;
  },

  clearSavedPost: async (): Promise<void> => {
    set({ savedPost: undefined, publicationPost: undefined });
  },

  clearSavedPostError: async (): Promise<void> => {
    set({ getSavedPostError: undefined });
  },

  clerGetPublicationPostError: async () => {
    set({ getPublicationPostError: undefined });
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
          (
            await getPostBucketActor(bucketCanisterId)
          ).getPostCompositeQuery(postId),
        ]);

        if (Err in authorResult) {
          set({ getPostError: `User not found for @${handle}` });
          toastError(authorResult.err);
        } else if (Err in coreReturn) {
          set({ getPostError: coreReturn.err });
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
              if (
                post.nftCanisterId?.length !== 0 &&
                post.content.length === 0
              ) {
                //premium post and user is not authorized to see
                //fetch the sale info and merge with post
                let nftCanisterId = post.nftCanisterId?.[0] as string;
                let extActor = await getExtActor(nftCanisterId);
                let response = await extActor.getAvailableToken();
                set({
                  post: {
                    ...post,
                    premiumArticleSaleInfo: {
                      tokenIndex:
                        response.availableTokenIndex.length !== 0
                          ? response.availableTokenIndex[0]
                          : 0,
                      totalSupply: Number(response.maxSupply),
                      nftCanisterId,
                      currentSupply: Number(response.currentSupply),
                      price_e8s: Number(response.price),
                      priceReadable: (
                        Number(response.price) / Math.pow(10, 8)
                      ).toFixed(4),
                    },
                  },
                  author,
                  getPostError: undefined,
                });
              } else {
                set({ post, author, getPostError: undefined });
              }
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
        let postResult = await bucketActor.getPostCompositeQuery(postId);
        if (Err in postResult) {
          set({ getPostError: postResult.err });
          toastError(postResult.err);
        } else {
          const post = { ...postResult.ok, ...coreReturn.ok } as PostType;
          const author = authorResult.ok as User;
          if (author.handle !== post.handle) {
            set({ getPostError: `Article not found for @${handle}` });
          } else {
            if (post.nftCanisterId?.length !== 0 && post.content.length === 0) {
              //premium post and user is not authorized to see
              //fetch the sale info and merge with post
              let nftCanisterId = post.nftCanisterId?.[0] as string;
              let extActor = await getExtActor(nftCanisterId);
              let response = await extActor.getAvailableToken();
              set({
                post: {
                  ...post,
                  premiumArticleSaleInfo: {
                    tokenIndex:
                      response.availableTokenIndex.length !== 0
                        ? response.availableTokenIndex[0]
                        : 0,
                    totalSupply: Number(response.maxSupply),
                    nftCanisterId,
                    currentSupply: Number(response.currentSupply),
                    price_e8s: Number(response.price),
                    priceReadable: (
                      Number(response.price) / Math.pow(10, 8)
                    ).toFixed(4),
                  },
                },
                author,
                getPostError: undefined,
              });
            } else {
              set({ post, author, getPostError: undefined });
            }
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
    indexTo: number,
    agent?: Agent
  ): Promise<{ posts: PostType[]; totalCount: number }> => {
    try {
      const coreActor = await getPostCoreActor(agent);
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
        return { posts: postsWithAvatars, totalCount: parseInt(totalCount) };
      }
      return { posts: [], totalCount: 0 };
    } catch (err) {
      handleError(err, Unexpected);
      return { posts: [], totalCount: 0 };
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
    indexTo: number,
    agent?: Agent
  ): Promise<GetPopularReturnType> => {
    try {
      const coreActor = await getPostCoreActor(agent);
      const keyProperties = await coreActor.getPopular(indexFrom, indexTo);

      let posts = await fetchPostsByBuckets(keyProperties.posts, false);
      const totalCount = parseInt(keyProperties.totalCount);
      const postsWithAvatars = await mergeAuthorAvatars(posts);
      return { posts: postsWithAvatars, totalCount };
    } catch (err) {
      handleError(err, Unexpected);
      return { posts: [], totalCount: 0 };
    }
  },
  getPopularPostsToday: async (
    indexFrom: number,
    indexTo: number,
    agent?: Agent
  ): Promise<GetPopularReturnType> => {
    try {
      const coreActor = await getPostCoreActor(agent);
      const keyProperties = await coreActor.getPopularToday(indexFrom, indexTo);

      let posts = await fetchPostsByBuckets(keyProperties.posts, false);
      const totalCount = parseInt(keyProperties.totalCount);
      const postsWithAvatars = await mergeAuthorAvatars(posts);
      return { posts: postsWithAvatars, totalCount };
    } catch (err) {
      handleError(err, Unexpected);
      return { posts: [], totalCount: 0 };
    }
  },
  getPopularPostsThisWeek: async (
    indexFrom: number,
    indexTo: number,
    agent?: Agent
  ): Promise<GetPopularReturnType> => {
    try {
      const coreActor = await getPostCoreActor(agent);
      const keyProperties = await coreActor.getPopularThisWeek(
        indexFrom,
        indexTo
      );

      let posts = await fetchPostsByBuckets(keyProperties.posts, false);
      const totalCount = parseInt(keyProperties.totalCount);
      const postsWithAvatars = await mergeAuthorAvatars(posts);
      return { posts: postsWithAvatars, totalCount };
    } catch (err) {
      handleError(err, Unexpected);
      return { posts: [], totalCount: 0 };
    }
  },
  getPopularPostsThisMonth: async (
    indexFrom: number,
    indexTo: number,
    agent?: Agent
  ): Promise<GetPopularReturnType> => {
    try {
      const coreActor = await getPostCoreActor(agent);
      const keyProperties = await coreActor.getPopularThisMonth(
        indexFrom,
        indexTo
      );

      let posts = await fetchPostsByBuckets(keyProperties.posts, false);
      const totalCount = parseInt(keyProperties.totalCount);
      const postsWithAvatars = await mergeAuthorAvatars(posts);
      return { posts: postsWithAvatars, totalCount };
    } catch (err) {
      handleError(err, Unexpected);
      return { posts: [], totalCount: 0 };
    }
  },

  getMyDraftPosts: async (
    indexFrom: number,
    indexTo: number
  ): Promise<PostType[] | undefined> => {
    try {
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getMyDraftPosts(indexFrom, indexTo);
      const myDraftPosts = await fetchPostsByBuckets(keyProperties, true);
      set({ myDraftPosts });

      const postsWithAvatars = await mergeAuthorAvatars(myDraftPosts);
      set({ myDraftPosts: postsWithAvatars });

      return postsWithAvatars;
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
      const keyProperties = await coreActor.getMyPublishedPosts(
        indexFrom,
        indexTo
      );
      const myPublishedPosts = await fetchPostsByBuckets(keyProperties, false);
      set({ myPublishedPosts });

      const postsWithAvatars = await mergeAuthorAvatars(myPublishedPosts);
      set({ myPublishedPosts: postsWithAvatars });

      return postsWithAvatars;
    } catch (err: any) {
      handleError(err, Unexpected);
    }
  },

  getMySubmittedForReviewPosts: async (
    indexFrom: number,
    indexTo: number
  ): Promise<PostType[] | undefined> => {
    try {
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getMySubmittedToReviewPosts(
        indexFrom,
        indexTo
      );
      const submittedForReviewPosts = await fetchPostsByBuckets(
        keyProperties,
        true
      );
      set({ submittedForReviewPosts });

      const postsWithAvatars = await mergeAuthorAvatars(
        submittedForReviewPosts
      );
      set({ submittedForReviewPosts: postsWithAvatars });

      return postsWithAvatars;
    } catch (err: any) {
      handleError(err, Unexpected);
    }
  },

  getMyPlannedPosts: async (
    indexFrom: number,
    indexTo: number
  ): Promise<PostType[] | undefined> => {
    try {
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getMyPlannedPosts(
        indexFrom,
        indexTo
      );
      const plannedPosts = await fetchPostsByBuckets(keyProperties, true);
      set({ plannedPosts });

      const postsWithAvatars = await mergeAuthorAvatars(plannedPosts);
      set({ submittedForReviewPosts: postsWithAvatars });

      return postsWithAvatars;
    } catch (err: any) {
      handleError(err, Unexpected);
    }
  },

  getMyAllPosts: async (
    indexFrom: number,
    indexTo: number
  ): Promise<PostType[] | undefined> => {
    try {
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getMyAllPosts(indexFrom, indexTo);
      const myAllPosts = await fetchPostsByBuckets(keyProperties, true);
      set({ myAllPosts });

      const postsWithAvatars = await mergeAuthorAvatars(myAllPosts);
      set({ myAllPosts: postsWithAvatars });

      return postsWithAvatars;
    } catch (err: any) {
      handleError(err, Unexpected);
    }
  },

  getLatestPosts: async (
    indexFrom,
    indexTo,
    agent?: Agent
  ): Promise<{
    posts: PostType[];
    totalCount: number;
  }> => {
    try {
      const coreActor = await getPostCoreActor(agent);
      const keyProperties = await coreActor.getLatestPosts(indexFrom, indexTo);
      let posts = await fetchPostsByBuckets(keyProperties.posts, false);
      const totalCount = keyProperties.totalCount;
      if (posts?.length) {
        const postsWithAvatars = await mergeAuthorAvatars(posts);
        set({
          latestPosts: postsWithAvatars,
          postTotalCount: Number(totalCount) || 0,
        });
        return { posts: postsWithAvatars, totalCount: Number(totalCount) || 0 };
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
    return { posts: [], totalCount: 0 };
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
  ): Promise<{ totalCount: number; posts: PostType[] }> => {
    try {
      console.log('searching...');
      console.log('arguments: ', phrase, isTagSearch, indexFrom, indexTo, user);
      const actor = await getPostRelationsActor();
      let postIds: string[] = [];
      if (isTagSearch) {
        postIds = await actor.searchByTag(phrase.toLowerCase());
      } else {
        postIds = await actor.searchPost(phrase);
      }
      console.log('postIds: ', postIds);
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getPostsByPostIds(
        postIds.slice(indexFrom, indexTo)
      );
      console.log('keyProperties: ', keyProperties);
      const posts = await fetchPostsByBuckets(keyProperties, false);
      console.log('posts: ', posts);
      if (posts?.length) {
        const postsWithAvatars = await mergeAuthorAvatars(posts);

        set({
          searchTotalCount: postIds.length,
          searchResults: postsWithAvatars,
        });
        return {
          totalCount: postIds.length,
          posts: postsWithAvatars,
        };
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
    return { totalCount: 0, posts: [] };
  },

  searchWithinPublication: async (
    phrase: string,
    isTagSearch: boolean,
    indexFrom: number,
    indexTo: number,
    publicationHandle: string,
    user: UserType | undefined
  ): Promise<{ totalCount: number; posts: PostType[] }> => {
    try {
      console.log(
        'searchWithinPublication arguments: ',
        phrase,
        isTagSearch,
        indexFrom,
        indexTo,
        publicationHandle
      );
      const actor = await getPostRelationsActor();
      let postIds: string[] = [];
      if (isTagSearch) {
        postIds = await actor.searchByTagWithinPublication(
          phrase.toLowerCase(),
          publicationHandle
        );
      } else {
        postIds = await actor.searchPublicationPosts(phrase, publicationHandle);
      }
      const coreActor = await getPostCoreActor();
      const keyProperties = await coreActor.getList(
        postIds.slice(indexFrom, indexTo)
      );
      const posts = await fetchPostsByBuckets(keyProperties, false);

      const postsWithAvatars = await mergeAuthorAvatars(posts);
      set({
        searchTotalCount: postIds.length,
        searchResults: postsWithAvatars,
      });
      return {
        totalCount: postIds.length,
        posts: postsWithAvatars,
      };
    } catch (err) {
      handleError(err, Unexpected);
    }
    return { totalCount: 0, posts: [] };
  },

  getFollowingTagsPosts: async (
    indexStart: number,
    indexEnd: number
  ): Promise<{
    posts: PostType[];
    totalCount: number;
  }> => {
    try {
      let postCoreActor = await getPostCoreActor();
      let postCoreResponse =
        await postCoreActor.getMyFollowingTagsPostKeyProperties(
          indexStart,
          indexEnd
        );
      let posts = await fetchPostsByBuckets(postCoreResponse.posts, false);
      const totalCount = postCoreResponse.totalCount;
      const postsWithAvatars = await mergeAuthorAvatars(posts);
      return { posts: postsWithAvatars, totalCount: parseInt(totalCount) };
    } catch (error) {
      handleError(error);
    }
    return { posts: [], totalCount: 0 };
  },

  clearSearch: (): void => {
    set({ searchText: '', searchResults: undefined });
  },

  getAllTags: async (): Promise<TagModel[]> => {
    try {
      const allTags = await (await getPostCoreActor()).getAllTags();
      allTags.sort((a, b) => a.value.localeCompare(b.value));
      set({ allTags });
      return allTags;
    } catch (err) {
      handleError(err, Unexpected);
    }
    return [];
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
      let post = await get().getSavedPostReturnOnly(postId);
      if (post?.nftCanisterId) {
        let nftCanisterId = post.nftCanisterId[0] as string;
        let extActor = await getExtActor(nftCanisterId);
        let saleInfo = await extActor.getAvailableToken();

        return {
          postId,
          totalSupply: Number(saleInfo.maxSupply).toString(),
          available: Number(
            saleInfo.maxSupply - saleInfo.currentSupply
          ).toString(),
          ownersList: [],
        };
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },
  getSellingNfts: async (
    userAccountId: string,
    agent?: Agent
  ): Promise<PremiumPostActivityListItem[]> => {
    try {
      let postCoreActor = await getPostCoreActor(agent);
      let [allOwnedPosts, allNftCanisters] = await Promise.all([
        postCoreActor.getMyAllPosts(0, 100000), //arbitrary big number
        postCoreActor.getAllNftCanisters(),
      ]);
      //if there is any premium article that the user has written, fetch the info
      let allPremiumArticlesPostIds = allNftCanisters.map((entry) => entry[0]);
      let allOwnedPremiumArticlesKeyProperties = allOwnedPosts.filter(
        (postKeyProperty) =>
          allPremiumArticlesPostIds.includes(postKeyProperty.postId)
      );
      let allOwnedPremiumArticlesPostIds =
        allOwnedPremiumArticlesKeyProperties.map(
          (keyProperty) => keyProperty.postId
        );
      let allOwnedPremiumArticlesNftCanisterIds =
        allOwnedPremiumArticlesPostIds.map((ownedPremiumArticlePostId) => {
          return (
            allNftCanisters.find(([anyPremiumArticlePostId, nftCanisterId]) => {
              return anyPremiumArticlePostId === ownedPremiumArticlePostId;
            }) as [string, string]
          )[1];
        });

      //for every item in result array, fetch the marketplace transactions and maxSupply from nft canisters
      let transactionsPromises = [];
      for (const nftCanisterId of allOwnedPremiumArticlesNftCanisterIds) {
        let extActor = await getExtActor(nftCanisterId, agent);
        transactionsPromises.push(
          extActor.marketplaceTransactionsAndTotalSupply()
        );
      }

      let allOwnedPremiumArticlesTransactions = await Promise.all(
        transactionsPromises
      );

      let allOwnedPremiumArticles = await fetchPostsByBuckets(
        allOwnedPremiumArticlesKeyProperties,
        false
      );

      //build the result by merging the articles and the nft canister stats
      let resultBeforeFiltering = allOwnedPremiumArticles.map(
        (article, index) => {
          return {
            postId: article.postId,
            title: article.title,
            url: article.url,
            writer: article.creatorHandle || article.handle,
            tokenIndex: Number(
              allOwnedPremiumArticlesTransactions[index].currentSupply
            ).toString(),
            accessKeyIndex: Number(
              allOwnedPremiumArticlesTransactions[index].currentSupply +
              BigInt(1)
            ).toString(),
            ownedByUser: false,
            canisterId:
              article.nftCanisterId && article.nftCanisterId?.length !== 0
                ? article.nftCanisterId?.[0]
                : '',
            date: article.created,
            totalSupply: Number(
              allOwnedPremiumArticlesTransactions[index].maxSupply
            ).toString(),
            activity:
              '+' +
              (
                (Number(
                  (allOwnedPremiumArticlesTransactions[index].currentSupply -
                    BigInt(1) -
                    allOwnedPremiumArticlesTransactions[index].initialSupply) *
                  allOwnedPremiumArticlesTransactions[index].icpPrice
                ) *
                  0.89) /
                Math.pow(10, 8)
              ).toString() +
              ' ICP',
            userAccountId,
            sellerAddresses:
              allOwnedPremiumArticlesTransactions[index].tokenSenderAccounts,
          };
        }
      );
      //do not include the 0 sold articles
      return resultBeforeFiltering.filter((activityElement) => {
        return activityElement.activity !== '+0 ICP';
      });
    } catch (error) {
      return [];
    }
  },
  getOwnedNfts: async (
    userAccountId: string,
    agent?: Agent
  ): Promise<PremiumPostActivityListItem[]> => {
    try {
      let postCoreActor = await getPostCoreActor(agent);
      let [allOwnedPosts, allNftCanisters] = await Promise.all([
        postCoreActor.getMyAllPosts(0, 100000), //arbitrary big number
        postCoreActor.getAllNftCanisters(),
      ]);
      let promises = [];
      for (const [postId, canisterId] of allNftCanisters) {
        let extActor = await getExtActor(canisterId, agent);
        promises.push(extActor.tokens_ext(userAccountId));
      }
      let result: PremiumPostActivityListItem[] = [];
      let responses = await Promise.all(promises);
      var index = 0;
      for (const response of responses) {
        if ('ok' in response) {
          response.ok.forEach((owned_token) => {
            result.push({
              postId: allNftCanisters[index][0],
              title: '', //will be populated later
              url: '', //will be populated later
              writer: '', //will be populated later
              tokenIndex: owned_token[0].toString(),
              accessKeyIndex: (owned_token[0] + 1).toString(),
              ownedByUser: true,
              canisterId: allNftCanisters[index][1],
              date: '', //will be populated later
              totalSupply: '', //will be populated later
              activity: '', //will be populated later
              userAccountId,
              sellerAddresses: [],
            });
          });
        }
        index += 1;
      }
      //for every item in result array, fetch the marketplace transactions and maxSupply from nft canisters
      let transactionsPromises = [];
      for (const item of result) {
        let extActor = await getExtActor(item.canisterId, agent);
        transactionsPromises.push(
          extActor.marketplaceTransactionsAndTotalSupply()
        );
      }
      let transactionsResponses = await Promise.all(transactionsPromises);
      //populate the date, total supply and activity fields
      result = result.map((item, index) => {
        let transactions = transactionsResponses[index].transactions;

        let lastTransaction = transactions.reverse().find((transaction) => {
          return (
            transaction.buyer === userAccountId &&
            transaction.token === parseInt(result[index].tokenIndex)
          );
        });

        let postIfOwned = allOwnedPosts.find(
          (post) => post.postId === item.postId
        );

        return {
          ...item,
          date: lastTransaction
            ? Math.round(Number(lastTransaction.time) / 1000000).toString() //if found in transactions, use it
            : postIfOwned
              ? postIfOwned.created //if not found in transactions but the user is the creator, use the created date
              : Date.now().toString(), //if there is no transaction found and the user is not the creator, use now
          totalSupply: Number(
            transactionsResponses[index].maxSupply
          ).toString(),
          activity: lastTransaction
            ? `-${(Number(lastTransaction.price) / Math.pow(10, 8)).toFixed(
              4
            )} ICP` //if found in transactions, use the val
            : postIfOwned
              ? 'Minted' //if not found in transactions but the user is the creator, activity is a mint
              : 'Received', //if not both, it's a transfer
          sellerAddresses: transactionsResponses[index].tokenSenderAccounts,
        };
      });

      //now, populate the title, url and writer fields
      let keyProperties = await postCoreActor.getPostsByPostIds(
        result.map((item) => item.postId)
      );
      let posts = await fetchPostsByBuckets(keyProperties, false);
      result = result.map((item, index) => {
        return {
          ...item,
          title: posts[index].title,
          url: posts[index].url,
          writer: posts[index].creatorHandle || posts[index].handle,
        };
      });
      return result;
    } catch (error) {
      console.log(error);
      return [];
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
    buyerAccountId: string
  ): Promise<string | undefined> => {
    try {
      let extActor = await getExtActor(canisterId);
      let response = await extActor.lock(
        tokenId,
        price,
        buyerAccountId,
        new Uint8Array()
      );
      if ('err' in response) {
        handleError(response.err.toString());
      } else {
        return response.ok;
      }
    } catch (error) {
      handleError(error);
    }
    return;
  },
  getApplaudedHandles: async (
    postId: string,
    bucketCanisterId: string
  ): Promise<string[]> => {
    try {
      let applauds = await (
        await getPostBucketActor(bucketCanisterId)
      ).getPostApplauds(postId);
      let senderPrincipalIds = applauds.map((val) => val.sender);
      let handles = await (
        await getUserActor()
      ).getHandlesByPrincipals(senderPrincipalIds);
      return handles;
    } catch (error) {
      return [];
    }
  },
  checkTipping: async (
    postId: string,
    bucketCanisterId: string
  ): Promise<void> => {
    try {
      await (await getPostBucketActor(bucketCanisterId)).checkTipping(postId);
    } catch (error) {
      console.log(error);
    }
  },
  getUserApplauds: async (agent?: Agent): Promise<ApplaudListItem[]> => {
    try {
      let allBucketCanisterIds = (
        await (await getPostCoreActor(agent)).getBucketCanisters()
      ).map((bucketCanisterEntry) => {
        return bucketCanisterEntry[0];
      });
      let promises = allBucketCanisterIds.map(async (bucketCanisterId) => {
        return (await getPostBucketActor(bucketCanisterId, agent)).getMyApplauds();
      });
      //contains the applauds data
      let applauds = (await Promise.all(promises)).flat(1);
      //fetch the post details from bucket canisters, merge with applaud data and return
      let posts = await fetchPostsByBuckets(
        applauds.map((applaud) => {
          //build a CoreReturn object from an applaud -> only the bucketCanisterId matters
          return {
            bucketCanisterId: applaud.bucketCanisterId,
            postId: applaud.postId,
            created: '',
            principal: '',
            modified: '',
            views: '',
            publishedDate: '',
            claps: '',
            tags: [],
            isDraft: false,
            category: '',
            handle: '',
          };
        }),
        true
      );
      let userWallet = await useAuthStore.getState().getUserWallet();
      if (userWallet.principal.length === 0) {
        return [];
      }
      let mergedApplaudsIncludingNull = applauds.map((applaud) => {
        let post: PostType | undefined = undefined;
        for (const p of posts) {
          if (p.postId === applaud.postId) {
            //found the corresponding post
            post = p;
          }
        }
        if (post) {
          return {
            applauds: Number(applaud.numberOfApplauds),
            currency: applaud.currency,
            date: applaud.date,
            postId: applaud.postId,
            url: post.url,
            handle: post.isPublication
              ? post.creatorHandle || post.handle
              : post.handle,
            tokenAmount: Number(applaud.tokenAmount),
            applaudId: applaud.applaudId,
            isSender: userWallet.principal === applaud.sender,
            title: post.title,
            bucketCanisterId: applaud.bucketCanisterId,
          };
        }
      });
      let result: ApplaudListItem[] = [];
      mergedApplaudsIncludingNull.forEach((val) => {
        if (val) {
          result.push(val);
        }
      });

      return result;
    } catch (error) {
      handleError(error);
      return [];
    }
  },
  getUserIcpTransactions: async (): Promise<TransactionListItem[]> => {
    try {
      let icpIndexCanister = await getIcpIndexCanister();
      let userWallet = await useAuthStore.getState().getUserWallet();
      if (userWallet.principal.length === 0) {
        return [];
      }
      let response = await icpIndexCanister.get_account_identifier_transactions(
        {
          max_results: BigInt(100),
          start: [],
          account_identifier: userWallet.accountId,
        }
      );
      if ('Err' in response) {
        //should never happen
        //just return an empty array
        return [];
      } else {
        let transactionItems = response.Ok.transactions.map((t) => {
          let operation = t.transaction.operation;
          if ('Transfer' in operation) {
            return {
              date:
                t.transaction.created_at_time.length === 0
                  ? ''
                  : (
                    Number(t.transaction.created_at_time[0].timestamp_nanos) /
                    1000000
                  ).toString(),
              currency: 'ICP' as SupportedTokenSymbol,
              receiver: operation.Transfer.to,
              sender: operation.Transfer.from,
              isDeposit: operation.Transfer.to === userWallet.accountId,
              amount: Number(operation.Transfer.amount.e8s),
            };
          }
        });
        let result: TransactionListItem[] = [];
        for (const transactionItem of transactionItems) {
          if (transactionItem) {
            result.push(transactionItem);
          }
        }
        return result;
      }
    } catch (error) {
      handleError(error);
      return [];
    }
  },
  getUserNuaTransactions: async (): Promise<TransactionListItem[]> => {
    try {
      let nuaLedgerCanister = await getIcrc1TokenActorAnonymous(
        NUA_CANISTER_ID,
        !isLocal
      );
      let userWallet = await useAuthStore.getState().getUserWallet();
      if (userWallet.principal.length === 0) {
        return [];
      }
      let nuaTransactionsLedgerResponse =
        await nuaLedgerCanister.get_transactions({
          start: BigInt(0),
          length: BigInt(100_000_000_000_000), //just an arbitrary big number to get all the info we need for ALL transactions
        });
      var transactions: ArchiveTransaction[] =
        nuaTransactionsLedgerResponse.transactions;
      //archive canister promises
      let promises = [];
      for (const archivedTransaction of nuaTransactionsLedgerResponse.archived_transactions) {
        let archiveCanister = await getIcrc1ArchiveCanister(
          archivedTransaction.callback[0].toText()
        );
        promises.push(
          archiveCanister.get_transactions({
            start: archivedTransaction.start,
            length: archivedTransaction.length,
          })
        );
      }

      let archivedTransactionsResults = await Promise.all(promises);
      archivedTransactionsResults.forEach((archived) => {
        transactions = [...archived.transactions, ...transactions];
      });
      //filter the transactions to just include user's transactions
      transactions = transactions.filter((transaction) => {
        if (transaction.transfer.length !== 0) {
          let memo = '';
          if (transaction.transfer[0].memo.length !== 0) {
            memo = new TextDecoder().decode(
              (transaction.transfer[0].memo as [Uint8Array])[0]
            );
          }

          return (
            (transaction.transfer[0].from.owner.toText() ===
              userWallet.principal ||
              transaction.transfer[0].to.owner.toText() ===
              userWallet.principal) &&
            ((transaction.transfer[0].from.owner.toText() ===
              subscriptionCanisterId &&
              memo !== 'sub_' + userWallet.principal.slice(0, 20)) ||
              transaction.transfer[0].from.owner.toText() !==
              subscriptionCanisterId) &&
            transaction.transfer[0].to.owner.toText() !== subscriptionCanisterId
          );
        }
        return false;
      });
      let transfers = transactions.map((transaction) => {
        return transaction.transfer[0];
      }) as Transfer[];
      return transfers.map((t, index) => {
        return {
          date: (Number(transactions[index].timestamp) / 1000000).toString(),
          currency: 'NUA' as SupportedTokenSymbol,
          receiver: t.to.owner.toText(),
          sender: t.from.owner.toText(),
          isDeposit: t.to.owner.toText() === userWallet.principal,
          amount: Number(t.amount),
        };
      });
    } catch (error) {
      handleError(error);
      return [];
    }
  },
  getUserCkbtcTransactions: async (): Promise<TransactionListItem[]> => {
    try {
      let ckBtcIndexCanister = await getIcrc1IndexCanister(
        ckBTC_INDEX_CANISTER_ID
      );
      let userWallet = await useAuthStore.getState().getUserWallet();
      if (userWallet.principal.length === 0) {
        return [];
      }
      let indexCanisterTransactionsResponse =
        await ckBtcIndexCanister.get_account_transactions({
          max_results: BigInt(100_000), //max of 100_000 transactions :)
          start: [BigInt(0)],
          account: {
            owner: Principal.fromText(userWallet.principal),
            subaccount: [],
          },
        });
      if ('Err' in indexCanisterTransactionsResponse) {
        handleError(indexCanisterTransactionsResponse.Err.message);
        return [];
      } else {
        let transactions =
          indexCanisterTransactionsResponse.Ok.transactions.filter(
            (transaction) => {
              return transaction.transaction.transfer.length !== 0;
            }
          );
        let transfers = transactions.map((t) => {
          return t.transaction.transfer[0];
        }) as Transfer[];
        return transfers.map((t, index) => {
          return {
            date: (
              Number(transactions[index].transaction.timestamp) / 1000000
            ).toString(),
            currency: 'ckBTC' as SupportedTokenSymbol,
            receiver: t.to.owner.toText(),
            sender: t.from.owner.toText(),
            isDeposit: t.to.owner.toText() === userWallet.principal,
            amount: Number(t.amount),
          };
        });
      }
      //filter the transactions to just include user's transactions
    } catch (error) {
      handleError(error);
      return [];
    }
  },
  getUserRestrictedNuaTransactions: async (): Promise<
    ClaimTransactionHistoryItem[]
  > => {
    try {
      let nuaLedgerCanister = await getIcrc1TokenActorAnonymous(
        NUA_CANISTER_ID,
        !isLocal
      );
      let userWallet = await useAuthStore.getState().getUserWallet();
      if (userWallet.principal.length === 0) {
        return [];
      }
      let user = useUserStore.getState().user;
      if (!user) {
        return [];
      }
      let nuaTransactionsLedgerResponse =
        await nuaLedgerCanister.get_transactions({
          start: BigInt(0),
          length: BigInt(100_000_000_000_000), //just an arbitrary big number to get all the info we need for ALL transactions
        });
      var transactions: ArchiveTransaction[] =
        nuaTransactionsLedgerResponse.transactions;
      //archive canister promises
      let promises = [];
      for (const archivedTransaction of nuaTransactionsLedgerResponse.archived_transactions) {
        let archiveCanister = await getIcrc1ArchiveCanister(
          archivedTransaction.callback[0].toText()
        );
        promises.push(
          archiveCanister.get_transactions({
            start: archivedTransaction.start,
            length: archivedTransaction.length,
          })
        );
      }

      let archivedTransactionsResults = await Promise.all(promises);
      archivedTransactionsResults.forEach((archived) => {
        transactions = [...archived.transactions, ...transactions];
      });
      //filter the transactions to just include the deposits from the faucet to the user's restricted nua token account
      transactions = transactions.filter((transaction) => {
        if (transaction.transfer.length !== 0 && user) {
          return (
            transaction.transfer[0].to.owner.toText() === userCanisterId &&
            areUint8ArraysEqual(
              transaction.transfer[0].to.subaccount[0],
              user.claimInfo.subaccount[0]
            )
          );
        }
        return false;
      });
      let transfers = transactions.map((transaction) => {
        return transaction.transfer[0];
      }) as Transfer[];
      return transfers.map((t, index) => {
        return {
          date: (Number(transactions[index].timestamp) / 1000000).toString(),

          claimedAmount:
            Number((Number(t.amount) / Math.pow(10, 8)).toFixed(0)) *
            Math.pow(10, 8),
        };
      });
    } catch (error) {
      handleError(error);
      return [];
    }
  },
  checkTippingByTokenSymbol: async (
    postId: string,
    tokenSymbol: SupportedTokenSymbol,
    bucketCanisterId: string
  ): Promise<void> => {
    try {
      let response = await (
        await getPostBucketActor(bucketCanisterId)
      ).checkTippingByTokenSymbol(postId, tokenSymbol, '');
      console.log(response);
    } catch (error) {
      console.log(error);
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
    canisterId: string
  ): Promise<string | undefined> => {
    let extActor = await getExtActor(canisterId);
    let settleResult = await extActor.settle(tokenId);

    if (Err in settleResult) {
      toastError(settleResult.err);
    } else {
      //will remove this line after we go live on ic because toniq will handle this by calling external_heartbeat method
      extActor.heartbeat_disbursements().then(() => {
        console.log('disbursed');
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
