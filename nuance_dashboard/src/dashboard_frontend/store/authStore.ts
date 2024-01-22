import { StoreApi, create } from "zustand";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";
import { toastError, toast, ToastType } from "../services/toastService";
import { Identity } from "@dfinity/agent";
import { identity } from "lodash";
// import { useUserStore } from "./userStore";

//const identityProvider = isLocal ? 'http://qhbym-qaaaa-aaaaa-aaafq-cai.localhost:8080/#authorize' : "https://identity.ic0.app/#authorize";
const sessionTimeout = BigInt(480) * BigInt(60) * BigInt(1_000_000_000);
const fakeProvider = process.env.II_PROVIDER_USE_FAKE == "true";
const derivationOrigin: string = "https://uq3uu-nqaaa-aaaam-qbcpq-cai.ic0.app";
var authClient: AuthClient;

export interface AuthState {
  principal: Principal | null;
  principalString: string | null;
  identity: Identity | null;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getIdentity: () => Promise<void>;
  init: () => Promise<void>;
}


async function getAuthClient() {
  if (!authClient) {
    authClient = await AuthClient.create();
  }
  return authClient;
}

const loginOptions = (identityProvider: string, isLocal: boolean, set: any) => ({
  identityProvider: identityProvider,
  maxTimeToLive: BigInt(7) * BigInt(24) * BigInt(3_600_000_000_000), // 1 week
  derivationOrigin: isLocal ? undefined : derivationOrigin,
  windowOpenerFeatures:
    'toolbar=0,location=0,menubar=0,width=500,height=500,left=100,top=100',
  onSuccess: async () => {
    console.log('Login Successful!');
    const client = await getAuthClient();
    await client.getIdentity();
    set({
      isLoggedIn: true,
      identity: client.getIdentity(),
      principal: client.getIdentity().getPrincipal(),
      principalString: client.getIdentity().getPrincipal().toText(),
    });
    toast('Login Successful!', ToastType.Success);
  },
  onError: (error: any) => {
    console.error('Login Failed: ', error);
    toastError('Login Failed: ' + error);
  },
});

async function initAuth(set : any) {
  console.log("initAuth")
  const storedState = sessionStorage.getItem("authStore");
 
  if (storedState) {
    try {
      const { principal, identity, isAuthenticated, isLoggedIn } = JSON.parse(storedState);
      console.log("identity -- init: ", identity);

      set({ principal, identity, isAuthenticated });
      set ({ isLoggedIn: useAuthStore.getState().principalString !== "2vxsx-fae" || useAuthStore.getState().principalString !== null});
      
    } catch (e) {
      console.error("Unable to parse stored state from sessionStorage:", e);
    }
  }

  
  const client = await getAuthClient();
  const isAuthenticated = await client.isAuthenticated();
  
  if (isAuthenticated) {
    const identity = await client.getIdentity();
    const principal = identity.getPrincipal();
    set({ principal, identity, isAuthenticated: true, isLoggedIn: principal.toText() !== "2vxsx-fae" });
  } else {
    set({ principal: null, identity: null, isAuthenticated: false, isLoggedIn: false });
  }
}


const sessionStorageMiddleware = (config : any) => (set : any, get : any, api : any) =>
  config(
    (args : any) => {
      set(args);
      try {
        sessionStorage.setItem(
          "authStore",
          JSON.stringify(api.getState())
        );
      } catch (e) {
        console.error("Unable to store data in sessionStorage:", e);
      }
    },
    get,
    api
  );

export const useAuthStore = create(
  sessionStorageMiddleware((set : any, get : any, api: StoreApi<AuthState>) => ({
    // Initial state
    principal: null,
    identity: null,
    isAuthenticated: false,
    

    // Actions
    login: async (isLocal: boolean) => {
      const client = await getAuthClient();
      const identityProvider = isLocal ? 'http://qhbym-qaaaa-aaaaa-aaafq-cai.localhost:8080/#authorize' : "https://identity.ic0.app/#authorize";
      await client.login(loginOptions(identityProvider, isLocal, set));

    },

    getIdentity: async () => {
      const client = await getAuthClient();
      const identity = await client.getIdentity();
      if (identity) {
        const principal = identity.getPrincipal();
        set({ principal: principal, identity: identity, isAuthenticated: true, principalString: principal.toText() });
        console.log ("principal: ", principal.toText())
      } else {
        set({ principal: null, identity: null, isAuthenticated: false });
      }
    },

    logout: async () => {
      const client = await getAuthClient();
      await client.logout();
      set({ principal: null, identity: null, isAuthenticated: false, isLoggedIn: false });
    },

    // Initialization
    init: async () => {
      await initAuth(set);
    },
  }))
);