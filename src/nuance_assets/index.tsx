import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { IdentityKitAuthType } from '@nfid/identitykit';
import { IdentityKitProvider } from '@nfid/identitykit/react';
import '@nfid/identitykit/react/styles.css';
import { NFIDW, Plug, InternetIdentity, Stoic } from '@nfid/identitykit';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <IdentityKitProvider authType={IdentityKitAuthType.DELEGATION}>
      <App />
    </IdentityKitProvider>
  </React.StrictMode>
);
