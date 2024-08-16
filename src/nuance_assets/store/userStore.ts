import create, { GetState, SetState, StateCreator, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import { toastError, toast, ToastType } from '../services/toastService';
import { ErrorType, getErrorType } from '../services/errorService';
import { useAuthStore, useSubscriptionStore } from './';
import { UserType, UserListItem, PublicationType } from '../types/types';
import {
  getUserActor,
  User,
  Followers,
  UserPostCounts,
  getEmailOptInActor,
  getPostCoreActor,
  getPublisherActor,
  getNotificationsActor,
  Notifications,
  NotificationType,
  NotificationContent,
  UserNotificationSettings,
  getSubscriptionActor,
} from '../services/actorService';
import UserListElement from '../components/user-list-item/user-list-item';
import { ReaderSubscriptionDetailsConverted } from './subscriptionStore';

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

export function levenshteinDistance(a: string, b: string) {
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
    let distance = levenshteinDistance(lowerInput, handle.toLowerCase());
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

const mergeUsersWithNumberOfPublishedArticles = async (
  input: UserListItem[]
): Promise<UserListItem[]> => {
  let handles = input.map((el) => {
    return el.handle.toLowerCase();
  });
  let postCoreActor = await getPostCoreActor();
  let response = await postCoreActor.getUsersPostCountsByHandles(handles);
  return input.map((el, index) => {
    return { ...el, postCounts: response[index] };
  });
};

const mergePublicationsWithNumberOfPublishedArticlesAndUserListItem = async (
  input: PublicationType[]
): Promise<PublicationType[]> => {
  let handles = input.map((el) => {
    return el.publicationHandle.toLowerCase();
  });
  let postCoreActor = await getPostCoreActor();
  let userActor = await getUserActor();
  let [responsePostCounts, responseUserListItems] = await Promise.all([
    postCoreActor.getUsersPostCountsByHandles(handles),
    userActor.getUsersByHandles(handles),
  ]);
  return input.map((el, index) => {
    return {
      ...el,
      postCounts: responsePostCounts[index],
      userListItem: responseUserListItems[index],
    };
  });
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
  readonly notifications: Notifications[] | undefined;
  readonly totalNotificationCount: number;
  readonly unreadNotificationCount: number;
  readonly notificationsToasted: string[];

  registerUser: (
    handle: string,
    displayName: string,
    avatar: string
  ) => Promise<void>;
  isRegistrationOpen: () => Promise<boolean>;
  getUser: () => Promise<UserType | undefined>;
  getAuthor: (handle: string) => Promise<UserType | undefined>;
  getAllUsersHandles: () => Promise<string[]>;
  getAllPublicationsHandles: () => Promise<[string, string][]>;
  searchUsers: (input: string) => Promise<UserListItem[]>;
  searchPublications: (input: string) => Promise<PublicationType[]>;
  getUserPostCounts: (handle: string) => Promise<UserPostCounts | undefined>;
  getWriterPostCounts: (handle: string) => Promise<void>;
  getUserFollowersCount: (handle: string) => Promise<void>;
  clearUser: () => Promise<void>;
  clearAuthor: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  updateSocialLinks: (
    websiteUrl: string,
    socialChannelUrls: string[]
  ) => Promise<void>;
  updateUserDetails: (
    bio: string,
    avatarUrl: string,
    displayName: string,
    websiteUrl: string,
    socialChannelUrls: string[]
  ) => Promise<UserType | undefined>;
  updateBio: (bio: string) => Promise<void>;
  followAuthor: (author: string) => Promise<void>;
  unfollowAuthor: (author: string) => Promise<void>;
  getUsersByHandles: (
    handles: Array<string>
  ) => Promise<UserListItem[] | undefined>;
  getUsersByHandlesReturnOnly: (
    handles: Array<string>
  ) => Promise<UserListItem[] | undefined>;
  getMyFollowers: (
    indexStart: number,
    indexEnd: number
  ) => Promise<UserListItem[]>;
  getPrincipalByHandle: (handle: string) => Promise<string | undefined>;
  createEmailOptInAddress: (emailAddress: string) => Promise<void>;

  getUserNotifications: (
    from: number,
    to: number,
    isLoggedIn: boolean
  ) => Promise<void>;
  checkMyClaimNotification: () => Promise<void>;
  loadMoreNotifications: (from: number, to: number) => Promise<void>;
  createNotification: (
    notificationType: NotificationType,
    notificationContent: NotificationContent
  ) => Promise<void>;
  markNotificationAsRead: (notificationId: string[]) => Promise<void>;
  markAllNotificationsAsRead: () => void;
  resetUnreadNotificationCount: () => void;
  updateUserNotificationSettings: (
    notificationSettings: UserNotificationSettings
  ) => Promise<void>;
  getUserNotificationSettings: () => void;
  claimTokens: () => Promise<boolean | void>;
  spendRestrictedTokensForTipping: (
    postId: string,
    bucketCanisterId: string,
    amount: number
  ) => Promise<boolean | void>;
  clearAll: () => void;
}

const toUserModel = (user: User): UserType => {
  return {
    ...user,
    lastLogin: 0,
    followedTags: [],
    claimInfo: {
      ...user.claimInfo,
      maxClaimableTokens: Number(user.claimInfo.maxClaimableTokens),
      lastClaimDate:
        user.claimInfo.lastClaimDate[0] === undefined
          ? []
          : [Number(user.claimInfo.lastClaimDate[0])],
    },
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
  notifications: undefined,
  unreadNotificationCount: 0,
  totalNotificationCount: 0,
  notificationsToasted: [],

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

  getUser: async (): Promise<UserType | undefined> => {
    try {
      console.log('getUser here: ')
      const result = await (await getUserActor()).getUser();
      console.log('getUser result: ', result)
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
        //fetch the token balances in background
        useAuthStore.getState().fetchTokenBalances();
        return user;
      }
    } catch (err: any) {
      //check if the error contains 403 () by parsing the error message
      console.log(err);
      if (
        err.message.includes('403') &&
        err.message.includes('EcdsaP256 signature')
      ) {
        //should be a rare event, but when this happens we need to clear local stores.
        console.log(
          'Removed local state to resync browser window, please relogin.'
        );
        //clear all
        useUserStore.getState().clearAll();
      }
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

  getUserPostCounts: async (
    handle: string
  ): Promise<UserPostCounts | undefined> => {
    try {
      const userPostCounts = await (
        await getPostCoreActor()
      ).getUserPostCounts(handle.toLowerCase());

      set({ userPostCounts });
      return userPostCounts;
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

  getAuthor: async (handle: string): Promise<UserType | undefined> => {
    try {
      const result = await (
        await getUserActor()
      ).getUserByHandle(handle.trim().toLowerCase());
      if (Err in result) {
        set({ author: undefined });
        toastError(result.err);
      } else {
        set({ author: toUserModel(result.ok) });
        return toUserModel(result.ok);
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
  ): Promise<UserListItem[]> => {
    try {
      let result = await (await getUserActor()).getMyFollowers();

      if (Err in result) {
        toastError(result.err);
        return [];
      } else {
        return result.ok;
      }
    } catch (err) {
      handleError(err, Unexpected);
      return [];
    }
  },

  getAllUsersHandles: async (): Promise<string[]> => {
    if (get().allUsersHandles.length > 0) {
      //refresh the users list but don't wait for the response
      (await getUserActor()).getAllHandles().then((allUsersHandles) => {
        set({ allUsersHandles });
      });
      return get().allUsersHandles;
    }
    let allUsersHandles = await (await getUserActor()).getAllHandles();
    set({ allUsersHandles });
    return allUsersHandles;
  },

  getAllPublicationsHandles: async (): Promise<[string, string][]> => {
    if (get().allPublicationsHandlesAndCanisterIds.length > 0) {
      //refresh the publications list but don't wait for the response
      (await getPostCoreActor())
        .getPublicationCanisters()
        .then((allPublicationsHandlesAndCanisterIds) => {
          set({ allPublicationsHandlesAndCanisterIds });
        });
      return get().allPublicationsHandlesAndCanisterIds;
    }
    let allPublicationsHandlesAndCanisterIds = await (
      await getPostCoreActor()
    ).getPublicationCanisters();
    set({ allPublicationsHandlesAndCanisterIds });
    return allPublicationsHandlesAndCanisterIds;
  },

  searchUsers: async (input: string): Promise<UserListItem[]> => {
    let allHandles = await get().getAllUsersHandles();
    let resultHandles = findSimilarHandles(input, allHandles);
    let users = await (await getUserActor()).getUsersByHandles(resultHandles);
    let usersMerged = await mergeUsersWithNumberOfPublishedArticles(users);
    set({ searchUserResults: usersMerged });
    return usersMerged;
  },
  searchPublications: async (input: string): Promise<PublicationType[]> => {
    let allPublications = await get().getAllPublicationsHandles();
    let handleToCanisterIdMap = new Map<string, string>();
    let handles: string[] = [];
    allPublications.forEach((entry) => {
      handleToCanisterIdMap.set(entry[0].toLowerCase(), entry[1]);
      handles.push(entry[0]);
    });
    let resultHandles = findSimilarHandles(input, handles);
    let promises = [];
    for (const handle of resultHandles) {
      let canisterId = handleToCanisterIdMap.get(handle);
      if (canisterId) {
        let promise = (await getPublisherActor(canisterId)).getPublicationQuery(
          handle
        );
        promises.push(promise);
      }
    }
    let results = await Promise.all(promises);
    let publications: PublicationType[] = [];
    results.forEach((result) => {
      if (!(Err in result)) {
        publications.push(result.ok);
      }
    });
    let mergedPublications =
      await mergePublicationsWithNumberOfPublishedArticlesAndUserListItem(
        publications
      );
    set({ searchPublicationResults: mergedPublications });
    return mergedPublications;
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

  updateSocialLinks: async (
    websiteUrl: string,
    socialChannelUrls: string[]
  ): Promise<void> => {
    try {
      const result = await (
        await getUserActor()
      ).updateSocialLinks(websiteUrl, socialChannelUrls);
      if (Err in result) {
        toastError(result.err);
      } else {
        set({ user: toUserModel(result.ok) });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  updateUserDetails: async (
    bio: string,
    avatarUrl: string,
    displayName: string,
    websiteUrl: string,
    socialChannelUrls: string[]
  ): Promise<UserType | undefined> => {
    try {
      const result = await (
        await getUserActor()
      ).updateUserDetails(
        bio,
        avatarUrl,
        displayName,
        websiteUrl,
        socialChannelUrls
      );
      if (Err in result) {
        toastError(result.err);
      } else {
        set({ user: toUserModel(result.ok) });
        return toUserModel(result.ok);
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

  //notifications
  getUserNotifications: async (
    from: number,
    to: number,
    isLoggedIn: boolean
  ): Promise<void> => {
    if (isLoggedIn) {
      try {
        const result = await (
          await getNotificationsActor()
        ).getUserNotifications(JSON.stringify(from), JSON.stringify(to));
        var toToast = [];

        if (Err in result) {
          toastError(result.err);
        } else {
          set({ notifications: result.ok[0] });
          set({ unreadNotificationCount: 0 });
          set({ totalNotificationCount: Number(result.ok[1]) });
          for (let i = 0; i < result.ok[0].length; i++) {
            if (result.ok[0][i].read === false) {
              set((state) => ({
                unreadNotificationCount: state.unreadNotificationCount + 1,
              }));
              if (!get().notificationsToasted.includes(result.ok[0][i].id)) {
                toToast.push(result.ok[0][i]);
                set((state) => ({
                  notificationsToasted: [
                    ...state.notificationsToasted,
                    result.ok[0][i].id,
                  ],
                }));
              }
            }
          }
        }

        if (toToast?.length > 0) {
          toast(JSON.stringify(toToast), ToastType.Notification);
        }
      } catch (err) {
        console.error('getUserNotifications:', err);
      }
    }
  },

  checkMyClaimNotification: async (): Promise<void> => {
    try {
      let userActor = await getUserActor();
      //fire and forget
      userActor.checkMyClaimNotification();
    } catch (error) {
      console.log(error);
    }
  },

  loadMoreNotifications: async (from: number, to: number): Promise<void> => {
    try {
      const result = await (
        await getNotificationsActor()
      ).getUserNotifications(JSON.stringify(from), JSON.stringify(to));
      if (Err in result) {
        toastError(result.err);
      } else {
        let notifications = get().notifications || [];
        set({ notifications: [...notifications, ...result.ok[0]] });
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  createNotification: async (
    notificationType: NotificationType,
    notificationContent: NotificationContent
  ): Promise<void> => {
    try {
      const result = await (
        await getNotificationsActor()
      ).createNotification(notificationType, notificationContent);
      if (Err in result) {
        console.log('createNotification:', result.err);
      } else {
        console.log('createNotification:', result.ok);
      }
    } catch (err) {
      console.log('createNotification:', err);
    }
  },

  markNotificationAsRead: async (notificationId: string[]): Promise<void> => {
    try {
      const result = await (
        await getNotificationsActor()
      ).markNotificationAsRead(notificationId);
      if (Err in result) {
        toastError(result.err);
      } else {
        console.log('markNotificationAsRead:', result.ok);
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  markAllNotificationsAsRead: async () => {
    let notifications = get().notifications || [];
    let notificationIds = notifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id);
    if (notificationIds.length > 0) {
      set({
        notifications: notifications.map((notification) => {
          return {
            ...notification,
            read: true,
          };
        }),
      });
      set({ unreadNotificationCount: 0 });
      try {
        const result = await (
          await getNotificationsActor()
        ).markNotificationAsRead(notificationIds);
        if (Err in result) {
          console.error('markAllNotificationsAsRead:', result.err);
        } else {
          set({ unreadNotificationCount: 0 });
        }
      } catch (err) {
        console.error('markAllNotificationsAsRead:', err);
      }
    }
  },

  getUserNotificationSettings: async (): Promise<UserNotificationSettings | undefined> => {
      try {
        const result = await (await getNotificationsActor()).getUserNotificationSettings();
        if (Err in result) {
          toastError(result.err);
        } else {
          return result.ok;
        }
      } catch (err) {
        handleError(err, Unexpected);
      }
      return undefined;
    },

  //users can call this method to claim their restricted tokens
  claimTokens: async (): Promise<boolean | void> => {
    try {
      let userActor = await getUserActor();
      let response = await userActor.claimRestrictedTokens();
      if ('err' in response) {
        handleError(response.err);
      } else {
        //claim successful
        //refresh the balances
        await useAuthStore.getState().fetchTokenBalances();
        //set the user object with the updated value
        set({ user: toUserModel(response.ok) });
        return true;
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },
  //gets the postId, bucketCanisterId and the amount as an argument
  //sends the restricted tokens to the correspnding subaccount of the PostBucket canister
  spendRestrictedTokensForTipping: async (
    postId: string,
    bucketCanisterId: string,
    amount: number
  ): Promise<boolean | void> => {
    try {
      let userActor = await getUserActor();
      let response = await userActor.spendRestrictedTokensForTipping(
        bucketCanisterId,
        postId,
        BigInt(amount)
      );
      if ('err' in response) {
        handleError(response.err);
      } else {
        //event is successful
        //refresh the balances
        await useAuthStore.getState().fetchTokenBalances();
        return true;
      }
    } catch (err) {
      handleError(err, Unexpected);
    }
  },

  resetUnreadNotificationCount: (): void => {
    set({ unreadNotificationCount: 0 });
  },

  updateUserNotificationSettings: async (
    notificationSettings: UserNotificationSettings
  ): Promise<void> => {
    try {
      const result = await (
        await getNotificationsActor()
      ).updateUserNotificationSettings(notificationSettings);
      if (Err in result) {
        toastError(result.err);
      } else {
        console.log('updateUserNotificationSettings:', result.ok);
      }
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
