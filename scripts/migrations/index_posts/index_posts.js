var minterSeed = '<seed phrase here>';

require = require('esm-wallaby')(module);
var fetch = require('node-fetch');

const bip39 = require('bip39');
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

const Ed25519KeyIdentity = require('@dfinity/identity').Ed25519KeyIdentity;
const HttpAgent = require('@dfinity/agent').HttpAgent;
const Actor = require('@dfinity/agent').Actor;
const { PostCoreIDL } = require('./PostCore.did');
const { PostBucketIDL } = require('./PostBucket.did');
const { PostRelationsIDL } = require('./PostRelations.did');
const { Principal } = require('@dfinity/principal');

const IS_LOCAL = true;
const [POST_CORE_CANISTER_ID, POST_RELATIONS_CANISTER_ID] = [
  '4vm7k-tyaaa-aaaah-aq4wq-cai',
  'zjix6-iiaaa-aaaah-qpxca-cai',
];

const mnemonicToId = (mnemonic) => {
  let seed = bip39.mnemonicToSeedSync(mnemonic);
  var seed_buffer = Array.from(seed);
  seed_buffer = seed_buffer.splice(0, 32);
  let seed_uint8 = new Uint8Array(seed_buffer);
  return Ed25519KeyIdentity.generate(seed_uint8);
};

async function getPostCoreCanister() {
  const agent = new HttpAgent({
    identity: mnemonicToId(minterSeed),
    host: IS_LOCAL ? 'http://localhost:8080/' : 'https://icp-api.io',
  });

  if (IS_LOCAL) {
    agent.fetchRootKey().catch((err) => {
      console.warn(
        'Unable to fetch root key. Check to ensure that your local replica is running'
      );
      console.log(err);
    });
  }
  return Actor.createActor(PostCoreIDL, {
    agent: agent,
    canisterId: POST_CORE_CANISTER_ID, // your canister id on local network
  });
}

async function getPostRelationsCanister() {
  const agent = new HttpAgent({
    identity: mnemonicToId(minterSeed),
    host: IS_LOCAL ? 'http://localhost:8080/' : 'https://icp-api.io',
  });

  if (IS_LOCAL) {
    agent.fetchRootKey().catch((err) => {
      console.warn(
        'Unable to fetch root key. Check to ensure that your local replica is running'
      );
      console.log(err);
    });
  }
  return Actor.createActor(PostRelationsIDL, {
    agent: agent,
    canisterId: POST_RELATIONS_CANISTER_ID, // your canister id on local network
  });
}

async function getPostBucketCanister(canisterId) {
  const agent = new HttpAgent({
    identity: mnemonicToId(minterSeed),
    host: IS_LOCAL ? 'http://localhost:8080/' : 'https://icp-api.io',
  });

  if (IS_LOCAL) {
    agent.fetchRootKey().catch((err) => {
      console.warn(
        'Unable to fetch root key. Check to ensure that your local replica is running'
      );
      console.log(err);
    });
  }
  return Actor.createActor(PostBucketIDL, {
    agent: agent,
    canisterId: canisterId,
  });
}

const range = (startAt, size) => {
  return [...Array(size).keys()].map((i) => i + startAt);
};

const fetchPostsByBuckets = async (keyProperties) => {
  let bucketCanisterIdToPostIdsMap = new Map();
  let postIdToTagNames = new Map();
  keyProperties.forEach((keyProperty) => {
    let existingPostIds = bucketCanisterIdToPostIdsMap.get(
      keyProperty.bucketCanisterId
    );
    if (existingPostIds) {
      bucketCanisterIdToPostIdsMap.set(keyProperty.bucketCanisterId, [
        ...existingPostIds,
        keyProperty.postId,
      ]);
    } else {
      bucketCanisterIdToPostIdsMap.set(keyProperty.bucketCanisterId, [
        keyProperty.postId,
      ]);
    }

    postIdToTagNames.set(
      keyProperty.postId,
      keyProperty.tags.map((tagModel) => tagModel.tagName.toLowerCase())
    );
  });
  let promises = [];
  for (const entry of bucketCanisterIdToPostIdsMap) {
    let bucketCanisterId = entry[0];
    let postIds = entry[1];
    let bucketCanister = await getPostBucketCanister(bucketCanisterId);
    promises.push(bucketCanister.getPostsByPostIdsMigration(postIds));
  }
  let responses = await Promise.all(promises);
  let postBucketResponses = responses.flat();
  return postBucketResponses.map((postBucketResponse) => {
    return {
      ...postBucketResponse,
      tags: postIdToTagNames.get(postBucketResponse.postId),
    };
  });
};

(async () => {
  var isRunning = true;
  var counter = 0;
  let postCoreCanister = await getPostCoreCanister();
  let postRelationsCanister = await getPostRelationsCanister();
  console.log('Starting to index the posts by batches...');
  let currentId = Number(await postCoreCanister.currentId());
  console.log('The max postId value is ' + currentId);
  while (isRunning) {
    try {
      console.log(
        'Fetching the posts with the postId values in the array ' +
          range(counter * 100, 100)
      );
      let keyProperties = await postCoreCanister.getPostsByPostIdsMigration(
        range(counter * 100, 100).map((val) => val.toString())
      );
      console.log(
        'Key properties has been fetched successfully. The length is ' +
          keyProperties.length
      );
      let posts = await fetchPostsByBuckets(keyProperties);
      console.log(
        'Full posts has been fetched successfully. The length is ' +
          posts.length
      );

      console.log('Indexing the posts now...');
      await postRelationsCanister.indexPosts(
        posts.map((post) => {
          return {
            title: post.title,
            content: post.content,
            subtitle: post.subtitle,
            postId: post.postId,
            tags: post.tags,
          };
        })
      );
      console.log('Successfully indexed!');
    } catch (error) {
      //if any error happens, log the error and finish the loop
      isRunning = false;
      console.log('Error happened when the counter is ' + counter);
      console.log(error);
      return;
    }

    counter += 1;
    //check if the currentId value is still bigger than counter * 100
    console.log('Checking if currentId value is bigger than the counter*100');
    let currentId = Number(await postCoreCanister.currentId());
    if (currentId > counter * 100) {
      console.log('currentId: ' + currentId);
      console.log('counter*100: ' + counter * 100);
      console.log('Continue indexing');
    } else {
      isRunning = false;
      console.log('currentId: ' + currentId);
      console.log('counter*100: ' + counter * 100);
      console.log('Indexing is done!!!');
    }
  }
})();

/*
title: IDL.Text,
    content: IDL.Text,
    tags: IDL.Vec(IDL.Text),
    subtitle: IDL.Text,
    postId: IDL.Text,
*/
