import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory as postCoreFactory } from './declarations/PostCore/index.js';
import { idlFactory as postBucketFactory } from './declarations/PostBucket/index.js';

// Replace these with actual canister IDs
const postCoreCanisterId = "322sd-3iaaa-aaaaf-qakgq-cai";

function createActor(canisterId, idlFactory) {
    const agent = new HttpAgent({ host: 'https://icp-api.io' });
    // Uncomment the next line when running locally
    // agent.fetchRootKey().catch(err => { console.warn('Unable to fetch root key. Proceeding without it.') });
    return Actor.createActor(idlFactory, { agent, canisterId });
}

function getPostCoreActor() {
    return createActor(postCoreCanisterId, postCoreFactory);
}



export async function fetchPostData(postId, bucketCanisterId) {
    try {

        function getPostBucketActor() {
            return createActor(bucketCanisterId, postBucketFactory);
        }
        // Fetch post key properties
        console.log('Fetching post key properties...');
        let coreReturn = await getPostCoreActor().getPostKeyProperties(postId);
        console.log('Post Key Properties:', coreReturn);

        // Fetch full post data from the bucket canister
        console.log('Fetching full post data from bucket canister...');
        let bucketReturn = await getPostBucketActor(bucketCanisterId).get(postId);
        console.log('Full Post Data:', bucketReturn);

        // Combine and return the results
        return { ...coreReturn, ...bucketReturn };
    } catch (err) {
        console.error('Error fetching post data:', err);
        throw err;
    }
}