import create, { GetState, SetState, StateCreator, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthClient, AuthClientLoginOptions } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { Usergeek } from 'usergeek-ic-js';
import { AnonymousIdentity, Identity } from '@dfinity/agent';
import {
  ToastType,
  toast,
  toastError,
  showBlockingToast,
} from '../services/toastService';
import { useUserStore, usePostStore } from './';
import { StoicIdentity } from 'ic-stoic-identity';
import { PairInfo, UserWallet } from '../types/types';
import { AccountIdentifier } from '@dfinity/ledger-icp';
import {
  getAllCanisterIds,
  getIcrc1Actor,
  getIcrc1TokenActorAnonymous,
  getSonicActor,
  getUserActor,
} from '../services/actorService';
import {
  ckUSDC_CANISTER_ID,
  NUA_CANISTER_ID,
  SUPPORTED_CANISTER_IDS,
  SUPPORTED_TOKENS,
  TokenBalance,
} from '../shared/constants';
import { PairInfoExt } from '../services/sonic/Sonic.did';
import { getPriceBetweenTokens, truncateToDecimalPlace } from '../shared/utils';


const USER_CANISTER_ID = process.env.USER_CANISTER_ID || '';

const isLocal: boolean =
  window.location.origin.includes('localhost') ||
  window.location.origin.includes('127.0.0.1');
// II
const identityProvider: string = isLocal
  ? 'http://qhbym-qaaaa-aaaaa-aaafq-cai.localhost:8080/#authorize'
  : 'https://identity.ic0.app/#authorize';

//NFID
const APPLICATION_NAME = 'Nuance';
const APPLICATION_LOGO_URL = 'https://nuance.xyz/assets/images/nuance-logo.svg';
const AUTH_PATH =
  '/authenticate/?applicationName=' +
  APPLICATION_NAME +
  '&applicationLogo=' +
  APPLICATION_LOGO_URL +
  '#authorize';
const NFID_PROVIDER_URL: string = 'https://nfid.one' + AUTH_PATH;
const Local_NFID_PROVIDER_URL: string =
  'https://283d-2603-6010-8f00-9f00-c50b-3764-27be-5cc8.ngrok.io' + AUTH_PATH; //This will come from your ngrok server for local testing

const sessionTimeout: BigInt = //process.env.II_SESSION_TIMEOUT
  //   ? // configuration is in minutes, but API expects nanoseconds
  //     BigInt(process.env.II_SESSION_TIMEOUT) * BigInt(60) * BigInt(1_000_000_000)
  //   : // default = 8 hours
  BigInt(480) * BigInt(60) * BigInt(1_000_000_000);

const fakeProvider: boolean = process.env.II_PROVIDER_USE_FAKE == 'true';

var authClient: AuthClient;

//check derivation origin is PROD or UAT
const NuanceUATCanisterId = process.env.UAT_FRONTEND_CANISTER_ID || '';
const NuanceUAT = `https://${NuanceUATCanisterId}.ic0.app`;
const NuancePROD = 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app';

declare global {
  interface Navigator {
    brave: {
      isBrave: () => Promise<boolean>;
    };
  }
}
async function detectBrave() {
  if (navigator.brave) {
    const isBrave = await navigator.brave.isBrave();
    return isBrave;
  } else {
    return false;
  }
}

async function isChrome() {
  var userAgent = navigator.userAgent;
  let isBrave = await detectBrave();

  // Basic check for Chrome in userAgent
  var isChromeUA =
    userAgent.includes('Chrome') && !userAgent.includes('Edg') && !isBrave;
  var hasChromeFeatures = 'chrome' in window;

  return isChromeUA && hasChromeFeatures;
}

const derivationOrigin: string = window.location.origin.includes(
  NuanceUATCanisterId
)
  ? NuanceUAT
  : NuancePROD;

// For login/logout across tabs
export const authChannel = new BroadcastChannel('auth_channel');

export interface AuthStore {
  readonly isInitialized: boolean;
  readonly isLoggedIn: boolean;
  readonly registrationError: string | undefined;
  readonly loginMethod: string | undefined;
  readonly redirectScreen: string;
  readonly userWallet: UserWallet | undefined;
  readonly tokenBalances: TokenBalance[];
  readonly restrictedTokenBalance: number;
  readonly sonicTokenPairs: PairInfo[];
  login: (loginMethod: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdentity: () => Promise<Identity | undefined>;
  getUserWallet: () => Promise<UserWallet>;
  redirect: (url: string) => void;
  updateLastLogin: () => Promise<void>;
  verifyBitfinityWallet: () => Promise<void>;
  fetchTokenBalances: () => Promise<void>;
  clearAll: () => void;
  clearLoginMethod: () => void;
}

// Encapsulates and abstracts AuthClient
// identity has a value when authenticated, otherwise it's undefined
// to get the principal, use identity?.getPrincipal()
const createAuthStore: StateCreator<AuthStore> | StoreApi<AuthStore> = (
  set,
  get
) => ({
  isInitialized: false,
  isLoggedIn: false,
  registrationError: undefined,
  loginMethod: undefined,
  redirectScreen: '/',
  userWallet: undefined,
  tokenBalances: [],
  restrictedTokenBalance: 0,
  sonicTokenPairs: [],

  redirect: (_screen: string) => {
    set((state) => ({ redirectScreen: _screen }));
  },

  fetchTokenBalances: async (): Promise<void> => {
    let wallet = await get().getUserWallet();
    let user = useUserStore.getState().user;
    //fire and forget
    useUserStore.getState().checkMyClaimNotification();
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

    let sonicTokenPairsPromises = [];
    for (const supportedTokenCanisterId of SUPPORTED_CANISTER_IDS) {
      sonicTokenPairsPromises.push(
        (await getSonicActor()).getPair(
          Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
          Principal.fromText(supportedTokenCanisterId)
        )
      );
    }
    //add the ICP / ckUSDC pair
    sonicTokenPairsPromises.push(
      (await getSonicActor()).getPair(
        Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
        Principal.fromText(ckUSDC_CANISTER_ID) //ckUSDC canister id
      )
    );
    let [
      tokenBalancesResponses,
      sonicTokenPairsResponses,
      restrictedTokenBalance,
    ] = await Promise.all([
      Promise.all(tokenBalancesPromises),
      Promise.all(sonicTokenPairsPromises),
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
    let sonicTokenPairsIncludingUndefined = sonicTokenPairsResponses.map(
      (val) => {
        return val[0];
      }
    );
    let sonicTokenPairs: PairInfo[] = [];
    sonicTokenPairsIncludingUndefined.forEach((val) => {
      if (val) {
        sonicTokenPairs.push({
          token0: val.token0,
          token1: val.token1,
          reserve0: Number(val.reserve0),
          reserve1: Number(val.reserve1),
          id: val.id,
        });
      }
    });
    set({ tokenBalances, sonicTokenPairs });

    //if the subaccount value is not empty, set the restricted token balance value
    if (user.claimInfo.subaccount.length !== 0) {
      set({ restrictedTokenBalance: Number(restrictedTokenBalance) });
    }
  },

  updateLastLogin: async (): Promise<void> => {
    try {
      (await getUserActor()).updateLastLogin();
    } catch (error) {}
  },

  verifyBitfinityWallet: async (): Promise<void> => {
    let window_any = window as any;
    try {
      if (await window_any?.ic?.bitfinityWallet?.isConnected()) {
        set({ isLoggedIn: true, loginMethod: 'bitfinity' });
        Usergeek.setPrincipal(
          await window_any?.ic?.bitfinityWallet?.getPrincipal()
        );
        Usergeek.trackSession();
        Usergeek.flush();

        await useUserStore.getState().getUser();
        if (useUserStore.getState().user === undefined) {
          window.location.href = '/register';
        } else {
          //user fetched successfully, get the token balances
          await get().fetchTokenBalances();
        }
      } else if (get().loginMethod === 'bitfinity') {
        await get().logout();
        window.location.pathname = window.location.pathname;
      }
    } catch (error) {
      console.log(error);
    }
  },

  login: async (_loginMethod: string): Promise<void> => {
    set({ registrationError: undefined, isLoggedIn: false });
    if (_loginMethod === 'stoic') {
      let identity = await StoicIdentity.connect();
      set({ isLoggedIn: true, loginMethod: 'stoic' });
      authChannel.postMessage({ type: 'login', date: new Date() });
      Usergeek.setPrincipal(identity.getPrincipal());
      Usergeek.trackSession();
      Usergeek.flush();
      await useUserStore.getState().getUser();
      if (useUserStore.getState().user === undefined) {
        //check for brave browser
        const navigator = window.navigator as any;
        (navigator.brave && (await navigator.brave.isBrave())) || false
          ? alert(
              'Must enable all cookies for Stoic wallet to work with Brave browser'
            )
          : console.log('Not a brave browser');

        (await isChrome())
          ? await new Promise((resolve) => showBlockingToast('', resolve))
          : console.log('Not a chrome browser');
        window.location.href = '/register';
      } else {
        //user fetched successfully, get the token balances
        await get().fetchTokenBalances();
      }
    } else if (_loginMethod === 'ii') {
      StoicIdentity.disconnect();
      try {
        let window_any = window as any;
        window_any.ic.bitfinityWallet.disconnect();
      } catch (err) {}
      set({ loginMethod: 'ii' });
      if (!(await authClient?.isAuthenticated())) {
        await authClient.login(<AuthClientLoginOptions>{
          onSuccess: async () => {
            console.log('Logged in: ' + new Date());
            set({ isLoggedIn: true });
            authChannel.postMessage({ type: 'login', date: new Date() });
            Usergeek.setPrincipal(authClient.getIdentity().getPrincipal());
            Usergeek.trackSession();
            Usergeek.flush();

            await useUserStore.getState().getUser();
            if (useUserStore.getState().user === undefined) {
              window.location.href = '/register';
            } else {
              //user fetched successfully, get the token balances
              await get().fetchTokenBalances();
            }
          },
          onError: (error) => {
            set({ isLoggedIn: false, registrationError: error });
            toastError(error);
            if (useUserStore.getState().user === undefined) {
              window.location.href = '/register';
            }
          },
          identityProvider,
          maxTimeToLive: sessionTimeout,
          derivationOrigin: isLocal ? undefined : derivationOrigin,
        });
      } else {
        set({ isLoggedIn: true });
        await useUserStore.getState().getUser();
        if (useUserStore.getState().user === undefined) {
          window.location.href = '/register';
        } else {
          //user fetched successfully, get the token balances
          await get().fetchTokenBalances();
        }
      }
    } else if (_loginMethod === 'NFID') {
      StoicIdentity.disconnect();
      try {
        let window_any = window as any;
        window_any.ic.bitfinityWallet.disconnect();
      } catch (err) {}
      set({ loginMethod: 'NFID' });
      if (!(await authClient?.isAuthenticated())) {
        if (fakeProvider) {
          // for local development, the identity can be generated
          // bypassing the Internet Identity login workflow
          console.log('creating fake provider');
          authClient = await AuthClient.create({
            identity: Ed25519KeyIdentity.generate(),
            idleOptions: {
              disableIdle: true,
              disableDefaultIdleCallback: true,
            },
          });
          set({ isLoggedIn: true });
          await useUserStore.getState().getUser();
        } else {
          await authClient.login(<AuthClientLoginOptions>{
            onSuccess: async () => {
              console.log('Logged in: ' + new Date());
              set({ isLoggedIn: true });
              authChannel.postMessage({ type: 'login', date: new Date() });

              Usergeek.setPrincipal(authClient.getIdentity().getPrincipal());
              Usergeek.trackSession();
              Usergeek.flush();

              await useUserStore.getState().getUser();
              if (useUserStore.getState().user === undefined) {
                window.location.href = '/register';
              } else {
                //user fetched successfully, get the token balances
                await get().fetchTokenBalances();
              }
              /*
              else {
                window.location.href = useAuthStore.getState().redirectScreen;
              }
              */
            },
            onError: (error) => {
              set({ isLoggedIn: false, registrationError: error });
              toastError(error);
              if (useUserStore.getState().user === undefined) {
                window.location.href = '/register';
              }
            },
            identityProvider: isLocal
              ? Local_NFID_PROVIDER_URL
              : NFID_PROVIDER_URL,
            maxTimeToLive: sessionTimeout,
            derivationOrigin: isLocal ? undefined : derivationOrigin,
          });
        }
      }
    } else if (_loginMethod === 'bitfinity') {
      StoicIdentity.disconnect();
      let window_any = window as any;
      try {
        let bitfinity = window_any.ic.bitfinityWallet.getPrincipal as Function;
      } catch (error) {
        toastError('Bitfinity wallet not detected in browser.');
        set({ isLoggedIn: false, loginMethod: undefined });
        setTimeout(() => {
          window.open(
            'https://chrome.google.com/webstore/detail/bitfinity-wallet/jnldfbidonfeldmalbflbmlebbipcnle',
            '_blank'
          );
        }, 500);
        return;
      }
      try {
        await window_any?.ic?.bitfinityWallet?.requestConnect({
          whitelist: await getAllCanisterIds(),
        });
        set({ isLoggedIn: true, loginMethod: 'bitfinity' });
        authChannel.postMessage({ type: 'login', date: new Date() });
        Usergeek.setPrincipal(
          await window_any.ic.bitfinityWallet.getPrincipal()
        );
        Usergeek.trackSession();
        Usergeek.flush();
        await useUserStore.getState().getUser();
        if (useUserStore.getState().user === undefined) {
          window.location.href = '/register';
        } else {
          //user fetched successfully, get the token balances
          await get().fetchTokenBalances();
        }
      } catch (error) {
        set({ isLoggedIn: false, loginMethod: undefined });
        toastError('User interrupt.');
      }
    }
  },

  logout: async () => {
    let loginMethod = useAuthStore?.getState().loginMethod;
    if (!fakeProvider && loginMethod === 'ii') {
      Usergeek.setPrincipal(Principal.anonymous());
      await authClient.logout();
    } else if (loginMethod === 'stoic') {
      StoicIdentity.disconnect();
      Usergeek.setPrincipal(Principal.anonymous());
    } else if (loginMethod === 'bitfinity') {
      get().clearLoginMethod();
    } else if (loginMethod === 'NFID') {
      Usergeek.setPrincipal(Principal.anonymous());
      await authClient.logout();
    }
    set({ isLoggedIn: false });
    authChannel.postMessage({ type: 'logout', date: new Date() });
    // clear all stores, and sessionStorage
    usePostStore.getState().clearAll();
    useUserStore.getState().clearAll();
    get().clearAll();
    sessionStorage?.clear();
    console.log('Logged out: ' + new Date());
  },

  getIdentity: async (): Promise<Identity | undefined> => {
    let stcIdentity = await StoicIdentity.load();
    if (stcIdentity) {
      set({ isLoggedIn: true, loginMethod: 'stoic' });
      return stcIdentity;
    } else {
      try {
        if (!authClient) {
          authClient = await AuthClient.create({
            idleOptions: {
              disableIdle: true,
              disableDefaultIdleCallback: true,
            },
          });

          let isLoggedIn = await authClient.isAuthenticated();
          set({ isInitialized: true, isLoggedIn });
          if (isLoggedIn) {
            set({ loginMethod: 'ii' });
          }
          //no need to await and block the thread while app loads
          useUserStore.getState().getUser();
        }
      } catch (err) {
        toastError(err);
      }
      return authClient?.getIdentity();
    }
  },

  clearAll: (): void => {
    set({}, true);
  },

  getUserWallet: async (): Promise<UserWallet> => {
    if (get().loginMethod === 'bitfinity' && get().isLoggedIn) {
      let window_any = window as any;
      let principal =
        (await window_any.ic.bitfinityWallet.getPrincipal()) as Principal;
      let accountId = AccountIdentifier.fromPrincipal({
        principal: principal,
      }).toHex();
      set({
        userWallet: { principal: principal.toText(), accountId: accountId },
      });
      return { principal: principal.toText(), accountId: accountId };
    }
    var identity = await get().getIdentity();

    if (!identity) {
      return { principal: '', accountId: '' };
    }

    let userAccountId = AccountIdentifier.fromPrincipal({
      principal: identity.getPrincipal(),
    }).toHex();

    let userPrincipalId = identity.getPrincipal().toText();

    set({
      userWallet: { principal: userPrincipalId, accountId: userAccountId },
    });
    return { principal: userPrincipalId, accountId: userAccountId };
  },

  clearLoginMethod: (): void => {
    //stoic continues to connect and reconnect so it needs to be disconnected to login to II
    StoicIdentity.disconnect();
    try {
      let window_any = window as any;

      window_any.ic.bitfinityWallet.disconnect();
    } catch (err) {}
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
      getStorage: () => sessionStorage,
    }
  )
);
