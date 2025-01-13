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
import {
  CYCLES_DISPENSER_CANISTER_ID,
  FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID,
  KINIC_ENDPOINT_CANISTER_ID,
  NFT_FACTORY_CANISTER_ID,
  NOTIFICATIONS_CANISTER_ID,
  NUANCE_ASSETS_CANISTER_ID,
  POST_CORE_CANISTER_ID,
  POST_RELATIONS_CANISTER_ID,
  PUBLICATION_MANAGEMENT_CANISTER_ID,
  STORAGE_CANISTER_ID,
  SUBSCRIPTION_CANISTER_ID,
  USER_CANISTER_ID,
} from './services/canisterIds';

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
        setTargetCanisters(['']); // Optionally provide a fallback
      }
    };

    fetchTargets();
  }, []);

  const sessionTimeout: BigInt = //process.env.II_SESSION_TIMEOUT
    //   ? // configuration is in minutes, but API expects nanoseconds
    //     BigInt(process.env.II_SESSION_TIMEOUT) * BigInt(60) * BigInt(1_000_000_000)
    //   : // default = 8 hours

    //30 days in nanoseconds
    BigInt(480) * BigInt(60) * BigInt(1000000000) * BigInt(91);

  if (targetCanisters.length === 0) {
    // Show a loading state while fetching the targets
    return <Loader />;
  }
  console.log('TARGET CANISTER :', targetCanisters);
  return (
    <IdentityKitProvider
      authType={IdentityKitAuthType.DELEGATION}
      signers={[NFIDW, Plug, InternetIdentity, Stoic, MockedSigner]}
      signerClientOptions={{
        targets: targetCanisters,
        maxTimeToLive: sessionTimeout,
        idleOptions: {
          disableIdle: true,
        },
      }}
    >
      {console.log('TARGET CANISTERS IK PROVIDER :', targetCanisters)}
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
