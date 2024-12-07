import create, { GetState, SetState, StateCreator, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  toastError,
  toast,
  ToastType,
  toastNotification,
} from '../services/toastService';
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
  Notification,
  UserNotificationSettings,
  NotificationContent,
} from '../services/actorService';
import { removeDuplicatesFromArray } from '../shared/utils';
import { NavigateFunction } from 'react-router-dom';
import { requestVerifiablePresentation, VerifiablePresentationResponse } from '@dfinity/verifiable-credentials/request-verifiable-presentation';
import { Principal } from '@dfinity/principal';

const Err = 'err';
const Unexpected = 'Unexpected error: ';
const UserNotFound = 'User not found';

//check derivation origin is PROD or UAT
const NuanceUATCanisterId = process.env.UAT_FRONTEND_CANISTER_ID || '';
const NuanceUAT = `https://${NuanceUATCanisterId}.ic0.app`;
const NuancePROD = 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app';

const derivationOrigin: string = window.location.origin.includes(
  NuanceUATCanisterId
)
  ? NuanceUAT
  : NuancePROD;

const isLocal: boolean =
window.location.origin.includes('localhost') ||
window.location.origin.includes('127.0.0.1');

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
const getPrincipalIdsFromNotificationContent = (
  notificationContent: NotificationContent
): string[] => {
  if ('FaucetClaimAvailable' in notificationContent) {
    return [];
  } else if ('TipReceived' in notificationContent) {
    let content = notificationContent.TipReceived;
    if (content.publicationPrincipalId.length === 0) {
      return [content.tipSenderPrincipal];
    } else {
      return [content.publicationPrincipalId[0], content.tipSenderPrincipal];
    }
  } else if ('NewArticleByFollowedWriter' in notificationContent) {
    let content = notificationContent.NewArticleByFollowedWriter;
    return [content.postWriterPrincipal];
  } else if ('AuthorLosesSubscriber' in notificationContent) {
    let content = notificationContent.AuthorLosesSubscriber;
    return [content.subscriberPrincipalId];
  } else if ('YouSubscribedToAuthor' in notificationContent) {
    let content = notificationContent.YouSubscribedToAuthor;
    return [content.subscribedWriterPrincipalId];
  } else if ('NewCommentOnMyArticle' in notificationContent) {
    let content = notificationContent.NewCommentOnMyArticle;
    return [content.commenterPrincipal];
  } else if ('YouUnsubscribedFromAuthor' in notificationContent) {
    let content = notificationContent.YouUnsubscribedFromAuthor;
    return [content.subscribedWriterPrincipalId];
  } else if ('NewFollower' in notificationContent) {
    let content = notificationContent.NewFollower;
    return [content.followerPrincipalId];
  } else if ('ReaderExpiredSubscription' in notificationContent) {
    let content = notificationContent.ReaderExpiredSubscription;
    return [content.subscribedWriterPrincipalId];
  } else if ('ReplyToMyComment' in notificationContent) {
    let content = notificationContent.ReplyToMyComment;
    return [content.postWriterPrincipal, content.replyCommenterPrincipal];
  } else if ('PremiumArticleSold' in notificationContent) {
    let content = notificationContent.PremiumArticleSold;
    if (content.publicationPrincipalId.length === 0) {
      return [content.purchaserPrincipal];
    } else {
      return [content.publicationPrincipalId[0], content.purchaserPrincipal];
    }
  } else if ('NewArticleByFollowedTag' in notificationContent) {
    let content = notificationContent.NewArticleByFollowedTag;
    return [content.postWriterPrincipal];
  } else if ('AuthorGainsNewSubscriber' in notificationContent) {
    let content = notificationContent.AuthorGainsNewSubscriber;
    return [content.subscriberPrincipalId];
  }
  return [];
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
  readonly notifications: Notification[] | undefined;
  readonly notificationUserListItems: UserListItem[];
  readonly totalNotificationCount: number;
  readonly unreadNotificationCount: number;
  readonly notificationsToasted: string[];
  readonly linkedPrincipal: string;

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
  getHandlesByPrincipals: (principals: string[]) => Promise<string[]>;
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
    navigate: NavigateFunction
  ) => Promise<void>;
  checkMyClaimNotification: () => Promise<void>;
  markNotificationsAsRead: (notificationId: string[]) => Promise<void>;
  markAllNotificationsAsRead: () => void;
  resetUnreadNotificationCount: () => void;
  updateUserNotificationSettings: (
    notificationSettings: UserNotificationSettings
  ) => Promise<void>;
  getUserNotificationSettings: () => Promise<
    UserNotificationSettings | undefined
  >;
  claimTokens: () => Promise<boolean | void>;
  spendRestrictedTokensForTipping: (
    postId: string,
    bucketCanisterId: string,
    amount: number
  ) => Promise<boolean | void>;
  proceedWithVerification: (userPrincipal: Principal) => Promise<void>;
  getLinkedPrincipal: (principal: string) => Promise<string | undefined>;
  verifyPoh: (jwt: string) => Promise<void>;
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
    isVerified: user.isVerified || false,
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
  notificationUserListItems: [],
  unreadNotificationCount: 0,
  totalNotificationCount: 0,
  notificationsToasted: [],
  linkedPrincipal: '',

  getLinkedPrincipal: async (principal: string): Promise<string | undefined> => {
    const userWallet = await useAuthStore.getState().getUserWallet();

    const result = await (
      await getUserActor()
    ).getLinkedPrincipal(userWallet.principal);
    if (!(Err in result)) {
      return result.ok;
    }
    return undefined;
  },

  verifyPoh: async (jwt: string): Promise<void> => {
    try {
      const result = await (await getUserActor()).verifyPoh(jwt);

      if ('Ok' in result) {
        const userResult = await (await getUserActor()).getUser();

        if ('ok' in userResult) {
          const user = toUserModel(userResult.ok);
          set ({ user });

          toast('Verification successful!', ToastType.Success);
        } else {
          console.error('Failed to fetch updated user:', userResult.err);
          toastError('Verification succeeded, but failed to update user information.');
        }
      } else {
        console.error('Verification failed:', result.Err);
        toastError('Verification failed: ' + result.Err);
      }
    } catch (error) {
      console.error('Error during PoH verification:', error);
      handleError(error, Unexpected);
    }
  },

  proceedWithVerification: async (verifyPrincipal: Principal): Promise<void> => {
    try {
      const jwt: string = await new Promise((resolve, reject) => {
        requestVerifiablePresentation({
          onSuccess: async (verifiablePresentation: VerifiablePresentationResponse) => {
            if ('Ok' in verifiablePresentation) {
              resolve(verifiablePresentation.Ok);
            } else {
              reject(new Error(verifiablePresentation.Err));
            }
          },
          onError(err) {
            reject(new Error(err));
          },
          issuerData: {
            origin: 'https://id.decideai.xyz',
            canisterId: Principal.fromText('qgxyr-pyaaa-aaaah-qdcwq-cai'),
          },
          credentialData: {
            credentialSpec: {
              credentialType: 'ProofOfUniqueness',
              arguments: {},
            },
            credentialSubject: verifyPrincipal,
          },
          identityProvider: new URL('https://identity.ic0.app/'),
          derivationOrigin: isLocal ? undefined : derivationOrigin,
        });
      });

      console.log("JWT: ", jwt);

      // verify the JWT credentials
      await get().verifyPoh(jwt);

    } catch (error) {
      console.error('Error during PoH verification:', error);
      handleError(error, Unexpected);
      // handle error
    }
  },

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

  getHandlesByPrincipals: async (principals: string[]): Promise<string[]> => {
    const result = await (
      await getUserActor()
    ).getHandlesByPrincipals(principals);
    if (!(Err in result)) {
      return result;
    }
    return [];
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
    navigate: NavigateFunction
  ): Promise<void> => {
    try {
      let notificationsActor = await getNotificationsActor();
      let result = await notificationsActor.getUserNotifications(
        JSON.stringify(from),
        JSON.stringify(to)
      );
      //get all the principal ids used in all notifications as an array
      let allPrincipalIds = result.notifications
        .map((notification) => {
          return getPrincipalIdsFromNotificationContent(notification.content);
        })
        .flat();
      if (result.notifications.length > 0) {
        //add the notificationReceiverPrincipalId
        allPrincipalIds.push(
          result.notifications[0].notificationReceiverPrincipalId
        );
      }
      //remove the duplicates
      allPrincipalIds = [...new Set(allPrincipalIds)];
      //get the user list items from the User canister
      let userActor = await getUserActor();
      let userListItems = await userActor.getUsersByPrincipals(allPrincipalIds);
      let existingUserListItems = Array.from(get().notificationUserListItems);
      existingUserListItems.forEach((userListItem) => {
        //if it doesn exist in userListItems, add it
        if (!allPrincipalIds.includes(userListItem.principal)) {
          userListItems.push(userListItem);
        }
      });

      let notifications: Notification[] = [];
      let existingNotifications = get().notifications;
      if (existingNotifications) {
        if (result.notifications.length > 0) {
          //make sure it's the same user
          existingNotifications = existingNotifications.filter(
            (existingNotification) =>
              existingNotification.notificationReceiverPrincipalId ===
              result.notifications[0].notificationReceiverPrincipalId
          );
        }
        //set the notifications array
        notifications = [...result.notifications, ...existingNotifications];
      } else {
        notifications = result.notifications;
      }

      //sort the notifications by the timestamp
      notifications.sort((n_1, n_2) => {
        return Number(n_2.timestamp) - Number(n_1.timestamp);
      });
      //remove the duplicates
      let notificationIds = notifications.map((val) => val.id);
      notificationIds = [...new Set(notificationIds)];
      let notificationsRemovedDuplicates = notificationIds.map(
        (notificationId) => {
          return notifications.find(
            (val) => val.id === notificationId
          ) as Notification;
        }
      );

      //handle toasting
      let alreadyToastedNotificationIds = get().notificationsToasted;
      let toToast = notificationsRemovedDuplicates.filter((val) => {
        return !alreadyToastedNotificationIds.includes(val.id) && !val.read;
      });
      console.log('toToast: ', toToast);
      if (toToast.length > 0) {
        toastNotification(toToast, userListItems, navigate);
      }

      //set the value in the userStore
      set({
        notificationUserListItems: userListItems,
        notifications: notificationsRemovedDuplicates,
        totalNotificationCount: Number(result.totalCount),
        unreadNotificationCount: result.notifications.filter(
          (notification) => !notification.read
        ).length,
        notificationsToasted: [
          ...alreadyToastedNotificationIds,
          ...toToast.map((n) => n.id),
        ],
      });
    } catch (err) {
      console.error('getUserNotifications:', err);
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

  markNotificationsAsRead: async (notificationIds: string[]): Promise<void> => {
    try {
      const result = await (
        await getNotificationsActor()
      ).markNotificationsAsRead(notificationIds);
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
      //optimistic update
      set({
        notifications: notifications.map((notification) => {
          return {
            ...notification,
            read: true,
          };
        }),
        unreadNotificationCount: 0,
      });
      //mark all as read
      let notificationActor = await getNotificationsActor();
      notificationActor.markNotificationsAsRead(notificationIds);
    }
  },

  getUserNotificationSettings: async (): Promise<
    UserNotificationSettings | undefined
  > => {
    try {
      const result = await (
        await getNotificationsActor()
      ).getUserNotificationSettings();
      return result;
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
        toastError("You need to verify your profile to request free NUA.");
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
      ).updateNotificationSettings(notificationSettings);
      if (Err in result) {
        toastError(result.err);
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
