import { useEffect } from 'react';
import { useAgent, useIdentity } from '@nfid/identitykit/react';
import { useAuthStore } from '../store/authStore';

export function useSyncIdentity() {
  const agent = useAgent();
  const setAgent = useAuthStore((state) => state.setAgent);

  useEffect(() => {
    setAgent(agent ?? undefined);
  }, [agent, setAgent]);
}
