import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory as postCoreFactory } from '../declarations/PostCore/index.js';
import { idlFactory as postBucketFactory } from '../declarations/PostBucket/index.js';
import { idlFactory as userFactory } from '../declarations/User/index.js';
import { Post } from '../declarations/PostBucket/PostBucket.did.js';
import { PostKeyProperties } from '../declarations/PostCore/PostCore.did.js';


// Replace these with actual canister IDs
const postCoreCanisterId = "4vm7k-tyaaa-aaaah-aq4wq-cai";
const userCanisterId = "wlam3-raaaa-aaaap-qpmaa-cai";

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


export async function getUserPosts(handle: string): Promise<PostKeyProperties[]> {
    try {
        let posts = await getPostCoreActor().getUserPosts(handle.toLowerCase()) as PostKeyProperties[];
        return posts; 
    } catch (err) {
        console.error('Error fetching user posts:', err);
        throw err;
    }
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

export async function getPostKeyProperties(postId : string) {
    try {
        let post = await getPostCoreActor().getPostKeyProperties(postId);
        return post as PostKeyProperties;
    } catch (err) {
        console.error('Error fetching post:', err);
        throw err;
    }
}

export async function getLatestPosts(from: number, to: number) {
    try {
        let posts = await getPostCoreActor().getLatestPosts(from, to);
        return posts;
    } catch (err) {
        console.error('Error fetching latest posts:', err);
        throw err;
    }
}

export async function getPopularThisWeek(from: number, to: number) {
    try {
        let posts = await getPostCoreActor().getPopularThisWeek(from, to);
        return posts;
    } catch (err) {
        console.error('Error fetching popular posts:', err);
        throw err;
    }
}

export async function getPostsByFollowers(handle: [string], from: number, to: number) {
    try {
        let posts = await getPostCoreActor().getPostsByFollowers(handle, from, to);
        return posts;
    } catch (err) {
        console.error('Error fetching posts by followers:', err);
        throw err;
    }
}