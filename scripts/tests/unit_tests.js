const { spawnSync, execSync } = require('child_process');

function execCommand(command, args) {
    const spawnedProcess = spawnSync(command, args, { stdio: 'inherit' });
    if (spawnedProcess.error) {
        console.error(`error: ${spawnedProcess.error}`);
    }
    if (spawnedProcess.stderr) {
        console.error(`stderr: ${spawnedProcess.stderr}`);
    }
}

function extractData(result) {
    let postId = result.match(/.*postId = "([^"]+)".*/)[1];
    let bucketCanisterId = result.match(/.*bucketCanisterId = "([^"]+)".*/)[1];
    return { postId, bucketCanisterId };
}

// Fabricate cycles to all the canisters
console.log("Fabricating cycles to all the canisters");
execCommand('dfx', ['ledger', 'fabricate-cycles', '--all']);

// Create a new post
console.log("Creating a new post by calling the save method in PostCore Canister");
let saveResult = execSync('dfx canister call PostCore save \'(record {postId = ""; title = "scale this out"; subtitle = "lol"; headerImage = ""; content = "my content here"; isDraft = false; tagIds = vec{"3"}; creator = ""; isPublication = false; category = ""; isPremium = false;})\'', { encoding: 'utf-8' });

let { postId, bucketCanisterId } = extractData(saveResult);

console.log("Printing key properties fetched from PostCore canister -> getPostKeyProperties");
execSync(`dfx canister call PostCore getPostKeyProperties '("${postId}")'`, { stdio: 'inherit' });

console.log("Printing the full post fetched from bucket canister: PostBucket -> get");
execSync(`dfx canister call ${bucketCanisterId} get '("${postId}")'`, { stdio: 'inherit' });

console.log("Updating the post: PostCore -> save");
saveResult = execSync(`dfx canister call PostCore save '(record {postId = "${postId}"; title = "updating the post now"; subtitle = "trying to change the subtitle"; headerImage = ""; content = "my content here - updated"; isDraft = true; tagIds = vec{"3"; "1";}; creator = ""; isPublication = false; category = ""; isPremium = false;})'`, { encoding: 'utf-8' });

console.log("Update complete!");

console.log("Print the key properties after the update: PostCore -> getPostKeyProperties");
execSync(`dfx canister call PostCore getPostKeyProperties '("${postId}")'`, { stdio: 'inherit' });

console.log("Print the full post fetched from bucket canister after the update: PostBucket -> get");
execSync(`dfx canister call ${bucketCanisterId} get '("${postId}")'`, { stdio: 'inherit' });

console.log("Create a new bucket canister: PostCore -> createNewBucketCanister");
execSync('dfx canister call PostCore createNewBucketCanister', { stdio: 'inherit' });

console.log("Print all the bucket canisters");
execSync('dfx canister call PostCore getBucketCanisters', { stdio: 'inherit' });

console.log("Creating a new post after creating the new bucket canister: PostCore -> save");
saveResult = execSync('dfx canister call PostCore save \'(record {postId = ""; title = "new post in new bucket canister"; subtitle= "lol"; headerImage = ""; content = "my content here - new bucket canister"; isDraft = false; tagIds = vec{"3"}; creator = ""; isPublication = false; category = ""; isPremium = false;})\'', { encoding: 'utf-8' });

// Extract new post ID and bucket canister ID
let { postId: newPostId, bucketCanisterId: newBucketCanisterId } = extractData(saveResult);

console.log("Printing key properties fetched from PostCore canister -> getPostKeyProperties");
execSync(`dfx canister call PostCore getPostKeyProperties '("${newPostId}")'`, { stdio: 'inherit' });

console.log("Printing the full post fetched from bucket canister -> get");
execSync(`dfx canister call ${newBucketCanisterId} get '("${newPostId}")'`, { stdio: 'inherit' });

console.log("Calling getLatestPosts method from PostCore. It'll return the latest post's key properties: PostCore -> getLatestPosts");
execSync('dfx canister call PostCore getLatestPosts \'(0, 20)\'', { stdio: 'inherit' });

