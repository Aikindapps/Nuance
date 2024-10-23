import {
  Actor,
  ActorSubclass,
  Agent,
  AnonymousIdentity,
  HttpAgent,
} from '@dfinity/agent';

import { _SERVICE as BackendService } from '../../declarations/backend/backend.did';
import { getAnonAgent } from './anon-agent';
import { createActor as createBackendActor } from '../../declarations/backend';

export const BACKEND_CANISTER_ID = 'vtrkc-hqaaa-aaaag-aburq-cai';
export const NON_TARGET_BACKEND_CANISTER_ID = 'e6dzb-jiaaa-aaaap-qbjua-cai';

export const FRONTEND_CANISTER_ID = 'q5gt5-niaaa-aaaak-qciba-cai';

export function getBackendActor(
  agentToUse?: Agent
): ActorSubclass<BackendService> {
  const agent = agentToUse ? agentToUse : getAnonAgent();

  return createBackendActor(BACKEND_CANISTER_ID as string, {
    agent,
  });
}

export function getNonTargetBackendActor(
  agentToUse?: Agent
): ActorSubclass<BackendService> {
  const agent = agentToUse ? agentToUse : getAnonAgent();

  return createBackendActor(NON_TARGET_BACKEND_CANISTER_ID as string, {
    agent,
  });
}
