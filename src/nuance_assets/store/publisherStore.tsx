import create, { GetState, SetState, StateCreator, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import { toastError } from '../services/toastService';
import { ErrorType, getErrorType } from '../services/errorService';
import { useAuthStore, useUserStore } from './';
import {
  PostType,
  PremiumArticleSaleInformation,
  PublicationType,
  SocialLinksObject,
  PublicationCta,
} from '../types/types';
import {
  getPublisherActor,
  getPostIndexActor,
  getUserActor,
  User,
  Publication,
  PostSaveModel,
  PostTag,
  PostTagModel,
  TagModel,
  getExtActor,
  getPostCoreActor,
  getPostBucketActor,
} from '../services/actorService';
import { Listing, Metadata } from '../services/ext-service/ext_v2.did';
import { PostKeyProperties } from '../../../src/declarations/PostCore/PostCore.did';
import { PostBucketType } from '../../../src/declarations/PostBucket/PostBucket.did';

const Err = 'err';
const Unexpected = 'Unexpected error: ';
const ArticleNotFound = 'Article not found';
const user = useUserStore.getState().user;

const mergeAuthorAvatars = async (posts: PostType[]): Promise<PostType[]> => {
  const authorHandles = posts.map((p) => p.handle);

  const authors = await (await getUserActor()).getUsersByHandles(authorHandles);

  return posts.map((p) => {
    const author = authors.find((a: any) => a.handle === p.handle);
    if (author) {
      return { ...p, avatar: author.avatar };
    }
    return p;
  });
};

const mergePremiumArticleSaleInformation = async (
  posts: PostType[]
): Promise<PostType[]> => {
  //populate the premiumArticleSAleInformation value if exists any
  let postIdsAndNftCanisterIds = posts
    .filter(
      (post) =>
        post.nftCanisterId !== undefined && post.nftCanisterId.length !== 0
    )
    .map((post) => [post.postId, post.nftCanisterId?.[0] as string]);

  let promises = [];
  for (const [postId, nftCanisterId] of postIdsAndNftCanisterIds) {
    let extActor = await getExtActor(nftCanisterId);
    promises.push(extActor.getAvailableToken());
  }
  let results = await Promise.all(promises);
  return posts.map((post) => {
    let premiumArticleInfoIfExists = results.filter(
      (val) => val.postId === post.postId
    );
    return {
      ...post,
      premiumArticleSaleInfo:
        premiumArticleInfoIfExists.length !== 0
          ? {
            tokenIndex:
              premiumArticleInfoIfExists[0].availableTokenIndex.length !== 0
                ? premiumArticleInfoIfExists[0].availableTokenIndex[0]
                : 0,
            totalSupply: Number(premiumArticleInfoIfExists[0].maxSupply),
            nftCanisterId: post.nftCanisterId?.[0] as string,
            currentSupply: Number(
              premiumArticleInfoIfExists[0].currentSupply
            ),
            price_e8s: Number(premiumArticleInfoIfExists[0].price),
            priceReadable: (
              Number(premiumArticleInfoIfExists[0].price) / Math.pow(10, 8)
            ).toFixed(4),
          }
          : undefined,
    };
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

const fetchPostsByBuckets = async (
  coreReturns: PostKeyProperties[],
  includeDraft: boolean,
  publicationHandle?: string //
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
      if (publicationHandle) {
        promises.push(
          bucketActor.getPublicationPosts(
            keyProperties.map((keyProperty) => {
              return keyProperty.postId;
            }),
            publicationHandle
          )
        );
      } else {
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
  }

  let resultsArray = (await Promise.all(promises)).flat(1);

  return resultsArray.map((bucketType) => {
    let keyProperties = postIdToKeyPropertiesMap.get(bucketType.postId) as PostKeyProperties;
    return { ...keyProperties, ...bucketType } as PostType;
  });
};

export interface PublisherStore {
  //storing canister ids in this format [<handle>, <canisterId>]
  publicationCanisterIds: string[][];
  publication: PublicationType | undefined;
  getPublicationError: string | undefined;
  getPublication: (
    publicationHandle: string
  ) => Promise<PublicationType | undefined>;
  getPublicationReturnOnly: (
    publicationHandle: string
  ) => Promise<PublicationType | undefined>;
  updatePublicationDetails: (
    publicationHandle: string,
    publicationDescription: string,
    publicationTitle: string,
    publicationBannerImage: string,
    publicationCategories: string[],
    publicationWriters: string[],
    publicationEditors: string[],
    avatar: string,
    publicationSubtitle: string,
    socialLinks: SocialLinksObject,
    modified: string
  ) => Promise<void>;

  updatePublicationStyling: (
    fontType: string,
    primaryColor: string,
    brandLogo: string,
    publicationHandle: string
  ) => Promise<void>;

  updatePublicationCta: (
    cta: PublicationCta,
    publicationHandle: string
  ) => Promise<void>;

  savedPublicationPost: PostType | undefined;
  publicationDraftPosts: PostType[] | undefined;
  publicationPosts: PostType[] | undefined;
  allDrafts: PostType[] | undefined;
  publicationPost: PostType | undefined;
  getPublicationPostError: string | undefined;
  savePublicationPostError: string | undefined;
  removePublicationPostCategory: (
    postId: string,
    publicationHandle: string
  ) => Promise<void>;
  addPublicationPostCategory: (
    postId: string,
    category: string,
    publicationHandle: string
  ) => Promise<void>;
  updatePublicationPostDraft: (
    postId: string,
    isDraft: boolean,
    publicationHandle: string
  ) => Promise<void>;
  removePublication: (
    caller: string,
    publicationHandle: string
  ) => Promise<void>;
  removeEditor: (
    editorHandle: string,
    publicationHandle: string
  ) => Promise<void>;
  removeWriter: (
    writerHandle: string,
    publicationHandle: string
  ) => Promise<void>;
  savePublicationPost: (post: PostSaveModel) => Promise<PostType | undefined>;
  getPublicationPosts: (
    indexFrom: number,
    indexTo: number,
    publicationHandle: string
  ) => Promise<PostType[] | undefined>;
  clearPublicationPosts: () => Promise<void>;
  clerGetPublicationPostError: () => Promise<void>;
  clearSavedPublicationPost: () => void;
  clearSavePublicationPostError: () => void;
  getCanisterIdByHandle: (handle: string) => Promise<string | undefined>;
  clearAll: () => void;
}

const toPublisherModel = (publication: Publication): PublicationType => {
  return {
    ...publication,
  } as PublicationType;
};

// proxies calls to the app canister and caches the results
const createPublisherStore:
  | StateCreator<PublisherStore>
  | StoreApi<PublisherStore> = (set, get) => ({
    publicationCanisterIds: [],
    savedPublicationPost: undefined,
    publication: undefined,
    getPublicationError: undefined,
    publicationDraftPosts: undefined,
    publicationPosts: undefined,
    publicationPost: undefined,
    getPublicationPostError: undefined,
    savePublicationPostError: undefined,
    allDrafts: undefined,

    getPublication: async (
      publicationHandle: string
    ): Promise<PublicationType | undefined> => {
      try {
        const canisterId = await get().getCanisterIdByHandle(publicationHandle);

        const result = await (
          await getPublisherActor(canisterId)
        ).getPublicationQuery(publicationHandle);

        if (Err in result) {
          set({
            publication: undefined,
          });
          if (result.err) {
            set({ getPublicationError: result.err });
          }
          return undefined;
          // this function is called when the app loads to check
          // if the user exists, so it should not display an error
        } else {
          let publication = toPublisherModel(result.ok);
          set({
            publication,
            getPublicationError: undefined,
          });
          return publication;
        }
      } catch (err) {
        handleError(err, Unexpected);
      }
    },

    getPublicationReturnOnly: async (
      publicationHandle: string
    ): Promise<PublicationType | undefined> => {
      try {
        console.log(publicationHandle, '-> PUB HANDLE');
        const canisterId = await get().getCanisterIdByHandle(publicationHandle);

        const result = await (
          await getPublisherActor(canisterId)
        ).getPublicationQuery(publicationHandle);

        if (Err in result) {
        } else {
          let publication = toPublisherModel(result.ok);
          return publication;
        }
      } catch (err) {
        handleError(err, Unexpected);
      }
    },

    updatePublicationDetails: async (
      publicationHandle: string,
      publicationDescription: string,
      publicationTitle: string,
      publicationBannerImage: string,
      publicationCategories: Array<string>,
      writers: Array<string>,
      publicationEditors: Array<string>,
      avatar: string,
      publicationSubtitle: string,
      socialLinks: SocialLinksObject,
      modified: string
    ): Promise<void> => {
      try {
        const canisterId = await get().getCanisterIdByHandle(publicationHandle);
        const result = await (
          await getPublisherActor(canisterId)
        ).updatePublicationDetails(
          publicationDescription,
          publicationTitle,
          publicationBannerImage,
          publicationCategories,
          writers,
          publicationEditors,
          avatar,
          publicationSubtitle,
          socialLinks,
          modified
        );
        if (Err in result) {
          toastError(result.err);
        } else {
          set({ publication: toPublisherModel(result.ok) });
        }
      } catch (err) {
        handleError(err, Unexpected);
      }
    },
    updatePublicationStyling: async (
      fontType: string,
      primaryColor: string,
      brandLogo: string,
      publicationHandle: string
    ): Promise<void> => {
      try {
        const canisterId = await get().getCanisterIdByHandle(publicationHandle);
        const result = await (
          await getPublisherActor(canisterId)
        ).updatePublicationStyling(fontType, primaryColor, brandLogo);
        if (Err in result) {
          toastError(result.err);
        } else {
          set({ publication: toPublisherModel(result.ok) });
        }
      } catch (error) {
        handleError(error, Unexpected);
      }
    },

    updatePublicationCta: async (
      publicationCta: PublicationCta = {
        buttonCopy: '',
        link: '',
        ctaCopy: '',
        icon: '',
      },
      publicationHandle: string
    ): Promise<void> => {
      try {
        const canisterId = await get().getCanisterIdByHandle(publicationHandle);
        const result = await (
          await getPublisherActor(canisterId)
        ).updatePublicationCta(publicationCta);
        if (Err in result) {
          toastError(result.err);
        } else {
          set({ publication: toPublisherModel(result.ok) });
        }
      } catch (error) {
        handleError(error, Unexpected);
      }
    },

    removePublication: async (
      caller: string,
      publicationHandle: string
    ): Promise<void> => {
      try {
        const canisterId = await get().getCanisterIdByHandle(publicationHandle);
        const result = await (
          await getPublisherActor(canisterId)
        ).removeWriter(caller);
        if (Err in result) {
          toastError(result.err);
        } else {
          set({ publication: toPublisherModel(result.ok) });
        }
      } catch (err) {
        handleError(err, Unexpected);
      }
    },

    removeEditor: async (
      editorHandle: string,
      publicationHandle: string
    ): Promise<void> => {
      try {
        const canisterId = await get().getCanisterIdByHandle(publicationHandle);
        const result = await (
          await getPublisherActor(canisterId)
        ).removeEditor(editorHandle);
        if (Err in result) {
          toastError(result.err);
        } else {
          set({ publication: toPublisherModel(result.ok) });
        }
      } catch (err) {
        handleError(err, Unexpected);
      }
    },
    removeWriter: async (
      writerHandle: string,
      publicationHandle: string
    ): Promise<void> => {
      try {
        const canisterId = await get().getCanisterIdByHandle(publicationHandle);
        const result = await (
          await getPublisherActor(canisterId)
        ).removeWriter(writerHandle);
        if (Err in result) {
          toastError(result.err);
        } else {
          set({ publication: toPublisherModel(result.ok) });
        }
      } catch (err) {
        handleError(err, Unexpected);
      }
    },

    getPublicationPosts: async (
      indexFrom: number,
      indexTo: number,
      publicationHandle: string
    ): Promise<PostType[] | undefined> => {
      try {
        let postCoreCanister = await getPostCoreActor();
        let coreReturn = await postCoreCanister.getPublicationPosts(
          indexFrom,
          indexTo,
          publicationHandle
        );
        const publicationPosts = await fetchPostsByBuckets(
          coreReturn,
          true,
          publicationHandle
        );
        set({ publicationPosts });

        const [postsWithAvatars, postsWithPremiumArticleInformation] =
          await Promise.all([
            mergeAuthorAvatars(publicationPosts),
            mergePremiumArticleSaleInformation(publicationPosts),
          ]);
        let merged = publicationPosts.map((post, index) => {
          return {
            ...post,
            avatar: postsWithAvatars[index].avatar,
            premiumArticleSaleInfo:
              postsWithPremiumArticleInformation[index].premiumArticleSaleInfo,
          };
        });
        set({
          publicationPosts: merged,
        });

        return merged.reverse();
      } catch (err: any) {
        console.log(err);
        return await get().getPublicationPosts(
          indexFrom,
          indexTo,
          publicationHandle
        );
        //need to convert the call to query
        //handleError(err, Unexpected);
      }
    },

    clerGetPublicationPostError: async () => {
      set({ getPublicationPostError: undefined });
    },

    clearPublicationPosts: async () => {
      set({ publicationPosts: undefined });
    },

    removePublicationPostCategory: async (
      postId: string,
      publicationHandle: string
    ): Promise<void> => {
      try {
        const canisterId = await get().getCanisterIdByHandle(publicationHandle);
        const result = await (
          await getPublisherActor(canisterId)
        ).removePublicationPostCategory(postId);
        if (Err in result) {
          set({ savePublicationPostError: result.err });
          toastError(result.err);
        } else {
          set({ savedPublicationPost: result.ok as unknown as PostType });
        }
      } catch (err: any) {
        handleError(err, Unexpected);
      }
    },

    addPublicationPostCategory: async (
      postId: string,
      category: string,
      publicationHandle: string
    ): Promise<void> => {
      try {
        const canisterId = await get().getCanisterIdByHandle(publicationHandle);
        const result = await (
          await getPublisherActor(canisterId)
        ).addPublicationPostCategory(postId, category);
        if (Err in result) {
          set({ savePublicationPostError: result.err });
          toastError(result.err);
        } else {
          set({ savedPublicationPost: result.ok as unknown as PostType });
        }
      } catch (err: any) {
        handleError(err, Unexpected);
      }
    },

    updatePublicationPostDraft: async (
      postId: string,
      isDraft: boolean,
      publicationHandle: string
    ): Promise<void> => {
      try {
        const canisterId = await get().getCanisterIdByHandle(publicationHandle);
        console.log('before getting the result')
        const result = await (
          await getPublisherActor(canisterId)
        ).updatePublicationPostDraft(postId, isDraft);
        console.log('result: ', result)
        if (Err in result) {
          set({ savePublicationPostError: result.err });
          toastError(result.err);
        } else {
          set({ savedPublicationPost: result.ok as unknown as PostType });
        }
      } catch (err: any) {
        handleError(err, Unexpected);
        console.log('updatePublicationPostDraft error')
      }
    },

    savePublicationPost: async (
      post: PostSaveModel
    ): Promise<PostType | undefined> => {
      try {
        const postCoreCanister = await getPostCoreActor();
        const result = await postCoreCanister.save({
          postId: post.postId,
          title: post.title,
          subtitle: post.subtitle,
          headerImage: post.headerImage,
          content: post.content,
          isDraft: post.isDraft,
          tagIds: post.tagIds,
          creatorHandle: post.creatorHandle,
          isPublication: post.isPublication,
          category: post.category,
          premium: post.premium,
          handle: post.handle,
          isMembersOnly: post.isMembersOnly,
          scheduledPublishedDate: post.scheduledPublishedDate,
        });
        if (Err in result) {
          set({ savePublicationPostError: result.err });
          toastError(result.err);
        } else {
          set({ savedPublicationPost: result.ok as unknown as PostType });
          return result.ok;
        }
      } catch (err) {
        handleError(err, Unexpected);
      }
    },

    getCanisterIdByHandle: async (
      handle: string
    ): Promise<string | undefined> => {
      const existing_canister_ids = get().publicationCanisterIds;
      var canisterId = '';
      existing_canister_ids.forEach((el: any) => {
        if (el[0] === handle.toLowerCase()) {
          canisterId = el[1];
        }
      });
      if (!canisterId.length) {
        const canisterId = await useUserStore
          .getState()
          .getPrincipalByHandle(handle);
        if (canisterId) {
          set({
            publicationCanisterIds: [
              ...existing_canister_ids,
              [handle.toLowerCase(), canisterId],
            ],
          });
          return canisterId;
        }
      } else {
        return canisterId;
      }
    },

    clearSavedPublicationPost: (): void => {
      set({ savedPublicationPost: undefined });
    },

    clearSavePublicationPostError: (): void => {
      set({ savePublicationPostError: undefined });
    },

    clearAll: (): void => {
      set({
        savedPublicationPost: undefined,
        publication: undefined,
        publicationDraftPosts: undefined,
        publicationPosts: undefined,
        publicationPost: undefined,
        getPublicationPostError: undefined,
        savePublicationPostError: undefined,
      });
    },
  });

export const usePublisherStore = create<PublisherStore>(
  persist(
    (set, get, api) => ({
      ...createPublisherStore(
        set as SetState<PublisherStore>,
        get as GetState<PublisherStore>,
        api as StoreApi<PublisherStore>
      ),
    }),
    {
      name: 'publisherStore',
      getStorage: () => sessionStorage,
    }
  )
);
