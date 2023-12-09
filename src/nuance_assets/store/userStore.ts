import create, { GetState, SetState, StateCreator, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import { toastError } from '../services/toastService';
import { ErrorType, getErrorType } from '../services/errorService';
import { useAuthStore } from './';
import { UserType, UserListItem, PublicationType } from '../types/types';
import {
  getUserActor,
  User,
  Followers,
  UserPostCounts,
  getEmailOptInActor,
  getPostCoreActor,
  getPublisherActor,
} from '../services/actorService';

const Err = 'err';
const Unexpected = 'Unexpected error: ';
const UserNotFound = 'User not found';

const handleError = (err: any, preText?: string) => {
  const errorType = getErrorType(err);

  if (errorType == ErrorType.SessionTimeOut) {
    useAuthStore?.getState().logout();
    console.log('Logged out: ' + new Date());
    window.location.href = '/timed-out';
  } else {
    toastError(err, preText);
  }
};

function levenshteinDistance(a: string, b: string) {
  const an = a.length;
  const bn = b.length;
  const matrix = [];
  let i, j;

  if (an === 0) {
    return bn;
  }
  if (bn === 0) {
    return an;
  }

  for (i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }

  for (j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (i = 1; i <= bn; i++) {
    for (j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[bn][an];
}

const findSimilarHandles = (input: string, handles: string[]) => {
  const tolerance = 3;
  const results = [];
  const lowerInput = input.toLowerCase();

  for (const handle of handles) {
    let distance = levenshteinDistance(lowerInput, handle.toLowerCase())
    if (distance <= tolerance) {
      results.push({ handle: handle, distance: distance });
    }
  }
  return results
    .sort((h1, h2) => {
      return h2.distance - h1.distance;
    })
    .map((handleObj) => handleObj.handle.toLowerCase());
};

export interface UserStore {
  readonly user: UserType | undefined;
  readonly userPostCounts: UserPostCounts | undefined;
  readonly writerPostCounts: UserPostCounts | undefined;
  readonly author: UserType | undefined;
  readonly unregistered: boolean;
  readonly followers: Followers | undefined;
  readonly usersByHandles: UserListItem[] | undefined;
  readonly userFollowersCount: string;
  readonly allUsersHandles: string[];
  readonly allPublicationsHandlesAndCanisterIds: [string, string][];
  readonly searchUserResults: UserListItem[] | undefined;
  readonly searchPublicationResults: PublicationType[] | undefined;
  readonly myFollowers: UserListItem[] | undefined;

  registerUser: (
    handle: string,
    displayName: string,
    avatar: string
  ) => Promise<void>;
  isRegistrationOpen: () => Promise<boolean>;
  getUser: () => Promise<void>;
  getAuthor: (handle: string) => Promise<void>;
  getAllUsersHandles: () => Promise<string[]>;
  getAllPublicationsHandles: () => Promise<[string, string][]>;
  searchUsers: (input: string) => Promise<void>;
  searchPublications: (input: string) => Promise<void>;
  getUserPostCounts: (handle: string) => Promise<void>;
  getWriterPostCounts: (handle: string) => Promise<void>;
  getUserFollowersCount: (handle: string) => Promise<void>;
  clearUser: () => Promise<void>;
  clearAuthor: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  updateBio: (bio: string) => Promise<void>;
  followAuthor: (author: string) => Promise<void>;
  unfollowAuthor: (author: string) => Promise<void>;
  getUsersByHandles: (
    handles: Array<string>
  ) => Promise<UserListItem[] | undefined>;
  getUsersByHandlesReturnOnly: (
    handles: Array<string>
  ) => Promise<UserListItem[] | undefined>;
  getMyFollowers: (indexStart: number, indexEnd: number) => Promise<void>;
  getPrincipalByHandle: (handle: string) => Promise<string | undefined>;
  createEmailOptInAddress: (emailAddress: string) => Promise<void>;

  clearAll: () => void;
}

const toUserModel = (user: User): UserType => {
  return {
    ...user,
    lastLogin: 0,
    followedTags: [],
  } as UserType;
};

// proxies calls to the app canister and caches the results
// todo: add error handling
const createUserStore: StateCreator<UserStore> | StoreApi<UserStore> = (
  set,
  get
) => ({
  user: undefined,
  userPostCounts: undefined,
  writerPostCounts: undefined,
  author: undefined,
  unregistered: true,
  followers: undefined,
  getUsersByHandlesReturn: [],
  usersByHandles: undefined,
  userFollowersCount: '0',
  allUsersHandles: [],
  allPublicationsHandlesAndCanisterIds: [],
  searchUserResults: undefined,
  searchPublicationResults: undefined,
  myFollowers: undefined,

  registerUser: async (
    handle: string,
    displayName: string,
    avatar: string
  ): Promise<void> => {
    try {
      const result = await (
        await getUserActor()
      ).registerUser(handle, displayName, avatar);
      if (Err in result) {
        toastError(result.err);
      } else {
        set({ user: toUserModel(result.ok) });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  isRegistrationOpen: async (): Promise<boolean> => {
    return (await getUserActor()).isRegistrationOpen();
  },

  getUser: async (): Promise<void> => {
    try {
      const result = await (await getUserActor()).getUser();
      if (Err in result) {
        set({
          user: undefined,
          unregistered: result.err == UserNotFound,
        });
        if (result.err) {
          console.log('getUser: ' + result.err);
        }
        // this function is called when the app loads to check
        // if the user exists, so it should not display an error
      } else {
        let user = toUserModel(result.ok);
        set({
          user,
          unregistered: false,
        });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getPrincipalByHandle: async (handle: string): Promise<string | undefined> => {
    const result = await (
      await getUserActor()
    ).getPrincipalByHandle(handle.toLowerCase());
    if (!(Err in result)) {
      return result.ok[0];
    }
    return undefined;
  },

  getUserPostCounts: async (handle: string): Promise<void> => {
    try {
      const userPostCounts = await (
        await getPostCoreActor()
      ).getUserPostCounts(handle.toLowerCase());

      set({ userPostCounts });
    } catch (err) {
      toastError(err, Unexpected);
    }
  },

  getWriterPostCounts: async (handle: string): Promise<void> => {
    try {
      const writerPostCounts = await (
        await getPostCoreActor()
      ).getUserPostCounts(handle.toLowerCase());

      set({ writerPostCounts });
    } catch (err) {
      toastError(err, Unexpected);
    }
  },

  getUserFollowersCount: async (handle: string): Promise<void> => {
    try {
      const userFollowersCount = await (
        await getUserActor()
      ).getFollowersCount(handle.toLowerCase());

      set({ userFollowersCount });
    } catch (err) {
      toastError(err, Unexpected);
    }
  },

  getAuthor: async (handle: string): Promise<void> => {
    try {
      const result = await (
        await getUserActor()
      ).getUserByHandle(handle.trim().toLowerCase());
      if (Err in result) {
        set({ author: undefined });
        toastError(result.err);
      } else {
        set({ author: toUserModel(result.ok) });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  clearUser: async (): Promise<void> => {
    set({ user: undefined });
  },

  clearAuthor: async (): Promise<void> => {
    set({ author: undefined });
  },

  updateDisplayName: async (displayName: string): Promise<void> => {
    try {
      const result = await (
        await getUserActor()
      ).updateDisplayName(displayName);
      if (Err in result) {
        toastError(result.err);
      } else {
        set({ user: toUserModel(result.ok) });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getUsersByHandles: async (
    handles: Array<string>
  ): Promise<UserListItem[] | undefined> => {
    try {
      const usersByHandles = await (
        await getUserActor()
      ).getUsersByHandles(
        handles.map((handle) => {
          return handle.toLowerCase();
        })
      );
      set({ usersByHandles: usersByHandles });
      return usersByHandles;
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getUsersByHandlesReturnOnly: async (
    handles: Array<string>
  ): Promise<UserListItem[] | undefined> => {
    try {
      const usersByHandles = await (
        await getUserActor()
      ).getUsersByHandles(
        handles.map((handle) => {
          return handle.toLowerCase();
        })
      );
      return usersByHandles;
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getMyFollowers: async (
    indexStart: number,
    indexEnd: number
  ): Promise<void> => {
    try {
      let result = await (await getUserActor()).getMyFollowers(indexStart, indexEnd)
      if(Err in result){
        toastError(result.err)
      }
      else{
        let followers = result.ok
        let existingFollowers = get().myFollowers;
        
        if (existingFollowers && indexStart !== 0) {
          let merged = existingFollowers;
          followers.forEach((user)=>{
            merged.push(user)
          })
          let myFollowers = merged.filter(
            (v, i, a) => a.findIndex((t) => t.handle === v.handle) === i
          );
          set({ myFollowers: myFollowers });
        } else {
          set({ myFollowers: followers });
        }
        
        
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  getAllUsersHandles: async (): Promise<string[]> => {
    if (get().allUsersHandles.length > 0) {
      //refresh the users list but don't wait for the response
      (await getUserActor()).getAllHandles().then((allUsersHandles)=>{
        set({allUsersHandles})
      })
      return get().allUsersHandles;
    }
    let allUsersHandles = await (await getUserActor()).getAllHandles();
    set({ allUsersHandles });
    return allUsersHandles;
  },

  getAllPublicationsHandles: async (): Promise<[string, string][]> => {
    if (get().allPublicationsHandlesAndCanisterIds.length > 0) {
      //refresh the publications list but don't wait for the response
      (await getPostCoreActor()).getPublicationCanisters().then((allPublicationsHandlesAndCanisterIds)=>{
        set({ allPublicationsHandlesAndCanisterIds });
      })
      return get().allPublicationsHandlesAndCanisterIds
    }
    let allPublicationsHandlesAndCanisterIds = await (
      await getPostCoreActor()
    ).getPublicationCanisters();
    set({ allPublicationsHandlesAndCanisterIds });
    return allPublicationsHandlesAndCanisterIds;
  },

  searchUsers: async (input: string): Promise<void> => {
    let allHandles = await get().getAllUsersHandles();
    let resultHandles = findSimilarHandles(input, allHandles);
    let users = await (await getUserActor()).getUsersByHandles(resultHandles);
    set({searchUserResults: users});
  },
  searchPublications: async (input: string): Promise<void> => {
    let allPublications = await get().getAllPublicationsHandles();
    let handleToCanisterIdMap = new Map<string, string>()
    let handles : string[] = [];
    allPublications.forEach((entry)=>{
      handleToCanisterIdMap.set(entry[0], entry[1])
      handles.push(entry[0])
    });
    let resultHandles = findSimilarHandles(input, handles);
    let promises = []
    for(const handle of resultHandles){
      let canisterId = handleToCanisterIdMap.get(handle);
      if(canisterId){
        let promise = (await getPublisherActor(canisterId)).getPublicationQuery(handle);
        promises.push(promise)
      }
    }
    let results = await Promise.all(promises);
    let publications : PublicationType[] = [];
    results.forEach((result)=>{
      if(!(Err in result)){
        publications.push(result.ok)
      }
    });
    set({ searchPublicationResults: publications });
    
    
  },

  updateBio: async (bio: string): Promise<void> => {
    try {
      const result = await (await getUserActor()).updateBio(bio);
      if (Err in result) {
        toastError(result.err);
      } else {
        set({ user: toUserModel(result.ok) });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  updateAvatar: async (avatar: string): Promise<void> => {
    try {
      const result = await (await getUserActor()).updateAvatar(avatar);
      if (Err in result) {
        toastError(result.err);
      } else {
        set({ user: toUserModel(result.ok) });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  followAuthor: async (author: string): Promise<void> => {
    try {
      const result = await (await getUserActor()).followAuthor(author);
      if (Err in result) {
        toastError(result.err);
      } else {
        set({ user: toUserModel(result.ok) });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },
  unfollowAuthor: async (author: string): Promise<void> => {
    try {
      const result = await (await getUserActor()).unfollowAuthor(author);
      if (Err in result) {
        toastError(result.err);
      } else {
        set({ user: toUserModel(result.ok) });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  createEmailOptInAddress: async (emailAddress: string): Promise<void> => {
    try {
      const result = await (
        await getEmailOptInActor()
      ).createEmailOptInAddress(emailAddress);
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  clearAll: (): void => {
    set({}, true);
  },
});

export const useUserStore = create<UserStore>(
  persist(
    (set, get, api) => ({
      ...createUserStore(
        set as SetState<UserStore>,
        get as GetState<UserStore>,
        api as StoreApi<UserStore>
      ),
    }),
    {
      name: 'userStore',
      getStorage: () => sessionStorage,
    }
  )
);
