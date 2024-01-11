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
const  user = useUserStore.getState().user;

const mergeAuthorAvatars = async (posts: PostType[]): Promise<PostType[]> => {
  const authorHandles = posts.map((p) => p.handle);

  const authors = await (await getUserActor()).getUsersByHandles(authorHandles);

  return posts.map((p) => {
    const author = authors.find((a : any) => a.handle === p.handle);
    if (author) {
      return { ...p, avatar: author.avatar };
    }
    return p;
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
      if(publicationHandle){
        promises.push(
          bucketActor.getPublicationPosts(
            keyProperties.map((keyProperty) => {
              return keyProperty.postId;
            }),
            publicationHandle
          )
        );
      }
      else{
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
    let keyProperties = postIdToKeyPropertiesMap.get(bucketType.postId);
    if (keyProperties) {
      return { ...keyProperties, ...bucketType } as PostType;
    } else {
      //should never happen
      return { ...bucketType } as PostType;
    }
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
  premiumArticleInfo: PremiumArticleSaleInformation | undefined;
  getPremiumArticleInfoError: string | undefined;
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
  savePublicationPost: (
    post: PostSaveModel
  ) => Promise<PostType | undefined>;
  getPublicationPosts: (
    indexFrom: number,
    indexTo: number,
    publicationHandle: string
  ) => Promise<PostType[] | undefined>;
  clearPublicationPosts: () => Promise<void>;
  getPublicationPost: (
    postId: string,
    publicationHandle: string
  ) => Promise<void>;
  getPremiumArticleInfo: (
    postId: string,
    publicationHandle: string
  ) => Promise<void>;
  clerGetPublicationPostError: () => Promise<void>;
  clearSavedPublicationPost: () => void;
  clearSavePublicationPostError: () => void;
  clearPremiumArticleInfo: () => void;
  getCanisterIdByHandle: (handle: string) => Promise<string | undefined>;
  getAllWriterDrafts: (userHandle: string) => Promise<PostType[]>;
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
  premiumArticleInfo: undefined,
  getPremiumArticleInfoError: undefined,
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
      console.log(publicationHandle, "-> PUB HANDLE")
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
      let coreReturn = await postCoreCanister.getPublicationPosts(indexFrom, indexTo, publicationHandle);
      const publicationPosts = await fetchPostsByBuckets(coreReturn, true, publicationHandle);
      set({ publicationPosts });
      const postsWithAvatars = await mergeAuthorAvatars(publicationPosts);
      set({ publicationPosts: postsWithAvatars });
      return postsWithAvatars.reverse();
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

  getPublicationPost: async (
    postId: string,
    publicationHandle: string
  ): Promise<void> => {
    try {
      const canisterId = await get().getCanisterIdByHandle(publicationHandle);
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
      const result = await (
        await getPublisherActor(canisterId)
      ).updatePublicationPostDraft(postId, isDraft);
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

  savePublicationPost: async (
    post: PostSaveModel,
  ): Promise<PostType | undefined> => {
    try {
      const creator = await useUserStore
        .getState()
        .getPrincipalByHandle(post.creator);
      const postCoreCanister = await getPostCoreActor();
      console.log('TRYING TO SAVE PUBLICATION POST')
      const result = await postCoreCanister.save({
        postId: post.postId,
        title: post.title,
        subtitle: post.subtitle,
        headerImage: post.headerImage,
        content: post.content,
        isDraft: post.isDraft,
        tagIds: post.tagIds,
        creator: creator || '',
        isPublication: post.isPublication,
        category: post.category,
        isPremium: false,
        handle: post.handle
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
    existing_canister_ids.forEach((el : any) => {
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

  getAllWriterDrafts: async (userHandle: string): Promise<PostType[]> => {
    try {
     
      const userPublications = user?.publicationsArray || undefined;
      let allDrafts: PostType[] = [];
  
      for (const publication of userPublications || []) {
        const canisterId = await get().getCanisterIdByHandle(publication.publicationName);
        
        const drafts = await (
          await getPublisherActor(canisterId)
        ).getWritersDrafts(); 
  
        const userDrafts = drafts.filter((draft : PostType) => draft?.creator?.toLowerCase() === userHandle.toLowerCase());
       
        allDrafts = [...allDrafts, ...userDrafts];
      }
     
      set({ allDrafts });
      return allDrafts;
    } catch (err) {
      handleError(err, Unexpected);
      console.log(err, "ERR")
      return [];
    }
  },
  

  getPremiumArticleInfo: async (
    postId: string,
    publicationHandle: string
  ): Promise<void> => {
    try {
      const canisterId = await get().getCanisterIdByHandle(publicationHandle);
      const result = await (
        await getPublisherActor(canisterId)
      ).getPremiumArticleInfo(postId);
      if (Err in result) {
        set({ getPremiumArticleInfoError: result.err });
        toastError(result.err);
      } else {
        let premiumArticleDetails = result.ok;
        let extActor = await getExtActor(premiumArticleDetails.nftCanisterId);
        let all_listings = await extActor.ext_marketplaceListings();
        let tokenIndexStart = parseInt(premiumArticleDetails.tokenIndexStart);
        let tokenIndexEnd =
          tokenIndexStart + parseInt(premiumArticleDetails.totalSupply);
        var current_post_listings: [number, Listing, Metadata][] = [];
        all_listings.forEach((listing : any) => {
          if (listing[0] >= tokenIndexStart && listing[0] < tokenIndexEnd) {
            current_post_listings.push(listing);
          }
        });
        current_post_listings.sort((listing_1, listing_2) => {
          return Number(listing_1[1].price - listing_2[1].price);
        });

        if (!current_post_listings.length) {
          set({
            premiumArticleInfo: {
              cheapesTokenAccesKeyIndex: '',
              cheapestTokenIndex: '',
              cheapestPrice: '',
              cheapestTokenIdentifier: '',
              nftCanisterId: premiumArticleDetails.nftCanisterId,
              totalSupply: premiumArticleDetails.totalSupply,
              available: '0',
              postId: postId,
              soldOut: true,
            },
          });
        } else {
          let cheapestListing = current_post_listings[0];
          set({
            premiumArticleInfo: {
              cheapesTokenAccesKeyIndex: (
                cheapestListing[0] - tokenIndexStart
              ).toString(),
              cheapestTokenIndex: cheapestListing[0].toString(),
              cheapestPrice: cheapestListing[1].price.toString(),
              cheapestTokenIdentifier: await extActor.indexToTokenId(
                cheapestListing[0]
              ),
              nftCanisterId: premiumArticleDetails.nftCanisterId,
              totalSupply: premiumArticleDetails.totalSupply,
              available: current_post_listings.length.toString(),
              postId: postId,
              soldOut: false,
            },
          });
        }
      }
    } catch (err: any) {
      console.log(err);
      handleError(err, Unexpected);
    }
  },

  clearSavedPublicationPost: (): void => {
    set({ savedPublicationPost: undefined });
  },

  clearSavePublicationPostError: (): void => {
    set({ savePublicationPostError: undefined });
  },
  clearPremiumArticleInfo: (): void => {
    set({
      premiumArticleInfo: undefined,
      getPremiumArticleInfoError: undefined,
    });
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
