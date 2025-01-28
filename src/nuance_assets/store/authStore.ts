import create, { GetState, SetState, StateCreator, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthClient, AuthClientLoginOptions } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { Usergeek } from 'usergeek-ic-js';
import { Agent, AnonymousIdentity, Identity } from '@dfinity/agent';
import {
  ToastType,
  toast,
  toastError,
  showBlockingToast,
} from '../services/toastService';
import { useUserStore, usePostStore } from './';
import { TokenPrice, UserWallet } from '../types/types';
import { AccountIdentifier } from '@dfinity/ledger-icp';
import {
  getAllCanisterIds,
  getIcrc1Actor,
  getIcrc1TokenActorAnonymous,
  getSonicActor,
  getUserActor,
  getCustomUserActor,
} from '../services/actorService';
import {
  ckUSDC_CANISTER_ID,
  NUA_CANISTER_ID,
  SONIC_POOLS,
  SUPPORTED_CANISTER_IDS,
  SUPPORTED_TOKENS,
  TokenBalance,
} from '../shared/constants';

const USER_CANISTER_ID = process.env.USER_CANISTER_ID || '';

const isLocal: boolean =
  window.location.origin.includes('localhost') ||
  window.location.origin.includes('127.0.0.1');
// II
const identityProvider: string = isLocal
  ? 'http://qhbym-qaaaa-aaaaa-aaafq-cai.localhost:8080/#authorize'
  : 'https://identity.ic0.app/#authorize';

const sessionTimeout: BigInt = //process.env.II_SESSION_TIMEOUT
  //   ? // configuration is in minutes, but API expects nanoseconds
  //     BigInt(process.env.II_SESSION_TIMEOUT) * BigInt(60) * BigInt(1_000_000_000)
  //   : // default = 8 hours

  //30 days in nanoseconds
  BigInt(480) * BigInt(60) * BigInt(1000000000) * BigInt(91);

var authClient: AuthClient;

// For login/logout across tabs
export const authChannel = new BroadcastChannel('auth_channel');

export interface AuthStore {
  readonly isInitialized: boolean;
  readonly isInitializedAgent: boolean;
  readonly isLoggedIn: boolean;
  readonly registrationError: string | undefined;
  readonly loginMethod: string | undefined;
  readonly redirectScreen: string;
  readonly userWallet: UserWallet | undefined;
  readonly tokenBalances: TokenBalance[];
  readonly restrictedTokenBalance: number;
  readonly tokenPrices: TokenPrice[];
  readonly agent?: Agent;
  readonly identity?: Identity;
  setAgent: (agent?: Agent) => void;
  setIdentity: (identity?: Identity) => void;
  getIdentity: () => Promise<Identity | undefined>;
  logout: () => Promise<void>;
  logoutDepreciated: () => Promise<void>;
  getUserWallet: () => Promise<UserWallet>;
  redirect: (url: string) => void;
  updateLastLogin: () => Promise<void>;
  fetchTokenBalances: () => Promise<void>;
  clearAll: () => void;
  clearLoginMethod: () => void;
  requestLinkInternetIdentity: () => Promise<Principal | null>;
}

// Encapsulates and abstracts AuthClient
// identity has a value when authenticated, otherwise it's undefined
// to get the principal, use identity?.getPrincipal()
const createAuthStore: StateCreator<AuthStore> | StoreApi<AuthStore> = (
  set,
  get
) => ({
  isInitialized: false,
  isInitializedAgent: false,
  isLoggedIn: false,
  registrationError: undefined,
  loginMethod: undefined,
  redirectScreen: '/',
  userWallet: undefined,
  tokenBalances: [],
  restrictedTokenBalance: 0,
  tokenPrices: [],
  agent: undefined,
  identity: undefined,

  redirect: (_screen: string) => {
    set((state) => ({ redirectScreen: _screen }));
  },

  setAgent: (agent?: Agent) => {
    set({
      agent,
    });
  },

  setIdentity: (identity?: Identity) => {
    if (identity !== undefined) {
      set({ isLoggedIn: true });
    }
    set({ identity });
  },

  fetchTokenBalances: async (): Promise<void> => {
    let wallet = await get().getUserWallet();
    let user = useUserStore.getState().user;
    //fire and forget
    useUserStore.getState().checkMyClaimNotification();
    console.log("claim not console");
    if (!user) {
      return;
    }
    if (wallet.principal.length === 0) {
      return;
    }

    let pid = wallet.principal;
    let tokenBalancesPromises = [];

    for (const supportedToken of SUPPORTED_TOKENS) {
      //add the promise for token balance
      tokenBalancesPromises.push(
        (
          await getIcrc1TokenActorAnonymous(supportedToken.canisterId)
        ).icrc1_balance_of({
          owner: Principal.fromText(pid),
          subaccount: [],
        })
      );
    }

    let tokenPricesPromises = [];
    for (const sonicPool of SONIC_POOLS) {
      tokenPricesPromises.push(
        (await getSonicActor(sonicPool.canisterId)).quote({
          amountIn: Math.pow(10, 8).toString(),
          zeroForOne: sonicPool.inputTokenSymbol !== 'ICP',
          amountOutMinimum: '',
        })
      );
    }

    let [
      tokenBalancesResponses,
      tokenPricesResponses,
      restrictedTokenBalance,
    ] = await Promise.all([
      Promise.all(tokenBalancesPromises),
      Promise.all(tokenPricesPromises),
      user.claimInfo.subaccount.length === 0
        ? 0
        : new Uint8Array(user.claimInfo.subaccount[0]).length === 0
          ? 0
          : (
            await getIcrc1Actor(NUA_CANISTER_ID)
          ).icrc1_balance_of({
            owner: Principal.fromText(USER_CANISTER_ID),
            subaccount: [new Uint8Array(user.claimInfo.subaccount[0])],
          }),
    ]);
    let tokenBalances: TokenBalance[] = tokenBalancesResponses.map(
      (balance, index) => {
        return {
          balance: Number(balance),
          token: SUPPORTED_TOKENS[index],
        };
      }
    );

    let tokenPrices: TokenPrice[] = [];
    tokenPricesResponses.forEach((response, index) => {
      if ('ok' in response) {
        tokenPrices.push({
          tokenSymbol:
            SONIC_POOLS[index].inputTokenSymbol === 'ICP'
              ? SONIC_POOLS[index].outputTokenSymbol
              : SONIC_POOLS[index].inputTokenSymbol,
          icpEquivalence: Number(response.ok),
        });
      }
    });
    set({ tokenBalances, tokenPrices });

    //if the subaccount value is not empty, set the restricted token balance value
    if (user.claimInfo.subaccount.length !== 0) {
      set({ restrictedTokenBalance: Number(restrictedTokenBalance) });
    }
  },

  updateLastLogin: async (): Promise<void> => {
    try {
      (await getUserActor(get().agent)).updateLastLogin();
    } catch (error) { }
  },

  logout: async () => {
    Usergeek.setPrincipal(Principal.anonymous());
    set({ isLoggedIn: false, agent: undefined, identity: undefined, isInitialized: false });
    authChannel.postMessage({ type: 'logout', date: new Date() });
    // clear all stores, and localStorage
    usePostStore.getState().clearAll();
    useUserStore.getState().clearAll();
    get().clearAll();
    localStorage?.clear();
    console.log('Logged out: ' + new Date());
  },

  getIdentity: async (): Promise<Identity | undefined> => {
    useUserStore.getState().getUser(get().agent);
    set({ isLoggedIn: true });
    return get().identity;
  },

  clearAll: (): void => {
    set({}, true);
  },

  getUserWallet: async (): Promise<UserWallet> => {
    const id = get().identity;
    if (id === undefined) {
      return { principal: '', accountId: '' };
    } else {
      const principal = id.getPrincipal();
      const userAccountId = AccountIdentifier.fromPrincipal({ principal }).toHex();

      const userWallet = {
        principal: principal.toText(),
        accountId: userAccountId,
      };

      set({ userWallet });
      return { principal: principal.toText(), accountId: userAccountId };
    }
  },

  clearLoginMethod: (): void => {
    set({ loginMethod: undefined });
  },

  logoutDepreciated: async () => {
    Usergeek.setPrincipal(Principal.anonymous());
    await authClient.logout();
    set({ isLoggedIn: false });
    authChannel.postMessage({ type: 'logout', date: new Date() });
    // clear all stores, and localStorage
    usePostStore.getState().clearAll();
    useUserStore.getState().clearAll();
    get().clearAll();
    localStorage?.clear();
    console.log('Logged out: ' + new Date());
  },

  requestLinkInternetIdentity: async (): Promise<Principal | null> => {
    return new Promise(async (resolve, reject) => {

      if (useAuthStore?.getState().loginMethod === undefined) {
        toast('Your login method is undefined. Please restore your session.', ToastType.Error);
        return;
      }

      try {
        const currentLoginMethod = await get().loginMethod;
        // get the current user's principal
        const currentUserPrincipal = (await get().getUserWallet()).principal;

        // create a separate AuthClient instance
        const linkAuthClient = await AuthClient.create();

        await linkAuthClient.login({
          identityProvider,
          maxTimeToLive: sessionTimeout as bigint,
          onSuccess: async () => {
            const iiIdentity = linkAuthClient.getIdentity();
            const iiPrincipal = iiIdentity.getPrincipal().toText();

            const userActor = await getUserActor();
            const request = await userActor.linkInternetIdentityRequest(
              currentUserPrincipal,
              iiPrincipal
            );

            if ('ok' in request) {
              // create an actor with the II identity
              const customUserActor = await getCustomUserActor(iiIdentity);
              const confirmation =
                await customUserActor.linkInternetIdentityConfirm(
                  currentUserPrincipal
                );

              if ('ok' in confirmation) {
                toast(
                  'Internet Identity linked successfully!',
                  ToastType.Success
                );
                resolve(Principal.fromText(iiPrincipal));
              } else {
                toastError(
                  ' Failed to confirm linking process.',
                  confirmation.err
                );
                resolve(null);
              }
            } else {
              toastError(' Failed to initiate linking process.', request.err);
              resolve(null);
            }

            // logout from the temporary AuthClient to prevent session conflicts
            await linkAuthClient.logout();
          },
          onError: (error) => {
            toastError(`Failed to link Internet Identity: ${error}`);
            resolve(null);
          },
        });
      } catch (error) {
        toastError(`An error occurred: ${error}`);
        resolve(null);
      }
    });
  },
});

export const useAuthStore = create<AuthStore>(
  persist(
    (set, get, api) => ({
      ...createAuthStore(
        set as SetState<AuthStore>,
        get as GetState<AuthStore>,
        api as StoreApi<AuthStore>
      ),
    }),
    {
      name: 'authStore',
      getStorage: () => localStorage,
    }
  )
);
