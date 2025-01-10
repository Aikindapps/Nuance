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

const container = document.getElementById('root');
const root = createRoot(container!);

const MainApp = () => {
  const [targets, setTargets] = useState<string[] | null>(null);

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const targetCanisterIds = await getAllTargetCanisterIds();
        setTargets(targetCanisterIds);
      } catch (error) {
        console.error('Error fetching target canister IDs:', error);
        setTargets([]); // Optionally provide a fallback
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

  //const mockedSigner: IdentityKitSignerConfig = { ...MockedSigner, providerUrl: 'http://qhbym-qaaaa-aaaaa-aaafq-cai.localhost:8080/#authorize' }

  if (targets === null && useAuthStore?.getState().agent === undefined) {
    // Show a loading state while fetching the targets
    return <Loader />;
  }

  return (
    <IdentityKitProvider
      signers={[NFIDW, Plug, InternetIdentity, Stoic, MockedSigner]}
      signerClientOptions={{
        targets,
        maxTimetoLive: sessionTimeout,
        disableIdle: true,
      }}
      authType={IdentityKitAuthType.DELEGATION}
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
