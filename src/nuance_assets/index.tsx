import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { IdentityKitAuthType } from '@nfid/identitykit';
import { IdentityKitProvider } from '@nfid/identitykit/react';
import '@nfid/identitykit/react/styles.css';
import { NFIDW, Plug, InternetIdentity, Stoic } from '@nfid/identitykit';
import { BACKEND_CANISTER_ID, FRONTEND_CANISTER_ID } from './auth/actorService';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <IdentityKitProvider
      signers={[NFIDW, Plug, InternetIdentity, Stoic]}
      signerClientOptions={{
        targets: [BACKEND_CANISTER_ID],
      }}
      authType={IdentityKitAuthType.DELEGATION}
    >
      <App />
    </IdentityKitProvider>
  </React.StrictMode>
);
