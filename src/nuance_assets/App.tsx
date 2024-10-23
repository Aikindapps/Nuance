import { useAgent, useIdentityKit } from '@nfid/identitykit/react';
import * as React from 'react';
import { NFIDW, Plug, InternetIdentity, Stoic } from '@nfid/identitykit';
import { getBackendActor, getNonTargetBackendActor } from './auth/actorService';

function App() {
  const {
    isInitializing,
    user,
    isUserConnecting,
    icpBalance,
    signer,
    identity,
    delegationType,
    accounts,
    connect,
    disconnect,
    fetchIcpBalance,
  } = useIdentityKit();

  const agent = useAgent();

  console.log({
    isInitializing,
    user,
    isUserConnecting,
    icpBalance,
    signer,
    identity,
    delegationType,
    accounts,
    connect,
    disconnect,
    fetchIcpBalance,
  });

  console.log('agent: ', agent);

  const connectFunction = (id: string) => {
    if (isInitializing || isUserConnecting) {
      return;
    }
    connect(id);
  };

  const [targetQueryResult, setTargetQueryResult] = React.useState<
    string | undefined
  >(undefined);
  const [targetQueryResultLoading, setTargetQueryResultLoading] =
    React.useState(false);

  const [targetUpdateResult, setTargetUpdateResult] = React.useState<
    string | undefined
  >(undefined);
  const [targetUpdateResultLoading, setTargetUpdateResultLoading] =
    React.useState(false);

  const [nonTargetQueryResult, setNonTargetQueryResult] = React.useState<
    string | undefined
  >(undefined);
  const [nonTargetQueryResultLoading, setNonTargetQueryResultLoading] =
    React.useState(false);

  const [nonTargetUpdateResult, setNonTargetUpdateResult] = React.useState<
    string | undefined
  >(undefined);
  const [nonTargetUpdateResultLoading, setNonTargetUpdateResultLoading] =
    React.useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        rowGap: 12,
      }}
    >
      <div>HELLO WORLD APP: TESTING THE IDENTITYKIT</div>
      {!isInitializing && !isUserConnecting && !user && (
        <div>
          <button
            onClick={() => {
              connectFunction(NFIDW.id);
            }}
          >
            Connect to NFID
          </button>
          <button
            onClick={() => {
              connectFunction(InternetIdentity.id);
            }}
          >
            Connect to II
          </button>
          <button
            onClick={() => {
              connectFunction(Plug.id);
            }}
          >
            Connect to PLUG
          </button>
          <button
            onClick={() => {
              connectFunction(Stoic.id);
            }}
          >
            Connect to Stoic
          </button>
        </div>
      )}
      <button
        onClick={() => {
          disconnect();
        }}
      >
        Disconnect
      </button>

      {isInitializing ? (
        <div>Initializing...</div>
      ) : isUserConnecting ? (
        <div>User is connecting...</div>
      ) : !agent && user ? (
        <div>User has connected but loading for the agent to load...</div>
      ) : agent && user ? (
        <div>
          User has connected. Here is the principal: {user.principal.toText()}
        </div>
      ) : (
        <div>Not connected</div>
      )}

      {targetQueryResultLoading ? (
        <div>Loading...</div>
      ) : (
        <button
          onClick={async () => {
            setTargetQueryResultLoading(true);
            try {
              let backendCanister = agent
                ? getBackendActor(agent)
                : getBackendActor();
              let res = await backendCanister.hello();
              setTargetQueryResult(res);
            } catch (error) {}
            setTargetQueryResultLoading(false);
          }}
        >
          Say hello to target backend canister using a query call(
          {agent ? 'using your principal' : 'anonymously'})
        </button>
      )}
      {targetQueryResultLoading
        ? null
        : targetQueryResult && (
            <div>
              Query result from the target backend canister: {targetQueryResult}
            </div>
          )}

      {targetUpdateResultLoading ? (
        <div>Loading...</div>
      ) : (
        <button
          onClick={async () => {
            setTargetUpdateResultLoading(true);
            try {
              let backendCanister = agent
                ? getBackendActor(agent)
                : getBackendActor();
              let res = await backendCanister.hello_update();
              setTargetUpdateResult(res);
            } catch (error) {}
            setTargetUpdateResultLoading(false);
          }}
        >
          Say hello to target backend canister using an update call(
          {agent ? 'using your principal' : 'anonymously'})
        </button>
      )}
      {targetUpdateResultLoading
        ? null
        : targetUpdateResult && (
            <div>
              Update call result from the target backend canister:{' '}
              {targetUpdateResult}
            </div>
          )}

      {nonTargetQueryResultLoading ? (
        <div>Loading...</div>
      ) : (
        <button
          onClick={async () => {
            setNonTargetQueryResultLoading(true);
            try {
              let nonTargetBackendCanister = agent
                ? getNonTargetBackendActor(agent)
                : getNonTargetBackendActor();
              let res = await nonTargetBackendCanister.hello();
              setNonTargetQueryResult(res);
            } catch (error) {}
            setNonTargetQueryResultLoading(false);
          }}
        >
          Say hello to NON target backend canister using a query call(
          {agent ? 'using your principal' : 'anonymously'})
        </button>
      )}
      {nonTargetQueryResultLoading
        ? null
        : nonTargetQueryResult && (
            <div>
              Query call result from the a NON target backend canister:{' '}
              {nonTargetQueryResult}
            </div>
          )}

      {nonTargetUpdateResultLoading ? (
        <div>Loading...</div>
      ) : (
        <button
          onClick={async () => {
            setNonTargetUpdateResultLoading(true);
            try {
              let nonTargetBackendCanister = agent
                ? getNonTargetBackendActor(agent)
                : getNonTargetBackendActor();
              let res = await nonTargetBackendCanister.hello_update();
              setNonTargetUpdateResult(res);
            } catch (error) {}
            setNonTargetUpdateResultLoading(false);
          }}
        >
          Say hello to NON target backend canister using an update call(
          {agent ? 'using your principal' : 'anonymously'})
        </button>
      )}
      {nonTargetUpdateResultLoading
        ? null
        : nonTargetUpdateResult && (
            <div>
              Query call result from the a NON target backend canister:{' '}
              {nonTargetUpdateResult}
            </div>
          )}
    </div>
  );
}

export default App;
