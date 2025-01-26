import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import reportWebVitals from './reportWebVitals';
import { createRoot } from 'react-dom/client';
import { Usergeek } from 'usergeek-ic-js';
import { ContextProvider } from './contextes/Context';
import { ThemeProvider } from './contextes/ThemeContext';
import {
  IdentityKitAuthType,
  IdentityKitSignerConfig,
  MockedSigner,
} from '@nfid/identitykit';
import { IdentityKitProvider } from '@nfid/identitykit/react';
import '@nfid/identitykit/react/styles.css';
import { NFIDW, Plug, InternetIdentity, Stoic } from '@nfid/identitykit';

import './index.scss';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

import App from './App';
import { getAllTargetCanisterIds } from './services/actorService';
import Loader from './UI/loader/Loader';
import { useAuthStore } from './store';
import { Principal } from '@dfinity/principal';
import { authChannel } from './store/authStore';

const container = document.getElementById('root');
const root = createRoot(container!);

const MainApp = () => {
  const [targetCanisters, setTargetCanisters] = useState<string[]>([]);

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const targetCanisterIds = await getAllTargetCanisterIds();
        setTargetCanisters(targetCanisterIds);
      } catch (error) {
        console.error('Error fetching target canister IDs:', error);
        setTargetCanisters(['']); // provide a fallback
      }
    };

    fetchTargets();
  }, []);

  const isLocal: boolean =
    window.location.origin.includes('localhost') ||
    window.location.origin.includes('127.0.0.1');

  //check derivation origin is PROD or UAT
  const NuanceUATCanisterId = process.env.UAT_FRONTEND_CANISTER_ID || '';
  const NuanceUAT = `https://${NuanceUATCanisterId}.ic0.app`;
  const NuancePROD = 'https://t6unq-pqaaa-aaaai-q3nqa-cai.ic0.app';

  const derivationOrigin: string = window.location.origin.includes(
    NuanceUATCanisterId
  )
    ? NuanceUAT
    : NuancePROD;

  const sessionTimeout: BigInt = //process.env.II_SESSION_TIMEOUT
    //   ? // configuration is in minutes, but API expects nanoseconds
    //     BigInt(process.env.II_SESSION_TIMEOUT) * BigInt(60) * BigInt(1_000_000_000)
    //   : // default = 8 hours

    //30 days in nanoseconds
    BigInt(480) * BigInt(60) * BigInt(1000000000) * BigInt(91);

  const mockedSignerProvider = 'http://localhost:3003';

  let allSigners;

  if (isLocal) {
    allSigners = [
      NFIDW,
      Plug,
      {
        ...InternetIdentity,
        providerUrl:
          'http://qhbym-qaaaa-aaaaa-aaafq-cai.localhost:8080/#authorize',
      },
      Stoic,
      { ...MockedSigner, providerUrl: mockedSignerProvider },
    ];
  } else {
    allSigners = [NFIDW, Plug, InternetIdentity, Stoic];
  }

  if (targetCanisters.length === 0) {
    // Show a loading state while fetching the targets
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <Loader />
      </div>
    );
  }

  return (
    <IdentityKitProvider
      authType={IdentityKitAuthType.DELEGATION}
      signers={allSigners}
      signerClientOptions={{
        targets: targetCanisters,
        maxTimeToLive: sessionTimeout,
        idleOptions: {
          disableIdle: true,
        },
        derivationOrigin: isLocal
          ? window.location.origin.includes('t6unq-pqaaa-aaaai-q3nqa-cai')
            ? 'http://t6unq-pqaaa-aaaai-q3nqa-cai.localhost:8080'
            : 'http://localhost:8081'
          : derivationOrigin,
      }}
      onConnectSuccess={() => {
        useAuthStore.setState({ isLoggedIn: true });
        authChannel.postMessage({ type: 'login', date: new Date() });
        console.log('CONNECTED...');
      }}
      onDisconnect={() => {
        Usergeek.setPrincipal(Principal.anonymous());
        useAuthStore.setState({
          isLoggedIn: false,
          agent: undefined,
          identity: undefined,
          isInitialized: false,
        });
        console.log('Logged out: ' + new Date());
      }}
      onConnectFailure={(e: Error) => {
        useAuthStore.setState({
          isLoggedIn: false,
          agent: undefined,
          identity: undefined,
          isInitialized: false,
          loginMethod: undefined,
        });
        window.location.reload();
        console.warn(Error);
      }}
    >
      <ContextProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ContextProvider>
    </IdentityKitProvider>
  );
};

root.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

//init usergeek
// see: https://github.com/usergeek/usergeek-ic-js

const userGeekApiKey = process.env.USERGEEK_API_KEY || '';
const userGeekSecondaryApiKey = process.env.USERGEEK_API_KEY_SECONDARY || '';

if (process.env.NODE_ENV === 'development') {
  Usergeek.init({
    apiKey: userGeekApiKey,
    host: 'https://fbbjb-oyaaa-aaaah-qaojq-cai.raw.ic0.app/',
  });
  console.log('usergeek init in dev mode');
} else {
  Usergeek.init({ apiKey: userGeekSecondaryApiKey });
  console.log('usergeek init in prod mode');
  console.log(`fully decentralized :)`);
}
