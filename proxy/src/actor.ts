import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory as postCoreFactory } from '../declarations/PostCore/index.js';
import { idlFactory as postBucketFactory } from '../declarations/PostBucket/index.js';
import { idlFactory as userFactory } from '../declarations/User/index.js';


// Replace these with actual canister IDs
const postCoreCanisterId = "322sd-3iaaa-aaaaf-qakgq-cai";
const userCanisterId = "rtqeo-eyaaa-aaaaf-qaana-cai";

function createActor(canisterId : string, idlFactory : any) {
    const agent = new HttpAgent({ host: 'https://icp-api.io' });
    // Uncomment the next line when running locally
    // agent.fetchRootKey().catch(err => { console.warn('Unable to fetch root key. Proceeding without it.') });
    return Actor.createActor(idlFactory, { agent, canisterId });
}

function getPostCoreActor() {
    return createActor(postCoreCanisterId, postCoreFactory);
}

function getUserActor() {
    console.log('user actor...');
    return createActor(userCanisterId, userFactory);
}

function getPostBucketActor(bucketCanisterId : string) {
    return createActor(bucketCanisterId, postBucketFactory);
}

export async function fetchPostData(postId : string, bucketCanisterId : string) {
    try {

        // Fetch full post data from the bucket canister
        console.log('Fetching post data from bucket canister...');
        let bucketReturn = await getPostBucketActor(bucketCanisterId).getPostCompositeQuery(postId);

        return { bucketReturn };
    } catch (err) {
        console.error('Error fetching post data:', err);
        throw err;
    }


}

export async function getUserByHandle(handle : string) {
    try {
        let user = await getUserActor().getUserByHandle(handle.toLowerCase());
        return user;
    } catch (err) {
        console.error('Error fetching user:', err);
        throw err;
    }
}