/**
 * This script retrieves and displays all canister IDs from a specific network
 * ('local' or 'ic') specified by the `NETWORK` environment variable.
 * When using IC network, the canister_ids.json file determines UAT or PROD canister IDs.
 * The path to the publications repository should be specified in the `PUBLICATIONS_REPO_PATH` environment variable.
 * 
 * Usage:
 *   node scripts/getAllCanisterIds.js                   - Prints canister IDs in array format, human-readable format and child canister info.
 *   node scripts/getAllCanisterIds.js -h                - Prints human-readable "named" canister IDs and child canister info with total count.
 *   node scripts/getAllCanisterIds.js -arr              - Prints canister IDs in array format for an array of all canisterIDs.
 *   node scripts/getAllCanisterIds.js -CyclesDispenser  - Prints privileged and non-privileged canister IDs for cycles dispenser script.
 *   node scripts/getAllCanisterIds.js -h ic             - Prints canister in human-readable format for IC network.
**/
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const dfx_folder = '.dfx/local';
const canister_ids_file = 'canister_ids.json';
const NETWORK = process.argv[3] ? process.argv[3] : "local";
const PUBLICATIONS_REPO_PATH = process.env.PUBLICATIONS_REPO_PATH;

let canisterIdsArray = [];

function loadCanisterIds(filePath) {
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    Object.entries(json).forEach(([key, value]) => {
        if (key !== '__Candid_UI' && !canisterIdsArray.includes(value[NETWORK])) {
            canisterIdsArray.push(value[NETWORK]);
        }
    });
    return json;
}


let canister_ids;
let publications_and_nft_ids;

if (NETWORK === 'local') {
    canister_ids = loadCanisterIds(path.join(dfx_folder, canister_ids_file));
    publications_and_nft_ids = {
        NftFactory: loadCanisterIds(path.join(PUBLICATIONS_REPO_PATH, dfx_folder, canister_ids_file)).NftFactory,
        PublicationManagement: loadCanisterIds(path.join(PUBLICATIONS_REPO_PATH, dfx_folder, canister_ids_file)).PublicationManagement
    };
} else if (NETWORK === 'ic') {
    canister_ids = loadCanisterIds(canister_ids_file);
    publications_and_nft_ids = {
        NftFactory: loadCanisterIds(path.join(PUBLICATIONS_REPO_PATH, canister_ids_file)).NftFactory,
        PublicationManagement: loadCanisterIds(path.join(PUBLICATIONS_REPO_PATH, canister_ids_file)).PublicationManagement
    };
} else {
    console.log("NETWORK not set");
    process.exit(1);
}

console.log("network: ", NETWORK);


async function getChildCanisters(includeNftBuckets ) {
    const { stdout: PostBuckets } = await exec(`dfx canister --network=${NETWORK} call PostCore getBucketCanisters `);
    const { stdout: storageBuckets } = await exec(`dfx canister --network=${NETWORK} call Storage getAllDataCanisterIds `);
    const { stdout: publicationBuckets } = await exec(`dfx canister --network=${NETWORK} call ${publications_and_nft_ids.PublicationManagement[NETWORK]} getPublishers `);

    // Extract the canisterIds from the stdout strings.
    const extractCanisterIds = (stdout) => {
        const regex = /"([a-z0-9\-]+-cai)"/g;
        const ids = [];
        let m;
        while ((m = regex.exec(stdout)) !== null) {
            ids.push(m[1]);
        }
        return ids;
    }

    const extractPublicationCanisterIdsAndNames = (stdout) => {
        const regex = /"([a-zA-Z0-9\- ]+)"; "([a-z0-9\-]+-cai)"/g;
        const idsAndNames = [];
        const ids = [];
        let m;
        while ((m = regex.exec(stdout)) !== null) {
            idsAndNames.push({name: m[1], id: m[2]});
            ids.push(m[2]);
        }
        return {idsAndNames, ids};
    }

    const postBucketIds = extractCanisterIds(PostBuckets);
    const storageBucketIds = extractCanisterIds(storageBuckets);
    const {idsAndNames, ids: publicationIds} = extractPublicationCanisterIdsAndNames(publicationBuckets);

    // Special case for nftBuckets
    const nftBucketIds = [];
    if (includeNftBuckets) {
        const { stdout: whitelistedPublishers } = await exec(`dfx canister --network=${NETWORK} call ${publications_and_nft_ids.NftFactory[NETWORK]} getWhitelistedPublishers `);
        const whitelistedPublisherIds = extractCanisterIds(whitelistedPublishers);
    
        for (const publisherId of whitelistedPublisherIds) {
          try {
            const { stdout: nftInfo } = await exec(`dfx canister --network=${NETWORK} call ${publisherId} getNftCanisterInformation`);
            const canisterIdRegex = /"([a-z0-9\-]+-cai)";\s*\}/;
            const match = canisterIdRegex.exec(nftInfo);
            if (match) {
              nftBucketIds.push(match[1]);
            }
          } catch (error) {
            console.warn(`Failed to get Nft Canister Information for publisherId ${publisherId}: ${error.message}`);
          }
        }
    
        canisterIdsArray.push(...nftBucketIds);
      }


    // add child canister ids to the global array
    canisterIdsArray.push(...postBucketIds, ...nftBucketIds, ...storageBucketIds, ...publicationIds);

    return {
        'PostBuckets': postBucketIds,
        'nft buckets': includeNftBuckets ? nftBucketIds : [],
        'storage buckets': storageBucketIds,
        'publications': idsAndNames,
        'publicationIds': publicationIds,
    };
}


function human_readable_canisters(canister_ids, publications_and_nft_ids) {
    let canisters = '';
    for (const [key, value] of Object.entries(canister_ids)) {
        if (key !== '__Candid_UI') {
            canisters += key + ': ' + value[NETWORK] + '\n';
        }
    }
    for (const [key, value] of Object.entries(publications_and_nft_ids)) {
        if (key !== '__Candid_UI') {
            canisters += key + ': ' + value[NETWORK] + '\n';
        }
    }

    return canisters;
}

async function logCanisterInfo() {
    let includeNftBuckets = process.argv[2] !== '-CyclesDispenser';
    let childCanisters = await getChildCanisters(includeNftBuckets);

    let human_readable = {
        human_readable_canisters: human_readable_canisters(canister_ids, publications_and_nft_ids),
        ...childCanisters
    };

    switch(process.argv[2]) {
        case '-h':
            console.log(human_readable.human_readable_canisters);
            console.log("Child Canisters:\n", JSON.stringify(childCanisters, null, 2));
            console.log("Count: ", human_readable.human_readable_canisters.split('\n').length + childCanisters.PostBuckets.length + childCanisters['nft buckets'].length + childCanisters['storage buckets'].length + childCanisters.publicationIds.length);
            break;
        case '-arr':
            console.log("CanisterIdsArray:\n", JSON.stringify(canisterIdsArray, null, 2));
            console.log("Count: ", canisterIdsArray.length);

            break;
        case '-CyclesDispenser':
            let privilegedCanisterIds = [];
            let globalCanisterIds = [];
            let nonPrivilegedCanisterIds = [];
            let PostCoreCanisterId = canister_ids.PostCore[NETWORK];
            let PublicationManagementCanisterId = publications_and_nft_ids.PublicationManagement[NETWORK];
            let NftFactoryCanisterId = publications_and_nft_ids.NftFactory[NETWORK];

            privilegedCanisterIds.push(PostCoreCanisterId, PublicationManagementCanisterId, NftFactoryCanisterId);

            globalCanisterIds.push(...canisterIdsArray);

            globalCanisterIds.filter((canisterId) => {
                if (!privilegedCanisterIds.includes(canisterId)) {
                    nonPrivilegedCanisterIds.push(canisterId);
                }
            });
            console.log("privilegedCanisterIds:\n", JSON.stringify(privilegedCanisterIds, null, 2));
            console.log("nonPrivilegedCanisterIds:\n", JSON.stringify(nonPrivilegedCanisterIds, null, 2));
            console.log("Count: ", privilegedCanisterIds.length + nonPrivilegedCanisterIds.length);

            let dataToWrite = {
                privilegedCanisterIds: privilegedCanisterIds,
                nonPrivilegedCanisterIds: nonPrivilegedCanisterIds,
                TotalArray: canisterIdsArray
            }
            
            fs.writeFile('CyclesDispenser.json', JSON.stringify(dataToWrite, null, 2), 'utf8', function(err) {
                if(err) {
                    console.error("Error writing to file: ", err);
                    process.exit(1);
                } else {
                    console.log("Successfully written canister IDs to CyclesDispenser.json.");
                }
            });
            
            break;
        default:
            console.log(human_readable.human_readable_canisters);
            console.log("Child Canisters:\n", JSON.stringify(childCanisters, null, 2));
            break;
    }
}

logCanisterInfo();
