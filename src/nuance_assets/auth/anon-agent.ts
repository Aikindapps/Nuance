import {
  AnonymousIdentity,
  HttpAgent,
} from '@dfinity/agent';
export const ICP_API_HOST = 'https://icp-api.io/';

export const getAnonAgent = () => {
  return HttpAgent.createSync({
    host: ICP_API_HOST,
    identity: new AnonymousIdentity(),
  });
};
